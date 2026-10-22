import { Injectable, signal } from '@angular/core';

export const appearanceModes = [
  { id: 'light', name: 'Light', icon: 'sun' },
  { id: 'dark', name: 'Dark', icon: 'moon' },
  { id: 'midnight', name: 'Midnight OLED', icon: 'midnight' },
] as const;
export const appearanceThemes = [
  { source: 'Original ProCode palette', id: 'procode', name: 'ProCode' },
  { source: 'GitHub Default, official Primer theme colors', id: 'github', name: 'GitHub' },
  {
    source: 'Microsoft Visual Studio Dark+ / Light+ (VS Code)',
    id: 'visual-studio',
    name: 'Visual Studio',
  },
  { source: 'Codex desktop 26.930.51102 color tokens', id: 'codex', name: 'Codex' },
  { source: 'Cursor Dark / Light, bundled with Cursor 3.14.27', id: 'cursor', name: 'Cursor' },
  {
    source: 'Claude desktop 2.26454.0, CDS UI and Claude Light / Dark editor palettes',
    id: 'claude',
    name: 'Claude',
  },
  {
    source: 'PyCharm 2026.2.3, bundled Islands Light / Islands Dark UI and editor schemes',
    id: 'pycharm',
    name: 'PyCharm',
  },
] as const;
export type AppearanceMode = (typeof appearanceModes)[number]['id'];
export type AppearanceTheme = (typeof appearanceThemes)[number]['id'];
export interface AppearancePreferences {
  mode: AppearanceMode;
  theme: AppearanceTheme;
}
export const appearanceKey = 'procode.appearance.v1';
export function validAppearance(value: unknown): value is AppearancePreferences {
  const preferences = value as AppearancePreferences | null;
  return (
    !!preferences &&
    appearanceModes.some((m) => m.id === preferences.mode) &&
    appearanceThemes.some((t) => t.id === preferences.theme)
  );
}
@Injectable({ providedIn: 'root' })
export class Appearance {
  readonly modes = appearanceModes;
  readonly themes = appearanceThemes;
  readonly preferences = signal<AppearancePreferences>({ mode: 'dark', theme: 'procode' });
  readonly warning = signal('');
  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(appearanceKey) || 'null');
      if (validAppearance(saved)) this.preferences.set({ mode: saved.mode, theme: saved.theme });
    } catch {
      /* A blocked or corrupt preference must not prevent the app from loading. */
    }
    this.apply();
  }
  setMode(mode: AppearanceMode) {
    this.update({ ...this.preferences(), mode });
  }
  setTheme(theme: AppearanceTheme) {
    this.update({ ...this.preferences(), theme });
  }
  private update(preferences: AppearancePreferences) {
    if (!validAppearance(preferences)) return;
    this.preferences.set(preferences);
    this.apply();
    try {
      localStorage.setItem(appearanceKey, JSON.stringify(preferences));
      this.warning.set('');
    } catch {
      this.warning.set(
        'This appearance is active for this session. Browser storage is unavailable.',
      );
    }
  }
  private apply() {
    const { mode, theme } = this.preferences();
    document.documentElement.dataset['mode'] = mode;
    document.documentElement.dataset['theme'] = theme;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }
}
