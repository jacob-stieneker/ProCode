import { MethodProbe, MethodTrace, same, TraceEvent } from './model';
type Edge = { child: unknown; depth: number };
type Graph = Map<unknown, Edge[]>;
const MAX_TRIE_PATH = 100,
  REQUIRED_CHARACTER_DEPTH = 4,
  REQUIRED_PREFIX_READS = 3;
function addEdge(graph: Graph, counts: Map<string, number>, event: TraceEvent) {
  const [, parent, key, child] = event;
  const depth = typeof key === 'string' && /^[a-z]$/.test(key) ? 1 : 0;
  const children = graph.get(parent) ?? [];
  if (!children.some((edge) => edge.child === child && edge.depth === depth))
    children.push({ child, depth });
  graph.set(parent, children);
  if (!depth) return;
  const edge = JSON.stringify([parent, key, child]);
  counts.set(edge, (counts.get(edge) ?? 0) + 1);
}
function pathDepth(graph: Graph, parent: unknown, seen = new Set<unknown>()): number {
  if (seen.has(parent) || seen.size > MAX_TRIE_PATH) return 0;
  return Math.max(
    0,
    ...(graph.get(parent) ?? []).map(
      ({ child, depth }) => depth + pathDepth(graph, child, new Set([...seen, parent])),
    ),
  );
}
function trieProbeMatches(trace: MethodTrace) {
  const graph: Graph = new Map(),
    counts = new Map<string, number>();
  for (const event of trace.events) if (event[0] === 'edge') addEdge(graph, counts, event);
  return (
    [...graph.keys()].some((parent) => pathDepth(graph, parent) >= REQUIRED_CHARACTER_DEPTH) &&
    [...counts.values()].some((count) => count >= REQUIRED_PREFIX_READS)
  );
}
export const trieMatches = (traces: MethodTrace[]) => traces.every(trieProbeMatches);
export function breadthFirstMatches(traces: MethodTrace[], probes: MethodProbe[]) {
  const visits = traces[0].events.filter(([op]) => op === 'visit').map(([, value]) => value);
  return same([...new Set(visits)], (probes[0].expected as number[][]).flat());
}
