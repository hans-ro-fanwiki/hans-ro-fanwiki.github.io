import {localizedSkillName} from './skills';
import {useEffect,useMemo,useRef,useState} from 'react';
import {BookOpen,ChevronDown,ChevronRight,Clock3,Search,Sparkles,X} from 'lucide-react';
import type {CareerRoute,Skill,SkillCatalog,SkillJob} from './skills';
import {careerRoutes,routeForJob,routeForSkill,RANK_LABELS,searchSkillName,SKILL_TAGS} from './skills';
import './skills.css';
import {SkillCompatibility} from './CombatGuide';
import bossBalance from './data/hans-boss-skill-multipliers.json';

type SkillChange={skillJob?:string;skillRank?:number;query?:string;skillId?:string|null};
type Props={
 jobId:string;rank:number;query:string;selectedId:string|null;
 onChange:(patch:SkillChange,replace?:boolean)=>void;
};
const RECENT_ROUTE_KEY='hans-wiki-skills-recent-route-v1';

function SkillArtwork({skill}:{skill:Skill}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[skill.icon]);
 const src=/^[a-z0-9_-]+$/i.test(skill.icon)
  ?'https://ro.hans-webgametw.com/assets/icons/'+skill.icon+'.png':null;
 return <span className="sk-art" aria-hidden="true">
  {src&&!failed?<img src={src} loading="lazy" decoding="async" alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<Sparkles size={25}/>}
 </span>;
}

function CareerPicker({jobs,route,onPick}:{jobs:SkillJob[];route:CareerRoute|null;onPick:(route:CareerRoute)=>void}){
 const routes=useMemo(()=>careerRoutes(jobs),[jobs]);
 const firstJobs=jobs.filter(job=>job.rank===1);
 const [editing,setEditing]=useState(false);
 const firstRouteRef=useRef<HTMLButtonElement>(null);
 const focusAfterChoose=useRef(false);
 useEffect(()=>{
  if(focusAfterChoose.current&&route){firstRouteRef.current?.focus();focusAfterChoose.current=false;}
 },[route?.id,editing]);
 const visibleBases=!route||editing;
 const selectBase=(baseId:string)=>{
  const next=routes.find(item=>item.base.id===baseId);
  if(next){focusAfterChoose.current=true;onPick(next);setEditing(false);}
 };
 const selectedRoutes=route?routes.filter(item=>item.base.id===route.base.id):[];
 return <section className="sk-career-picker" aria-label="選擇職業路線">
  <div className="sk-career-title">
   <strong>選擇起始職業</strong>
   {route&&<button type="button" className="sk-change-base" aria-expanded={editing} onClick={()=>setEditing(value=>!value)}>
    {editing?'收合職業':'更換職業'} <ChevronDown size={15} aria-hidden="true"/>
   </button>}
  </div>
  {visibleBases?<div className="sk-base-grid" role="group" aria-label="起始職業">
    {firstJobs.map(job=><button key={job.id} type="button" className={'sk-base-choice'+(route?.base.id===job.id?' active':'')} aria-pressed={route?.base.id===job.id} onClick={()=>selectBase(job.id)}>{job.name}</button>)}
   </div>:<div className="sk-base-current"><strong>{route?.base.name}</strong><span>一轉起始職業</span></div>}
  {route&&<div className="sk-branch-picker" role="group" aria-label="轉職路線">
   <strong>選擇轉職路線</strong>
   <div className="sk-route-grid">
    {selectedRoutes.map((candidate,index)=><button type="button" key={candidate.id} ref={index===0?firstRouteRef:undefined}
     className={'sk-route-choice'+(candidate.id===route.id?' active':'')}
     aria-pressed={candidate.id===route.id} onClick={()=>onPick(candidate)}>
     <span className="sk-route-labels"><b>{candidate.second?.name||candidate.base.name}</b><small>{candidate.third?.name||'尚無三轉職業資料'}</small></span>
     {candidate.id===route.id?<span className="sk-route-current">已選擇</span>:<ChevronRight size={18} aria-hidden="true"/>}
    </button>)}
   </div>
  </div>}
  {route&&<p className="sk-path-summary" aria-live="polite">
   目前路線：{route.jobs.map(job=>job.name).join(' → ')}
  </p>}
 </section>;
}

function SkillDetail({skill,reviewedAt,jobs}:{skill:Skill;reviewedAt:string;jobs:SkillJob[]}){
 const modifiers=bossBalance.jobs as Record<string,Record<string,number>>;
 const bossJobs=jobs.filter(job=>modifiers[job.id]?.[skill.id]!=null);
 const labels=[...new Set(skill.tags.map(x=>SKILL_TAGS[x]).filter((x):x is string=>Boolean(x)))];
 return <div className="sk-detail">
  <div className="sk-detail-head">
   <strong>{skill.name}</strong>
   {skill.originalName!==skill.name&&<span>{skill.originalName}</span>}
  </div>
  <div className="sk-facts">
   {skill.cooldown!==null&&<span><Clock3 size={14}/>基礎冷卻 {skill.cooldown} 秒</span>}
   {skill.baseDamage!=null&&<span>基礎傷害 {skill.baseDamage}</span>}
   {labels.map(label=><span key={label}>{label}</span>)}
  </div>
  {skill.description?<div className="sk-description"><b>技能介紹</b><p>{skill.description}</p></div>:
   <div className="sk-description sk-limited"><b>技能介紹尚待補齊</b><p>目前審核的 HANS 資料沒有可直接核實的繁體中文效果說明；僅列出已登錄的名稱、圖示與可確認的技能資訊。</p></div>}
  {skill.upgradeDescription&&<div className="sk-description"><b>升級效果</b><p>{skill.upgradeDescription}</p></div>}
  {!!bossJobs.length&&<div className="sk-description">
   <b>首領／菁英傷害倍率 · V{bossBalance.version}</b>
   {bossJobs.map(job=><p key={job.id}>{job.name}：×{modifiers[job.id][skill.id]}</p>)}
   <p className="sk-source-note">限此職業對首領或菁英怪的指定技能來源傷害，一般怪不變；不代表治療量、所有召喚物攻擊或最終 DPS。</p>
  </div>}
  <SkillCompatibility skillId={skill.id} skillName={skill.name}/>
  {(skill.cooldown!==null||skill.baseDamage!=null)&&<p className="sk-source-note">基礎值會受技能等級、角色屬性與天賦等效果影響。</p>}
  <p className="sk-source-note">{skill.translationState==='wiki-zh'?'依 HANS 效果整理':'HANS 遊戲資料'} · {reviewedAt}</p>
 </div>;
}

interface SkillGroup {id:string;name:string;rank:number|null;skills:Skill[]}
export function SkillsEncyclopedia({jobId,rank,query,selectedId,onChange}:Props){
 const [data,setData]=useState<SkillCatalog|null>(null);
 const [error,setError]=useState('');
 const restored=useRef(false);
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/skills.json?schema=1',{signal:ac.signal,cache:'no-cache'})
   .then(r=>{if(!r.ok)throw Error('skills HTTP '+r.status);return r.json()})
   .then((result:SkillCatalog)=>{
    if(result.server!=='hans'||result.schemaVersion!==1||result.jobs.length!==41)
     throw Error('技能圖鑑資料版本不相容');
    setData({...result,skills:result.skills.map(skill=>({...skill,name:localizedSkillName(skill)}))});
   })
   .catch(e=>{if(e.name!=='AbortError')setError('HANS 技能資料載入失敗，請重新整理頁面。')});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{
  if(!data||restored.current)return;
  restored.current=true;
  const params=new URLSearchParams(window.location.search);
  if(jobId!=='all'||query.trim()||selectedId||params.has('sj')||params.has('sk'))return;
  try {
   const stored=window.localStorage.getItem(RECENT_ROUTE_KEY);
   if(stored&&careerRoutes(data.jobs).some(route=>route.id===stored))
    onChange({skillJob:stored},true);
  }catch{/* Storage is optional in private browsing. */}
 },[data,jobId,query,selectedId,onChange]);
 const searching=Boolean(query.trim());
 const selectedRoute=useMemo(()=>{
  if(!data)return null;
  if(jobId!=='all')return routeForJob(data.jobs,jobId);
  if(!searching&&selectedId)return routeForSkill(data.jobs,selectedId);
  return null;
 },[data,jobId,selectedId,searching]);
 const groups=useMemo<SkillGroup[]>(()=>{
  if(!data)return [];
  const byId=new Map(data.skills.map(skill=>[skill.id,skill]));
  if(searching){
   const ids=new Set(data.jobs.filter(job=>rank===0||job.rank===rank).flatMap(job=>job.skills));
   const matches=data.skills.filter(skill=>ids.has(skill.id)&&searchSkillName(skill,query));
   return matches.length?[{id:'search',name:'技能搜尋結果',rank:null,skills:matches}]:[];
  }
  if(!selectedRoute)return [];
  return selectedRoute.jobs.filter(job=>rank===0||job.rank===rank).map(job=>({
   id:job.id,name:job.name,rank:job.rank,
   skills:job.skills.map(id=>byId.get(id)).filter((skill):skill is Skill=>Boolean(skill))
  })).filter(group=>group.skills.length);
 },[data,selectedRoute,rank,query,searching]);
 const matchingJobs=useMemo(()=>{
  if(!data||!searching)return [];
  const q=query.trim().toLocaleLowerCase();
  return data.jobs.filter(job=>job.name.toLocaleLowerCase().includes(q)||job.id.toLowerCase().includes(q)).slice(0,10);
 },[data,searching,query]);
 const total=groups.reduce((sum,group)=>sum+group.skills.length,0);
 const chooseRoute=(route:CareerRoute)=>{
  try{window.localStorage.setItem(RECENT_ROUTE_KEY,route.id);}catch{/* Not available in private browsing. */}
  onChange({skillJob:route.id,query:'',skillRank:0,skillId:null},false);
 };
 const clearSearch=()=>onChange({query:'',skillId:null},true);
 return <div className="skills-encyclopedia">
  <div className="sk-intro">
   <div><p>查閱一至三轉技能的效果、升級說明與基礎冷卻。</p></div>
   {data&&<span className="sk-total">{data.skills.length} 種技能</span>}
  </div>
  {error&&<div className="sk-empty" role="alert">{error}</div>}
  {!data&&!error&&<div className="sk-empty">讀取技能資料中…</div>}
  {data&&<>
   <div className="sk-filter-panel">
    <label className="sk-search"><Search size={18}/><input type="search" aria-label="搜尋職業技能" placeholder="直接搜尋技能、職業、英文名稱或效果…" value={query} onChange={e=>onChange({query:e.target.value,skillId:null},true)}/>
     {query&&<button type="button" aria-label="清除技能搜尋" onClick={clearSearch}><X size={18}/></button>}
    </label>
    {searching?<p className="sk-search-scope">正在搜尋所有職業，無須先選職業。</p>:
     <CareerPicker jobs={data.jobs} route={selectedRoute} onPick={chooseRoute}/>}
    {(selectedRoute||searching)&&<div className="sk-rank-choices" role="group" aria-label="技能轉職階段">
     {([0,1,2,3] as const).map(r=><button key={r} type="button" className={rank===r?'active':''} aria-pressed={rank===r}
      onClick={()=>onChange({skillRank:r,skillId:null},false)}>{r===0?'全部階段':RANK_LABELS[r]}</button>)}
    </div>}
   </div>
   {searching&&matchingJobs.length>0&&<div className="sk-matching-jobs">
    <strong>符合的職業</strong>
    <div>{matchingJobs.map(job=><button type="button" key={job.id} onClick={()=>{const route=routeForJob(data.jobs,job.id);if(route)chooseRoute(route);}}>{job.name}</button>)}</div>
   </div>}
   {selectedRoute&&!searching&&<p className="sk-result-count" aria-live="polite">符合 {total} 筆技能 · {groups.length} 個轉職階段</p>}
   {searching&&<p className="sk-result-count" aria-live="polite">搜尋到 {total} 種技能{rank!==0?' · '+RANK_LABELS[rank]:''}</p>}
   {groups.length?<div className="sk-groups">
    {groups.map(group=><section className="sk-group" key={group.id} aria-label={group.name+'技能'}>
     <header className="sk-group-title"><div><strong>{group.name}</strong>{group.rank!==null&&<small>{RANK_LABELS[group.rank]}</small>}</div><span>{group.skills.length} 技能</span></header>
     <div className="sk-list">
      {group.skills.map(skill=><div className="sk-list-entry" key={skill.id}>
       <button type="button" className={'sk-result'+(selectedId===skill.id?' active':'')} aria-expanded={selectedId===skill.id}
        onClick={()=>onChange({skillId:selectedId===skill.id?null:skill.id},true)}>
        <SkillArtwork skill={skill}/>
        <span className="sk-result-copy"><strong>{skill.name}</strong><small>{skill.description||skill.originalName}{skill.cooldown!==null?' · 冷卻 '+skill.cooldown+'s':''}</small></span>
        <ChevronDown size={18} className={selectedId===skill.id?'sk-rotated':''}/>
       </button>
       {selectedId===skill.id&&<SkillDetail skill={skill} jobs={data.jobs} reviewedAt={data.source.version ? data.reviewedAt+" · V"+data.source.version : data.reviewedAt}/>}
      </div>)}
     </div>
    </section>)}
   </div>:searching?<div className="sk-empty"><p>找不到符合的技能或職業。</p><button type="button" onClick={clearSearch}>清除搜尋</button></div>:
    !selectedRoute?<div className="sk-select-prompt">請先選擇上方起始職業，或直接搜尋技能名稱。</div>:
    <div className="sk-empty">目前轉職階段沒有可顯示的技能，請選擇其他階段。</div>}
   <p className="sk-bottom-note"><BookOpen size={15}/>只收錄經審核的 HANS 遊戲登錄技能。尚未核實的技能敘述、等級變化及公式不會套用其他 RO 伺服器資料。</p>
  </>}
 </div>;
}
