import {useEffect,useMemo,useState} from 'react';
import {
 ArrowRight,BookOpen,Check,ChevronDown,ChevronUp,Copy,Crosshair,Droplets,ExternalLink,
 Flame,Footprints,Gem,Heart,Leaf,Link2,Minus,Mountain,Plus,RotateCcw,Share2,
 Shield,Snowflake,Sparkles,Star,Sun,Swords,Target,Wind,Workflow,X,Zap,Skull,
 WandSparkles,Sword,Hand,ShieldCheck,CloudLightning
} from 'lucide-react';
import type {TalentBuild,TalentBranch,TalentCatalog,TalentJob} from './talents';
import {changeRank,decodeBuild,encodeBuild,gateFor,talentBudget,talentList,usedPoints} from './talents';
import './talent.css';

type Props={jobId:string;token:string;onRoute:(job:string,token:string,replace?:boolean)=>void};
type Glyph=typeof Flame;
const GLYPHS:Record<string,Glyph>={
 fire:Flame,ice:Snowflake,wind:Wind,lightning:Zap,sword:Sword,shield:ShieldCheck,archer:Crosshair,
 holy:Sun,poison:Skull,shadow:Footprints,stealth:Footprints,heal:Heart,bow:Target,arrow:Target,
 rain:Droplets,water:Droplets,frost:Snowflake,meteor:Flame,soul:Sparkles,bolt:Zap,
 thunder:CloudLightning,earth:Mountain,stone:Mountain,leaf:Leaf,cart:Shield,axe:Swords,
 spear:Sword,punch:Hand,kick:Footprints,pistol:Crosshair,gun:Crosshair,dance:Wind,
 link:Link2,alchemy:Gem,star:Star,crit:Target,magic:WandSparkles
};
function iconKind(node:{icon?:string|null;name?:string}) {
 const s=((node.icon||'')+' '+(node.name||'')).toLowerCase();
 const keys=['meteor','fire','frost','ice','water','wind','lightning','thunder','holy','heal','poison','shadow','stealth','soul','cart','axe','spear','arrow','bow','pistol','gun','dance','link','alchemy','star','crit','sword','shield','earth','stone','leaf','punch','kick','magic'];
 const direct=keys.find(key=>s.includes(key));if(direct)return direct;
 const localized:[RegExp,string][]=[[/火|燃|炎|焰|燒|爆炎/,'fire'],[/冰|霜|雪|凍|寒/,'ice'],[/雷|電|閃|轟/,'lightning'],[/風|颶|氣流/,'wind'],[/盾|守|護|禦|壁|鎧/,'shield'],[/毒|腐|瘴|瘟/,'poison'],[/弓|箭|射|狙/,'arrow'],[/劍|斬|刃|刀|砍/,'sword'],[/治癒|回復|生命|血量|恩典/,'heal'],[/影|躲|隱|暗/,'shadow'],[/聖|光|祝福|神聖/,'holy'],[/槍|彈|射擊/,'gun'],[/星|月|日曜/,'star'],[/靈|魂|魔力|法術/,'magic'],[/拳|掌|手/,'punch'],[/踢|腳|步伐/,'kick'],[/暴擊|爆擊|致命/,'crit']];
 const matched=localized.find(([pattern])=>pattern.test(node.name||''));if(matched)return matched[1];
 const fallback=['magic','sword','star','shield','crit','holy','wind','soul','fire','shadow'];
 const text=node.icon||node.name||'';
 const hash=[...text].reduce((a,ch)=>a*31+ch.codePointAt(0)!,0)>>>0;
 return fallback[hash%fallback.length];
}
function TalentIcon({node,active=false}:{node:{icon?:string|null;name?:string};active?:boolean}) {
 const kind=iconKind(node);
 const Icon=GLYPHS[kind]||Sparkles;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[node.icon]);
 // Display HANS icons through source-site image references; do not copy any
 // artwork to Git or the Pages deployment. Fall back to local vector icons.
 const asset=node.icon&&/^[a-z0-9_-]+$/i.test(node.icon)
  ?'https://ro.hans-webgametw.com/assets/icons/'+node.icon+'.png':null;
 return <span className={'tg-icon tg-icon-'+kind+(active?' tg-icon-active':'')+(asset&&!failed?' tg-official-preview':'')} aria-hidden="true">
  <span className="tg-icon-glow"/>{asset&&!failed?<img src={asset} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<Icon size={26} strokeWidth={1.8}/>}
 </span>;
}
function JobSelector({data,job,onChoose,expanded,setExpanded}:{
 data:TalentCatalog;job:TalentJob;onChoose:(id:string)=>void;expanded:boolean;setExpanded:(expanded:boolean)=>void
}){
 const first=data.jobs.filter(j=>(j.rank??1)===1);
 return <section className="tg-jobs-wrap">
  <button type="button" className="tg-jobs-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>
   <span><Swords size={17}/>職業選擇 <b>{job.name||job.job}</b></span>{expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
  </button>
  {expanded&&<div className="tg-jobs-grid">
   {first.map(f=>{
    const children=data.jobs.filter(j=>j.base===f.job&&j.rank===2);
    const directThird=data.jobs.filter(j=>j.base===f.job&&j.rank===3);
    return <div key={f.job} className={'tg-job-group'+(job.job===f.job||children.some(c=>c.job===job.job||data.jobs.some(t=>t.rank===3&&t.base===c.job&&t.job===job.job))||directThird.some(c=>c.job===job.job)?' related':'')}>
     <button type="button" className={'tg-job tg-first'+(job.job===f.job?' active':'')} onClick={()=>onChoose(f.job)}>
      <TalentIcon node={{icon:f.branches[0]?.icon,name:f.name}} active={job.job===f.job}/><span>{f.name||f.job}</span>
     </button>
     {(children.length>0||directThird.length>0)&&<div className="tg-job-children">{children.map(child=><div className="tg-job-path" key={child.job}>
      <button type="button" className={'tg-job tg-second'+(job.job===child.job?' active':'')} onClick={()=>onChoose(child.job)} title={child.developing?'HANS 標記為開發中':''}>
       <TalentIcon node={{icon:child.branches[0]?.icon,name:child.name}} active={job.job===child.job}/><span>{child.name||child.job}</span>
      </button>
      {data.jobs.filter(j=>j.rank===3&&j.base===child.job).map(third=><button type="button" key={third.job} className={'tg-job tg-third'+(job.job===third.job?' active':'')} onClick={()=>onChoose(third.job)}>
       <TalentIcon node={{icon:third.branches[0]?.icon,name:third.name}} active={job.job===third.job}/><span>{third.name}</span><small>三轉</small>
      </button>)}
     </div>)}
     {directThird.map(third=><button type="button" key={third.job} className={'tg-job tg-third'+(job.job===third.job?' active':'')} onClick={()=>onChoose(third.job)}>
      <TalentIcon node={{icon:third.branches[0]?.icon,name:third.name}} active={job.job===third.job}/><span>{third.name}</span><small>三轉</small>
     </button>)}
    </div>}
    </div>;
   })}
  </div>}
 </section>;
}
type DetailPosition={left:number;top:number};
function placeDetail(anchor:HTMLElement):DetailPosition{
 const r=anchor.getBoundingClientRect();
 const width=Math.min(350,window.innerWidth-24);
 const gap=12,edge=12;
 const right=r.right+gap;
 const left=r.left-width-gap;
 const x=right+width+edge<=window.innerWidth?right:left>=edge?left:Math.max(edge,Math.min(window.innerWidth-width-edge,r.right+gap));
 // Estimated height fits the most common descriptions; panel itself scrolls if longer.
 const height=Math.min(350,window.innerHeight-24);
 const y=Math.max(edge,Math.min(r.top-30,window.innerHeight-height-edge));
 return {left:Math.round(x),top:Math.round(y)};
}
function TreePanel({job,branch,build,selectedId,onSelect,onAllocate,total,gate}:{
 job:TalentJob;branch:TalentBranch;build:TalentBuild;selectedId:string|null;
 onSelect:(id:string,anchor:HTMLElement)=>void;onAllocate:(id:string,delta:1|-1)=>void;total:number;gate:number
}){
 const nodes=useMemo(()=>new Map(branch.talents.map(x=>[x.id,x])),[branch]);
 const rows=branch.rows||Math.max(1,...branch.talents.map(n=>n.row+1));
 const cols=branch.cols||Math.max(4,...branch.talents.map(n=>n.col+1));
 const spent=branch.talents.reduce((n,t)=>n+(build[t.id]||0),0);
 const specializationLocked=(job.rank??1)>=2&&job.branches.some(b=>b.id!==branch.id&&b.talents.some(n=>(build[n.id]||0)>0));
 const edges=(branch.connections?.length?branch.connections:branch.talents.flatMap(n=>n.requires.map(id=>({from:id,to:n.id})))).filter(e=>nodes.has(e.from)&&nodes.has(e.to));
 return <section className={'tg-tree-panel'+(specializationLocked?' tg-tree-locked':'')} aria-label={branch.name+'天賦樹'}>
  <div className="tg-tree-title">
   <TalentIcon node={{icon:branch.icon,name:branch.name}} active/>
   <strong>{branch.name}</strong>
   <span>{spent} / {total} 點</span>
  </div>
  <div className="tg-tree-desc">{branch.desc||'天賦分支'}
   {!!branch.paths?.length&&<div className="tg-path-list">{branch.paths.map((p,i)=><span key={i} title={p.desc}>{p.name}</span>)}</div>}
  </div>
  {specializationLocked&&<div className="tg-branch-locked-label">已選其他專精分支</div>}
  <div className="tg-board" style={{height:rows*80}}>
   {Array.from({length:rows-1},(_,row)=>{
    const gateValue=(row+1)*gate;
    return <div className="tg-tier-line" key={row} style={{top:(row+1)/rows*100+'%'}}><span>{gateValue}</span></div>;
   })}
   <svg className="tg-connections" viewBox={'0 0 '+cols*100+' '+rows*100} preserveAspectRatio="none" aria-hidden="true">
    {edges.map(e=>{
     const start=nodes.get(e.from)!,end=nodes.get(e.to)!;
     const x1=(start.col+.5)*100,y1=(start.row+.5)*100;
     const x2=(end.col+.5)*100,y2=(end.row+.5)*100;
     const lit=(build[start.id]||0)===start.maxRank&&(build[end.id]||0)>0;
     return <path key={e.from+e.to} className={'tg-edge'+(lit?' lit':'')}
      d={'M'+x1+','+y1+' L'+x1+','+((y1+y2)/2)+' L'+x2+','+((y1+y2)/2)+' L'+x2+','+y2}/>;
    })}
   </svg>
   {branch.talents.map(node=>{
    const rank=build[node.id]||0;
    const canAdd=changeRank(job,build,node.id,1,total,gate)!==null;
    const isLocked=!canAdd&&rank===0;
    return <button type="button" key={node.id} data-talent={node.id}
     className={'tg-node talent-tile'+(rank?' tg-taken':'')+(selectedId===node.id?' tg-selected':'')+(isLocked?' tg-node-locked':'')+(node.ultimate?' tg-ultimate':'')}
     style={{left:(node.col+.5)/cols*100+'%',top:(node.row+.5)/rows*100+'%'}}
     aria-label={node.name+'，'+rank+'/'+node.maxRank+' 點；滑鼠左鍵加點、右鍵退點，觸控點選查看'}
     aria-pressed={selectedId===node.id}
     onMouseEnter={e=>{if(window.matchMedia('(hover:hover) and (pointer:fine)').matches)onSelect(node.id,e.currentTarget)}}
     onFocus={e=>onSelect(node.id,e.currentTarget)}
     onContextMenu={e=>{e.preventDefault();onSelect(node.id,e.currentTarget);if(!window.matchMedia('(pointer:coarse)').matches)onAllocate(node.id,-1)}}
     onClick={e=>{onSelect(node.id,e.currentTarget);if(window.matchMedia('(pointer:coarse)').matches)return;if(e.shiftKey)onAllocate(node.id,-1);else if(canAdd)onAllocate(node.id,1)}}
     onKeyDown={e=>{if(e.key==='+'||e.key==='-'){e.preventDefault();onSelect(node.id,e.currentTarget);onAllocate(node.id,e.key==='+'?1:-1)}}}>
     <TalentIcon node={node} active={rank>0}/>
     <span className="tg-rank talent-rank">{node.learn?(rank>0?'★':'0/1'):rank+'/'+node.maxRank}</span>
     {node.weapon&&<span className="tg-weapon">⚔</span>}
     <span className="tg-sr">{node.name}</span>
    </button>;
   })}
  </div>
 </section>;
}
export function TalentSimulator({jobId,token,onRoute}:Props){
 const [data,setData]=useState<TalentCatalog|null>(null);
 const [error,setError]=useState('');
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [detailPosition,setDetailPosition]=useState<DetailPosition|null>(null);
 const [detailExpanded,setDetailExpanded]=useState(false);
 const [isCompact,setIsCompact]=useState(()=>window.matchMedia('(max-width:750px)').matches);
 const [branchIndex,setBranchIndex]=useState(0);
 const [showJobs,setShowJobs]=useState(()=>window.innerWidth>750);
 const [feedback,setFeedback]=useState('');
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/talents.json',{signal:ac.signal}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()})
   .then((d:TalentCatalog)=>{if(d.server!=='hans'||!d.jobs?.length||d.jobs.length<41)throw Error('HANS 三轉天賦資料尚未完整載入');setData(d)})
   .catch(e=>{if(e.name!=='AbortError')setError('天賦資料載入失敗，請稍後重新整理。')});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{setBranchIndex(0);setSelectedId(null);setDetailExpanded(false);setFeedback('')},[jobId]);
 useEffect(()=>{
  const query=window.matchMedia('(max-width:750px)');
  const onChange=(e:MediaQueryListEvent)=>setIsCompact(e.matches);
  query.addEventListener('change',onChange);
  return ()=>query.removeEventListener('change',onChange);
 },[]);
 useEffect(()=>{
  if(!selectedId||isCompact)return;
  const refresh=()=>{
   const node=document.querySelector<HTMLElement>('[data-talent="'+selectedId+'"]');
   if(node){
    const r=node.getBoundingClientRect();
    if(r.bottom<0||r.top>window.innerHeight){setSelectedId(null);return}
    setDetailPosition(placeDetail(node));
   }
  };
  window.addEventListener('scroll',refresh,true);
  window.addEventListener('resize',refresh);
  return ()=>{window.removeEventListener('scroll',refresh,true);window.removeEventListener('resize',refresh)};
 },[selectedId,isCompact]);
 useEffect(()=>{
  if(!selectedId)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSelectedId(null);setDetailExpanded(false)}};
  window.addEventListener('keydown',onKey);
  return ()=>window.removeEventListener('keydown',onKey);
 },[selectedId]);
 const job=useMemo(()=>data?.jobs.find(j=>j.job===jobId)||data?.jobs[0]||null,[data,jobId]);
 const total=job&&data?talentBudget(data,job):50;
 const parsed=useMemo(()=>job&&data?decodeBuild(job,token,data.sourceCommit,total,data.branchGate):{build:{},error:null},[data,job,token,total]);
 const build=parsed.build;
 const spent=usedPoints(build),remaining=total-spent;
 const selectedNode=job?talentList(job).find(n=>n.id===selectedId):null;
 const selectedBranch=job?.branches.find(b=>b.talents.some(n=>n.id===selectedId));
 const update=(buildNext:TalentBuild)=>{if(job&&data){setFeedback('');onRoute(job.job,encodeBuild(job,buildNext,data.sourceCommit),true)}};
 const selectNode=(id:string,anchor:HTMLElement)=>{
  if(id!==selectedId)setDetailExpanded(false);
  setSelectedId(id);
  if(!isCompact)setDetailPosition(placeDetail(anchor));
 };
 const change=(id:string,delta:1|-1)=>{
  if(!job||!data)return;
  const next=changeRank(job,build,id,delta,total,data.branchGate);
  if(next)update(next);
 };
 const shareUrl=()=>{
  const url=new URL(location.pathname,location.origin);
  url.searchParams.set('page','talents');
  url.searchParams.set('tj',job!.job);
  url.searchParams.set('tb',encodeBuild(job!,build,data!.sourceCommit));
  return url.href;
 };
 const share=async()=>{
  if(!job||!data)return;
  const url=shareUrl();
  try{
   if(navigator.share){await navigator.share({title:'HANS '+job.name+' 天賦配點',url});setFeedback('已開啟系統分享');}
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setFeedback('配點網址已複製');}
   else{window.prompt('複製配點網址',url);}
  }catch(e){if((e as Error).name!=='AbortError')setFeedback('分享失敗，請使用複製連結')}
 };
 const copy=async()=>{
  if(!job||!data)return;
  try{await navigator.clipboard.writeText(shareUrl());setFeedback('配點網址已複製');}
  catch{window.prompt('複製配點網址',shareUrl());}
 };
 if(error)return <p role="alert">{error}</p>;
 if(!job||!data)return <p className="tg-loading">載入 HANS 職業天賦資料…</p>;
 const baseJob=job.base?data.jobs.find(x=>x.job===job.base):undefined;
 return <div className="talent-simulator tg-game">
  <div className="tg-top"><span><Workflow size={20}/>HANS 職業天賦樹</span><small>粉絲製作 · 模擬配點</small></div>
  <div className="tg-body">
   <p className="tg-lead"><span className="tg-help-desktop">參照 HANS 官方天賦樹。滑鼠移到圖示可查看技能，左鍵加 1 點、右鍵退 1 點；按 Esc 可關閉說明。</span><span className="tg-help-mobile">點一下技能查看說明，再用面板的 ＋／－ 配點，避免誤觸。</span></p>
   <JobSelector data={data} job={job} expanded={showJobs} setExpanded={setShowJobs}
    onChoose={id=>{onRoute(id,'');setShowJobs(false)}}/>
   <div className="tg-job-title">
    <TalentIcon node={{icon:job.branches[0]?.icon,name:job.name}} active/>
    <div><h2>{job.name||job.job}</h2><p>{job.description}</p></div>
    <span className="tg-rank-tag">{(job.rank??1)===1?'一轉':job.rank===2?'二轉':'三轉'}</span>
    {job.developing&&<span className="tg-dev-tag">官方開發中</span>}
    {job.rank===3&&<span className="tg-rank-tag">遊戲程式已登錄</span>}
   </div>
   {(job.rank??1)>=2&&<details className="tg-base-note"><summary><BookOpen size={16}/>由 {baseJob?.name||job.base} 轉職 · {job.rank===3?'三轉 70 點專精':'二轉 50 點專精'} <ChevronDown size={15}/></summary>
    <p>{job.rank===3?'三轉使用獨立 70 點天賦額度，終極天賦位於第 12 列，需先投入 55 點。資料取自 HANS 遊戲本體，獨立展示頁尚未收錄三轉。':'一轉配點獨立保留。二轉的 50 點只投入一條專精分支。'}兩者皆依照技能路線互斥與各列門檻計算。</p>
    {baseJob&&<button type="button" onClick={()=>onRoute(baseJob.job,'')}>查看前一階 <ArrowRight size={14}/></button>}
   </details>}
   <div className="tg-summary">
    <div><span>已分配點數</span><b>{spent}<small> / {total}</small></b></div>
    <div><span>剩餘點數</span><b>{remaining}</b></div>
    <button type="button" className="tg-action tg-primary" onClick={share}><Share2 size={17}/>分享配點</button>
    <button type="button" className="tg-action" onClick={copy}><Copy size={16}/>複製連結</button>
    <button type="button" className="tg-action" disabled={!token&&!spent} onClick={()=>{
     if(window.confirm('確定清空目前職業三條分支的所有配點嗎？')){
      onRoute(job.job,'',true);
      setSelectedId(null);
      setFeedback('已重置目前職業的所有配點');
     }
    }}><RotateCcw size={16}/>全部重置</button>
   </div>
   {parsed.error&&<p className="tg-error" role="alert">{parsed.error}</p>}
   {feedback&&<p className="tg-feedback" role="status"><Check size={15}/>{feedback}</p>}
   <div className="tg-skill-bar"><b>職業技能</b>{(job.skills||[]).map(s=>
    <span key={s.id} title={s.id}><TalentIcon node={{icon:s.icon,name:s.id}}/></span>
   )}</div>
   <div className="talent-branch-tabs tg-mobile-tabs" role="tablist" aria-label="天賦分支">
    {job.branches.map((b,i)=><button type="button" key={b.id} role="tab" aria-selected={branchIndex===i}
     className={branchIndex===i?'active':''} onClick={()=>{setBranchIndex(i);setSelectedId(null);setDetailExpanded(false)}}>
     {b.name}<small>{b.talents.reduce((n,t)=>n+(build[t.id]||0),0)} 點</small></button>)}
   </div>
   <div className="tg-trees">
    {job.branches.map((b,i)=><div key={job.job+'-'+b.id} className={'tg-tree-wrap'+(branchIndex!==i?' tg-mobile-hidden':'')}>
     <TreePanel job={job} branch={b} build={build} total={total} gate={data.branchGate}
      selectedId={selectedId} onSelect={selectNode} onAllocate={change}/>
    </div>)}
   </div>
   {selectedNode&&selectedBranch&&<aside className={'tg-detail'+(detailExpanded?' tg-expanded':'')} style={!isCompact?(detailPosition||undefined):undefined} aria-label="天賦詳細說明">
    <div className="tg-detail-head"><TalentIcon node={selectedNode} active={(build[selectedNode.id]||0)>0}/>
     <div><h3>{selectedNode.name}</h3><span aria-live="polite">{selectedBranch.name} · {selectedNode.learn?'學會技能':'等級 '+(build[selectedNode.id]||0)+' / '+selectedNode.maxRank}</span></div>
     <button type="button" aria-label="關閉天賦說明" onClick={()=>{setSelectedId(null);setDetailExpanded(false)}}><X size={18}/></button>
    </div>
    <div className="tg-detail-copy">
     {selectedNode.summary&&<p className="tg-effect">{selectedNode.summary}</p>}
     <div className="tg-detail-more">
      {selectedNode.maxEffect&&<p className="tg-maxeffect">{selectedNode.maxEffect}</p>}
      {selectedNode.notes?.map((x,i)=><p className="tg-condition" key={i}>{x}</p>)}
      {selectedNode.requires.map(id=>{const n=talentList(job).find(x=>x.id===id);return n?<p className="tg-condition" key={id}>前置：{n.name} 需點滿 {n.maxRank} 點，目前 {build[id]||0} 點</p>:null})}
      {selectedNode.row>0&&<p className="tg-condition">前列點數門檻：{gateFor(selectedNode,selectedBranch,data.branchGate)} 點</p>}
     </div>
    </div>
    <button type="button" className="tg-detail-expand" aria-expanded={detailExpanded} onClick={()=>setDetailExpanded(!detailExpanded)}>
     {detailExpanded?'收合詳細說明':'查看完整說明與前置條件'} {detailExpanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
    </button>
    <div className="tg-detail-actions">
     <button type="button" disabled={changeRank(job,build,selectedNode.id,-1,total,data.branchGate)===null} onClick={()=>change(selectedNode.id,-1)}><Minus size={18}/>退一點</button>
     <button type="button" disabled={changeRank(job,build,selectedNode.id,1,total,data.branchGate)===null} onClick={()=>change(selectedNode.id,1)}><Plus size={18}/>加一點</button>
    </div>
   </aside>}
   <div className="tg-footer"><div><Star size={16}/>{job.rank===3?'三轉 70 點、12 列的資料來自 HANS 遊戲本體；部分節點名稱保留程式原文，實際效果以遊戲內為準。':'一、二轉天賦以 HANS 獨立天賦頁為準，二轉內容仍可能調整。'}</div>
    {job.rank!==3&&<a href={'https://ro.hans-webgametw.com/talents.html#'+job.job} target="_blank" rel="noopener noreferrer">查看 HANS 官方天賦 <ExternalLink size={15}/></a>}
   </div>
  </div>
 </div>;
}
