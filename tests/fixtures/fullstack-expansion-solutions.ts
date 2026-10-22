import type { ProjectFiles } from '../../src/app/core/fullstack/model';
const css =
  '*{box-sizing:border-box}body{font:16px/1.5 system-ui;margin:16px;color:#172033;background:white}main{max-width:720px;margin:auto}input,select,button{font:inherit;min-height:40px;padding:8px;max-width:100%}input,select{display:block;width:100%}li{overflow-wrap:anywhere;padding:8px}h1{font-size:24px}';
const base = `api=inject(PracticeApi); status=signal('Ready'); items=signal([]);
 async call(method,path,body?){const r=await this.api.request(method,path,body);if(!r.ok)throw Error('Rejected');return r.body;}
 async ngOnInit(){await this.reload();}
 async reload(){try{await this.load();this.status.set('Ready');}catch{this.status.set('Error');}}`;
const component = (body: string) =>
  `import {Component,inject,signal} from '@angular/core';import {FormsModule} from '@angular/forms';import {PracticeApi,projectTemplate} from '@procode/fullstack';@Component({selector:'practice-root',standalone:true,imports:[FormsModule],template:projectTemplate})export class AppComponent{${base}${body}}`;
const template = (body: string) =>
  `<main><h1>Practice workspace</h1>${body}<button data-testid="reload" (click)="reload()">Reload</button><p data-testid="status" role="status">{{status()}}</p></main>`;
const apiBase = `const response=(status,body)=>({status,body});const bad=()=>response(400,{error:'Invalid input'});const missing=()=>response(404,{error:'Not found'});`;
export const fullstackExpansionSolutions: Record<string, ProjectFiles> = {
  'fs-catalog': {
    'styles.css': css,
    'index.html': template(
      `<label>Search products<input data-testid="query" [(ngModel)]="query"></label><button data-testid="search" (click)="reload()">Search</button><ul data-testid="list">@for(item of items();track item.id){<li data-testid="product-row">{{item.name}}</li>}</ul><p data-testid="empty">{{items().length?'':'No products'}}</p>`,
    ),
    'app.ts': component(
      `query='';async load(){this.items.set((await this.call('GET','/catalog?q='+encodeURIComponent(this.query))).items);}`,
    ),
    'api.js':
      apiBase +
      `export function handleRequest({method,path},db){const url=new URL(path,'https://practice.test');if(method==='GET'&&url.pathname==='/catalog'){const query=(url.searchParams.get('q')||'').trim().toLowerCase();return response(200,{items:db.products.filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>a.id-b.id)});}return missing();}`,
  },
  'fs-pagination': {
    'styles.css': css,
    'index.html': template(
      `<label>Search articles<input data-testid="query" [(ngModel)]="query"></label><button data-testid="search" (click)="search()">Search</button><ul data-testid="list">@for(item of items();track item.id){<li data-testid="result-row">{{item.title}}</li>}</ul><button data-testid="previous" [disabled]="page()===1" (click)="move(-1)">Previous</button><output data-testid="page">{{page()}}</output><button data-testid="next" [disabled]="page()*2>=total()" (click)="move(1)">Next</button><output data-testid="total">{{total()}}</output>`,
    ),
    'app.ts': component(
      `query='';page=signal(1);total=signal(0);async load(){const result=await this.call('GET','/articles?q='+encodeURIComponent(this.query)+'&page='+this.page()+'&pageSize=2');this.items.set(result.items);this.total.set(result.total);}async search(){this.page.set(1);await this.reload();}async move(delta){this.page.update(value=>value+delta);await this.reload();}`,
    ),
    'api.js':
      apiBase +
      `export function handleRequest({method,path},db){const url=new URL(path,'https://practice.test');if(method!=='GET'||url.pathname!=='/articles')return missing();const rawPage=url.searchParams.get('page')??'1',rawSize=url.searchParams.get('pageSize')??'2';if(!/^\\d+$/.test(rawPage)||!/^\\d+$/.test(rawSize))return bad();const page=Number(rawPage),pageSize=Number(rawSize);if(!Number.isSafeInteger(page)||page<1||pageSize<1||pageSize>5)return bad();const query=(url.searchParams.get('q')||'').trim().toLowerCase();const matched=db.articles.filter(item=>item.title.toLowerCase().includes(query)).sort((a,b)=>a.id-b.id);return response(200,{items:matched.slice((page-1)*pageSize,page*pageSize),total:matched.length,page,pageSize});}`,
  },
  'fs-bulk': {
    'styles.css': css,
    'index.html': template(
      `<label>Ticket IDs<input data-testid="ids" [(ngModel)]="ids"></label><label>Status<select data-testid="state" [(ngModel)]="state"><option value="open">Open</option><option value="closed">Closed</option></select></label><button data-testid="apply" (click)="apply()">Apply status</button><ul data-testid="list">@for(item of items();track item.id){<li data-testid="ticket-row">{{item.title}} <span [attr.data-testid]="'status-'+item.id">{{item.status}}</span></li>}</ul>`,
    ),
    'app.ts': component(
      `ids='';state='open';async load(){this.items.set((await this.call('GET','/tickets')).items);}async apply(){try{await this.call('PATCH','/tickets/bulk',{ids:this.ids.split(',').map(value=>Number(value.trim())),status:this.state});await this.load();this.ids='';this.status.set('Saved');}catch{this.status.set('Error');}}`,
    ),
    'api.js':
      apiBase +
      `export function handleRequest({method,path,body},db){if(method==='GET'&&path==='/tickets')return response(200,{items:[...db.tickets].sort((a,b)=>a.id-b.id)});if(method!=='PATCH'||path!=='/tickets/bulk')return missing();if(!Array.isArray(body?.ids)||!body.ids.length||body.ids.length>20||!body.ids.every(id=>Number.isInteger(id)&&id>0)||new Set(body.ids).size!==body.ids.length||!['open','closed'].includes(body.status))return bad();const selected=body.ids.map(id=>db.tickets.find(item=>item.id===id));if(selected.some(item=>!item))return missing();for(const item of selected)item.status=body.status;return response(200,{updated:selected.length});}`,
  },
};
