import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const solution = `function twoSum(nums, target) {
  console.log('Checking pairs');
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] + nums[j] === target) return [i, j];
  return [];
}`;

for (const language of ['javascript', 'python']) {
  test(`${language} syntax and runtime errors appear in Console with useful diagnostics`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    const editor = page.getByRole('textbox', { name: 'Solution code' });
    const run = page.getByRole('button', { name: 'Run', exact: true });
    const output = page.locator('.console-output');
    await editor.fill(
      language === 'javascript' ? 'function twoSum( {' : 'def two_sum(nums, target)\n    return []',
    );
    await run.click();
    await expect(output.locator('.console-error')).toContainText('SyntaxError', { timeout: 50000 });
    await expect(run).toBeEnabled();
    await expect(page.getByRole('tab', { name: /Console/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await editor.fill(
      language === 'javascript'
        ? `function twoSum(nums, target) {\n  console.log('Before error');\n  return missingVariable;\n}`
        : `def two_sum(nums, target):\n    print('Before error')\n    return missing_variable`,
    );
    await run.click();
    await expect(output).toContainText(language === 'javascript' ? 'ReferenceError' : 'NameError', {
      timeout: 50000,
    });
    await expect(run).toBeEnabled();
    await expect(output).toContainText('Before error');
    await expect(output).toContainText(
      language === 'javascript' ? 'solution.js:3:' : '"solution.py", line 3',
    );
    await expect(output.locator('.console-error')).toHaveCount(1);
    await expect(output).toContainText('3 checks raised this error');
    await page.getByRole('tab', { name: /Test results/ }).click();
    await expect(page.locator('.test-detail')).toContainText(
      language === 'javascript' ? 'ReferenceError' : 'NameError',
    );
    await page.getByRole('tab', { name: /Console/ }).click();

    if (language === 'javascript') {
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await expect(output.locator('.console-error')).toBeVisible();
        if (width === 320 || width === 1440) {
          await page.locator('.results-panel').scrollIntoViewIfNeeded();
          await page.screenshot({ path: `docs/screenshots/console-error-${width}.png` });
        }
      }
    }
    await editor.fill(
      language === 'javascript'
        ? solution
        : `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`,
    );
    await run.click();
    await expect(run).toBeEnabled({ timeout: 50000 });
    await expect(output.locator('.console-error')).toHaveCount(0);
    await page.getByRole('tab', { name: /Test results/ }).click();
    await expect(page.getByText('Examples passed.', { exact: true })).toBeVisible();
  });
}

test('repeated unchanged runs retain output, tab choice and focus, without loading controls or duplicate attempts', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Solution code' }).fill(solution);
  const run = page.getByRole('button', { name: 'Run', exact: true });
  const finish = page.getByRole('button', { name: 'Finish', exact: true });
  const consoleTab = page.getByRole('tab', { name: /Console/ });
  const testsTab = page.getByRole('tab', { name: /Test results/ });
  await run.click();
  await expect(page.locator('.console-output')).toContainText('Checking pairs');
  await expect(run).toBeEnabled();
  let release: () => void = () => {};
  let requests = 0;
  await page.route('**/runtime/executor.js', async (route) => {
    requests++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  for (const [index, action] of ['Run', 'Finish', 'Run', 'Finish'].entries()) {
    const tab = index % 2 === 0 ? consoleTab : testsTab;
    await tab.click();
    const panel = page.getByRole('tabpanel', {
      name: index % 2 === 0 ? /Console/ : /Test results/,
    });
    const previous = await panel.innerText();
    const button = action === 'Run' ? run : finish;
    const before = (await button.boundingBox())!;
    await button.click();
    await expect.poll(() => requests).toBe(index + 1);
    await expect(run).toBeDisabled();
    await expect(finish).toBeDisabled();
    expect((await button.boundingBox())!.x).toBe(before.x);
    // Another click in the same place must not begin a second attempt.
    await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2);
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0);
    await expect(page.locator('.execution-status, .spinner')).toHaveCount(0);
    await expect(
      page.getByText(/Starting code runner|Loading Python runtime|Running your checks/),
    ).toHaveCount(0);
    expect(await panel.innerText()).toBe(previous);
    await tab.click();
    release();
    await expect(run).toBeEnabled();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(tab).toBeFocused();
    expect(requests).toBe(index + 1);
    await consoleTab.click();
    await expect(page.locator('.console-error')).toHaveCount(0);
    // Each new run replaces the logs, rather than accumulating duplicates.
    const count = Number(await testsTab.locator('.tab-count').innerText());
    await expect(page.locator('.console-output > pre')).toHaveCount(count);
    await testsTab.click();
    await expect(
      page.getByText(action === 'Run' ? 'Examples passed.' : 'Challenge complete.', {
        exact: true,
      }),
    ).toBeVisible();
  }
});

test('Console reports timeout, then recovers for the next run', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Solution code' })
    .fill('function twoSum() { while (true) {} }');
  const run = page.getByRole('button', { name: 'Run', exact: true });
  await run.click();
  await expect(page.locator('.console-error')).toContainText('Time limit reached');
  await page.getByRole('textbox', { name: 'Solution code' }).fill(solution);
  await run.click();
  await expect(page.locator('.console-output')).toContainText('Checking pairs');
  await expect(page.locator('.console-error')).toHaveCount(0);
});
