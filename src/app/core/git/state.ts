import { downloadJson } from '../download';
import { Injectable, signal } from '@angular/core';
import { Difficulty } from '../exercises';
import { gitExerciseInfo, gitKey, ReviewDraft } from './model';
export interface GitSavedState {
  schema: 1;
  active: boolean;
  difficulty: Difficulty;
  selected: Record<string, string>;
  drafts: Record<string, string>;
  reviews: Record<string, ReviewDraft>;
  completions: { key: string; completedAt: string }[];
}
export const freshGitSavedState = (): GitSavedState => ({
  schema: 1,
  active: false,
  difficulty: 'junior',
  selected: {},
  drafts: {},
  reviews: {},
  completions: [],
});
export const GIT_STORAGE_KEY = 'procode.git-practice.v1';
export function readGitSavedState(): { data: GitSavedState; warning: string } {
  try {
    const raw = localStorage.getItem(GIT_STORAGE_KEY);
    if (!raw) return { data: freshGitSavedState(), warning: '' };
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
    const data = freshGitSavedState();
    data.active = parsed.active === true;
    data.difficulty = parsed.difficulty;
    for (const info of gitExerciseInfo) {
      const key = gitKey(info),
        selection = info.difficulty;
      if (typeof parsed.drafts[key] === 'string' && parsed.drafts[key].length <= 50000)
        data.drafts[key] = parsed.drafts[key];
      if (parsed.selected?.[selection] === info.id) data.selected[selection] = info.id;
      const review = parsed.reviews?.[key];
      if (
        review &&
        typeof review.enabled === 'boolean' &&
        ['source', 'target', 'title'].every(
          (field) => typeof review[field] === 'string' && review[field].length <= 200,
        )
      )
        data.reviews[key] = {
          enabled: review.enabled,
          source: review.source,
          target: review.target,
          title: review.title,
        };
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
      data: freshGitSavedState(),
      warning: 'Git saved work could not be loaded. Export your work before closing this tab.',
    };
  }
}
@Injectable({ providedIn: 'root' })
export class GitWorkspace {
  private loaded = readGitSavedState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  update(change: (state: GitSavedState) => GitSavedState) {
    this.state.update(change);
    try {
      localStorage.setItem(GIT_STORAGE_KEY, JSON.stringify(this.state()));
      this.warning.set('');
    } catch {
      this.warning.set(
        'Browser storage is unavailable or full. Export your Git work before closing this tab.',
      );
    }
  }
  export() {
    downloadJson(this.state(), 'procode-git.json');
  }
}
