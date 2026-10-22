import { firebaseExercises } from './catalog';
import { firebaseKey } from './model';
import { runFirebase, tokenize } from './runner';
import {
  FirebaseWorkspace,
  FIREBASE_STORAGE_KEY,
  freshFirebaseSavedState,
  readFirebaseSavedState,
} from './state';
import { firebaseSolutions } from '../../../../tests/fixtures/firebase-solutions';
const run = (id: string, source: string) =>
  runFirebase(
    source,
    firebaseExercises.find((e) => e.id === id)!,
  );
const passes = (id: string, source: string) => run(id, source).results.every((r) => r.pass);
describe('Firebase command practice', () => {
  it('has three versioned exercises at each level and clear content', () => {
    expect(new Set(firebaseExercises.map((e) => e.id)).size).toBe(9);
    for (const level of ['junior', 'skilled', 'senior'])
      expect(firebaseExercises.filter((e) => e.difficulty === level)).toHaveLength(3);
    for (const e of firebaseExercises) {
      expect(e.checks.length).toBeGreaterThanOrEqual(2);
      expect(e.requirements.length).toBeGreaterThanOrEqual(3);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
      expect(e.hints).toHaveLength(2);
    }
  });
  for (const e of firebaseExercises) {
    it(`${e.id}: accepts solution, rejects unfinished work, and isolates attempts`, () => {
      const before = JSON.stringify(e.initial);
      expect(passes(e.id, firebaseSolutions[e.id])).toBe(true);
      expect(passes(e.id, e.starter)).toBe(false);
      expect(passes(e.id, '')).toBe(false);
      expect(JSON.stringify(e.initial)).toBe(before);
      expect(run(e.id, firebaseSolutions[e.id])).toEqual(run(e.id, firebaseSolutions[e.id]));
    });
  }
  it('accepts alias/ID, project flag order, equals, quotes, comments, and short flag alternatives', () => {
    for (const source of [
      'firebase use staging\nfirebase deploy --only hosting',
      'firebase --project=procode-staging deploy --only="hosting" # release',
      "firebase -P staging deploy --only='hosting'",
      'firebase deploy -P=staging --only hosting',
    ])
      expect(passes('fb-hosting', source)).toBe(true);
    expect(
      passes(
        'fb-rules',
        'firebase deploy --project staging --only firestore:indexes,firestore:rules',
      ),
    ).toBe(true);
    expect(
      passes(
        'fb-rules',
        'firebase deploy --project staging --only firestore:rules\nfirebase deploy --project staging --only firestore:indexes',
      ),
    ).toBe(true);
    expect(
      passes('fb-preview', 'firebase -P staging hosting:channel:deploy review --expires 168h'),
    ).toBe(true);
    expect(passes('fb-preview', 'firebase hosting:channel:deploy review -P staging')).toBe(true);
  });
  it('preserves earlier bad releases and prevents narrow or wrong-project submissions passing', () => {
    for (const source of [
      'firebase deploy --project staging',
      'firebase deploy --only hosting --project prod',
      'firebase deploy --only hosting\nfirebase deploy --only hosting --project staging',
      'firebase deploy --project staging\nfirebase deploy --only hosting --project staging',
    ])
      expect(passes('fb-hosting', source)).toBe(false);
    expect(passes('fb-rules', 'firebase deploy --only firestore:rules --project staging')).toBe(
      false,
    );
    expect(passes('fb-target', 'firebase deploy --only hosting:app --project staging')).toBe(false);
  });
  it('requires the target mapping in the destination project before deployment', () => {
    const result = run(
      'fb-target',
      'firebase target:apply hosting app procode-dev-site\nfirebase deploy --only hosting:app --project staging',
    );
    expect(result.errors[0]).toContain('Line 2');
    expect(result.state.deploys).toEqual([]);
  });
  it('models emulator lifecycle, import/export, and CI selection', () => {
    expect(
      passes('fb-ci', 'firebase emulators:start --only firestore --project demo-procode'),
    ).toBe(false);
    expect(
      passes(
        'fb-ci',
        'firebase emulators:exec --only auth,firestore --project demo-procode "npm run test:rules"',
      ),
    ).toBe(false);
    expect(
      run('fb-data', 'firebase emulators:start --import=seed/ --export-on-exit').state.emulators
        ?.exportPath,
    ).toBe('seed');
    expect(passes('fb-data', firebaseSolutions['fb-data'].replace('./saved', './seed'))).toBe(
      false,
    );
    expect(
      run('fb-ci', 'firebase emulators:exec --only firestore "npm run delete"').errors[0],
    ).toContain('Only the fixture script');
  });
  it('fails on the first error and commits no partial command mutations', () => {
    const result = run('fb-setup', 'firebase projects:list\nfirebase login');
    expect(result.errors[0]).toContain('Line 1');
    expect(result.state.authenticated).toBe(false);
    const initialized = run('fb-init', 'firebase init hosting,firestore');
    expect(initialized.errors.length).toBe(1);
    expect(initialized.state.configured).toEqual([]);
    const lateError = run('fb-setup', firebaseSolutions['fb-setup'] + '\nfirebase unknown');
    expect(lateError.results.every((r) => r.pass)).toBe(false);
  });
  for (const source of [
    'firebase deploy --only hosting --project missing',
    'firebase deploy --only hosting --project demo-procode',
    'firebase deploy --only hosting --project',
    'firebase deploy --only hosting --project=staging --project=prod',
    'firebase deploy --only hosting --force',
    'firebase deploy --only "hosting',
    'firebase deploy --only hosting; alert(1)',
    'firebase deploy | cat',
    'firebase deploy && firebase login',
    'firebase deploy --project $(printenv)',
    'firebase deploy --project `whoami`',
    'firebase deploy > output',
    'firebase deploy --only hosting,',
    'firebase deploy --only firestore:invalid',
    'firebase __proto__',
    'firebase use __proto__',
    'node malicious.js',
  ])
    it(`rejects invalid or unsupported syntax: ${source}`, () =>
      expect(run('fb-hosting', source).errors.length).toBe(1));
  it('bounds source and command counts and handles comments/empty quoted values', () => {
    expect(run('fb-setup', 'firebase login\n'.repeat(51)).errors[0]).toContain('50 commands');
    expect(run('fb-setup', 'x'.repeat(50001)).errors[0]).toContain('50,000');
    expect(tokenize('# ignored $()')).toEqual([]);
    expect(tokenize('firebase use ""')).toEqual(['firebase', 'use', '']);
    expect(run('fb-setup', 'firebase use ""').errors).toHaveLength(1);
  });
});
describe('Firebase saved work', () => {
  beforeEach(() => localStorage.clear());
  it('preserves drafts including empty text, valid selections and deduplicated completion', () => {
    const state = freshFirebaseSavedState(),
      key = firebaseKey(firebaseExercises[0]);
    const completion = { key, completedAt: '2026-10-08T12:00:00Z' };
    state.drafts = { [key]: '', unknown: 'no' };
    state.active = true;
    state.selected = { junior: 'fb-setup', senior: 'fb-setup' };
    state.completions = [completion, completion, { key: 'bad', completedAt: 'bad' }];
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(state));
    const saved = readFirebaseSavedState();
    expect(saved.data.drafts).toEqual({ [key]: '' });
    expect(saved.data.selected).toEqual({ junior: 'fb-setup' });
    expect(saved.data.completions).toEqual([completion]);
    expect(saved.data.active).toBe(true);
  });
  it('warns on corrupt data and retains exportable session when writes fail', () => {
    localStorage.setItem(FIREBASE_STORAGE_KEY, 'broken');
    expect(readFirebaseSavedState().warning).toBeTruthy();
    localStorage.clear();
    const store = new FirebaseWorkspace();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('full');
    });
    store.update((s) => ({ ...s, drafts: { 'fb-setup:v1': 'firebase login' } }));
    expect(store.warning()).toContain('full');
    expect(store.state().drafts['fb-setup:v1']).toBe('firebase login');
    spy.mockRestore();
  });
});
