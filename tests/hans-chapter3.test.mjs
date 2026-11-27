import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../public/data/catalog.json' with {type:'json'};
import {cardAbilities} from '../src/card-combat-score.ts';
import {cardAbilityText,cardSets,cardSetEffect} from '../src/card-abilities.ts';
import {entryMatches} from '../src/search.ts';
import {petData,petMultiplier,petEffectText} from '../src/pets.ts';
import {experienceData,lapExperience} from '../src/experience.ts';
import {equipmentChapterSuffix} from '../src/equipment-name.ts';

test('Chapter 3 has three complete stage pools, six T8 gates and equipment reverse lookups',()=>{
 const stages=catalog.stages.filter(stage=>stage.chapter===3);
 assert.deepEqual(stages.map(stage=>stage.id),['c3_amatsu','c3_gefenia','c3_thor']);
 const expectedPools=[9,11,8];
 for(const [i,stage] of stages.entries()){
  assert.equal(stage.normalMonsterIds.length,expectedPools[i]);
  assert.equal(stage.bossMonsterIds.length,7);
  assert.deepEqual(stage.lapGS,[4500,4950,5400,5900,6450,7000]);
  assert.deepEqual(stage.lapTiers,[8,8,8,8,8,8]);
  assert.ok(stage.bossMonsterIds.includes(stage.intruderBossId));
  assert.ok(catalog.items.some(item=>item.sources.some(source=>source.stageRefs.some(ref=>ref.stageId===stage.id))));
  const xp=experienceData.stages.find(row=>row.id===stage.id);
  assert.equal(lapExperience(xp,6).baseLap,2);
  assert.equal(lapExperience(xp,6).levelOffset,0);
 }
 const items=catalog.items.filter(item=>item.sources.some(source=>source.stageRefs.some(ref=>ref.stageId.startsWith('c3_'))));
 assert.equal(items.length,204);
 assert.equal(items.filter(item=>item.fieldProvenance.name==='official').length,204);
 assert.ok(items.every(item=>item.image&&item.icon));
 assert.ok(catalog.cards.filter(card=>card.sources.some(source=>source.stageRefs.some(ref=>ref.stageId.startsWith('c3_')))).every(card=>card.image));
});

test('33 special ability tables, trigger and effect searches, and all three pair previews',()=>{
 assert.equal(Object.keys(cardAbilities).length,33);
 for(const [id,ability] of Object.entries(cardAbilities)){
  assert.equal(ability.levels.length,7);
  for(let level=1;level<=7;level++)
   assert.doesNotMatch(cardAbilityText(+id,level),/undefined|NaN/,id+' level '+level);
 }
 for(const [query,id] of [['吸血',4134],['尋寶率',4263],['發現率',4487],['護盾',4372],['燃燒',4430],['條件增傷',4485]]){
  assert.ok(entryMatches(catalog.cards.find(card=>card.id===id),query,'special'),query);
 }
 assert.ok(entryMatches(catalog.cards.find(card=>card.id===4490),'','trigger:dodge'));
 assert.ok(!entryMatches(catalog.cards.find(card=>card.id===4490),'','trigger:cast'));
 assert.deepEqual(cardSets.map(set=>[set.sealed,set.partner]),[[4490,4263],[4485,4407],[4487,4430]]);
 assert.match(cardSetEffect(4490,1),/5 個目標.+15%/);
 assert.match(cardSetEffect(4485,6),/7 秒.+52.5%/);
 assert.match(cardSetEffect(4487,1),/80%.+25%/);
});

test('pet modifiers multiply and evolved entries reference a registered parent',()=>{
 assert.equal(petData.pets.length,39);
 assert.deepEqual(petData.lapMultipliers,[1,1.25,1.5,1.75,2,2.25]);
 assert.equal(petMultiplier(6,910,true),3.375);
 assert.equal(petMultiplier(2,750,false),.9375);
 assert.equal(petEffectText({stat:'damageMult',value:.04},3.375),'傷害 +13.5%');
 assert.ok(petData.pets.every(pet=>!pet.from||petData.pets.some(parent=>parent.id===pet.from)));
});

test('gear suffix recognizes Chapter 3 by drop monster or item registry, preserving prior grades',()=>{
 const base={itemId:1,ilvl:80,tier:8};
 assert.equal(equipmentChapterSuffix(base,false,false),'・二章T8');
 assert.equal(equipmentChapterSuffix(base,true,false),'・三章T8');
 assert.equal(equipmentChapterSuffix(base,false,true),'・三章T8');
 assert.equal(equipmentChapterSuffix({...base,tier:9,rg:1},true,true),'・副本T9');
 assert.equal(equipmentChapterSuffix({...base,tier:10,wbs:true},true,true),'・世界王T10');
 assert.equal(equipmentChapterSuffix({...base,ilvl:70},true,true),'');
});
