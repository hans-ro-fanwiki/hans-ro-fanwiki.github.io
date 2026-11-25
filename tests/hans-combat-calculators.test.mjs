import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cooldownSeconds,castSeconds,effectiveRange,normalDamage,ownReduction,overflowCritDamage,effectiveFlee} from '../src/combat-calculators.ts';
import {attributeMatches,queryMatches,matchedEffect} from '../src/search.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' ≠ '+b);
test('HANS general cooldown uses additive haste in the denominator, not direct reduction',()=>{
 near(cooldownSeconds(10,0),10);near(cooldownSeconds(10,50),10/1.5);
 near(cooldownSeconds(10,100),5);near(cooldownSeconds(10,200),10/3);
 near(cooldownSeconds(10,50,25,25),5);near(cooldownSeconds(10,-50),10);
 near(cooldownSeconds(10,100,0,0,1.3),6.5);near(cooldownSeconds(0,200),0);
});
test('HANS cast DEX coefficients are separate from cooldown',()=>{
 near(castSeconds(3,50,25,false),1.2);near(castSeconds(3,50,25,true),1.6);
 near(castSeconds(3,150,25,true),0);near(castSeconds(3,100,25,false),0);
});
test('HANS global area and reach soft cap is asymptotic, not a hard skill cap',()=>{
 near(effectiveRange(0),1);near(effectiveRange(100),5/3);near(effectiveRange(200),2);
 near(effectiveRange(400),7/3);assert.ok(effectiveRange(100000)<3);
});
test('2026-11-25 reduction soft cap, multiplicative buff and mode caps',()=>{
 near(ownReduction(60),.51);
 assert.equal(normalDamage(100,10,60,0,80).damage,22);
 near(normalDamage(100,10,60,30,80).effectiveReduction,.657);
 assert.equal(normalDamage(100,10,60,30,80).damage,15);
 near(normalDamage(100,0,10000,80,0).effectiveReduction,.85);
 near(normalDamage(100,0,10000,80,0,true).effectiveReduction,.7);
 assert.equal(normalDamage(10,100,0,0,0).damage,1);
});
test('overflow critical damage and combined flee are mode-specific',()=>{
 near(overflowCritDamage(120),100);near(overflowCritDamage(120,true),50);
 near(overflowCritDamage(90),0);
 near(effectiveFlee(80,40),75);near(effectiveFlee(80,40,true),50);
});
test('catalog haste and cast haste labels agree with stat IDs; legacy cooldown searches still work',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url)));
 for(const c of catalog.cards)for(const [i,e] of c.effects.entries()){
  if(e.stat==='haste')assert.match(c.bonuses[i],/^急速 [+-]/);
  if(e.stat==='castHaste')assert.match(c.bonuses[i],/^施法急速 [+-]/);
 }
 const haste=catalog.cards.find(c=>c.effects.some(e=>e.stat==='haste'));
 const cast=catalog.cards.find(c=>c.effects.some(e=>e.stat==='castHaste')&&!c.effects.some(e=>e.stat==='haste'));
 assert.ok(haste&&cast);assert.ok(attributeMatches(haste,'cooldown'));assert.ok(queryMatches(haste,'冷卻縮減'));
 assert.ok(queryMatches(haste,'急速'));assert.ok(!attributeMatches(cast,'cooldown'));assert.ok(!queryMatches(cast,'急速'));
 assert.ok(queryMatches(cast,'施法急速'));assert.match(matchedEffect(cast,'施法急速','all'),/^施法急速/);
 assert.ok(!JSON.stringify(catalog).includes('冷卻縮減'));
});
