import { Runner } from '../runner';
import type { Language } from '../exercises';
import type { CleanExercise, CleanMetrics, CleanResult } from './model';
export function equal(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object')
    return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(actual);
  return (
    keys.length === Object.keys(expected).length &&
    keys.every(
      (key) => Object.hasOwn(expected, key) && equal((actual as any)[key], (expected as any)[key]),
    )
  );
}
export function gradeStructure(exercise: CleanExercise, metrics: CleanMetrics): CleanResult[] {
  return exercise.rules.map((rule) => {
    let pass = false,
      actual = '';
    if (rule.kind === 'names') {
      pass = metrics.shortNames.length === 0;
      actual = pass ? 'No short bindings.' : `Short names: ${metrics.shortNames.join(', ')}`;
    }
    if (rule.kind === 'nesting') {
      pass = metrics.branchDepth <= rule.limit!;
      actual = `Maximum decision depth: ${metrics.branchDepth}`;
    }
    if (rule.kind === 'numbers' || rule.kind === 'strings') {
      const found = (
        rule.kind === 'numbers' ? metrics.inlineNumbers : metrics.inlineStrings
      ).filter((value) => rule.values!.includes(value));
      pass = !found.length;
      actual = pass
        ? 'Policy literals are outside functions.'
        : `Inside functions: ${[...new Set(found)].join(', ')}`;
    }
    if (rule.kind === 'helpers') {
      pass = metrics.helpers.length >= 2 && metrics.entryStatements <= rule.limit!;
      actual = `${metrics.helpers.length} reachable named helpers; ${metrics.entryStatements} entry-point statements.`;
    }
    return { name: rule.name, pass, hint: rule.hint, actual, kind: 'cleanup' };
  });
}
async function inspectJavaScript(
  source: string,
  entry: string,
  signal: AbortSignal,
): Promise<CleanMetrics> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('runtime/clean/worker.js', document.baseURI));
    const finish = (metrics?: CleanMetrics, error?: string) => {
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener('abort', cancel);
      error ? reject(Error(error)) : resolve(metrics!);
    };
    const cancel = () => finish(undefined, 'Run cancelled.');
    const timer = setTimeout(() => finish(undefined, 'Source analysis timed out.'), 8000);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    worker.onmessage = (e) => finish(e.data.metrics, e.data.error);
    worker.onerror = () =>
      finish(undefined, 'The local source analyzer could not load. Reload ProCode.');
    worker.postMessage({ source, entry });
  });
}
export async function runClean(
  runner: Runner,
  exercise: CleanExercise,
  language: Language,
  source: string,
  mode: 'run' | 'finish',
  signal: AbortSignal,
) {
  if (source.length > 50000) throw Error('Keep your solution under 50,000 characters.');
  const entry = exercise.signature[language];
  let metrics: CleanMetrics;
  if (language === 'javascript') metrics = await inspectJavaScript(source, entry, signal);
  else {
    const response = await fetch(new URL('runtime/clean/python-analyzer.py', document.baseURI), {
      signal,
    });
    if (!response.ok) throw Error('The local Python analyzer could not load.');
    const analyzer = await response.text();
    if (signal.aborted) throw Error('Run cancelled.');
    const analysis = await runner.run('python', analyzer, 'analyze_clean_code', [[source, entry]]);
    if (analysis.error || analysis.outputs[0]?.error)
      throw Error(analysis.error || analysis.outputs[0].error);
    metrics = analysis.outputs[0].value as CleanMetrics;
  }
  if (signal.aborted) throw Error('Run cancelled.');
  const checks =
    mode === 'run' ? exercise.examples : [...exercise.examples, ...exercise.additional];
  const execution = await runner.run(
    language,
    source,
    entry,
    checks.map((c) => c.input),
    'clean',
  );
  if (signal.aborted) throw Error('Run cancelled.');
  const errors = [execution.error, ...execution.outputs.map((r) => r.error)].filter(
    (e): e is string => !!e,
  );
  const results: CleanResult[] = checks.map((check, index) => {
    const value = execution.outputs[index]?.value as
      { result: unknown; inputs: unknown[] } | undefined;
    const pass =
      !execution.error &&
      !execution.outputs[index]?.error &&
      !!value &&
      equal(value.result, check.expected);
    return {
      name: check.name,
      kind: 'behavior',
      pass,
      hint: check.hint,
      actual:
        execution.outputs[index]?.error ??
        `Expected ${JSON.stringify(check.expected)}; received ${JSON.stringify(value?.result) ?? 'no result'}.`,
    };
  });
  if (exercise.preserveInputs)
    results.push({
      kind: 'cleanup',
      name: 'Preserve caller inputs',
      pass:
        !errors.length &&
        checks.every((c, index) =>
          equal((execution.outputs[index]?.value as any)?.inputs, c.input),
        ),
      hint: 'Copy both the collection and any records you change. Return new results instead of changing caller-owned data.',
    });
  results.push(...gradeStructure(exercise, metrics));
  return { results, logs: execution.logs, errors: [...new Set(errors)] };
}
