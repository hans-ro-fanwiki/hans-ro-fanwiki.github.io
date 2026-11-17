import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attributeMatches,queryMatches,matchedEffect,entryMatches} from '../src/search.ts';

const data=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const items=data.items;
const cards=data.cards;

test('six character stats, cooldown and crit match current candidate attributes',()=>{
 const cases={int:[6,2],dex:[6,1],str:[11,4],agi:[7,3],vit:[4,1],luk:[7,0],cooldown:[21,5],crit:[37,11]};
 for(const [key,[itemCount,cardCount]] of Object.entries(cases)){
  assert.equal(items.filter(i=>attributeMatches(i,key)).length,itemCount,'items '+key);
  assert.equal(cards.filter(c=>attributeMatches(c,key)).length,cardCount,'cards '+key);
 }
});

test('Chinese stat aliases search the same effects as abbreviations',()=>{
 const aliases={智力:'int',靈巧:'dex',力量:'str',敏捷:'agi',體質:'vit',幸運:'luk',減CD:'cooldown',冷卻縮減:'cooldown'};
 for(const [name,key] of Object.entries(aliases)){
  // New twRO item names may contain attribute words (e.g. 敏捷) without that stat bonus.
  const includesName=(entry)=>[entry.name,entry.originalName,...(entry.nameAliases||[])].some(s=>s.toLowerCase().includes(name.toLowerCase()));
  assert.deepEqual(items.filter(e=>queryMatches(e,name)).map(e=>e.id),items.filter(e=>attributeMatches(e,key)||includesName(e)).map(e=>e.id),name+' item alias');
  assert.deepEqual(cards.filter(e=>queryMatches(e,name)).map(e=>e.id),cards.filter(e=>attributeMatches(e,key)||includesName(e)).map(e=>e.id),name+' card alias');
 }
});

test('search and selected attribute combine with AND semantics',()=>{
 const search='DEX';
 const ids=items.filter(e=>entryMatches(e,search,'cooldown')).map(e=>e.id);
 const expected=items.filter(e=>queryMatches(e,search)&&attributeMatches(e,'cooldown')).map(e=>e.id);
 assert.deepEqual(ids,expected);
 assert.equal(entryMatches(items[0],'','all'),true);
});

test('matching bonus text is visible in quick results, including star bonus',()=>{
 const cooldown=items.find(e=>attributeMatches(e,'cooldown'));
 const matched=matchedEffect(cooldown,'','cooldown');
 assert.ok(matched && /冷卻/i.test(matched));
 const intItem=items.find(e=>attributeMatches(e,'int'));
 assert.match(matchedEffect(intItem,'智力','all'),/INT/i);
});
