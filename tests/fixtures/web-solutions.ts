export const webSolutions: Record<string, string> = {
  'html-profile':
    '<main><h1>Sam Developer</h1><p>I build interfaces.</p><ul><li>HTML</li><li>CSS</li><li>Git</li></ul><a href="#work">Projects</a><section id="work"><h2>Selected work</h2></section></main>',
  'html-contact':
    '<form><label>Name <input name="name" required></label><label>Email <input name="email" type="email" required></label><label>Message <textarea name="message" required></textarea></label><button type="submit">Send message</button></form>',
  'html-table':
    '<table><caption>Team directory</caption><thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">City</th></tr></thead><tbody><tr><th scope="row">Sam</th><td>Dev</td><td>Paris</td></tr><tr><th scope="row">Alex</th><td>QA</td><td>Rome</td></tr><tr><th scope="row">Jo</th><td>Lead</td><td>Lima</td></tr></tbody></table>',
  'html-signup':
    '<form><fieldset><legend>Choose a plan</legend><label><input type="radio" name="plan" value="starter" required>Starter</label><label><input type="radio" name="plan" value="pro">Pro</label></fieldset><label>Password <input name="password" type="password" required minlength="8"></label><label><input name="terms" type="checkbox" required>Accept terms</label><button type="submit">Register</button></form>',
  'html-document':
    '<a href="#content">Skip to content</a><header>ProCode<nav aria-label="Main"><a href="#intro">Introduction</a></nav></header><main id="content" tabindex="-1"><h1>Learning HTML</h1><nav aria-labelledby="contents-title"><h2 id="contents-title">Contents</h2><a href="#practice">Practice</a></nav><article><section id="intro"><h2>Introduction</h2></section><section id="practice"><h2>Practice</h2></section></article></main>',
  'html-disclosure':
    '<main><h1>Frequently asked questions</h1><details><summary>What is HTML?</summary><p>A markup language.</p></details><details><summary>What is CSS?</summary><p>A style language.</p></details><details><summary>What is Git?</summary><p>Version control.</p></details><figure><img width="120" height="60" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=" alt="A simplified document diagram"><figcaption>Document structure</figcaption></figure></main>',
  'css-card':
    '.card { box-sizing: border-box; width: 320px; max-width: 100%; padding: 20px; border: 1px solid #667085; border-radius: 8px; }',
  'css-buttons':
    '.action { min-height: 44px; padding: 8px 16px; background: #2563eb; color: white; cursor: pointer; } .action:disabled { background: #475569; cursor: not-allowed; } .action:focus-visible { outline: 3px solid #172033; outline-offset: 2px; }',
  'css-grid':
    '.cards { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; } .card { min-height: 80px; background: #dbeafe; } @media(max-width:600px) { .cards { grid-template-columns: 1fr; } }',
  'css-navigation':
    '.navigation { display: flex; gap: 16px; } .navigation a { display: flex; align-items: center; min-height: 44px; } .navigation a:focus-visible { outline: 2px solid #2563eb; } @media(max-width:600px) { .navigation { flex-direction: column; } }',
  'css-dashboard':
    '.dashboard { display: grid; grid-template-columns: 200px minmax(0,1fr); gap: 16px; } .header,.footer { grid-column: 1 / -1; } @media(max-width:600px) { .dashboard { grid-template-columns: minmax(0,1fr); } }',
  'css-content':
    '.article { max-width: 640px; margin-inline: auto; } .long-text { overflow-wrap: anywhere; } p { line-height: 1.6; } .media { max-width: 100%; height: auto; aspect-ratio: 2/1; }',
};
Object.assign(webSolutions, {
  'html-search': `<form role="search" aria-label="Practice search"><label>Search topics<input type="search" name="q" required></label><label>Category<select name="category"><option value="">All topics</option><option value="algorithms">Algorithms</option><option value="angular">Angular</option></select></label><button type="submit">Search</button></form>`,
  'html-checkout': `<form><label>Name<input name="fullName" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Postal code<input name="postalCode" required autocomplete="postal-code"></label><label>Quantity<input name="quantity" type="number" min="1" max="5" step="1" required aria-describedby="quantity-help"></label><p id="quantity-help">Choose one through five whole items.</p><button type="submit">Continue shipping</button></form>`,
  'html-errors': `<main><h1>Repair your account details</h1><section role="alert" tabindex="-1"><h2>Check these fields</h2><ul><li><a href="#email">Correct the email address</a></li><li><a href="#password">Correct the password</a></li></ul></section><form><label>Email<input id="email" name="email" type="email" aria-invalid="true" aria-describedby="email-error"></label><p id="email-error">Enter a valid email address.</p><label>Password<input id="password" name="password" type="password" aria-invalid="true" aria-describedby="password-error"></label><p id="password-error">Use a longer password.</p><button type="submit">Try again</button></form></main>`,
  'css-center': `.stage{min-height:320px;display:grid;place-items:center}.panel{box-sizing:border-box;width:min(100%,320px);padding:16px;border:1px solid #526477}.panel h1{font-size:24px}button{min-height:40px}`,
  'css-sticky': `.results{height:200px;overflow:auto}table{width:100%;border-collapse:separate;border-spacing:0}th,td{padding:10px;text-align:left}th{position:sticky;top:0;background:#fff;z-index:1}`,
  'css-form-layout': `*{box-sizing:border-box}form{max-width:700px}.field{display:grid;grid-template-columns:210px minmax(0,1fr);align-items:center;gap:12px;margin-bottom:16px}input{width:100%;min-width:0;min-height:40px}input:focus{outline:2px solid #175bc0;outline-offset:2px}.actions{display:flex;gap:12px}button{min-height:40px}.help{overflow-wrap:anywhere}@media(max-width:600px){.field{grid-template-columns:minmax(0,1fr)}.actions{flex-direction:column}}`,
});
