// Parse source only. Never evaluate learner code during structural inspection.
export function analyzeJavaScript(ts, source, entry) {
  const root = ts.createSourceFile(
    'solution.js',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  if (root.parseDiagnostics.length) {
    const error = root.parseDiagnostics[0],
      location = root.getLineAndCharacterOfPosition(error.start ?? 0);
    throw Error(
      `solution.js:${location.line + 1}:${location.character + 1} ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`,
    );
  }
  const metrics = {
    shortNames: [],
    branchDepth: 0,
    inlineNumbers: [],
    inlineStrings: [],
    helpers: [],
    entryStatements: 0,
  };
  const functions = new Map();
  const binding = (name) => {
    if (!name) return;
    if (ts.isIdentifier(name)) {
      if (name.text.replaceAll('_', '').length < 3) metrics.shortNames.push(name.text);
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
      for (const element of name.elements) if (ts.isBindingElement(element)) binding(element.name);
  };
  const functionName = (node) =>
    node.name?.text ??
    (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)
      ? node.parent.name.text
      : undefined);
  function visit(node, inside = false, depth = 0) {
    if (ts.isFunctionLike(node) && node.body) {
      const name = functionName(node);
      if (name) {
        functions.set(name, node);
        if (name.replaceAll('_', '').length < 3) metrics.shortNames.push(name);
      }
      for (const param of node.parameters) binding(param.name);
      for (const param of node.parameters) if (param.initializer) visit(param.initializer, true, 0);
      visit(node.body, true, 0);
      return;
    }
    if (ts.isVariableDeclaration(node)) binding(node.name);
    if (inside && ts.isNumericLiteral(node)) metrics.inlineNumbers.push(Number(node.text));
    if (inside && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)))
      metrics.inlineStrings.push(node.text);
    if (inside && ts.isPropertyAssignment(node) && ts.isIdentifier(node.name))
      metrics.inlineStrings.push(node.name.text);
    if (
      inside &&
      (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node))
    ) {
      metrics.branchDepth = Math.max(metrics.branchDepth, depth + 1);
      if (ts.isIfStatement(node)) {
        visit(node.expression, true, depth + 1);
        visit(node.thenStatement, true, depth + 1);
        if (node.elseStatement)
          visit(node.elseStatement, true, ts.isIfStatement(node.elseStatement) ? depth : depth + 1);
      } else ts.forEachChild(node, (child) => visit(child, true, depth + 1));
      return;
    }
    ts.forEachChild(node, (child) => visit(child, inside, depth));
  }
  visit(root);
  function inspect(fn) {
    let statements = 0;
    const calls = [];
    function walk(node) {
      if (node !== fn && ts.isFunctionLike(node)) return;
      if (ts.isStatement(node) && !ts.isBlock(node) && !ts.isFunctionDeclaration(node))
        statements++;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression))
        calls.push(node.expression.text);
      ts.forEachChild(node, walk);
    }
    walk(fn);
    if (!ts.isBlock(fn.body)) statements++;
    return { statements, calls };
  }
  const seen = new Set([entry]),
    queue = [entry];
  while (queue.length) {
    const name = queue.shift(),
      fn = functions.get(name);
    if (!fn) continue;
    const info = inspect(fn);
    if (name === entry) metrics.entryStatements = info.statements;
    for (const call of info.calls)
      if (functions.has(call) && !seen.has(call)) {
        seen.add(call);
        queue.push(call);
        metrics.helpers.push(call);
      }
  }
  metrics.shortNames = [...new Set(metrics.shortNames)];
  return metrics;
}
