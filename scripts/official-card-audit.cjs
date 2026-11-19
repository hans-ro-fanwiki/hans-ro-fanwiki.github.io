// Read-only reconciliation of explicit game card registrations + stage/loot rules.
// Official game source code stays inside gitignored evidence; only ID joins are published.
const assert=require('node:assert/strict');

const SLOT_LABELS={armor:'護甲',accessory:'飾品',garment:'披肩',headgear:'頭飾',weapon:'武器',shield:'盾牌',shoes:'鞋子'};
const BALL_LABELS=['節慶扭蛋','白素貞扭蛋','蛇王扭蛋'];

function cardRegistry(source) {
  const registrations=[...source.matchAll(/ye\((\d+),"([a-z][a-z0-9_]*)","([a-z]+)",\[/g)]
    .map(m=>({id:Number(m[1]),monster:m[2],slot:m[3]}));
  const indexed=new Map(registrations.map(x=>[x.id,x]));
  assert.equal(registrations.length,98,'Official card registry changed');
  assert.equal(indexed.size,registrations.length,'Duplicate official card ID');
  return indexed;
}
function festivalCardPools(main) {
  const rx=/\["Bola del Festival","Bola de White Lady","Bola de Evil Snake Lord"\],[A-Za-z_$][\w$]*=\[[\d,]+\],[A-Za-z_$][\w$]*=(\[\[[\d,]+\],\[[\d,]+\],\[[\d,]+\]\])/;
  const hit=rx.exec(main);
  assert.ok(hit,'Official three-ball festival card table changed');
  const pools=JSON.parse(hit[1]);
  assert.deepEqual(pools.map(p=>p.length),[9,1,1],'Festival card pool size changed');
  assert.equal(new Set(pools.flat()).size,11,'Festival card pool contains duplicate IDs');
  return pools;
}
function confirmNormalCardMechanics(main) {
  const at=main.indexOf('this.dropPickup("card"');
  assert.ok(at>=0,'Client monster card pickup logic missing');
  const context=main.slice(Math.max(0,at-900),at+150);
  assert.match(context,/this\.isStory\|\|/,'Story stages must suppress normal card drops');
  assert.match(context,/!!this\.script\.season/,'Season stages must suppress normal card drops');
  assert.match(context,/this\.serverDrops/,'Server-authoritative loot path changed');
  assert.match(context,/def\.id/,'Card pickup must be tied to monster definition ID');
}
function reviewCardSources(catalog,main,soul,stageSources,fileNames,hashes) {
  confirmNormalCardMechanics(main);
  const registry=cardRegistry(soul);
  const pools=festivalCardPools(main);
  const ballById=new Map(pools.flatMap((ids,index)=>ids.map(id=>[id,BALL_LABELS[index]])));
  assert.equal(catalog.cards.length,98,'Wiki card inventory changed');
  const eventBefore=catalog.cards.filter(c=>c.sources.some(s=>s.sourceType==='event')).map(c=>c.id).sort((a,b)=>a-b);
  const eventNow=[...ballById.keys()].sort((a,b)=>a-b);
  assert.deepEqual(eventBefore,eventNow,'Activity card IDs changed');
  let normalAvailable=0,notInAvailableStage=0;
  const unresolved=[];
  for(const card of catalog.cards) {
    const official=registry.get(card.id);
    assert.ok(official,'Card missing from official registry: '+card.id);
    assert.equal(card.monsterId,official.monster,'Card monster changed: '+card.id);
    assert.equal(card.equipSlot,SLOT_LABELS[official.slot],'Card equip slot changed: '+card.id);
    const ball=ballById.get(card.id);
    if(ball) {
      card.sources=[{
        sourceType:'event',detail:'燈籠節 · '+ball,monsterId:null,stageRefs:[],
        rawRate:null,verificationState:'official',
        evidence:{file:fileNames[0],hash:hashes[0],kind:'festival-ball-card-pool',key:ball+':'+card.id}
      }];
      card.fieldProvenance.sources='official';
      card.fieldProvenance.equipSlot='official';
      continue;
    }
    // Ordinary cards are obtainable from their corresponding monster's normal
    // card-drop rule only when the stage is currently playable and not story/event.
    const available=[...stageSources.entries()].flatMap(([id,stage])=>{
      if(!stage)return[];
      const meta=catalog.stages.find(s=>s.id===id);
      if(!meta?.open||stage.storyOnly||stage.season)return[];
      if(stage.normal.includes(official.monster))return[{stageId:id,boss:false}];
      if(stage.mini.includes(official.monster))return[{stageId:id,boss:true}];
      return[];
    });
    assert.ok(available.length<=2,'Unexpected card stage count: '+card.id);
    const verified=available.length>0;
    const earlier=card.sources.flatMap(s=>s.stageRefs);
    const stageRefs=verified
      ?available.map(s=>({...s,verified:true,verificationState:'official'}))
      :earlier.map(r=>({...r,verified:false,verificationState:'candidate'}));
    card.sources=[{
      sourceType:'monsterDrop',monsterId:official.monster,stageRefs,
      rawRate:null,verificationState:verified?'official':'candidate',
      evidence:verified?{file:fileNames[1],hash:hashes[1],kind:'card-registry-plus-normal-stage-and-loot-rule',key:official.monster+':'+card.id}:null
    }];
    card.fieldProvenance.equipSlot='official';
    card.fieldProvenance.sources=verified?'official':'candidate';
    if(verified)normalAvailable++;
    else {
      notInAvailableStage++;
      unresolved.push({id:card.id,name:card.name,monster:official.monster,candidateStageRefs:stageRefs.map(s=>s.stageId)});
    }
  }
  assert.equal(normalAvailable,77,'Confirmed normal-world card stage count changed');
  assert.equal(notInAvailableStage,10,'Unresolved/quest card count changed');
  assert.equal(normalAvailable+notInAvailableStage+ballById.size,98);
  return {registered:registry.size,confirmedNormal:normalAvailable,eventByBall:Object.fromEntries(BALL_LABELS.map((label,i)=>[label,pools[i].length])),unresolved,unresolvedCount:notInAvailableStage};
}
module.exports={cardRegistry,festivalCardPools,confirmNormalCardMechanics,reviewCardSources};
