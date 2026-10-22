import { totalChallenges } from './fixtures/challenge-count';
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { angularExerciseInfo } from '../src/app/core/angular/model';
import { angularSolutions } from './fixtures/angular-solutions';
const ui = (page: Page) => page.locator('pc-angular-practice');
const levels = {
  junior: 'Junior Developer',
  skilled: 'Skilled Developer',
  senior: 'Senior Developer',
};
async function choose(page: Page, id: string) {
  const e = angularExerciseInfo.find((e) => e.id === id)!;
  await ui(page).getByRole('button', { name: levels[e.difficulty], exact: true }).click();
  await ui(page).getByLabel('Angular exercise', { exact: true }).selectOption(id);
}
async function edit(page: Page, source: string) {
  await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(source);
}
async function run(page: Page, mode: 'Run' | 'Finish' = 'Finish') {
  const output = ui(page).getByRole('region', { name: 'Angular practice output' }),
    before = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: mode, exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(before + 1), {
    timeout: 35000,
  });
  await expect(output).toHaveAttribute('aria-busy', 'false');
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Angular', exact: true }).click();
});
test('all twenty-one Angular starters fail and real Angular solutions pass every scenario', async ({
  page,
}) => {
  test.setTimeout(180000);
  await ui(page).getByRole('tab', { name: 'Test results', exact: true }).click();
  for (const e of angularExerciseInfo) {
    await test.step(e.title, async () => {
      await choose(page, e.id);
      await run(page);
      await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
      await edit(page, angularSolutions[e.id]);
      await run(page);
      await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
      await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
    });
  }
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    `21 of ${totalChallenges} challenges completed`,
  );
});
test('different valid state implementation works and preview interactions render through Angular', async ({
  page,
}) => {
  const alternate = angularSolutions['ng-counter']
    .replaceAll('count()', 'count')
    .replace('count = signal(0);', 'count = 0;')
    .replace('this.count.update(n=>n+1);', 'this.count++;')
    .replace('this.count.update(n=>Math.max(0,n-1));', 'this.count=Math.max(0,this.count-1);')
    .replace('this.count.set(0);', 'this.count=0;');
  await edit(page, alternate);
  await run(page);
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Angular exercise preview"]');
  await frame.getByRole('button', { name: 'Increase', exact: true }).click();
  await expect(frame.locator('[data-testid=count]')).toHaveText('1');
  await run(page, 'Run');
  await expect(ui(page).getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(frame.locator('[data-testid=count]')).toHaveText('0');
});
test('compiler, template, runtime and loop errors are actionable and the runner recovers', async ({
  page,
}) => {
  test.setTimeout(120000);
  const examples = [
    ['export class AppComponent { broken = ; }', 'TS'],
    [angularSolutions['ng-counter'].replace('{{count()}}', '{{count(}}'), 'Parser Error'],
    [
      angularSolutions['ng-counter'].replace(
        'count = signal(0);',
        'count = signal(0); constructor(){ console.log("Before failure"); throw new Error("Practice boom"); }',
      ),
      'Practice boom',
    ],
    [
      angularSolutions['ng-counter'].replace(
        'count = signal(0);',
        'count = signal(0); constructor(){ while(true) {} }',
      ),
      'Execution limit reached',
    ],
    [
      angularSolutions['ng-counter'].replace("'@angular/core'", "'unavailable-package'"),
      'not available',
    ],
  ];
  for (const [source, message] of examples) {
    await edit(page, source);
    await run(page, 'Run');
    await expect(ui(page).locator('#ng-console-panel')).toContainText(message);
    if (message === 'Practice boom')
      await expect(ui(page).locator('#ng-console-panel')).toContainText('Before failure');
  }
  await edit(page, angularSolutions['ng-counter']);
  await run(page);
  await expect(ui(page).locator('#ng-console-panel .console-error')).toHaveCount(0);
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
});
test('Angular runtime cannot read app storage, access parent DOM, or use the network', async ({
  page,
}) => {
  const probe = angularSolutions['ng-counter'].replace(
    'count = signal(0);',
    `count = signal(0); constructor(){
 try { console.log('STORE',localStorage.getItem('procode.workspace.v1')); } catch { console.log('STORE_BLOCKED'); }
 try { console.log('PARENT',parent.document.title); } catch { console.log('PARENT_BLOCKED'); }
 fetch('https://example.org/probe').catch(()=>console.log('NETWORK_BLOCKED'));
 }`,
  );
  await edit(page, probe);
  await run(page, 'Run');
  const consolePanel = ui(page).locator('#ng-console-panel');
  await expect(consolePanel).toContainText('STORE_BLOCKED');
  await expect(consolePanel).toContainText('PARENT_BLOCKED');
  await expect(consolePanel).toContainText('NETWORK_BLOCKED');
  expect(
    await page.locator('iframe[title="Angular exercise preview"]').getAttribute('sandbox'),
  ).toBe('allow-scripts allow-forms');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(page.locator('iframe[title="Angular exercise preview"]')).toHaveCount(0);
});
test('Angular drafts, completion, reset, export and selection survive navigation and reload', async ({
  page,
}) => {
  await choose(page, 'ng-service');
  await edit(page, angularSolutions['ng-service']);
  await run(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Angular', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(ui(page).getByLabel('Angular exercise', { exact: true })).toHaveValue('ng-service');
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText('CartStore');
  await ui(page).getByRole('button', { name: 'Reset Angular starter code' }).click();
  await ui(page).getByRole('button', { name: 'Keep my code' }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).not.toContainText(
    'providers:[CartStore]',
  );
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-angular.json');
  await ui(page).getByRole('button', { name: 'Reset Angular starter code' }).click();
  await ui(page).getByRole('button', { name: 'Reset code', exact: true }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'providers:[CartStore]',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'HTML & CSS', exact: true }).click();
  await page.getByRole('button', { name: 'Angular', exact: true }).click();
  await expect(ui(page).getByLabel('Angular exercise', { exact: true })).toHaveValue('ng-service');
});
test('Angular practice supports keyboard navigation, themes and mobile layouts', async ({
  page,
}) => {
  await edit(page, angularSolutions['ng-counter']);
  await ui(page).getByRole('textbox', { name: 'Solution code' }).press('Escape');
  await expect(ui(page).getByRole('button', { name: 'Run', exact: true })).toBeFocused();
  await run(page);
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui(page).getByRole('tab', { name: 'Preview', exact: true })).toBeFocused();
  for (const mode of ['Light', 'Dark', 'Midnight OLED']) {
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: mode, exact: true }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(
        page
          .frameLocator('iframe[title="Angular exercise preview"]')
          .locator('[data-testid=count]'),
      ).toHaveText('0');
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
    }
  }
  await page.locator('iframe[title="Angular exercise preview"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/angular-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: 'docs/screenshots/angular-desktop.png', fullPage: true });
});

test('Run does not award completion, repeated attempts retain output, and preview errors reach Console', async ({
  page,
}) => {
  const source = angularSolutions['ng-counter'].replace(
    'count = signal(0);',
    'count = signal(0); constructor(){ console.log("Counter ready"); }',
  );
  await edit(page, source);
  await run(page, 'Run');
  await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  const panel = ui(page).locator('#ng-console-panel');
  const previous = await panel.textContent();
  await ui(page).getByRole('button', { name: 'Run', exact: true }).click();
  await expect(ui(page).getByRole('button', { name: 'Run', exact: true })).toBeDisabled();
  await expect(panel).toHaveText(previous!);
  await expect(ui(page).getByRole('region', { name: 'Angular practice output' })).toHaveAttribute(
    'data-completed-attempt',
    '2',
  );
  await expect(panel).toHaveText(previous!);
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  await edit(
    page,
    source.replace(
      'this.count.update(n=>n+1);',
      'if(this.count() >= 3) throw new Error("Counter limit"); this.count.update(n=>n+1);',
    ),
  );
  await run(page, 'Run');
  const frame = page.frameLocator('iframe[title="Angular exercise preview"]');
  for (let i = 0; i < 4; i++)
    await frame.getByRole('button', { name: 'Increase', exact: true }).click();
  await ui(page).getByRole('tab', { name: 'Console', exact: true }).click();
  await expect(panel).toContainText('Counter limit');
});
