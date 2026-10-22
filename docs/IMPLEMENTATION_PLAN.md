# Phase 1 implementation plan

Scope: a private, local-first Angular app. No accounts, paid services, or production infrastructure. The user confirmed this scope on October 6, 2026.

1. Build a responsive, accessible practice workspace with Junior, Skilled, and Senior difficulty choices. Provide one curated algorithm per difficulty in JavaScript and Python.
2. Implement a CodeMirror editor, language-specific starter files, automatic local drafts, and per-exercise/per-language completion history.
3. Execute code in a disposable Web Worker created inside an opaque-origin sandboxed iframe. Use JavaScript and a locally served, pinned Pyodide runtime. Terminate work on timeout or cancellation. Never execute submitted code on the host machine.
4. Separate Run (public examples) and Finish (examples plus additional checks). Validate behavior, accept equivalent solutions, and explain failed checks with hints. Keep an execution adapter boundary for later server grading.
5. Test correct and incorrect implementations, both languages, timeouts, isolation, cancellation, persistence, reset, responsive layouts, keyboard access, and production assets.
6. Document setup, architecture, content contracts, local-grading limitations, and future deployment requirements.

Release acceptance: all three difficulty levels have working JS and Python execution; accepted submissions persist independently; drafts survive reload; switching during execution cannot misattribute results; production build and automated browser tests pass.

Local-only boundary: extra checks are bundled with the application and are inspectable. This is personal practice, not tamper-proof assessment. Cloud sync, hosted grading, Firebase accounts, Git/Angular/HTML/CSS labs, and quizzes belong to later phases.


## Junior catalog and editor assistance (October 6, 2026)

1. Expand the existing catalog with sorting, searching, strings, hash maps, stacks, and introductory dynamic programming, preserving stable existing IDs.
2. Add category/algorithm selection, per-difficulty selection persistence, and catalog-derived progress totals.
3. Use CodeMirror bracket-closing behavior and parser-aware nesting decorations with existing theme tokens.
4. Verify real JS/Python execution, negative grading cases, old workspace compatibility, typing behavior, accessibility, responsive layout, and production build.
5. Update catalog authoring guidance, architecture, README, changelog, and verification evidence.

## Advanced algorithms and knowledge quizzes (October 7, 2026)

1. Add seven skilled and seven senior interview-pattern exercises, each with JavaScript/Python starters, examples, edge cases, hints, and behavioral grading. Preserve existing IDs and drafts.
2. Add a local question bank with 20 original, four-option questions per topic: JavaScript, Python, HTML, CSS, TypeScript, Angular, Full-stack, Developer vocabulary, Git, and Firebase. Check material against official references and keep source links with explanations.
3. Add a dedicated quiz screen with topic and 10/20-question selection, randomized questions/choices, answer navigation, submission, score, and explained review. Save unfinished sessions and a bounded attempt history locally; no paid service or backend.
4. Verify algorithm solutions in both runtimes, alternate-valid grading, question-bank integrity, quiz scoring/shuffling, persistence, keyboard/mobile accessibility, theme integration, and production build. Update docs and changelog.


## Junior patterns and Data structures section (October 7, 2026)

1. Add the ten agreed junior array, string, linked-list, and tree problems, with original prompts, three examples, additional edge cases, hints, and JS/Python starters.
2. Extend the isolated runner with node construction and mutation-aware output adapters. Preserve existing function contracts and error diagnostics.
3. Add a Data structures navigation section for linked lists, trees, and stacks. Filter each section by difficulty and category; migrate existing selections without changing exercise identities or saved work.
4. Verify all new solutions in both languages, invalid mutation/list outputs, alternate correct node allocation, independent expected answers, storage migration, both section selections, mobile layouts, accessibility, and existing features.
5. Update catalog documentation, authoring contracts, architecture, changelog, and verification evidence.

## Returned-result grading correction (October 7, 2026)

1. Audit every exercise and both execution paths for mutation or implementation restrictions.
2. Make Move Zeroes and Remove Duplicates return-array problems, updating all instructional content and removing the two mutation-specific adapters.
3. Version the changed contracts and explicitly migrate saved source verbatim and earned progress without overriding newer drafts.
4. Verify the reported solution, newly allocated and modified returned arrays, incorrect outputs, persistence, every exercise in both runtimes, console behavior, and production build.
5. Update README, authoring guidance, architecture, changelog, and verification evidence.


## HTML and CSS coding practice (October 8, 2026)

1. Add two HTML and two CSS exercises per difficulty with behavior-based checks, explicit requirements, hints, and explanations.
2. Reuse the themed editor with official lazy-loaded HTML/CSS language support. Build script-disabled local previews and disposable grading frames for mobile/desktop checks.
3. Integrate topic/difficulty selection, draft persistence, completion progress, reset, and JSON export without changing existing algorithm or quiz data.
4. Verify every starter/solution, alternative implementations, negative cases, isolation, storage, keyboard use, responsive/accessibility behavior, existing editor/algorithm flows, and production build.
5. Document the content, sandbox, grading limits, source references, and verification evidence.


## Angular coding practice (October 8, 2026)

1. Add three Angular exercises per difficulty with broken/incomplete standalone starters, behavior contracts, interaction scenarios, hints, and explanations.
2. Bundle the installed Angular runtime and TypeScript compiler locally. Transpile in a worker and bootstrap learner components in opaque-origin sandboxed previews, with restricted imports and ordinary-loop guards.
3. Reuse the themed TypeScript editor, stable Console/Preview/Test results tabs, Run/Finish controls, separate draft/completion storage, JSON export, and combined progress.
4. Verify all nine starters and solutions, an alternative implementation, boundary/async interactions, compiler/runtime recovery, sandbox isolation, persistence, mobile/keyboard/accessibility behavior, and existing practice flows.
5. Document runtime capabilities and limitations, authoring contracts, setup assets, and verification evidence.


## Angular interview catalog expansion (October 8, 2026)

1. Add three exercises per level covering conditional views, pipes, editable lists, input lifecycle, content projection, FormArray, OnPush, ControlValueAccessor, and subscription cleanup. Keep existing IDs and stored work.
2. Reuse local Angular execution and behavioral scenarios. Define explicit inputs, reset/boundary behavior, and required component contracts; keep reference solutions in tests only.
3. Verify every new starter and solution, plausible incorrect implementations, alternate valid approaches, catalog/storage consistency, progress totals, responsive accessibility, and production build.
4. Update README, authoring references, changelog, architecture counts, and verification evidence.


## Angular CRUD sequence

1. Add one complete contact CRUD exercise per difficulty: local state, asynchronous simulated API, and revision conflicts/optimistic rollback. Preserve all existing exercise IDs and storage.
2. Supply a local Observable API with isolated server state, deterministic latency/failures, defensive copies, validation, and revision checks. Records persist across list reloads within an attempt, never across Run/Finish.
3. Grade create/read/update/delete, edit cancellation, invalid inputs, repeated actions, reload consistency, loading/error/retry paths, conflicts, and rollback through browser interactions.
4. Verify reference and incorrect solutions, API semantics, existing Angular runtime behavior, progress, persistence, responsiveness, and production build; update documentation.

## Firebase command practice

1. Add nine command-workflow exercises, three per level, covering project setup, initialization, local emulators, Hosting scopes/previews/targets, emulator seed data, rules-test execution, and selective Firestore deployment.
2. Implement a bounded local CLI simulator with explicit command/flag validation, virtual project/configuration state, console diagnostics, and state-based grading. No shell execution, Firebase installation, credentials, real cloud requests, or billing.
3. Add deferred Firebase UI with difficulty selection, multiline command editing, Run/Finish, Console/state/check tabs, hints, persistence, reset/export, and integrated progress.
4. Verify every reference and incomplete starter, equivalent syntax, incorrect scopes/projects/order, parser isolation, saved work, responsiveness/accessibility, and existing navigation. Update user and authoring documentation with exact simulation limits and primary references.

Firebase implementation completed 2026-10-08. All four steps are delivered; validation details and simulation limits are recorded in VERIFICATION.md.

## Full-stack projects

1. Deliver six projects, two per difficulty: tasks, guestbook, support tickets, checkout, version conflicts, and idempotent order retries. Edit HTML, CSS, client JavaScript, and API JavaScript independently.
2. Execute actual learner client code in an opaque sandbox and actual API handlers in a dedicated worker with isolated in-memory data. Use a local request transport, no external services, real credentials, or persistent business data. Compile/instrument scripts using the existing local TypeScript compiler.
3. Grade UI interactions, direct API contracts, data mutations, validation/atomicity and responsive layouts. Include alternate implementations and plausible incorrect solutions. Preserve output tabs and saved drafts across files/levels/navigation.
4. Integrate navigation, progress and exports; verify unit/runtime/browser behavior, error recovery, isolation, accessibility and production builds. Document the precise local simulation boundary and authoring contracts.

Full-stack implementation completed 2026-10-08. Six projects, multi-file editing, isolated client/API execution, 51 scenarios, persistence/progress, documentation, and verification are complete. See VERIFICATION.md for results and runtime limits.

## Git workflow exercises

1. Add nine provider-specific scenarios, three per difficulty, distributed across GitHub, Azure Repos and Bitbucket: feature PRs, selective staging, stash/hotfix, merge conflicts, rebase, cherry-pick, revert, reflog recovery and lease-protected rewritten history.
2. Implement a bounded local Git model with commit DAGs, file snapshots, working tree/index, branch refs, remotes/tracking refs, stash, reflog and explicit conflict handling. Commands are parsed as data, never executed in a shell. Teach a documented subset and separate ProCode file-edit helpers from Git commands.
3. Add simulated provider pull-request preparation, state/console/check tabs, hints, saved commands/review drafts, reset/export and integrated progress. Preserve tab selection and unrelated saved work.
4. Verify references, equivalent commands, invalid workflows, parser bounds, persistence, provider PR checks, responsive accessibility and existing navigation/compiler behavior. Update documentation and precise simulation limitations.

Git implementation completed 2026-10-08. All four steps are delivered: nine workflows, bounded state/history grading, simulated provider reviews, saved work/progress, responsive accessibility, documentation and verification. See VERIFICATION.md for the final 145-unit-test and nine-browser-test results and explicit simulator limits.

## App-wide sanity check and slogan

1. Inventory practice material by section and difficulty, verify quiz topic/question coverage, and review existing behavioral tests for missing coverage.
2. Add “Practice makes pro” beside the brand where space permits, retaining compact tablet navigation and the existing concise interface.
3. Run the full unit, local CRUD API, production-build and Chromium browser suites. Resolve reproducible functionality or content gaps, then rerun affected checks. Inspect desktop/mobile branding and expanded interactive states.
4. Document the coverage inventory, verified behavior, limitations and any prioritized content gaps; update README and changelog.

Sanity review completed 2026-10-08. Added the slogan, filled the advanced data-structure coverage gap with three exercises, fixed keyboard scrolling access, refreshed outdated catalog assertions, and documented coverage. All 150 unit tests, six CRUD API tests and 86 distinct browser cases pass across full and targeted runs; the production build and formatting checks pass. See VERIFICATION.md and PRACTICE_COVERAGE.md for evidence and scope limits.

## Developer workbench visual refinement

1. Use the existing brand, local theme tokens and current workflows as authority. Replace large difficulty cards and disconnected bordered panels with compact segmented controls and a unified two-pane workbench.
2. Refine shell navigation, typography, control hierarchy, editor chrome, quiz surfaces and dialogs consistently. Preserve source theme colors, OLED black, concise copy, SVG icons, and all saved work.
3. Add a reversible Focus control that expands the editor/workbench by hiding instructions, without remounting editors, changing drafts or switching output tabs. Keep mobile controls accessible and honor reduced motion.
4. Run functional, theme-contrast, responsive and keyboard checks. Inspect desktop/mobile and populated states in one batch, fix discovered issues together, then confirm once. Document the resulting design and behavior.

Developer workbench refinement completed 2026-10-08. Shared styling, Focus mode, documentation and verification are delivered. All 150 unit tests, 44 selected browser checks and the production build pass; see VERIFICATION.md.

## Framework scaffolding for full-stack practice

1. Supply a real standalone Angular client scaffold with TypeScript, template/forms setup, dependency injection, startup and a local API service. Keep bindings, behavior, validation and persistence logic as learner work.
2. Supply a small local route-registration helper for API method/path/query/parameter dispatch and 404 fallback. Leave domain-specific handlers unimplemented. Retain local worker isolation and behavioral grading.
3. Preserve existing drafts/completions by normalizing the client filename from app.js to app.ts without rewriting saved source; continue accepting legacy mount functions.
4. Verify all starters remain incomplete, Angular reference implementations satisfy every existing scenario, legacy implementations still run, diagnostics and isolation remain intact, and migration/reset/export preserve work. Update runtime references, authoring docs and changelog.

Full-stack framework scaffolding completed 2026-10-08. All six Angular starters, local route plumbing, legacy draft compatibility, real Angular references and documentation are delivered. Verification: 151 unit tests, four router tests, 12 browser checks and production build pass.

## Clean code practice

1. Add six refactoring exercises, two per difficulty, with JavaScript/Python starters that behave correctly but violate specific cleanup goals. Publish each measurable criterion and preserve equivalent valid implementations.
2. Reuse isolated execution for behavioral and input-preservation checks. Analyze JavaScript with the installed TypeScript parser and Python with ast, without executing source during structural analysis. Keep parser work outside the UI thread.
3. Add a deferred Clean code workspace with language/level/exercise selection, editor, console/check tabs, hints, reset/export, independent saved drafts and integrated progress/Focus/navigation.
4. Verify starters, alternate refactorings, incorrect behavior, comments/string decoys, diagnostics/timeouts, persistence and responsive accessibility. Document structural-check limits and content coverage.

Clean code practice completed 2026-10-08. Six exercises, twelve language completions, deferred local source analysis, input-preservation grading, independent saved work, navigation/progress integration and documentation are delivered. Verification covers 163 unit tests, 23 selected browser cases, responsive visual/accessibility checks and the production build. See VERIFICATION.md for scope and limits.

## Targeted interview and practical coverage expansion

1. Add fifteen exercises to the thinnest sections: one per level in Data structures, Clean code, HTML, CSS and Full stack. Preserve existing IDs, drafts and completion contracts.
2. Cover minimum stacks, global BST bounds, multiway merging, validation refactoring, immutable updates, policy extraction, native form constraints, accessible navigation/errors, layout alignment, sticky scrolling, responsive forms, searchable API catalogs, server pagination and atomic bulk updates.
3. Reuse existing local runners and framework scaffolds. Provide explicit contracts, independent reference solutions, edge cases and plausible incorrect implementations; keep equivalent working approaches acceptable.
4. Verify the affected catalogs in both languages where available, rendered web behavior, real Angular/API projects, persistence and responsive accessibility. Update coverage totals, sources, README, authoring/architecture notes and changelog.

Targeted expansion completed 2026-10-08. Fifteen exercises, references, varied-input/rendered/API grading, failure cases and coverage/source documentation are delivered. All 175 unit tests, 23 selected browser cases and the production build pass; desktop/mobile visual checks are complete. Existing saved-work contracts remain unchanged. See VERIFICATION.md for details and limits.

## More Clean code practice

1. Add six working-but-sloppy refactoring exercises, two per difficulty, covering pagination naming, retry constants, nested-data immutability, coupon guards, log-report decomposition and role policy tables.
2. Reuse the existing source and behavioral checks. Publish measurable cleanup constraints and boundary/priority rules; preserve existing exercise versions, drafts and credit.
3. Add independent JavaScript/Python references, alternative implementations and targeted incorrect solutions. Verify every starter retains correct behavior but fails cleanup, and references pass across varied inputs.
4. Run unit, browser, production-build and responsive checks; update catalog totals, README, coverage, authoring notes and changelog.

Further Clean code practice completed 2026-10-08. Six exercises with both language references, actionable cleanup feedback, edge cases and negative tests are delivered. All 185 unit tests, thirty language exercise variants and six distinct browser scenarios are verified; the production build and responsive review pass. Documentation and inventory totals are updated, and existing saved-work contracts are unchanged.
