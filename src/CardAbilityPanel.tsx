import {useState} from 'react';
import type {Card,Kind} from './types';
import {abilityTriggers,cardAbilityDetails,cardAbilityText,cardSets,cardSetEffect} from './card-abilities';
import {cardAbilities} from './card-combat-score';

const levelLabel=(level:number)=>level===1?'未改造':level===7?'副本版':'改 '+(level-1);

export function CardAbilityPanel({card,lap,baseId}:{card:Card;lap:number;baseId:number}){
 const ability=cardAbilities[baseId];
 const details=cardAbilityDetails[baseId];
 if(!ability||!details)return null;
 const level=card.raidVariant?7:lap;
 const effects=cardAbilityText(baseId,level)?.match(/[^。]+。?/g)??[];
 return <div className="card-gs-section">
  <h3>特殊能力 · {levelLabel(level)}</h3>
  <p><strong>觸發</strong> · {abilityTriggers[details.trigger]}</p>
  <ul className="combat-key-points">{effects.map(effect=><li key={effect}>{effect}</li>)}</ul>
  <p><strong>尋寶率 +{Math.round(ability.discovery*100)} 個百分點</strong> · 王卡之間只取最高。<br/><a href="?page=combat#discovery">遊戲內顯示為「發現率」</a></p>
  <details className="combat-details"><summary>比較各改造等級</summary>
   <ul>{ability.levels.slice(0,card.raid||card.raidVariant?7:6).map((_,index)=><li key={index}>
    <strong>{levelLabel(index+1)}：</strong>{cardAbilityText(baseId,index+1)}
   </li>)}</ul>
  </details>
 </div>;
}

export function CardSetPreview({cards,lap,openDetail}:{cards:Map<number,Card>;lap:number;openDetail:(kind:Kind,id:number)=>void}){
 const [index,setIndex]=useState(0);
 const combo=cardSets[index];
 const viaLink=location.hash==='#card-sets';
 return <details className="combat-details card-set-preview" id="card-sets" open={viaLink||undefined}>
  <summary>王卡套裝與效果預覽</summary>
  <div className="combat-tool-controls">
   <label className="combat-field">套裝<select aria-label="套裝" value={index} onChange={event=>setIndex(Number(event.target.value))}>{cardSets.map((set,i)=>
    <option key={set.sealed} value={i}>{set.name}</option>
   )}</select></label>
  </div>
  <p><strong>封印卡 {levelLabel(lap)}</strong> · {cardSetEffect(combo.sealed,lap)}</p>
  <p className="combat-note">同時裝備下方兩張卡即生效。搭檔卡不限改造等級。</p>
  <div className="chips">{[combo.sealed,combo.partner].map(id=><button key={id} className="search-more" type="button" onClick={()=>openDetail('card',id)}>
   {cards.get(id)?.name||'卡片 #'+id}
  </button>)}</div>
 </details>;
}
