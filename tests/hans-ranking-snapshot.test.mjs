import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {profileTalents} from '../src/rank-preview-data.ts';
import {decodeCareer} from '../src/talents.ts';

const read = path => JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const snapshot = read('../public/520520520/snapshot.json');
const talents = read('../public/data/talents.json');

test('HANS snapshot includes the power top five for each of the nine official career families',()=>{
 const catalog=read('../public/data/catalog.json');
 assert.equal(snapshot.server,'hans');
 assert(Number.isFinite(Date.parse(snapshot.capturedAt)));
 assert.deepEqual(snapshot.boards.map(board=>board.id),catalog.lapRules.jobs.filter(job=>job.rank===1).map(job=>job.id));
 for(const board of snapshot.boards){
  assert.deepEqual(board.rows.map(row=>row.rank),[1,2,3,4,5]);
  assert(board.rows.every((row,i)=>i===0||board.rows[i-1].score>=row.score));
  assert(board.rows.every(row=>row.profile&&Array.isArray(row.profile.gear)&&row.profile.talents));
 }
});

test('tree links load the exact saved assignments and other nodes remain available in the snapshot',()=>{
 let linked=0;
 for(const {rows} of snapshot.boards)for(const row of rows){
  const {tree,groups,unknown}=profileTalents(talents,row);
  const total=Object.values(row.profile.talents).reduce((sum,points)=>sum+points,0);
  assert.equal(groups.reduce((sum,group)=>sum+group.points,0)+unknown.reduce((sum,[,points])=>sum+points,0),total);
  if(!tree)continue;
  const {career,error}=decodeCareer(talents,tree);
  assert.equal(error,null);
  assert.deepEqual(Object.assign({},...Object.values(career.builds)),row.profile.talents);
  linked++;
 }
 assert(linked>0);
});
