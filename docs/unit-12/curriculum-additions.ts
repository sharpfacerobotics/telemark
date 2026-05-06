// ============================================================
// ADD THIS UNIT OBJECT to the CURRICULUM_UNITS array in curriculum.ts
// Place it after the unit-11 entry.
// ============================================================

  {
    id: 'UNIT_12',
    label: 'Unit 12',
    title: 'IMU & Rotation',
    desc: 'Initialize the REV Hub gyro, read Yaw for heading control, implement field-centric driving, monitor Pitch and Roll for tip detection, and build a proportional autonomous turn.',
    tier: 'Intermediate',
    slug: 'unit-12',
    overviewPath: '/docs/unit-12',
    startPath: '/docs/unit-12/imu-initialization',
    nextPath: '/docs/unit-13',
    nextLabel: 'Unit 13: OOP & Inheritance',
    lessonCount: 6,
    overview:
      'This unit teaches students to use the IMU built into the REV Control Hub for real-time heading data, field-relative motion translation, tilt detection, and closed-loop autonomous turning.',
    outcomes: [
      'Initialize the IMU correctly for any physical Hub mounting orientation using RevHubOrientationOnRobot.',
      'Read and normalize Yaw, Pitch, and Roll data using the AngleUnit class for reliable heading and tilt feedback.',
      'Implement field-centric driving and IMU-corrected proportional autonomous turns that self-correct for battery drop and wheel slip.',
    ],
  },


// ============================================================
// ADD THESE LESSON OBJECTS to the CURRICULUM_LESSONS array in curriculum.ts
// ============================================================

  {
    id: 'unit-12/imu-initialization',
    label: '12.1 · IMU Initialization',
    title: 'Lesson 12.1: Initializing the REV Hub Gyro and Setting Robot Orientation',
    path: '/docs/unit-12/imu-initialization',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
  {
    id: 'unit-12/yaw-data',
    label: '12.2 · Yaw Data',
    title: 'Lesson 12.2: Extracting Real-time Yaw Data using the AngleUnit Class',
    path: '/docs/unit-12/yaw-data',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
  {
    id: 'unit-12/field-centric',
    label: '12.3 · Field-Centric Drive',
    title: 'Lesson 12.3: Normalizing Angular Values for Field-Centric Driving',
    path: '/docs/unit-12/field-centric',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
  {
    id: 'unit-12/pitch-roll',
    label: '12.4 · Pitch & Roll',
    title: 'Lesson 12.4: Monitoring Pitch and Roll for Robot Tip Detection',
    path: '/docs/unit-12/pitch-roll',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
  {
    id: 'unit-12/imu-turn',
    label: '12.5 · Challenge: IMU Turn',
    title: 'Lesson 12.5: Challenge — Implementing an IMU-Corrected 90-Degree Autonomous Turn',
    path: '/docs/unit-12/imu-turn',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
  {
    id: 'unit-12/mastery-quiz',
    label: 'Unit 12 · Mastery Quiz',
    title: 'Unit 12 Mastery Quiz: IMU & Rotation',
    path: '/docs/unit-12/mastery-quiz',
    unitSlug: 'unit-12',
    unitLabel: 'Unit 12',
    unitTitle: 'IMU & Rotation',
  },
