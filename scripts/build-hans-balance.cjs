// Rebuild the public history from release notes and SHA-reviewed client snapshots.
const {readSkillSnapshot} = require('./import-hans-skills.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const releases = require('../docs/HANS_BALANCE_RELEASES.json');
const audit = require('../docs/HANS_SOURCE_AUDIT.json');
const current = require('../public/data/skills.json');
const root = path.resolve(__dirname,'..');
const evidenceFlag = process.argv.indexOf('--evidence');
const evidence = evidenceFlag < 0 ? path.join(root,'evidence') : process.argv[evidenceFlag+1];

const versions = [...audit.skillHistory,audit.skillsSoul];
const snapshots = new Map();
function readSnapshot(index) {
  if (snapshots.has(index)) return snapshots.get(index);
  const meta = versions[index-1];
  assert.ok(meta,'Unknown audited snapshot ' + index);
  const {skills} = readSkillSnapshot(meta,index,path.join(evidence,meta.directory,meta.file));
  const result = new Map(skills.map(skill => [skill.id,skill]));
  snapshots.set(index,result);
  return result;
}
function compare(release) {
  if (!release.before || !release.after) return [];
  const before = readSnapshot(release.before), after = readSnapshot(release.after);
  const fields = ['cooldown','baseDamage'];
  return [...after].flatMap(([id,skill]) => {
    const old = before.get(id);
    if (!old) return [];
    const values = Object.fromEntries(fields.flatMap(field => (
      old[field] != null && skill[field] != null && old[field] !== skill[field]
        ? [[field,[old[field],skill[field]]]] : []
    )));
    return Object.keys(values).length ? [{id,name:skill.name,values}] : [];
  });
}
const jobs=new Map(current.jobs.map(job=>[job.id,job]));
const roots=current.jobs.filter(job=>job.rank===1);
function rootJob(job) {
  const visited=new Set();
  while(job.base){
    assert.ok(jobs.has(job.base)&&!visited.has(job.id),'Invalid HANS career path: '+job.id);
    visited.add(job.id);
    job=jobs.get(job.base);
  }
  assert.equal(job.rank,1);
  return job.id;
}
const familyJobs=new Map(roots.map(root=>[root.id,current.jobs.filter(job=>rootJob(job)===root.id)]));
function groupByFamily(changes,jobDamage={}) {
  const changed=new Set(changes.map(skill=>skill.id));
  for(const [id,multiplier] of Object.entries(jobDamage))
    assert.ok(jobs.has(id)&&Number.isFinite(multiplier)&&multiplier>1,'Invalid HANS job damage: '+id);
  return roots.flatMap(root=>{
    const jobs=familyJobs.get(root.id).flatMap(({id,name,rank,skills})=>{
      const skillIds=skills.filter(skillId=>changed.has(skillId));
      const damage=jobDamage[id];
      return skillIds.length||damage ? [{id,name,rank,skillIds,...damage&&{damage:[1,damage]}}] : [];
    });
    return jobs.length ? [{id:root.id,name:root.name+'系',jobs}] : [];
  });
}
assert.equal(current.source.sha256,audit.skillsSoul.sha256);
const output = {
  checkedAt:current.reviewedAt,
  releases:releases.map(({before,after,jobDamage,...release}) => {
    const changes = compare({...release,before,after});
    return {
      ...release,
      ...(before && after ? {snapshots:[before,after].map(i=>versions[i-1].version ? 'V'+versions[i-1].version : versions[i-1].date)} : {}),
      changes, families:groupByFamily(changes,jobDamage)
    };
  })
};
fs.writeFileSync(path.join(root,'public/data/balance.json'),JSON.stringify(output,null,2)+'\n');
