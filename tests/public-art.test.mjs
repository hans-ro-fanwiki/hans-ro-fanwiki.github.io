import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(path.join(root,'public','approved-thumbs','manifest.json'),'utf8'));
const catalog=JSON.parse(readFileSync(path.join(root,'public','data','catalog.json'),'utf8'));
test('only 10 manually verified noncommercial official Fan Kit thumbnails are included',()=>{
 const records=manifest.monsters;
 assert.equal(Object.keys(records).length,10);
 for(const [monsterId,entry] of Object.entries(records)){
  assert.ok(catalog.monsters.some(monster=>monster.id===monsterId),'unknown monster '+monsterId);
  assert.match(entry.source,/^https:\/\/ragnarokonline-cf\.gungho\.jp\/special\/fankit\/assets\/img\/monster\//);
  assert.match(entry.file,new RegExp('^monsters/'+monsterId+'\\.webp$'));
  assert.ok(entry.credit.includes('Gravity Co.'));
  const output=path.join(root,'public','approved-thumbs',entry.file);
  assert.ok(statSync(output).size<10000,'thumbnail too large');
  const bytes=readFileSync(output);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
});
