import { expect, Page } from '@playwright/test';
import { fullstackExercises } from '../src/app/core/fullstack/catalog';
import { fullstackKey, fileNames, ProjectFiles } from '../src/app/core/fullstack/model';
import { replaceEditorCode } from './editor-input';
const ui = (page: Page) => page.locator('pc-fullstack-practice');
async function currentFiles(page: Page): Promise<ProjectFiles> {
  const id = await ui(page).getByLabel('Full-stack exercise', { exact: true }).inputValue();
  const exercise = fullstackExercises.find((item) => item.id === id)!;
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem('procode.fullstack-practice.v1')!).drafts[key],
    fullstackKey(exercise),
  );
  return saved ?? exercise.starter;
}
async function readyFile(page: Page, name: keyof ProjectFiles) {
  const tab = ui(page).getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const original = (await currentFiles(page))[name];
  const editor = ui(page).getByRole('textbox', { name: 'Solution code' });
  await editor.press('ControlOrMeta+Home');
  if (original)
    await expect(editor).toContainText(original.split('\n').slice(0, 3).join('\n'), {
      useInnerText: true,
    });
  else await expect(editor).toHaveText('', { useInnerText: true });
  return editor;
}
export async function editProject(
  page: Page,
  files: ProjectFiles,
  normalizeOuterWhitespace = true,
) {
  for (const name of fileNames) {
    const editor = await readyFile(page, name);
    const source = normalizeOuterWhitespace ? files[name].trim() : files[name];
    await replaceEditorCode(editor, source);
    await expect.poll(async () => (await currentFiles(page))[name]).toBe(source);
  }
}
