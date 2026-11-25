import type {Equipment,Source,Stage} from './types.ts';

export type TierStatus='verified'|'candidate'|'unknown';
export interface EquipmentTier {text:string;status:TierStatus;levels:number[]}
export interface GearTierOption {tier:number;raid:boolean}
export const TIER_FILTER_OPTIONS:ReadonlyArray<readonly [string,string]>=[
 ['all','全部等級'],...Array.from({length:10},(_,i)=>[String(i+1),'T'+(i+1)] as const),['unknown','等級未確認']
];
export function parseTierFilter(v:string|null):string{
 return TIER_FILTER_OPTIONS.some(([key])=>key===v)?v!:'all';
}
export function sourceTierOptions(source:Source,stages:Map<string,Stage>,lap?:number,verifiedOnly=true):GearTierOption[]{
 if(verifiedOnly&&source.verificationState!=='official')return [];
 const result:GearTierOption[]=[];
 if(Number.isInteger(source.sourceTier)&&source.sourceTier!>=1)result.push({tier:source.sourceTier!,raid:source.sourceType==='raid'});
 if(source.sourceType==='monsterDrop')for(const ref of source.stageRefs){
  if(verifiedOnly&&!ref.verified)continue;
  const stage=stages.get(ref.stageId);
  if(!stage)continue;
  const tiers=lap===undefined?stage.lapTiers:[stage.lapTiers[lap-1]];
  for(const tier of tiers)if(typeof tier==='number'&&Number.isInteger(tier)&&tier>=1)result.push({tier,raid:false});
 }
 return uniqueOptions(result);
}
function uniqueOptions(values:GearTierOption[]):GearTierOption[]{
 return [...new Map(values.map(x=>[String(x.raid)+':'+x.tier,x])).values()].sort((a,b)=>Number(a.raid)-Number(b.raid)||a.tier-b.tier);
}
export function equipmentTierOptions(item:Equipment,stages:Map<string,Stage>,lap?:number,sourceFilter:(s:Source)=>boolean=()=>true):GearTierOption[]{
 return uniqueOptions(item.sources.filter(sourceFilter).flatMap(s=>sourceTierOptions(s,stages,lap)));
}
export function equipmentMatchesTier(item:Equipment,stages:Map<string,Stage>,filter:string,sourceFilter:(s:Source)=>boolean=()=>true,lap?:number):boolean{
 if(filter==='all')return true;
 const options=equipmentTierOptions(item,stages,lap,sourceFilter);
 return filter==='unknown'?options.length===0:options.some(x=>x.tier===Number(filter));
}
function format(options:GearTierOption[]):string{
 return [false,true].flatMap(raid=>{
  const levels=options.filter(x=>x.raid===raid).map(x=>x.tier);
  if(!levels.length)return [];
  const prefix=raid?'副本 ':'';
  const groups:string[]=[];
  for(let i=0;i<levels.length;i++){const start=levels[i];let end=start;while(i+1<levels.length&&levels[i+1]===end+1)end=levels[++i];groups.push('T'+start+(end>start?'–T'+end:''));}
  return [prefix+groups.join('／')];
 }).join(' · ');
}
/** Tiers are source/loot-instance properties. Never infer a tier from a base item ID. */
export function equipmentTier(item:Equipment,stages:Map<string,Stage>):EquipmentTier{
 const confirmed=equipmentTierOptions(item,stages);
 if(confirmed.length)return {text:format(confirmed),levels:[...new Set(confirmed.map(x=>x.tier))].sort((a,b)=>a-b),status:'verified'};
 const possible=uniqueOptions(item.sources.flatMap(s=>sourceTierOptions(s,stages,undefined,false)));
 if(possible.length)return {text:'可能 '+format(possible),levels:[...new Set(possible.map(x=>x.tier))].sort((a,b)=>a-b),status:'candidate'};
 return {text:'Tier 未確認',levels:[],status:'unknown'};
}
