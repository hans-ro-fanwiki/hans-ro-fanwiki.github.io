import type {Card,LapRules,Stage} from './types';

export function clampLap(value:number,max=6):number{
 return Number.isInteger(value)&&value>=1&&value<=max?value:1;
}
export function lapSuffix(rules:LapRules,lap:number):string{
 return rules.suffix[clampLap(lap,rules.max)-1]||'';
}
export function isRaidOnlyCard(card:Card):boolean{
 return !!card.raid&&card.sources.every(source=>source.sourceType==='raid');
}
export function cardName(card:Card,rules:LapRules,lap:number):string{
 if(isRaidOnlyCard(card))return card.name+card.raid!.suffix;
 const suffix=lapSuffix(rules,lap);
 return suffix&&card.name.endsWith('卡片')
  ?card.name.slice(0,-2)+suffix+'卡片':card.name+suffix;
}
export function cardId(card:Card,rules:LapRules,lap:number):number{
 return card.id+(clampLap(lap,rules.max)-1)*rules.cardStep;
}
export function cardMultiplier(card:Card,rules:LapRules,lap:number):number{
 if(rules.noScaleCardIds.includes(card.id))return 1;
 return rules.multipliers[clampLap(lap,rules.max)-1]||1;
}
const roundedStats=new Set(['str','agi','vit','int','dex','luk','extraProjectiles','revives']);
function appliedValue(stat:string,value:number,multiplier:number):number{
 const scaled=value*multiplier;
 return roundedStats.has(stat)?Math.round(scaled):scaled;
}
function displayValue(value:number):string{
 const v=Math.round((value+Number.EPSILON)*100)/100;
 return String(Object.is(v,-0)?0:v);
}
export function cardEffects(card:Card,rules:LapRules,lap:number,mult=isRaidOnlyCard(card)?card.raid!.mult:cardMultiplier(card,rules,lap)):string[]{
 return card.bonuses.map((original,index)=>{
  const effect=card.effects[index];
  if(!effect||mult===1)return original;
  const signValue=appliedValue(effect.stat,effect.value,mult)*(original.trim().endsWith('%')?100:1);
  const scaled=displayValue(Math.abs(signValue));
  return original.replace(/[-+]\d+(?:\.\d+)?(?=%| HP\/s|$)/, (signValue<0?'-':'+')+scaled);
 });
}
export const GS_SCALING_LABELS=[
 {id:'melee',label:'近戰系'},
 {id:'magic',label:'魔法系'},
 {id:'ranged',label:'遠程系'}
] as const;

/** Current HANS scoring looks up weights solely by the registered scaling
 * class. Preserve the original 41-job mapping for old gsjob links. */
export function gsScalingForJob(rules:LapRules,jobId:string):string|null{
 const job=rules.jobs.find(item=>item.id===jobId);
 return job&&Object.hasOwn(rules.scoring.classes,job.scaling)?job.scaling:null;
}
export function gsRepresentativeJob(rules:LapRules,scaling:string):string|null{
 const candidates=rules.jobs.filter(job=>job.scaling===scaling);
 return (candidates.find(job=>job.rank===1)||candidates[0])?.id||null;
}
export function cardScore(card:Card,rules:LapRules,lap:number,jobId:string):number|null{
 const job=rules.jobs.find(j=>j.id===jobId);
 if(!job)return null;
 const base=rules.scoring.base,extra=rules.scoring.classes[job.scaling];
 if(!extra)return null;
 const multiplier=card.raidVariant?card.raid!.mult:cardMultiplier(card,rules,lap);
 let raw=0;
 for(const effect of card.effects){
  const value=appliedValue(effect.stat,effect.value,multiplier);
  if(!Number.isFinite(value))return null;
  const weight=effect.stat in rules.scoring.relative?rules.scoring.relative[effect.stat]:extra[effect.stat]??base[effect.stat]??0;
  raw+=weight*value;
 }
 const scored=Math.max(0,Math.round(raw));
 if(card.bossRank==='mvp'||card.bossRank==='mini'){
  const floor=rules.bossFloors[card.bossRank];
  return Math.max(scored,Math.round(floor*(card.raidVariant?1:multiplier)));
 }
 return scored;
}
export function stageLapInfo(stage:Stage,lap:number):{tier:number;gs:number}|null{
 const index=clampLap(lap)-1;
 const tier=stage.lapTiers[index],gs=stage.lapGS[index];
 return tier==null||gs==null?null:{tier,gs};
}
export function stageTierLabel(stage:Stage,lap:number):string{
 const info=stageLapInfo(stage,lap);
 return info?stage.chapter===2?'二章 T'+info.tier:'T'+info.tier:'此關不適用該週目';
}
