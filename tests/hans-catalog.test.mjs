import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../docs/HANS_SOURCE_AUDIT.json',import.meta.url),'utf8'));

test('wiki cannot silently serve Coffee or any non-HANS catalog',()=>{
 assert.equal(catalog.server,'hans');
 assert.equal(catalog.official.baseUrl,'https://ro.hans-webgametw.com');
 assert.equal(catalog.official.soul.sha256,audit.hans.soul.sha256);
 assert.equal(catalog.official.main.sha256,audit.hans.main.sha256);
});
test('HANS registered equipment, cards, stages are complete at snapshot baseline',()=>{
 assert.equal(catalog.items.length,523);
 assert.equal(catalog.cards.length,188);
 assert.equal(catalog.stages.length,17);
 assert.equal(catalog.monsters.length,195);
});
test('HANS Chapter 2 stages and source rules are included',()=>{
 const stages=catalog.stages.filter(s=>s.id.startsWith('c2_'));
 assert.equal(stages.length,5);
 for(const stage of stages){assert.equal(stage.tier,8);assert.ok(stage.normalMonsterIds.length>0);}
});
test('equipment drop refs derive only from HANS monster pools',()=>{
 const stages=new Map(catalog.stages.map(s=>[s.id,s]));
 const itemsById=new Map(catalog.items.map(i=>[i.id,i]));
 assert.ok(itemsById.get(1202).sources.some(s=>s.sourceType==='monsterDrop'&&s.monsterId==='poring'));
 // The HANS equipment re() registration clears older custom Z() modifiers.
 assert.deepEqual(itemsById.get(2254).bonuses,[]);
 for(const item of catalog.items)for(const src of item.sources){
  assert.equal(src.evidence?.hash,audit.hans.soul.sha256);
  for(const ref of src.stageRefs){
   const stage=stages.get(ref.stageId);
   assert.ok(stage,'orphan stage '+ref.stageId);
   assert.ok([...stage.normalMonsterIds,...stage.bossMonsterIds].includes(src.monsterId),'false monster-to-stage edge');
  }
 }
});
test('no weights are invented into percentage drop rates',()=>{
 for(const item of catalog.items)for(const src of item.sources)
  assert.ok(!('dropChance' in src)&&!('dropPercent' in src));
});
test('HANS cards link to real monster and boss drops on non-story stages',()=>{
 const stages=new Map(catalog.stages.map(stage=>[stage.id,stage]));
 const poring=catalog.cards.find(card=>card.id===4001);
 assert.equal(poring.name,'波利卡片');
 assert.deepEqual(poring.bonuses,['迴避 +3%','爆擊率 +2%']);
 assert.ok(poring.sources[0].stageRefs.some(ref=>ref.stageId==='prontera'&&!ref.boss));
 for(const card of catalog.cards){
  const [source]=card.sources;
  assert.equal(source.monsterId,card.monsterId);
  assert.equal(source.verificationState,'official');
  assert.ok(source.stageRefs.length);
  for(const ref of source.stageRefs){
   const stage=stages.get(ref.stageId);
   assert.ok(ref.verified&&!stage.story);
   assert.ok((ref.boss?stage.bossMonsterIds:stage.normalMonsterIds).includes(card.monsterId));
  }
 }
 for(const [id,stageId] of [[4318,'xmas'],[4330,'louyang'],[4419,'c2_abyss'],[4441,'c2_nif']]){
  const card=catalog.cards.find(entry=>entry.id===id);
  assert.equal(stages.get(stageId).intruderBossId,card.monsterId);
  assert.ok(card.sources[0].stageRefs.some(ref=>ref.stageId===stageId&&ref.boss&&ref.verified));
 }
});
test('source-only private art is never approved for public download',()=>{
 for(const item of [...catalog.items,...catalog.cards]){
  for(const evidence of [item.image,item.icon].filter(Boolean)){
   assert.equal(evidence.renderAllowed,false);
   assert.match(evidence.officialPath,/^(items|cards)\/[\w-]+(?:_art)?\.png$/);
  }
 }
});
test('deprecated Coffee image catalog is removed',()=>{
 assert.ok(!existsSync(new URL('../public/fan-thumbs',import.meta.url)));
 assert.ok(!existsSync(new URL('../public/approved-thumbs',import.meta.url)));
 assert.ok(!existsSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url)));
});
test('all HANS stages use source-manifest minimaps without shipping game image files',()=>{
 assert.equal(catalog.stages.filter(s=>s.image).length,17);
 const unique=new Set();
 for(const stage of catalog.stages){
  assert.equal(stage.image.rights,'not-cleared');
  assert.equal(stage.image.renderAllowed,false);
  assert.match(stage.image.officialPath,/^maps\/[a-z0-9_]+\/minimap\.png$/);
  assert.ok(!unique.has(stage.id));
  unique.add(stage.id);
 }
});
test('stage type filters show seasonal and story stages separately with legacy links',async()=>{
 const {matchesStageType,parseStageType}=await import('../src/stage-type.ts');
 assert.equal(parseStageType(null,'1'),'normal');
 assert.equal(parseStageType(null,'0'),'all');
 assert.equal(parseStageType('event','1'),'event');
 assert.equal(parseStageType('story',null),'story');
 assert.equal(catalog.stages.filter(s=>matchesStageType(s,'all')).length,17);
 assert.equal(catalog.stages.filter(s=>matchesStageType(s,'normal')).length,14);
 assert.deepEqual(catalog.stages.filter(s=>matchesStageType(s,'event')).map(s=>s.id),['xmas','louyang']);
 assert.deepEqual(catalog.stages.filter(s=>matchesStageType(s,'story')).map(s=>s.id),['prt_castle']);
});
test('HANS card socket slots are known and combat/battle filters share one source of truth',async()=>{
 const {ATTRIBUTE_GROUPS,attributeMatches}=await import('../src/search.ts');
 const slots=new Set(['armor','accessory','garment','headgear','weapon','shield','shoes']);
 assert.ok(catalog.cards.every(c=>slots.has(c.equipSlot)));
 assert.equal(catalog.cards.find(c=>c.id===4001).equipSlot,'armor');
 assert.deepEqual(ATTRIBUTE_GROUPS.map(g=>g.label),['角色屬性','攻擊與戰鬥','防禦與生存']);
 assert.equal(new Set(ATTRIBUTE_GROUPS.flatMap(g=>g.options.map(([id])=>id))).size,ATTRIBUTE_GROUPS.flatMap(g=>g.options).length);
 assert.equal(catalog.cards.filter(c=>attributeMatches(c,'cooldown')).length,12);
 assert.ok(attributeMatches(catalog.cards.find(c=>c.id===4001),'crit'));
});
