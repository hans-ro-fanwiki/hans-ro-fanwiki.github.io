import assert from 'node:assert/strict';
import test from 'node:test';
import {defaultExperienceOptions,estimateExperience,eventIntervals,experienceData,experienceFactors,groupEquivalentLaps,lapExperience,rankExperience} from '../src/experience.ts';

const maze=experienceData.stages.find(stage=>stage.id==='maze');
const nif=experienceData.stages.find(stage=>stage.id==='c2_nif');
const gef=experienceData.stages.find(stage=>stage.id==='c2_gef');
const level70={...defaultExperienceOptions,baseLevel:70,count:1,events:1};

test('seasonal stages are enabled by default and can still be excluded',()=>{
  assert.equal(defaultExperienceOptions.season,true);
  const enabled=rankExperience({...level70,maxLap:1,gs:1000},'base');
  assert.ok(enabled.some(row=>row.stage.season));
  const disabled=rankExperience({...level70,maxLap:1,gs:1000,season:false},'base');
  assert.ok(disabled.every(row=>!row.stage.season));
});

test('chapter-two same XP laps collapse, while the lowest accessible lap stays visible',()=>{
  const under70={...defaultExperienceOptions,baseLevel:65,maxLap:6,gs:9999,season:false,count:1,events:1};
  const baseRows=rankExperience(under70,'base').filter(row=>row.stage.id==='c2_gef');
  assert.equal(baseRows.length,6);
  assert.ok(baseRows.every(row=>row.rule.levelOffset===0&&row.base===baseRows[0].base));
  const merged=groupEquivalentLaps(baseRows,'base');
  assert.equal(merged.length,1);
  assert.equal(merged[0].preferred.lap,1);
  assert.deepEqual(merged[0].variants.map(row=>row.lap),[1,2,3,4,5,6]);
  const byGS=rankExperience({...under70,gs:2830},'base').filter(row=>row.stage.id==='c2_gef');
  assert.deepEqual(groupEquivalentLaps(byGS,'base')[0].variants.map(row=>row.lap),[1,2]);
  const above70=Array.from({length:6},(_,index)=>estimateExperience(gef,index+1,{...under70,baseLevel:70}));
  assert.ok(above70[0].base<above70[1].base&&above70[1].base<above70[2].base);
  assert.ok(above70.slice(3).every(row=>row.base===above70[2].base));
  assert.deepEqual(groupEquivalentLaps(above70,'base').map(group=>group.variants.length),[1,1,4]);
  assert.equal(groupEquivalentLaps(above70,'job').length,1);
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

test('monster count scales supply and events accelerate elites and hordes',()=>{
  const baseline=estimateExperience(maze,3,level70);
  const doubleCount=estimateExperience(maze,3,{...level70,count:2});
  const doubleEvents=estimateExperience(maze,3,{...level70,events:2});
  assert.deepEqual(eventIntervals(2),{elite:22.5,horde:60});
  assert.deepEqual(eventIntervals(1.5),{elite:30,horde:80});
  assert.ok(doubleCount.ordinary>baseline.ordinary*2);
  assert.equal(doubleCount.elite,baseline.elite);
  assert.ok(doubleEvents.elite>baseline.elite && doubleEvents.horde>baseline.horde);
  assert.ok(doubleCount.base>baseline.base*1.9);
});

test('recommendations filter GS and lap gates and rank by the selected per-run metric',()=>{
  const options={...level70,maxLap:3,gs:1800,season:false};
  const ranked=rankExperience(options,'base');
  assert.equal(ranked[0].stage.id,'maze');
  assert.equal(ranked[0].lap,3);
  assert.ok(ranked.every(row=>!row.stage.season&&row.stage.gs[row.lap-1]<=1800&&row.lap<=3));
  assert.ok(ranked.every((row,index)=>index===0||ranked[index-1].base>=row.base));
  assert.ok(rankExperience({...options,season:true},'job').some(row=>row.stage.season));
});

test('default settings and all-stage ranking use full-run XP, not elapsed time',()=>{
 assert.equal(defaultExperienceOptions.baseLevel,60);
 assert.equal(defaultExperienceOptions.count,20);
 assert.equal(defaultExperienceOptions.events,20);
 for(const target of ['base','job']){
  const rows=rankExperience({...defaultExperienceOptions,maxLap:6},target);
  assert.ok(rows.every((r,i)=>i===0||rows[i-1][target]>=r[target]));
  assert.ok(new Set(rows.map(r=>r.stage.bosses.at(-1).time)).size>1);
 }
 assert.equal(rankExperience(defaultExperienceOptions,'base')[0].stage.id,experienceData.stages.find(s=>s.name==='元宵燈會').id);
});
