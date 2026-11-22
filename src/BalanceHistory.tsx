import {useEffect,useState} from 'react';
import './balance.css';

interface SkillChange {
 id:string;
 name:string;
 values:{cooldown?:[number,number];baseDamage?:[number,number]};
}
interface Release {
 version:string;
 date:string;
 title:string;
 notes:string[];
 snapshots?:[string,string];
 changes:SkillChange[];
}
interface History {checkedAt:string;releases:Release[]}
const official='https://ro.hans-webgametw.com/';

function change(values:[number,number]|undefined,unit='') {
 return values ? values.map(value=>value+unit).join(' → ') : '—';
}

export function BalanceHistory() {
 const [history,setHistory]=useState<History|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/balance.json',{cache:'no-cache',signal:controller.signal})
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
 return <div className="balance-history">
  <p className="balance-intro">技能數值核對至 <time>{history.checkedAt}</time>。基礎傷害是技能公式的基礎值，會再受到技能等級、攻擊力與天賦等影響。</p>
  {history.releases.map((release,i)=><details className="balance-release" key={release.version} open={i===0}>
   <summary>
    <span><b>{release.title}</b><small><time dateTime={release.date}>{release.date}</time> · V{release.version}</small></span>
    <small>{release.snapshots ? release.changes.length+' 招有數值變動' : '官方公告'}</small>
   </summary>
   <div className="balance-body">
    <ul>{release.notes.map(note=><li key={note}>{note}</li>)}</ul>
    {release.snapshots&&<>
     <p className="balance-source">客戶端快照 {release.snapshots[0]} → {release.snapshots[1]}</p>
     {release.changes.length>0&&<table>
      <caption className="balance-source">更新前 → 更新後</caption>
      <thead><tr><th scope="col">技能</th><th scope="col">基礎冷卻</th><th scope="col">基礎傷害</th></tr></thead>
      <tbody>{release.changes.map(row=><tr key={row.id}>
       <th scope="row"><a href={'?page=skills&sk='+encodeURIComponent(row.id)}>{row.name}</a></th>
       <td>{change(row.values.cooldown,' 秒')}</td><td>{change(row.values.baseDamage)}</td>
      </tr>)}</tbody>
     </table>}
    </>}
    <p className="balance-source"><a href={official} target="_blank" rel="noreferrer">HANS 原站「最新消息」</a></p>
   </div>
  </details>)}
 </div>;
}
