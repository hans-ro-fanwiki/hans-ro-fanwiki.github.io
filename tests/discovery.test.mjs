import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryProbabilities} from '../src/discovery.ts';
test('HANS discovery base legendary chance and diminishing returns',()=>{
 const p=x=>Number((discoveryProbabilities(x)[4]*100).toFixed(2));
 assert.deepEqual([0,50,100,200,300,500,1000].map(p),[1.48,3.60,5.01,6.62,7.48,8.38,9.23]);
 for(const n of [0,100,1000])for(let m=0;m<5;m++){
  const a=discoveryProbabilities(n,m);
  assert.ok(Math.abs(a.reduce((x,y)=>x+y,0)-1)<1e-12);
  assert.ok(a.slice(0,m).every(x=>x===0));
 }
 assert.equal(discoveryProbabilities(100,4)[4],1);
});
