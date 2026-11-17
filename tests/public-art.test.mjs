import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(path.join(root,'public','approved-thumbs','manifest.json'),'utf8'));
const catalog=JSON.parse(readFileSync(path.join(root,'public','data','catalog.json'),'utf8'));
const iconManifest=JSON.parse(readFileSync(path.join(root,'public','approved-thumbs','item-card-manifest.json'),'utf8'));
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
test('official item/card thumbnails are ID mapped, tiny and source-provenanced',()=>{
 assert.equal(Object.keys(iconManifest.items).length,92);
 assert.equal(Object.keys(iconManifest.cards).length,66);
 for(const [group,list] of [['items',catalog.items],['cards',catalog.cards]]){
  for(const [id,record] of Object.entries(iconManifest[group])){
   const entry=list.find(x=>String(x.id)===id);
   assert.ok(entry,'No corresponding game catalog entry '+id);
   assert.equal(record.file,group+'/'+id+'.webp');
   assert.ok(record.englishName && entry.originalName===record.englishName,'Name audit mismatch '+id);
   assert.match(record.sourceUrl,/^https:\/\/ragnarokonline\.gungho\.jp\/navi\/gamedata\/images\/(?:card|weapon|helmet)\//);
   assert.ok(record.sourcePage.startsWith('https://ragnarokonline.gungho.jp/navi/gamedata/'));
   assert.ok(record.credit.includes('Gravity Co.'));
   const bytes=readFileSync(path.join(root,'public','approved-thumbs',record.file));
   assert.ok(bytes.length<=10000);
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
  }
 }
});
