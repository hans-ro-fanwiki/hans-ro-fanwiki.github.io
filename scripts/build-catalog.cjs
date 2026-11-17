// Generate a purpose-built factual index from local, gitignored research snapshots.
// Never export or commit upstream executable code, whole upstream catalogs or images.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.argv[2];
if (!root) throw Error('Provide local research snapshot directory');
const load=(name)=>JSON.parse(fs.readFileSync(path.join(root,name+'.js'),'utf8').split('RSW.'+name+' = ')[1].trim().replace(/;$/,''));
const [items,cards,monsters,stages]=['items','cards','monsters','stages'].map(load);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'current-official-asset-manifest.json'),'utf8'));
const soul=fs.readFileSync(path.join(root,'official-soul-linker.js'),'utf8');
const main=fs.readFileSync(path.join(root,'official-main.js'),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const mainSha=sha(fs.readFileSync(path.join(root,'official-main.js')));
const soulSha=sha(fs.readFileSync(path.join(root,'official-soul-linker.js')));
const manifestSha=sha(fs.readFileSync(path.join(root,'current-official-asset-manifest.json')));
const dropMap=new Map();
for (const m of soul.matchAll(/([a-z][a-z0-9_]*):\[((?:\{id:\d+,rate:\d+\},?)+)\]/g)){
 const vals=[...m[2].matchAll(/\{id:(\d+),rate:(\d+)\}/g)].map(x=>({id:Number(x[1]),rate:Number(x[2])}));
 if(vals.length) dropMap.set(m[1],vals);
}
function balanced(source,start,open='{',close='}'){
 let depth=0,quote=null,escaped=false;
 for(let i=start;i<source.length;i++){
  const c=source[i];
  if(quote){if(escaped) escaped=false; else if(c==='\\')escaped=true; else if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c===open)depth++; else if(c===close){depth--;if(depth===0)return source.slice(start,i+1);}
 }
 return '';
}
function readArrayVariable(name){
 const re=new RegExp('(?:^|[^\\w$])'+name.replace(/[$]/g,'\\$')+'=\\[');
 const m=re.exec(soul);
 return m ? balanced(soul,m.index+m[0].length-1,'[',']') : '';
}
const officialStages={};
for(const s of stages){
 const at=soul.indexOf(s.id+':{map:');
 if(at<0){officialStages[s.id]={pool:[],bosses:[],stageFound:false};continue;}
 const str=balanced(soul,soul.indexOf('{',at));
 const waveName=str.match(/waves:([A-Za-z0-9_$]+)/)?.[1];
 const bossName=str.match(/bosses:([A-Za-z0-9_$]+)/)?.[1];
 const waveSrc=waveName?readArrayVariable(waveName):'';
 const bossSrc=str.match(/bosses:\[/)?str.slice(str.indexOf('bosses:')+7):bossName?readArrayVariable(bossName):'';
 const pool=[...new Set([...waveSrc.matchAll(/pool:\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/"([^"]+)"/g)].map(a=>a[1])))];
 const bosses=[...new Set([...bossSrc.matchAll(/\{t:\d+,id:"([^"]+)"\}/g)].map(m=>m[1]))];
 officialStages[s.id]={pool,bosses,stageFound:true,waveName:waveName||null,extractable:!!waveSrc};
}
const imageOf=(collection,key,attribute)=> {
 const record=manifest[collection]?.[String(key)];
 const value=collection==='sprites'&&attribute==='json'&&typeof record==='string'?record:record?.[attribute];
 return value?{assetId:String(key),officialPath:value,rights:'not-cleared',renderAllowed:false}:null;
};
const stageOutput=stages.map(s=>({
 id:s.id,name:s.name,levels:s.levels,open:s.open===true,season:!!s.season,story:!!s.story,planned:!!s.planned,
 normalMonsterIds:officialStages[s.id].pool, bossMonsterIds:officialStages[s.id].bosses,
 candidatePoolCount:(s.pool||[]).length,candidateBossCount:(s.bosses||[]).length,
 provenance:{id:officialStages[s.id].stageFound?'official':'candidate',pool:officialStages[s.id].extractable?'official':'unknown',boss:officialStages[s.id].bosses.length?'official':'unknown',open:'candidate'}
}));
const stageByMonster=new Map();
for(const s of stageOutput)for(const id of s.normalMonsterIds.map(id=>[id,false]).concat(s.bossMonsterIds.map(id=>[id,true]))){
 const list=stageByMonster.get(id[0])||[];list.push({stageId:s.id,isBoss:id[1],stageOpen:s.open});stageByMonster.set(id[0],list);
}
const pickItems=items.filter(i=>i.slot==='acc'||(i.jobs||[]).includes('mage'));
const pickCards=cards.filter(c=>(c.bonuses||[]).some(x=>/冷卻|cooldown|CD/i.test(x)))
 .concat(cards.filter(c=>(c.bonuses||[]).some(x=>/爆擊/i.test(x))).slice(0,6));
const includeMonsterIds=new Set();
const remapSource=(ref,targetId,entity)=>{
 const type=ref.type==='drop'?'monsterDrop':ref.type==='festival'?'event':ref.type;
 const monsterId=ref.monster||null;
 if(monsterId) includeMonsterIds.add(monsterId);
 const officialDrop=monsterId && dropMap.get(monsterId)?.find(d=>d.id===Number(targetId));
 const parsed=!!officialDrop;
 const refs=monsterId?(stageByMonster.get(monsterId)||[]):[];
 const stages=type==='monsterDrop'?refs.map(x=>({
  stageId:x.stageId,boss:x.isBoss,verified:entity==='item'&&parsed===true,
  verificationState:entity==='item'&&parsed===true?'official':'candidate'
 })):[];
 return {sourceType:type,monsterId,stageRefs:stages,rawRate:entity==='item'&&parsed===true?officialDrop.rate:null,verificationState:entity==='item'&&parsed===true?'official':'candidate',
  evidence:entity==='item'&&parsed===true?{file:'soul_linker-BNTKE1pN.js',hash:soulSha,kind:'drop-table',key:monsterId+':'+targetId}:null};
};
const outItems=pickItems.map(i=>({
 id:i.id,name:i.zh||i.en,originalName:i.en,slot:i.slot,jobs:i.jobs||[],gender:i.gender||null,
 bonuses:i.bonuses||[],baseStats:i.base||null,starBonuses:i.sig||[],starBonusesMax:i.sigMax||[],sources:(i.sources||[]).map(s=>remapSource(s,i.id,'item')),
 image:imageOf('items',i.id,'art')||imageOf('items',i.id,'icon'),
 icon:imageOf('items',i.id,'icon'),
 fieldProvenance:{name:'candidate',slot:soul.includes('Z('+i.id+',"'+i.slot+'"')?'official':'candidate',jobs:'candidate'},
}));
const outCards=pickCards.map(c=>({
 id:c.id,name:c.zh||c.en,originalName:c.en,monsterId:c.monster||null,
 bonuses:c.bonuses||[],tags:(c.bonuses||[]).some(s=>/冷卻|cooldown|CD/i.test(s))?['cooldown']:['crit'],
 equipSlot:c.compoundName||c.compound||null,
 sources:(c.sources||[]).map(s=>remapSource(s,c.id,'card')),image:imageOf('cards',c.id,'image'),
 fieldProvenance:{name:'candidate',bonuses:'candidate',monster:'candidate'},
}));
for(const c of outCards)if(c.monsterId)includeMonsterIds.add(c.monsterId);
const outMonsters=monsters.filter(m=>includeMonsterIds.has(m.id)).map(m=>({
 id:m.id,name:m.zh||m.en,boss:!!m.boss,
 stages:(stageByMonster.get(m.id)||[]).map(x=>({id:x.stageId,boss:x.isBoss,verified:true})),
 sprite:imageOf('sprites',m.id,'json'),
 fieldProvenance:{name:'candidate',stage:'official',boss:'candidate'},
}));
const catalog={
 schemaVersion:1,generatedAt:'2026-11-17',sourceVersion:'20261115_09c52f73',
 official:{main:{file:'main-2n_YvaNQ.js',sha256:mainSha},soul:{file:'soul_linker-BNTKE1pN.js',sha256:soulSha},
 manifest:{file:'assets/manifest.json',sha256:manifestSha},baseUrl:'https://ro-survivors.com'},
 policy:'candidate fields are not promoted to official without matching source evidence; unknown rights mean no remotely loaded game art',
 items:outItems,cards:outCards,monsters:outMonsters,stages:stageOutput
};
fs.writeFileSync('public/data/catalog.json',JSON.stringify(catalog,null,2)+'\n');
const allReferences=outItems.flatMap(i=>i.sources);
const official=allReferences.filter(s=>s.verificationState==='official');
const withStage=official.flatMap(s=>s.stageRefs.filter(r=>r.verified));
const report={
 generatedAt:catalog.generatedAt,officialBundles:catalog.official,
 candidateTotals:{stages:stages.length,items:items.length,cards:cards.length,monsters:monsters.length},
 previewSubset:{stages:stageOutput.length,items:outItems.length,cards:outCards.length,monsters:outMonsters.length},
 officialStagePools:stageOutput.filter(s=>s.provenance.pool==='official').length,
 officialBossLists:stageOutput.filter(s=>s.provenance.boss==='official').length,
 officialItemMonsterDrops:official.length,
 fullVerifiedStageDropEdges:withStage.length,
 imageCoverage:{itemsWithAsset:outItems.filter(x=>x.icon).length,cardsWithAsset:outCards.filter(x=>x.image).length,allAssetsRights:'not-cleared'},
 sample:outItems.filter(x=>x.id===2603).map(x=>({id:x.id,slot:x.slot,sources:x.sources})),
 unresolved:['Card bonus meanings need separate official-effect mapping','Jobs array values require verifying game equip-rule logic','Open/season status is still based on candidate catalog','Drop rate weights are NOT player probabilities','Asset copying/hotlinking rights not granted']
};
fs.writeFileSync('docs/SOURCE_AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts:report.previewSubset,officialStagePools:report.officialStagePools,officialBossLists:report.officialBossLists,officialDropEdges:report.fullVerifiedStageDropEdges,sample:report.sample},null,2));
