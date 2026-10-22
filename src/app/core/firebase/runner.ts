import { FirebaseExercise, FirebaseState } from './model';

const aliases: Record<string, string> = {
  dev: 'procode-dev',
  staging: 'procode-staging',
  prod: 'procode-prod',
};
const projects = [...Object.values(aliases), 'demo-procode'];
const normalizePath = (path: string) => path.replace(/^\.\//, '').replace(/\/$/, '');

// A command interpreter, never a shell. Tokens are data, including the fixture script.
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let token = '',
    quote = '',
    started = false;
  for (const char of line) {
    if (';|&`$<>\\'.includes(char))
      throw Error(
        'Shell operators, escapes, and substitutions are not supported. Enter one Firebase command per line.',
      );
    if (quote) {
      if (char === quote) quote = '';
      else token += char;
      started = true;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (char === '#' && !started) break;
    else if (/\s/.test(char)) {
      if (started) tokens.push(token);
      token = '';
      started = false;
    } else {
      token += char;
      started = true;
    }
  }
  if (quote) throw Error('Unclosed quote.');
  if (started) tokens.push(token);
  return tokens;
}
function options(tokens: string[], allowed: string[]) {
  const args: string[] = [],
    flags: Record<string, string> = {};
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('-')) {
      args.push(token);
      continue;
    }
    const [raw, ...value] = token.split('=');
    const name = raw === '-P' ? '--project' : raw;
    if (!allowed.includes(name))
      throw Error(`Unsupported option ${raw} for this command. See Command reference.`);
    if (Object.hasOwn(flags, name)) throw Error(`Option ${name} was supplied more than once.`);
    if (value.length) flags[name] = value.join('=');
    else if (tokens[i + 1] && !tokens[i + 1].startsWith('-')) flags[name] = tokens[++i];
    else if (name === '--export-on-exit') flags[name] = '';
    else throw Error(`Option ${name} needs a value.`);
    if (!flags[name] && name !== '--export-on-exit') throw Error(`Option ${name} needs a value.`);
  }
  return { args, flags };
}
function count(args: string[], expected: number) {
  if (args.length !== expected)
    throw Error(
      `Expected ${expected} positional argument${expected === 1 ? '' : 's'}, received ${args.length}. See Command reference.`,
    );
}
function projectId(input: string) {
  const id = Object.hasOwn(aliases, input) ? aliases[input] : input;
  if (!projects.includes(id))
    throw Error(
      `Unknown project or alias: ${input || '(none)'}. Use dev, staging, prod, or demo-procode.`,
    );
  return id;
}
function requireAuth(state: FirebaseState) {
  if (!state.authenticated) throw Error('Not signed in. Run firebase login first (simulated).');
}
function cloudProject(state: FirebaseState, input: string) {
  requireAuth(state);
  const id = projectId(input);
  if (id.startsWith('demo-'))
    throw Error(
      'Demo projects are for emulators only. Select a provisioned virtual project for deployment.',
    );
  return id;
}
function services(input: string) {
  const values = [...new Set(input.split(',').map((s) => s.trim()))];
  if (values.some((s) => !s)) throw Error('Provide a comma-separated list without empty services.');
  return values;
}
function apply(tokens: string[], state: FirebaseState): string {
  if (tokens[0] !== 'firebase')
    throw Error('Only Firebase CLI commands are supported in this simulator.');
  // Global --project may precede the command, as in the real CLI.
  let commandIndex = 1;
  if (tokens[1] === '--project' || tokens[1] === '-P') commandIndex = 3;
  else if (tokens[1]?.startsWith('--project=') || tokens[1]?.startsWith('-P=')) commandIndex = 2;
  const command = tokens[commandIndex];
  const tail = [...tokens.slice(1, commandIndex), ...tokens.slice(commandIndex + 1)];
  const extra: Record<string, string[]> = {
    login: [],
    'projects:list': [],
    use: [],
    init: [],
    deploy: ['--only'],
    'hosting:channel:deploy': ['--expires'],
    'target:apply': [],
    'emulators:start': ['--only', '--import', '--export-on-exit'],
    'emulators:exec': ['--only', '--import', '--export-on-exit'],
  };
  if (!Object.hasOwn(extra, command))
    throw Error(`Unsupported command ${command || '(missing)'}. See Command reference.`);
  const { args, flags } = options(tail, ['--project', ...extra[command]]);
  const selected = flags['--project'] ?? state.project;
  if (flags['--project']) projectId(flags['--project']);
  switch (command) {
    case 'login':
      count(args, 0);
      state.authenticated = true;
      return 'Signed in to the virtual practice account.';
    case 'projects:list':
      count(args, 0);
      requireAuth(state);
      state.listed = true;
      return 'Available virtual projects: procode-dev, procode-staging, procode-prod.';
    case 'use':
      count(args, 1);
      state.project = projectId(args[0]);
      return `Active project: ${state.project}.`;
    case 'init': {
      count(args, 1);
      const features = [args[0]];
      if (features.some((f) => !['hosting', 'firestore', 'emulators'].includes(f)))
        throw Error('Supported init features: hosting, firestore, emulators.');
      projectId(selected);
      if (features.some((f) => f !== 'emulators')) cloudProject(state, selected);
      state.configured = [...new Set([...state.configured, ...features])];
      return `Configured ${features.join(', ')} using the fixture prompt answers. Virtual files only.`;
    }
    case 'deploy': {
      count(args, 0);
      const project = cloudProject(state, selected);
      const requested = flags['--only']
        ? services(flags['--only'])
        : state.configured.filter((f) => f !== 'emulators');
      if (!requested.length) throw Error('Nothing is configured for deployment.');
      const expanded: string[] = [];
      for (const item of requested) {
        const [service, target, ...rest] = item.split(':');
        if (
          rest.length ||
          !['hosting', 'firestore', 'functions'].includes(service) ||
          !state.configured.includes(service)
        )
          throw Error(`Deployment service is not configured: ${item}.`);
        if (
          service === 'hosting' &&
          target &&
          state.targets[`${project}:${target}`] !== `${project}-site`
        )
          throw Error(
            `Hosting target ${target} has no matching site mapping for ${project}. Use target:apply.`,
          );
        if (
          (service === 'firestore' && target && !['rules', 'indexes'].includes(target)) ||
          (service === 'functions' && target) ||
          item.endsWith(':')
        )
          throw Error(`Unsupported deployment scope: ${item}.`);
        expanded.push(
          ...(item === 'firestore' ? ['firestore:rules', 'firestore:indexes'] : [item]),
        );
      }
      state.deploys.push({ project, services: [...new Set(expanded)] });
      return `Simulated deploy to ${project}: ${expanded.join(', ')}.`;
    }
    case 'hosting:channel:deploy': {
      count(args, 1);
      const project = cloudProject(state, selected);
      if (!state.configured.includes('hosting')) throw Error('Hosting is not configured.');
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(args[0]) || args[0] === 'live')
        throw Error('Choose a preview channel ID, not live.');
      const expires = flags['--expires'] ?? '7d';
      if (!/^\d+[hdm]$/.test(expires)) throw Error('Use an expiry such as 7d, 24h, or 60m.');
      const duration =
        Number(expires.slice(0, -1)) * ({ d: 1440, h: 60, m: 1 }[expires.slice(-1)] ?? 0);
      if (duration <= 0 || duration > 43200)
        throw Error('Preview expiry must be greater than zero and at most 30 days.');
      state.previews.push({ project, channel: args[0], expires: `${duration}m` });
      return `Simulated preview channel ${args[0]} on ${project}, expires in ${expires}. Live Hosting unchanged.`;
    }
    case 'target:apply': {
      count(args, 3);
      const project = cloudProject(state, selected);
      if (args[0] !== 'hosting' || args[1] !== 'app' || args[2] !== `${project}-site`)
        throw Error(
          'Fixture target: hosting app. Site must match the selected project, such as procode-staging-site.',
        );
      state.targets[`${project}:${args[1]}`] = args[2];
      return `Mapped Hosting target ${args[1]} to ${args[2]} in .firebaserc (virtual).`;
    }
    case 'emulators:start':
    case 'emulators:exec': {
      count(args, command === 'emulators:exec' ? 1 : 0);
      const project = projectId(selected);
      if (!state.configured.includes('emulators'))
        throw Error('Emulators are not configured. Run firebase init emulators.');
      const selectedServices = services(flags['--only'] ?? 'auth,firestore');
      if (selectedServices.some((s) => !['auth', 'firestore'].includes(s)))
        throw Error('This fixture configures the auth and firestore emulators only.');
      const importPath = flags['--import'] ? normalizePath(flags['--import']) : '';
      if (importPath && importPath !== 'seed')
        throw Error('The available virtual emulator export directory is ./seed.');
      const exportPath = Object.hasOwn(flags, '--export-on-exit')
        ? normalizePath(flags['--export-on-exit'] || importPath || 'export')
        : '';
      if (exportPath && !['seed', 'saved', 'export'].includes(exportPath))
        throw Error('Virtual export paths: ./seed, ./saved, ./export.');
      if (command === 'emulators:exec' && args[0] !== 'npm run test:rules')
        throw Error(
          'Only the fixture script "npm run test:rules" is available. Scripts are simulated, never executed.',
        );
      state.emulators = {
        project,
        services: selectedServices,
        importPath,
        exportPath,
        running: command === 'emulators:start',
      };
      if (command === 'emulators:exec')
        state.tests.push({ project, services: selectedServices, script: args[0] });
      return command === 'emulators:start'
        ? `Simulated emulators running: ${selectedServices.join(', ')} on ${project}.${importPath ? ` Imported ${importPath}.` : ''}${exportPath ? ` Export on exit: ${exportPath}.` : ''}`
        : `Simulated ${args[0]} on ${project}: fixture tests passed. Emulators stopped.${exportPath ? ` Exported ${exportPath}.` : ''}`;
    }
  }
  throw Error('Unsupported command.');
}
export function runFirebase(source: string, exercise: FirebaseExercise) {
  const state: FirebaseState = structuredClone(exercise.initial);
  const logs: string[] = [],
    errors: string[] = [];
  try {
    if (source.length > 50000) throw Error('Limit commands to 50,000 characters.');
    const lines = source.split(/\r?\n/);
    let executed = 0;
    for (let index = 0; index < lines.length; index++) {
      try {
        const tokens = tokenize(lines[index]);
        if (!tokens.length) continue;
        if (++executed > 50) throw Error('Limit each attempt to 50 commands.');
        const next = structuredClone(state);
        const output = apply(tokens, next);
        Object.assign(state, next); // Invalid commands leave state unchanged.
        logs.push(`> ${lines[index].trim()}\n${output}`);
      } catch (error) {
        throw Error(`Line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (!executed) logs.push('No commands entered.');
  } catch (error) {
    errors.push(`Simulator error: ${error instanceof Error ? error.message : String(error)}`);
  }
  const results = exercise.checks.map((check) => ({
    name: check.name,
    hint: check.hint,
    pass: check.test(state),
  }));
  results.unshift({
    name: 'Commands complete without errors',
    hint: 'Correct the first error shown in Console, then run again. Each run starts from the exercise fixture.',
    pass: errors.length === 0,
  });
  return { state, logs, errors, results };
}
