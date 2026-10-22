import { expect, Locator } from '@playwright/test';

export async function replaceEditorCode(editor: Locator, source: string) {
  await editor.press('ControlOrMeta+a');
  await editor.press('Backspace');
  await expect(editor).toHaveText('', { useInnerText: true });
  await editor.page().keyboard.insertText(source);
}
