// ============================================================
// ADD THIS UNIT OBJECT to the CURRICULUM_UNITS array in curriculum.ts
// Place it after the unit-12 entry.
// ============================================================

  {
    id: 'UNIT_13',
    label: 'Unit 13',
    title: 'OOP & Inheritance',
    desc: 'Encapsulate mechanisms into classes, extend parent classes with inheritance, override behavior with @Override, manage shared constants, and architect a modular robot class with nested subsystems.',
    tier: 'Advanced',
    slug: 'unit-13',
    overviewPath: '/docs/unit-13',
    startPath: '/docs/unit-13/encapsulation',
    nextPath: '/dashboard',
    nextLabel: 'Dashboard',
    lessonCount: 6,
    overview:
      'This unit teaches students to structure a competition robot codebase using object-oriented principles -- encapsulation, inheritance, method overriding, shared constants, and composition -- so that the project is maintainable, reusable, and resilient to last-minute hardware changes.',
    outcomes: [
      'Encapsulate mechanism hardware and logic into private-member classes with clean public interfaces, eliminating duplicated code across OpModes.',
      'Apply inheritance and @Override to build a family of specialized mechanisms from a shared parent, with the compiler enforcing correct implementation.',
      'Architect a master robot class using composition so that every OpMode initializes and controls the entire robot through a single object.',
    ],
  },


// ============================================================
// ADD THESE LESSON OBJECTS to the CURRICULUM_LESSONS array in curriculum.ts
// ============================================================

  {
    id: 'unit-13/encapsulation',
    label: '13.1 · Encapsulation',
    title: 'Lesson 13.1: Encapsulating Component Logic into Mechanism Classes',
    path: '/docs/unit-13/encapsulation',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
  {
    id: 'unit-13/inheritance',
    label: '13.2 · Inheritance',
    title: 'Lesson 13.2: Extending Parent Classes for Modular Hardware Subsystems',
    path: '/docs/unit-13/inheritance',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
  {
    id: 'unit-13/override',
    label: '13.3 · @Override',
    title: 'Lesson 13.3: Overriding Behavior with @Override for Custom Implementations',
    path: '/docs/unit-13/override',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
  {
    id: 'unit-13/static-constants',
    label: '13.4 · Static Constants',
    title: 'Lesson 13.4: Managing Shared Constants with the static Keyword',
    path: '/docs/unit-13/static-constants',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
  {
    id: 'unit-13/robot-class',
    label: '13.5 · Challenge: Robot Class',
    title: 'Lesson 13.5: Challenge — Architecting a Modular Robot Class with Nested Subsystems',
    path: '/docs/unit-13/robot-class',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
  {
    id: 'unit-13/mastery-quiz',
    label: 'Unit 13 · Mastery Quiz',
    title: 'Unit 13 Mastery Quiz: OOP & Inheritance',
    path: '/docs/unit-13/mastery-quiz',
    unitSlug: 'unit-13',
    unitLabel: 'Unit 13',
    unitTitle: 'OOP & Inheritance',
  },
