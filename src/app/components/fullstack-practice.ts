import {
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from './editor';
import { Icon } from './icon';
import { Appearance } from '../core/appearance';
import { Difficulty, levels } from '../core/exercises';
import { fullstackExercises } from '../core/fullstack/catalog';
import { fullstackKey, ProjectResult, fileNames, ProjectFile } from '../core/fullstack/model';
import { FullstackWorkspace } from '../core/fullstack/state';
import { ProjectExecutionError, runProject } from '../core/fullstack/runner';
@Component({
  selector: 'pc-fullstack-practice',
  imports: [Editor, Icon, FormsModule],
  templateUrl: './fullstack-practice.html',
  styleUrls: ['./web-practice.css', './angular-practice.css', './fullstack-practice.css'],
})
export class FullstackPractice implements OnDestroy, OnChanges {
  @Input() active = true;
  readonly store = inject(FullstackWorkspace);
  readonly appearance = inject(Appearance);
  readonly levels = levels;
  list = computed(() =>
    fullstackExercises.filter((e) => e.difficulty === this.store.state().difficulty),
  );
  exercise = computed(
    () =>
      this.list().find(
        (e) => e.id === this.store.state().selected[this.store.state().difficulty],
      ) ?? this.list()[0],
  );
  initialData = computed(() => JSON.stringify(this.exercise().initial, null, 2));
  key = computed(() => fullstackKey(this.exercise()));
  readonly fileNames = fileNames;
  file = signal<ProjectFile>('index.html');
  files = computed(() => this.store.state().drafts[this.key()] ?? this.exercise().starter);
  code = computed(() => this.files()[this.file()]);
  language = computed(() =>
    this.file() === 'index.html'
      ? 'html'
      : this.file() === 'styles.css'
        ? 'css'
        : this.file() === 'app.ts'
          ? 'typescript'
          : 'javascript',
  );
  private failRequest?: (mode?: 'before' | 'after') => void;
  failNext(mode: 'before' | 'after' = 'before') {
    this.failRequest?.(mode);
  }
  completed = computed(() => this.store.state().completions.some((c) => c.key === this.key()));
  output = signal<'console' | 'preview' | 'tests'>('console');
  results = signal<ProjectResult[]>([]);
  logs = signal<string[]>([]);
  errors = signal<string[]>([]);
  busy = signal(false);
  completedAttempt = signal(0);
  hints = signal(0);
  resetConfirm = signal(false);
  previewReady = signal(false);
  previewStale = signal(false);
  mode = signal<'run' | 'finish' | null>(null);
  passes = computed(() => this.results().filter((r) => r.pass).length);
  allPassed = computed(() => this.results().length > 0 && this.passes() === this.results().length);
  @ViewChild('previewHost') previewHost?: ElementRef<HTMLElement>;
  private controller?: AbortController;
  private dispose?: () => void;
  ngOnChanges() {
    if (!this.active) this.stopPreview();
  }
  private stopPreview() {
    this.controller?.abort();
    this.dispose?.();
    this.dispose = undefined;
    this.failRequest = undefined;
    this.previewReady.set(false);
    this.busy.set(false);
  }
  change(difficulty?: Difficulty, id?: string) {
    if (this.busy()) return;
    this.stopPreview();
    this.store.update((s) => ({
      ...s,
      difficulty: difficulty ?? s.difficulty,
      selected: id ? { ...s.selected, [s.difficulty]: id } : s.selected,
    }));
    this.clear();
    this.hints.set(0);
    this.resetConfirm.set(false);
  }
  updateCode(code: string) {
    if (this.busy() || code === this.code()) return;
    this.store.update((s) => ({
      ...s,
      drafts: { ...s.drafts, [this.key()]: { ...this.files(), [this.file()]: code } },
    }));
    this.clear();
    this.previewStale.set(this.previewReady());
  }
  clear() {
    this.results.set([]);
    this.logs.set([]);
    this.errors.set([]);
    this.mode.set(null);
  }
  reset() {
    this.store.update((s) => ({
      ...s,
      drafts: { ...s.drafts, [this.key()]: structuredClone(this.exercise().starter) },
    }));
    this.clear();
    this.previewStale.set(this.previewReady());
    this.resetConfirm.set(false);
  }
  private addError(message: string) {
    this.errors.update((errors) =>
      errors.includes(message) ? errors : [...errors, message].slice(-10),
    );
  }
  async execute(mode: 'run' | 'finish') {
    if (this.busy() || !this.active || !this.previewHost) return;
    const focused = document.activeElement as HTMLElement | null;
    this.busy.set(true);
    const previousDispose = this.dispose;
    const hadPreview = this.previewReady();
    const controller = new AbortController();
    this.controller = controller;
    const exercise = this.exercise(),
      key = this.key(),
      source = this.files();
    const pendingErrors: string[] = [];
    try {
      const result = await runProject(
        source,
        exercise,
        mode === 'run' ? exercise.scenarios.slice(0, 3) : exercise.scenarios,
        this.previewHost.nativeElement,
        controller.signal,
        (logs) => {
          if (!controller.signal.aborted && this.controller === controller)
            this.logs.update((current) => [...current, ...logs].slice(-100));
        },
        (message) => {
          if (controller.signal.aborted || this.controller !== controller) return;
          if (this.busy()) pendingErrors.push(message);
          else this.addError(message);
        },
      );
      if (controller.signal.aborted) {
        result.dispose();
        return;
      }
      previousDispose?.();
      this.dispose = result.dispose;
      this.failRequest = result.failNext;
      this.results.set(result.results);
      this.logs.set(result.logs);
      this.errors.set([...new Set(pendingErrors)].slice(-10));
      this.mode.set(mode);
      this.previewReady.set(true);
      this.previewStale.set(false);
      if (mode === 'finish' && result.results.every((r) => r.pass))
        this.store.update((s) => ({
          ...s,
          completions: [
            ...s.completions.filter((c) => c.key !== key),
            { key, completedAt: new Date().toISOString() },
          ],
        }));
    } catch (error) {
      if (!controller.signal.aborted) {
        this.results.set([]);
        this.logs.set(error instanceof ProjectExecutionError ? error.logs : []);
        this.errors.set([error instanceof Error ? error.message : String(error)]);
        this.previewReady.set(hadPreview);
        this.previewStale.set(hadPreview);
      }
    } finally {
      if (this.controller === controller) {
        this.busy.set(false);
        this.completedAttempt.update((n) => n + 1);
        setTimeout(() => {
          if (document.activeElement === document.body && focused?.isConnected)
            focused.focus({ preventScroll: true });
        }, 0);
      }
    }
  }
  navigate(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const i = buttons.indexOf(event.target as HTMLButtonElement);
    if (i < 0) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (i + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].click();
    buttons[next].focus();
  }
  ngOnDestroy() {
    this.stopPreview();
  }
}
