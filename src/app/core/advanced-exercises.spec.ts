import { accepts } from './exercises';
import { advancedExercises } from './advanced-exercises';
import { advancedSolutions } from '../../../tests/fixtures/advanced-solutions';

describe('Advanced algorithms', () => {
  for (const e of advancedExercises) {
    it(`${e.title} accepts independent reference results and rejects empty or wrong-type answers`, () => {
      const fn = new Function(
        `${advancedSolutions[e.id].javascript}; return ${e.signature.javascript};`,
      )();
      for (const check of [...e.examples, ...e.additional]) {
        expect(accepts(e, check, fn(...structuredClone(check.input))), check.name).toBe(true);
        expect(accepts(e, check, null), check.name).toBe(false);
      }
      expect(
        e.additional.some((c) => !accepts(e, c, Array.isArray(c.expected) ? [] : 'wrong')),
      ).toBe(true);
    });
  }
  it('accepts reordered Three Sum answers, but rejects duplicates and missing solutions', () => {
    const e = advancedExercises.find((e) => e.id === 'three-sum')!,
      c = e.examples[0];
    expect(
      accepts(e, c, [
        [1, 0, -1],
        [2, -1, -1],
      ]),
    ).toBe(true);
    for (const wrong of [
      [[-1, 0, 1]],
      [
        [-1, -1, 2],
        [-1, 0, 1],
        [-1, 0, 1],
      ],
      [[0, 0, 0]],
      [['-1', 0, 1]],
    ])
      expect(accepts(e, c, wrong)).toBe(false);
  });
  it('accepts alternate course orders and rejects missing, repeated, or premature courses', () => {
    const e = advancedExercises.find((e) => e.id === 'course-order')!,
      c = e.examples[2];
    expect(accepts(e, c, [0, 2, 1, 3])).toBe(true);
    for (const wrong of [
      [0, 1, 1, 3],
      [0, 1, 2],
      [3, 0, 1, 2],
      [0, 1, 2, 4],
    ])
      expect(accepts(e, c, wrong)).toBe(false);
    expect(accepts(e, e.examples[1], [])).toBe(true);
  });
});
