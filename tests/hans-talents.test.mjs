import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {changeRank,checkBuild,decodeBuild,encodeBuild,gateFor,talentBudget,talentList,usedPoints} from '../src/talents.ts';

const data=JSON.parse(readFileSync(new URL('../public/data/talents.json',import.meta.url),'utf8'));
const mage=data.jobs.find(j=>j.job==='mage');

test('HANS snapshot includes registered first, second and third jobs with unique source-backed talents',()=>{
 assert.equal(data.server,'hans');
 assert.equal(data.jobs.length,41);
 assert.equal(data.jobs.filter(j=>j.rank===1).length,9);
 assert.equal(data.jobs.filter(j=>j.rank===2).length,16);
 assert.equal(data.jobs.filter(j=>j.rank===3).length,16);
 assert.equal(data.jobs.flatMap(j=>j.branches).length,123);
 assert.equal(data.gameThirdJobSourceSha256,'0201182d55c963b52c029016dd74651640e02c783d487f9077a7cd92ce5bf600');
 const nodes=data.jobs.flatMap(talentList);
 assert.equal(nodes.length,3168);
 assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
 for(const job of data.jobs) {
  const ids=new Set(talentList(job).map(n=>n.id));
  for(const node of talentList(job)){
   assert.ok(node.name.length>0);
   assert.ok(Number.isInteger(node.maxRank)&&node.maxRank>0&&node.maxRank<=10);
   assert.ok(Number.isInteger(node.row)&&node.row>=0);
   assert.ok(Number.isInteger(node.col)&&node.col>=0&&node.col<(job.rank===1?4:5));
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
test('second-job specialization stays in one branch and skill paths are exclusive',()=>{
 const wizard=data.jobs.find(j=>j.job==='wizard');
 assert.equal(wizard.rank,2);
 assert.equal(wizard.developing,true);
 const first=wizard.branches[0].talents.find(t=>t.row===0&&t.maxRank===1);
 const other=wizard.branches[1].talents.find(t=>t.row===0&&t.maxRank===1);
 assert.ok(first&&other);
 assert.match(checkBuild(wizard,{[first.id]:1,[other.id]:1},50,5),/專精/);
 const a=wizard.branches[0].talents.find(n=>n.path==='s1a');
 const b=wizard.branches[0].talents.find(n=>n.path==='s1b');
 assert.ok(a&&b);
 const conflict=checkBuild(wizard,{[a.id]:1,[b.id]:1},50,5);
 assert.match(conflict||'',/路線/);
});
test('HANS third-job topology, 70-point cap and duplicate-ID disambiguation',()=>{
 const third=data.jobs.filter(j=>j.rank===3);
 assert.equal(third.length,16);
 assert.ok(third.every(j=>j.branches.length===3&&j.branches.every(b=>b.talents.length===31&&b.rows===12&&b.cols===5)));
 assert.equal(third.flatMap(talentList).length,1488);
 assert.equal(talentBudget(data,data.jobs.find(j=>j.job==='mage')),50);
 assert.equal(talentBudget(data,data.jobs.find(j=>j.job==='wizard')),50);
 assert.equal(talentBudget(data,data.jobs.find(j=>j.job==='warlock')),70);
 const tree=data.jobs.find(j=>j.job==='warlock').branches[0];
 assert.equal(gateFor(tree.talents.find(n=>n.row===11),tree,5),55);
 assert.equal(data.jobs.find(j=>j.job==='kagerou_rank3').sourceJobId,'kagerou');
 assert.equal(data.jobs.find(j=>j.job==='rebellion_rank3').sourceJobId,'rebellion');
 const j=data.jobs.find(j=>j.job==='arch_bishop'),n=j.branches[0].talents[0];
 const token=encodeBuild(j,{[n.id]:1},data.sourceCommit);
 assert.deepEqual(decodeBuild(j,token,data.sourceCommit,talentBudget(data,j),5).build,{[n.id]:1});
 assert.match(checkBuild(j,{[j.branches[0].talents[1].id]:1,[j.branches[1].talents[0].id]:1},70,5)||'',/專精/);
});
test('third-job ultimate talents are reachable with legitimate 70-point allocations across all 48 branches',()=>{
 for(const job of data.jobs.filter(j=>j.rank===3)){
  for(const branch of job.branches){
   const candidates=branch.talents.filter(n=>!n.ultimate&&!n.path?.endsWith('b')).sort((a,b)=>a.row-b.row||a.col-b.col);
   let build={};
   for(const node of candidates){
    for(let i=0;i<node.maxRank&&usedPoints(build)<55;i++){
     const next=changeRank(job,build,node.id,1,70,5);
     if(!next)break;
     build=next;
    }
    if(usedPoints(build)>=55)break;
   }
   assert.ok(usedPoints(build)>=55,'not enough legal points for '+job.job+'/'+branch.name);
   const final=branch.talents.find(n=>n.ultimate&&n.path==='s1a');
   assert.ok(final,'missing first third-job ultimate '+job.job);
   const allocated=changeRank(job,build,final.id,1,70,5);
   assert.ok(allocated,'third-job ultimate cannot be unlocked: '+job.job+'/'+branch.name);
  }
 }
});
test('share code roundtrips, rejects invalid and changed source revisions',()=>{
 const initial=mage.branches[0].talents.find(n=>n.row===0);
 const build={[initial.id]:1};
 const token=encodeBuild(mage,build,data.sourceCommit);
 assert.deepEqual(decodeBuild(mage,token,data.sourceCommit,50,5),{build,error:null});
 assert.ok(decodeBuild(mage,token,'changed',50,5).error);
 assert.ok(decodeBuild(mage,token.replace(/.$/,'z'),data.sourceCommit,50,5).error);
});

test('one short link restores three independently allocated stages and their current tab',async()=>{
 const {chooseCareerJob,createCareer,encodeCareer,decodeCareer}=await import('../src/talents.ts');
 const wizard=data.jobs.find(j=>j.job==='wizard');
 const warlock=data.jobs.find(j=>j.job==='warlock');
 let career=createCareer(data,mage);
 const used={};
 for(const job of [mage,wizard,warlock]){
  career=chooseCareerJob(data,career,job);
  const node=job.branches[0].talents.find(n=>n.row===0);
  used[job.job]={[node.id]:1};
  career.builds[job.job]=used[job.job];
 }
 const token=encodeCareer(data,career);
 assert.ok(token.length<65,'compact token should stay short for 3 simple builds: '+token.length);
 const restored=decodeCareer(data,token);
 assert.equal(restored.error,null);
 assert.deepEqual(restored.career,career);
 const legacyLength=[mage,wizard,warlock].reduce((sum,job)=>sum+encodeBuild(job,used[job.job],data.sourceCommit).length,0);
 assert.ok(token.length<legacyLength/2);
 assert.equal(restored.career.active,'warlock');
 const backToFirst=chooseCareerJob(data,restored.career,mage);
 assert.deepEqual(backToFirst.builds,used);
 assert.equal(chooseCareerJob(data,backToFirst,wizard).builds.warlock[Object.keys(used.warlock)[0]],1);
 const corrupt=token.slice(0,-1)+(token.at(-1)==='a'?'b':'a');
 assert.ok(decodeCareer(data,corrupt).error);
 assert.ok(decodeCareer({...data,sourceCommit:'ffffffff'},token).error);
 assert.ok(decodeCareer(data,'notvalid').error);
});

test('changing a second-job path removes incompatible stages but keeps the shared first-job build',async()=>{
 const {chooseCareerJob,createCareer,encodeCareer,decodeCareer}=await import('../src/talents.ts');
 const wizard=data.jobs.find(j=>j.job==='wizard');
 const sage=data.jobs.find(j=>j.job==='sage');
 const warlock=data.jobs.find(j=>j.job==='warlock');
 const career=chooseCareerJob(data,chooseCareerJob(data,createCareer(data,mage,{[mage.branches[0].talents[0].id]:1}),wizard),warlock);
 career.builds[wizard.job]={[wizard.branches[0].talents[0].id]:1};
 const changed=chooseCareerJob(data,career,sage);
 assert.deepEqual(changed.jobs,['mage','sage']);
 assert.ok(changed.builds.mage);
 assert.equal(changed.builds.wizard,undefined);
 assert.equal(changed.builds.warlock,undefined);
 assert.deepEqual(decodeCareer(data,encodeCareer(data,changed)).career,changed);
 const ninja=data.jobs.find(j=>j.job==='ninja');
 const second=data.jobs.find(j=>j.rank===2&&j.base==='ninja');
 const third=data.jobs.find(j=>j.rank===3&&j.base==='ninja');
 assert.ok(ninja&&second&&third);
 const direct=chooseCareerJob(data,chooseCareerJob(data,createCareer(data,ninja),second),third);
 assert.deepEqual(decodeCareer(data,encodeCareer(data,direct)).career,direct);
});
