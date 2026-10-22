// Only method-check executions are instrumented. Output uses original source.
const COMPARISONS = ['<', '>', '<=', '>=', '==', '===', '!=', '!==', '+'];
const CALLS = ['sort', 'toSorted', 'get', 'setdefault', 'min'];
const isSum = (ts, node) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken;
function assignedSum(ts, node) {
  if (ts.isVariableDeclaration(node) && node.initializer && isSum(ts, node.initializer))
    return node.name;
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    isSum(ts, node.right)
  )
    return node.left;
}
function candidateNames(ts, file) {
  const names = new Set();
  function collect(node) {
    const name = assignedSum(ts, node);
    if (name && ts.isIdentifier(name)) names.add(name.text);
    ts.forEachChild(node, collect);
  }
  collect(file);
  return names;
}
function createContext(ts, source, hook) {
  const file = ts.createSourceFile(
    'solution.js',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  if (file.parseDiagnostics.length) throw Error('Source could not be analyzed.');
  return { ts, file, hook, candidates: candidateNames(ts, file) };
}
function call(context, kind, args) {
  const factory = context.ts.factory;
  return factory.createCallExpression(factory.createIdentifier(context.hook), undefined, [
    factory.createStringLiteral(kind),
    ...args,
  ]);
}
function relaxSide(context, left, right) {
  const candidate = (node) =>
    isSum(context.ts, node) || (context.ts.isIdentifier(node) && context.candidates.has(node.text));
  if (candidate(left)) return ':relax-left';
  return candidate(right) ? ':relax-right' : '';
}
function instrumentBinary(context, original, node) {
  const op = context.ts.tokenToString(node.operatorToken.kind);
  if (!COMPARISONS.includes(op)) return node;
  const side = op === '+' ? '' : relaxSide(context, original.left, original.right);
  return call(context, op + side, [node.left, node.right]);
}
function callArguments(context, node, method) {
  const factory = context.ts.factory;
  return [
    node.expression.expression,
    factory.createStringLiteral(method),
    factory.createArrayLiteralExpression(node.arguments),
  ];
}
function instrumentCall(context, original, node) {
  if (!context.ts.isPropertyAccessExpression(node.expression)) return node;
  const method = node.expression.name.text;
  if (!CALLS.includes(method)) return node;
  const side =
    method === 'min' && original.arguments.length === 2
      ? relaxSide(context, ...original.arguments)
      : '';
  return call(context, 'call' + side, callArguments(context, node, method));
}
function assignmentTarget(ts, original) {
  const parent = original.parent;
  if (!ts.isBinaryExpression(parent) || parent.left !== original) return false;
  return (
    parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
  );
}
function destructuredTarget(ts, original) {
  let ancestor = original;
  while (ts.isArrayLiteralExpression(ancestor.parent) || ts.isSpreadElement(ancestor.parent))
    ancestor = ancestor.parent;
  const parent = ancestor.parent;
  return (
    ts.isBinaryExpression(parent) &&
    parent.left === ancestor &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
  );
}
function preservedReference(ts, original) {
  const parent = original.parent;
  return (
    assignmentTarget(ts, original) ||
    destructuredTarget(ts, original) ||
    ts.isPrefixUnaryExpression(parent) ||
    ts.isPostfixUnaryExpression(parent) ||
    ts.isDeleteExpression(parent) ||
    (ts.isCallExpression(parent) && parent.expression === original)
  );
}
function instrumentRead(context, original, node) {
  if (preservedReference(context.ts, original)) return node;
  const key = context.ts.isElementAccessExpression(node)
    ? node.argumentExpression
    : context.ts.factory.createStringLiteral(node.name.text);
  return call(context, 'read', [node.expression, key]);
}
function visitor(context, transformation) {
  function visit(original) {
    const { ts } = context;
    const node = ts.visitEachChild(original, visit, transformation);
    if (ts.isBinaryExpression(node)) return instrumentBinary(context, original, node);
    if (ts.isCallExpression(node)) return instrumentCall(context, original, node);
    if (ts.isElementAccessExpression(node) || ts.isPropertyAccessExpression(node))
      return instrumentRead(context, original, node);
    return node;
  }
  return (node) => context.ts.visitNode(node, visit);
}
export function instrumentJavaScript(ts, source, hook) {
  const context = createContext(ts, source, hook);
  const transformed = ts.transform(context.file, [
    (transformation) => visitor(context, transformation),
  ]);
  try {
    return ts.createPrinter().printFile(transformed.transformed[0]);
  } finally {
    transformed.dispose();
  }
}
