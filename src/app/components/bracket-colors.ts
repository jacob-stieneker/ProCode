import { syntaxTree } from '@codemirror/language';
import { EditorState, Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

const colors = [0, 1, 2].map((depth) => Decoration.mark({ class: `cm-bracket-depth-${depth}` }));
const closing: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

// Only parser-recognized delimiters participate. Brackets in comments, string
// content, and regex literals cannot change the nesting of surrounding code.
export function bracketDecorations(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const stack: { bracket: string; depth: number }[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      let bracket = node.name;
      let from = node.from;
      if (bracket === 'InterpolationStart') {
        bracket = '{';
        from = node.to - 1;
      }
      if (bracket === 'InterpolationEnd') bracket = '}';
      if (!['(', ')', '[', ']', '{', '}'].includes(bracket)) return;
      if (node.to - from !== 1) return;
      let depth = stack.length;
      if ('([{'.includes(bracket)) {
        stack.push({ bracket, depth });
      } else {
        const opener = stack[stack.length - 1];
        if (opener?.bracket !== closing[bracket]) return;
        depth = stack.pop()!.depth;
      }
      ranges.push(colors[depth % colors.length].range(from, node.to));
    },
  });
  return Decoration.set(ranges, true);
}

export const bracketColors = [
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = bracketDecorations(view.state);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || syntaxTree(update.startState) !== syntaxTree(update.state))
          this.decorations = bracketDecorations(update.state);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  ),
  EditorView.baseTheme({
    '.cm-bracket-depth-0, .cm-bracket-depth-0 *': { color: 'var(--syntax-function) !important' },
    '.cm-bracket-depth-1, .cm-bracket-depth-1 *': { color: 'var(--syntax-keyword) !important' },
    '.cm-bracket-depth-2, .cm-bracket-depth-2 *': { color: 'var(--syntax-string) !important' },
    '& .cm-matchingBracket': {
      backgroundColor: 'var(--selection)',
      outline: '1px solid var(--muted)',
      fontWeight: 'bold',
    },
    '& .cm-nonmatchingBracket': {
      textDecoration: 'underline wavy var(--error)',
      textUnderlineOffset: '3px',
    },
  }),
];
