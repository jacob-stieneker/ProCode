import type { Check, Difficulty, Language } from '../exercises';
export const cleanExerciseInfo = [
  { id: 'cc-total', title: 'Name the Order Total', difficulty: 'junior', version: 1 },
  { id: 'cc-access', title: 'Flatten Access Checks', difficulty: 'junior', version: 1 },
  { id: 'cc-shipping', title: 'Name the Shipping Rules', difficulty: 'skilled', version: 1 },
  { id: 'cc-ranking', title: 'Remove Hidden Mutation', difficulty: 'skilled', version: 1 },
  {
    id: 'cc-invoice',
    title: 'Separate Invoice Responsibilities',
    difficulty: 'senior',
    version: 1,
  },
  { id: 'cc-status', title: 'Centralize Delivery Rules', difficulty: 'senior', version: 1 },
  {
    id: 'cc-registration',
    title: 'Refactor Registration Validation',
    difficulty: 'junior',
    version: 1,
  },
  { id: 'cc-discounts', title: 'Make Discounts Immutable', difficulty: 'skilled', version: 1 },
  { id: 'cc-report', title: 'Separate a Ticket Report', difficulty: 'senior', version: 1 },
  { id: 'cc-pagination', title: 'Clarify Pagination Boundaries', difficulty: 'junior', version: 1 },
  { id: 'cc-retry', title: 'Name Retry Timing Rules', difficulty: 'junior', version: 1 },
  { id: 'cc-tags', title: 'Normalize Tags Without Mutation', difficulty: 'skilled', version: 1 },
  { id: 'cc-coupon', title: 'Flatten Coupon Validation', difficulty: 'skilled', version: 1 },
  { id: 'cc-logs', title: 'Decompose a Log Report', difficulty: 'senior', version: 1 },
  { id: 'cc-roles', title: 'Centralize Role Permissions', difficulty: 'senior', version: 1 },
] satisfies { id: string; title: string; difficulty: Difficulty; version: number }[];
export const cleanKey = (info: { id: string; version: number }, language: Language) =>
  `${info.id}:v${info.version}:${language}`;
export interface CleanRule {
  kind: 'names' | 'nesting' | 'numbers' | 'helpers' | 'strings';
  name: string;
  hint: string;
  limit?: number;
  values?: (string | number)[];
}
export interface CleanExercise {
  id: string;
  title: string;
  difficulty: Difficulty;
  version: number;
  description: string;
  requirements: string[];
  hints: string[];
  explanation: string;
  signature: Record<Language, string>;
  starter: Record<Language, string>;
  examples: Check[];
  additional: Check[];
  rules: CleanRule[];
  preserveInputs?: boolean;
}
export interface CleanMetrics {
  shortNames: string[];
  branchDepth: number;
  inlineNumbers: number[];
  inlineStrings: string[];
  helpers: string[];
  entryStatements: number;
}
export interface CleanResult {
  name: string;
  pass: boolean;
  hint: string;
  actual?: string;
  kind: 'behavior' | 'cleanup';
}
