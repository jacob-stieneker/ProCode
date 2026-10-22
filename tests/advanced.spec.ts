import { test, expect } from '@playwright/test';
import { totalChallenges } from './fixtures/challenge-count';
import { areaOf } from '../src/app/core/exercises';
import { advancedExercises } from '../src/app/core/advanced-exercises';
import { advancedSolutions } from './fixtures/advanced-solutions';
for (const language of ['javascript', 'python'] as const) {
  test(`skilled and senior algorithms execute real ${language}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: 'Test results', exact: true }).click();
    for (const e of advancedExercises) {
      await test.step(e.title, async () => {
        await page
          .getByRole('button', {
            name: e.difficulty === 'skilled' ? 'Skilled Developer' : 'Senior Developer',
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: areaOf(e) === 'algorithms' ? 'Algorithms' : 'Data structures',
            exact: true,
          })
          .click();
        await page.locator('#algorithm').selectOption(e.id);
        await page
          .getByRole('textbox', { name: 'Solution code' })
          .fill(advancedSolutions[e.id][language]);
        await page.getByRole('button', { name: 'Finish', exact: true }).click();
        await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
          timeout: 50000,
        });
      });
    }
    await page.getByRole('button', { name: 'My progress', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(
      `14 of ${totalChallenges} challenges completed`,
    );
  });
}
