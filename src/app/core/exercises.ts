import { interviewExpansion } from './interview-expansion';
import { structureExercises } from './structure-exercises';
import { advancedExercises } from './advanced-exercises';
import { juniorExercises } from './junior-exercises';
import { juniorPatterns } from './junior-patterns';
import { Method, methodPolicies, requiredMethod } from './method-policy';
export type Language = 'javascript' | 'python';
export type PracticeArea = 'algorithms' | 'data-structures';
export type ExecutionAdapter = 'json' | 'linked-list' | 'cycle-list' | 'tree' | 'clean';
export type Difficulty = 'junior' | 'skilled' | 'senior';
export type Check = { name: string; input: unknown[]; expected: unknown; hint: string };
export interface Exercise {
  id: string;
  version: number;
  adapter?: ExecutionAdapter;
  method?: Method;
  area?: PracticeArea;
  difficulty: Difficulty;
  title: string;
  category: string;
  minutes: string;
  description: string;
  requirements: string[];
  signature: Record<Language, string>;
  starter: Record<Language, string>;
  hints: string[];
  explanation: string;
  examples: Check[];
  additional: Check[];
}
export const areaOf = (exercise: Exercise): PracticeArea => exercise.area ?? 'algorithms';
export const levels: { id: Difficulty; name: string; bars: number }[] = [
  { id: 'junior', name: 'Junior Developer', bars: 1 },
  { id: 'skilled', name: 'Skilled Developer', bars: 2 },
  { id: 'senior', name: 'Senior Developer', bars: 3 },
];
const pair = (name: string, nums: number[], target: number): Check => ({
  name,
  input: [nums, target],
  expected: 'Any two distinct indices whose values add up to the target',
  hint: 'Return indices, not values. You need two different positions, even when the values match.',
});
const uniqueLength = (s: string) => {
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = new Set<string>();
    for (let j = i; j < s.length && !seen.has(s[j]); j++) {
      seen.add(s[j]);
      best = Math.max(best, seen.size);
    }
  }
  return best;
};
const substring = (name: string, s: string): Check => ({
  name,
  input: [s],
  expected: uniqueLength(s),
  hint: 'A repeated character may already be outside your current window. Keep the left boundary from moving backward.',
});
export function shortestWindow(s: string, t: string): string {
  if (!t) return '';
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let best = '';
  for (let start = 0; start < s.length; start++) {
    const counts = new Map<string, number>();
    for (let end = start; end < s.length; end++) {
      const c = s[end];
      counts.set(c, (counts.get(c) ?? 0) + 1);
      if ([...need].every(([k, n]) => (counts.get(k) ?? 0) >= n)) {
        const value = s.slice(start, end + 1);
        if (!best || value.length < best.length) best = value;
        break;
      }
    }
  }
  return best;
}
const windowCase = (name: string, s: string, t: string): Check => ({
  name,
  input: [s, t],
  expected: shortestWindow(s, t),
  hint: 'Count repeated target characters separately. Once a window is valid, shrink it until removing a character would make it invalid.',
});
const catalog: Exercise[] = [
  {
    id: 'two-sum',
    version: 1,
    difficulty: 'junior',
    title: 'Two Sum',
    category: 'Arrays & hash maps',
    minutes: '10–15 min',
    description:
      'Given an array of integers and a target number, return the indices of two numbers that add up to the target.',
    requirements: [
      'Return two distinct, zero-based indices in any order.',
      'Each input has at least one valid pair. Any valid pair is accepted.',
      'Do not use the same array position twice.',
      'Inputs contain 2 to 200 integers between -1,000 and 1,000. A nested-loop solution is accepted.',
    ],
    signature: { javascript: 'twoSum', python: 'two_sum' },
    starter: {
      javascript:
        '/**\n * Return the indices of two numbers that add up to target.\n * @param {number[]} nums\n * @param {number} target\n * @returns {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your solution here.\n  \n  return [];\n}\n',
      python:
        'def two_sum(nums, target):\n    """Return the indices of two numbers that add up to target."""\n    # Write your solution here.\n\n    return []\n',
    },
    hints: [
      'For each number, ask: what other value would I need to reach the target?',
      'You can compare each pair of different indices. A dictionary or Map can help you avoid checking the same values repeatedly.',
      'Store each visited value and its index. Check whether target minus the current value was seen before storing the current value.',
    ],
    explanation:
      'A nested loop checks every pair and is correct. A hash map improves this to expected O(n) time with O(n) space by looking up each number’s complement.',
    examples: [
      pair('A simple pair', [2, 7, 11, 15], 9),
      pair('Pair in the middle', [3, 2, 4], 6),
      pair('Repeated values', [3, 3], 6),
    ],
    additional: [
      pair('Negative values', [-3, 4, 3, 90], 0),
      pair('Zero values', [0, 4, 3, 0], 0),
      pair('More than one valid pair', [1, 4, 2, 3], 5),
      pair('Pair at the ends', [8, 1, 2, -3], 5),
      pair('Negative target', [-8, -3, 1, 7], -11),
      pair('Do not reuse one position', [3, 2, 4], 6),
      pair('Larger values', [1000, -1000, 2], 0),
      ...Array.from({ length: 8 }, (_, i) =>
        pair(`Generated case ${i + 1}`, [i + 1, 100, -50, i + 7], 2 * i + 8),
      ),
    ],
  },
  {
    id: 'longest-substring',
    version: 1,
    difficulty: 'skilled',
    title: 'Longest Unique Substring',
    category: 'Strings & sliding windows',
    minutes: '20–25 min',
    description:
      'Given a string, return the length of its longest contiguous substring without repeating characters.',
    requirements: [
      'Return an integer length, not the substring itself.',
      'A substring must be contiguous. Character matching is case-sensitive.',
      'An empty string has a result of 0. Spaces and punctuation count as characters.',
      'Inputs contain up to 200 printable ASCII characters. Aim for O(n), but correctness is graded independently of your approach.',
    ],
    signature: { javascript: 'longestSubstring', python: 'longest_substring' },
    starter: {
      javascript:
        'function longestSubstring(text) {\n  // Return the length of the longest unique substring.\n  \n  return 0;\n}\n',
      python:
        'def longest_substring(text):\n    """Return the length of the longest unique substring."""\n\n    return 0\n',
    },
    hints: [
      'Imagine a window over the string that contains only unique characters.',
      'When you meet a repeated character, move the start of your window past its previous position.',
      'Track the last index of each character. Set left to max(left, previousIndex + 1), then update the best length.',
    ],
    explanation:
      'Track the last position of each character while maintaining a window with no duplicates. Move its left edge only forward. This gives O(n) time.',
    examples: [
      substring('Repeating pattern', 'abcabcbb'),
      substring('One repeated character', 'bbbbb'),
      substring('Contiguous matters', 'pwwkew'),
    ],
    additional: [
      substring('Empty input', ''),
      substring('Single character', 'a'),
      substring('Boundary must not move back', 'abba'),
      substring('Spaces count', 'a b c'),
      substring('Case-sensitive', 'aAbBcC'),
      substring('All unique', 'abcdefghi'),
      substring('Repeated suffix', 'dvdf'),
      ...Array.from({ length: 8 }, (_, i) =>
        substring(`Generated case ${i + 1}`, 'abc'.repeat(i) + 'xyz' + 'ab'.repeat(i + 1)),
      ),
    ],
  },
  {
    id: 'minimum-window',
    version: 1,
    difficulty: 'senior',
    title: 'Minimum Window Substring',
    category: 'Strings & frequency maps',
    minutes: '30–40 min',
    description:
      'Given strings source and target, return the shortest substring of source containing every character in target, including repeated characters.',
    requirements: [
      'Return an empty string if no valid window exists or target is empty.',
      'Matching is case-sensitive. Repeated target characters require repeated occurrences.',
      'If several shortest windows exist, any one of them is accepted.',
      'Inputs contain up to 120 ASCII letters. Aim for O(n + m); this phase grades correctness, not a claimed complexity.',
    ],
    signature: { javascript: 'minWindow', python: 'min_window' },
    starter: {
      javascript:
        'function minWindow(source, target) {\n  // Return the shortest substring containing all target characters.\n  \n  return "";\n}\n',
      python:
        'def min_window(source, target):\n    """Return the shortest substring containing all target characters."""\n\n    return ""\n',
    },
    hints: [
      'Use a frequency map for target. A set alone loses repeated-character requirements.',
      'Expand the right edge until every required count is met. Then shrink from the left while the window remains valid.',
      'Keep the best start and length. When removing a character drops its count below the required count, expand again.',
    ],
    explanation:
      'Use two pointers and frequency counts. Expand until all target characters are covered, then shrink while preserving coverage. Each pointer advances at most n times.',
    examples: [
      windowCase('A classic window', 'ADOBECODEBANC', 'ABC'),
      windowCase('Exact match', 'a', 'a'),
      windowCase('Not enough occurrences', 'a', 'aa'),
    ],
    additional: [
      windowCase('Empty source', '', 'A'),
      windowCase('Empty target', 'ABC', ''),
      windowCase('Repeated requirement', 'AAABBC', 'AABC'),
      windowCase('Equal shortest windows', 'ABxxBA', 'AB'),
      windowCase('Case-sensitive', 'aAbBcC', 'ABC'),
      windowCase('No matching characters', 'XYZ', 'AB'),
      windowCase('Window at the beginning', 'ABCZZZZ', 'ABC'),
      windowCase('Window at the end', 'ZZZZABC', 'ABC'),
      ...Array.from({ length: 7 }, (_, i) =>
        windowCase(
          `Generated case ${i + 1}`,
          'B'.repeat(i) + 'AAC' + 'B'.repeat(i + 1) + 'CA',
          'AABC',
        ),
      ),
    ],
  },
  ...juniorExercises,
  ...juniorPatterns,
  ...advancedExercises,
  ...structureExercises,
  ...interviewExpansion,
];
export const exercises: Exercise[] = catalog.map((exercise) => {
  const method = requiredMethod(exercise.id);
  if (!method) return exercise;
  return {
    ...exercise,
    method,
    version: exercise.version + 1,
    requirements: [
      ...exercise.requirements,
      `Use ${methodPolicies[method]}. Run and Finish check output and method separately. Finish records completion only when both pass. Built-in shortcuts do not demonstrate the requested method.`,
      'Unrecognized implementations retain their output results but cannot earn completion.',
    ],
  };
});
export function accepts(exercise: Exercise, check: Check, actual: unknown): boolean {
  if (exercise.id === 'three-sum') {
    if (
      !Array.isArray(actual) ||
      !actual.every((row) => Array.isArray(row) && row.length === 3 && row.every(Number.isInteger))
    )
      return false;
    const canonical = (rows: number[][]) =>
      rows.map((row) => [...row].sort((a, b) => a - b).join(',')).sort();
    return equalResult(canonical(actual), canonical(check.expected as number[][]));
  }
  if (exercise.id === 'course-order') {
    if (!Array.isArray(actual)) return false;
    if ((check.expected as number[]).length === 0) return actual.length === 0;
    const [count, prerequisites] = check.input as [number, number[][]];
    if (
      actual.length !== count ||
      new Set(actual).size !== count ||
      !actual.every((n) => Number.isInteger(n) && n >= 0 && n < count)
    )
      return false;
    const position = new Map(actual.map((n, i) => [n, i]));
    return prerequisites.every(
      ([course, prerequisite]) => position.get(prerequisite)! < position.get(course)!,
    );
  }
  if (exercise.id === 'two-sum') {
    if (!Array.isArray(actual) || actual.length !== 2) return false;
    const [a, b] = actual;
    const [nums, target] = check.input as [number[], number];
    return (
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      a !== b &&
      a >= 0 &&
      b >= 0 &&
      a < nums.length &&
      b < nums.length &&
      nums[a] + nums[b] === target
    );
  }
  if (exercise.id === 'minimum-window') {
    if (typeof actual !== 'string') return false;
    const [source, target] = check.input as [string, string];
    const expected = check.expected as string;
    if (!expected) return actual === '';
    if (actual.length !== expected.length || !source.includes(actual)) return false;
    return [...new Set(target)].every(
      (c) => [...actual].filter((x) => x === c).length >= [...target].filter((x) => x === c).length,
    );
  }
  return equalResult(actual, check.expected);
}
function equalResult(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) => equalResult(actual[index], value))
    );
  return actual === expected;
}
