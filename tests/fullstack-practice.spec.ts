import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fullstackSolutions } from './fixtures/fullstack-solutions';
import { fullstackExercises } from '../src/app/core/fullstack/catalog';
import { ProjectFiles } from '../src/app/core/fullstack/model';
import { totalChallenges } from './fixtures/challenge-count';
import { editProject as edit } from './fullstack-drafts';
const ui = (page: Page) => page.locator('pc-fullstack-practice');
async function open(page: Page, id = 'fs-tasks') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Full stack', exact: true }).click();
  const e = fullstackExercises.find((e) => e.id === id)!;
  await ui(page)
    .getByRole('button', {
      name: {
        junior: 'Junior Developer',
        skilled: 'Skilled Developer',
        senior: 'Senior Developer',
      }[e.difficulty],
      exact: true,
    })
    .click();
  await ui(page).getByLabel('Full-stack exercise', { exact: true }).selectOption(id);
}
async function run(page: Page, mode = 'Finish') {
  const output = ui(page).getByRole('region', { name: 'Full-stack practice output' }),
    before = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: mode, exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(before + 1), {
    timeout: 90000,
  });
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
}
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await info.attach('fullstack-console', {
    body: await ui(page).innerText(),
    contentType: 'text/plain',
  });
});
test('nine full-stack projects reject starters and accept complete client/API implementations', async ({
  page,
}) => {
  test.setTimeout(240000);
  for (const e of fullstackExercises) {
    await test.step(e.title, async () => {
      await open(page, e.id);
      await run(page);
      await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
      await edit(page, fullstackSolutions[e.id]);
      await run(page);
      await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
    });
  }
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(
    `${fullstackExercises.length} of ${totalChallenges} challenges completed`,
  );
});
test('full-stack grading rejects cosmetic saves, client-only validation, stale overwrites and duplicate retries', async ({
  page,
}) => {
  test.setTimeout(180000);
  const cases: [string, ProjectFiles, string][] = [
    [
      'fs-tasks',
      {
        ...fullstackSolutions['fs-tasks'],
        'api.js': fullstackSolutions['fs-tasks']['api.js'].replace('db.tasks.push(item);', ''),
      },
      'Create and reload',
    ],
    [
      'fs-guestbook',
      {
        ...fullstackSolutions['fs-guestbook'],
        'api.js': fullstackSolutions['fs-guestbook']['api.js'].replace(
          'if(!valid(body?.name,40)||!valid(body?.message,200))return invalid();',
          '',
        ),
      },
      'Validate on the API',
    ],
    [
      'fs-conflicts',
      {
        ...fullstackSolutions['fs-conflicts'],
        'api.js': fullstackSolutions['fs-conflicts']['api.js'].replace(
          "if(body.version!==db.document.version)return result(409,{error:'Conflict',document:db.document});",
          '',
        ),
      },
      'Reject stale writes',
    ],
    [
      'fs-orders',
      {
        ...fullstackSolutions['fs-orders'],
        'app.ts': fullstackSolutions['fs-orders']['app.ts'].replace(
          'if(!pending||pending.quantity!==quantity)',
          'if(true)',
        ),
      },
      'Recover a lost successful response',
    ],
  ];
  for (const [id, files, failed] of cases) {
    await open(page, id);
    await edit(page, files);
    await run(page);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await expect(ui(page).locator('.check-result').filter({ hasText: failed })).toContainText(
      'Failed',
    );
  }
});
test('project files, completion, preview failures and output tabs behave consistently', async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  await edit(page, fullstackSolutions['fs-tasks']);
  await ui(page).getByRole('button', { name: 'Run', exact: true }).click();
  await expect(
    ui(page).getByRole('region', { name: 'Full-stack practice output' }),
  ).toHaveAttribute('data-completed-attempt', '1');
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Full-stack project preview"]');
  await expect(frame.getByTestId('title-1')).toHaveText('Read docs');
  await ui(page).getByRole('button', { name: 'Fail next request', exact: true }).click();
  await frame.getByTestId('title').fill('Keep my draft');
  await frame.getByTestId('add').click();
  await expect(frame.getByTestId('status')).toHaveText('Error');
  await expect(frame.getByTestId('title')).toHaveValue('Keep my draft');
  await frame.getByTestId('add').click();
  await expect(frame.getByTestId('status')).toHaveText('Saved');
  await ui(page).getByRole('button', { name: 'Run', exact: true }).click();
  await expect(
    ui(page).getByRole('region', { name: 'Full-stack practice output' }),
  ).toHaveAttribute('data-completed-attempt', '2');
  await expect(ui(page).getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(frame.getByTestId('task-row')).toHaveCount(1);
  await run(page);
  const beforeReload = await page.evaluate(
    () => JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts['fs-tasks:v1'],
  );
  await page.reload();
  await expect(ui(page)).toBeVisible();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts['fs-tasks:v1'],
  );
  expect(saved).toEqual(beforeReload);
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-fullstack.json');
  await ui(page).getByRole('button', { name: 'Reset Full-stack project', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Keep my project', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Reset Full-stack project', exact: true }).click();
  await ui(page).getByRole('button', { name: 'Reset project', exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts['fs-tasks:v1'],
    ),
  ).toEqual(fullstackExercises[0].starter);
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(page.locator('iframe[title="Full-stack project preview"]')).toHaveCount(0);
});
test('script errors, API timeouts, isolation and alternative implementations', async ({ page }) => {
  test.setTimeout(180000);
  await open(page);
  await edit(page, { ...fullstackSolutions['fs-tasks'], 'app.ts': 'export function mount( {' });
  await run(page, 'Run');
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).locator('.console-error')).toContainText('app.ts');
  await edit(page, {
    ...fullstackSolutions['fs-tasks'],
    'api.js': 'export async function handleRequest() { while(true) {} }',
  });
  await run(page, 'Run');
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).locator('.console-error')).toContainText(/execution limit|timed out/);
  const probe = `export async function mount(api){
  for(const [name,fn] of [['storage',()=>localStorage.getItem('private')],['parent',()=>parent.document.body.innerHTML],['network',()=>fetch('https://example.com')]]){try{await fn();console.log(name+':allowed');}catch{console.log(name+':blocked');}}
 }`;
  await edit(page, { ...fullstackSolutions['fs-tasks'], 'app.ts': probe });
  await run(page, 'Run');
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
    'storage:blocked',
  );
  await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
    'parent:blocked',
  );
  await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
    'network:blocked',
  );
  const alternative = {
    ...fullstackSolutions['fs-tasks'],
    'api.js': fullstackSolutions['fs-tasks']['api.js'].replace(
      'db.tasks.push(item);',
      'db.tasks = [...db.tasks, item];',
    ),
    'styles.css':
      fullstackSolutions['fs-tasks']['styles.css'] +
      'main { display: grid; gap: 8px; width: 100%; }',
  };
  await edit(page, alternative);
  await run(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
});
test('full-stack workspace is accessible and fits narrow screens with all navigation controls', async ({
  page,
}) => {
  await open(page);
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Full stack', exact: true })).toBeInViewport();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await page.screenshot({ path: `/tmp/procode-fullstack-${width}.png`, fullPage: true });
  }
});

test('new API goals reject unfiltered search, permissive page parsing and partial batch writes', async ({
  page,
}) => {
  test.setTimeout(180000);
  const cases: [string, string, string][] = [
    [
      'fs-catalog',
      fullstackSolutions['fs-catalog']['api.js'].replace(
        'item.name.toLowerCase().includes(query)',
        'true',
      ),
      'API filters independently',
    ],
    [
      'fs-pagination',
      fullstackSolutions['fs-pagination']['api.js']
        .replace('if(!/^\\d+$/.test(rawPage)||!/^\\d+$/.test(rawSize))return bad();', '')
        .replace('page=Number(rawPage)', 'page=parseInt(rawPage,10)'),
      'Reject page=2x',
    ],
    [
      'fs-bulk',
      fullstackSolutions['fs-bulk']['api.js'].replace(
        'if(selected.some(item=>!item))return missing();for(const item of selected)item.status=body.status;',
        'for(const item of selected){if(!item)return missing();item.status=body.status;}',
      ),
      'API atomic rejection',
    ],
  ];
  for (const [id, source, failed] of cases) {
    expect(source).not.toBe(fullstackSolutions[id]['api.js']);
    await open(page, id);
    await edit(page, { ...fullstackSolutions[id], 'api.js': source });
    await run(page);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await expect(ui(page).locator('.check-result').filter({ hasText: failed })).toContainText(
      'Failed',
    );
  }
});
