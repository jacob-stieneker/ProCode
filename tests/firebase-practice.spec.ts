import { totalChallenges } from './fixtures/challenge-count';
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { firebaseSolutions } from './fixtures/firebase-solutions';
const ui = (page: Page) => page.locator('pc-firebase-practice');
const levels = ['Junior Developer', 'Skilled Developer', 'Senior Developer'];
async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Firebase', exact: true }).click();
  await expect(ui(page)).toBeVisible();
}
test('all nine Firebase workflows grade, persist and appear in combined progress', async ({
  page,
}) => {
  await open(page);
  for (const [index, [id, source]] of Object.entries(firebaseSolutions).entries()) {
    await ui(page)
      .getByRole('button', { name: levels[Math.floor(index / 3)], exact: true })
      .click();
    await ui(page).getByLabel('Firebase exercise', { exact: true }).selectOption(id);
    await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
    await ui(page)
      .getByRole('tab', { name: /Test results/ })
      .click();
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await ui(page).getByLabel('Firebase commands', { exact: true }).fill(source);
    await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  }
  await page.reload();
  await expect(ui(page)).toBeVisible();
  await expect(ui(page).getByLabel('Firebase exercise', { exact: true })).toHaveValue('fb-target');
  await expect(ui(page).getByLabel('Firebase commands', { exact: true })).toHaveValue(
    firebaseSolutions['fb-target'],
  );
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(
    `9 of ${totalChallenges} challenges completed`,
  );
  await expect(page.getByRole('dialog')).toContainText('Deploy a Named Hosting Target');
});
test('Run is repeatable, errors are visible, tabs remain selected, and export/reset work', async ({
  page,
}) => {
  await open(page);
  const editor = ui(page).getByLabel('Firebase commands', { exact: true });
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await editor.fill(firebaseSolutions['fb-setup']);
  await editor.press('Control+Enter');
  await expect(ui(page).getByRole('tabpanel')).toContainText('Active project: procode-dev');
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
  await editor.fill(firebaseSolutions['fb-setup'] + '\nfirebase deploy --invalid');
  await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).getByRole('tabpanel')).toContainText(
    'Line 4: Unsupported option --invalid',
  );
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui(page).getByRole('tab', { name: 'State', exact: true })).toBeFocused();
  await expect(ui(page).getByRole('tabpanel')).toContainText('"project": "procode-dev"');
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-firebase.json');
  await ui(page)
    .getByRole('button', { name: 'Reset Firebase starter commands', exact: true })
    .click();
  await ui(page).getByRole('button', { name: 'Keep my commands', exact: true }).click();
  await expect(editor).toHaveValue(firebaseSolutions['fb-setup'] + '\nfirebase deploy --invalid');
  await ui(page)
    .getByRole('button', { name: 'Reset Firebase starter commands', exact: true })
    .click();
  await ui(page).getByRole('button', { name: 'Reset commands', exact: true }).click();
  await expect(editor).toHaveValue('# Sign in, list projects, and select development.\n');
  await editor.fill('');
  await page.reload();
  await expect(ui(page).getByLabel('Firebase commands', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(ui(page)).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Algorithms', exact: true })).toBeVisible();
});
test('Firebase has accessible controls and fits desktop, tablet and narrow mobile', async ({
  page,
}) => {
  await open(page);
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole('button', { name: 'Firebase', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `/tmp/procode-firebase-${width}.png`, fullPage: true });
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});
