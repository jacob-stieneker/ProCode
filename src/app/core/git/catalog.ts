import {
  ancestor,
  GitCheck,
  GitExercise,
  GitState,
  GitTree,
  gitExerciseInfo,
  headCommit,
  sameTree,
  seedGit,
} from './model';
const check = (name: string, hint: string, test: GitCheck['test']): GitCheck => ({
  name,
  hint,
  test,
});
const append = (s: GitState, id: string, parent: string, patch: GitTree, message: string) => {
  s.commits[id] = { id, parents: [parent], message, tree: { ...s.commits[parent].tree, ...patch } };
  s.next = Math.max(s.next, Number(id.slice(1)) + 1);
};
const checkout = (s: GitState, branch: string, id: string) => {
  s.branches[branch] = id;
  s.head = branch;
  s.index = { ...s.commits[id].tree };
  s.working = { ...s.index };
  s.reflog = [id, 'c1'];
};
const published = (branch: string, test: (tree: GitTree, s: GitState) => boolean) =>
  check(
    'Correct branch published',
    'Push the required topic branch to origin with the requested file content.',
    (s) => !!s.remote[branch] && test(s.commits[s.remote[branch]].tree, s),
  );
const pr = (branch: string) =>
  check(
    'Pull request ready for main',
    'Enable Prepare pull request, enter a title, select the published source branch and target main.',
    (s) =>
      s.review?.source === branch &&
      s.review.target === 'main' &&
      s.review.commit === s.remote[branch],
  );
const noForce = check(
  'Shared history protected',
  'Do not use --force or -f. Main is protected in these fixtures.',
  (s) => !s.pushes.some((p) => p.forced),
);
const tidy = check(
  'No unfinished merge or staged changes',
  'Finish the merge and commit the intended changes.',
  (s) => !s.merge && sameTree(headCommit(s).tree, s.index),
);
const feature = seedGit();
feature.working['app.txt'] = 'Hello ProCode';
const stage = seedGit();
stage.working['docs.txt'] = 'Updated guide';
stage.working['debug.log'] = 'local debug output';
const stash = seedGit();
stash.commits['c1'].tree['work.txt'] = 'Draft';
stash.working = { ...stash.commits['c1'].tree, 'work.txt': 'Unfinished feature' };
stash.index = { ...stash.commits['c1'].tree };
stash.branches['feature/work'] = 'c1';
stash.head = 'feature/work';
const merge = seedGit();
append(merge, 'c2', 'c1', { 'app.txt': 'Hello feature' }, 'Feature greeting');
append(merge, 'c3', 'c1', { 'app.txt': 'Hello main' }, 'Main greeting');
checkout(merge, 'feature/greeting', 'c2');
merge.remote['main'] = 'c3';
const rebase = seedGit();
append(rebase, 'c2', 'c1', { 'feature.txt': 'Search ready' }, 'Add search');
append(rebase, 'c3', 'c1', { 'docs.txt': 'Updated upstream guide' }, 'Update guide');
checkout(rebase, 'feature/search', 'c2');
rebase.remote['main'] = 'c3';
const pick = seedGit();
append(pick, 'c2', 'c1', { 'login.txt': 'fixed' }, 'Fix login');
append(pick, 'c3', 'c2', { 'experiment.txt': 'Unreleased experiment' }, 'Experimental UI');
pick.branches['development'] = 'c3';
pick.remote['development'] = 'c3';
pick.tracking['development'] = 'c3';
const revert = seedGit();
append(revert, 'c2', 'c1', { 'app.txt': 'Broken release' }, 'Release regression');
append(revert, 'c3', 'c2', { 'docs.txt': 'Current release guide' }, 'Document release');
checkout(revert, 'main', 'c3');
revert.remote['main'] = 'c3';
revert.tracking['main'] = 'c3';
const recover = seedGit();
append(recover, 'c2', 'c1', { 'recovery.txt': 'Recovered work' }, 'Work before accidental reset');
recover.reflog = ['c1', 'c2', 'c1'];
const lease = seedGit();
append(lease, 'c2', 'c1', { 'review.txt': 'Ready for review' }, 'WIP');
checkout(lease, 'feature/review', 'c2');
lease.remote['feature/review'] = 'c2';
lease.tracking['feature/review'] = 'c2';
lease.upstream['feature/review'] = 'feature/review';
const providers = {
  GitHub: {
    providerNote:
      'GitHub calls the destination the base branch and your topic branch the compare branch. This lab prepares an open pull request without merging it.',
    providerUrl:
      'https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request',
  },
  'Azure Repos': {
    providerNote:
      'Azure Repos uses source and target branches. Branch policies may require reviewers and successful build validation before completion. This lab prepares the request; it does not simulate approvals or policy evaluation.',
    providerUrl:
      'https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-requests?view=azure-devops',
  },
  Bitbucket: {
    providerNote:
      'Bitbucket Cloud uses source and destination branches. Reviewers and merge checks belong to the hosted review flow. This lab prepares a request without claiming review or merge approval.',
    providerUrl: 'https://support.atlassian.com/bitbucket-cloud/docs/create-a-pull-request/',
  },
};
const definitions: Omit<
  GitExercise,
  'id' | 'title' | 'difficulty' | 'provider' | 'version' | 'providerNote' | 'providerUrl'
>[] = [
  {
    description: 'Publish a small feature on a topic branch and prepare a GitHub pull request.',
    initial: feature,
    reviewBranch: 'feature/greeting',
    starter: '# Inspect the changes, branch, commit, and push.\n',
    requirements: [
      'The working tree already changes app.txt to Hello ProCode. Create feature/greeting from main, commit this change with a descriptive message, and push it to origin.',
      'Keep main at its original commit. Prepare a pull request from feature/greeting to main using the form below.',
    ],
    hints: [
      'Use git status and git diff to inspect the prepared change.',
      'git switch -c creates the branch. Stage app.txt, commit with -m, and push -u origin feature/greeting.',
    ],
    explanation:
      'A topic branch isolates the change. Staging selects the next snapshot, a commit records it locally, and pushing publishes the branch before a pull request is prepared.',
    checks: [
      published('feature/greeting', (t) => t['app.txt'] === 'Hello ProCode'),
      check(
        'Main unchanged',
        'Create the feature branch before committing.',
        (s) => s.branches['main'] === 'c1',
      ),
      tidy,
      noForce,
      pr('feature/greeting'),
    ],
  },
  {
    description:
      'Publish a documentation update without accidentally committing a local debug file.',
    initial: stage,
    reviewBranch: 'feature/docs',
    starter: '# Inspect staged versus unstaged content before committing.\n',
    requirements: [
      'Create feature/docs and commit only the docs.txt change (Updated guide). debug.log must remain outside every commit published in this attempt.',
      'Keep main unchanged and preserve debug.log in the working tree. Push feature/docs, then prepare an Azure Repos pull request to main.',
    ],
    hints: [
      'git add docs.txt stages only the intended file. git diff --staged shows the proposed snapshot.',
      'If you staged too much, use git restore --staged debug.log before committing.',
    ],
    explanation:
      'The index is the exact snapshot used by commit. Reviewing staged changes avoids publishing local-only files; deleting them in a later commit would not remove them from earlier history.',
    checks: [
      published('feature/docs', (t) =>
        sameTree(t, { ...stage.commits['c1'].tree, 'docs.txt': 'Updated guide' }),
      ),
      check(
        'Debug file never published',
        'Unstage debug.log before committing. A later deletion cannot erase published history.',
        (s) =>
          s.pushes.every((p) =>
            Object.values(s.commits)
              .filter((c) => ancestor(s, c.id, p.commit))
              .every((c) => !Object.hasOwn(c.tree, 'debug.log')),
          ),
      ),
      check(
        'Local debug work preserved',
        'Leave debug.log in the working tree and keep main unchanged.',
        (s) => s.working['debug.log'] === 'local debug output' && s.branches['main'] === 'c1',
      ),
      tidy,
      noForce,
      pr('feature/docs'),
    ],
  },
  {
    description:
      'Set aside unfinished work, publish an urgent login fix, then restore your original draft.',
    initial: stash,
    reviewBranch: 'hotfix/login',
    starter: '# Stash the draft before switching to the hotfix.\n',
    requirements: [
      'The current branch is feature/work with an unfinished tracked edit in work.txt. Stash that work.',
      'Create hotfix/login from main. Use the ProCode helper practice write login.txt "fixed", then stage, commit and push the fix.',
      'Return to feature/work and restore the draft Unfinished feature without committing it. Remove the used stash, and prepare a Bitbucket pull request from hotfix/login to main.',
    ],
    hints: [
      'git stash push saves tracked changes. Then use git switch -c hotfix/login main.',
      'After pushing, switch to feature/work and use git stash pop. The pull request source is still hotfix/login.',
    ],
    explanation:
      'Stashing separates unfinished work from an urgent fix. Publishing the hotfix and returning to the original branch should leave the original draft intact.',
    checks: [
      published('hotfix/login', (t) => t['login.txt'] === 'fixed' && t['work.txt'] === 'Draft'),
      check(
        'Original draft restored',
        'Return to feature/work, restore its uncommitted draft and remove the used stash.',
        (s) =>
          s.head === 'feature/work' &&
          s.working['work.txt'] === 'Unfinished feature' &&
          s.index['work.txt'] === 'Draft' &&
          !s.stash.length,
      ),
      noForce,
      pr('hotfix/login'),
    ],
  },
  {
    description:
      'Integrate an upstream greeting change while retaining the feature branch history.',
    initial: merge,
    reviewBranch: 'feature/greeting',
    starter: '# Fetch the updated main branch, then merge and resolve.\n',
    requirements: [
      'origin/main has advanced to c3, but your tracking ref is stale. Fetch it, then merge origin/main into feature/greeting.',
      'Both branches edited app.txt. Resolve it to Hello main and feature using practice write app.txt "Hello main and feature", stage the resolution, and create the merge commit.',
      'Publish feature/greeting and prepare a GitHub pull request to main. Preserve c2 and c3 as ancestors.',
    ],
    hints: [
      'git fetch origin updates origin/main; it does not edit your files.',
      'A conflict is an intermediate state. Resolve the file, git add app.txt, then git commit -m "Resolve greeting conflict".',
    ],
    explanation:
      'A merge commit records both histories. Conflict markers require a deliberate file resolution and staging before the merge can be completed.',
    checks: [
      published(
        'feature/greeting',
        (t, s) =>
          t['app.txt'] === 'Hello main and feature' &&
          ancestor(s, 'c2', s.remote['feature/greeting']) &&
          ancestor(s, 'c3', s.remote['feature/greeting']),
      ),
      tidy,
      noForce,
      pr('feature/greeting'),
    ],
  },
  {
    description:
      'Replay an unpublished feature onto the latest main branch before opening an Azure Repos pull request.',
    initial: rebase,
    reviewBranch: 'feature/search',
    starter: '# Update remote-tracking refs, then rebase the local feature.\n',
    requirements: [
      'Fetch origin and rebase feature/search onto origin/main (c3). The feature is unpublished and safe to rewrite in this fixture.',
      'Keep feature.txt as Search ready and docs.txt as Updated upstream guide. The published feature tip should be a single-parent commit on top of c3.',
      'Push feature/search and prepare a pull request to main.',
    ],
    hints: [
      'git rebase origin/main replays the feature changes on the fetched main branch.',
      'A normal push is enough for this unpublished branch; no force option is needed.',
    ],
    explanation:
      'Rebasing changes commit identity while replaying changes onto a new base. This scenario deliberately uses unpublished work so no collaborator depends on the old feature history.',
    checks: [
      published(
        'feature/search',
        (t, s) =>
          t['feature.txt'] === 'Search ready' &&
          t['docs.txt'] === 'Updated upstream guide' &&
          s.commits[s.remote['feature/search']].parents.length === 1 &&
          s.commits[s.remote['feature/search']].parents[0] === 'c3',
      ),
      tidy,
      noForce,
      pr('feature/search'),
    ],
  },
  {
    description:
      'Bring one login fix into a release topic branch without including an unrelated experiment.',
    initial: pick,
    reviewBranch: 'release/login',
    starter: '# Inspect development history and select only the login fix.\n',
    requirements: [
      'development contains c2 (Fix login) followed by c3 (Experimental UI). Create release/login from main.',
      'Cherry-pick the c2 change, preserving login.txt as fixed and excluding experiment.txt from published history. Do not merge all of development.',
      'Push release/login and prepare a Bitbucket pull request to main.',
    ],
    hints: [
      'git log --oneline development shows the fixture commit IDs.',
      'git cherry-pick c2 creates a new commit carrying that patch on your current branch.',
    ],
    explanation:
      'Cherry-picking applies a focused patch rather than integrating the complete source branch. The new commit has its own identity and the destination branch as its parent.',
    checks: [
      published(
        'release/login',
        (t) => t['login.txt'] === 'fixed' && !Object.hasOwn(t, 'experiment.txt'),
      ),
      check(
        'Experiment absent from published history',
        'Do not merge the experimental branch or publish an experiment and remove it later.',
        (s) =>
          s.pushes.every((p) =>
            Object.values(s.commits)
              .filter((c) => ancestor(s, c.id, p.commit))
              .every((c) => !Object.hasOwn(c.tree, 'experiment.txt')),
          ),
      ),
      tidy,
      noForce,
      pr('release/login'),
    ],
  },
  {
    description:
      'Undo a released regression without rewriting shared main history or discarding later documentation.',
    initial: revert,
    reviewBranch: 'fix/revert-release',
    starter: '# Create a repair branch from main and revert the faulty commit.\n',
    requirements: [
      'main is c3. c2 introduced the broken greeting; c3 added current documentation. Create fix/revert-release from main.',
      'Revert c2 so app.txt returns to Hello, while docs.txt remains Current release guide. Preserve c2 and c3 in history.',
      'Publish the repair branch and prepare a GitHub pull request to main. Do not reset or force-push shared history.',
    ],
    hints: [
      'git revert c2 applies the inverse patch as a new commit.',
      'Reverting the bad commit keeps later unrelated changes; resetting to c1 would lose them.',
    ],
    explanation:
      'Revert adds a corrective commit, making it suitable for a shared release. It preserves the audit trail and does not silently drop later work.',
    checks: [
      published(
        'fix/revert-release',
        (t, s) =>
          t['app.txt'] === 'Hello' &&
          t['docs.txt'] === 'Current release guide' &&
          ancestor(s, 'c3', s.remote['fix/revert-release']),
      ),
      check(
        'Shared main retained',
        'Leave local and remote main at c3.',
        (s) => s.branches['main'] === 'c3' && s.remote['main'] === 'c3',
      ),
      tidy,
      noForce,
      pr('fix/revert-release'),
    ],
  },
  {
    description: 'Recover a commit that became unreachable after an accidental local reset.',
    initial: recover,
    reviewBranch: 'recovery/work',
    starter: '# Use the reflog to locate the lost tip and preserve it with a branch.\n',
    requirements: [
      'main currently points to c1. The reflog contains the lost c2 commit at HEAD@{1}, with recovery.txt set to Recovered work.',
      'Create recovery/work pointing to the lost commit. Preserve its commit identity and keep main unchanged.',
      'Publish recovery/work and prepare an Azure Repos pull request to main.',
    ],
    hints: [
      'git reflog exposes recent local HEAD positions even when no branch points to them.',
      'Use git switch -c recovery/work c2 or use the reflog reference before another checkout changes its position.',
    ],
    explanation:
      'The reflog records local reference movement. Creating a branch at the recovered commit makes it reachable again. Reflogs are local and expire; they are not a remote backup.',
    checks: [
      published('recovery/work', (_t, s) => s.remote['recovery/work'] === 'c2'),
      check(
        'Main unchanged',
        'Recover into a new branch rather than moving main.',
        (s) => s.branches['main'] === 'c1',
      ),
      tidy,
      noForce,
      pr('recovery/work'),
    ],
  },
  {
    description:
      'Replace a work-in-progress commit on your own published topic branch, then publish the rewritten history with a lease.',
    initial: lease,
    reviewBranch: 'feature/review',
    starter: '# Inspect the branch, amend its message, and publish with a lease.\n',
    requirements: [
      'You are the only author of feature/review in this fixture. Replace its WIP commit message with a descriptive message while keeping the file snapshot unchanged.',
      'Publish the replacement using --force-with-lease. Never use plain --force or -f, and keep main unchanged.',
      'Prepare a Bitbucket pull request from feature/review to main. A lease checks that the remote tip still matches your tracking ref; it is not a substitute for coordination.',
    ],
    hints: [
      'git commit --amend -m "Prepare review feature" replaces the latest commit.',
      'A normal push rejects rewritten history. git push --force-with-lease origin feature/review checks the expected remote tip before replacing it.',
    ],
    explanation:
      'A lease rejects an update if the remote has changed since the expected tip. It reduces accidental overwrites, but fetched tracking refs can change that expectation, so rewritten shared work still needs coordination.',
    checks: [
      published(
        'feature/review',
        (t, s) =>
          sameTree(t, s.commits['c2'].tree) &&
          s.remote['feature/review'] !== 'c2' &&
          s.commits[s.remote['feature/review']].message.trim() !== 'WIP' &&
          s.commits[s.remote['feature/review']].parents[0] === 'c1',
      ),
      check(
        'Lease used for publication',
        'Publish the rewritten branch with --force-with-lease.',
        (s) =>
          s.pushes.some((p) => p.branch === 'feature/review' && p.lease) &&
          s.branches['main'] === 'c1',
      ),
      noForce,
      pr('feature/review'),
    ],
  },
];
export const gitExercises: GitExercise[] = gitExerciseInfo.map((info, index) => ({
  ...info,
  ...definitions[index],
  ...providers[info.provider],
}));
