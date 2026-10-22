import { accepts, exercises } from './exercises';
import { juniorExercises } from './junior-exercises';
import { solutions } from '../../../tests/fixtures/junior-solutions';
import { freshWorkspace, readWorkspace } from './storage';

describe('Junior curriculum', () => {
  for (const e of juniorExercises) {
    it(`${e.title} accepts an independently implemented solution across every check`, () => {
      const fn = new Function(`${solutions[e.id].javascript}; return ${e.signature.javascript};`)();
      for (const check of [...e.examples, ...e.additional]) {
        expect(accepts(e, check, fn(...structuredClone(check.input))), check.name).toBe(true);
        expect(accepts(e, check, null), check.name).toBe(false);
        expect(accepts(e, check, JSON.stringify(check.expected)), check.name).toBe(false);
      }
    });
  }
  it('accepts alternate sorting implementations but rejects dropped duplicates and lexicographic order', () => {
    for (const e of juniorExercises.filter((e) => e.category === 'Sorting')) {
      for (const c of [...e.examples, ...e.additional])
        expect(
          accepts(
            e,
            c,
            [...(c.input[0] as number[])].sort((a, b) => a - b),
          ),
        ).toBe(true);
      expect(accepts(e, e.examples[1], [1, 2, 3])).toBe(false);
      const numeric = e.additional.find((c) => c.name === 'Numeric, not alphabetical')!;
      expect(accepts(e, numeric, [1, 10, 100, 2, 20])).toBe(false);
    }
  });
  it('keeps every ID and version unique', () => {
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
  });
});
describe('Catalog storage compatibility', () => {
  beforeEach(() => localStorage.clear());
  it('migrates older workspaces without dropping drafts or progress', () => {
    const { selectedExercises, ...old } = freshWorkspace();
    old.drafts['two-sum:v1:javascript'] = 'saved source';
    localStorage.setItem('procode.workspace.v1', JSON.stringify(old));
    const loaded = readWorkspace();
    expect(loaded.warning).toBe('');
    expect(loaded.data.selectedExercises).toEqual(selectedExercises);
    expect(loaded.data.drafts).toEqual(old.drafts);
  });
  it('replaces stale or wrong-difficulty selections with valid defaults', () => {
    const data = freshWorkspace();
    data.selectedExercises.junior = 'minimum-window';
    data.selectedExercises.skilled = 'unknown';
    localStorage.setItem('procode.workspace.v1', JSON.stringify(data));
    expect(readWorkspace().data.selectedExercises).toEqual(freshWorkspace().selectedExercises);
  });
});
