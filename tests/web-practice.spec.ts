import { totalChallenges } from './fixtures/challenge-count';
import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { webExerciseInfo } from '../src/app/core/web/model';
import { webSolutions } from './fixtures/web-solutions';
const levelNames = {
  junior: 'Junior Developer',
  skilled: 'Skilled Developer',
  senior: 'Senior Developer',
};
const ui = (page: Page) => page.locator('pc-web-practice');
async function select(page: Page, id: string) {
  const info = webExerciseInfo.find((e) => e.id === id)!;
  await ui(page).getByLabel('Web topic', { exact: true }).selectOption(info.topic);
  await ui(page).getByRole('button', { name: levelNames[info.difficulty], exact: true }).click();
  await ui(page).getByLabel('Web exercise', { exact: true }).selectOption(id);
}
async function edit(page: Page, code: string) {
  await ui(page).getByRole('textbox', { name: 'Solution code' }).fill(code);
}
async function execute(page: Page, mode: 'Run' | 'Finish') {
  const output = ui(page).getByRole('region', { name: 'Web practice output' });
  const attempt = Number(await output.getAttribute('data-completed-attempt'));
  await ui(page).getByRole('button', { name: mode, exact: true }).click();
  await expect(output).toHaveAttribute('data-completed-attempt', String(attempt + 1));
  await expect(output).toHaveAttribute('aria-busy', 'false');
}
const finish = (page: Page) => execute(page, 'Finish');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'HTML & CSS', exact: true }).click();
});
test('all eighteen exercises reject starters and accept rendered reference solutions', async ({
  page,
}) => {
  test.setTimeout(120000);
  await ui(page).getByRole('tab', { name: 'Test results', exact: true }).click();
  for (const info of webExerciseInfo) {
    await test.step(info.title, async () => {
      await select(page, info.id);
      await finish(page);
      await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
      await edit(page, webSolutions[info.id]);
      await finish(page);
      await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
      await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
    });
  }
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    `${webExerciseInfo.length} of ${totalChallenges} challenges completed`,
  );
});
test('alternative markup and flex layout pass, desktop-only and hidden answers fail', async ({
  page,
}) => {
  await ui(page).getByRole('tab', { name: 'Test results', exact: true }).click();
  await select(page, 'html-contact');
  await edit(
    page,
    '<form><label for="full">Full name</label><input id="full" name="name" required><label for="email">Work email</label><input id="email" name="email" type="email" required><label for="body">Your message</label><textarea id="body" name="message" required></textarea><button type="submit">Contact us</button></form>',
  );
  await finish(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  await edit(page, webSolutions['html-contact'].replace('<form>', '<form hidden>'));
  await finish(page);
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await edit(page, webSolutions['html-contact'].replace('name="name"', 'name="name" disabled'));
  await finish(page);
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await select(page, 'css-grid');
  const desktop = '.cards {display:flex;gap:20px}.card {flex:1;min-height:90px}';
  await edit(page, desktop);
  await execute(page, 'Run');
  await expect(ui(page).getByText('Run checks passed.', { exact: true })).toBeVisible();
  await finish(page);
  await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  await expect(
    ui(page).getByText('At 360px, stack all three cards vertically.', { exact: true }),
  ).toBeVisible();
  await edit(page, desktop + '@media(max-width:600px){.cards{flex-direction:column}}');
  await finish(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
});
test('preview is live, scripts and remote requests are blocked, and output selection stays stable', async ({
  page,
}) => {
  const attempted: string[] = [];
  const blocked: string[] = [];
  page.on('requestfailed', (r) => {
    if (r.url().includes('example.org')) blocked.push(r.failure()?.errorText ?? '');
  });
  page.on('request', (r) => {
    if (r.url().includes('example.org')) attempted.push(r.url());
  });
  await edit(
    page,
    '<h1>Preview changes</h1><script>parent.document.body.dataset.compromised="yes"</script><img src="https://example.org/tracker" onerror="parent.document.body.dataset.compromised=\'yes\'"><iframe src="https://example.org"></iframe><meta http-equiv="refresh" content="0;url=https://example.org"><a href="https://example.org">External link</a>',
  );
  const frame = page.frameLocator('iframe[title="Live exercise preview"]');
  await expect(frame.getByRole('heading', { name: 'Preview changes' })).toBeVisible();
  await expect(frame.locator('script,iframe,meta[http-equiv="refresh"]')).toHaveCount(0);
  expect(await page.locator('body').getAttribute('data-compromised')).toBeNull();
  await frame.getByText('External link').click();
  expect(attempted).toEqual([]);
  await execute(page, 'Run');
  await expect(ui(page).getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  await expect(ui(page).getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await ui(page)
    .getByRole('tab', { name: /Test results/ })
    .click();
  await finish(page);
  await expect(ui(page).getByRole('tab', { name: /Test results/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await select(page, 'css-card');
  await edit(
    page,
    '</style><script>parent.document.body.dataset.compromised="yes"</script><style>@import "https://example.org/style.css"; .card {background:url(https://example.org/image)}',
  );
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(frame.locator('.card')).toBeVisible();
  await finish(page);
  expect(attempted).toEqual([]);
  expect(await page.locator('body').getAttribute('data-compromised')).toBeNull();
  await edit(
    page,
    '@import url(https://example.org/style.css); .card {background-image:url(https://example.org/image)}',
  );
  await execute(page, 'Run');
  expect(attempted.length).toBeGreaterThan(0);
  await expect.poll(() => blocked.length).toBe(attempted.length);
  expect(blocked.every((reason) => /csp|blocked/i.test(reason))).toBe(true);
});
test('drafts, selection and completion persist, reset is scoped and exports work', async ({
  page,
}) => {
  await select(page, 'css-card');
  await edit(page, webSolutions['css-card']);
  await finish(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'HTML & CSS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(ui(page).getByLabel('Web exercise', { exact: true })).toHaveValue('css-card');
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'border-box',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  await ui(page).getByRole('button', { name: 'Reset web starter code' }).click();
  await ui(page).getByRole('button', { name: 'Keep my code' }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).toContainText(
    'border-box',
  );
  await ui(page).getByRole('button', { name: 'Reset web starter code' }).click();
  await ui(page).getByRole('button', { name: 'Reset code', exact: true }).click();
  await expect(ui(page).getByRole('textbox', { name: 'Solution code' })).not.toContainText(
    'border-box',
  );
  await expect(ui(page).getByText('Completed', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export work', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('procode-html-css.json');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(page.getByLabel('Algorithm', { exact: true })).toHaveValue('two-sum');
  await page.getByRole('button', { name: 'HTML & CSS', exact: true }).click();
  await expect(ui(page).getByLabel('Web exercise', { exact: true })).toHaveValue('css-card');
});
test('web practice supports keyboard navigation, all modes, and narrow screens', async ({
  page,
}) => {
  await edit(page, webSolutions['html-profile']);
  await ui(page).getByRole('textbox', { name: 'Solution code' }).press('Escape');
  await expect(ui(page).getByRole('button', { name: 'Run', exact: true })).toBeFocused();
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui(page).getByRole('tab', { name: /Test results/ })).toBeFocused();
  for (const mode of ['Light', 'Dark', 'Midnight OLED']) {
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: mode, exact: true }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
    }
  }
  await page.screenshot({ path: 'docs/screenshots/html-css-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await select(page, 'css-grid');
  await edit(page, webSolutions['css-grid']);
  await finish(page);
  await ui(page).getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.screenshot({ path: 'docs/screenshots/html-css-desktop.png', fullPage: true });
});

test('new web exercises reject broken constraints and accept alternative centering', async ({
  page,
}) => {
  await ui(page).getByRole('tab', { name: 'Test results', exact: true }).click();
  for (const [id, source] of [
    ['html-checkout', webSolutions['html-checkout'].replace('max="5"', 'max="50"')],
    ['html-errors', webSolutions['html-errors'].replace('href="#password"', 'href="#missing"')],
    [
      'html-errors',
      webSolutions['html-errors']
        .replace('Enter a valid email address.', 'Correct the email and password.')
        .replace('aria-describedby="password-error"', 'aria-describedby="email-error"'),
    ],
    [
      'css-center',
      webSolutions['css-center'].replace(
        'border:1px solid #526477',
        'border:1px solid transparent',
      ),
    ],
    ['css-sticky', webSolutions['css-sticky'].replace('position:sticky', 'position:static')],
    ['css-form-layout', webSolutions['css-form-layout'].split('@media')[0]],
  ]) {
    await select(page, id);
    await edit(page, source);
    await finish(page);
    await expect(ui(page).getByText('Some checks failed.', { exact: true })).toBeVisible();
  }
  await select(page, 'css-center');
  await edit(
    page,
    '.stage{min-height:320px;display:flex;align-items:center;justify-content:center}.panel{width:100%;max-width:320px;box-sizing:border-box;padding:20px;border:2px solid #333}button{min-height:40px}',
  );
  await finish(page);
  await expect(ui(page).getByText('Challenge complete.', { exact: true })).toBeVisible();
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: `/tmp/procode-expansion-${width}.png`, fullPage: true });
  }
});
