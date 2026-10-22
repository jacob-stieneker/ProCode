import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { bracketDecorations } from './bracket-colors';

function marks(code: string, language = javascript()) {
  const state = EditorState.create({ doc: code, extensions: [language] });
  const results: { text: string; color: string }[] = [];
  bracketDecorations(state).between(0, code.length, (from, to, mark) => {
    results.push({ text: code.slice(from, to), color: mark.spec.class });
  });
  return results;
}
describe('Syntax-aware bracket colors', () => {
  it('gives both ends the same color and adjacent nesting different colors', () => {
    const values = marks('({items: [1]})');
    expect(values.map((v) => v.text).join('')).toBe('({[]})');
    expect(values.map((v) => v.color)).toEqual(
      [0, 1, 2, 2, 1, 0].map((n) => `cm-bracket-depth-${n}`),
    );
  });
  it('ignores JavaScript strings, comments, and regular expressions', () => {
    const values = marks('function f() { const x = "["; /* } */ const re = /[(){}]/; return []; }');
    expect(values.map((v) => v.text).join('')).toBe('(){[]}');
    expect(values.at(-1)?.color).toBe('cm-bracket-depth-0');
  });
  it('ignores Python string and comment content while coloring f-string expressions', () => {
    const values = marks('x = ["{", f"text {fn(1)}"] # }', python());
    expect(values.map((v) => v.text).join('')).toBe('[{()}]');
    expect(values.at(-1)?.color).toBe('cm-bracket-depth-0');
  });
  it('colors template interpolation and nested expressions without coloring literal text', () => {
    const values = marks('const x = `[ text ${fn([1])} ]`;');
    expect(values.map((v) => v.text).join('')).toBe('{([])}');
  });
  it('stays usable while brackets are incomplete or mismatched', () => {
    expect(() => marks('function f() { return ([)')).not.toThrow();
    expect(marks('function f() { return ([').length).toBe(5);
  });
});
