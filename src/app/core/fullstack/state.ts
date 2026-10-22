import { downloadJson } from '../download';
import { Injectable, signal } from '@angular/core';
import { Difficulty } from '../exercises';
import { fullstackExerciseInfo, fullstackKey, fileNames, ProjectFiles } from './model';
export interface FullstackState {
  schema: 1;
  active: boolean;
  difficulty: Difficulty;
  selected: Record<string, string>;
  drafts: Record<string, ProjectFiles>;
  completions: { key: string; completedAt: string }[];
}
export const freshFullstackState = (): FullstackState => ({
  schema: 1,
  active: false,
  difficulty: 'junior',
  selected: {},
  drafts: {},
  completions: [],
});
export const FULLSTACK_STORAGE_KEY = 'procode.fullstack-practice.v1';
export function readFullstackState(): { data: FullstackState; warning: string } {
  try {
    const raw = localStorage.getItem(FULLSTACK_STORAGE_KEY);
    if (!raw) return { data: freshFullstackState(), warning: '' };
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
    const data = freshFullstackState();
    data.active = parsed.active === true;
    data.difficulty = parsed.difficulty;
    for (const info of fullstackExerciseInfo) {
      const key = fullstackKey(info),
        selection = info.difficulty;
      const saved = parsed.drafts[key];
      // Preserve old JavaScript source verbatim under the new TypeScript client filename.
      const draft =
        saved && typeof saved === 'object' && !Array.isArray(saved)
          ? { ...saved, 'app.ts': saved['app.ts'] ?? saved['app.js'] }
          : null;
      if (
        draft &&
        fileNames.every((name) => typeof draft[name] === 'string' && draft[name].length <= 50000)
      )
        data.drafts[key] = Object.fromEntries(
          fileNames.map((name) => [name, draft[name]]),
        ) as ProjectFiles;
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
      data: freshFullstackState(),
      warning:
        'Full-stack saved work could not be loaded. Export your work before closing this tab.',
    };
  }
}
@Injectable({ providedIn: 'root' })
export class FullstackWorkspace {
  private loaded = readFullstackState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  update(change: (state: FullstackState) => FullstackState) {
    this.state.update(change);
    try {
      localStorage.setItem(FULLSTACK_STORAGE_KEY, JSON.stringify(this.state()));
      this.warning.set('');
    } catch {
      this.warning.set(
        'Browser storage is unavailable or full. Export your full-stack work before closing this tab.',
      );
    }
  }
  export() {
    downloadJson(this.state(), 'procode-fullstack.json');
  }
}
