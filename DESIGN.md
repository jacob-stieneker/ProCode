# ProCode interface

## Direction

ProCode is a private developer practice workbench. The interface should make reading a challenge, editing code, running it and understanding the result feel like one continuous task. Compact controls and precise hierarchy take priority over decorative cards, promotional copy or animation.

The established identity remains authoritative: the branching P wordmark, blue ProCode accent, “Practice makes pro” slogan, and seven source-based theme palettes. The app uses local system fonts and SVG icons. It does not fetch fonts or visual assets from external services.

## Layout and typography

- Desktop navigation is 208px wide. A compact icon rail takes over at 1050px; mobile navigation wraps into rows at 540px.
- Difficulty is a segmented group with visible pressed states. Category and exercise controls sit above the workbench.
- The workbench has one outer boundary, a reading pane and a wider execution pane. At 850px it stacks vertically. Editor, actions and output are visually connected.
- Challenge titles use 25px type with 1.25 line height, 23px on mobile. Instruction text uses 13px with 1.75 line height. Metadata is smaller and muted. Code retains its existing monospaced typography.
- Quizzes use the same spacing, type and surface hierarchy. Setup and history are separated by rules; active questions retain a contained surface.

## Theme authority

`src/themes.css` is generated from the existing theme sources. Colors, radii and code syntax tokens come from those palettes. `src/workbench.css` supplies shared layout refinements scoped to `.app-shell.workspace-shell`, without hard-coded palette replacements. Keep source provenance and contrast adjustments in `docs/THEMES.md` current when changing palettes.

Light, Dark and Midnight OLED remain separate modes for every preset. Midnight OLED retains true-black canvas/editor surfaces and its existing individually tuned secondary colors.

## Interaction

Focus hides challenge instructions and expands the work area. It changes layout only: editors remain mounted, drafts and undo history remain intact, and output tabs do not change. Focus applies across practice sections for the current session, is absent from quizzes, and resets on page reload.

Palette changes apply immediately to avoid intermediate low-contrast colors. Buttons use a restrained one-pixel press response. Reduced-motion preferences disable transitions. Visible keyboard focus, semantic labels and pressed/selected states are required even when mobile controls show only icons.

Do not add loading text or stop-control flicker to execution. Console remains the default output tab. Run and Finish must preserve the current tab. Preserve readable errors and keyboard scrolling in console/reference blocks.

## Content rules

Keep interface text concise and functional. Preserve the slogan as the intentional branding exception. Avoid emoji, em dashes, decorative numbering, marketing headings and unnecessary explanatory cards.

## Verification

`tests/workbench.spec.ts` covers Focus continuity, all practice sections, keyboard operation, responsive widths and reduced motion. Existing appearance checks cover all 21 palette/mode combinations, syntax colors, OLED surfaces and accessible dialogs. Run relevant editor, output, practice and quiz flows after shared UI changes. Visual inspection should include desktop/mobile, alternate palettes, populated output and multi-file practice.
