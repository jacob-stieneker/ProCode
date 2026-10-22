import ts from 'typescript';
import { analyzeJavaScript } from '../../../../scripts/clean-runtime/analyzer.mjs';
import { cleanExercises } from './catalog';
import { cleanKey } from './model';
import { equal, gradeStructure } from './runner';
import { cleanSolutions } from '../../../../tests/fixtures/clean-solutions';
import {
  CLEAN_STORAGE_KEY,
  CleanWorkspace,
  freshCleanSavedState,
  readCleanSavedState,
} from './state';

describe('Clean code catalog and grading', () => {
  it('provides five exercises per level with explicit cleanup and behavioral checks', () => {
    expect(new Set(cleanExercises.map((e) => e.id)).size).toBe(15);
    for (const level of ['junior', 'skilled', 'senior'])
      expect(cleanExercises.filter((e) => e.difficulty === level)).toHaveLength(5);
    for (const e of cleanExercises) {
      expect(e.examples).toHaveLength(3);
      expect(e.additional.length).toBeGreaterThanOrEqual(3);
      expect(e.rules.length > 0 || e.preserveInputs).toBe(true);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    }
  });
  for (const exercise of cleanExercises)
    it(`${exercise.id}: preserves behavior while requiring an actual refactor`, () => {
      for (const [source, clean] of [
        [exercise.starter.javascript, false],
        [cleanSolutions[exercise.id].javascript, true],
      ] as const) {
        const fn = new Function(source + '\nreturn ' + exercise.signature.javascript)();
        let mutated = false;
        for (const check of [...exercise.examples, ...exercise.additional]) {
          const args = structuredClone(check.input);
          expect(fn(...args), check.name).toEqual(check.expected);
          mutated ||= !equal(args, check.input);
        }
        const results = gradeStructure(
          exercise,
          analyzeJavaScript(ts, source, exercise.signature.javascript),
        );
        expect(results.every((r) => r.pass) && (!exercise.preserveInputs || !mutated)).toBe(clean);
      }
    });
  it('ignores comment decoys, distinguishes bindings from property names, and counts real decisions', () => {
    const metrics = analyzeJavaScript(
      ts,
      `// if (x) { if (y) { 499; } }\nfunction orderTotal(lines) { const text='if (a)'; return lines.reduce((total,line)=>total+line.x,0); }`,
      'orderTotal',
    );
    expect(metrics.shortNames).toEqual([]);
    expect(metrics.branchDepth).toBe(0);
    expect(metrics.inlineNumbers).not.toContain(499);
    expect(
      analyzeJavaScript(
        ts,
        'const sample = user => user.active ? (user.editor ? 1 : 2) : 3;',
        'sample',
      ).branchDepth,
    ).toBe(2);
    expect(
      analyzeJavaScript(
        ts,
        'function sample(user) { if(user.a)return 1; else if(user.b)return 2; return 3; }',
        'sample',
      ).branchDepth,
    ).toBe(1);
  });
  it('unused helpers cannot satisfy decomposition; function assignments and direct helper chains can', () => {
    const unused = analyzeJavaScript(
      ts,
      'function unusedOne(){return 1} function unusedTwo(){return 2} function invoiceSummary(){return 0}',
      'invoiceSummary',
    );
    expect(unused.helpers).toEqual([]);
    const chain = analyzeJavaScript(
      ts,
      'const first = () => second(); const second = function(){return 1}; const invoiceSummary = () => first();',
      'invoiceSummary',
    );
    expect(chain.helpers).toEqual(['first', 'second']);
    expect(chain.entryStatements).toBe(1);
  });
  it('reports syntax errors and checks object equality without property-order dependence', () => {
    expect(() => analyzeJavaScript(ts, 'function broken( {', 'broken')).toThrow(/solution.js:1/);
    expect(equal({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(equal([], {})).toBe(false);
    expect(equal({ a: 1 }, { a: '1' })).toBe(false);
  });
});
describe('Clean code persistence', () => {
  beforeEach(() => localStorage.clear());
  it('preserves separate language drafts, empty drafts and valid deduplicated completions', () => {
    const state = freshCleanSavedState(),
      js = cleanKey(cleanExercises[0], 'javascript'),
      py = cleanKey(cleanExercises[0], 'python');
    state.language = 'python';
    state.selected = { junior: 'cc-total' };
    state.active = true;
    state.drafts = { [js]: '', [py]: 'print("saved")', unknown: 'bad' };
    const completion = { key: py, completedAt: '2026-10-08T12:00:00Z' };
    state.completions = [
      completion,
      completion,
      { key: 'unknown', completedAt: completion.completedAt },
    ];
    localStorage.setItem(CLEAN_STORAGE_KEY, JSON.stringify(state));
    const loaded = readCleanSavedState().data;
    expect(loaded.drafts).toEqual({ [js]: '', [py]: 'print("saved")' });
    expect(loaded.completions).toEqual([completion]);
    expect(loaded.active).toBe(true);
    expect(loaded.language).toBe('python');
  });
  it('warns on corrupt/full storage and keeps exportable session work', () => {
    localStorage.setItem(CLEAN_STORAGE_KEY, 'bad');
    expect(readCleanSavedState().warning).toBeTruthy();
    localStorage.clear();
    const store = new CleanWorkspace();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota');
    });
    store.update((s) => ({ ...s, active: true }));
    expect(store.state().active).toBe(true);
    expect(store.warning()).toBeTruthy();
    spy.mockRestore();
  });
});
