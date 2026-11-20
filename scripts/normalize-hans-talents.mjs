// Static-data normalizer; consumes audited HANS official page DOM facts.
// It never loads or distributes the HANS game JS or its original artwork.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const original=JSON.parse(readFileSync('evidence/hans-talents-20261120/first-job-talents.json','utf8'));
const snapshotBytes=readFileSync('evidence/hans-talents-20261120/official-rendered.json');
const snapshotSha=createHash('sha256').update(snapshotBytes).digest('hex');
assert.equal(snapshotSha,'f472fc6521ca987be9cb4ef7036e566e0737329e9de4c6894ae881150557a65a','Official rendered snapshot changed; re-audit before rebuilding');
const snapshot=JSON.parse(snapshotBytes.toString('utf8'));
assert.equal(snapshot.server,'hans');
assert.equal(snapshot.jobs.length,25);
assert.equal(original.jobs.filter(j=>(j.rank??1)===1).length,9);
const firstOrder=new Map(original.jobs.filter(j=>(j.rank??1)===1).map(j=>[j.job,j]));
const output={server:'hans',version:2,sourceCommit:original.sourceCommit,sourceDate:'2026-11-20',
 sha256:original.sha256,pointsPerJob:50,branchGate:5,officialTalentPage:'https://ro.hans-webgametw.com/talents.html',jobs:[]};
for(const job of snapshot.jobs){
 const old=firstOrder.get(job.job);
 if(job.rank===1)assert.ok(old,'missing original class '+job.job);
 const tree={
  job:job.job,name:job.name,rank:job.rank,developing:job.developing,
  description:job.description,rule:job.rule,skills:job.skills,
  base:job.rank===2?({knight:'swordsman',crusader:'swordsman',wizard:'mage',sage:'mage',hunter:'archer',bard:'archer',priest:'acolyte',monk:'acolyte',assassin:'thief',rogue:'thief',blacksmith:'merchant',alchemist:'merchant',star_gladiator:'taekwon',soul_linker:'taekwon',kagerou:'ninja',rebellion:'gunslinger'})[job.job]:undefined,
  branches:[]
 };
 for(const branch of job.branches){
  const oldBranch=old?.branches[branch.id];
  const byId=new Map(branch.nodes.map(x=>[x.id,x]));
  if(oldBranch)assert.equal(branch.nodes.length,oldBranch.talents.length,'source mismatch '+job.job);
  const ordered=oldBranch?oldBranch.talents.map(x=>byId.get(x.id)):branch.nodes;
  assert.ok(ordered.every(Boolean));
  const talents=ordered.map(n=>{
   const previous=oldBranch?.talents.find(t=>t.id===n.id);
   assert.ok(!previous||previous.maxRank===n.maxRank,'source rank changed '+n.id);
   assert.ok(!previous||previous.row===n.row&&previous.col===n.col,'source coords changed '+n.id);
   const raw=n.tooltip.split('\n').map(t=>t.trim()).filter(Boolean);
   const requirement=raw.filter(t=>/^(?:需投入|需要先|路線|前置)|需投入\s*\d+\s*點/.test(t)&&!t.startsWith('習得技能')).map(t=>t.slice(0,100));
   const effects=raw.slice(1).filter(t=>!requirement.includes(t));
   return {
    id:n.id,name:n.name,originalName:previous?.originalName||n.name,
    icon:n.icon,row:n.row,col:n.col,maxRank:n.maxRank,requires:previous?.requires||[],
    learn:n.learn,ultimate:n.row===branch.rows-1||n.ultimate,weapon:n.weapon,
    path:job.rank===2?((m=>m?'s'+m[1]+m[2]:null)(n.id.match(/\.s([12])([ab])(?:\d+|f)$/))):null,
    summary:effects[0]?.slice(0,170)||'',maxEffect:effects.find(x=>/滿級時/.test(x))?.slice(0,170)||'',
    notes:requirement
   };
  });
  const index=new Map(talents.map(n=>[n.id,n]));
  for(const edge of branch.connectors){const to=index.get(edge.to);if(to&&index.has(edge.from)&&!to.requires.includes(edge.from))to.requires.push(edge.from)}
  tree.branches.push({
   id:branch.id,name:branch.name,originalName:oldBranch?.originalName||branch.name,
   desc:branch.desc,icon:branch.icon,paths:branch.paths,rows:branch.rows,cols:branch.cols,
   connections:branch.connectors,talents
  });
 }
 output.jobs.push(tree);
}
assert.equal(output.jobs.filter(j=>j.rank===1).length,9);
assert.equal(output.jobs.filter(j=>j.rank===2).length,16);
assert.equal(output.jobs.reduce((n,j)=>n+j.branches.reduce((m,b)=>m+b.talents.length,0),0),1680);
writeFileSync('public/data/talents.json',JSON.stringify(output,null,2)+'\n');
console.log('output',output.jobs.length,'jobs',output.jobs.reduce((n,j)=>n+j.branches.reduce((m,b)=>m+b.talents.length,0),0),'nodes');
