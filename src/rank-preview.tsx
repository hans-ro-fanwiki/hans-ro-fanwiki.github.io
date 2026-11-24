import {useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {Catalog,Equipment,ImageEvidence} from './types';
import type {TalentCatalog} from './talents';
import {localizeTalentCatalog} from './talent-zh';
import type {HANSNames} from './talent-zh';
import {cardName} from './laps';
import {catalogCardVariants} from './card-ranking';
import {addRaidSources} from './raids';
import {profileTalents} from './rank-preview-data';
import type {GearAffix,RankedGear,RankRow,RankSnapshot} from './rank-preview-data';
import './wiki-theme.css';
import './rank-preview.css';

const assetOrigin='https://ro.hans-webgametw.com/assets/';
const slots:Record<string,string>={weapon:'武器',shield:'副手',armor:'衣服',garment:'披肩',shoes:'鞋子',
 head_top:'頭上',head_mid:'頭中',head_low:'頭下',acc1:'飾品一',acc2:'飾品二'};
const quality=['普通','優良','稀有','史詩','傳說'];
const stats:Record<string,string>={str:'STR',agi:'AGI',vit:'VIT',int:'INT',dex:'DEX',luk:'LUK',atk:'ATK',matk:'MATK',
 hp:'HP',armor:'護甲',regen:'生命回復'};
const percentStats:Record<string,string>={skill:'技能傷害',crit:'爆擊率',critDmg:'爆擊傷害',flee:'迴避',cd:'急速',
 spd:'移動速度',area:'範圍',cast:'施法急速',dr:'減傷',stun:'暈眩',boss:'首領傷害',dot:'持續傷害',
 reach:'近戰距離',proj:'投射物速度',zeny:'金幣獲取',pickup:'拾取範圍',potion:'藥水效果',lowHp:'低血量傷害'};
const records:Record<string,string>={bestLevel:'單場最高等級',runs:'總場次',wins:'勝場',totalKills:'累計擊殺',mvps:'擊倒 MVP'};
const fmt=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:3});
const date=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',dateStyle:'short',timeStyle:'short'});
const root=new URL(location.pathname.replace(/520520520(?:\/index\.html)?\/?$/,''),location.origin);

function gearAffix(affix:GearAffix,skills:Map<string,string>){
 const label=affix.stat==='skill'&&affix.skill?(skills.get(affix.skill)||affix.skill)+' 傷害':percentStats[affix.stat]||stats[affix.stat]||affix.stat;
 const percent=Object.hasOwn(percentStats,affix.stat);
 return label+' '+(affix.value>=0?'+':'')+fmt.format(percent?affix.value*100:affix.value)+(percent?'%':'');
}
function Icon({image}:{image?:ImageEvidence|null}){
 const [failed,setFailed]=useState(false);
 return !failed&&image&&/^items\/[a-z0-9_-]+\.png$/i.test(image.officialPath)
  ?<img className="rank-icon" src={assetOrigin+image.officialPath} loading="lazy" onError={()=>setFailed(true)} alt=""/>
  :<span className="rank-icon rank-icon-empty" aria-hidden="true"/>;
}
type WikiData={snapshot:RankSnapshot;catalog:Catalog;talents:TalentCatalog;skills:HANSNames};

function Character({row,data}:{row:RankRow;data:WikiData}){
 const {catalog,talents,skills}=data;
 const items=useMemo(()=>new Map(catalog.items.map(item=>[item.id,item])),[catalog]);
 const skillNames=useMemo(()=>new Map(skills.skills.map(skill=>[skill.id,skill.name])),[skills]);
 const cards=useMemo(()=>new Map(catalogCardVariants(catalog.cards,catalog.lapRules).map(card=>[card.id,card])),[catalog]);
 const {tree,groups,unknown}=useMemo(()=>profileTalents(talents,row),[talents,row]);
 const jobName=catalog.lapRules.jobs.find(job=>job.id===(row.promotion||row.job))?.name||row.promotion||row.job;
 const profile=row.profile;
 function showCard(cardId:number){
  const base=cardId%catalog.lapRules.cardStep;
  const lap=Math.floor(cardId/catalog.lapRules.cardStep)+1;
  const card=cards.get(cardId)||cards.get(base);
  return {name:card?cardName(card,catalog.lapRules,lap):'卡片 #'+cardId,
   link:card?new URL('?page=cards&lap='+(card.raidVariant?1:lap)+'&detail=card%3A'+card.id,root).href:null};
 }
 if(!profile)return <section className="rank-profile"><h2>{row.name}</h2><p>這次擷取沒有取得此角色的配裝與天賦。</p></section>;
 return <section className="rank-profile">
  <div className="rank-profile-head">
   <div><h2>{row.name}</h2><p>{jobName} · Base {profile.level} · Job {profile.jobLevel}{profile.reb?' · 轉生 '+profile.reb+' 次':''}</p></div>
   <strong className="rank-score">{fmt.format(profile.gs??row.score)} <small>GS</small></strong>
  </div>
  <p className="rank-muted">角色快照 {date.format(new Date(profile.capturedAt))}{profile.gs!==row.score?' · 榜單戰力 '+fmt.format(row.score):''}</p>
  <dl className="rank-stats" aria-label="基礎屬性">{Object.entries(profile.stats).map(([name,value])=><div key={name}><dt>{stats[name]||name}</dt><dd>{fmt.format(value)}</dd></div>)}</dl>
  <div className="rank-section-head">
   <h3>天賦配點</h3>
   {tree&&<a className="rank-action" href={new URL('?t='+tree,root).href} target="_blank" rel="noopener">在維基天賦樹開啟</a>}
  </div>
  <div className="rank-talents">
   {groups.map(group=><details key={group.id}><summary>{group.name} · {group.points} 點</summary>
    {group.branches.length?group.branches.map((branch,i)=><section key={i}><h4>{branch.name}</h4>
     <ul>{branch.nodes.map((node,j)=><li key={j}><span>{node.label}</span><b>{node.points}</b></li>)}</ul></section>)
     :<p className="rank-muted">沒有已分配節點</p>}
   </details>)}
   {unknown.length>0&&<details><summary>尚未對照的天賦節點（{unknown.length}）</summary>
    <ul>{unknown.map(([id,points])=><li key={id}><span>{id}</span><b>{points}</b></li>)}</ul>
   </details>}
   {!tree&&Object.keys(profile.talents).length>0&&<p className="rank-muted">這份配點保留在下拉明細中，現有天賦樹版本無法完整還原。</p>}
  </div>
  <h3>配裝</h3>
  <div className="rank-gear">{profile.gear.map(item=><Gear key={item.slot} item={item} entry={items.get(item.itemId)} skills={skillNames} showCard={showCard}/>)}</div>
  {Object.keys(profile.record).some(key=>records[key])&&<details className="rank-record"><summary>角色紀錄</summary>
   <dl className="rank-stats">{Object.entries(profile.record).filter(([key])=>records[key]).map(([key,value])=><div key={key}><dt>{records[key]}</dt><dd>{fmt.format(value)}</dd></div>)}</dl>
  </details>}
 </section>;
}
function Gear({item,entry,skills,showCard}:{item:RankedGear;entry?:Equipment;skills:Map<string,string>;showCard:(id:number)=>{name:string;link:string|null}}){
 const cards=item.cards?.filter(Boolean)||[];
 const counted=[...new Set(cards)].map(id=>({id,count:cards.filter(card=>card===id).length,...showCard(id)}));
 return <article className="rank-item">
  <div className="rank-item-head">
   <Icon image={entry?.icon||entry?.image}/>
   <div><span className="rank-muted">{slots[item.slot]||item.slot}</span>
    <h4>{entry?<a href={new URL('?detail=item%3A'+item.itemId,root).href}>{entry.name}</a>:'裝備 #'+item.itemId}</h4>
    <p className="rank-muted">{[item.tier&&'T'+item.tier,item.quality!=null&&quality[item.quality],item.ilvl&&'裝等 '+item.ilvl,
      item.refine&&'精煉 +'+item.refine,item.star&&item.star+' 星'].filter(Boolean).join(' · ')}</p>
   </div>
  </div>
  {counted.length>0&&<p className="rank-item-cards">{counted.map(card=><span key={card.id}>{card.link?<a href={card.link}>{card.name}</a>:card.name}{card.count>1?' ×'+card.count:''}</span>)}</p>}
  {item.affixes.length>0&&<p className="rank-item-affixes">{item.affixes.map(affix=>gearAffix(affix,skills)).join(' · ')}</p>}
  {item.ex&&<p className="rank-item-affixes">刻印 · {gearAffix(item.ex,skills)}</p>}
 </article>;
}

function App(){
 const [data,setData]=useState<WikiData|null>(null);
 const [error,setError]=useState(false);
 const params=new URLSearchParams(location.search);
 const [boardId,setBoard]=useState(params.get('job')||'');
 const [rank,setRank]=useState(Number(params.get('rank'))||1);
 const [query,setQuery]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  const load=async(path:string)=>{
   const response=await fetch(new URL(path,root),{signal:controller.signal});
   if(!response.ok)throw Error(path);
   return response.json();
  };
  Promise.all([load('520520520/snapshot.json'),load('data/catalog.json'),load('data/talents.json'),load('data/skills.json')])
   .then(([snapshot,catalog,talents,skills])=>setData({snapshot,catalog:addRaidSources(catalog),talents:localizeTalentCatalog(talents,skills),skills}))
   .catch(error=>{if(error.name!=='AbortError')setError(true)});
  return ()=>controller.abort();
 },[]);
 const board=data?.snapshot.boards.find(board=>board.id===boardId)||data?.snapshot.boards[0];
 const row=board?.rows.find(row=>row.rank===rank)||board?.rows[0];
 const term=query.trim().toLocaleLowerCase();
 const matches=term?data?.snapshot.boards.flatMap(board=>board.rows.filter(row=>row.name.toLocaleLowerCase().includes(term)).map(row=>({board,row})))||[]:[];
 const choose=(job:string,next:number)=>{
  setBoard(job);setRank(next);
  const url=new URL(location.href);
  url.searchParams.set('job',job);url.searchParams.set('rank',String(next));
  history.replaceState(null,'',url);
 };
 return <main className="rank-shell">
  <header className="rank-header"><a className="rank-home" href={root.href}>← HANS 粉絲維基</a><h1>角色戰力快照</h1>
   {data&&<p>取自 HANS 戰力榜 · 擷取於 {date.format(new Date(data.snapshot.capturedAt))}（台灣時間）</p>}
  </header>
  {error?<p role="alert">暫存資料載入失敗，請重新整理。</p>:!data?<p role="status">讀取排行榜快照中…</p>:<>
   <div className="rank-filters">
    <label className="rank-select">職業系
     <select value={board?.id||''} onChange={event=>choose(event.target.value,1)}>
      {data.snapshot.boards.map(board=><option key={board.id} value={board.id}>{board.name}系</option>)}
     </select>
    </label>
    <label className="rank-select">查角色
     <input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜尋本次快照的角色名稱"/>
    </label>
   </div>
   {term&&<div className="rank-matches" aria-label="角色搜尋結果">
    {matches.length?matches.map(({board,row})=><button type="button" key={board.id+row.rank} onClick={()=>{choose(board.id,row.rank);setQuery('')}}>
     {row.name} · {board.name}系第 {row.rank} 名
    </button>):<p className="rank-muted">本次快照沒有這個角色。</p>}
   </div>}
   <div className="rank-layout">
    <section className="rank-board" aria-label="戰力排行前五名">
     <h2>{board?.name}系前五名</h2>
     {board&&<p className="rank-muted">榜單時間 {date.format(new Date(board.rankedAt))} · 共 {fmt.format(board.total)} 名</p>}
     <ol>{board?.rows.map(entry=><li key={entry.rank}><button type="button" aria-pressed={entry===row} onClick={()=>choose(board.id,entry.rank)}>
      <span className="rank-number">{entry.rank}</span><span className="rank-person"><b>{entry.name}</b><small>{data.catalog.lapRules.jobs.find(job=>job.id===(entry.promotion||entry.job))?.name||entry.promotion||entry.job}</small></span>
      <span className="rank-score">{fmt.format(entry.score)} <small>GS</small></span>
     </button></li>)}</ol>
    </section>
    {row&&<Character key={row.name} row={row} data={data}/>}
   </div>
  </>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
