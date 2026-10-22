import { Method, MethodResult, methodPolicies } from './method-policy';
import { MethodProbe, MethodTrace, same } from './method/model';
import { methodProbes } from './method/probes';
import { sortingMatches, searchMatches } from './method/sequences';
import { dijkstraMatches } from './method/graphs';
import { breadthFirstMatches, trieMatches } from './method/structures';
export { methodProbes } from './method/probes';
export type { MethodProbe, MethodTrace } from './method/model';
const sortMethods: Method[] = ['selection-sort', 'bubble-sort', 'insertion-sort', 'merge-sort'];
const searchMethods: Method[] = ['linear-search', 'binary-search'];
function unverified(method: Method): MethodResult {
  return {
    status: 'unverified',
    message: `The output checks are separate. ProCode could not verify ${methodPolicies[method]} from this implementation. Finish requires a verified method. Use the standard approach described in the requirements and hints.`,
  };
}
function validEvidence(
  traces: MethodTrace[] | undefined,
  probes: MethodProbe[],
): traces is MethodTrace[] {
  return (
    Array.isArray(traces) &&
    traces.length === probes.length &&
    traces.every(
      (trace, i) =>
        !trace.error && Array.isArray(trace.events) && same(trace.value, probes[i].expected),
    )
  );
}
function matches(method: Method, traces: MethodTrace[], probes: MethodProbe[]) {
  if (method.endsWith('-sort')) return sortingMatches(method, traces, probes);
  if (method.endsWith('-search')) return searchMatches(method, traces, probes);
  if (method === 'shortest-paths') return dijkstraMatches(traces, probes);
  return method === 'prefix-tree' ? trieMatches(traces) : breadthFirstMatches(traces, probes);
}
function builtInResult(method: Method, traces: MethodTrace[]): MethodResult | undefined {
  if (!method.endsWith('-sort') && !method.endsWith('-search')) return;
  if (!traces.some((trace) => trace.events.some(([op]) => op === 'builtin'))) return;
  return {
    status: 'different',
    message: `A built-in sorting operation was used. Implement ${methodPolicies[method]} directly to complete this exercise.`,
  };
}
function alternativeResult(method: Method, traces: MethodTrace[], probes: MethodProbe[]) {
  const alternatives = method.endsWith('-sort')
    ? sortMethods
    : method.endsWith('-search')
      ? searchMethods
      : [];
  const candidate = alternatives.find(
    (candidate) => candidate !== method && matches(candidate, traces, probes),
  );
  if (!candidate) return unverified(method);
  return {
    status: 'different',
    message: `The comparison pattern matches ${methodPolicies[candidate]}. This exercise requires ${methodPolicies[method]}. Finish has not recorded a pass.`,
  } as MethodResult;
}
export function gradeMethod(method: Method, traces?: MethodTrace[]): MethodResult {
  const probes = methodProbes(method);
  if (!validEvidence(traces, probes)) return unverified(method);
  const builtIn = builtInResult(method, traces);
  if (builtIn) return builtIn;
  if (matches(method, traces, probes))
    return { status: 'verified', message: `${methodPolicies[method]} verified on method checks.` };
  return alternativeResult(method, traces, probes);
}
