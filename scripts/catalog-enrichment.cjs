// Reproducible ID-only Taiwan RO name mapping and per-stage Tier enrichment.
// This never imports twRO combat rules, equipment tier, or extra source art.
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');

function sourceStageTiers(originalMainJs,expectedSha){
 const hash=createHash('sha256').update(originalMainJs).digest('hex');
 assert.equal(hash,expectedSha,'Game bundle changed: review stage Tier table before rebuilding catalog');
 // Minifier identifiers are not stable between official releases (Le -> Te).
 const head=/const ([A-Za-z_$][\w$]*)=\[\{id:"prontera",/.exec(originalMainJs);
 assert.ok(head,'Official stage table not found');
 const start=head.index;
 const terminator=new RegExp('\\];for\\(const [A-Za-z_$][\\w$]* of '+head[1]+'\\)');
 const after=originalMainJs.slice(start).search(terminator);
 assert.ok(after>0,'Official stage table terminator not found');
 const stageText=originalMainJs.slice(start,start+after+1);
 const stages=new Map();
 for(const match of stageText.matchAll(/\{id:"([a-z_]+)",[^}]*?tier:(\d+),/g)){
  assert.ok(!stages.has(match[1]),'Duplicate source stage ID');
  const tier=Number(match[2]);
  assert.ok(Number.isInteger(tier)&&tier>0&&tier<=9,'Invalid stage tier');
  stages.set(match[1],tier);
 }
 assert.equal(stages.size,10,'Expected ten audited game stages');
 return stages;
}

function sourceLabel(target,translated){
 if(!translated||translated===target.name)return;
 const aliases=new Set([...(target.nameAliases||[]),target.name].filter(s=>s&&s!==translated));
 target.name=translated;
 target.nameAliases=[...aliases];
}
function removeAliasesThatShadowNames(entries){
 const primary=new Set(entries.map(e=>e.name));
 for(const entry of entries){
  if(!entry.nameAliases)continue;
  entry.nameAliases=entry.nameAliases.filter(alias=>alias!==entry.name&&!primary.has(alias));
  if(!entry.nameAliases.length)delete entry.nameAliases;
 }
}
function enrichCatalog(catalog,originalMainJs,twro){
 assert.ok(catalog?.official?.main?.sha256);
 const tiers=sourceStageTiers(originalMainJs,catalog.official.main.sha256);
 for(const stage of catalog.stages){
  assert.ok(tiers.has(stage.id),'Unrecognized stage '+stage.id);
  stage.tier=tiers.get(stage.id);
  stage.provenance.tier='official';
 }
 const imported={items:0,cards:0,monsters:0,manualItems:0,manualMonsters:0};
 const names=twro||{items:{},cards:{}};
 for(const group of ['items','cards']){
  for(const entry of catalog[group]){
   const name=names[group]?.[String(entry.id)];
   if(!name)continue;
   sourceLabel(entry,name);
   imported[group]++;
  }
 }
 for(const item of catalog.items){
  if(names.items?.[String(item.id)])continue;
  const manual=names.manualFallbackItems?.[String(item.id)];
  if(manual){sourceLabel(item,manual);imported.manualItems++;}
 }
 const monsters=new Map(catalog.monsters.map(m=>[m.id,m]));
 for(const card of catalog.cards){
  const monster=monsters.get(card.monsterId);
  if(!monster)continue;
  const taiwanName=names.cards?.[String(card.id)];
  if(!taiwanName?.endsWith('卡片'))continue;
  sourceLabel(monster,taiwanName.slice(0,-2));
  imported.monsters++;
 }
 for(const [id,name] of Object.entries(names.manualFallbackMonsters||{})){
  const monster=monsters.get(id);
  if(!monster||catalog.cards.some(c=>c.monsterId===id))continue;
  sourceLabel(monster,name);imported.manualMonsters++;
 }
 for(const group of ['items','cards','monsters'])removeAliasesThatShadowNames(catalog[group]);
 return imported;
}
module.exports={enrichCatalog,sourceStageTiers};
