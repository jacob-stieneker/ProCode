import type { Method } from '../method-policy';
import { MethodProbe, sorted } from './model';
import { dijkstra } from './graphs';
const arrays = [
  [419, 113, 827, 251, 683, 157, 941],
  [953, 811, 677, 503, 389, 271, 163, 107],
  [137, 739, 263, 919, 461, 587, 347, 853, 199],
  [701, 109, 307, 907, 503, 211],
];
const graphs = [
  [
    6,
    [
      [4, 5, 29],
      [2, 4, 31],
      [1, 4, 79],
      [3, 2, 23],
      [0, 1, 83],
      [0, 3, 37],
      [3, 1, 41],
    ],
  ],
  [
    7,
    [
      [5, 6, 43],
      [1, 5, 71],
      [4, 1, 29],
      [2, 4, 37],
      [0, 2, 53],
      [0, 4, 97],
      [0, 1, 89],
      [4, 5, 23],
    ],
  ],
];
const operations = [
  ['insert', 'apple'],
  ['insert', 'apply'],
  ['search', 'apple'],
  ['search', 'app'],
  ['startsWith', 'app'],
  ['insert', 'app'],
  ['search', 'app'],
  ['startsWith', 'bat'],
  ['insert', 'bat'],
  ['search', 'bat'],
];
const tree = [
  401,
  [211, [113, null, null], [307, null, null]],
  [809, [613, null, null], [947, null, null]],
];

function searchProbes(): MethodProbe[] {
  const nums = sorted(arrays[2]);
  return [nums[0], nums[3], nums.at(-1)!, 499].map((target) => ({
    input: [nums, target],
    expected: nums.indexOf(target),
  }));
}
function graphProbes(): MethodProbe[] {
  return graphs.map(([count, edges]) => {
    const input = [count, edges, 0];
    return { input, expected: dijkstra(input).value };
  });
}
const trieProbes: MethodProbe[] = [
  { input: [operations], expected: [null, null, true, false, true, null, true, false, null, true] },
];
const treeProbes: MethodProbe[] = [
  { input: [tree], expected: [[401], [211, 809], [113, 307, 613, 947]] },
];
export function methodProbes(method: Method): MethodProbe[] {
  if (method.endsWith('-sort'))
    return arrays.map((nums) => ({ input: [nums], expected: sorted(nums) }));
  if (method.endsWith('-search')) return searchProbes();
  if (method === 'shortest-paths') return graphProbes();
  return method === 'prefix-tree' ? trieProbes : treeProbes;
}
