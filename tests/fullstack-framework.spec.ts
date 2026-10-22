import { test, expect, Page } from '@playwright/test';
import { fullstackExercises } from '../src/app/core/fullstack/catalog';
import { ProjectFiles, fileNames } from '../src/app/core/fullstack/model';
import { angularFullstackSolutions } from './fixtures/fullstack-angular-solutions';
import { fullstackSolutions } from './fixtures/fullstack-solutions';
const ui = (page: Page) => page.locator('pc-fullstack-practice');
async function open(page: Page, id = 'fs-tasks') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Full stack', exact: true }).click();
  const exercise = fullstackExercises.find((e) => e.id === id)!;
  await ui(page)
    .getByRole('button', {
      name: {
        junior: 'Junior Developer',
        skilled: 'Skilled Developer',
        senior: 'Senior Developer',
      }[exercise.difficulty],
      exact: true,
    })
    .click();
  await ui(page).getByLabel('Full-stack exercise', { exact: true }).selectOption(id);
}
async function edit(page: Page, files: ProjectFiles) {
  for (const name of fileNames) {
    await ui(page).getByRole('tab', { name, exact: true }).click();
    await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(files[name]);
  }
}
async function run(page: Page) {
  const output = ui(page).getByRole('region', { name: 'Full-stack practice output' });
  const before = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(before + 1), {
    timeout: 90000,
  });
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
}

test('all nine real Angular and router implementations pass the unchanged behavioral goals', async ({
  page,
}) => {
  test.setTimeout(240000);
  for (const exercise of fullstackExercises) {
    await test.step(exercise.title, async () => {
      await open(page, exercise.id);
      await edit(page, angularFullstackSolutions[exercise.id]);
      await run(page);
      await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
    });
  }
});

test('framework scaffold supplies startup and routing without completing CRUD or validation', async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await edit(page, {
    ...angularFullstackSolutions['fs-tasks'],
    'api.js': fullstackExercises[0].starter['api.js'],
  });
  await run(page);
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
    '501',
  );
  await edit(page, {
    ...angularFullstackSolutions['fs-tasks'],
    'index.html': angularFullstackSolutions['fs-tasks']['index.html'].replace(
      '(click)="add()"',
      '',
    ),
  });
  await run(page);
  await expect(
    ui(page).locator('.check-result').filter({ hasText: 'Create and reload' }),
  ).toContainText('Failed');
});

test('Angular template/import errors reach Console and recover; framework remains isolated', async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  for (const files of [
    { ...angularFullstackSolutions['fs-tasks'], 'index.html': '<main>{{ invalid( }}</main>' },
    {
      ...angularFullstackSolutions['fs-tasks'],
      'app.ts': "import {thing} from 'unavailable-package'; console.log(thing);",
    },
    {
      ...angularFullstackSolutions['fs-tasks'],
      'api.js': "import {thing} from 'unavailable-package'; export const handleRequest=thing;",
    },
  ]) {
    await edit(page, files);
    await run(page);
    await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
    await expect(ui(page).locator('.console-error')).toBeVisible();
  }
  const files = angularFullstackSolutions['fs-tasks'];
  await edit(page, {
    ...files,
    'app.ts': files['app.ts'].replace(
      'async ngOnInit() {',
      `async ngOnInit() {
    for(const [name,fn] of [['storage',()=>localStorage.getItem('private')],['parent',()=>parent.document.body],['network',()=>fetch('https://example.com')]]) {
      try { await fn(); console.log(name+':allowed'); } catch { console.log(name+':blocked'); }
    }`,
    ),
  });
  await run(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  const consolePanel = ui(page).getByRole('tabpanel', { name: 'Console', exact: true });
  for (const name of ['storage', 'parent', 'network'])
    await expect(consolePanel).toContainText(name + ':blocked');
});

test('saved app.js projects migrate without code loss and still execute; reset adopts Angular', async ({
  page,
}) => {
  test.setTimeout(90000);
  const { 'app.ts': source, ...rest } = fullstackSolutions['fs-tasks'];
  await page.addInitScript(
    ({ source, rest }) =>
      localStorage.setItem(
        'procode.fullstack-practice.v1',
        JSON.stringify({
          schema: 1,
          active: true,
          difficulty: 'junior',
          selected: { junior: 'fs-tasks' },
          drafts: { 'fs-tasks:v1': { ...rest, 'app.js': source } },
          completions: [{ key: 'fs-tasks:v1', completedAt: '2026-10-08T12:00:00Z' }],
        }),
      ),
    { source, rest },
  );
  await page.goto('/');
  await expect(ui(page)).toBeVisible();
  await ui(page).getByRole('tab', { name: 'app.ts', exact: true }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'export async function mount(api)',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await run(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts['fs-tasks:v1'],
  );
  // Compare exported storage rather than CodeMirror's display-only whitespace normalization.
  expect(saved).toEqual(fullstackSolutions['fs-tasks']);
  await ui(page).getByRole('button', { name: 'Reset Full-stack project', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Reset project', exact: true }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'export class AppComponent',
  );
});
