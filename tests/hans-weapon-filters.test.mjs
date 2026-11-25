import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {equipmentUsableBy,equipmentMatchesSlot,normalizeEquipmentSlot,weaponOptions,weaponType,weaponLabel,jobFamily} from '../src/weapon-filters.ts';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const gear=catalog.items,item=id=>gear.find(i=>i.id===id);
test('weapon categories are based on registered weapon types, not names',()=>{
 assert.equal(weaponType(item(1105)),'sword');
 assert.equal(weaponLabel(item(1105)),'單手劍');
 assert.equal(weaponType(item(1202)),'dagger');
 assert.equal(weaponType(item(1817)),'taekwon');
 assert.equal(weaponType(item(2426)),null);
 const weapons=gear.filter(i=>i.slot==='weapon');
 assert.equal(weaponOptions(gear,'all').length,20);
 assert.ok(weapons.every(i=>weaponType(i)&&weaponType(i)!=='unknown'));
 assert.deepEqual(gear.filter(i=>equipmentMatchesSlot(i,'weapon')),weapons);
 assert.ok(gear.filter(i=>equipmentMatchesSlot(i,'weapon:sword')).every(i=>weaponType(i)==='sword'));
 assert.ok(equipmentMatchesSlot(item(2426),'shoes'));
});
test('HANS profession inheritance and special weapon eligibility apply consistently',()=>{
 assert.ok(equipmentUsableBy(item(1105),'rune_knight'));
 assert.ok(!equipmentUsableBy(item(1105),'warlock'));
 assert.ok(equipmentUsableBy(item(1601),'sura'));
 assert.ok(equipmentUsableBy(item(1601),'soul_reaper'),'staff exception');
 assert.ok(equipmentUsableBy(item(1702),'shadow_chaser'),'rogue bow exception');
 assert.ok(equipmentUsableBy(item(2426),'sura'));
 assert.equal(jobFamily('sura'),'acolyte');
 assert.equal(jobFamily('rebellion_rank3'),'gunslinger');
 for(const job of catalog.lapRules.jobs){
  const options=weaponOptions(gear,job.id);
  const expected=new Set(gear.filter(i=>i.slot==='weapon'&&equipmentUsableBy(i,job.id)).map(i=>'weapon:'+weaponType(i)));
  assert.deepEqual(new Set(options.map(([id])=>id)),expected,job.id);
  assert.ok(options.length>0,job.id);
 }
});
test('incompatible selection resets only the weapon subtype, not non-weapon slots',()=>{
 assert.equal(normalizeEquipmentSlot('weapon:twohand-sword','mage',gear),'weapon');
 assert.equal(normalizeEquipmentSlot('weapon:sword','rune_knight',gear),'weapon:sword');
 assert.equal(normalizeEquipmentSlot('weapon','sura',gear),'weapon');
 assert.equal(normalizeEquipmentSlot('shoes','mage',gear),'shoes');
 assert.equal(normalizeEquipmentSlot('all','sura',gear),'all');
});
