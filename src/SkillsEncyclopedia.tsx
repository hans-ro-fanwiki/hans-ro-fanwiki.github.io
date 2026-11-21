import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {BookOpen,ChevronDown,Clock3,Search,Sparkles,X} from 'lucide-react';
import type {Skill,SkillCatalog} from './skills';
import {jobsForSelection,RANK_LABELS,searchSkillName,SKILL_TAGS} from './skills';
import './skills.css';

type Props={
 jobId:string;rank:number;query:string;selectedId:string|null;
 onChange:(patch:{skillJob?:string;skillRank?:number;query?:string;skillId?:string|null})=>void;
};
function SkillArtwork({skill}:{skill:Skill}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[skill.icon]);
 const src=/^[a-z0-9_-]+$/i.test(skill.icon)
  ?'https://ro.hans-webgametw.com/assets/icons/'+skill.icon+'.png':null;
 return <span className="sk-art" aria-hidden="true">
  {src&&!failed?<img src={src} loading="lazy" decoding="async" alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<Sparkles size={25}/>}
 </span>;
}
function SkillJobPicker({jobs,value,onPick}:{jobs:SkillCatalog['jobs'];value:string;onPick:(id:string)=>void}){
 const [open,setOpen]=useState(false);
 const [expandedRank,setExpandedRank]=useState<number|null>(null);
 const containerRef=useRef<HTMLDivElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const menuId=useId();
 const selected=jobs.find(j=>j.id===value);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{
   if(event.target instanceof Node&&!containerRef.current?.contains(event.target))setOpen(false);
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);triggerRef.current?.focus();}
  };
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 const choose=(id:string)=>{onPick(id);setOpen(false);setExpandedRank(null);};
 return <div className="sk-job-picker" ref={containerRef}>
  <span className="sk-job-label">選擇職業／轉職路線</span>
  <button type="button" ref={triggerRef} className="sk-job-trigger" aria-label="技能職業" aria-controls={menuId} aria-expanded={open} onClick={()=>{
   if(!open)setExpandedRank(selected?.rank??null);
   setOpen(!open);
  }}>
   <span>{selected?.name||'全部職業'}</span><ChevronDown size={18} aria-hidden="true"/>
  </button>
  {open&&<div className="sk-job-menu" id={menuId} role="region" aria-label="選擇技能職業">
   <button type="button" className={'sk-job-choice sk-job-all'+(value==='all'?' active':'')} aria-pressed={value==='all'} onClick={()=>choose('all')}>全部職業</button>
   {([1,2,3] as const).map(r=>{
    const isOpen=expandedRank===r;
    const group=jobs.filter(j=>j.rank===r);
    return <div className="sk-job-stage-group" key={r}>
     <button type="button" className="sk-job-stage-trigger" aria-expanded={isOpen} onClick={()=>setExpandedRank(isOpen?null:r)}>
      <span>{RANK_LABELS[r]}</span><small>{group.length} 職</small><ChevronDown size={16} aria-hidden="true"/>
     </button>
     {isOpen&&<div className="sk-job-stage-options">
      {group.map(job=><button type="button" key={job.id} className={'sk-job-choice'+(job.id===value?' active':'')} aria-pressed={job.id===value} onClick={()=>choose(job.id)}>{job.name}</button>)}
     </div>}
    </div>;
   })}
  </div>}
 </div>;
}
function SkillDetail({skill}:{skill:Skill}){
 const labels=[...new Set(skill.tags.map(x=>SKILL_TAGS[x]).filter((x):x is string=>Boolean(x)))];
 return <div className="sk-detail">
  <div className="sk-detail-head">
   <strong>{skill.name}</strong>
   {skill.originalName!==skill.name&&<span>{skill.originalName}</span>}
  </div>
  <div className="sk-facts">
   {skill.cooldown!==null&&<span><Clock3 size={14}/>基礎冷卻 {skill.cooldown} 秒</span>}
   {labels.map(label=><span key={label}>{label}</span>)}
  </div>
  {skill.description?<div className="sk-description"><b>技能介紹</b><p>{skill.description}</p></div>:
   <div className="sk-description sk-limited"><b>技能介紹尚待補齊</b><p>目前審核的 HANS 資料沒有可直接核實的繁體中文效果說明；僅列出已登錄的名稱、圖示與可確認的技能資訊。</p></div>}
  {skill.upgradeDescription&&<div className="sk-description"><b>升級效果</b><p>{skill.upgradeDescription}</p></div>}
  {skill.cooldown!==null&&<p className="sk-source-note">此處為遊戲註冊的基礎冷卻，實戰仍可能受到天賦、技能等級或其他效果影響。</p>}
  <p className="sk-source-note">HANS 遊戲註冊資料 · 基準快照 2026-11-19；未顯示無法核實的精確技能公式。</p>
 </div>;
}
export function SkillsEncyclopedia({jobId,rank,query,selectedId,onChange}:Props){
 const [data,setData]=useState<SkillCatalog|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/skills.json?schema=1&names=zh-20261121',{signal:ac.signal})
   .then(r=>{if(!r.ok)throw Error('skills HTTP '+r.status);return r.json()})
   .then((result:SkillCatalog)=>{
    if(result.server!=='hans'||result.schemaVersion!==1||result.jobs.length!==41)
     throw Error('技能圖鑑資料版本不相容');
    setData(result);
   })
   .catch(e=>{if(e.name!=='AbortError')setError('HANS 技能資料載入失敗，請重新整理頁面。')});
  return ()=>ac.abort();
 },[]);
 const list=useMemo(()=>{
  if(!data)return [];
  const byId=new Map(data.skills.map(s=>[s.id,s]));
  return jobsForSelection(data.jobs,jobId,rank).map(job=>{
   const skills=job.skills.map(id=>byId.get(id)).filter((s):s is Skill=>Boolean(s))
    .filter(skill=>searchSkillName(skill,query));
   return {job,skills};
  }).filter(group=>group.skills.length);
 },[data,jobId,rank,query]);
 const total=list.reduce((sum,group)=>sum+group.skills.length,0);
 return <div className="skills-encyclopedia">
  <div className="sk-intro">
   <div><p>查詢 HANS 一轉、二轉、三轉的技能、官方圖示、已知效果與基礎冷卻。與天賦樹不同，這裡只提供技能資料查詢。</p></div>
   {data&&<span className="sk-total">{data.skills.length} 種技能</span>}
  </div>
  {error&&<div className="sk-empty" role="alert">{error}</div>}
  {!data&&!error&&<div className="sk-empty">讀取技能資料中…</div>}
  {data&&<>
   <div className="sk-filter-panel">
    <label className="sk-search"><Search size={18}/><input type="search" aria-label="搜尋職業技能" placeholder="搜尋技能名稱、英文名稱、效果…" value={query} onChange={e=>onChange({query:e.target.value,skillId:null})}/>{query&&<button type="button" aria-label="清除技能搜尋" onClick={()=>onChange({query:'',skillId:null})}><X size={18}/></button>}</label>
    <div className="sk-filter-row">
     <SkillJobPicker jobs={data.jobs} value={jobId} onPick={id=>onChange({skillJob:id,skillId:null})}/>
    </div>
    <div className="sk-rank-choices" role="group" aria-label="技能轉職階段">
     {([0,1,2,3] as const).map(r=><button key={r} type="button" className={rank===r?'active':''} aria-pressed={rank===r} onClick={()=>onChange({skillRank:r,skillId:null})}>{r===0?'全部階段':RANK_LABELS[r]}</button>)}
    </div>
   </div>
   <p className="sk-result-count" aria-live="polite">符合 {total} 筆職業技能 · {list.length} 個職業{jobId!=='all'?'（包含相應的轉職路線）':''}</p>
   {list.length?<div className="sk-groups">
    {list.map(({job,skills})=><section className="sk-group" key={job.id} aria-label={job.name+'技能'}>
     <header className="sk-group-title"><div><strong>{job.name}</strong><small>{RANK_LABELS[job.rank]}</small></div><span>{skills.length} 技能</span></header>
     <div className="sk-list">
      {skills.map(skill=><div className="sk-list-entry" key={skill.id}>
       <button type="button" className={'sk-result'+(selectedId===skill.id?' active':'')} aria-expanded={selectedId===skill.id} onClick={()=>onChange({skillId:selectedId===skill.id?null:skill.id})}>
        <SkillArtwork skill={skill}/>
        <span className="sk-result-copy"><strong>{skill.name}</strong><small>{skill.description||skill.originalName}{skill.cooldown!==null?' · 冷卻 '+skill.cooldown+'s':''}</small></span>
        <ChevronDown size={18} className={selectedId===skill.id?'sk-rotated':''}/>
       </button>
       {selectedId===skill.id&&<SkillDetail skill={skill}/>}
      </div>)}
     </div>
    </section>)}
   </div>:<div className="sk-empty"><p>沒有符合條件的技能。</p><button type="button" onClick={()=>onChange({skillJob:'all',skillRank:0,query:'',skillId:null})}>清除技能篩選</button></div>}
   <p className="sk-bottom-note"><BookOpen size={15}/>只收錄經審核的 HANS 遊戲登錄技能。尚未核實的技能敘述、等級變化及公式不會套用其他 RO 伺服器資料。</p>
  </>}
 </div>;
}
