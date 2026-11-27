import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateExperience,experienceData,defaultExperienceOptions} from '../src/experience.ts';
import {projectSample,validateSample,predictedKills} from '../src/experience-calibration.ts';
const stage=experienceData.stages.find(s=>s.id==='c2_nif');
const options={...defaultExperienceOptions,baseLevel:67,jobLevel:50,advancement:'second',count:20,events:20};
test('Job monster count penalty reproduces the two observed Base/Job ratios under matching inferred conditions',()=>{
 const factor=.025/(1/3)*experienceData.job.scale*stage.jobExp/30*.1/Math.sqrt(20);
 assert.equal(Math.round(4939408*factor),1866);
 assert.equal(Math.round(4648214*factor),1756);
 const model=estimateExperience(stage,1,options);
 assert.equal(Math.round(model.base*factor),model.job);
});
test('Measured samples reproduce actual counts and XP at same settings, without needing time inputs',()=>{
 for(const [kills,base,job] of [[186055,4939408,1866],[173723,4648214,1756]]){
  const sample={stageId:stage.id,lap:1,options,kills,base,job};
  assert.ok(validateSample(sample));
  const p=projectSample(sample);
  assert.equal(p.kills,kills);assert.equal(p.base,base);assert.equal(p.job,job);
  const fewer=projectSample(sample,10,20);
  assert.ok(fewer.kills<kills&&fewer.base<base);
  assert.ok(Number.isFinite(fewer.job)&&fewer.job>=0);
  assert.equal(projectSample({...sample,job:undefined}).job,undefined);
  assert.equal(validateSample({...sample,kills:0}),false);
 }
});
