const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DecodeGame = require('../static/simulator/decode-game.js');
const TelemarkJava = require('../static/simulator/telemark-java.js');

function advance(game, seconds, frame, step = 0.05) {
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += step) {
    game.step(Math.min(step, seconds - elapsed), frame);
  }
  return game.snapshot();
}

function collectArtifact(game, artifact) {
  const robot = {x: artifact.x, z: artifact.z + 1, heading: 0, velocityX: 0, velocityZ: 0};
  const frame = {robot, hardware: {intake: 1, transfer: 1, flywheelVelocity: 0}, gamepad: {a: false}};
  advance(game, 1.7, frame);
  return game.snapshot();
}

function testArtifactStateMachineAndCapacity() {
  const game = DecodeGame.create({mode: 'practice'});
  game.start();
  for (let index = 0; index < 3; index++) {
    const fieldArtifact = game.snapshot().artifacts.find((artifact) => artifact.state === 'FIELD');
    const snapshot = collectArtifact(game, fieldArtifact);
    assert.equal(snapshot.artifacts.find((artifact) => artifact.id === fieldArtifact.id).state, 'READY');
  }
  assert.equal(game.snapshot().controlledArtifacts, 3, 'the robot must hold no more than three artifacts');
  const fourth = game.snapshot().artifacts.find((artifact) => artifact.state === 'FIELD');
  collectArtifact(game, fourth);
  assert.equal(game.snapshot().controlledArtifacts, 3);
  assert.equal(game.snapshot().artifacts.find((artifact) => artifact.id === fourth.id).state, 'FIELD');
}

function testEveryControlledArtifactState() {
  const game = DecodeGame.create();
  const artifact = game.snapshot().artifacts[0];
  const robot = {x: artifact.x, z: artifact.z + 1, heading: 0};
  game.start();
  advance(game, 0.3, {robot, hardware: {intake: 1, transfer: 0}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'INTAKE');
  advance(game, 0.7, {robot, hardware: {intake: 1, transfer: 0}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'INTAKE', 'transfer must not advance while its motor is stopped');
  advance(game, 0.1, {robot, hardware: {intake: 1, transfer: 1}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'TRANSFER');
  advance(game, 0.8, {robot, hardware: {intake: 0, transfer: 1}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'READY');
  game.step(0.05, {robot, hardware: {flywheelVelocity: 1900}, gamepad: {a: true}});
  assert.equal(game.snapshot().artifacts[0].state, 'FLIGHT');
  advance(game, 2, {robot, hardware: {flywheelVelocity: 1900}, gamepad: {a: false}});
  assert.ok(['SCORED', 'MISSED'].includes(game.snapshot().artifacts[0].state));
}

function testReverseReturnsArtifactToField() {
  const game = DecodeGame.create();
  const artifact = game.snapshot().artifacts[0];
  game.start();
  const robot = {x: artifact.x, z: artifact.z + 1, heading: 0};
  advance(game, 0.3, {robot, hardware: {intake: 1}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'INTAKE');
  advance(game, 1, {robot, hardware: {intake: -1, transfer: -1}, gamepad: {}});
  assert.equal(game.snapshot().artifacts[0].state, 'FIELD');
}

function testLaunchRisingEdge() {
  const game = DecodeGame.create();
  assert.equal(game.setArtifactState(1, 'READY', 0), true);
  assert.equal(game.setArtifactState(2, 'READY', 0), true);
  game.start();
  const frame = {robot: {x: 0, z: 0, heading: 0}, hardware: {flywheelVelocity: 1900}, gamepad: {a: true}};
  game.step(0.05, frame);
  game.step(0.05, frame);
  assert.equal(game.snapshot().launches, 1, 'holding A must release only one artifact');
  game.step(0.05, {...frame, gamepad: {a: false}});
  game.step(0.05, frame);
  assert.equal(game.snapshot().launches, 2, 'a second rising edge may launch the next ready artifact');
}

function testTrajectoryAndScoring() {
  const scoring = DecodeGame.create();
  scoring.setArtifactState(1, 'READY', 0);
  scoring.start();
  scoring.step(0.05, {
    robot: {x: 0, z: 0, heading: 0, velocityX: 0, velocityZ: 0},
    hardware: {flywheelVelocity: 1900, flywheelTarget: 1900},
    gamepad: {a: true},
  });
  advance(scoring, 2, {
    robot: {x: 0, z: 0, heading: 0, velocityX: 0, velocityZ: 0},
    hardware: {flywheelVelocity: 1900, flywheelTarget: 1900},
    gamepad: {a: false},
  });
  assert.equal(scoring.snapshot().hits, 1, 'a centered, correctly tuned shot should pass through the goal opening');

  const low = DecodeGame.predictTrajectory({x: 0, z: 0, heading: 0}, 900);
  const tuned = DecodeGame.predictTrajectory({x: 0, z: 0, heading: 0}, 1900);
  assert.equal(low.outcome, 'MISSED');
  assert.equal(tuned.outcome, 'SCORED');
  assert.notDeepEqual(low.points, tuned.points, 'measured flywheel velocity must change the visible arc');
}

function testModesAndMatchTermination() {
  const practice = DecodeGame.create({mode: 'practice'});
  assert.equal(practice.snapshot().timeRemaining, null);
  assert.equal(practice.snapshot().fieldArtifacts, 8);
  assert.ok(practice.snapshot().predictedTrajectory.length > 1, 'practice must show trajectory prediction');
  practice.setArtifactState(1, 'READY', 0);
  practice.start();
  practice.step(0.05, {hardware: {flywheelVelocity: 1900}, gamepad: {a: true}});
  advance(practice, 2, {hardware: {flywheelVelocity: 1900}, gamepad: {a: false}});
  assert.equal(practice.snapshot().fieldArtifacts, 8, 'practice must replenish a resolved artifact');

  let endings = 0;
  const match = DecodeGame.create({mode: 'match', onEnd() { endings++; }});
  assert.equal(match.snapshot().fieldArtifacts, 18, 'match must supply exactly 18 alliance-side artifacts');
  assert.equal(match.snapshot().predictedTrajectory.length, 0, 'match must hide predicted trajectories');
  match.start();
  advance(match, 120.2, {hardware: {}, gamepad: {}}, 0.2);
  assert.equal(match.snapshot().ended, true);
  assert.equal(match.snapshot().timeRemaining, 0);
  assert.equal(endings, 1, 'match completion should be reported once');
}

function runDeterministicShot(chunks) {
  const game = DecodeGame.create();
  game.setArtifactState(1, 'READY', 0);
  game.start();
  game.step(1 / 60, {robot: {x: 0.14, z: 0.2, heading: 0.04}, hardware: {flywheelVelocity: 1850}, gamepad: {a: true}});
  for (const dt of chunks) {
    game.step(dt, {robot: {x: 0.14, z: 0.2, heading: 0.04}, hardware: {flywheelVelocity: 1850}, gamepad: {a: false}});
  }
  return game.snapshot();
}

function testDeterministicFixedStep() {
  const fine = runDeterministicShot(Array(180).fill(1 / 120));
  const coarse = runDeterministicShot(Array(30).fill(0.05));
  assert.deepEqual(
    fine.artifacts.map(({state, x, y, z}) => ({state, x, y, z})),
    coarse.artifacts.map(({state, x, y, z}) => ({state, x, y, z})),
    'equal initial state and inputs must produce identical fixed-step results',
  );
  assert.deepEqual({hits: fine.hits, misses: fine.misses}, {hits: coarse.hits, misses: coarse.misses});
}

function settle(runtime, seconds, step = 0.05) {
  for (let elapsed = 0; elapsed < seconds; elapsed += step) runtime.tick(step);
}

function testBatteryChangesPowerArcButVelocityStaysStable() {
  const openLoop = TelemarkJava.createRuntime();
  const openMotor = openLoop.hardwareMap.get('DcMotorEx', 'launcher');
  openMotor.setPower(0.65);
  openLoop.start();
  settle(openLoop, 1);
  const freshVelocity = openMotor.getVelocity();
  settle(openLoop, 120);
  const tiredVelocity = openMotor.getVelocity();
  assert.ok(tiredVelocity < freshVelocity * 0.9, 'open-loop measured launcher speed must fall as voltage drains');
  assert.notDeepEqual(
    DecodeGame.predictTrajectory({x: 0, z: 0, heading: 0}, freshVelocity).points,
    DecodeGame.predictTrajectory({x: 0, z: 0, heading: 0}, tiredVelocity).points,
    'battery-related measured speed loss must alter the shot arc',
  );

  const closedLoop = TelemarkJava.createRuntime();
  const velocityMotor = closedLoop.hardwareMap.get('DcMotorEx', 'launcher');
  velocityMotor.setVelocityPIDFCoefficients(10, 0, 0, 12 / 2800);
  velocityMotor.setVelocity(1900);
  closedLoop.start();
  settle(closedLoop, 1);
  const first = velocityMotor.getVelocity();
  settle(closedLoop, 120);
  assert.ok(Math.abs(velocityMotor.getVelocity() - first) < 1, 'reachable setVelocity target must retain the same shot speed');
}

function testManifestAndBrowserWiring() {
  const manifest = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../static/simulator/models/decode-field.manifest.json'),
    'utf8',
  ));
  assert.equal(manifest.asset.primarySource, 'robot-cad-sources/decode-field.glb');
  assert.equal(manifest.asset.alternateSource, 'robot-cad-sources/decode-field.obj');
  assert.equal(manifest.asset.browserAsset, null, 'missing upload must retain the procedural fallback');
  assert.equal(manifest.artifactSpawnPoints.length, 18);
  for (const key of ['scale', 'origin', 'boundaries', 'goalOpening', 'collisionAreas']) assert.ok(manifest[key]);

  const html = fs.readFileSync(path.resolve(__dirname, '../static/simulator/unit13.mastery.html'), 'utf8');
  assert.match(html, /decode-game\.js/);
  assert.match(html, /decode-game-view\.js/);
  const view = fs.readFileSync(path.resolve(__dirname, '../static/simulator/decode-game-view.js'), 'utf8');
  assert.match(view, /decode-procedural-field/);
  assert.match(view, /decode-uploaded-field/);
  assert.match(view, /Right trigger: flywheel velocity/);
}

testArtifactStateMachineAndCapacity();
testEveryControlledArtifactState();
testReverseReturnsArtifactToField();
testLaunchRisingEdge();
testTrajectoryAndScoring();
testModesAndMatchTermination();
testDeterministicFixedStep();
testBatteryChangesPowerArcButVelocityStaysStable();
testManifestAndBrowserWiring();
console.log('DECODE game physics tests passed.');
