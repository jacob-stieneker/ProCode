import {
  AngularExercise,
  AngularScenario,
  AngularStep,
  AngularAssertion,
  angularExerciseInfo,
} from './model';
export const click = (target: string): AngularStep => ({ action: 'click', target });
export const input = (target: string, value: string): AngularStep => ({
  action: 'input',
  target,
  value,
});
export const wait = (ms: number): AngularStep => ({ action: 'wait', ms });
export const value = (
  target: string,
  expected: unknown,
  kind: AngularAssertion['kind'] = 'text',
): AngularAssertion => ({ target, expected, kind });
export const scenario = (
  name: string,
  hint: string,
  steps: AngularStep[],
  ...assertions: AngularAssertion[]
): AngularScenario => ({ name, hint, steps, assertions });
export const make = (
  id: string,
  content: Omit<AngularExercise, keyof (typeof angularExerciseInfo)[number]>,
): AngularExercise => ({ ...angularExerciseInfo.find((e) => e.id === id)!, ...content });
export const contract =
  'Export a standalone AppComponent. Keep the supplied data-testid attributes so checks can interact with the UI. Edit this TypeScript file, including its inline Angular template. Equivalent working implementations are accepted.';
