import { test, expect } from '@playwright/test';
import { structureExercises } from '../src/app/core/structure-exercises';
import { structureSolutions } from './fixtures/structure-solutions';
import { totalChallenges } from './fixtures/challenge-count';
for (const language of ['javascript', 'python'] as const)
  test(`new data structures reject starters and accept real ${language} solutions`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Data structures', exact: true }).click();
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: 'Test results', exact: true }).click();
    for (const e of structureExercises) {
      await page
        .getByRole('button', {
          name: e.difficulty === 'skilled' ? 'Skilled Developer' : 'Senior Developer',
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
        .fill(structureSolutions[e.id][language]);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
    }
    await page.reload();
    await expect(page.locator('#algorithm')).toHaveValue('streaming-median');
    await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText(
      language === 'python' ? 'heapq' : 'const lower',
    );
    await page.getByRole('button', { name: 'My progress', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(
      `3 of ${totalChallenges} challenges completed`,
    );
  });
test('behavioral grading accepts a sorted-array median and rejects a FIFO cache', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Data structures', exact: true }).click();
  await page.getByRole('button', { name: 'Senior Developer', exact: true }).click();
  await page.getByRole('tab', { name: 'Test results', exact: true }).click();
  await page.locator('#algorithm').selectOption('streaming-median');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill(
      `function runningMedians(nums) { return nums.map((_,i)=>{const p=nums.slice(0,i+1).sort((a,b)=>a-b);return (p[Math.floor(i/2)]+p[Math.ceil(i/2)])/2;}); }`,
    );
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await page.locator('#algorithm').selectOption('lru-cache');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill(
      `function lruCache(capacity, ops) { const cache=new Map();return ops.map(([op,key,value])=>{if(op==='get')return cache.has(key)?cache.get(key):-1;cache.set(key,value);if(cache.size>capacity)cache.delete(cache.keys().next().value);return null;}); }`,
    );
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('Some checks failed.', { exact: true })).toBeVisible();
});
