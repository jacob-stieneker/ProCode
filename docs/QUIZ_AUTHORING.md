# Quiz content and authoring

The initial bank has 200 original questions, reviewed October 7, 2026. It covers JavaScript, Python, HTML, CSS, TypeScript, Angular, Full-stack, Developer vocabulary, Git, and Firebase, with 20 questions per topic. Content emphasizes job-relevant fundamentals, reasoning about code, API boundaries, common mistakes, and practical development workflows. It is not copied from an interview question bank or marketed as an employer's actual assessment.

## Files and contracts

- `src/app/core/quiz/model.ts`: stable topic IDs and question shape.
- `languages.ts`, `frontend.ts`, `engineering.ts`: authored entries.
- `questions.ts`: assembled question bank and ID lookup.
- `session.ts`: sampling, choice shuffling, scoring, and validated persistence.

An entry contains a stable local ID, prompt, exactly four distinct choices, an explanation, and a source URL. The authoring helper lists the correct choice first, then three distractors. The session stores a shuffled permutation, so the displayed answer position varies. Never use choice-position references such as "A and C" or "the previous answer". Updating a correct answer or changing a question's meaning requires a bank-version change and compatible storage handling; do not silently regrade old attempts against changed semantics.

## Editorial checklist

1. State enough context for exactly one defensible answer. Specify browser context, input assumptions, or compiler settings when they affect behavior.
2. Prefer applied scenarios and conceptual understanding over obscure trivia or brand-specific syntax recall.
3. Make distractors reflect plausible misconceptions. Keep choices grammatically parallel and avoid overlapping correct choices, double negatives, and "all of the above".
4. Explain why the answer is correct and clarify the likely misconception. Keep UI text concise and avoid em dashes and emoji.
5. Link an authoritative reference supporting the concept. Do not treat a successful HTTP response as content verification. Review source content for changing APIs and version-specific guidance.
6. Use original wording and examples, not copied certification questions. Do not claim the bank guarantees employment or represents any employer's exact interview process.
7. Preserve at least 20 questions in every supported topic. Run bank/session unit tests and quiz browser tests after changes.

## References and maintenance

Every question includes its own reference link, displayed after submission. Sources include MDN, Python documentation, the TypeScript Handbook, Angular documentation, Git manuals, Firebase documentation, OWASP guidance, PostgreSQL documentation, OpenTelemetry, Microsoft Learn, and Martin Fowler's refactoring site. Modern Angular items use documented inputs, signals, template control flow, DI, reactive forms, and HTTP behavior; Firebase questions distinguish client rules from privileged server access.

The local bank is a checked-in snapshot, not a live synchronized feed. Source links were checked during implementation; sources can move or change later. Use a periodic content review before claiming support for future framework versions. No external request is required to take or grade a quiz.

## Session behavior

A topic quiz samples 10 or 20 distinct questions. Mixed quizzes currently sample one or two from each of the ten topics. Questions and options shuffle at creation and stay stable afterward, including across reloads. All answers are required before submission; results remain reviewable with per-question explanations. Completed history is capped at 20 attempts. JSON export is available, but importing and syncing are not implemented.
