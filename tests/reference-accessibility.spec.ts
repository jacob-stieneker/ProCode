import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('expanded reference content and virtual state support keyboard scrolling on desktop and mobile', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('button', { name: 'Firebase', exact: true }).click();
    const firebase = page.locator('pc-firebase-practice');
    await firebase
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: 'Command reference' }) })
      .evaluate((e) => ((e as HTMLDetailsElement).open = true));
    await firebase.getByRole('tab', { name: 'State', exact: true }).click();
    await expect(firebase.getByLabel('Virtual Firebase state')).toHaveAttribute('tabindex', '0');
    const state = firebase.getByLabel('Virtual Firebase state');
    await state.focus();
    await page.keyboard.press('End');
    const audit = async () => {
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    };
    await audit();
    await page.getByRole('button', { name: 'Full stack', exact: true }).click();
    await page
      .locator('pc-fullstack-practice details')
      .filter({ has: page.locator('summary', { hasText: 'API contract' }) })
      .evaluate((e) => ((e as HTMLDetailsElement).open = true));
    await audit();
    await page.getByRole('button', { name: 'HTML & CSS', exact: true }).click();
    await page
      .locator('pc-web-practice')
      .getByLabel('Web topic', { exact: true })
      .selectOption('css');
    // Audit the app reference panel separately from the learner's isolated live preview.
    await page
      .locator('pc-web-practice')
      .getByRole('tab', { name: 'Test results', exact: true })
      .click();
    await page
      .locator('pc-web-practice details')
      .filter({ has: page.locator('summary', { hasText: 'Provided HTML' }) })
      .evaluate((e) => ((e as HTMLDetailsElement).open = true));
    await audit();
  }
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  const workspace = page.locator('section[aria-label="Code workspace"]');
  await expect(workspace).toBeVisible();
  await workspace
    .locator('[role="textbox"]')
    .fill('function twoSum() { for(let i=0;i<30;i++) console.log("Line",i);return [0,1]; }');
  await expect(workspace.locator('[role="textbox"]')).toContainText('console.log');
  await workspace.locator('.run-button').click();
  const consolePanel = page.locator('#console-content');
  await expect(consolePanel).toContainText('Line');
  await consolePanel.focus();
  await page.keyboard.press('End');
  await expect.poll(() => consolePanel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const consoleAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(consoleAudit.violations.map((v) => v.id)).toEqual([]);
});
