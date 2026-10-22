import { MethodProbe, MethodTrace, same } from './model';
const MIN_PROBE_DISTANCE = 20;
interface GraphState {
  distances: number[];
  settled: Set<number>;
  groups: string[][];
}
function nextVertex(state: GraphState) {
  let vertex = -1;
  for (let i = 0; i < state.distances.length; i++)
    if (!state.settled.has(i) && (vertex < 0 || state.distances[i] < state.distances[vertex]))
      vertex = i;
  return vertex;
}
function relaxEdges(state: GraphState, vertex: number, edges: number[][], skipSettled: boolean) {
  const group: string[] = [];
  for (const [from, to, weight] of edges) {
    if (from !== vertex || (skipSettled && state.settled.has(to))) continue;
    const candidate = state.distances[from] + weight;
    group.push(
      JSON.stringify([
        candidate,
        Number.isFinite(state.distances[to]) ? state.distances[to] : 'inf',
      ]),
    );
    state.distances[to] = Math.min(state.distances[to], candidate);
  }
  if (group.length) state.groups.push(group.sort());
}
function graphState(count: number, source: number): GraphState {
  const state: GraphState = {
    distances: Array<number>(count).fill(Infinity),
    settled: new Set(),
    groups: [],
  };
  state.distances[source] = 0;
  return state;
}
export function dijkstra(input: unknown[], skipSettled = false) {
  const [count, edges, source] = input as [number, number[][], number];
  const state = graphState(count, source);
  for (let step = 0; step < count; step++) {
    const vertex = nextVertex(state);
    if (vertex < 0 || !Number.isFinite(state.distances[vertex])) break;
    state.settled.add(vertex);
    relaxEdges(state, vertex, edges, skipSettled);
  }
  return {
    groups: state.groups,
    value: state.distances.map((value) => (Number.isFinite(value) ? value : -1)),
  };
}
function groupsMatch(relaxations: string[], groups: string[][]) {
  let offset = 0;
  for (const group of groups) {
    if (!same(relaxations.slice(offset, offset + group.length).sort(), group)) return false;
    offset += group.length;
  }
  return offset > 0 && offset === relaxations.length;
}
function graphProbeMatches(trace: MethodTrace, probe: MethodProbe) {
  const relaxations = trace.events
    .filter(
      ([op, value]) => op === 'relax' && typeof value === 'number' && value >= MIN_PROBE_DISTANCE,
    )
    .map(([, a, b]) => JSON.stringify([a, b]));
  return [false, true].some((skip) => groupsMatch(relaxations, dijkstra(probe.input, skip).groups));
}
export function dijkstraMatches(traces: MethodTrace[], probes: MethodProbe[]) {
  return traces.every((trace, index) => graphProbeMatches(trace, probes[index]));
}
