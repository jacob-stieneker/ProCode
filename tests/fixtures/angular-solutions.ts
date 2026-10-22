import { angularCrudSolutions } from './angular-crud-solutions';
import { angularInterviewSolutions } from './angular-interview-solutions';
import { angularExercises } from '../../src/app/core/angular/catalog';
const starter = (id: string) => angularExercises.find((e) => e.id === id)!.starter;
export const angularSolutions: Record<string, string> = {
  ...angularInterviewSolutions,
  ...angularCrudSolutions,
  'ng-counter': starter('ng-counter')
    .replace('data-testid="count">0', 'data-testid="count">{{count()}}')
    .replace('data-testid="decrease"', 'data-testid="decrease" [disabled]="count() === 0"')
    .replace('/* Update the count. */', 'this.count.update(n=>n+1);')
    .replace('/* Keep it nonnegative. */', 'this.count.update(n=>Math.max(0,n-1));')
    .replace('/* Restore zero. */', 'this.count.set(0);'),
  'ng-filter': starter('ng-filter')
    .replace('course of courses;', 'course of filtered();')
    .replace(
      '<p data-testid="empty">No courses</p>',
      '@if(filtered().length === 0){<p data-testid="empty">No courses</p>}',
    )
    .replace(
      '// Derive the filtered list and update the template.',
      'filtered = computed(()=>this.courses.filter(course=>course.toLowerCase().includes(this.query().trim().toLowerCase())));',
    ),
  'ng-greeting': starter('ng-greeting')
    .replace(
      'data-testid="name"',
      'data-testid="name" [ngModel]="name()" (ngModelChange)="name.set($event)"',
    )
    .replace('Hello, developer!', "Hello, {{name().trim() || 'developer'}}!")
    .replace('/* Clear the form state. */', "this.name.set('');"),
  'ng-validation': starter('ng-validation')
    .replace(
      "email:new FormControl(''), password:new FormControl('')",
      "email:new FormControl('',[Validators.required,Validators.email]), password:new FormControl('',[Validators.required,Validators.minLength(8)])",
    )
    .replace('data-testid="submit"', 'data-testid="submit" [disabled]="form.invalid"')
    .replace("this.status.set('Registered');", "if(this.form.valid)this.status.set('Registered');"),
  'ng-components': starter('ng-components')
    .replace('this.value++;', 'this.changed.emit(this.value + 1);')
    .replace(
      '<quantity-control>',
      '<quantity-control [value]="quantity()" (changed)="quantity.set($event)">',
    ),
  'ng-service': starter('ng-service').replaceAll('providers:[CartStore],', ''),
  'ng-search': `import {Component,inject,signal,DestroyRef} from '@angular/core';
import {PracticeSearchApi} from '@procode/practice';
import {Subject,of,switchMap,catchError,tap} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
@Component({selector:'practice-root',standalone:true,template:\`
<h1>Course search</h1><label>Search <input data-testid="query" (input)="queries.next($any($event.target).value)"></label>
<p data-testid="status">{{status()}}</p><ul>@for(course of results();track course){<li data-testid="result">{{course}}</li>}</ul>\`})
export class AppComponent {
 api=inject(PracticeSearchApi);queries=new Subject<string>();results=signal<string[]>([]);status=signal('Ready');
 constructor(){this.queries.pipe(switchMap(raw=>{
   const query=raw.trim();if(!query){this.status.set('Ready');return of([]);}
   this.status.set('Loading');
   return this.api.search(query).pipe(tap(()=>this.status.set('Ready')),catchError(()=>{this.status.set('Error');return of([]);}));
 }),takeUntilDestroyed()).subscribe(items=>this.results.set(items));}
}`,
  'ng-pagination': starter('ng-pagination')
    .replace('item of items;', 'item of visible();')
    .replace('data-testid="previous"', 'data-testid="previous" [disabled]="page() === 1"')
    .replace('data-testid="next"', 'data-testid="next" [disabled]="page() >= pages()"')
    .replace(
      'filter(value:string){ this.query.set(value); }',
      'filtered=computed(()=>this.items.filter(item=>item.toLowerCase().includes(this.query().trim().toLowerCase())));\n pages=computed(()=>Math.max(1,Math.ceil(this.filtered().length/2)));\n visible=computed(()=>this.filtered().slice((this.page()-1)*2,this.page()*2));\n filter(value:string){this.query.set(value);this.page.set(1);}',
    )
    .replace('this.page.update(n=>n-1);', 'this.page.update(n=>Math.max(1,n-1));')
    .replace('this.page.update(n=>n+1);', 'this.page.update(n=>Math.min(this.pages(),n+1));'),
  'ng-cross-validation': starter('ng-cross-validation')
    .replace('data-testid="book"', 'data-testid="book" [disabled]="form.invalid"')
    .replace(
      'data-testid="status">Ready',
      'data-testid="status">{{form.valid ? "Ready" : "Invalid interval"}}',
    )
    .replace(
      'end:new FormControl<number|null>(null)});',
      'end:new FormControl<number|null>(null)}, {validators: (control:AbstractControl)=>{const {start,end}=control.value;return Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end<=23&&end>start?null:{interval:true};}});',
    )
    .replace('book(){const', 'book(){if(this.form.invalid)return;const'),
};
