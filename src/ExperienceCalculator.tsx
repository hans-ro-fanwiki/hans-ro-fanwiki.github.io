import {useMemo,useState} from 'react';
import {defaultExperienceOptions,estimateExperience,eventIntervals,experienceData,groupEquivalentLaps,rankExperience} from './experience';
import type {ExperienceOptions} from './experience';
import {ExperienceFormula} from './ExperienceFormula';
import {ExperienceCalibration} from './ExperienceCalibration';
import {predictedKills} from './experience-calibration';

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
  const [level,setLevel]=useState(String(defaultExperienceOptions.baseLevel));
  const [target,setTarget]=useState<Metric>('base');
  const [options,setOptions]=useState({...defaultExperienceOptions,baseProgress:0,jobProgress:0});
  const [gs,setGs]=useState('');
  const [monsterPercent,setMonsterPercent]=useState(String(defaultExperienceOptions.count*100));
  const [eventPercent,setEventPercent]=useState(String(defaultExperienceOptions.events*100));
  const [all,setAll]=useState(false);
  const baseLevel=optionalNumber(level,1,experienceData.base.max);
  const jobLimit=jobLimits[options.advancement];
  const count=sliderMultiplier(monsterPercent,experienceData.spawn.maxCount);
  const events=sliderMultiplier(eventPercent,experienceData.spawn.maxEvents);
  const model=useMemo(()=>({...options,count,events,baseLevel:Math.floor(baseLevel??1),jobLevel:Math.min(jobLimit,options.jobLevel),
    gs:optionalNumber(gs,0,99999)}),[options,count,events,baseLevel,jobLimit,gs]);
  const rankings=useMemo(()=>baseLevel===undefined?[]:rankExperience(model,target),[baseLevel,model,target]);
  const grouped=useMemo(()=>groupEquivalentLaps(rankings,target),[rankings,target]);
  const best=grouped[0]?.preferred;
  const collapsed=rankings.length-grouped.length;
  const label=target==='base'?'Base':'Job';
  const intervals=eventIntervals(events);
  const comparisons=useMemo(()=>{
    if(!best)return [];
    const trials=[
      {name:'基準（怪物、事件皆 100%）',count:1,events:1},
      {name:'只提高怪物數量'+(model.count===1?'（示例 200%）':''),count:model.count===1?2:model.count,events:1},
      {name:'只提高事件數量'+(model.events===1?'（示例 200%）':''),count:1,events:model.events===1?2:model.events},
      {name:'目前試算設定',count:model.count,events:model.events},
    ];
    const rows=trials.map(trial=>({...trial,row:estimateExperience(best.stage,best.lap,{...model,...trial})}));
    const baseline=rows[0].row[target];
    return rows.map(trial=>({...trial,delta:baseline>0?(trial.row[target]/baseline-1)*100:0}));
  },[best,model,target]);
  const update=<Key extends keyof ExperienceOptions>(key:Key,value:ExperienceOptions[Key])=>{
    setOptions(previous=>({...previous,[key]:value}));
  };
  const practical=target==='base'?baseLevel!==experienceData.base.max:model.jobLevel<jobLimit;
  return <section className="xp-panel" aria-label="經驗計算機">
    <button type="button" className="xp-return" onClick={onClose}>關卡圖鑑</button>
    <details className="xp-advanced xp-guide">
      <summary>使用教學</summary>
      <ol>
        <li><strong>先選要練的經驗。</strong>預設 Base Lv 60、怪物及事件 2000%；請依角色調整等級及已開放的最高周目。填寫 GS 可篩掉戰力門檻高於你的關卡。若在練 Job，再填職業階段和目前 Job Lv。</li>
        <li><strong>有結算畫面時再做實戰校準。</strong>選擇該場關卡、週目，輸入「怪物」及 Base／Job EXP，推估相近設定的收益。不必輸入傷害或自行換算擊殺上限。</li>
        <li><strong>比較單場通關經驗。</strong>怪物和事件數量填遊戲裡顯示的百分比，例如 200。排行榜會合併同地圖、同收益的週目，預設先看較低週目；展開可查看其他週目。想知道計算原因，可開啟下方「計算依據與公式」。實際經驗請以通關結算為準。</li>
      </ol>
    </details>
    <div className="segment xp-target" role="group" aria-label="練等目標">
      <button type="button" className={target==='base'?'on':''} aria-pressed={target==='base'} onClick={()=>setTarget('base')}>Base 經驗</button>
      <button type="button" className={target==='job'?'on':''} aria-pressed={target==='job'} onClick={()=>setTarget('job')}>Job 經驗</button>
    </div>
    <div className="xp-fields">
      <label>目前 Base Lv<input type="number" min={1} max={99} placeholder="輸入 1–99" value={level} onChange={event=>setLevel(event.target.value)} /></label>
      <label>目前戰力 GS（選填）<input type="number" min={0} placeholder="選填，篩選門檻" value={gs} onChange={event=>setGs(event.target.value)} /></label>
      <label>已解鎖的最高週目<select value={options.maxLap} onChange={event=>update('maxLap',Number(event.target.value))}>
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
      <label>怪物數量（遊戲設定 %）<input type="number" min={100} max={experienceData.spawn.maxCount*100} step={5}
        value={monsterPercent} onChange={event=>setMonsterPercent(event.target.value)} onBlur={()=>setMonsterPercent(String(Math.round(count*100)))}/></label>
      <label>事件數量（遊戲設定 %）<input type="number" min={100} max={experienceData.spawn.maxEvents*100} step={5}
        value={eventPercent} onChange={event=>setEventPercent(event.target.value)} onBlur={()=>setEventPercent(String(Math.round(events*100)))}/></label>
    </div>
    <p className="xp-hint">請填遊戲內的總倍率：100% 為原始數量，200% 為兩倍，不是額外增加 200%。GS 留空不限制戰力門檻。</p>
    <p className="xp-hint">目前每 {decimal.format(intervals.elite)} 秒可出一隻菁英，每 {decimal.format(intervals.horde)} 秒可觸發一波怪物潮。菁英結算經驗為同種普通怪的 5 倍。</p>
    <details className="xp-advanced">
      <summary>進階試算</summary>
      <p className="xp-hint">預設依關卡完整出怪排程試算，不假設玩家的實際清怪比例。</p>
      <div className="xp-fields">
        <label>開局 Base 經驗進度（%）<input type="number" min={0} max={99.9} step={.1} value={Math.round(options.baseProgress*1000)/10} onChange={event=>update('baseProgress',(optionalNumber(event.target.value,0,99.9)??0)/100)}/></label>
        {target==='base'&&<><label>實測職業階段<select value={options.advancement} onChange={event=>update('advancement',event.target.value as ExperienceOptions['advancement'])}><option value="first">一轉</option><option value="expanded">忍者／神槍手</option><option value="second">二轉</option><option value="third">三轉</option></select></label><label>實測開局 Job Lv<input type="number" min={1} max={jobLimit} value={model.jobLevel} onChange={event=>update('jobLevel',Math.floor(optionalNumber(event.target.value,1,jobLimit)??1))}/></label></>}
        <label>開局 Job 經驗進度（%）<input type="number" min={0} max={99.9} step={.1} value={Math.round(options.jobProgress*1000)/10} onChange={event=>update('jobProgress',(optionalNumber(event.target.value,0,99.9)??0)/100)}/></label>
        <label>全服經驗倍率<select value={options.serverExp} onChange={event=>update('serverExp',Number(event.target.value))}>
          {[1,1.25,1.5,1.75,2,2.5,3,4,5].map(multiplier=><option key={multiplier} value={multiplier}>{multiplier}×</option>)}
        </select></label>
      </div>
      <label className="xp-checkbox"><input type="checkbox" checked={options.season} onChange={event=>update('season',event.target.checked)}/>納入活動關卡（依遊戲開放狀態）</label>
    </details>
    <p className="xp-hint">目前試算：全服經驗 {options.serverExp}×；{options.season?'包含活動關卡':'不含活動關卡'}。可在進階試算調整。</p>

    {best?<div className="xp-results">
      <div className="xp-results-heading"><h2>單場 {label} 經驗排行</h2><span>理論出怪試算 · 非實際保證值</span></div>
      {!practical&&<p className="xp-hint">目前等級已滿。下列數字為試算結算經驗，升級效益為零。</p>}
      {target==='base'&&baseLevel!==undefined&&baseLevel<experienceData.lap.minLv&&<p className="xp-note"><strong>Lv {experienceData.lap.minLv} 前：</strong>第二章同地圖的週目 Base 獎勵倍率相同；高週目不會自動獲得更多擊殺經驗。升到 Lv {experienceData.lap.minLv} 後會依新等級重新計算。</p>}
      <p className="xp-hint">符合條件共 {rankings.length} 組{collapsed>0?`，已合併 ${collapsed} 組同收益週目`:''}。相同經驗優先顯示較低週目，其他週目可展開；此排序不推測各週目的清怪速度。</p>
      <ol className="xp-list">
        {grouped.slice(0,all?undefined:5).map(({preferred:row,variants})=><li key={row.stage.id+'-'+row.lap}>
          <div className="xp-rank-line">
            <div className="xp-rank-info"><strong>{row.stage.name} · {laps[row.lap-1]}週目</strong>
              <small>門檻 {number.format(row.stage.gs[row.lap-1]??0)} GS · 怪物平均 Lv {decimal.format(row.rule.averageLevel)}</small>
              {variants.length>1&&<span className="xp-equivalent">同收益週目 · 優先顯示較低難度</span>}
            </div>
            <div className="xp-score"><strong>{number.format(row[target])}<small>／場</small></strong><small>理論怪物數 {number.format(predictedKills(row))} 隻</small></div>
          </div>
          {variants.length>1&&<details className="xp-lap-details">
            <summary>另有 {variants.length-1} 個週目同收益 · 查看各週目門檻</summary>
            <ul>{variants.slice(1).map(variant=><li key={variant.lap}><span>{laps[variant.lap-1]}週目</span><span>門檻 {number.format(variant.stage.gs[variant.lap-1]??0)} GS</span><strong>{number.format(variant[target])}／場</strong></li>)}</ul>
          </details>}
        </li>)}
      </ol>
      {grouped.length>5&&<button className="xp-return" type="button" onClick={()=>setAll(current=>!current)}>{all?'只顯示前五名':`顯示全部 ${grouped.length} 個不同收益選項`}</button>}
      <details className="xp-advanced">
        <summary>比較怪物與事件倍率 · {best.stage.name} {laps[best.lap-1]}週目</summary>
        <p className="xp-hint">比較基準固定為 100%／100%；若目前某項仍為 100%，另外示範 200% 的效果，不會更改你的試算設定。</p>
        <div className="xp-comparison">
          <table><thead><tr><th>設定</th><th>怪物／事件</th><th>{label}／場</th><th>相較基準</th></tr></thead><tbody>
            {comparisons.map(({name,count,events,row,delta})=><tr key={name}><th scope="row">{name}</th>
              <td>{count}×／{events}×</td>
              <td>{number.format(row[target])}</td><td>{delta>0?'+':''}{decimal.format(delta)}%</td>
            </tr>)}
          </tbody></table>
        </div>
      </details>
    </div>:<p className="xp-hint">{baseLevel===undefined?'輸入目前 Base Lv，查看可刷關卡的經驗排名。':'目前 GS 和周目設定下沒有符合的關卡。'}</p>}
    <ExperienceCalibration options={model}/>
    <ExperienceFormula baseLevel={baseLevel}/>
    <p className="xp-hint">HANS V{experienceData.source.version} 單刷試算。依各關卡自身波次及最後首領出場時間累計經驗，不以刷關耗時排名，預設升級進度為 0，可在進階試算調整。實際擊殺、死亡與隨機亂入會影響收益；不含電腦效能或連刷時間假設。</p>
  </section>;
}
