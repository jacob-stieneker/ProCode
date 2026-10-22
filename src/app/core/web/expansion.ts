import { WebCheck, WebExercise, webExerciseInfo } from './model';
import {
  all,
  one,
  text,
  visible,
  labelled,
  readable,
  fits,
  near,
  style,
  focusRing,
  stack,
  row,
} from './checks';
const check = (
  name: string,
  hint: string,
  test: WebCheck['test'],
  width: 360 | 960 = 960,
): WebCheck => ({ name, hint, test, width });
const fit = () => check('Fits a phone', 'Keep the page within a 360px viewport.', fits, 360);
const exercise = (
  id: string,
  content: Omit<WebExercise, 'id' | 'title' | 'topic' | 'difficulty' | 'version'>,
): WebExercise => ({ ...webExerciseInfo.find((e) => e.id === id)!, ...content });
function validNumber(d: Document, value: string, expected: boolean) {
  const input = d.querySelector<HTMLInputElement>('input[name="quantity"]');
  if (!input) return false;
  input.value = value;
  return input.checkValidity() === expected;
}
function described(d: Document, selector: string) {
  const control = one(d, selector);
  return (
    !!control &&
    visible(control) &&
    (control.getAttribute('aria-describedby') || '').split(/\s+/).some((id) => {
      const help = d.getElementById(id);
      return visible(help) && text(help).length > 0;
    })
  );
}
export const webExpansion: WebExercise[] = [
  exercise('html-search', {
    description:
      'Build a native search form that works with labels, keyboard submission and an explicit empty choice.',
    requirements: [
      'Use a form with role="search" and an accessible name via aria-label or aria-labelledby. Include a labelled required type="search" input named q.',
      'Add a labelled select named category with values "" (the initial All topics option), algorithms and angular. Keep both fields editable.',
      'Provide a native submit button labelled Search. This local preview checks semantics and native validation, not network submission.',
    ],
    starter: '<form>\n  <!-- Add search controls. -->\n</form>',
    hints: [
      'The search landmark can be the form itself.',
      'A label must wrap its control or target its id.',
      'Use native controls so Enter and keyboard selection work without custom scripts.',
    ],
    explanation:
      'Native forms provide keyboard behavior and a validation foundation. A named search landmark helps assistive-technology users find the feature.',
    checks: [
      check(
        'Named search landmark',
        'Use a visible form with role search and a nonempty accessible name.',
        (d) => {
          const f = one(d, 'form[role="search"]');
          return (
            visible(f) &&
            !!(
              f?.getAttribute('aria-label')?.trim() ||
              (f?.getAttribute('aria-labelledby') || '')
                .split(/\s+/)
                .map((id) => text(d.getElementById(id)))
                .join('')
                .trim()
            )
          );
        },
      ),
      check(
        'Labelled search input',
        'Use an enabled labelled required search input named q.',
        (d) => labelled(d, 'form input[name="q"][type="search"][required]'),
      ),
      check('Labelled topic selection', 'Use a labelled select named category.', (d) =>
        labelled(d, 'form select[name="category"]'),
      ),
      check(
        'Category options',
        'Start with the empty All topics choice and include algorithms and angular.',
        (d) => {
          const s = d.querySelector<HTMLSelectElement>('select[name="category"]');
          return (
            !!s &&
            s.value === '' &&
            ['', 'algorithms', 'angular'].every((v) =>
              Array.from(s.options).some((o) => o.value === v && text(o) && !o.disabled),
            )
          );
        },
      ),
      check(
        'Empty search rejected',
        'A blank search must fail native validation; a word must pass.',
        (d) => {
          const i = d.querySelector<HTMLInputElement>('input[name="q"]');
          if (!i) return false;
          i.value = '';
          const empty = i.checkValidity();
          i.value = 'arrays';
          return !empty && i.checkValidity();
        },
      ),
      check('Native submit control', 'Provide an enabled Search submit button.', (d) =>
        all(d, 'form button[type="submit"]').some(
          (e) => visible(e) && text(e) === 'Search' && !e.matches(':disabled'),
        ),
      ),
      fit(),
    ],
  }),
  exercise('html-checkout', {
    description: 'Build a shipping form with autofill hints and native quantity boundaries.',
    requirements: [
      'Inside a form, include labelled required inputs named fullName, email and postalCode. Use autocomplete="name", "email" and "postal-code" respectively; email must use type="email".',
      'Add a labelled required number input named quantity accepting integers from 1 through 5. Empty, fractional and out-of-range values must fail native validation.',
      'Give quantity visible help referenced by aria-describedby. Add an enabled submit button with descriptive text. No payment details or real requests are involved.',
    ],
    starter: '<form>\n  <!-- Shipping details and quantity. -->\n</form>',
    hints: [
      'Autocomplete tokens identify the purpose of personal-data fields.',
      'Use min, max and step alongside required and type=number.',
      'Reference the help element’s id from aria-describedby.',
    ],
    explanation:
      'Native constraints reduce avoidable input mistakes. Labels, autofill purpose and associated instructions address different accessibility needs. A real backend must still validate every submitted value.',
    checks: [
      check(
        'Name and email purpose',
        'Label required name/email fields and supply the matching autocomplete tokens.',
        (d) =>
          labelled(d, 'input[name="fullName"][required][autocomplete="name"]') &&
          labelled(d, 'input[name="email"][required][type="email"][autocomplete="email"]'),
      ),
      check(
        'Postal purpose',
        'Label a required postalCode field with postal-code autocomplete.',
        (d) => labelled(d, 'input[name="postalCode"][required][autocomplete="postal-code"]'),
      ),
      check(
        'Quantity and associated help',
        'Label an editable required number quantity and associate visible instructions.',
        (d) =>
          labelled(d, 'input[name="quantity"][type="number"][required]') &&
          described(d, 'input[name="quantity"]'),
      ),
      check(
        'Inclusive boundaries',
        'Accept both 1 and 5.',
        (d) => validNumber(d, '1', true) && validNumber(d, '5', true),
      ),
      check('Invalid quantities rejected', 'Reject empty, 0, 6 and 2.5.', (d) =>
        ['', '0', '6', '2.5'].every((v) => validNumber(d, v, false)),
      ),
      check('Submit button', 'Use an enabled visible native submit button.', (d) =>
        all(d, 'form button[type="submit"]').some(
          (e) => visible(e) && text(e) && !e.matches(':disabled'),
        ),
      ),
      fit(),
    ],
  }),
  exercise('html-errors', {
    description:
      'Mark up a form after server validation has rejected two fields, making errors discoverable and linked to the right inputs.',
    requirements: [
      'Use one main with one h1. Build a form with labelled editable email and password inputs named email and password, using the corresponding native types. Mark both aria-invalid="true".',
      'Give each field its own visible error message, referenced by aria-describedby. The email message must contain "email" and the password message "password" (case-insensitive).',
      'Add a focusable error summary with role="alert", tabindex="-1", a heading and a list of links to both field IDs. Each link must have descriptive text. Add an enabled submit button. This static exercise represents an already-invalid form; it does not ask you to announce errors before validation.',
    ],
    starter: '<main>\n  <!-- Error summary and invalid form. -->\n</main>',
    hints: [
      'Give the summary programmatic focus with tabindex=-1, without placing it in the normal tab order.',
      'Use links whose fragments match the actual input IDs.',
      'aria-invalid identifies the state; aria-describedby associates the explanation.',
    ],
    explanation:
      'A linked summary helps users navigate a failed submission, while field-level associations keep the reason available at each control. Dynamic focus and announcement timing belong in the application code.',
    checks: [
      check(
        'Page structure',
        'Use one main and one visible h1.',
        (d) => all(d, 'main').length === 1 && all(d, 'h1').length === 1 && readable(d, 'main h1'),
      ),
      check(
        'Invalid labelled fields',
        'Use labelled native email/password inputs with aria-invalid=true.',
        (d) =>
          labelled(d, 'form input[name="email"][type="email"][aria-invalid="true"]') &&
          labelled(d, 'form input[name="password"][type="password"][aria-invalid="true"]'),
      ),
      check(
        'Distinct field explanations',
        'Associate a visible field-specific error with each input.',
        (d) => {
          const errors = ['email', 'password'].map((name) =>
            (one(d, `input[name="${name}"]`)?.getAttribute('aria-describedby') || '')
              .split(/\s+/)
              .filter(
                (id) =>
                  visible(d.getElementById(id)) &&
                  text(d.getElementById(id)).toLowerCase().includes(name),
              ),
          );
          return errors[0].some((emailId) =>
            errors[1].some((passwordId) => emailId !== passwordId),
          );
        },
      ),
      check(
        'Focusable alert summary',
        'Use a visible alert with tabindex=-1 and a heading.',
        (d) => {
          const e = one(d, '[role="alert"][tabindex="-1"]');
          if (!visible(e) || !e?.querySelector('h2,h3')) return false;
          e.focus();
          return d.activeElement === e;
        },
      ),
      check(
        'Summary reaches both fields',
        'Place descriptive links to both input IDs in the summary list.',
        (d) =>
          ['email', 'password'].every((name) => {
            const target = one(d, `input[name="${name}"]`);
            return (
              !!target?.id &&
              all(d, '[role="alert"] li a').some(
                (a) => visible(a) && !!text(a) && a.getAttribute('href') === '#' + target.id,
              )
            );
          }),
      ),
      check('Retry submission', 'Provide an enabled visible submit button inside the form.', (d) =>
        all(d, 'form button[type="submit"]').some(
          (e) => visible(e) && text(e) && !e.matches(':disabled'),
        ),
      ),
      fit(),
    ],
  }),
  exercise('css-center', {
    description:
      'Center a compact empty-state panel in its available space without fixing its position to the browser window.',
    requirements: [
      'Keep .stage at least 320px tall and center .panel horizontally and vertically inside it at 960px and 360px viewport widths.',
      'Give .panel at least 16px padding, a visible border, and a rendered width of at most 320px. Keep all text visible without page overflow. Use any equivalent layout approach.',
    ],
    markup:
      '<main class="stage"><section class="panel"><h1>No projects yet</h1><p>Create a project to begin practicing.</p><button>Create project</button></section></main>',
    starter: '.stage { min-height: 320px; }\n.panel { width: 480px; }',
    hints: [
      'Flexbox and Grid both support alignment on two axes.',
      'Use box-sizing and a responsive width so padding stays inside the panel.',
      'Measure the panel relative to its container, not the viewport.',
    ],
    explanation:
      'Container-based centering adapts when the surrounding layout changes. Responsive size limits prevent a centered element from overflowing small screens.',
    checks: [
      ...([960, 360] as const).flatMap((width) => [
        check(
          `Centered at ${width}px`,
          'Center the visible panel on both axes inside the stage.',
          (d) => {
            const a = one(d, '.stage'),
              b = one(d, '.panel');
            if (!visible(a) || !visible(b)) return false;
            const x = a!.getBoundingClientRect(),
              y = b!.getBoundingClientRect();
            return (
              x.height >= 320 &&
              near(x.left + x.width / 2, y.left + y.width / 2) &&
              near(x.top + x.height / 2, y.top + y.height / 2)
            );
          },
          width,
        ),
        check(
          `Readable panel at ${width}px`,
          'Keep panel width at most 320px, with 16px padding and a visible border.',
          (d) => {
            const p = one(d, '.panel');
            if (!visible(p)) return false;
            const s = style(p!);
            return (
              p!.getBoundingClientRect().width <= 321 &&
              ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].every(
                (k) => parseFloat((s as any)[k]) >= 16,
              ) &&
              parseFloat(s.borderTopWidth) >= 1 &&
              !['transparent', 'rgba(0, 0, 0, 0)'].includes(s.borderTopColor) &&
              readable(d, '.panel h1') &&
              readable(d, '.panel p')
            );
          },
          width,
        ),
      ]),
      check('Button remains usable', 'Keep the visible button at least 24px tall.', (d) => {
        const e = one(d, 'button');
        return visible(e) && e!.getBoundingClientRect().height >= 24;
      }),
      fit(),
    ],
  }),
  exercise('css-sticky', {
    description: 'Keep a data-table header visible while a bounded results panel scrolls.',
    requirements: [
      'Make .results a vertical scroll container between 160px and 240px tall at desktop and phone widths. All supplied rows must remain visible through scrolling.',
      'Keep every thead th at the top of .results while its body scrolls. Use sticky positioning with an opaque header background. Keep the table within the page width and do not hide rows.',
    ],
    markup:
      '<main><h1>Build history</h1><div class="results" tabindex="0" aria-label="Build results"><table><thead><tr><th>Build</th><th>Status</th></tr></thead><tbody>' +
      Array.from({ length: 16 }, (_, i) => `<tr><td>Build ${i + 1}</td><td>Passed</td></tr>`).join(
        '',
      ) +
      '</tbody></table></div></main>',
    starter: '.results { height: 200px; }\ntable { width: 100%; }\nth, td { padding: 10px; }',
    hints: [
      'Overflow belongs on the bounded results panel.',
      'Sticky cells need a top inset and an opaque background.',
      'Check behavior after scrolling, not only the initial position.',
    ],
    explanation:
      'Sticky table headers preserve context in long result sets. The nearest scrolling ancestor and the inset determine where the header sticks.',
    checks: [
      ...([960, 360] as const).flatMap((width) => [
        check(
          `Scrollable results at ${width}px`,
          'Use vertical auto/scroll overflow and a height from 160px to 240px.',
          (d) => {
            const e = one(d, '.results');
            return (
              visible(e) &&
              e!.clientHeight >= 160 &&
              e!.clientHeight <= 240 &&
              e!.scrollHeight > e!.clientHeight &&
              ['auto', 'scroll'].includes(style(e!).overflowY)
            );
          },
          width,
        ),
        check(
          `Header follows scroll at ${width}px`,
          'Use sticky top headers with an opaque background inside the scrolling results.',
          (d) => {
            const panel = one(d, '.results');
            if (!panel) return false;
            panel.scrollTop = 120;
            const top = panel.getBoundingClientRect().top + panel.clientTop;
            return (
              panel.scrollTop > 50 &&
              all(d, 'thead th').every(
                (e) =>
                  visible(e) &&
                  style(e).position === 'sticky' &&
                  near(e.getBoundingClientRect().top, top, 3) &&
                  !['transparent', 'rgba(0, 0, 0, 0)'].includes(style(e).backgroundColor),
              )
            );
          },
          width,
        ),
      ]),
      check(
        'Rows remain present',
        'Keep all sixteen rows visible and readable.',
        (d) => all(d, 'tbody tr').length === 16 && readable(d, 'tbody td', 32),
      ),
      fit(),
    ],
  }),
  exercise('css-form-layout', {
    description:
      'Build a resilient settings form that uses aligned columns on wide screens and a readable vertical flow on phones.',
    requirements: [
      'At 960px, align every .field label to the left of its input, with all input left edges aligned. Keep .actions buttons on one row.',
      'At 360px, place each label above its input and stack the action buttons in source order. All fields, long help text and controls must fit without overlap or clipping.',
      'Inputs and buttons must be at least 40px tall. Provide a visible focus outline of at least 2px or a box-shadow on inputs. Use any equivalent layout technique.',
    ],
    markup:
      '<main><h1>Account settings</h1><form><div class="field"><label for="display">Display name</label><input id="display" value="Ada"></div><div class="field"><label for="contact">Notification email address</label><input id="contact" type="email" value="ada@example.test"></div><p class="help">Notifications include account changes and weekly project activity. This description must remain readable when the available width is narrow.</p><div class="actions"><button type="submit">Save changes</button><button type="button">Cancel</button></div></form></main>',
    starter: '.field { display: flex; }\ninput { width: 600px; }\n.actions { display: flex; }',
    hints: [
      'A shared label column width aligns independent field rows.',
      'At the narrow breakpoint, switch fields and actions to a vertical layout.',
      'Use min-width:0, border-box sizing and wrapping to accommodate intrinsic content widths.',
    ],
    explanation:
      'Forms must remain usable when labels, viewport size or text length change. Responsive alignment and keyboard focus matter more than prescribing Grid or Flexbox.',
    checks: [
      check(
        'Wide field alignment',
        'Put labels beside inputs, aligning every input left edge.',
        (d) => {
          const fields = all(d, '.field');
          const inputs = all(d, '.field input');
          return (
            fields.every((e) => {
              const a = e.querySelector('label')!.getBoundingClientRect(),
                b = e.querySelector('input')!.getBoundingClientRect();
              return b.left >= a.right && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
            }) &&
            near(inputs[0].getBoundingClientRect().left, inputs[1].getBoundingClientRect().left)
          );
        },
      ),
      check('Wide action row', 'Keep both buttons in one row.', (d) => row(d, '.actions button')),
      check(
        'Narrow field flow',
        'Place each label above its input with no overlap.',
        (d) =>
          all(d, '.field').every((e) => {
            const a = e.querySelector('label')!,
              b = e.querySelector('input')!;
            return (
              visible(a) &&
              visible(b) &&
              b.getBoundingClientRect().top >= a.getBoundingClientRect().bottom
            );
          }),
        360,
      ),
      check(
        'Narrow action stack',
        'Stack the buttons in their original order.',
        (d) => stack(d, '.actions button'),
        360,
      ),
      check(
        'Readable controls and help',
        'Keep controls at least 40px tall and show all help text.',
        (d) =>
          all(d, 'input,button').every(
            (e) => visible(e) && e.getBoundingClientRect().height >= 40,
          ) &&
          readable(d, '.help') &&
          one(d, '.help')!.scrollHeight <= one(d, '.help')!.clientHeight + 1,
        360,
      ),
      check('Keyboard focus', 'Give focused inputs a visible outline or box-shadow.', (d) =>
        focusRing(d, 'input'),
      ),
      fit(),
    ],
  }),
];
