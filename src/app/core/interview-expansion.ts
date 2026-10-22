import type { Check, Exercise } from './exercises';
const check = (name: string, input: unknown[], expected: unknown, hint: string): Check => ({
  name,
  input,
  expected,
  hint,
});
const common = { version: 1, area: 'data-structures' as const, adapter: 'json' as const };
const stackHint =
  'Keep duplicate minima until their last copy is popped. Empty queries return null or None.';
const treeHint = 'Every descendant must respect all ancestor bounds. Equal values are not allowed.';
const mergeHint = 'Keep every occurrence, skip empty lists, and compare numbers numerically.';
export const interviewExpansion: Exercise[] = [
  {
    ...common,
    id: 'min-stack',
    title: 'Build a Min Stack',
    difficulty: 'junior',
    category: 'Stacks',
    minutes: '20–30 min',
    description: 'Process stack operations while tracking the smallest value still present.',
    requirements: [
      'Implement minStack(operations) or min_stack(operations). Start empty for each call. Operations are ["push", integer], ["pop"], ["top"], or ["min"].',
      'Return one result per operation. push and pop return null/None; top and min return a number, or null/None when empty. Popping an empty stack does nothing.',
      'There are 0 to 200 operations, with values from -1000 to 1000. Preserve duplicate values. Aim for constant-time operations using a second minimum stack; grading accepts equivalent correct behavior without enforcing complexity.',
    ],
    signature: { javascript: 'minStack', python: 'min_stack' },
    starter: {
      javascript: 'function minStack(operations) {\n  return [];\n}',
      python: 'def min_stack(operations):\n    return []\n',
    },
    examples: [
      check(
        'Minimum survives a pop',
        [[['push', 7], ['push', 2], ['min'], ['pop'], ['min']]],
        [null, null, 2, null, 7],
        stackHint,
      ),
      check(
        'Duplicate minima',
        [[['push', -4], ['push', -4], ['pop'], ['min']]],
        [null, null, null, -4],
        stackHint,
      ),
      check('Empty queries', [[['top'], ['min'], ['pop']]], [null, null, null], stackHint),
    ],
    additional: [
      check('No operations', [[]], [], stackHint),
      check(
        'Top is not minimum',
        [[['push', 2], ['push', 9], ['top'], ['min']]],
        [null, null, 9, 2],
        stackHint,
      ),
      check(
        'Drain and refill',
        [[['push', -8], ['pop'], ['min'], ['push', 6], ['min']]],
        [null, null, null, null, 6],
        stackHint,
      ),
      check(
        'Zero and negatives',
        [[['push', 0], ['push', -1], ['top'], ['pop'], ['top']]],
        [null, null, -1, null, 0],
        stackHint,
      ),
      check(
        'Increasing values',
        [[['push', 1], ['push', 2], ['push', 3], ['min'], ['pop'], ['min']]],
        [null, null, null, 1, null, 1],
        stackHint,
      ),
      check(
        'Boundary values',
        [[['push', 1000], ['push', -1000], ['min'], ['pop'], ['min']]],
        [null, null, -1000, null, 1000],
        stackHint,
      ),
      check(
        'Repeated empty pop',
        [[['pop'], ['pop'], ['push', 5], ['top']]],
        [null, null, null, 5],
        stackHint,
      ),
    ],
    hints: [
      'A normal stack answers push, pop and top.',
      'Store the minimum alongside each pushed value, or maintain a synchronized minimum stack.',
      'When pushing an equal minimum, retain another copy so one pop does not lose it.',
    ],
    explanation:
      'A stack of [value, minimumSoFar] pairs gives constant-time operations and handles duplicate minima naturally. Each function call starts with independent state.',
  },
  {
    ...common,
    id: 'validate-bst',
    title: 'Validate a Binary Search Tree',
    difficulty: 'skilled',
    category: 'Trees & recursion',
    minutes: '20–30 min',
    description:
      'Determine whether an entire tree obeys strict binary-search ordering, including descendants several levels below the root.',
    requirements: [
      'Implement isValidBst(tree) or is_valid_bst(tree). A tree is null/None or [value, leftSubtree, rightSubtree]. This exercise uses nested arrays/lists, not node objects.',
      'Return a boolean. Every left descendant must be strictly smaller, and every right descendant strictly larger, than its ancestor. Duplicate values make a tree invalid. The empty tree is valid.',
      'Inputs contain at most 100 nodes and integer values from -1000 to 1000. Any correct approach is accepted.',
    ],
    signature: { javascript: 'isValidBst', python: 'is_valid_bst' },
    starter: {
      javascript: 'function isValidBst(tree) {\n  return false;\n}',
      python: 'def is_valid_bst(tree):\n    return False\n',
    },
    examples: [
      check('Valid balanced tree', [[8, [3, null, null], [12, null, null]]], true, treeHint),
      check(
        'Hidden ancestor violation',
        [[8, [3, null, null], [12, [6, null, null], null]]],
        false,
        treeHint,
      ),
      check('Duplicate child', [[5, [5, null, null], null]], false, treeHint),
    ],
    additional: [
      check('Empty tree', [null], true, treeHint),
      check('Single zero', [[0, null, null]], true, treeHint),
      check('Negative values', [[-3, [-9, null, null], [-1, null, null]]], true, treeHint),
      check('Left subtree crosses root', [[8, [3, null, [9, null, null]], null]], false, treeHint),
      check('Deep equal ancestor', [[8, null, [12, [8, null, null], null]]], false, treeHint),
      check('Descending chain', [[4, [2, [0, null, null], null], null]], true, treeHint),
      check('Boundary values', [[0, [-1000, null, null], [1000, null, null]]], true, treeHint),
    ],
    hints: [
      'Checking only a parent and its children misses violations deeper in a subtree.',
      'Pass an exclusive lower and upper bound through recursion.',
      'Alternatively, an inorder traversal of a valid BST is strictly increasing.',
    ],
    explanation:
      'Ancestor bounds represent the whole path of ordering constraints. A bounds traversal or a strictly increasing inorder traversal visits each node once, using O(height) auxiliary space.',
  },
  {
    ...common,
    id: 'merge-k-lists',
    title: 'Merge K Sorted Lists',
    difficulty: 'senior',
    category: 'Heaps & merging',
    minutes: '25–40 min',
    description:
      'Combine multiple sorted streams into a single sorted result while preserving every duplicate.',
    requirements: [
      'Implement mergeSortedLists(lists) or merge_sorted_lists(lists). Each input list is an ascending array/list of integers; use these arrays as sorted streams rather than linked-node objects.',
      'Return one ascending array/list containing every value exactly as many times as it appeared. Empty outer lists and empty inner lists are allowed.',
      'Inputs have at most 20 lists and 200 total values from -1000 to 1000. A heap or pairwise merge targets O(N log K) time. Other correct implementations are accepted; time complexity is not graded.',
    ],
    signature: { javascript: 'mergeSortedLists', python: 'merge_sorted_lists' },
    starter: {
      javascript: 'function mergeSortedLists(lists) {\n  return [];\n}',
      python: 'def merge_sorted_lists(lists):\n    return []\n',
    },
    examples: [
      check(
        'Interleaved streams',
        [
          [
            [1, 6],
            [2, 4],
            [0, 8],
          ],
        ],
        [0, 1, 2, 4, 6, 8],
        mergeHint,
      ),
      check(
        'Duplicate values',
        [
          [
            [2, 2],
            [2, 3],
          ],
        ],
        [2, 2, 2, 3],
        mergeHint,
      ),
      check('Empty streams', [[[], [5], []]], [5], mergeHint),
    ],
    additional: [
      check('No streams', [[]], [], mergeHint),
      check('All empty', [[[], []]], [], mergeHint),
      check('Single stream', [[[-5, 0, 10]]], [-5, 0, 10], mergeHint),
      check(
        'Numeric ordering',
        [
          [
            [2, 20],
            [3, 11],
          ],
        ],
        [2, 3, 11, 20],
        mergeHint,
      ),
      check(
        'Negative values',
        [
          [
            [-10, -2],
            [-9, -1],
          ],
        ],
        [-10, -9, -2, -1],
        mergeHint,
      ),
      check('Uneven streams', [[[1, 2, 3, 4], [0], [5, 6]]], [0, 1, 2, 3, 4, 5, 6], mergeHint),
      check(
        'Boundary values',
        [
          [
            [-1000, 0],
            [0, 1000],
          ],
        ],
        [-1000, 0, 0, 1000],
        mergeHint,
      ),
    ],
    hints: [
      'Only the first remaining value from each sorted stream can be the next global minimum.',
      'A min-heap can track each stream head together with its list and position.',
      'Pairwise merging is another efficient strategy: repeatedly merge pairs until one list remains.',
    ],
    explanation:
      'A min-heap holds at most K stream heads. Removing the smallest and inserting its successor costs O(log K) per output value. Divide-and-conquer pairwise merges achieve the same asymptotic bound.',
  },
];
