import {useEffect,useState} from 'react';
import {RANK_LABELS} from './skills';
import './balance.css';

interface SkillChange {
 id:string;
 name:string;
 values:{cooldown?:[number,number];baseDamage?:[number,number]};
}
interface BalanceJob {
 id:string;
 name:string;
 rank:number;
 skillIds:string[];
 damage?:[number,number];
}
interface Family {
 id:string;
 name:string;
 jobs:BalanceJob[];
}
interface Release {
 version:string;
 date:string;
 title:string;
 notes:string[];
 snapshots?:[string,string];
 changes:SkillChange[];
 families:Family[];
}
interface History {checkedAt:string;releases:Release[]}

function change(values:[number,number]|undefined,unit='') {
 return values ? values.join(' → ')+unit : '—';
}

function JobLabel({job}:{job:BalanceJob}) {
 return <span className="balance-job-label">
  <b>{job.name}</b>
  <small>{RANK_LABELS[job.rank]}</small>
  {job.damage&&<span className="balance-multiplier">整體傷害 ×{job.damage[0]} → ×{job.damage[1]}</span>}
 </span>;
}

function FamilyChanges({family,skills}:{family:Family;skills:SkillChange[]}) {
 const modifiers=family.jobs.filter(job=>job.damage);
 const owners=new Map<string,BalanceJob[]>();
 for(const job of family.jobs)for(const id of job.skillIds){
  const current=owners.get(id)??[];
  owners.set(id,[...current,job]);
 }
 return <>
  {!!modifiers.length&&<ul className="balance-modifiers" aria-label={family.name+"職業傷害"}>
   {modifiers.map(job=><li key={job.id}><JobLabel job={job}/></li>)}
  </ul>}
  {!!owners.size&&<table className="balance-table" aria-label={family.name+"技能變動"}>
   <thead><tr><th scope="col">技能</th><th scope="col">基礎冷卻</th><th scope="col">基礎傷害</th></tr></thead>
   <tbody>{skills.filter(skill=>owners.has(skill.id)).map(skill=>{
    const jobs=owners.get(skill.id)!;
    const href="?"+new URLSearchParams({page:"skills",sj:jobs[0].id,sk:skill.id});
    return <tr key={skill.id}>
     <th scope="row"><a href={href}>{skill.name}</a><small>{jobs.map(job=>job.name).join("、")}</small></th>
     <td>{change(skill.values.cooldown," 秒")}</td>
     <td>{change(skill.values.baseDamage)}</td>
    </tr>;
   })}</tbody>
  </table>}
 </>;
}

export function BalanceHistory() {
 const [history,setHistory]=useState<History|null>(null);
 const [error,setError]=useState(false);
 const [version,setVersion]=useState('');
 const [familyId,setFamilyId]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/balance.json?view=families',{cache:'no-cache',signal:controller.signal})
   .then(response=>{
    if(!response.ok)throw Error('Balance history HTTP '+response.status);
    return response.json() as Promise<History>;
   })
   .then(setHistory)
   .catch(()=>{if(!controller.signal.aborted)setError(true)});
  return ()=>controller.abort();
 },[]);
 if(error)return <p className="empty-state">平衡紀錄載入失敗，請重新整理。</p>;
 if(!history)return <p role="status">載入平衡紀錄…</p>;
 const release=history.releases.find(entry=>entry.version===version)??history.releases[0];
 if(!release)return <p className="empty-state">目前沒有平衡紀錄。</p>;
 const families=release.families??[];
 const family=families.find(entry=>entry.id===familyId)??families[0];
 return <div className="balance-history">
  <label className="balance-version">
   <span>更新版本</span>
   <select value={release.version} onChange={event=>setVersion(event.target.value)}>
    {history.releases.map(entry=><option key={entry.version} value={entry.version}>
     {entry.date.slice(5).replace('-','/')} · V{entry.version} {entry.title}
    </option>)}
   </select>
  </label>
  {family&&<section className="balance-family-panel" aria-label="職業系變動">
   <div className="balance-picker" role="group" aria-label="選擇職業系">
    {families.map(entry=><button key={entry.id} type="button" aria-pressed={family.id===entry.id}
     onClick={()=>setFamilyId(entry.id)}>{entry.name}</button>)}
   </div>
   <FamilyChanges family={family} skills={release.changes}/>
   {family.jobs.some(job=>job.skillIds.length>0)&&
    <p className="balance-source">數值為更新前 → 更新後。實戰傷害另受角色屬性、天賦與整體傷害倍率影響。</p>}
  </section>}
  <details className="balance-notes" key={release.version} open={!family}>
   <summary>版本公告與來源</summary>
   <ul>{release.notes.map(note=><li key={note}>{note}</li>)}</ul>
   {release.snapshots&&<p className="balance-source">客戶端快照 {release.snapshots.join(' → ')}</p>}
   <p className="balance-source"><a href="https://ro.hans-webgametw.com/" target="_blank" rel="noreferrer">HANS 原站「最新消息」</a></p>
  </details>
 </div>;
}
