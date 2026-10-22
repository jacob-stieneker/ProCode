# Changelog

## 0.2.3, 2026-10-22

- Added a self-contained Windows x64 NSIS installer using the same app, offline runtimes, grading and UI as the Mac build. Windows uses native menus, taskbar identity and the existing logo; saved work is retained across reinstall and uninstall.
- Shared runtime staging between Mac and Windows, preserving the existing Mac app identity, protocol, signing and DMG workflow. Installer tools remain development dependencies.
- Added native Windows CI for installer checksums, install/reinstall/uninstall, the shared installed-app scenarios and full browser regressions. Mac CI checks the existing Apple Silicon package. Artifacts are uploaded only after successful verification.
- Fixed slow full-stack API-worker startup: initialization has a separate loading budget, and its blob script remains available until the worker loads. API-request and learner-code execution deadlines are unchanged. Added a controlled slow-start regression.
- Hardened full-stack browser input synchronization and saved-source checks, with explicit fixture whitespace normalization and Console diagnostics on failure. Windows catalog sweeps receive sufficient aggregate test time without changing application limits.
- Initialized the project as a private GitHub repository, excluding generated runtimes, build artifacts, reports, local configuration and credentials. Added Windows build, installation and signing documentation.

## 0.2.2, 2026-10-14

- Restored manual output-tab selection for method-checked exercises. Run and Finish preserve Console or Test results, including tab changes made during execution. Method warnings and completion checks remain available without forcing navigation.
- Added browser coverage for both languages, correct and different methods, both execution actions, both tabs and tab changes during a run. Updated method tests and packaged-app verification to select Test results explicitly.
- Corrected an Angular browser-test input race by waiting for the selected draft to render and the exact replacement source to save before grading.
- Aligned the Dijkstra reference fixture's final brace with the editor's indentation so source-preservation assertions compare the intended code exactly.

## 0.2.1, 2026-10-14

- Added separate output and method grades for all named sorting exercises, linear/binary search, Dijkstra, prefix trees and breadth-first level traversal, in JavaScript and Python. Correct output remains passed when method evidence differs or cannot be verified; Finish requires both grades before recording completion.
- Added local parsed-source instrumentation and runtime method probes, supported-variation recognition, automatic method feedback, accessible status announcements, and preservation of output results when method analysis fails or times out. Corrected the Dijkstra JavaScript reference, which previously used Bellman-Ford.
- Preserved existing drafts through exercise-version migration. Prior output-only completions on these nine exercises require another Finish. Other exercises retain their documented approach choices.
- Added cross-algorithm substitutions, ordinary valid implementations, alternative variants, timeout retention, responsive/accessibility checks and packaged-app method verification. Added method-policy and authoring documentation.
- Split the grading and instrumentation into focused helpers, keeping new source files under 300 lines and functions at 15 lines or fewer. Test helpers verify CodeMirror's loaded draft and saved source before running a submission.

## Unreleased

- Added self-contained Apple Silicon macOS packaging with Electron, the existing ProCode icon, native menus, local assets and persistent desktop storage. The renderer remains sandboxed without Node access, and exercise runtimes are bundled for offline practice.
- Added reproducible app signing, packaged-app smoke checks, compressed DMG creation, checksum generation and installation documentation. This personal-use build is ad-hoc signed, without notarization; browser and desktop workspaces remain separate.
- Consolidated all eight practice and quiz JSON exports into a shared download helper, preserving filenames, payloads and delayed blob URL cleanup. Cleanup is also scheduled if download setup throws.
- Updated the section-persistence browser regression to check complete option lists against the current catalog, replacing stale counts and titles from before the data-structure expansion.

- Added six Clean code exercises in JavaScript and Python: pagination names, retry timing constants, immutable tag normalization, coupon guards, log-report decomposition and role permission tables. Clean code now has fifteen exercises, five per level; app totals are 127 distinct exercises and 188 completion challenges.
- Added boundary/priority checks, combined cleanup rules, independent references and negative tests for capped delays, shallow copying, changed validation order, threshold errors and unknown-role defaults. Existing drafts, progress keys and execution behavior are unchanged.

- Added fifteen exercises across the thinnest sections, one per level in Data structures, Clean code, HTML, CSS and Full stack. Coverage now totals 121 distinct exercises, 176 completion challenges and 200 quiz questions.
- Added Min Stack, BST validation, multiway merging, registration guards, immutable discounts, report decomposition, native form semantics/constraints/errors, centered layouts, sticky headers and responsive settings forms.
- Added real Angular/API projects for searchable catalogs, server pagination and atomic bulk updates, retaining framework-only scaffolds. Added independent references, edge cases, incorrect-submission tests and native/rendered behavior checks. Existing exercise IDs and saved-work contracts are unchanged.
- Adjusted the initial bundle warning budget to 860 kB for 7.7 kB of new shared catalog/metadata; kept the 1 MB error limit and section-level deferred loading.

- Added Clean code practice with six refactoring exercises, two per difficulty, in JavaScript and Python. Working but sloppy starters teach naming, flatter decisions, named constants, input preservation, helper extraction and shared policy tables.
- Combined behavioral tests with explicit parsed-source cleanup checks, separate failure feedback, local drafts/export, hints, reset, Focus and integrated progress. Totals are now 106 distinct exercises and 155 completion challenges; the quiz bank remains 200 questions.
- Added a local source analyzer and an execution adapter that captures results and post-call inputs without rewriting learner code. Deferred shared execution setup until first use and kept existing output-tab/cancellation behavior.
- Verified alternate solutions, failing starters, incorrect behavior, nested mutation, syntax/runtime errors, timeouts, persistence, responsive layouts and accessibility.

- Full-stack projects now start with real Angular/TypeScript component scaffolding, forms/template setup, dependency injection and a local API service. Supplied route registration handles API dispatch, parameters, query parsing and unmatched routes; all domain handlers remain unimplemented learner work.
- Preserved legacy full-stack source/completions through app.js-to-app.ts filename normalization and mount(api) compatibility. Added real Angular reference solutions, routing tests, migration and negative-grading coverage. No Firebase account, HTTP server or cloud dependency was added.

- Refined ProCode into a connected developer workbench with compact difficulty controls, quieter navigation, clearer challenge typography, consistent editor/output chrome and responsive quiz surfaces. Existing source palettes and all 21 appearance combinations remain intact.
- Added keyboard-accessible Focus mode across practice sections. It expands the work area without remounting the editor, losing drafts/undo history or switching output tabs. Added browser regression coverage and DESIGN.md.

- Added “Practice makes pro” to desktop and mobile branding, retaining the compact tablet navigation.
- Audited catalog coverage and added a skilled prefix-tree exercise and senior LRU-cache/streaming-median exercises in JavaScript and Python. The app now has 100 distinct exercises, 143 completion challenges and 200 quiz questions.
- Added independent reference implementations, edge-case grading, incorrect-answer checks, and boundary-sized model comparisons for the new exercises. Updated the older advanced-exercise progress tests to use the shared catalog total.
- Made the algorithm console and scrollable reference, state and diagnostic blocks keyboard focusable in Firebase, Full stack, Angular and HTML/CSS practice.
- Added PRACTICE_COVERAGE.md with a per-level inventory and explicit learning/runtime limits. App-wide verification is recorded in VERIFICATION.md.

- Added nine Git workflow labs, three per difficulty, spanning GitHub, Azure Repos and Bitbucket: feature PRs, selective staging, stash/hotfix, merge conflicts, rebase, cherry-pick, revert, reflog recovery and force-with-lease.
- Added a bounded local Git interpreter with virtual commits, files, index, branches, remote tracking, stash and reflog. Outcome/history checks accept equivalent supported commands; command errors include line numbers and failed operations remain atomic.
- Added simulated provider PR forms, independent command/review persistence, reset/export, hints, state inspection and stable Console/State/Test results tabs. No real repositories, hosting accounts, shell commands or network operations are used.
- Activated Git workflows navigation, removed the obsolete coming-soon dialog, raised combined progress to 137, and wrapped all nine mobile controls into two rows. Added unit and browser regression coverage.

- Added six meaningful Full stack projects with editable HTML, CSS, client JavaScript and API JavaScript: tasks, guestbook, support tickets, inventory checkout, conflict handling, and retry-safe orders.
- Added opaque previews and dedicated API workers with session-scoped data, local request transport, failure injection, syntax/runtime diagnostics, and interaction/API/data/layout grading. No cloud service or backend installation is required.
- Added independent four-file draft/progress storage, project reset/export, Full stack navigation, and 128-challenge combined progress. All eight navigation controls fit at 320px.
- Added reference implementations, incorrect-answer checks, state/API tests, and browser verification. Shared compiler diagnostics now identify app.js and api.js while preserving Angular behavior.

- Added nine Firebase CLI workflow exercises, three per level, with a bounded local simulator, line-specific errors, virtual state inspection, hints, and state/history-based grading.
- Added Firebase navigation, saved drafts/selections/completions, reset confirmation, JSON export, and combined 122-challenge progress. Run/Finish preserve output-tab selection.
- Added reference workflows, parser/grading/storage tests, and browser coverage. No Firebase account, CLI installation, credentials, network integration, or paid services were added.

- Added a three-level Angular contact CRUD sequence: local state, asynchronous API integration, and conflicting edits/optimistic deletion rollback. Angular now has 21 exercises, seven per level; combined progress totals 113 challenges.
- Added an isolated local Observable contact API with session-scoped records, stable IDs, validation, deterministic latency/failures, version checks, and cloned responses. No backend or network access is required.
- Added CRUD scenarios, reference solutions, API tests, and browser checks for persisted mutations within the preview, draft preservation, retries, conflicts, and rollback.

- Expanded Angular practice from 9 to 18 exercises, six per difficulty. Added conditional views, pipes, editable lists, changing inputs, content projection, dynamic FormArray, OnPush, custom form controls, and subscription cleanup.
- Added boundary/lifecycle scenarios and reference solutions, including alternate valid implementations and plausible incorrect-answer coverage. Existing exercise IDs, drafts, and completions are unchanged; global progress now totals 110 challenges.

- Added nine Angular coding exercises, three per difficulty, covering signals, binding, forms, parent/child communication, shared services, asynchronous search, derived state, and related-field validation.
- Added a local TypeScript compiler and real Angular preview, behavior-based interaction scenarios, console diagnostics, hints, independent draft/export storage, and integrated 101-challenge progress.
- Preserved output-tab selection during Angular Run/Finish, kept prior output during execution, and isolated previews from app storage and network access. Preview instances are destroyed when leaving Angular.
- Lazy-loaded Python editor syntax to offset new navigation/state code. Mobile navigation now has its own row so all six controls fit at 320px.

- Added HTML & CSS practice with 12 exercises across Junior, Skilled, and Senior levels, live previews, HTML/CSS CodeMirror support, viewport selection, Run/Finish grading, hints, and explanations.
- Added script-disabled local previews and DOM/computed-style checks that accept equivalent markup and layouts. Added independent local draft/progress storage, export, and integrated 92-challenge progress.
- Gave browser tests a dedicated configurable port and disabled reuse of occupied ports to prevent running against another local app.

- Changed Move Zeroes and Remove Duplicates to grade the complete returned array/list across different inputs. Updated prompts, starters, hints, examples, and explanations; removed mutation-only runtime adapters in both languages.
- Audited all 40 exercise contracts for implementation restrictions. Preserved saved source and earned progress through the two exercises’ v1-to-v2 migration, with regression coverage for the reported solution and alternate implementations.

- Added a PyCharm preset from installed PyCharm 2026.2.3 Islands Light/Dark UI and editor resources, plus a complete Midnight OLED adaptation. Seven presets now provide 21 appearance combinations.
- Added a read-only local PyCharm importer, explicit token mappings, source hashes, startup preference restoration, and PyCharm theme/persistence/accessibility coverage.

- Added ten junior exercises: Best Time to Buy and Sell Stock, Move Zeroes, Remove Duplicates from a Sorted Array, First Unique Character, Longest Common Prefix, Reverse a Linked List, Merge Two Sorted Lists, Linked List Cycle, Maximum Depth of a Binary Tree, and Same Tree.
- Split practice into Algorithms (31 exercises) and Data structures (9 exercises), with 40 exercises / 80 language challenges overall. Moved existing stack/tree problems into Data structures without changing their IDs or saved drafts.
- Added real linked-list/tree nodes and exercise-aware grading in both runtimes, independent per-section selections, active-section restoration, and backward-compatible workspace migration.

- Removed the Stop button and visible runner-loading text/spinner. Runs retain output silently, with disabled Run/Finish controls, automatic timeout protection, and refresh-to-stop recovery.

- Show syntax/runtime errors, available JavaScript stack frames, Python tracebacks and timeout messages in Console. Group repeated per-check exceptions.
- Keep Run and Finish in stable positions during execution. Preserve output during repeated runs and replace it on completion without tab switching or focus stealing.

- Expanded algorithms to 30 exercises: 14 junior, 8 skilled, and 8 senior, all with JavaScript/Python starters and execution checks.
- Added semantic grading for unordered Three Sum answers and alternate valid topological course orders.
- Added Knowledge quizzes with 200 original four-choice questions across ten topics, 10/20-question sessions, balanced mixed-topic quizzes, shuffled options, scores, explanations, and reference links.
- Added local quiz resume, answer review, last-20 attempt history, JSON export, validation of restored sessions, and an on-demand quiz bundle.

- Made Console the default left output tab and moved Test results to the right. Run and Finish now preserve the selected tab.

- Expanded the catalog to 16 algorithms, with 14 junior exercises including Selection, Bubble, Insertion, and Merge Sort; added category and algorithm selection.
- Persisted the selected challenge per difficulty with backward-compatible workspace loading; progress now reflects the catalog size.
- Added automatic bracket/quote pairing, selection wrapping, closer skipping, paired deletion, syntax-aware nested bracket colors, and active-pair highlighting.
- Added strict array/boolean/string grading and coverage for the new exercises in both JavaScript and Python.

- Renamed the appearance mode to Midnight OLED while preserving saved appearance settings.
- Added full independent Midnight OLED palettes for every preset, including panels, controls, hover/selection states, text, syntax, and feedback colors.
- Replaced the Claude brand approximation with colors from installed Claude desktop 2.26454.0, including CDS UI tokens and its named Claude Light/Dark editor themes.

- Rebuilt appearance presets around GitHub, Microsoft, Cursor, and Codex source colors, with an explicitly adapted Claude brand palette. Added distinct syntax, accents, selection, status colors, and corner treatments.
- Added offline theme generation, source/version manifests, documented contrast adjustments, and a browser check that exercises actual JavaScript/Python highlighting across all 18 variants.

- Removed motivational copy and redundant descriptions across the workspace and dialogs. Retained concise labels, exercise instructions, actionable feedback, and storage warnings.

- Replaced the folded-letter logo with a custom branching P, without braces. The mark serves as the first letter in ProCode and as the standalone favicon and compact navigation logo.
- Documented how current theme presets are constructed and their limitations in `docs/THEMES.md`.

## 0.2.0 - 2026-10-06

### Changed

- Replaced green interface accents with blue across the workspace, feedback, and controls.
- Added a geometric folded-path P logo, matching favicon, and correctly cased ProCode wordmark.
- Introduced semantic color tokens for all UI surfaces, text, borders, and editor syntax.

### Added

- Appearance picker with independent Light, Dark, and true-black Midnight modes.
- ProCode, GitHub, Visual Studio, Codex, Cursor, and Claude inspired palettes, available in all three modes.
- Immediate application and persistent appearance settings that do not modify drafts or editor history.
- Pre-paint appearance restoration and graceful storage failure handling.
- Accessibility checks across all 18 combinations, plus mobile, persistence, and undo-history coverage.
- Dedicated browser-test preview on port 4300, separate from the live app.

## 0.1.0 - 2026-10-06

### Added

- Angular/TypeScript local-first practice workspace with a responsive dark interface and local SVG icons.
- Junior, Skilled, and Senior difficulty selection with Two Sum, Longest Unique Substring, and Minimum Window Substring.
- JavaScript and locally served Python 3.14 execution in disposable isolated browser workers.
- Run/Finish flows with public examples, additional edge cases, equivalent-answer grading, console output, useful failure feedback, and progressive hints.
- Independent automatic drafts, completion tracking, JSON export, and reset confirmation.
- Timeout/cancel recovery, isolated interpreter initialization, capped output, and storage-error handling.
- Unit and production-browser test suites, setup documentation, architecture notes, exercise-authoring guidance, and deployment boundaries.

### Scope and limitations

- Private use with no paid services, accounts, cloud sync, production deployment, or host-side code execution.
- Local grades and additional tests are inspectable, not tamper-proof.
- No hard browser-worker memory quota, package installation, or complexity certification.
- Git, Angular, HTML/CSS, full-stack, Firebase, and quizzes are explicitly planned for later phases.
- Export is available; importing backups is not yet implemented.
