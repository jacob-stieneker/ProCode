import { AngularExercise } from './model';
import { click, input, wait, value, scenario, make, contract } from './authoring';
const ada = 'Ada (ada@example.com)',
  grace = 'Grace (grace@example.com)',
  lin = 'Lin (lin@example.com)';
const initial = [ada, grace];
const form = (name: string, email: string) => [input('name', name), input('email', email)];
const rows = (...names: string[]) => value('contact', names, 'texts');
const ready = wait(240);
const template = (api: boolean, senior = false) => `<h1>Contacts</h1>
<p data-testid="mode">{{editing() === null ? 'Create' : 'Edit'}}</p>
<label>Name <input data-testid="name" [disabled]="busy()" [value]="name()" (input)="name.set($any($event.target).value)"></label>
<label>Email <input data-testid="email" [disabled]="busy()" [value]="email()" (input)="email.set($any($event.target).value)"></label>
<button data-testid="save" [disabled]="busy() || !valid()" (click)="save()">Save</button>
<button data-testid="cancel" [disabled]="busy()" (click)="cancel()">Cancel</button>
<ul>@for(contact of contacts(); track contact.id){<li><span data-testid="contact">{{contact.name}} ({{contact.email}})</span>
<button [attr.data-testid]="'edit-'+contact.id" [disabled]="busy()" (click)="edit(contact)">Edit {{contact.name}}</button>
<button [attr.data-testid]="'delete-'+contact.id" [disabled]="busy()" (click)="remove(contact)">Delete {{contact.name}}</button></li>}</ul>
@if(contacts().length === 0 && !busy()){<p data-testid="empty">No contacts</p>}
${
  api
    ? `<p data-testid="status">{{status()}}</p><button data-testid="reload" [disabled]="busy()" (click)="load()">Reload records</button>
<fieldset [disabled]="busy()"><legend>Simulate request failures</legend>
<button data-testid="fail-list" (click)="api.failNext('list')">Fail next load</button><button data-testid="fail-create" (click)="api.failNext('create')">Fail next create</button><button data-testid="fail-update" (click)="api.failNext('update')">Fail next update</button><button data-testid="fail-delete" (click)="api.failNext('delete')">Fail next delete</button>
${senior ? '<button data-testid="remote" (click)="api.changeElsewhere(1)">Change Ada elsewhere</button>' : ''}</fieldset>`
    : ''
}`;
const state = `name=signal(''); email=signal(''); editing=signal<number|null>(null); busy=signal(false);
 valid(){ return !!this.name().trim() && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.email().trim()); }
 edit(contact:any){ /* Copy the selected contact into the form. */ }
 cancel(){ /* Clear the form and leave edit mode. */ }`;
const localStarter = `import {Component, signal} from '@angular/core';
@Component({selector:'practice-root',standalone:true,template:\`${template(false)}\`})
export class AppComponent {
 contacts=signal([{id:1,name:'Ada',email:'ada@example.com'},{id:2,name:'Grace',email:'grace@example.com'}]); nextId=3;
 ${state}
 save(){ /* Create or update by ID, then clear the form. */ }
 remove(contact:any){ /* Delete only this contact and cancel an edit of it. */ }
}`;
const apiStarter = (senior: boolean) => `import {Component, signal, inject} from '@angular/core';
import {PracticeContactsApi} from '@procode/practice';
@Component({selector:'practice-root',standalone:true,template:\`${template(true, senior)}\`})
export class AppComponent {
 api=inject(PracticeContactsApi); contacts=signal<any[]>([]); status=signal('Ready'); revision=0;
 ${state}
 constructor(){this.load();}
 load(){if(this.busy())return;this.busy.set(true);this.status.set('Loading');this.api.list().subscribe({next:(records:any[])=>{this.contacts.set(records);this.busy.set(false);this.status.set('Ready');},error:()=>{this.busy.set(false);this.status.set('Error');}});}
 save(){ /* Subscribe to create/update, handle success and failure, then release busy state. */ }
 remove(contact:any){ /* Delete through the API${senior ? ', with optimistic removal and rollback' : ''}. */ }
}`;
const basics = [
  contract,
  'Start with Ada (ada@example.com), ID 1, and Grace (grace@example.com), ID 2. Display contacts in order. Create appends a new contact. Edit pre-fills a separate form; Save updates that ID without adding a duplicate. Cancel discards form changes. Delete removes only its ID and cancels editing if that record was selected.',
  'Trim name and email on Save. Name must be nonempty. Email must match the supplied valid() pattern. Disable Save when invalid. Duplicate names are allowed and IDs remain unique. Successful Save clears both inputs and returns mode to "Create"; editing shows "Edit". Show "No contacts" when empty.',
];
const apiContract = [
  'Use injected PracticeContactsApi from @procode/practice. list(), create({name,email}), update(id,{name,email},expectedVersion?), and delete(id,expectedVersion?) return cold Observables after 160ms. Subscribe once per request. Created records get server IDs; all records include version. Lists and records are copies. Reload records must show saved server state.',
  'Show "Loading" during every request, "Ready" after success, and "Error" after failure. Disable form inputs, Save, Cancel, row actions, Reload, and failure controls while busy. Ignore repeated submissions during a request. Keep existing rows on failed loads and preserve form values/edit selection on failed saves, so the user can retry.',
  'failNext("list"|"create"|"update"|"delete") makes the next matching request fail once with code 503 and no server mutation. Use the supplied failure controls for practice. No network is used; records survive list reloads only within this preview session. Run/Finish starts a fresh server for each check and preview.',
];
const localScenarios = [
  scenario(
    'Read initial contacts',
    'Render both starting contacts and keep Save disabled for an empty form.',
    [],
    rows(...initial),
    value('save', true, 'disabled'),
  ),
  scenario(
    'Create contact',
    'Append trimmed values, clear inputs, and keep existing records.',
    [...form('  Lin  ', '  lin@example.com  '), click('save')],
    rows(...initial, lin),
    value('name', '', 'value'),
    value('email', '', 'value'),
    value('mode', 'Create'),
  ),
  scenario(
    'Update contact',
    'Replace the selected ID rather than appending another row.',
    [click('edit-1'), ...form('Ada Lovelace', 'ada.new@example.com'), click('save')],
    rows('Ada Lovelace (ada.new@example.com)', grace),
    value('mode', 'Create'),
  ),
  scenario(
    'Prefill edit form',
    'Editing must copy the selected record into both controls.',
    [click('edit-2')],
    value('name', 'Grace', 'value'),
    value('email', 'grace@example.com', 'value'),
    value('mode', 'Edit'),
  ),
  scenario(
    'Cancel without mutation',
    'Do not bind draft changes directly to the saved row.',
    [click('edit-1'), input('name', 'Changed'), click('cancel')],
    rows(...initial),
    value('mode', 'Create'),
    value('name', '', 'value'),
    value('email', '', 'value'),
  ),
  scenario(
    'Delete selected contact',
    'Delete only the chosen ID and leave edit mode for that record.',
    [click('edit-1'), click('delete-1')],
    rows(grace),
    value('mode', 'Create'),
    value('name', '', 'value'),
  ),
  scenario(
    'Invalid input',
    'Reject malformed email even when a name is present.',
    [...form('Lin', 'invalid'), click('save')],
    rows(...initial),
    value('save', true, 'disabled'),
  ),
  scenario(
    'Blank name',
    'Whitespace alone cannot create a contact.',
    [...form('   ', 'lin@example.com'), click('save')],
    rows(...initial),
    value('save', true, 'disabled'),
  ),
  scenario(
    'Empty and create again',
    'Show empty state after deleting everything and continue assigning unique IDs.',
    [click('delete-1'), click('delete-2')],
    rows(),
    value('empty', 'No contacts'),
  ),
  scenario(
    'Distinct IDs after deletion',
    'Duplicate names and deleted rows must not cause identity collisions.',
    [
      click('delete-1'),
      ...form('Grace', 'other@example.com'),
      click('save'),
      click('edit-3'),
      input('name', 'Other Grace'),
      click('save'),
    ],
    rows(grace, 'Other Grace (other@example.com)'),
  ),
];
const apiScenarios = [
  scenario(
    'Read from service',
    'Load the initial records and finish in Ready state.',
    [ready],
    rows(...initial),
    value('status', 'Ready'),
  ),
  scenario(
    'Create and reload',
    'Save through the API so created records survive a list reload.',
    [ready, ...form('  Lin  ', ' lin@example.com '), click('save'), ready, click('reload'), ready],
    rows(...initial, lin),
    value('mode', 'Create'),
    value('name', '', 'value'),
    value('email', '', 'value'),
  ),
  scenario(
    'Update and reload',
    'Persist an edit by its stable ID without duplicating the contact.',
    [
      ready,
      click('edit-1'),
      ...form('Ada Lovelace', 'ada.new@example.com'),
      click('save'),
      ready,
      click('reload'),
      ready,
    ],
    rows('Ada Lovelace (ada.new@example.com)', grace),
  ),
  scenario(
    'Delete and reload',
    'A successful deletion must persist in the service.',
    [ready, click('delete-1'), ready, click('reload'), ready],
    rows(grace),
    value('status', 'Ready'),
  ),
  scenario(
    'Cancel isolated draft',
    'Discard draft changes instead of mutating a loaded record.',
    [ready, click('edit-1'), input('name', 'Changed'), click('cancel')],
    rows(...initial),
    value('name', '', 'value'),
    value('email', '', 'value'),
    value('mode', 'Create'),
  ),
  scenario(
    'Request in flight',
    'Expose Loading and disable controls during a save.',
    [ready, ...form('Lin', 'lin@example.com'), click('save')],
    value('status', 'Loading'),
    value('save', true, 'disabled'),
    value('name', true, 'disabled'),
    value('reload', true, 'disabled'),
    value('edit-1', true, 'disabled'),
  ),
  scenario(
    'Create failure preserves draft',
    'A failed create must not add a row or erase retry input.',
    [ready, click('fail-create'), ...form('Lin', 'lin@example.com'), click('save'), ready],
    rows(...initial),
    value('status', 'Error'),
    value('name', 'Lin', 'value'),
    value('save', false, 'disabled'),
  ),
  scenario(
    'Retry create once',
    'Release busy state on error and create only one record on retry.',
    [
      ready,
      click('fail-create'),
      ...form('Lin', 'lin@example.com'),
      click('save'),
      ready,
      click('save'),
      click('save'),
      ready,
      click('reload'),
      ready,
    ],
    rows(...initial, lin),
    value('status', 'Ready'),
  ),
  scenario(
    'Update failure preserves edit',
    'Retain the edit target and draft when update fails.',
    [
      ready,
      click('edit-1'),
      input('name', 'Ada Updated'),
      click('fail-update'),
      click('save'),
      ready,
    ],
    rows(...initial),
    value('status', 'Error'),
    value('mode', 'Edit'),
    value('name', 'Ada Updated', 'value'),
  ),
  scenario(
    'Retry update',
    'A retry must update the same record, not create a new one.',
    [
      ready,
      click('edit-1'),
      input('name', 'Ada Updated'),
      click('fail-update'),
      click('save'),
      ready,
      click('save'),
      ready,
      click('reload'),
      ready,
    ],
    rows('Ada Updated (ada@example.com)', grace),
    value('status', 'Ready'),
  ),
  scenario(
    'Delete failure',
    'Restore or retain the exact original rows after a failed deletion.',
    [ready, click('fail-delete'), click('delete-1'), ready],
    rows(...initial),
    value('status', 'Error'),
  ),
  scenario(
    'Retry delete',
    'Allow a failed deletion to be retried and persisted.',
    [
      ready,
      click('fail-delete'),
      click('delete-1'),
      ready,
      click('delete-1'),
      ready,
      click('reload'),
      ready,
    ],
    rows(grace),
    value('status', 'Ready'),
  ),
  scenario(
    'Load failure and recovery',
    'Retain visible data on load failure and recover on another reload.',
    [ready, click('fail-list'), click('reload'), ready],
    rows(...initial),
    value('status', 'Error'),
    value('reload', false, 'disabled'),
  ),
  scenario(
    'Reload after failure',
    'A failed request must not block future loading.',
    [ready, click('fail-list'), click('reload'), ready, click('reload'), ready],
    rows(...initial),
    value('status', 'Ready'),
  ),
  scenario(
    'Validation before requests',
    'Invalid form data must not become a saved contact.',
    [ready, ...form('   ', 'invalid'), click('save')],
    rows(...initial),
    value('save', true, 'disabled'),
    value('status', 'Ready'),
  ),
];
export const crudExercises: AngularExercise[] = [
  make('ng-crud-local', {
    description: 'Build a complete contact CRUD workflow using Angular state and an editable form.',
    requirements: [
      ...basics,
      'Keep data in component state. New IDs start at 3 and increase without reusing deleted IDs.',
    ],
    starter: localStarter,
    hints: [
      'Track the edited ID separately from form values. Copy fields into the form rather than mutating the selected object.',
      'Save either maps the selected ID to updated fields or appends a new uniquely identified contact.',
      'Use one clear-form routine after saving or canceling. Deleting the active record must also cancel that edit.',
    ],
    explanation:
      'CRUD combines four operations around stable record identity. A separate edit draft makes cancellation safe, and explicit validation protects saved state.',
    scenarios: localScenarios,
  }),
  make('ng-crud-api', {
    description:
      'Connect the contact manager to asynchronous service operations with persistence inside the practice session.',
    requirements: [
      ...basics,
      ...apiContract,
      'For this exercise, update the visible list after successful mutations. Preserve the list on failure.',
    ],
    starter: apiStarter(false),
    hints: [
      'Subscribe to the operation for the current edit ID, or create when no ID is selected. Use the server-returned record.',
      'Set busy before subscribing and clear it on both success and error. Keep the draft intact on errors.',
      'Update local rows only after success, and use list() on Reload to verify the server owns saved records.',
    ],
    explanation:
      'Service-backed CRUD separates draft state, server state, and request state. Clear success and error transitions allow retries without duplicate writes or lost input.',
    scenarios: apiScenarios,
  }),
  make('ng-crud-conflicts', {
    description:
      'Protect concurrent edits with record versions and recover from failed optimistic deletion.',
    requirements: [
      ...basics,
      ...apiContract,
      'Keep the version captured when editing and pass it to update(id,data,version). Change Ada elsewhere updates server contact 1 to "Ada Remote" and increments its version without updating your list. A stale update returns code 409: show "Conflict", preserve the user draft, and do not overwrite the server.',
      'After a conflict, Cancel then Reload fetches the current record. Starting a new edit must use its new version and save successfully. Other request failures still show "Error".',
      'Delete optimistically: remove the row immediately while Loading, then keep it removed on success. Pass its version to delete(id,version). On error or conflict restore all rows in their original order. Block other mutations during the request.',
    ],
    starter: apiStarter(true),
    hints: [
      'Capture the record version at the beginning of an edit. Handle code 409 separately from a temporary request failure.',
      'Keep a snapshot before optimistic deletion. Restore it if the server rejects the request, including version conflicts.',
      'Clear busy on every path. Resolve a stale edit by canceling, reloading, and starting a new edit with the refreshed version.',
    ],
    explanation:
      'Version checks prevent silent lost updates. Optimistic changes improve responsiveness only when failure restores consistent state and retries use current server data.',
    scenarios: [
      ...apiScenarios,
      scenario(
        'Conflicting edit',
        'Send the captured version and preserve the draft when a newer server edit exists.',
        [ready, click('edit-1'), input('name', 'My edit'), click('remote'), click('save'), ready],
        rows(...initial),
        value('status', 'Conflict'),
        value('name', 'My edit', 'value'),
        value('mode', 'Edit'),
      ),
      scenario(
        'Conflict does not overwrite server',
        "Cancel and reload must reveal the other editor's saved record.",
        [
          ready,
          click('edit-1'),
          input('name', 'My edit'),
          click('remote'),
          click('save'),
          ready,
          click('cancel'),
          click('reload'),
          ready,
        ],
        rows('Ada Remote (ada@example.com)', grace),
      ),
      scenario(
        'Resolve and retry with current version',
        'A new edit after reload must capture the latest version.',
        [
          ready,
          click('edit-1'),
          click('remote'),
          click('save'),
          ready,
          click('cancel'),
          click('reload'),
          ready,
          click('edit-1'),
          input('name', 'Resolved'),
          click('save'),
          ready,
          click('reload'),
          ready,
        ],
        rows('Resolved (ada@example.com)', grace),
        value('status', 'Ready'),
      ),
      scenario(
        'Optimistic removal',
        'Remove the row immediately while the delete request is pending.',
        [ready, click('delete-1')],
        rows(grace),
        value('status', 'Loading'),
        value('reload', true, 'disabled'),
      ),
      scenario(
        'Deletion version conflict',
        'Restore the original row order when a newer server version rejects deletion.',
        [ready, click('remote'), click('delete-1'), ready],
        rows(...initial),
        value('status', 'Conflict'),
      ),
    ],
  }),
];
