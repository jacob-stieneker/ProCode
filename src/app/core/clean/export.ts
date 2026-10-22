import { downloadJson } from '../download';
import type { CleanSavedState } from './state';

export function exportCleanWork(state: CleanSavedState) {
  downloadJson(state, 'procode-clean-code.json');
}
