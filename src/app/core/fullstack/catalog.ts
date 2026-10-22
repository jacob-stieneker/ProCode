import { fullstackExpansion } from './expansion';
import { angularClientStarter, apiStarter } from './scaffold';
import {
  FullstackExercise,
  ProjectFiles,
  ProjectScenario,
  ProjectStep,
  fullstackExerciseInfo,
} from './model';
const click = (target: string): ProjectStep => ({ action: 'click', target });
const input = (target: string, value: string): ProjectStep => ({ action: 'input', target, value });
const request = (method: string, path: string, body?: unknown): ProjectStep => ({
  action: 'request',
  method,
  path,
  body,
});
const ui = (
  target: string,
  expected: unknown,
  kind: ProjectStep['kind'] = 'text',
): ProjectStep => ({ action: 'assert', scope: 'ui', target, expected, kind });
const response = (target: string, expected: unknown): ProjectStep => ({
  action: 'assert',
  scope: 'response',
  target,
  expected,
});
const db = (target: string, expected: unknown): ProjectStep => ({
  action: 'assert',
  scope: 'db',
  target,
  expected,
});
const fail = (method: string, path: string, value = 'before'): ProjectStep => ({
  action: 'failNext',
  method,
  path,
  value,
});
const scenario = (name: string, hint: string, ...steps: ProjectStep[]): ProjectScenario => ({
  name,
  hint,
  steps,
});
const layout: ProjectScenario = {
  name: 'Accessible responsive interface',
  hint: 'Use one h1, labels for inputs, controls at least 24px, and a layout that fits 360px.',
  steps: [],
  width: 360,
  layout: true,
};
const shell = (title: string, body: string): ProjectFiles => ({
  'index.html': `<main>\n  <h2>${title}</h2>\n  ${body}\n  <p data-testid="status" role="status">Ready</p>\n</main>`,
  'styles.css':
    '/* Make this layout responsive and keep controls readable. */\nbody { font: 16px/1.5 system-ui; margin: 20px; }\nmain { width: 960px; }\n',
  'app.ts': angularClientStarter,
  'api.js':
    'export async function handleRequest(request, db) {\n  // Validate requests before changing db.\n  return { status: 404, body: { error: "Not found" } };\n}\n',
});
const common = [
  'Build the interface in index.html and styles.css, Angular component behavior in app.ts, and API behavior in api.js. Angular startup, forms imports, dependency injection and API routing are supplied. Implement the bindings and goal-specific behavior. Keep the supplied data-testid hooks and add the row hooks specified below. Equivalent implementations are accepted.',
  'Use an h1, labeled editable controls, and a layout that fits a 360px viewport. Render user-entered text as text, not HTML.',
  'Display Ready after a successful load, Saved after a successful write, and Error when a request fails or is rejected. Keep unsaved input on failure. Reload must read the API again, not reset its data.',
];
const apiHelp =
  'app.ts exports standalone AppComponent, using projectTemplate from @procode/fullstack for index.html. Inject PracticeApi and call api.request(method, path, body?), which resolves to {status, ok, body}; connection failures reject. api.js imports createRouter from @procode/server and exports handleRequest. Route callbacks receive (request, db): request.body is the submitted value, params contains string path parameters, query is URLSearchParams. Return {status, body}. The router supplies dispatch and a 404 fallback, not validation or database operations. db is isolated mutable data in the API worker. No HTTP server, real fetch, or Firebase credentials are available. Existing mount(api) clients also work. ';
const definitions: Omit<FullstackExercise, 'id' | 'title' | 'difficulty' | 'version'>[] = [
  {
    description:
      'Build a task board whose create, read, update, and delete actions persist in the API across list reloads.',
    requirements: [
      ...common,
      'Load tasks on mount and Reload. Add trimmed nonempty titles of at most 80 characters. Clear the title after success. Toggle done and delete individual tasks by stable ID.',
      'Each row uses task-row, title-ID, done-ID (Done or Open), toggle-ID, and delete-ID. The starter task has ID 1.',
    ],
    apiReference:
      apiHelp +
      'GET /tasks -> 200 {items}. POST /tasks {title} -> 201 {item}, new unique positive integer ID, done:false. PATCH /tasks/ID {done:boolean} -> 200 {item}. DELETE /tasks/ID -> 200 {deleted:true}. Invalid title/done -> 400; missing ID -> 404. db.tasks is the list; db.nextId starts at 2.',
    initial: { tasks: [{ id: 1, title: 'Read docs', done: false }], nextId: 2 },
    starter: shell(
      'Task board',
      '<input data-testid="title" placeholder="Task title">\n  <button data-testid="add">Add task</button>\n  <button data-testid="reload">Reload</button>\n  <ul data-testid="list"></ul>',
    ),
    hints: [
      'Implement and verify GET/POST first. Await the response before clearing input.',
      'Render buttons with handlers that use each row’s ID. Reload from GET after mutations.',
      'Validate title and done in the API even if the client validates them too.',
    ],
    explanation:
      'Client state reflects API records. Stable IDs let actions target the correct record, and API validation protects every caller, including callers that bypass the form.',
    scenarios: [
      scenario(
        'Load existing tasks',
        'Read /tasks and render the seeded task.',
        ui('title-1', 'Read docs'),
        ui('done-1', 'Open'),
        ui('task-row', 1, 'count'),
      ),
      scenario(
        'Create and reload',
        'Save through POST, clear only on success, and reload from the API.',
        input('title', '  Practice HTTP  '),
        click('add'),
        ui('status', 'Saved'),
        ui('title', '', 'value'),
        db('tasks.length', 2),
        db('tasks.1.title', 'Practice HTTP'),
        click('reload'),
        ui('task-row', 2, 'count'),
      ),
      scenario(
        'Update and delete',
        'PATCH and DELETE must change the API data, not just the visible list.',
        click('toggle-1'),
        db('tasks.0.done', true),
        click('reload'),
        ui('done-1', 'Done'),
        click('delete-1'),
        db('tasks.length', 0),
        click('reload'),
        ui('task-row', 0, 'count'),
      ),
      scenario(
        'Reject invalid writes',
        'Validate every API request before mutation.',
        request('POST', '/tasks', { title: '   ' }),
        response('status', 400),
        request('POST', '/tasks', { title: 'x'.repeat(81) }),
        response('status', 400),
        db('tasks.length', 1),
        request('PATCH', '/tasks/1', { done: 'yes' }),
        response('status', 400),
        db('tasks.0.done', false),
        request('DELETE', '/tasks/999'),
        response('status', 404),
      ),
      scenario(
        'Recover a failed save',
        'Catch rejected requests, preserve the title, and allow retry.',
        input('title', 'Retry task'),
        fail('POST', '/tasks'),
        click('add'),
        ui('status', 'Error'),
        ui('title', 'Retry task', 'value'),
        db('tasks.length', 1),
        click('add'),
        ui('status', 'Saved'),
        db('tasks.length', 2),
      ),
      scenario(
        'Treat entry content as text',
        'Use textContent or equivalent safe text rendering.',
        input('title', '<b>Plain text</b>'),
        click('add'),
        db('tasks.1.title', '<b>Plain text</b>'),
        ui('task-row', 2, 'count'),
      ),
      layout,
    ],
  },
  {
    description:
      'Build a guestbook with server-validated submissions, chronological display, and retryable failures.',
    requirements: [
      ...common,
      'Load entries on mount and Reload. Submit a trimmed name (1–40 characters) and message (1–200 characters). Append in creation order and clear both fields only on success.',
      'Each entry has entry-row, name-ID and message-ID. The initial entry ID is 1.',
    ],
    apiReference:
      apiHelp +
      'GET /entries -> 200 {items}. POST /entries {name,message} -> 201 {item} with a new unique positive integer ID. Invalid fields -> 400. db.entries stores {id,name,message}; db.nextId starts at 2.',
    initial: { entries: [{ id: 1, name: 'Ada', message: 'Welcome' }], nextId: 2 },
    starter: shell(
      'Guestbook',
      '<input data-testid="name" placeholder="Name">\n  <textarea data-testid="message" placeholder="Message"></textarea>\n  <button data-testid="submit">Post message</button>\n  <button data-testid="reload">Reload</button>\n  <section data-testid="list"></section>',
    ),
    hints: [
      'Use GET /entries for the first render and every reload.',
      'Normalize whitespace at the API boundary and reject missing or overlong fields before writing.',
      'Catch transport errors without clearing fields. Insert names and messages as text.',
    ],
    explanation:
      'A working form includes server validation, durable state within the session, safe text rendering, and recovery from a failed request.',
    scenarios: [
      scenario(
        'Load entries',
        'Render API entries in creation order.',
        ui('name-1', 'Ada'),
        ui('message-1', 'Welcome'),
        ui('entry-row', 1, 'count'),
      ),
      scenario(
        'Submit and reload',
        'POST normalized fields and read them back.',
        input('name', '  Grace '),
        input('message', ' Hello team '),
        click('submit'),
        ui('status', 'Saved'),
        ui('name', '', 'value'),
        ui('message', '', 'value'),
        db('entries.1.name', 'Grace'),
        db('entries.1.message', 'Hello team'),
        click('reload'),
        ui('entry-row', 2, 'count'),
      ),
      scenario(
        'Validate on the API',
        'Do not rely only on HTML validation.',
        request('POST', '/entries', { name: ' ', message: 'Hello' }),
        response('status', 400),
        request('POST', '/entries', { name: 'A'.repeat(41), message: 'Hello' }),
        response('status', 400),
        request('POST', '/entries', { name: 'Ada', message: 'x'.repeat(201) }),
        response('status', 400),
        request('POST', '/entries', { name: 'Ada', message: '' }),
        response('status', 400),
        db('entries.length', 1),
      ),
      scenario(
        'Multiple callers create unique records',
        'Every valid request needs a distinct ID and both records must survive.',
        request('POST', '/entries', { name: 'Lin', message: 'One' }),
        response('status', 201),
        request('POST', '/entries', { name: 'Sam', message: 'Two' }),
        response('status', 201),
        db('entries.length', 3),
        request('GET', '/entries'),
        response('body.items.length', 3),
        click('reload'),
        ui('entry-row', 3, 'count'),
      ),
      scenario(
        'Retry without losing a message',
        'Preserve input when POST fails.',
        input('name', 'Lin'),
        input('message', 'Keep my draft'),
        fail('POST', '/entries'),
        click('submit'),
        ui('status', 'Error'),
        ui('message', 'Keep my draft', 'value'),
        db('entries.length', 1),
        click('submit'),
        ui('status', 'Saved'),
        db('entries.length', 2),
      ),
      layout,
    ],
  },
  {
    description:
      'Build a support desk that can create tickets, filter the list, resolve individual tickets, and recover from API errors.',
    requirements: [
      ...common,
      'Load all tickets initially. Create a trimmed subject (1–100 characters) with status open. Filter all/open/resolved using the API query. Resolve a ticket by ID and keep the selected filter when reloading.',
      'Rows use ticket-row, subject-ID, state-ID (open or resolved), and resolve-ID. Initial tickets have IDs 1 and 2.',
    ],
    apiReference:
      apiHelp +
      'GET /tickets?status=all|open|resolved -> 200 {items} in creation order (GET /tickets means all). Unknown filter -> 400. POST /tickets {subject} -> 201 {item}. PATCH /tickets/ID {status:"open"|"resolved"} -> 200 {item}; missing ID -> 404; invalid fields -> 400. db.tickets and db.nextId are provided.',
    initial: {
      tickets: [
        { id: 1, subject: 'Login issue', status: 'open' },
        { id: 2, subject: 'Update docs', status: 'resolved' },
      ],
      nextId: 3,
    },
    starter: shell(
      'Support desk',
      '<input data-testid="subject" placeholder="Subject">\n  <button data-testid="create">Create ticket</button>\n  <select data-testid="filter"><option value="all">All</option><option value="open">Open</option><option value="resolved">Resolved</option></select>\n  <button data-testid="reload">Reload</button>\n  <ul data-testid="list"></ul>',
    ),
    hints: [
      'Build filtering into GET /tickets so direct API callers receive the same result.',
      'Capture record IDs when wiring resolve buttons and reload with the current filter.',
      'Check both rejected promises and response.ok; a 400 response is not a rejected promise.',
    ],
    explanation:
      'Filtering is an API contract as well as a UI feature. Mutations must remain visible after refetching, and the selected view should remain stable across reloads.',
    scenarios: [
      scenario(
        'Initial queue',
        'Render both seeded records.',
        ui('ticket-row', 2, 'count'),
        ui('subject-1', 'Login issue'),
      ),
      scenario(
        'Create and refetch',
        'A new ticket must survive reload.',
        input('subject', ' Printer unavailable '),
        click('create'),
        ui('status', 'Saved'),
        db('tickets.2.subject', 'Printer unavailable'),
        db('tickets.2.status', 'open'),
        click('reload'),
        ui('ticket-row', 3, 'count'),
      ),
      scenario(
        'Filter and resolve',
        'Persist the resolution and retain the selected filter.',
        input('filter', 'open'),
        ui('ticket-row', 1, 'count'),
        click('resolve-1'),
        db('tickets.0.status', 'resolved'),
        ui('ticket-row', 0, 'count'),
        click('reload'),
        ui('filter', 'open', 'value'),
        ui('ticket-row', 0, 'count'),
        input('filter', 'resolved'),
        ui('ticket-row', 2, 'count'),
      ),
      scenario(
        'Server filters and validates',
        'Validate filter, subject and status independently of the form.',
        request('GET', '/tickets?status=open'),
        response('body.items.length', 1),
        response('body.items.0.id', 1),
        request('GET', '/tickets?status=invalid'),
        response('status', 400),
        request('POST', '/tickets', { subject: '' }),
        response('status', 400),
        request('PATCH', '/tickets/1', { status: 'unknown' }),
        response('status', 400),
        db('tickets.0.status', 'open'),
        request('PATCH', '/tickets/999', { status: 'resolved' }),
        response('status', 404),
      ),
      scenario(
        'Recover a read failure',
        'Display Error and let Reload try again.',
        fail('GET', '/tickets?status=all'),
        click('reload'),
        ui('status', 'Error'),
        click('reload'),
        ui('status', 'Ready'),
        ui('ticket-row', 2, 'count'),
      ),
      layout,
    ],
  },
  {
    description:
      'Build an inventory checkout that calculates prices on the API and decreases stock only for a valid order.',
    requirements: [
      ...common,
      'Load the product with ID 1 and show its name and available stock. Submit an integer quantity. Show the API total in cents after success, refresh stock, and preserve quantity on failure.',
      'Use name, stock and total hooks for product name, numeric stock, and numeric total cents. Ignore any caller-supplied price when calculating the order total.',
    ],
    apiReference:
      apiHelp +
      'GET /products -> 200 {items}. POST /orders {productId,quantity} -> 201 {order:{id,productId,quantity,totalCents}}. Positive integer quantity and existing product required (400 otherwise). Insufficient stock -> 409. db.products contains {id,name,priceCents,stock}; db.orders stores orders; db.nextId starts at 1. Validate before decreasing stock or appending an order.',
    initial: {
      products: [{ id: 1, name: 'Keyboard', priceCents: 2500, stock: 5 }],
      orders: [],
      nextId: 1,
    },
    starter: shell(
      'Inventory checkout',
      '<h3 data-testid="name"></h3>\n  <p>Stock: <span data-testid="stock"></span></p>\n  <input data-testid="quantity" type="number" value="1" placeholder="Quantity">\n  <button data-testid="checkout">Place order</button>\n  <button data-testid="reload">Reload</button>\n  <p>Total cents: <output data-testid="total">0</output></p>',
    ),
    hints: [
      'Always look up the trusted price in db.products.',
      'Validate the quantity and stock before modifying either collection.',
      'Only show a successful total from response.body.order.totalCents. Catch transport failures and handle status 409.',
    ],
    explanation:
      'An order is a coordinated mutation: stock and order history must agree. Prices are calculated from server data, and rejected orders must leave both unchanged.',
    scenarios: [
      scenario(
        'Load inventory',
        'Read product data from the API.',
        ui('name', 'Keyboard'),
        ui('stock', '5'),
      ),
      scenario(
        'Order and reload',
        'Persist one order and its stock decrease.',
        input('quantity', '2'),
        click('checkout'),
        ui('status', 'Saved'),
        ui('total', '5000'),
        ui('stock', '3'),
        db('orders.length', 1),
        db('products.0.stock', 3),
        click('reload'),
        ui('stock', '3'),
      ),
      scenario(
        'Reject insufficient stock',
        'A rejected write must be atomic.',
        request('POST', '/orders', { productId: 1, quantity: 6 }),
        response('status', 409),
        db('orders.length', 0),
        db('products.0.stock', 5),
      ),
      scenario(
        'Validate quantity and product',
        'Reject zero, fractions, negatives and unknown products.',
        request('POST', '/orders', { productId: 1, quantity: 0 }),
        response('status', 400),
        request('POST', '/orders', { productId: 1, quantity: 1.5 }),
        response('status', 400),
        request('POST', '/orders', { productId: 999, quantity: 1 }),
        response('status', 400),
        request('POST', '/orders', { productId: 1, quantity: -1 }),
        response('status', 400),
        db('products.0.stock', 5),
        db('orders.length', 0),
      ),
      scenario(
        'Use server prices',
        'Ignore prices supplied by an API caller.',
        request('POST', '/orders', { productId: 1, quantity: 2, priceCents: 1, totalCents: 2 }),
        response('status', 201),
        response('body.order.totalCents', 5000),
        db('orders.0.totalCents', 5000),
      ),
      scenario(
        'Handle rejection and retry',
        'Show Error for a non-success response and preserve the form.',
        input('quantity', '9'),
        click('checkout'),
        ui('status', 'Error'),
        ui('quantity', '9', 'value'),
        db('orders.length', 0),
        input('quantity', '1'),
        click('checkout'),
        ui('status', 'Saved'),
        ui('stock', '4'),
      ),
      layout,
    ],
  },
  {
    description:
      'Build a shared document editor that detects stale saves and lets the user retry their draft against the latest revision.',
    requirements: [
      ...common,
      'Load the document into the title field and show its version. Save the title with the version that was loaded. On 409, display Conflict, keep the unsaved title, and remember the latest version returned by the API. The next Save retries that draft against the latest version.',
      'Reload intentionally discards the draft and fetches the current document. The supplied external-edit button should PATCH title "Edited elsewhere" using a freshly fetched version, without changing the local draft/version. This simulates a second editor.',
    ],
    apiReference:
      apiHelp +
      'GET /document -> 200 {document}. PATCH /document {title,version} -> 200 {document}, increments version exactly once. Trimmed title 1–80 characters and integer version required (400 otherwise). Stale version -> 409 {error:"Conflict",document:current}, no mutation. db.document begins {id:1,title:"Release notes",version:1}.',
    initial: { document: { id: 1, title: 'Release notes', version: 1 } },
    starter: shell(
      'Shared document',
      '<input data-testid="title" placeholder="Title">\n  <p>Version: <output data-testid="version">0</output></p>\n  <button data-testid="save">Save</button>\n  <button data-testid="reload">Reload</button>\n  <button data-testid="external-edit">Change record elsewhere</button>',
    ),
    hints: [
      'Keep draft text separate from the last loaded server version.',
      'Compare version before writing. On conflict return the current record without modifying it.',
      'Catch failures without clearing the draft. A conflict should update only the version used for a deliberate retry.',
    ],
    explanation:
      'Optimistic concurrency prevents one editor from silently overwriting another. The user keeps their draft, sees the conflict, and explicitly retries against the newer revision.',
    scenarios: [
      scenario(
        'Load and save',
        'Send the loaded version with the draft and refresh the displayed version.',
        ui('title', 'Release notes', 'value'),
        ui('version', '1'),
        input('title', ' Revised notes '),
        click('save'),
        ui('status', 'Saved'),
        db('document.title', 'Revised notes'),
        db('document.version', 2),
        ui('version', '2'),
      ),
      scenario(
        'Reject stale writes',
        'Compare versions before any mutation and return the current document.',
        request('PATCH', '/document', { title: 'Remote', version: 1 }),
        response('status', 200),
        request('PATCH', '/document', { title: 'Stale', version: 1 }),
        response('status', 409),
        response('body.document.title', 'Remote'),
        db('document.title', 'Remote'),
        db('document.version', 2),
      ),
      scenario(
        'Preserve draft and retry conflict',
        'Do not overwrite the draft when the API returns 409.',
        input('title', 'My draft'),
        click('external-edit'),
        click('save'),
        ui('status', 'Conflict'),
        ui('title', 'My draft', 'value'),
        db('document.title', 'Edited elsewhere'),
        db('document.version', 2),
        click('save'),
        ui('status', 'Saved'),
        db('document.title', 'My draft'),
        db('document.version', 3),
      ),
      scenario(
        'Reload the current record',
        'Reload must reflect another editor’s changes.',
        click('external-edit'),
        click('reload'),
        ui('title', 'Edited elsewhere', 'value'),
        ui('version', '2'),
        ui('status', 'Ready'),
      ),
      scenario(
        'Invalid edits do not change the revision',
        'Validate before updating.',
        request('PATCH', '/document', { title: ' ', version: 1 }),
        response('status', 400),
        request('PATCH', '/document', { title: 'Okay', version: '1' }),
        response('status', 400),
        request('PATCH', '/document', { title: 'x'.repeat(81), version: 1 }),
        response('status', 400),
        db('document.version', 1),
        db('document.title', 'Release notes'),
      ),
      scenario(
        'Recover transport failure',
        'Keep the draft and last version when the request fails.',
        input('title', 'Retry draft'),
        fail('PATCH', '/document'),
        click('save'),
        ui('status', 'Error'),
        ui('title', 'Retry draft', 'value'),
        click('save'),
        ui('status', 'Saved'),
        db('document.version', 2),
      ),
      layout,
    ],
  },
  {
    description:
      'Build an order form that can safely retry when the API commits an order but its response is lost.',
    requirements: [
      ...common,
      'Load product 1, show stock, and submit a positive integer quantity with a nonempty request key. Keep that key for retries of the same pending payload. After success, a new order must use a new key. Do not clear quantity on failure.',
      'Use name, stock, total and order-id hooks. Show the API order ID and total cents on success. Disable or guard overlapping submissions so one click sequence cannot create duplicate in-flight orders.',
      'The preview’s Lose next response control simulates a committed write whose reply never reaches the client. Retry the same request with the same key.',
    ],
    apiReference:
      apiHelp +
      'GET /products -> 200 {items}. POST /orders {productId,quantity,key} -> 201 {order} on first success; an exact replay returns 200 with the original order, without decreasing stock again. Reusing a key for different product/quantity -> 409. Invalid product, quantity, or key (1–80 characters) -> 400; insufficient stock -> 409. db.products, db.orders, db.requests (map key to {productId,quantity,order}) and db.nextId are provided. Calculate totalCents from the stored price. Only successful orders reserve keys.',
    initial: {
      products: [{ id: 1, name: 'Keyboard', priceCents: 2500, stock: 5 }],
      orders: [],
      requests: {},
      nextId: 1,
    },
    starter: shell(
      'Retry-safe checkout',
      '<h3 data-testid="name"></h3>\n  <p>Stock: <span data-testid="stock"></span></p>\n  <input data-testid="quantity" type="number" value="1" placeholder="Quantity">\n  <button data-testid="checkout">Place order</button>\n  <button data-testid="reload">Reload</button>\n  <p>Order: <output data-testid="order-id"></output></p>\n  <p>Total cents: <output data-testid="total">0</output></p>',
    ),
    hints: [
      'Keep a pending {key, productId, quantity} in client state until success; generate a new key for a new payload.',
      'Check stored successful requests before checking remaining stock. An exact replay returns the stored result.',
      'Validate before mutation. A rejected order must not decrease stock, append a record, or reserve its key. Use own-property checks on the key map.',
    ],
    explanation:
      'A lost response leaves the client unsure whether a write committed. Idempotency ties retries to one logical operation so the same order is returned without repeating its effects.',
    scenarios: [
      scenario(
        'Initial inventory',
        'Load real API data before ordering.',
        ui('name', 'Keyboard'),
        ui('stock', '5'),
      ),
      scenario(
        'Replay a successful order',
        'The same key and payload must return the original order without another stock change.',
        request('POST', '/orders', { productId: 1, quantity: 2, key: 'order-a' }),
        response('status', 201),
        request('POST', '/orders', { productId: 1, quantity: 2, key: 'order-a' }),
        response('status', 200),
        response('body.order.totalCents', 5000),
        db('orders.length', 1),
        db('products.0.stock', 3),
      ),
      scenario(
        'Reject key reuse for another payload',
        'Do not reuse a key for a different operation.',
        request('POST', '/orders', { productId: 1, quantity: 1, key: 'same' }),
        response('status', 201),
        request('POST', '/orders', { productId: 1, quantity: 2, key: 'same' }),
        response('status', 409),
        db('orders.length', 1),
        db('products.0.stock', 4),
      ),
      scenario(
        'Recover a lost successful response',
        'Keep the pending request key after a lost response and reuse it on retry.',
        input('quantity', '2'),
        fail('POST', '/orders', 'after'),
        click('checkout'),
        ui('status', 'Error'),
        ui('quantity', '2', 'value'),
        db('orders.length', 1),
        db('products.0.stock', 3),
        click('checkout'),
        ui('status', 'Saved'),
        ui('total', '5000'),
        ui('stock', '3'),
        db('orders.length', 1),
      ),
      scenario(
        'Start a distinct order after success',
        'Successful completion ends the pending operation; the next order needs its own key.',
        input('quantity', '1'),
        click('checkout'),
        ui('status', 'Saved'),
        click('checkout'),
        ui('status', 'Saved'),
        db('orders.length', 2),
        db('products.0.stock', 3),
      ),
      scenario(
        'Failed writes do not reserve keys',
        'Validate first, then commit all order state together.',
        request('POST', '/orders', { productId: 1, quantity: 9, key: 'retry' }),
        response('status', 409),
        db('orders.length', 0),
        db('products.0.stock', 5),
        request('POST', '/orders', { productId: 1, quantity: 1, key: 'retry' }),
        response('status', 201),
        request('POST', '/orders', { productId: 1, quantity: 0, key: 'invalid' }),
        response('status', 400),
        request('POST', '/orders', { productId: 1, quantity: 1 }),
        response('status', 400),
        db('orders.length', 1),
        db('products.0.stock', 4),
      ),
      scenario(
        'Replay after stock is exhausted',
        'Check successful replay records before checking current stock.',
        request('POST', '/orders', { productId: 1, quantity: 5, key: 'last' }),
        response('status', 201),
        request('POST', '/orders', { productId: 1, quantity: 5, key: 'last' }),
        response('status', 200),
        db('orders.length', 1),
        db('products.0.stock', 0),
      ),
      layout,
    ],
  },
];
definitions.push(...fullstackExpansion);
// Shared contracts are tested independently of the visible form.
for (const definition of definitions)
  definition.scenarios.push(
    scenario(
      'Unknown route',
      'Return 404 for an unsupported API route.',
      request('GET', '/missing'),
      response('status', 404),
    ),
  );
definitions[0].scenarios.push(
  scenario(
    'Render literal user text',
    'Use textContent or equivalent text binding.',
    input('title', '<b>Plain text</b>'),
    click('add'),
    ui('list', '<b>Plain text</b>', 'contains'),
  ),
);
definitions[1].scenarios.push(
  scenario(
    'Render literal message text',
    'Do not insert message content as HTML.',
    input('name', '<b>Lin</b>'),
    input('message', '<i>Hello</i>'),
    click('submit'),
    ui('list', '<b>Lin</b>', 'contains'),
    ui('list', '<i>Hello</i>', 'contains'),
  ),
);
definitions[5].scenarios.push(
  scenario(
    'Guard rapid submissions',
    'Disable or guard the pending operation until it settles.',
    input('quantity', '2'),
    { action: 'doubleClick', target: 'checkout' },
    ui('status', 'Saved'),
    db('orders.length', 1),
    db('products.0.stock', 3),
  ),
);
definitions[5].scenarios.push(
  scenario(
    'Treat request keys as data',
    'Use own-property checks, including for names inherited by ordinary objects.',
    request('POST', '/orders', { productId: 1, quantity: 1, key: 'constructor' }),
    response('status', 201),
    request('POST', '/orders', { productId: 1, quantity: 1, key: 'constructor' }),
    response('status', 200),
    db('orders.length', 1),
    db('products.0.stock', 4),
  ),
);
export const fullstackExercises: FullstackExercise[] = fullstackExerciseInfo.map((info, index) => ({
  ...info,
  ...definitions[index],
  starter: { ...definitions[index].starter, 'api.js': apiStarter(info.id) },
}));
