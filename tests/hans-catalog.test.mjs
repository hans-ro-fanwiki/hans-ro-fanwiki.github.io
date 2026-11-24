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
 assert.equal(catalog.cards.length,202);
 assert.equal(catalog.stages.length,17);
 assert.equal(catalog.monsters.length,209);
});
test('HANS Chapter 2 stages and source rules are included',()=>{
 const stages=catalog.stages.filter(s=>s.id.startsWith('c2_'));
 assert.equal(stages.length,5);
 for(const stage of stages){assert.equal(stage.tier,8);assert.ok(stage.normalMonsterIds.length>0);}
});
test('Chapter 2 uses five audited stages, complete monster/boss pools, lap tiers, GS and source drops',()=>{
 const chapter2=catalog.stages.filter(stage=>stage.chapter===2);
 assert.deepEqual(chapter2.map(stage=>stage.id),['c2_gef','c2_clock','c2_abyss','c2_glast','c2_nif']);
 const names=new Map(catalog.monsters.map(m=>[m.id,m.name]));
 let totalDrops=0;
 for(const stage of chapter2){
  assert.equal(stage.open,true,'HANS Chapter 2 stages are available');
  assert.equal(stage.planned,false);
  assert.deepEqual(stage.lapTiers,[6,7,8,8,8,8]);
  assert.equal(stage.lapGS.length,6);
  assert.ok(stage.lapGS.every((gs,i)=>Number.isFinite(gs)&&gs>0&&(i===0||gs>stage.lapGS[i-1])));
  assert.match(stage.image.officialPath,/^maps\/[a-z0-9_]+\/minimap\.png$/);
  for(const monsterId of [...stage.normalMonsterIds,...stage.bossMonsterIds]){
   assert.ok(names.has(monsterId),'Missing monster '+monsterId+' in '+stage.name);
  }
  const refs=[...catalog.items,...catalog.cards].flatMap(item=>item.sources.flatMap(source=>
   source.stageRefs.filter(ref=>ref.stageId===stage.id).map(ref=>({source,ref}))));
  assert.ok(refs.length>=40,'Missing Stage 2 drops: '+stage.name);
  assert.ok(refs.every(({source,ref})=>ref.verified&&source.verificationState==='official'));
  totalDrops+=refs.length;
 }
 assert.equal(totalDrops,229);
 assert.equal(catalog.stages.find(s=>s.id==='c2_abyss').intruderBossId,'ktullanux');
 assert.equal(catalog.stages.find(s=>s.id==='c2_nif').intruderBossId,'fallen_bishop_hibram');
});
test('Chapter 2 tab, chapter grouping and legacy stage type filters preserve all registered stages',async()=>{
 const {parseStageChapter,stageChapterGroups}=await import('../src/stage-chapter.ts');
 const {matchesStageType,parseStageType}=await import('../src/stage-type.ts');
 const groups=(chapter,type)=>stageChapterGroups(catalog.stages,chapter,stage=>matchesStageType(stage,type));
 assert.equal(parseStageChapter(null),'all');
 assert.equal(parseStageChapter('3'),'all');
 assert.equal(parseStageChapter('2'),'2');
 assert.deepEqual(groups('all','all').map(g=>[g.chapter,g.stages.length]),[[2,5],[1,12]]);
 assert.deepEqual(groups('2','all').map(g=>[g.chapter,g.stages.length]),[[2,5]]);
 assert.deepEqual(groups('1','all').map(g=>[g.chapter,g.stages.length]),[[1,12]]);
 assert.deepEqual(groups('2','event'),[]);
 assert.deepEqual(groups('2','normal').map(g=>g.stages.length),[5]);
 assert.deepEqual(groups('all',parseStageType(null,'1')).map(g=>g.stages.length),[5,9]);
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
  if(source.sourceType==='raid'){
   assert.equal(source.verificationState,'candidate');
   assert.deepEqual(source.stageRefs,[]);
   continue;
  }
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
 assert.equal(catalog.cards.filter(c=>attributeMatches(c,'cooldown')).length,13);
 assert.ok(attributeMatches(catalog.cards.find(c=>c.id===4001),'crit'));
});
test('audited HANS lap rules cover six laps, 41 professions, and all 188 card registrations',async()=>{
 const {cardEffects,cardId,cardName,cardScore,cardMultiplier}=await import('../src/laps.ts');
 const rules=catalog.lapRules;
 assert.equal(catalog.schemaVersion,2);
 assert.deepEqual(rules.multipliers,[1,1.5,2,2.5,3,3.5]);
 assert.deepEqual(rules.noScaleCardIds,[4144]);
 assert.equal(rules.cardStep,1000000);
 assert.equal(rules.jobs.length,41);
 assert.deepEqual([...new Set(rules.jobs.map(j=>j.id))].length,41);
 const allIds=new Set();
 for(const card of catalog.cards){
  if(card.sources.every(source=>source.sourceType==='raid'))continue;
  assert.equal(card.bonuses.length,card.effects.length,card.name);
  for(let lap=1;lap<=6;lap++){
   const id=cardId(card,rules,lap);
   assert.ok(!allIds.has(id),'Duplicate card id '+id);
   allIds.add(id);
   const effects=cardEffects(card,rules,lap);
   assert.equal(effects.length,card.bonuses.length);
   assert.ok(effects.every(effect=>!effect.includes('NaN')&&!effect.includes('undefined')));
   for(const job of rules.jobs){
    const score=cardScore(card,rules,lap,job.id);
    assert.ok(Number.isInteger(score)&&score>=0,'Missing GS '+card.id+' / '+lap+' / '+job.id);
   }
  }
 }
 assert.equal(allIds.size,188*6);
 const poring=catalog.cards.find(c=>c.id===4001);
 assert.deepEqual(cardEffects(poring,rules,2),['迴避 +4.5%','爆擊率 +3%']);
 assert.equal(cardId(poring,rules,2),1004001);
 assert.match(cardName(poring,rules,3),/改²卡片$/);
 assert.equal(cardScore(poring,rules,1,'swordsman'),10);
 assert.equal(cardScore(poring,rules,2,'swordsman'),15);
 const osiris=catalog.cards.find(c=>c.id===4144);
 assert.equal(cardMultiplier(osiris,rules,6),1);
 assert.deepEqual(cardEffects(osiris,rules,6),cardEffects(osiris,rules,1));
 assert.equal(cardScore(osiris,rules,6,'swordsman'),cardScore(osiris,rules,1,'swordsman'));
 const snake=catalog.cards.find(c=>c.id===4330);
 assert.ok(cardScore(snake,rules,2,'mage')>cardScore(snake,rules,2,'swordsman'),'GS differs by job');
 for(const card of catalog.cards.filter(c=>c.bossRank==='mvp'||c.bossRank==='mini'))
  for(let lap=1;lap<=6;lap++)
   assert.ok(cardScore(card,rules,lap,'swordsman')>=Math.round(rules.bossFloors[card.bossRank]*cardMultiplier(card,rules,lap)));
});
test('card GS has exactly three class weight profiles, while all 41 historic job IDs remain compatible',async()=>{
 const {cardScore,gsScalingForJob,gsRepresentativeJob,GS_SCALING_LABELS}=await import('../src/laps.ts');
 const rules=catalog.lapRules;
 const expected={melee:20,magic:10,ranged:11};
 assert.deepEqual(GS_SCALING_LABELS.map(x=>x.id),['melee','magic','ranged']);
 assert.deepEqual(Object.keys(rules.scoring.classes).sort(),Object.keys(expected).sort());
 for(const [scaling,count] of Object.entries(expected)){
  const jobs=rules.jobs.filter(job=>job.scaling===scaling);
  assert.equal(jobs.length,count,'Unexpected HANS class group '+scaling);
  const representative=gsRepresentativeJob(rules,scaling);
  assert.ok(jobs.some(job=>job.id===representative));
  for(const job of jobs)assert.equal(gsScalingForJob(rules,job.id),scaling);
  for(const card of catalog.cards)for(let lap=1;lap<=6;lap++){
   const baseline=cardScore(card,rules,lap,representative);
   for(const job of jobs)
    assert.equal(cardScore(card,rules,lap,job.id),baseline,
     'Different GS inside the same weight profile: '+scaling+'/'+card.id+'/'+lap+'/'+job.id);
  }
 }
 assert.equal(gsRepresentativeJob(rules,'melee'),'swordsman');
 assert.equal(gsRepresentativeJob(rules,'magic'),'mage');
 assert.equal(gsRepresentativeJob(rules,'ranged'),'archer');
 assert.equal(gsScalingForJob(rules,'wizard'),'magic','Old second-job link must still resolve');
 assert.equal(gsScalingForJob(rules,'warlock'),'magic','Old third-job link must still resolve');
 assert.equal(gsScalingForJob(rules,'invalid_job'),null,'Unknown old job must not claim a class');
 assert.equal(gsRepresentativeJob(rules,'unsupported'),null);
});
test('stage tier and gearscore are specific to chapter and selected lap',async()=>{
 const {stageLapInfo,stageTierLabel}=await import('../src/laps.ts');
 for(const stage of catalog.stages){
  assert.equal(stage.lapTiers.length,6);
  assert.equal(stage.lapGS.length,6);
  assert.ok(stageLapInfo(stage,1),'Missing initial lap: '+stage.id);
 }
 const map=new Map(catalog.stages.map(s=>[s.id,s]));
 assert.deepEqual(stageLapInfo(map.get('prontera'),1),{tier:1,gs:0});
 assert.deepEqual(stageLapInfo(map.get('prontera'),2),{tier:4,gs:933});
 assert.deepEqual(stageLapInfo(map.get('maze'),6),{tier:8,gs:4479});
 assert.deepEqual(stageLapInfo(map.get('xmas'),6),{tier:8,gs:4479});
 assert.deepEqual(stageLapInfo(map.get('c2_gef'),1),{tier:6,gs:2360});
 assert.deepEqual(stageLapInfo(map.get('c2_gef'),2),{tier:7,gs:2650});
 assert.deepEqual(stageLapInfo(map.get('c2_gef'),3),{tier:8,gs:2950});
 assert.equal(stageTierLabel(map.get('c2_gef'),2),'二章 T7');
 assert.equal(stageLapInfo(map.get('prt_castle'),2),null);
});

test('HANS raid cards use their own multiplier and never appear as ordinary stage drops',async()=>{
 const {cardName,cardEffects,isRaidOnlyCard}=await import('../src/laps.ts');
 const raid=catalog.cards.filter(card=>card.raid);
 assert.equal(raid.length,15);
 assert.equal(raid.filter(isRaidOnlyCard).length,14);
 const card=raid.find(card=>card.id===4145);
 assert.equal(cardName(card,catalog.lapRules,6),'別西卜卡片・副本');
 assert.ok(cardEffects(card,catalog.lapRules,6).includes('急速 +16.8%'));
 assert.deepEqual(card.sources[0].stageRefs,[]);
});
test('all equipment restriction IDs have a Chinese job label',()=>{
 for(const id of new Set(catalog.items.flatMap(item=>item.jobs))){
  assert.match(catalog.lapRules.jobs.find(job=>job.id===id)?.name||'',/\p{Script=Han}/u,id);
 }
});
