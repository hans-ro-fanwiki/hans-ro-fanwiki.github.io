import type {Stage} from './types';

export type StageType='all'|'normal'|'event'|'story';

export function parseStageType(value:string|null,legacyOpen:string|null):StageType{
 if(value==='normal'||value==='event'||value==='story')return value;
 return legacyOpen==='1'?'normal':'all';
}
export function matchesStageType(stage:Pick<Stage,'season'|'story'>,type:StageType):boolean{
 switch(type){
  case 'normal': return !stage.season&&!stage.story;
  case 'event': return stage.season;
  case 'story': return stage.story;
  default: return true;
 }
}
