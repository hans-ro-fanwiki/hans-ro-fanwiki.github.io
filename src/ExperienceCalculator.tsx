import {useMemo,useState} from 'react';
import {defaultExperienceOptions,estimateExperience,eventIntervals,experienceData,rankExperience} from './experience';
import type {ExperienceOptions} from './experience';

const number=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0});
const decimal=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:1});
const laps=['一','二','三','四','五','六'];
type Metric='base'|'job';
const jobLimits:Record<ExperienceOptions['advancement'],number>={first:50,expanded:70,second:50,third:70};

function optionalNumber(value:string,min:number,max:number){
  if(value.trim()==='')return undefined;
  const parsed=Number(value);
  return Number.isFinite(parsed)?Math.min(max,Math.max(min,parsed)):undefined;
}

function sliderMultiplier(value:string,max:number){
  return Math.round((optionalNumber(value,100,max*100)??100)/5)/20;
}

export function ExperienceCalculator({onClose}:{onClose:()=>void}){
  const [level,setLevel]=useState('');
  const [target,setTarget]=useState<Metric>('base');
  const [options,setOptions]=useState(defaultExperienceOptions);
  const [gs,setGs]=useState('');
  const [killRate,setKillRate]=useState('');
  const [monsterPercent,setMonsterPercent]=useState('100');
  const [eventPercent,setEventPercent]=useState('100');
  const [all,setAll]=useState(false);
  const baseLevel=optionalNumber(level,1,experienceData.base.max);
  const jobLimit=jobLimits[options.advancement];
  const count=sliderMultiplier(monsterPercent,experienceData.spawn.maxCount);
  const events=sliderMultiplier(eventPercent,experienceData.spawn.maxEvents);
  const model=useMemo(()=>({...options,count,events,baseLevel:Math.floor(baseLevel??1),jobLevel:Math.min(jobLimit,options.jobLevel),
    gs:optionalNumber(gs,0,99999),killsPerMinute:optionalNumber(killRate,1,60000)}),[options,count,events,baseLevel,jobLimit,gs,killRate]);
  const rankings=useMemo(()=>baseLevel===undefined?[]:rankExperience(model,target),[baseLevel,model,target]);
  const best=rankings[0];
  const perMinute=target==='base'?'basePerMinute':'jobPerMinute';
  const label=target==='base'?'Base':'Job';
  const intervals=eventIntervals(events);
  const comparisons=useMemo(()=>{
    if(!best)return [];
    const trials=[
      {name:'預設 1×／1×',count:1,events:1},
      {name:'只提高怪物數量',count:model.count===1?2:model.count,events:1},
      {name:'只提高事件數量',count:1,events:model.events===1?2:model.events},
      {name:'你的設定',count:model.count,events:model.events},
    ];
    const rows=trials.map(trial=>({...trial,row:estimateExperience(best.stage,best.lap,{...model,...trial})}));
    const baseline=rows[0].row[perMinute];
    return rows.map(trial=>({...trial,delta:baseline>0?(trial.row[perMinute]/baseline-1)*100:0}));
  },[best,model,perMinute]);
  const update=<Key extends keyof ExperienceOptions>(key:Key,value:ExperienceOptions[Key])=>{
    setOptions(previous=>({...previous,[key]:value}));
  };
  const practical=target==='base'?baseLevel!==experienceData.base.max:model.jobLevel<jobLimit;
  return <section className="xp-panel" aria-label="經驗計算機">
    <button type="button" className="xp-return" onClick={onClose}>關卡圖鑑</button>
    <div className="segment xp-target" role="group" aria-label="練等目標">
      <button type="button" className={target==='base'?'on':''} aria-pressed={target==='base'} onClick={()=>setTarget('base')}>Base 經驗</button>
      <button type="button" className={target==='job'?'on':''} aria-pressed={target==='job'} onClick={()=>setTarget('job')}>Job 經驗</button>
    </div>
    <div className="xp-fields">
      <label>目前 Base Lv<input type="number" min={1} max={99} placeholder="輸入 1–99" value={level} onChange={event=>setLevel(event.target.value)} /></label>
      <label>戰力 GS<input type="number" min={0} placeholder="選填，篩選門檻" value={gs} onChange={event=>setGs(event.target.value)} /></label>
      <label>已開放最高周目<select value={options.maxLap} onChange={event=>update('maxLap',Number(event.target.value))}>
        {laps.map((lap,index)=><option key={lap} value={index+1}>{lap}周目</option>)}
      </select></label>
      {target==='job'&&<>
        <label>目前職業階段<select value={options.advancement} onChange={event=>update('advancement',event.target.value as ExperienceOptions['advancement'])}>
          <option value="first">一轉</option><option value="expanded">忍者／神槍手</option><option value="second">二轉</option><option value="third">三轉</option>
        </select></label>
        <label>目前 Job Lv<input type="number" min={1} max={jobLimit} value={model.jobLevel} onChange={event=>update('jobLevel',Math.floor(optionalNumber(event.target.value,1,jobLimit)??1))}/></label>
      </>}
    </div>
    <div className="xp-fields xp-difficulty">
      <label>怪物數量（%）<input type="number" min={100} max={experienceData.spawn.maxCount*100} step={5}
        value={monsterPercent} onChange={event=>setMonsterPercent(event.target.value)} onBlur={()=>setMonsterPercent(String(Math.round(count*100)))}/></label>
      <label>事件數量（%）<input type="number" min={100} max={experienceData.spawn.maxEvents*100} step={5}
        value={eventPercent} onChange={event=>setEventPercent(event.target.value)} onBlur={()=>setEventPercent(String(Math.round(events*100)))}/></label>
    </div>
    <p className="xp-hint">目前每 {decimal.format(intervals.elite)} 秒可出一隻菁英，每 {decimal.format(intervals.horde)} 秒可觸發一波怪物潮。菁英結算經驗為同種普通怪的 5 倍。</p>
    <details className="xp-advanced">
      <summary>進階試算</summary>
      <div className="xp-fields">
        <label>每分鐘擊殺上限<input type="number" min={1} placeholder="選填，例如 180" value={killRate} onChange={event=>setKillRate(event.target.value)}/></label>
        <label>打王、整備與重開（秒）<input type="number" min={0} max={1800} value={options.extraSeconds} onChange={event=>update('extraSeconds',optionalNumber(event.target.value,0,1800)??0)}/></label>
        <label>全服經驗加成<select value={options.serverExp} onChange={event=>update('serverExp',Number(event.target.value))}>
          {[1,1.25,1.5,1.75,2,2.5,3,4,5].map(multiplier=><option key={multiplier} value={multiplier}>{multiplier}×</option>)}
        </select></label>
      </div>
      <label className="xp-checkbox"><input type="checkbox" checked={options.season} onChange={event=>update('season',event.target.checked)}/>納入活動關卡（依遊戲開放狀態）</label>
    </details>

    {best?<div className="xp-results">
      <div className="xp-results-heading"><h2>{label} 經驗／分鐘</h2><span>{model.killsPerMinute?'依擊殺上限試算':'理論試算 · 假設清完刷出的怪'}</span></div>
      {!practical&&<p className="xp-hint">目前等級已滿。下列數字為試算結算經驗，升級效益為零。</p>}
      <ol className="xp-list">
        {rankings.slice(0,all?undefined:5).map(row=><li key={row.stage.id+'-'+row.lap}>
          <div><strong>{row.stage.name} · {laps[row.lap-1]}周目</strong>
            <small>門檻 {number.format(row.stage.gs[row.lap-1]??0)} GS · 怪物平均 Lv {decimal.format(row.rule.averageLevel)}</small></div>
          <div className="xp-score"><strong>{number.format(row[perMinute])}<small>／分</small></strong><small>{number.format(row[target])}／場 · 約 {decimal.format(row.minutes)} 分</small></div>
        </li>)}
      </ol>
      {rankings.length>5&&<button className="xp-return" type="button" onClick={()=>setAll(current=>!current)}>{all?'只顯示前五名':`顯示全部 ${rankings.length} 組`}</button>}
      <details className="xp-advanced">
        <summary>比較怪物與事件倍率 · {best.stage.name} {laps[best.lap-1]}周目</summary>
        <div className="xp-comparison">
          <table><thead><tr><th>設定</th><th>怪物／事件</th><th>{label}／分</th><th>對照預設</th></tr></thead><tbody>
            {comparisons.map(({name,count,events,row,delta})=><tr key={name}><th scope="row">{name}</th>
              <td>{count}×／{events}×</td>
              <td>{number.format(row[perMinute])}</td><td>{delta>0?'+':''}{decimal.format(delta)}%</td>
            </tr>)}
          </tbody></table>
        </div>
      </details>
    </div>:<p className="xp-hint">{baseLevel===undefined?'輸入目前 Base Lv，查看可刷關卡的經驗排名。':'目前 GS 和周目設定下沒有符合的關卡。'}</p>}
    <p className="xp-hint">HANS V{experienceData.source.version} 單刷試算。按預定出怪與首領時間估算，升級進度從 0 XP 起算。實際擊殺、死亡、清王時間與隨機亂入會影響收益。</p>
  </section>;
}
