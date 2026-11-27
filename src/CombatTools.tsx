import {useEffect,useId,useState,type ReactNode} from 'react';
import {castSeconds,cooldownSeconds,effectiveRange,normalDamage} from './combat-calculators';

const fmt=(n:number)=>Number(n.toFixed(2)).toLocaleString('zh-TW',{maximumFractionDigits:2});
const pct=(n:number)=>fmt(n)+'%';
function Field({label,value,onChange,max=10000,step=1,min=0}:{label:string;value:number;onChange:(n:number)=>void;max?:number;step?:number;min?:number}){
 const id=useId();
 return <label className="combat-field" htmlFor={id}><span>{label}</span><input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,Number(e.target.value)||0)))}/></label>;
}
function Result({label,value,detail}:{label:string;value:string;detail?:string}){
 return <div className="combat-tool-result"><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>;
}
function Bars({values,unit='秒'}:{values:{label:string;value:number}[];unit?:string}){
 const max=Math.max(1,...values.map(v=>v.value));
 return <div className="combat-bars">{values.map(({label,value},i)=><div key={label}>
  <div><span>{label}</span><strong>{fmt(value)} {unit}</strong></div>
  <div className="combat-bar-track"><span className={i===values.length-1?'is-result':''} style={{width:Math.max(0,value/max*100)+'%'}}/></div>
 </div>)}</div>;
}
function HasteCurve({current,next}:{current:number;next:number}){
 const end=Math.max(300,Math.ceil(Math.max(current,next)/100)*100);
 const x=(v:number)=>36+284*Math.max(0,v)/end;
 const y=(v:number)=>148-124*(1-1/(1+Math.max(0,v)/100));
 const path=Array.from({length:81},(_,i)=>{const v=end*i/80;return (i===0?'M':'L')+x(v).toFixed(2)+' '+y(v).toFixed(2)}).join(' ');
 return <figure className="combat-curve">
  <figcaption>急速與實際冷卻縮減曲線</figcaption>
  <svg viewBox="0 0 340 178" role="img" aria-label={'急速越高，實際冷卻縮減逐漸接近100%。目前 '+pct(Math.max(0,current))+'，增加急速後 '+pct(Math.max(0,next))}>
   {[0,25,50,75,100].map(v=><g key={v}><line x1="36" x2="320" y1={148-124*v/100} y2={148-124*v/100} className="combat-curve-grid"/><text x="30" y={151-124*v/100} textAnchor="end">{v}%</text></g>)}
   {[0,end/2,end].map(v=><text key={v} x={x(v)} y="164" textAnchor="middle">{fmt(v)}%</text>)}
   <path d={path} fill="none" stroke="var(--wiki-accent)" strokeWidth="2.5"/>
   {[{v:current,color:'var(--wiki-muted)'},{v:next,color:'var(--wiki-accent)'}].map(({v,color},i)=><g key={i}><line x1={x(v)} y1={y(v)} x2={x(v)} y2="148" stroke={color} strokeDasharray="3 3"/><circle cx={x(v)} cy={y(v)} r="4.5" fill={color} stroke="var(--wiki-surface)" strokeWidth="1.5"/></g>)}
  </svg>
  <div className="combat-curve-key"><span>目前 {pct(Math.max(0,current))}</span><span>增加急速後 {pct(Math.max(0,next))}</span></div>
 </figure>;
}
type Skill={id:string;name:string;originalName:string;cooldown:number|null};
export function CooldownTool({renderCompatibility}:{renderCompatibility:(skill:Skill)=>ReactNode}){
 const [base,setBase]=useState(10),[haste,setHaste]=useState(0),[added,setAdded]=useState(0),[local,setLocal]=useState(0),[buff,setBuff]=useState(0);
 const [skills,setSkills]=useState<Skill[]>([]),[loadFailed,setLoadFailed]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState('');
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/skills.json?schema=1',{signal:ac.signal})
   .then(r=>{if(!r.ok)throw Error('skills');return r.json()})
   .then(d=>{if(d.server!=='hans'||!Array.isArray(d.skills))throw Error('skills');setSkills(d.skills)})
   .catch(()=>{if(!ac.signal.aborted)setLoadFailed(true)});
  return ()=>ac.abort();
 },[]);
 const matches=skills.filter(s=>[s.name,s.originalName].some(n=>n.toLowerCase().includes(query.trim().toLowerCase())));
 const skill=skills.find(s=>s.id===selected);
 const now=cooldownSeconds(base,haste,local,buff),next=cooldownSeconds(base,haste+added,local,buff);
 const reduction=base>0?(1-now/base)*100:0;
 const nextReduction=base>0?(1-next/base)*100:0;
 return <div className="combat-tool">
  <div className="combat-tool-heading"><h2>急速與冷卻</h2><p>填目前急速，試算技能冷卻。要比較配裝，再填額外急速。</p></div>
  <div className="combat-tool-fields">
   <label className="combat-field"><span>搜尋技能（選填）</span><input type="search" placeholder="中文／英文技能名" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label className="combat-field"><span>帶入技能</span><select value={selected} onChange={e=>{const id=e.target.value;setSelected(id);const s=skills.find(s=>s.id===id);if(s?.cooldown!=null)setBase(s.cooldown)}}><option value="">手動輸入</option>{skill&&!matches.includes(skill)&&<option value={skill.id}>{skill.name}</option>}{matches.map(s=><option key={s.id} value={s.id}>{s.name}{s.cooldown!==null?' · '+s.cooldown+' 秒':''}</option>)}</select></label>
   <Field label="基礎冷卻（秒）" value={base} onChange={setBase} step={0.1}/>
   <Field label="目前急速（%）" value={haste} onChange={setHaste} min={-100}/>
   <Field label="額外增加急速（%）" value={added} onChange={setAdded} min={-100}/>
  </div>
  <p className="combat-note">10 秒是範例，可修改或選技能。已有的急速只填一次。</p>
  {loadFailed&&<p className="combat-note" role="status">技能資料載入失敗，仍可手動試算。</p>}
  {skill?.cooldown===null&&<p className="combat-note">這招的基礎冷卻尚未核對，請自行輸入。</p>}
  <label className="combat-slider"><span>拖曳調整目前急速 <strong>{pct(haste)}</strong></span><input type="range" min={Math.min(0,haste)} max={Math.max(300,haste)} step={1} value={haste} onChange={e=>setHaste(Number(e.target.value))}/><span className="combat-slider-ticks"><span>{Math.min(0,haste)}%</span><span>{Math.max(300,haste)}%</span></span></label>
  <details className="combat-tool-advanced"><summary>進階：技能自身急速與目前 Buff</summary><div className="combat-tool-fields"><Field label="技能自身急速（%）" value={local} onChange={setLocal} min={-100}/><Field label="目前急速 Buff（%）" value={buff} onChange={setBuff} max={200}/></div><p className="combat-note">若數值已包含在全域急速，勿重複輸入。一般分段急速 Buff 上限 200；特殊技能另有條件。</p></details>
  <div className="combat-tool-results" aria-live="polite"><Result label="目前冷卻時間" value={fmt(now)+' 秒'} detail={'實際冷卻縮減 '+pct(reduction)}/><Result label="增加急速後的冷卻時間" value={fmt(next)+' 秒'} detail={'實際冷卻縮減 '+pct(nextReduction)}/><Result label={next>now?'每次增加時間':'每次節省時間'} value={fmt(Math.abs(now-next))+' 秒'} detail={now>0&&next>0?'理論施放頻率 '+(next<now?'+':'')+pct((now/next-1)*100):'基礎冷卻為零'}/></div>
  <Bars values={[{label:'原始冷卻',value:base},{label:'目前急速',value:now},{label:'增加急速後',value:next}]}/>
  <HasteCurve current={haste+local+buff} next={haste+added+local+buff}/>
  <div className="combat-jump"><a href="?page=items&attr=cooldown">查詢急速裝備</a><a href="?page=cards&attr=cooldown">查詢急速卡片</a></div>
  <details className="combat-tool-advanced"><summary>公式、算例及限制</summary><p>目前急速 50%，再加 25 個百分點，合計 75%。</p><p className="combat-formula">實際冷卻 = 基礎冷卻 ÷ (1 + max(0, 全域急速 + 技能急速 + 目前 Buff) / 100)</p><p>急速 +100% 相當於實際冷卻縮減 50%。上面的比較不計塔倍率、特殊冷卻改寫、施法或動畫時間，也不代表實際 DPS。全域急速的合法配裝最大值尚未確認；滑桿上限只是操作範圍。</p></details>
  {skill&&<details className="combat-tool-advanced"><summary>查閱 {skill.name} 適用的詞條與神格</summary>{renderCompatibility(skill)}<a href={'?page=skills&sk='+encodeURIComponent(skill.id)}>開啟完整技能圖鑑</a></details>}
 </div>;
}
export function DefenseTool(){
 const [input,setInput]=useState(100),[armor,setArmor]=useState(0),[reduction,setReduction]=useState(0),[buff,setBuff]=useState(0),[def,setDef]=useState(0),[pvp,setPvp]=useState(false);
 const r=normalDamage(input,armor,reduction,buff,def,pvp);
 return <div className="combat-tool">
  <div className="combat-tool-heading"><h3>承傷試算</h3></div>
  <div className="combat-tool-fields"><Field label="減傷前的傷害" value={input} onChange={setInput} max={1000000000}/><Field label="目前護甲（含 Buff）" value={armor} onChange={setArmor}/><Field label="原始減傷加總（%）" value={reduction} onChange={setReduction}/><Field label="目前暫時減傷（%）" value={buff} onChange={setBuff} max={80}/><Field label="目前 DEF" value={def} onChange={setDef}/><label className="combat-field"><span>玩法</span><select value={pvp?'pvp':'pve'} onChange={e=>setPvp(e.target.value==='pvp')}><option value="pve">PvE</option><option value="pvp">PvP／公會戰</option></select></label></div>
  <p className="combat-note">100 傷害是範例。原始減傷填常駐詞條合計，暫時減傷填額外 Buff。</p>
  <div className="combat-tool-results" aria-live="polite"><Result label="實際受到傷害" value={fmt(r.damage)}/><Result label="百分比減傷（不含 DEF）" value={pct(r.effectiveReduction*100)} detail={'自身 '+pct(r.ownReduction*100)+'；合計上限 '+(pvp?'70%':'85%')}/><Result label="DEF 額外減傷" value={pct(r.defReduction*100)}/></div>
  <Bars unit="傷害" values={[{label:'原始傷害',value:input},{label:'最終承傷',value:r.damage}]}/><p className="combat-note">一般承傷試算。其他情況見下方的防禦特例。</p>
 </div>;
}
export function RangeTool(){
 const [current,setCurrent]=useState(0),[added,setAdded]=useState(0);
 const before=effectiveRange(current),after=effectiveRange(current+added);
 return <div className="combat-tool">
  <div className="combat-tool-heading"><h3>範圍／近戰距離收益</h3><p>先選要試算的項目，再填目前詞條加成的總和。</p></div>
  <div className="combat-tool-fields"><Field label="目前加成總和（%）" value={current} onChange={setCurrent}/><Field label="額外增加（%）" value={added} onChange={setAdded}/></div>
  <p className="combat-note">裝備 +20%、卡片 +30%，目前加成填 50%。</p>
  <div className="combat-tool-results" aria-live="polite"><Result label="目前實際倍率" value={fmt(before)+' 倍'}/><Result label="增加後的倍率" value={fmt(after)+' 倍'}/><Result label="相較目前增加" value={pct((after/before-1)*100)}/></div>
  <Bars unit="倍" values={[{label:'原始範圍',value:1},{label:'目前',value:before},{label:'新增後',value:after}]}/>
  <details className="combat-tool-advanced"><summary>遞減曲線與適用條件</summary><p className="combat-formula">x = 1 + 原始加成 / 100；x 大於 1 時，有效倍率 = 1 + (x − 1) / (1 + (x − 1) / 2)</p><p>角色全域倍率逐漸趨近 3 倍，不是硬性上限。技能自身範圍、固定距離與其他乘數另計，請查各技能適用的詞條。</p></details>
 </div>;
}
export function CastTool(){
 const [base,setBase]=useState(3),[dex,setDex]=useState(0),[haste,setHaste]=useState(0),[area,setArea]=useState(false);
 const next=castSeconds(base,dex,haste,area);
 return <div className="combat-tool">
  <div className="combat-tool-heading"><h2>施法急速與 DEX</h2><p>試算技能讀條時間。單體與範圍技能分開算。</p></div>
  <div className="combat-tool-fields"><Field label="基礎施法時間（秒）" value={base} onChange={setBase} step={0.1}/><Field label="目前 DEX" value={dex} onChange={setDex}/><Field label="目前施法急速（%）" value={haste} onChange={setHaste} min={-100}/><label className="combat-field"><span>技能類型</span><select value={area?'area':'single'} onChange={e=>setArea(e.target.value==='area')}><option value="single">單體（DEX 係數 100）</option><option value="area">範圍（DEX 係數 150）</option></select></label></div>
  <p className="combat-note">3 秒是範例。施法急速填技能與 Buff 的合計，每個來源只算一次。</p>
  <div className="combat-tool-results" aria-live="polite"><Result label="目前施法時間" value={fmt(next)+' 秒'}/><Result label="讀條縮短比例" value={pct(base>0?(1-next/base)*100:0)}/></div>
  <Bars values={[{label:'原始施法時間',value:base},{label:'套用 DEX 與施法急速',value:next}]}/>
  <details className="combat-tool-advanced"><summary>查看公式與限制</summary><p className="combat-formula">施法時間 = 基礎時間 × max(0, 1 − DEX / K) ÷ (1 + max(0, 施法急速) / 100)</p><p>K 為單體 100、範圍 150。按等級變化的基礎施法時間、技能專屬條件與特殊計時需另行核對。</p></details>
 </div>;
}
