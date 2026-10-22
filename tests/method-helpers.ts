import { expect, Page, TestInfo } from '@playwright/test';
import { exercises, Language } from '../src/app/core/exercises';
import { solutions } from './fixtures/method-cases';
import { replaceEditorCode } from './editor-input';
const timeout = 50000;
const difficultyNames = {
  junior: /Junior Developer/,
  skilled: /Skilled Developer/,
  senior: /Senior Developer/,
};
export const exerciseFor = (id: string) => exercises.find((exercise) => exercise.id === id)!;
export async function open(page: Page, language: Language) {
  await page.goto('/');
  await page.getByLabel('Practice language').selectOption(language);
  await page.getByRole('tab', { name: /Test results/ }).click();
}
async function currentDraft(page: Page, id: string) {
  const language = (await page.getByLabel('Practice language').inputValue()) as Language;
  const exercise = exerciseFor(id);
  const key = `${id}:v${exercise.version}:${language}`;
  const drafts = await page.evaluate(
    () => JSON.parse(localStorage.getItem('procode.workspace.v1')!).drafts,
  );
  return drafts[key] ?? exercise.starter[language];
}
async function readyEditor(page: Page, id: string) {
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.press('ControlOrMeta+Home');
  const prefix = (await currentDraft(page, id)).split('\n').slice(0, 3).join('\n');
  await expect(editor).toContainText(prefix, { useInnerText: true });
  return editor;
}
export async function choose(page: Page, id: string) {
  const exercise = exerciseFor(id);
  const name = exercise.area === 'data-structures' ? 'Data structures' : 'Algorithms';
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: difficultyNames[exercise.difficulty] }).click();
  await page.locator('#algorithm').selectOption(id);
  return readyEditor(page, id);
}
export async function submit(page: Page, id: string, source: string, mode = 'Finish') {
  const editor = await choose(page, id);
  await replaceEditorCode(editor, source);
  await expect.poll(() => currentDraft(page, id)).toBe(source);
  await page.getByRole('button', { name: mode, exact: true }).click();
}
export async function correctOutput(page: Page) {
  await expect(
    page.getByText('Output correct. Method needs attention.', { exact: true }),
  ).toBeVisible({ timeout });
  await expect(page.locator('.test-row.failed')).toHaveCount(0);
}
export async function flagged(page: Page, status: string) {
  await correctOutput(page);
  await expect(page.getByText(status, { exact: true })).toBeVisible();
}
export async function completed(page: Page) {
  await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({ timeout });
}
export async function completions(page: Page): Promise<{ key: string }[]> {
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('procode.workspace.v1')!),
  );
  return saved.completions;
}
export async function verifyMethod(page: Page, id: string, language: Language) {
  await submit(page, id, solutions[id][language]);
  await completed(page);
  await expect(page.getByText('Method verified', { exact: true })).toBeVisible();
  await expect(page.locator('.test-row.failed')).toHaveCount(0);
  expect(
    (await completions(page)).some(
      (item) => item.key === `${id}:v${exerciseFor(id).version}:${language}`,
    ),
  ).toBe(true);
}
export function substitution(required: string, supplied: string, language: Language) {
  return solutions[supplied][language].replaceAll(
    exerciseFor(supplied).signature[language],
    exerciseFor(required).signature[language],
  );
}
export async function checkWidth(page: Page, info: TestInfo, width: number) {
  await page.setViewportSize({ width, height: 1100 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.locator('.method-result').scrollIntoViewIfNeeded();
  expect(
    await page.locator('.method-result').evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath(`method-${width}.png`), fullPage: true });
}
export async function runWithoutCompletion(page: Page, language: Language) {
  await submit(page, 'selection-sort', solutions['selection-sort'][language], 'Run');
  await expect(page.getByText('Examples passed.', { exact: true })).toBeVisible({ timeout });
  expect(await completions(page)).toEqual([]);
}
