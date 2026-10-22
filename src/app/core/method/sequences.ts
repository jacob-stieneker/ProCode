import type { Method } from '../method-policy';
import { comparisons, MethodProbe, MethodTrace, same, sorted, TraceEvent } from './model';
import { Sort, sortVariants } from './sort-variants';
function transcript(sort: Sort, input: number[]): string[] {
  const events: string[] = [];
  sort([...input], (a, b) => {
    if (a !== b) events.push(JSON.stringify(sorted([a, b])));
    return a - b;
  });
  return events;
}
function sortComparisons(trace: MethodTrace, values: number[]) {
  return trace.events
    .filter(
      ([op, a, b]) =>
        comparisons.includes(op) &&
        values.includes(a as number) &&
        values.includes(b as number) &&
        a !== b,
    )
    .map(([, a, b]) => JSON.stringify(sorted([a as number, b as number])));
}
export function sortingMatches(method: Method, traces: MethodTrace[], probes: MethodProbe[]) {
  return traces.every((trace, index) => {
    const values = probes[index].input[0] as number[];
    const actual = sortComparisons(trace, values);
    return sortVariants[method].some((sort) => same(transcript(sort, values), actual));
  });
}
function searchVisits(events: TraceEvent[], values: number[], target: number) {
  const visits: number[] = [];
  for (const [op, a, b] of events) {
    if (![...comparisons, '==', '===', '!=', '!=='].includes(op)) continue;
    const value = a === target ? b : b === target ? a : undefined;
    if (values.includes(value as number) && visits.at(-1) !== value) visits.push(value as number);
  }
  return visits;
}
function binaryVisits(values: number[], target: number, ceil: boolean) {
  let left = 0,
    right = values.length - 1;
  const visits: number[] = [];
  while (left <= right) {
    const middle = (ceil ? Math.ceil : Math.floor)((left + right) / 2);
    visits.push(values[middle]);
    if (values[middle] === target) break;
    if (values[middle] < target) left = middle + 1;
    else right = middle - 1;
  }
  return visits;
}
function searchProbeMatches(method: Method, trace: MethodTrace, probe: MethodProbe) {
  const [values, target] = probe.input as [number[], number];
  const visits = searchVisits(trace.events, values, target);
  const found = values.indexOf(target);
  if (method === 'linear-search')
    return same(visits, values.slice(0, found < 0 ? values.length : found + 1));
  return [false, true].some((ceil) => same(visits, binaryVisits(values, target, ceil)));
}
export function searchMatches(method: Method, traces: MethodTrace[], probes: MethodProbe[]) {
  return traces.every((trace, index) => searchProbeMatches(method, trace, probes[index]));
}
