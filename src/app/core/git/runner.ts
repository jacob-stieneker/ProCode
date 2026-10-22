import {
  ancestor,
  GitExercise,
  GitState,
  GitTree,
  headCommit,
  ReviewDraft,
  sameTree,
} from './model';
// Deliberately a small interpreter, not a shell or a real Git installation.
export function gitTokens(line: string): string[] {
  const out: string[] = [];
  let value = '',
    quote = '',
    started = false;
  for (const char of line) {
    if (!quote && char === '#' && !started) break;
    if (';|&`$<>\\'.includes(char))
      throw Error(
        'Shell operators, escapes and substitutions are unsupported. Use one command per line.',
      );
    if (quote) {
      if (char === quote) quote = '';
      else value += char;
      started = true;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) out.push(value);
      value = '';
      started = false;
    } else {
      value += char;
      started = true;
    }
  }
  if (quote) throw Error('Unclosed quote.');
  if (started) out.push(value);
  return out;
}
const own = (o: object, k: string) => Object.hasOwn(o, k);
function name(value: string) {
  if (
    !value ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(value) ||
    value.includes('..') ||
    value.endsWith('/') ||
    value.endsWith('.lock') ||
    ['constructor', 'prototype', '__proto__', 'HEAD', 'origin'].includes(value)
  )
    throw Error('Use a simple branch or file name without reserved names or parent paths.');
  return value;
}
function ref(s: GitState, value: string): string {
  if (value === 'HEAD') return s.branches[s.head];
  const relative = value.match(/^(.+?)([~^])(\d*)$/);
  if (relative) {
    let id = ref(s, relative[1]);
    const n = Number(relative[3] || 1);
    if (n > 100) throw Error('Revision traversal is limited to 100.');
    if (relative[2] === '^') {
      const next = n === 0 ? id : s.commits[id].parents[n - 1];
      if (!next) throw Error('Revision has no such parent.');
      return next;
    }
    for (let i = 0; i < n; i++) {
      id = s.commits[id]?.parents[0];
      if (!id) throw Error('Revision has no such ancestor.');
    }
    return id;
  }
  const log = value.match(/^HEAD@\{(\d+)\}$/);
  if (log) {
    const id = s.reflog[Number(log[1])];
    if (!id) throw Error('Reflog entry not found.');
    return id;
  }
  if (own(s.branches, value)) return s.branches[value];
  if (value.startsWith('origin/') && own(s.tracking, value.slice(7)))
    return s.tracking[value.slice(7)];
  if (own(s.commits, value)) return value;
  throw Error(`Unknown revision: ${value}. Inspect git log or git reflog.`);
}
function count(args: string[], min: number, max = min) {
  if (args.length < min || args.length > max)
    throw Error('Wrong number of arguments. See Command reference.');
}
function clean(s: GitState) {
  return !s.merge && sameTree(s.index, headCommit(s).tree) && sameTree(s.working, s.index);
}
function requireClean(s: GitState) {
  if (!clean(s))
    throw Error('Commit or stash changes, and resolve any merge before this operation.');
}
function move(s: GitState, id: string) {
  s.branches[s.head] = id;
  s.index = { ...s.commits[id].tree };
  s.working = { ...s.index };
  s.reflog.unshift(id);
}
function commit(s: GitState, message: string, parents = [s.branches[s.head]]) {
  if (!message.trim()) throw Error('Commit message cannot be empty.');
  const id = `c${s.next++}`;
  s.commits[id] = { id, parents, message, tree: { ...s.index } };
  s.branches[s.head] = id;
  s.reflog.unshift(id);
  return id;
}
function changes(base: GitTree, next: GitTree) {
  return [...new Set([...Object.keys(base), ...Object.keys(next)])].filter(
    (k) => base[k] !== next[k],
  );
}
function applyChanges(
  base: GitTree,
  next: GitTree,
  target: GitTree,
): { tree: GitTree; conflicts: string[] } {
  const tree = { ...target },
    conflicts: string[] = [];
  for (const path of changes(base, next)) {
    if (target[path] !== base[path] && target[path] !== next[path]) {
      conflicts.push(path);
      tree[path] =
        `<<<<<<< HEAD\n${target[path] ?? ''}\n=======\n${next[path] ?? ''}\n>>>>>>> incoming`;
    } else if (own(next, path)) tree[path] = next[path];
    else delete tree[path];
  }
  return { tree, conflicts };
}
function mergeBase(s: GitState, a: string, b: string) {
  const queue = [a],
    seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (ancestor(s, id, b)) return id;
    queue.push(...s.commits[id].parents);
  }
  throw Error('No common ancestor.');
}
function parse(args: string[], allowed: Record<string, 'value' | 'flag'>) {
  const positional: string[] = [],
    flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const word = args[i];
    if (!word.startsWith('-')) {
      positional.push(word);
      continue;
    }
    const [option, ...equal] = word.split('=');
    if (!own(allowed, option)) throw Error(`Unsupported option ${option}. See Command reference.`);
    if (own(flags, option)) throw Error(`Repeated option ${option}.`);
    if (allowed[option] === 'flag') {
      if (equal.length) throw Error(`${option} takes no value.`);
      flags[option] = true;
    } else {
      const value = equal.length ? equal.join('=') : args[++i];
      if (!value || value.startsWith('-')) throw Error(`${option} needs a value.`);
      flags[option] = value;
    }
  }
  return { args: positional, flags };
}
function execute(tokens: string[], s: GitState): string {
  if (tokens[0] === 'practice') {
    count(tokens, 4);
    if (tokens[1] !== 'write')
      throw Error(
        'Only practice write PATH "TEXT" is supported. This is a ProCode helper, not Git.',
      );
    s.working[name(tokens[2])] = tokens[3];
    return `Updated virtual ${tokens[2]}. Use git add to stage it.`;
  }
  if (tokens[0] !== 'git') throw Error('Use git commands or the documented practice write helper.');
  const cmd = tokens[1],
    tail = tokens.slice(2);
  switch (cmd) {
    case 'status': {
      const { args } = parse(tail, { '--short': 'flag', '-s': 'flag' });
      count(args, 0);
      s.inspected.push('status');
      return `On branch ${s.head}\nStaged: ${changes(headCommit(s).tree, s.index).join(', ') || 'none'}\nUnstaged: ${changes(s.index, s.working).join(', ') || 'none'}\nConflicts: ${s.merge?.conflicts.join(', ') || 'none'}`;
    }
    case 'log': {
      const { args } = parse(tail, { '--oneline': 'flag', '--graph': 'flag', '--all': 'flag' });
      count(args, 0, 1);
      const id = ref(s, args[0] || 'HEAD');
      s.inspected.push('log');
      return Object.values(s.commits)
        .filter((c) =>
          tail.includes('--all')
            ? [...Object.values(s.branches), ...Object.values(s.tracking)].some((tip) =>
                ancestor(s, c.id, tip),
              )
            : ancestor(s, c.id, id),
        )
        .reverse()
        .map((c) => `${c.id} ${c.message} [parents: ${c.parents.join(',') || 'none'}]`)
        .join('\n');
    }
    case 'reflog':
      count(tail, 0);
      s.inspected.push('reflog');
      return s.reflog.map((id, i) => `${id} HEAD@{${i}} ${s.commits[id].message}`).join('\n');
    case 'diff': {
      const { args, flags } = parse(tail, { '--staged': 'flag', '--cached': 'flag' });
      count(args, 0);
      s.inspected.push('diff');
      const a = flags['--staged'] || flags['--cached'] ? headCommit(s).tree : s.index,
        b = flags['--staged'] || flags['--cached'] ? s.index : s.working;
      return (
        changes(a, b)
          .map((p) => `${p}\n- ${a[p] ?? '(absent)'}\n+ ${b[p] ?? '(absent)'}`)
          .join('\n') || 'No differences.'
      );
    }
    case 'show': {
      count(tail, 1);
      const [revision, path] = tail[0].split(':');
      const c = s.commits[ref(s, revision)];
      if (path) {
        if (!own(c.tree, path)) throw Error('File not found in revision.');
        return c.tree[path];
      }
      return `${c.id} ${c.message}\n${JSON.stringify(c.tree, null, 2)}`;
    }
    case 'branch': {
      count(tail, 0, 2);
      if (!tail.length)
        return Object.entries(s.branches)
          .map(([b, id]) => `${b === s.head ? '*' : ' '} ${b} ${id}`)
          .join('\n');
      const b = name(tail[0]);
      if (own(s.branches, b)) throw Error('Branch already exists.');
      s.branches[b] = ref(s, tail[1] || 'HEAD');
      return `Created branch ${b}.`;
    }
    case 'switch':
    case 'checkout': {
      const { args, flags } = parse(tail, { '-c': 'value', '-b': 'value' });
      const create = flags['-c'] || flags['-b'];
      if ((cmd === 'switch' && flags['-b']) || (cmd === 'checkout' && flags['-c']))
        throw Error('Use switch -c or checkout -b.');
      const branch = name(String(create || args[0] || ''));
      count(args, create ? 0 : 1, create ? 1 : 1);
      if (s.merge) throw Error('Resolve or abort the current merge first.');
      if (create) {
        if (own(s.branches, branch)) throw Error('Branch already exists.');
        const id = ref(s, args[0] || 'HEAD');
        if (id !== s.branches[s.head]) requireClean(s);
        s.branches[branch] = id;
      }
      if (!own(s.branches, branch))
        throw Error('Local branch not found. Create it with switch -c.');
      const old = s.branches[s.head],
        id = s.branches[branch];
      if (old !== id) requireClean(s);
      s.head = branch;
      if (old !== id) {
        s.index = { ...s.commits[id].tree };
        s.working = { ...s.index };
      }
      s.reflog.unshift(id);
      return `Switched to ${branch}.`;
    }
    case 'add': {
      count(tail, 1, 20);
      const all = tail.includes('.') || tail.includes('-A') || tail.includes('--all');
      if (tail.some((p) => p.startsWith('-') && !['-A', '--all'].includes(p)))
        throw Error('Unsupported add option.');
      const paths = all ? [...new Set([...Object.keys(s.working), ...Object.keys(s.index)])] : tail;
      for (const p of paths) {
        if (!own(s.working, p) && !own(s.index, p)) throw Error(`Unknown file: ${p}.`);
        if (s.working[p]?.includes('<<<<<<<'))
          throw Error(`Resolve conflict markers in ${p} before staging.`);
        if (own(s.working, p)) s.index[p] = s.working[p];
        else delete s.index[p];
        if (s.merge) s.merge.conflicts = s.merge.conflicts.filter((f) => f !== p);
      }
      return `Staged ${paths.join(', ')}.`;
    }
    case 'restore': {
      const { args, flags } = parse(tail, { '--staged': 'flag' });
      count(args, 1, 20);
      if (s.merge) throw Error('Resolve the merge with practice write and git add.');
      for (const path of args) {
        const from = flags['--staged'] ? headCommit(s).tree : s.index,
          to = flags['--staged'] ? s.index : s.working;
        if (!own(from, path) && !own(to, path)) throw Error(`Unknown file ${path}.`);
        if (own(from, path)) to[path] = from[path];
        else delete to[path];
      }
      return 'Restored selected paths.';
    }
    case 'commit': {
      const { args, flags } = parse(tail, {
        '-m': 'value',
        '--message': 'value',
        '--amend': 'flag',
        '--no-edit': 'flag',
        '-a': 'flag',
      });
      count(args, 0);
      if (s.merge?.conflicts.length) throw Error('Stage all resolved conflict files first.');
      if (flags['-a'])
        for (const p of Object.keys(headCommit(s).tree)) {
          if (own(s.working, p)) s.index[p] = s.working[p];
          else delete s.index[p];
        }
      const old = headCommit(s);
      if (!flags['--amend'] && !s.merge && sameTree(s.index, old.tree))
        throw Error('Nothing staged to commit.');
      const message = String(
        flags['-m'] ||
          flags['--message'] ||
          (flags['--no-edit'] && flags['--amend'] ? old.message : ''),
      );
      const parents = flags['--amend']
        ? old.parents
        : s.merge
          ? [s.branches[s.head], s.merge.other]
          : [s.branches[s.head]];
      if (s.merge && flags['--amend']) throw Error('Finish the merge before amending.');
      const id = commit(s, message, parents);
      s.merge = null;
      return `[${s.head} ${id}] ${message}`;
    }
    case 'stash': {
      const sub = tail[0] || 'push';
      if (sub === 'list') {
        count(tail, 1);
        return s.stash.map((v, i) => `stash@{${i}} based on ${v.base}`).join('\n') || 'No stashes.';
      }
      if (sub === 'push') {
        const { args } = parse(tail.slice(tail.length ? 1 : 0), {
          '-m': 'value',
          '--include-untracked': 'flag',
          '-u': 'flag',
        });
        count(args, 0);
        if (s.merge) throw Error('Resolve the merge before stashing.');
        const tracked = new Set(Object.keys(headCommit(s).tree));
        const include = tail.includes('-u') || tail.includes('--include-untracked');
        const working = Object.fromEntries(
          Object.entries(s.working).filter(([p]) => tracked.has(p) || include || own(s.index, p)),
        );
        if (sameTree(working, headCommit(s).tree) && sameTree(s.index, headCommit(s).tree))
          return 'No tracked changes to stash.';
        s.stash.unshift({ working, index: { ...s.index }, base: s.branches[s.head] });
        s.index = { ...headCommit(s).tree };
        s.working = {
          ...s.index,
          ...Object.fromEntries(
            Object.entries(s.working).filter(([p]) => !tracked.has(p) && !own(working, p)),
          ),
        };
        return 'Saved working changes in stash@{0}.';
      }
      if (sub === 'pop' || sub === 'apply') {
        count(tail, 1, 2);
        requireClean(s);
        const match = (tail[1] || 'stash@{0}').match(/^stash@\{(\d+)\}$/);
        if (!match || !s.stash[Number(match[1])]) throw Error('Stash entry not found.');
        const i = Number(match[1]),
          saved = s.stash[i],
          patch = applyChanges(s.commits[saved.base].tree, saved.working, s.working);
        if (patch.conflicts.length) throw Error('Stash conflicts are outside this fixture.');
        s.working = patch.tree;
        if (sub === 'pop') s.stash.splice(i, 1);
        return 'Restored stashed working changes.';
      }
      throw Error('Supported stash commands: push, list, apply, pop.');
    }
    case 'fetch':
      count(tail, 0, 1);
      if (tail[0] && tail[0] !== 'origin') throw Error('Only origin exists.');
      s.tracking = { ...s.remote };
      return 'Fetched origin. Working files and local branches unchanged.';
    case 'merge': {
      const { args, flags } = parse(tail, {
        '--abort': 'flag',
        '--no-ff': 'flag',
        '--ff-only': 'flag',
        '--no-edit': 'flag',
        '-m': 'value',
      });
      if (flags['--abort']) {
        count(args, 0);
        if (!s.merge) throw Error('No merge in progress.');
        move(s, s.merge.original);
        s.merge = null;
        return 'Merge aborted.';
      }
      count(args, 1);
      requireClean(s);
      const other = ref(s, args[0]),
        current = s.branches[s.head];
      if (ancestor(s, other, current)) return 'Already up to date.';
      if (ancestor(s, current, other) && !flags['--no-ff']) {
        move(s, other);
        return 'Fast-forward merge.';
      }
      if (flags['--ff-only']) throw Error('Cannot fast-forward divergent history.');
      const base = mergeBase(s, current, other),
        merged = applyChanges(s.commits[base].tree, s.commits[other].tree, headCommit(s).tree);
      s.working = merged.tree;
      s.index = { ...merged.tree };
      s.merge = { other, original: current, conflicts: merged.conflicts };
      if (merged.conflicts.length)
        return `CONFLICT: ${merged.conflicts.join(', ')}. Use practice write to resolve, git add, then git commit. The script may continue with those commands.`;
      const id = commit(s, String(flags['-m'] || `Merge ${args[0]}`), [current, other]);
      s.merge = null;
      return `Merge commit ${id}.`;
    }
    case 'rebase': {
      count(tail, 1);
      requireClean(s);
      const onto = ref(s, tail[0]),
        current = s.branches[s.head];
      if (ancestor(s, onto, current)) return 'Already based on this revision.';
      const base = mergeBase(s, current, onto),
        picks: string[] = [];
      let cursor = current;
      while (cursor !== base) {
        const c = s.commits[cursor];
        if (c.parents.length !== 1) throw Error('This simulator rebases linear histories only.');
        picks.unshift(cursor);
        cursor = c.parents[0];
      }
      move(s, onto);
      for (const id of picks) {
        const old = s.commits[id],
          patch = applyChanges(s.commits[old.parents[0]].tree, old.tree, headCommit(s).tree);
        if (patch.conflicts.length)
          throw Error(
            'Rebase conflicts are outside this fixture. Use the merge-conflict exercise.',
          );
        s.index = patch.tree;
        commit(s, old.message);
        s.working = { ...s.index };
      }
      return `Rebased ${picks.length} commit(s).`;
    }
    case 'cherry-pick':
    case 'revert': {
      count(tail, 1);
      requireClean(s);
      const source = s.commits[ref(s, tail[0])];
      if (source.parents.length !== 1) throw Error('Choose a commit with one parent.');
      const parent = s.commits[source.parents[0]].tree,
        patch =
          cmd === 'revert'
            ? applyChanges(source.tree, parent, headCommit(s).tree)
            : applyChanges(parent, source.tree, headCommit(s).tree);
      if (patch.conflicts.length) throw Error('This fixture requires a conflict-free patch.');
      s.index = patch.tree;
      const id = commit(s, cmd === 'revert' ? `Revert "${source.message}"` : source.message);
      s.working = { ...s.index };
      return `${cmd}: created ${id}.`;
    }
    case 'reset': {
      const { args, flags } = parse(tail, {
        '--hard': 'flag',
        '--soft': 'flag',
        '--mixed': 'flag',
      });
      count(args, 1);
      if (Object.keys(flags).length > 1) throw Error('Choose one reset mode.');
      if (s.merge) throw Error('Abort or finish the merge first.');
      const id = ref(s, args[0]);
      if (flags['--hard']) move(s, id);
      else {
        s.branches[s.head] = id;
        s.reflog.unshift(id);
        if (!flags['--soft']) s.index = { ...s.commits[id].tree };
      }
      return `Reset ${s.head} to ${id}.`;
    }
    case 'push': {
      const { args, flags } = parse(tail, {
        '-u': 'flag',
        '--set-upstream': 'flag',
        '--force-with-lease': 'flag',
        '--force': 'flag',
        '-f': 'flag',
      });
      count(args, 0, 2);
      if (args.length && args[0] !== 'origin') throw Error('Only origin exists.');
      const branch = args[1] || s.head;
      name(branch);
      if (!own(s.branches, branch)) throw Error('Push a local branch by name.');
      if (!args.length && !s.upstream[branch])
        throw Error('No upstream. Use git push -u origin BRANCH.');
      const id = s.branches[branch],
        remote = s.remote[branch],
        lease = !!flags['--force-with-lease'],
        forced = !!(flags['--force'] || flags['-f']);
      if (lease && forced) throw Error('Choose one force option.');
      if (branch === 'main')
        throw Error(
          'Fixture branch policy protects main. Push a topic branch and prepare a pull request.',
        );
      if (lease && remote !== s.tracking[branch])
        throw Error(
          'Lease rejected: origin changed since your last fetch. Fetch and inspect before rewriting.',
        );
      if (remote && !ancestor(s, remote, id) && !lease && !forced)
        throw Error(
          'Push rejected: non-fast-forward. Integrate remote work or use an appropriate lease for an owned rewritten branch.',
        );
      s.remote[branch] = id;
      s.tracking[branch] = id;
      if (flags['-u'] || flags['--set-upstream']) s.upstream[branch] = branch;
      s.pushes.push({ branch, commit: id, lease, forced });
      return `Pushed ${branch} to origin${lease ? ' with lease' : ''}.`;
    }
    default:
      throw Error(`Unsupported Git command: ${cmd || '(missing)'}. See Command reference.`);
  }
}
export function runGit(source: string, exercise: GitExercise, review?: ReviewDraft) {
  const state = structuredClone(exercise.initial),
    logs: string[] = [],
    errors: string[] = [];
  try {
    if (source.length > 50000) throw Error('Keep commands under 50,000 characters.');
    let count = 0;
    for (const [index, line] of source.split(/\r?\n/).entries()) {
      try {
        const tokens = gitTokens(line);
        if (!tokens.length) continue;
        if (++count > 80) throw Error('Limit each attempt to 80 commands.');
        const next = structuredClone(state);
        const result = execute(tokens, next);
        Object.assign(state, next);
        logs.push(`> ${line.trim()}\n${result}`);
      } catch (error) {
        throw Error(`Line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (review?.enabled) {
      if (!review.title.trim()) throw Error('Pull request title is required.');
      if (!own(state.remote, review.source) || !own(state.remote, review.target))
        throw Error('Both pull request branches must exist on origin. Push the source first.');
      if (
        review.source === review.target ||
        ancestor(state, state.remote[review.source], state.remote[review.target])
      )
        throw Error('Pull request source must contain commits not already in the target.');
      if (state.merge) throw Error('Resolve the merge before preparing a pull request.');
      state.review = {
        provider: exercise.provider,
        source: review.source,
        target: review.target,
        title: review.title.trim(),
        commit: state.remote[review.source],
      };
      logs.push(
        `Simulated ${exercise.provider} pull request: ${review.source} -> ${review.target}. No request was sent.`,
      );
    }
  } catch (error) {
    errors.push(`Git simulator: ${error instanceof Error ? error.message : String(error)}`);
  }
  const results = exercise.checks.map((c) => ({ name: c.name, hint: c.hint, pass: c.test(state) }));
  results.unshift({
    name: 'Commands complete without errors',
    hint: 'Correct the first Console error. Each attempt starts from the initial repository.',
    pass: errors.length === 0,
  });
  return { state, logs, errors, results };
}
