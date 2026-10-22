import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from './editor';
import { Icon } from './icon';
import { Appearance } from '../core/appearance';
import { Difficulty, levels } from '../core/exercises';
import { webExercises } from '../core/web/catalog';
import { WebTopic, webKey } from '../core/web/model';
import { WebWorkspace } from '../core/web/state';
import { gradeWeb, preventNavigation, sourceFor, WebResult } from '../core/web/preview';
@Component({
  selector: 'pc-web-practice',
  imports: [Editor, Icon, FormsModule],
  templateUrl: './web-practice.html',
  styleUrl: './web-practice.css',
})
export class WebPractice implements AfterViewInit, OnDestroy {
  readonly store = inject(WebWorkspace);
  readonly appearance = inject(Appearance);
  readonly levels = levels;
  readonly widths = [360, 960];
  list = computed(() =>
    webExercises.filter(
      (e) => e.topic === this.store.state().topic && e.difficulty === this.store.state().difficulty,
    ),
  );
  exercise = computed(
    () =>
      this.list().find(
        (e) =>
          e.id ===
          this.store.state().selected[
            `${this.store.state().topic}:${this.store.state().difficulty}`
          ],
      ) ?? this.list()[0],
  );
  key = computed(() => webKey(this.exercise()));
  code = computed(() => this.store.state().drafts[this.key()] ?? this.exercise().starter);
  completed = computed(() => this.store.state().completions.some((c) => c.key === this.key()));
  width = signal(360);
  output = signal<'preview' | 'tests'>('preview');
  results = signal<WebResult[]>([]);
  busy = signal(false);
  completedAttempt = signal(0);
  error = signal('');
  mode = signal<'run' | 'finish' | null>(null);
  hints = signal(0);
  resetConfirm = signal(false);
  passes = computed(() => this.results().filter((r) => r.pass).length);
  allPassed = computed(() => this.results().length > 0 && this.passes() === this.results().length);
  @ViewChild('preview') preview?: ElementRef<HTMLIFrameElement>;
  private timer?: ReturnType<typeof setTimeout>;
  private controller?: AbortController;
  ngAfterViewInit() {
    this.refreshPreview();
  }
  refreshPreview() {
    if (this.preview) this.preview.nativeElement.srcdoc = sourceFor(this.exercise(), this.code());
  }
  loadedPreview() {
    const d = this.preview?.nativeElement.contentDocument;
    if (d) preventNavigation(d);
  }
  updateCode(code: string) {
    if (this.busy() || code === this.code()) return;
    this.store.update((s) => ({ ...s, drafts: { ...s.drafts, [this.key()]: code } }));
    this.clear();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.refreshPreview(), 250);
  }
  clear() {
    this.results.set([]);
    this.error.set('');
    this.mode.set(null);
  }
  change(topic?: WebTopic, difficulty?: Difficulty, id?: string) {
    if (this.busy()) return;
    this.store.update((s) => ({
      ...s,
      topic: topic ?? s.topic,
      difficulty: difficulty ?? s.difficulty,
      selected: id ? { ...s.selected, [`${s.topic}:${s.difficulty}`]: id } : s.selected,
    }));
    this.clear();
    this.hints.set(0);
    this.resetConfirm.set(false);
    clearTimeout(this.timer);
    this.refreshPreview();
  }
  reset() {
    this.updateCode(this.exercise().starter);
    this.resetConfirm.set(false);
  }
  async execute(mode: 'run' | 'finish') {
    if (this.busy()) return;
    const focused = document.activeElement as HTMLElement | null;
    this.busy.set(true);
    clearTimeout(this.timer);
    this.refreshPreview();
    const controller = new AbortController();
    this.controller = controller;
    const exercise = this.exercise(),
      key = this.key(),
      source = this.code();
    try {
      const results = await gradeWeb(exercise, source, mode === 'finish', controller.signal);
      if (controller.signal.aborted) return;
      this.results.set(results);
      this.error.set('');
      this.mode.set(mode);
      if (mode === 'finish' && results.every((r) => r.pass))
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
        this.error.set(error instanceof Error ? error.message : 'Checks could not run.');
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
    clearTimeout(this.timer);
    this.controller?.abort();
  }
}
