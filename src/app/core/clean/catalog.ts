import { moreCleanPractice } from './more-practice';
import { cleanExpansion } from './expansion';
import { cleanExerciseInfo, CleanExercise } from './model';
import type { Check } from '../exercises';
const check = (
  name: string,
  input: unknown[],
  expected: unknown,
  hint = 'Preserve the documented result for this input.',
): Check => ({ name, input, expected, hint });
const definitions: Omit<CleanExercise, 'id' | 'title' | 'difficulty' | 'version'>[] = [
  {
    description:
      'The total is correct, but single-letter names make the calculation hard to follow. Refactor the names without changing the calculation.',
    requirements: [
      'Return the sum of priceCents × quantity for all lines. Values are nonnegative integers; an empty order totals 0. Keep the public function name.',
      'Give every declared function, parameter and local variable a name of at least three characters. Use names that explain their purpose. This exercise intentionally also applies that limit to loop variables.',
      'Automatic checks verify the length of binding names, not whether a name communicates its meaning. Comments and formatting alone do not satisfy the cleanup.',
    ],
    signature: { javascript: 'orderTotal', python: 'order_total' },
    starter: {
      javascript: `function orderTotal(a) {
  let x = 0;
  for (const b of a) {
    const c = b.priceCents * b.quantity;
    x = x + c;
  }
  return x;
}`,
      python: `def order_total(a):
    x = 0
    for b in a:
        c = b["priceCents"] * b["quantity"]
        x = x + c
    return x
`,
    },
    examples: [
      check(
        'Two order lines',
        [
          [
            { priceCents: 250, quantity: 2 },
            { priceCents: 125, quantity: 3 },
          ],
        ],
        875,
      ),
      check('Empty order', [[]], 0),
      check('Zero quantity', [[{ priceCents: 900, quantity: 0 }]], 0),
    ],
    additional: [
      check('Free item', [[{ priceCents: 0, quantity: 5 }]], 0),
      check('Single item', [[{ priceCents: 499, quantity: 1 }]], 499),
      check(
        'Repeated prices',
        [
          [
            { priceCents: 100, quantity: 2 },
            { priceCents: 100, quantity: 3 },
          ],
        ],
        500,
      ),
    ],
    rules: [
      {
        kind: 'names',
        name: 'Replace short binding names',
        hint: 'Rename parameters, locals and helper functions to at least three characters. Choose purpose-revealing names.',
      },
    ],
    hints: [
      'Start with the input: what does each element represent?',
      'Name the accumulated value and the total for a single line.',
      'The public function name stays the same. You may also replace the loop with an equivalent sum or reduction.',
    ],
    explanation:
      'Names reduce the work needed to understand a calculation. Behavioral checks protect the existing contract while you refactor.',
  },
  {
    description:
      'Nested conditions hide the reason access is denied. Flatten the decision flow while preserving its priority.',
    requirements: [
      'The input has boolean signedIn, active and editor fields. Return sign-in first if not signed in, inactive next if not active, read-only next if not an editor, otherwise edit.',
      'Keep decision nesting to at most one level inside each function. Use early returns, a flat conditional chain or an equivalent non-nested approach. Nested conditional expressions also count.',
    ],
    signature: { javascript: 'accessLevel', python: 'access_level' },
    starter: {
      javascript: `function accessLevel(user) {
  if (user.signedIn) {
    if (user.active) {
      if (user.editor) { return 'edit'; }
      else { return 'read-only'; }
    } else { return 'inactive'; }
  } else { return 'sign-in'; }
}`,
      python: `def access_level(user):
    if user["signedIn"]:
        if user["active"]:
            if user["editor"]:
                return "edit"
            else:
                return "read-only"
        else:
            return "inactive"
    else:
        return "sign-in"
`,
    },
    examples: [
      check('Not signed in', [{ signedIn: false, active: true, editor: true }], 'sign-in'),
      check('Inactive account', [{ signedIn: true, active: false, editor: true }], 'inactive'),
      check('Editor', [{ signedIn: true, active: true, editor: true }], 'edit'),
    ],
    additional: [
      check('Read-only account', [{ signedIn: true, active: true, editor: false }], 'read-only'),
      check('All flags false', [{ signedIn: false, active: false, editor: false }], 'sign-in'),
      check('Inactive reader', [{ signedIn: true, active: false, editor: false }], 'inactive'),
    ],
    rules: [
      {
        kind: 'nesting',
        limit: 1,
        name: 'Flatten decision nesting',
        hint: 'Handle denial cases in priority order and return early instead of placing one decision inside another.',
      },
    ],
    hints: [
      'Write down which denial reason takes precedence.',
      'Return as soon as a denial condition is met.',
      'After the denial cases, only edit remains.',
    ],
    explanation: 'Guard clauses make priority visible and leave the successful path easy to read.',
  },
  {
    description:
      'Shipping policy is scattered as unexplained numbers. Name the business values and keep the existing pricing behavior.',
    requirements: [
      'subtotalCents is a nonnegative integer and expedited is boolean. Standard shipping costs 499 below 5000 and is free at or above 5000. Expedited shipping always adds 899.',
      'Move the policy values 499, 5000 and 899 out of function bodies into named module-level constants. None of these numeric literals may occur inside a function. Do not hard-code individual test answers.',
    ],
    signature: { javascript: 'shippingCost', python: 'shipping_cost' },
    starter: {
      javascript: `function shippingCost(subtotalCents, expedited) {
  if (subtotalCents >= 5000) {
    return expedited ? 899 : 0;
  }
  return expedited ? 499 + 899 : 499;
}`,
      python: `def shipping_cost(subtotal_cents, expedited):
    if subtotal_cents >= 5000:
        return 899 if expedited else 0
    return 499 + 899 if expedited else 499
`,
    },
    examples: [
      check('Standard delivery', [1000, false], 499),
      check('Free threshold', [5000, false], 0),
      check('Expedited small order', [2500, true], 1398),
    ],
    additional: [
      check('Just below threshold', [4999, false], 499),
      check('Expedited eligible order', [5000, true], 899),
      check('Empty basket subtotal', [0, false], 499),
      check('Large order', [12500, true], 899),
    ],
    rules: [
      {
        kind: 'numbers',
        values: [499, 5000, 899],
        name: 'Extract policy constants',
        hint: 'Declare named policy constants outside the functions and refer to them instead of repeating these numeric literals.',
      },
    ],
    hints: [
      'Give the threshold and each shipping fee its own name.',
      'Keep the values at module level so policy changes have a clear home.',
      'Preserve the exact threshold: 5000 qualifies for free standard shipping.',
    ],
    explanation:
      'Named policy constants expose intent and avoid inconsistent edits to repeated business values.',
  },
  {
    description:
      'The ranking result is correct, but sorting the caller’s array and changing its records creates surprising side effects. Return the same ranking without changing any input.',
    requirements: [
      'Input records contain a unique integer id and a nonnegative integer score. Return new records with id, score and rank (starting at 1), sorted by score descending and id ascending for ties.',
      'Do not reorder the input array or add/change fields on its records. A shallow array copy alone does not protect the record objects. No source pattern is required; cleanup is verified through the caller’s input after execution.',
    ],
    signature: { javascript: 'rankScores', python: 'rank_scores' },
    starter: {
      javascript: `function rankScores(records) {
  records.sort((left, right) => right.score - left.score || left.id - right.id);
  records.forEach((record, index) => { record.rank = index + 1; });
  return records;
}`,
      python: `def rank_scores(records):
    records.sort(key=lambda record: (-record["score"], record["id"]))
    for index, record in enumerate(records):
        record["rank"] = index + 1
    return records
`,
    },
    examples: [
      check(
        'Different scores',
        [
          [
            { id: 2, score: 10 },
            { id: 1, score: 30 },
          ],
        ],
        [
          { id: 1, score: 30, rank: 1 },
          { id: 2, score: 10, rank: 2 },
        ],
      ),
      check('Empty ranking', [[]], []),
      check(
        'Tie uses ID',
        [
          [
            { id: 3, score: 5 },
            { id: 1, score: 5 },
          ],
        ],
        [
          { id: 1, score: 5, rank: 1 },
          { id: 3, score: 5, rank: 2 },
        ],
      ),
    ],
    additional: [
      check('One record', [[{ id: 7, score: 0 }]], [{ id: 7, score: 0, rank: 1 }]),
      check(
        'Already sorted',
        [
          [
            { id: 1, score: 20 },
            { id: 2, score: 10 },
          ],
        ],
        [
          { id: 1, score: 20, rank: 1 },
          { id: 2, score: 10, rank: 2 },
        ],
      ),
      check(
        'Several ties',
        [
          [
            { id: 4, score: 5 },
            { id: 2, score: 9 },
            { id: 1, score: 5 },
          ],
        ],
        [
          { id: 2, score: 9, rank: 1 },
          { id: 1, score: 5, rank: 2 },
          { id: 4, score: 5, rank: 3 },
        ],
      ),
    ],
    rules: [],
    preserveInputs: true,
    hints: [
      'Sorting in place changes the order visible to the caller.',
      'Adding rank to an existing record also mutates the caller’s data.',
      'Build new ranked records from a sorted copy.',
    ],
    explanation:
      'Refactoring should remove hidden side effects as well as improve readability. This contract deliberately requires preserving the caller’s input.',
  },
  {
    description:
      'Invoice calculation mixes aggregation, discount policy and tax policy into one function. Extract focused helpers and leave a short coordinating entry point.',
    requirements: [
      'Each line has nonnegative integer priceCents and quantity. Subtotal is their product sum. A member receives a 10% discount rounded down to cents; others receive 0. Tax is 8% of the discounted subtotal, rounded down. Return {subtotalCents, discountCents, taxCents, totalCents}.',
      'The public entry point must call at least two named helper functions reachable through direct calls, and contain at most eight statements (including nested statements). Helpers may be declarations, assigned functions or assigned arrows in JavaScript, and def functions in Python. Extract real responsibilities; empty helpers do not improve the design.',
      'Inputs must remain unchanged. These measurable checks verify decomposition, not whether every helper has an ideal responsibility.',
    ],
    signature: { javascript: 'invoiceSummary', python: 'invoice_summary' },
    starter: {
      javascript: `function invoiceSummary(lines, member) {
  let subtotalCents = 0;
  for (const line of lines) {
    const lineTotal = line.priceCents * line.quantity;
    subtotalCents = subtotalCents + lineTotal;
  }
  let discountCents = 0;
  if (member) { discountCents = Math.floor(subtotalCents * 10 / 100); }
  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.floor(taxableCents * 8 / 100);
  const totalCents = taxableCents + taxCents;
  return { subtotalCents, discountCents, taxCents, totalCents };
}`,
      python: `def invoice_summary(lines, member):
    subtotal_cents = 0
    for line in lines:
        line_total = line["priceCents"] * line["quantity"]
        subtotal_cents = subtotal_cents + line_total
    discount_cents = 0
    if member:
        discount_cents = subtotal_cents * 10 // 100
    taxable_cents = subtotal_cents - discount_cents
    tax_cents = taxable_cents * 8 // 100
    total_cents = taxable_cents + tax_cents
    return {"subtotalCents": subtotal_cents, "discountCents": discount_cents, "taxCents": tax_cents, "totalCents": total_cents}
`,
    },
    examples: [
      check('Member invoice', [[{ priceCents: 1000, quantity: 2 }], true], {
        subtotalCents: 2000,
        discountCents: 200,
        taxCents: 144,
        totalCents: 1944,
      }),
      check('Nonmember invoice', [[{ priceCents: 1000, quantity: 1 }], false], {
        subtotalCents: 1000,
        discountCents: 0,
        taxCents: 80,
        totalCents: 1080,
      }),
      check('Empty invoice', [[], true], {
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
      }),
    ],
    additional: [
      check('Rounding cents', [[{ priceCents: 199, quantity: 1 }], true], {
        subtotalCents: 199,
        discountCents: 19,
        taxCents: 14,
        totalCents: 194,
      }),
      check(
        'Multiple lines',
        [
          [
            { priceCents: 125, quantity: 3 },
            { priceCents: 250, quantity: 2 },
          ],
          false,
        ],
        { subtotalCents: 875, discountCents: 0, taxCents: 70, totalCents: 945 },
      ),
      check('Zero quantities', [[{ priceCents: 999, quantity: 0 }], true], {
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
      }),
    ],
    rules: [
      {
        kind: 'helpers',
        limit: 8,
        name: 'Extract focused helpers',
        hint: 'Call at least two named helpers from the entry point or its helpers, and keep the entry point within eight statements.',
      },
    ],
    preserveInputs: true,
    hints: [
      'Aggregation and percentage calculations are separate responsibilities.',
      'Keep the entry point focused on combining named results.',
      'Use integer percentage arithmetic and round down at each specified step.',
    ],
    explanation:
      'Small named functions make responsibilities easier to test and change. The entry point should explain how the pieces fit together.',
  },
  {
    description:
      'Three separate decisions repeat delivery-status knowledge. Centralize the status rules so a new status has one place to define its behavior.',
    requirements: [
      'Input is a list of records with integer id and string status. Preserve order and return {id, label, retryable, priority} for each. queued maps to Queued/false/1; sent to Sent/false/0; failed to Failed/true/2; unknown statuses to Unknown/false/0.',
      'Keep status keys queued, sent and failed outside function bodies in a module-level rule table. Those string literals must not occur inside any function. Functions should consume the shared rules, not duplicate decisions.',
      'Do not modify the input records or the input array. Return independent result records.',
    ],
    signature: { javascript: 'deliverySummary', python: 'delivery_summary' },
    starter: {
      javascript: `function deliverySummary(records) {
  return records.map(record => {
    let label = 'Unknown';
    if (record.status === 'queued') label = 'Queued';
    if (record.status === 'sent') label = 'Sent';
    if (record.status === 'failed') label = 'Failed';
    const retryable = record.status === 'failed';
    let priority = 0;
    if (record.status === 'queued') priority = 1;
    if (record.status === 'failed') priority = 2;
    return {id: record.id, label, retryable, priority};
  });
}`,
      python: `def delivery_summary(records):
    results = []
    for record in records:
        label = "Unknown"
        if record["status"] == "queued": label = "Queued"
        if record["status"] == "sent": label = "Sent"
        if record["status"] == "failed": label = "Failed"
        retryable = record["status"] == "failed"
        priority = 0
        if record["status"] == "queued": priority = 1
        if record["status"] == "failed": priority = 2
        results.append({"id": record["id"], "label": label, "retryable": retryable, "priority": priority})
    return results
`,
    },
    examples: [
      check(
        'Queued record',
        [[{ id: 1, status: 'queued' }]],
        [{ id: 1, label: 'Queued', retryable: false, priority: 1 }],
      ),
      check(
        'Failed record',
        [[{ id: 2, status: 'failed' }]],
        [{ id: 2, label: 'Failed', retryable: true, priority: 2 }],
      ),
      check(
        'Unknown status',
        [[{ id: 3, status: 'other' }]],
        [{ id: 3, label: 'Unknown', retryable: false, priority: 0 }],
      ),
    ],
    additional: [
      check(
        'Sent record',
        [[{ id: 4, status: 'sent' }]],
        [{ id: 4, label: 'Sent', retryable: false, priority: 0 }],
      ),
      check('Empty list', [[]], []),
      check(
        'Repeated statuses',
        [
          [
            { id: 1, status: 'failed' },
            { id: 2, status: 'failed' },
          ],
        ],
        [
          { id: 1, label: 'Failed', retryable: true, priority: 2 },
          { id: 2, label: 'Failed', retryable: true, priority: 2 },
        ],
      ),
      check(
        'Object-like keys',
        [
          [
            { id: 9, status: 'constructor' },
            { id: 10, status: '__proto__' },
          ],
        ],
        [
          { id: 9, label: 'Unknown', retryable: false, priority: 0 },
          { id: 10, label: 'Unknown', retryable: false, priority: 0 },
        ],
      ),
    ],
    rules: [
      {
        kind: 'strings',
        values: ['queued', 'sent', 'failed'],
        name: 'Centralize status keys',
        hint: 'Move all three status keys to module-level rules. Read those rules instead of repeating status literals inside functions.',
      },
    ],
    preserveInputs: true,
    hints: [
      'A table can hold the label, retry decision and priority together.',
      'Keep a default rule for unfamiliar statuses.',
      'In JavaScript, Map or an own-property check avoids treating inherited object keys as valid statuses.',
    ],
    explanation:
      'A single rule table keeps related policy decisions consistent and makes new statuses easier to add.',
  },
];
definitions.push(...cleanExpansion, ...moreCleanPractice);
export const cleanExercises: CleanExercise[] = cleanExerciseInfo.map((info, index) => ({
  ...info,
  ...definitions[index],
}));
