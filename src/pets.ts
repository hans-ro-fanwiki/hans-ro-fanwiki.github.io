import data from './data/hans-pets.json' with {type:'json'};
import statLabels from './data/hans-stat-labels.json' with {type:'json'};
import type {CardEffect} from './types.ts';

export const petData = data;
const labels:Record<string,{label:string}> = statLabels;
const attributes=new Set(['str','agi','vit','int','dex','luk']);
const flat=new Set([...attributes,'maxHp','armor']);
export function petMultiplier(lap:number,intimacy:number,accessory:boolean){
 const byLap=data.lapMultipliers[lap-1]??1;
 const bond=[...data.intimacy].reverse().find(row=>intimacy>=row.min)?.mult??data.intimacy[0].mult;
 return byLap*bond*(accessory?data.accessoryMultiplier:1);
}
export function petEffectText({stat,value}:CardEffect,multiplier:number){
 const scaled=value*multiplier;
 const unit=flat.has(stat)?'':stat.startsWith('regen')?' HP/s':'%';
 const number=attributes.has(stat)?Math.round(scaled):Number((scaled*(unit==='%'?100:1)).toFixed(3));
 return (labels[stat]?.label||stat)+' +'+number+unit;
}
