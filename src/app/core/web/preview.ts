import { WebExercise } from './model';
// A script-disabled, same-origin sandbox lets trusted parent checks inspect rendered DOM.
// Learner content never executes scripts, submits forms, or loads remote resources.
const blocked =
  'script,iframe,frame,frameset,object,embed,link,meta,base,style,svg,math,template,noscript';
export function previewDocument(markup: string, css: string): string {
  const template = document.createElement('template');
  template.innerHTML = markup;
  template.content.querySelectorAll(blocked).forEach((e) => e.remove());
  template.content.querySelectorAll('*').forEach((e) => {
    for (const attr of Array.from(e.attributes)) {
      const name = attr.name.toLowerCase();
      if (
        name.startsWith('on') ||
        [
          'srcdoc',
          'srcset',
          'action',
          'formaction',
          'target',
          'download',
          'autofocus',
          'is',
          'ping',
        ].includes(name)
      )
        e.removeAttribute(attr.name);
      if (
        ['href', 'src', 'xlink:href', 'background', 'poster'].includes(name) &&
        !attr.value.startsWith('#') &&
        !(
          e.tagName === 'IMG' &&
          name === 'src' &&
          /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attr.value)
        )
      )
        e.removeAttribute(attr.name);
    }
  });
  const safeCss = css.replace(/</g, '\\3c ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>Exercise preview</title><style>html{color-scheme:light}body{margin:16px;font:16px/1.5 system-ui,sans-serif;color:#172033;background:#fff}input,textarea,select,button{font:inherit;max-width:100%}img{color:#172033}p{overflow-wrap:break-word}</style><style>${safeCss}</style></head><body>${template.innerHTML}</body></html>`;
}
export const sourceFor = (exercise: WebExercise, code: string) =>
  previewDocument(
    exercise.topic === 'html' ? code : (exercise.markup ?? ''),
    exercise.topic === 'css' ? code : '',
  );
export function preventNavigation(doc: Document) {
  doc.addEventListener('click', (e) => {
    const link = (e.target as Element)?.closest?.('a');
    if (!link) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    const target = href?.startsWith('#') ? doc.getElementById(href.slice(1)) : null;
    target?.scrollIntoView();
    target?.focus({ preventScroll: true });
  });
  doc.addEventListener('submit', (e) => e.preventDefault());
}
export interface WebResult {
  name: string;
  hint: string;
  pass: boolean;
  width: number;
}
export async function gradeWeb(
  exercise: WebExercise,
  code: string,
  finish: boolean,
  signal: AbortSignal,
): Promise<WebResult[]> {
  if (code.length > 50000) throw Error('Keep your solution under 50,000 characters.');
  const checks = finish ? exercise.checks : exercise.checks.slice(0, 3);
  const source = sourceFor(exercise, code);
  const results: WebResult[] = [];
  const previousFocus = document.activeElement as HTMLElement | null;
  // Fresh frames at actual viewport widths keep previews independent of the app's layout.
  for (const width of [...new Set(checks.map((c) => c.width))]) {
    if (signal.aborted) throw Error('Checks cancelled.');
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.title = 'Isolated layout checks';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = `position:fixed;left:-12000px;top:0;width:${width}px;height:900px;border:0;pointer-events:none;`;
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => done(Error('Preview could not load. Run the checks again.')),
          5000,
        );
        const cancel = () => done(Error('Checks cancelled.'));
        const done = (error?: Error) => {
          clearTimeout(timeout);
          signal.removeEventListener('abort', cancel);
          frame.onload = null;
          error ? reject(error) : resolve();
        };
        signal.addEventListener('abort', cancel, { once: true });
        frame.onload = () => done();
        frame.srcdoc = source;
        document.body.append(frame);
      });
      if (signal.aborted) throw Error('Checks cancelled.');
      const doc = frame.contentDocument;
      if (!doc) throw Error('The preview document is unavailable.');
      preventNavigation(doc);
      for (const check of checks.filter((c) => c.width === width)) {
        let pass = false;
        try {
          pass = check.test(doc) === true;
        } catch {
          /* Missing or malformed required elements fail this check. */
        }
        results.push({ name: check.name, hint: check.hint, width, pass });
      }
    } finally {
      const hadFocus = document.activeElement === frame;
      frame.remove();
      if (hadFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }
  }
  return checks.map((c) => results.find((r) => r.name === c.name && r.width === c.width)!);
}
