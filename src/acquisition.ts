import type {Equipment, Source} from './types';

/** Only publish an obtainable status with a checked upstream acquisition path. */
export function hasConfirmedAcquisition(item:Equipment):boolean {
  return item.sources.some((source:Source)=>{
    if(source.verificationState!=='official'||!source.evidence)return false;
    if(source.sourceType==='monsterDrop')
      return source.stageRefs.some(ref=>ref.verified&&ref.verificationState==='official');
    return ['event','starter','story','reward','raid'].includes(source.sourceType) && !!source.detail;
  });
}
