import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('workspace and dialogs meet automated WCAG 2.1 AA checks', async ({ page }) => {
  await page.goto('/');
  const audit = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await audit();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await audit();
});
