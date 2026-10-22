import { downloadJson } from './core/download';
import { CleanPractice } from './components/clean-practice';
import { CleanWorkspace } from './core/clean/state';
import { cleanExerciseInfo } from './core/clean/model';
import { GitPractice } from './components/git-practice';
import { GitWorkspace } from './core/git/state';
import { gitExerciseInfo, gitKey } from './core/git/model';
import { FullstackPractice } from './components/fullstack-practice';
import { FullstackWorkspace } from './core/fullstack/state';
import { fullstackExerciseInfo, fullstackKey } from './core/fullstack/model';
import { FirebasePractice } from './components/firebase-practice';
import { FirebaseWorkspace } from './core/firebase/state';
import { firebaseExerciseInfo, firebaseKey } from './core/firebase/model';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from './components/icon';
import { Logo } from './components/logo';
import { Appearance } from './core/appearance';
import { Quiz } from './components/quiz';
import { WebPractice } from './components/web-practice';
import { AngularPractice } from './components/angular-practice';
import { AngularWorkspace } from './core/angular/state';
import { angularExerciseInfo, angularKey } from './core/angular/model';
import { WebWorkspace } from './core/web/state';
import { webExerciseInfo, webKey } from './core/web/model';
import { Editor } from './components/editor';
import {
  accepts,
  areaOf,
  Check,
  Difficulty,
  exercises,
  Language,
  levels,
  PracticeArea,
} from './core/exercises';
import { Runner } from './core/runner';
import type { MethodResult } from './core/method-policy';
import { draftKey, readWorkspace, saveWorkspace } from './core/storage';
interface Result {
  check: Check;
  pass: boolean;
  actual?: unknown;
  error?: string;
  extra: boolean;
}
@Component({
  selector: 'app-root',
  imports: [
    Icon,
    Logo,
    Editor,
    DatePipe,
    FormsModule,
    Quiz,
    WebPractice,
    AngularPractice,
    FirebasePractice,
    FullstackPractice,
    GitPractice,
    CleanPractice,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css', './appearance.css'],
})
export class App {
  readonly appearance = inject(Appearance);
  readonly focusMode = signal(false);
  readonly clean = inject(CleanWorkspace);
  readonly cleanExerciseInfo = cleanExerciseInfo;
  readonly cleanCompletions = computed(() =>
    this.clean.state().completions.map((completion) => ({
      ...completion,
      title: cleanExerciseInfo.find((info) => completion.key.startsWith(`${info.id}:`))?.title,
      language: completion.key.endsWith(':python') ? 'Python' : 'JavaScript',
    })),
  );
  readonly git = inject(GitWorkspace);
  readonly gitExerciseInfo = gitExerciseInfo;
  readonly gitKey = gitKey;
  readonly fullstack = inject(FullstackWorkspace);
  readonly fullstackExerciseInfo = fullstackExerciseInfo;
  readonly fullstackKey = fullstackKey;
  readonly firebase = inject(FirebaseWorkspace);
  readonly firebaseExerciseInfo = firebaseExerciseInfo;
  readonly firebaseKey = firebaseKey;
  readonly angular = inject(AngularWorkspace);
  readonly angularExerciseInfo = angularExerciseInfo;
  readonly angularKey = angularKey;
  readonly web = inject(WebWorkspace);
  readonly webExerciseInfo = webExerciseInfo;
  readonly webKey = webKey;
  private runner = inject(Runner);
  private loaded = readWorkspace();
  section = signal<
    PracticeArea | 'quizzes' | 'web' | 'angular' | 'firebase' | 'fullstack' | 'git' | 'clean'
  >(
    this.clean.state().active
      ? 'clean'
      : this.git.state().active
        ? 'git'
        : this.fullstack.state().active
          ? 'fullstack'
          : this.firebase.state().active
            ? 'firebase'
            : this.angular.state().active
              ? 'angular'
              : this.web.state().active
                ? 'web'
                : this.loaded.data.practiceArea,
  );
  workspace = signal(this.loaded.data);
  storageWarning = signal(this.loaded.warning);
  difficulty = computed(() => this.workspace().difficulty);
  language = computed(() => this.workspace().language);
  readonly exerciseCount = exercises.filter((e) => areaOf(e) === 'algorithms').length;
  readonly structureCount = exercises.filter((e) => areaOf(e) === 'data-structures').length;
  readonly challengeCount =
    exercises.length * 2 +
    webExerciseInfo.length +
    angularExerciseInfo.length +
    firebaseExerciseInfo.length +
    fullstackExerciseInfo.length +
    gitExerciseInfo.length +
    cleanExerciseInfo.length * 2;
  category = signal('all');
  levelExercises = computed(() =>
    exercises.filter(
      (e) => e.difficulty === this.difficulty() && areaOf(e) === this.workspace().practiceArea,
    ),
  );
  categories = computed(() => [...new Set(this.levelExercises().map((e) => e.category))]);
  filteredExercises = computed(() =>
    this.levelExercises().filter(
      (e) => this.category() === 'all' || e.category === this.category(),
    ),
  );
  exercise = computed(
    () =>
      this.levelExercises().find(
        (e) =>
          e.id ===
          (this.workspace().practiceArea === 'data-structures'
            ? this.workspace().selectedStructures
            : this.workspace().selectedExercises)[this.difficulty()],
      ) ?? this.levelExercises()[0],
  );
  currentKey = computed(() =>
    draftKey(this.exercise().id, this.exercise().version, this.language()),
  );
  code = computed(
    () => this.workspace().drafts[this.currentKey()] ?? this.exercise().starter[this.language()],
  );
  completed = computed(() => this.workspace().completions.some((c) => c.key === this.currentKey()));
  completionCount = computed(
    () =>
      this.workspace().completions.length +
      this.web.state().completions.length +
      this.angular.state().completions.length +
      this.firebase.state().completions.length +
      this.fullstack.state().completions.length +
      this.git.state().completions.length +
      this.clean.state().completions.length,
  );
  readonly levels = levels;
  tab = signal<'problem' | 'hints'>('problem');
  resultsTab = signal<'tests' | 'console'>('console');
  revealedHints = signal(0);
  results = signal<Result[]>([]);
  methodResult = signal<MethodResult | undefined>(undefined);
  logs = signal<string[]>([]);
  error = signal('');
  consoleErrors = computed(() => {
    if (this.error()) return [{ message: this.error(), checks: 0 }];
    const errors = new Map<string, number>();
    for (const result of this.results()) {
      if (result.error) errors.set(result.error, (errors.get(result.error) ?? 0) + 1);
    }
    return [...errors].map(([message, checks]) => ({ message, checks }));
  });
  busy = signal(false);
  mode = signal<'run' | 'finish' | null>(null);
  resultSummary = computed(
    () =>
      `${this.results().filter((r) => r.pass).length} of ${this.results().length} checks passed`,
  );
  outputPassed = computed(() => this.results().length > 0 && this.results().every((r) => r.pass));
  allPassed = computed(
    () =>
      this.outputPassed() &&
      (!this.exercise().method || this.methodResult()?.status === 'verified'),
  );
  dialogType = signal<'progress' | 'reset' | 'appearance'>('progress');
  expandedResult = signal(-1);
  @ViewChild('modal') modal!: ElementRef<HTMLDialogElement>;
  private executionId = 0;
  persist() {
    const saved = saveWorkspace(this.workspace());
    this.storageWarning.set(
      saved
        ? ''
        : 'Browser storage is unavailable or full. Export your work before closing this tab.',
    );
  }
  updateCode(code: string) {
    if (code === this.code()) return;
    this.workspace.update((w) => ({ ...w, drafts: { ...w.drafts, [this.currentKey()]: code } }));
    this.persist();
    this.clearResults();
  }
  setSection(
    section:
      PracticeArea | 'quizzes' | 'web' | 'angular' | 'firebase' | 'fullstack' | 'git' | 'clean',
  ) {
    if (this.busy()) return;
    this.clean.update((s) => ({ ...s, active: section === 'clean' }));
    this.git.update((s) => ({ ...s, active: section === 'git' }));
    this.fullstack.update((s) => ({ ...s, active: section === 'fullstack' }));
    this.firebase.update((s) => ({ ...s, active: section === 'firebase' }));
    this.web.update((s) => ({ ...s, active: section === 'web' }));
    this.angular.update((s) => ({ ...s, active: section === 'angular' }));
    if (
      section !== 'clean' &&
      section !== 'git' &&
      section !== 'fullstack' &&
      section !== 'firebase' &&
      section !== 'angular' &&
      section !== 'web' &&
      section !== 'quizzes' &&
      section !== this.workspace().practiceArea
    ) {
      this.workspace.update((w) => ({ ...w, practiceArea: section }));
      this.category.set('all');
      this.clearResults();
      this.revealedHints.set(0);
      this.tab.set('problem');
      this.persist();
    }
    this.section.set(section);
  }
  setDifficulty(difficulty: Difficulty) {
    if (this.busy() || difficulty === this.difficulty()) return;
    this.category.set('all');
    this.workspace.update((w) => ({ ...w, difficulty }));
    this.persist();
    this.clearResults();
    this.revealedHints.set(0);
    this.tab.set('problem');
  }
  setCategory(event: Event) {
    if (this.busy()) return;
    this.category.set((event.target as HTMLSelectElement).value);
    if (!this.filteredExercises().some((e) => e.id === this.exercise().id))
      this.selectExercise(this.filteredExercises()[0].id);
  }
  selectExercise(id: string) {
    if (this.busy() || !this.levelExercises().some((e) => e.id === id)) return;
    this.workspace.update((w) => ({
      ...w,
      ...(w.practiceArea === 'data-structures'
        ? { selectedStructures: { ...w.selectedStructures, [this.difficulty()]: id } }
        : { selectedExercises: { ...w.selectedExercises, [this.difficulty()]: id } }),
    }));
    this.persist();
    this.clearResults();
    this.revealedHints.set(0);
    this.tab.set('problem');
  }
  setExercise(event: Event) {
    this.selectExercise((event.target as HTMLSelectElement).value);
  }
  setLanguage(event: Event) {
    const language = (event.target as HTMLSelectElement).value as Language;
    this.workspace.update((w) => ({ ...w, language }));
    this.persist();
    this.clearResults();
  }
  clearResults() {
    this.results.set([]);
    this.methodResult.set(undefined);
    this.logs.set([]);
    this.error.set('');
    this.mode.set(null);
    this.expandedResult.set(-1);
  }
  openDialog(type: 'progress' | 'reset' | 'appearance') {
    this.dialogType.set(type);
    this.modal.nativeElement.showModal();
  }
  closeDialog() {
    this.modal.nativeElement.close();
  }
  backdrop(event: MouseEvent) {
    if (event.target === this.modal.nativeElement) {
      const rect = this.modal.nativeElement.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        this.closeDialog();
    }
  }
  resetDraft() {
    this.updateCode(this.exercise().starter[this.language()]);
    this.closeDialog();
  }
  async execute(mode: 'run' | 'finish') {
    if (this.busy()) return;
    // Keep the last completed output visible until this attempt replaces it.
    this.busy.set(true);
    const id = ++this.executionId;
    const exercise = this.exercise();
    const language = this.language();
    const key = this.currentKey();
    const source = this.code();
    const checks =
      mode === 'run' ? exercise.examples : [...exercise.examples, ...exercise.additional];
    try {
      const result = await this.runner.run(
        language,
        source,
        exercise.signature[language],
        checks.map((c) => c.input),
        exercise.adapter,
        exercise.method,
      );
      if (id !== this.executionId) return;
      this.mode.set(mode);
      this.logs.set(result.logs);
      this.error.set(result.error ?? '');
      this.methodResult.set(
        exercise.method
          ? (result.method ?? {
              status: 'unverified',
              message:
                'The method check could not finish. Try again. Completion requires both correct output and a verified method.',
            })
          : undefined,
      );
      if (result.error) this.results.set([]);
      if (!result.error) {
        const graded = checks.map((check, index) => ({
          check,
          pass:
            !result.outputs[index]?.error && accepts(exercise, check, result.outputs[index]?.value),
          actual: result.outputs[index]?.value,
          error: result.outputs[index]?.error,
          extra: index >= exercise.examples.length,
        }));
        this.results.set(graded);
        this.expandedResult.set(graded.findIndex((r) => !r.pass));
        if (
          mode === 'finish' &&
          graded.every((r) => r.pass) &&
          (!exercise.method || this.methodResult()?.status === 'verified')
        ) {
          this.workspace.update((w) => ({
            ...w,
            completions: [
              ...w.completions.filter((c) => c.key !== key),
              { key, title: exercise.title, language, completedAt: new Date().toISOString() },
            ],
          }));
          this.persist();
        }
      }
    } catch (error) {
      if (id === this.executionId) {
        this.clearResults();
        this.error.set(
          error instanceof Error ? error.message : 'The runner could not start. Please try again.',
        );
      }
    } finally {
      if (id === this.executionId) {
        this.busy.set(false);
      }
    }
  }
  navigateTabs(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[index].click();
    buttons[index].focus();
  }
  showHint() {
    this.revealedHints.update((n) => Math.min(n + 1, this.exercise().hints.length));
  }
  format(value: unknown) {
    if (value === undefined) return 'No result';
    return JSON.stringify(value);
  }
  exampleExpected(check: Check) {
    if (this.exercise().id !== 'two-sum') return this.format(check.expected);
    const [nums, target] = check.input as [number[], number];
    for (let a = 0; a < nums.length; a++)
      for (let b = a + 1; b < nums.length; b++)
        if (nums[a] + nums[b] === target) return `[${a}, ${b}]`;
    return '[]';
  }
  exportWorkspace() {
    downloadJson(this.workspace(), 'procode-workspace.json');
  }
}
