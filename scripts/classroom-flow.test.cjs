const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const client = read('src/telemark/classroom.ts');
const backend = read('functions/src/classroomFunctions.ts');
const backendIndex = read('functions/src/index.ts');
const rules = read('firestore.rules');
const rootTheme = read('src/theme/Root.tsx');
const gate = read('src/components/PersonalizationGate.tsx');
const personalize = read('src/pages/personalize.tsx');
const dashboard = read('src/pages/dashboard.tsx');
const classroomUi = read('src/components/classroom/ClassroomDashboard.tsx');

for (const callable of [
  'getTelemarkAccount',
  'saveTelemarkAccount',
  'createTelemarkClassroom',
  'getTelemarkClassroomDashboard',
  'inviteStudentToClassroom',
  'respondToClassroomInvite',
  'cancelClassroomInvite',
  'removeStudentFromClassroom',
  'leaveTelemarkClassroom',
]) {
  assert.match(client, new RegExp(`['"]${callable}['"]`), `${callable} needs a client wrapper`);
  assert.match(backendIndex, new RegExp(`\\b${callable}\\b`), `${callable} needs a deployed export`);
}

assert.match(backend, /auth\.token\.email_verified !== true/);
assert.match(backend, /runTransaction/);
assert.match(backend, /That username is already taken/);
assert.match(backend, /Account roles cannot be changed after setup/);
assert.match(backend, /status !== 'pending'/);
assert.match(backend, /response === 'accept'/);
assert.match(backend, /currentMemberSnapshot\.data\(\)\?\.role !== 'student'/);
assert.match(backend, /peerProgress\(/, 'student peers receive the reduced progress payload');
assert.doesNotMatch(
  backend.match(/function peerProgress[\s\S]*?\n\}/)?.[0] ?? '',
  /lastLesson|reviewingUnits|updatedAt/,
  'peer progress excludes lesson history and activity timestamps',
);
assert.match(backend, /MAX_STUDENTS_PER_CLASSROOM/);
assert.match(backend, /MAX_CLASSROOMS_PER_STUDENT/);

assert.match(rules, /documentId in \['profile', 'progress'\]/);
for (const collection of ['accounts', 'usernames', 'classrooms', 'userInvites', 'userClassrooms']) {
  assert.match(
    rules,
    new RegExp(`match \\/${collection}\\/\\{document=\\*\\*\\}[\\s\\S]{0,80}allow read, write: if false`),
    `${collection} must remain server owned`,
  );
}

assert.match(rootTheme, /TelemarkAccountProvider/);
assert.match(gate, /accountStatus !== 'absent'/);
assert.match(personalize, /Who is using this account\?/);
assert.match(personalize, /disabled=\{Boolean\(account\)\}/, 'saved roles cannot be edited');
assert.match(personalize, /Coaches invite this username/);
assert.match(
  personalize,
  /if \(savedAccount\.role === 'student'\) \{[\s\S]*?markManyAutoComplete/,
  'coach setup must not create learner placement progress',
);
assert.match(dashboard, /account\?\.role === 'coach'/);
assert.match(
  dashboard,
  /accountStatus === 'ready' && account\?\.role === 'student'[\s\S]*?useProgress\(progressUser\)/,
  'coach dashboards must not start learner progress sync',
);
assert.match(dashboard, /<CoachDashboard/);
assert.match(dashboard, /<StudentClassroomPanel/);
assert.match(classroomUi, /inviteStudentToClassroom/);
assert.match(classroomUi, /respondToClassroomInvite/);
assert.match(classroomUi, /completed, skipped, or completed by placement/);
assert.match(classroomUi, /classroom’s accepted students|accepted student/);

console.log('Account setup, classroom consent, role routing, and privacy checks passed');
