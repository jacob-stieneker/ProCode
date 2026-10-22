import { gitExercises } from './catalog';
import { ancestor, gitKey, headCommit, sameTree } from './model';
import { runGit, gitTokens } from './runner';
import { GitWorkspace, GIT_STORAGE_KEY, freshGitSavedState, readGitSavedState } from './state';
import { gitSolutions } from '../../../../tests/fixtures/git-solutions';
const exercise = (id: string) => gitExercises.find((e) => e.id === id)!;
const review = (id: string) => ({
  enabled: true,
  source: exercise(id).reviewBranch,
  target: 'main',
  title: 'Ready for review',
});
const run = (id: string, source: string) => runGit(source, exercise(id), review(id));
describe('Git workflow practice', () => {
  it('covers three levels and all providers with clear bounded contracts', () => {
    expect(new Set(gitExercises.map((e) => e.id)).size).toBe(9);
    for (const level of ['junior', 'skilled', 'senior']) {
      const items = gitExercises.filter((e) => e.difficulty === level);
      expect(items).toHaveLength(3);
      expect(new Set(items.map((e) => e.provider)).size).toBe(3);
    }
    for (const e of gitExercises) {
      expect(e.checks.length).toBeGreaterThanOrEqual(3);
      expect(e.hints).toHaveLength(2);
      expect(e.requirements.length).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(e)).not.toMatch(/\u2014|\p{Extended_Pictographic}/u);
    }
  });
  for (const e of gitExercises)
    it(`${e.id}: accepts reference, rejects starter and isolates repeat attempts`, () => {
      const initial = JSON.stringify(e.initial);
      const result = run(e.id, gitSolutions[e.id]);
      expect(result.errors).toEqual([]);
      expect(result.results.filter((r) => !r.pass)).toEqual([]);
      expect(run(e.id, e.starter).results.every((r) => r.pass)).toBe(false);
      expect(runGit('', e).results.every((r) => r.pass)).toBe(false);
      expect(run(e.id, gitSolutions[e.id])).toEqual(result);
      expect(JSON.stringify(e.initial)).toBe(initial);
    });
  it('accepts alternative valid commands and corrected staging', () => {
    const alternative = `git branch feature/docs
git checkout feature/docs
git add .
git restore --staged debug.log
git commit --message='Document the update' # comment
git push --set-upstream origin feature/docs`;
    expect(run('git-stage', alternative).results.filter((r) => !r.pass)).toEqual([]);
    const direct = gitSolutions['git-feature']
      .replace('switch -c', 'checkout -b')
      .replace('git add app.txt\ngit commit', 'git commit -a');
    expect(run('git-feature', direct).results.filter((r) => !r.pass)).toEqual([]);
  });
  it('grades snapshots and history, not console messages', () => {
    const result = run(
      'git-stage',
      gitSolutions['git-stage'].replace('git add docs.txt', 'git add .'),
    );
    expect(result.results.find((r) => r.name === 'Debug file never published')?.pass).toBe(false);
    const fake = run(
      'git-feature',
      'git status\npractice write output.txt "Pushed feature/greeting to origin"',
    );
    expect(fake.results.every((r) => r.pass)).toBe(false);
    expect(
      run('git-feature', gitSolutions['git-feature'] + '\ngit unknown').results.every(
        (r) => r.pass,
      ),
    ).toBe(false);
  });
  it('log --all shows reachable history while reflog exposes a lost commit', () => {
    const e = exercise('git-recover');
    expect(runGit('git log --all', e).logs.join('')).not.toContain('c2');
    expect(runGit('git reflog', e).logs.join('')).toContain('c2');
    const wrong =
      'practice write app.txt broken\n' +
      gitSolutions['git-stage'].replace('git add docs.txt', 'git add docs.txt app.txt');
    expect(run('git-stage', wrong).results.every((r) => r.pass)).toBe(false);
  });
  it('fetch updates remote tracking without modifying local files or branches', () => {
    const e = exercise('git-merge'),
      result = runGit('git fetch origin', e);
    expect(result.state.tracking['main']).toBe('c3');
    expect(result.state.branches).toEqual(e.initial.branches);
    expect(result.state.working).toEqual(e.initial.working);
  });
  it('requires resolved and staged conflicts, creates both parents, and can abort', () => {
    const unresolved = runGit(
      'git fetch\ngit merge origin/main\ngit commit -m "merge"',
      exercise('git-merge'),
    );
    expect(unresolved.errors[0]).toContain('Stage all resolved');
    expect(unresolved.state.merge?.conflicts).toEqual(['app.txt']);
    const unstaged = run('git-merge', gitSolutions['git-merge'].replace('git add app.txt\n', ''));
    expect(unstaged.errors[0]).toContain('Stage all resolved');
    const result = run('git-merge', gitSolutions['git-merge']);
    expect(headCommit(result.state).parents).toEqual(['c2', 'c3']);
    const abort = runGit(
      'git fetch\ngit merge origin/main\ngit merge --abort',
      exercise('git-merge'),
    );
    expect(abort.errors).toEqual([]);
    expect(abort.state.working).toEqual(exercise('git-merge').initial.working);
    expect(abort.state.merge).toBeNull();
  });
  it('rebase rewrites the feature commit while retaining both sets of changes', () => {
    const { state } = run('git-rebase', gitSolutions['git-rebase']);
    expect(headCommit(state).parents).toEqual(['c3']);
    expect(ancestor(state, 'c2', state.branches[state.head])).toBe(false);
    expect(state.working['feature.txt']).toBe('Search ready');
    expect(state.working['docs.txt']).toBe('Updated upstream guide');
  });
  it('cherry-pick excludes later work and revert preserves subsequent history', () => {
    const picked = run('git-pick', gitSolutions['git-pick']).state;
    expect(picked.working['login.txt']).toBe('fixed');
    expect(picked.working['experiment.txt']).toBeUndefined();
    const reverted = run('git-revert', gitSolutions['git-revert']).state;
    expect(ancestor(reverted, 'c3', reverted.branches[reverted.head])).toBe(true);
    expect(reverted.working['app.txt']).toBe('Hello');
    expect(reverted.working['docs.txt']).toBe('Current release guide');
  });
  it('stash restores uncommitted work and reset modes treat index and work differently', () => {
    const s = run('git-stash', gitSolutions['git-stash']).state;
    expect(s.stash).toEqual([]);
    expect(s.working['work.txt']).toBe('Unfinished feature');
    expect(s.index['work.txt']).toBe('Draft');
    const source =
      'git switch -c feature/greeting\ngit add app.txt\ngit commit -m "Greeting"\ngit reset ';
    const soft = runGit(source + '--soft HEAD~1', exercise('git-feature')).state;
    expect(soft.branches[soft.head]).toBe('c1');
    expect(soft.index['app.txt']).toBe('Hello ProCode');
    const mixed = runGit(source + '--mixed HEAD~1', exercise('git-feature')).state;
    expect(mixed.index['app.txt']).toBe('Hello');
    expect(mixed.working['app.txt']).toBe('Hello ProCode');
    const hard = runGit(source + '--hard HEAD~1', exercise('git-feature')).state;
    expect(sameTree(hard.working, hard.index)).toBe(true);
    expect(hard.working['app.txt']).toBe('Hello');
  });
  it('protects main, rejects non-fast-forward push, and enforces stale leases atomically', () => {
    expect(runGit('git push origin main', exercise('git-feature')).errors[0]).toContain(
      'protects main',
    );
    expect(
      run('git-lease', gitSolutions['git-lease'].replace(' --force-with-lease', '')).errors[0],
    ).toContain('non-fast-forward');
    const e = { ...exercise('git-lease'), initial: structuredClone(exercise('git-lease').initial) };
    e.initial.commits['c3'] = {
      id: 'c3',
      parents: ['c2'],
      tree: { ...e.initial.commits['c2'].tree, 'peer.txt': 'Keep me' },
      message: 'Peer work',
    };
    e.initial.remote['feature/review'] = 'c3';
    e.initial.next = 4;
    const rejected = runGit(gitSolutions['git-lease'], e);
    expect(rejected.errors[0]).toContain('Lease rejected');
    expect(rejected.state.remote['feature/review']).toBe('c3');
    expect(rejected.state.pushes).toEqual([]);
    expect(
      run(
        'git-lease',
        gitSolutions['git-lease'].replace('--force-with-lease', '--force'),
      ).results.every((r) => r.pass),
    ).toBe(false);
  });
  it('requires a published source and valid review fields', () => {
    const e = exercise('git-feature'),
      source = gitSolutions[e.id];
    expect(runGit(source, e).results.every((r) => r.pass)).toBe(false);
    expect(runGit(source, e, { ...review(e.id), title: ' ' }).errors[0]).toContain('title');
    expect(runGit(source, e, { ...review(e.id), source: 'main' }).errors[0]).toContain(
      'not already',
    );
    expect(runGit(source, e, { ...review(e.id), target: 'missing' }).errors[0]).toContain(
      'exist on origin',
    );
    expect(runGit(source.split('\n').slice(0, -1).join('\n'), e, review(e.id)).errors[0]).toContain(
      'Push the source first',
    );
  });
  it('rejects shell syntax, unknown flags and reserved names with no partial writes', () => {
    for (const command of [
      'git status; git push',
      'git status | cat',
      'git status && whoami',
      'git show $(env)',
      'git show `env`',
      'git show > file',
      'git switch -c __proto__',
      'git switch -c constructor',
      'git switch -c ../outside',
      'git add --invalid',
      'git commit -m "unclosed',
      'node app.js',
    ]) {
      const result = runGit(command, exercise('git-feature'));
      expect(result.errors).toHaveLength(1);
      expect(result.state).toEqual(exercise('git-feature').initial);
    }
    const partial = runGit(
      'git add app.txt missing.txt\ngit commit -m "Must not run"',
      exercise('git-feature'),
    );
    expect(partial.errors[0]).toContain('Line 1');
    expect(partial.state.index).toEqual(exercise('git-feature').initial.index);
    expect(gitTokens('# ignored $()')).toEqual([]);
    expect(gitTokens('practice write file.txt ""')).toEqual(['practice', 'write', 'file.txt', '']);
    expect(runGit('git status\n'.repeat(81), exercise('git-feature')).errors[0]).toContain(
      '80 commands',
    );
    expect(runGit('x'.repeat(50001), exercise('git-feature')).errors[0]).toContain('50,000');
  });
});
describe('Git saved work', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips review drafts and empty commands while filtering invalid records', () => {
    const s = freshGitSavedState(),
      key = gitKey(gitExercises[0]);
    s.active = true;
    s.drafts = { [key]: '', unknown: 'drop' };
    s.reviews = { [key]: review('git-feature') };
    s.selected = { junior: 'git-feature', senior: 'git-feature' };
    const record = { key, completedAt: '2026-10-08T12:00:00Z' };
    s.completions = [record, record, { key: 'bad', completedAt: 'bad' }];
    localStorage.setItem(GIT_STORAGE_KEY, JSON.stringify(s));
    const restored = readGitSavedState().data;
    expect(restored.reviews).toEqual(s.reviews);
    expect(restored.drafts).toEqual({ [key]: '' });
    expect(restored.selected).toEqual({ junior: 'git-feature' });
    expect(restored.completions).toEqual([record]);
    expect(restored.active).toBe(true);
  });
  it('recovers corrupt data and preserves session work on storage failure', () => {
    localStorage.setItem(GIT_STORAGE_KEY, '{');
    expect(readGitSavedState().warning).toBeTruthy();
    localStorage.clear();
    const store = new GitWorkspace();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('full');
    });
    store.update((s) => ({ ...s, reviews: { 'git-feature:v1': review('git-feature') } }));
    expect(store.warning()).toContain('full');
    expect(store.state().reviews['git-feature:v1'].title).toBe('Ready for review');
    spy.mockRestore();
  });
});
