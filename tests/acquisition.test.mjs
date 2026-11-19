import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hasConfirmedAcquisition} from '../src/acquisition.ts';
import {equipmentTier} from '../src/tier.ts';
import {queryMatches} from '../src/search.ts';

const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const get=id=>catalog.items.find(i=>i.id===id);
const stages=new Map(catalog.stages.map(x=>[x.id,x]));

test('unverified equipment is hidden by default without destroying or mislabeling records',()=>{
 const known=catalog.items.filter(hasConfirmedAcquisition);
 const hidden=catalog.items.filter(i=>!hasConfirmedAcquisition(i));
 assert.equal(known.length,179);
 assert.equal(hidden.length,108);
 assert.equal(hidden.filter(x=>x.sources.length===0).length,96);
 assert.equal(hidden.filter(x=>x.sources.length>0).length,12);
 assert.equal(known.length+hidden.length,catalog.items.length);
 assert.equal(hasConfirmedAcquisition(get(1256)),false,'Unconfirmed Katar should be hidden');
 assert.equal(hasConfirmedAcquisition(get(1557)),false,'Book of Apocalypse is still unconfirmed');
 assert.equal(hasConfirmedAcquisition(get(1648)),true);
 assert.equal(hasConfirmedAcquisition(get(1663)),true);
});

test('all 50 festival variants have evidence, a single source, and source Tier 2',()=>{
 const event=catalog.items.filter(x=>x.sources.some(s=>s.sourceType==='event'));
 assert.equal(event.length,50);
 for(const item of event){
  assert.equal(item.sources.length,1,item.id);
  const s=item.sources[0];
  assert.equal(s.verificationState,'official',item.id);
  assert.equal(s.detail,'燈籠節限定扭蛋',item.id);
  assert.equal(s.sourceTier,2,item.id);
  assert.ok(s.evidence?.hash,item.id);
  assert.equal(equipmentTier(item,stages).text,'Tier 2');
  assert.ok(hasConfirmedAcquisition(item));
 }
 assert.equal(get(1648).name,get(1663).name,'Identical official names use separate item IDs');
 assert.notDeepEqual(get(1648).starBonuses,get(1663).starBonuses,'Star effects must not be conflated');
 assert.equal(queryMatches(get(1663),'波爾多法杖'),true,'Old Chinese name stays searchable');
});

test('starter equipment has official registry evidence without fabricated tier or monster drop',()=>{
 const starters=catalog.items.filter(x=>x.sources.some(s=>s.sourceType==='starter'));
 assert.equal(starters.length,9);
 for(const item of starters){
  assert.ok(hasConfirmedAcquisition(item));
  assert.equal(item.sources[0].detail,'角色初始裝備');
  assert.equal(item.sources[0].sourceTier,undefined);
  assert.equal(item.sources[0].monsterId,null);
 }
});

test('all reviewed catalog names belong to the audited current official source',()=>{
 const audit=JSON.parse(readFileSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url),'utf8'));
 assert.equal(audit.officialBundles.main.sha256,catalog.official.main.sha256);
 assert.equal(audit.officialBundles.soul.sha256,catalog.official.soul.sha256);
 assert.equal(audit.officialNameMatches.items,catalog.items.length);
 assert.equal(audit.officialNameMatches.cards,catalog.cards.length);
 assert.equal(audit.officialNameMatches.changed,0,'Official names are stable in the rechecked build');
});
