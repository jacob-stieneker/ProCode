import { test, expect } from '@playwright/test';
import { interviewExpansion } from '../src/app/core/interview-expansion';
import { expansionSolutions } from './fixtures/interview-expansion-solutions';
import { totalChallenges } from './fixtures/challenge-count';
for (const language of ['javascript', 'python'] as const)
  test(`interview additions execute ${language} and persist completion`, async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Data structures', exact: true }).click();
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: 'Test results', exact: true }).click();
    for (const e of interviewExpansion) {
      await page
        .getByRole('button', {
          name: {
            junior: 'Junior Developer',
            skilled: 'Skilled Developer',
            senior: 'Senior Developer',
          }[e.difficulty],
          exact: true,
        })
        .click();
      await page.locator('#algorithm').selectOption(e.id);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Some checks failed.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
      await page
        .getByRole('textbox', { name: 'Solution code' })
        .fill(expansionSolutions[e.id][language]);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
    }
    await page.reload();
    await expect(page.locator('#algorithm')).toHaveValue('merge-k-lists');
    await page.getByRole('button', { name: 'My progress', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(
      `3 of ${totalChallenges} challenges completed`,
    );
  });
