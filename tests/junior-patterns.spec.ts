import { totalChallenges } from './fixtures/challenge-count';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { juniorPatterns } from '../src/app/core/junior-patterns';
import { areaOf, exercises } from '../src/app/core/exercises';
import { patternSolutions } from './fixtures/pattern-solutions';

for (const language of ['javascript', 'python'] as const) {
  test(`ten new junior exercises pass all ${language} checks with real nodes and returned results`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: /Test results/ }).click();
    for (const exercise of juniorPatterns) {
      await test.step(exercise.title, async () => {
        await page
          .getByRole('button', {
            name: areaOf(exercise) === 'algorithms' ? 'Algorithms' : 'Data structures',
            exact: true,
          })
          .click();
        await page.locator('#algorithm').selectOption(exercise.id);
        await page
          .getByRole('textbox', { name: 'Solution code' })
          .fill(patternSolutions[exercise.id][language]);
        await page.getByRole('button', { name: 'Finish', exact: true }).click();
        await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
          timeout: 50000,
        });
        const count = exercise.examples.length + exercise.additional.length;
        await expect(
          page.getByText(`${count} of ${count} checks passed`, { exact: true }),
        ).toBeVisible();
      });
    }
    await page.getByRole('button', { name: 'My progress', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(
      `10 of ${totalChallenges} challenges completed`,
    );
  });

  test(`${language} graders reject incorrect arrays, counts, and malformed lists`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('tab', { name: /Test results/ }).click();
    const bad = [
      [
        'move-zeroes',
        `function moveZeroes(nums) { return nums.filter(n=>n!==0); }`,
        `def move_zeroes(nums):\n    return [n for n in nums if n != 0]`,
        'Some checks failed.',
      ],
      [
        'remove-sorted-duplicates',
        `function removeDuplicates(nums) { return new Set(nums).size; }`,
        `def remove_duplicates(nums):\n    return len(set(nums))`,
        'Some checks failed.',
      ],
      [
        'remove-sorted-duplicates',
        `function removeDuplicates(nums) { return true; }`,
        `def remove_duplicates(nums):\n    return True`,
        'Some checks failed.',
      ],
      [
        'reverse-linked-list',
        `function reverseList(head) { return []; }`,
        `def reverse_list(head):\n    return []`,
        'Return the head node',
      ],
      [
        'reverse-linked-list',
        `function reverseList(head) { if (head) head.next = head; return head; }`,
        `def reverse_list(head):\n    if head is not None:\n        head.next = head\n    return head`,
        'contains a cycle',
      ],
      [
        'linked-list-cycle',
        `function hasCycle(head) { return "true"; }`,
        `def has_cycle(head):\n    return "true"`,
        'Some checks failed.',
      ],
    ];
    for (const [id, js, py, message] of bad) {
      const exercise = juniorPatterns.find((e) => e.id === id)!;
      await page
        .getByRole('button', {
          name: areaOf(exercise) === 'algorithms' ? 'Algorithms' : 'Data structures',
          exact: true,
        })
        .click();
      await page.locator('#algorithm').selectOption(id);
      await page
        .getByRole('textbox', { name: 'Solution code' })
        .fill(language === 'javascript' ? js : py);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled({
        timeout: 50000,
      });
      await expect(page.locator('#tests-content')).toContainText(message);
      await expect(page.getByText('Challenge complete.', { exact: true })).toHaveCount(0);
    }
    // A different valid solution may allocate nodes rather than reverse links.
    await page.locator('#algorithm').selectOption('reverse-linked-list');
    await page
      .getByRole('textbox', { name: 'Solution code' })
      .fill(
        language === 'javascript'
          ? `function reverseList(head) { let result = null; while (head) { result = {val: head.val, next: result}; head = head.next; } return result; }`
          : `def reverse_list(head):\n    result = None\n    while head is not None:\n        result = ListNode(head.val, result)\n        head = head.next\n    return result`,
      );
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
      timeout: 50000,
    });
  });
}

test('separate practice sections preserve selections, drafts, difficulty and progress after refresh', async ({
  page,
}) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await page.getByLabel('Algorithm', { exact: true }).selectOption('stock-profit');
  await editor.fill('function maxProfit(prices) { return 123; }');
  await page.getByRole('button', { name: 'Data structures', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Data structures', exact: true })).toBeVisible();
  await expect(page.getByLabel('Exercise', { exact: true }).locator('option')).toHaveText(
    exercises
      .filter((e) => areaOf(e) === 'data-structures' && e.difficulty === 'junior')
      .map((e) => e.title),
  );
  await page.getByLabel('Exercise', { exact: true }).selectOption('same-tree');
  await editor.fill('function isSameTree(first, second) { return false; }');
  await page.getByRole('button', { name: 'Skilled Developer', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true }).locator('option')).toHaveText(
    exercises
      .filter((e) => areaOf(e) === 'data-structures' && e.difficulty === 'skilled')
      .map((e) => e.title),
  );
  await page.getByRole('button', { name: 'Senior Developer', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('tree-max-path');
  await page.getByRole('button', { name: 'Junior Developer', exact: true }).click();
  await expect(editor).toContainText('return false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Data structures', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('same-tree');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  await expect(page.getByLabel('Algorithm', { exact: true })).toHaveValue('stock-profit');
  await expect(editor).toContainText('return 123');
  await expect(page.getByLabel('Algorithm', { exact: true }).locator('option')).toHaveText(
    exercises
      .filter((e) => areaOf(e) === 'algorithms' && e.difficulty === 'junior')
      .map((e) => e.title),
  );
});

test('data structures are accessible and fit desktop and mobile navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Data structures', exact: true }).click();
  await page.getByLabel('Exercise', { exact: true }).selectOption('reverse-linked-list');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Data structures', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finish', exact: true })).toBeVisible();
    if (width === 1440 || width === 320) {
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      await page.screenshot({
        path: `docs/screenshots/data-structures-${width}.png`,
        fullPage: true,
      });
    }
  }
});
