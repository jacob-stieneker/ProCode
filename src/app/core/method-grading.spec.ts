import { Exercise, exercises } from './exercises';
import { gradeMethod } from './method-grading';
import { methodPolicies } from './method-policy';
import { draftKey, freshWorkspace, readWorkspace, saveWorkspace } from './storage';
const named = exercises.filter((exercise) => exercise.method);
const source = 'function selectionSort(nums) { return nums.sort((a,b)=>a-b); }';
function assertContract(exercise: Exercise) {
  expect(exercise.version).toBe(2);
  expect(exercise.requirements.join(' ')).toContain(
    'Finish records completion only when both pass',
  );
}
function legacyWorkspace() {
  const workspace = freshWorkspace();
  workspace.drafts['selection-sort:v1:javascript'] = source;
  workspace.completions = [
    {
      key: 'selection-sort:v1:javascript',
      title: 'Selection Sort',
      language: 'javascript',
      completedAt: new Date().toISOString(),
    },
  ];
  return workspace;
}
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());
it('requires a method check for every named algorithm contract in the catalog', () => {
  expect(named.map((exercise) => exercise.id).sort()).toEqual(Object.keys(methodPolicies).sort());
  named.forEach(assertContract);
  for (const id of ['move-zeroes', 'median-sorted-arrays'])
    expect(exercises.find((exercise) => exercise.id === id)?.method).toBeUndefined();
});
it('withholds credit when traces are absent, incomplete, or fail the method inputs', () => {
  expect(gradeMethod('selection-sort').status).toBe('unverified');
  expect(gradeMethod('selection-sort', []).status).toBe('unverified');
  expect(gradeMethod('prefix-tree', [{ events: [], value: [] }]).status).toBe('unverified');
});
it('preserves old drafts but requires re-verification of prior output-only completions', () => {
  saveWorkspace(legacyWorkspace());
  const restored = readWorkspace().data;
  expect(restored.drafts[draftKey('selection-sort', 2, 'javascript')]).toBe(source);
  expect(restored.completions).toEqual([]);
});
