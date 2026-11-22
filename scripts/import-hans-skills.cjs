#!/usr/bin/env node
// Read an audited HANS game snapshot as syntax. This script never executes the bundle.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const ts = require('typescript');
const {createReader,createTranslator,keyOf,prop,string} = require('./hans-skill-text.cjs');

const root = path.resolve(__dirname,'..');
const audit = require('../docs/HANS_SOURCE_AUDIT.json');
const review = require('../docs/HANS_SKILL_DESCRIPTIONS.json');
const talents = require('../public/data/talents.json');

function readSkillSnapshot(source,index,file,inspectMissing=false) {
  const bytes = fs.readFileSync(file);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== source.sha256) throw Error('HANS skill source SHA differs from audited snapshot');
  const ast = ts.createSourceFile('hans-soul.js',bytes.toString('utf8'),ts.ScriptTarget.Latest,true);
  if (ast.parseDiagnostics.length) throw Error('Unable to parse audited HANS skill source');
  if (talents.server !== 'hans' || talents.jobs.length !== 41) throw Error('Unexpected HANS job registry');
  const {number} = createReader(ast);
  const array = node => node && ts.isArrayLiteralExpression(node) ? node.elements.map(string).filter(Boolean) : [];

  function translationMap(id) {
    const map = new Map();
    function merge(node) {
      if (!node || !ts.isObjectLiteralExpression(node)) throw Error('Nonliteral translation block ' + id);
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = keyOf(property.name), value = string(property.initializer);
        if (key && value) map.set(key,value);
      }
    }
    for (const statement of ast.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const d of statement.declarationList.declarations)
          if (ts.isIdentifier(d.name) && d.name.text === id) merge(d.initializer);
      }
      if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)) {
        const call = statement.expression;
        if (call.expression.getText(ast) === 'Object.assign' && call.arguments[0]?.getText(ast) === id)
          call.arguments.slice(1).forEach(merge);
      }
    }
    if (!map.size) throw Error('Missing HANS translation table ' + id);
    return map;
  }

  function description(node) {
    if (!node) return null;
    if (ts.isParenthesizedExpression(node)) return description(node.expression);
    if (string(node)) return string(node);
    if (ts.isTemplateExpression(node)) {
      const parts = node.templateSpans.map(span => [number(span.expression),span.literal.text]);
      if (parts.some(([value]) => value === null || !Number.isFinite(value))) return null;
      return node.head.text + parts.map(([value,suffix]) => Number(value.toPrecision(12)) + suffix).join('');
    }
    if (ts.isCallExpression(node)) {
      if (node.expression.getText(ast) === 'L' && node.arguments.length === 2) return description(node.arguments[1]);
      if (node.arguments.length === 1) return description(node.arguments[0]);
    }
    return null;
  }

  function descriptions(node) {
    if (!node) return [null,null];
    const expr = ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node.body : node;
    if (ts.isBlock(expr)) return descriptions(expr.statements.find(ts.isReturnStatement)?.expression);
    if (ts.isConditionalExpression(expr)) {
      if (/(?:===|==)\s*1\b/.test(expr.condition.getText(ast)))
        return [description(expr.whenTrue),description(expr.whenFalse)];
      return [null,null];
    }
    return [description(expr),null];
  }

  function readFactory(factory) {
    const cooldowns = new Set(), damage = new Set();
    function walk(node) {
      if (ts.isNewExpression(node)) {
        for (const arg of node.arguments || []) {
          const cd = prop(arg,'cd') ?? arg;
          if (ts.isCallExpression(cd) && cd.expression.getText(ast) === 'q' && cd.arguments.length === 1)
            cooldowns.add(number(cd.arguments[0]));
          const dmg = prop(arg,'dmg');
          if (dmg && ts.isCallExpression(dmg) && dmg.expression.getText(ast) === 'ae' && dmg.arguments.length === 2)
            damage.add(number(dmg.arguments[0]));
        }
      }
      ts.forEachChild(node,walk);
    }
    if (factory) walk(factory);
    const unique = set => set.size === 1 && [...set][0] > 0 ? [...set][0] : null;
    return {cooldown:unique(cooldowns),baseDamage:unique(damage)};
  }

  const names = translationMap('aA'), translate = createTranslator(translationMap('KI'));
  const ids = new Set(talents.jobs.flatMap(job => (job.skills || []).map(skill => skill.id)));
  const registry = new Map();
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['$e','Ce'].includes(node.expression.text)) {
      const [idNode,nameNode,iconNode] = node.arguments;
      const id = string(idNode);
      if (id && ids.has(id)) {
        const originalName = string(nameNode), icon = string(iconNode);
        if (!originalName || !icon || registry.has(id)) throw Error('Malformed HANS skill ' + id);
        const advanced = node.expression.text === 'Ce';
        const meta = advanced ? node.arguments[3] : null;
        const rawNode = node.arguments[advanced ? 4 : 3];
        const raw = descriptions(rawNode);
        const [base,upgrade] = raw.map(translate);
        const reviewed = review.skills[id];
        const manual = index === 0 ? reviewed : {name:reviewed?.name};
        const factory = readFactory(node.arguments[advanced ? 5 : 4]);
        registry.set(id,{
          id,name:manual?.name ?? (names.get(originalName) || originalName),originalName,icon,
          description:manual?.description ?? base,upgradeDescription:manual?.upgradeDescription ?? upgrade,
          descriptionSource:manual?.description ? 'wiki-review' : raw[0] ? 'hans-registered' : 'not-static',
          translationState:manual?.description ? 'wiki-zh' : base ? 'official-zh' : raw[0] ? 'untranslated' : 'dynamic',
          cooldown:number(prop(meta,'cd')) ?? factory.cooldown,baseDamage:factory.baseDamage,
          type:string(prop(meta,'type')),tags:array(prop(meta,'tags')),cast:array(prop(meta,'cast')),
          sourceType:advanced ? 'advanced' : 'basic'
        });
        if (inspectMissing && !base)
          console.log(JSON.stringify({id,raw:rawNode?.getText(ast),base:raw[0],upgrade:raw[1]}));
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);

  const jobs = talents.jobs.map(job => ({
    id:job.job,sourceId:job.sourceJobId || job.job,name:job.name,rank:job.rank ?? 1,
    base:job.base || null,developing:!!job.developing,
    skills:job.skills.map(ref => {
      const entry = registry.get(ref.id);
      if (!entry || (ref.icon && entry.icon !== ref.icon)) throw Error('HANS skill does not match talent: ' + ref.id);
      return ref.id;
    })
  }));
  const skills = [...registry.values()].sort((a,b) => a.id.localeCompare(b.id));
  const data = {
    server:'hans',schemaVersion:1,reviewedAt:source.date,source:{sha256,relativeFile:source.file},
    policy:'HANS audited skill registry and reviewed Traditional Chinese summaries. Base values exclude character and talent modifiers.',
    jobs,skills
  };
  return data;
}

module.exports = {readSkillSnapshot};
if (require.main === module) {
const snapshotFlag = process.argv.indexOf('--snapshot');
const index = snapshotFlag < 0 ? 0 : Number(process.argv[snapshotFlag+1]);
const source = index === 0 ? audit.skillsSoul : audit.skillHistory[index-1];
if (!source || (index !== 0 && process.argv.includes('--write'))) throw Error('Invalid HANS skill snapshot');
if (review.sha256 !== audit.skillsSoul.sha256) throw Error('HANS skill descriptions need re-review');
const file = snapshotFlag < 0 ? path.join(root,'evidence',source.directory,source.file) : process.argv[snapshotFlag+2];
const data = readSkillSnapshot(source,index,file,process.argv.includes('--inspect-missing'));
const {skills} = data;
const count = key => skills.filter(skill => skill[key] != null).length;
console.log(JSON.stringify({skills:skills.length,descriptions:count('description'),
  upgrades:count('upgradeDescription'),cooldowns:count('cooldown'),baseDamage:count('baseDamage')}));
const output = process.argv.indexOf('--output');
if (output >= 0 || process.argv.includes('--write')) {
  const destination = output >= 0 ? process.argv[output+1] : path.join(root,'public/data/skills.json');
  fs.writeFileSync(destination,JSON.stringify(data,null,2)+'\n');
}

}
