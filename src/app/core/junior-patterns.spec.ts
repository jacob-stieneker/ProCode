import { accepts, areaOf, exercises } from './exercises';
import { juniorPatterns } from './junior-patterns';
import { freshWorkspace, readWorkspace } from './storage';

type Tree = [number, Tree | null, Tree | null] | null;
function depth(tree: Tree): number {
  if (!tree) return 0;
  let best = 0;
  const queue: [Tree, number][] = [[tree, 1]];
  for (let i = 0; i < queue.length; i++) {
    const [node, level] = queue[i];
    if (!node) continue;
    best = Math.max(best, level);
    queue.push([node[1], level + 1], [node[2], level + 1]);
  }
  return best;
}
const oracle =
  <T extends unknown[]>(fn: (args: T) => unknown) =>
  (args: unknown[]) =>
    fn(args as T);
const reference: Record<string, (args: unknown[]) => unknown> = {
  'stock-profit': oracle(([prices]: [number[]]) => {
    let best = 0;
    for (let i = 0; i < prices.length; i++)
      for (let j = i + 1; j < prices.length; j++) best = Math.max(best, prices[j] - prices[i]);
    return best;
  }),
  'move-zeroes': oracle(([nums]: [number[]]) =>
    nums.filter((n) => n !== 0).concat(nums.filter((n) => n === 0)),
  ),
  'remove-sorted-duplicates': oracle(([nums]: [number[]]) => {
    const unique = [...new Set(nums)];
    return unique;
  }),
  'first-unique-character': oracle(([text]: [string]) =>
    [...text].findIndex((c) => text.indexOf(c) === text.lastIndexOf(c)),
  ),
  'longest-common-prefix': oracle(([words]: [string[]]) => {
    if (!words.length) return '';
    let length = 0;
    while (length < words[0].length && words.every((word) => word[length] === words[0][length]))
      length++;
    return words[0].slice(0, length);
  }),
  'reverse-linked-list': oracle(([values]: [number[]]) => [...values].reverse()),
  'merge-sorted-lists': oracle(([a, b]: [number[], number[]]) =>
    [...a, ...b].sort((x, y) => x - y),
  ),
  'linked-list-cycle': oracle(([values, pos]: [number[], number]) => values.length > 0 && pos >= 0),
  'tree-max-depth': oracle(([tree]: [Tree]) => depth(tree)),
  'same-tree': oracle(([a, b]: [Tree, Tree]) => JSON.stringify(a) === JSON.stringify(b)),
};

describe('New junior content', () => {
  for (const exercise of juniorPatterns) {
    it(`${exercise.title} has correct expected answers for every example and edge case`, () => {
      expect(exercise.examples).toHaveLength(3);
      expect(exercise.additional.length).toBeGreaterThanOrEqual(9);
      const checks = [...exercise.examples, ...exercise.additional];
      expect(new Set(checks.map((c) => c.name)).size).toBe(checks.length);
      for (const check of checks) {
        expect(reference[exercise.id](structuredClone(check.input)), check.name).toEqual(
          check.expected,
        );
        expect(accepts(exercise, check, check.expected)).toBe(true);
        expect(accepts(exercise, check, null)).toBe(false);
        expect(accepts(exercise, check, JSON.stringify(check.expected))).toBe(false);
      }
      expect(exercise.hints).toHaveLength(3);
      expect(JSON.stringify(exercise)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    });
  }
  it('places all linked-list, tree, and stack exercises in Data structures', () => {
    expect(exercises.filter((e) => areaOf(e) === 'data-structures')).toHaveLength(15);
    expect(exercises.filter((e) => areaOf(e) === 'algorithms')).toHaveLength(31);
    expect(exercises.filter((e) => e.difficulty === 'junior')).toHaveLength(25);
    for (const difficulty of ['junior', 'skilled', 'senior']) {
      for (const area of ['algorithms', 'data-structures']) {
        expect(
          exercises.filter((e) => e.difficulty === difficulty && areaOf(e) === area).length,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('Practice section migration', () => {
  beforeEach(() => localStorage.clear());
  it('preserves legacy drafts and opens a moved exercise in its new section', () => {
    const { practiceArea, selectedStructures, ...old } = freshWorkspace();
    old.selectedExercises.junior = 'valid-parentheses';
    old.drafts['valid-parentheses:v1:javascript'] = 'saved code';
    localStorage.setItem('procode.workspace.v1', JSON.stringify(old));
    const loaded = readWorkspace();
    expect(loaded.warning).toBe('');
    expect(loaded.data.practiceArea).toBe('data-structures');
    expect(loaded.data.selectedStructures.junior).toBe('valid-parentheses');
    expect(loaded.data.selectedExercises.junior).toBe('two-sum');
    expect(loaded.data.drafts).toEqual(old.drafts);
  });
  it('restores independent section selections and rejects invalid cross-section IDs', () => {
    const workspace = freshWorkspace();
    workspace.practiceArea = 'data-structures';
    workspace.selectedExercises.junior = 'stock-profit';
    workspace.selectedStructures.junior = 'same-tree';
    localStorage.setItem('procode.workspace.v1', JSON.stringify(workspace));
    expect(readWorkspace().data).toEqual(workspace);
    workspace.selectedStructures.junior = 'stock-profit';
    workspace.selectedExercises.junior = 'same-tree';
    localStorage.setItem('procode.workspace.v1', JSON.stringify(workspace));
    const loaded = readWorkspace().data;
    expect(loaded.selectedExercises.junior).toBe('two-sum');
    expect(loaded.selectedStructures.junior).toBe('same-tree');
  });
});

describe('Returned-array contract migration', () => {
  beforeEach(() => localStorage.clear());
  for (const id of ['move-zeroes', 'remove-sorted-duplicates']) {
    for (const language of ['javascript', 'python'] as const) {
      it(`preserves ${id} ${language} code and earned progress across versions`, () => {
        const workspace = freshWorkspace();
        const oldKey = `${id}:v1:${language}`;
        const newKey = `${id}:v2:${language}`;
        const code = 'saved source, preserved verbatim\n';
        workspace.drafts[oldKey] = code;
        workspace.completions = [
          { key: oldKey, title: 'Previous title', language, completedAt: '2026-10-07T00:00:00Z' },
        ];
        localStorage.setItem('procode.workspace.v1', JSON.stringify(workspace));
        const { data, warning } = readWorkspace();
        expect(warning).toBe('');
        expect(data.drafts).toEqual({ [newKey]: code });
        expect(data.completions).toEqual([
          {
            ...workspace.completions[0],
            key: newKey,
            title: exercises.find((e) => e.id === id)!.title,
          },
        ]);
        // Current work takes precedence over legacy work, including an intentionally empty draft.
        workspace.drafts[newKey] = '';
        workspace.completions.push({ ...workspace.completions[0], key: newKey });
        localStorage.setItem('procode.workspace.v1', JSON.stringify(workspace));
        const reloaded = readWorkspace().data;
        expect(reloaded.drafts[newKey]).toBe('');
        expect(reloaded.completions).toHaveLength(1);
        localStorage.setItem('procode.workspace.v1', JSON.stringify(reloaded));
        expect(readWorkspace().data).toEqual(reloaded);
      });
    }
  }
});
