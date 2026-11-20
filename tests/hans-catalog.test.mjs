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
