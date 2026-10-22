import type { CleanExercise } from './model';
import type { Check } from '../exercises';
const check = (name: string, input: unknown[], expected: unknown): Check => ({
  name,
  input,
  expected,
  hint: 'Keep validation priority, boundary values and the documented output unchanged.',
});
export const cleanExpansion: Omit<CleanExercise, 'id' | 'title' | 'difficulty' | 'version'>[] = [
  {
    description:
      'Nested validation makes a registration decision difficult to scan. Replace the nesting with clear guard clauses.',
    requirements: [
      'Implement registrationResult / registration_result for {name, age, accepted}. name is a string, age an integer from 0 to 120, and accepted a boolean. Return name-required for a blank trimmed name, otherwise too-young below 18, otherwise terms-required when accepted is false, otherwise ready.',
      'Preserve this priority when several fields are invalid. Keep decision nesting inside each function to at most one level, including conditional expressions.',
    ],
    signature: { javascript: 'registrationResult', python: 'registration_result' },
    starter: {
      javascript: `function registrationResult(form) {
 if(form.name.trim()) {
  if(form.age>=18) {
   if(form.accepted) return 'ready';
   else return 'terms-required';
  } else return 'too-young';
 } else return 'name-required';
}`,
      python: `def registration_result(form):
    if form["name"].strip():
        if form["age"] >= 18:
            if form["accepted"]: return "ready"
            else: return "terms-required"
        else: return "too-young"
    else: return "name-required"
`,
    },
    examples: [
      check('Valid registration', [{ name: 'Ada', age: 18, accepted: true }], 'ready'),
      check('Missing name', [{ name: '   ', age: 30, accepted: true }], 'name-required'),
      check('Below age boundary', [{ name: 'Lin', age: 17, accepted: true }], 'too-young'),
    ],
    additional: [
      check('Terms missing', [{ name: 'Lin', age: 18, accepted: false }], 'terms-required'),
      check('All invalid', [{ name: '', age: 0, accepted: false }], 'name-required'),
      check('Age before terms', [{ name: 'Jo', age: 10, accepted: false }], 'too-young'),
      check('Trimmed name', [{ name: ' Ada ', age: 120, accepted: true }], 'ready'),
    ],
    rules: [
      {
        kind: 'nesting',
        limit: 1,
        name: 'Use flat validation decisions',
        hint: 'Return each validation error in priority order, then return ready.',
      },
    ],
    hints: [
      'Write the validation order before changing control flow.',
      'Each failed condition can return immediately.',
      'After the three guards, no nested success condition is necessary.',
    ],
    explanation:
      'Guard clauses expose validation priority. Boundary and combined-error tests prevent a readability change from silently changing behavior.',
  },
  {
    description:
      'Applying a discount changes the caller’s product objects. Return discounted copies so the same catalog can be reused safely.',
    requirements: [
      'Implement discountedCatalog / discounted_catalog. Each product has a unique integer id, a string name and a nonnegative integer priceCents. percent is an integer from 0 to 100.',
      'Return products in their original order with the same id and name and a priceCents equal to floor(original priceCents × (100 - percent) / 100). Input products contain only these three fields.',
      'Preserve the input list and all product records. Grading checks data before and after the call, without requiring a particular copying technique.',
    ],
    signature: { javascript: 'discountedCatalog', python: 'discounted_catalog' },
    starter: {
      javascript: `function discountedCatalog(products,percent) {
 for(const product of products) product.priceCents=Math.floor(product.priceCents*(100-percent)/100);
 return products;
}`,
      python: `def discounted_catalog(products, percent):
    for product in products:
        product["priceCents"] = product["priceCents"] * (100 - percent) // 100
    return products
`,
    },
    examples: [
      check(
        'Quarter off',
        [[{ id: 1, name: 'Keyboard', priceCents: 1000 }], 25],
        [{ id: 1, name: 'Keyboard', priceCents: 750 }],
      ),
      check(
        'Round down',
        [[{ id: 2, name: 'Cable', priceCents: 199 }], 10],
        [{ id: 2, name: 'Cable', priceCents: 179 }],
      ),
      check('Empty catalog', [[], 30], []),
    ],
    additional: [
      check(
        'Full discount',
        [[{ id: 1, name: 'Mouse', priceCents: 899 }], 100],
        [{ id: 1, name: 'Mouse', priceCents: 0 }],
      ),
      check(
        'No discount',
        [[{ id: 4, name: 'Pad', priceCents: 499 }], 0],
        [{ id: 4, name: 'Pad', priceCents: 499 }],
      ),
      check(
        'Stable order',
        [
          [
            { id: 8, name: 'B', priceCents: 201 },
            { id: 2, name: 'A', priceCents: 0 },
          ],
          50,
        ],
        [
          { id: 8, name: 'B', priceCents: 100 },
          { id: 2, name: 'A', priceCents: 0 },
        ],
      ),
      check(
        'One cent',
        [[{ id: 3, name: 'Sample', priceCents: 1 }], 1],
        [{ id: 3, name: 'Sample', priceCents: 0 }],
      ),
    ],
    rules: [],
    preserveInputs: true,
    hints: [
      'Copying the array alone still shares each product object.',
      'Construct a new product record for each output.',
      'Calculate from the original price and round down only at the specified step.',
    ],
    explanation:
      'Immutable transformations prevent repeated use of shared catalog data from compounding discounts. Output equality and input preservation are independent requirements.',
  },
  {
    description:
      'A ticket report mixes filtering, aggregation and ordering. Extract focused helpers while keeping a short coordinating function.',
    requirements: [
      'Implement ticketReport / ticket_report. Input records have unique integer id, status open or closed, and nonnegative integer minutes. Return {openIds, totalMinutes, averageMinutes}. openIds contains open ticket IDs ascending. Totals and averages include open tickets only.',
      'averageMinutes is floor(totalMinutes / open count), or 0 for no open tickets. Preserve caller-owned data.',
      'The entry point must reach at least two named helpers through direct calls and contain no more than eight statements, including nested statements. Use helpers for real responsibilities such as selecting tickets and summarizing them.',
    ],
    signature: { javascript: 'ticketReport', python: 'ticket_report' },
    starter: {
      javascript: `function ticketReport(tickets) {
 const openIds=[];
 let totalMinutes=0;
 let count=0;
 for(const ticket of tickets) {
  if(ticket.status==='open') {
   openIds.push(ticket.id);
   totalMinutes+=ticket.minutes;
   count+=1;
  }
 }
 openIds.sort((left,right)=>left-right);
 const averageMinutes=count?Math.floor(totalMinutes/count):0;
 return {openIds,totalMinutes,averageMinutes};
}`,
      python: `def ticket_report(tickets):
    open_ids = []
    total_minutes = 0
    count = 0
    for ticket in tickets:
        if ticket["status"] == "open":
            open_ids.append(ticket["id"])
            total_minutes += ticket["minutes"]
            count += 1
    open_ids.sort()
    average_minutes = total_minutes // count if count else 0
    return {"openIds": open_ids, "totalMinutes": total_minutes, "averageMinutes": average_minutes}
`,
    },
    examples: [
      check(
        'Mixed statuses',
        [
          [
            { id: 3, status: 'open', minutes: 10 },
            { id: 1, status: 'closed', minutes: 100 },
            { id: 2, status: 'open', minutes: 5 },
          ],
        ],
        { openIds: [2, 3], totalMinutes: 15, averageMinutes: 7 },
      ),
      check('Empty report', [[]], { openIds: [], totalMinutes: 0, averageMinutes: 0 }),
      check('Only closed', [[{ id: 1, status: 'closed', minutes: 99 }]], {
        openIds: [],
        totalMinutes: 0,
        averageMinutes: 0,
      }),
    ],
    additional: [
      check('Zero duration', [[{ id: 1, status: 'open', minutes: 0 }]], {
        openIds: [1],
        totalMinutes: 0,
        averageMinutes: 0,
      }),
      check(
        'Numeric ID order',
        [
          [
            { id: 20, status: 'open', minutes: 4 },
            { id: 3, status: 'open', minutes: 4 },
          ],
        ],
        { openIds: [3, 20], totalMinutes: 8, averageMinutes: 4 },
      ),
      check(
        'Round average down',
        [
          [
            { id: 1, status: 'open', minutes: 1 },
            { id: 2, status: 'open', minutes: 0 },
          ],
        ],
        { openIds: [1, 2], totalMinutes: 1, averageMinutes: 0 },
      ),
    ],
    rules: [
      {
        kind: 'helpers',
        limit: 8,
        name: 'Separate report responsibilities',
        hint: 'Reach at least two named helpers through direct calls and keep the entry point within eight statements.',
      },
    ],
    preserveInputs: true,
    hints: [
      'Selecting open tickets is a distinct responsibility.',
      'A summary helper can handle totals, sorting and the empty case.',
      'Let the entry point combine named results instead of reproducing the loop.',
    ],
    explanation:
      'Separating selection from aggregation makes policies independently understandable. Refactoring still needs tests for filtering, sorting, rounding and input preservation.',
  },
];
