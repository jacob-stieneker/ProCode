import type { Difficulty } from '../exercises';
export type GitProvider = 'GitHub' | 'Azure Repos' | 'Bitbucket';
export interface GitInfo {
  id: string;
  title: string;
  difficulty: Difficulty;
  provider: GitProvider;
  version: number;
}
export const gitExerciseInfo: GitInfo[] = [
  {
    id: 'git-feature',
    title: 'Publish a Feature Pull Request',
    difficulty: 'junior',
    provider: 'GitHub',
    version: 1,
  },
  {
    id: 'git-stage',
    title: 'Commit Only the Intended Files',
    difficulty: 'junior',
    provider: 'Azure Repos',
    version: 1,
  },
  {
    id: 'git-stash',
    title: 'Pause Work for a Hotfix',
    difficulty: 'junior',
    provider: 'Bitbucket',
    version: 1,
  },
  {
    id: 'git-merge',
    title: 'Resolve a Merge Conflict',
    difficulty: 'skilled',
    provider: 'GitHub',
    version: 1,
  },
  {
    id: 'git-rebase',
    title: 'Rebase an Unpublished Feature',
    difficulty: 'skilled',
    provider: 'Azure Repos',
    version: 1,
  },
  {
    id: 'git-pick',
    title: 'Cherry-pick a Focused Fix',
    difficulty: 'skilled',
    provider: 'Bitbucket',
    version: 1,
  },
  {
    id: 'git-revert',
    title: 'Undo a Released Change Safely',
    difficulty: 'senior',
    provider: 'GitHub',
    version: 1,
  },
  {
    id: 'git-recover',
    title: 'Recover a Lost Commit',
    difficulty: 'senior',
    provider: 'Azure Repos',
    version: 1,
  },
  {
    id: 'git-lease',
    title: 'Publish Rewritten History with a Lease',
    difficulty: 'senior',
    provider: 'Bitbucket',
    version: 1,
  },
];
export const gitKey = (e: GitInfo) => `${e.id}:v${e.version}`;
export type GitTree = Record<string, string>;
export interface GitCommit {
  id: string;
  parents: string[];
  message: string;
  tree: GitTree;
}
export interface GitState {
  commits: Record<string, GitCommit>;
  branches: Record<string, string>;
  head: string;
  working: GitTree;
  index: GitTree;
  remote: Record<string, string>;
  tracking: Record<string, string>;
  upstream: Record<string, string>;
  reflog: string[];
  stash: { working: GitTree; index: GitTree; base: string }[];
  merge: { other: string; original: string; conflicts: string[] } | null;
  pushes: { branch: string; commit: string; lease: boolean; forced: boolean }[];
  review: {
    provider: GitProvider;
    source: string;
    target: string;
    title: string;
    commit: string;
  } | null;
  next: number;
  inspected: string[];
}
export interface ReviewDraft {
  enabled: boolean;
  source: string;
  target: string;
  title: string;
}
export const emptyReview = (): ReviewDraft => ({
  enabled: false,
  source: '',
  target: 'main',
  title: '',
});
export interface GitCheck {
  name: string;
  hint: string;
  test: (s: GitState) => boolean;
}
export interface GitExercise extends GitInfo {
  description: string;
  requirements: string[];
  starter: string;
  hints: string[];
  explanation: string;
  initial: GitState;
  checks: GitCheck[];
  reviewBranch: string;
  providerNote: string;
  providerUrl: string;
}
export const sameTree = (a: GitTree, b: GitTree) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);
export function headCommit(s: GitState) {
  return s.commits[s.branches[s.head]];
}
export function ancestor(s: GitState, older: string, newer: string): boolean {
  const visited = new Set<string>(),
    queue = [newer];
  while (queue.length) {
    const id = queue.pop()!;
    if (id === older) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(...(s.commits[id]?.parents ?? []));
  }
  return false;
}
export function seedGit(): GitState {
  const tree = { 'app.txt': 'Hello', 'docs.txt': 'Guide', 'login.txt': 'broken' };
  return {
    commits: { c1: { id: 'c1', parents: [], message: 'Initial application', tree } },
    branches: { main: 'c1' },
    head: 'main',
    working: { ...tree },
    index: { ...tree },
    remote: { main: 'c1' },
    tracking: { main: 'c1' },
    upstream: { main: 'main' },
    reflog: ['c1'],
    stash: [],
    merge: null,
    pushes: [],
    review: null,
    next: 2,
    inspected: [],
  };
}
