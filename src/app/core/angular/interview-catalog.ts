import { AngularExercise } from './model';
import { click, input, value, scenario, make, contract } from './authoring';
export const interviewExercises: AngularExercise[] = [
  make('ng-disclosure', {
    description: 'Connect conditional content and button labels to the same state.',
    requirements: [
      contract,
      'Start collapsed: hide the details and label the toggle "Show details". Opening shows "Practice a little every day." and changes the label to "Hide details".',
      'Each click toggles the state. Close hides the details. Opening again must still work. Keep native buttons and the supplied test hooks.',
    ],
    starter: `import {Component, signal} from '@angular/core';
@Component({selector:'practice-root', standalone:true, template:\`
<h1>Practice details</h1>
<button data-testid="toggle" (click)="toggle()">Show details</button>
<p data-testid="details">Practice a little every day.</p>
<button data-testid="close" (click)="close()">Close</button>\`})
export class AppComponent {
  open = signal(false);
  toggle(){ /* Toggle state. */ }
  close(){ /* Close the panel. */ }
}`,
    hints: [
      'Use one boolean for both the content and the button label.',
      'Use @if or an equivalent visibility binding for the details.',
      'Toggle the current value; Close should always set it to false.',
    ],
    explanation:
      'Conditional rendering and label bindings should share one source of truth. Explicit close actions are idempotent, while toggles invert state.',
    scenarios: [
      scenario(
        'Initially collapsed',
        'Hide details until the user opens them.',
        [],
        value('details', 0, 'count'),
        value('toggle', 'Show details'),
      ),
      scenario(
        'Open panel',
        'Update both the details and toggle label.',
        [click('toggle')],
        value('details', 'Practice a little every day.'),
        value('toggle', 'Hide details'),
      ),
      scenario(
        'Toggle closed',
        'A second toggle should hide the details.',
        [click('toggle'), click('toggle')],
        value('details', 0, 'count'),
        value('toggle', 'Show details'),
      ),
      scenario(
        'Explicit close',
        'Close must clear the same state used by the toggle.',
        [click('toggle'), click('close')],
        value('details', 0, 'count'),
        value('toggle', 'Show details'),
      ),
      scenario(
        'Reopen after close',
        'Closing must not break subsequent opening.',
        [click('toggle'), click('close'), click('toggle')],
        value('details', 'Practice a little every day.'),
        value('toggle', 'Hide details'),
      ),
      scenario(
        'Repeated toggles',
        'Apply every toggle to the latest state.',
        [click('toggle'), click('toggle'), click('toggle'), click('toggle')],
        value('details', 0, 'count'),
      ),
    ],
  }),
  make('ng-pipe', {
    description:
      'Repair a standalone pipe that shortens text using a configurable character limit.',
    requirements: [
      contract,
      'Keep the summary pipe in the template. Trim the input text. If it exceeds the selected limit, display the first limit characters followed by three periods (...). Otherwise display the trimmed text unchanged.',
      'The limit options are 0, 5, and 10, initially 5. Empty text stays empty, including at limit 0. Nonempty text at limit 0 becomes "...". Inputs use ASCII characters.',
    ],
    starter: `import {Component, Pipe, PipeTransform, signal} from '@angular/core';
@Pipe({name:'summary', standalone:true})
export class SummaryPipe implements PipeTransform {
  transform(text:string, limit:number):string { return text; }
}
@Component({selector:'practice-root', standalone:true, imports:[SummaryPipe], template:\`
<h1>Summary</h1><label>Text <input data-testid="text" [value]="text()" (input)="text.set($any($event.target).value)"></label>
<label>Limit <select data-testid="limit" [value]="limit()" (change)="limit.set(+$any($event.target).value)"><option value="0">0</option><option value="5">5</option><option value="10">10</option></select></label>
<output data-testid="summary">{{text() | summary:limit()}}</output>\`})
export class AppComponent { text=signal('Angular'); limit=signal(5); }`,
    hints: [
      'A pipe receives its value first and colon arguments afterward.',
      'Trim before comparing length with the limit.',
      'Only append periods when truncation actually occurred. Zero is a valid limit.',
    ],
    explanation:
      'Pure pipes transform values declaratively and update when their inputs change. Boundary cases distinguish a reusable transformation from a hardcoded display.',
    scenarios: [
      scenario(
        'Initial truncation',
        'Keep five characters and append three periods.',
        [],
        value('summary', 'Angul...'),
      ),
      scenario(
        'Short text',
        'Short text must not receive an ellipsis.',
        [input('text', 'Git')],
        value('summary', 'Git'),
      ),
      scenario(
        'Changing the argument',
        'Recompute when the limit changes.',
        [input('limit', '10')],
        value('summary', 'Angular'),
      ),
      scenario(
        'Exact boundary',
        'A string at the limit does not need truncation.',
        [input('text', '  Hello  ')],
        value('summary', 'Hello'),
      ),
      scenario(
        'Zero limit',
        'Zero keeps no characters but still indicates truncation.',
        [input('limit', '0')],
        value('summary', '...'),
      ),
      scenario(
        'Empty trimmed text',
        'Whitespace becomes an empty result even at zero.',
        [input('text', '   '), input('limit', '0')],
        value('summary', ''),
      ),
    ],
  }),
  make('ng-tasks', {
    description: 'Complete list rendering and add/remove actions without losing duplicate tasks.',
    requirements: [
      contract,
      'Start with task 1 "Read docs" and task 2 "Build app" in that order. Add trimmed, nonempty task names at the end; clear the input only after a successful add. Ignore whitespace-only entries.',
      'Duplicate names are valid separate tasks. Assign stable increasing IDs starting at 3. Remove only the selected task. Preserve remove-ID test hooks and use task-name for each displayed name.',
      'Show "No tasks" only when the list is empty.',
    ],
    starter: `import {Component, signal} from '@angular/core';
@Component({selector:'practice-root', standalone:true, template:\`
<h1>Tasks</h1><label>Task <input data-testid="name" [value]="name()" (input)="name.set($any($event.target).value)"></label><button data-testid="add" (click)="add()">Add</button>
<ul>@for(task of tasks(); track task.id){<li><span data-testid="task-name">{{task.name}}</span><button [attr.data-testid]="'remove-'+task.id" (click)="remove(task.id)">Remove {{task.name}}</button></li>}</ul>
<p data-testid="empty">No tasks</p>\`})
export class AppComponent {
 name=signal(''); tasks=signal([{id:1,name:'Read docs'},{id:2,name:'Build app'}]); nextId=3;
 add(){ /* Add a valid task. */ }
 remove(id:number){ /* Remove only this task. */ }
}`,
    hints: [
      'Trim the candidate and return early when it is empty.',
      'Use a unique ID instead of task text for identity and removal.',
      'Update the list, clear the successful input, and derive the empty state from list length.',
    ],
    explanation:
      'Stable identity separates data from display labels. Immutable array updates notify signal consumers, while unique IDs let duplicate names remain independent.',
    scenarios: [
      scenario(
        'Initial list',
        'Show the starting tasks without an empty-state message.',
        [],
        value('task-name', ['Read docs', 'Build app'], 'texts'),
        value('empty', 0, 'count'),
      ),
      scenario(
        'Add trimmed task',
        'Append the trimmed name and clear the input.',
        [input('name', '  Write tests  '), click('add')],
        value('task-name', ['Read docs', 'Build app', 'Write tests'], 'texts'),
        value('name', '', 'value'),
      ),
      scenario(
        'Remove a task',
        'Remove the selected ID rather than clearing the list.',
        [click('remove-1')],
        value('task-name', ['Build app'], 'texts'),
      ),
      scenario(
        'Reject blank task',
        'Do not add whitespace-only entries.',
        [input('name', '   '), click('add')],
        value('task-name', ['Read docs', 'Build app'], 'texts'),
      ),
      scenario(
        'Duplicate identities',
        'Equal names still identify distinct tasks.',
        [input('name', 'Read docs'), click('add'), click('remove-1')],
        value('task-name', ['Build app', 'Read docs'], 'texts'),
        value('remove-3', 1, 'count'),
      ),
      scenario(
        'Empty list',
        'Restore the list and hide the empty state after adding.',
        [click('remove-1'), click('remove-2')],
        value('task-name', [], 'texts'),
        value('empty', 'No tasks'),
      ),
      scenario(
        'Add after emptying',
        'Continue assigning stable IDs after removing all tasks.',
        [click('remove-1'), click('remove-2'), input('name', 'Review'), click('add')],
        value('task-name', ['Review'], 'texts'),
        value('empty', 0, 'count'),
        value('remove-3', 1, 'count'),
      ),
    ],
  }),
  make('ng-input-lifecycle', {
    description: 'Repair a child view that only derives its display value on initialization.',
    requirements: [
      contract,
      'Keep name-badge as a child receiving the parent name input. Render the trimmed name in uppercase, or "ANONYMOUS" for blank input.',
      'Start with "Ada". Parent actions set Grace, a padded Lin, whitespace, or restore Ada. Every change must reach the child, including reset and repeated changes.',
    ],
    starter: `import {Component, Input, OnInit, OnChanges, signal} from '@angular/core';
@Component({selector:'name-badge', standalone:true, template:'<output data-testid="badge">{{display}}</output>'})
export class NameBadge implements OnInit {
 @Input() name=''; display='';
 ngOnInit(){ this.display=this.name.trim().toUpperCase() || 'ANONYMOUS'; }
}
@Component({selector:'practice-root', standalone:true, imports:[NameBadge], template:\`
<h1>Name badge</h1><name-badge [name]="name()"></name-badge>
<button data-testid="grace" (click)="name.set('Grace')">Grace</button><button data-testid="lin" (click)="name.set('  Lin  ')">Lin</button>
<button data-testid="blank" (click)="name.set('   ')">Blank</button><button data-testid="reset" (click)="name.set('Ada')">Reset</button>\`})
export class AppComponent {name=signal('Ada');}`,
    hints: [
      'ngOnInit runs once for each component instance.',
      'ngOnChanges, an input setter, or deriving directly from the current input can handle subsequent values.',
      'Apply the same trim, uppercase, and fallback rules after every parent change.',
    ],
    explanation:
      'Input-dependent state must remain synchronized after initialization. Lifecycle hooks or derivation from the current input avoid stale child views.',
    scenarios: [
      scenario(
        'Initial input',
        'Derive the display from the starting input.',
        [],
        value('badge', 'ADA'),
        value('name-badge', 1, 'count'),
      ),
      scenario(
        'Changed input',
        'Recompute after the parent changes the name.',
        [click('grace')],
        value('badge', 'GRACE'),
      ),
      scenario(
        'Trimmed input',
        'Apply formatting to every new input.',
        [click('lin')],
        value('badge', 'LIN'),
      ),
      scenario(
        'Blank fallback',
        'Whitespace needs the anonymous fallback.',
        [click('blank')],
        value('badge', 'ANONYMOUS'),
      ),
      scenario(
        'Reset input',
        'A reset must also update derived display state.',
        [click('grace'), click('reset')],
        value('badge', 'ADA'),
      ),
      scenario(
        'Several changes',
        'Do not capture only the first changed value.',
        [click('grace'), click('blank'), click('lin')],
        value('badge', 'LIN'),
      ),
    ],
  }),
  make('ng-projection', {
    description: 'Complete a reusable card with heading, body, and action projection slots.',
    requirements: [
      contract,
      'Keep both info-card components and the parent content. Project [card-title] into card-heading, unmarked content into card-body, and [card-actions] into card-actions-slot.',
      'The first card shows "Profile", "Ada", and a Rename button. Rename updates the projected body to "Grace". Reset restores Ada. The second card shows "Tips", "Practice daily", and fallback action text "No actions".',
      'Slot test hooks repeat once per card. Content and parent event bindings must remain functional after projection.',
    ],
    starter: `import {Component, signal} from '@angular/core';
@Component({selector:'info-card', standalone:true, template:\`
<article><header data-testid="card-heading"></header><section data-testid="card-body"></section><footer data-testid="card-actions-slot"></footer></article>\`})
export class InfoCard {}
@Component({selector:'practice-root', standalone:true, imports:[InfoCard], template:\`
<h1>Cards</h1><info-card><h2 card-title>Profile</h2><p>{{name()}}</p><button card-actions data-testid="rename" (click)="name.set('Grace')">Rename</button></info-card>
<info-card><h2 card-title>Tips</h2><p>Practice daily</p></info-card>
<button data-testid="reset" (click)="name.set('Ada')">Reset</button>\`})
export class AppComponent {name=signal('Ada');}`,
    hints: [
      'Place ng-content placeholders inside the slot wrappers.',
      'Use select for the heading and action attributes; an unselected slot receives remaining content.',
      'Provide No actions as fallback inside the action ng-content. Projected bindings still belong to the parent.',
    ],
    explanation:
      'Content projection separates a reusable container from caller-owned content. Selected slots route content without taking ownership of its bindings or events.',
    scenarios: [
      scenario(
        'Heading slots',
        'Project each title into its heading slot.',
        [],
        value('card-heading', ['Profile', 'Tips'], 'texts'),
        value('info-card', 2, 'count'),
      ),
      scenario(
        'Body slots',
        'The default slot should contain only unmarked body content.',
        [],
        value('card-body', ['Ada', 'Practice daily'], 'texts'),
      ),
      scenario(
        'Action fallback',
        'Render projected actions or the declared fallback.',
        [],
        value('card-actions-slot', ['Rename', 'No actions'], 'texts'),
      ),
      scenario(
        'Projected event',
        'Preserve parent event bindings on projected controls.',
        [click('rename')],
        value('card-body', ['Grace', 'Practice daily'], 'texts'),
      ),
      scenario(
        'Parent reset',
        'Projected text must reflect later parent state.',
        [click('rename'), click('reset')],
        value('card-body', ['Ada', 'Practice daily'], 'texts'),
      ),
      scenario(
        'Independent cards',
        'Updating one card must not alter another card or its fallback.',
        [click('rename'), click('rename')],
        value('card-heading', ['Profile', 'Tips'], 'texts'),
        value('card-actions-slot', ['Rename', 'No actions'], 'texts'),
        value('card-body', ['Grace', 'Practice daily'], 'texts'),
      ),
    ],
  }),
  make('ng-form-array', {
    description: 'Complete a dynamic reactive form with independently validated rows.',
    requirements: [
      contract,
      'Keep a FormArray of skill controls, starting with one empty row. Add appends an empty row; Remove deletes only its row, with a minimum of one row. Use skill-INDEX and remove-INDEX hooks.',
      'Each skill must be nonempty after trimming. Disable Save while any row is invalid. Valid Save displays trimmed names joined by ", " in order. Invalid Save must not replace the last successful result.',
      'Reset returns to one empty row and clears the saved result. Duplicate skill names are allowed.',
    ],
    starter: `import {Component, signal} from '@angular/core';
import {FormArray, FormControl, ReactiveFormsModule} from '@angular/forms';
@Component({selector:'practice-root', standalone:true, imports:[ReactiveFormsModule], template:\`
<h1>Skills</h1>@for(control of skills.controls; track control; let i=$index){<div><label>Skill {{i+1}} <input [attr.data-testid]="'skill-'+i" [formControl]="control"></label><button [attr.data-testid]="'remove-'+i" (click)="remove(i)">Remove skill {{i+1}}</button></div>}
<button data-testid="add" (click)="add()">Add skill</button><button data-testid="save" (click)="save()">Save</button><button data-testid="reset" (click)="reset()">Reset</button><output data-testid="saved">{{saved()}}</output>\`})
export class AppComponent {
 skills=new FormArray([new FormControl('',{nonNullable:true})]); saved=signal('');
 add(){ /* Append a control with validation. */ }
 remove(index:number){ /* Keep at least one row. */ }
 save(){ this.saved.set(this.skills.getRawValue().join(', ')); }
 reset(){ /* Restore one empty control and clear saved text. */ }
}`,
    hints: [
      'Use a validator that rejects values whose trimmed length is zero.',
      'FormArray push, removeAt, and clear manage controls. Guard removal of the final row.',
      'Use one validity rule for Save and its handler. Reset both controls and saved output.',
    ],
    explanation:
      'A FormArray models a dynamic collection while each control retains its own validation state. UI actions should preserve collection constraints and saved-result semantics.',
    scenarios: [
      scenario(
        'Initial validation',
        'An empty required row disables saving.',
        [],
        value('skill-0', '', 'value'),
        value('save', true, 'disabled'),
      ),
      scenario(
        'One valid row',
        'Trim the value when saving valid data.',
        [input('skill-0', '  Angular  '), click('save')],
        value('saved', 'Angular'),
        value('save', false, 'disabled'),
      ),
      scenario(
        'Add and save',
        'New controls should retain their own values.',
        [input('skill-0', 'Angular'), click('add'), input('skill-1', 'CSS'), click('save')],
        value('saved', 'Angular, CSS'),
      ),
      scenario(
        'Blank added row',
        'A new blank row must invalidate the whole form.',
        [
          input('skill-0', 'Angular'),
          click('save'),
          click('add'),
          input('skill-1', '   '),
          click('save'),
        ],
        value('save', true, 'disabled'),
        value('saved', 'Angular'),
      ),
      scenario(
        'Remove selected row',
        'Keep other values and reindex visible row hooks.',
        [
          input('skill-0', 'Angular'),
          click('add'),
          input('skill-1', 'CSS'),
          click('remove-0'),
          click('save'),
        ],
        value('skill-0', 'CSS', 'value'),
        value('skill-1', 0, 'count'),
        value('saved', 'CSS'),
      ),
      scenario(
        'Minimum one row',
        'Removing the final row should do nothing.',
        [click('remove-0')],
        value('skill-0', 1, 'count'),
      ),
      scenario(
        'Reset collection',
        'Reset to a single invalid row and clear saved output.',
        [
          input('skill-0', 'Git'),
          click('add'),
          input('skill-1', 'Git'),
          click('save'),
          click('reset'),
        ],
        value('skill-0', '', 'value'),
        value('skill-1', 0, 'count'),
        value('saved', ''),
        value('save', true, 'disabled'),
      ),
    ],
  }),
  make('ng-onpush', {
    description:
      'Fix stale child views when a parent changes a list passed to an OnPush component.',
    requirements: [
      contract,
      'Keep the OnPush change detection setting on course-list and its courses input. Start with Angular and CSS. Parent Add appends a numbered course (Course 3, Course 4, and so on). Rename changes only the first item to "Angular Advanced".',
      'The child must immediately reflect every parent action. Reset restores the two original courses and numbering. Retain the component and course test hooks.',
      'Immutable updates are recommended; any working update strategy that retains the OnPush child is accepted.',
    ],
    starter: `import {Component, Input, ChangeDetectionStrategy, signal} from '@angular/core';
@Component({selector:'course-list', standalone:true, changeDetection:ChangeDetectionStrategy.OnPush, template:'<ul>@for(course of courses; track $index){<li data-testid="course">{{course}}</li>}</ul>'})
export class CourseList { @Input() courses:string[]=[]; }
@Component({selector:'practice-root', standalone:true, imports:[CourseList], template:\`
<h1>OnPush courses</h1><course-list [courses]="courses()"></course-list><button data-testid="add" (click)="add()">Add course</button><button data-testid="rename" (click)="rename()">Rename first</button><button data-testid="reset" (click)="reset()">Reset</button>\`})
export class AppComponent {
 courses=signal(['Angular','CSS']);
 add(){this.courses().push('Course '+(this.courses().length+1));}
 rename(){this.courses()[0]='Angular Advanced';}
 reset(){this.courses().splice(0,this.courses().length,'Angular','CSS');}
}`,
    hints: [
      'Changing an array in place keeps the same input reference.',
      'Create a new array for additions, replacements, and reset.',
      'Keep the child OnPush. State updates should notify Angular rather than relying on unrelated events.',
    ],
    explanation:
      'Reference identity matters for signal equality and OnPush inputs. Immutable updates make state transitions observable and keep child views synchronized.',
    scenarios: [
      scenario(
        'Initial child list',
        'Pass the initial list through the child input.',
        [],
        value('course', ['Angular', 'CSS'], 'texts'),
        value('course-list', 1, 'count'),
      ),
      scenario(
        'Parent addition',
        'Notify the child when adding to the list.',
        [click('add')],
        value('course', ['Angular', 'CSS', 'Course 3'], 'texts'),
      ),
      scenario(
        'Parent replacement',
        'Notify the child when changing a list item.',
        [click('rename')],
        value('course', ['Angular Advanced', 'CSS'], 'texts'),
      ),
      scenario(
        'Repeated additions',
        'Use the current list when assigning new names.',
        [click('add'), click('add')],
        value('course', ['Angular', 'CSS', 'Course 3', 'Course 4'], 'texts'),
      ),
      scenario(
        'Reset after edits',
        'Reset must replace the edited list in the child too.',
        [click('rename'), click('add'), click('reset')],
        value('course', ['Angular', 'CSS'], 'texts'),
      ),
      scenario(
        'Continue after reset',
        'Reset both displayed contents and subsequent numbering.',
        [click('add'), click('reset'), click('add')],
        value('course', ['Angular', 'CSS', 'Course 3'], 'texts'),
      ),
    ],
  }),
  make('ng-value-accessor', {
    description:
      'Complete the bridge between a custom quantity control and Angular reactive forms.',
    requirements: [
      contract,
      'Keep quantity-input as a ControlValueAccessor connected through [formControl]. The parent starts at 2. The custom control supports quantities from 0 to 5, with decrement/increment buttons disabled at boundaries.',
      'User changes update both the visible control value and parent value. Parent Set four and Reset (to 0) update the custom control. Reset also restores the parent to untouched.',
      'Disable/Enable toggles the FormControl; both child buttons must follow its disabled state. A user increment/decrement marks the control touched. Programmatic writes must not mark it touched.',
    ],
    starter: `import {Component, forwardRef, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule} from '@angular/forms';
@Component({selector:'quantity-input', standalone:true, providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>QuantityInput),multi:true}], template:\`
<button data-testid="minus" (click)="change(-1)">Decrease</button><output data-testid="quantity">{{value()}}</output><button data-testid="plus" (click)="change(1)">Increase</button>\`})
export class QuantityInput implements ControlValueAccessor {
 value=signal(0); disabled=signal(false); onChange=(value:number)=>{}; onTouched=()=>{};
 writeValue(value:number){ /* Apply parent value without emitting changes. */ }
 registerOnChange(fn:(value:number)=>void){ /* Store callback. */ }
 registerOnTouched(fn:()=>void){ /* Store callback. */ }
 setDisabledState(disabled:boolean){ /* Apply disabled state. */ }
 change(delta:number){ this.value.update(value=>value+delta); }
}
@Component({selector:'practice-root', standalone:true, imports:[QuantityInput,ReactiveFormsModule], template:\`
<h1>Custom quantity</h1><quantity-input [formControl]="quantity"></quantity-input>
<p>Parent: <output data-testid="parent-value">{{quantity.value}}</output></p><p data-testid="touched">{{quantity.touched ? 'Touched' : 'Untouched'}}</p>
<button data-testid="set" (click)="quantity.setValue(4)">Set four</button><button data-testid="reset" (click)="quantity.reset(0)">Reset</button><button data-testid="disable" (click)="quantity.disabled ? quantity.enable() : quantity.disable()">Disable/Enable</button>\`})
export class AppComponent {quantity=new FormControl(2,{nonNullable:true});}`,
    hints: [
      'writeValue handles model-to-view updates; registerOnChange and registerOnTouched save callbacks for user interactions.',
      'setDisabledState must update actual interactive controls, including their existing boundary states.',
      'Clamp quantities, notify the parent only for user changes, and call the touched callback when the user interacts.',
    ],
    explanation:
      'A ControlValueAccessor is a two-way protocol, not just a value binding. Model writes, user changes, touch state, and disabling each have distinct responsibilities.',
    scenarios: [
      scenario(
        'Initial model write',
        'The parent value must initialize the view without touching it.',
        [],
        value('quantity', '2'),
        value('parent-value', '2'),
        value('touched', 'Untouched'),
      ),
      scenario(
        'User change',
        'Propagate user changes and touch state to the form.',
        [click('plus')],
        value('quantity', '3'),
        value('parent-value', '3'),
        value('touched', 'Touched'),
      ),
      scenario(
        'Programmatic write',
        'Parent writes update the view without marking touched.',
        [click('set')],
        value('quantity', '4'),
        value('parent-value', '4'),
        value('touched', 'Untouched'),
      ),
      scenario(
        'Disabled control',
        'Disabled controls must not change, and enabling restores interaction.',
        [click('disable'), click('plus'), click('minus')],
        value('quantity', '2'),
        value('plus', true, 'disabled'),
        value('minus', true, 'disabled'),
        value('touched', 'Untouched'),
      ),
      scenario(
        'Resume after enabling',
        'Reenable the control and propagate new user values.',
        [click('disable'), click('disable'), click('minus')],
        value('quantity', '1'),
        value('parent-value', '1'),
        value('plus', false, 'disabled'),
      ),
      scenario(
        'Upper boundary',
        'Clamp at five and disable further increases.',
        [click('set'), click('plus'), click('plus')],
        value('quantity', '5'),
        value('parent-value', '5'),
        value('plus', true, 'disabled'),
      ),
      scenario(
        'Reset and lower boundary',
        'Reset the view and touch state; prevent negative values.',
        [click('plus'), click('reset'), click('minus')],
        value('quantity', '0'),
        value('parent-value', '0'),
        value('minus', true, 'disabled'),
        value('touched', 'Untouched'),
      ),
    ],
  }),
  make('ng-cleanup', {
    description: 'Stop a destroyed component from continuing to react to a shared event stream.',
    requirements: [
      contract,
      'Keep EventBus, listener-panel, and the conditional parent mounting. Each Ping adds one to handled only while the listener exists. Start visible with handled 0.',
      'Hide must destroy the listener; pings while hidden must not increase handled. Showing it again creates exactly one active listener. Repeated hide/show cycles must not accumulate subscriptions.',
      'Preserve the shared event service and handled counter. Use takeUntilDestroyed or equivalent explicit subscription cleanup; do not reset the counter when mounting or unmounting.',
    ],
    starter: `import {Component, Injectable, inject, signal, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
@Injectable({providedIn:'root'})
export class EventBus {events=new Subject<void>();handled=signal(0);}
@Component({selector:'listener-panel', standalone:true, template:'<p data-testid="listener">Listening</p>'})
export class ListenerPanel {
 bus=inject(EventBus);
 constructor(){this.bus.events.subscribe(()=>this.bus.handled.update(n=>n+1));}
}
@Component({selector:'practice-root', standalone:true, imports:[ListenerPanel], template:\`
<h1>Event listeners</h1>@if(visible()){<listener-panel></listener-panel>}
<button data-testid="toggle" (click)="visible.update(invert)">Show/Hide listener</button><button data-testid="ping" (click)="bus.events.next()">Ping</button><output data-testid="handled">{{bus.handled()}}</output>\`})
export class AppComponent {bus=inject(EventBus);visible=signal(true);invert=(value:boolean)=>!value;}`,
    hints: [
      'Destroying a component does not automatically unsubscribe a manual RxJS subscription.',
      'takeUntilDestroyed can tie a subscription created in an injection context to that component lifetime.',
      'Alternatively keep the subscription and unsubscribe in ngOnDestroy. Every recreated child needs its own cleanup.',
    ],
    explanation:
      'Subscription lifetime should match its owner. Cleanup prevents destroyed views from retaining resources and causing duplicate effects after remounting.',
    scenarios: [
      scenario(
        'Initial listener',
        'Mount a single listener without incrementing the counter.',
        [],
        value('handled', '0'),
        value('listener', 'Listening'),
      ),
      scenario(
        'One event',
        'Each event reaches the active listener once.',
        [click('ping')],
        value('handled', '1'),
      ),
      scenario(
        'Several events',
        'Accumulate events while the listener remains mounted.',
        [click('ping'), click('ping'), click('ping')],
        value('handled', '3'),
      ),
      scenario(
        'Destroyed listener',
        'Unsubscribe when the child is destroyed.',
        [click('toggle'), click('ping'), click('ping')],
        value('handled', '0'),
        value('listener', 0, 'count'),
      ),
      scenario(
        'Remount once',
        'A recreated listener must not coexist with the old subscription.',
        [click('ping'), click('toggle'), click('toggle'), click('ping')],
        value('handled', '2'),
        value('listener', 1, 'count'),
      ),
      scenario(
        'Repeated lifetimes',
        'Clean up on every destruction and preserve the cumulative count.',
        [
          click('ping'),
          click('toggle'),
          click('ping'),
          click('toggle'),
          click('ping'),
          click('toggle'),
          click('ping'),
          click('toggle'),
          click('ping'),
        ],
        value('handled', '3'),
        value('listener', 1, 'count'),
      ),
    ],
  }),
];
