import { expect, Page, test } from '@playwright/test';
import type { Language } from '../src/app/core/exercises';
import { solutions } from './fixtures/method-cases';
import { choose, completions, submit, substitution } from './method-helpers';
const modes = ['Run', 'Finish'] as const;
const tabs = ['Console', 'Test results'] as const;
const outputTab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(name) });
const executionFinished = (page: Page) =>
  page.waitForEvent('framedetached', {
    predicate: (frame) => frame.url() === 'about:srcdoc',
    timeout: 50000,
  });
interface Attempt {
  language: Language;
  tab: string;
  mode: string;
  correct: boolean;
}
function sourceFor(language: Language, correct: boolean) {
  const source = correct
    ? solutions['selection-sort'][language]
    : substitution('selection-sort', 'bubble-sort', language);
  const log =
    language === 'javascript'
      ? 'console.log("Method grading log");'
      : 'print("Method grading log")';
  return log + '\n' + source;
}
async function checkFeedback(page: Page, correct: boolean, mode: string) {
  await outputTab(page, 'Test results').click();
  const heading = correct
    ? mode === 'Run'
      ? 'Examples passed.'
      : 'Challenge complete.'
    : 'Output correct. Method needs attention.';
  await expect(page.getByText(heading, { exact: true })).toBeVisible();
  await expect(page.locator('.test-row.failed')).toHaveCount(0);
}
async function waitForIdle(page: Page) {
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled({
    timeout: 50000,
  });
}
async function finishAttempt(page: Page, attempt: Attempt) {
  const finished = executionFinished(page);
  await submit(page, 'selection-sort', sourceFor(attempt.language, attempt.correct), attempt.mode);
  await finished;
  await waitForIdle(page);
}
async function checkAttempt(page: Page, attempt: Attempt) {
  const { tab, mode, correct } = attempt;
  await outputTab(page, tab).click();
  const before = await completions(page);
  await finishAttempt(page, attempt);
  await expect(outputTab(page, tab)).toHaveAttribute('aria-selected', 'true');
  if (!correct || mode === 'Run') expect(await completions(page)).toEqual(before);
  await checkFeedback(page, correct, mode);
  await outputTab(page, 'Console').click();
  await expect(page.locator('#console-content')).toContainText('Method grading log');
}
async function delayExecutor(page: Page) {
  await page.route('**/runtime/executor.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
}
async function start(page: Page, language: Language) {
  await page.goto('/');
  await page.getByLabel('Practice language').selectOption(language);
  await choose(page, 'selection-sort');
}
async function changeTabDuringRun(page: Page, language: Language) {
  await outputTab(page, 'Test results').click();
  await delayExecutor(page);
  const finished = executionFinished(page);
  await submit(page, 'selection-sort', sourceFor(language, false));
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled();
  await outputTab(page, 'Console').click();
  await finished;
  await waitForIdle(page);
  await expect(outputTab(page, 'Console')).toHaveAttribute('aria-selected', 'true');
  await expect(outputTab(page, 'Console')).toBeFocused();
  await checkFeedback(page, false, 'Finish');
}
for (const language of ['javascript', 'python'] as const) {
  test(`${language} method checks preserve manually selected tabs for Run and Finish`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await start(page, language);
    for (const tab of tabs)
      for (const correct of [false, true])
        for (const mode of modes) await checkAttempt(page, { language, tab, mode, correct });
  });
  test(`${language} preserves a tab selected while method grading is running`, async ({ page }) => {
    await start(page, language);
    await changeTabDuringRun(page, language);
  });
}
