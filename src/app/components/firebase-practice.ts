import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from './icon';
import { Difficulty, levels } from '../core/exercises';
import { firebaseExercises } from '../core/firebase/catalog';
import { firebaseKey } from '../core/firebase/model';
import { FirebaseWorkspace } from '../core/firebase/state';
import { runFirebase } from '../core/firebase/runner';
@Component({
  selector: 'pc-firebase-practice',
  imports: [Icon, FormsModule],
  templateUrl: './firebase-practice.html',
  styleUrls: ['./web-practice.css', './firebase-practice.css'],
})
export class FirebasePractice {
  readonly store = inject(FirebaseWorkspace);
  readonly levels = levels;
  readonly tabs = [
    { id: 'console', label: 'Console', icon: 'terminal' },
    { id: 'state', label: 'State', icon: 'code' },
    { id: 'tests', label: 'Test results', icon: 'check' },
  ] as const;
  list = computed(() =>
    firebaseExercises.filter((e) => e.difficulty === this.store.state().difficulty),
  );
  exercise = computed(
    () =>
      this.list().find(
        (e) => e.id === this.store.state().selected[this.store.state().difficulty],
      ) ?? this.list()[0],
  );
  key = computed(() => firebaseKey(this.exercise()));
  code = computed(() => this.store.state().drafts[this.key()] ?? this.exercise().starter);
  completed = computed(() => this.store.state().completions.some((c) => c.key === this.key()));
  output = signal<'console' | 'state' | 'tests'>('console');
  attempt = signal<ReturnType<typeof runFirebase> | null>(null);
  mode = signal<'run' | 'finish' | null>(null);
  hints = signal(0);
  resetConfirm = signal(false);
  passes = computed(() => this.attempt()?.results.filter((r) => r.pass).length ?? 0);
  allPassed = computed(() => !!this.attempt() && this.attempt()!.results.every((r) => r.pass));
  stateView = computed(() =>
    JSON.stringify(this.attempt()?.state ?? this.exercise().initial, null, 2),
  );
  change(difficulty?: Difficulty, id?: string) {
    this.store.update((s) => ({
      ...s,
      difficulty: difficulty ?? s.difficulty,
      selected: id ? { ...s.selected, [s.difficulty]: id } : s.selected,
    }));
    this.clear();
    this.hints.set(0);
    this.resetConfirm.set(false);
  }
  clear() {
    this.attempt.set(null);
    this.mode.set(null);
  }
  updateCode(source: string) {
    if (source === this.code()) return;
    this.store.update((s) => ({ ...s, drafts: { ...s.drafts, [this.key()]: source } }));
    this.clear();
  }
  reset() {
    this.updateCode(this.exercise().starter);
    this.resetConfirm.set(false);
  }
  execute(mode: 'run' | 'finish') {
    this.attempt.set(runFirebase(this.code(), this.exercise()));
    this.mode.set(mode);
    if (mode === 'finish' && this.allPassed()) {
      const key = this.key();
      this.store.update((s) => ({
        ...s,
        completions: [
          ...s.completions.filter((c) => c.key !== key),
          { key, completedAt: new Date().toISOString() },
        ],
      }));
    }
  }
  shortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.execute('run');
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
}
