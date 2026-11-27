import {estimateExperience,experienceData} from './experience.ts';
import type {ExperienceOptions} from './experience.ts';
type Stage=typeof experienceData.stages[number];
export interface BattleSample {
 stageId:string;lap:number;options:ExperienceOptions;
 kills:number;base:number;job?:number;
}
export function validateSample(sample:BattleSample){
 const stage=experienceData.stages.find(s=>s.id===sample.stageId);
 return !!stage&&Number.isInteger(sample.lap)&&sample.lap>=1&&sample.lap<=experienceData.maxLap&&stage.gs[sample.lap-1]!=null
 &&Number.isSafeInteger(sample.kills)&&sample.kills>0&&Number.isSafeInteger(sample.base)&&sample.base>=0
 &&(sample.job===undefined||Number.isSafeInteger(sample.job)&&sample.job>=0);
}
export const predictedKills=(r:ReturnType<typeof estimateExperience>)=>r.ordinary+r.elite+r.horde+r.stage.bosses.length;
function theoretical(stage:Stage,lap:number,options:ExperienceOptions){
 return estimateExperience(stage,lap,options);
}
// The sample anchors the same stage/lap only. Ratios for a different count/event
// are conditional scenarios, not fitted universal clear capacity or a guarantee.
export function projectSample(sample:BattleSample,count=sample.options.count,events=sample.options.events){
 if(!validateSample(sample))throw Error('Invalid battle sample');
 const stage=experienceData.stages.find(s=>s.id===sample.stageId)!;
 const baseline=theoretical(stage,sample.lap,sample.options);
 const next=theoretical(stage,sample.lap,{...sample.options,count,events});
 const kills=Math.round(sample.kills*predictedKills(next)/Math.max(1,predictedKills(baseline)));
 const base=Math.round(sample.base*next.base/Math.max(1,baseline.base));
 const job=sample.job===undefined?undefined:Math.round(sample.job*next.job/Math.max(1,baseline.job));
 return {count,events,kills,base,job,
  estimatedSupply:Math.round(predictedKills(baseline)),observedRatio:sample.kills/Math.max(1,predictedKills(baseline)),
  basePerKill:sample.base/sample.kills,
  same:count===sample.options.count&&events===sample.options.events};
}
