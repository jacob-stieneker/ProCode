import { webExerciseInfo, webKey } from './model';
import { webExercises } from './catalog';
import { freshWebState, readWebState, WEB_STORAGE_KEY, WebWorkspace } from './state';
import { previewDocument } from './preview';
describe('HTML and CSS catalog', () => {
  it('covers both topics at every difficulty with unique checks and actionable hints', () => {
    expect(webExercises).toHaveLength(18);
    expect(new Set(webExercises.map((e) => e.id)).size).toBe(18);
    for (const topic of ['html', 'css'])
      for (const difficulty of ['junior', 'skilled', 'senior'])
        expect(
          webExercises.filter((e) => e.topic === topic && e.difficulty === difficulty),
        ).toHaveLength(3);
    for (const e of webExercises) {
      expect(e.checks.length).toBeGreaterThanOrEqual(6);
      expect(new Set(e.checks.map((c) => c.name)).size).toBe(e.checks.length);
      expect(e.checks.some((c) => c.width === 360)).toBe(true);
      expect(e.checks.every((c) => c.hint.length > 10)).toBe(true);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    }
  });
  it('removes active content and external assets without destroying semantic controls', () => {
    const source = previewDocument(
      '<script>alert(1)</script><form action="/send"><label>Name<input required onfocus="alert(1)"></label><a href="#x">Go</a></form><img src="https://example.com/pixel"><iframe srcdoc="x"></iframe>',
      '</style><script>alert(2)</script>',
    );
    const d = new DOMParser().parseFromString(source, 'text/html');
    expect(d.querySelector('script,iframe,[onfocus],[action],img[src]')).toBeNull();
    expect(d.querySelector('input[required]')).not.toBeNull();
    expect(d.querySelector('a')?.getAttribute('href')).toBe('#x');
    expect(d.querySelector('meta[http-equiv]')?.getAttribute('content')).toContain(
      "script-src 'none'",
    );
  });
});
describe('HTML and CSS storage', () => {
  beforeEach(() => localStorage.clear());
  it('preserves valid drafts including empty drafts, and validates completions and selections', () => {
    const state = freshWebState(),
      info = webExerciseInfo[0],
      key = webKey(info);
    state.active = true;
    state.drafts[key] = '';
    state.selected['html:junior'] = info.id;
    const record = { key, completedAt: '2026-10-08T12:00:00Z' };
    state.completions = [record, record, { key: 'unknown', completedAt: record.completedAt }];
    state.drafts['unknown'] = 'ignored';
    state.selected['css:senior'] = info.id;
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
    const loaded = readWebState();
    expect(loaded.warning).toBe('');
    expect(loaded.data.drafts).toEqual({ [key]: '' });
    expect(loaded.data.completions).toEqual([record]);
    expect(loaded.data.selected).toEqual({ 'html:junior': info.id });
    expect(loaded.data.active).toBe(true);
  });
  it('recovers from malformed state and drops oversized drafts', () => {
    localStorage.setItem(WEB_STORAGE_KEY, 'null');
    expect(readWebState().warning).toBeTruthy();
    const state = freshWebState();
    state.drafts[webKey(webExerciseInfo[0])] = 'x'.repeat(50001);
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
    expect(readWebState().data.drafts).toEqual({});
  });
});

describe('HTML and CSS unavailable storage', () => {
  it('keeps the edited draft in memory and exposes an export warning', () => {
    localStorage.clear();
    const workspace = new WebWorkspace();
    const key = webKey(webExerciseInfo[0]);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('Storage unavailable');
    });
    try {
      workspace.update((s) => ({ ...s, drafts: { [key]: '<main>Unsaved work</main>' } }));
      expect(workspace.state().drafts[key]).toContain('Unsaved work');
      expect(workspace.warning()).toContain('Export');
    } finally {
      spy.mockRestore();
    }
  });
});
