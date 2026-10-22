import { AngularResult, AngularScenario } from './model';
export class AngularExecutionError extends Error {
  constructor(
    message: string,
    readonly logs: string[],
  ) {
    super(message);
  }
}
function compile(source: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Error('Run cancelled.'));
      return;
    }
    const worker = new Worker(new URL('runtime/angular/compiler-worker.js', document.baseURI));
    const timer = setTimeout(
      () => finish(undefined, 'TypeScript compilation timed out. Try a smaller solution.'),
      12000,
    );
    const cancel = () => finish(undefined, 'Run cancelled.');
    function finish(code?: string, error?: string) {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      worker.terminate();
      error ? reject(Error(error)) : resolve(code!);
    }
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = (event) => finish(event.data.code, event.data.error);
    worker.onerror = () =>
      finish(
        undefined,
        'The local TypeScript compiler could not load. Reload ProCode and try again.',
      );
    worker.postMessage({ source });
  });
}
export interface AngularRun {
  results: AngularResult[];
  logs: string[];
  dispose: () => void;
}
export async function runAngular(
  source: string,
  scenarios: AngularScenario[],
  host: HTMLElement,
  signal: AbortSignal,
  onLogs: (logs: string[]) => void,
  onError: (message: string) => void,
): Promise<AngularRun> {
  if (source.length > 50000) throw Error('Keep component.ts under 50,000 characters.');
  const code = await compile(source, signal);
  if (signal.aborted) throw Error('Run cancelled.');
  const graded = await frameSession(code, scenarios, null, signal, onLogs, onError);
  graded.dispose();
  if (signal.aborted) throw Error('Run cancelled.');
  const preview = await frameSession(code, [], host, signal, onLogs, onError);
  return {
    results: graded.results,
    logs: [...graded.logs, ...preview.logs].slice(-100),
    dispose: preview.dispose,
  };
}
function frameSession(
  code: string,
  scenarios: AngularScenario[],
  host: HTMLElement | null,
  signal: AbortSignal,
  onLogs: (logs: string[]) => void,
  onError: (message: string) => void,
): Promise<AngularRun> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.title = host ? 'Angular exercise preview' : 'Angular grading sandbox';
    frame.setAttribute('sandbox', 'allow-scripts allow-forms');
    frame.style.cssText = host
      ? 'display:none;width:100%;height:400px;border:0;'
      : 'position:fixed;left:-12000px;top:0;width:800px;height:500px;border:0;';
    const channel = crypto.randomUUID();
    const runtime = new URL('runtime/angular/', document.baseURI).href;
    let settled = false,
      started = false;
    const timer = setTimeout(
      () => fail('Angular execution timed out. Check for loops or work that never finishes.'),
      20000,
    );
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
      reject(new AngularExecutionError(message, logs));
    };
    const cancel = () => {
      if (!settled) fail('Run cancelled.');
      else dispose();
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.channel !== channel) return;
      const data = event.data.payload;
      if (data?.type === 'ready' && !started) {
        started = true;
        frame.contentWindow!.postMessage({ type: 'run', channel, code, scenarios }, '*');
      }
      if (data?.type === 'console-error' && typeof data.message === 'string')
        onError(data.message.slice(0, 6000));
      if (data?.type === 'logs' && Array.isArray(data.logs))
        onLogs(data.logs.filter((v: unknown) => typeof v === 'string').slice(-100));
      if (data?.type === 'error')
        fail(
          String(data.message),
          Array.isArray(data.logs)
            ? data.logs.filter((v: unknown) => typeof v === 'string').slice(-100)
            : [],
        );
      if (data?.type === 'result' && !settled) {
        if (!Array.isArray(data.results) || data.results.length !== scenarios.length) {
          fail('The runner returned an incomplete result.');
          return;
        }
        settled = true;
        clearTimeout(timer);
        const results = scenarios.map((scenario, index) => ({
          name: scenario.name,
          hint: scenario.hint,
          pass: data.results[index]?.pass === true,
          actual:
            typeof data.results[index]?.actual === 'string'
              ? data.results[index].actual
              : undefined,
        }));
        if (host)
          frame.style.cssText = 'display:block;width:100%;height:400px;border:0;background:white;';
        resolve({ results, logs: Array.isArray(data.logs) ? data.logs : [], dispose });
      }
    };
    signal.addEventListener('abort', cancel, { once: true });
    addEventListener('message', receive);
    const policy = `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${runtime}; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none';`;
    frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><title>Angular exercise preview</title><style>body{font:16px/1.5 system-ui,sans-serif;margin:20px;background:#fff;color:#172033}*{box-sizing:border-box}h1{font-size:24px}button,input,select,textarea{font:inherit;max-width:100%;padding:8px;margin:4px}label{display:block}button{min-height:40px;cursor:pointer}button:disabled{cursor:not-allowed}output{display:inline-block;min-width:24px}p,li{overflow-wrap:anywhere}button:focus-visible,input:focus-visible{outline:2px solid #2563eb;outline-offset:2px}</style></head><body><script>globalThis.__procodeChannel=${JSON.stringify(channel)};</script><script src="${runtime}runtime.js"></script></body></html>`;
    (host ?? document.body).append(frame);
  });
}
