import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localizeTalentCatalog} from '../src/talent-zh.ts';

const raw=JSON.parse(readFileSync(new URL('../public/data/talents.json',import.meta.url),'utf8'));
const skills=JSON.parse(readFileSync(new URL('../public/data/skills.json',import.meta.url),'utf8'));
const localized=localizeTalentCatalog(raw,skills);
const rawThird=raw.jobs.filter(job=>job.rank===3);
const third=localized.jobs.filter(job=>job.rank===3);
const hasChinese=text=>Array.from(text||'').some(ch=>ch.codePointAt(0)>=0x3400&&ch.codePointAt(0)<=0x9fff);

test('HANS talent localization keeps audited data and stable share identifiers',()=>{
 assert.equal(localized.jobs.length,41);
 assert.equal(localized.sourceCommit,raw.sourceCommit);
 assert.equal(localized.sha256,raw.sha256);
 assert.equal(localized.gameThirdJobSourceSha256,raw.gameThirdJobSourceSha256);
 for(let i=0;i<raw.jobs.length;i++){
  const before=raw.jobs[i],after=localized.jobs[i];
  assert.equal(before.job,after.job);
  for(let j=0;j<before.branches.length;j++){
   const originals=before.branches[j].talents,visible=after.branches[j].talents;
   assert.deepEqual(visible.map(t=>[t.id,t.row,t.col,t.icon,t.maxRank,t.path,t.requires]),
    originals.map(t=>[t.id,t.row,t.col,t.icon,t.maxRank,t.path,t.requires]));
  }
 }
 assert.equal(raw.jobs.find(job=>job.job==='royal_guard').branches[0].desc,
  'Cannon Spear and Inspiration: a lance of light that clears the whole line.');
});

test('all 16 third jobs have readable Chinese branch descriptions, 192 paths and 1,488 distinct Chinese labels',()=>{
 assert.equal(third.length,16);
 const branches=third.flatMap(job=>job.branches);
 const talents=branches.flatMap(b=>b.talents);
 assert.equal(branches.length,48);
 assert.equal(talents.length,1488);
 assert.equal(branches.flatMap(b=>b.paths).length,192);
 for(const job of third){
  assert.ok(hasChinese(job.description),job.job);
  for(const branch of job.branches){
   assert.ok(hasChinese(branch.desc),job.job+'/'+branch.name);
   assert.doesNotMatch(branch.desc,/[A-Za-z]{3}/);
   assert.equal(branch.paths.length,4);
   for(const path of branch.paths){
    assert.ok(hasChinese(path.name)&&hasChinese(path.desc),path.name);
    assert.doesNotMatch(path.name,/[A-Za-z]{3}/);
    assert.doesNotMatch(path.desc,/[A-Za-z]{3}/);
   }
   assert.equal(new Set(branch.talents.map(t=>t.name)).size,branch.talents.length,
    'ambiguous labels in '+job.job+'/'+branch.name);
   for(const node of branch.talents){
    assert.ok(hasChinese(node.name),node.id);
    assert.doesNotMatch(node.name,/[A-Za-z]{3}/,node.id);
    assert.ok(node.originalName,'original English must remain available '+node.id);
   }
  }
 }
});

test('96 third-job unlock skills use native HANS Chinese names, not guessed translations',()=>{
 const sourceByEnglish=new Map(skills.skills.map(s=>[s.originalName,s]));
 const unlocks=third.flatMap(j=>j.branches.flatMap(b=>b.talents.filter(n=>n.learn)));
 assert.equal(unlocks.length,96);
 for(const node of unlocks){
  const official=sourceByEnglish.get(node.originalName);
  assert.ok(official,node.id);
  assert.equal(node.name,official.name);
  assert.match(node.summary,new RegExp('學會技能：'+node.name));
  if(official.description)assert.ok(node.summary.includes(official.description));
 }
 const royal=third.find(j=>j.job==='royal_guard');
 assert.deepEqual(royal.branches.map(b=>b.paths.map(p=>p.name)),[
  ['長槍齊射','強化長槍','集結戰旗','英勇頌歌'],
  ['盾牌連擊','粉碎重壓','皇家儀態','國王恩典'],
  ['連續地震','大地碎裂','光芒之雨','天界裁決'],
 ]);
 assert.deepEqual(royal.branches[0].talents.slice(0,2).map(n=>n.name),['加農矛','激勵']);
});

test('known first/second names stay intact and source mismatches are rejected',()=>{
 assert.equal(localized.jobs.find(j=>j.job==='mage').branches[0].talents[0].name,
  raw.jobs.find(j=>j.job==='mage').branches[0].talents[0].name);
 assert.equal(localized.jobs.find(j=>j.job==='wizard').branches[0].talents[0].name,
  raw.jobs.find(j=>j.job==='wizard').branches[0].talents[0].name);
 assert.equal(rawThird.length,third.length);
 assert.throws(()=>localizeTalentCatalog(raw,{...skills,server:'coffee'}),/source mismatch/);
 assert.throws(()=>localizeTalentCatalog(raw,{...skills,skills:skills.skills.filter(s=>s.originalName!=='Cannon Spear')}),/Missing official skill Chinese name/);
});
