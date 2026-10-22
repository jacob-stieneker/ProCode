import { test, expect } from '@playwright/test';

test('Console is first and selected by default; execution preserves the chosen output tab', async ({
  page,
}) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Execution output' });
  const consoleTab = tabs.getByRole('tab', { name: /Console/ });
  const resultsTab = tabs.getByRole('tab', { name: /Test results/ });
  await expect(tabs.getByRole('tab').first()).toHaveText('Console');
  await expect(tabs.getByRole('tab').last()).toHaveText('Test results');
  await expect(consoleTab).toHaveAttribute('aria-selected', 'true');
  const consoleBounds = await consoleTab.boundingBox();
  const resultsBounds = await resultsTab.boundingBox();
  expect(consoleBounds!.x).toBeLessThan(resultsBounds!.x);
  await page.getByRole('textbox', { name: 'Solution code' }).fill(`function twoSum(nums, target) {
    console.log('Checking pairs');
    for(let i=0;i<nums.length;i++) for(let j=i+1;j<nums.length;j++)
      if(nums[i]+nums[j]===target) return [i,j];
    return [];
  }`);
  for (const action of ['Run', 'Finish']) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
    await expect(page.locator('.console-output')).toContainText('Checking pairs');
    await expect(consoleTab).toHaveAttribute('aria-selected', 'true');
  }
  await resultsTab.click();
  await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Examples passed.', { exact: true })).toBeVisible();
  await expect(resultsTab).toHaveAttribute('aria-selected', 'true');

  // A choice made while execution is starting also survives completion.
  await page.route('**/runtime/executor.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await consoleTab.click();
  await expect(page.locator('.console-output')).toContainText('Checking pairs');
  await expect(consoleTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  await expect(consoleTab).toBeFocused();
  await consoleTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(resultsTab).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(consoleTab).toBeFocused();
  await page.setViewportSize({ width: 320, height: 844 });
  expect((await consoleTab.boundingBox())!.x).toBeLessThan((await resultsTab.boundingBox())!.x);
});
