import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const {raids,extraItems}=read('../src/data/hans-raids.json');
const catalog=read('../public/data/catalog.json');

test('all V0.15.0 raid-preview rewards resolve to the wiki equipment and raid-card catalogs',()=>{
 const items=new Set(catalog.items.map(item=>item.id));
 const variantCards=new Set(catalog.cards.filter(card=>card.raid).map(card=>card.id));
 assert.deepEqual(raids.map(raid=>raid.gear.length),[40,33,40,33,37,40,33,33]);
 assert.deepEqual(raids.map(raid=>raid.gs),[900,1400,2250,3600,3700,3900,4250,4550]);
 assert.deepEqual(raids.map(raid=>raid.tier),[5,6,7,8,8,9,10,10]);
 assert.equal(Object.keys(extraItems).length,20);
 for(const [id,item] of Object.entries(extraItems)){
  assert(items.has(item.baseId));
  assert(!items.has(+id));
  assert.match(item.name,/^聖誕版/);
  assert.match(item.icon,/^items\/[\w-]+\.png$/);
  items.add(+id);
 }
 for(const raid of raids){
  assert.equal(new Set(raid.gear).size,raid.gear.length);
  assert.match(raid.map,/^raid_[a-z]+$/);
  for(const id of raid.gear)assert(items.has(id),'missing equipment '+id);
  for(const id of raid.cards)assert(variantCards.delete(id),'unexpected or duplicate raid card '+id);
  assert(raid.materials.length>0);
  assert.match(raid.firstClear,/3 倍/);
 }
 assert.equal(variantCards.size,0);
});

test('hard healer thresholds and suggested raid roles remain distinct',()=>{
 assert.deepEqual(raids.filter(raid=>raid.baseHealers).map(raid=>[raid.id,raid.baseHealers,raid.healerRequirements]),
  [['r4',1,[[10,2]]],['r8',1,[[10,2],[20,3]]]]);
 const glast=raids.find(raid=>raid.id==='r6');
 assert.equal(glast.baseHealers,0);
 assert(glast.recommendedRoles.some(role=>role.label==='補師'&&role.min===1));
});
