import assert from 'node:assert/strict';
import test from 'node:test';
import {defaultExperienceOptions,estimateExperience,eventIntervals,experienceData,experienceFactors,lapExperience,rankExperience} from '../src/experience.ts';

const maze=experienceData.stages.find(stage=>stage.id==='maze');
const nif=experienceData.stages.find(stage=>stage.id==='c2_nif');
const level70={...defaultExperienceOptions,baseLevel:70};

test('seasonal stages are enabled by default and can still be excluded',()=>{
  assert.equal(defaultExperienceOptions.season,true);
  const enabled=rankExperience({...level70,maxLap:1,gs:1000},'base');
  assert.ok(enabled.some(row=>row.stage.season));
  const disabled=rankExperience({...level70,maxLap:1,gs:1000,season:false},'base');
  assert.ok(disabled.every(row=>!row.stage.season));
});

test('HANS level gap and Base 70 threshold match both audited penalty curves',()=>{
  assert.equal(experienceFactors(60,58,1,false).base,.25);
  assert.equal(experienceFactors(90,58,1,false).base,.01);
  assert.equal(experienceFactors(69,80,2,true).base,1/3);
  assert.equal(experienceFactors(70,80,2,true).base,2/3);
  assert.equal(experienceFactors(70,80,2,true).job,.025);
  assert.equal(experienceFactors(99,70,2,true).job,.15*.025);
  assert.equal(lapExperience(nif,3).levelOffset,0);
  assert.equal(lapExperience(nif,6).baseLap,lapExperience(nif,3).baseLap);
  assert.ok(lapExperience(maze,6).averageLevel>lapExperience(maze,3).averageLevel);
});

test('monster count scales supply, events accelerate elites and hordes, and kill rate limits XP gain',()=>{
  const baseline=estimateExperience(maze,3,level70);
  const doubleCount=estimateExperience(maze,3,{...level70,count:2});
  const doubleEvents=estimateExperience(maze,3,{...level70,events:2});
  const capped=estimateExperience(maze,3,{...level70,killsPerMinute:180});
  const cappedDouble=estimateExperience(maze,3,{...level70,count:2,killsPerMinute:180});
  assert.deepEqual(eventIntervals(2),{elite:22.5,horde:60});
  assert.deepEqual(eventIntervals(1.5),{elite:30,horde:80});
  assert.ok(doubleCount.ordinary>baseline.ordinary*2);
  assert.equal(doubleCount.elite,baseline.elite);
  assert.ok(doubleEvents.elite>baseline.elite && doubleEvents.horde>baseline.horde);
  assert.ok(doubleCount.basePerMinute>baseline.basePerMinute*1.9);
  assert.ok(cappedDouble.basePerMinute/capped.basePerMinute<1.06);
});

test('recommendations filter GS and lap gates and rank by the selected per-minute metric',()=>{
  const options={...level70,maxLap:3,gs:1800,season:false};
  const ranked=rankExperience(options,'base');
  assert.equal(ranked[0].stage.id,'maze');
  assert.equal(ranked[0].lap,3);
  assert.ok(ranked.every(row=>!row.stage.season&&row.stage.gs[row.lap-1]<=1800&&row.lap<=3));
  assert.ok(ranked.every((row,index)=>index===0||ranked[index-1].basePerMinute>=row.basePerMinute));
  assert.ok(rankExperience({...options,season:true},'job').some(row=>row.stage.season));
});
