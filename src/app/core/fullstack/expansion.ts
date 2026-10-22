import type { FullstackExercise, ProjectStep, ProjectScenario, ProjectFiles } from './model';
import { angularClientStarter } from './scaffold';
const input = (target: string, value: string): ProjectStep => ({ action: 'input', target, value });
const click = (target: string): ProjectStep => ({ action: 'click', target });
const request = (method: string, path: string, body?: unknown): ProjectStep => ({
  action: 'request',
  method,
  path,
  body,
});
const assertion = (
  scope: 'ui' | 'response' | 'db',
  target: string,
  expected: unknown,
  kind?: ProjectStep['kind'],
): ProjectStep => ({ action: 'assert', scope, target, expected, kind });
const ui = (target: string, expected: unknown, kind: ProjectStep['kind'] = 'text') =>
  assertion('ui', target, expected, kind);
const response = (target: string, expected: unknown) => assertion('response', target, expected);
const db = (target: string, expected: unknown) => assertion('db', target, expected);
const scenario = (name: string, hint: string, ...steps: ProjectStep[]): ProjectScenario => ({
  name,
  hint,
  steps,
});
const layout: ProjectScenario = {
  name: 'Accessible responsive interface',
  hint: 'Use one h1, labelled controls at least 24px, and no overflow at 360px.',
  steps: [],
  width: 360,
  layout: true,
};
const shell = (body: string): ProjectFiles => ({
  'index.html': `<main><h2>Practice project</h2>${body}<button data-testid="reload">Reload</button><p data-testid="status" role="status">Ready</p></main>`,
  'styles.css': '/* Build a responsive layout. */\nmain { width: 960px; }',
  'app.ts': angularClientStarter,
  'api.js': '',
});
const common = [
  'Use the supplied Angular component and local router scaffold. Implement bindings, state and API behavior; keep all data-testid hooks. Add one h1, associated labels and a layout that fits 360px.',
  'Load on startup and Reload. Display Ready after a successful read, Saved after a successful write and Error for rejected or failed requests. Keep entered values on failure. Reload must read the same API data.',
];
const apiHelp =
  'Use injected PracticeApi.request(method,path,body?) in app.ts and createRouter from @procode/server in api.js. Responses are {status,ok,body}; transport failures reject. Export AppComponent and handleRequest. The local db persists within one preview session, and resets for each test. ';
export const fullstackExpansion: Omit<
  FullstackExercise,
  'id' | 'title' | 'difficulty' | 'version'
>[] = [
  {
    description:
      'Build a searchable product catalog whose filtering happens in the API, with clear empty and failure states.',
    requirements: [
      ...common,
      'The query input uses query, Search uses search, results use list and one product-row per item. Render the matching names in API order. A no-match search shows exactly No products in empty.',
      'Search sends q to the API using proper URL encoding. Trim and compare names case-insensitively. An empty query lists every product. Reload retains the current query.',
    ],
    apiReference:
      apiHelp +
      'GET /catalog?q=... -> 200 {items}. Missing q means empty query. Trim and match a case-insensitive substring of name; return items in ascending id order. Do not mutate db.products. Unknown routes -> 404.',
    initial: {
      products: [
        { id: 1, name: 'Angular Handbook' },
        { id: 2, name: 'Python Notes' },
        { id: 3, name: 'CSS & Layout' },
      ],
    },
    starter: shell(
      '<input data-testid="query"><button data-testid="search">Search</button><ul data-testid="list"></ul><p data-testid="empty"></p>',
    ),
    scenarios: [
      scenario(
        'Initial products',
        'Load all three products on startup.',
        ui('product-row', 3, 'count'),
        ui('list', 'Angular Handbook', 'contains'),
        ui('status', 'Ready'),
      ),
      scenario(
        'Search through API',
        'Trim and match without case sensitivity.',
        input('query', '  PYTHON  '),
        click('search'),
        ui('product-row', 1, 'count'),
        ui('list', 'Python Notes', 'contains'),
      ),
      scenario(
        'No matching products',
        'Clear stale rows and show the empty state.',
        input('query', 'missing'),
        click('search'),
        ui('product-row', 0, 'count'),
        ui('empty', 'No products'),
      ),
      scenario(
        'Encoded search',
        'Encode ampersands in query parameters.',
        input('query', 'CSS &'),
        click('search'),
        ui('product-row', 1, 'count'),
        ui('list', 'CSS & Layout', 'contains'),
      ),
      scenario(
        'Clear search',
        'An empty query restores the full catalog.',
        input('query', 'python'),
        click('search'),
        input('query', ''),
        click('search'),
        ui('product-row', 3, 'count'),
      ),
      scenario(
        'API filters independently',
        'Filtering must work for callers outside the UI.',
        request('GET', '/catalog?q=%20PYTHON%20'),
        response('status', 200),
        response('body.items', [{ id: 2, name: 'Python Notes' }]),
        db('products.length', 3),
      ),
      scenario(
        'Empty API result',
        'Return an empty items array for no match.',
        request('GET', '/catalog?q=unknown'),
        response('body.items', []),
      ),
      scenario(
        'Read failure and recovery',
        'Keep the query, show Error, then allow retry.',
        { action: 'failNext', method: 'GET' },
        input('query', 'Python'),
        click('search'),
        ui('status', 'Error'),
        ui('query', 'Python', 'value'),
        click('search'),
        ui('status', 'Ready'),
        ui('product-row', 1, 'count'),
      ),
      layout,
    ],
    hints: [
      'Keep filtering in GET /catalog so direct callers receive the same results.',
      'Use encodeURIComponent or URLSearchParams when building the client URL.',
      'Handle empty success separately from a rejected request.',
    ],
    explanation:
      'A search feature spans request encoding, API filtering, state replacement and failure recovery. Returning a correct empty array is a successful read, not a transport error.',
  },
  {
    description:
      'Build server-side pagination with reliable boundaries, query changes and total counts.',
    requirements: [
      ...common,
      'Use query and search for text search. Use previous and next buttons and outputs page and total. Show one result-row per item in list. Start on page 1, with a fixed pageSize of 2.',
      'A search resets to page 1. Show the requested page number and total number of matching records. Disable Previous on page 1 and Next when page × 2 >= total, including zero results. Reload retains query and page.',
      'Render items in API order. Do not download all records and paginate only in the browser.',
    ],
    apiReference:
      apiHelp +
      'GET /articles?q=&page=1&pageSize=2 -> 200 {items,total,page,pageSize}. Missing page/pageSize default to 1/2. Validate each as a decimal-digit positive integer; pageSize may not exceed 5. Invalid values -> 400. Trim q and match title case-insensitively. Sort by id ascending before slicing. Beyond-last pages return items:[] with the correct total and requested page. Do not change db. Unknown routes -> 404.',
    initial: {
      articles: [
        { id: 4, title: 'CSS layout' },
        { id: 2, title: 'Angular forms' },
        { id: 5, title: 'Git workflows' },
        { id: 1, title: 'Angular basics' },
        { id: 3, title: 'Python collections' },
      ],
    },
    starter: shell(
      '<input data-testid="query"><button data-testid="search">Search</button><ul data-testid="list"></ul><button data-testid="previous">Previous</button><output data-testid="page"></output><button data-testid="next">Next</button><output data-testid="total"></output>',
    ),
    scenarios: [
      scenario(
        'First page',
        'Load a sorted first page and disable Previous.',
        ui('result-row', 2, 'count'),
        ui('list', 'Angular basics', 'contains'),
        ui('page', '1'),
        ui('total', '5'),
        ui('previous', true, 'disabled'),
      ),
      scenario(
        'Navigate to final page',
        'Use API pages and disable Next on the last page.',
        click('next'),
        ui('page', '2'),
        ui('list', 'Python collections', 'contains'),
        click('next'),
        ui('page', '3'),
        ui('result-row', 1, 'count'),
        ui('next', true, 'disabled'),
        click('previous'),
        ui('page', '2'),
      ),
      scenario(
        'Search resets pagination',
        'Reset the page before querying a new filter.',
        click('next'),
        input('query', 'angular'),
        click('search'),
        ui('page', '1'),
        ui('total', '2'),
        ui('result-row', 2, 'count'),
        ui('next', true, 'disabled'),
      ),
      scenario(
        'No matches',
        'An empty filter result has total 0 and both buttons disabled.',
        input('query', 'absent'),
        click('search'),
        ui('total', '0'),
        ui('result-row', 0, 'count'),
        ui('previous', true, 'disabled'),
        ui('next', true, 'disabled'),
      ),
      scenario(
        'API page boundaries',
        'Sort before slicing and preserve the stored order.',
        request('GET', '/articles?page=2&pageSize=2'),
        response('status', 200),
        response('body', {
          items: [
            { id: 3, title: 'Python collections' },
            { id: 4, title: 'CSS layout' },
          ],
          total: 5,
          page: 2,
          pageSize: 2,
        }),
        db('articles.0.id', 4),
      ),
      scenario(
        'Beyond last page',
        'Do not silently clamp a requested page.',
        request('GET', '/articles?page=9&pageSize=2'),
        response('body', { items: [], total: 5, page: 9, pageSize: 2 }),
      ),
      scenario(
        'API query count',
        'Count only matching records before pagination.',
        request('GET', '/articles?q=ANGULAR&page=2&pageSize=1'),
        response('body', {
          items: [{ id: 2, title: 'Angular forms' }],
          total: 2,
          page: 2,
          pageSize: 1,
        }),
      ),
      ...['page=0', 'page=-1', 'page=1.5', 'page=2x', 'pageSize=0', 'pageSize=6'].map((value) =>
        scenario(
          'Reject ' + value,
          'Validate complete query parameter values, not parseInt prefixes.',
          request('GET', '/articles?' + value),
          response('status', 400),
        ),
      ),
      scenario(
        'Retry failed read',
        'A failed reload must remain recoverable.',
        { action: 'failNext', method: 'GET' },
        click('reload'),
        ui('status', 'Error'),
        click('reload'),
        ui('status', 'Ready'),
      ),
      layout,
    ],
    hints: [
      'Filter first, calculate total second, then sort and slice.',
      'Keep page state explicit; changing the query changes the page boundary.',
      'Reject malformed complete values such as 2x, not just negative numbers.',
    ],
    explanation:
      'Server-side pagination is an API contract, not just a UI slice. Stable ordering, totals, boundaries and strict input validation prevent skipped, duplicated or misleading result pages.',
  },
  {
    description:
      'Build a bulk ticket-status update that either changes every selected record or changes none.',
    requirements: [
      ...common,
      'Use ids for comma-separated ticket IDs, state for an open/closed select, apply for the submit button, and list with one ticket-row per ticket. Each row must include status-ID showing its status.',
      'Parse the IDs as numbers and send one PATCH request. Clear ids only after success. Keep the selection on failure. Reload must confirm saved changes.',
      'The API must validate the whole batch before writing. A nonexistent ID, duplicate, malformed ID, empty batch or invalid status must leave every record unchanged.',
    ],
    apiReference:
      apiHelp +
      'GET /tickets -> 200 {items} ordered by id. PATCH /tickets/bulk {ids,status} -> 200 {updated:count}. ids must be a nonempty array of unique positive integer numbers, maximum 20; status must be open or closed. Invalid shape, duplicates or values -> 400; well-formed IDs containing any missing record -> 404. Validate shape before existence. Only after all checks pass, update matching statuses in db.tickets. Unknown routes -> 404.',
    initial: {
      tickets: [
        { id: 1, title: 'Login issue', status: 'open' },
        { id: 2, title: 'Export issue', status: 'open' },
        { id: 3, title: 'Old request', status: 'closed' },
      ],
    },
    starter: shell(
      '<input data-testid="ids"><select data-testid="state"><option value="open">Open</option><option value="closed">Closed</option></select><button data-testid="apply">Apply status</button><ul data-testid="list"></ul>',
    ),
    scenarios: [
      scenario(
        'Read tickets',
        'Load the current state of all records.',
        ui('ticket-row', 3, 'count'),
        ui('status-1', 'open'),
        ui('status-3', 'closed'),
      ),
      scenario(
        'Update and reload',
        'Commit all selected changes, then reload the API.',
        input('ids', '1,2'),
        input('state', 'closed'),
        click('apply'),
        ui('status', 'Saved'),
        ui('ids', '', 'value'),
        click('reload'),
        ui('status-1', 'closed'),
        ui('status-2', 'closed'),
        db('tickets.0.status', 'closed'),
        db('tickets.1.status', 'closed'),
      ),
      scenario(
        'UI missing ID',
        'Keep the entered IDs and leave earlier valid records untouched.',
        input('ids', '1,99'),
        input('state', 'closed'),
        click('apply'),
        ui('status', 'Error'),
        ui('ids', '1,99', 'value'),
        click('reload'),
        ui('status-1', 'open'),
      ),
      scenario(
        'API atomic rejection',
        'Check all IDs before changing the first ticket.',
        request('PATCH', '/tickets/bulk', { ids: [1, 99], status: 'closed' }),
        response('status', 404),
        db('tickets.0.status', 'open'),
        db('tickets.1.status', 'open'),
      ),
      scenario(
        'API successful batch',
        'Update only the selected records.',
        request('PATCH', '/tickets/bulk', { ids: [1, 3], status: 'closed' }),
        response('status', 200),
        response('body.updated', 2),
        db('tickets.0.status', 'closed'),
        db('tickets.1.status', 'open'),
      ),
      ...[
        { ids: [], status: 'closed' },
        { ids: [1, 1], status: 'closed' },
        { ids: ['1'], status: 'closed' },
        { ids: [1, 2], status: 'deleted' },
        { ids: [1, 1.5], status: 'closed' },
        { ids: [1, 99], status: 'invalid' },
      ].map((body, index) =>
        scenario(
          [
            'Reject an empty selection',
            'Reject duplicate IDs',
            'Reject string IDs',
            'Reject an invalid status',
            'Reject fractional IDs',
            'Validate shape before existence',
          ][index],
          'Reject invalid batches before changing data.',
          request('PATCH', '/tickets/bulk', body),
          response('status', 400),
          db('tickets.0.status', 'open'),
          db('tickets.1.status', 'open'),
        ),
      ),
      scenario(
        'Failed write and retry',
        'Preserve the selection on a transport failure.',
        { action: 'failNext', method: 'PATCH', path: '/tickets/bulk' },
        input('ids', '2'),
        input('state', 'closed'),
        click('apply'),
        ui('status', 'Error'),
        ui('ids', '2', 'value'),
        click('apply'),
        ui('status', 'Saved'),
        db('tickets.1.status', 'closed'),
      ),
      layout,
    ],
    hints: [
      'Validate the complete shape first, then resolve every requested ID.',
      'Make a separate write pass only after all validation succeeds.',
      'Treat the editor selection as unsaved input until the API confirms success.',
    ],
    explanation:
      'Bulk mutations need atomic failure behavior. Validating and resolving the entire batch before writing prevents partial updates. This local serialized worker models one atomic handler, not distributed database transactions.',
  },
];
