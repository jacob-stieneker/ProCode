import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { angularSolutions } from '../tests/fixtures/angular-solutions';
import { angularFullstackSolutions } from '../tests/fixtures/fullstack-angular-solutions';
import { cleanSolutions } from '../tests/fixtures/clean-solutions';
import { totalChallenges } from '../tests/fixtures/challenge-count';
import { webSolutions } from '../tests/fixtures/web-solutions';
import { firebaseSolutions } from '../tests/fixtures/firebase-solutions';
import { gitSolutions } from '../tests/fixtures/git-solutions';
import { questions } from '../src/app/core/quiz/questions';
import { solutions as juniorSolutions } from '../tests/fixtures/junior-solutions';

let desktop: ElectronApplication;
let page: Page;
let profile: string;
const executablePath =
  process.env['PROCODE_DESKTOP_EXECUTABLE'] ||
  (process.platform === 'win32'
    ? resolve('release/windows/win-unpacked/ProCode.exe')
    : resolve('release/ProCode-darwin-arm64/ProCode.app/Contents/MacOS/ProCode'));

async function launch() {
  const env = { ...process.env };
  delete env['ELECTRON_RUN_AS_NODE'];
  desktop = await electron.launch({ executablePath, args: [`--user-data-dir=${profile}`], env });
  page = await desktop.firstWindow();
  await expect(page.getByRole('button', { name: 'Algorithms', exact: true })).toBeVisible();
}
test.beforeEach(async () => {
  profile = await mkdtemp(join(tmpdir(), 'procode-desktop-test-'));
  await launch();
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus && page && !page.isClosed()) {
    await testInfo.attach('desktop-screen', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await testInfo.attach('desktop-content', {
      body: await page.locator('body').innerText(),
      contentType: 'text/plain',
    });
  }
  await desktop?.close();
  await rm(profile, { recursive: true, force: true });
});

test('bundled JavaScript/Python run offline and drafts survive a full relaunch', async () => {
  expect(page.url()).toBe('procode://app/');
  await page.getByRole('tab', { name: 'Test results', exact: true }).click();
  for (const [language, source] of [
    [
      'javascript',
      'function twoSum(nums, target) { for(let i=0;i<nums.length;i++) for(let j=i+1;j<nums.length;j++) if(nums[i]+nums[j]===target) return [i,j]; return []; }',
    ],
    [
      'python',
      'def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1,len(nums)):\n            if nums[i]+nums[j]==target:\n                return [i,j]\n    return []',
    ],
  ]) {
    await page.getByLabel('Practice language').selectOption(language);
    await page.getByRole('textbox', { name: 'Solution code' }).fill(source);
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(page.getByText('Challenge complete.', { exact: true })).toBeVisible({
      timeout: 60000,
    });
  }
  await desktop.close();
  await launch();
  await expect(page.getByLabel('Practice language')).toHaveValue('python');
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText('def two_sum');
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(`2 of ${totalChallenges}`);
});

function sortingSource(language: 'javascript' | 'python', correct: boolean) {
  if (correct) return juniorSolutions['selection-sort'][language];
  return juniorSolutions['bubble-sort'][language].replaceAll(
    language === 'javascript' ? 'bubbleSort' : 'bubble_sort',
    language === 'javascript' ? 'selectionSort' : 'selection_sort',
  );
}
async function submitSorting(language: 'javascript' | 'python', correct: boolean) {
  await page.getByLabel('Practice language').selectOption(language);
  await page.getByRole('textbox', { name: 'Solution code' }).fill(sortingSource(language, correct));
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  const status = page.getByRole('region', { name: 'Execution results' }).locator('[aria-live]');
  const message = correct ? 'Selection Sort verified' : 'comparison pattern matches Bubble Sort';
  await expect(status).toContainText(message, { timeout: 60000 });
}
async function selectedOutputId() {
  return page
    .getByRole('tablist', { name: 'Execution output' })
    .locator('[aria-selected="true"]')
    .getAttribute('id');
}
async function showSortingResults(selected: string | null) {
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled({
    timeout: 60000,
  });
  await expect(page.locator(`#${selected}`)).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Test results/ }).click();
}
async function checkSorting(language: 'javascript' | 'python', correct: boolean) {
  const selected = await selectedOutputId();
  await submitSorting(language, correct);
  await showSortingResults(selected);
  const heading = correct ? 'Challenge complete.' : 'Output correct. Method needs attention.';
  await expect(page.getByText(heading, { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.test-row.failed')).toHaveCount(0);
  if (!correct)
    await expect(page.getByText('Different method detected', { exact: true })).toBeVisible();
}
test('bundled method checks withhold credit for a sorting substitution in both languages', async () => {
  await page.locator('#algorithm').selectOption('selection-sort');
  for (const language of ['javascript', 'python'] as const) {
    await checkSorting(language, false);
    await checkSorting(language, true);
  }
  await desktop.close();
  await launch();
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(`2 of ${totalChallenges}`);
});

test('bundled compiler, full-stack workers, clean analyzers and HTML preview work', async () => {
  await page.getByRole('button', { name: 'Angular', exact: true }).click();
  const angular = page.locator('pc-angular-practice');
  await angular
    .getByRole('textbox', { name: 'Solution code' })
    .fill(angularSolutions['ng-counter']);
  await angular.getByRole('button', { name: 'Finish', exact: true }).click();
  await angular.getByRole('tab', { name: /Test results/ }).click();
  await expect(angular.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await angular.getByRole('tab', { name: 'Preview', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Angular exercise preview"]');
  await preview.getByRole('button', { name: 'Increase', exact: true }).click();
  await expect(preview.locator('[data-testid=count]')).toHaveText('1');

  await page.getByRole('button', { name: 'Full stack', exact: true }).click();
  const fullstack = page.locator('pc-fullstack-practice');
  for (const [file, source] of Object.entries(angularFullstackSolutions['fs-tasks'])) {
    const tab = fullstack.getByRole('tab', { name: file, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await fullstack.getByRole('textbox', { name: 'Solution code' }).fill(source);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.values(
            JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts,
          )[0],
      ),
    )
    .toEqual(angularFullstackSolutions['fs-tasks']);
  await fullstack.getByRole('button', { name: 'Finish', exact: true }).click();
  await fullstack.getByRole('tab', { name: /Test results/ }).click();
  await expect(fullstack.getByText('Challenge complete.', { exact: true })).toBeVisible({
    timeout: 60000,
  });

  await page.getByRole('button', { name: 'Clean code', exact: true }).click();
  const clean = page.locator('pc-clean-practice');
  for (const language of ['javascript', 'python'] as const) {
    await clean.getByLabel('Clean code language', { exact: true }).selectOption(language);
    await clean
      .getByRole('textbox', { name: 'Solution code' })
      .fill(cleanSolutions['cc-total'][language]);
    await clean.getByRole('button', { name: 'Finish', exact: true }).click();
    await clean.getByRole('tab', { name: /Test results/ }).click();
    await expect(clean.getByText('Challenge complete.', { exact: true })).toBeVisible({
      timeout: 60000,
    });
  }

  await page.getByRole('button', { name: 'HTML & CSS', exact: true }).click();
  const web = page.locator('pc-web-practice');
  await web.getByRole('textbox', { name: 'Solution code' }).fill(webSolutions['html-profile']);
  await web.getByRole('button', { name: 'Finish', exact: true }).click();
  await web.getByRole('tab', { name: /Test results/ }).click();
  await expect(web.getByText('Challenge complete.', { exact: true })).toBeVisible();
});

test('desktop renderer is isolated, network is blocked and JSON export is usable', async () => {
  expect(
    await page.evaluate(() => ({
      require: typeof (window as any).require,
      process: typeof (window as any).process,
    })),
  ).toEqual({ require: 'undefined', process: 'undefined' });
  const preferences = await desktop.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
  );
  expect(preferences.sandbox).toBe(true);
  expect(preferences.contextIsolation).toBe(true);
  expect(preferences.nodeIntegration).toBe(false);
  expect(preferences.webSecurity).toBe(true);
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('https://example.com/');
        return 'allowed';
      } catch {
        return 'blocked';
      }
    }),
  ).toBe('blocked');
  await page.evaluate(() => window.open('file:///etc/passwd'));
  expect(await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(
    1,
  );

  const target = join(profile, 'export.json');
  await desktop.evaluate(({ session }, target) => {
    (globalThis as any).__downloadResult = null;
    session.defaultSession.once('will-download', (_event, item) => {
      item.setSavePath(target);
      item.once('done', (_event, state) => {
        (globalThis as any).__downloadResult = { name: item.getFilename(), state };
      });
    });
  }, target);
  await page.getByRole('button', { name: 'My progress', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Export drafts & progress', exact: true })
    .click();
  await expect
    .poll(() => desktop.evaluate(() => (globalThis as any).__downloadResult))
    .toEqual({ name: 'procode-workspace.json', state: 'completed' });
  expect(JSON.parse(await readFile(target, 'utf8')).schema).toBe(1);
});

test('desktop workflows and quizzes work, and the window adapts to smaller sizes', async ({}, testInfo) => {
  await page.getByRole('button', { name: 'Data structures', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('reverse-linked-list');
  await page.getByRole('button', { name: 'Firebase', exact: true }).click();
  const firebase = page.locator('pc-firebase-practice');
  await firebase
    .getByLabel('Firebase commands', { exact: true })
    .fill(firebaseSolutions['fb-setup']);
  await firebase.getByRole('button', { name: 'Finish', exact: true }).click();
  await firebase.getByRole('tab', { name: /Test results/ }).click();
  await expect(firebase.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Git workflows', exact: true }).click();
  const git = page.locator('pc-git-practice');
  await git.getByLabel('Git commands', { exact: true }).fill(gitSolutions['git-feature']);
  await git.getByLabel('Prepare pull request after commands').check();
  await git
    .getByRole('textbox', { name: 'Pull request title', exact: true })
    .fill('Prepare reviewed change');
  await git.getByRole('button', { name: 'Finish', exact: true }).click();
  await git.getByRole('tab', { name: /Test results/ }).click();
  await expect(git.getByText('Challenge complete.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Knowledge quizzes', exact: true }).click();
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(`Question ${i + 1} of 10`, { exact: true })).toBeVisible();
    const prompt = await page.locator('#question-heading').innerText();
    const question = questions.find((entry) => entry.prompt === prompt)!;
    await page
      .getByRole('radio', { name: question.choices[question.correct], exact: true })
      .check();
    if (i < 9) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Submit quiz', exact: true }).click();
  await expect(page.locator('.score')).toHaveText('10 / 10');
  await page.getByRole('button', { name: 'Algorithms', exact: true }).click();
  for (const width of [1440, 768, 640]) {
    await desktop.evaluate(
      ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0].setSize(width, 950),
      width,
    );
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`desktop-${width}.png`) });
  }
});
