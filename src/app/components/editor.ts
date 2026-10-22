import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  keymap,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  HighlightStyle,
  syntaxHighlighting,
  indentOnInput,
} from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketColors } from './bracket-colors';
import { tags } from '@lezer/highlight';
import { Language } from '../core/exercises';
@Component({
  selector: 'pc-editor',
  standalone: true,
  template: '<div #host class="editor-host"></div>',
  styles: [
    ':host {display:block;min-width:0;height:100%}.editor-host {height:100%;min-height:310px}',
  ],
})
export class Editor implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host') host!: ElementRef<HTMLElement>;
  @Input() code = '';
  @Input() language: Language | 'html' | 'css' | 'typescript' = 'javascript';
  @Input() disabled = false;
  @Input() contextKey = '';
  @Input() dark = true;
  @Output() codeChange = new EventEmitter<string>();
  @Output() runCode = new EventEmitter<void>();
  private view?: EditorView;
  private languageConfig = new Compartment();
  private editConfig = new Compartment();
  private updating = false;
  private themeConfig = new Compartment();
  private languageRequest = 0;
  ngAfterViewInit() {
    this.view = new EditorView({
      parent: this.host.nativeElement,
      state: this.createState(),
    });
    this.view.scrollDOM.tabIndex = 0;
    this.view.scrollDOM.setAttribute('aria-label', 'Code editor scroll area');
    void this.configureLanguage();
  }
  private async configureLanguage() {
    const request = ++this.languageRequest;
    const support =
      this.language === 'html'
        ? (await import('@codemirror/lang-html')).html()
        : this.language === 'css'
          ? (await import('@codemirror/lang-css')).css()
          : this.language === 'python'
            ? (await import('@codemirror/lang-python')).python()
            : javascript({ typescript: this.language === 'typescript' });
    if (request === this.languageRequest && this.view)
      this.view.dispatch({ effects: this.languageConfig.reconfigure(support) });
  }
  private createState() {
    return EditorState.create({
      doc: this.code,
      extensions: [
        lineNumbers(),
        this.themeConfig.of(EditorView.darkTheme.of(this.dark)),
        EditorView.lineWrapping,
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        bracketMatching(),
        closeBrackets(),
        bracketColors,
        indentOnInput(),
        syntaxHighlighting(
          HighlightStyle.define([
            { tag: tags.keyword, color: 'var(--syntax-keyword)' },
            { tag: [tags.controlKeyword, tags.operatorKeyword], color: 'var(--syntax-control)' },
            { tag: tags.name, color: 'var(--syntax-variable)' },
            { tag: tags.definition(tags.variableName), color: 'var(--syntax-definition)' },
            { tag: tags.propertyName, color: 'var(--syntax-property)' },
            { tag: tags.tagName, color: 'var(--syntax-keyword)' },
            { tag: tags.attributeName, color: 'var(--syntax-property)' },
            {
              tag: [
                tags.function(tags.variableName),
                tags.function(tags.propertyName),
                tags.function(tags.definition(tags.variableName)),
                tags.function(tags.definition(tags.propertyName)),
              ],
              color: 'var(--syntax-function)',
            },
            {
              tag: [tags.typeName, tags.className, tags.namespace, tags.standard(tags.name)],
              color: 'var(--syntax-type)',
            },
            { tag: [tags.number, tags.constant(tags.name)], color: 'var(--syntax-number)' },
            { tag: [tags.bool, tags.null, tags.atom, tags.self], color: 'var(--syntax-boolean)' },
            { tag: [tags.operator, tags.punctuation], color: 'var(--syntax-operator)' },
            {
              tag: [tags.meta, tags.comment],
              color: 'var(--syntax-comment)',
              fontStyle: 'var(--syntax-comment-style)',
            },
            {
              tag: [tags.string, tags.character, tags.regexp, tags.escape],
              color: 'var(--syntax-string)',
            },
            { tag: tags.invalid, color: 'var(--error)' },
          ]),
        ),
        this.languageConfig.of(
          this.language === 'javascript' || this.language === 'typescript'
            ? javascript({ typescript: this.language === 'typescript' })
            : [],
        ),
        this.editConfig.of(EditorState.readOnly.of(this.disabled)),
        EditorView.contentAttributes.of({
          'aria-label': 'Solution code',
          spellcheck: 'false',
          autocapitalize: 'off',
          autocorrect: 'off',
          'aria-describedby': 'editor-keyboard-help',
        }),
        keymap.of([
          {
            key: 'Escape',
            run: (view) => {
              view.contentDOM.blur();
              const next = Array.from(
                document.querySelectorAll<HTMLButtonElement>('.run-button'),
              ).find((button) => button.getClientRects().length > 0);
              next?.focus();
              return true;
            },
          },
          {
            key: 'Mod-Enter',
            run: () => {
              this.runCode.emit();
              return true;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.updating)
            this.codeChange.emit(update.state.doc.toString());
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            backgroundColor: 'var(--inset)',
            color: 'var(--editor-text)',
            fontSize: '13px',
          },
          '.cm-scroller': {
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
            lineHeight: '1.9',
            overflow: 'auto',
          },
          '.cm-content': { padding: '23px 0', caretColor: 'var(--editor-cursor)' },
          '.cm-line': { padding: '0 24px 0 12px' },
          '.cm-gutters': {
            backgroundColor: 'var(--inset)',
            color: 'var(--muted)',
            border: 'none',
            padding: '0 8px 0 12px',
          },
          '.cm-activeLineGutter': { backgroundColor: 'var(--editor-line)', color: 'var(--text)' },
          '.cm-activeLine': { backgroundColor: 'var(--editor-line)' },
          '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
            backgroundColor: 'var(--selection) !important',
          },
          '&.cm-focused': { outline: 'none' },
          '.cm-cursor': { borderLeftColor: 'var(--editor-cursor)' },
        }),
      ],
    });
  }
  ngOnChanges(changes: Record<string, unknown>) {
    if (!this.view) return;
    if (changes['dark'])
      this.view.dispatch({
        effects: this.themeConfig.reconfigure(EditorView.darkTheme.of(this.dark)),
      });
    if (changes['contextKey']) {
      this.view.setState(this.createState());
      void this.configureLanguage();
      return;
    }
    if (this.view.state.doc.toString() !== this.code) {
      this.updating = true;
      this.view.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: this.code },
      });
      this.updating = false;
    }
    if (changes['language']) void this.configureLanguage();
    this.view.dispatch({
      effects: this.editConfig.reconfigure(EditorState.readOnly.of(this.disabled)),
    });
  }
  ngOnDestroy() {
    this.languageRequest++;
    this.view?.destroy();
    this.view = undefined;
  }
}
