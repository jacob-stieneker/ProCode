import type { ExecutionAdapter, Language } from './exercises';
import type { Execution } from './runner';
import type { Method } from './method-policy';
import { gradeMethod, methodProbes } from './method-grading';
export class ExecutionEngine {
  private cancelCurrent?: () => void;
  cancel() {
    this.cancelCurrent?.();
  }
  async run(
    language: Language,
    source: string,
    name: string,
    inputs: unknown[][],
    adapter: ExecutionAdapter = 'json',
    method?: Method,
  ): Promise<Execution> {
    this.cancel();
    if (source.length > 50000)
      return { outputs: [], logs: [], error: 'Keep your solution under 50,000 characters.' };
    const controller = new AbortController();
    const cancelled = { outputs: [], logs: [], error: 'Run cancelled. Your code is saved.' };
    this.cancelCurrent = () => controller.abort();
    let workerSource: string;
    let methodAnalyzer = '';
    const methodUrl = new URL('runtime/method/', document.baseURI).href;
    const typescriptUrl = new URL('runtime/angular/typescript.js', document.baseURI).href;
    try {
      const response = await fetch(new URL('runtime/executor.js', document.baseURI), {
        signal: controller.signal,
      });
      if (!response.ok)
        throw Error('The code runner could not load. Reload the app and try again.');
      workerSource = await response.text();
      if (method && language === 'python') {
        // Analyzer failure must withhold method credit without losing output results.
        try {
          const analyzer = await fetch(methodUrl + 'python-analyzer.py', {
            signal: controller.signal,
          });
          if (analyzer.ok) methodAnalyzer = await analyzer.text();
        } catch {
          /* The output runner can still operate without method analysis. */
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return cancelled;
      throw error;
    }
    if (controller.signal.aborted) return cancelled;
    return new Promise((resolve) => {
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.display = 'none';
      frame.title = 'Isolated code runner';
      const channel = crypto.randomUUID();
      const runtimeUrl = new URL('runtime/pyodide/', document.baseURI).href;
      let done = false;
      let started = false;
      let outputResult: Execution | undefined;
      let timer: ReturnType<typeof setTimeout>;
      const finish = (result: Execution) => {
        if (done) return;
        done = true;
        // Explicitly terminate the worker before removing its owner frame.
        frame.contentWindow?.postMessage({ type: 'stop', channel }, '*');
        window.removeEventListener('message', receive);
        clearTimeout(timer);
        frame.remove();
        this.cancelCurrent = undefined;
        resolve(result);
      };
      const timeout = (ms: number, error: string) => {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish(
              outputResult && method
                ? {
                    ...outputResult,
                    method: {
                      status: 'unverified',
                      message:
                        'The method check timed out. Your output results are preserved. Finish requires a verified method.',
                    },
                  }
                : { outputs: [], logs: [], error },
            ),
          ms,
        );
      };
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.data?.channel !== channel) return;
        const data = event.data.payload;
        if (data.type === 'output' && method && Array.isArray(data.outputs)) {
          outputResult = { outputs: data.outputs, logs: Array.isArray(data.logs) ? data.logs : [] };
          timeout(8000, 'Method analysis timed out.');
        }
        if (data.type === 'ready' && !started) {
          started = true;
          timeout(
            4000,
            'Time limit reached. Check for an infinite loop or a loop that never advances.',
          );
        }
        if (data.type === 'result' && Array.isArray(data.outputs))
          finish({
            outputs: data.outputs,
            logs: Array.isArray(data.logs) ? data.logs : [],
            method: method ? gradeMethod(method, data.methodTraces) : undefined,
          });
        if (data.type === 'error')
          finish({
            outputs: [],
            logs: Array.isArray(data.logs) ? data.logs : [],
            error: String(data.error),
          });
      };
      window.addEventListener('message', receive);
      this.cancelCurrent = () =>
        finish({ outputs: [], logs: [], error: 'Run cancelled. Your code is saved.' });
      // Restrict network access to the pinned local interpreter assets. The opaque origin
      // also prevents user code from reading the app's localStorage and cookies.
      const policy = `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${runtimeUrl} ${methodUrl} ${typescriptUrl}; worker-src blob:; connect-src ${runtimeUrl};`;
      const script = `const channel=${JSON.stringify(channel)}; const worker = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], {type:'text/javascript'}))); worker.onmessage=e=>parent.postMessage({channel,payload:e.data},'*'); worker.onerror=e=>parent.postMessage({channel,payload:{type:'error',error:e.message||'Code runner failed to start.'}},'*'); addEventListener('message',e=>{if(e.source===parent&&e.data?.channel===channel&&e.data.type==='stop')worker.terminate()}); worker.postMessage(${JSON.stringify({ language, source, name, inputs, runtimeUrl, adapter, methodUrl, typescriptUrl, methodAnalyzer, methodProbes: method ? methodProbes(method).map((probe) => probe.input) : undefined })});`;
      frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="${policy}"><script>${script.replace(/<\/script/gi, '<\\/script')}<\/script>`;
      timeout(45000, 'The runtime took too long to load. Check the local server and try again.');
      document.body.append(frame);
    });
  }
}
