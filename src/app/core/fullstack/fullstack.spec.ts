import { fullstackExercises } from './catalog';
import { fileNames, fullstackKey } from './model';
import {
  FULLSTACK_STORAGE_KEY,
  FullstackWorkspace,
  freshFullstackState,
  readFullstackState,
} from './state';
import { fullstackSolutions } from '../../../../tests/fixtures/fullstack-solutions';
describe('Full-stack projects', () => {
  it('provides nine complete multi-file contracts with three projects per level', () => {
    expect(new Set(fullstackExercises.map((e) => e.id)).size).toBe(9);
    for (const level of ['junior', 'skilled', 'senior'])
      expect(fullstackExercises.filter((e) => e.difficulty === level)).toHaveLength(3);
    for (const e of fullstackExercises) {
      expect(Object.keys(e.starter)).toEqual([...fileNames]);
      expect(e.starter['app.ts']).toContain('export class AppComponent');
      expect(e.starter['api.js']).toContain('import { createRouter }');
      expect(e.starter['api.js']).toContain('status: 501');
      expect(e.scenarios.length).toBeGreaterThanOrEqual(6);
      expect(e.hints).toHaveLength(3);
      expect(e.scenarios.some((s) => s.layout && s.width === 360)).toBe(true);
      expect(e.scenarios.some((s) => s.steps.some((step) => step.scope === 'db'))).toBe(true);
      expect(e.scenarios.some((s) => s.steps.some((step) => step.action === 'request'))).toBe(true);
      expect(new Set(e.scenarios.map((s) => s.name)).size).toBe(e.scenarios.length);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    }
  });
  for (const e of fullstackExercises)
    it(`${e.id}: reference API satisfies direct-call cases with fresh data`, async () => {
      const source = fullstackSolutions[e.id]['api.js'];
      const handler = new Function(
        source.replace('export function handleRequest', 'function handleRequest') +
          '\nreturn handleRequest;',
      )();
      const before = JSON.stringify(e.initial);
      const get = (o: any, path: string | undefined) =>
        path ? path.split('.').reduce((v, k) => v?.[k], o) : o;
      for (const scenario of e.scenarios.filter(
        (s) =>
          s.steps.length &&
          s.steps.every(
            (s) => s.action === 'request' || (s.action === 'assert' && s.scope !== 'ui'),
          ),
      )) {
        const db = structuredClone(e.initial);
        let response: any;
        for (const step of scenario.steps) {
          if (step.action === 'request')
            response = JSON.parse(
              JSON.stringify(
                await handler({ method: step.method, path: step.path, body: step.body }, db),
              ),
            );
          if (step.action === 'assert')
            expect(get(step.scope === 'db' ? db : response, step.target), scenario.name).toEqual(
              step.expected,
            );
        }
      }
      expect(JSON.stringify(e.initial)).toBe(before);
    });
});
describe('Full-stack saved work', () => {
  beforeEach(() => localStorage.clear());
  it('migrates legacy app.js filenames without rewriting source or losing progress', () => {
    const state = freshFullstackState();
    const key = fullstackKey(fullstackExercises[0]);
    const { 'app.ts': source, ...rest } = fullstackSolutions['fs-tasks'];
    state.drafts = { [key]: { ...rest, 'app.js': source } as any };
    state.completions = [{ key, completedAt: '2026-10-08T12:00:00Z' }];
    localStorage.setItem(FULLSTACK_STORAGE_KEY, JSON.stringify(state));
    const loaded = readFullstackState();
    expect(loaded.warning).toBe('');
    expect(loaded.data.drafts[key]).toEqual(fullstackSolutions['fs-tasks']);
    expect(loaded.data.completions).toEqual(state.completions);
    // Read normalization does not overwrite the existing browser record.
    expect(JSON.parse(localStorage.getItem(FULLSTACK_STORAGE_KEY)!).drafts[key]['app.js']).toBe(
      source,
    );
  });
  it('preserves complete four-file drafts, empty files, selections and valid completion records', () => {
    const state = freshFullstackState(),
      key = fullstackKey(fullstackExercises[0]),
      files = { ...fullstackSolutions['fs-tasks'], 'app.ts': '' };
    state.active = true;
    state.drafts = { [key]: files };
    state.selected = { junior: 'fs-tasks' };
    const completion = { key, completedAt: '2026-10-08T12:00:00Z' };
    state.completions = [completion, completion];
    localStorage.setItem(FULLSTACK_STORAGE_KEY, JSON.stringify(state));
    const data = readFullstackState().data;
    expect(data.drafts[key]).toEqual(files);
    expect(data.selected).toEqual({ junior: 'fs-tasks' });
    expect(data.completions).toEqual([completion]);
    expect(data.active).toBe(true);
  });
  it('rejects malformed file sets, overlong files and unknown keys', () => {
    const state = freshFullstackState();
    state.drafts = {
      'fs-tasks:v1': { 'app.ts': 'partial' } as any,
      'fs-guestbook:v1': { ...fullstackSolutions['fs-guestbook'], 'app.ts': 'x'.repeat(50001) },
      unknown: fullstackSolutions['fs-tasks'],
    };
    localStorage.setItem(FULLSTACK_STORAGE_KEY, JSON.stringify(state));
    expect(readFullstackState().data.drafts).toEqual({});
  });
  it('warns on corrupt storage and keeps session work when storage is full', () => {
    localStorage.setItem(FULLSTACK_STORAGE_KEY, 'bad json');
    expect(readFullstackState().warning).toBeTruthy();
    localStorage.clear();
    const store = new FullstackWorkspace();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota');
    });
    store.update((s) => ({ ...s, drafts: { 'fs-tasks:v1': fullstackSolutions['fs-tasks'] } }));
    expect(store.state().drafts['fs-tasks:v1']).toEqual(fullstackSolutions['fs-tasks']);
    expect(store.warning()).toBeTruthy();
    spy.mockRestore();
  });
});
