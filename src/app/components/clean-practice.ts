import { Component, computed, inject, Input, OnChanges, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from './editor';
import { Icon } from './icon';
import { Appearance } from '../core/appearance';
import { Difficulty, Language, levels } from '../core/exercises';
import { cleanExercises } from '../core/clean/catalog';
import { cleanKey } from '../core/clean/model';
import { CleanWorkspace } from '../core/clean/state';
import { Runner } from '../core/runner';
import { runClean } from '../core/clean/runner';
@Component({
  selector: 'pc-clean-practice',
  imports: [FormsModule, Editor, Icon],
  providers: [Runner],
  templateUrl: './clean-practice.html',
  styleUrls: ['./web-practice.css', './angular-practice.css'],
})
export class CleanPractice implements OnChanges, OnDestroy {
  @Input() active = true;
  readonly store = inject(CleanWorkspace);
  readonly appearance = inject(Appearance);
  private runner = inject(Runner);
  readonly levels = levels;
  readonly tabs = [
    { id: 'console', label: 'Console', icon: 'terminal' },
    { id: 'tests', label: 'Test results', icon: 'check' },
  ] as const;
  language = computed(() => this.store.state().language);
  list = computed(() =>
    cleanExercises.filter((e) => e.difficulty === this.store.state().difficulty),
  );
  exercise = computed(
    () =>
      this.list().find(
        (e) => e.id === this.store.state().selected[this.store.state().difficulty],
      ) ?? this.list()[0],
  );
  key = computed(() => cleanKey(this.exercise(), this.language()));
  code = computed(
    () => this.store.state().drafts[this.key()] ?? this.exercise().starter[this.language()],
  );
  completed = computed(() => this.store.state().completions.some((c) => c.key === this.key()));
  output = signal<'console' | 'tests'>('console');
  attempt = signal<Awaited<ReturnType<typeof runClean>> | null>(null);
  mode = signal<'run' | 'finish' | null>(null);
  hints = signal(0);
  resetConfirm = signal(false);
  busy = signal(false);
  completedAttempt = signal(0);
  passes = computed(() => this.attempt()?.results.filter((r) => r.pass).length ?? 0);
  allPassed = computed(
    () =>
      !!this.attempt()?.results.length &&
      !this.attempt()!.errors.length &&
      this.attempt()!.results.every((r) => r.pass),
  );
  private controller?: AbortController;
  json(value: unknown) {
    return JSON.stringify(value);
  }
  ngOnChanges() {
    if (!this.active) this.stop();
  }
  ngOnDestroy() {
    this.stop();
  }
  private stop() {
    this.controller?.abort();
    this.runner.cancel();
    this.busy.set(false);
  }
  change(difficulty?: Difficulty, id?: string, language?: Language) {
    if (this.busy()) return;
    this.store.update((s) => ({
      ...s,
      difficulty: difficulty ?? s.difficulty,
      language: language ?? s.language,
      selected: id ? { ...s.selected, [s.difficulty]: id } : s.selected,
    }));
    this.attempt.set(null);
    this.hints.set(0);
    this.resetConfirm.set(false);
    this.mode.set(null);
  }
  updateCode(source: string) {
    if (source === this.code()) return;
    this.store.update((s) => ({ ...s, drafts: { ...s.drafts, [this.key()]: source } }));
    this.attempt.set(null);
    this.mode.set(null);
  }
  reset() {
    this.updateCode(this.exercise().starter[this.language()]);
    this.resetConfirm.set(false);
  }
  async execute(mode: 'run' | 'finish') {
    if (this.busy() || !this.active) return;
    this.busy.set(true);
    const controller = new AbortController();
    this.controller = controller;
    const key = this.key();
    const exercise = this.exercise();
    const language = this.language();
    const source = this.code();
    try {
      const result = await runClean(
        this.runner,
        exercise,
        language,
        source,
        mode,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      this.attempt.set(result);
      this.mode.set(mode);
      if (mode === 'finish' && this.allPassed())
        this.store.update((s) => ({
          ...s,
          completions: [
            ...s.completions.filter((c) => c.key !== key),
            { key, completedAt: new Date().toISOString() },
          ],
        }));
    } catch (error) {
      if (!controller.signal.aborted) {
        this.attempt.set({
          results: [],
          logs: [],
          errors: [error instanceof Error ? error.message : String(error)],
        });
        this.mode.set(mode);
      }
    } finally {
      if (this.controller === controller) {
        this.busy.set(false);
        if (!controller.signal.aborted) this.completedAttempt.update((n) => n + 1);
      }
    }
  }
  navigate(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(
        (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      ),
      index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].click();
    buttons[next].focus();
  }
}
