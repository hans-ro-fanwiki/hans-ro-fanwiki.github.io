import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const stages=new Map(data.stages.map(s=>[s.id,s]));
test('catalog remains a focused subset, not a copied official or third-party database',()=>{
 assert.ok(data.items.length>0 && data.items.length<287);
 assert.ok(data.cards.length>0 && data.cards.length<98);
 assert.equal(data.stages.length,10);
});
test('accessories are represented as acc and indexed by id',()=>{
 const accessories=data.items.filter(i=>i.slot==='acc');
 assert.ok(accessories.length>5);
 assert.ok(accessories.some(i=>i.id===2603));
 assert.equal(data.items.filter(i=>i.id===2603).length,1);
});
test('cooldown cards are discoverable without a text search, but not falsely endorsed',()=>{
 const cooldown=data.cards.filter(c=>c.tags.includes('cooldown'));
 assert.equal(cooldown.length,5);
 assert.ok(cooldown.every(c=>c.bonuses.some(b=>b.includes('冷卻'))));
 assert.ok(cooldown.every(c=>c.sources.every(s=>s.verificationState!=='official')));
});
test('official accessory example has a verified drop and stage join',()=>{
 const necklace=data.items.find(i=>i.id===2603);
 assert.equal(necklace.slot,'acc');
 assert.ok(necklace.sources.some(s=>s.monsterId==='strouf'&&s.verificationState==='official'&&s.stageRefs.some(r=>r.stageId==='byalan'&&r.verified)));
 assert.ok(stages.get('byalan').bossMonsterIds.includes('strouf'));
});
test('no monster drop edge can reference a nonexistent stage or claim official without evidence',()=>{
 for(const v of [...data.items,...data.cards])for(const src of v.sources) {
  if(src.verificationState==='official')assert.ok(src.evidence && src.evidence.hash);
  for(const stage of src.stageRefs){
   assert.ok(stages.has(stage.stageId),stage.stageId);
   if(stage.verified)assert.equal(src.verificationState,'official');
   if(src.sourceType!=='monsterDrop')assert.fail('non-monster sources must not claim stage drops');
  }
 }
});
test('UI image references are disabled until rights are cleared',()=>{
 for(const v of [...data.items,...data.cards])for(const asset of [v.image,v.icon].filter(Boolean)){
  assert.equal(asset.renderAllowed,false);
  assert.equal(asset.rights,'not-cleared');
 }
});
test('mage candidate must not show unrelated job-restricted items',()=>{
 const mage=data.items.filter(i=>i.jobs.includes('mage')||i.jobs.length===0);
 assert.ok(mage.length>10);
 assert.ok(mage.every(i=>i.jobs.includes('mage')||i.jobs.length===0));
});
