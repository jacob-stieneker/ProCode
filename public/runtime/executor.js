// Runs only in a disposable worker inside an opaque-origin iframe.
// No host filesystem, application storage, or production credentials are exposed.
self.onmessage = async ({ data }) => {
  const { language, source, name, inputs, runtimeUrl, adapter = 'json', methodProbes } = data;
  class ListNode {
    constructor(val = 0, next = null) {
      this.val = val;
      this.next = next;
    }
  }
  class TreeNode {
    constructor(val = 0, left = null, right = null) {
      this.val = val;
      this.left = left;
      this.right = right;
    }
  }
  const list = (values, pos = -1) => {
    const nodes = values.map((value) => new ListNode(value));
    nodes.forEach((node, i) => {
      node.next = nodes[i + 1] ?? null;
    });
    if (pos >= 0 && nodes.length) nodes[nodes.length - 1].next = nodes[pos];
    return nodes[0] ?? null;
  };
  const tree = (value) =>
    value === null ? null : new TreeNode(value[0], tree(value[1]), tree(value[2]));
  const argumentsFor = (args) => {
    if (adapter === 'linked-list') return args.map((values) => list(values));
    if (adapter === 'cycle-list') return [list(args[0], args[1])];
    if (adapter === 'tree') return args.map(tree);
    return args;
  };
  const normalize = (value) => {
    if (adapter === 'linked-list') {
      const values = [],
        seen = new Set();
      while (value !== null) {
        if (
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          !('val' in value) ||
          !('next' in value)
        )
          throw new TypeError('Return the head node of a linked list, or null for an empty list.');
        if (seen.has(value))
          throw new Error('The returned list contains a cycle. Its final next must be null.');
        if (values.length >= 1000)
          throw new Error('The returned list is too long. Check your next pointers.');
        seen.add(value);
        values.push(value.val);
        value = value.next;
      }
      return values;
    }
    return value;
  };
  const send = self.postMessage.bind(self);
  const logs = [];
  const diagnostic = (error) => {
    const message = String(error);
    if (language === 'python') return message.slice(-3000);
    // Function() adds two wrapper lines, and the strict directive adds one.
    // Keep learner frames and translate them back to editor line numbers.
    const frames =
      typeof error?.stack === 'string'
        ? error.stack
            .split('\n')
            .filter((line) => /solution\.js:\d+:\d+/.test(line))
            .map((line) =>
              line.replace(
                /solution\.js:(\d+):(\d+)/g,
                (_, line, column) => `solution.js:${Math.max(1, Number(line) - 3)}:${column}`,
              ),
            )
        : [];
    return [message, ...frames].join('\n').slice(0, 3000);
  };
  let length = 0;
  const log = (...values) => {
    if (length >= 8000 || logs.length >= 100) return;
    const text = values
      .map((value) => {
        try {
          return typeof value === 'string' ? value : JSON.stringify(value);
        } catch {
          return String(value);
        }
      })
      .join(' ');
    logs.push(text.slice(0, 8000 - length));
    length += text.length;
  };
  try {
    let outputs;
    let pythonRuntime;
    if (language === 'python') {
      const { loadPyodide } = await import(runtimeUrl + 'pyodide.mjs');
      const py = await loadPyodide({ indexURL: runtimeUrl, stdout: log, stderr: log });
      pythonRuntime = py;
      send({ type: 'ready' });
      py.globals.set('_pc_source', source);
      py.globals.set('_pc_inputs_json', JSON.stringify(inputs));
      py.globals.set('_pc_name', name);
      py.globals.set('_pc_adapter', adapter);
      const serialized = await py.runPythonAsync(`
import json as _pc_json
import traceback as _pc_traceback
class _pc_ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
class _pc_TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _pc_list(values, pos=-1):
    nodes = [_pc_ListNode(value) for value in values]
    for i in range(len(nodes) - 1):
        nodes[i].next = nodes[i + 1]
    if pos >= 0 and nodes:
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None

def _pc_tree(value):
    return None if value is None else _pc_TreeNode(value[0], _pc_tree(value[1]), _pc_tree(value[2]))

def _pc_arguments(args):
    if _pc_adapter == "linked-list":
        return [_pc_list(values) for values in args]
    if _pc_adapter == "cycle-list":
        return [_pc_list(args[0], args[1])]
    if _pc_adapter == "tree":
        return [_pc_tree(value) for value in args]
    return args

def _pc_normalize(value):
    if _pc_adapter == "linked-list":
        values, seen = [], set()
        while value is not None:
            if not hasattr(value, "val") or not hasattr(value, "next"):
                raise TypeError("Return the head node of a linked list, or None for an empty list.")
            if id(value) in seen:
                raise ValueError("The returned list contains a cycle. Its final next must be None.")
            if len(values) >= 1000:
                raise ValueError("The returned list is too long. Check your next pointers.")
            seen.add(id(value))
            values.append(value.val)
            value = value.next
        return values
    return value

_pc_namespace = {"__name__": "__main__", "ListNode": _pc_ListNode, "TreeNode": _pc_TreeNode}
exec(compile(_pc_source, "solution.py", "exec"), _pc_namespace)
_pc_fn = _pc_namespace.get(_pc_name)
if not callable(_pc_fn):
    raise TypeError("Define a function named " + _pc_name)
_pc_results = []
for _pc_args in _pc_json.loads(_pc_inputs_json):
    try:
        _pc_args = _pc_arguments(_pc_args)
        _pc_value = _pc_normalize(_pc_fn(*_pc_args))
        _pc_output = {"result": _pc_value, "inputs": _pc_args} if _pc_adapter == "clean" else _pc_value
        _pc_results.append({"value": _pc_json.loads(_pc_json.dumps(_pc_output, allow_nan=False))})
    except Exception as _pc_error:
        _pc_results.append({"error": "".join(_pc_traceback.format_exception(_pc_error))[-3000:]})
_pc_json.dumps(_pc_results, allow_nan=False)
`);
      if (serialized.length > 64000)
        throw Error('Output is too large. Return only the requested result.');
      outputs = JSON.parse(serialized);
    } else {
      send({ type: 'ready' });
      const captureConsole = { log, info: log, warn: log, error: log, debug: log };
      const fn = new Function(
        'console',
        'ListNode',
        'TreeNode',
        '"use strict";\n' +
          source +
          '\n;return typeof ' +
          name +
          ' === "function" ? ' +
          name +
          ' : null;\n//# sourceURL=solution.js',
      )(captureConsole, ListNode, TreeNode);
      if (!fn) throw Error('Define a function named ' + name + '.');
      outputs = inputs.map((args) => {
        try {
          const prepared = argumentsFor(structuredClone(args));
          const value = normalize(fn(...prepared));
          if (value === undefined)
            return { error: 'Your function returned undefined. Return the requested result.' };
          const serialized = JSON.stringify(
            adapter === 'clean' ? { result: value, inputs: prepared } : value,
          );
          if (!serialized || serialized.length > 64000)
            throw Error('Output is too large or cannot be represented as JSON.');
          return { value: JSON.parse(serialized) };
        } catch (error) {
          return { error: diagnostic(error) };
        }
      });
    }
    let methodTraces;
    if (methodProbes) {
      send({ type: 'output', outputs, logs });
      // The normal result above is retained even if instrumentation cannot handle
      // an unusual implementation. Missing evidence never grants method credit.
      try {
        importScripts(data.methodUrl + 'execution.js');
        methodTraces = await ProCodeMethodRuntime.analyze(data, pythonRuntime);
      } catch {
        methodTraces = undefined;
      }
    }
    send({ type: 'result', outputs, logs, methodTraces });
  } catch (error) {
    send({ type: 'error', error: diagnostic(error), logs });
  }
};
