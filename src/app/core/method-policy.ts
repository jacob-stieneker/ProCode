export const methodPolicies = {
  'selection-sort': 'Selection Sort',
  'bubble-sort': 'Bubble Sort',
  'insertion-sort': 'Insertion Sort',
  'merge-sort': 'Merge Sort',
  'linear-search': 'Linear Search',
  'binary-search': 'Binary Search',
  'shortest-paths': 'Dijkstra',
  'prefix-tree': 'Prefix Tree',
  'tree-level-order': 'Breadth-first Search',
} as const;
export type Method = keyof typeof methodPolicies;
export interface MethodResult {
  status: 'verified' | 'different' | 'unverified';
  message: string;
}
export function requiredMethod(id: string): Method | undefined {
  return Object.hasOwn(methodPolicies, id) ? (id as Method) : undefined;
}
