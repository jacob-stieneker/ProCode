import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { methodPolicies, Method } from '../src/app/core/method-policy';
import {
  searchCases,
  solutions,
  stalledSelection,
  substitutes,
  variants,
} from './fixtures/method-cases';
import {
  checkWidth,
  completed,
  completions,
  correctOutput,
  flagged,
  open,
  runWithoutCompletion,
  submit,
  substitution,
  verifyMethod,
} from './method-helpers';
const methods = Object.keys(methodPolicies) as Method[];
const sorts = methods.filter((id) => id.endsWith('-sort'));
test('method feedback wraps and remains accessible at mobile and desktop widths', async ({
  page,
}, info) => {
  await open(page, 'javascript');
  await submit(page, 'selection-sort', substitution('selection-sort', 'bubble-sort', 'javascript'));
  await correctOutput(page);
  for (const width of [390, 768, 1440]) await checkWidth(page, info, width);
  expect((await new AxeBuilder({ page }).include('#tests-content').analyze()).violations).toEqual(
    [],
  );
});
for (const language of ['javascript', 'python'] as const) {
  test(`${language} withholds method credit when an analyzer asset is unavailable`, async ({
    page,
  }) => {
    await page.route('**/runtime/method/**', (route) => route.abort());
    await open(page, language);
    await submit(page, 'selection-sort', solutions['selection-sort'][language]);
    await flagged(page, 'Method not verified');
    expect(await completions(page)).toEqual([]);
  });
  test(`${language} accepts alternative implementations of named methods`, async ({ page }) => {
    test.setTimeout(90000);
    await open(page, language);
    for (const [id, code] of Object.entries(variants[language])) {
      await submit(page, id, code);
      await completed(page);
    }
  });
  test(`${language} flags behavioral substitutes for Dijkstra, tries, and breadth-first traversal`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await open(page, language);
    for (const [id, code] of Object.entries(substitutes[language])) {
      await submit(page, id, code);
      await correctOutput(page);
      await expect(page.locator('.method-result')).toContainText('Completion withheld');
    }
    expect(await completions(page)).toEqual([]);
  });
  test(`${language} preserves correct output when method analysis times out`, async ({ page }) => {
    test.setTimeout(60000);
    await open(page, language);
    await submit(page, 'selection-sort', stalledSelection(language));
    await correctOutput(page);
    await expect(page.locator('.method-result')).toContainText('timed out');
    expect(await completions(page)).toEqual([]);
  });
  test(`${language} verifies every required method and preserves output grades`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await open(page, language);
    for (const id of methods) await test.step(id, () => verifyMethod(page, id, language));
  });
  test(`${language} rejects every other sorting algorithm without calling correct output wrong`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await open(page, language);
    for (const required of sorts)
      for (const supplied of sorts.filter((id) => id !== required)) {
        await submit(page, required, substitution(required, supplied, language));
        await flagged(page, 'Different method detected');
        await expect(page.locator('.method-result')).toContainText(methodPolicies[supplied]);
      }
    expect(await completions(page)).toEqual([]);
  });
  test(`${language} flags search substitutions, built-ins, and an unrecognized correct sort`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await open(page, language);
    for (const [id, code, status] of searchCases(language)) {
      await submit(page, id, code);
      await flagged(page, status);
    }
    await runWithoutCompletion(page, language);
  });
}
