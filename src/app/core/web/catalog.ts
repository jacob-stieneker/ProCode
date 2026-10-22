import { webExpansion } from './expansion';
import { WebCheck, WebExercise, webExerciseInfo } from './model';
import {
  all,
  one,
  text,
  style,
  visible,
  readable,
  fits,
  near,
  labelled,
  stack,
  row,
  focusRing,
  anchored,
} from './checks';
const check = (
  name: string,
  hint: string,
  test: WebCheck['test'],
  width: 360 | 960 = 960,
): WebCheck => ({ name, hint, test, width });
const fit = () =>
  check(
    'Fits a narrow viewport',
    'Keep content within the viewport; avoid fixed widths that exceed the available space.',
    fits,
    360,
  );
const exercise = (
  id: string,
  content: Omit<WebExercise, keyof (typeof webExerciseInfo)[number]>,
) => ({ ...webExerciseInfo.find((e) => e.id === id)!, ...content });
const dotImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
export const webExercises: WebExercise[] = [
  exercise('html-profile', {
    description:
      'Build a semantic developer profile with a skills list and a working projects link.',
    requirements: [
      'Use one main containing one h1, a nonempty introduction paragraph, and an unordered skills list with at least three items.',
      'Add a link to a projects section on the same page. Give that section an id and an h2.',
      'Choose your own text and identifiers. All required content must be visible.',
    ],
    starter: '<!-- Build your profile here. -->\n',
    hints: [
      'Start with main, h1, and p.',
      'Use ul and li for the skills. Link with href="#your-id".',
      'A section id must match the link fragment exactly. Put an h2 inside the section.',
    ],
    explanation:
      'Native landmarks, headings, lists, and links communicate structure to browsers and assistive technology without extra ARIA.',
    checks: [
      check(
        'One main landmark',
        'Use exactly one visible main.',
        (d) => all(d, 'main').length === 1 && visible(one(d, 'main')),
      ),
      check(
        'Profile heading and introduction',
        'Place one h1 and a paragraph inside main.',
        (d) => all(d, 'h1').length === 1 && readable(d, 'main h1') && readable(d, 'main p'),
      ),
      check('Skills list', 'Use at least three nonempty li elements in a ul inside main.', (d) =>
        readable(d, 'main ul > li', 3),
      ),
      check('Projects section', 'Give a section an id and a visible h2.', (d) =>
        readable(d, 'main section[id] h2'),
      ),
      check(
        'Working projects link',
        'Link to the id of your headed projects section.',
        (d) =>
          anchored(d, 'main a') &&
          all(d, 'main a').some(
            (a) =>
              !!d
                .getElementById((a.getAttribute('href') ?? '').slice(1))
                ?.matches('section:has(h2)'),
          ),
      ),
      fit(),
    ],
  }),
  exercise('html-contact', {
    description: 'Create a contact form using native labels and validation.',
    requirements: [
      'Inside a form, include required name (name="name"), email (name="email", type="email"), and message (textarea, name="message") fields.',
      'Give each field a visible, associated label. Use a native submit button with descriptive text.',
      'Use native required and email validation. Form submission is disabled in this local preview.',
    ],
    starter: '<form>\n  <!-- Add the contact fields. -->\n</form>\n',
    hints: [
      'A label can wrap its control or use for with a matching id.',
      'Use required on every field and type="email" on the email input.',
      'Place a button with type="submit" inside the form. Placeholders do not replace labels.',
    ],
    explanation:
      'Labels provide an accessible name and a larger click target. Native input types and required constraints handle basic validation without JavaScript.',
    checks: [
      check('Name field', 'Add a labelled required input named name.', (d) =>
        labelled(d, 'form input[name="name"][required]'),
      ),
      check('Email field', 'Add a labelled required email input named email.', (d) =>
        labelled(d, 'form input[name="email"][type="email"][required]'),
      ),
      check('Message field', 'Add a labelled required textarea named message.', (d) =>
        labelled(d, 'form textarea[name="message"][required]'),
      ),
      check(
        'Submit control',
        'Use a visible, enabled submit button inside form.',
        (d) =>
          readable(d, 'form button[type="submit"]') &&
          !d.querySelector<HTMLButtonElement>('form button[type="submit"]')!.disabled,
      ),
      check(
        'Native email validation',
        'The email field must reject malformed addresses and accept valid ones.',
        (d) => {
          const e = d.querySelector<HTMLInputElement>('input[name="email"]');
          if (!e) return false;
          e.value = 'invalid';
          const rejected = !e.checkValidity();
          e.value = 'dev@example.com';
          return rejected && e.checkValidity();
        },
      ),
      fit(),
    ],
  }),
  exercise('html-table', {
    description: 'Present a team directory as an accessible data table.',
    requirements: [
      'Use one table with a descriptive caption, a thead, and a tbody.',
      'Provide three column headers with scope="col" for Name, Role, and Location (wording may vary).',
      'Add at least three body rows, each containing a named row header with scope="row" and two nonempty data cells. Keep every row at three columns.',
    ],
    starter: '<table>\n  <!-- Add the caption, headers, and team rows. -->\n</table>\n',
    hints: [
      'Caption names the table; thead and tbody divide its header and data.',
      'Use th with scope="col" for column headings.',
      'Start each body row with th scope="row", followed by two td cells.',
    ],
    explanation:
      'Caption and header associations give tabular data context. Tables are appropriate for relationships between rows and columns, rather than page layout.',
    checks: [
      check(
        'Table caption',
        'Use one table with a visible nonempty caption.',
        (d) => all(d, 'table').length === 1 && readable(d, 'table > caption'),
      ),
      check(
        'Column headers',
        'Add three scoped column headers inside thead.',
        (d) =>
          all(d, 'thead th[scope="col"]').length === 3 && readable(d, 'thead th[scope="col"]', 3),
      ),
      check(
        'Body rows',
        'Put at least three rows inside tbody.',
        (d) => all(d, 'tbody tr').length >= 3,
      ),
      check(
        'Named row headers',
        'Each body row needs one visible th with scope="row".',
        (d) =>
          all(d, 'tbody tr').length >= 3 &&
          all(d, 'tbody tr').every(
            (r) =>
              r.querySelectorAll('th[scope="row"]').length === 1 &&
              !!text(r.querySelector('th')) &&
              visible(r.querySelector('th')),
          ),
      ),
      check(
        'Complete data cells',
        'Each body row needs two nonempty td cells and exactly three cells overall.',
        (d) =>
          all(d, 'tbody tr').length >= 3 &&
          all(d, 'tbody tr').every(
            (r) =>
              r.children.length === 3 &&
              r.querySelectorAll('td').length === 2 &&
              Array.from(r.querySelectorAll('td')).every((e) => visible(e) && !!text(e)),
          ),
      ),
      fit(),
    ],
  }),
  exercise('html-signup', {
    description: 'Build a registration form with a labelled plan group and native constraints.',
    requirements: [
      'Use a form with a fieldset and a nonempty legend for the plan choices.',
      'Provide at least two enabled, individually labelled radio inputs sharing name="plan", with distinct nonempty values. Make the group required.',
      'Add a labelled password input named password with required and minlength="8", a labelled required terms checkbox named terms, and a submit button.',
    ],
    starter: '<form>\n  <!-- Build the registration form. -->\n</form>\n',
    hints: [
      'Fieldset and legend name related controls as a group.',
      'Radio buttons need the same name to make the choices mutually exclusive.',
      'Use visible labels for each control and native required/minlength attributes.',
    ],
    explanation:
      'Group names and individual labels serve different purposes. Native radio grouping prevents contradictory selections; native constraints express basic form rules.',
    checks: [
      check(
        'Named plan group',
        'Place plan radios inside a fieldset with a legend.',
        (d) =>
          readable(d, 'form fieldset > legend') &&
          all(d, 'form fieldset input[type="radio"][name="plan"]').length >= 2,
      ),
      check(
        'Labelled plan choices',
        'Each radio needs an associated visible label and a distinct value.',
        (d) => {
          const rs = Array.from(
            d.querySelectorAll<HTMLInputElement>('fieldset input[type="radio"][name="plan"]'),
          );
          return (
            rs.length >= 2 &&
            new Set(rs.map((r) => r.value)).size === rs.length &&
            rs.every(
              (r) =>
                !r.disabled &&
                r.hasAttribute('value') &&
                !!r.value &&
                visible(r) &&
                Array.from(r.labels ?? []).some((l) => visible(l) && !!text(l)),
            )
          );
        },
      ),
      check(
        'Password constraints',
        'Use a labelled required password with a minimum length of eight.',
        (d) => labelled(d, 'form input[name="password"][type="password"][required][minlength="8"]'),
      ),
      check(
        'Required plan selection',
        'At least one radio in the plan group must carry required.',
        (d) => {
          const rs = Array.from(
            d.querySelectorAll<HTMLInputElement>('input[type="radio"][name="plan"]'),
          );
          rs.forEach((r) => (r.checked = false));
          return rs.length >= 2 && rs.some((r) => r.required && !r.checkValidity());
        },
      ),
      check(
        'Terms and submit',
        'Include a labelled required terms checkbox and a submit button.',
        (d) =>
          labelled(d, 'form input[type="checkbox"][name="terms"][required]') &&
          readable(d, 'form button[type="submit"]'),
      ),
      fit(),
    ],
  }),
  exercise('html-document', {
    description:
      'Build an accessible article page with a skip link and distinct navigation landmarks.',
    requirements: [
      'The first link must skip to the one main element, which has id and tabindex="-1". Include a header outside main and one h1 inside main.',
      'Provide two navigation landmarks with different nonempty accessible names using aria-label or aria-labelledby.',
      'Inside main, add an article with at least two headed sections (h2). Navigation links must target visible ids on the page. Use unique ids throughout.',
    ],
    starter: '<!-- Add skip navigation, page header, named navigation, and main article. -->\n',
    hints: [
      'Start with an anchor whose fragment matches the main id.',
      'Use aria-label, or aria-labelledby pointing to a nonempty heading, to distinguish navigation landmarks.',
      'A skip target with tabindex="-1" can receive focus without adding a normal Tab stop.',
    ],
    explanation:
      'Skip navigation shortens repetitive keyboard navigation. Distinct landmark names and a coherent heading hierarchy make a complex document easier to explore.',
    checks: [
      check(
        'Skip target',
        'The first link must target the single main with tabindex="-1".',
        (d) => {
          const m = one(d, 'main'),
            a = one(d, 'a');
          return (
            all(d, 'main').length === 1 &&
            visible(m) &&
            !!m?.id &&
            m.getAttribute('tabindex') === '-1' &&
            a?.getAttribute('href') === '#' + m.id &&
            visible(a)
          );
        },
      ),
      check(
        'Header and primary heading',
        'Put a header outside main and exactly one h1 inside main.',
        (d) =>
          all(d, 'header').some((h) => !h.closest('main') && visible(h)) &&
          all(d, 'h1').length === 1 &&
          readable(d, 'main h1'),
      ),
      check('Distinct navigation names', 'Name both navigation landmarks differently.', (d) => {
        const ns = all(d, 'nav');
        const names = ns.map(
          (n) =>
            n.getAttribute('aria-label')?.trim() ||
            (n.getAttribute('aria-labelledby') ?? '')
              .split(/\s+/)
              .map((id) => text(d.getElementById(id)))
              .join(' ')
              .trim(),
        );
        return (
          ns.length === 2 && ns.every(visible) && names.every(Boolean) && new Set(names).size === 2
        );
      }),
      check(
        'Article structure',
        'Use at least two sections with h2 headings inside the main article.',
        (d) => readable(d, 'main article section h2', 2),
      ),
      check(
        'Valid navigation targets',
        'All navigation links must point to existing, visible page targets.',
        (d) => anchored(d, 'nav a') && all(d, 'nav').every((n) => !!n.querySelector('a')),
      ),
      check('Unique ids', 'Do not repeat ids; each target must identify one element.', (d) => {
        const ids = all(d, '[id]').map((e) => e.id);
        return ids.every(Boolean) && new Set(ids).size === ids.length;
      }),
      fit(),
    ],
  }),
  exercise('html-disclosure', {
    description: 'Create an FAQ with native disclosures and an accessible diagram caption.',
    requirements: [
      'Inside one main, add one h1 and at least three details elements. Each details needs a nonempty summary as its first element, followed by a nonempty answer paragraph.',
      'Leave all disclosures closed initially; they must open without JavaScript.',
      'Add a figure containing an img with meaningful alt text and a nonempty figcaption. Use the provided data image or another data image; remote assets are disabled.',
    ],
    starter: `<main>\n  <!-- Add the FAQ and figure. -->\n  <img src="${dotImage}" alt="">\n</main>\n`,
    hints: [
      'Details and summary provide native disclosure behavior.',
      'Keep summary first and the answer outside it, inside the details element.',
      'A caption describes the figure in context; alt provides a text alternative for its image.',
    ],
    explanation:
      'Native disclosure widgets supply keyboard interaction and state without custom scripts. Alt text and captions complement each other and should convey useful information.',
    checks: [
      check(
        'Main heading',
        'Use one main and one visible h1 inside it.',
        (d) => all(d, 'main').length === 1 && all(d, 'h1').length === 1 && readable(d, 'main h1'),
      ),
      check(
        'Named disclosures',
        'Give each of at least three details a first-child summary.',
        (d) =>
          all(d, 'main details').length >= 3 &&
          all(d, 'main details').every(
            (e) =>
              e.firstElementChild?.tagName === 'SUMMARY' &&
              visible(e.firstElementChild) &&
              !!text(e.firstElementChild),
          ),
      ),
      check(
        'Answer content',
        'Put a nonempty paragraph after each summary.',
        (d) =>
          all(d, 'main details').length >= 3 &&
          all(d, 'main details').every((e) => !!text(e.querySelector(':scope > p'))),
      ),
      check(
        'Native opening behavior',
        'Leave details closed initially and preserve its native opening behavior.',
        (d) => {
          const ds = Array.from(d.querySelectorAll<HTMLDetailsElement>('details'));
          if (ds.length < 3 || ds.some((e) => e.open)) return false;
          return ds.every((e) => {
            e.open = true;
            return visible(e.querySelector('p'));
          });
        },
      ),
      check(
        'Accessible figure',
        'Put a data image with meaningful alt text and a caption in figure.',
        (d) => {
          const img = d.querySelector<HTMLImageElement>('figure img');
          return (
            visible(img) &&
            !!img?.alt.trim() &&
            img.alt.trim().length >= 4 &&
            img.src.startsWith('data:image/') &&
            readable(d, 'figure figcaption')
          );
        },
      ),
      fit(),
    ],
  }),
  exercise('css-card', {
    description: 'Style a readable card that fits its container.',
    markup:
      '<article class="card"><h1>Developer profile</h1><p>Building thoughtful interfaces with HTML and CSS.</p></article>',
    starter: '.card {\n  /* Style the card. */\n}\n',
    requirements: [
      'Give .card a rendered width of 320px at desktop, at least 20px padding on every side, and rounded corners of at least 8px.',
      'Use a visible solid border at least 1px wide. Keep the card within a 360px viewport.',
      'Keep its text visible and contained. Any CSS technique that achieves these results is accepted.',
    ],
    hints: [
      'Border-box sizing makes width include padding and borders.',
      'Combine width and max-width to handle narrow containers.',
      'Use padding, border, and border-radius on .card.',
    ],
    explanation:
      'The box model combines content, padding, and borders. Border-box sizing often makes bounded components easier to reason about.',
    checks: [
      check(
        'Desktop card width',
        'The outer card width should be 320px, including padding and borders.',
        (d) => !!one(d, '.card') && near(one(d, '.card')!.getBoundingClientRect().width, 320),
      ),
      check('Inner spacing', 'All four padding values must be at least 20px.', (d) => {
        const e = one(d, '.card');
        return (
          !!e &&
          ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].every(
            (k) => parseFloat(style(e)[k as keyof CSSStyleDeclaration] as string) >= 20,
          )
        );
      }),
      check('Rounded corners', 'Use a radius of at least 8px on every corner.', (d) => {
        const e = one(d, '.card');
        return (
          !!e &&
          [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius',
          ].every((k) => parseFloat(style(e)[k as keyof CSSStyleDeclaration] as string) >= 8)
        );
      }),
      check('Visible border', 'Give the card a solid border of at least 1px.', (d) => {
        const e = one(d, '.card');
        return (
          !!e && style(e).borderTopStyle === 'solid' && parseFloat(style(e).borderTopWidth) >= 1
        );
      }),
      check(
        'Readable content',
        'Keep the heading and paragraph visible and inside the card.',
        (d) =>
          readable(d, '.card h1') &&
          readable(d, '.card p') &&
          one(d, '.card')!.scrollWidth <= one(d, '.card')!.clientWidth + 1,
      ),
      fit(),
    ],
  }),
  exercise('css-buttons', {
    description: 'Style an action button with clear disabled and keyboard-focus states.',
    markup:
      '<div class="actions"><button class="action">Save changes</button><button class="action" disabled>Unavailable</button></div>',
    starter: '.action {\n}\n\n.action:disabled {\n}\n\n.action:focus-visible {\n}\n',
    requirements: [
      'Make both .action buttons at least 44px tall with at least 16px horizontal padding and a pointer cursor on the enabled button.',
      'Use white text on a #2563eb background for the enabled button.',
      'Give the disabled button a distinct background and a not-allowed cursor. Add a visible keyboard-focus outline at least 2px thick, or a box shadow.',
    ],
    hints: [
      'Use min-height and padding for a comfortable target.',
      'The :disabled pseudo-class styles the actual disabled state.',
      'Use :focus-visible with an outline or box-shadow; do not remove focus indication.',
    ],
    explanation:
      'Native buttons provide keyboard activation and disabled behavior. Styling should make those states visible without replacing their semantics.',
    checks: [
      check(
        'Comfortable targets',
        'Each button needs at least 44px height and 16px left/right padding.',
        (d) =>
          all(d, '.action').every(
            (e) =>
              e.getBoundingClientRect().height >= 44 &&
              parseFloat(style(e).paddingLeft) >= 16 &&
              parseFloat(style(e).paddingRight) >= 16,
          ),
      ),
      check('Action colors', 'Use white text and #2563eb on the enabled button.', (d) => {
        const s = style(one(d, '.action:not(:disabled)')!);
        return s.color === 'rgb(255, 255, 255)' && s.backgroundColor === 'rgb(37, 99, 235)';
      }),
      check(
        'Pointer affordance',
        'Use cursor: pointer on the enabled action.',
        (d) => style(one(d, '.action:not(:disabled)')!).cursor === 'pointer',
      ),
      check(
        'Disabled state',
        'Use a different background and cursor: not-allowed when disabled.',
        (d) => {
          const a = style(one(d, '.action:not(:disabled)')!),
            b = style(one(d, '.action:disabled')!);
          return b.cursor === 'not-allowed' && b.backgroundColor !== a.backgroundColor;
        },
      ),
      check(
        'Keyboard focus',
        'Add a focus outline at least 2px wide, or a visible box-shadow.',
        (d) => focusRing(d, '.action:not(:disabled)'),
      ),
      fit(),
    ],
  }),
  exercise('css-grid', {
    description: 'Arrange three cards in a responsive layout.',
    markup:
      '<div class="cards"><article class="card">HTML</article><article class="card">CSS</article><article class="card">JavaScript</article></div>',
    starter: '.cards {\n}\n\n.card {\n}\n',
    requirements: [
      'At 960px, place the three cards in one row with equal widths and gaps of at least 16px.',
      'At 360px, stack the cards in source order with gaps of at least 16px.',
      'Every card must be at least 80px tall. Keep the page within both viewports. Grid, flexbox, and other valid approaches are accepted.',
    ],
    hints: [
      'Use a layout container for the cards.',
      'A media query can change columns or flex direction at a narrow breakpoint.',
      'Give items flexible widths and let the container control the gap.',
    ],
    explanation:
      'Responsive layout describes how content should fit available space. Multiple CSS layout methods can satisfy the same visual behavior.',
    checks: [
      check('Desktop row', 'At 960px, all three cards must sit side by side.', (d) =>
        row(d, '.card'),
      ),
      check('Equal desktop widths', 'Make all three cards equal in rendered width.', (d) => {
        const rs = all(d, '.card').map((e) => e.getBoundingClientRect());
        return rs.every((r) => near(r.width, rs[0].width));
      }),
      check('Desktop gaps', 'Keep at least 16px between neighboring cards.', (d) => {
        const rs = all(d, '.card').map((e) => e.getBoundingClientRect());
        return rs.slice(1).every((r, i) => r.left - rs[i].right >= 15.5);
      }),
      check(
        'Mobile stack',
        'At 360px, stack all three cards vertically.',
        (d) => stack(d, '.card'),
        360,
      ),
      check(
        'Mobile gaps and height',
        'At 360px, keep every card 80px tall or more and vertical gaps of at least 16px.',
        (d) => {
          const rs = all(d, '.card').map((e) => e.getBoundingClientRect());
          return (
            rs.every((r) => r.height >= 80) &&
            rs.slice(1).every((r, i) => r.top - rs[i].bottom >= 15.5)
          );
        },
        360,
      ),
      check(
        'Desktop height and fit',
        'Keep cards at least 80px tall and avoid horizontal overflow.',
        (d) => fits(d) && all(d, '.card').every((e) => e.getBoundingClientRect().height >= 80),
      ),
      fit(),
    ],
  }),
  exercise('css-navigation', {
    description: 'Build a navigation bar that adapts to a narrow screen.',
    markup:
      '<nav class="navigation" aria-label="Main"><a href="#home">Home</a><a href="#projects">Projects</a><a href="#contact">Contact</a></nav><main id="home"><h1>Portfolio</h1><section id="projects">Projects</section><section id="contact">Contact</section></main>',
    starter: '.navigation {\n}\n\n.navigation a {\n}\n',
    requirements: [
      'At 960px, show the links in one row with gaps of at least 16px.',
      'At 360px, stack links vertically in source order. Make each link a target at least 44px tall at both sizes.',
      'Provide a keyboard-focus outline at least 2px thick or a box shadow for every link, and avoid page overflow.',
    ],
    hints: [
      'Use a flex or grid container for navigation.',
      'Apply padding or min-height to links rather than only the surrounding nav.',
      'Use a media query to change layout and :focus-visible for keyboard feedback.',
    ],
    explanation:
      'Adaptive navigation should preserve source order, usable targets, and focus visibility across screen sizes.',
    checks: [
      check('Desktop link row', 'Place links side by side at 960px.', (d) =>
        row(d, '.navigation a'),
      ),
      check('Desktop link spacing', 'Leave at least 16px between neighboring links.', (d) => {
        const rs = all(d, '.navigation a').map((e) => e.getBoundingClientRect());
        return rs.slice(1).every((r, i) => r.left - rs[i].right >= 15.5);
      }),
      check('Desktop targets', 'Make every desktop link at least 44px tall.', (d) =>
        all(d, '.navigation a').every((e) => e.getBoundingClientRect().height >= 44),
      ),
      check(
        'Mobile navigation',
        'Stack links and retain 44px target heights.',
        (d) =>
          stack(d, '.navigation a') &&
          all(d, '.navigation a').every((e) => e.getBoundingClientRect().height >= 44),
        360,
      ),
      check('Keyboard focus', 'Each link needs a visible focus indicator.', (d) =>
        all(d, '.navigation a').every((_, i) => focusRing(d, `.navigation a:nth-child(${i + 1})`)),
      ),
      fit(),
    ],
  }),
  exercise('css-dashboard', {
    description: 'Create an adaptive dashboard with a sidebar, content area, and footer.',
    markup:
      '<div class="dashboard"><header class="header">Dashboard</header><aside class="sidebar">Filters</aside><main class="content"><h1>Projects</h1><p>Review your current work.</p></main><footer class="footer">Project overview</footer></div>',
    starter: '.dashboard {\n}\n',
    requirements: [
      'At 960px, make the header and footer span the dashboard. Place a 200px-wide sidebar to the left of the flexible main content, with at least 16px between them.',
      'At 360px, show header, sidebar, main, and footer as separate vertical rows in source order, each spanning the dashboard width.',
      'Keep all content visible and avoid horizontal overflow. Use any layout technique.',
    ],
    hints: [
      'A grid with named areas can describe both layouts.',
      'The desktop sidebar can use a fixed track while main takes the remaining space.',
      'At the narrow breakpoint, switch to one column and reset spans or areas.',
    ],
    explanation:
      'Separate the document’s meaningful reading order from its visual layout. A responsive grid can rearrange tracks while preserving the source order.',
    checks: [
      check(
        'Sidebar and content alignment',
        'Place sidebar and main side by side with matching top edges.',
        (d) => {
          const a = one(d, '.sidebar')!.getBoundingClientRect(),
            b = one(d, '.content')!.getBoundingClientRect();
          return near(a.top, b.top) && b.left - a.right >= 15.5;
        },
      ),
      check('Sidebar width', 'The sidebar outer width should be 200px at desktop.', (d) =>
        near(one(d, '.sidebar')!.getBoundingClientRect().width, 200),
      ),
      check(
        'Spanning header and footer',
        'Header and footer should span the dashboard and surround its middle row.',
        (d) => {
          const box = one(d, '.dashboard')!.getBoundingClientRect(),
            h = one(d, '.header')!.getBoundingClientRect(),
            f = one(d, '.footer')!.getBoundingClientRect(),
            m = one(d, '.content')!.getBoundingClientRect();
          return (
            near(h.width, box.width) &&
            near(f.width, box.width) &&
            h.bottom <= m.top + 1 &&
            f.top >= m.bottom - 1
          );
        },
      ),
      check(
        'Mobile source order',
        'At 360px, stack header, sidebar, main, and footer.',
        (d) => stack(d, '.dashboard > *'),
        360,
      ),
      check(
        'Mobile full-width regions',
        'Each mobile region should span its container.',
        (d) => {
          const w = one(d, '.dashboard')!.getBoundingClientRect().width;
          return all(d, '.dashboard > *').every(
            (e) => visible(e) && near(e.getBoundingClientRect().width, w),
          );
        },
        360,
      ),
      check(
        'Visible desktop content',
        'Keep every dashboard region visible and inside the viewport.',
        (d) => fits(d) && all(d, '.dashboard > *').every(visible),
      ),
      fit(),
    ],
  }),
  exercise('css-content', {
    description: 'Make an article resilient to long text and oversized media.',
    markup: `<article class="article"><h1>Resilient interfaces</h1><p class="long-text">${'averylongunbrokenidentifier'.repeat(16)}</p><img class="media" src="${dotImage}" width="1200" height="600" alt="Example project diagram"><p>Content should remain readable at every size.</p></article>`,
    starter: '.article {\n}\n\n.long-text {\n}\n\n.media {\n}\n',
    requirements: [
      'At 960px, center the article horizontally and limit its rendered width to 640px. At 360px, fit it within the viewport.',
      'Wrap the long identifier without hiding, clipping, truncating, or scrolling the text. Keep paragraph line-height at least 1.5 times its font size.',
      'Scale the image to fit the article while preserving its 2:1 displayed aspect ratio. Keep every element visible.',
    ],
    hints: [
      'Use a maximum width and automatic inline margins for the article.',
      'overflow-wrap can break unbroken strings; min-width: 0 can help flexible items shrink.',
      'Constrain image width and set a proportional height. Check the narrow preview.',
    ],
    explanation:
      'Robust CSS handles content beyond the happy path. Wrapping, flexible sizing, and proportional media avoid sacrificing content to make a layout fit.',
    checks: [
      check(
        'Bounded article',
        'At desktop, the article width must be 640px or less and at least 300px.',
        (d) => {
          const r = one(d, '.article')!.getBoundingClientRect();
          return r.width <= 641 && r.width >= 300;
        },
      ),
      check('Centered article', 'Balance the article’s left and right space at desktop.', (d) => {
        const r = one(d, '.article')!.getBoundingClientRect();
        return near(r.left, 960 - r.right);
      }),
      check(
        'Readable line spacing',
        'Give all paragraphs line-height at least 1.5 times their font size.',
        (d) =>
          all(d, 'p').every(
            (e) => parseFloat(style(e).lineHeight) >= parseFloat(style(e).fontSize) * 1.5,
          ),
      ),
      check(
        'Long text wraps',
        'Wrap the identifier instead of hiding or scrolling it.',
        (d) => {
          const e = one(d, '.long-text')!,
            s = style(e);
          return (
            visible(e) &&
            s.overflowX === 'visible' &&
            s.overflowY === 'visible' &&
            s.textOverflow !== 'ellipsis' &&
            e.scrollWidth <= e.clientWidth + 1 &&
            e.getBoundingClientRect().height > parseFloat(s.lineHeight) * 2
          );
        },
        360,
      ),
      check(
        'Proportional mobile media',
        'Fit the image inside the article at a 2:1 displayed aspect ratio.',
        (d) => {
          const e = one(d, '.media')!,
            r = e.getBoundingClientRect(),
            a = one(d, '.article')!.getBoundingClientRect();
          return visible(e) && r.width <= a.width + 1 && near(r.width / r.height, 2, 0.05);
        },
        360,
      ),
      check(
        'Visible mobile content',
        'Keep all text and the image visible without hiding overflow.',
        (d) =>
          all(d, '.article > *').every(visible) &&
          style(one(d, '.article')!).overflowX === 'visible',
        360,
      ),
      fit(),
    ],
  }),
];

webExercises.push(...webExpansion);
