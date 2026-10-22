import { Component } from '@angular/core';
@Component({
  selector: 'pc-logo',
  standalone: true,
  template: `<svg viewBox="0 0 25 34" fill="none" aria-hidden="true">
    <path
      d="M5 28V6m0 14h8a7 7 0 0 0 7-7V6"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g fill="currentColor">
      <circle cx="5" cy="4" r="3" />
      <circle cx="20" cy="4" r="3" />
      <circle cx="5" cy="30" r="3" />
    </g>
  </svg>`,
  styles: [
    ':host{display:inline-flex;width:25px;height:34px;flex-shrink:0}svg{width:100%;height:100%}',
  ],
})
export class Logo {}
