import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));

test('all 188 scoreable cards sort before paging and match detail GS across three classes and six laps',async()=>{
 const {rankCardsByGs,cardGsContribution}=await import('../src/card-ranking.ts');
 const {gsRepresentativeJob,isRaidOnlyCard}=await import('../src/laps.ts');
 const included=catalog.cards.filter(c=>!isRaidOnlyCard(c));
 assert.equal(included.length,188);
 for(const type of ['melee','ranged','magic'])for(let lap=1;lap<=6;lap++){
  const job=gsRepresentativeJob(catalog.lapRules,type);
  const rows=rankCardsByGs(catalog.cards,catalog.lapRules,lap,job);
  assert.equal(rows.length,included.length);
  assert.deepEqual(new Set(rows.map(r=>r.card.id)),new Set(included.map(c=>c.id)));
  for(const row of rows)assert.equal(row.score,cardGsContribution(row.card,catalog.lapRules,lap,job));
  for(let i=1;i<rows.length;i++)assert.ok(rows[i-1].score>=rows[i].score);
  assert.equal(rows[0]?.score,Math.max(...rows.map(r=>r.score)));
 }
});

test('normal card previews and GS descending mode share score, class and lap rules',async()=>{
 const {rankCardsByGs,cardGsContribution}=await import('../src/card-ranking.ts');
 const {cardScore,gsRepresentativeJob,isRaidOnlyCard}=await import('../src/laps.ts');
 const cards=catalog.cards;
 for(const scaling of ['melee','ranged','magic'])for(let lap=1;lap<=6;lap++){
  const job=gsRepresentativeJob(catalog.lapRules,scaling);
  const previewMap=new Map(cards.map(card=>[card.id,cardGsContribution(card,catalog.lapRules,lap,job)]));
  const sorted=rankCardsByGs(cards,catalog.lapRules,lap,job);
  for(const card of cards){
   const preview=previewMap.get(card.id);
   const sourceScore=cardScore(card,catalog.lapRules,lap,job);
   const expected=isRaidOnlyCard(card)?null:card.id===4144
    ?Math.round(sourceScore*catalog.lapRules.multipliers[lap-1]):sourceScore;
   assert.equal(preview,expected);
  }
  for(const row of sorted)assert.equal(row.score,previewMap.get(row.card.id));
 }
 const pureRaid=cards.find(isRaidOnlyCard);
 assert.equal(cardGsContribution(pureRaid,catalog.lapRules,1,'mage'),null);
 assert.equal(cardGsContribution(cards[0],catalog.lapRules,1,'invalid_job'),null);
});

test('ranking respects prefiltered part and attributes, includes mixed-source cards',async()=>{
 const {rankCardsByGs}=await import('../src/card-ranking.ts');
 const {cardScore,isRaidOnlyCard}=await import('../src/laps.ts');
 const subset=catalog.cards.filter(c=>c.equipSlot==='accessory'&&c.bonuses.some(s=>s.includes('冷卻')));
 const rows=rankCardsByGs(subset,catalog.lapRules,6,'mage');
 assert.ok(rows.length>0);
 assert.ok(rows.every(r=>subset.includes(r.card)&&r.card.equipSlot==='accessory'&&!isRaidOnlyCard(r.card)));
 assert.ok(rows.every(r=>r.score===cardScore(r.card,catalog.lapRules,6,'mage')));
 assert.deepEqual(rankCardsByGs(subset,catalog.lapRules,6,'invalid_job'),[]);
 const mixed=catalog.cards.find(c=>c.raid&&!isRaidOnlyCard(c));
 assert.ok(mixed);
 assert.equal(rankCardsByGs([mixed],catalog.lapRules,1,'swordsman').length,1);
});

test('zero GS stays, ties sort by zh-Hant card name then numeric ID; pure raid cards excluded',async()=>{
 const {rankCardsByGs}=await import('../src/card-ranking.ts');
 const {isRaidOnlyCard}=await import('../src/laps.ts');
 const seed=catalog.cards.find(c=>!c.raid);
 const zero={...seed,id:990002,name:'同分卡片',bonuses:[],effects:[],bossRank:'normal'};
 const lower={...zero,id:990001};
 const first={...zero,id:990003,name:'一卡片'};
 const raid=catalog.cards.find(isRaidOnlyCard);
 const rows=rankCardsByGs([zero,raid,lower,first],catalog.lapRules,6,'swordsman');
 assert.equal(rows.length,3);
 assert.ok(rows.every(row=>row.score===0));
 assert.deepEqual(rows.map(r=>r.card.id),[990003,990001,990002]);
});

test('the audited V0.14.5 registry keeps all 202 card modifiers and socket identities intact',()=>{
 const rows=catalog.cards.slice().sort((a,b)=>a.id-b.id)
  .map(c=>({id:c.id,monsterId:c.monsterId,equipSlot:c.equipSlot,effects:c.effects,bossRank:c.bossRank}));
 assert.equal(rows.length,202);
 assert.equal(new Set(rows.map(c=>c.id)).size,202);
 // Pinned to the 2026-11-22 SHA-reviewed HANS V0.14.5 Me registrations.
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
  '54a36ab5d4d19a6848ba4ecd1114c878e4c94ed580b5cd02de66631614fa2132');
 let effectsChecked=0;
 for(const card of catalog.cards){
  assert.equal(card.effects.length,card.bonuses.length);
  for(let i=0;i<card.effects.length;i++){
   const text=card.bonuses[i],effect=card.effects[i];
   const value=text.match(/[-+]\d+(?:\.\d+)?(?=%| HP\/s|$)/);
   assert.ok(value,'Missing displayed numeric modifier: '+card.id);
   const sourceValue=Number((effect.value*(text.endsWith('%')?100:1)).toFixed(2));
   assert.ok(Math.abs(Number(value[0])-sourceValue)<1e-7,
    'Source modifier differs from displayed effect: '+card.id);
   effectsChecked++;
  }
 }
 assert.equal(effectsChecked,347);
});

test('every ordinary card matches the independently reconstructed HANS GS formula for three profiles and six laps',async()=>{
 const {cardScore,cardEffects,cardMultiplier,isRaidOnlyCard}=await import('../src/laps.ts');
 const {cardGsContribution}=await import('../src/card-ranking.ts');
 const rules=catalog.lapRules,roundStats=new Set(['str','agi','vit','int','dex','luk','extraProjectiles','revives']);
 const sourceRules={multipliers:rules.multipliers,noScaleCardIds:rules.noScaleCardIds,bossFloors:rules.bossFloors,scoring:rules.scoring};
 assert.equal(createHash('sha256').update(JSON.stringify(sourceRules)).digest('hex'),
  '14f4a4ed233cfa3c2a59bdf030d455cae147ebb9f07ca8e6c4087777173ba1bd');
 const jobs={melee:'swordsman',ranged:'archer',magic:'mage'};
 let checked=0;
 for(const card of catalog.cards){
  if(isRaidOnlyCard(card))continue; // Raid-only version has its own 4.2x effect; not yet in GS ranking.
  for(const [scaling,job] of Object.entries(jobs))for(let lap=1;lap<=6;lap++){
   const factor=rules.noScaleCardIds.includes(card.id)?1:rules.multipliers[lap-1];
   const weights={...rules.scoring.base,...rules.scoring.classes[scaling]};
   let raw=0;
   for(const effect of card.effects){
    const delta=roundStats.has(effect.stat)?Math.round(effect.value*factor):effect.value*factor;
    // HANS AC uses TC[i] * ((after-before)/before); pickupRadius *= 1+delta, so its ratio is delta.
    const weight=Object.hasOwn(rules.scoring.relative,effect.stat)
     ?rules.scoring.relative[effect.stat]:weights[effect.stat]??0;
    raw+=weight*delta;
   }
   const floor=card.bossRank==='mvp'?rules.bossFloors.mvp:card.bossRank==='mini'?rules.bossFloors.mini:0;
   const expected=Math.max(0,Math.round(raw),Math.round(floor*factor));
   assert.equal(cardScore(card,rules,lap,job),expected,'Card/lap/profile mismatch: '+card.id+'/'+lap+'/'+scaling);
   assert.equal(cardGsContribution(card,rules,lap,job),
    card.id===4144?Math.round(expected*rules.multipliers[lap-1]):expected);
   assert.equal(cardEffects(card,rules,lap).length,card.effects.length);
   checked++;
  }
 }
 assert.equal(checked,188*6*3);
});

test('4144 keeps official HANS effect/score unchanged but provisional displayed GS scales',async()=>{
 const {cardScore,cardMultiplier,cardEffects,cardId,gsRepresentativeJob}=await import('../src/laps.ts');
 const {cardGsContribution,isProvisionalGsCard}=await import('../src/card-ranking.ts');
 const osiris=catalog.cards.find(card=>card.id===4144),rules=catalog.lapRules;
 assert.ok(osiris);
 assert.deepEqual(rules.noScaleCardIds,[4144]);
 assert.ok(isProvisionalGsCard(osiris,rules));
 for(const scaling of ['melee','ranged','magic']){
  const job=gsRepresentativeJob(rules,scaling);
  for(let lap=1;lap<=6;lap++){
   assert.equal(cardMultiplier(osiris,rules,lap),1);
   assert.deepEqual(cardEffects(osiris,rules,lap),cardEffects(osiris,rules,1));
   assert.equal(cardScore(osiris,rules,lap,job),60,'HANS official source formula remains unchanged');
   assert.equal(cardGsContribution(osiris,rules,lap,job),Math.round(60*rules.multipliers[lap-1]),'Unverified displayed GS uses direct lap multiplier');
   assert.equal(cardId(osiris,rules,lap),4144+(lap-1)*1000000);
  }
 }
});

test('all 15 audited raid variants keep their separate 4.2x effects and are not silently given GS',async()=>{
 const {cardEffects,isRaidOnlyCard}=await import('../src/laps.ts');
 const {cardGsContribution,isProvisionalGsCard}=await import('../src/card-ranking.ts');
 const cards=catalog.cards.filter(c=>c.raid),rules=catalog.lapRules;
 const expectedIds=[4143,4534,4533,4980,4981,4456,4982,4983,4984,4601,4603,4985,4986,4145,4987];
 assert.deepEqual(cards.map(c=>c.id).sort((a,b)=>a-b),expectedIds.sort((a,b)=>a-b));
 assert.equal(cards.length,15);
 assert.equal(cards.filter(isRaidOnlyCard).length,14);
 for(const card of cards){
  assert.equal(card.raid.mult,4.2);
  assert.equal(cardEffects(card,rules,1,card.raid.mult).length,card.effects.length);
  assert.equal(isProvisionalGsCard(card,rules),false,'Raid cards must not use the Osiris estimate');
  if(isRaidOnlyCard(card))assert.equal(cardGsContribution(card,rules,1,'mage'),null);
 }
});

test('raid card variants are searchable and rank by the same score shown in details', async()=>{
 const {catalogCardVariants,cardGsContribution,rankCardsByGs}=await import('../src/card-ranking.ts');
 const {entryMatches}=await import('../src/search.ts');
 const {cardEffects,cardName}=await import('../src/laps.ts');
 const rules=catalog.lapRules;
 const cards=catalogCardVariants(catalog.cards,rules);
 const matches=cards.filter(card=>entryMatches(card,'獸人英雄','all'));
 assert.deepEqual(matches.map(card=>card.id),[4143,6004143]);
 assert.deepEqual(cards.filter(card=>entryMatches(card,'獸人英雄副本','all')).map(card=>card.id),[6004143]);
 assert.equal(cards.filter(card=>card.raidVariant).length,15);
 const [ordinary,raid]=matches;
 assert.equal(cardName(raid,rules,6),'獸人英雄卡片・副本');
 assert.deepEqual(cardEffects(raid,rules,6),['護甲 +12.6','HP +168']);
 assert.equal(cardGsContribution(ordinary,rules,1,'swordsman'),30);
 for(let lap=1;lap<=rules.max;lap++)assert.equal(cardGsContribution(raid,rules,lap,'swordsman'),92);
 assert.deepEqual(rankCardsByGs(matches,rules,1,'swordsman').map(({score})=>score),[92,30]);
 assert(raid.sources.every(source=>source.sourceType==='raid'));
 assert(ordinary.sources.every(source=>source.sourceType!=='raid'));
});
