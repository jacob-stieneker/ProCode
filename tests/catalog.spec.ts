import { test, expect } from '@playwright/test';
import { areaOf, exercises } from '../src/app/core/exercises';
import { solutions } from './fixtures/junior-solutions';

for (const language of ['javascript', 'python'] as const) {
  test(`all new junior algorithms pass real ${language} execution`, async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/');
    await page.getByRole('tab', { name: 'Test results', exact: true }).click();
    await page.getByLabel('Practice language').selectOption(language);
    for (const [id, source] of Object.entries(solutions)) {
      const exercise = exercises.find((e) => e.id === id)!;
      await page
        .getByRole('button', {
          name: areaOf(exercise) === 'algorithms' ? 'Algorithms' : 'Data structures',
          exact: true,
        })
        .click();
      await page.locator('#algorithm').selectOption(id);
      await expect(page.getByRole('heading', { name: exercise.title, exact: true })).toBeVisible();
      await page.getByRole('textbox', { name: 'Solution code' }).fill(source[language]);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
      const count = exercise.examples.length + exercise.additional.length;
      await expect(
        page.getByText(`${count} of ${count} checks passed`, { exact: true }),
      ).toBeVisible();
    }
  });
}

test('categories, per-exercise drafts, selection persistence, and difficulty restoration', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Category', { exact: true }).selectOption('Sorting');
  const algorithms = page.getByLabel('Algorithm', { exact: true });
  await expect(algorithms.locator('option')).toHaveText([
    'Selection Sort',
    'Bubble Sort',
    'Insertion Sort',
    'Merge Sort',
  ]);
  await algorithms.selectOption('merge-sort');
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.fill('function mergeSort(nums) { return nums; }');
  await algorithms.selectOption('bubble-sort');
  await expect(editor).toContainText('function bubbleSort');
  await page.getByLabel('Practice language').selectOption('python');
  await editor.fill('def bubble_sort(nums):\n    return nums');
  await page.getByRole('button', { name: /Skilled Developer/ }).click();
  await expect(algorithms).toHaveValue('longest-substring');
  await page.getByRole('button', { name: /Junior Developer/ }).click();
  await expect(algorithms).toHaveValue('bubble-sort');
  await expect(editor).toContainText('return nums');
  await page.reload();
  await expect(algorithms).toHaveValue('bubble-sort');
  await algorithms.selectOption('merge-sort');
  await page.getByLabel('Practice language').selectOption('javascript');
  await expect(editor).toHaveText('function mergeSort(nums) { return nums; }');
});

test('sorting rejects example-only output and boolean tasks reject truthy non-booleans', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Test results', exact: true }).click();
  await page.getByLabel('Algorithm', { exact: true }).selectOption('selection-sort');
  await page.getByRole('textbox', { name: 'Solution code' }).fill(`function selectionSort(nums) {
    if(nums[0] === 5)return [1,2,4,5,8];
    if(nums[0] === 3)return [1,2,3,3];
    return [-7,-2,0,4];
  }`);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(
    page.getByText('Output correct. Method needs attention.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('Some checks failed.', { exact: true })).toBeVisible();
  await page.getByLabel('Algorithm', { exact: true }).selectOption('valid-palindrome');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill('function isPalindrome() { return "true"; }');
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(
    page.locator('.result-summary').getByText('0 of 11 checks passed', { exact: true }),
  ).toBeVisible();
});
