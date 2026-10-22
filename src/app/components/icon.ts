import { Component, Input } from '@angular/core';
@Component({
  selector: 'pc-icon',
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    @for (path of paths; track $index) {
      <path [attr.d]="path" />
    }
  </svg>`,
  styles: [
    ':host { display:inline-flex; width:20px; height:20px; flex-shrink:0; align-items:center; justify-content:center } svg { width:100%; height:100% }',
  ],
})
export class Icon {
  @Input() name = 'code';
  get paths(): string[] {
    return (
      (
        {
          refactor: ['M4 5h16M4 12h10M4 19h6M17 10l4 4-4 4M21 14h-7'],
          focus: ['M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5'],
          'restore-view': ['M3 8h5V3M21 8h-5V3M16 21v-5h5M8 21v-5H3'],
          palette: [
            'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-1-1 0-3 2-3h2a3 3 0 0 0 3-3 9 9 0 0 0-9-8Z',
            'M7 10h.01M10 6h.01M15 7h.01',
          ],
          sun: [
            'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
            'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1',
          ],
          moon: ['M20 15A8 8 0 0 1 9 4a9 9 0 1 0 11 11Z'],
          midnight: ['M16 3a9 9 0 1 0 5 12A8 8 0 0 1 16 3Z', 'M5 4v4M3 6h4'],
          code: ['m8 7-5 5 5 5', 'm16 7 5 5-5 5', 'm14 4-4 16'],
          grid: ['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
          arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
          chevron: ['m9 5 7 7-7 7'],
          check: ['m5 12 4 4L19 6'],
          play: ['m8 5 11 7-11 7z'],
          reset: ['M3 10a9 9 0 1 1 2 8', 'M3 4v6h6'],
          book: ['M12 5v15', 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z'],
          bulb: ['M9 18h6M9 21h6', 'M8 15a7 7 0 1 1 8 0l-1 3H9z'],
          terminal: ['m5 7 4 4-4 4', 'M12 16h6', 'M3 3h18v18H3z'],
          branch: [
            'M6 3v12a3 3 0 1 0 3 3',
            'M6 12c0-6 12 0 12-8',
            'M18 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
          ],
          layers: ['m12 3 10 5-10 5L2 8z', 'm2 12 10 5 10-5', 'm2 16 10 5 10-5'],
          angular: ['m12 2 9 4-2 13-7 3-7-3L3 6z', 'm7 16 5-11 5 11', 'M9 12h6'],
          flame: ['M12 2c1 6-5 6-5 11a5 5 0 0 0 10 0c0-2-1-4-2-5 0 3-2 3-2 3 1-4 1-6-1-9Z'],
          trophy: [
            'M8 3h8v7a4 4 0 0 1-8 0z',
            'M8 5H3v3a4 4 0 0 0 5 4M16 5h5v3a4 4 0 0 1-5 4',
            'M12 14v7M8 21h8',
          ],
          clock: ['M12 8v5l3 2', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'],
          close: ['m6 6 12 12', 'M6 18 18 6'],
          shield: ['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z', 'm8 12 3 3 5-6'],
          monitor: ['M3 3h18v14H3z', 'M8 21h8M12 17v4'],
          info: ['M12 11v6M12 7h.01', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'],
          download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
        } as Record<string, string[]>
      )[this.name] ?? ['M4 12h16']
    );
  }
}
