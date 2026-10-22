import '@angular/compiler';
import * as core from '@angular/core';
import * as common from '@angular/common';
import * as forms from '@angular/forms';
import * as interop from '@angular/core/rxjs-interop';
import { bootstrapApplication } from '@angular/platform-browser';
import * as rxjs from 'rxjs';
import * as operators from 'rxjs/operators';
import { createRouter } from './router.mjs';

// Runtime receives compiled learner modules inside an opaque-origin iframe.
(() => {
  // Worker initialization includes cold startup; requests keep their short watchdog.
  const apiTimeoutMs = { initialization: 8000, request: 1800 };
  const channel = globalThis.__procodeChannel;
  delete globalThis.__procodeChannel;
  const send = (payload) => parent.postMessage({ channel, payload }, '*');
  const format = (value) => {
    try {
      return value instanceof Error
        ? value.stack || value.message
        : typeof value === 'string'
          ? value
          : JSON.stringify(value);
    } catch {
      return String(value);
    }
  };
  let errors = [],
    logs = [],
    worker,
    started = false,
    pending = new Map(),
    serial = 0,
    failed = false,
    failure = null;
  const log = (message) => {
    logs.push(String(message).slice(0, 2000));
    logs = logs.slice(-60);
  };
  const report = (error) => {
    const message = format(error).slice(0, 5000);
    errors.push(message);
    send({ type: 'console-error', message });
  };
  for (const name of ['log', 'info', 'warn', 'error'])
    console[name] = (...values) => {
      if (String(values[0]).startsWith('Angular is running in development mode')) return;
      log(values.map(format).join(' '));
    };
  addEventListener('error', (e) => report(e.error || e.message));
  addEventListener('unhandledrejection', (e) => report(e.reason));
  document.addEventListener('submit', (e) => e.preventDefault(), true);
  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest?.('a')) e.preventDefault();
    },
    true,
  );
  function server(createRouter) {
    let db,
      handler,
      deadline = Infinity,
      initialized = false,
      queue = Promise.resolve();
    const reply = self.postMessage.bind(self);
    for (const name of ['log', 'info', 'warn', 'error'])
      console[name] = (...args) =>
        reply({
          log: args
            .map((v) => {
              try {
                return typeof v === 'string' ? v : JSON.stringify(v);
              } catch {
                return String(v);
              }
            })
            .join(' ')
            .slice(0, 2000),
        });
    const checkpoint = () => {
      if (performance.now() > deadline)
        throw Error('API execution limit reached. Check loops or recursion.');
    };
    self.onmessage = ({ data }) => {
      queue = queue.then(async () => {
        try {
          deadline = performance.now() + 800;
          if (data.kind === 'init' && !initialized) {
            initialized = true;
            db = data.initial;
            const exports = {};
            const requireModule = (name) => {
              if (name === '@procode/server') return { createRouter };
              throw Error(`API import "${name}" is not available. Use @procode/server.`);
            };
            new Function(
              'exports',
              '__procodeCheckpoint',
              'require',
              data.code + '\n//# sourceURL=api.js',
            )(exports, checkpoint, requireModule);
            if (typeof exports.handleRequest !== 'function')
              throw Error('api.js must export function handleRequest(request, db).');
            handler = exports.handleRequest;
            reply({ id: data.id, value: true });
            return;
          }
          if (!handler) throw Error('API is not initialized.');
          if (data.kind === 'snapshot') {
            reply({ id: data.id, value: db });
            return;
          }
          const response = await handler(data.request, db);
          if (
            !response ||
            !Number.isInteger(response.status) ||
            response.status < 100 ||
            response.status > 599 ||
            !Object.hasOwn(response, 'body')
          )
            throw Error(
              'Return { status: number, body: JSON-compatible value } from handleRequest.',
            );
          reply({ id: data.id, value: JSON.parse(JSON.stringify(response)) });
        } catch (error) {
          reply({ id: data.id, error: error.stack || String(error) });
        }
      });
    };
  }
  function terminate(message) {
    failed = true;
    worker?.terminate();
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(Error(message));
    }
    pending.clear();
  }
  function call(message) {
    if (failed) return Promise.reject(Error('API worker stopped. Run again to restart.'));
    return new Promise((resolve, reject) => {
      const id = ++serial;
      const timer = setTimeout(
        () => terminate('API request timed out. Check loops or unresolved promises in api.js.'),
        message.kind === 'init' ? apiTimeoutMs.initialization : apiTimeoutMs.request,
      );
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ ...message, id });
    });
  }
  async function request(method, path, body) {
    if (typeof method !== 'string' || typeof path !== 'string' || !path.startsWith('/'))
      throw Error('Use api.request(method, /path, body).');
    const match =
      failure &&
      (!failure.method || failure.method === method) &&
      (!failure.path || failure.path === path);
    const injected = match ? failure : null;
    if (match) failure = null;
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (injected?.mode !== 'after' && injected) {
      log(`${method} ${path} -> simulated connection failure`);
      throw Error('Connection failed. Retry the request.');
    }
    let response;
    try {
      response = await call({ kind: 'request', request: { method, path, body: body ?? null } });
    } catch (error) {
      report(error);
      throw error;
    }
    log(`${method} ${path} -> ${response.status}`);
    if (injected) {
      log('Response lost after the API committed.');
      throw Error('Response lost. Retry with the same request key.');
    }
    return { ...response, ok: response.status >= 200 && response.status < 300 };
  }
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  async function settle() {
    await pause(50);
    for (let i = 0; pending.size && i < 50; i++) await pause(40);
    await pause(20);
    if (errors.length) throw Error(errors[0]);
  }
  const nodes = (target) => [...document.querySelectorAll(`[data-testid="${CSS.escape(target)}"]`)];
  const visible = (e) => {
    if (!e || !e.getClientRects().length) return false;
    for (let p = e; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0)
        return false;
    }
    return true;
  };
  const pathValue = (object, path) =>
    path ? path.split('.').reduce((v, k) => v?.[k], object) : object;
  function equal(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]))
    );
  }
  function assert(actual, expected, label) {
    if (!equal(actual, expected))
      throw Error(
        `${label}: expected ${format(expected)}, received ${format(actual) ?? 'missing'}`,
      );
  }
  function markup(source) {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    doc
      .querySelectorAll('script,iframe,object,embed,link,meta,base,style,svg,math')
      .forEach((e) => e.remove());
    for (const e of doc.querySelectorAll('*'))
      for (const a of [...e.attributes]) {
        if (
          a.name.startsWith('on') ||
          ['srcdoc', 'action', 'formaction', 'srcset'].includes(a.name) ||
          (['src', 'href'].includes(a.name) &&
            !a.value.startsWith('data:image/') &&
            !a.value.startsWith('#'))
        )
          e.removeAttribute(a.name);
      }
    document.body.replaceChildren(...doc.body.childNodes);
  }
  async function execute(data) {
    const style = document.createElement('style');
    style.textContent = data.files['styles.css'];
    document.head.append(style);
    const blob = URL.createObjectURL(
      new Blob([`(${server.toString()})(${createRouter.toString()})`], { type: 'text/javascript' }),
    );
    worker = new Worker(blob);
    // Keep the script available until a slow worker has actually loaded it.
    const releaseBlob = () => URL.revokeObjectURL(blob);
    worker.addEventListener('message', releaseBlob, { once: true });
    worker.addEventListener('error', releaseBlob, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.log) {
        log('api.js: ' + data.log);
        return;
      }
      const entry = pending.get(data.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(data.id);
      data.error ? entry.reject(Error(data.error)) : entry.resolve(data.value);
    };
    worker.onerror = (e) => terminate('API worker failed: ' + e.message);
    await call({ kind: 'init', code: data.backend, initial: data.initial });
    let deadline = Infinity;
    const checkpoint = () => {
      if (deadline === Infinity) {
        deadline = performance.now() + 800;
        setTimeout(() => (deadline = Infinity), 0);
      }
      if (performance.now() > deadline)
        throw Error('Client execution limit reached. Check loops or recursion in app.ts.');
    };
    const exports = {};
    class PracticeApi {
      request(method, path, body) {
        return request(method, path, body);
      }
    }
    class PracticeErrorHandler {
      handleError(error) {
        report(error);
      }
    }
    const modules = {
      '@angular/core': core,
      '@angular/common': common,
      '@angular/forms': forms,
      '@angular/core/rxjs-interop': interop,
      rxjs,
      'rxjs/operators': operators,
      '@procode/fullstack': { PracticeApi, projectTemplate: data.files['index.html'] },
    };
    const requireModule = (name) => {
      if (!Object.hasOwn(modules, name))
        throw Error(`Client import "${name}" is not available. See Runtime reference.`);
      return modules[name];
    };
    new Function(
      'exports',
      '__procodeCheckpoint',
      'require',
      data.client + '\n//# sourceURL=app.ts',
    )(exports, checkpoint, requireModule);
    if (exports.AppComponent) {
      document.body.replaceChildren(document.createElement('practice-root'));
      await bootstrapApplication(exports.AppComponent, {
        providers: [
          { provide: PracticeApi, useValue: Object.freeze(new PracticeApi()) },
          { provide: core.ErrorHandler, useClass: PracticeErrorHandler },
        ],
      });
    } else if (typeof exports.mount === 'function') {
      // Preserve existing user-written clients without rewriting their source.
      markup(data.files['index.html']);
      await exports.mount(Object.freeze({ request }));
    } else throw Error('app.ts must export AppComponent (or a legacy mount(api) function).');
    await settle();
    let response;
    for (const step of data.scenario?.steps ?? []) {
      if (step.action === 'failNext') {
        failure = { method: step.method, path: step.path, mode: step.value || 'before' };
        continue;
      }
      if (step.action === 'request') {
        response = await request(step.method, step.path, step.body);
      }
      if (step.action === 'input' || step.action === 'click' || step.action === 'doubleClick') {
        const e = nodes(step.target)[0];
        if (!visible(e))
          throw Error(`Missing visible control: ${step.target}. Keep data-testid hooks.`);
        if (e.disabled) throw Error(`${step.target} is disabled.`);
        if (step.action === 'click' || step.action === 'doubleClick') {
          e.click();
          if (step.action === 'doubleClick') e.click();
        } else {
          if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.tagName) || e.readOnly)
            throw Error(`${step.target} must be editable.`);
          e.value = step.value;
          e.dispatchEvent(new Event('input', { bubbles: true }));
          e.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      await settle();
      if (step.action === 'assert') {
        let actual;
        if (step.scope === 'response') actual = pathValue(response, step.target);
        else if (step.scope === 'db')
          actual = pathValue(await call({ kind: 'snapshot' }), step.target);
        else {
          const list = nodes(step.target).filter(visible),
            first = list[0];
          actual =
            step.kind === 'count'
              ? list.length
              : step.kind === 'value'
                ? first?.value
                : step.kind === 'disabled'
                  ? first?.disabled
                  : first?.textContent.trim();
        }
        if (step.kind === 'contains')
          actual = typeof actual === 'string' && actual.includes(String(step.expected));
        assert(
          actual,
          step.kind === 'contains' ? true : step.expected,
          `${step.scope || 'ui'} ${step.target}`,
        );
      }
    }
    const snapshot = await call({ kind: 'snapshot' });
    for (const items of Object.values(snapshot)) {
      if (
        Array.isArray(items) &&
        items.length &&
        items.every((item) => item && typeof item === 'object' && Object.hasOwn(item, 'id'))
      ) {
        if (
          items.some((item) => !Number.isInteger(item.id) || item.id <= 0) ||
          new Set(items.map((item) => item.id)).size !== items.length
        )
          throw Error('API records must have unique positive integer IDs.');
      }
    }
    if (data.scenario?.layout) {
      const controls = [...document.querySelectorAll('input,select,textarea,button')].filter(
        visible,
      );
      if (!document.querySelector('h1') || !controls.length)
        throw Error('Render a heading and usable form controls.');
      if (document.documentElement.scrollWidth > innerWidth + 2)
        throw Error('The preview overflows horizontally. Make the layout responsive.');
      for (const e of controls) {
        const b = e.getBoundingClientRect();
        if (b.width < 24 || b.height < 24 || b.left < 0 || b.right > innerWidth + 2)
          throw Error('Controls must fit the viewport and be at least 24px in each direction.');
        if (
          ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName) &&
          !e.labels?.length &&
          !e.getAttribute('aria-label')
        )
          throw Error('Label every editable control.');
      }
    }
    send({ type: 'result', results: data.scenario ? [{ pass: true }] : [], logs });
    logs = [];
    setInterval(() => {
      if (logs.length) {
        send({ type: 'logs', logs });
        logs = [];
      }
    }, 200);
  }
  addEventListener('message', (e) => {
    if (e.source !== parent || e.data?.channel !== channel) return;
    if (e.data.type === 'fail-next') {
      failure = { mode: e.data.mode || 'before' };
      return;
    }
    if (e.data.type !== 'run' || started) return;
    started = true;
    execute(e.data).catch((error) => send({ type: 'error', message: format(error), logs }));
  });
  send({ type: 'ready' });
})();
