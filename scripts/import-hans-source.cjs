#!/usr/bin/env node
// HANS-only static catalog importer. Reads locally reviewed, gitignored game snapshots.
// The upstream game JavaScript is NEVER executed, copied, or bundled into the wiki.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'docs/HANS_SOURCE_AUDIT.json'), 'utf8'));
const directory = path.resolve(process.argv[2] || path.join(root, 'evidence/hans-20261119'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
function readAudited(entry) {
  const data = fs.readFileSync(path.join(directory, entry.file));
  if (sha(data) !== entry.sha256) throw Error('HANS snapshot SHA mismatch: ' + entry.file);
  return data.toString('utf8');
}
const mainJs = readAudited(audit.hans.main);
const soulJs = readAudited(audit.hans.soul);
const manifest = JSON.parse(readAudited(audit.hans.manifest));

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
    if (!node || depth > 8) return undefined;
    if (ts.isParenthesizedExpression(node)) return literal(node.expression, depth + 1);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node)) {
      const value = literal(node.operand, depth + 1);
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
  function calls(names) {
    const output = [];
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
          && names.includes(node.expression.text) && ts.isNumericLiteral(node.arguments[0]))
        output.push({op: node.expression.text, args: node.arguments.map(value => literal(value)),
          effectCalls: node.arguments[3] && ts.isArrayLiteralExpression(node.arguments[3]) ? node.arguments[3].elements.map(e =>
            ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.arguments.length===1
              ? {fn:e.expression.text, value:literal(e.arguments[0])} : null) : [],
          offset: node.getStart(ast)});
      ts.forEachChild(node, visit);
    }
    visit(ast);
    return output.sort((left, right) => left.offset - right.offset);
  }
  return {findLiteral, calls};
}
const soul = inspect(soulJs, 'hans-soul.js');
const main = inspect(mainJs, 'hans-main.js');
const equipment = new Map();
const cards = new Map();
const officialTranslations = soul.findLiteral('aA');
const generalTranslations = soul.findLiteral('KI');
if (!officialTranslations || !generalTranslations || !manifest.items || !manifest.cards) throw Error('Missing HANS item names');
const zh = raw => officialTranslations[raw] || generalTranslations[raw] || raw;
const name = (id, dictionary) => {
  const original = dictionary[id]?.name;
  if (typeof original !== 'string' || !original.length) return null;
  return {original, translated: zh(original)};
};
const evidence = (file, key) => ({file, hash: audit.hans.soul.sha256, kind:'hans-static-registration', key});
const artRecord = (id, source) => source ? ({assetId:String(id),officialPath:source,rights:'not-cleared',renderAllowed:false}) : null;
// HANS custom modifiers are the gameplay truth; manifest descriptions are classic RO flavor text.
const modifiers={
 Y:['傷害','%'],aa:['冷卻縮減','%'],ga:['移動速度','%'],Ue:['HP','flat'],la:['護甲','flat'],
 ca:['減傷','%'],Ee:['爆擊率','%'],ua:['迴避','%'],ja:['攻擊範圍','%'],ro:['投射物速度','%'],
 mt:['HP 回復','hpsec'],Lt:['Boss／不死系傷害','%'],Js:['命中暈眩率','%'],mn:['Zeny 獲得','%'],
 zt:['雙重施法率','%'],ls:['Boss／菁英傷害','%'],Fn:['EXP 獲得','%'],Dd:['藥水回復','%'],
 rl:['拾取範圍','%'],Ls:['最大 HP','%'],Ks:['詠唱速度','%'],za:['爆擊傷害','%'],
 _u:['AGI','flat'],qd:['STR','flat'],Oy:['VIT','flat'],Sp:['INT','flat'],Uy:['DEX','flat'],
 jA:['額外投射物','flat'],ON:['穿透率','%'],HA:['每局復活次數','flat'],bu:['移動中 HP 回復','hpsec'],
 Zr:['低 HP 時傷害','%'],IA:['持續傷害','%']
};
const display = value => Number.isInteger(value)?String(value):String(Number(value.toFixed(2)));
function actualBonuses(row){
 return row.effectCalls.flatMap(effect => {
  if(!effect || !modifiers[effect.fn] || typeof effect.value!=='number') return [];
  const [label,unit]=modifiers[effect.fn];
  const n=unit==='%'?effect.value*100:effect.value;
  return [label+' '+(n>=0?'+':'')+display(n)+(unit==='%'?'%':unit==='hpsec'?' HP/s':'')];
 });
}
const registrations = soul.calls(['Z', 're', 'wr', 'Me']);
// The game builds kW with Object.fromEntries, so the last registration wins for a monster.
const cardIdByMonster = new Map(registrations.filter(row=>row.op==='Me').map(row=>[row.args[1],row.args[0]]));
for (const row of registrations) {
  const [id, slotOrMonster, numberOrSlot, bonusesOrBase, extra] = row.args;
  if (row.op === 'Me') {
    const itemName = name(id, manifest.cards);
    if (!itemName) continue;
    cards.set(id, {id, name:itemName.translated, originalName:itemName.original,
      monsterId:slotOrMonster, equipSlot:numberOrSlot, bonuses:actualBonuses(row),
      tags:[], sources:[], image:artRecord(id,manifest.cards[id].image), fieldProvenance:{registration:'official',name:'official'}});
    continue;
  }
  const itemName = name(id, manifest.items);
  if (!itemName) continue;
  const existing = equipment.get(id) || {id, name:itemName.translated, originalName:itemName.original,
    slot:slotOrMonster, jobs:[], gender:null, bonuses:actualBonuses(row),
    sources:[], image:artRecord(id,manifest.items[id].art || manifest.items[id].icon),
    icon:artRecord(id,manifest.items[id].icon),fieldProvenance:{registration:'official',name:'official'}};
  existing.slot = slotOrMonster;
  if (row.op === 're') {
    existing.bonuses = [];
    existing.baseStats = bonusesOrBase || null;
    if (extra?.jobs) existing.jobs = extra.jobs;
  } else if (row.op === 'wr') {
    existing.starter = true;
    if (numberOrSlot?.jobs) existing.jobs = numberOrSlot.jobs;
  } else {
    existing.bonuses = actualBonuses(row);
    if (extra?.jobs) existing.jobs = extra.jobs;
    if (extra?.starter) existing.starter = true;
    if (extra?.base) existing.baseStats = extra.base;
  }
  equipment.set(id,existing);
}
if (equipment.size < 350 || cards.size < 130) throw Error('HANS registrations incomplete: '+equipment.size+' / '+cards.size);

const stageDefs = main.findLiteral('xe');
const stageRules = soul.findLiteral('yW');
const dropTables = soul.findLiteral('UA');
const startingItems = soul.findLiteral('EW');
if (!Array.isArray(stageDefs) || stageDefs.length < 15 || !stageRules || !dropTables)
  throw Error('HANS stage/drop schema changed');
const stageIds = new Map();
const memberStage = new Map();
function link(monsterId, stageId, boss) {
  if (!memberStage.has(monsterId)) memberStage.set(monsterId, new Map());
  memberStage.get(monsterId).set(stageId, boss);
}
const stages = stageDefs.map(entry => {
  const config = stageRules[entry.id];
  if (!config || !Array.isArray(config.waves) || !Array.isArray(config.bosses))
    throw Error('HANS stage data not statically verifiable: ' + entry.id);
  const normalMonsterIds = [...new Set(config.waves.flatMap(wave => Array.isArray(wave.pool) ? wave.pool : []))];
  const intruderBossId = config.intruder?.id;
  const bossMonsterIds = [...new Set([intruderBossId,...config.bosses.map(boss=>boss.id)].filter(Boolean))];
  for (const monster of normalMonsterIds) link(monster, entry.id, false);
  for (const monster of bossMonsterIds) link(monster, entry.id, true);
  const stage = {id:entry.id,name:zh(entry.name),tier:entry.tier,levels:entry.levels,
    open:!entry.special&&!config.storyOnly,season:!!entry.special,story:!!config.storyOnly,planned:false,
    normalMonsterIds,bossMonsterIds,...(intruderBossId?{intruderBossId}:{}),candidatePoolCount:normalMonsterIds.length,
    candidateBossCount:bossMonsterIds.length,provenance:{stage:'official',monsterPool:'official'}};
  stageIds.set(stage.id,stage);
  return stage;
});
function dropStageRefs(monsterId) {
  return [...(memberStage.get(monsterId)?.entries() || [])]
    .filter(([stageId])=>!stageIds.get(stageId).story)
    .map(([stageId,boss]) => ({stageId,boss,verified:true,verificationState:'official'}));
}
for (const [monsterId, drops] of Object.entries(dropTables)) {
  if (!Array.isArray(drops)) continue;
  for (const drop of drops) {
    const item = equipment.get(drop.id);
    if (!item) continue;
    const refs = dropStageRefs(monsterId);
    item.sources.push({sourceType:'monsterDrop',monsterId,stageRefs:refs,
      rawRate:typeof drop.rate==='number'?drop.rate:null,
      verificationState:refs.length?'official':'candidate',evidence:evidence(audit.hans.soul.file,'UA:'+monsterId+':'+drop.id)});
  }
}
if (startingItems && typeof startingItems==='object') {
  for (const ids of Object.values(startingItems)) for (const id of ids || []) {
    const item=equipment.get(id);
    if (item && !item.sources.some(src=>src.sourceType==='starter'))
      item.sources.push({sourceType:'starter',detail:'角色初始裝備',monsterId:null,stageRefs:[],
        verificationState:'official',evidence:evidence(audit.hans.soul.file,'starter:'+id)});
  }
}
for(const item of equipment.values()) {
  if (item.starter && !item.sources.some(src=>src.sourceType==='starter'))
    item.sources.push({sourceType:'starter',detail:'角色初始裝備',monsterId:null,stageRefs:[],
      verificationState:'official',evidence:evidence(audit.hans.soul.file,'wr:'+item.id)});
  delete item.starter;
}
// The audited main killEnemy method rolls kW[enemy.id] for normal enemies and bosses.
// It suppresses story drops, including story instances of otherwise playable maps.
for (const card of cards.values()) {
  const refs = cardIdByMonster.get(card.monsterId)===card.id
    ? dropStageRefs(card.monsterId) : [];
  card.sources = [{
    sourceType:'monsterDrop',monsterId:card.monsterId,stageRefs:refs,
    verificationState:refs.length?'official':'candidate',
    evidence:refs.length?evidence(audit.hans.main.file,'killEnemy:kW:'+card.id):evidence(audit.hans.soul.file,'Me:'+card.id)
  }];
  const description = card.bonuses.join(' ').toLowerCase();
  if (/cooldown|recharge|冷卻/.test(description)) card.tags.push('cooldown');
  if (/critical|crit|爆擊/.test(description)) card.tags.push('crit');
  if (/damage|attack|傷害/.test(description)) card.tags.push('damage');
  if (/defense|reduction|防禦/.test(description)) card.tags.push('defense');
  if (/hp|生命/.test(description)) card.tags.push('hp');
}
const monsterIds = new Set([...memberStage.keys(), ...Object.keys(dropTables), ...[...cards.values()].map(card => card.monsterId)]);
const cardNameByMonster = new Map([...cards.values()].map(card => [card.monsterId,card.originalName.replace(/ Card$/,'')]));
const monsters = [...monsterIds].filter(Boolean).map(id => {
  const original = cardNameByMonster.get(id) || id.replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
  const translatedCard = zh(original+' Card');
  const translated = translatedCard !== original+' Card'
    ? translatedCard.replace(/(?:卡片|之卡)$/,'') : zh(original);
  const knownStages = [...(memberStage.get(id)?.entries() || [])];
  return {id,name:translated, boss:knownStages.some(([,isBoss])=>isBoss),
    stages:knownStages.map(([stageId,boss])=>({id:stageId,boss,verified:true})),
    sprite:null,fieldProvenance:{name:'official',stage:'official'}};
}).sort((a,b)=>a.name.localeCompare(b.name,'zh'));
const catalog = {schemaVersion:1,server:'hans',generatedAt:audit.reviewedAt,
  sourceVersion:'HANS '+audit.reviewedAt,
  official:{main:audit.hans.main,soul:audit.hans.soul,manifest:audit.hans.manifest,baseUrl:audit.hans.baseUrl},
  policy:'HANS server only. Monster equipment table is sourced from HANS. Card drops follow the audited HANS killEnemy registry and non-story stage pools, including intruders. No external game artwork shipped.',
  items:[...equipment.values()].sort((a,b)=>a.id-b.id),
  cards:[...cards.values()].sort((a,b)=>a.id-b.id),monsters,stages};
fs.mkdirSync(path.join(root,'public/data'),{recursive:true});
fs.writeFileSync(path.join(root,'public/data/catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({server:catalog.server,stages:stages.length,items:catalog.items.length,cards:catalog.cards.length,
  monsters:monsters.length,equipmentVerified:catalog.items.filter(x=>x.sources.some(s=>s.verificationState==='official')).length,
  stageEdges:[...memberStage.values()].reduce((sum,x)=>sum+x.size,0),
  itemWithoutNames:[...equipment.values()].filter(item=>item.name===String(item.id)).length},null,2));
