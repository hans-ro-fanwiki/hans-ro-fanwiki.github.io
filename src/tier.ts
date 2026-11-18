import type {Equipment,Stage,StageRef} from './types';

export type TierStatus='verified'|'candidate'|'unknown';
export interface EquipmentTier {text:string;status:TierStatus;levels:number[]}

/** Game Tier belongs to each loot instance / source stage, not the base item ID. */
export function equipmentTier(item:Equipment,stages:Map<string,Stage>):EquipmentTier{
 const linked=item.sources
  .filter(source=>source.sourceType==='monsterDrop')
  .flatMap(source=>source.stageRefs)
  .filter(ref=>Number.isInteger(stages.get(ref.stageId)?.tier));
 const verifiedStage=levels(linked.filter(ref=>ref.verified),stages);
 const verifiedSpecial=item.sources.filter(s=>s.verificationState==='official'&&s.evidence&&Number.isInteger(s.sourceTier)&&typeof s.sourceTier==='number'&&s.sourceTier>=1).map(s=>s.sourceTier!);
 const verified=[...new Set([...verifiedStage,...verifiedSpecial])].sort((a,b)=>a-b);
 if(verified.length)return {text:format(verified),levels:verified,status:'verified'};
 const possible=levels(linked,stages);
 if(possible.length)return {text:'可能 '+format(possible),levels:possible,status:'candidate'};
 return {text:'Tier 未確認',levels:[],status:'unknown'};
}
function levels(refs:StageRef[],stages:Map<string,Stage>):number[]{
 return [...new Set(refs.map(ref=>stages.get(ref.stageId)?.tier).filter((value):value is number=>typeof value==='number'&&value>=1))].sort((a,b)=>a-b);
}
function format(choices:number[]):string{
 return 'Tier '+choices.join('／');
}
