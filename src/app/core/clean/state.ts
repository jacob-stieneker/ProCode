import { Injectable, signal } from '@angular/core';
import { Difficulty, Language } from '../exercises';
import { cleanExerciseInfo, cleanKey } from './model';
export interface CleanSavedState {
  schema: 1;
  active: boolean;
  difficulty: Difficulty;
  language: Language;
  selected: Record<string, string>;
  drafts: Record<string, string>;
  completions: { key: string; completedAt: string }[];
}
export const freshCleanSavedState = (): CleanSavedState => ({
  schema: 1,
  active: false,
  difficulty: 'junior',
  language: 'javascript',
  selected: {},
  drafts: {},
  completions: [],
});
export const CLEAN_STORAGE_KEY = 'procode.clean-practice.v1';
export function readCleanSavedState(): { data: CleanSavedState; warning: string } {
  try {
    const raw = localStorage.getItem(CLEAN_STORAGE_KEY);
    if (!raw) return { data: freshCleanSavedState(), warning: '' };
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
    const data = freshCleanSavedState();
    data.active = parsed.active === true;
    data.difficulty = parsed.difficulty;
    data.language = parsed.language === 'python' ? 'python' : 'javascript';
    for (const info of cleanExerciseInfo) {
      for (const language of ['javascript', 'python'] as const) {
        const key = cleanKey(info, language),
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
    }
    return { data, warning: '' };
  } catch {
    return {
      data: freshCleanSavedState(),
      warning: 'Cannot load Clean code work. Export before closing.',
    };
  }
}
@Injectable({ providedIn: 'root' })
export class CleanWorkspace {
  private loaded = readCleanSavedState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  update(change: (state: CleanSavedState) => CleanSavedState) {
    this.state.update(change);
    try {
      localStorage.setItem(CLEAN_STORAGE_KEY, JSON.stringify(this.state()));
      this.warning.set('');
    } catch {
      this.warning.set('Storage is unavailable or full. Export Clean code work before exit.');
    }
  }
  async export() {
    const { exportCleanWork } = await import('./export');
    exportCleanWork(this.state());
  }
}
