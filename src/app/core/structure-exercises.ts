import type { Check, Exercise } from './exercises';
const check = (name: string, input: unknown[], expected: unknown, hint: string): Check => ({
  name,
  input,
  expected,
  hint,
});
const trieHint =
  'Keep exact-word membership separate from prefix membership. Insertions produce null, while queries produce booleans.';
const cacheHint =
  'Both a successful get and a put refresh recency. Evict only the least recently used entry when adding beyond capacity.';
const medianHint =
  'Return the median after every insertion. For even counts, average the two middle values without rounding.';
const common = {
  version: 1,
  area: 'data-structures' as const,
  adapter: 'json' as const,
};
export const structureExercises: Exercise[] = [
  {
    ...common,
    id: 'prefix-tree',
    title: 'Implement a Prefix Tree',
    difficulty: 'skilled',
    category: 'Tries',
    minutes: '25–35 min',
    description:
      'Process word insertions, exact lookups and prefix lookups for a small autocomplete dictionary.',
    requirements: [
      'Implement trieOperations(operations) in JavaScript or trie_operations(operations) in Python. Each operation is ["insert", word], ["search", word], or ["startsWith", prefix]. Start with an empty dictionary for each function call.',
      'Return one result per operation: null (None) for insert, a boolean for search or startsWith. A prefix is not automatically a complete word.',
      'Words and prefixes contain 1 to 40 lowercase English letters. There are 0 to 200 operations. Repeated insertion is allowed and must not change membership.',
      'Build a trie with shared character paths and end-of-word markers. Storing whole words in a set and scanning prefixes does not satisfy the method requirement.',
    ],
    signature: { javascript: 'trieOperations', python: 'trie_operations' },
    starter: {
      javascript:
        'function trieOperations(operations) {\n  // Return one result per operation.\n  return [];\n}\n',
      python:
        'def trie_operations(operations):\n    # Return one result per operation.\n    return []\n',
    },
    hints: [
      'Represent each node with a map of character children and an end-of-word flag.',
      'Walk or create nodes on insert. Search requires the terminal flag; startsWith only requires that the path exists.',
      'Return null or None explicitly for every insertion, even if the word was already present.',
    ],
    explanation:
      'A trie shares nodes between common prefixes. Walking a word takes O(length) time. The terminal flag distinguishes a stored word from the beginning of a longer word. A set with prefix scans also produces correct results but has different performance.',
    examples: [
      check(
        'A word and its prefix',
        [
          [
            ['insert', 'code'],
            ['search', 'code'],
            ['search', 'cod'],
            ['startsWith', 'cod'],
          ],
        ],
        [null, true, false, true],
        trieHint,
      ),
      check(
        'Insert the prefix as a word',
        [
          [
            ['insert', 'coder'],
            ['insert', 'code'],
            ['search', 'code'],
            ['search', 'coder'],
          ],
        ],
        [null, null, true, true],
        trieHint,
      ),
      check(
        'Missing prefix',
        [
          [
            ['insert', 'tree'],
            ['startsWith', 'try'],
          ],
        ],
        [null, false],
        trieHint,
      ),
    ],
    additional: [
      check('No operations', [[]], [], trieHint),
      check(
        'Maximum-length word',
        [
          [
            ['insert', 'a'.repeat(40)],
            ['search', 'a'.repeat(40)],
            ['search', 'a'.repeat(39)],
            ['startsWith', 'a'.repeat(39)],
          ],
        ],
        [null, true, false, true],
        trieHint,
      ),
      check(
        'Queries before insertion',
        [
          [
            ['search', 'a'],
            ['startsWith', 'a'],
          ],
        ],
        [false, false],
        trieHint,
      ),
      check(
        'Repeated insertion',
        [
          [
            ['insert', 'a'],
            ['insert', 'a'],
            ['search', 'a'],
            ['search', 'aa'],
          ],
        ],
        [null, null, true, false],
        trieHint,
      ),
      check(
        'Sibling branches',
        [
          [
            ['insert', 'cat'],
            ['insert', 'car'],
            ['search', 'cap'],
            ['startsWith', 'ca'],
            ['search', 'cat'],
            ['search', 'car'],
          ],
        ],
        [null, null, false, true, true, true],
        trieHint,
      ),
      check(
        'Suffix is not prefix',
        [
          [
            ['insert', 'testing'],
            ['startsWith', 'ing'],
            ['search', 'test'],
            ['startsWith', 'test'],
          ],
        ],
        [null, false, false, true],
        trieHint,
      ),
      check(
        'Longer query',
        [
          [
            ['insert', 'pro'],
            ['startsWith', 'program'],
            ['search', 'program'],
          ],
        ],
        [null, false, false],
        trieHint,
      ),
      check(
        'Terminal markers remain independent',
        [
          [
            ['insert', 'at'],
            ['insert', 'atom'],
            ['insert', 'as'],
            ['search', 'a'],
            ['search', 'ato'],
            ['search', 'at'],
            ['startsWith', 'ato'],
          ],
        ],
        [null, null, null, false, false, true, true],
        trieHint,
      ),
      check(
        'Prototype-like words are ordinary words',
        [
          [
            ['insert', 'constructor'],
            ['search', 'constructor'],
            ['search', 'prototype'],
            ['startsWith', 'con'],
          ],
        ],
        [null, true, false, true],
        trieHint,
      ),
    ],
  },
  {
    ...common,
    id: 'lru-cache',
    title: 'Build an LRU Cache',
    difficulty: 'senior',
    category: 'Caches & linked maps',
    minutes: '30–45 min',
    description:
      'Process cache reads and writes while evicting the least recently used entry when capacity is exceeded.',
    requirements: [
      'Implement lruCache(capacity, operations) in JavaScript or lru_cache(capacity, operations) in Python. Operations are ["put", key, value] or ["get", key]. Start with an empty cache for each function call.',
      'Return one result per operation: null (None) for put, the stored integer for a successful get, or -1 for a missing key.',
      'A successful get and every put make that key most recently used. Updating a key replaces its value without consuming another slot. A missing get does not change recency.',
      'Capacity is 1 to 20. Keys are integers from 0 to 100; values are integers from 0 to 1000. There are 0 to 200 operations.',
      'Aim for O(1) average reads and writes using a hash map with a doubly linked list or an ordered map. Grading checks results, not implementation or asymptotic complexity.',
    ],
    signature: { javascript: 'lruCache', python: 'lru_cache' },
    starter: {
      javascript:
        'function lruCache(capacity, operations) {\n  // Return one result per operation.\n  return [];\n}\n',
      python:
        'def lru_cache(capacity, operations):\n    # Return one result per operation.\n    return []\n',
    },
    hints: [
      'Track values and recency separately. Reading an existing key must move it to the most-recent position.',
      'When updating an existing key, remove its old recency position before appending it. Evict only after a new key pushes the size over capacity.',
      'Zero is a valid key and value. Check membership rather than treating a stored zero as a missing entry.',
    ],
    explanation:
      'A hash map locates an entry while a doubly linked list tracks recency. Moving a known node and removing the least-recent node can each take constant time. Ordered maps can provide the same interface. A FIFO cache fails when reads change which item should be evicted.',
    examples: [
      check(
        'Read changes eviction order',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['get', 1],
            ['put', 3, 30],
            ['get', 2],
            ['get', 1],
            ['get', 3],
          ],
        ],
        [null, null, 10, null, -1, 10, 30],
        cacheHint,
      ),
      check(
        'Update an existing key',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 1, 15],
            ['get', 1],
          ],
        ],
        [null, null, 15],
        cacheHint,
      ),
      check('Missing entry', [1, [['get', 4]]], [-1], cacheHint),
    ],
    additional: [
      check('No operations', [3, []], [], cacheHint),
      check(
        'Capacity one',
        [
          1,
          [
            ['put', 1, 0],
            ['get', 1],
            ['put', 2, 5],
            ['get', 1],
            ['get', 2],
          ],
        ],
        [null, 0, null, -1, 5],
        cacheHint,
      ),
      check(
        'Write refreshes recency',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['put', 1, 11],
            ['put', 3, 30],
            ['get', 2],
            ['get', 1],
          ],
        ],
        [null, null, null, null, -1, 11],
        cacheHint,
      ),
      check(
        'Miss does not evict or refresh',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['get', 9],
            ['put', 3, 30],
            ['get', 1],
            ['get', 2],
          ],
        ],
        [null, null, -1, null, -1, 20],
        cacheHint,
      ),
      check(
        'Repeated reads',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['get', 1],
            ['get', 1],
            ['put', 3, 30],
            ['get', 2],
          ],
        ],
        [null, null, 10, 10, null, -1],
        cacheHint,
      ),
      check(
        'Zero key and value',
        [
          2,
          [
            ['put', 0, 0],
            ['get', 0],
            ['put', 1, 1],
            ['get', 0],
            ['put', 2, 2],
            ['get', 1],
          ],
        ],
        [null, 0, null, 0, null, -1],
        cacheHint,
      ),
      check(
        'Reinsert an evicted key',
        [
          1,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['put', 1, 11],
            ['get', 1],
            ['get', 2],
          ],
        ],
        [null, null, null, 11, -1],
        cacheHint,
      ),
      check(
        'An update is not another slot',
        [
          2,
          [
            ['put', 1, 10],
            ['put', 2, 20],
            ['put', 2, 21],
            ['get', 1],
            ['get', 2],
          ],
        ],
        [null, null, null, 10, 21],
        cacheHint,
      ),
    ],
  },
  {
    ...common,
    id: 'streaming-median',
    title: 'Track a Streaming Median',
    difficulty: 'senior',
    category: 'Heaps',
    minutes: '30–45 min',
    description: 'Return the median of all values seen so far after each incoming number.',
    requirements: [
      'Implement runningMedians(nums) in JavaScript or running_medians(nums) in Python. Return an array with one median for every prefix of nums, in input order.',
      'For an odd number of values, use the middle value in sorted order. For an even number, average the two middle values without rounding.',
      'The input contains 0 to 200 integers between -1000 and 1000, including duplicates. An empty input returns an empty array. Each call starts a new stream.',
      'Two balanced heaps allow O(log n) insertion and O(1) median lookup. Grading accepts any correct implementation, including maintaining a sorted list; complexity is not enforced.',
    ],
    signature: { javascript: 'runningMedians', python: 'running_medians' },
    starter: {
      javascript:
        'function runningMedians(nums) {\n  // Return a median after each insertion.\n  return [];\n}\n',
      python:
        'def running_medians(nums):\n    # Return a median after each insertion.\n    return []\n',
    },
    hints: [
      'Keep the smaller half in a max-heap and the larger half in a min-heap. Their sizes should differ by at most one.',
      'The median is the larger heap root when sizes differ, or the average of both roots when sizes match. Rebalance after every insertion.',
      'With a min-heap library, negate values in the lower half to model a max-heap, then undo the sign when reading its root.',
    ],
    explanation:
      'Two heaps partition the stream around its middle while supporting efficient insertions. Keeping their sizes balanced makes the median available at their roots. Sorting each prefix is a simpler correct baseline with higher cost.',
    examples: [
      check('Alternating middle values', [[8, 2, 6, 4]], [8, 5, 6, 5], medianHint),
      check('Fractional median', [[1, 2]], [1, 1.5], medianHint),
      check('Negative numbers', [[-3, -1, -2]], [-3, -2, -2], medianHint),
    ],
    additional: [
      check('Empty stream', [[]], [], medianHint),
      check(
        'Long stream',
        [Array.from({ length: 200 }, (_, i) => ((i * 37) % 199) - 100)],
        Array.from({ length: 200 }, (_, i) => {
          const values = Array.from({ length: i + 1 }, (_, j) => ((j * 37) % 199) - 100).sort(
            (a, b) => a - b,
          );
          return (values[Math.floor(i / 2)] + values[Math.ceil(i / 2)]) / 2;
        }),
        medianHint,
      ),
      check('Single zero', [[0]], [0], medianHint),
      check('All equal', [[7, 7, 7, 7]], [7, 7, 7, 7], medianHint),
      check('Descending input', [[5, 4, 3, 2, 1]], [5, 4.5, 4, 3.5, 3], medianHint),
      check('Ascending input', [[1, 2, 3, 4, 5]], [1, 1.5, 2, 2.5, 3], medianHint),
      check(
        'Alternating extremes',
        [[-1000, 1000, -1000, 1000, 0]],
        [-1000, 0, -1000, 0, 0],
        medianHint,
      ),
      check('Negative fractional median', [[-4, -3]], [-4, -3.5], medianHint),
      check('Repeated middle values', [[0, 10, 0, 10, 0, 10]], [0, 5, 0, 5, 0, 5], medianHint),
      check('Numeric rather than string order', [[2, 10, 3, 20]], [2, 6, 3, 6.5], medianHint),
    ],
  },
];
