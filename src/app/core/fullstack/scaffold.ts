// Framework plumbing only. Exercise-specific behavior belongs to the learner.
export const angularClientStarter = `import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticeApi, projectTemplate } from '@procode/fullstack';

@Component({
  selector: 'practice-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: projectTemplate
})
export class AppComponent {
  readonly api = inject(PracticeApi);

  ngOnInit() {
    // Load the initial data. Add component state and event handlers.
    // Bind them in index.html using Angular's template syntax.
    // this.api.request(method, path, body?) returns { status, ok, body }.
  }
}
`;

const routes: Record<string, [string, string][]> = {
  'fs-catalog': [['get', '/catalog']],
  'fs-pagination': [['get', '/articles']],
  'fs-bulk': [
    ['get', '/tickets'],
    ['patch', '/tickets/bulk'],
  ],
  'fs-tasks': [
    ['get', '/tasks'],
    ['post', '/tasks'],
    ['patch', '/tasks/:id'],
    ['delete', '/tasks/:id'],
  ],
  'fs-guestbook': [
    ['get', '/entries'],
    ['post', '/entries'],
  ],
  'fs-tickets': [
    ['get', '/tickets'],
    ['post', '/tickets'],
    ['patch', '/tickets/:id'],
  ],
  'fs-checkout': [
    ['get', '/products'],
    ['post', '/orders'],
  ],
  'fs-conflicts': [
    ['get', '/document'],
    ['patch', '/document'],
  ],
  'fs-orders': [
    ['get', '/products'],
    ['post', '/orders'],
  ],
};

export function apiStarter(id: string): string {
  return `import { createRouter } from '@procode/server';

const router = createRouter();

${routes[id]
  .map(
    ([method, path]) => `router.${method}('${path}', async (request, db) => {
  // Implement the API contract. Validate input before changing db.
  // request.body, request.params and request.query are available.
  return { status: 501, body: { error: 'Not implemented' } };
});`,
  )
  .join('\n\n')}

// The router dispatches methods/paths and returns 404 for unmatched routes.
export const handleRequest = router.handle;
`;
}
