import {useMemo,useState} from 'react';
import {experienceData} from './experience';
import type {ExperienceOptions} from './experience';
import {projectSample,validateSample} from './experience-calibration';
import type {BattleSample} from './experience-calibration';
const fmt=(n:number)=>Math.round(n).toLocaleString('zh-TW');
const dec=(n:number)=>n.toLocaleString('zh-TW',{maximumFractionDigits:2});
export function ExperienceCalibration({options}:{options:ExperienceOptions}){
 const [stageId,setStageId]=useState(experienceData.stages[0].id);
 const [lap,setLap]=useState(1);
 const [kills,setKills]=useState('');
 const [base,setBase]=useState('');
 const [job,setJob]=useState('');
 const [sample,setSample]=useState<BattleSample|null>(null);
 const stage=experienceData.stages.find(s=>s.id===stageId)!;
 const draft:BattleSample={stageId,lap,options:{...options},kills:Number(kills),base:Number(base),job:job.trim()?Number(job):undefined};
 const valid=kills.trim()!==''&&base.trim()!==''&&validateSample(draft);
 const results=useMemo(()=>{
  if(!sample)return [];
  const c=sample.options.count,e=sample.options.events;
  const configs=[[c,e],[Math.max(1,c*.75),e],[Math.max(1,c*.5),e],[c,Math.max(1,e*.5)],[options.count,options.events]];
  const distinct=configs.filter(([x,y],i)=>configs.findIndex(([a,b])=>a===x&&b===y)===i);
  return distinct.map(([x,y])=>projectSample(sample,x,y));
 },[sample,options.count,options.events]);
 const first=results[0];
 return <details className="xp-advanced xp-calibration">
  <summary>實戰校準（選填）</summary>
  <p className="xp-hint">填入一場完整通關的結算數據。先將上方等級、職業、怪物／事件倍率設為該場開局設定；不必輸入 DPS。校準只適用同關卡、週目、流派及相近難度，其他地圖仍以理論試算。</p>
  <div className="xp-fields">
   <label>實測關卡<select value={stageId} onChange={e=>{setStageId(e.target.value);setLap(1)}}>{experienceData.stages.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
   <label>實測週目<select value={lap} onChange={e=>setLap(Number(e.target.value))}>{stage.gs.map((g,i)=>g==null?null:<option value={i+1} key={i}>{i+1} 週目</option>)}</select></label>
   <label>怪物擊殺數<input type="number" min="1" step="1" inputMode="numeric" placeholder="例如 186055" value={kills} onChange={e=>setKills(e.target.value)}/></label>
   <label>結算 Base EXP<input type="number" min="0" step="1" inputMode="numeric" placeholder="例如 4939408" value={base} onChange={e=>setBase(e.target.value)}/></label>
   <label>結算 Job EXP（選填）<input type="number" min="0" step="1" inputMode="numeric" placeholder="例如 1866" value={job} onChange={e=>setJob(e.target.value)}/></label>
  </div>
  <p className="xp-hint">套用時固定：Base Lv {options.baseLevel}、Job Lv {options.jobLevel}、{({first:'一轉',second:'二轉',third:'三轉',expanded:'忍者／神槍手'})[options.advancement]}、怪物 {dec(options.count*100)}%／事件 {dec(options.events*100)}%、全服 {options.serverExp}×。不必輸入時間或清怪比例。</p>
  <div className="xp-cal-actions"><button className="xp-return" type="button" disabled={!valid} onClick={()=>setSample(draft)}>套用實測數據</button>{sample&&<button className="xp-return" type="button" onClick={()=>setSample(null)}>清除校準</button>}</div>
  {first&&sample&&<div className="xp-cal-results" aria-live="polite">
   <h3>{experienceData.stages.find(s=>s.id===sample.stageId)?.name} · {sample.lap} 週目</h3>
   <p className="xp-hint">已保存本次頁面樣本：Base Lv {sample.options.baseLevel}、怪物 {dec(sample.options.count*100)}%／事件 {dec(sample.options.events*100)}%。更改上方倍率可比較新情境；更換角色、等級或流派請重新套用。</p>
   <div className="xp-cal-metrics">
    <div><small>單場實際擊殺</small><strong>{fmt(first.kills)}</strong></div>
    <div><small>每隻平均 Base</small><strong>{dec(first.basePerKill)}</strong></div>
    <div><small>單場 Base EXP</small><strong>{fmt(first.base)}</strong></div>
    <div><small>單場 Job EXP</small><strong>{first.job===undefined?'—':fmt(first.job)}</strong></div>
   </div>
   <p className="xp-hint">理論出怪試算 {fmt(first.estimatedSupply)} 隻，實測 {fmt(sample.kills)} 隻。差異可能來自地形、怪物潮、召喚物與實際擊殺情況，不推測精確清怪率。</p>
   <div className="xp-comparison"><table><thead><tr><th>怪物／事件</th><th>擊殺／場</th><th>Base／場</th><th>Job／場</th></tr></thead><tbody>{results.map(r=><tr key={r.count+'-'+r.events}><th scope="row">{dec(r.count*100)}%／{dec(r.events*100)}% {r.same?'（實測）':'（估）'}</th><td>{fmt(r.kills)}</td><td>{fmt(r.base)}</td><td>{r.job===undefined?'—':fmt(r.job)}</td></tr>)}</tbody></table></div>
   <p className="xp-hint">比較以實測經驗乘理論情境的相對變化，假設清怪比例、存活率與其他條件相近；不是其他關卡排名，也不能保證不同難度的實際收益。建議實測後重新校準。</p>
  </div>}
 </details>;
}
