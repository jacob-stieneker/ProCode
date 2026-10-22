import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { angularCrudSolutions } from './fixtures/angular-crud-solutions';
const ui = (page: Page) => page.locator('pc-angular-practice');
async function choose(page: Page, id: string, source: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Angular', exact: true }).click();
  await ui(page)
    .getByRole('button', {
      name:
        id === 'ng-crud-local'
          ? 'Junior Developer'
          : id === 'ng-crud-api'
            ? 'Skilled Developer'
            : 'Senior Developer',
      exact: true,
    })
    .click();
  await ui(page).getByLabel('Angular exercise', { exact: true }).selectOption(id);
  await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(source);
}
async function run(page: Page, mode: 'Run' | 'Finish' = 'Finish') {
  const output = ui(page).getByRole('region', { name: 'Angular practice output' });
  const before = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: mode, exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(before + 1), {
    timeout: 40000,
  });
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
}
test('CRUD grading rejects view-only writes, lost updates, and missing deletion rollback', async ({
  page,
}) => {
  test.setTimeout(120000);
  const cases = [
    [
      'ng-crud-api',
      "import {of} from 'rxjs';\n" +
        angularCrudSolutions['ng-crud-api'].replace(
          'this.api.create(data)',
          'of({id:3,...data,version:1})',
        ),
      'Create and reload',
    ],
    [
      'ng-crud-conflicts',
      angularCrudSolutions['ng-crud-conflicts'].replace(
        'this.api.update(id,data,this.revision)',
        'this.api.update(id,data)',
      ),
      'Conflicting edit',
    ],
    [
      'ng-crud-conflicts',
      angularCrudSolutions['ng-crud-conflicts'].replace('this.contacts.set(before);', ''),
      'Delete failure',
    ],
  ];
  for (const [id, source, failed] of cases) {
    await choose(page, id, source);
    await run(page);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await expect(ui(page).locator('.check-result').filter({ hasText: failed })).toContainText(
      'Failed',
    );
    await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  }
});
test('CRUD preview completes an interactive workflow, resets server per run, and saves the draft', async ({
  page,
}) => {
  await choose(page, 'ng-crud-api', angularCrudSolutions['ng-crud-api']);
  await run(page, 'Run');
  await expect(ui(page).getByText('Run checks passed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Angular exercise preview"]');
  await expect(frame.getByTestId('status')).toHaveText('Ready');
  await frame.getByLabel('Name', { exact: true }).fill('Jo');
  await frame.getByLabel('Email', { exact: true }).fill('jo@example.com');
  await frame.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(frame.getByTestId('contact')).toHaveText([
    'Ada (ada@example.com)',
    'Grace (grace@example.com)',
    'Jo (jo@example.com)',
  ]);
  await frame.getByRole('button', { name: 'Edit Jo', exact: true }).click();
  await frame.getByLabel('Name', { exact: true }).fill('Jo Updated');
  await frame.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(frame.getByTestId('contact')).toContainText(['Ada', 'Grace', 'Jo Updated']);
  await frame.getByRole('button', { name: 'Reload records', exact: true }).click();
  await expect(frame.getByTestId('status')).toHaveText('Ready');
  await expect(frame.getByTestId('contact')).toContainText(['Ada', 'Grace', 'Jo Updated']);
  await frame.getByRole('button', { name: 'Delete Jo Updated', exact: true }).click();
  await expect(frame.getByTestId('contact')).toHaveCount(2);
  await page.reload();
  await expect(ui(page).getByLabel('Angular exercise', { exact: true })).toHaveValue('ng-crud-api');
  // CodeMirror renders only the visible lines of this longer solution.
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('procode.angular-practice.v1')!).drafts['ng-crud-api:v1'],
    ),
  ).toBe(angularCrudSolutions['ng-crud-api']);
  await run(page, 'Run');
  await expect(ui(page).getByText('Run checks passed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(frame.getByTestId('contact')).toHaveText([
    'Ada (ada@example.com)',
    'Grace (grace@example.com)',
  ]);
});
test('CRUD exercise controls and instructions fit mobile and desktop with accessible labels', async ({
  page,
}) => {
  await choose(page, 'ng-crud-conflicts', angularCrudSolutions['ng-crud-conflicts']);
  await run(page, 'Run');
  await expect(ui(page).getByText('Run checks passed.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Angular exercise preview"]');
  await expect(frame.getByTestId('status')).toHaveText('Ready');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await frame.getByRole('button', { name: 'Edit Ada', exact: true }).click();
    await expect(frame.getByLabel('Name', { exact: true })).toHaveValue('Ada');
    await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  await page.locator('iframe[title="Angular exercise preview"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/angular-crud-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await frame.getByRole('button', { name: 'Edit Ada', exact: true }).click();
  await expect(frame.getByLabel('Name', { exact: true })).toHaveValue('Ada');
  await page.locator('iframe[title="Angular exercise preview"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/angular-crud-desktop.png' });
});
