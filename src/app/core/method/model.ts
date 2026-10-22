export type TraceEvent = [string, ...unknown[]];
export interface MethodTrace {
  events: TraceEvent[];
  value?: unknown;
  error?: boolean;
}
export interface MethodProbe {
  input: unknown[];
  expected: unknown;
}
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const sorted = (values: number[]) => [...values].sort((a, b) => a - b);
export const comparisons = ['<', '>', '<=', '>='];
