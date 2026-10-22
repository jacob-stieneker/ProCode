import { Difficulty, Language, PracticeArea, areaOf, exercises } from './exercises';
export interface Completion {
  key: string;
  title: string;
  language: Language;
  completedAt: string;
}
export interface Workspace {
  schema: 1;
  difficulty: Difficulty;
  language: Language;
  practiceArea: PracticeArea;
  selectedStructures: Record<Difficulty, string>;
  selectedExercises: Record<Difficulty, string>;
  drafts: Record<string, string>;
  completions: Completion[];
}
const key = 'procode.workspace.v1';
export const freshWorkspace = (): Workspace => ({
  schema: 1,
  difficulty: 'junior',
  language: 'javascript',
  practiceArea: 'algorithms',
  selectedStructures: {
    junior: 'reverse-linked-list',
    skilled: 'daily-temperatures',
    senior: 'tree-max-path',
  },
  selectedExercises: { junior: 'two-sum', skilled: 'longest-substring', senior: 'minimum-window' },
  drafts: {},
  completions: [],
});
export const draftKey = (id: string, version: number, language: Language) =>
  `${id}:v${version}:${language}`;

// Keep existing work and earned credit when these tasks switch to returned arrays.
// Code is preserved verbatim; learners can update older solutions to return the result.
const returnedArrayMigrations = new Map(
  ['move-zeroes', 'remove-sorted-duplicates'].flatMap((id) =>
    (['javascript', 'python'] as Language[]).map(
      (language) => [draftKey(id, 1, language), draftKey(id, 2, language)] as const,
    ),
  ),
);
// A method requirement is a new grading contract. Preserve drafts, but require
// another Finish to earn method-verified credit for these exercises.
const methodDraftMigrations = exercises
  .filter((exercise) => exercise.method)
  .flatMap((exercise) =>
    (['javascript', 'python'] as Language[]).map(
      (language) =>
        [
          draftKey(exercise.id, exercise.version - 1, language),
          draftKey(exercise.id, exercise.version, language),
        ] as const,
    ),
  );
export function readWorkspace(): { data: Workspace; warning: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { data: freshWorkspace(), warning: '' };
    const parsed = JSON.parse(raw);
    if (
      parsed.schema !== 1 ||
      !['junior', 'skilled', 'senior'].includes(parsed.difficulty) ||
      !['javascript', 'python'].includes(parsed.language) ||
      !parsed.drafts ||
      typeof parsed.drafts !== 'object' ||
      Array.isArray(parsed.drafts) ||
      !Array.isArray(parsed.completions)
    )
      throw Error('Invalid saved data');
    const drafts: Record<string, string> = {};
    const savedDrafts = { ...parsed.drafts };
    const validDraft = (value: unknown): value is string =>
      typeof value === 'string' && value.length <= 50000;
    for (const [previous, current] of [...returnedArrayMigrations, ...methodDraftMigrations])
      if (!validDraft(savedDrafts[current]) && validDraft(savedDrafts[previous]))
        savedDrafts[current] = savedDrafts[previous];
    for (const exercise of exercises)
      for (const language of ['javascript', 'python'] as Language[]) {
        const id = draftKey(exercise.id, exercise.version, language);
        if (validDraft(savedDrafts[id])) drafts[id] = savedDrafts[id];
      }
    const seen = new Set<string>();
    const completions = parsed.completions.filter((item: Completion) => {
      if (!item || !['javascript', 'python'].includes(item.language)) return false;
      item.key = returnedArrayMigrations.get(item.key) ?? item.key;
      const exercise = exercises.find((e) => draftKey(e.id, e.version, item.language) === item.key);
      if (
        !exercise ||
        typeof item.completedAt !== 'string' ||
        !Number.isFinite(Date.parse(item.completedAt)) ||
        seen.has(item.key)
      )
        return false;
      item.title = exercise.title;
      seen.add(item.key);
      return true;
    });
    const selected = (area: PracticeArea) =>
      Object.fromEntries(
        (['junior', 'skilled', 'senior'] as Difficulty[]).map((difficulty) => {
          const ids =
            area === 'data-structures'
              ? [parsed.selectedStructures?.[difficulty], parsed.selectedExercises?.[difficulty]]
              : [parsed.selectedExercises?.[difficulty]];
          const fallback =
            area === 'data-structures'
              ? freshWorkspace().selectedStructures[difficulty]
              : freshWorkspace().selectedExercises[difficulty];
          return [
            difficulty,
            ids.find((id) =>
              exercises.some(
                (e) => e.id === id && e.difficulty === difficulty && areaOf(e) === area,
              ),
            ) ?? fallback,
          ];
        }),
      ) as Record<Difficulty, string>;
    const previousExercise = exercises.find(
      (e) => e.id === parsed.selectedExercises?.[parsed.difficulty],
    );
    const practiceArea: PracticeArea =
      parsed.practiceArea === 'data-structures' ||
      (!parsed.practiceArea && previousExercise && areaOf(previousExercise) === 'data-structures')
        ? 'data-structures'
        : 'algorithms';
    return {
      data: {
        schema: 1,
        difficulty: parsed.difficulty,
        language: parsed.language,
        practiceArea,
        selectedExercises: selected('algorithms'),
        selectedStructures: selected('data-structures'),
        drafts,
        completions,
      },
      warning: '',
    };
  } catch {
    return {
      data: freshWorkspace(),
      warning:
        'Saved workspace could not be loaded. Your current work will remain usable, but check browser storage.',
    };
  }
}
export function saveWorkspace(data: Workspace): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
