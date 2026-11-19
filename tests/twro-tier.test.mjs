import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {equipmentTier} from '../src/tier.ts';
import {queryMatches} from '../src/search.ts';

const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const map=JSON.parse(readFileSync(new URL('../docs/TWRO_NAMES.json',import.meta.url),'utf8'));
const stages=new Map(catalog.stages.map(s=>[s.id,s]));
const getItem=id=>catalog.items.find(i=>i.id===id);
const getCard=id=>catalog.cards.find(c=>c.id===id);

test('official RO Survivors names supersede twRO fallback, original IDs remain stable',()=>{
 assert.equal(Object.keys(map.items).length,281);
 assert.equal(Object.keys(map.cards).length,98);
 for(const group of ['items','cards'])for(const entry of catalog[group]){
  const expected=map[group][String(entry.id)];
  if(expected&&![13435,20813].includes(entry.id))assert.equal(entry.name,expected,String(entry.id));
  assert.ok(entry.originalName,'preserved original English name '+entry.id);
 }
 assert.equal(getCard(4077).name,'劍魚卡片');
 assert.equal(getCard(4089).name,'異變魚卡片');
 assert.equal(getCard(4100).name,'鬼女卡片');
 assert.equal(getItem(1221).name,'長柄短劍');
 assert.equal(getItem(2603).name,'體力項鏈');
 assert.equal(getItem(2666).name,'希望之燈');
 assert.equal(getItem(1663).name,'波爾多之杖');
 assert.equal(getItem(2708).name,'中華手工藝品');
 assert.equal(getItem(28560).name,'太極護符');
 assert.equal(getItem(13435).name,'火靈之劍');
 assert.equal(getItem(20813).name,'生存斗篷');
});

test('English and previous Chinese names remain findable without conflicting canonical twRO labels',()=>{
 assert.equal(queryMatches(getCard(4077),'Phen Card'),true);
 assert.equal(queryMatches(getCard(4077),'芬魚'),true);
 assert.equal(queryMatches(getCard(4077),'劍魚卡片'),true);
 assert.equal(queryMatches(getCard(4089),'劍魚卡片'),false,'stale alias cannot shadow real Phen name');
 assert.equal(queryMatches(getCard(4089),'Swordfish'),true);
 assert.equal(queryMatches(getCard(4089),'異變魚'),true);
 assert.equal(queryMatches(getCard(4100),'蘇熙'),true);
 assert.equal(queryMatches(getCard(4100),'Sohee'),true);
 assert.equal(queryMatches(getItem(1221),'羅馬短劍'),true);
 assert.equal(queryMatches(getItem(1221),'Gladius'),true);
});

test('Tier is audited from source game stage, NOT base weapon level or ID',()=>{
 const expected={prontera:1,sewer:1,sunken:1,byalan:2,payon:2,payon_cave:2,prt_castle:2,orcs:3,pyramid:3,louyang:2};
 for(const [id,tier] of Object.entries(expected)){
  assert.equal(stages.get(id)?.tier,tier,'Tier '+id);
  assert.equal(stages.get(id)?.provenance.tier,'official');
 }
 assert.deepEqual(equipmentTier(getItem(1117),stages),{text:'Tier 1／2',levels:[1,2],status:'verified'});
 assert.deepEqual(equipmentTier(getItem(2603),stages),{text:'Tier 2',levels:[2],status:'verified'});
 assert.equal(getItem(1125).baseStats.wlv,2);
 assert.equal(equipmentTier(getItem(1125),stages).text,'Tier 1','weapon level 2 must not be mislabeled Tier 2');
 assert.deepEqual(equipmentTier(getItem(1221),stages),{text:'Tier 2',levels:[2],status:'verified'});
 assert.deepEqual(equipmentTier(getItem(1663),stages),{text:'Tier 2',levels:[2],status:'verified'});
 assert.equal(equipmentTier(getItem(1256),stages).status,'unknown');
});
