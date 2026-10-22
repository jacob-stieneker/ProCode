import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const palettes = ['ProCode', 'GitHub', 'Visual Studio', 'Codex', 'Cursor', 'Claude', 'PyCharm'];
const modes = ['Light', 'Dark', 'Midnight OLED'];

for (const palette of palettes) {
  test(`${palette} supports readable Light, Dark, and Midnight OLED modes`, async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');
    for (const mode of modes) {
      await page.getByRole('button', { name: 'Appearance', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: new RegExp(`^${palette}$`) }).click();
      await dialog.getByRole('button', { name: new RegExp(`^${mode}$`) }).click();
      await expect(dialog.getByRole('button', { name: new RegExp(`^${mode}$`) })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const pickerAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        pickerAudit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        `${palette} ${mode} picker`,
      ).toEqual([]);
      await dialog.getByRole('button', { name: 'Done', exact: true }).click();
      const workspaceAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        workspaceAudit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        `${palette} ${mode} workspace`,
      ).toEqual([]);
      await expect(page.locator('html')).toHaveAttribute(
        'data-mode',
        mode === 'Midnight OLED' ? 'midnight' : mode.toLowerCase(),
      );
      if (mode === 'Midnight OLED') {
        expect(
          await page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe('rgb(0, 0, 0)');
        expect(
          await page.locator('.cm-editor').evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe('rgb(0, 0, 0)');
      }
    }
  });
}

test('appearance preserves drafts and undo history and persists across reloads', async ({
  page,
}) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.fill('function twoSum() { return [0, 1]; }');
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByRole('button', { name: /^Claude$/ }).click();
  await page.getByRole('button', { name: /^Light$/ }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(editor).toContainText('return [0, 1]');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toContainText('Write your solution here.');
  await editor.fill('function twoSum() { return [0, 1]; }');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'claude');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
  await expect(editor).toContainText('return [0, 1]');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await page.getByRole('tab', { name: /Test results/ }).click();
  await expect(page.getByText('Some checks failed.', { exact: false })).toBeVisible();
});

test('appearance picker remains accessible and usable on small screens', async ({ page }) => {
  await page.goto('/');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await page.getByRole('button', { name: /^GitHub$/ }).click();
    await page.getByRole('button', { name: /^Light$/ }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
    await page.screenshot({ path: `test-results/appearance-${width}.png`, fullPage: true });
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Appearance', exact: true })).toBeFocused();
  }
});

test('each preset changes actual JavaScript and Python syntax, controls, and its preview', async ({
  page,
}) => {
  await page.goto('/');
  const signatures = new Set<string>();
  for (const mode of modes) {
    signatures.clear();
    for (const palette of palettes) {
      await page.getByRole('button', { name: 'Appearance', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: palette, exact: true }).click();
      await dialog.getByRole('button', { name: mode, exact: true }).click();
      const theme = await page.locator('html').getAttribute('data-theme');
      const preview = page.locator(`.theme-swatch[data-theme="${theme}"]`);
      for (const token of ['--syntax-keyword', '--syntax-string', '--accent-fill', '--inset']) {
        const rootColor = await page
          .locator('html')
          .evaluate((el, name) => getComputedStyle(el).getPropertyValue(name).trim(), token);
        expect(
          await preview.evaluate(
            (el, name) => getComputedStyle(el).getPropertyValue(name).trim(),
            token,
          ),
        ).toBe(rootColor);
      }
      await dialog.getByRole('button', { name: 'Done', exact: true }).click();
      for (const language of ['javascript', 'python']) {
        await page.getByLabel('Practice language').selectOption(language);
        await page
          .getByRole('textbox', { name: 'Solution code' })
          .fill(
            language === 'javascript'
              ? 'function preview(value) {\n  // Comment\n  const label = "theme";\n  return value + 42;\n}'
              : 'def preview(value):\n    # Comment\n    label = "theme"\n    return value + 42',
          );
        const colors: string[] = [];
        for (const [text, token] of [
          [language === 'javascript' ? 'function' : 'def', '--syntax-keyword'],
          ['"theme"', '--syntax-string'],
          ['42', '--syntax-number'],
          ['preview', '--syntax-function'],
        ]) {
          const span = page
            .locator('.cm-line span')
            .filter({ hasText: new RegExp(`^${text}$`) })
            .first();
          await expect(span).toBeVisible();
          const expected = await page.locator('html').evaluate((el, name) => {
            const probe = document.createElement('span');
            probe.style.color = `var(${name})`;
            el.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          }, token);
          await expect(span, `${palette} ${mode} ${language} ${text}`).toHaveCSS('color', expected);
          colors.push(expected);
        }
        if (language === 'javascript') signatures.add(colors.join('|'));
      }
      if (mode === 'Dark')
        await page.screenshot({ path: `test-results/theme-${theme}.png`, fullPage: true });
    }
    expect(signatures.size, `${mode} must have distinct syntax palettes`).toBe(palettes.length);
  }
});

test('Midnight OLED retunes the whole palette with low-luminance surfaces for every preset', async ({
  page,
}) => {
  await page.goto('/');
  const tokens = [
    'surface',
    'hover',
    'border',
    'text',
    'muted',
    'accent-fill',
    'accent-soft',
    'selection',
    'editor-line',
    'warning-bg',
    'error-bg',
    'success-bg',
    'syntax-keyword',
    'syntax-string',
  ];
  const readTokens = () =>
    page.locator('html').evaluate((el, names) => {
      const style = getComputedStyle(el);
      return Object.fromEntries(
        names.map((name) => [name, style.getPropertyValue(`--${name}`).trim()]),
      );
    }, tokens);
  const luminance = (css: string) => {
    const channels = css
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => v / 255);
    return channels
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  for (const palette of palettes) {
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: palette, exact: true }).click();
    await dialog.getByRole('button', { name: 'Dark', exact: true }).click();
    const dark = await readTokens();
    await dialog.getByRole('button', { name: 'Midnight OLED', exact: true }).click();
    const midnight = await readTokens();
    for (const token of tokens)
      expect(midnight[token], `${palette}: ${token} needs an OLED treatment`).not.toBe(dark[token]);
    // All secondary surfaces, not just the canvas/editor, remain close to black.
    for (const selector of ['dialog', '.mode-choice', '.theme-choice']) {
      const bg = await page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(luminance(bg), `${palette} ${selector}`).toBeLessThan(0.025);
    }
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    for (const selector of [
      '.problem-panel',
      '.editor-toolbar',
      '.action-bar',
      '.results-panel',
      '.difficulty-card.selected',
    ]) {
      const bg = await page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(luminance(bg), `${palette} ${selector}`).toBeLessThan(0.025);
    }
    const action = await page
      .getByRole('button', { name: 'Finish', exact: true })
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(
      luminance(action),
      `${palette} primary controls should not be bright white`,
    ).toBeLessThan(0.1);
    const theme = await page.locator('html').getAttribute('data-theme');
    await page.screenshot({ path: `test-results/oled-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: 'test-results/oled-claude-mobile.png', fullPage: true });
});

test('PyCharm uses its installed Islands surfaces and persists all three modes', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill('function example(value) { return value + 42; }');
  for (const [mode, id, canvas, editor] of [
    ['Light', 'light', '#e9eaee', '#ffffff'],
    ['Dark', 'dark', '#26282c', '#191a1c'],
    ['Midnight OLED', 'midnight', '#000000', '#000000'],
  ]) {
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const theme = dialog.getByRole('button', { name: 'PyCharm', exact: true });
    await expect(theme).toHaveAttribute('title', /PyCharm 2026.2.3.*Islands/);
    await theme.click();
    await dialog.getByRole('button', { name: mode, exact: true }).click();
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'pycharm');
    await expect(page.locator('html')).toHaveAttribute('data-mode', id);
    for (const [token, expected] of [
      ['--bg', canvas],
      ['--inset', editor],
    ]) {
      expect(
        await page
          .locator('html')
          .evaluate((el, key) => getComputedStyle(el).getPropertyValue(key).trim(), token),
      ).toBe(expected);
    }
    await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText(
      'return value + 42',
    );
    await page.screenshot({ path: `docs/screenshots/pycharm-${id}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'PyCharm', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/pycharm-mobile.png', fullPage: true });
});
