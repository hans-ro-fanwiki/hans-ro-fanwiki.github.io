import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const source=read('docs/HANS_SOURCE_AUDIT.json').bossSkillBalance;
const data=read('src/data/hans-boss-skill-multipliers.json');
const skills=read('public/data/skills.json');
const latest=read('public/data/balance.json').releases[0];

test('V0.16.0 boss/elite-only multipliers are pinned and match the grouped balance and skill registry',()=>{
 assert.equal(data.sha256,source.main.sha256);
 assert.equal(latest.version,data.version);
 assert.equal(data.reviewedAt,skills.reviewedAt);
 assert.equal(latest.changes.length,0);
 assert.equal(Object.keys(data.jobs).length,13);
 const rows=latest.families.flatMap(f=>f.jobs);
 assert.equal(rows.length,13);
 assert.equal(rows.flatMap(j=>j.bossSkills).length,67);
 for(const job of rows){
  const registry=skills.jobs.find(j=>j.id===job.id);
  assert.equal(registry.rank,3);
  assert.deepEqual(job.skillIds,[]);
  assert.equal(job.damage,undefined);
  assert.deepEqual(Object.fromEntries(job.bossSkills.map(s=>[s.id,s.multiplier])),data.jobs[job.id]);
  for(const s of job.bossSkills){
   assert.ok(registry.skills.includes(s.id)&&s.multiplier>1);
   assert.equal(s.name,skills.skills.find(x=>x.id===s.id).name);
  }
 }
 for(const job of ['ranger','rune_knight','soul_reaper','kagerou','rebellion'])assert.equal(data.jobs[job],undefined);
 assert.equal(data.jobs.sura.skynet_blow,8.04);
 assert.equal(data.jobs.sura.howling_of_lion,28.34);
 assert.equal(data.jobs.minstrel.reverberation,1.02);
 assert.equal(data.jobs.sorcerer.varetyr_spear,1.01);
 assert.equal(data.jobs.guillotine_cross.poison_smoke,23.72);
 assert.equal(data.jobs.arch_bishop.highness_heal,87.64);
});
