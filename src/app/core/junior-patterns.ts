import type { Exercise, ExecutionAdapter } from './exercises';

type Case = [name: string, input: unknown[], expected: unknown];
function practice(config: {
  id: string;
  version?: number;
  title: string;
  category: string;
  signatures: [string, string];
  params: string;
  initial: [string, string];
  adapter?: ExecutionAdapter;
  description: string;
  requirements: string[];
  hints: [string, string, string];
  explanation: string;
  cases: Case[];
}): Exercise {
  const list = config.adapter === 'linked-list' || config.adapter === 'cycle-list';
  const tree = config.adapter === 'tree';
  const jsSetup = list
    ? '// Provided: new ListNode(val = 0, next = null), with .val and .next.\n'
    : tree
      ? '// Provided: new TreeNode(val = 0, left = null, right = null).\n// Nodes have .val, .left, and .right.\n'
      : '';
  const pySetup = list
    ? '# Provided: ListNode(val=0, next=None), with .val and .next.\n'
    : tree
      ? '# Provided: TreeNode(val=0, left=None, right=None).\n# Nodes have .val, .left, and .right.\n'
      : '';
  const checks = config.cases.map(([name, input, expected]) => ({
    name,
    input,
    expected,
    hint: config.hints[1],
  }));
  return {
    id: config.id,
    version: config.version ?? 1,
    difficulty: 'junior',
    title: config.title,
    area: list || tree ? 'data-structures' : 'algorithms',
    category: config.category,
    minutes: '10–20 min',
    adapter: config.adapter,
    description: config.description,
    requirements: config.requirements,
    signature: { javascript: config.signatures[0], python: config.signatures[1] },
    starter: {
      javascript: `${jsSetup}function ${config.signatures[0]}(${config.params}) {\n  // Write your solution here.\n  return ${config.initial[0]};\n}\n`,
      python: `${pySetup}def ${config.signatures[1]}(${config.params}):\n    # Write your solution here.\n    return ${config.initial[1]}\n`,
    },
    hints: config.hints,
    explanation: config.explanation,
    examples: checks.slice(0, 3),
    additional: checks.slice(3),
  };
}
const listContract =
  'Example arrays are converted to linked lists before your function runs. Each node has val and next. Empty lists are null in JavaScript and None in Python. ListNode is provided.';
const treeContract =
  'Examples use [value, left, right], with null for missing children. The runner converts them to TreeNode objects with val, left, and right. Missing nodes are null in JavaScript and None in Python. TreeNode is provided.';
const leaf = (value: number): unknown[] => [value, null, null];
const chain = (count: number, side: 'left' | 'right'): unknown =>
  count === 0
    ? null
    : [
        count,
        side === 'left' ? chain(count - 1, side) : null,
        side === 'right' ? chain(count - 1, side) : null,
      ];

export const juniorPatterns: Exercise[] = [
  practice({
    id: 'stock-profit',
    title: 'Best Time to Buy and Sell Stock',
    category: 'Arrays & greedy scans',
    signatures: ['maxProfit', 'max_profit'],
    params: 'prices',
    initial: ['0', '0'],
    description: 'Find the largest profit from buying once and selling on a later day.',
    requirements: [
      'Return the maximum profit, or 0 when no profitable trade exists. You may choose not to trade.',
      'Prices are listed in day order. Sell strictly after buying; do not add profits from multiple trades.',
      'Inputs contain 0 to 200 integer prices between 0 and 10,000.',
    ],
    hints: [
      'Consider the lowest price seen before each possible selling day.',
      'A low price that occurs after a selling day cannot be used for that trade. Keep the best single profit, not a sum of gains.',
      'Scan once, maintaining the minimum price so far and the largest difference between the current price and that minimum.',
    ],
    explanation:
      'A running minimum and best profit give O(n) time and O(1) extra space. This is one transaction, not the variant allowing repeated buying and selling.',
    cases: [
      ['A profitable trade', [[7, 1, 5, 3, 6, 4]], 5],
      ['Falling prices', [[7, 6, 4, 3, 1]], 0],
      ['One trade only', [[1, 4, 2, 7]], 6],
      ['No days', [[]], 0],
      ['One day', [[5]], 0],
      ['Equal prices', [[3, 3, 3]], 0],
      ['Two rising days', [[0, 10]], 10],
      ['Later minimum', [[5, 9, 1, 2]], 4],
      ['Zero price', [[3, 0, 2]], 2],
      ['Best sale at end', [[8, 2, 4, 10]], 8],
      ['Price bounds', [[10000, 0, 10000]], 10000],
      ['Maximum length', [Array.from({ length: 200 }, (_, i) => i)], 199],
    ],
  }),
  practice({
    id: 'move-zeroes',
    version: 2,
    title: 'Move Zeroes',
    category: 'Arrays & two pointers',
    signatures: ['moveZeroes', 'move_zeroes'],
    params: 'nums',
    initial: ['[]', '[]'],
    description:
      'Move all zeroes to the end of an array while preserving the order of its other values.',
    requirements: [
      'Return an array/list containing every input value, with all zeroes at the end and all nonzero values in their original order.',
      'You may build a new array/list or modify and return the original. Checks compare your returned result for different inputs.',
      'Inputs contain 0 to 200 integers between -1,000 and 1,000. Return an empty array/list for empty input.',
    ],
    hints: [
      'Collect nonzero values in order and count the zeroes.',
      'Keep every nonzero value in its original order, append the same number of zeroes as the input, and return the resulting array/list.',
      'Build a result from the nonzero values, then append zeroes until its length matches the input. Alternatively, compact the input with a write pointer, fill the tail with zeroes, and return it.',
    ],
    explanation:
      'Collecting nonzero values and appending zeroes takes O(n) time and O(n) extra space. Compacting the input uses O(1) extra space. Both approaches are accepted when they return the correct array/list; complexity is not automatically graded.',
    cases: [
      ['Mixed zeroes', [[0, 1, 0, 3, 12]], [1, 3, 12, 0, 0]],
      ['Order matters', [[4, 0, -2, 0, 4]], [4, -2, 4, 0, 0]],
      ['Already arranged', [[1, 2, 0, 0]], [1, 2, 0, 0]],
      ['Empty array', [[]], []],
      ['Single zero', [[0]], [0]],
      ['Single nonzero', [[-1]], [-1]],
      ['All zeroes', [[0, 0, 0]], [0, 0, 0]],
      ['No zeroes', [[3, -1, 2]], [3, -1, 2]],
      ['Leading zeroes', [[0, 0, 5, 6]], [5, 6, 0, 0]],
      ['Alternating', [[0, 1, 0, 2, 0, 3]], [1, 2, 3, 0, 0, 0]],
      ['Bounds', [[0, -1000, 1000, 0]], [-1000, 1000, 0, 0]],
      [
        'Maximum length',
        [Array.from({ length: 200 }, (_, i) => (i % 2 ? 1 : 0))],
        [...Array(100).fill(1), ...Array(100).fill(0)],
      ],
    ],
  }),
  practice({
    id: 'remove-sorted-duplicates',
    version: 2,
    title: 'Remove Duplicates from a Sorted Array',
    category: 'Arrays & two pointers',
    signatures: ['removeDuplicates', 'remove_duplicates'],
    params: 'nums',
    initial: ['[]', '[]'],
    description:
      'Remove duplicate values from a sorted array, keeping each distinct value once in ascending order.',
    requirements: [
      'Return an array/list of the distinct input values in ascending order. Return an empty array/list for empty input.',
      'You may build a new array/list or modify and return the original. Checks compare the entire returned array/list for different inputs.',
      'Inputs contain 0 to 200 integers in nondecreasing order, between -1,000 and 1,000.',
    ],
    hints: [
      'Sorted input puts equal values next to one another.',
      'Keep one copy of each distinct value and return those values, not their count. Preserve ascending order.',
      'Scan the sorted input and append a value only when the result is empty or its last value differs. Return the result.',
    ],
    explanation:
      'Building a list of distinct values takes O(n) time and O(n) extra space. You can also compact and shorten the input, then return it. Checks evaluate the returned values, not your implementation or space usage.',
    cases: [
      ['Repeated values', [[1, 1, 2]], [1, 2]],
      ['Several runs', [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], [0, 1, 2, 3, 4]],
      ['No duplicates', [[-2, 0, 4]], [-2, 0, 4]],
      ['Empty array', [[]], []],
      ['Single value', [[7]], [7]],
      ['All equal', [[2, 2, 2, 2]], [2]],
      ['Negative repeats', [[-3, -3, -1, -1, 0]], [-3, -1, 0]],
      ['Repeated tail', [[1, 2, 2, 2]], [1, 2]],
      ['Repeated head', [[1, 1, 1, 2, 3]], [1, 2, 3]],
      ['Zero only', [[0, 0]], [0]],
      ['Bounds', [[-1000, -1000, 1000, 1000]], [-1000, 1000]],
      [
        'Maximum length',
        [Array.from({ length: 200 }, (_, i) => Math.floor(i / 10))],
        Array.from({ length: 20 }, (_, i) => i),
      ],
    ],
  }),
  practice({
    id: 'first-unique-character',
    title: 'First Unique Character',
    category: 'Strings & hash maps',
    signatures: ['firstUniqueChar', 'first_unique_char'],
    params: 'text',
    initial: ['-1', '-1'],
    description: 'Return the index of the first character that appears exactly once in text.',
    requirements: [
      'Return a zero-based index, or -1 when no unique character exists.',
      'Inputs contain 0 to 200 lowercase English letters. Choose the earliest unique character by input position.',
    ],
    hints: [
      'Count every character before deciding which one is unique.',
      'A character that looks unique early may repeat later. Scan the original text again after counting all occurrences.',
      'Use a frequency map, then return the first index whose character has count 1. Return -1 if there is none.',
    ],
    explanation:
      'A frequency pass followed by an order-preserving search takes O(n) time. With a fixed 26-letter alphabet, the count table uses O(1) space.',
    cases: [
      ['Unique first character', ['leetcode'], 0],
      ['Unique later character', ['loveleetcode'], 2],
      ['No unique character', ['aabb'], -1],
      ['Empty text', [''], -1],
      ['Single character', ['z'], 0],
      ['All repeated', ['aaaa'], -1],
      ['Unique at end', ['aabbc'], 4],
      ['Unique in middle', ['abacb'], 3],
      ['Several unique characters', ['bcad'], 0],
      ['Late repetition', ['abcabcx'], 6],
      ['Maximum length', ['a'.repeat(199) + 'z'], 199],
      ['Maximum repeated length', ['ab'.repeat(100)], -1],
    ],
  }),
  practice({
    id: 'longest-common-prefix',
    title: 'Longest Common Prefix',
    category: 'Strings',
    signatures: ['longestCommonPrefix', 'longest_common_prefix'],
    params: 'words',
    initial: ['""', '""'],
    description: 'Return the longest starting sequence shared by every string in words.',
    requirements: [
      'Return an empty string when words is empty or the strings share no prefix.',
      'A prefix must start at position 0 in every string. Matching a substring elsewhere does not count.',
      'Inputs contain 0 to 100 strings, each with 0 to 100 lowercase English letters.',
    ],
    hints: [
      'Start with a candidate prefix and narrow it as you compare words.',
      'An empty word forces an empty answer. Stop comparisons at the shortest word’s length.',
      'Compare characters by position across all words, or repeatedly shorten a candidate until each word starts with it.',
    ],
    explanation:
      'Comparing a shared prefix across the strings takes at most O(total input characters) time. Different valid comparison strategies are accepted.',
    cases: [
      ['Shared beginning', [['flower', 'flow', 'flight']], 'fl'],
      ['No common prefix', [['dog', 'racecar', 'car']], ''],
      ['One word is the prefix', [['app', 'apple', 'apply']], 'app'],
      ['No words', [[]], ''],
      ['One word', [['solo']], 'solo'],
      ['Empty word', [['abc', '']], ''],
      ['All empty', [['', '']], ''],
      ['Identical words', [['same', 'same', 'same']], 'same'],
      ['Shortest word last', [['abcd', 'abce', 'ab']], 'ab'],
      ['Substring is not prefix', [['abc', 'xabc']], ''],
      ['Single shared letter', [['a', 'ab', 'ac']], 'a'],
      ['Maximum input', [Array(100).fill('a'.repeat(100))], 'a'.repeat(100)],
    ],
  }),
  practice({
    id: 'reverse-linked-list',
    title: 'Reverse a Linked List',
    category: 'Linked lists',
    signatures: ['reverseList', 'reverse_list'],
    params: 'head',
    initial: ['null', 'None'],
    adapter: 'linked-list',
    description: 'Return the head of a linked list whose values appear in reverse order.',
    requirements: [
      listContract,
      'Return a node or null/None, not an array. The runner converts your returned list to an array for comparison. The returned list must end without a cycle.',
      'Inputs contain 0 to 200 nodes with integer values between -1,000 and 1,000. You may reuse nodes or construct new ones.',
    ],
    hints: [
      'Track the previous node and the current node.',
      'Save the next node before changing current.next, or you will lose the remaining list.',
      'Repeatedly save next, set current.next to previous, then advance previous and current. The final previous node is the new head.',
    ],
    explanation:
      'Reversing links iteratively uses O(n) time and O(1) extra space. A recursive or copied-node solution is also accepted when the returned node chain has the correct values.',
    cases: [
      ['Several nodes', [[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]],
      ['Two nodes', [[1, 2]], [2, 1]],
      ['Repeated values', [[2, 2, 1]], [1, 2, 2]],
      ['Empty list', [[]], []],
      ['Single node', [[7]], [7]],
      ['Negative values', [[-3, 0, 2]], [2, 0, -3]],
      ['All equal', [[4, 4, 4]], [4, 4, 4]],
      ['Palindrome', [[1, 2, 1]], [1, 2, 1]],
      ['Zero node', [[0]], [0]],
      ['Bounds', [[-1000, 1000]], [1000, -1000]],
      ['Even length', [[1, 2, 3, 4]], [4, 3, 2, 1]],
      [
        'Maximum length',
        [Array.from({ length: 200 }, (_, i) => i)],
        Array.from({ length: 200 }, (_, i) => 199 - i),
      ],
    ],
  }),
  practice({
    id: 'merge-sorted-lists',
    title: 'Merge Two Sorted Lists',
    category: 'Linked lists',
    signatures: ['mergeTwoLists', 'merge_two_lists'],
    params: 'first, second',
    initial: ['null', 'None'],
    adapter: 'linked-list',
    description:
      'Merge two sorted linked lists into one sorted linked list, preserving every value and duplicate.',
    requirements: [
      listContract,
      'Each input list is in nondecreasing order. Return the merged head node or null/None, not an array. Output is displayed as an array and must not contain a cycle.',
      'Each list contains 0 to 100 integer nodes between -1,000 and 1,000. You may reuse input nodes or construct new ones.',
    ],
    hints: [
      'Compare the current node at the front of each list.',
      'Keep duplicates and attach the unfinished tail when one input is exhausted.',
      'Use a dummy head and a tail pointer. Attach the smaller current node, advance that input, and finally attach the remaining list.',
    ],
    explanation:
      'Merging with a tail pointer takes O(n + m) time and O(1) auxiliary space when nodes are reused. Allocating a new result list is also accepted.',
    cases: [
      [
        'Interleaved lists',
        [
          [1, 2, 4],
          [1, 3, 4],
        ],
        [1, 1, 2, 3, 4, 4],
      ],
      ['One empty input', [[], [0]], [0]],
      [
        'Separate ranges',
        [
          [1, 2],
          [5, 6],
        ],
        [1, 2, 5, 6],
      ],
      ['Both empty', [[], []], []],
      ['Second empty', [[1, 2], []], [1, 2]],
      ['Equal single nodes', [[2], [2]], [2, 2]],
      [
        'Second starts first',
        [
          [3, 5],
          [1, 4],
        ],
        [1, 3, 4, 5],
      ],
      [
        'Negative values',
        [
          [-5, -1],
          [-3, 0],
        ],
        [-5, -3, -1, 0],
      ],
      [
        'All equal',
        [
          [1, 1],
          [1, 1, 1],
        ],
        [1, 1, 1, 1, 1],
      ],
      ['Uneven lengths', [[2], [1, 3, 4, 5]], [1, 2, 3, 4, 5]],
      ['Bounds', [[-1000], [1000]], [-1000, 1000]],
      [
        'Maximum length',
        [
          Array.from({ length: 100 }, (_, i) => i * 2),
          Array.from({ length: 100 }, (_, i) => i * 2 + 1),
        ],
        Array.from({ length: 200 }, (_, i) => i),
      ],
    ],
  }),
  practice({
    id: 'linked-list-cycle',
    title: 'Linked List Cycle',
    category: 'Linked lists',
    signatures: ['hasCycle', 'has_cycle'],
    params: 'head',
    initial: ['false', 'False'],
    adapter: 'cycle-list',
    description: 'Determine whether following next pointers can revisit the same node.',
    requirements: [
      listContract,
      'Examples show [values, pos]. A nonnegative pos connects the tail to that zero-based node index; -1 means no cycle. Your function receives only head, not pos.',
      'Return a boolean. Equal node values alone do not imply a cycle; compare node identity.',
      'Inputs contain 0 to 200 nodes with values between -1,000 and 1,000. Empty input has pos = -1.',
    ],
    hints: [
      'Two pointers can traverse the same list at different speeds.',
      'Check that the fast pointer and its next node exist before advancing twice. Compare node references, not their values.',
      'Move slow one link and fast two links per step. A meeting means a cycle; reaching the end means no cycle.',
    ],
    explanation:
      'Floyd’s cycle-detection algorithm uses O(n) time and O(1) extra space. A set of visited node identities is also a correct solution, using O(n) extra space.',
    cases: [
      ['Cycle into the middle', [[3, 2, 0, -4], 1], true],
      ['No cycle', [[1, 2, 3], -1], false],
      ['Self loop', [[1], 0], true],
      ['Empty list', [[], -1], false],
      ['Single terminal node', [[1], -1], false],
      ['Two-node cycle', [[1, 2], 0], true],
      ['Tail self loop', [[1, 2, 3], 2], true],
      ['Equal values without cycle', [[7, 7, 7], -1], false],
      ['Equal values with cycle', [[7, 7, 7], 1], true],
      ['Cycle to head', [[0, 1, 2, 3], 0], true],
      ['Long acyclic list', [Array(200).fill(1), -1], false],
      ['Late cycle', [Array.from({ length: 200 }, (_, i) => i), 198], true],
    ],
  }),
  practice({
    id: 'tree-max-depth',
    title: 'Maximum Depth of a Binary Tree',
    category: 'Trees & recursion',
    signatures: ['maxDepth', 'max_depth'],
    params: 'root',
    initial: ['0', '0'],
    adapter: 'tree',
    description: 'Return the number of nodes on the longest path from the root to a leaf.',
    requirements: [
      treeContract,
      'An empty tree has depth 0. A single node has depth 1. Count nodes, not edges.',
      'Trees contain 0 to 100 nodes with integer values between -1,000 and 1,000.',
    ],
    hints: [
      'An empty subtree provides the base case.',
      'Compute both subtree depths. Use the larger depth, not their sum, and include the current node.',
      'Return 0 for a missing node. Otherwise return 1 + max(depth(left), depth(right)).',
    ],
    explanation:
      'Depth-first traversal visits each node once, taking O(n) time and O(h) recursion space for height h. Breadth-first level counting is also accepted.',
    cases: [
      ['Uneven branches', [[3, leaf(9), [20, leaf(15), leaf(7)]]], 3],
      ['Single node', [leaf(1)], 1],
      ['Empty tree', [null], 0],
      ['Only left child', [[1, leaf(2), null]], 2],
      ['Only right child', [[1, null, leaf(2)]], 2],
      ['Left chain', [chain(10, 'left')], 10],
      ['Right chain', [chain(10, 'right')], 10],
      ['Equal branches', [[0, [1, leaf(3), leaf(4)], [2, leaf(5), leaf(6)]]], 3],
      ['Negative root', [[-5, leaf(-10), null]], 2],
      ['Zero-valued node', [leaf(0)], 1],
      ['Depth differs from node count', [[1, leaf(2), leaf(3)]], 2],
      ['Maximum height', [chain(100, 'right')], 100],
    ],
  }),
  practice({
    id: 'same-tree',
    title: 'Same Tree',
    category: 'Trees & recursion',
    signatures: ['isSameTree', 'is_same_tree'],
    params: 'first, second',
    initial: ['false', 'False'],
    adapter: 'tree',
    description:
      'Determine whether two binary trees have identical structure and equal values at every corresponding node.',
    requirements: [
      treeContract,
      'Return a boolean. Two empty trees are equal. Left and right positions matter even when the trees contain the same values.',
      'Each tree contains 0 to 100 nodes with integer values between -1,000 and 1,000.',
    ],
    hints: [
      'Compare the two roots before comparing their children.',
      'Both nodes missing means equal; only one missing means different. Matching traversed values alone does not prove matching structure.',
      'Require equal node values and recursively equal left subtrees and right subtrees.',
    ],
    explanation:
      'Comparing corresponding nodes visits at most O(n + m) nodes, with O(h) recursion space. Iterative paired-node traversal is equally valid.',
    cases: [
      [
        'Identical trees',
        [
          [1, leaf(2), leaf(3)],
          [1, leaf(2), leaf(3)],
        ],
        true,
      ],
      [
        'Different child positions',
        [
          [1, leaf(2), null],
          [1, null, leaf(2)],
        ],
        false,
      ],
      [
        'Different values',
        [
          [1, leaf(2), leaf(1)],
          [1, leaf(1), leaf(2)],
        ],
        false,
      ],
      ['Both empty', [null, null], true],
      ['First empty', [null, leaf(1)], false],
      ['Second empty', [leaf(1), null], false],
      ['Equal zero nodes', [leaf(0), leaf(0)], true],
      ['Different roots', [leaf(1), leaf(2)], false],
      [
        'Different leaf values',
        [
          [1, [2, leaf(3), null], null],
          [1, [2, leaf(4), null], null],
        ],
        false,
      ],
      [
        'Extra descendant',
        [
          [1, leaf(2), null],
          [1, [2, leaf(3), null], null],
        ],
        false,
      ],
      [
        'Repeated values, different shape',
        [
          [1, [1, leaf(1), null], null],
          [1, leaf(1), leaf(1)],
        ],
        false,
      ],
      ['Equal negative nodes', [leaf(-1000), leaf(-1000)], true],
      ['Maximum equal height', [chain(100, 'left'), chain(100, 'left')], true],
      ['Opposite long chains', [chain(100, 'left'), chain(100, 'right')], false],
    ],
  }),
];
