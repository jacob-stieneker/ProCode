import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cleanExercises } from '../src/app/core/clean/catalog';
import { cleanSolutions } from './fixtures/clean-solutions';
import { totalChallenges } from './fixtures/challenge-count';
const ui = (page: Page) => page.locator('pc-clean-practice');
async function open(page: Page, id = 'cc-total', language = 'javascript') {
  await page.getByRole('button', { name: 'Clean code', exact: true }).click();
  const exercise = cleanExercises.find((e) => e.id === id)!;
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
  await ui(page).getByLabel('Clean code exercise', { exact: true }).selectOption(id);
  await ui(page).getByLabel('Clean code language', { exact: true }).selectOption(language);
}
async function execute(page: Page, mode = 'Finish') {
  const output = ui(page).getByRole('region', { name: 'Clean code practice output' });
  const attempt = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: mode, exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(attempt + 1), {
    timeout: 60000,
  });
}
async function results(page: Page) {
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
}

test('all fifteen sloppy starters keep behavior but fail cleanup; JavaScript and Python refactorings pass', async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.goto('/');
  for (const exercise of cleanExercises)
    for (const language of ['javascript', 'python'] as const) {
      await test.step(`${exercise.title} ${language}`, async () => {
        await open(page, exercise.id, language);
        await execute(page);
        await results(page);
        await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
        const behavior = ui(page)
          .locator('.check-result')
          .filter({ has: page.getByText('Behavior', { exact: true }) });
        for (const row of await behavior.all()) await expect(row).toContainText('Passed');
        await ui(page)
          .getByRole('textbox', { name: 'Solution code' })
          .fill(cleanSolutions[exercise.id][language]);
        await execute(page);
        await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
      });
    }
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    `${cleanExercises.length * 2} of ${totalChallenges} challenges completed`,
  );
  await expect(page.getByRole('dialog')).toContainText('Clean code · Python');
});

test('cleanup cannot substitute for correct behavior or protection against nested mutation', async ({
  page,
}) => {
  await page.goto('/');
  await open(page);
  await ui(page)
    .getByRole('textbox', { name: 'Solution code' })
    .fill('function orderTotal(lines) { return 999; }');
  await execute(page);
  await results(page);
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await expect(
    ui(page).locator('.check-result').filter({ hasText: 'Replace short binding names' }),
  ).toContainText('Passed');
  await open(page, 'cc-ranking');
  await ui(page)
    .getByRole('textbox', { name: 'Solution code' })
    .fill(
      cleanExercises
        .find((e) => e.id === 'cc-ranking')!
        .starter.javascript.replace('records.sort(', 'records = [...records]; records.sort('),
    );
  await execute(page);
  await results(page);
  await expect(
    ui(page).locator('.check-result').filter({ hasText: 'Preserve caller inputs' }),
  ).toContainText('Failed');
  await open(page, 'cc-total');
  await ui(page)
    .getByRole('textbox', { name: 'Solution code' })
    .fill(
      'function orderTotal(lines) { let totalCents = 0; for (const line of lines) totalCents += line.priceCents * line.quantity; return totalCents; }',
    );
  await execute(page);
  await results(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
});

test('drafts, language, output selection, completion, reset, export and Focus work together', async ({
  page,
}) => {
  await page.goto('/');
  await open(page);
  const editor = ui(page).getByRole('textbox', { name: 'Solution code' });
  await editor.fill(cleanSolutions['cc-total'].javascript + '\nconsole.log("refactor saved");');
  await execute(page, 'Run');
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
    'refactor saved',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await expect(
    ui(page).getByRole('region', { name: 'Clean code challenge instructions' }),
  ).toBeHidden();
  await execute(page);
  await execute(page);
  await expect(ui(page).getByRole('tab', { name: 'Console', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await open(page, 'cc-total', 'python');
  await expect(editor).toContainText('def order_total');
  // Use CodeMirror's selection commands so a lazy syntax update cannot invalidate a DOM-only selection.
  await editor.focus();
  await editor.press('ControlOrMeta+a');
  await editor.press('Backspace');
  await expect(editor).toHaveText('');
  await page.reload();
  await expect(ui(page)).toBeVisible();
  await expect(ui(page).getByLabel('Clean code language')).toHaveValue('python');
  await expect(editor).toHaveText('');
  await ui(page).getByLabel('Clean code language').selectOption('javascript');
  await expect(editor).toContainText('refactor saved');
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-clean-code.json');
  await ui(page).getByRole('button', { name: 'Reset Clean code starter' }).click();
  await ui(page).getByRole('button', { name: 'Keep my code', exact: true }).click();
  await expect(editor).toContainText('refactor saved');
  await ui(page).getByRole('button', { name: 'Reset Clean code starter' }).click();
  await ui(page).getByRole('button', { name: 'Reset code', exact: true }).click();
  await expect(editor).toContainText('let x = 0');
  await ui(page).getByLabel('Clean code language').selectOption('python');
  await expect(editor).toHaveText('');
});

test('syntax errors, runtime errors and loops are visible and leaving an active run cancels it', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await open(page);
  for (const [language, source, message] of [
    ['javascript', 'function orderTotal( {', 'solution.js'],
    ['python', 'def order_total(:', 'SyntaxError'],
    [
      'javascript',
      'function orderTotal(lines) { throw Error("broken calculation"); }',
      'broken calculation',
    ],
    ['javascript', 'function orderTotal(lines) { while(true) {} }', 'Time limit reached'],
  ]) {
    await ui(page).getByLabel('Clean code language').selectOption(language);
    await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(source);
    await execute(page, 'Run');
    await expect(ui(page).getByRole('tabpanel', { name: 'Console', exact: true })).toContainText(
      message,
    );
  }
  await ui(page).getByRole('button', { name: 'Run', exact: true }).click();
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(ui(page)).toBeHidden();
  await page.getByRole('button', { name: 'Clean code', exact: true }).click();
  await expect(ui(page).getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  await ui(page)
    .getByRole('textbox', { name: 'Solution code' })
    .fill(cleanSolutions['cc-total'].javascript);
  await execute(page);
  await results(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
});

test('clean-code navigation and expanded feedback are accessible at desktop and mobile widths', async ({
  page,
}) => {
  await page.goto('/');
  await open(page);
  await execute(page);
  await results(page);
  await ui(page).getByText('Cleanup checks', { exact: true }).click();
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const label of [
      'Algorithms',
      'Data structures',
      'Clean code',
      'Angular',
      'HTML & CSS',
      'Full stack',
      'Firebase',
      'Git workflows',
      'Knowledge quizzes',
      'My progress',
    ])
      await expect(page.getByRole('button', { name: label, exact: true })).toBeInViewport();
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await page.screenshot({ path: `/tmp/procode-clean-${width}.png`, fullPage: true });
  }
  const consoleTab = ui(page).getByRole('tab', { name: 'Console', exact: true });
  await consoleTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui(page).getByRole('tab', { name: /Test results/ })).toBeFocused();
});

test('new cleanup goals reject behavior regressions and nested Python mutation', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  const cases: [string, 'javascript' | 'python', string][] = [
    [
      'cc-retry',
      'javascript',
      cleanSolutions['cc-retry'].javascript.replace(
        'Math.min(MAX_DELAY_MS,Math.max(BASE_DELAY_MS*2**attempt,retryAfterMs??0))',
        'Math.max(Math.min(MAX_DELAY_MS,BASE_DELAY_MS*2**attempt),retryAfterMs??0)',
      ),
    ],
    [
      'cc-coupon',
      'javascript',
      cleanSolutions['cc-coupon'].javascript.replace(
        "if(!order.active)return 'inactive';",
        "if(order.existingDiscount)return 'exclusive';if(!order.active)return 'inactive';",
      ),
    ],
    [
      'cc-tags',
      'python',
      `def normalize_tags(records):
    result = []
    for record in records:
        record["tags"][:] = sorted({tag.strip().lower() for tag in record["tags"] if tag.strip()})
        result.append({"id": record["id"], "tags": record["tags"]})
    return result`,
    ],
  ];
  for (const [id, language, source] of cases) {
    expect(source).not.toBe(cleanSolutions[id][language]);
    await open(page, id, language);
    await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(source);
    await execute(page);
    await results(page);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
    await expect(ui(page).getByText('Completed', { exact: true })).toHaveCount(0);
  }
  await expect(
    ui(page).locator('.check-result').filter({ hasText: 'Preserve caller inputs' }),
  ).toContainText('Failed');
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `/tmp/procode-more-clean-${width}.png`, fullPage: true });
  }
});
