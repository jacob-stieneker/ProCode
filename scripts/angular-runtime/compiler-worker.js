importScripts('./typescript.js');
self.onmessage = ({ data }) => {
  try {
    const ts = self.ts;
    const fileName = ['app.js', 'app.ts', 'api.js'].includes(data.fileName)
      ? data.fileName
      : 'component.ts';
    if (typeof data.source !== 'string' || data.source.length > 50000)
      throw Error(`Keep ${fileName} under 50,000 characters.`);
    // Bound ordinary learner loops and recursive functions, without evaluating code here.
    const guard = () =>
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createIdentifier('__procodeCheckpoint'),
          undefined,
          [],
        ),
      );
    const budget = (context) => {
      const visit = (node, parent) => {
        let updated = ts.visitEachChild(node, (child) => visit(child, node), context);
        if (
          ts.isBlock(updated) &&
          parent &&
          (ts.isFunctionLike(parent) ||
            (ts.isIterationStatement(parent, false) && parent.statement === node))
        ) {
          updated = ts.factory.updateBlock(updated, [guard(), ...updated.statements]);
        } else if (parent && ts.isIterationStatement(parent, false) && parent.statement === node) {
          updated = ts.factory.createBlock([guard(), updated], true);
        } else if (ts.isArrowFunction(updated) && !ts.isBlock(updated.body)) {
          updated = ts.factory.updateArrowFunction(
            updated,
            updated.modifiers,
            updated.typeParameters,
            updated.parameters,
            updated.type,
            updated.equalsGreaterThanToken,
            ts.factory.createBlock([guard(), ts.factory.createReturnStatement(updated.body)], true),
          );
        }
        return updated;
      };
      return (file) => visit(file, undefined);
    };
    const result = ts.transpileModule(data.source, {
      fileName,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        sourceMap: false,
      },
      transformers: { before: [budget] },
    });
    const errors = (result.diagnostics ?? [])
      .filter((d) => d.category === ts.DiagnosticCategory.Error)
      .map((d) => {
        const pos =
          d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
        return `${fileName}${pos ? `:${pos.line + 1}:${pos.character + 1}` : ''} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
      });
    self.postMessage(errors.length ? { error: errors.join('\n') } : { code: result.outputText });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
