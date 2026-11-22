import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {careerRoutes,routeForJob,routeForSkill,jobsForSelection,searchSkillName} from '../src/skills.ts';

const data=JSON.parse(readFileSync(new URL('../public/data/skills.json',import.meta.url),'utf8'));
const talents=JSON.parse(readFileSync(new URL('../public/data/talents.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../docs/HANS_SOURCE_AUDIT.json',import.meta.url),'utf8'));

test('HANS skills encyclopedia is source-pinned, complete, and remains HANS only',()=>{
 assert.equal(data.server,'hans');
 assert.equal(data.schemaVersion,1);
 assert.equal(data.source.sha256,audit.skillsSoul.sha256);
 assert.equal(data.jobs.length,41);
 assert.equal(data.skills.length,244);
 assert.equal(new Set(data.skills.map(s=>s.id)).size,244);
 assert.equal(data.jobs.reduce((n,job)=>n+job.skills.length,0),256);
 const registry=new Map(data.skills.map(skill=>[skill.id,skill]));
 for(const job of talents.jobs){
  const matched=data.jobs.find(j=>j.id===job.job);
  assert.ok(matched,'Missing job '+job.job);
  assert.equal(matched.rank,job.rank);
  assert.deepEqual(matched.skills,job.skills.map(s=>s.id));
  for(const ref of job.skills){
   const skill=registry.get(ref.id);
   assert.ok(skill,'Missing skill '+ref.id);
   assert.equal(skill.icon,ref.icon);
   assert.ok(skill.name&&skill.originalName);
   assert.match(skill.icon,/^[a-z0-9_-]+$/i);
   assert.ok(skill.cooldown===null||(Number.isFinite(skill.cooldown)&&skill.cooldown>=0));
  }
 }
 assert.ok(data.skills.every(s=>/\p{Script=Han}/u.test(s.name)&&/\p{Script=Han}/u.test(s.description)&&! /\{\d+\}/.test(s.description)));
 assert.ok(data.skills.filter(s=>s.upgradeDescription).length>=100);
 assert.ok(data.skills.filter(s=>s.cooldown!==null).length>=180);
 assert.equal(registry.get('asura_strike').cooldown,4.9);
 assert.equal(registry.get('asura_strike').baseDamage,347);
 assert.equal(registry.get('call_spirits').baseDamage,54);
 assert.match(registry.get('call_spirits').description,/8 秒/);
 assert.match(registry.get('rolling_cutter').description,/5 層.*12%/);
 assert.equal(registry.get('potion_pitcher').cooldown,10);
 assert.match(registry.get('heal').description,/5%/);
 assert.equal(registry.get('bash').name,'狂擊');
 assert.match(registry.get('firebolt').description,/火球/);
 assert.equal(registry.get('meteor_storm').cooldown,14);
 assert.match(registry.get('comet').description,/彗星/);
 const thirdSkills=[...new Set(data.jobs.filter(j=>j.rank===3).flatMap(j=>j.skills))].map(id=>registry.get(id));
 assert.equal(thirdSkills.length,96);
 assert.ok(thirdSkills.every(s=>/[\u3400-\u9fff]/.test(s.name)),'All 96 third-job skill titles must use native HANS Chinese name mappings');
 assert.equal(registry.get('comet').name,'彗星術');
 assert.equal(registry.get('adoramus').name,'讚頌');
 assert.equal(registry.get('rolling_cutter').name,'迴旋斬');
 assert.equal(registry.get('cart_cannon').name,'推車砲');
 assert.equal(registry.get('aimed_bolt').name,'瞄準射擊');
 assert.equal(registry.get('dragon_breath').name,'龍息');
 assert.equal(registry.get('comet').originalName,'Comet Fall');
 assert.ok(data.skills.every(s=>!('image' in s)&&!('url' in s)),'Do not distribute game icons');
});
test('Nine first jobs form sixteen exact HANS career paths, including unusual specialties',()=>{
 const routes=careerRoutes(data.jobs);
 assert.equal(data.jobs.filter(j=>j.rank===1).length,9);
 assert.equal(routes.length,16);
 const ids=new Set(routes.map(r=>r.id));
 assert.equal(ids.size,16,'A terminal job may not be in multiple branches');
 for(const route of routes){
  assert.equal(route.jobs[0].rank,1);
  assert.equal(route.jobs[1].rank,2);
  assert.equal(route.jobs[2].rank,3);
  assert.equal(route.jobs.length,3);
 }
 const mage=routes.filter(r=>r.base.id==='mage');
 assert.deepEqual(mage.map(r=>r.id),['warlock','sorcerer']);
 assert.deepEqual(mage[0].jobs.map(j=>j.id),['mage','wizard','warlock']);
 assert.deepEqual(mage[1].jobs.map(j=>j.id),['mage','sage','sorcerer']);
 assert.deepEqual(routeForJob(data.jobs,'wizard').jobs.map(j=>j.id),['mage','wizard','warlock']);
 assert.deepEqual(routeForJob(data.jobs,'mage').jobs.map(j=>j.id),['mage','wizard','warlock']);
 assert.deepEqual(routeForSkill(data.jobs,'comet').jobs.map(j=>j.id),['mage','wizard','warlock']);
 assert.deepEqual(routeForJob(data.jobs,'kagerou_rank3').jobs.map(j=>j.id),['ninja','kagerou','kagerou_rank3']);
 assert.deepEqual(routeForJob(data.jobs,'rebellion_rank3').jobs.map(j=>j.id),['gunslinger','rebellion','rebellion_rank3']);
 for(const base of data.jobs.filter(j=>j.rank===1)){
  const paths=routes.filter(r=>r.base.id===base.id);
  assert.ok(paths.length>=1&&paths.length<=2,'Expected one or two career choices for '+base.id);
 }
});
test('Job skill selection shows a complete first-to-third-job progression',()=>{
 const chain=jobsForSelection(data.jobs,'warlock').map(j=>j.id);
 assert.deepEqual(chain,['mage','wizard','warlock']);
 const mage=jobsForSelection(data.jobs,'mage').map(j=>j.id);
 for(const id of ['mage','wizard','sage','warlock','sorcerer'])assert.ok(mage.includes(id));
 assert.deepEqual(jobsForSelection(data.jobs,'warlock',3).map(j=>j.id),['warlock']);
 assert.deepEqual(jobsForSelection(data.jobs,'all',1).length,9);
 assert.deepEqual(jobsForSelection(data.jobs,'all',2).length,16);
 assert.deepEqual(jobsForSelection(data.jobs,'all',3).length,16);
 const byId=new Map(data.skills.map(s=>[s.id,s]));
 assert.ok(searchSkillName(byId.get('firebolt'),'火箭'));
 assert.ok(searchSkillName(byId.get('firebolt'),'fire bolt'));
 assert.ok(searchSkillName(byId.get('comet'),'彗星'));
 assert.ok(!searchSkillName(byId.get('comet'),'不存在的技能'));
});

const history=JSON.parse(readFileSync(new URL('../public/data/balance.json',import.meta.url),'utf8'));
test('HANS balance releases distinguish announcements from verified snapshot deltas',()=>{
 const newest=history.releases.find(r=>r.version==='0.14.3');
 const earlier=history.releases.find(r=>r.version==='0.14.1');
 const changes=(entry,id)=>entry.changes.find(change=>change.id===id).values;
 assert.equal(history.checkedAt,data.reviewedAt);
 assert.deepEqual(changes(earlier,'asura_strike').cooldown,[22,10]);
 assert.deepEqual(changes(newest,'asura_strike').cooldown,[10,4.9]);
 assert.deepEqual(changes(newest,'call_spirits').baseDamage,[16,54]);
 assert.equal(newest.changes.length,92);
 for(const release of history.releases){
  const changeIds=new Set(release.changes.map(change=>change.id));
  assert.deepEqual(release.jobGroups.map(({id,name,rank,skillIds})=>({id,name,rank,skillIds})),
   data.jobs.flatMap(({id,name,rank,skills})=>{
    const skillIds=skills.filter(skillId=>changeIds.has(skillId));
    return skillIds.length?[{id,name,rank,skillIds}]:[];
   }));
  assert.deepEqual(new Set(release.jobGroups.flatMap(job=>job.skillIds)),changeIds);
 }
 assert.ok(newest.jobGroups.find(job=>job.id==='monk').skillIds.includes('call_spirits'));
 assert.ok(history.releases.some(entry=>entry.version==='0.8.0'&&!entry.snapshots&&entry.changes.length===0));
});
