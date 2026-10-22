import { angularExercises } from '../../src/app/core/angular/catalog';
const starter = (id: string) => angularExercises.find((e) => e.id === id)!.starter;
const edit =
  'this.editing.set(contact.id);this.name.set(contact.name);this.email.set(contact.email);';
const cancel = "this.editing.set(null);this.name.set('');this.email.set('');";
function apiSolution(senior: boolean) {
  return starter(senior ? 'ng-crud-conflicts' : 'ng-crud-api')
    .replace(
      '/* Copy the selected contact into the form. */',
      edit + 'this.revision=contact.version;',
    )
    .replace('/* Clear the form and leave edit mode. */', cancel)
    .replace(
      '/* Subscribe to create/update, handle success and failure, then release busy state. */',
      `
 if(this.busy() || !this.valid())return;
 const id=this.editing(),data={name:this.name().trim(),email:this.email().trim()};
 this.busy.set(true);this.status.set('Loading');
 const request=id===null?this.api.create(data):this.api.update(id,data${senior ? ',this.revision' : ''});
 request.subscribe({next:(record:any)=>{this.contacts.update(records=>id===null?[...records,record]:records.map(c=>c.id===id?record:c));this.cancel();this.busy.set(false);this.status.set('Ready');},error:(error:any)=>{this.busy.set(false);this.status.set(${senior ? "error.code===409?'Conflict':'Error'" : "'Error'"});}});
 `,
    )
    .replace(
      `/* Delete through the API${senior ? ', with optimistic removal and rollback' : ''}. */`,
      `
 if(this.busy())return;
 const before=this.contacts();
 this.busy.set(true);this.status.set('Loading');
 ${senior ? 'this.contacts.set(before.filter(c=>c.id!==contact.id));' : ''}
 this.api.delete(contact.id${senior ? ',contact.version' : ''}).subscribe({next:()=>{this.contacts.update(records=>records.filter(c=>c.id!==contact.id));if(this.editing()===contact.id)this.cancel();this.busy.set(false);this.status.set('Ready');},error:(error:any)=>{${senior ? 'this.contacts.set(before);' : ''}this.busy.set(false);this.status.set(${senior ? "error.code===409?'Conflict':'Error'" : "'Error'"});}});
 `,
    );
}
export const angularCrudSolutions: Record<string, string> = {
  'ng-crud-local': starter('ng-crud-local')
    .replace('/* Copy the selected contact into the form. */', edit)
    .replace('/* Clear the form and leave edit mode. */', cancel)
    .replace(
      '/* Create or update by ID, then clear the form. */',
      `if(!this.valid())return;const id=this.editing(),data={name:this.name().trim(),email:this.email().trim()};this.contacts.update(records=>id===null?[...records,{id:this.nextId++,...data}]:records.map(c=>c.id===id?{...c,...data}:c));this.cancel();`,
    )
    .replace(
      '/* Delete only this contact and cancel an edit of it. */',
      'this.contacts.update(records=>records.filter(c=>c.id!==contact.id));if(this.editing()===contact.id)this.cancel();',
    ),
  'ng-crud-api': apiSolution(false),
  'ng-crud-conflicts': apiSolution(true),
};
