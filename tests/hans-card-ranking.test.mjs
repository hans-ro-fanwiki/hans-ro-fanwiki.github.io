import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/catalog.json',import.meta.url),'utf8'));

test('all 188 scoreable cards sort before paging and match detail GS across three classes and six laps',async()=>{
 const {rankCardsByGs}=await import('../src/card-ranking.ts');
 const {cardScore,gsRepresentativeJob,isRaidOnlyCard}=await import('../src/laps.ts');
 const included=catalog.cards.filter(c=>!isRaidOnlyCard(c));
 assert.equal(included.length,188);
 for(const type of ['melee','ranged','magic'])for(let lap=1;lap<=6;lap++){
  const job=gsRepresentativeJob(catalog.lapRules,type);
  const rows=rankCardsByGs(catalog.cards,catalog.lapRules,lap,job);
  assert.equal(rows.length,included.length);
  assert.deepEqual(new Set(rows.map(r=>r.card.id)),new Set(included.map(c=>c.id)));
  for(const row of rows)assert.equal(row.score,cardScore(row.card,catalog.lapRules,lap,job));
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
   assert.equal(preview,isRaidOnlyCard(card)?null:cardScore(card,catalog.lapRules,lap,job));
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
