import type { Difficulty } from '../exercises';
export const fullstackExerciseInfo = [
  { id: 'fs-tasks', title: 'Build a Task Board', difficulty: 'junior', version: 1 },
  { id: 'fs-guestbook', title: 'Build a Guestbook', difficulty: 'junior', version: 1 },
  { id: 'fs-tickets', title: 'Build a Support Desk', difficulty: 'skilled', version: 1 },
  { id: 'fs-checkout', title: 'Build an Inventory Checkout', difficulty: 'skilled', version: 1 },
  { id: 'fs-conflicts', title: 'Resolve Conflicting Edits', difficulty: 'senior', version: 1 },
  { id: 'fs-orders', title: 'Make Order Retries Safe', difficulty: 'senior', version: 1 },
  { id: 'fs-catalog', title: 'Build a Searchable Catalog', difficulty: 'junior', version: 1 },
  { id: 'fs-pagination', title: 'Build Server-side Pagination', difficulty: 'skilled', version: 1 },
  { id: 'fs-bulk', title: 'Make Bulk Updates Atomic', difficulty: 'senior', version: 1 },
] satisfies { id: string; title: string; difficulty: Difficulty; version: number }[];
export type FullstackInfo = { id: string; title: string; difficulty: Difficulty; version: number };
export const fullstackKey = (e: FullstackInfo) => `${e.id}:v${e.version}`;
export const fileNames = ['index.html', 'styles.css', 'app.ts', 'api.js'] as const;
export type ProjectFile = (typeof fileNames)[number];
export type ProjectFiles = Record<ProjectFile, string>;
export interface ProjectStep {
  action: 'input' | 'click' | 'doubleClick' | 'request' | 'failNext' | 'assert';
  target?: string;
  value?: string;
  method?: string;
  path?: string;
  body?: unknown;
  scope?: 'ui' | 'response' | 'db';
  kind?: 'text' | 'count' | 'value' | 'disabled' | 'contains' | 'equals';
  expected?: unknown;
}
export interface ProjectScenario {
  name: string;
  hint: string;
  steps: ProjectStep[];
  width?: number;
  layout?: boolean;
}
export interface FullstackExercise extends FullstackInfo {
  description: string;
  requirements: string[];
  apiReference: string;
  starter: ProjectFiles;
  initial: Record<string, unknown>;
  scenarios: ProjectScenario[];
  hints: string[];
  explanation: string;
}
export interface ProjectResult {
  name: string;
  hint: string;
  pass: boolean;
  actual?: string;
}
