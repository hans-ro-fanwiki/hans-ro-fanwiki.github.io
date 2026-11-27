const ts = require('typescript');

function inspect(code, file) {
  const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (ast.parseDiagnostics.length) throw Error('Unparseable HANS source: ' + file);
  const declarations = new Map();
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations)
      if (ts.isIdentifier(declaration.name) && declaration.initializer && !declarations.has(declaration.name.text))
        declarations.set(declaration.name.text, declaration.initializer);
  }
  const seen = new Set();
  function literal(node, depth = 0) {
    if (!node || depth > 16) return undefined;
    if (ts.isParenthesizedExpression(node)) return literal(node.expression, depth + 1);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isIdentifier(node) && node.text === 'undefined') return undefined;
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node)) {
      const value = literal(node.operand, depth + 1);
      if (node.operator === ts.SyntaxKind.VoidKeyword) return undefined;
      if (node.operator === ts.SyntaxKind.MinusToken && typeof value === 'number') return -value;
      if (node.operator === ts.SyntaxKind.ExclamationToken && value !== undefined) return !value;
    }
    if (ts.isIdentifier(node)) {
      if (seen.has(node.text) || !declarations.has(node.text)) return undefined;
      seen.add(node.text);
      const value = literal(declarations.get(node.text), depth + 1);
      seen.delete(node.text);
      return value;
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(value => literal(value, depth + 1));
    if (ts.isObjectLiteralExpression(node)) {
      const output = {};
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name)
            ? prop.name.text : null;
          if (key !== null) {
            const value = literal(prop.initializer, depth + 1);
            if (value !== undefined) output[key] = value;
          }
        } else if (ts.isSpreadAssignment(prop)) {
          const values = literal(prop.expression, depth + 1);
          if (values && typeof values === 'object' && !Array.isArray(values))
            Object.assign(output, values);
        }
      }
      return output;
    }
    return undefined;
  }
  function findLiteral(name) {
    if (!declarations.has(name)) throw Error('Expected HANS declaration missing: ' + name);
    return literal(declarations.get(name));
  }
  function calls(names, first = ts.isNumericLiteral, effectIndex = 3) {
    const output = [];
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
          && names.includes(node.expression.text) && node.arguments[0] && first(node.arguments[0]))
        output.push({op: node.expression.text, args: node.arguments.map(value => literal(value)),
          effectCalls: node.arguments[effectIndex] && ts.isArrayLiteralExpression(node.arguments[effectIndex]) ? node.arguments[effectIndex].elements.map(e =>
            ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.arguments.length===1
              ? {fn:e.expression.text, value:literal(e.arguments[0])} : null) : [],
          offset: node.getStart(ast)});
      ts.forEachChild(node, visit);
    }
    visit(ast);
    return output.sort((left, right) => left.offset - right.offset);
  }
  return {findLiteral, calls, declarations, literal, ast};
}
module.exports = {inspect};
