// Evaluate only constants and the known skill-balance helpers in the audited AST.
const ts = require('typescript');
const { isIdentifier, isVariableDeclaration, isVariableDeclarationList } = ts;

const keyOf = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text : null;
const string = node => node && ts.isStringLiteralLike(node) ? node.text : null;
const prop = (node, key) => node && ts.isObjectLiteralExpression(node)
  ? node.properties.find(p => ts.isPropertyAssignment(p) && keyOf(p.name) === key)?.initializer : undefined;
const scope = node => ts.isSourceFile(node) || ts.isBlock(node) || ts.isFunctionLike(node);

function createReader(ast) {
  const constants = new Map();
  const balances = [];
  function add(node, name, value) {
    let owner = node.parent;
    while (owner && !scope(owner)) owner = owner.parent;
    if (!owner) return;
    if (!constants.has(owner)) constants.set(owner, new Map());
    constants.get(owner).set(name, value);
  }
  function walk(node) {
    if (isVariableDeclaration(node) && isIdentifier(node.name) && isVariableDeclarationList(node.parent))
      add(node, node.name.text, node.parent.flags & ts.NodeFlags.Const ? node.initializer : null);
    if (ts.isParameter(node) && isIdentifier(node.name)) add(node, node.name.text, null);
    if (ts.isObjectLiteralExpression(node) && prop(node, 'AL') && prop(node, 'SPLITS'))
      balances.push([prop(node, 'AL'), prop(node, 'SPLITS')]);
    ts.forEachChild(node, walk);
  }
  walk(ast);
  const [align, splits] = balances[0] || [];
  if (balances.length > 1 || (align && !ts.isObjectLiteralExpression(align)) ||
      (splits && !ts.isArrayLiteralExpression(splits))) throw Error('Unexpected HANS alignment registry');
  const splitIds = new Set(splits?.elements.map(string));
  function number(node, depth = 0) {
    if (!node || depth > 20) return null;
    const read = child => number(child, depth + 1);
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isParenthesizedExpression(node)) return read(node.expression);
    if (isIdentifier(node)) {
      for (let owner = node.parent; owner; owner = owner.parent) {
        const values = constants.get(owner);
        if (values?.has(node.text)) return read(values.get(node.text));
      }
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operand = read(node.operand);
      if (operand === null) return null;
      if (node.operator === ts.SyntaxKind.MinusToken) return -operand;
      if (node.operator === ts.SyntaxKind.PlusToken) return operand;
    }
    if (ts.isBinaryExpression(node)) {
      const left = read(node.left), right = read(node.right);
      if (left === null || right === null) return null;
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken: return left + right;
        case ts.SyntaxKind.MinusToken: return left - right;
        case ts.SyntaxKind.AsteriskToken: return left * right;
        case ts.SyntaxKind.SlashToken: return right !== 0 ? left / right : null;
      }
    }
    if (ts.isCallExpression(node)) {
      const helper = node.expression.getText(ast);
      if (['K.al','K.alcd'].includes(helper) && align && node.arguments.length === 2) {
        const id = string(node.arguments[0]), base = read(node.arguments[1]);
        if (!id || base === null) return null;
        const factor = Math.max(1, read(prop(align, id)) ?? 1);
        const split = splitIds.has(id);
        if (helper === 'K.alcd') return split ? Math.round(base / Math.sqrt(factor) * 100) / 100 : base;
        const value = base * (split ? Math.sqrt(factor) : factor);
        return value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
      }
    }
    return null;
  }
  return {number};
}

const placeholder = /(\{\d+\})/g;
const numericText = '([+-]?\\d+(?:\\.\\d+)?)';
const escapeRegex = text => text.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
function createTranslator(translations) {
  const patterns = [];
  for (const [original, zh] of translations) {
    const parts = original.split(placeholder);
    if (parts.length === 1) continue;
    const indexes = parts.filter((_, i) => i % 2).map(part => Number(part.slice(1, -1)));
    patterns.push({pattern: new RegExp('^' + parts.map((part, i) => i % 2 ? numericText : escapeRegex(part)).join('') + '$'), indexes, zh});
  }
  return text => {
    if (!text) return null;
    if (/[\u3400-\u9fff]/.test(text)) return text;
    if (translations.has(text)) return translations.get(text);
    const results = new Set();
    for (const {pattern, indexes, zh} of patterns) {
      const match = pattern.exec(text);
      if (!match) continue;
      const values = new Map();
      if (!indexes.every((index, i) => {
        if (values.has(index)) return values.get(index) === match[i + 1];
        values.set(index, match[i + 1]);
        return true;
      })) continue;
      const rendered = zh.replace(placeholder, (_, token) => values.get(Number(token.slice(1, -1))) ?? token);
      if (!/\{\d+\}/.test(rendered)) results.add(rendered);
    }
    return results.size === 1 ? [...results][0] : null;
  };
}

module.exports = {createReader, createTranslator, keyOf, prop, string};
