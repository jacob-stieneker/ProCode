import {
  FirebaseCheck,
  FirebaseExercise,
  FirebaseState,
  firebaseExerciseInfo,
  freshFirebaseEnvironment,
} from './model';
const check = (name: string, hint: string, test: FirebaseCheck['test']): FirebaseCheck => ({
  name,
  hint,
  test,
});
const exact = (actual: string[], expected: string[]) =>
  actual.length === expected.length && expected.every((v) => actual.includes(v));
const noCloud = check(
  'No cloud releases',
  'Use local emulator commands only. Remove deploy and preview channel commands.',
  (s) => !s.deploys.length && !s.previews.length,
);
const seeded = (configured: string[] = []): FirebaseState => ({
  ...freshFirebaseEnvironment(),
  authenticated: true,
  project: 'procode-dev',
  configured,
});
const scopedRelease = (expected: string[]) =>
  check(
    'Only the requested services released',
    'Every release must contain only the requested services. A later correct deploy does not undo an earlier broad deploy.',
    (s) =>
      s.deploys.length > 0 &&
      s.deploys.every((d) => d.services.every((v) => expected.includes(v))) &&
      expected.every((v) => s.deploys.some((d) => d.services.includes(v))) &&
      !s.previews.length,
  );
const stagingOnly = check(
  'Every release targets staging',
  'Use --project staging (or procode-staging), or select staging with firebase use before deploying.',
  (s) => s.deploys.length > 0 && s.deploys.every((d) => d.project === 'procode-staging'),
);
const definitions: Omit<FirebaseExercise, 'id' | 'title' | 'difficulty' | 'version'>[] = [
  {
    description:
      'Connect a new workspace to the development project. Practice authentication, project discovery, and active project selection.',
    requirements: [
      'Sign in with the virtual practice account.',
      'List the available projects.',
      'Set procode-dev as the active project. The dev alias is already present in .firebaserc.',
      'Do not deploy anything.',
    ],
    starter: '# Sign in, list projects, and select development.\n',
    initial: freshFirebaseEnvironment(),
    hints: [
      'Start with firebase login, then firebase projects:list.',
      'firebase use accepts either a project ID or a configured alias.',
    ],
    checks: [
      check('Authenticated', 'Use firebase login.', (s) => s.authenticated),
      check('Projects inspected', 'Use firebase projects:list after signing in.', (s) => s.listed),
      check(
        'Development selected',
        'Use firebase use dev or firebase use procode-dev.',
        (s) => s.project === 'procode-dev',
      ),
      noCloud,
    ],
    explanation:
      'Authentication identifies the CLI account. Project aliases live in .firebaserc. firebase use changes the workspace default; --project overrides it for one command.',
  },
  {
    description:
      'Prepare an authenticated development workspace for a web app using Hosting and Cloud Firestore.',
    requirements: [
      'Initialize Hosting and Firestore.',
      'Keep procode-dev active and do not deploy.',
      'Fixture prompt answers: use the selected project, public directory public, default Firestore rules and indexes files. Initialization edits virtual configuration only.',
    ],
    starter: '# Initialize each required Firebase feature.\n',
    initial: seeded(),
    hints: [
      'firebase init hosting configures Hosting.',
      'Initialize Firestore separately with firebase init firestore.',
    ],
    checks: [
      check('Hosting configured', 'Initialize hosting.', (s) => s.configured.includes('hosting')),
      check('Firestore configured', 'Initialize firestore.', (s) =>
        s.configured.includes('firestore'),
      ),
      check(
        'Development remains active',
        'Keep procode-dev selected.',
        (s) => s.project === 'procode-dev',
      ),
      noCloud,
    ],
    explanation:
      'Initialization creates local configuration. Hosting settings go in firebase.json; Firestore configuration references rules and indexes files. Deployment is a separate operation.',
  },
  {
    description:
      'Configure and start local Authentication and Firestore emulators for a demo project.',
    requirements: [
      'Initialize the Emulator Suite, then start both auth and firestore with demo-procode.',
      'Fixture prompt answers enable auth and firestore on their default ports.',
      'Keep both emulators running and do not deploy. In this simulator, start returns immediately and records virtual running state.',
    ],
    starter: '# Configure emulators, then start the demo project locally.\n',
    initial: { ...freshFirebaseEnvironment(), project: 'demo-procode' },
    hints: [
      'Use firebase init emulators.',
      'firebase emulators:start --only auth,firestore --project demo-procode selects the two products.',
    ],
    checks: [
      check('Emulators configured', 'Initialize emulators first.', (s) =>
        s.configured.includes('emulators'),
      ),
      check(
        'Both emulators running on demo project',
        'Start auth and firestore together on demo-procode.',
        (s) =>
          !!s.emulators?.running &&
          s.emulators.project === 'demo-procode' &&
          exact(s.emulators.services, ['auth', 'firestore']),
      ),
      noCloud,
    ],
    explanation:
      'Demo project IDs are intended for emulator use. Selecting only the needed products makes a local workflow explicit. The real start command stays active until you stop it.',
  },
  {
    description:
      'Release a web build to staging without deploying the other configured Firebase products.',
    requirements: [
      'Deploy only Hosting to procode-staging.',
      'Hosting, Firestore, and Functions are already configured; the current project is procode-dev.',
      'Every deployment in this attempt must target staging and must exclude Firestore and Functions. Do not create preview channels.',
    ],
    starter: '# Deploy the web build to staging only.\n',
    initial: seeded(['hosting', 'firestore', 'functions']),
    hints: [
      'Use --only hosting to limit the deployment.',
      'Use --project staging, or first run firebase use staging.',
    ],
    checks: [stagingOnly, scopedRelease(['hosting'])],
    explanation:
      'A plain firebase deploy releases configured products. --only limits services, while --project selects the destination independently of the active workspace project.',
  },
  {
    description:
      'Publish a temporary staging preview for review without replacing the live Hosting release.',
    requirements: [
      'Create preview channel review on procode-staging.',
      'Set the channel lifetime to 7 days (the CLI default is also accepted).',
      'Do not deploy to the live channel or create previews on another project. Hosting is already configured.',
    ],
    starter: '# Create the review preview on staging.\n',
    initial: seeded(['hosting']),
    hints: [
      'Use firebase hosting:channel:deploy followed by the channel ID.',
      '--expires 7d controls the lifetime; --project staging chooses the project.',
    ],
    checks: [
      check(
        'Review channel on staging',
        'Create only channel review on procode-staging.',
        (s) =>
          s.previews.length > 0 &&
          s.previews.every((p) => p.project === 'procode-staging' && p.channel === 'review'),
      ),
      check(
        'Seven-day expiry',
        'Use --expires 7d, an equivalent duration, or the default.',
        (s) => s.previews.length > 0 && s.previews.every((p) => p.expires === '10080m'),
      ),
      check(
        'Live Hosting unchanged',
        'Use hosting:channel:deploy instead of deploy.',
        (s) => !s.deploys.length,
      ),
    ],
    explanation:
      'Hosting preview channels have their own temporary URLs and expiration. They do not replace live Hosting. In a real project, connected backend resources may still be shared; this exercise is entirely simulated.',
  },
  {
    description:
      'Start a repeatable local development session using an existing emulator data export.',
    requirements: [
      'Start only auth and firestore on demo-procode.',
      'Import the virtual ./seed export and configure export-on-exit to ./saved.',
      'Emulators are already configured. Leave them running and do not deploy. The simulator records the export destination; it does not write files.',
    ],
    starter: '# Start with seed data and preserve changes on exit.\n',
    initial: { ...seeded(['emulators']), project: 'demo-procode' },
    hints: [
      'Use --import ./seed on emulators:start.',
      'Use --export-on-exit ./saved. Without a directory, it reuses the import directory.',
    ],
    checks: [
      check(
        'Local session running',
        'Start only auth and firestore on demo-procode.',
        (s) =>
          !!s.emulators?.running &&
          s.emulators.project === 'demo-procode' &&
          exact(s.emulators.services, ['auth', 'firestore']),
      ),
      check(
        'Seed data imported',
        'Use --import ./seed.',
        (s) => s.emulators?.importPath === 'seed',
      ),
      check(
        'Export destination configured',
        'Use --export-on-exit ./saved.',
        (s) => s.emulators?.exportPath === 'saved',
      ),
      noCloud,
    ],
    explanation:
      'Importing an emulator export makes development data repeatable. Export-on-exit preserves the next snapshot when the real emulator process shuts down normally.',
  },
  {
    description:
      'Build a deterministic CI command that runs the existing rules-test script inside the Firestore emulator lifecycle.',
    requirements: [
      'Run the fixture script "npm run test:rules" through emulators:exec.',
      'Start only firestore on demo-procode, and stop it after the script exits.',
      'Emulators are configured and the fixture script exists. Its successful result is simulated; this task checks command orchestration, not security-rule correctness.',
      'Do not deploy anything.',
    ],
    starter: '# Run the fixture rules-test script inside the emulator lifecycle.\n',
    initial: { ...seeded(['emulators']), project: 'demo-procode' },
    hints: [
      'emulators:exec accepts a quoted script argument.',
      'Use --only firestore and --project demo-procode before the quoted script.',
    ],
    checks: [
      check(
        'Fixture tests run in Firestore only',
        'Use emulators:exec --only firestore --project demo-procode "npm run test:rules".',
        (s) =>
          s.tests.length > 0 &&
          s.tests.every((t) => t.project === 'demo-procode' && exact(t.services, ['firestore'])),
      ),
      check(
        'Emulators stopped after tests',
        'Use emulators:exec and do not start another session afterward.',
        (s) => !!s.emulators && !s.emulators.running,
      ),
      noCloud,
    ],
    explanation:
      'emulators:exec manages startup and shutdown around a script, making it useful for CI. Real rules tests must assert both allowed and denied operations; a passing command alone cannot prove a rule set secure.',
  },
  {
    description:
      'Release a Firestore configuration change to staging without touching Hosting or Functions.',
    requirements: [
      'Deploy both Firestore rules and indexes to procode-staging.',
      'Hosting, Firestore, and Functions are configured. The active project is procode-dev.',
      'Every release must target staging and include only Firestore rules and/or indexes. Separate selective releases or one combined release are accepted. No preview channels.',
    ],
    starter: '# Release only the Firestore configuration to staging.\n',
    initial: seeded(['hosting', 'firestore', 'functions']),
    hints: [
      '--only firestore includes both Firestore rules and indexes.',
      'You can also select firestore:rules and firestore:indexes explicitly. Choose staging with --project.',
    ],
    checks: [stagingOnly, scopedRelease(['firestore:rules', 'firestore:indexes'])],
    explanation:
      'Selective deploys reduce unrelated changes. The firestore scope includes rules and indexes; narrower scopes support independent releases. Deploying rules does not validate their authorization logic.',
  },
  {
    description: 'Map a named Hosting target to a staging site and release only that target.',
    requirements: [
      'Map Hosting target app to site procode-staging-site for procode-staging.',
      'Deploy only hosting:app to staging, after applying the mapping.',
      'firebase.json already contains a Hosting entry with target app and public directory public. Target mapping writes virtual .firebaserc state.',
      'Do not release other services or create preview channels.',
    ],
    starter: '# Apply the staging site mapping, then deploy the named target.\n',
    initial: seeded(['hosting', 'firestore', 'functions']),
    hints: [
      'Use firebase target:apply hosting app procode-staging-site --project staging.',
      'Then deploy with --only hosting:app --project staging.',
    ],
    checks: [
      check(
        'Staging site mapped',
        'Apply target app to procode-staging-site under the staging project.',
        (s) => s.targets['procode-staging:app'] === 'procode-staging-site',
      ),
      stagingOnly,
      scopedRelease(['hosting:app']),
    ],
    explanation:
      'A Hosting target connects a firebase.json entry to a site through .firebaserc. Target mappings are project-specific. Scoping the release to hosting:app selects that entry.',
  },
];
export const firebaseExercises: FirebaseExercise[] = firebaseExerciseInfo.map((info, index) => ({
  ...info,
  ...definitions[index],
}));
