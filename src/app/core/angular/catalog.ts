import { crudExercises } from './crud-catalog';
import { AngularExercise } from './model';
import { click, input, wait, value, scenario, make, contract } from './authoring';
import { interviewExercises } from './interview-catalog';
export const angularExercises: AngularExercise[] = [
  make('ng-counter', {
    description: 'Repair the bindings and actions in a counter component.',
    requirements: [
      contract,
      'Start at 0. Increase adds one; Decrease subtracts one but never goes below 0. Disable Decrease at 0. Reset returns to 0.',
      'Keep the rendered count synchronized after every action.',
    ],
    starter: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'practice-root', standalone: true,
  template: \`<h1>Counter</h1>
    <output data-testid="count">0</output>
    <button data-testid="decrease" (click)="decrease()">Decrease</button>
    <button data-testid="increase" (click)="increase()">Increase</button>
    <button data-testid="reset" (click)="reset()">Reset</button>\`
})
export class AppComponent {
  count = signal(0);
  increase() { /* Update the count. */ }
  decrease() { /* Keep it nonnegative. */ }
  reset() { /* Restore zero. */ }
}`,
    hints: [
      'Bind the output to component state instead of a literal.',
      'A signal value is read by calling it. Use set or update to change it.',
      'Bind disabled to whether the count is zero; clamp decreasing at zero and reset the same state.',
    ],
    explanation:
      'Angular bindings render component state, and event handlers change it. A single source of truth keeps the count and the disabled state consistent.',
    scenarios: [
      scenario(
        'Initial state',
        'Disable Decrease when the counter is zero.',
        [],
        value('count', '0'),
        value('decrease', true, 'disabled'),
      ),
      scenario(
        'Increase once',
        'Update state and render its current value.',
        [click('increase')],
        value('count', '1'),
        value('decrease', false, 'disabled'),
      ),
      scenario(
        'Decrease after increasing',
        'Subtract one from the current count.',
        [click('increase'), click('increase'), click('decrease')],
        value('count', '1'),
      ),
      scenario(
        'Lower bound',
        'Do not allow negative counts.',
        [click('decrease'), click('decrease')],
        value('count', '0'),
      ),
      scenario(
        'Reset',
        'Reset must update both count and disabled state.',
        [click('increase'), click('increase'), click('reset')],
        value('count', '0'),
        value('decrease', true, 'disabled'),
      ),
      scenario(
        'Repeated actions',
        'Apply each click to the latest state.',
        [
          click('increase'),
          click('increase'),
          click('increase'),
          click('decrease'),
          click('increase'),
        ],
        value('count', '3'),
      ),
    ],
  }),
  make('ng-filter', {
    description: 'Make the course list respond to a case-insensitive search.',
    requirements: [
      contract,
      'Keep the four course names in their original order. Filter by a case-insensitive substring, trimming surrounding spaces from the query.',
      'An empty query shows every course. Show one element marked empty with text "No courses" only when nothing matches.',
    ],
    starter: `import { Component, signal, computed } from '@angular/core';
@Component({selector:'practice-root', standalone:true, template:\`
  <h1>Courses</h1><label>Search <input data-testid="query" (input)="query.set($any($event.target).value)"></label>
  <ul>@for (course of courses; track course) { <li data-testid="course">{{course}}</li> }</ul>
  <p data-testid="empty">No courses</p>
\`})
export class AppComponent {
  query = signal('');
  courses = ['Angular Basics', 'TypeScript', 'CSS Layout', 'Angular Signals'];
  // Derive the filtered list and update the template.
}`,
    hints: [
      'Read the current query when deriving the list.',
      'Normalize both sides of the comparison and preserve the original course names.',
      'Use a derived list in @for, and conditionally render the empty message.',
    ],
    explanation:
      'Derived state avoids keeping a second mutable copy of the list. Angular control flow renders both matching rows and a meaningful empty state.',
    scenarios: [
      scenario(
        'All courses',
        'Empty search should show all four courses and no empty message.',
        [],
        value('course', ['Angular Basics', 'TypeScript', 'CSS Layout', 'Angular Signals'], 'texts'),
        value('empty', 0, 'count'),
      ),
      scenario(
        'Matching courses',
        'Match a substring without changing course order.',
        [input('query', 'Angular')],
        value('course', ['Angular Basics', 'Angular Signals'], 'texts'),
      ),
      scenario(
        'Empty state',
        'Show the empty message only when no course matches.',
        [input('query', 'zzz')],
        value('course', [], 'texts'),
        value('empty', 'No courses'),
      ),
      scenario(
        'Case and spaces',
        'Trim the query and ignore case.',
        [input('query', '  tYpEsCrIpT  ')],
        value('course', ['TypeScript'], 'texts'),
      ),
      scenario(
        'Clear search',
        'Restore all courses when search is cleared.',
        [input('query', 'CSS'), input('query', '')],
        value('course', ['Angular Basics', 'TypeScript', 'CSS Layout', 'Angular Signals'], 'texts'),
        value('empty', 0, 'count'),
      ),
      scenario(
        'Partial word',
        'Do not limit matching to whole words or prefixes.',
        [input('query', 'sign')],
        value('course', ['Angular Signals'], 'texts'),
      ),
    ],
  }),
  make('ng-greeting', {
    description: 'Connect a name input and a reset action to a live greeting.',
    requirements: [
      contract,
      'Use the current trimmed name in "Hello, NAME!". If the name is empty or only whitespace, render "Hello, developer!".',
      'Typing updates the greeting immediately. Reset clears both the input and greeting state. Keep a visible label associated with the input.',
    ],
    starter: `import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({selector:'practice-root', standalone:true, imports:[FormsModule], template:\`
  <h1>Profile</h1><label>Name <input data-testid="name"></label>
  <p data-testid="greeting">Hello, developer!</p><button data-testid="reset" (click)="reset()">Reset</button>
\`})
export class AppComponent {
  name = signal('');
  reset() { /* Clear the form state. */ }
}`,
    hints: [
      'Bind the input value and its changes to the same state.',
      'ngModel or explicit value/input bindings are both valid.',
      'Derive the greeting from the trimmed value and fall back to developer.',
    ],
    explanation:
      'Two-way binding is a convenience for keeping a control and state synchronized. Derived text should always reflect the current value, including reset and empty input.',
    scenarios: [
      scenario(
        'Default greeting',
        'An empty name uses the developer fallback.',
        [],
        value('greeting', 'Hello, developer!'),
      ),
      scenario(
        'Typed name',
        'Bind changes from the input to the greeting.',
        [input('name', 'Ada')],
        value('greeting', 'Hello, Ada!'),
      ),
      scenario(
        'Changed name',
        'Render the latest input, not only its first value.',
        [input('name', 'Ada'), input('name', 'Grace')],
        value('greeting', 'Hello, Grace!'),
      ),
      scenario(
        'Whitespace handling',
        'Trim surrounding spaces and fall back for whitespace only.',
        [input('name', '   ')],
        value('greeting', 'Hello, developer!'),
      ),
      scenario(
        'Trimmed name',
        'Trim the displayed name.',
        [input('name', '  Lin  ')],
        value('greeting', 'Hello, Lin!'),
      ),
      scenario(
        'Reset both views',
        'Reset the actual input value as well as the greeting.',
        [input('name', 'Jo'), click('reset')],
        value('name', '', 'value'),
        value('greeting', 'Hello, developer!'),
      ),
    ],
  }),
  make('ng-validation', {
    description: 'Complete a registration form whose submit state follows its validation.',
    requirements: [
      contract,
      'Email is required and must be valid. Password is required and must contain at least eight characters. Disable Register while either field is invalid.',
      'Submitting valid data shows "Registered" in status. Invalid submissions must not report success. Keep the provided input selectors and form labels.',
    ],
    starter: `import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({selector:'practice-root', standalone:true, imports:[ReactiveFormsModule], template:\`
  <h1>Register</h1><form [formGroup]="form" (ngSubmit)="submit()">
    <label>Email <input data-testid="email" formControlName="email"></label>
    <label>Password <input data-testid="password" type="password" formControlName="password"></label>
    <button data-testid="submit" type="submit">Register</button>
  </form><p data-testid="status">{{status()}}</p>
\`})
export class AppComponent {
  form = new FormGroup({email:new FormControl(''), password:new FormControl('')});
  status = signal('');
  submit() { this.status.set('Registered'); }
}`,
    hints: [
      'Attach validators to the form controls.',
      'Bind the submit button’s disabled property to invalid state.',
      'Guard submission too; only valid input should produce the success message.',
    ],
    explanation:
      'Reactive forms centralize values and validation. A disabled button communicates invalid state, and the submit handler enforces the same rule.',
    scenarios: [
      scenario(
        'Empty form',
        'Required fields must disable submission.',
        [],
        value('submit', true, 'disabled'),
      ),
      scenario(
        'Malformed email',
        'Reject a malformed address even with a long password.',
        [input('email', 'invalid'), input('password', 'long-password')],
        value('submit', true, 'disabled'),
      ),
      scenario(
        'Valid submission',
        'Enable and submit valid credentials.',
        [input('email', 'ada@example.com'), input('password', 'password8'), click('submit')],
        value('submit', false, 'disabled'),
        value('status', 'Registered'),
      ),
      scenario(
        'Short password',
        'Seven characters are insufficient.',
        [input('email', 'ada@example.com'), input('password', '1234567')],
        value('submit', true, 'disabled'),
      ),
      scenario(
        'Exact boundary',
        'Eight characters satisfy the minimum length.',
        [input('email', 'grace@example.org'), input('password', '12345678')],
        value('submit', false, 'disabled'),
      ),
      scenario(
        'Becomes invalid again',
        'Recompute validity after a previously valid field is cleared.',
        [
          input('email', 'ada@example.com'),
          input('password', 'password8'),
          input('email', ''),
          click('submit'),
        ],
        value('submit', true, 'disabled'),
        value('status', ''),
      ),
    ],
  }),
  make('ng-components', {
    description: 'Repair a reusable quantity control and connect it to its parent.',
    requirements: [
      contract,
      'Keep the child QuantityComponent and use its value input and changed output to communicate with the parent. Both the child and parent totals start at 2.',
      'Child Increase adds one. Parent Reset sets the value to 2 and updates the child. Preserve the quantity-control component in the parent template.',
    ],
    starter: `import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
@Component({selector:'quantity-control', standalone:true, template:\`
  <output data-testid="child-count">{{value}}</output><button data-testid="add" (click)="add()">Increase</button>
\`})
export class QuantityComponent {
  @Input() value = 0;
  @Output() changed = new EventEmitter<number>();
  add() { this.value++; }
}
@Component({selector:'practice-root', standalone:true, imports:[QuantityComponent], template:\`
  <h1>Quantity</h1><quantity-control></quantity-control>
  <p>Parent quantity: <output data-testid="parent-count">{{quantity()}}</output></p>
  <button data-testid="reset" (click)="quantity.set(2)">Reset</button>
\`})
export class AppComponent { quantity = signal(2); }`,
    hints: [
      'Bind parent state into the child input.',
      'Emit the next value instead of treating the child input as owned state.',
      'Handle changed in the parent, then let input binding update the child.',
    ],
    explanation:
      'Inputs carry data down and outputs carry events up. Parent-owned state keeps the child consistent when either component initiates a change.',
    scenarios: [
      scenario(
        'Initial input',
        'Pass the parent quantity into the child.',
        [],
        value('child-count', '2'),
        value('parent-count', '2'),
        value('quantity-control', 1, 'count'),
      ),
      scenario(
        'Child event',
        'Update parent state from the child output.',
        [click('add')],
        value('child-count', '3'),
        value('parent-count', '3'),
      ),
      scenario(
        'Repeated child events',
        'Keep parent and child values synchronized.',
        [click('add'), click('add'), click('add')],
        value('child-count', '5'),
        value('parent-count', '5'),
      ),
      scenario(
        'Parent reset',
        'A parent update must flow back to the child.',
        [click('add'), click('reset')],
        value('child-count', '2'),
        value('parent-count', '2'),
      ),
      scenario(
        'Continue after reset',
        'Use the latest input after a reset.',
        [click('add'), click('reset'), click('add')],
        value('child-count', '3'),
        value('parent-count', '3'),
      ),
      scenario(
        'Reset is repeatable',
        'Reset should remain stable on repeated clicks.',
        [click('add'), click('reset'), click('reset')],
        value('child-count', '2'),
        value('parent-count', '2'),
      ),
    ],
  }),
  make('ng-service', {
    description: 'Share one cart state between a toolbar and a product panel.',
    requirements: [
      contract,
      'Use the supplied CartStore through dependency injection in both child components. Start with an empty cart.',
      'Adding from either component increments the same count. Both counts must update. Clearing from the toolbar resets both to zero. Preserve cart-toolbar and product-panel elements.',
    ],
    starter: `import { Component, Injectable, inject, signal } from '@angular/core';
@Injectable({providedIn:'root'})
export class CartStore { count = signal(0); add() { this.count.update(n=>n+1); } clear() { this.count.set(0); } }
@Component({selector:'cart-toolbar', standalone:true, providers:[CartStore], template:\`
  <p>Toolbar: <output data-testid="toolbar-count">{{store.count()}}</output></p>
  <button data-testid="toolbar-add" (click)="store.add()">Add from toolbar</button><button data-testid="clear" (click)="store.clear()">Clear cart</button>
\`})
export class ToolbarComponent { store = inject(CartStore); }
@Component({selector:'product-panel', standalone:true, providers:[CartStore], template:\`
  <p>Products: <output data-testid="product-count">{{store.count()}}</output></p>
  <button data-testid="product-add" (click)="store.add()">Add product</button>
\`})
export class ProductComponent { store = inject(CartStore); }
@Component({selector:'practice-root', standalone:true, imports:[ToolbarComponent, ProductComponent], template:\`
  <h1>Shared cart</h1><cart-toolbar></cart-toolbar><product-panel></product-panel>
\`})
export class AppComponent {}`,
    hints: [
      'A component provider creates an instance scoped to that component.',
      'Both children should resolve the same CartStore from a shared ancestor injector.',
      'Remove shadowing providers, or provide one store on their shared parent.',
    ],
    explanation:
      'Provider scope determines service lifetime and sharing. A root or common-parent provider lets siblings observe the same reactive state.',
    scenarios: [
      scenario(
        'Empty shared cart',
        'Both components must start at zero.',
        [],
        value('toolbar-count', '0'),
        value('product-count', '0'),
      ),
      scenario(
        'Add from product',
        'Both components should observe product additions.',
        [click('product-add')],
        value('toolbar-count', '1'),
        value('product-count', '1'),
      ),
      scenario(
        'Add from toolbar',
        'Toolbar additions should reach the product panel.',
        [click('toolbar-add')],
        value('toolbar-count', '1'),
        value('product-count', '1'),
      ),
      scenario(
        'Combined additions',
        'Accumulate actions from both components.',
        [click('toolbar-add'), click('product-add'), click('product-add')],
        value('toolbar-count', '3'),
        value('product-count', '3'),
      ),
      scenario(
        'Shared reset',
        'Clear the same cart state used by both components.',
        [click('product-add'), click('clear')],
        value('toolbar-count', '0'),
        value('product-count', '0'),
      ),
      scenario(
        'Continue after clearing',
        'Keep the shared instance after reset.',
        [click('toolbar-add'), click('clear'), click('product-add')],
        value('toolbar-count', '1'),
        value('product-count', '1'),
        value('cart-toolbar', 1, 'count'),
        value('product-panel', 1, 'count'),
      ),
    ],
  }),
  make('ng-search', {
    description:
      'Complete a search component that handles changing queries, failed requests, and out-of-order responses.',
    requirements: [
      contract,
      'PracticeSearchApi is a local injectable service. search(query) returns an Observable of course names matching a trimmed, case-insensitive substring. Empty input must clear results and show "Ready" without displaying every course.',
      'For nonempty queries, show "Loading", then "Ready" with the latest results. Query "error" fails: show "Error" and clear results. A subsequent query must still work.',
      'Older, slower requests must never overwrite a newer query. The local API deliberately delays "a" for 450ms and other queries for 80ms. Use the supplied service; no network is needed.',
    ],
    starter: `import { Component, inject, signal } from '@angular/core';
import { PracticeSearchApi } from '@procode/practice';
import { Subject, of, switchMap, catchError, tap } from 'rxjs';
@Component({selector:'practice-root', standalone:true, template:\`
  <h1>Course search</h1><label>Search <input data-testid="query" (input)="search($any($event.target).value)"></label>
  <p data-testid="status">{{status()}}</p><ul>@for(course of results(); track course){<li data-testid="result">{{course}}</li>}</ul>
\`})
export class AppComponent {
  api = inject(PracticeSearchApi);
  results = signal<string[]>([]);
  status = signal('Ready');
  search(query: string) {
    this.status.set('Loading');
    this.api.search(query).subscribe(items => { this.results.set(items); this.status.set('Ready'); });
  }
}`,
    hints: [
      'A newer query should cancel or invalidate the older request.',
      'switchMap can replace the previous inner Observable. Handle errors inside that inner stream so later queries remain active.',
      'Treat empty input explicitly, and update loading, success, and error states along every path. Clean up subscriptions with the component lifetime.',
    ],
    explanation:
      'Asynchronous results can arrive out of order. Switching requests or using a request identity keeps state tied to the latest query, while local error handling preserves future searches.',
    scenarios: [
      scenario(
        'Initial state',
        'Start ready with no results.',
        [],
        value('status', 'Ready'),
        value('result', [], 'texts'),
      ),
      scenario(
        'Matching results',
        'Render the service results after a successful query.',
        [input('query', 'angular'), wait(180)],
        value('status', 'Ready'),
        value('result', ['Angular Basics', 'Angular Signals'], 'texts'),
      ),
      scenario(
        'No matches',
        'A successful empty result is Ready, not Error.',
        [input('query', 'zzz'), wait(180)],
        value('status', 'Ready'),
        value('result', [], 'texts'),
      ),
      scenario(
        'Latest query wins',
        'Cancel or ignore the older slow response.',
        [input('query', 'a'), wait(30), input('query', 'rxjs'), wait(550)],
        value('result', ['RxJS Streams'], 'texts'),
        value('status', 'Ready'),
      ),
      scenario(
        'Error and recovery',
        'Catch request errors without breaking subsequent searches.',
        [input('query', 'error'), wait(180)],
        value('status', 'Error'),
        value('result', [], 'texts'),
      ),
      scenario(
        'Search after an error',
        'A failed request must not terminate future searches.',
        [input('query', 'error'), wait(180), input('query', '  TYPESCRIPT  '), wait(180)],
        value('result', ['TypeScript Basics'], 'texts'),
        value('status', 'Ready'),
      ),
      scenario(
        'Clear pending query',
        'An old response must not repopulate an empty query.',
        [input('query', 'a'), wait(30), input('query', ''), wait(550)],
        value('result', [], 'texts'),
        value('status', 'Ready'),
      ),
      scenario(
        'Loading feedback',
        'Show loading while a request is pending.',
        [input('query', 'a')],
        value('status', 'Loading'),
      ),
    ],
  }),
  make('ng-pagination', {
    description: 'Keep filtering, pagination, and navigation state consistent as data changes.',
    requirements: [
      contract,
      'Use the provided six items in order and a page size of two. Render a one-based page number. Filter names using a trimmed, case-insensitive substring.',
      'Changing the filter resets to page 1. Previous and Next must be disabled at their respective boundaries. With no matches, show page 1, no items, and disable both buttons.',
      'No action may produce an out-of-range page. Derive visible items and button states from the current filter and page.',
    ],
    starter: `import { Component, signal, computed } from '@angular/core';
@Component({selector:'practice-root', standalone:true, template:\`
  <h1>Course pages</h1><label>Filter <input data-testid="query" (input)="filter($any($event.target).value)"></label>
  <ul>@for(item of items; track item){<li data-testid="item">{{item}}</li>}</ul>
  <button data-testid="previous" (click)="previous()">Previous</button><output data-testid="page">{{page()}}</output><button data-testid="next" (click)="next()">Next</button>
\`})
export class AppComponent {
  items = ['Angular', 'CSS', 'Firebase', 'Git', 'HTML', 'TypeScript'];
  query = signal(''); page = signal(1);
  filter(value:string){ this.query.set(value); }
  previous(){this.page.update(n=>n-1);}
  next(){this.page.update(n=>n+1);}
}`,
    hints: [
      'Derive filtered items first, then slice that list for the current page.',
      'Changing the query should reset page state before deriving visible items.',
      'Use total pages for bounds, with a minimum displayed page of one even when the list is empty.',
    ],
    explanation:
      'Derived state expresses dependencies directly. Keeping filter changes and pagination boundaries consistent prevents stale or impossible UI states.',
    scenarios: [
      scenario(
        'First page',
        'Show only the first two items and disable Previous.',
        [],
        value('item', ['Angular', 'CSS'], 'texts'),
        value('page', '1'),
        value('previous', true, 'disabled'),
        value('next', false, 'disabled'),
      ),
      scenario(
        'Next page',
        'Slice the current list using the page size.',
        [click('next')],
        value('item', ['Firebase', 'Git'], 'texts'),
        value('page', '2'),
      ),
      scenario(
        'Last page',
        'Disable Next on the final page.',
        [click('next'), click('next'), click('next')],
        value('item', ['HTML', 'TypeScript'], 'texts'),
        value('page', '3'),
        value('next', true, 'disabled'),
      ),
      scenario(
        'Filter resets page',
        'Reset to the first page after changing the filter.',
        [click('next'), click('next'), input('query', '  a  ')],
        value('page', '1'),
        value('item', ['Angular', 'Firebase'], 'texts'),
        value('next', true, 'disabled'),
      ),
      scenario(
        'No matches',
        'Empty results still have a safe page state.',
        [click('next'), input('query', 'zzz')],
        value('page', '1'),
        value('item', [], 'texts'),
        value('previous', true, 'disabled'),
        value('next', true, 'disabled'),
      ),
      scenario(
        'Back to all items',
        'Clearing the filter restores the first page.',
        [input('query', 'git'), input('query', '')],
        value('item', ['Angular', 'CSS'], 'texts'),
        value('page', '1'),
      ),
      scenario(
        'Previous boundary',
        'Previous must not go below page one.',
        [click('next'), click('previous'), click('previous')],
        value('page', '1'),
        value('item', ['Angular', 'CSS'], 'texts'),
      ),
    ],
  }),
  make('ng-cross-validation', {
    description: 'Validate a booking interval using the relationship between two numeric fields.',
    requirements: [
      contract,
      'Start and end are required integers from 0 through 23. End must be strictly greater than start. Disable Book for every invalid combination.',
      'Show "Invalid interval" when invalid and "Ready" when valid in status. Submitting a valid interval displays its duration in hours; submitting while invalid must not change the duration.',
      'Use the same rule when either field changes. Treat a missing value differently from zero.',
    ],
    starter: `import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
@Component({selector:'practice-root', standalone:true, imports:[ReactiveFormsModule], template:\`
  <h1>Book a room</h1><form [formGroup]="form" (ngSubmit)="book()">
    <label>Start hour <input data-testid="start" type="number" formControlName="start"></label>
    <label>End hour <input data-testid="end" type="number" formControlName="end"></label>
    <button data-testid="book" type="submit">Book</button>
  </form><p data-testid="status">Ready</p><output data-testid="duration">{{duration()}}</output>
\`})
export class AppComponent {
  form = new FormGroup({start:new FormControl<number|null>(null),end:new FormControl<number|null>(null)});
  duration = signal('');
  book(){const {start,end}=this.form.getRawValue();this.duration.set(String(Number(end)-Number(start)));}
}`,
    hints: [
      'A group-level validator can compare related fields.',
      'Check missing values, integer bounds, and ordering separately. Zero is a valid hour.',
      'Bind status and disabled state to validity, and guard the submit handler before calculating duration.',
    ],
    explanation:
      'Cross-field validation belongs at the level that owns the relationship. One consistent rule should drive feedback, button state, and submission.',
    scenarios: [
      scenario(
        'Missing interval',
        'Both fields are required.',
        [],
        value('book', true, 'disabled'),
        value('status', 'Invalid interval'),
      ),
      scenario(
        'Valid booking',
        'A valid interval enables booking and reports the duration.',
        [input('start', '9'), input('end', '12'), click('book')],
        value('book', false, 'disabled'),
        value('status', 'Ready'),
        value('duration', '3'),
      ),
      scenario(
        'Equal endpoints',
        'End must be strictly greater than start.',
        [input('start', '9'), input('end', '9')],
        value('book', true, 'disabled'),
        value('status', 'Invalid interval'),
      ),
      scenario(
        'Reversed interval',
        'Reject end times before start.',
        [input('start', '18'), input('end', '10'), click('book')],
        value('book', true, 'disabled'),
        value('duration', ''),
      ),
      scenario(
        'Zero is valid',
        'Do not confuse zero with missing input.',
        [input('start', '0'), input('end', '1'), click('book')],
        value('duration', '1'),
        value('status', 'Ready'),
      ),
      scenario(
        'Out-of-range hours',
        'Reject hours beyond 23.',
        [input('start', '22'), input('end', '24')],
        value('book', true, 'disabled'),
      ),
      scenario(
        'Integer hours only',
        'Reject fractional hours.',
        [input('start', '1.5'), input('end', '4')],
        value('book', true, 'disabled'),
      ),
      scenario(
        'Missing after valid',
        'Clearing a previously valid field must invalidate the interval.',
        [input('start', '9'), input('end', '12'), input('start', ''), click('book')],
        value('book', true, 'disabled'),
        value('status', 'Invalid interval'),
        value('duration', ''),
      ),
    ],
  }),
  ...interviewExercises,
  ...crudExercises,
];
