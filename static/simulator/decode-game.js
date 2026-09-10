/**
 * Deterministic KG-SFR DECODE TeleOp game physics.
 *
 * The core is dependency-free so the browser view and Node regression tests
 * exercise exactly the same artifact transitions and projectile calculations.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TelemarkDecodeGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ARTIFACT_STATES = Object.freeze({
    FIELD: "FIELD",
    INTAKE: "INTAKE",
    TRANSFER: "TRANSFER",
    READY: "READY",
    FLIGHT: "FLIGHT",
    SCORED: "SCORED",
    MISSED: "MISSED",
  });

  const MODES = Object.freeze({PRACTICE: "practice", MATCH: "match"});

  const DEFAULT_SPAWNS = Object.freeze([
    [-2.35, 0.95], [-1.42, 0.95], [-0.48, 0.95], [0.48, 0.95], [1.42, 0.95], [2.35, 0.95],
    [-2.35, 1.72], [-1.42, 1.72], [-0.48, 1.72], [0.48, 1.72], [1.42, 1.72], [2.35, 1.72],
    [-2.35, 2.48], [-1.42, 2.48], [-0.48, 2.48], [0.48, 2.48], [1.42, 2.48], [2.35, 2.48],
  ].map(function (point) { return Object.freeze({x: point[0], y: 0.09, z: point[1]}); }));

  const DEFAULT_MANIFEST = Object.freeze({
    scale: 1,
    origin: Object.freeze({x: 0, y: 0, z: 0}),
    boundaries: Object.freeze({minX: -3.6, maxX: 3.6, minZ: -3.6, maxZ: 3.6}),
    goalOpening: Object.freeze({
      planeZ: -3.28,
      minX: -0.72,
      maxX: 0.72,
      minY: 0.72,
      maxY: 1.72,
    }),
    collisionAreas: Object.freeze([
      Object.freeze({id: "goal-left", minX: -1.02, maxX: -0.72, minZ: -3.38, maxZ: -3.18}),
      Object.freeze({id: "goal-right", minX: 0.72, maxX: 1.02, minZ: -3.38, maxZ: -3.18}),
    ]),
    artifactSpawnPoints: DEFAULT_SPAWNS,
  });

  const DEFAULTS = Object.freeze({
    fixedStep: 1 / 120,
    matchSeconds: 120,
    matchArtifacts: 18,
    practiceArtifacts: 8,
    maximumControlledArtifacts: 3,
    intakeThreshold: 0.22,
    transferThreshold: 0.22,
    pickupRadius: 0.48,
    artifactRadius: 0.09,
    gravity: 9.81,
    hoodAngleRadians: 48 * Math.PI / 180,
    velocityScale: 0.00315,
    maximumFlightSeconds: 4.5,
  });

  function finite(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, finite(value, 0)));
  }

  function copyPoint(point) {
    return {x: finite(point && point.x, 0), y: finite(point && point.y, 0), z: finite(point && point.z, 0)};
  }

  function normalizeMode(mode) {
    return String(mode).toLowerCase() === MODES.MATCH ? MODES.MATCH : MODES.PRACTICE;
  }

  function localToWorld(robot, x, y, z) {
    const heading = finite(robot.heading, 0);
    const cosine = Math.cos(heading);
    const sine = Math.sin(heading);
    return {
      x: robot.x + cosine * x - sine * z,
      y: y,
      z: robot.z + sine * x + cosine * z,
    };
  }

  function launchVector(robot, measuredVelocity, settings) {
    const speed = Math.abs(finite(measuredVelocity, 0)) * settings.velocityScale;
    const horizontalSpeed = speed * Math.cos(settings.hoodAngleRadians);
    const forwardX = Math.sin(robot.heading);
    const forwardZ = -Math.cos(robot.heading);
    const muzzle = localToWorld(robot, 0, 0.72, -0.68);
    return {
      position: muzzle,
      velocity: {
        x: forwardX * horizontalSpeed + robot.velocityX,
        y: speed * Math.sin(settings.hoodAngleRadians),
        z: forwardZ * horizontalSpeed + robot.velocityZ,
      },
      speed,
    };
  }

  function projectileStep(projectile, dt, gravity) {
    const previous = {x: projectile.x, y: projectile.y, z: projectile.z};
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt - 0.5 * gravity * dt * dt;
    projectile.z += projectile.vz * dt;
    projectile.vy -= gravity * dt;
    return previous;
  }

  function goalCrossing(previous, current, opening, radius) {
    const before = previous.z - opening.planeZ;
    const after = current.z - opening.planeZ;
    if (!(before > 0 && after <= 0)) return null;
    const amount = before / Math.max(0.000001, before - after);
    const x = previous.x + (current.x - previous.x) * amount;
    const y = previous.y + (current.y - previous.y) * amount;
    return {
      x,
      y,
      scored: x >= opening.minX + radius
        && x <= opening.maxX - radius
        && y >= opening.minY + radius
        && y <= opening.maxY - radius,
    };
  }

  function predictTrajectory(robotInput, measuredVelocity, options) {
    const settings = Object.assign({}, DEFAULTS, options || {});
    const manifest = settings.manifest || DEFAULT_MANIFEST;
    const robot = Object.assign({x: 0, z: 0, heading: 0, velocityX: 0, velocityZ: 0}, robotInput || {});
    const launch = launchVector(robot, measuredVelocity, settings);
    const projectile = {
      x: launch.position.x,
      y: launch.position.y,
      z: launch.position.z,
      vx: launch.velocity.x,
      vy: launch.velocity.y,
      vz: launch.velocity.z,
    };
    const points = [copyPoint(projectile)];
    let outcome = null;
    const sampleStep = 1 / 60;
    for (let elapsed = sampleStep; elapsed <= settings.maximumFlightSeconds; elapsed += sampleStep) {
      const previous = projectileStep(projectile, sampleStep, settings.gravity);
      if (points.length % 3 === 0 || elapsed >= settings.maximumFlightSeconds) points.push(copyPoint(projectile));
      const crossing = goalCrossing(previous, projectile, manifest.goalOpening, settings.artifactRadius);
      if (crossing) {
        outcome = crossing.scored ? ARTIFACT_STATES.SCORED : ARTIFACT_STATES.MISSED;
        points.push(copyPoint(projectile));
        break;
      }
      if (projectile.y <= settings.artifactRadius) {
        outcome = ARTIFACT_STATES.MISSED;
        points.push(copyPoint(projectile));
        break;
      }
    }
    return {points, outcome: outcome || ARTIFACT_STATES.MISSED, speed: launch.speed};
  }

  function create(options) {
    const supplied = options || {};
    const settings = Object.assign({}, DEFAULTS, supplied);
    const manifest = supplied.manifest || DEFAULT_MANIFEST;
    let selectedMode = normalizeMode(supplied.mode);
    let accumulator = 0;
    let nextArtifactId = 1;
    let previousLaunchButton = false;
    let practiceSpawnCursor = 0;
    let endNotified = false;

    const state = {
      mode: selectedMode,
      running: false,
      ended: false,
      elapsed: 0,
      timeRemaining: null,
      robot: {x: 0, z: 0, heading: 0, velocityX: 0, velocityZ: 0},
      hardware: {intake: 0, transfer: 0, flywheelVelocity: 0, flywheelTarget: 0},
      artifacts: [],
      hits: 0,
      misses: 0,
      launches: 0,
      predictedTrajectory: [],
    };

    function spawnArtifact(point) {
      const spawn = point || manifest.artifactSpawnPoints[practiceSpawnCursor % manifest.artifactSpawnPoints.length];
      practiceSpawnCursor += 1;
      const artifact = {
        id: nextArtifactId++,
        state: ARTIFACT_STATES.FIELD,
        x: finite(spawn.x, 0),
        y: finite(spawn.y, settings.artifactRadius),
        z: finite(spawn.z, 0),
        vx: 0,
        vy: 0,
        vz: 0,
        progress: 0,
        flightTime: 0,
      };
      state.artifacts.push(artifact);
      return artifact;
    }

    function reset(mode) {
      selectedMode = normalizeMode(mode == null ? selectedMode : mode);
      state.mode = selectedMode;
      state.running = false;
      state.ended = false;
      state.elapsed = 0;
      state.timeRemaining = selectedMode === MODES.MATCH ? settings.matchSeconds : null;
      state.artifacts.length = 0;
      state.hits = 0;
      state.misses = 0;
      state.launches = 0;
      state.predictedTrajectory = [];
      accumulator = 0;
      nextArtifactId = 1;
      practiceSpawnCursor = 0;
      previousLaunchButton = false;
      endNotified = false;
      const count = selectedMode === MODES.MATCH ? settings.matchArtifacts : settings.practiceArtifacts;
      for (let index = 0; index < count; index += 1) {
        spawnArtifact(manifest.artifactSpawnPoints[index % manifest.artifactSpawnPoints.length]);
      }
      attachControlledArtifacts();
      updatePrediction();
      return snapshot();
    }

    function controlledArtifacts() {
      return state.artifacts.filter(function (artifact) {
        return artifact.state === ARTIFACT_STATES.INTAKE
          || artifact.state === ARTIFACT_STATES.TRANSFER
          || artifact.state === ARTIFACT_STATES.READY;
      });
    }

    function fieldArtifacts() {
      return state.artifacts.filter(function (artifact) { return artifact.state === ARTIFACT_STATES.FIELD; });
    }

    function attachControlledArtifacts() {
      const ready = state.artifacts.filter(function (artifact) { return artifact.state === ARTIFACT_STATES.READY; });
      state.artifacts.forEach(function (artifact) {
        let local = null;
        if (artifact.state === ARTIFACT_STATES.INTAKE) {
          local = {x: 0, y: 0.20 + artifact.progress * 0.18, z: -1.04 + artifact.progress * 0.72};
        } else if (artifact.state === ARTIFACT_STATES.TRANSFER) {
          local = {x: 0, y: 0.38 + artifact.progress * 0.31, z: -0.32 + artifact.progress * 0.62};
        } else if (artifact.state === ARTIFACT_STATES.READY) {
          const index = Math.max(0, ready.indexOf(artifact));
          local = {x: (index - (ready.length - 1) / 2) * 0.27, y: 0.72, z: 0.32};
        }
        if (!local) return;
        const world = localToWorld(state.robot, local.x, local.y, local.z);
        artifact.x = world.x;
        artifact.y = world.y;
        artifact.z = world.z;
      });
    }

    function beginIntake() {
      if (state.hardware.intake <= settings.intakeThreshold) return;
      if (controlledArtifacts().length >= settings.maximumControlledArtifacts) return;
      const mouth = localToWorld(state.robot, 0, settings.artifactRadius, -1.0);
      const candidate = fieldArtifacts().map(function (artifact) {
        return {artifact, distance: Math.hypot(artifact.x - mouth.x, artifact.z - mouth.z)};
      }).filter(function (entry) {
        return entry.distance <= settings.pickupRadius;
      }).sort(function (left, right) {
        return left.distance - right.distance || left.artifact.id - right.artifact.id;
      })[0];
      if (!candidate) return;
      candidate.artifact.state = ARTIFACT_STATES.INTAKE;
      candidate.artifact.progress = 0;
    }

    function advanceMechanisms(dt) {
      beginIntake();
      const intake = state.artifacts.find(function (artifact) { return artifact.state === ARTIFACT_STATES.INTAKE; });
      if (intake) {
        intake.progress = clamp(intake.progress + state.hardware.intake * dt * 1.45, 0, 1);
        if (state.hardware.intake < -settings.intakeThreshold && intake.progress <= 0) {
          intake.state = ARTIFACT_STATES.FIELD;
          const mouth = localToWorld(state.robot, 0, settings.artifactRadius, -1.02);
          Object.assign(intake, mouth);
        } else if (intake.progress >= 1 && state.hardware.transfer > settings.transferThreshold) {
          intake.state = ARTIFACT_STATES.TRANSFER;
          intake.progress = 0;
        }
      }

      const transfer = state.artifacts.find(function (artifact) { return artifact.state === ARTIFACT_STATES.TRANSFER; });
      if (transfer) {
        transfer.progress = clamp(transfer.progress + state.hardware.transfer * dt * 1.35, 0, 1);
        if (state.hardware.transfer < -settings.transferThreshold && transfer.progress <= 0) {
          transfer.state = ARTIFACT_STATES.INTAKE;
          transfer.progress = 1;
        } else if (transfer.progress >= 1) {
          transfer.state = ARTIFACT_STATES.READY;
          transfer.progress = 0;
        }
      }
      attachControlledArtifacts();
    }

    function launchReadyArtifact() {
      const artifact = state.artifacts.find(function (candidate) { return candidate.state === ARTIFACT_STATES.READY; });
      if (!artifact) return false;
      const launch = launchVector(state.robot, state.hardware.flywheelVelocity, settings);
      artifact.state = ARTIFACT_STATES.FLIGHT;
      Object.assign(artifact, launch.position, {
        vx: launch.velocity.x,
        vy: launch.velocity.y,
        vz: launch.velocity.z,
        flightTime: 0,
        progress: 0,
      });
      state.launches += 1;
      return true;
    }

    function resolveArtifact(artifact, result) {
      artifact.state = result;
      artifact.vx = 0;
      artifact.vy = 0;
      artifact.vz = 0;
      if (result === ARTIFACT_STATES.SCORED) state.hits += 1;
      else state.misses += 1;
      if (state.mode === MODES.PRACTICE) spawnArtifact();
    }

    function advanceFlights(dt) {
      state.artifacts.filter(function (artifact) { return artifact.state === ARTIFACT_STATES.FLIGHT; }).forEach(function (artifact) {
        const previous = projectileStep(artifact, dt, settings.gravity);
        artifact.flightTime += dt;
        const crossing = goalCrossing(previous, artifact, manifest.goalOpening, settings.artifactRadius);
        if (crossing) {
          resolveArtifact(artifact, crossing.scored ? ARTIFACT_STATES.SCORED : ARTIFACT_STATES.MISSED);
          return;
        }
        const boundaries = manifest.boundaries;
        if (artifact.y <= settings.artifactRadius
            || artifact.flightTime >= settings.maximumFlightSeconds
            || artifact.x < boundaries.minX || artifact.x > boundaries.maxX
            || artifact.z < boundaries.minZ || artifact.z > boundaries.maxZ) {
          resolveArtifact(artifact, ARTIFACT_STATES.MISSED);
        }
      });
    }

    function finishMatch() {
      state.running = false;
      state.ended = true;
      state.timeRemaining = 0;
      if (!endNotified && typeof supplied.onEnd === "function") {
        endNotified = true;
        supplied.onEnd(snapshot());
      }
    }

    function fixedUpdate(dt, launchPressed) {
      state.elapsed += dt;
      if (state.mode === MODES.MATCH) {
        state.timeRemaining = Math.max(0, settings.matchSeconds - state.elapsed);
        if (state.timeRemaining <= 0) {
          finishMatch();
          return;
        }
      }
      advanceMechanisms(dt);
      if (launchPressed) launchReadyArtifact();
      advanceFlights(dt);
    }

    function updateFrame(frame) {
      const data = frame || {};
      const robot = data.robot || {};
      state.robot = {
        x: finite(robot.x, state.robot.x),
        z: finite(robot.z, state.robot.z),
        heading: finite(robot.heading, state.robot.heading),
        velocityX: finite(robot.velocityX, 0),
        velocityZ: finite(robot.velocityZ, 0),
      };
      const hardware = data.hardware || {};
      state.hardware = {
        intake: clamp(hardware.intake, -1, 1),
        transfer: clamp(hardware.transfer, -1, 1),
        flywheelVelocity: finite(hardware.flywheelVelocity, 0),
        flywheelTarget: finite(hardware.flywheelTarget, 0),
      };
      return Boolean(data.gamepad && data.gamepad.a);
    }

    function step(seconds, frame) {
      const launchButton = updateFrame(frame);
      const launchPressed = launchButton && !previousLaunchButton;
      previousLaunchButton = launchButton;
      if (!state.running) {
        attachControlledArtifacts();
        updatePrediction();
        return snapshot();
      }
      accumulator += clamp(seconds, 0, 0.25);
      let firstUpdate = true;
      while (accumulator + 1e-10 >= settings.fixedStep && state.running) {
        fixedUpdate(settings.fixedStep, launchPressed && firstUpdate);
        firstUpdate = false;
        accumulator -= settings.fixedStep;
      }
      updatePrediction();
      return snapshot();
    }

    function updatePrediction() {
      state.predictedTrajectory = state.mode === MODES.PRACTICE
        ? predictTrajectory(state.robot, state.hardware.flywheelVelocity, Object.assign({}, settings, {manifest})).points
        : [];
    }

    function snapshot() {
      const attempts = state.hits + state.misses;
      return {
        mode: state.mode,
        running: state.running,
        ended: state.ended,
        elapsed: state.elapsed,
        timeRemaining: state.timeRemaining,
        robot: Object.assign({}, state.robot),
        hardware: Object.assign({}, state.hardware),
        artifacts: state.artifacts.map(function (artifact) { return Object.assign({}, artifact); }),
        hits: state.hits,
        misses: state.misses,
        launches: state.launches,
        accuracy: attempts ? state.hits / attempts : 0,
        controlledArtifacts: controlledArtifacts().length,
        fieldArtifacts: fieldArtifacts().length,
        predictedTrajectory: state.predictedTrajectory.map(copyPoint),
      };
    }

    function start() {
      if (!state.ended) state.running = true;
      return snapshot();
    }

    function stop() {
      state.running = false;
      return snapshot();
    }

    function setMode(mode) {
      return reset(mode);
    }

    // Tests and the browser fixture use this to build a ready magazine without
    // bypassing any launch or projectile logic.
    function setArtifactState(id, nextState, progress) {
      const artifact = state.artifacts.find(function (candidate) { return candidate.id === id; });
      if (!artifact || !Object.prototype.hasOwnProperty.call(ARTIFACT_STATES, nextState)) return false;
      artifact.state = ARTIFACT_STATES[nextState];
      artifact.progress = clamp(progress, 0, 1);
      attachControlledArtifacts();
      return true;
    }

    reset(selectedMode);
    return Object.freeze({
      state,
      start,
      stop,
      reset,
      setMode,
      step,
      snapshot,
      setArtifactState,
      launchReadyArtifact,
    });
  }

  return Object.freeze({
    states: ARTIFACT_STATES,
    modes: MODES,
    defaults: DEFAULTS,
    defaultManifest: DEFAULT_MANIFEST,
    create,
    predictTrajectory,
    localToWorld,
  });
});
