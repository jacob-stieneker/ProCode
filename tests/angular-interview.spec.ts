import { totalChallenges } from './fixtures/challenge-count';
import { test, expect, Page } from '@playwright/test';
import { angularExercises } from '../src/app/core/angular/catalog';
import { angularKey } from '../src/app/core/angular/model';
import { angularSolutions } from './fixtures/angular-solutions';
const ui = (page: Page) => page.locator('pc-angular-practice');
const storageKey = 'procode.angular-practice.v1';
const difficultyLabels = {
  junior: 'Junior Developer',
  skilled: 'Skilled Developer',
  senior: 'Senior Developer',
};
async function savedDraft(page: Page, id: string) {
  const key = angularKey(angularExercises.find((exercise) => exercise.id === id)!);
  return page.evaluate(
    ({ storageKey, key }) => JSON.parse(localStorage.getItem(storageKey)!).drafts[key],
    { storageKey, key },
  );
}
async function readyEditor(page: Page, id: string, starter: string) {
  const editor = ui(page).getByRole('textbox', { name: 'Solution code' });
  const expected = (await savedDraft(page, id)) ?? starter;
  await editor.press('ControlOrMeta+Home');
  await expect(editor).toContainText(expected.split('\n').slice(0, 3).join('\n'), {
    useInnerText: true,
  });
  return editor;
}
async function fillSolution(page: Page, id: string, source: string) {
  const exercise = angularExercises.find((exercise) => exercise.id === id)!;
  await ui(page)
    .getByRole('button', { name: difficultyLabels[exercise.difficulty], exact: true })
    .click();
  await ui(page).getByLabel('Angular exercise', { exact: true }).selectOption(id);
  const editor = await readyEditor(page, id, exercise.starter);
  await editor.fill(source);
  await expect.poll(() => savedDraft(page, id)).toBe(source);
}
async function solve(page: Page, id: string, source: string) {
  await fillSolution(page, id, source);
  const output = ui(page).getByRole('region', { name: 'Angular practice output' });
  const attempt = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(attempt + 1), {
    timeout: 35000,
  });
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Angular', exact: true }).click();
});
test('interview checks reject plausible boundary, validation, touch and cleanup mistakes', async ({
  page,
}) => {
  const cases = [
    [
      'ng-pipe',
      angularSolutions['ng-pipe'].replace('clean.length>limit', 'clean.length>=limit'),
      'Exact boundary',
    ],
    [
      'ng-form-array',
      angularSolutions['ng-form-array'].replace('control.value.trim()?null', 'control.value?null'),
      'Blank added row',
    ],
    [
      'ng-value-accessor',
      angularSolutions['ng-value-accessor'].replace(
        'this.value.set(value ?? 0);',
        'this.value.set(value ?? 0);this.onTouched();',
      ),
      'Programmatic write',
    ],
    [
      'ng-cleanup',
      angularSolutions['ng-cleanup']
        .replace('import {Subject}', 'import {Subject, take}')
        .replace('pipe(takeUntilDestroyed())', 'pipe(take(1),takeUntilDestroyed())'),
      'Several events',
    ],
  ];
  for (const [id, source, failedCheck] of cases) {
    await solve(page, id, source);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await expect(ui(page).locator('.check-result').filter({ hasText: failedCheck })).toContainText(
      'Failed',
    );
    await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  }
});
test('alternative input derivation and explicit subscription cleanup are accepted', async ({
  page,
}) => {
  const lifecycle = angularExercises
    .find((e) => e.id === 'ng-input-lifecycle')!
    .starter.replace('implements OnInit', '')
    .replace("display='';", '')
    .replace('ngOnInit(){ this.display=', 'get display(){ return ');
  const cleanup = angularSolutions['ng-cleanup']
    .replace(
      'constructor(){this.bus.events.pipe(takeUntilDestroyed()).subscribe(',
      'subscription=this.bus.events.subscribe(',
    )
    .replace('n=>n+1));}', 'n=>n+1));\n ngOnDestroy(){this.subscription.unsubscribe();}');
  for (const [id, source] of [
    ['ng-input-lifecycle', lifecycle],
    ['ng-cleanup', cleanup],
  ]) {
    await solve(page, id, source);
    await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  }
});
test('new selections, drafts and completions coexist with original saved Angular work', async ({
  page,
}) => {
  await solve(page, 'ng-pipe', angularSolutions['ng-pipe']);
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await page.reload();
  await expect(ui(page).getByLabel('Angular exercise', { exact: true })).toHaveValue('ng-pipe');
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'clean.slice',
  );
  await solve(page, 'ng-counter', angularSolutions['ng-counter']);
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    `2 of ${totalChallenges} challenges completed`,
  );
});
