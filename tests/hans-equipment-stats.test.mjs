import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {equipmentBaseStats,fixedEquipmentEffects,equipmentAffixPools,equipmentSearchEffects,gearRecord} from '../src/equipment-stats.ts';
import {equipmentTier,equipmentTierOptions,equipmentMatchesTier,parseTierFilter} from '../src/tier.ts';
import {attributeMatches} from '../src/search.ts';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const projection=JSON.parse(readFileSync(new URL('../src/data/hans-equipment-rules.json',import.meta.url),'utf8'));
const stages=new Map(catalog.stages.map(s=>[s.id,s]));
const item=id=>catalog.items.find(x=>x.id===id);
const normal=tier=>({tier,raid:false});
test('all 727 catalog gear records and 20 extra raid entries are represented',()=>{
 assert.equal(Object.keys(projection.records).length,747);
 assert.equal(Object.values(projection.records).filter(r=>r.fixed.length).length,663);
 for(const x of catalog.items){const r=gearRecord(x);assert.equal(r.slot,x.slot);assert.ok(r.fixed.every(k=>Number.isFinite(projection.fixedValues[k])));}
});
test('Shadow Walk gets true DEF and its separate innate DR at T6/T7/T8',()=>{
 const shoe=item(2426);
 assert.equal(shoe.bonuses.length,0);
 for(const tier of [6,7,8]){
  assert.deepEqual(equipmentBaseStats(shoe,normal(tier),4),['DEF +'+tier*2]);
  assert.deepEqual(fixedEquipmentEffects(shoe,normal(tier)),['傷害減免 +'+tier+'%']);
 }
 assert.equal(attributeMatches(shoe,'reduction'),true);
 assert.equal(attributeMatches(shoe,'int'),false,'Random possible affixes must not become innate search matches');
 assert.deepEqual(equipmentTierOptions(shoe,stages),[normal(6),normal(7),normal(8)]);
 assert.deepEqual(equipmentTierOptions(shoe,stages,1),[normal(6)]);
 assert.deepEqual(equipmentTierOptions(shoe,stages,6),[normal(8)]);
 assert.equal(equipmentTier(shoe,stages).text,'T6–T8');
 for(const t of ['6','7','8'])assert.ok(equipmentMatchesTier(shoe,stages,t));
 assert.equal(equipmentMatchesTier(shoe,stages,'5'),false);
 assert.equal(equipmentMatchesTier(shoe,stages,'8',()=>true,1),false);
});
test('tiers follow source, not item id; preserve separate raid grade',()=>{
 const x={...item(2426),sources:[...item(2426).sources,{sourceType:'raid',sourceTier:9,verificationState:'official',stageRefs:[],raidId:'r6'}]};
 assert.deepEqual(equipmentTierOptions(x,stages),[normal(6),normal(7),normal(8),{tier:9,raid:true}]);
 assert.ok(equipmentMatchesTier(x,stages,'9',s=>s.sourceType==='raid'));
 assert.equal(equipmentMatchesTier(x,stages,'9',s=>s.sourceType==='monsterDrop'),false);
 assert.equal(equipmentMatchesTier(x,stages,'8',s=>s.sourceType==='raid'),false);
 assert.deepEqual(equipmentBaseStats(x,{tier:9,raid:true},4),['DEF +20']);
 assert.deepEqual(fixedEquipmentEffects(x,{tier:9,raid:true}),['傷害減免 +10%']);
 assert.equal(parseTierFilter('11'),'all');
 assert.equal(parseTierFilter('8'),'8');
});
test('equipment stats use real HANS formulas rather than manifest flavor numbers',()=>{
 const dagger=item(1202),starter=item(1101);
 assert.deepEqual(equipmentBaseStats(dagger,normal(1),0),['ATK +25']);
 assert.deepEqual(equipmentBaseStats(dagger,normal(8),4),['ATK +58']);
 assert.deepEqual(fixedEquipmentEffects(dagger,normal(8)),['急速 +8%']);
 assert.deepEqual(equipmentBaseStats(starter,normal(1),4),[]);
 assert.equal(equipmentAffixPools(starter,normal(1)),null);
 assert.equal(equipmentSearchEffects(starter).length,0);
});
test('ordinary random affixes reflect tier and eligible equipment category only',()=>{
 const shoe=item(2426);
 const pool=equipmentAffixPools(shoe,normal(8));
 assert.equal(pool.attributes.length,6);
 assert.ok(pool.attributes.includes('INT +8'));
 assert.deepEqual(pool.offensive,['爆擊率 +8%','急速 +8%','範圍 +8%']);
 assert.deepEqual(pool.defensive,['HP +40','護甲 +3.2','移動速度 +8%','Flee（迴避） +8%']);
 assert.ok(equipmentAffixPools(catalog.items.find(x=>x.slot==='armor'&&!gearRecord(x).starter),normal(8)).offensive.includes('穿透率 +8%'));
 assert.deepEqual(equipmentAffixPools(shoe,{tier:8,raid:true}).offensive,['爆擊率','急速','範圍']);
});
