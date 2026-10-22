import { expect, Page, test } from '@playwright/test';
import { fullstackSolutions } from './fixtures/fullstack-solutions';
import { editProject } from './fullstack-drafts';
async function delayApiInitialization(page: Page) {
  await page.addInitScript(() => {
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      override postMessage(message: any, options?: any) {
        const send = () => super.postMessage(message, options);
        if (message?.kind === 'init') setTimeout(send, 2500);
        else send();
      }
    };
  });
}
async function runExamples(page: Page) {
  const ui = page.locator('pc-fullstack-practice');
  await ui.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(ui.getByRole('region', { name: 'Full-stack practice output' })).toHaveAttribute(
    'data-completed-attempt',
    '1',
    { timeout: 60000 },
  );
  await ui.getByRole('tab', { name: /Test results/ }).click();
  await expect(ui.getByText('Run checks passed.', { exact: true })).toBeVisible();
}
test('slow full-stack worker startup completes without losing grading results', async ({
  page,
}) => {
  test.setTimeout(90000);
  await delayApiInitialization(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Full stack', exact: true }).click();
  await editProject(page, fullstackSolutions['fs-tasks']);
  await runExamples(page);
});
