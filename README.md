# ProCode

A private, local-first coding practice app built with Angular and TypeScript. Includes three algorithm difficulty levels, JavaScript and Python execution, behavioral grading, hints, Clean code refactoring exercises, Angular coding exercises, HTML/CSS coding exercises with live previews, Firebase command exercises, multi-file full-stack projects, Git workflow labs, and topic-based knowledge quizzes. Drafts, quiz sessions, and progress are saved on this device.

## Desktop apps

Windows and macOS package the same app, UI and offline practice runtimes. Platform menus, window chrome and keyboard shortcuts follow the operating system.

For **Windows x64**, run `ProCode-0.2.3-windows-x64-setup.exe`. It installs for the current user with desktop and Start menu shortcuts. See [Windows installation and verification](docs/WINDOWS.md), including signing status and saved-work location.

The Apple Silicon desktop build includes the browser engine and all practice runtimes. Open `release/ProCode-0.2.3-arm64.dmg`, drag **ProCode** into **Applications**, and launch it there. No Node.js installation, terminal, account, or internet connection is needed for practice.

This is an ad-hoc signed build for the owner's Mac, without Apple notarization. Desktop progress is stored separately from web-browser progress. Existing browser drafts remain in that browser; export them there before switching. Importing backups is not yet supported.

Build a fresh DMG on an Apple Silicon Mac with `npm run package:mac`. See [desktop packaging](docs/DESKTOP.md) for prerequisites, storage, verification and signing details.

The private [GitHub repository](https://github.com/jacob-stieneker/ProCode) includes a **Desktop installers** workflow that verifies native Windows and Mac packages. Verified installers and checksums are available in the [v0.2.3 release](https://github.com/jacob-stieneker/ProCode/releases/tag/v0.2.3). Source code and private downloads are accessible only to people with repository access.

## Run locally

Requires Node.js 24.15 or later in the Node 24 release line and npm. Dependencies are pinned in `package-lock.json`. No Python installation, Firebase account, API key, or paid service is required.

```sh
npm ci
npm start
```

Open **http://127.0.0.1:4200**. `npm ci` needs internet access to download packages. The postinstall script prepares the pinned Pyodide, TypeScript, and Angular runtimes as generated local assets. After installation, all practice runtimes are served locally; there are no CDN, analytics, or AI requests.

To run the optimized production build locally:

```sh
npm run build
npm run preview
```

The preview binds only to `127.0.0.1:4200`. Use `PORT=4201 npm run preview` if port 4200 is occupied. Use the **same host and port** each time to access the same saved workspace: browser storage is specific to an origin. Keep the local server running while practicing. This is not an offline-installed PWA.

## What's included

**127 distinct exercises, 188 completion challenges, and 200 quiz questions.** Every practice area has content at all three levels. See the [coverage review](docs/PRACTICE_COVERAGE.md) for the breakdown and scope limits.

The algorithm and data structure catalog contains **46 exercises**: **25 junior, 10 skilled, and 11 senior**, all available in JavaScript and Python. Navigation separates **31 Algorithms** exercises from **15 Data structures** exercises. Choose a difficulty and category within either section. Selections are remembered independently by section and difficulty; drafts and earned progress are preserved when exercises move between sections.

| Section         | Difficulty | Category                                                | Exercises                                                                                                                                                         |
| --------------- | ---------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Algorithms      | Junior     | Sorting                                                 | Selection Sort, Bubble Sort, Insertion Sort, Merge Sort                                                                                                           |
| Algorithms      | Junior     | Searching                                               | Linear Search, Binary Search                                                                                                                                      |
| Algorithms      | Junior     | Strings                                                 | Reverse a String, Valid Palindrome, First Unique Character, Longest Common Prefix                                                                                 |
| Algorithms      | Junior     | Arrays & hash maps                                      | Two Sum, Valid Anagram, Contains Duplicate                                                                                                                        |
| Algorithms      | Junior     | Arrays & two pointers                                   | Move Zeroes, Remove Duplicates from a Sorted Array                                                                                                                |
| Algorithms      | Junior     | Greedy scans & dynamic programming                      | Best Time to Buy and Sell Stock, Maximum Subarray, Climbing Stairs                                                                                                |
| Data structures | Junior     | Stacks                                                  | Valid Parentheses, Build a Min Stack                                                                                                                              |
| Data structures | Junior     | Linked lists                                            | Reverse a Linked List, Merge Two Sorted Lists, Linked List Cycle                                                                                                  |
| Data structures | Junior     | Trees & recursion                                       | Maximum Depth of a Binary Tree, Same Tree                                                                                                                         |
| Algorithms      | Skilled    | Strings, intervals, arrays, graphs, dynamic programming | Longest Unique Substring, Merge Intervals, Product Except Self, Three Sum, Number of Islands, Coin Change                                                         |
| Data structures | Skilled    | Monotonic stacks, trees & tries                         | Daily Temperatures, Binary Tree Level Order, Implement a Prefix Tree, Validate a Binary Search Tree                                                               |
| Algorithms      | Senior     | Windows, dynamic programming, arrays, graphs            | Minimum Window Substring, Edit Distance, Trapping Rain Water, Sliding Window Maximum, Median of Two Sorted Arrays, Course Schedule Order, Dijkstra Shortest Paths |
| Data structures | Senior     | Trees, caches & heaps                                   | Binary Tree Maximum Path Sum, Build an LRU Cache, Track a Streaming Median, Merge K Sorted Lists                                                                  |

The sections reflect each exercise's primary focus. Algorithms still use data structures, and data structure exercises still require algorithms. Junior linked-list and tree exercises receive real node objects, with `ListNode` and `TreeNode` constructors supplied. Examples use arrays for lists and nested `[value, left, right]` trees; the runner builds nodes for each check. Move Zeroes and Remove Duplicates grade the entire returned array/list across varied inputs. New arrays and modified originals are both accepted when returned; no exercise requires mutating its input. The advanced tree exercises, including Validate a Binary Search Tree, retain their documented nested-array function contracts. Merge K Sorted Lists uses arrays as sorted streams, with all duplicates preserved.

- CodeMirror editor with syntax highlighting, indentation, automatic bracket/quote pairing, nested bracket colors, cursor-based pair highlighting, and language-specific starter code.
- Independent drafts for every exercise version and language, saved on each edit.
- **Run:** evaluates the three public examples without awarding completion.
- **Finish:** evaluates examples plus additional edge cases (10 to 18 total checks per exercise), accepts equivalent valid results, and records a completion per exercise/language. Exercises with a required method also need a verified method result.
- Failure details include input, expected behavior, actual output, and a targeted hint.
- Three progressively revealed hints for each challenge; pattern explanation after completion.
- Console opens by default on the left, with Test results on the right. Run and Finish preserve the tab you selected, including for method checks. Switch tabs manually to inspect output or grading feedback.
- Console displays printed output and syntax/runtime errors, with available JavaScript stack frames and Python tracebacks. Repeated errors are grouped by affected check count.
- Run and Finish retain the last output while running, then replace it without moving focus. Run and Finish stay in place and are disabled during execution, with no loading indicator or Stop control.
- Infinite loops stop automatically after four seconds of execution. Refreshing the page also stops execution and restores your saved draft. Reset requires confirmation.
- Progress dialog and separate JSON exports for algorithm, Clean code, Angular, HTML/CSS, Firebase, full-stack, and Git drafts/progress. Restore/import is not implemented in Phase 1.
- Responsive desktop, tablet, and mobile layouts, keyboard controls, focus indicators, and accessible dialogs.

The additional checks are available in the downloaded application and are inspectable. This is personal practice, **not tamper-proof assessment**. Runtime is capped to prevent ordinary infinite loops, but algorithmic complexity is not inferred or automatically certified. Selection, bubble, insertion and merge sort; linear and binary search; Dijkstra; prefix trees; and breadth-first level traversal require both correct output and method evidence. A method mismatch or unverified implementation keeps correct output checks passed and withholds completion. Other exercises retain their documented choice of approaches. See [method grading](docs/METHOD_GRADING.md) for coverage, supported variations and limitations.

## Clean code practice

Choose **Clean code**, a difficulty, and JavaScript or Python. Fifteen exercises start with working but poorly structured code:

| Difficulty | Exercises                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Junior     | Name the Order Total; Flatten Access Checks; Refactor Registration Validation; Clarify Pagination Boundaries; Name Retry Timing Rules       |
| Skilled    | Name the Shipping Rules; Remove Hidden Mutation; Make Discounts Immutable; Normalize Tags Without Mutation; Flatten Coupon Validation       |
| Senior     | Separate Invoice Responsibilities; Centralize Delivery Rules; Separate a Ticket Report; Decompose a Log Report; Centralize Role Permissions |

Refactor to meet the prompt while preserving the function's behavior. Run checks public examples and cleanup rules; Finish adds boundary cases and awards credit only when all checks pass. Behavior and Cleanup results are labeled separately, with specific feedback. Equivalent implementations are accepted when they satisfy both parts of the contract.

Cleanup checks parse JavaScript or Python source for the explicitly listed constraints: binding-name length, decision nesting, policy literals and reachable helper functions. Input-preservation exercises also compare caller data before and after execution, including nested records. These checks cannot judge every aspect of readability or design; a longer name is not automatically a meaningful one. Comments and formatting alone do not satisfy structural checks.

The editor, Console/Test results tabs, hints, Focus mode, diagnostics and timeout recovery work as in Algorithms. Drafts, selections and completions are stored independently in `procode.clean-practice.v1`, including separate JavaScript/Python drafts. Export Clean code work from its toolbar or My progress. All analysis and execution stay local, without an AI service or account.

## Angular practice

Choose **Angular**, a difficulty, and an exercise. Twenty-one exercises provide incorrect or incomplete standalone components to repair:

| Difficulty | Exercises                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Junior     | Repair a Counter, Filter a Course List, Bind a Profile Form, Build a Conditional Details Panel, Create a Summary Pipe, Manage an Editable Task List, Build a Contact Manager                                             |
| Skilled    | Validate a Registration Form, Connect Parent and Child, Share State Through a Service, Respond to Changing Inputs, Compose a Reusable Card, Build a Dynamic Skills Form, Connect CRUD to a Practice API                  |
| Senior     | Handle Asynchronous Search, Keep Derived State Consistent, Validate Related Form Fields, Repair OnPush List Updates, Connect a Custom Form Control, Clean Up Component Subscriptions, Handle CRUD Conflicts and Rollback |

- Edit `component.ts`, including its inline template and any related components/services. The supplied `data-testid` attributes identify controls for testing.
- **Run** compiles TypeScript, checks three scenarios, and refreshes an interactive Angular preview. **Finish** checks all six to twenty scenarios, including repeated interactions and boundary conditions, before awarding completion. Equivalent working implementations are accepted.
- Console opens first. Preview and Test results remain selected when you rerun; compilation/template/runtime errors appear in Console. Failed checks identify the affected control, expected behavior, actual result, and a hint.
- Angular, Forms, RxJS, and the TypeScript compiler run locally. The asynchronous-search exercise uses a supplied deterministic Observable service, including delayed responses and failures, without real network requests.
- Drafts, difficulty/exercise selections, and completions are stored in `procode.angular-practice.v1`. Export Angular work separately; reset confirms before replacing the current draft and preserves earned credit. Global progress totals 188 challenges.
- The preview uses a separate light document, independent of workspace themes, and is refreshed on Run/Finish. Leaving Angular removes the running preview. No package installation, external files, or network access is available inside exercises.

The expanded collection covers interview-relevant fundamentals and debugging patterns: conditional rendering, pipes, identity in lists, input lifecycle, projection, dynamic reactive forms, OnPush updates, ControlValueAccessor, and subscription lifetime. Difficulty labels describe the learning progression, not a guarantee of what a particular employer asks.

These are single-file learning exercises, not a complete Angular IDE. TypeScript syntax diagnostics and Angular runtime/template errors are supported; full project type checking and AOT template type checking are not. Grading tests observable behavior, not exact source. Ordinary loops receive execution guards, but this browser runtime has no hard CPU/memory isolation for hostile code. Use it for your own practice.

### Contact CRUD practice

Three exercises build a complete contact manager: Junior uses component state; Skilled connects create/read/update/delete to `PracticeContactsApi`; Senior adds version conflicts and optimistic deletion with rollback. All include separate edit drafts, validation, canceling, and stable record identity. The asynchronous exercises add Loading/Ready/Error states, failed requests, retry behavior, and reload checks. Senior also handles Conflict.

The supplied API is an injected local Observable service, not an HTTP endpoint or Firebase backend. Records persist across **Reload records** within one preview, but Run/Finish, leaving the section, or refreshing ProCode starts fresh practice data. Your solution code and earned completion still save normally. Failure controls deliberately reject the next matching request. Senior's **Change Ada elsewhere** simulates another editor to test version handling. No backend, account, network permission, or real contact data is required.

## HTML & CSS practice

Choose **HTML & CSS**, then a topic, difficulty, and exercise. The collection contains 18 exercises, three per topic at each level:

| Difficulty | HTML                                                                                 | CSS                                                                   |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Junior     | Semantic Profile, Contact Form, Accessible Search Form                               | Card Box Model, Button States, Center an Empty State                  |
| Skilled    | Accessible Data Table, Grouped Registration Form, Shipping Form Constraints          | Responsive Card Layout, Responsive Navigation, Sticky Results Header  |
| Senior     | Accessible Document Navigation, Native FAQ and Figure, Accessible Form Error Summary | Adaptive Dashboard, Resilient Content Layout, Resilient Settings Form |

- Write HTML in `index.html`, or CSS in `styles.css` against the exercise's provided HTML. Expand **Provided HTML** to inspect the fixture.
- The live preview updates after edits. Choose a 360px or 960px viewport; wide previews scroll within their panel on smaller screens.
- **Run** checks the first three requirements. **Finish** checks all six or seven requirements, including the narrow viewport, and records completion only when all pass.
- Checks use DOM semantics, native validation, computed styles, and rendered geometry. Different valid markup, selectors, and layout techniques can pass. Failed checks show targeted hints; **Check coverage** lists every requirement being tested.
- Drafts, topic/difficulty selections, and earned completions are saved separately in `procode.web-practice.v1`. The progress dialog combines 92 algorithm/data-structure language challenges, 30 Clean code language challenges, 18 web exercises, 21 Angular exercises, 9 Firebase exercises, 9 full-stack projects, and 9 Git workflows for a total of 188. Export HTML/CSS work separately; reset affects only the current draft.
- The workspace supports all appearance presets. The preview is a separate, light document so workspace colors do not change the exercise result. Scripts, submissions, remote assets, embedded documents, and inline HTML style elements are disabled. Use data PNG/JPEG/GIF/WebP images where requested. Internal links scroll to their target locally.

This collection teaches observable browser behavior. It is not a complete HTML validator, WCAG certification, or screenshot-matching assessment. Browsers repair malformed HTML and ignore invalid CSS; a failed requirement is reported when the resulting document does not meet the exercise. Combined HTML/CSS/JavaScript and API projects are available in Full stack.

## Git workflow practice

Choose **Git workflows**, a difficulty, and an exercise. Write commands, prepare the simulated pull request with its title/source/target, then Run or Finish. Run inspects the outcome; Finish records completion only when every check passes. Console, State, and Test results keep your selected tab. State shows the initial repository before running and the resulting repository afterward.

| Level   | GitHub                                                 | Azure Repos                                      | Bitbucket                                                  |
| ------- | ------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------- |
| Junior  | Feature branch, commit, push and PR                    | Selective staging without publishing debug files | Stash unfinished work, publish a hotfix, restore the draft |
| Skilled | Resolve a merge conflict and preserve both histories   | Rebase an unpublished feature onto updated main  | Cherry-pick a fix without unrelated experimental work      |
| Senior  | Revert a released regression without losing later work | Recover a lost commit through the reflog         | Amend an owned topic branch and push with a lease          |

Grading evaluates file snapshots, commits, ancestry, published branches, retained work, push history and pull-request fields. Equivalent supported command sequences can pass. Failed commands report their line, stop the attempt and retain the preceding successful state. Every attempt starts from a fresh copy of its fixture.

This is an explicitly labeled **local Git simulator**, not a terminal or hosting integration. It does not run the Git executable, modify real files/repositories, send pull requests or require credentials. The fixtures assume an already cloned repository, configured identity, an `origin` remote, and protected `main`. The pull-request form teaches each provider's branch terminology, not hosted permissions, approvals, CI policies or merge checks.

The in-app Command reference lists the supported subset: status/diff/log/show/reflog, branch/switch/checkout, add/restore/commit, stash, fetch, merge, rebase, cherry-pick, revert, reset and push. `practice write FILE "TEXT"` is a ProCode-only helper for editing virtual file content. Commit IDs such as `c2` are fixture identifiers, and console formatting is simplified. Merges compare whole-file snapshots. Rebase, cherry-pick and stash conflict continuation, interactive editors, shell syntax, partial hashes, clone and arbitrary commands are unsupported. Switching to a different commit or restoring a stash requires a clean working tree in this subset. The interpreter allows at most 80 commands and 50,000 source characters.

Draft commands, pull-request fields, selections and completions persist in `procode.git-practice.v1`. Export creates `procode-git.json`; resetting requires a choice and resets the current exercise's commands and review fields while preserving earned credit. Combined progress now totals 188 challenges. Mobile navigation wraps into two rows so every section remains accessible at 320px.

Command and review guidance uses the official [Git documentation](https://git-scm.com/docs), [GitHub pull-request guide](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request), [Azure Repos pull-request guide](https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-requests?view=azure-devops), and [Bitbucket Cloud pull-request guide](https://support.atlassian.com/bitbucket-cloud/docs/create-a-pull-request/).

## Full-stack projects

Choose **Full stack**, a difficulty, and a project. Each project has four editable files: `index.html`, `styles.css`, `app.ts`, and `api.js`. The client uses real Angular with a standalone TypeScript component; the API code executes in a separate local worker. Build both sides of a local request workflow using the supplied API contract and initial data.

| Difficulty | Projects                                                  | Skills                                                                                                                                     |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Junior     | Task Board; Guestbook; Searchable Catalog                 | API search, URL encoding, empty states, CRUD, validation, text rendering, state after refetch, retrying failed saves                       |
| Skilled    | Support Desk; Inventory Checkout; Server-side Pagination  | Stable pagination, total counts, query validation, query filters, status updates, trusted prices, stock validation, atomic rejected writes |
| Senior     | Conflicting Edits; Retry-safe Orders; Atomic Bulk Updates | Whole-batch validation, atomic failure, optimistic concurrency, preserving drafts, idempotency keys, lost responses, rapid submissions     |

- Supplied scaffolding: Angular startup, component/template wiring, CommonModule/FormsModule imports, dependency injection, a PracticeApi request service, API method/path routing, decoded path parameters, query parsing and a 404 fallback. Registered handlers start at 501 Not implemented.
- Your work: component state, template bindings, event handlers, loading and error recovery, domain validation, CRUD/data mutations, conflict handling and retry behavior. Nothing automatically completes these goals.
- Edit each file with syntax highlighting and bracket assistance. Complete the starter heading/labels and responsive CSS as well as the TypeScript/API code. Required `data-testid` hooks let checks interact with your controls.
- **Run** evaluates the first three scenarios and creates an interactive preview. **Finish** evaluates every scenario before recording completion. Tests include direct API calls and data-store assertions, so a UI that only appears to save will fail. Equivalent working implementations are accepted.
- **Console**, **Preview**, and **Test results** retain your selected tab during repeated execution. Console shows client/API logs, request statuses, compiler errors, and execution errors. Failed checks include the expected result and a targeted hint.
- Preview controls **Fail next request** and **Lose next response** help test recovery. The latter lets a request reach the API, then rejects its reply, modeling an uncertain write outcome. Select it before placing an order to practice retrying safely.
- Each scenario and new preview starts with fresh API data. Reload inside your project refetches its current data; Run/Finish, navigation away, and page refresh end that data session. All four source files and earned credit are saved independently in `procode.fullstack-practice.v1`. Reset confirms before replacing the entire starter project; JSON export is available.

The API handler runs in a dedicated worker inside an opaque-origin preview. `api.request(method, path, body)` uses local messages with a short asynchronous delay; it is not HTTP, Node/Express, or the Firebase SDK. The supplied mutable `db` is an in-memory practice data store. There are no accounts, credentials, cloud requests, payments, or costs. This teaches client/API contracts and business logic; real authentication, database transactions, distributed concurrency, deployment, and production operation remain outside this runtime. Requests are serialized, so concurrency lessons cover version conflicts and repeated requests, not database isolation between parallel processes.

The starter component imports `projectTemplate` from `@procode/fullstack` to use `index.html` as its Angular template. Inject `PracticeApi` from the same module. Angular core/common/forms, RxJS and RxJS interop are available locally. Use signals for asynchronous component state updates. API code may import `createRouter` from `@procode/server`; this is a small ProCode helper, not Express. External resources and arbitrary imports are blocked. Legacy `mount(api)` clients remain supported with sanitized plain HTML. The existing local compiler instruments ordinary loops and recursion, API requests time out, and leaving the section removes the preview. Client DOM code still shares the browser rendering process; this is a personal coding lab, not hard CPU/memory isolation for hostile submissions. TypeScript/JavaScript syntax diagnostics and Angular template errors are supported, not full project type checking. Grading is finite and inspectable, not a security certification.

Existing `app.js` drafts are loaded under `app.ts` without rewriting their source or removing completion. New and reset projects use the Angular scaffold. Use Export work to keep a copy of your project before resetting it.

## Firebase command practice

Choose **Firebase**, a difficulty, and an exercise. Nine local CLI workflows are available, three per level:

| Difficulty | Exercises                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Junior     | Connect a Firebase Workspace; Initialize Hosting and Firestore; Start Local Auth and Firestore   |
| Skilled    | Deploy Only Hosting to Staging; Create a Hosting Preview Channel; Reuse Emulator Seed Data       |
| Senior     | Run Rules Tests in Emulators; Release Firestore Rules and Indexes; Deploy a Named Hosting Target |

Enter one command per line. **Run** evaluates the workflow; **Finish** records completion when every requirement passes. Console opens first, with virtual **State** and **Test results** beside it. Repeated execution keeps the selected tab and starts from fresh fixture state. Cmd/Ctrl+Enter runs commands. Hints, reset confirmation, independently saved drafts/selections/progress (`procode.firebase-practice.v1`), and JSON export are included.

Grading checks state and release history rather than exact command strings. Project aliases/IDs, supported flag ordering, quotes, equals syntax, and equivalent deployment scopes are accepted. Wrong-project and overly broad releases still fail if followed by a correct release. Errors include the source line and stop the attempt.

This is a **bounded local simulator**, not an installed Firebase CLI or Emulator Suite. Authentication, files, previews, deploys, and the fixture rules-test script are simulated. It never starts a shell, runs npm scripts, opens accounts, contacts Firebase, writes project files, or incurs charges. Interactive initialization answers are supplied by fixtures. Only the documented commands, products, paths, and options are supported. This collection teaches CLI workflows, not SDK CRUD or writing/verifying security rules. No real secrets are needed.

Command contracts were checked against the [Firebase CLI reference](https://firebase.google.com/docs/cli), [Emulator Suite configuration](https://firebase.google.com/docs/emulator-suite/install_and_configure), [Hosting preview workflow](https://firebase.google.com/docs/hosting/test-preview-deploy), and [deploy targets](https://firebase.google.com/docs/cli/targets).

## Knowledge quizzes

Choose **Knowledge quizzes** from navigation. The local question bank contains **200 original questions**, with **20 per topic**: JavaScript, Python, HTML, CSS, TypeScript, Angular, Full-stack, Developer vocabulary, Git, and Firebase.

- Select a topic or **All topics**, then choose **10 or 20 questions**. Mixed quizzes include one or two questions per topic respectively.
- Questions and answer positions are shuffled without repeats in a session. Each question has four options and exactly one correct answer.
- Move with Previous, Next, or the numbered question navigation. Answers stay editable until submission; all questions must be answered before submitting.
- Results show a score and percentage, with expandable reviews containing your answer, the correct answer, an explanation, and a reference link.
- Unfinished quizzes resume after reload with the same questions, choices, answers, and position. The last 20 completed quizzes are available for review. Replacing an unfinished quiz asks for confirmation.
- Quiz data is stored separately from algorithm drafts. Export quizzes as JSON from Topics & history. Import and cross-device sync are not implemented.
- The quiz UI and question bank load on demand. Quiz-taking requires no external service; references open externally only when clicked.

Question content spans fundamentals and practical application, not a formal role-level certification. See [quiz authoring and source guidance](docs/QUIZ_AUTHORING.md). Topic banks currently contain 20 questions, so repeat attempts can repeat content even though order varies.

## Workspace

Compact difficulty controls and a connected two-pane workbench keep instructions, code and output together. **Focus** in the top bar expands the working area by hiding the instructions. Your editor, undo history, draft and output-tab selection stay intact. Select **Exit focus** to restore the instructions. Focus is available in every practice section, persists while navigating within the session, and resets on reload. On mobile, look for the corner-shaped Focus icon beside Appearance.

See [interface design](DESIGN.md) for layout and interaction conventions.

## Appearance

Use **Appearance** in the top bar to choose a display mode and workspace palette independently:

- **Light**, **Dark**, or **Midnight OLED**. Midnight OLED uses true black for the canvas, sidebar, and editor.
- **ProCode**, **GitHub**, **Visual Studio**, **Codex**, **Cursor**, **Claude**, or **PyCharm** palettes.

All 21 combinations update the workspace, dialogs, controls, and JavaScript, Python, TypeScript, HTML, and CSS syntax together. ProCode stays blue; named presets use source-specific colors. GitHub, Microsoft, Cursor, Codex, Claude, and PyCharm use mapped vendor theme colors. PyCharm uses the installed 2026.2.3 Islands UI palettes and editor schemes. Claude uses the installed desktop app’s CDS palette and named Claude Light/Dark editor themes. Each Midnight OLED preset has a complete OLED-oriented palette, including near-black panels, dark controls and status fills, softer text, and separately tuned syntax. See [theme provenance](docs/THEMES.md) for versions, sources, and accessibility adjustments. Your choice applies immediately and is saved separately from drafts in `procode.appearance.v1`. A small startup script restores it before the first paint. If storage is blocked, you can still change appearance for the current session. A custom branching P replaces the first letter of the ProCode wordmark in the sidebar and stands alone in the favicon and compact navigation.

## Editor controls

- Control/Command + Enter: run examples.
- Typing `(`, `[`, or `{`: insert the matching closer. Typing that closer skips over it. Quotes pair according to the language.
- Backspace inside an empty auto-inserted pair: remove both characters. Typing an opener with text selected wraps the selection.
- Nested brackets cycle through three theme-aware syntax colors; matching pairs at the cursor also receive an outline. Brackets inside comments and string contents do not affect nesting.
- Tab: indent code.
- Escape: leave the editor and focus Run.
- Reset: confirm before replacing only the current draft with starter code.

Algorithm and data structure solutions must expose the named synchronous function from the starter code and return JSON-compatible data. Inputs use ASCII strings where specified so JavaScript and Python indexing agree. External packages, package installation, top-level imports in JavaScript, DOM access, and network-dependent solutions are outside this phase.

## Verification

```sh
npm test
npm run test:crud-api
npm run test:fullstack-router
npm run build
npm exec playwright install chromium
npm run test:e2e
```

Browser tests use the **production build**, start an isolated localhost preview, and cover the algorithm/data-structure challenge/language combinations and all 18 HTML/CSS exercises, all 21 Angular exercises, fifteen Clean code exercises in both languages, nine Full-stack projects, Run vs Finish, wrong solutions, syntax/runtime errors, timeout recovery, refresh recovery, storage, hints, reset, isolation, responsive widths, and all 21 appearance combinations. Tests start their own localhost server on port 4317 and refuse to reuse an occupied port. Override it with PROCODE_TEST_PORT if necessary. Browser installation is a one-time development prerequisite. Screenshots and traces are written to ignored `test-results/` and `playwright-report/` directories.

## Project structure

- `src/app/app.*`: workspace UI and application state.
- `src/app/components/`: reusable code editor and SVG icons.
- `src/app/core/exercises.ts`, `junior-exercises.ts`, and `advanced-exercises.ts`: versioned catalog and behavioral graders.
- `src/app/core/angular/`: Angular catalog, scenario contracts, isolated runner, and local persistence.
- `src/app/components/angular-practice.*`: deferred Angular editor, preview, console, and result interface.
- `scripts/prepare-angular.mjs` and `scripts/angular-runtime/`: local TypeScript transpiler and bundled Angular runtime.
- `src/app/core/web/`: versioned HTML/CSS catalog, DOM/style checks, isolated preview, and local persistence.
- `src/app/components/web-practice.*`: deferred web-practice interface.
- `src/app/core/git/`: versioned workflow catalog, bounded Git model/interpreter, behavioral grading and saved work.
- `src/app/components/git-practice.*`: deferred commands, simulated PR form, state, console and checks.
- `src/app/core/quiz/`: question bank, scoring, shuffling, and local session storage.
- `src/app/components/quiz.*`: deferred quiz interface and result review.
- `src/app/core/runner.ts`: disposable execution lifecycle and isolation boundary.
- `src/app/core/storage.ts`: schema-validated local persistence.
- `src/app/core/download.ts`: shared JSON download and blob URL cleanup for practice and quiz exports.
- `public/runtime/executor.js`: JS/Python execution, input-node construction, and returned-output adapters inside the worker.
- `src/app/core/junior-patterns.ts`: ten new junior array, string, linked-list, and tree exercises.
- `scripts/prepare-runtime.mjs`: copies pinned interpreter assets after installation.
- `scripts/serve.mjs`: loopback-only production preview server.
- `src/app/core/structure-exercises.ts`: prefix-tree, LRU-cache and streaming-median exercises with JavaScript/Python contracts.
- `docs/PRACTICE_COVERAGE.md`: catalog counts, learning coverage and future expansion priorities.
- `docs/ARCHITECTURE.md`: execution, storage, and future service boundaries.
- `docs/EXERCISE_AUTHORING.md`: exercise contracts and validation guidance.
- `docs/DEPLOYMENT.md`: local setup and future hosting requirements.
- `CHANGELOG.md`: completed work and known limitations.

All practice sections now contain exercises. Accounts, cloud sync, real Git/provider integrations and hosted execution remain future work. No services or infrastructure have been provisioned.

### Interface copy

“Practice makes pro” appears beneath the desktop wordmark and beside it on mobile. It is hidden in the compact tablet icon rail. The interface uses concise labels and status messages. Exercise requirements, examples, hints, grading explanations, and warnings remain available; promotional headings and motivational filler are omitted.
