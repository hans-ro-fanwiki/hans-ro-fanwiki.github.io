import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url),'utf8'));

test('all 287 equipment slots match game declarations including festival clones and rarities',()=>{
 assert.equal(audit.officialEquipmentDefinitions.registered,287);
 assert.equal(audit.officialEquipmentDefinitions.festivalClones,31);
 assert.equal(catalog.items.filter(x=>x.fieldProvenance.slot==='official').length,287);
 for(const item of catalog.items){
  assert.ok(item.slot,'Missing equipment slot '+item.id);
  assert.equal(item.fieldProvenance.slot,'official');
 }
});
test('171 equipment base-stat registrations were directly reconciled, without endorsing candidate effects',()=>{
 assert.equal(audit.officialEquipmentDefinitions.verifiedBaseStats,171);
 const confirmed=catalog.items.filter(i=>i.fieldProvenance.baseStats==='official');
 assert.equal(confirmed.length,171);
 for(const item of confirmed){
  for(const key of ['atk','matk','def'])assert.ok(Number.isFinite(Number(item.baseStats?.[key]??0)),item.id+' '+key);
 }
 assert.match(audit.officialEquipmentDefinitions.remainingEffectRules,/candidate/);
});
