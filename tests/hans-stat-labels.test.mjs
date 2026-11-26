import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entryMatches,matchedEffect,attributeMatches,ATTRIBUTE_GROUPS} from '../src/search.ts';
import labels from '../src/data/hans-stat-labels.json' with {type:'json'};
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
test('official double cast label, old names and English find exactly the same five cards',()=>{
 const expected=catalog.cards.filter(c=>c.effects.some(e=>e.stat==='doubleChance'));
 assert.equal(expected.length,5);
 for(const q of ['雙倍投擲','雙倍投擲機率','雙重施法率','雙重攻擊機率','double cast','doubleChance']){
  assert.deepEqual(catalog.cards.filter(c=>entryMatches(c,q,'all')).map(c=>c.id),expected.map(c=>c.id),q);
 }
 for(const c of expected)assert.match(matchedEffect(c,'雙重施法率','all'),/^雙倍投擲 /);
 assert.deepEqual(catalog.cards.filter(c=>attributeMatches(c,'doubleChance')).map(c=>c.id),expected.map(c=>c.id));
 assert.ok(ATTRIBUTE_GROUPS.flatMap(g=>g.options).some(([id,label])=>id==='doubleChance'&&label==='雙倍投擲'));
});
test('every card uses the shared stat label and can be filtered by its actual ID',()=>{
 for(const c of catalog.cards)for(const [i,e] of c.effects.entries()){
  assert.ok(labels[e.stat],e.stat);
  assert.ok(c.bonuses[i].startsWith(labels[e.stat].label+' '),c.name);
  assert.ok(attributeMatches(c,e.stat),c.name+' '+e.stat);
 }
});
test('range, melee reach, pickup radius, haste and cast haste do not cross-match',()=>{
 const pickup=catalog.cards.find(c=>c.effects.some(e=>e.stat==='pickupRadius')&&!c.effects.some(e=>e.stat==='areaMult'));
 assert.ok(pickup);
 assert.ok(!attributeMatches(pickup,'range'));
 assert.ok(!entryMatches(pickup,'攻擊範圍','all'));
 assert.ok(entryMatches(pickup,'拾取範圍','all'));
 const cast=catalog.cards.find(c=>c.effects.some(e=>e.stat==='castHaste')&&!c.effects.some(e=>e.stat==='haste'));
 assert.ok(cast&&!entryMatches(cast,'急速','all')&&entryMatches(cast,'施法急速','all'));
});
