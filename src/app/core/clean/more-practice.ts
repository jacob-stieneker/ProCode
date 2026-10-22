import type { CleanExercise } from './model';
import type { Check } from '../exercises';
const check = (name: string, input: unknown[], expected: unknown, hint: string): Check => ({
  name,
  input,
  expected,
  hint,
});
const paginationHint =
  'Use zero-based start and exclusive end. Clamp both to total; an empty collection has zero pages.';
const retryHint =
  'Compute exponential delay from attempt 0, respect the optional minimum, then apply the maximum cap.';
const tagsHint =
  'Normalize each tag, remove blanks and duplicates, and sort without changing any caller-owned record or tag array.';
const couponHint =
  'Preserve validation priority: inactive, minimum, exclusive, new-customer-only, then eligible.';
const reportHint =
  'Count every event once. Slow services are unique, sorted, and include durations exactly at the threshold.';
const roleHint =
  'Keep the input role order. Unknown roles have no permissions, including names inherited by ordinary JavaScript objects.';
export const moreCleanPractice: Omit<CleanExercise, 'id' | 'title' | 'difficulty' | 'version'>[] = [
  {
    description:
      'Single-letter variables obscure page boundaries. Make the names explain the calculation without changing its behavior.',
    requirements: [
      'Implement paginationWindow / pagination_window with total, pageSize and page arguments. total is an integer from 0 to 10000, pageSize from 1 to 100, and page is one-based from 1 to 10000.',
      'Return {start, end, totalPages}. start is min(total, (page - 1) × pageSize), end is min(total, start + pageSize), and totalPages is ceil(total / pageSize). end is exclusive; pages beyond the last return an empty range at total.',
      'Every declared function, parameter and variable name must contain at least three characters after underscores are removed. This includes loop bindings and helpers. Choose meaningful names; the automatic check measures length, not quality of meaning.',
    ],
    signature: { javascript: 'paginationWindow', python: 'pagination_window' },
    starter: {
      javascript: `function paginationWindow(t, s, p) {
 const a = Math.min(t, (p - 1) * s);
 const b = Math.min(t, a + s);
 const c = Math.ceil(t / s);
 return {start: a, end: b, totalPages: c};
}`,
      python: `def pagination_window(t, s, p):
    a = min(t, (p - 1) * s)
    b = min(t, a + s)
    c = (t + s - 1) // s
    return {"start": a, "end": b, "totalPages": c}
`,
    },
    examples: [
      check('First page', [23, 10, 1], { start: 0, end: 10, totalPages: 3 }, paginationHint),
      check(
        'Partial last page',
        [23, 10, 3],
        { start: 20, end: 23, totalPages: 3 },
        paginationHint,
      ),
      check('Empty collection', [0, 10, 1], { start: 0, end: 0, totalPages: 0 }, paginationHint),
    ],
    additional: [
      check('Beyond last page', [23, 10, 9], { start: 23, end: 23, totalPages: 3 }, paginationHint),
      check('Exact multiple', [20, 10, 2], { start: 10, end: 20, totalPages: 2 }, paginationHint),
      check('One item per page', [3, 1, 2], { start: 1, end: 2, totalPages: 3 }, paginationHint),
      check('Oversized page', [2, 100, 1], { start: 0, end: 2, totalPages: 1 }, paginationHint),
      check(
        'Largest collection',
        [10000, 100, 100],
        { start: 9900, end: 10000, totalPages: 100 },
        paginationHint,
      ),
    ],
    rules: [
      {
        kind: 'names',
        name: 'Explain pagination with names',
        hint: 'Replace every binding shorter than three characters with a name that explains its role.',
      },
    ],
    hints: [
      'Separate the collection size, page size and requested page in your naming.',
      'Name the two offsets and the count of pages.',
      'The output keys and public function name are part of the contract; keep them unchanged.',
    ],
    explanation:
      'Boundary calculations become easier to review when names distinguish counts, indexes and exclusive limits. Refactoring must preserve empty and beyond-last-page behavior.',
  },
  {
    description:
      'Retry timing contains unexplained numbers. Name the policy values while preserving the delay calculation.',
    requirements: [
      'Implement retryDelay / retry_delay for attempt (integer 0 through 20) and retryAfterMs (null/None or integer 0 through 120000). Return a delay in milliseconds.',
      'Base delay is 500 × 2^attempt. Treat null/None retryAfterMs as 0. Take the greater of base delay and retryAfterMs, then cap the result at 30000. The cap always wins, even over a larger override. This is a pure timing calculation; do not sleep or make requests.',
      'Move the policy literals 500 and 30000 outside all functions into named module-level constants. Refer to them rather than repeating numeric policy literals in function bodies.',
    ],
    signature: { javascript: 'retryDelay', python: 'retry_delay' },
    starter: {
      javascript: `function retryDelay(attempt, retryAfterMs) {
 const delay = Math.max(500 * 2 ** attempt, retryAfterMs ?? 0);
 return Math.min(30000, delay);
}`,
      python: `def retry_delay(attempt, retry_after_ms):
    delay = max(500 * 2 ** attempt, retry_after_ms if retry_after_ms is not None else 0)
    return min(30000, delay)
`,
    },
    examples: [
      check('First attempt', [0, null], 500, retryHint),
      check('Exponential delay', [3, null], 4000, retryHint),
      check('Requested minimum', [1, 5000], 5000, retryHint),
    ],
    additional: [
      check('Zero override', [0, 0], 500, retryHint),
      check('Lower override', [3, 1000], 4000, retryHint),
      check('Before cap', [5, null], 16000, retryHint),
      check('Cross cap', [6, null], 30000, retryHint),
      check('Override above cap', [0, 120000], 30000, retryHint),
      check('Largest attempt', [20, null], 30000, retryHint),
    ],
    rules: [
      {
        kind: 'numbers',
        values: [500, 30000],
        name: 'Name retry policy constants',
        hint: 'Declare both policy numbers outside functions and give them descriptive names.',
      },
    ],
    hints: [
      'The base interval and maximum interval are policy, while doubling is the algorithm.',
      'Keep the order: exponential delay, requested minimum, maximum cap.',
      'An override of zero is valid and should still leave the base delay intact.',
    ],
    explanation:
      'Named policy constants let a reviewer distinguish a configuration decision from arithmetic. This exercise preserves a specified policy, not a universal recommendation for network retries.',
  },
  {
    description:
      'Tag cleanup mutates records shared with the caller. Keep the normalized output while making the transformation safe to reuse.',
    requirements: [
      'Implement normalizeTags / normalize_tags. Each record contains a unique integer id and a tags array/list of strings containing ASCII letters and spaces.',
      'Return records in input order with the same id and normalized tags: trim outer spaces, lowercase, remove blank strings and duplicates, then sort alphabetically. Inputs contain only id and tags.',
      'Preserve the input list, every record and every nested tags list. Return new result records. A shallow outer copy is insufficient; no specific copying syntax is required.',
    ],
    signature: { javascript: 'normalizeTags', python: 'normalize_tags' },
    starter: {
      javascript: `function normalizeTags(records) {
 for (const record of records) {
  record.tags = [...new Set(record.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))].sort();
 }
 return records;
}`,
      python: `def normalize_tags(records):
    for record in records:
        record["tags"] = sorted(set(tag.strip().lower() for tag in record["tags"] if tag.strip()))
    return records
`,
    },
    examples: [
      check(
        'Normalize and deduplicate',
        [[{ id: 1, tags: [' Python ', 'python', 'CSS', ''] }]],
        [{ id: 1, tags: ['css', 'python'] }],
        tagsHint,
      ),
      check('Blank tags', [[{ id: 2, tags: ['', '   '] }]], [{ id: 2, tags: [] }], tagsHint),
      check('Empty records', [[]], [], tagsHint),
    ],
    additional: [
      check(
        'Stable record order',
        [
          [
            { id: 9, tags: ['Zoo', 'alpha'] },
            { id: 2, tags: ['Beta'] },
          ],
        ],
        [
          { id: 9, tags: ['alpha', 'zoo'] },
          { id: 2, tags: ['beta'] },
        ],
        tagsHint,
      ),
      check(
        'Already normalized',
        [[{ id: 1, tags: ['alpha', 'beta'] }]],
        [{ id: 1, tags: ['alpha', 'beta'] }],
        tagsHint,
      ),
      check(
        'Repeated case variants',
        [[{ id: 3, tags: ['Git', 'GIT', 'git', ' Git '] }]],
        [{ id: 3, tags: ['git'] }],
        tagsHint,
      ),
      check('Empty nested array', [[{ id: 7, tags: [] }]], [{ id: 7, tags: [] }], tagsHint),
      check(
        'Keep internal spaces',
        [[{ id: 4, tags: ['Web Dev', ' web dev ', 'Web  Dev'] }]],
        [{ id: 4, tags: ['web  dev', 'web dev'] }],
        tagsHint,
      ),
    ],
    preserveInputs: true,
    rules: [],
    hints: [
      'Map each input record into a new result record.',
      'Transform and sort a new tags collection instead of changing the original.',
      'Deduplicate after trimming and case normalization, not before.',
    ],
    explanation:
      'Nested data needs protection at every level you change. A pure normalization function is easier to reuse in previews, reducers and validation without surprising other consumers.',
  },
  {
    description:
      'Coupon rules are buried inside a nested success path. Expose rejection priority and give the minimum-order policy a name.',
    requirements: [
      'Implement couponResult / coupon_result for {active, subtotalCents, existingDiscount, firstOrderOnly, firstOrder}. Flags are booleans and subtotalCents is a nonnegative integer.',
      'Return inactive when not active; otherwise minimum when subtotalCents < 2000; otherwise exclusive when existingDiscount; otherwise new-customer-only when firstOrderOnly and not firstOrder; otherwise eligible. Check in this exact priority.',
      'Keep decision nesting at most one level inside each function, including conditional expressions. Move the literal 2000 outside functions into a named module-level constant.',
    ],
    signature: { javascript: 'couponResult', python: 'coupon_result' },
    starter: {
      javascript: `function couponResult(order) {
 if (order.active) {
  if (order.subtotalCents >= 2000) {
   if (!order.existingDiscount) {
    if (!order.firstOrderOnly || order.firstOrder) return 'eligible';
    else return 'new-customer-only';
   } else return 'exclusive';
  } else return 'minimum';
 } else return 'inactive';
}`,
      python: `def coupon_result(order):
    if order["active"]:
        if order["subtotalCents"] >= 2000:
            if not order["existingDiscount"]:
                if not order["firstOrderOnly"] or order["firstOrder"]: return "eligible"
                else: return "new-customer-only"
            else: return "exclusive"
        else: return "minimum"
    else: return "inactive"
`,
    },
    examples: [
      check(
        'Eligible boundary',
        [
          {
            active: true,
            subtotalCents: 2000,
            existingDiscount: false,
            firstOrderOnly: true,
            firstOrder: true,
          },
        ],
        'eligible',
        couponHint,
      ),
      check(
        'Below minimum',
        [
          {
            active: true,
            subtotalCents: 1999,
            existingDiscount: false,
            firstOrderOnly: false,
            firstOrder: false,
          },
        ],
        'minimum',
        couponHint,
      ),
      check(
        'Existing discount',
        [
          {
            active: true,
            subtotalCents: 5000,
            existingDiscount: true,
            firstOrderOnly: false,
            firstOrder: false,
          },
        ],
        'exclusive',
        couponHint,
      ),
    ],
    additional: [
      check(
        'Inactive takes priority',
        [
          {
            active: false,
            subtotalCents: 0,
            existingDiscount: true,
            firstOrderOnly: true,
            firstOrder: false,
          },
        ],
        'inactive',
        couponHint,
      ),
      check(
        'Minimum before exclusivity',
        [
          {
            active: true,
            subtotalCents: 0,
            existingDiscount: true,
            firstOrderOnly: true,
            firstOrder: false,
          },
        ],
        'minimum',
        couponHint,
      ),
      check(
        'Exclusive before customer rule',
        [
          {
            active: true,
            subtotalCents: 2000,
            existingDiscount: true,
            firstOrderOnly: true,
            firstOrder: false,
          },
        ],
        'exclusive',
        couponHint,
      ),
      check(
        'Returning customer restricted',
        [
          {
            active: true,
            subtotalCents: 3000,
            existingDiscount: false,
            firstOrderOnly: true,
            firstOrder: false,
          },
        ],
        'new-customer-only',
        couponHint,
      ),
      check(
        'Unrestricted returning customer',
        [
          {
            active: true,
            subtotalCents: 3000,
            existingDiscount: false,
            firstOrderOnly: false,
            firstOrder: false,
          },
        ],
        'eligible',
        couponHint,
      ),
    ],
    rules: [
      {
        kind: 'nesting',
        limit: 1,
        name: 'Flatten coupon decisions',
        hint: 'Use ordered guard clauses or an equivalent flat decision chain.',
      },
      {
        kind: 'numbers',
        values: [2000],
        name: 'Name the minimum-order policy',
        hint: 'Move 2000 to a named module-level constant outside all functions.',
      },
    ],
    hints: [
      'List the rejection reasons in their required order.',
      'Return immediately for each failed rule.',
      'After the rejection guards, only eligible remains.',
    ],
    explanation:
      'Flattening validation is safe only if error priority is preserved. Separating the threshold also makes later policy changes easier to locate.',
  },
  {
    description:
      'A log report combines counting, threshold policy and distinct-service collection in one large function. Extract focused helpers.',
    requirements: [
      'Implement logReport / log_report. Each event has level (info, warn or error), a lowercase ASCII service name and nonnegative integer durationMs.',
      'Return {counts:{info,warn,error}, slowServices, maxDurationMs}. Count every event by level; slowServices is a sorted unique list of services with at least one duration >= 1000. maxDurationMs is the largest duration, or 0 for no events.',
      'Preserve inputs. Reach at least two named helpers through direct calls and keep the public entry point within eight statements, including nested statements. Move the literal 1000 outside all functions into a named module-level constant. Helpers must perform real responsibilities; source checks do not judge every design decision.',
    ],
    signature: { javascript: 'logReport', python: 'log_report' },
    starter: {
      javascript: `function logReport(events) {
 const counts = {info:0,warn:0,error:0};
 const slowServices = [];
 let maxDurationMs = 0;
 for (const event of events) {
  counts[event.level] += 1;
  if (event.durationMs >= 1000) {
   if (!slowServices.includes(event.service)) slowServices.push(event.service);
  }
  maxDurationMs = Math.max(maxDurationMs, event.durationMs);
 }
 slowServices.sort();
 return {counts,slowServices,maxDurationMs};
}`,
      python: `def log_report(events):
    counts = {"info": 0, "warn": 0, "error": 0}
    slow_services = []
    max_duration_ms = 0
    for event in events:
        counts[event["level"]] += 1
        if event["durationMs"] >= 1000:
            if event["service"] not in slow_services: slow_services.append(event["service"])
        max_duration_ms = max(max_duration_ms, event["durationMs"])
    slow_services.sort()
    return {"counts": counts, "slowServices": slow_services, "maxDurationMs": max_duration_ms}
`,
    },
    examples: [
      check(
        'Mixed event levels',
        [
          [
            { level: 'info', service: 'api', durationMs: 20 },
            { level: 'warn', service: 'db', durationMs: 1000 },
            { level: 'error', service: 'api', durationMs: 1500 },
          ],
        ],
        {
          counts: { info: 1, warn: 1, error: 1 },
          slowServices: ['api', 'db'],
          maxDurationMs: 1500,
        },
        reportHint,
      ),
      check(
        'Empty report',
        [[]],
        { counts: { info: 0, warn: 0, error: 0 }, slowServices: [], maxDurationMs: 0 },
        reportHint,
      ),
      check(
        'Below threshold',
        [[{ level: 'info', service: 'api', durationMs: 999 }]],
        { counts: { info: 1, warn: 0, error: 0 }, slowServices: [], maxDurationMs: 999 },
        reportHint,
      ),
    ],
    additional: [
      check(
        'Threshold is inclusive',
        [[{ level: 'warn', service: 'cache', durationMs: 1000 }]],
        { counts: { info: 0, warn: 1, error: 0 }, slowServices: ['cache'], maxDurationMs: 1000 },
        reportHint,
      ),
      check(
        'Distinct sorted services',
        [
          [
            { level: 'error', service: 'worker', durationMs: 2000 },
            { level: 'error', service: 'worker', durationMs: 3000 },
            { level: 'info', service: 'api', durationMs: 1000 },
          ],
        ],
        {
          counts: { info: 1, warn: 0, error: 2 },
          slowServices: ['api', 'worker'],
          maxDurationMs: 3000,
        },
        reportHint,
      ),
      check(
        'Zero duration',
        [[{ level: 'info', service: 'api', durationMs: 0 }]],
        { counts: { info: 1, warn: 0, error: 0 }, slowServices: [], maxDurationMs: 0 },
        reportHint,
      ),
      check(
        'Max independent of level',
        [
          [
            { level: 'info', service: 'db', durationMs: 9000 },
            { level: 'error', service: 'api', durationMs: 50 },
          ],
        ],
        { counts: { info: 1, warn: 0, error: 1 }, slowServices: ['db'], maxDurationMs: 9000 },
        reportHint,
      ),
    ],
    preserveInputs: true,
    rules: [
      {
        kind: 'helpers',
        limit: 8,
        name: 'Separate report responsibilities',
        hint: 'Reach at least two named helpers and keep the entry point within eight statements.',
      },
      {
        kind: 'numbers',
        values: [1000],
        name: 'Name the slow-event threshold',
        hint: 'Declare the threshold outside all functions and refer to its name.',
      },
    ],
    hints: [
      'Counting levels and collecting slow services are distinct operations.',
      'Keep threshold policy in one named module-level value.',
      'Let the public entry point coordinate helpers and assemble the result.',
    ],
    explanation:
      'Decomposition lets counting and service-selection rules change independently. Empty input, inclusive boundaries and duplicate services protect behavior during restructuring.',
  },
  {
    description:
      'Repeated role comparisons scatter permission knowledge through the code. Centralize the role policy in one shared table.',
    requirements: [
      'Implement rolePermissions / role_permissions for a list of role strings. Preserve input order and return {role,read,write,manage} for each role.',
      'viewer maps to true/false/false; editor maps to true/true/false; admin maps to true/true/true. Every other role maps to false/false/false. Matching is case-sensitive; do not normalize input roles.',
      'Keep role keys viewer, editor and admin outside all function bodies in a module-level policy table. Those string literals must not appear in functions. Consume the shared rules and preserve the input list. This is a refactoring model, not production authorization middleware.',
    ],
    signature: { javascript: 'rolePermissions', python: 'role_permissions' },
    starter: {
      javascript: `function rolePermissions(roles) {
 return roles.map(role => {
  const read = role === 'viewer' || role === 'editor' || role === 'admin';
  const write = role === 'editor' || role === 'admin';
  const manage = role === 'admin';
  return {role,read,write,manage};
 });
}`,
      python: `def role_permissions(roles):
    results = []
    for role in roles:
        read = role in ["viewer", "editor", "admin"]
        write = role in ["editor", "admin"]
        manage = role == "admin"
        results.append({"role": role, "read": read, "write": write, "manage": manage})
    return results
`,
    },
    examples: [
      check(
        'Viewer role',
        [['viewer']],
        [{ role: 'viewer', read: true, write: false, manage: false }],
        roleHint,
      ),
      check(
        'Editor role',
        [['editor']],
        [{ role: 'editor', read: true, write: true, manage: false }],
        roleHint,
      ),
      check(
        'Unknown role',
        [['guest']],
        [{ role: 'guest', read: false, write: false, manage: false }],
        roleHint,
      ),
    ],
    additional: [
      check(
        'Admin role',
        [['admin']],
        [{ role: 'admin', read: true, write: true, manage: true }],
        roleHint,
      ),
      check('Empty roles', [[]], [], roleHint),
      check(
        'Case sensitive',
        [['Admin', 'EDITOR']],
        [
          { role: 'Admin', read: false, write: false, manage: false },
          { role: 'EDITOR', read: false, write: false, manage: false },
        ],
        roleHint,
      ),
      check(
        'Repeated roles retain order',
        [['editor', 'viewer', 'editor']],
        [
          { role: 'editor', read: true, write: true, manage: false },
          { role: 'viewer', read: true, write: false, manage: false },
          { role: 'editor', read: true, write: true, manage: false },
        ],
        roleHint,
      ),
      check(
        'Object-like names',
        [['constructor', '__proto__', 'toString']],
        [
          { role: 'constructor', read: false, write: false, manage: false },
          { role: '__proto__', read: false, write: false, manage: false },
          { role: 'toString', read: false, write: false, manage: false },
        ],
        roleHint,
      ),
    ],
    preserveInputs: true,
    rules: [
      {
        kind: 'strings',
        values: ['viewer', 'editor', 'admin'],
        name: 'Centralize role policy',
        hint: 'Place all three role keys in module-level rules and consume the table inside functions.',
      },
    ],
    hints: [
      'Store the three permission values together for each role.',
      'Use an explicit default policy for unknown roles.',
      'In JavaScript, Map or an own-property check prevents inherited object keys from appearing to be defined roles.',
    ],
    explanation:
      'A shared policy table reduces duplicated branching and inconsistent edits. Unknown identifiers need an explicit fallback; real authorization must also validate identity and enforce permissions on a trusted server.',
  },
];
