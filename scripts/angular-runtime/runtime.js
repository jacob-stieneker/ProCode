import { PracticeContactsApi } from './contacts-api.mjs';
import '@angular/compiler';
import * as core from '@angular/core';
import * as common from '@angular/common';
import * as forms from '@angular/forms';
import * as interop from '@angular/core/rxjs-interop';
import { bootstrapApplication } from '@angular/platform-browser';
import * as rxjs from 'rxjs';
import * as operators from 'rxjs/operators';

const channel = globalThis.__procodeChannel;
delete globalThis.__procodeChannel;
const send = (payload) => parent.postMessage({ channel, payload }, '*');
const format = (value) => {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
let logs = [],
  runtimeErrors = [];
for (const name of ['log', 'info', 'warn', 'error'])
  console[name] = (...values) => {
    if (String(values[0]).startsWith('Angular is running in development mode')) return;
    if (logs.join('').length < 8000 && logs.length < 100)
      logs.push(values.map(format).join(' ').slice(0, 2000));
  };
class PracticeSearchApi {
  search(query) {
    const q = query.trim().toLowerCase();
    return new rxjs.Observable((subscriber) => {
      const timer = setTimeout(
        () => {
          if (q === 'error') {
            subscriber.error(Error('Practice search failed.'));
            return;
          }
          subscriber.next(
            [
              'Angular Basics',
              'Angular Signals',
              'CSS Layout',
              'TypeScript Basics',
              'RxJS Streams',
            ].filter((name) => name.toLowerCase().includes(q)),
          );
          subscriber.complete();
        },
        q === 'a' ? 450 : 80,
      );
      return () => clearTimeout(timer);
    });
  }
}
core.Injectable({ providedIn: 'root' })(PracticeSearchApi);
const modules = {
  '@angular/core': core,
  '@angular/common': common,
  '@angular/forms': forms,
  '@angular/core/rxjs-interop': interop,
  rxjs: rxjs,
  'rxjs/operators': operators,
  '@procode/practice': { PracticeSearchApi, PracticeContactsApi },
};
const requireModule = (name) => {
  if (!Object.hasOwn(modules, name))
    throw Error(`Import "${name}" is not available. Use the packages listed in Runtime reference.`);
  return modules[name];
};
let deadline = Infinity;
function checkpoint() {
  if (deadline === Infinity) {
    deadline = performance.now() + 1000;
    setTimeout(() => (deadline = Infinity), 0);
  }
  if (performance.now() > deadline)
    throw Error('Execution limit reached. Check for an infinite loop or unbounded recursion.');
}
class PracticeErrorHandler {
  handleError(error) {
    const message = format(error);
    runtimeErrors.push(message.slice(0, 4000));
    send({ type: 'console-error', message: message.slice(0, 4000) });
  }
}
let app;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function nodes(target) {
  return [...document.querySelectorAll(`[data-testid="${CSS.escape(target)}"],${target}`)];
}
function visible(element) {
  if (!element || !element.getClientRects().length) return false;
  for (let p = element; p; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
  }
  return true;
}
async function render(code) {
  app?.destroy();
  app = undefined;
  document.body.replaceChildren(document.createElement('practice-root'));
  deadline = Infinity;
  const exports = {};
  new Function('require', 'exports', '__procodeCheckpoint', `${code}\n//# sourceURL=component.ts`)(
    requireModule,
    exports,
    checkpoint,
  );
  if (typeof exports.AppComponent !== 'function')
    throw Error('Export a standalone class named AppComponent.');
  app = await bootstrapApplication(exports.AppComponent, {
    providers: [
      core.provideZonelessChangeDetection(),
      { provide: core.ErrorHandler, useClass: PracticeErrorHandler },
    ],
  });
  await pause(35);
  if (runtimeErrors.length) throw Error(runtimeErrors[0]);
}
async function runScenario(scenario, code) {
  runtimeErrors = [];
  await render(code);
  for (const step of scenario.steps) {
    if (step.action === 'wait') {
      await pause(Math.min(step.ms ?? 0, 1000));
      continue;
    }
    const target = nodes(step.target)[0];
    if (!visible(target))
      throw Error(`Missing visible control: ${step.target}. Keep its data-testid attribute.`);
    if (step.action === 'click') target.click();
    if (step.action === 'input') {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        throw Error(`${step.target} must be an input, textarea, or select.`);
      if (target.disabled || target.readOnly) throw Error(`${step.target} must be editable.`);
      target.value = step.value ?? '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    await pause(30);
    if (runtimeErrors.length) throw Error(runtimeErrors[0]);
  }
  await pause(10);
  if (runtimeErrors.length) throw Error(runtimeErrors[0]);
  for (const assertion of scenario.assertions) {
    const elements = nodes(assertion.target).filter(visible),
      first = elements[0];
    const actual =
      assertion.kind === 'count'
        ? elements.length
        : assertion.kind === 'texts'
          ? elements.map((e) => e.textContent.trim())
          : assertion.kind === 'disabled'
            ? first?.disabled
            : assertion.kind === 'value'
              ? first?.value
              : first?.textContent.trim();
    if (JSON.stringify(actual) !== JSON.stringify(assertion.expected))
      return {
        pass: false,
        actual: `${assertion.target}: expected ${JSON.stringify(assertion.expected)}, received ${JSON.stringify(actual) ?? 'missing element'}`,
      };
  }
  return { pass: true };
}
addEventListener('error', (event) => {
  const message = event.error ? format(event.error) : event.message;
  runtimeErrors.push(message);
  send({ type: 'console-error', message: String(message).slice(0, 4000) });
});
addEventListener('unhandledrejection', (event) => {
  const message = format(event.reason);
  runtimeErrors.push(message);
  send({ type: 'console-error', message: message.slice(0, 4000) });
});
// Avoid leaving this isolated preview through ordinary links/forms.
document.addEventListener(
  'click',
  (event) => {
    if (event.target.closest?.('a')) event.preventDefault();
  },
  true,
);
document.addEventListener('submit', (event) => event.preventDefault(), true);
let started = false;
addEventListener('message', async (event) => {
  if (
    event.source !== parent ||
    event.data?.channel !== channel ||
    event.data.type !== 'run' ||
    started
  )
    return;
  started = true;
  const { code, scenarios } = event.data;
  try {
    const results = [];
    for (const scenario of scenarios) {
      try {
        results.push({
          name: scenario.name,
          hint: scenario.hint,
          ...(await runScenario(scenario, code)),
        });
      } catch (error) {
        results.push({
          name: scenario.name,
          hint: scenario.hint,
          pass: false,
          actual: format(error).slice(0, 4000),
        });
      }
    }
    runtimeErrors = [];
    await render(code);
    send({ type: 'result', results, logs: logs.slice(-100) });
    logs = [];
    // Later interactions keep their errors and console output visible in ProCode.
    setInterval(() => {
      if (logs.length) {
        send({ type: 'logs', logs: logs.slice(-100) });
        logs = [];
      }
    }, 250);
  } catch (error) {
    send({ type: 'error', message: format(error).slice(0, 6000), logs: logs.slice(-100) });
  }
});
send({ type: 'ready' });
