import { accepts } from './exercises';
import { interviewExpansion } from './interview-expansion';
import { expansionSolutions } from '../../../tests/fixtures/interview-expansion-solutions';
const fn = (id: string, source?: string) => {
  const e = interviewExpansion.find((e) => e.id === id)!;
  return new Function(
    (source ?? expansionSolutions[id].javascript) + '\nreturn ' + e.signature.javascript,
  )();
};
describe('Interview expansion contracts', () => {
  for (const exercise of interviewExpansion)
    it(exercise.id + ' accepts its reference and rejects incomplete or mistyped answers', () => {
      const solve = fn(exercise.id),
        starter = fn(exercise.id, exercise.starter.javascript);
      let failed = 0;
      for (const check of [...exercise.examples, ...exercise.additional]) {
        expect(accepts(exercise, check, solve(...structuredClone(check.input))), check.name).toBe(
          true,
        );
        if (!accepts(exercise, check, starter(...structuredClone(check.input)))) failed++;
        expect(accepts(exercise, check, 'true')).toBe(false);
      }
      expect(failed).toBeGreaterThan(3);
      expect(exercise.examples).toHaveLength(3);
      expect(exercise.additional.length).toBeGreaterThanOrEqual(7);
      expect(JSON.stringify(exercise)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    });
  it('checks stack history against a simple model over 200 operations', () => {
    const stack: number[] = [],
      operations: unknown[][] = [],
      expected: unknown[] = [];
    for (let i = 0; i < 200; i++) {
      if (i % 5 < 2) {
        const value = ((i * 17) % 31) - 15;
        operations.push(['push', value]);
        stack.push(value);
        expected.push(null);
      } else if (i % 5 === 2) {
        operations.push(['pop']);
        stack.pop();
        expected.push(null);
      } else if (i % 5 === 3) {
        operations.push(['min']);
        expected.push(stack.length ? Math.min(...stack) : null);
      } else {
        operations.push(['top']);
        expected.push(stack.at(-1) ?? null);
      }
    }
    expect(fn('min-stack')(operations)).toEqual(expected);
  });
  it('checks pairwise merging against an independent sort and accepts alternative algorithms', () => {
    const lists = Array.from({ length: 20 }, (_, i) =>
      Array.from({ length: 10 }, (_, j) => ((i * 37 + j * 19) % 99) - 49).sort((a, b) => a - b),
    );
    expect(fn('merge-k-lists')(lists)).toEqual(lists.flat().sort((a, b) => a - b));
    const alternative = fn(
      'merge-k-lists',
      'function mergeSortedLists(lists){return lists.flat().sort((a,b)=>a-b);}',
    );
    for (const check of interviewExpansion[2].additional)
      expect(alternative(...check.input)).toEqual(check.expected);
  });
  it('rejects local-only BST checks and set-based merging', () => {
    const tree = interviewExpansion[1],
      check = tree.examples[1];
    const local = fn(
      tree.id,
      'function isValidBst(t){return !t||((!t[1]||t[1][0]<t[0])&&(!t[2]||t[2][0]>t[0])&&isValidBst(t[1])&&isValidBst(t[2]));}',
    );
    expect(accepts(tree, check, local(...check.input))).toBe(false);
    const merge = interviewExpansion[2],
      duplicates = merge.examples[1];
    expect(accepts(merge, duplicates, [2, 3])).toBe(false);
  });
});
