import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {changeRank,checkBuild,decodeBuild,encodeBuild,gateFor,talentList} from '../src/talents.ts';

const data=JSON.parse(readFileSync(new URL('../public/data/talents.json',import.meta.url),'utf8'));
const mage=data.jobs.find(j=>j.job==='mage');

test('HANS snapshot contains nine 1st jobs, 27 branches and 444 real talent nodes',()=>{
 assert.equal(data.server,'hans');
 assert.equal(data.jobs.length,9);
 assert.equal(data.jobs.flatMap(j=>j.branches).length,27);
 const nodes=data.jobs.flatMap(talentList);
 assert.equal(nodes.length,444);
 assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
 for(const job of data.jobs) {
  const ids=new Set(talentList(job).map(n=>n.id));
  for(const node of talentList(job)){
   assert.ok(node.name.length>0);
   assert.ok(Number.isInteger(node.maxRank)&&node.maxRank>0&&node.maxRank<=10);
   assert.ok(Number.isInteger(node.row)&&node.row>=0);
   assert.ok(Number.isInteger(node.col)&&node.col>=0&&node.col<4);
   assert.ok(node.requires.every(id=>ids.has(id)),'unknown prerequisite '+node.id);
  }
 }
});
test('points cannot bypass prior-row investment or max rank',()=>{
 const branch=mage.branches[0];
 const first=branch.talents.find(n=>n.row===0);
 const gated=branch.talents.find(n=>n.row>0);
 assert.ok(first&&gated);
 assert.equal(changeRank(mage,{},gated.id,1,50,5),null);
 const maxed={};
 maxed[first.id]=first.maxRank;
 assert.equal(changeRank(mage,maxed,first.id,1,50,5),null);
 const target=branch.talents.find(n=>n.row===1&&n.requires.length===0&&gateFor(n,branch,5)<=first.maxRank);
 assert.ok(target);
 assert.ok(changeRank(mage,maxed,target.id,1,50,5));
});
test('checkBuild validates dependents on point removal',()=>{
 const dummy={job:'test',branches:[{id:0,name:'test',originalName:'test',talents:[
  {id:'test.0.a',row:0,col:0,name:'A',originalName:'A',maxRank:5,requires:[],icon:null},
  {id:'test.0.b',row:1,col:0,name:'B',originalName:'B',maxRank:1,requires:['test.0.a'],icon:null}
 ]}]};
 const valid={'test.0.a':5,'test.0.b':1};
 assert.equal(checkBuild(dummy,valid,50,5),null);
 assert.equal(changeRank(dummy,valid,'test.0.a',-1,50,5),null);
 assert.ok(changeRank(dummy,valid,'test.0.b',-1,50,5));
 assert.match(checkBuild(dummy,{'test.0.a':6},50,5),/不合法/);
 assert.match(checkBuild(dummy,{'test.0.a':5,'test.0.b':1},5,5),/超過/);
});
test('share code roundtrips, rejects invalid and changed source revisions',()=>{
 const initial=mage.branches[0].talents.find(n=>n.row===0);
 const build={[initial.id]:1};
 const token=encodeBuild(mage,build,data.sourceCommit);
 assert.deepEqual(decodeBuild(mage,token,data.sourceCommit,50,5),{build,error:null});
 assert.ok(decodeBuild(mage,token,'changed',50,5).error);
 assert.ok(decodeBuild(mage,token.replace(/.$/,'z'),data.sourceCommit,50,5).error);
});
