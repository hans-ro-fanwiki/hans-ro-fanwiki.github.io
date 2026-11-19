// One-time, review-gated reconciliation of the current official client snapshot.
// Upstream JS and original assets stay in the gitignored evidence folder.
// Do not execute upstream code, infer drop percentages, or auto-deploy this output.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {sourceStageTiers} = require('./catalog-enrichment.cjs');
const {reviewCardSources} = require('./official-card-audit.cjs');
const {reviewEquipmentDefinitions} = require('./official-equipment-audit.cjs');

function sha(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function balanced(src, start, open='{', close='}') {
  let quote=null, escape=false, depth=0;
  for(let i=start;i<src.length;i++) {
    const c=src[i];
    if(quote) { if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue; }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c===open)depth++;else if(c===close&&!--depth)return src.slice(start,i+1);
  }
  throw Error('Unterminated official syntax at '+start);
}
function readArray(src,name) {
  const re = new RegExp('(?:^|[^\\w$])'+name.replace(/\\$/g,'\\$')+'=\\[');
  const hit = re.exec(src);
  return hit ? balanced(src,hit.index+hit[0].length-1,'[',']') : '';
}
function parseStages(src,stages) {
  const parsed = new Map();
  for(const stage of stages) {
    const marker=stage.id+':{map:';
    const at=src.indexOf(marker);
    if(at<0) { parsed.set(stage.id,null);continue; }
    const literal=balanced(src,at+stage.id.length+1);
    const waves=literal.match(/waves:([A-Za-z0-9_$]+)/)?.[1];
    const bosses=literal.match(/bosses:([A-Za-z0-9_$]+)/)?.[1];
    const waveText=waves?readArray(src,waves):'';
    const bossAt=literal.indexOf('bosses:[');
    const bossText=bossAt>=0?balanced(literal,literal.indexOf('[',bossAt),'[',']'):(bosses?readArray(src,bosses):'');
    const normal=[...new Set([...waveText.matchAll(/pool:\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1])))];
    const mini=[...new Set([...bossText.matchAll(/\{t:\d+,id:"([^"]+)"\}/g)].map(m=>m[1]))];
    assert.ok(waveText&&normal.length,'Official stage waves changed: '+stage.id);
    assert.ok(mini.length,'Official stage bosses changed: '+stage.id);
    const rare=literal.match(/rare:\{id:"([a-z0-9_]+)"/)?.[1]||null;
    const storyOnly=/storyOnly:!0/.test(literal);
    const season=/season:!0/.test(literal);
    parsed.set(stage.id,{normal,mini,rare,storyOnly,season});
  }
  return parsed;
}
function officialNames(soul,original) {
  let value=null;
  for(const needle of [JSON.stringify(original)+':"',original+':"']) {
    let from=200000;
    while(true) {
      const i=soul.indexOf(needle,from);
      if(i<0||i>350000)break;
      const end=soul.indexOf('"',i+needle.length);
      if(end<0)break;
      const candidate=soul.slice(i+needle.length,end);
      if(/[\u3400-\u9fff]/.test(candidate))value=candidate;
      from=i+needle.length;
    }
  }
  return value;
}
function setName(entry,next) {
  if(entry.name!==next) {
    entry.nameAliases=[...new Set([...(entry.nameAliases||[]),entry.name])];
    entry.name=next;
  }
  entry.fieldProvenance.name='official';
}
function removeShadowAliases(entries) {
  const names=new Set(entries.map(x=>x.name));
  for(const x of entries) {
    const aliases=[...new Set(x.nameAliases||[])].filter(a=>a!==x.name&&!names.has(a));
    if(aliases.length)x.nameAliases=aliases;else delete x.nameAliases;
  }
}
function extractFestival(soul) {
  const start=soul.search(/const [A-Za-z_$][\w$]*="faroles"/);
  const end=soul.indexOf('const ZN=',start);
  assert.ok(start>0&&end>start,'Festival item registry missing');
  const segment=soul.slice(start,end);
  const pairs=[...segment.matchAll(/\[(\d+),(\d+)\]/g)].map(m=>Number(m[2]));
  const newIds=[...segment.matchAll(/zo\((\d+),/g)].map(m=>Number(m[1]));
  const result=new Set([...pairs,...newIds]);
  assert.equal(result.size,50,'Festival equipment count changed; require manual review');
  return result;
}
function extractStarter(soul) {
  const match=/sK=\{([^}]+)\},eG=\{/.exec(soul);
  assert.ok(match,'Initial equipment registry changed');
  const ids=[...match[1].matchAll(/\[([^\]]+)\]/g)].flatMap(m=>m[1].split(',').map(Number));
  const result=new Set(ids);
  assert.equal(result.size,9,'Initial equipment registry changed; review required');
  return result;
}
function officialDrops(soul) {
  const dropMap=new Map();
  for(const m of soul.matchAll(/([a-z][a-z0-9_]*):\[((?:\{id:\d+,rate:(?:\d+(?:e\d+)?)\},?)+)\]/g)) {
    const values=[...m[2].matchAll(/\{id:(\d+),rate:(\d+(?:e\d+)?)\}/g)].map(x=>({id:Number(x[1]),rate:Number(x[2])}));
    if(values.length)dropMap.set(m[1],values);
  }
  assert.ok(dropMap.size>35,'Official drop tables no longer match known grammar');
  return dropMap;
}

function main() {
  const evidence=process.argv[2]||'evidence/current-source-20261118';
  const buffers=['official-main.js','official-soul-linker.js','current-official-asset-manifest.json'].map(name=>fs.readFileSync(path.join(evidence,name)));
  const [main,soul]=buffers.map(b=>b.toString('utf8'));
  const manifest=JSON.parse(buffers[2].toString('utf8'));
  const hashes=buffers.map(sha);
  const sourceFiles=JSON.parse(fs.readFileSync(path.join(evidence,'source-names.json'),'utf8'));
  assert.match(sourceFiles.main,/^main-[A-Za-z0-9_-]+\.js$/);
  assert.match(sourceFiles.soul,/^soul_linker-[A-Za-z0-9_-]+\.js$/);
  const fileNames=[sourceFiles.main,sourceFiles.soul,'assets/manifest.json'];
  const catalogPath='public/data/catalog.json', auditPath='docs/SOURCE_AUDIT.json';
  const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
  const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
  const tiers=sourceStageTiers(main,hashes[0]);
  const stageSources=parseStages(soul,catalog.stages);
  for(const stage of catalog.stages) {
    assert.equal(stage.tier,tiers.get(stage.id),'Stage Tier changed: '+stage.id);
    const actual=stageSources.get(stage.id);
    if(actual) {
      if(stage.provenance.pool==='official')assert.deepEqual(actual.normal,stage.normalMonsterIds,'Stage waves changed: '+stage.id);
      if(stage.provenance.boss==='official')assert.deepEqual(actual.mini,stage.bossMonsterIds,'Boss list changed: '+stage.id);
      stage.normalMonsterIds=actual.normal;
      stage.bossMonsterIds=actual.mini;
      stage.story=actual.storyOnly;
      stage.season=actual.season;
      stage.provenance.story='official';
      stage.provenance.season='official';
    }
  }
  const festival=extractFestival(soul),starter=extractStarter(soul),drops=officialDrops(soul);
  const equipmentAudit=reviewEquipmentDefinitions(catalog,soul);
  const itemIds=new Set(catalog.items.map(i=>i.id));
  assert.ok([...festival,...starter].every(id=>itemIds.has(id)),'Official equipment ID not indexed');
  const oldEvents=new Set(catalog.items.filter(i=>i.sources.some(s=>s.sourceType==='event')).map(i=>i.id));
  assert.deepEqual([...festival].sort((a,b)=>a-b),[...oldEvents].sort((a,b)=>a-b),'Festival source set changed unexpectedly');
  let changedNames=0,verifiedDrops=0,verifiedFestival=0,verifiedStarter=0;
  const translations={};
  for(const [kind,items] of [['items',catalog.items],['cards',catalog.cards]]) {
    for(const item of items) {
      const manifestEntry=manifest[kind]?.[String(item.id)];
      assert.ok(manifestEntry,'Current official manifest missing '+kind+' #'+item.id);
      assert.equal(manifestEntry.name,item.originalName,'Item name/ID pairing changed: '+kind+' '+item.id);
      const translated=officialNames(soul,item.originalName);
      assert.ok(translated,'Official localized name missing: '+kind+' '+item.id);
      if(translated!==item.name){changedNames++;translations[item.id]=[item.name,translated];}
      setName(item,translated);
    }
    removeShadowAliases(items);
  }
  const monsterMap=new Map(catalog.monsters.map(m=>[m.id,m]));
  for(const card of catalog.cards) {
    const monster=monsterMap.get(card.monsterId);
    if(monster&&card.name.endsWith('卡片'))setName(monster,card.name.slice(0,-2));
  }
  removeShadowAliases(catalog.monsters);
  // Keep monster appearance links in sync with official wave, boss and rare-spawn tables.
  for(const monster of catalog.monsters){
    const confirmed=[...stageSources.entries()].flatMap(([id,stage])=>{
      if(!stage)return [];
      const boss=stage.mini.includes(monster.id)||stage.rare===monster.id;
      if(!boss&&!stage.normal.includes(monster.id))return [];
      return [{id,boss,verified:true}];
    });
    const candidates=monster.stages.filter(s=>!confirmed.some(r=>r.id===s.id)).map(s=>({...s,verified:false}));
    monster.stages=[...confirmed,...candidates];
    if(confirmed.length)monster.fieldProvenance.stages='official';
  }
  const cardAudit=reviewCardSources(catalog,main,soul,stageSources,fileNames,hashes);
  for(const item of catalog.items) {
    if(festival.has(item.id)) {
      verifiedFestival++;
      item.sources=[{
        sourceType:'event',detail:'燈籠節限定扭蛋',sourceTier:2,
        monsterId:null,stageRefs:[],rawRate:null,verificationState:'official',
        evidence:{file:fileNames[1],hash:hashes[1],kind:'seasonal-item-registry',key:'faroles:'+item.id}
      }];
      continue;
    }
    if(starter.has(item.id)) {
      verifiedStarter++;
      item.sources=[{
        sourceType:'starter',detail:'角色初始裝備',monsterId:null,stageRefs:[],
        rawRate:null,verificationState:'official',
        evidence:{file:fileNames[1],hash:hashes[1],kind:'starter-gear-registry',key:'starter:'+item.id}
      }];
      continue;
    }
    for(const ref of item.sources.filter(s=>s.sourceType==='monsterDrop')) {
      const matched=drops.get(ref.monsterId)?.find(d=>d.id===item.id);
      assert.ok(matched,'Previously indexed monster drop missing in latest official data: '+item.id+' '+ref.monsterId);
      assert.ok(ref.stageRefs.filter(r=>r.verified).every(r=>{
        const stage=stageSources.get(r.stageId);
        return stage&&(r.boss?stage.mini:stage.normal).includes(ref.monsterId);
      }),'Previously verified monster-stage association changed: '+item.id+' '+ref.monsterId);
      ref.verificationState='official';
      ref.rawRate=matched.rate;
      ref.evidence={file:fileNames[1],hash:hashes[1],kind:'drop-table',key:ref.monsterId+':'+item.id};
      for(const stage of ref.stageRefs){
        const current=stageSources.get(stage.stageId);
        stage.verified=!!current&&(stage.boss?current.mini:current.normal).includes(ref.monsterId);
        stage.verificationState=stage.verified?'official':'candidate';
      }
      verifiedDrops++;
    }
    // Story/reward claims remain candidates until their award path is audited.
  }
  catalog.generatedAt='2026-11-19';
  catalog.sourceVersion='20261119-reviewed-local';
  catalog.official={
    main:{file:fileNames[0],sha256:hashes[0]},
    soul:{file:fileNames[1],sha256:hashes[1]},
    manifest:{file:fileNames[2],sha256:hashes[2]},
    baseUrl:'https://ro-survivors.com'
  };
  audit.generatedAt='2026-11-19';
  audit.officialBundles=catalog.official;
  // Reviewed thumbnail derivatives remain pinned to their own original source manifest.
  audit.thumbnailSourceManifestSha256=JSON.parse(fs.readFileSync('public/fan-thumbs/manifest.json','utf8')).sourceManifestSha256;
  audit.officialItemMonsterDrops=verifiedDrops;
  audit.officialCards=cardAudit;
  audit.officialEquipmentDefinitions=equipmentAudit;
  audit.fullVerifiedStageDropEdges=catalog.items.flatMap(i=>i.sources).filter(s=>s.sourceType==='monsterDrop').flatMap(s=>s.stageRefs).filter(r=>r.verified).length;
  audit.verifiedFestivalItems=verifiedFestival;
  audit.verifiedStarterItems=verifiedStarter;
  audit.officialNameMatches={items:catalog.items.length,cards:catalog.cards.length,changed:changedNames};
  audit.unresolved=[
    'Unverified story/reward items and 96 source-less items remain hidden by default',
    'Card monster IDs, compound slots, normal-stage joins and festival ball pools checked; localized card effect numbers remain candidate until separately reconciled',
    'Festival equipment ball distribution by rarity is not separately verified; card balls are verified',
    'Noncommercial third-party image permissions have not been established'
  ];
  audit.sample=catalog.items.filter(i=>i.id===2603).map(i=>({id:i.id,slot:i.slot,sources:i.sources}));
  const counts={
    reviewedNames:catalog.items.length+catalog.cards.length,changedNames,translations,
    verifiedFestival,verifiedStarter,verifiedDrops,cardAudit,equipmentAudit,
    noSources:catalog.items.filter(i=>!i.sources.length).length,
    remainingCandidate:catalog.items.filter(i=>i.sources.length>0&&!i.sources.some(s=>s.verificationState==='official')).length
  };
  fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
  fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
  console.log(JSON.stringify(counts,null,2));
}
main();
