# Practice coverage review

Reviewed October 8, 2026. The catalog contains 127 distinct exercises, worth 188 completion challenges because the 46 algorithms/data structures and fifteen Clean code exercises can each be completed in JavaScript and Python. Quizzes are tracked separately.

| Section | Junior | Skilled | Senior | Distinct exercises |
| --- | ---: | ---: | ---: | ---: |
| Algorithms | 18 | 6 | 7 | 31 |
| Data structures | 7 | 4 | 4 | 15 |
| Clean code | 5 | 5 | 5 | 15 |
| Angular | 7 | 7 | 7 | 21 |
| HTML | 3 | 3 | 3 | 9 |
| CSS | 3 | 3 | 3 | 9 |
| Full stack | 3 | 3 | 3 | 9 |
| Firebase | 3 | 3 | 3 | 9 |
| Git workflows | 3 | 3 | 3 | 9 |
| Total | 52 | 37 | 38 | 127 |

The quiz bank has 200 original questions across ten topics: JavaScript, Python, TypeScript, HTML, CSS, Angular, Full-stack, Developer vocabulary, Git and Firebase. Every topic has 20 questions, each with four distinct options, one correct answer, an explanation and a source. Sessions support 10 or 20 questions, topic selection or balanced mixed-topic quizzes, shuffled answers, saved sessions and review history. A 20-question single-topic quiz uses that topic's entire bank; repeated sessions change order, not the available material.

## Assessment

The catalog is a substantial initial practice library with no empty topic or difficulty. Junior algorithms cover core searching, sorting, strings, arrays, counting and introductory dynamic programming. More advanced algorithms add graph traversal, topological sorting, shortest paths, sliding windows and dynamic programming. Data structures cover stacks, linked lists, binary trees, tries, cache recency and heaps. The sanity review added a skilled prefix-tree exercise and senior LRU-cache/streaming-median exercises to address the thinnest difficulty bands.

Angular spans binding, forms, components, services, lifecycle, projection, change detection, custom controls, cleanup and progressively harder CRUD flows. HTML/CSS cover semantics, forms, accessibility, layout and responsive behavior. Full-stack projects exercise UI plus API behavior, validation, CRUD, stock limits, conflicts and idempotent retries. Firebase labs cover setup, emulators and release scopes. Git labs cover branching, staging, stashing, integration, recovery and safe publication with one exercise per provider at every level.

This is a learning progression, not a universal mapping between interview questions and job seniority. Correct observable behavior earns credit in behavioral exercises; Clean code additionally enforces the stated cleanup constraints. Nine named algorithm/data-structure exercises also require method evidence, as documented in [METHOD_GRADING.md](METHOD_GRADING.md). Algorithm asymptotic complexity is discussed but not certified. Senior HTML/CSS exercises assess a narrower skill than production system design. No exercise library guarantees interview readiness.

Clean code adds naming, decision flattening, shared constants, mutation removal, responsibility extraction and table-driven policy. It uses explicit structural checks plus behavior tests, not subjective AI scoring. Naming checks measure identifier length, and helper checks recognize direct calls to named functions; neither proves production-quality design.

## Boundaries and future depth

- Firebase and Git labs simulate documented command subsets locally. They do not validate real credentials, cloud IAM, hosted CI/review policies or production deployments.
- Full-stack APIs and Angular CRUD data are isolated local runtime models. Real authentication, Firestore rules evaluation, persistent databases, Angular routing and deployment troubleshooting remain useful expansion areas.
- Browser verification currently targets Chromium. Safari and Firefox still need dedicated compatibility runs before claiming cross-browser support.
- Local drafts and progress are exportable. Import, cloud sync, accounts and authoritative server grading are not implemented.
- Additional quiz questions, SQL/database modeling and larger multi-step projects would add repeatability and breadth. They are future depth, not blockers to using the current library.

The three new data-structure exercises use independently written prompts and fixtures for established topics. Semantic references: [prefix trees](https://leetcode.com/problems/implement-trie-prefix-tree/description/), [LRU caches](https://leetcode.com/problems/lru-cache/description/) and [streaming medians](https://leetcode.com/problems/find-median-from-data-stream/description/). ProCode uses function-based input/output contracts. Prefix trees now require trie evidence; LRU caches and streaming medians accept different correct approaches.

## Targeted expansion

The latest pass adds fifteen exercises to the sections with the least material. That pass brought HTML, CSS, Clean code and Full stack to three exercises per level; the subsequent Clean code expansion below brings that section to five per level. Data structures adds one per level without increasing the already larger junior algorithm collection. Angular remains at seven per level; Firebase and Git remain at three. The quiz bank is unchanged.

| Area | Junior addition | Skilled addition | Senior addition |
| --- | --- | --- | --- |
| Data structures | Build a Min Stack | Validate a Binary Search Tree | Merge K Sorted Lists |
| Clean code | Refactor Registration Validation | Make Discounts Immutable | Separate a Ticket Report |
| HTML | Accessible Search Form | Shipping Form Constraints | Accessible Form Error Summary |
| CSS | Center an Empty State | Sticky Results Header | Resilient Settings Form |
| Full stack | Build a Searchable Catalog | Build Server-side Pagination | Make Bulk Updates Atomic |

Topic selection draws on established interview patterns, not claims about a particular company's question frequency. The data-structure exercises adapt the concepts into ProCode's bounded function contracts, with independently written prompts and fixtures. Min Stack is presented as a supported junior stretch exercise; grade labels do not reproduce an external site's difficulty system. Merge K uses arrays as streams rather than linked nodes. Complexity targets are explained but not enforced.

References reviewed for this expansion: [interview topic coverage](https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/), [Min Stack](https://leetcode.com/problems/min-stack/), [BST validation](https://leetcode.com/problems/validate-binary-search-tree/), [multiway merge](https://leetcode.com/problems/merge-k-sorted-lists/), [native numeric constraints](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/number), [autocomplete purpose](https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/autocomplete), [sticky positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position), and [Angular request concepts](https://angular.dev/guide/http/making-requests). ProCode still uses its local PracticeApi transport, not HttpClient or a remote service.

## Further Clean code practice

Six more exercises bring Clean code to fifteen, five per difficulty and thirty language completions:

| Difficulty | Added exercises | Focus |
| --- | --- | --- |
| Junior | Clarify Pagination Boundaries; Name Retry Timing Rules | Intent-revealing names, counts versus indexes, explicit timing policy |
| Skilled | Normalize Tags Without Mutation; Flatten Coupon Validation | Nested-data preservation, normalization order, validation priority and named policy |
| Senior | Decompose a Log Report; Centralize Role Permissions | Focused helpers, inclusive thresholds, shared policy and unknown-key fallback |

All starters already behave correctly for their contracts but fail at least one cleanup requirement. Each has three public examples and four to six additional cases, two language references, three hints and an explanation. Combined cleanup goals are evaluated separately from behavioral correctness. Retry timing and permissions are bounded pure-function learning models, not production networking or authorization implementations.
