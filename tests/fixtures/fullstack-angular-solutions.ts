import { fullstackExpansionSolutions } from './fullstack-expansion-solutions';
import { fullstackSolutions } from './fullstack-solutions';
import { apiStarter } from '../../src/app/core/fullstack/scaffold';
import type { ProjectFiles } from '../../src/app/core/fullstack/model';

// Behavioral reference implementations. These are never included in learner starters.
const state = `
 api = inject(PracticeApi);
 status = signal('Ready');
 async call(method, path, body?) {
   const response = await this.api.request(method, path, body);
   if (!response.ok) throw Error('Request rejected');
   return response.body;
 }
 async ngOnInit() { await this.reload(); }
 async reload() { try { await this.load(); this.status.set('Ready'); } catch { this.status.set('Error'); } }
`;
const bodies: Record<string, string> = {
  'fs-tasks': `
 items = signal([]); title = '';
 async load() { this.items.set((await this.call('GET','/tasks')).items); }
 async write(method,path,body?) {
   try { await this.call(method,path,body); await this.load(); this.status.set('Saved'); return true; }
   catch { this.status.set('Error'); return false; }
 }
 async add() { if(await this.write('POST','/tasks',{title:this.title})) this.title=''; }
 toggle(item) { return this.write('PATCH','/tasks/'+item.id,{done:!item.done}); }
 remove(item) { return this.write('DELETE','/tasks/'+item.id); }
`,
  'fs-guestbook': `
 items = signal([]); name = ''; message = '';
 async load() { this.items.set((await this.call('GET','/entries')).items); }
 async save() {
   try { await this.call('POST','/entries',{name:this.name,message:this.message}); await this.load(); this.name=''; this.message=''; this.status.set('Saved'); }
   catch { this.status.set('Error'); }
 }
`,
  'fs-tickets': `
 items = signal([]); subject = ''; filter = 'all';
 async load() { this.items.set((await this.call('GET','/tickets?status='+this.filter)).items); }
 async save() {
   try { await this.call('POST','/tickets',{subject:this.subject}); await this.load(); this.subject=''; this.status.set('Saved'); }
   catch { this.status.set('Error'); }
 }
 async resolve(item) {
   try { await this.call('PATCH','/tickets/'+item.id,{status:'resolved'}); await this.load(); this.status.set('Saved'); }
   catch { this.status.set('Error'); }
 }
`,
  'fs-conflicts': `
 title = signal(''); version = signal(0);
 async load() { const {document} = await this.call('GET','/document'); this.title.set(document.title); this.version.set(document.version); }
 async save() {
   try {
     const r = await this.api.request('PATCH','/document',{title:this.title(),version:this.version()});
     if(r.status===409) { this.version.set(r.body.document.version); this.status.set('Conflict'); return; }
     if(!r.ok) throw Error('Rejected');
     this.title.set(r.body.document.title); this.version.set(r.body.document.version); this.status.set('Saved');
   } catch { this.status.set('Error'); }
 }
 async externalEdit() {
   try { const {document} = await this.call('GET','/document'); await this.call('PATCH','/document',{title:'Edited elsewhere',version:document.version}); }
   catch { this.status.set('Error'); }
 }
`,
};
const templates: Record<string, string> = {
  'fs-tasks': `
 <label>Title<input data-testid="title" [(ngModel)]="title"></label>
 <button data-testid="add" (click)="add()">Add task</button>
 <ul data-testid="list">@for (item of items(); track item.id) {
   <li data-testid="task-row">
     <span [attr.data-testid]="'title-'+item.id">{{item.title}}</span>
     <span [attr.data-testid]="'done-'+item.id">{{item.done ? 'Done' : 'Open'}}</span>
     <button [attr.data-testid]="'toggle-'+item.id" (click)="toggle(item)">Toggle</button>
     <button [attr.data-testid]="'delete-'+item.id" (click)="remove(item)">Delete</button>
   </li>
 }</ul>`,
  'fs-guestbook': `
 <label>Name<input data-testid="name" [(ngModel)]="name"></label>
 <label>Message<textarea data-testid="message" [(ngModel)]="message"></textarea></label>
 <button data-testid="submit" (click)="save()">Post message</button>
 <section data-testid="list">@for(item of items(); track item.id) {
   <article data-testid="entry-row"><h3 [attr.data-testid]="'name-'+item.id">{{item.name}}</h3><p [attr.data-testid]="'message-'+item.id">{{item.message}}</p></article>
 }</section>`,
  'fs-tickets': `
 <label>Subject<input data-testid="subject" [(ngModel)]="subject"></label>
 <label>Status<select data-testid="filter" [(ngModel)]="filter" (ngModelChange)="reload()"><option value="all">All</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label>
 <button data-testid="create" (click)="save()">Create</button>
 <ul data-testid="list">@for(item of items(); track item.id) {
   <li data-testid="ticket-row"><span [attr.data-testid]="'subject-'+item.id">{{item.subject}}</span><span [attr.data-testid]="'state-'+item.id">{{item.status}}</span><button [attr.data-testid]="'resolve-'+item.id" (click)="resolve(item)">Resolve</button></li>
 }</ul>`,
  'fs-conflicts': `
 <label>Title<input data-testid="title" [ngModel]="title()" (ngModelChange)="title.set($event)"></label>
 <output data-testid="version">{{version()}}</output>
 <button data-testid="save" (click)="save()">Save</button>
 <button data-testid="external-edit" (click)="externalEdit()">Change record elsewhere</button>`,
};
for (const id of ['fs-checkout', 'fs-orders']) {
  const retry = id === 'fs-orders';
  bodies[id] = `
  product = signal({name:'',stock:0}); quantity = 1; total = signal(0); orderId = signal(0); busy = signal(false); pending = null; counter = 0;
  async load() { this.product.set((await this.call('GET','/products')).items.find(p=>p.id===1)); }
  async checkout() {
    if(this.busy()) return; this.busy.set(true);
    try {
      const quantity = Number(this.quantity);
      ${retry ? `if(!this.pending || this.pending.quantity!==quantity) this.pending={productId:1,quantity,key:'request-'+(++this.counter)};` : ''}
      const {order} = await this.call('POST','/orders',${retry ? 'this.pending' : '{productId:1,quantity}'});
      this.total.set(order.totalCents); this.orderId.set(order.id); this.pending=null;
      await this.load(); this.status.set('Saved');
    } catch { this.status.set('Error'); } finally { this.busy.set(false); }
  }`;
  templates[id] = `
  <h3 data-testid="name">{{product().name}}</h3><span data-testid="stock">{{product().stock}}</span>
  <label>Quantity<input data-testid="quantity" type="number" [(ngModel)]="quantity"></label>
  <button data-testid="checkout" [disabled]="busy()" (click)="checkout()">Place order</button>
  <output data-testid="total">{{total()}}</output><output data-testid="order-id">{{orderId()}}</output>`;
}
export const angularFullstackSolutions: Record<string, ProjectFiles> = Object.fromEntries(
  Object.entries(fullstackSolutions).map(([id, legacy]) => {
    if (fullstackExpansionSolutions[id]) return [id, fullstackExpansionSolutions[id]];
    // Register the same endpoint contracts through the supplied router. The handlers remain learner code.
    const api =
      `import {createRouter} from '@procode/server';\n` +
      legacy['api.js'].replace('export function handleRequest', 'function domainRequest') +
      '\n' +
      apiStarter(id)
        .replace("import { createRouter } from '@procode/server';", '')
        .replaceAll(
          "return { status: 501, body: { error: 'Not implemented' } };",
          'return domainRequest(request, db);',
        );
    return [
      id,
      {
        ...legacy,
        'index.html': `<main><h1>Practice project</h1>${templates[id]}<button data-testid="reload" (click)="reload()">Reload</button><p data-testid="status" role="status">{{status()}}</p></main>`,
        'app.ts': `import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PracticeApi, projectTemplate} from '@procode/fullstack';
@Component({selector:'practice-root',standalone:true,imports:[FormsModule],template:projectTemplate})
export class AppComponent {${state}${bodies[id]}}`,
        'api.js': api,
      },
    ];
  }),
);
