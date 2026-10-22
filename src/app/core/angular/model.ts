import type { Difficulty } from '../exercises';
export interface AngularInfo {
  id: string;
  title: string;
  difficulty: Difficulty;
  version: number;
}
export const angularExerciseInfo: AngularInfo[] = [
  { id: 'ng-counter', title: 'Repair a Counter', difficulty: 'junior', version: 1 },
  { id: 'ng-filter', title: 'Filter a Course List', difficulty: 'junior', version: 1 },
  { id: 'ng-greeting', title: 'Bind a Profile Form', difficulty: 'junior', version: 1 },
  { id: 'ng-validation', title: 'Validate a Registration Form', difficulty: 'skilled', version: 1 },
  { id: 'ng-components', title: 'Connect Parent and Child', difficulty: 'skilled', version: 1 },
  { id: 'ng-service', title: 'Share State Through a Service', difficulty: 'skilled', version: 1 },
  { id: 'ng-search', title: 'Handle Asynchronous Search', difficulty: 'senior', version: 1 },
  { id: 'ng-pagination', title: 'Keep Derived State Consistent', difficulty: 'senior', version: 1 },
  {
    id: 'ng-cross-validation',
    title: 'Validate Related Form Fields',
    difficulty: 'senior',
    version: 1,
  },
  {
    id: 'ng-disclosure',
    title: 'Build a Conditional Details Panel',
    difficulty: 'junior',
    version: 1,
  },
  { id: 'ng-pipe', title: 'Create a Summary Pipe', difficulty: 'junior', version: 1 },
  { id: 'ng-tasks', title: 'Manage an Editable Task List', difficulty: 'junior', version: 1 },
  {
    id: 'ng-input-lifecycle',
    title: 'Respond to Changing Inputs',
    difficulty: 'skilled',
    version: 1,
  },
  { id: 'ng-projection', title: 'Compose a Reusable Card', difficulty: 'skilled', version: 1 },
  { id: 'ng-form-array', title: 'Build a Dynamic Skills Form', difficulty: 'skilled', version: 1 },
  { id: 'ng-onpush', title: 'Repair OnPush List Updates', difficulty: 'senior', version: 1 },
  {
    id: 'ng-value-accessor',
    title: 'Connect a Custom Form Control',
    difficulty: 'senior',
    version: 1,
  },
  { id: 'ng-cleanup', title: 'Clean Up Component Subscriptions', difficulty: 'senior', version: 1 },
  { id: 'ng-crud-local', title: 'Build a Contact Manager', difficulty: 'junior', version: 1 },
  { id: 'ng-crud-api', title: 'Connect CRUD to a Practice API', difficulty: 'skilled', version: 1 },
  {
    id: 'ng-crud-conflicts',
    title: 'Handle CRUD Conflicts and Rollback',
    difficulty: 'senior',
    version: 1,
  },
];
export interface AngularStep {
  action: 'click' | 'input' | 'wait';
  target?: string;
  value?: string;
  ms?: number;
}
export interface AngularAssertion {
  target: string;
  kind: 'text' | 'texts' | 'disabled' | 'count' | 'value';
  expected: unknown;
}
export interface AngularScenario {
  name: string;
  hint: string;
  steps: AngularStep[];
  assertions: AngularAssertion[];
}
export interface AngularExercise extends AngularInfo {
  description: string;
  requirements: string[];
  starter: string;
  hints: string[];
  explanation: string;
  scenarios: AngularScenario[];
}
export interface AngularResult {
  name: string;
  hint: string;
  pass: boolean;
  actual?: string;
}
export const angularKey = (e: AngularInfo) => `${e.id}:v${e.version}`;
