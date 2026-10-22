import { fullstackExpansionSolutions } from './fullstack-expansion-solutions';
import { fullstackExercises } from '../../src/app/core/fullstack/catalog';
import type { ProjectFiles } from '../../src/app/core/fullstack/model';
const apiBase = `
const result=(status,body)=>({status,body});
const invalid=()=>result(400,{error:'Invalid input'});
const missing=()=>result(404,{error:'Not found'});
const valid=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
`;
const backend: Record<string, string> = {
  'fs-tasks':
    apiBase +
    `
export function handleRequest({method,path,body},db){
 if(path==='/tasks'&&method==='GET')return result(200,{items:db.tasks});
 if(path==='/tasks'&&method==='POST'){
  if(!valid(body?.title,80))return invalid();
  const item={id:db.nextId++,title:body.title.trim(),done:false};db.tasks.push(item);return result(201,{item});
 }
 const match=path.match(/^\\/tasks\\/(\\d+)$/);
 if(match){const i=db.tasks.findIndex(t=>t.id===Number(match[1]));if(i<0)return missing();
  if(method==='PATCH'){if(typeof body?.done!=='boolean')return invalid();db.tasks[i].done=body.done;return result(200,{item:db.tasks[i]});}
  if(method==='DELETE'){db.tasks.splice(i,1);return result(200,{deleted:true});}
 }
 return missing();
}`,
  'fs-guestbook':
    apiBase +
    `
export function handleRequest({method,path,body},db){
 if(path==='/entries'&&method==='GET')return result(200,{items:db.entries});
 if(path==='/entries'&&method==='POST'){
  if(!valid(body?.name,40)||!valid(body?.message,200))return invalid();
  const item={id:db.nextId++,name:body.name.trim(),message:body.message.trim()};db.entries.push(item);return result(201,{item});
 }return missing();
}`,
  'fs-tickets':
    apiBase +
    `
export function handleRequest({method,path,body},db){
 const url=new URL(path,'https://practice.invalid');
 if(url.pathname==='/tickets'&&method==='GET'){
  const status=url.searchParams.get('status')||'all';if(!['all','open','resolved'].includes(status))return invalid();
  return result(200,{items:db.tickets.filter(t=>status==='all'||t.status===status)});
 }
 if(path==='/tickets'&&method==='POST'){
  if(!valid(body?.subject,100))return invalid();const item={id:db.nextId++,subject:body.subject.trim(),status:'open'};db.tickets.push(item);return result(201,{item});
 }
 const match=path.match(/^\\/tickets\\/(\\d+)$/);
 if(match&&method==='PATCH'){
  const item=db.tickets.find(t=>t.id===Number(match[1]));if(!item)return missing();if(!['open','resolved'].includes(body?.status))return invalid();item.status=body.status;return result(200,{item});
 }return missing();
}`,
  'fs-conflicts':
    apiBase +
    `
export function handleRequest({method,path,body},db){
 if(path!=='/document')return missing();
 if(method==='GET')return result(200,{document:db.document});
 if(method==='PATCH'){
  if(!valid(body?.title,80)||!Number.isInteger(body?.version))return invalid();
  if(body.version!==db.document.version)return result(409,{error:'Conflict',document:db.document});
  db.document={...db.document,title:body.title.trim(),version:db.document.version+1};return result(200,{document:db.document});
 }return missing();
}`,
};
function orders(idempotent: boolean) {
  return (
    apiBase +
    `
export function handleRequest({method,path,body},db){
 if(path==='/products'&&method==='GET')return result(200,{items:db.products});
 if(path==='/orders'&&method==='POST'){
  const product=db.products.find(p=>p.id===body?.productId);
  if(!product||!Number.isInteger(body?.quantity)||body.quantity<=0${idempotent ? '||!valid(body?.key,80)' : ''})return invalid();
  ${
    idempotent
      ? `if(Object.hasOwn(db.requests,body.key)){
    const previous=db.requests[body.key];
    if(previous.productId!==body.productId||previous.quantity!==body.quantity)return result(409,{error:'Key reused'});
    return result(200,{order:previous.order});
  }`
      : ''
  }
  if(product.stock<body.quantity)return result(409,{error:'Insufficient stock'});
  const order={id:db.nextId++,productId:product.id,quantity:body.quantity,totalCents:product.priceCents*body.quantity};
  product.stock-=body.quantity;db.orders.push(order);
  ${idempotent ? `Object.defineProperty(db.requests,body.key,{value:{productId:body.productId,quantity:body.quantity,order},enumerable:true,writable:true,configurable:true});` : ''}
  return result(201,{order});
 }return missing();
}`
  );
}
backend['fs-checkout'] = orders(false);
backend['fs-orders'] = orders(true);
const clientBase = `
const el=id=>document.querySelector('[data-testid="'+id+'"]');
const text=(id,value)=>el(id).textContent=String(value);
const node=(tag,id,value)=>{const e=document.createElement(tag);e.dataset.testid=id;if(value!==undefined)e.textContent=value;return e;};
const button=(id,label,handler)=>{const b=node('button',id,label);b.onclick=handler;return b;};
`;
const clients: Record<string, string> = {
  'fs-tasks':
    clientBase +
    `
export async function mount(api){
 async function load(){const r=await api.request('GET','/tasks');if(!r.ok)throw Error();el('list').replaceChildren();for(const t of r.body.items){
  const row=node('li','task-row');row.append(node('span','title-'+t.id,t.title),node('span','done-'+t.id,t.done?'Done':'Open'),button('toggle-'+t.id,'Toggle',()=>write('PATCH','/tasks/'+t.id,{done:!t.done})),button('delete-'+t.id,'Delete',()=>write('DELETE','/tasks/'+t.id)));el('list').append(row);
 }}
 async function write(method,path,body){try{const r=await api.request(method,path,body);if(!r.ok)throw Error();await load();text('status','Saved');return true;}catch{text('status','Error');return false;}}
 el('add').onclick=async()=>{if(await write('POST','/tasks',{title:el('title').value}))el('title').value='';};
 el('reload').onclick=async()=>{try{await load();text('status','Ready');}catch{text('status','Error');}};
 await load();text('status','Ready');
}`,
  'fs-guestbook':
    clientBase +
    `
export async function mount(api){
 async function load(){const r=await api.request('GET','/entries');if(!r.ok)throw Error();el('list').replaceChildren();for(const t of r.body.items){const row=node('article','entry-row');row.append(node('h3','name-'+t.id,t.name),node('p','message-'+t.id,t.message));el('list').append(row);}}
 el('submit').onclick=async()=>{try{const r=await api.request('POST','/entries',{name:el('name').value,message:el('message').value});if(!r.ok)throw Error();await load();el('name').value='';el('message').value='';text('status','Saved');}catch{text('status','Error');}};
 el('reload').onclick=async()=>{try{await load();text('status','Ready');}catch{text('status','Error');}};await load();text('status','Ready');
}`,
  'fs-tickets':
    clientBase +
    `
export async function mount(api){
 async function load(){const r=await api.request('GET','/tickets?status='+el('filter').value);if(!r.ok)throw Error();el('list').replaceChildren();for(const t of r.body.items){const row=node('li','ticket-row');row.append(node('span','subject-'+t.id,t.subject),node('span','state-'+t.id,t.status),button('resolve-'+t.id,'Resolve',async()=>{try{const r=await api.request('PATCH','/tickets/'+t.id,{status:'resolved'});if(!r.ok)throw Error();await load();text('status','Saved');}catch{text('status','Error');}}));el('list').append(row);}}
 async function refresh(){try{await load();text('status','Ready');}catch{text('status','Error');}}
 el('create').onclick=async()=>{try{const r=await api.request('POST','/tickets',{subject:el('subject').value});if(!r.ok)throw Error();await load();el('subject').value='';text('status','Saved');}catch{text('status','Error');}};
 el('reload').onclick=refresh;el('filter').onchange=refresh;await refresh();
}`,
  'fs-conflicts':
    clientBase +
    `
export async function mount(api){
 let version=0;
 async function load(){const r=await api.request('GET','/document');if(!r.ok)throw Error();el('title').value=r.body.document.title;version=r.body.document.version;text('version',version);text('status','Ready');}
 el('save').onclick=async()=>{try{const r=await api.request('PATCH','/document',{title:el('title').value,version});if(r.status===409){version=r.body.document.version;text('version',version);text('status','Conflict');return;}if(!r.ok)throw Error();version=r.body.document.version;el('title').value=r.body.document.title;text('version',version);text('status','Saved');}catch{text('status','Error');}};
 el('external-edit').onclick=async()=>{try{const r=await api.request('GET','/document');const saved=await api.request('PATCH','/document',{title:'Edited elsewhere',version:r.body.document.version});if(!saved.ok)throw Error();}catch{text('status','Error');}};
 el('reload').onclick=async()=>{try{await load();}catch{text('status','Error');}};await load();
}`,
};
function checkoutClient(idempotent: boolean) {
  return (
    clientBase +
    `
export async function mount(api){
 let pending=null,busy=false,counter=0;
 async function load(){const r=await api.request('GET','/products');if(!r.ok)throw Error();const p=r.body.items.find(p=>p.id===1);text('name',p.name);text('stock',p.stock);}
 el('checkout').onclick=async()=>{
  if(busy)return;busy=true;el('checkout').disabled=true;
  try{const quantity=Number(el('quantity').value);
   ${idempotent ? `if(!pending||pending.quantity!==quantity)pending={productId:1,quantity,key:'request-'+(++counter)};` : ''}
   const r=await api.request('POST','/orders',${idempotent ? 'pending' : '{productId:1,quantity}'});
   if(!r.ok)throw Error();text('total',r.body.order.totalCents);${idempotent ? "text('order-id',r.body.order.id);pending=null;" : ''}await load();text('status','Saved');
  }catch{text('status','Error');}finally{busy=false;el('checkout').disabled=false;}
 };
 el('reload').onclick=async()=>{try{await load();text('status','Ready');}catch{text('status','Error');}};await load();text('status','Ready');
}`
  );
}
clients['fs-checkout'] = checkoutClient(false);
clients['fs-orders'] = checkoutClient(true);
const css = `* { box-sizing: border-box; } body { font: 16px/1.5 system-ui; margin: 16px; background: #fff; color: #172033; } main { max-width: 800px; margin: auto; } input,textarea,select,button { font: inherit; padding: 8px; margin: 4px 0; max-width: 100%; min-height: 40px; } input,textarea,select { display: block; width: 100%; } li,article { overflow-wrap: anywhere; padding: 12px; border-bottom: 1px solid #aaa; } li span,li button { margin-right: 8px; } h1 { font-size: 24px; }`;
export const fullstackSolutions: Record<string, ProjectFiles> = Object.fromEntries(
  fullstackExercises.map((e) => [
    e.id,
    {
      ...e.starter,
      'index.html': e.starter['index.html']
        .replaceAll('h2>', 'h1>')
        .replace(
          /<(input|textarea|select) data-testid="([^"]+)"/g,
          '<$1 aria-label="$2" data-testid="$2"',
        ),
      'styles.css': css,
      'app.ts': clients[e.id],
      'api.js': backend[e.id],
    },
  ]),
);

Object.assign(fullstackSolutions, fullstackExpansionSolutions);
