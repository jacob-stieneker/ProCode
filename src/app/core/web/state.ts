import { downloadJson } from '../download';
import { Injectable, signal } from '@angular/core';
import { Difficulty } from '../exercises';
import { WebTopic, webExerciseInfo, webKey } from './model';
export interface WebState {
  schema: 1;
  active: boolean;
  topic: WebTopic;
  difficulty: Difficulty;
  selected: Record<string, string>;
  drafts: Record<string, string>;
  completions: { key: string; completedAt: string }[];
}
export const freshWebState = (): WebState => ({
  schema: 1,
  active: false,
  topic: 'html',
  difficulty: 'junior',
  selected: {},
  drafts: {},
  completions: [],
});
export const WEB_STORAGE_KEY = 'procode.web-practice.v1';
export function readWebState(): { data: WebState; warning: string } {
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return { data: freshWebState(), warning: '' };
    const parsed = JSON.parse(raw);
    if (
      parsed?.schema !== 1 ||
      !['html', 'css'].includes(parsed.topic) ||
      !['junior', 'skilled', 'senior'].includes(parsed.difficulty) ||
      !parsed.drafts ||
      typeof parsed.drafts !== 'object' ||
      Array.isArray(parsed.drafts) ||
      !Array.isArray(parsed.completions)
    )
      throw Error();
    const data = freshWebState();
    data.active = parsed.active === true;
    data.topic = parsed.topic;
    data.difficulty = parsed.difficulty;
    for (const info of webExerciseInfo) {
      const key = webKey(info),
        selection = `${info.topic}:${info.difficulty}`;
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
      data: freshWebState(),
      warning:
        'HTML & CSS saved work could not be loaded. Export your work before closing this tab.',
    };
  }
}
@Injectable({ providedIn: 'root' })
export class WebWorkspace {
  private loaded = readWebState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  update(change: (state: WebState) => WebState) {
    this.state.update(change);
    try {
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(this.state()));
      this.warning.set('');
    } catch {
      this.warning.set(
        'Browser storage is unavailable or full. Export your HTML & CSS work before closing this tab.',
      );
    }
  }
  export() {
    downloadJson(this.state(), 'procode-html-css.json');
  }
}
