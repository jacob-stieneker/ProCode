# Output and method grading

Run checks example output and method evidence. Finish checks all output cases and the same method evidence, and records completion only when both pass. An output check stays passed when the technique is different or cannot be verified. Run and Finish preserve the selected tab, even when it changes during execution. Open Test results manually to see method status and separate output details; the accessible status announcement remains available without switching tabs.

| Exercise                | Required evidence                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Selection Sort          | Scan the unsorted range for its minimum or maximum before placing that value.                                                     |
| Bubble Sort             | Repeated neighboring comparisons in forward or reverse passes.                                                                    |
| Insertion Sort          | Compare the next item against the sorted prefix while finding its insertion position.                                             |
| Merge Sort              | Compare and combine independently sorted halves or runs.                                                                          |
| Linear Search           | Check values sequentially until the first match or the end.                                                                       |
| Binary Search           | Inspect midpoints and halve the remaining search range.                                                                           |
| Dijkstra Shortest Paths | Relax outgoing edges in order of increasing settled tentative distance.                                                           |
| Implement a Prefix Tree | Traverse shared character paths through nested nodes.                                                                             |
| Binary Tree Level Order | Visit node values in breadth-first order. A depth-first traversal that groups values by depth does not meet this method contract. |

The full catalog was reviewed for named method contracts. Other tasks specify output behavior or explicitly permit multiple strategies. For example, list reversal permits iteration, recursion and copied nodes; tree depth permits DFS or BFS; median tasks permit simpler sorted-list or merge baselines. Those choices remain valid. Category labels and hints do not silently require one approach.

## How evidence is collected

The original solution executes unchanged for output checks. The runner then executes a separate instrumented copy against additional method inputs, in the same disposable worker inside an opaque-origin iframe. TypeScript's installed parser instruments JavaScript; Python's standard `ast` module instruments Python. Values remain ordinary numbers, lists and objects. Function and variable names, formatting, comments, and unused helper declarations do not earn method credit.

The method grader requires correct results on its inputs as well as matching evidence. Sorting compares unordered operand pairs against reference comparison transcripts. Common selection scan directions, full or bounded bubble passes, early exits, insertion by shifting or adjacent swaps, and recursive or bottom-up merges are supported. Search checks observe inspected values, including iterative or recursive binary search using lower or upper midpoints. Dijkstra checks edge-relaxation groups, supporting a minimum scan or priority queue with direct candidate-distance comparisons. Trie checks inspect nested character-node links and shared paths. Level traversal checks the order of first node-value reads.

Built-in sorting calls do not demonstrate a sorting implementation. Matching another recognized sorting/search family reports a different method by name. When the evidence is incomplete or unfamiliar, the result is **Method not verified**, rather than a claim that a particular incorrect algorithm was used. Output failures retain the normal expected/actual diagnostics independently of method status.

Analyzer loading failures and execution failures withhold method credit. An eight-second method-analysis deadline preserves already-computed output results. The ordinary output execution retains its existing four-second execution deadline and runtime-loading deadline. Neither phase exposes application storage or Node APIs.

## Code organization

`core/method-policy.ts` declares the required method for each affected exercise. `core/method-grading.ts` coordinates results; `core/method` separates probe data, sorting variants, comparison sequences, graph relaxation and trie/traversal evidence. `scripts/method-runtime` separates parsed-source instrumentation, event capture and execution. The preparation script bundles the JavaScript method runtime into `public/runtime/method/execution.js` and copies the Python analyzer. These assets load only for method checks.

## Limits and saved work

This is conservative local practice grading, not general algorithm identification, a proof of asymptotic complexity, or a tamper-proof assessment. Unusual but valid optimizations, custom operator behavior, library helpers, different comparison sequences, and unsupported syntax can be unverified. The UI deliberately withholds completion in that case. Extend probes and supported patterns when a legitimate implementation needs support; do not bypass the method gate.

The nine changed exercises use version 2. Their version 1 drafts migrate verbatim. Prior output-only completions require another Finish with a verified method. All other exercises keep their versions and progress. Editing a previously completed version does not revoke credit already earned for an earlier passing solution, consistent with existing progress behavior.

For new method-specific exercises, add an explicit policy, evidence checks in both languages, supported-variation tests and correct-output substitution tests. See [exercise authoring](EXERCISE_AUTHORING.md).
