import {useState} from 'react';
import {discoveryProbabilities,qualityNames} from './discovery';
const fmt=(p:number)=>(100*p).toFixed(2)+'%';
const colors=['#9ba3aa','#6dbb81','#71a6ee','#bc91e8','#efaa59'];
export function DiscoveryGuide(){
 const [input,setInput]=useState('100');
 const [minimum,setMinimum]=useState(0);
 const value=Math.max(0,Math.min(100000,Number(input)||0));
 const current=discoveryProbabilities(value,minimum),base=discoveryProbabilities(0,minimum);
 return <>
  <h2 id="discovery-title">尋寶率與掉落機制</h2>
  <p className="combat-lead"><strong>發現率就是尋寶率。</strong> 王卡加成直接加百分點，多張只取最高。</p>
  <dl className="discovery-examples" aria-label="原本尋寶率 300% 的算例">
   <div><dt>原本尋寶率</dt><dd>300%</dd></div>
   <div><dt>特殊王卡 +3</dt><dd>303%</dd></div>
   <div><dt>加上封印王卡 +5</dt><dd>305%</dd></div>
  </dl>
  <ul className="combat-key-points">
   <li><strong>影響品質</strong> · 技能強化、寶箱道具、掉落裝備。</li>
   <li><strong>掉落另算</strong> · 卡片、寵物蛋、裝備件數。</li>
  </ul>
  <div className="combat-tool">
   <div className="combat-tool-heading"><h3>尋寶率品質計算機</h3><p>把裝卡後的總尋寶率填入，例如 303%。</p></div>
   <div className="combat-tool-fields">
    <label className="combat-field">尋寶率總計（%）<input type="number" inputMode="decimal" min="0" max="100000" value={input} onChange={e=>setInput(e.target.value)} onBlur={()=>setInput(String(value))}/></label>
    <label className="combat-field">最低品質<select value={minimum} onChange={e=>setMinimum(Number(e.target.value))}>{qualityNames.map((name,i)=><option value={i} key={name}>{i===0?'不限（普通以上）':name+'以上'}</option>)}</select></label>
   </div>
   <div className="combat-tool-results"><div className="combat-tool-result"><span>基礎傳說率</span><strong>{fmt(current[4])}</strong><small>0% 尋寶率：{fmt(base[4])}</small></div></div>
   <details className="combat-tool-advanced"><summary>各品質機率</summary>
   <div className="discovery-quality-list">{qualityNames.map((name,i)=><div key={name}>
    <div className="discovery-quality-label"><strong>{name}</strong><span>{fmt(base[i])} → <b style={{color:colors[i]}}>{fmt(current[i])}</b></span></div>
    <div className="combat-bar-track"><span style={{width:fmt(current[i]),background:colors[i]}}/></div>
   </div>)}</div></details>

   <details className="combat-tool-advanced"><summary>公式、效益遞減及適用範圍</summary><p>首領最低品質、難度保底、傳說降級與高章節／週目修正可能改變裝備最終品質。此處使用共用品質抽選。</p><p>尋寶率 d = 額外尋寶率百分比 ÷ 100；第 n 階（普通為 0、傳說為 4）的權重乘以 (1 + d ÷ (1 + d)) 的 n 次方，再除以所有可選品質權重的總和。</p><p>原始權重依序為 55、25、13、6.6、1.5。尋寶率越高，每增加同樣百分點帶來的收益越少。</p></details>
  </div>
  <details className="combat-details"><summary>卡片與寵物蛋的掉落率</summary>
   <p>一般遠征王卡原始機率 0.1%，另乘六項難度的獨立掉落倍率；所有難度都設相同時，基礎算例如下。</p>
   <dl className="discovery-faq">{[[100,'0.1%'],[500,'2%'],[1000,'5%'],[2000,'7.5%']].map(([n,p])=><div key={n}><dt>六項難度皆 {n}%</dt><dd>{p}</dd></div>)}</dl>
   <p>一般怪卡、蛋的單隻倍率另受怪物數量與事件造成的供給修正；增加怪量不等於每隻怪的掉率等比例增加。蛋還受取得資格及週目限制。特殊玩法、首領群組、卡片可掉落資格等可能有獨立規則，上表不是每張卡的保證機率。</p>
  </details>
  <details className="combat-details"><summary>裝備件數與品質判定</summary><p>裝備先判定是否掉落，再判定品質；難度可改變掉落倍率及傳說保底／保留規則。一般怪裝備還有單人每場 100 件的上限，首領裝備、卡片不計入該上限。尋寶率不直接改變這些掉落判定，但品質篩選可能改變最後留下的裝備件數。</p></details>
  <details className="combat-details"><summary>王卡加成與來源</summary><p>一般特殊王卡 +3 個百分點，封印王卡 +5 個百分點。兩張都裝時只取 +5，改造不改變加成。</p><p className="combat-note">來源：HANS V0.16.0，2026/11/27 維修後客戶端靜態核對；非伺服器掉落實測。<a href="https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/blob/main/docs/HANS_DISCOVERY_20261127.md" target="_blank" rel="noopener noreferrer">查看來源與適用範圍</a>。</p></details>
 </>;
}
