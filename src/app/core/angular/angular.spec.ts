import { angularExercises } from './catalog';
import { angularExerciseInfo, angularKey } from './model';
import {
  ANGULAR_STORAGE_KEY,
  AngularWorkspace,
  freshAngularState,
  readAngularState,
} from './state';
describe('Angular exercise catalog', () => {
  it('has seven versioned exercises per level with behavior scenarios and starter contracts', () => {
    expect(angularExercises).toHaveLength(21);
    expect(new Set(angularExercises.map((e) => e.id)).size).toBe(21);
    for (const level of ['junior', 'skilled', 'senior'])
      expect(angularExercises.filter((e) => e.difficulty === level)).toHaveLength(7);
    for (const e of angularExercises) {
      expect(angularExerciseInfo.find((info) => info.id === e.id)).toEqual({
        id: e.id,
        title: e.title,
        difficulty: e.difficulty,
        version: e.version,
      });
      expect(e.starter).toContain('export class AppComponent');
      expect(e.scenarios.length).toBeGreaterThanOrEqual(6);
      expect(new Set(e.scenarios.map((s) => s.name)).size).toBe(e.scenarios.length);
      expect(e.hints).toHaveLength(3);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
      for (const scenario of e.scenarios) {
        expect(scenario.assertions.length).toBeGreaterThan(0);
        expect(scenario.hint.length).toBeGreaterThan(15);
      }
    }
  });
});
describe('Angular workspace', () => {
  beforeEach(() => localStorage.clear());
  it('preserves empty drafts and known selections while dropping invalid and duplicate records', () => {
    const state = freshAngularState(),
      info = angularExerciseInfo[0],
      key = angularKey(info);
    state.active = true;
    state.drafts = { [key]: '', unknown: 'discard' };
    state.selected = { junior: info.id, senior: info.id };
    const completion = { key, completedAt: '2026-10-08T12:00:00Z' };
    state.completions = [
      completion,
      completion,
      { key: 'unknown', completedAt: completion.completedAt },
    ];
    localStorage.setItem(ANGULAR_STORAGE_KEY, JSON.stringify(state));
    const loaded = readAngularState();
    expect(loaded.warning).toBe('');
    expect(loaded.data.drafts).toEqual({ [key]: '' });
    expect(loaded.data.selected).toEqual({ junior: info.id });
    expect(loaded.data.completions).toEqual([completion]);
    expect(loaded.data.active).toBe(true);
  });
  it('recovers malformed state and keeps edits in memory when storage fails', () => {
    localStorage.setItem(ANGULAR_STORAGE_KEY, 'null');
    expect(readAngularState().warning).toBeTruthy();
    localStorage.clear();
    const store = new AngularWorkspace(),
      key = angularKey(angularExerciseInfo[0]);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('Full');
    });
    try {
      store.update((s) => ({ ...s, drafts: { [key]: 'export class AppComponent {}' } }));
      expect(store.state().drafts[key]).toContain('AppComponent');
      expect(store.warning()).toContain('Export');
    } finally {
      spy.mockRestore();
    }
  });
});
