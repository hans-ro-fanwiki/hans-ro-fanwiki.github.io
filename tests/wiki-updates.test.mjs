import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const entries=JSON.parse(readFileSync(new URL('../src/data/wiki-updates.json',import.meta.url),'utf8'));
test('public wiki history is HANS-only, unique by date, and newest first',()=>{
 assert.ok(entries.length>=9);
 assert.equal(entries.at(-1).date,'2026-11-19');
 assert.equal(entries.at(-1).title,'HANS 粉絲維基正式上線');
 for(const [i,entry] of entries.entries()){
  assert.match(entry.date,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(entry.title.trim());
  assert.ok(entry.items.length>0&&entry.items.every(item=>typeof item==='string'&&item.trim()));
  if(i)assert.ok(entries[i-1].date>entry.date);
 }
});
