// Extract numeric experience and wave data from locally reviewed HANS client files.
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync,writeFileSync} = require('node:fs');
const {join,resolve} = require('node:path');
const ts = require('typescript');

const root = resolve(__dirname,'..');
const directory = resolve(process.argv[2] || join(root,'evidence/xp-20261123'));
const source = {
  version:'0.15.0',
  main:{file:'main-BNOcv2PN.hz0e97d415.js',sha256:'f7e972c55ec0e21cf17f31cf219a6b80b273528cea4d28cd12ed1eae04af94c2'},
  soul:{file:'soul_linker-DllBVIRO.hz91e234cd.js',sha256:'feb5d163ff4cac20ba36c20ed7a2ec8980dae0461f1e011e17c71a054e7d9376'},
};
function readClient({file,sha256}) {
  const bytes = readFileSync(join(directory,file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sha256,file);
  const ast = ts.createSourceFile(file,bytes.toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  assert.equal(ast.parseDiagnostics.length,0,file);
  const declarations = new Map();
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text,declaration.initializer);
    }
  }
  function value(node,depth=0) {
    if (!node || depth>12) return undefined;
    const read = child => value(child,depth+1);
    if (node.kind===ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind===ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isIdentifier(node)) return read(declarations.get(node.text));
    if (ts.isPrefixUnaryExpression(node) && node.operator===ts.SyntaxKind.ExclamationToken) return !read(node.operand);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(read);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment)
      .map(p=>[ts.isIdentifier(p.name)||ts.isStringLiteral(p.name)||ts.isNumericLiteral(p.name)?p.name.text:p.name.getText(ast),read(p.initializer)]));
    return undefined;
  }
  function records(callee) {
    return ast.statements.flatMap(statement=>{
      const call = ts.isExpressionStatement(statement) && statement.expression;
      return call && ts.isCallExpression(call) && ts.isIdentifier(call.expression) &&
        call.expression.text===callee && call.arguments.length===1 && ts.isObjectLiteralExpression(call.arguments[0])
        ? [value(call.arguments[0])] : [];
    });
  }
  return {get: name=>value(declarations.get(name)),records};
}

const main = readClient(source.main);
const soul = readClient(source.soul);
const catalog = JSON.parse(readFileSync(join(root,'public/data/catalog.json'),'utf8'));
const lap = main.get('RO_LAPC');
const secondChapter = main.get('RO_C2T');
const definitions = main.get('xe');
const rules = soul.get('yW');
const allMonsters = new Map(soul.records('be').map(monster=>[monster.id,monster]));
const monsters = {};
function useMonster(id) {
  const monster = allMonsters.get(id);
  assert.ok(Number.isFinite(monster?.level) && Number.isFinite(monster?.exp),'Missing XP data for '+id);
  monsters[id] = {level:monster.level,exp:monster.exp};
}
const stages = catalog.stages.filter(stage=>stage.open||stage.season).map(stage=>{
  const definition = definitions.find(entry=>entry?.id===stage.id);
  const rule = rules[stage.id];
  assert.ok(definition && rule && rule.waves.length && rule.bosses.length,stage.id);
  assert.equal(Boolean(definition.special),stage.season,stage.id);
  const waves = rule.waves.map((wave,index)=>{
    assert.ok(wave.to>wave.from && wave.perSecond>0 && wave.maxAlive>0 && wave.pool.length,stage.id);
    assert.equal(wave.from,index===0?0:rule.waves[index-1].to,stage.id);
    wave.pool.forEach(useMonster);
    return {from:wave.from,to:wave.to,rate:wave.perSecond,pool:wave.pool};
  });
  const bosses = rule.bosses.map(boss=>{
    assert.ok(Number.isFinite(boss.t),stage.id);
    useMonster(boss.id);
    return {time:boss.t,id:boss.id};
  });
  assert.ok(Number.isFinite(rule.jobCap) && Number.isFinite(rule.jobExp) && Number.isFinite(rule.runLength),stage.id);
  if(secondChapter[stage.id]) assert.deepEqual(secondChapter[stage.id].map(row=>row.gate),stage.lapGS,stage.id);
  else if(!stage.season) assert.equal(definition.gsMin,stage.gsMin,stage.id);
  return {id:stage.id,name:stage.name,season:stage.season,gs:stage.lapGS,waves,bosses,
    jobCap:rule.jobCap,jobExp:rule.jobExp,
    ...(rule.bossEase && {bossEase:rule.bossEase}),
    ...(secondChapter[stage.id] && {chapterTwoBase:secondChapter[stage.id].map(row=>row.mult)})};
});
assert.equal(stages.length,16);
assert.equal(stages.filter(stage=>stage.season).length,2);
const chapterOne = definitions.map(def=>stages.find(stage=>stage.id===def?.id))
  .filter(stage=>stage && !stage.season && !stage.chapterTwoBase).map(stage=>stage.id);
assert.equal(chapterOne.at(-1),'maze');
const controls = main.get('Zo');
const data = {
  source,stages,monsters,chapterOne,lap:lap.exp,maxLap:lap.max,
  spawn:{warmupSeconds:main.get('mv'),initialRate:main.get('fv'),eliteInterval:main.get('sp'),hordeInterval:main.get('ep'),
    maxCount:controls.find(control=>control.key==='count').max,maxEvents:controls.find(control=>control.key==='events').max},
  base:{max:soul.get('$9'),legacyFloor:soul.get('m8'),legacyDecay:soul.get('h8')},
  job:{levels:soul.get('p8'),scale:soul.get('nP')*1.7,curveScale:soul.get('nP'),curveLevel:soul.get('Uw'),
    softCapDecay:main.get('jA'),rankDivisor:[1,30,8]},
  victorySeconds:soul.get('pW'),
};
const numericValues = [data.victorySeconds,...Object.values(data.spawn),...Object.values(data.base),
  ...Object.values(data.job.levels),data.job.scale,data.job.curveScale,data.job.curveLevel,data.job.softCapDecay];
assert.ok(numericValues.every(value=>Number.isFinite(value) && value>0),'Missing audited constants');
writeFileSync(join(root,'src/data/hans-experience.json'),JSON.stringify(data)+'\n');
console.log(`HANS V${source.version}: ${stages.length} stages, ${Object.keys(monsters).length} monsters`);
