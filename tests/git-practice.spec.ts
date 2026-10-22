import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gitSolutions } from './fixtures/git-solutions';
import { totalChallenges } from './fixtures/challenge-count';
const ui = (page: Page) => page.locator('pc-git-practice');
const levels = ['Junior Developer', 'Skilled Developer', 'Senior Developer'];
async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Git workflows', exact: true }).click();
  await expect(ui(page)).toBeVisible();
}
async function prepare(page: Page) {
  await ui(page).getByLabel('Prepare pull request after commands').check();
  await ui(page)
    .getByRole('textbox', { name: 'Pull request title', exact: true })
    .fill('Prepare reviewed change');
}
test('all nine workflows reject starters, accept solutions, save reviews and update combined progress', async ({
  page,
}) => {
  await open(page);
  for (const [index, [id, source]] of Object.entries(gitSolutions).entries()) {
    await ui(page)
      .getByRole('button', { name: levels[Math.floor(index / 3)], exact: true })
      .click();
    await ui(page).getByLabel('Git exercise', { exact: true }).selectOption(id);
    await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
    await ui(page)
      .getByRole('tab', { name: /Test results/ })
      .click();
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await ui(page).getByLabel('Git commands', { exact: true }).fill(source);
    await prepare(page);
    await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  }
  await page.reload();
  await expect(ui(page)).toBeVisible();
  await expect(ui(page).getByLabel('Git exercise', { exact: true })).toHaveValue('git-lease');
  await expect(ui(page).getByLabel('Git commands', { exact: true })).toHaveValue(
    gitSolutions['git-lease'],
  );
  await expect(ui(page).getByLabel('Prepare pull request after commands')).toBeChecked();
  await expect(
    ui(page).getByRole('textbox', { name: 'Pull request title', exact: true }),
  ).toHaveValue('Prepare reviewed change');
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(
    `9 of ${totalChallenges} challenges completed`,
  );
  await expect(page.getByRole('dialog')).toContainText('Publish Rewritten History with a Lease');
});
test('repeat runs preserve tabs, errors prevent completion, keyboard controls and export/reset work', async ({
  page,
}) => {
  await open(page);
  const editor = ui(page).getByLabel('Git commands', { exact: true });
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await editor.fill(gitSolutions['git-feature']);
  await prepare(page);
  await editor.press('Control+Enter');
  await expect(ui(page).getByRole('tabpanel')).toContainText('Simulated GitHub pull request');
  await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
  for (let i = 0; i < 3; i++)
    await ui(page).getByRole('button', { name: 'Run', exact: true }).click();
  await expect(ui(page).getByRole('tab', { name: /Test results/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(ui(page).getByText('Run checks passed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('textbox', { name: 'Pull request target', exact: true }).fill('missing');
  await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).getByRole('tabpanel')).toContainText(
    'Both pull request branches must exist on origin',
  );
  await ui(page).getByRole('textbox', { name: 'Pull request target', exact: true }).fill('main');
  await editor.fill(gitSolutions['git-feature'] + '\ngit invalid');
  await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(ui(page).getByRole('tabpanel')).toContainText('Line 5: Unsupported Git command');
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui(page).getByRole('tab', { name: 'State', exact: true })).toBeFocused();
  await expect(ui(page).getByRole('tabpanel')).toContainText('"feature/greeting"');
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-git.json');
  await ui(page).getByRole('button', { name: 'Reset Git starter commands', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Keep my commands', exact: true }).click();
  await expect(editor).toHaveValue(gitSolutions['git-feature'] + '\ngit invalid');
  await ui(page).getByRole('button', { name: 'Reset Git starter commands', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Reset commands', exact: true }).click();
  await expect(editor).toHaveValue('# Inspect the changes, branch, commit, and push.\n');
  await expect(ui(page).getByLabel('Prepare pull request after commands')).not.toBeChecked();
  await editor.fill('');
  await page.reload();
  await expect(ui(page).getByLabel('Git commands', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Algorithms', exact: true })).toBeVisible();
});
test('Git controls and all navigation remain accessible at desktop, tablet and narrow mobile widths', async ({
  page,
}) => {
  await open(page);
  await prepare(page);
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('button', { name: 'Git workflows', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const buttons = await page.locator('nav .nav-item').first().boundingBox();
    expect(buttons).not.toBeNull();
    const boxes = await page.locator('nav .nav-item').evaluateAll((items) =>
      items.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        expect(
          a.x + a.w <= b.x + 1 ||
            b.x + b.w <= a.x + 1 ||
            a.y + a.h <= b.y + 1 ||
            b.y + b.h <= a.y + 1,
        ).toBe(true);
      }
    await page.screenshot({ path: `/tmp/procode-git-${width}.png`, fullPage: true });
    await ui(page).getByText('Command reference', { exact: true }).click();
    await ui(page).getByLabel('Git commands', { exact: true }).fill(gitSolutions['git-feature']);
    await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
    await ui(page)
      .getByRole('tab', { name: /Test results/ })
      .click();
    await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const tabs = await ui(page)
      .getByRole('tab')
      .evaluateAll((items) =>
        items.map((e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, right: r.right };
        }),
      );
    for (const tab of tabs) expect(tab.left >= 0 && tab.right <= width).toBe(true);

    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await ui(page).getByRole('tab', { name: 'State', exact: true }).click();
    const stateAudit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(stateAudit.violations.map((v) => v.id)).toEqual([]);
    await ui(page).getByText('Command reference', { exact: true }).click();
    await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  }
});
