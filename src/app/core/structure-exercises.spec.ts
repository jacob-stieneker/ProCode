import { accepts } from './exercises';
import { structureExercises } from './structure-exercises';
import { structureSolutions } from '../../../tests/fixtures/structure-solutions';
const solution = (id: string) => {
  const e = structureExercises.find((item) => item.id === id)!;
  return new Function(`${structureSolutions[id].javascript}; return ${e.signature.javascript};`)();
};
describe('Expanded data structure practice', () => {
  for (const e of structureExercises)
    it(`${e.title} accepts its reference and rejects its starter and wrong result types`, () => {
      const fn = solution(e.id);
      const starter = new Function(`${e.starter.javascript}; return ${e.signature.javascript};`)();
      let failures = 0;
      for (const c of [...e.examples, ...e.additional]) {
        expect(accepts(e, c, fn(...structuredClone(c.input))), c.name).toBe(true);
        expect(accepts(e, c, null)).toBe(false);
        if (!accepts(e, c, starter(...structuredClone(c.input)))) failures++;
      }
      expect(failures).toBeGreaterThan(3);
      expect(e.area).toBe('data-structures');
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    });
  it('agrees with independent simple models for deterministic boundary-sized inputs', () => {
    const operations: unknown[][] = [],
      expected: unknown[] = [];
    const recent: [number, number][] = [];
    for (let i = 0; i < 200; i++) {
      const key = (i * 7) % 13;
      const index = recent.findIndex(([k]) => k === key);
      if (i % 3) {
        operations.push(['put', key, i]);
        if (index >= 0) recent.splice(index, 1);
        recent.push([key, i]);
        if (recent.length > 5) recent.shift();
        expected.push(null);
      } else {
        operations.push(['get', key]);
        const entry = index < 0 ? undefined : recent.splice(index, 1)[0];
        if (entry) recent.push(entry);
        expected.push(entry?.[1] ?? -1);
      }
    }
    expect(solution('lru-cache')(5, operations)).toEqual(expected);
    const values = Array.from({ length: 200 }, (_, i) => ((i * 37) % 199) - 100);
    const medians = values.map((_, i) => {
      const prefix = values.slice(0, i + 1).sort((a, b) => a - b);
      return (prefix[Math.floor(i / 2)] + prefix[Math.ceil(i / 2)]) / 2;
    });
    expect(solution('streaming-median')(values)).toEqual(medians);
    const words = new Set<string>(),
      ops: string[][] = [],
      answers: (boolean | null)[] = [];
    for (let i = 0; i < 200; i++) {
      const word = 'a'.repeat(1 + (i % 40)),
        op = ['insert', 'search', 'startsWith'][i % 3];
      ops.push([op, word]);
      if (op === 'insert') {
        words.add(word);
        answers.push(null);
      } else
        answers.push(
          op === 'search' ? words.has(word) : [...words].some((w) => w.startsWith(word)),
        );
    }
    expect(solution('prefix-tree')(ops)).toEqual(answers);
  });
  it('rejects FIFO eviction, truthy query values and truncated medians', () => {
    const cache = structureExercises.find((e) => e.id === 'lru-cache')!;
    expect(accepts(cache, cache.examples[0], [null, null, 10, null, 20, -1, 30])).toBe(false);
    const trie = structureExercises.find((e) => e.id === 'prefix-tree')!;
    expect(accepts(trie, trie.examples[0], [null, 1, 0, 1])).toBe(false);
    const median = structureExercises.find((e) => e.id === 'streaming-median')!;
    expect(accepts(median, median.examples[1], [1, 1])).toBe(false);
  });
});
