import { test, expect, Page } from '@playwright/test';
import { totalChallenges } from './fixtures/challenge-count';
const js = [
  `function twoSum(nums, target) { console.log('Checking pairs'); for (let i=0;i<nums.length;i++) for(let j=i+1;j<nums.length;j++) if(nums[i]+nums[j]===target)return [j,i]; return []; }`,
  `function longestSubstring(text) { let best=0; for(let i=0;i<text.length;i++){let seen=new Set();for(let j=i;j<text.length&&!seen.has(text[j]);j++){seen.add(text[j]);best=Math.max(best,seen.size)}}return best; }`,
  `function minWindow(source,target){if(!target)return '';let best='';const valid=w=>[...new Set(target)].every(c=>[...w].filter(x=>x===c).length >= [...target].filter(x=>x===c).length);for(let i=0;i<source.length;i++)for(let j=i+1;j<=source.length;j++){let w=source.slice(i,j);if(valid(w)){if(!best||w.length<best.length)best=w;break}}return best;}`,
];
const py = [
  `def two_sum(nums, target):\n    print('Checking pairs')\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [j, i]\n    return []`,
  `def longest_substring(text):\n    best = 0\n    for i in range(len(text)):\n        seen = set()\n        for c in text[i:]:\n            if c in seen:\n                break\n            seen.add(c)\n            best = max(best, len(seen))\n    return best`,
  `def min_window(source, target):\n    if not target:\n        return ''\n    best = ''\n    for i in range(len(source)):\n        for j in range(i + 1, len(source) + 1):\n            w = source[i:j]\n            if all(w.count(c) >= target.count(c) for c in set(target)):\n                if not best or len(w) < len(best):\n                    best = w\n                break\n    return best`,
];
async function edit(page: Page, source: string) {
  await page.getByRole('textbox', { name: 'Solution code' }).fill(source);
}
const levelNames = ['Junior Developer', 'Skilled Developer', 'Senior Developer'];
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('tab', { name: 'Test results', exact: true }).click();
});
test('all levels execute real JavaScript and Python and save six independent completions', async ({
  page,
}) => {
  test.setTimeout(180000);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: new RegExp(levelNames[i]) }).click();
    for (const [language, sources] of [
      ['javascript', js],
      ['python', py],
    ] as const) {
      await page.getByLabel('Practice language').selectOption(language);
      await edit(page, sources[i]);
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByText('Challenge complete.')).toBeVisible({
        timeout: 50000,
      });
      await expect(page.getByText(/0 of \d+ checks passed/)).toHaveCount(0);
    }
  }
  await page.reload();
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(
    `6 of ${totalChallenges} challenges completed`,
  );
});
test('Run only checks examples, Finish catches hardcoding, and feedback gives a hint', async ({
  page,
}) => {
  await edit(
    page,
    'function twoSum(nums, target) { return nums.length === 4 ? [0,1] : nums.length === 3 ? [1,2] : [0,1]; }',
  );
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Examples passed.')).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('Some checks failed.')).toBeVisible();
  await expect(page.getByText('Return indices, not values.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(
    `0 of ${totalChallenges} challenges completed`,
  );
});
test('drafts persist across languages, difficulty changes, and reload', async ({ page }) => {
  await edit(page, js[0]);
  await page.getByLabel('Practice language').selectOption('python');
  await edit(page, py[0]);
  await page.getByRole('button', { name: /Skilled Developer/ }).click();
  await edit(page, py[1]);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText(
    'def longest_substring',
  );
  await page.getByRole('button', { name: /Junior Developer/ }).click();
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText(
    'Checking pairs',
  );
  await page.getByLabel('Practice language').selectOption('javascript');
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText('console.log');
});
test('syntax errors, runtime errors, output logging and timeout recovery work', async ({
  page,
}) => {
  await edit(page, 'function twoSum( {');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.execution-error')).toContainText('SyntaxError');
  await edit(page, 'function twoSum() { throw new Error("Try again"); }');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.test-detail')).toContainText('Try again');
  await edit(page, 'function twoSum() { while(true) {} }');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.execution-error').getByText(/Time limit reached/)).toBeVisible();
  await edit(page, js[0]);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Examples passed.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: /Console/ }).click();
  await expect(page.locator('.console-output')).toContainText('Checking pairs');
});
test('Python errors and infinite loops do not freeze the workspace', async ({ page }) => {
  await page.getByLabel('Practice language').selectOption('python');
  await edit(page, 'def two_sum(nums, target):\n    raise ValueError("invalid pair")');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.test-detail')).toContainText('ValueError: invalid pair', {
    timeout: 50000,
  });
  await edit(page, 'def two_sum(nums, target):\n    while True:\n        pass');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.execution-error').getByText(/Time limit reached/)).toBeVisible({
    timeout: 50000,
  });
  await edit(page, py[0]);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Examples passed.', { exact: false })).toBeVisible({
    timeout: 50000,
  });
});
test('reset requires a choice, hints reveal progressively, and dialog supports Escape', async ({
  page,
}) => {
  await edit(page, js[0]);
  await page.getByRole('button', { name: 'Reset starter code' }).click();
  await page.getByRole('button', { name: 'Keep my code' }).click();
  await expect(page.getByRole('textbox')).toContainText('console.log');
  await page.getByRole('button', { name: 'Reset starter code' }).click();
  await page.getByRole('button', { name: 'Reset code', exact: true }).click();
  await expect(page.getByRole('textbox')).toContainText('Write your solution here.');
  await page.getByRole('tab', { name: /Hints/ }).click();
  await page.getByRole('button', { name: 'Reveal first hint' }).click();
  await expect(page.locator('.hint-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'My progress', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('refresh stops an infinite loop, preserves the draft, and leaves the runner usable', async ({
  page,
}) => {
  await edit(page, 'function twoSum() { while(true) {} }');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect.poll(() => page.workers().length).toBe(1);
  await page.reload();
  await expect.poll(() => page.workers().length).toBe(0);
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText('while(true)');
  await page.getByRole('tab', { name: /Test results/ }).click();
  await edit(page, js[0]);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Examples passed.', { exact: false })).toBeVisible();
});
test('code cannot access app storage or the parent document', async ({ page }) => {
  await edit(
    page,
    `function twoSum() { console.log(typeof document, typeof localStorage); try { console.log(self.parent.document); } catch(e) { console.log('No parent access'); } return [0,1]; }`,
  );
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Some checks failed.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: /Console/ }).click();
  await expect(page.locator('.console-output')).toContainText('undefined undefined');
});
test('responsive layouts do not overflow and all main actions remain usable', async ({ page }) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Finish', exact: true })).toBeVisible();
    await expect(page.getByLabel('Practice language')).toBeVisible();
    await page.screenshot({ path: `test-results/workspace-${width}.png`, fullPage: true });
  }
});

test('keyboard users can leave the editor and operate tabs', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Solution code' });
  await editor.click();
  await editor.press('Escape');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeFocused();
  await page.getByRole('tab', { name: 'Problem', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Hints/ })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Problem', exact: true })).toBeFocused();
});

test('refresh during runtime loading cannot create a stale attempt', async ({ page }) => {
  await page.route('**/runtime/executor.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await edit(page, js[0]);
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Skilled Developer/ }).click();
  await expect(page.locator('.challenge-title')).toContainText('Longest Unique Substring');
  await expect.poll(() => page.workers().length).toBe(0);
  await expect(page.getByText('Challenge complete.')).toHaveCount(0);
});

test('Python bridge cannot read app storage and its network is restricted', async ({ page }) => {
  await page.getByLabel('Practice language').selectOption('python');
  await edit(
    page,
    `import js\nprint('origin=' + str(js.self.origin))\nprint('document=' + str(hasattr(js, 'document')))\ntry:\n    js.importScripts('https://example.com/procode-network-check.js')\nexcept Exception:\n    print('network blocked')\ndef two_sum(nums, target):\n    return [0, 1]`,
  );
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Some checks failed.', { exact: false })).toBeVisible({
    timeout: 50000,
  });
  await page.getByRole('tab', { name: /Console/ }).click();
  await expect(page.locator('.console-output')).toContainText('origin=null');
  await expect(page.locator('.console-output')).toContainText('document=False');
  await expect(page.locator('.console-output')).toContainText('network blocked');
});
