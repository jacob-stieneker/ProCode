import { FullstackExercise, ProjectFiles, ProjectResult, ProjectScenario } from './model';
export class ProjectExecutionError extends Error {
  constructor(
    message: string,
    readonly logs: string[] = [],
  ) {
    super(message);
  }
}
function compile(source: string, fileName: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Error('Run cancelled.'));
      return;
    }
    const worker = new Worker(new URL('runtime/angular/compiler-worker.js', document.baseURI));
    const timer = setTimeout(() => finish(undefined, 'Compilation timed out.'), 12000);
    const cancel = () => finish(undefined, 'Run cancelled.');
    function finish(code?: string, error?: string) {
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener('abort', cancel);
      error ? reject(Error(error)) : resolve(code!);
    }
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = (e) => finish(e.data.code, e.data.error);
    worker.onerror = () => finish(undefined, 'Local compiler failed to load. Reload ProCode.');
    worker.postMessage({ source, fileName });
  });
}
export async function runProject(
  files: ProjectFiles,
  exercise: FullstackExercise,
  scenarios: ProjectScenario[],
  host: HTMLElement,
  signal: AbortSignal,
  onLogs: (logs: string[]) => void,
  onError: (message: string) => void,
) {
  if (Object.values(files).some((s) => s.length > 50000))
    throw Error('Keep each file under 50,000 characters.');
  const [client, backend] = await Promise.all([
    compile(files['app.ts'], 'app.ts', signal),
    compile(files['api.js'], 'api.js', signal),
  ]);
  const results: ProjectResult[] = [],
    logs: string[] = [];
  for (const scenario of scenarios) {
    if (signal.aborted) throw Error('Run cancelled.');
    try {
      const run = await session(
        files,
        exercise,
        client,
        backend,
        scenario,
        null,
        signal,
        () => {},
        () => {},
      );
      run.dispose();
      results.push({ name: scenario.name, hint: scenario.hint, pass: true });
      logs.push(...run.logs);
    } catch (error) {
      if (signal.aborted) throw error;
      results.push({
        name: scenario.name,
        hint: scenario.hint,
        pass: false,
        actual: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ProjectExecutionError) logs.push(...error.logs);
    }
  }
  const preview = await session(
    files,
    exercise,
    client,
    backend,
    null,
    host,
    signal,
    onLogs,
    onError,
  );
  return { ...preview, results, logs: [...logs, ...preview.logs].slice(-60) };
}
function session(
  files: ProjectFiles,
  exercise: FullstackExercise,
  client: string,
  backend: string,
  scenario: ProjectScenario | null,
  host: HTMLElement | null,
  signal: AbortSignal,
  onLogs: (logs: string[]) => void,
  onError: (message: string) => void,
): Promise<{ dispose: () => void; logs: string[]; failNext: (mode?: 'before' | 'after') => void }> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Error('Run cancelled.'));
      return;
    }
    const frame = document.createElement('iframe'),
      channel = crypto.randomUUID();
    frame.title = host ? 'Full-stack project preview' : 'Full-stack grading sandbox';
    frame.setAttribute('sandbox', 'allow-scripts allow-forms');
    frame.style.cssText = host
      ? 'display:none;width:100%;height:430px;border:0'
      : 'position:fixed;left:-14000px;top:0;width:' +
        (scenario?.width ?? 960) +
        'px;height:700px;border:0';
    let settled = false,
      started = false;
    const dispose = () => {
      clearTimeout(timer);
      removeEventListener('message', receive);
      signal.removeEventListener('abort', cancel);
      frame.remove();
    };
    const fail = (message: string, logs: string[] = []) => {
      if (settled) return;
      settled = true;
      dispose();
      reject(new ProjectExecutionError(message, logs));
    };
    const cancel = () => (settled ? dispose() : fail('Run cancelled.'));
    const timer = setTimeout(
      () => fail('Project execution timed out. Check for loops or unresolved promises.'),
      12000,
    );
    const receive = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || e.data?.channel !== channel) return;
      const data = e.data.payload;
      if (data?.type === 'ready' && !started) {
        started = true;
        frame.contentWindow!.postMessage(
          { type: 'run', channel, files, client, backend, initial: exercise.initial, scenario },
          '*',
        );
      }
      if (data?.type === 'console-error' && typeof data.message === 'string')
        onError(data.message.slice(0, 5000));
      if (data?.type === 'logs' && Array.isArray(data.logs))
        onLogs(data.logs.filter((v: unknown) => typeof v === 'string').slice(-60));
      if (data?.type === 'error')
        fail(String(data.message), Array.isArray(data.logs) ? data.logs : []);
      if (data?.type === 'result' && !settled) {
        if (
          !Array.isArray(data.results) ||
          data.results.length !== (scenario ? 1 : 0) ||
          data.results.some((r: { pass?: boolean }) => r.pass !== true)
        ) {
          fail('Incomplete project checks.');
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (host) frame.style.display = 'block';
        resolve({
          dispose,
          logs: Array.isArray(data.logs) ? data.logs : [],
          failNext: (mode = 'before') =>
            frame.contentWindow?.postMessage({ type: 'fail-next', channel, mode }, '*'),
        });
      }
    };
    const runtime = new URL('runtime/fullstack/runtime.js', document.baseURI).href;
    const policy = `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${runtime}; worker-src blob:; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none';`;
    frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${policy}"><title>Full-stack project</title></head><body><script>globalThis.__procodeChannel=${JSON.stringify(channel)};</script><script src="${runtime}"></script></body></html>`;
    signal.addEventListener('abort', cancel, { once: true });
    addEventListener('message', receive);
    (host ?? document.body).append(frame);
  });
}
