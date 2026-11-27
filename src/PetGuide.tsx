import {useState} from 'react';
import {petData,petMultiplier,petEffectText} from './pets';

export function PetGuide(){
 const [id,setId]=useState(petData.pets[0].id);
 const [lap,setLap]=useState(1);
 const [intimacy,setIntimacy]=useState(910);
 const [accessory,setAccessory]=useState(false);
 const pet=petData.pets.find(entry=>entry.id===id)!;
 const from=pet.from&&petData.pets.find(entry=>entry.id===pet.from);
 const mult=petMultiplier(lap,intimacy,accessory&&pet.accessory!==null);
 return <>
  <h2 id="pets-title">寵物圖鑑與改造試算</h2>
  <ul className="combat-key-points">
   <li><strong>改造</strong> · 取得更高週目的同種蛋。</li>
   <li><strong>進化</strong> · 繼承原本的改造等級。</li>
  </ul>
  <div className="combat-tool">
   <div className="combat-tool-controls">
    <label className="combat-field">寵物<select aria-label="寵物" value={id} onChange={event=>setId(event.target.value)}>{petData.pets.map(entry=>
     <option key={entry.id} value={entry.id}>{entry.name}</option>
    )}</select></label>
    <label className="combat-field">蛋的週目<select aria-label="蛋的週目" value={lap} onChange={event=>setLap(Number(event.target.value))}>{petData.lapMultipliers.map((factor,i)=>
     <option key={i} value={i+1}>{i+1} 週目（×{factor}）</option>
    )}</select></label>
    <label className="combat-field">親密度<select aria-label="親密度" value={intimacy} onChange={event=>setIntimacy(Number(event.target.value))}>{petData.intimacy.map((row,index)=>
     <option key={row.min} value={row.min}>{['普通','親近','忠誠'][index]}（{row.min} 起，×{row.mult}）</option>
    )}</select></label>
    <label className="toggle"><input type="checkbox" checked={accessory&&pet.accessory!==null} disabled={pet.accessory===null} onChange={event=>setAccessory(event.target.checked)}/>裝備寵物飾品（×{petData.accessoryMultiplier}）</label>
   </div>
   <h3>{pet.name} · 效果倍率 ×{mult}</h3>
   <p>{from?`由 ${from.name} 進化`:`蛋 ID #${pet.egg}`}{pet.accessory!==null?' · 飾品 ID #'+pet.accessory:''}</p>
   <div className="bonus-list">{pet.effects.map(effect=><span key={effect.stat}>{petEffectText(effect,mult)}</span>)}</div>
  </div>
  <details className="combat-details"><summary>升級蛋、親密度與飾品規則</summary>
   <ul className="combat-key-points">
    <li>已有低週目寵物時，更高週目的同種蛋先做 {petData.upgradeEligibility*100}% 的資格判定，再按本來的掉落機率抽選。每場同種蛋最多掉一次。</li>
    <li>改造、親密度與飾品倍率相乘，影響出戰效果與寵物 GS。首次裝備飾品需親密度 750。</li>
   </ul>
  </details>
 </>;
}
