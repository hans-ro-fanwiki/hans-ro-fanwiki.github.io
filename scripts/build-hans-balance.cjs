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

const snapshots = new Map();
function readSnapshot(index) {
  if (snapshots.has(index)) return snapshots.get(index);
  const meta = audit.skillHistory[index-1];
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
assert.equal(current.source.sha256,audit.skillsSoul.sha256);
const output = {
  checkedAt:current.reviewedAt,
  releases:releases.map(({before,after,...release}) => ({
    ...release,
    ...(before && after ? {snapshots:[audit.skillHistory[before-1].date,audit.skillHistory[after-1].date]} : {}),
    changes:compare({...release,before,after})
  }))
};
fs.writeFileSync(path.join(root,'public/data/balance.json'),JSON.stringify(output,null,2)+'\n');
