import { Capture } from './capture.mjs';
import { instrumentJavaScript } from './javascript.mjs';
const PYTHON_ANALYSIS = `
import json
import contextlib
import io
_method_namespace = {}
exec(_method_analyzer, _method_namespace)
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    _method_result = _method_namespace['trace_method'](_method_source, _method_entry, json.loads(_method_probes))
json.dumps(_method_result, allow_nan=False)
`;
const silentConsole = { log() {}, info() {}, warn() {}, error() {}, debug() {} };
async function tracePython(data, py) {
  py.globals.set('_method_analyzer', data.methodAnalyzer);
  py.globals.set('_method_source', data.source);
  py.globals.set('_method_entry', data.name);
  py.globals.set('_method_probes', JSON.stringify(data.methodProbes));
  return JSON.parse(await py.runPythonAsync(PYTHON_ANALYSIS));
}
function traceProbe(data, source, hook, probe) {
  const capture = new Capture();
  try {
    const fn = new Function(hook, 'console', '"use strict";\n' + source + '\n;return ' + data.name)(
      capture.trace.bind(capture),
      silentConsole,
    );
    return { events: capture.events, value: fn(...structuredClone(probe)) };
  } catch {
    return { events: [], error: true };
  }
}
function traceJavaScript(data) {
  importScripts(data.typescriptUrl);
  const hook = '_procode_trace_' + crypto.getRandomValues(new Uint32Array(4)).join('_');
  const source = instrumentJavaScript(self.ts, data.source, hook);
  return data.methodProbes.map((probe) => traceProbe(data, source, hook, probe));
}
export async function analyze(data, pythonRuntime) {
  return data.language === 'python' ? tracePython(data, pythonRuntime) : traceJavaScript(data);
}
