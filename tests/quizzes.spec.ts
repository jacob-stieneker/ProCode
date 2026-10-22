import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { questions } from '../src/app/core/quiz/questions';
import { quizTopics } from '../src/app/core/quiz/model';

async function openQuiz(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await expect(page.getByLabel('Topic', { exact: true })).toBeVisible();
}
async function complete(page: Page, count: number, correct: number) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByText(`Question ${i + 1} of ${count}`, { exact: true })).toBeVisible();
    const prompt = await page.locator('#question-heading').innerText();
    const q = questions.find((q) => q.prompt === prompt)!;
    await expect(page.getByRole('radio')).toHaveCount(4);
    await page
      .getByRole('radio', { name: q.choices[i < correct ? q.correct : 1], exact: true })
      .check();
    if (i < count - 1) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Submit quiz', exact: true }).click();
}
test('10-question quiz grades mixed answers, explains results, and saves review history', async ({
  page,
}) => {
  await openQuiz(page);
  await expect(page.getByLabel('Topic', { exact: true }).locator('option')).toHaveCount(11);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submit quiz', exact: true })).toBeDisabled();
  await complete(page, 10, 7);
  await expect(page.locator('.score')).toHaveText('7 / 10');
  await expect(page.getByText('70% correct', { exact: true })).toBeVisible();
  await expect(page.locator('details.review-item')).toHaveCount(10);
  await page.locator('details.review-item summary').first().click();
  await expect(page.locator('.explanation').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Read reference/ }).first()).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await page.getByRole('button', { name: 'Choose another quiz', exact: true }).click();
  await page.getByRole('button', { name: 'Review JavaScript, score 7 of 10', exact: true }).click();
  await expect(page.locator('.score')).toHaveText('7 / 10');
  await page.reload();
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await expect(page.locator('.score')).toHaveText('7 / 10');
});
test('20-question topic quiz resumes without reshuffling and preserves algorithm drafts', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill('function twoSum() { return [1,0]; }');
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await page.getByLabel('Topic', { exact: true }).selectOption('firebase');
  await page.getByLabel('Questions', { exact: true }).selectOption({ label: '20 questions' });
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  const prompt = await page.locator('#question-heading').innerText();
  const choices = await page.locator('.answer').allTextContents();
  await page.getByRole('radio').nth(2).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await expect(page.getByText('Question 2 of 20', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.getByText('Question 1 of 20', { exact: true })).toBeVisible();
  await expect(page.locator('#question-heading')).toHaveText(prompt);
  expect(await page.locator('.answer').allTextContents()).toEqual(choices);
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  await complete(page, 20, 20);
  await expect(page.locator('.score')).toHaveText('20 / 20');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toHaveText(
    'function twoSum() { return [1,0]; }',
  );
});
test('all topics are selectable and mixed quizzes contain each topic', async ({ page }) => {
  await openQuiz(page);
  for (const topic of quizTopics) {
    await page.getByLabel('Topic', { exact: true }).selectOption(topic.id);
    await expect(page.getByText('20 available', { exact: true })).toBeVisible();
  }
  await page.getByLabel('Topic', { exact: true }).selectOption('all');
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  const seen = new Set<string>();
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(`Question ${i + 1} of 10`, { exact: true })).toBeVisible();
    const prompt = await page.locator('#question-heading').innerText();
    seen.add(questions.find((q) => q.prompt === prompt)!.topic);
    if (i < 9) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  expect(seen.size).toBe(10);
  await page.getByRole('button', { name: 'Topics & history', exact: true }).click();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  await page.getByRole('button', { name: 'Resume quiz', exact: true }).click();
  await expect(page.getByText('Question 10 of 10', { exact: true })).toBeVisible();
});
test('quiz setup, questions, and review remain accessible across themes and narrow screens', async ({
  page,
}) => {
  test.setTimeout(120000);
  await openQuiz(page);
  const audit = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  for (const theme of [
    'ProCode',
    'GitHub',
    'Visual Studio',
    'Codex',
    'Cursor',
    'Claude',
    'PyCharm',
  ])
    for (const mode of ['Light', 'Dark', 'Midnight OLED']) {
      await page.getByRole('button', { name: 'Appearance', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: theme, exact: true }).click();
      await dialog.getByRole('button', { name: mode, exact: true }).click();
      await dialog.getByRole('button', { name: 'Done', exact: true }).click();
      await audit();
    }
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/quiz-${width}.png`, fullPage: true });
  }
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').first()).toBeChecked();
  await complete(page, 10, 5);
  await page.locator('details.review-item summary').first().click();
  await audit();
  await page.screenshot({ path: 'test-results/quiz-review-mobile.png', fullPage: true });
});
test('unavailable browser storage shows a warning but quizzes still work', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage disabled');
    };
  });
  await openQuiz(page);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Quiz storage is unavailable');
  await complete(page, 10, 10);
  await expect(page.locator('.score')).toHaveText('10 / 10');
});
