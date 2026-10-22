# Adding an exercise

The catalog and comparators live in `src/app/core/exercises.ts`; junior foundations live in `src/app/core/junior-exercises.ts` and `src/app/core/junior-patterns.ts`, and skilled/senior additions in `src/app/core/advanced-exercises.ts` and `src/app/core/structure-exercises.ts`. Start with a clear behavior contract and tests, then write the prompt and starter code.

Each exercise requires a stable ID, version, difficulty, title, topic, expected practice time, prompt, requirements, language-specific synchronous function names and starters, public examples, additional checks, incremental hints, and a post-completion explanation.

- Specify input types, bounds, empty-input behavior, valid output forms, and tie handling.
- Use the same data contract in JavaScript and Python. State ASCII constraints where appropriate.
- Test normal inputs, minimal inputs, repeated values, missing answers, boundary positions, and plausible wrong approaches.
- Keep prompt requirements aligned with what the grader actually tests. Grade the returned result across varied inputs and never require input mutation. Accept any correct approach unless the exercise has an explicit method requirement. Do not grade exact syntax or variable names. Printing the answer is not a substitute for returning it.
- Add a semantic comparator when multiple answers are valid. Include tests for alternative correct outputs and common invalid outputs.
- Run both a simple valid implementation and an efficient valid implementation against the checks. Reject hardcoded example-only answers.
- Version content when changing the function contract. Plan and test explicit migration where preserving drafts and earned progress is appropriate; never silently rewrite learner code. The two returned-array exercises migrate v1 drafts verbatim and carry forward earned completions to v2.
- Write original descriptions. Do not copy a commercial question bank.
- User-facing content must contain no em dashes or emoji. Numbered examples and hints communicate a meaningful sequence; decorative numbering is not used.

The UI derives category options and progress totals from the catalog. Keep IDs stable and category names consistent. Add language-specific reference solutions in `tests/fixtures/junior-solutions.ts` for new junior challenges; the catalog browser tests run every fixture in both interpreters. Preserve three public examples, add edge cases, and verify incorrect implementations fail Finish. Strict primitive/array output comparison is the default.

When a specific algorithm or data structure is required, register it in `core/method-policy.ts` and add method inputs in `core/method/probes.ts` and evidence checks in the appropriate `core/method` module. `core/method-grading.ts` coordinates the separate method result. Extend both language instrumenters under `scripts/method-runtime` when needed. The shared catalog applies the method contract and version increment. Add positive variations and correct-output substitutions in both interpreters. Never grant completion for missing or unrecognized evidence, and never label correct output wrong because a method check failed. State supported variations and limitations in [METHOD_GRADING.md](METHOD_GRADING.md). Existing output-only completions need another Finish; drafts migrate verbatim. Category names and hints alone do not introduce a method restriction. Complexity remains guidance unless separately measured and documented.

Advanced reference solutions live in `tests/fixtures/advanced-solutions.ts`. Test reordered valid Three Sum results and course schedules. The original advanced tree exercises use the explicitly documented nested `[value, left, right]` JSON structure, with null/None children. Role labels are a learning progression, not a promise about employer-specific interview expectations.


## Practice sections and execution adapters

Set `area` to `data-structures` for exercises whose main focus is linked lists, trees, or stacks. Other current exercises use `algorithms` (also the default). Every difficulty currently has content in both sections. Exercise IDs must remain stable when moving sections, because draft/completion keys depend on the ID, version, and language.

New junior references are in `tests/fixtures/pattern-solutions.ts`. `tests/junior-patterns.spec.ts` verifies real JS/Python node and returned-array contracts, invalid solutions, section persistence, and responsive accessibility. `core/junior-patterns.spec.ts` independently derives expected results and tests legacy workspace migration.

Optional `adapter` values:

- `json`: pass JSON-compatible arguments and grade the returned value (default).
- `linked-list`: convert each input array to a `ListNode` chain and serialize the returned head. Empty input becomes null/None. Returned arrays, malformed chains, and cycles are errors.
- `cycle-list`: accept `[values, pos]` as the example input, connect the tail at pos (or use -1 for no cycle), and pass only head to learner code. Grade the returned boolean.
- `tree`: convert each nested `[value, left, right]` input to a `TreeNode` object, using null/None for missing nodes. Grade the returned primitive value.

Document these transformations in each prompt so displayed example arrays are not mistaken for the learner function's actual node arguments. Provide constructors in the runtime and field information in starter comments. Test alternate correct implementations without restricting source syntax. Complexity guidance must remain clearly instructional.

`tests/returned-results.spec.ts` reproduces the reported Move Zeroes solution, verifies draft migration in the browser, accepts newly allocated arrays in both languages, and rejects logging a correct answer without returning it. The catalog fixtures also cover modifying and returning arrays.


## HTML and CSS exercises

Add metadata to `core/web/model.ts` and content to `core/web/catalog.ts`. Each exercise needs requirements, starter code, three progressive hints, an explanation, and named checks with viewport widths and actionable failure hints. CSS tasks also need immutable fixture markup. The first three checks run through Run; Finish evaluates every check. Keep all requirements discoverable in the instructions and check-coverage list.

Test rendered behavior rather than source strings or one preferred selector/algorithm. Use native labels/controls, DOM relationships, computed values, and geometry; specify exact colors/sizes only when they are actual requirements. Avoid demanding Grid when Flexbox satisfies the same layout. Include a narrow viewport, missing/hidden-content failures, and alternative valid solutions. Add solutions only to `tests/fixtures/web-solutions.ts`, never the production catalog. Real browser tests must show starters fail and intended solutions pass; jsdom cannot validate layout geometry. Version changed contracts and plan draft migration explicitly. Check helpers are bounded to supplied small exercises; they do not claim to implement the entire accessibility-name algorithm or WCAG.


## Angular exercises

Add stable metadata to `core/angular/model.ts` and authored content to `core/angular/catalog.ts`. Use an exported standalone `AppComponent` with selector `practice-root` and inline templates/styles. Related components and services can share the file. Keep `data-testid` hooks stable and documented. Each exercise needs a broken starter, precise observable requirements, three hints, an explanation, and six or more named scenarios. The first three are Run coverage; Finish uses all scenarios. Use the installed runtime's supported imports rather than external packages or network requests.

Scenarios contain bounded click/input/wait steps and text/texts/value/count/disabled assertions against visible test hooks or component selectors. Each starts from a fresh Angular application/module. Cover repeated interactions, empty/invalid input, reset behavior, and state synchronization. Async scenarios must allow reasonable settling time and test stale results plus recovery. Keep grading behavioral: signals, plain fields, RxJS, and equivalent valid implementations may pass when they meet the contract. Component/service exercises can require the supplied component structure but must not demand an exact source implementation.

Store references only in `tests/fixtures/angular-solutions.ts`. Browser tests must show each starter fails and every solution passes all scenarios, plus at least one different valid implementation, diagnostic recovery, preview interactions, persistence, and isolation. Unit tests check metadata and storage validation. Update versions and plan migrations if changing contracts. These are finite learning checks, not complete proof of Angular correctness, resource safety, or accessibility.


### Interview collection

`core/angular/interview-catalog.ts` extends the initial nine exercises using shared helpers in `authoring.ts`. Add matching versioned metadata to `model.ts`; `catalog.ts` combines both collections. Fixtures live in `tests/fixtures/angular-interview-solutions.ts` and are merged by the existing solution registry. Keep fixture solutions out of production bundles.

Checks cover observable contracts rather than claiming to certify the exact implementation technique. Task list names may repeat; stable IDs distinguish rows. Pipe boundaries include empty strings and a zero limit. FormArray scenarios include whitespace validation, removal, and reset. CVA checks separate programmatic writes, user changes, touch state, and disabled state. Lifecycle cleanup tests repeatedly destroy/recreate the listener and emit while it is absent, avoiding timing-dependent intervals.

Angular mechanics were reviewed against primary references: [pipes and arguments](https://angular.dev/guide/templates/pipes), [input lifecycle hooks](https://angular.dev/guide/components/lifecycle), [selected projection slots and fallback](https://angular.dev/guide/components/content-projection), [dynamic reactive forms](https://angular.dev/guide/forms/reactive-forms), [OnPush subtree checking](https://angular.dev/best-practices/skipping-subtrees), [ControlValueAccessor callbacks](https://angular.dev/api/forms/ControlValueAccessor), and [takeUntilDestroyed](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed). Topic selection reflects useful Angular interview preparation; these sources document framework behavior, not employer-specific question frequency.


### CRUD exercises

`crud-catalog.ts` defines the three contact-manager exercises. IDs and action hooks identify records independently of display order. Give learners exact validation and status rules, and distinguish edit drafts, server state, and optimistic display state. Run still uses the first three scenarios; Finish currently uses 10 local, 15 API, or 20 conflict scenarios. Use settling waits beyond the deterministic 160ms service latency. A separate in-flight scenario should inspect Loading and disabled controls before completion.

The practice service is an Observable API simulation. It does not claim to teach configuring HttpClient, routing, HTTP interceptors, Firestore rules, authentication, or cross-session data storage. Its subscribe-to-execute and error-channel model follows the concepts documented in [Angular's request guide](https://angular.dev/guide/http/making-requests). Version checks and error codes are the documented ProCode service contract.

Reference solutions are in `tests/fixtures/angular-crud-solutions.ts`. Browser checks reject view-only writes, omitted version checks, and missing rollback, and verify a manual preview CRUD flow. `npm run test:crud-api` independently tests the service with Node assertions, including cancellation, defensive copies, atomic errors, server revisions, and session isolation.


## Firebase command exercises

Add lightweight metadata to `src/app/core/firebase/model.ts`, the corresponding definition to `catalog.ts`, and a reference workflow to `tests/fixtures/firebase-solutions.ts`. Definitions include an isolated initial environment, explicit fixture/prompt assumptions, requirements, hints, explanation, and state predicates. Keep the metadata and definitions in the same order. Do not expose reference workflows in the app bundle.

Grade semantic outcomes, not source fragments or a required sequence unless order affects behavior. For releases, inspect every recorded deployment so later valid commands cannot hide an earlier incorrect destination or overly broad scope. The interpreter adds an error-free requirement automatically. Keep pass conditions meaningful for empty scripts and starters. No command may execute a real shell, invoke user scripts, contact a project, or mutate files. Extend the documented supported subset only after checking the official CLI contract; unknown commands and options must remain explicit errors.

Add reference, incomplete, plausible-wrong-answer, alternate syntax, state isolation, and UI persistence tests when expanding workflows. Update counts, storage versions when contracts change, and the simulator limitations. Current primary references (reviewed 2026-10-08): [CLI](https://firebase.google.com/docs/cli), [emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure), [preview channels](https://firebase.google.com/docs/hosting/test-preview-deploy), [targets](https://firebase.google.com/docs/cli/targets), and official CLI source for [Firestore deployment scopes](https://github.com/firebase/firebase-tools/blob/master/src/deploy/firestore/prepare.ts) and [single-feature initialization](https://github.com/firebase/firebase-tools/blob/master/src/commands/init.ts).


## Full-stack projects

Use `core/fullstack/model.ts` metadata, matching definitions in `catalog.ts`, and reference source in `tests/fixtures/fullstack-solutions.ts`. Supply four starters, an explicit API contract, initial database data, required UI hooks, requirements/hints/explanation, and finite scenarios. Metadata/definition ordering must match. The reference files belong to tests and must not enter app bundles.

Use UI steps for real user workflows, direct API steps for validation callers could bypass in the UI, and database assertions to detect cosmetic or non-atomic writes. Include invalid inputs, missing records/routes, retries, stable identity and a 360px layout case. Avoid exact-source grading. Response shapes/statuses and UI hooks are declared contracts; internal implementation technique is unrestricted. The runtime compares objects without depending on property order. Use `contains` checks when the meaningful requirement is literal user text rather than surrounding UI copy.

`app.ts` exports a standalone `AppComponent`, with `projectTemplate` and injected `PracticeApi` from `@procode/fullstack`. The shared scaffold supplies imports and startup only. Add the endpoint registrations to `scaffold.ts`, leaving every handler at 501 until the learner implements it. `api.js` exports `handleRequest(request, db)`, normally via `createRouter` from `@procode/server`. Route callbacks receive body, string params and URLSearchParams query. Use `api.request(method, path, body)` and return `{status, body}`. Legacy `mount(api)` is still accepted. Keep both legacy references and real Angular references in the test fixtures; verify starters cannot pass the goal and equivalent implementations can. Each scenario gets a fresh worker and iframe. The worker is serialized and not a substitute for distributed/database concurrency testing. A post-commit lost-response test must verify replay does not repeat data effects. A version-conflict test must verify rejected edits do not overwrite data or destroy the user's draft. Add independently useful negative implementations to browser tests.

Framework references (reviewed 2026-10-08): [standalone application startup](https://angular.dev/api/platform-browser/bootstrapApplication), [template event binding](https://angular.dev/guide/templates/event-binding), and [template-driven forms](https://angular.dev/guide/forms/template-driven-forms).

Runtime foundations: [MDN workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and [iframe sandboxing](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), reviewed 2026-10-08. Execution restrictions and limitations are documented in README and ARCHITECTURE.

## Git workflow exercises

Add lightweight metadata to `core/git/model.ts` and a matching `GitExercise` definition to `core/git/catalog.ts`. Keep the positional definition order aligned with metadata. Increment the exercise version when the contract changes. Supply a fully isolated initial repository with valid commit parents, snapshots, refs, reflog and a `next` ID greater than every fixture ID. Each exercise specifies one hosting provider and a required PR branch.

Describe initial changes and exact observable requirements. Test outcomes using snapshots, ancestry, retained work and publication history. Do not require a particular command spelling if another supported sequence achieves the contract. If a file must never be published, inspect every published commit's reachable history, not just the final tree. Require correct PR source/target and distinguish hosted policies from fixture assumptions. Do not claim the simulator executes real Git or communicates with a provider.

The command reference is the learner's supported syntax contract. Extend interpreter semantics and reference together; reject unsupported flags rather than silently accepting them. Keep every command transactional, bound input, reject shell execution, and preserve fixtures between attempts. Document model differences, especially conflict handling. `practice write` must always be labeled as a helper, never as an actual Git command.

Add a reference workflow to `tests/fixtures/git-solutions.ts`. Verify every reference and incomplete starter, equivalent commands, incorrect state/history, atomic error recovery, and persistence. Add browser coverage for new controls/contracts and provider fields. Extend completion totals through metadata, not hardcoded test counts. Current catalog: nine exercises, three per level and one per provider at each level.

The structure expansion uses ordinary JSON operation streams for trie/cache exercises and a number array for streaming medians. Preserve explicit null/None results for mutating operations and strict boolean query results. Grade recency changes after both reads and updates, distinguish prefixes from complete words, and include negative/fractional medians. Reference solutions in `tests/fixtures/structure-solutions.ts` implement tries, ordered caches and two heaps; independent simpler models and an alternate sorted-array solution verify behavioral acceptance.

## Clean code exercises

Add matching metadata in `core/clean/model.ts`, a definition in `catalog.ts`, and independent JavaScript/Python references in `tests/fixtures/clean-solutions.ts`. Provide explicit public signatures, behavior requirements, examples, additional cases, cleanup rules, three hints and an explanation. Both starters must already produce the correct outputs while violating at least one stated cleanup rule. Avoid broken starters that confuse repairing behavior with refactoring.

Specify every automatically enforced structure constraint in the prompt. Current checks support minimum binding-name length (three characters), maximum decision nesting, policy literals outside functions, and two directly reachable named helpers with an entry-point statement limit. Name length is a proxy, not a meaningful-name detector. Helpers must be named declarations or supported assigned JavaScript functions/arrows; Python helpers use def. Else-if/elif chains do not add another decision level. Comments and string contents must never count as code. Set `preserveInputs` when caller-owned data must remain unchanged; include already sorted collections and nested records to catch shallow-copy mistakes.

Behavior still matters: include empty inputs, boundary values, priority/order rules, repeated values and unknown policy keys as appropriate. Do not compare source with a reference solution. Verify starters, multiple valid approaches, behavior regressions, structural decoys, mutation failures, diagnostics and persistence. Source checks are deliberately bounded and cannot certify subjective design quality or prevent deliberate gaming. Bump the version when the exercise contract changes so old drafts and credit are not silently reinterpreted.

## Targeted expansion contracts

The additional data-structure definitions live in `core/interview-expansion.ts` and test-only references in `tests/fixtures/interview-expansion-solutions.ts`. Min Stack uses operation streams with null/None for empty queries. BST validation uses nested [value,left,right] arrays/lists and strict ancestor bounds. Multiway merge uses arrays as sorted streams and preserves multiplicities. Do not silently switch these contracts to node objects or enforce a specific complexity without changing prompts/versioning.

The web, Clean code and full-stack additions live in their section's `expansion.ts`. Match their lightweight metadata ordering when extending positional definition catalogs. Web checks should validate actual native constraints, focus targets and rendered behavior; sticky headers must still work after their container scrolls. Keep phone checks in Finish and preserve equivalent layouts such as Grid or Flexbox.

For API search/pagination, check direct calls independently of UI state and define sorting, defaults, bounds, empty results and total-count semantics. For bulk writes, use requests that contain a valid ID before a missing ID so a partial-write implementation cannot pass. Test validation precedence and preserve the caller's unsaved selection on failure. Keep real Angular startup/router scaffolding separate from learner-written domain logic. New reference projects in `tests/fixtures/fullstack-expansion-solutions.ts` run through the same production sandbox.

The additional Clean code set in `more-practice.ts` combines explicit structure rules where useful. Keep each requirement independently testable so a learner can see whether behavior, naming, nesting, constants, decomposition or input preservation failed. Include several simultaneously invalid conditions to protect validation priority, exact threshold values, empty collections, repeated normalized values, nested-array mutation and unknown dictionary keys. JavaScript/Python should share identical JSON contracts and rounding semantics. Timing exercises compute values only and never wait or make network calls.
