import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Focus preserves the mounted editor, draft, undo history and output selection', async ({
  page,
}) => {
  await page.goto('/');
  const workspace = page.locator('section[aria-label="Code workspace"]');
  const editor = workspace.getByRole('textbox', { name: 'Solution code' });
  const original = await editor.elementHandle();
  await editor.fill('function twoSum() { console.log("focus check"); return [0, 1]; }');
  await workspace.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.console-output')).toContainText('focus check');
  const results = page.getByRole('tab', { name: /Test results/ });
  await results.click();
  const focus = page.getByRole('button', { name: 'Focus mode', exact: true });
  const before = (await editor.boundingBox())!.width;
  await focus.click();
  await expect(focus).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.problem-panel')).toBeHidden();
  expect((await editor.boundingBox())!.width).toBeGreaterThan(before);
  expect(await original!.evaluate((el) => el.isConnected)).toBe(true);
  await expect(results).toHaveAttribute('aria-selected', 'true');
  await expect(editor).toContainText('focus check');
  await focus.click();
  await expect(page.locator('.problem-panel')).toBeVisible();
  await editor.press('ControlOrMeta+z');
  await expect(editor).toContainText('Write your solution here.');
});

test('Focus works across every practice area and stays out of quizzes', async ({ page }) => {
  await page.goto('/');
  const focus = page.getByRole('button', { name: 'Focus mode', exact: true });
  for (const section of [
    'Data structures',
    'Angular',
    'HTML & CSS',
    'Full stack',
    'Firebase',
    'Git workflows',
  ]) {
    await page.getByRole('button', { name: section, exact: true }).click();
    const instructions = page
      .locator('.problem-panel, .workspace > .instructions')
      .filter({ visible: true });
    await expect(instructions).toHaveCount(1);
    await focus.click();
    await expect(
      page.locator('.problem-panel:visible, .workspace > .instructions:visible'),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
    await focus.click();
    await expect(instructions).toHaveCount(1);
  }
  await focus.click();
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await expect(focus).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start quiz', exact: true })).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/focus-mode/);
});

test('workbench responsive and reduced-motion inspection batch', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Junior Developer', exact: true })).toBeVisible();
    const focus = page.getByRole('button', { name: 'Focus mode', exact: true });
    await focus.focus();
    await page.keyboard.press('Enter');
    await expect(focus).toHaveAttribute('aria-pressed', 'true');
    expect(await focus.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await page.keyboard.press('Enter');
    await page.screenshot({ path: `/tmp/procode-workbench-${width}.png`, fullPage: true });
  }
  for (const section of ['Angular', 'Full stack', 'Git workflows', 'Knowledge quizzes']) {
    await page.getByRole('button', { name: section, exact: true }).click();
    await expect(page.getByRole('heading', { name: section, exact: true }).first()).toBeVisible();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `/tmp/procode-workbench-${section.replaceAll(' ', '-')}-${width}.png`,
        fullPage: true,
      });
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    }
  }
});
