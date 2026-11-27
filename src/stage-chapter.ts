import type {Stage} from './types';

export type StageChapter='all'|'1'|'2'|'3';

export const stageChapterLabels = {1:'第一章',2:'第二章',3:'第三章'} as const;

export function parseStageChapter(value:string|null):StageChapter {
 return value==='1'||value==='2'||value==='3'?value:'all';
}

/** Show the newest registered chapter first in the combined list.
 * The source catalog stays unchanged (including stage IDs and order).
 */
export function stageChapterGroups(stages:Stage[],chapter:StageChapter,matches:(stage:Stage)=>boolean){
 const filtered=stages.filter(stage=>
  (chapter==='all'||String(stage.chapter)===chapter)&&matches(stage)
 );
 return ([3,2,1] as const).map(number=>({
  chapter:number,
  stages:filtered.filter(stage=>stage.chapter===number)
 })).filter(group=>group.stages.length>0);
}
