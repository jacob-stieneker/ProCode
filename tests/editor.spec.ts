import { test, expect } from '@playwright/test';

for (const language of ['javascript', 'python']) {
  test(`${language} pairs brackets, skips closers, wraps selections, and deletes empty pairs`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    const editor = page.getByRole('textbox', { name: 'Solution code' });
    for (const [open, close] of [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ]) {
      await editor.fill('');
      await editor.pressSequentially(open);
      await expect(editor).toHaveText(open + close);
      await editor.press('Backspace');
      await expect(editor).toHaveText('');
      await editor.pressSequentially(open + close);
      await expect(editor).toHaveText(open + close);
      await editor.pressSequentially('x');
      await expect(editor).toHaveText(open + close + 'x');
    }
    await editor.fill('value');
    await editor.press('ControlOrMeta+a');
    await editor.pressSequentially('(');
    await expect(editor).toHaveText('(value)');
    await editor.press('ControlOrMeta+z');
    await expect(editor).toHaveText('value');
  });
}
test('nested pairs have matching colors and cursor highlights the active pair', async ({
  page,
}) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.fill('function f() { if (true) { return [1]; } }');
  const pairs = await editor
    .locator('[class*="cm-bracket-depth-"]')
    .evaluateAll((nodes) =>
      nodes.map((n) => ({ text: n.textContent, color: getComputedStyle(n).color })),
    );
  const colorMismatches = await editor
    .locator('[class*="cm-bracket-depth-"]')
    .evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        [...node.querySelectorAll('*')].filter(
          (child) => getComputedStyle(child).color !== getComputedStyle(node).color,
        ),
      ),
    );
  expect(colorMismatches).toHaveLength(0);
  await page.screenshot({ path: 'test-results/editor-bracket-colors.png', fullPage: true });
  const braces = pairs.filter((p) => p.text === '{' || p.text === '}');
  expect(braces).toHaveLength(4);
  expect(braces[0].color).toBe(braces[3].color);
  expect(braces[1].color).toBe(braces[2].color);
  expect(braces[0].color).not.toBe(braces[1].color);
  await editor.press('ControlOrMeta+End');
  await expect(editor.locator('.cm-matchingBracket')).toHaveCount(2);
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(editor).toHaveText('function f() { if (true) { return [1]; } }');
  await editor.press('Escape');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeFocused();
});
