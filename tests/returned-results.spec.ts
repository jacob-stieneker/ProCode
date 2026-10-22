import { test, expect } from '@playwright/test';
import { freshWorkspace } from '../src/app/core/storage';

const userSolution = `function moveZeroes(nums) {
  let zeroes = [];
  let notZeroes = [];
  let newArray = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === 0) {
      zeroes.push(nums[i]);
    }
    else {
      notZeroes.push(nums[i]);
    }
  }
  for (let j = 0; j < notZeroes.length; j++) {
    newArray.push(notZeroes[j]);
  }
  for (let k = 0; k < zeroes.length; k++) {
    newArray.push(zeroes[k]);
  }
  return newArray;
}
console.log(moveZeroes([0, 0, 0, 5, 4, 3, 2, 1]));`;

test('the reported solution survives migration and passes Run and Finish', async ({ page }) => {
  const saved = freshWorkspace();
  saved.selectedExercises.junior = 'move-zeroes';
  saved.drafts['move-zeroes:v1:javascript'] = userSolution;
  await page.addInitScript((workspace) => {
    if (!localStorage.getItem('procode.workspace.v1'))
      localStorage.setItem('procode.workspace.v1', JSON.stringify(workspace));
  }, saved);
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toHaveJSProperty(
    'innerText',
    userSolution,
  );
  await expect(
    page.getByText(
      'Move all zeroes to the end of an array while preserving the order of its other values.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('#console-content')).toContainText('[5,4,3,2,1,0,0,0]');
  await expect(page.getByRole('tab', { name: /Console/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Test results/ }).click();
  await expect(page.getByText('3 of 3 checks passed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('12 of 12 checks passed', { exact: true })).toBeVisible();
  await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toHaveJSProperty(
    'innerText',
    userSolution,
  );
  const workspace = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('procode.workspace.v1')!),
  );
  expect(workspace.drafts['move-zeroes:v2:javascript']).toBe(userSolution);
  expect(
    workspace.completions.some((item: { key: string }) => item.key === 'move-zeroes:v2:javascript'),
  ).toBe(true);
});

for (const language of ['javascript', 'python'] as const) {
  test(`${language} accepts new arrays and rejects correct logging without a correct return`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: /Test results/ }).click();
    const examples = [
      [
        'move-zeroes',
        'function moveZeroes(nums) { return nums.filter(n => n !== 0).concat(nums.filter(n => n === 0)); }',
        'def move_zeroes(nums):\n    return [n for n in nums if n != 0] + [n for n in nums if n == 0]',
      ],
      [
        'remove-sorted-duplicates',
        'function removeDuplicates(nums) { return [...new Set(nums)]; }',
        'def remove_duplicates(nums):\n    return sorted(set(nums))',
      ],
    ];
    const editor = page.getByRole('textbox', { name: 'Solution code' });
    for (const [id, js, py] of examples) {
      await page.locator('#algorithm').selectOption(id);
      await editor.fill(language === 'javascript' ? js : py);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
      await expect(page.getByText('12 of 12 checks passed', { exact: true })).toBeVisible();
      const loggingOnly =
        language === 'javascript'
          ? js.replace('return ', 'console.log(').replace('; }', '); }')
          : py.replace('return ', 'print(') + ')';
      await editor.fill(loggingOnly);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Some checks failed.', { exact: true })).toBeVisible({
        timeout: 50000,
      });
      await expect(
        page.locator('#tests-content').getByText('0 of 12 checks passed', { exact: true }),
      ).toBeVisible();
    }
  });
}
