import { downloadJson } from '../download';
import { Injectable, signal } from '@angular/core';
import { Difficulty } from '../exercises';
import { firebaseExerciseInfo, firebaseKey } from './model';
export interface FirebaseSavedState {
  schema: 1;
  active: boolean;
  difficulty: Difficulty;
  selected: Record<string, string>;
  drafts: Record<string, string>;
  completions: { key: string; completedAt: string }[];
}
export const freshFirebaseSavedState = (): FirebaseSavedState => ({
  schema: 1,
  active: false,
  difficulty: 'junior',
  selected: {},
  drafts: {},
  completions: [],
});
export const FIREBASE_STORAGE_KEY = 'procode.firebase-practice.v1';
export function readFirebaseSavedState(): { data: FirebaseSavedState; warning: string } {
  try {
    const raw = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (!raw) return { data: freshFirebaseSavedState(), warning: '' };
    const parsed = JSON.parse(raw);
    if (
      parsed?.schema !== 1 ||
      !['junior', 'skilled', 'senior'].includes(parsed.difficulty) ||
      !parsed.drafts ||
      typeof parsed.drafts !== 'object' ||
      Array.isArray(parsed.drafts) ||
      !Array.isArray(parsed.completions)
    )
      throw Error();
    const data = freshFirebaseSavedState();
    data.active = parsed.active === true;
    data.difficulty = parsed.difficulty;
    for (const info of firebaseExerciseInfo) {
      const key = firebaseKey(info),
        selection = info.difficulty;
      if (typeof parsed.drafts[key] === 'string' && parsed.drafts[key].length <= 50000)
        data.drafts[key] = parsed.drafts[key];
      if (parsed.selected?.[selection] === info.id) data.selected[selection] = info.id;
      const record = parsed.completions.find(
        (c: { key?: string; completedAt?: unknown }) =>
          c?.key === key &&
          typeof c.completedAt === 'string' &&
          Number.isFinite(Date.parse(c.completedAt)),
      );
      if (record) data.completions.push({ key, completedAt: record.completedAt });
    }
    return { data, warning: '' };
  } catch {
    return {
      data: freshFirebaseSavedState(),
      warning: 'Firebase saved work could not be loaded. Export your work before closing this tab.',
    };
  }
}
@Injectable({ providedIn: 'root' })
export class FirebaseWorkspace {
  private loaded = readFirebaseSavedState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  update(change: (state: FirebaseSavedState) => FirebaseSavedState) {
    this.state.update(change);
    try {
      localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(this.state()));
      this.warning.set('');
    } catch {
      this.warning.set(
        'Browser storage is unavailable or full. Export your Firebase work before closing this tab.',
      );
    }
  }
  export() {
    downloadJson(this.state(), 'procode-firebase.json');
  }
}
