const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {inspect} = require('./hans-static.cjs');

const root = path.resolve(__dirname, '..');
const source = require('../docs/HANS_CHAPTER3_SOURCE.json');
const labels = require('../src/data/hans-stat-labels.json');
const read = file => {
  const bytes = fs.readFileSync(path.join(root, 'evidence', file.directory, file.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.file);
  return bytes.toString('utf8');
};
const main = inspect(read(source.main), source.main.file);
const soul = inspect(read(source.soul), source.soul.file);
const manifest = JSON.parse(read(source.manifest));
const catalog = require('../public/data/catalog.json');
const itemRules = require('../src/data/hans-equipment-rules.json');
const verified = 'official';
const zhDictionary = soul.findLiteral('aA');
const generalDictionary = soul.findLiteral('KI');
for (const statement of soul.ast.statements) {
  const call = ts.isExpressionStatement(statement) && statement.expression;
  if (!call || !ts.isCallExpression(call) || call.expression.getText(soul.ast)!=='Object.assign') continue;
  const [target,...tables]=call.arguments;
  const translations = target?.getText(soul.ast)==='aA'?zhDictionary:target?.getText(soul.ast)==='KI'?generalDictionary:null;
  if (translations) for (const table of tables) Object.assign(translations,soul.literal(table));
}
const zh = name => zhDictionary[name] || generalDictionary[name] || name;
const manifestImage = (id, officialPath) => officialPath
  ? {assetId:String(id), officialPath, rights:'not-cleared', renderAllowed:false}
  : null;

const modifierStats = {
  Y:'damageMult', aa:'haste', ga:'speedMult', Ue:'maxHp', la:'armor', ca:'damageReduction',
  Ee:'critChance', ua:'flee', ja:'areaMult', ro:'projSpeedMult', mt:'regen', Lt:'bossUndeadMult',
  Js:'stunChance', mn:'zenyMult', zt:'doubleChance', ls:'bossEliteMult', Fn:'expMult',
  Dd:'potionMult', rl:'pickupRadius', Ls:'maxHpPct', Ks:'castHaste', za:'critMult',
  _u:'agi', qd:'str', Oy:'vit', Sp:'int', Uy:'dex', NA:'luk', jA:'extraProjectiles',
  ON:'pierceChance', HA:'revives', bu:'regenMoving', Zr:'lowHpDamage', IA:'dotDmg',
};
const flat = new Set(['maxHp','armor','str','agi','vit','int','dex','luk','revives','extraProjectiles']);
const formatEffect = ({stat,value}) => {
  const unit = flat.has(stat) ? '' : stat.startsWith('regen') ? ' HP/s' : '%';
  const number = Number((unit === '%' ? 100 * value : value).toFixed(2));
  return (labels[stat]?.label || stat) + ' ' + (number >= 0 ? '+' : '') + number + unit;
};
const effects = (row, mapping=modifierStats) => row.effectCalls.filter(effect => effect?.fn !== 'RO_CMB').map(effect => {
  assert.ok(effect && mapping[effect.fn] && Number.isFinite(effect.value), JSON.stringify(effect));
  return {stat:mapping[effect.fn], value:effect.value};
});
function nestedLiteral(client, ancestor, name) {
  const found = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) found.push(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(client.declarations.get(ancestor));
  assert.equal(found.length, 1, name);
  return client.literal(found[0]);
}
function runtimeTable() {
  let table;
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isParenthesizedExpression(node.expression)) {
      const expression = node.expression.expression;
      if (ts.isFunctionExpression(expression) && expression.name?.text === 'cmRuntime')
        table = main.literal(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(main.ast);
  assert.equal(Object.keys(table).length, 33);
  assert.ok(Object.values(table).every(levels=>levels.length===7));
  return table;
}
const specialMetadata = nestedLiteral(soul, 'RO_CMB', 'T');
const specials = runtimeTable();
const cardAbilities = Object.fromEntries(Object.entries(specials).map(([id, levels]) => {
  const {d:discovery, ls:lifesteal, low:lowHpDamage, bc:burnCrit} = specialMetadata[id];
  assert.equal(specialMetadata[id].zh.length, 7);
  return [id, {discovery, lifesteal, lowHpDamage, burnCrit, levels}];
}));
const model = Object.fromEntries(['MX','MV2','CHM','RF','MC'].map(key => [key,nestedLiteral(main,'RO_CARDFLOOR',key)]));
const petModifiers = {
  Vm:'luk',mr:'critChance',Km:'damageMult',Wm:'str',Xm:'vit',Ym:'maxHp',fr:'int',UM:'haste',
  ow:'regen',Jm:'flee',Qm:'dex',iw:'damageReduction',GM:'agi',VM:'castHaste',KM:'maxHpPct',
  WM:'potionMult',XM:'armor',YM:'regenMoving',JM:'speedMult',
};
const petUpgrade = main.findLiteral('RO_C3PL');
const itemChapterThree = new Set(main.literal(main.declarations.get('RO_C3ITEM').arguments[0]));
const monsterChapterThree = new Set(main.literal(main.declarations.get('RO_C3MOB').arguments[0]));
const petRules = {
  lapMultipliers: petUpgrade.LABEL.map((_,index)=>1+index*petUpgrade.K),
  intimacy: main.findLiteral('ei').map(({min,mult})=>({min,mult})),
  accessoryMultiplier: main.findLiteral('wa'),
  upgradeEligibility: main.findLiteral('RO_PETUPK'),
};
assert.deepEqual(petRules.lapMultipliers,[1,1.25,1.5,1.75,2,2.25]);
assert.equal(petRules.accessoryMultiplier,1.5);
assert.equal(petRules.upgradeEligibility,.1);
const raid = main.findLiteral('RO_LAPC').raid;
assert.deepEqual(raid.cards.slice().sort(), Object.keys(nestedLiteral(main,'RO_CARDFLOOR','RB')).map(Number).sort());
assert.equal(raid.mult, 4.2);

const definitions = main.findLiteral('xe');
const stageRules = soul.findLiteral('yW');
const expeditionTiers = main.findLiteral('RO_C2T');
const newStages = definitions.filter(stage => stage.chapter===3).map(definition => {
  const {id, tier, gsMin, levels} = definition;
  const rule = stageRules[id];
  const image = manifest.maps?.[rule.map] === 'maps/'+rule.map+'/map.json'
    ? manifestImage(rule.map, 'maps/'+rule.map+'/minimap.png') : null;
  const normalMonsterIds = [...new Set(rule.waves.flatMap(wave => wave.pool))];
  const intruderBossId = rule.intruder.id;
  const bossMonsterIds = [intruderBossId,...rule.bosses.map(boss => boss.id)];
  const laps = expeditionTiers[id];
  assert.deepEqual(laps.map(lap=>lap.gate), [4500,4950,5400,5900,6450,7000]);
  assert.ok(laps.every(lap=>lap.tier===8));
  return {
    id, name:zh(definition.name), tier, gsMin, levels, image, chapter:3,
    lapTiers:laps.map(lap=>lap.tier), lapGS:laps.map(lap=>lap.gate),
    lapHp:laps.map(lap=>lap.hp), lapDamage:laps.map(lap=>lap.dmg),
    open:true, season:false, story:false, planned:false, normalMonsterIds, bossMonsterIds, intruderBossId,
    candidatePoolCount:normalMonsterIds.length, candidateBossCount:bossMonsterIds.length,
    provenance:{stage:verified,monsterPool:verified},
  };
});
const stages = [...catalog.stages.filter(stage=>stage.chapter!==3), ...newStages];
const members = new Map();
for (const stage of stages) {
  for (const [ids,boss] of [[stage.normalMonsterIds,false],[stage.bossMonsterIds,true]]) {
    for (const id of ids) {
      if (!members.has(id)) members.set(id,new Map());
      members.get(id).set(stage.id,{stageId:stage.id,boss,verified:true,verificationState:verified});
    }
  }
}
const playable = new Set(stages.filter(stage=>!stage.story&&!stage.planned).map(stage=>stage.id));
const refs = id => [...(members.get(id)?.values() || [])].filter(ref=>playable.has(ref.stageId));
const sourceFor = (monsterId, key, rawRate) => {
  const stageRefs = refs(monsterId);
  return {sourceType:'monsterDrop',monsterId,stageRefs,
    ...(rawRate!==undefined && {rawRate}), verificationState:stageRefs.length?verified:'candidate',
    evidence:{file:source.soul.file,hash:source.soul.sha256,kind:'hans-static-registration',key}};
};

const monsterDefs = new Map(soul.calls(['be'],ts.isObjectLiteralExpression).map(row=>[row.args[0].id,row.args[0]]));
const registrations = soul.calls(['Me','Z','re','wr']);
const cardsRaw = registrations.filter(row=>row.op==='Me');
assert.equal(cardsRaw.length,243);
const mappedCard = new Map(cardsRaw.map(row=>[row.args[1],row.args[0]]));
const mvp = new Set(), mini = new Set();
for (const definition of definitions) {
  const bosses = stageRules[definition.id].bosses;
  if (bosses.length) mvp.add(bosses.at(-1).id);
  for (const boss of bosses.slice(0,-1)) mini.add(boss.id);
}
const oldCards = new Map(catalog.cards.map(card=>[card.id,card]));
const cards = cardsRaw.map(row=>{
  const [id, monsterId, equipSlot] = row.args;
  const old = oldCards.get(id);
  const asset = manifest.cards[id];
  const originalName = asset?.name || old?.originalName || monsterDefs.get(monsterId).name + ' Card';
  const monsterName = monsterDefs.get(monsterId)?.name;
  const translated = zh(originalName);
  const hasKnownName = old?.fieldProvenance.name===verified;
  const name = hasKnownName ? old.name : translated!==originalName ? translated : (monsterName?zh(monsterName):monsterId)+'卡片';
  const numerical = effects(row);
  const retainedSources = old?.sources.filter(item=>item.sourceType!=='monsterDrop') || [];
  const drop = sourceFor(monsterId,'Me:'+id);
  if (mappedCard.get(monsterId)!==id) {
    drop.stageRefs = [];
    drop.verificationState = 'candidate';
  }
  const sources = !drop.stageRefs.length&&raid.cards.includes(id)?retainedSources:[drop,...retainedSources];
  const image = old?.image || manifestImage(id,asset?.image);
  const special = cardAbilities[id];
  assert.equal(row.effectCalls.some(effect=>effect?.fn==='RO_CMB'),Boolean(special),String(id));
  return {...old,id,name,originalName,monsterId,equipSlot,
    effects:numerical,bonuses:numerical.map(formatEffect),tags:old?.tags||[],sources,image,
    bossRank:mvp.has(monsterId)?'mvp':mini.has(monsterId)?'mini':'normal',
    fieldProvenance:{registration:verified,name:asset?verified:old?.fieldProvenance.name||'candidate',effects:verified}};
}).sort((a,b)=>a.id-b.id);

const oldItems = new Map(catalog.items.map(item=>[item.id,item]));
const items = new Map();
const equipmentMetadata = new Map();
for (const row of registrations.filter(row=>row.op!=='Me')) {
  const {op,args:[id,slot,third,fourth,fifth]} = row;
  const old = oldItems.get(id);
  const asset = manifest.items[id];
  const meta = (op==='wr'?third:fifth) || {};
  const previous = items.get(id);
  const hasKnownName = old?.fieldProvenance.name===verified;
  const name = hasKnownName?old.name:asset?.name?zh(asset.name):'裝備 #'+id;
  let entry = previous || {
    ...old,id,name,originalName:asset?.name || old?.originalName || '#'+id,slot,
    jobs:[],gender:null,bonuses:[],sources:old?.sources.filter(source=>source.sourceType!=='monsterDrop')||[],
    image:old?.image || manifestImage(id,asset?.art || asset?.icon),
    icon:old?.icon || manifestImage(id,asset?.icon),
    fieldProvenance:{...old?.fieldProvenance,registration:verified,name:asset?.name?verified:old?.fieldProvenance.name||'unknown'},
  };
  assert.equal(entry.slot,slot,String(id));
  if (op==='re' && previous) {
    entry.baseStats = fourth;
    entry.bonuses = [];
  } else {
    const base = op==='re'?fourth:meta.base;
    entry = {...entry,jobs:meta.jobs||[],gender:meta.gender||null,bonuses:effects(row).map(formatEffect)};
    if (base) entry.baseStats=base;
    else delete entry.baseStats;
    equipmentMetadata.set(id,{slot,weaponType:meta.wtype,starter:op==='wr'||meta.starter,secret:meta.secret});
  }
  items.set(id,entry);
}
assert.equal(items.size,727);
for (const [monsterId,table] of Object.entries(soul.findLiteral('UA'))) {
  for (const {id,rate} of table) items.get(id)?.sources.push(sourceFor(monsterId,'UA:'+monsterId+':'+id,rate));
}
for (const id of new Set(Object.values(soul.findLiteral('EW')).flat())) {
  const item = items.get(id);
  if (item && !item.sources.some(source=>source.sourceType==='starter'))
    item.sources.push({sourceType:'starter',monsterId:null,stageRefs:[],detail:'角色初始裝備',verificationState:verified,evidence:null});
}
const pets = main.calls(['lt'],ts.isStringLiteral).map(row=>{
  const [id,egg,accessory,,from] = row.args;
  const raw = monsterDefs.get(id)?.name;
  return {id, name:raw?zh(raw):id, egg, accessory:accessory??null, from:from??null, effects:effects(row,petModifiers)};
});
assert.equal(pets.length,39);
const knownMonsters = new Map(catalog.monsters.map(monster=>[monster.id,monster]));
const linkedMonsters = new Set([...members.keys(), ...Object.keys(soul.findLiteral('UA')), ...mappedCard.keys()]);
for (const id of linkedMonsters) {
  const old = knownMonsters.get(id);
  const raw = monsterDefs.get(id)?.name;
  const stageLinks = [...(members.get(id)?.values()||[])].map(ref=>({id:ref.stageId,boss:ref.boss,verified:true}));
  knownMonsters.set(id,{name:raw?zh(raw):id,sprite:null,fieldProvenance:{name:raw?verified:'unknown',stage:verified},
    ...old,id,stages:stageLinks,boss:stageLinks.some(ref=>ref.boss)||Boolean(monsterDefs.get(id)?.boss)});
}
const fixed = soul.findLiteral('s6');
const fixedValues = Object.fromEntries(soul.declarations.get('o6').properties
  .map(property=>[property.name.text,soul.literal(property.initializer.elements[1])]));
for (const [id, entry] of items) {
  entry.chapterThree = itemChapterThree.has(id);
  for (const source of entry.sources) {
    if(source.sourceType==='monsterDrop' && monsterChapterThree.has(source.monsterId)) source.chapterThree = true;
  }
  const meta = equipmentMetadata.get(id);
  const record = itemRules.records[id];
  itemRules.records[id] = {...record,slot:entry.slot,fixed:fixed[id]||[],
    ...meta.weaponType&&{weaponType:meta.weaponType},...meta.starter&&{starter:true},
    ...meta.secret&&{secret:true},...entry.baseStats?.matk&&{magicBase:true}};
}

const output = {...catalog,sourceVersion:'HANS V0.16.0 · 2026-11-27',generatedAt:'2026-11-27',
  official:{...catalog.official,main:source.main,soul:source.soul,manifest:source.manifest},
  stages,cards,items:[...items.values()].sort((a,b)=>a.id-b.id),monsters:[...knownMonsters.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh')),
  lapRules:{...catalog.lapRules,scoring:{base:main.findLiteral('Bk'),classes:main.findLiteral('CC'),relative:main.findLiteral('TC')}},
};
const write = (file,data,indent) => fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,indent)+'\n');
write('public/data/catalog.json',output,2);
write('src/data/hans-equipment-rules.json',{...itemRules,version:source.version,date:source.date,source:{main:source.main,soul:source.soul},fixedValues});
write('src/data/hans-pets.json',{...petRules,pets});
write('src/data/hans-card-model.json',model);
write('src/data/hans-card-abilities.json',cardAbilities);
console.log({stages:stages.length,cards:cards.length,equipment:items.size,
  unknownEquipmentNames:[...items.values()].filter(item=>item.fieldProvenance.name==='unknown').length,
  cardsWithoutImages:cards.filter(card=>!card.image).length,
  itemsWithoutImages:[...items.values()].filter(item=>!item.image).length});
