import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url),'utf8'));
const stageMap=new Map(catalog.stages.map(x=>[x.id,x]));
const byId=new Map(catalog.cards.map(x=>[x.id,x]));

test('every official card registration has the same wiki ID, monster and compound slot',()=>{
 assert.equal(catalog.cards.length,98);
 assert.equal(new Set(catalog.cards.map(c=>c.id)).size,98);
 const slotMap={armor:'護甲',accessory:'飾品',garment:'披肩',headgear:'頭飾',weapon:'武器',shield:'盾牌',shoes:'鞋子'};
 for(const c of catalog.cards){
  assert.equal(c.fieldProvenance.equipSlot,'official',c.id);
  assert.ok(c.sources.length===1,'One unambiguous acquisition source per card '+c.id);
  assert.equal(c.monsterId,typeof c.monsterId==='string'?c.monsterId:null);
  assert.ok(Object.values(slotMap).includes(c.equipSlot));
 }
 assert.equal(audit.officialCards.registered,98);
});

test('card festival pools are exactly the three official balls, not monster drops',()=>{
 const expected={
  '節慶扭蛋':[4195,4172,4287,4225,4239,4210,4259,4227,4217],
  '白素貞扭蛋':[4372],
  '蛇王扭蛋':[4330]
 };
 for(const [ball,ids] of Object.entries(expected))for(const id of ids){
  const card=byId.get(id);
  assert.ok(card,'Official ball card missing '+id);
  assert.equal(card.sources[0].sourceType,'event',id);
  assert.equal(card.sources[0].detail,'燈籠節 · '+ball,id);
  assert.equal(card.sources[0].verificationState,'official');
  assert.equal(card.sources[0].monsterId,null);
  assert.deepEqual(card.sources[0].stageRefs,[]);
  assert.equal(card.sources[0].evidence.hash,catalog.official.main.sha256);
 }
 assert.equal(catalog.cards.filter(c=>c.sources[0].sourceType==='event').length,11);
 assert.deepEqual(audit.officialCards.eventByBall,{'節慶扭蛋':9,'白素貞扭蛋':1,'蛇王扭蛋':1});
});

test('77 normal cards have confirmed, obtainable stages and remain reversible',()=>{
 const normal=catalog.cards.filter(c=>c.sources[0].sourceType==='monsterDrop');
 assert.equal(normal.length,87);
 const confirmed=normal.filter(c=>c.sources[0].verificationState==='official');
 assert.equal(confirmed.length,77);
 for(const c of confirmed){
  const s=c.sources[0];
  assert.ok(s.evidence?.hash===catalog.official.soul.sha256,c.id);
  assert.ok(s.stageRefs.length>0,c.id);
  for(const ref of s.stageRefs){
   const stage=stageMap.get(ref.stageId);
   assert.ok(stage&&stage.open&&!stage.story&&!stage.season,c.name);
   assert.ok(ref.verified);
   assert.equal(ref.verificationState,'official');
   assert.ok((ref.boss?stage.bossMonsterIds:stage.normalMonsterIds).includes(c.monsterId),c.name);
  }
 }
 const unresolved=normal.filter(c=>c.sources[0].verificationState!=='official');
 assert.equal(unresolved.length,10);
 for(const c of unresolved)assert.ok(c.sources[0].stageRefs.every(r=>!r.verified));
 assert.equal(byId.get(4066).sources[0].verificationState,'candidate');
 assert.deepEqual(byId.get(4066).sources[0].stageRefs.map(s=>s.stageId).sort(),['orcs','prt_castle']);
 assert.equal(audit.officialCards.unresolvedCount,10);
});

test('normal sunken ship is not confused with the separate story mode',()=>{
 assert.equal(stageMap.get('sunken').story,false);
 assert.equal(stageMap.get('prt_castle').story,true);
 assert.equal(stageMap.get('louyang').season,true);
 assert.ok(byId.get(4137).sources[0].stageRefs.some(s=>s.stageId==='sunken'&&s.verified));
 assert.ok(catalog.monsters.find(m=>m.id==='dark_snake_lord').stages.some(s=>s.id==='louyang'&&s.boss&&s.verified));
 assert.ok(byId.get(4330).sources[0].stageRefs.length===0,'Snake Lord card is not a direct field drop');
});

test('the reviewed official source files remain pinned and normal card mechanics fail closed',()=>{
 assert.match(catalog.official.main.file,/^main-[\w-]+\.js$/);
 assert.match(catalog.official.soul.file,/^soul_linker-[\w-]+\.js$/);
 assert.equal(audit.officialBundles.main.sha256,catalog.official.main.sha256);
 assert.equal(audit.officialBundles.soul.sha256,catalog.official.soul.sha256);
 assert.ok(audit.officialCards.confirmedNormal===77);
});
