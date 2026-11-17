import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(path.join(root,'public/fan-thumbs/manifest.json'),'utf8'));
const catalog=JSON.parse(readFileSync(path.join(root,'public/data/catalog.json'),'utf8'));
test('all indexed equipment, cards and available monster frames have game-version-matched fan thumbnails',()=>{
 assert.equal(manifest.sourceManifestSha256,catalog.official.manifest.sha256);
 assert.deepEqual(Object.keys(manifest.items).sort(),catalog.items.map(i=>String(i.id)).sort());
 assert.deepEqual(Object.keys(manifest.cards).sort(),catalog.cards.map(c=>String(c.id)).sort());
 assert.deepEqual(Object.keys(manifest.monsters).sort(),catalog.monsters.filter(m=>m.spriteFrame).map(m=>m.id).sort());
 assert.equal(Object.keys(manifest.items).length,287);
 assert.equal(Object.keys(manifest.cards).length,98);
 assert.equal(Object.keys(manifest.monsters).length,107);
});
test('public fan thumbnails are tiny WEBP derivatives, never original game PNG or source spritesheets',()=>{
 let count=0;
 for(const kind of ['items','cards','monsters']){
  for(const [id,record] of Object.entries(manifest[kind])){
   const list=kind==='items'?[record.art,record.icon].filter(Boolean):[record];
   for(const thumb of list){
    assert.match(thumb.file,new RegExp('^'+kind+'/'+id+(kind==='items'?'(?:_icon)?':'')+'\\.webp$'));
    assert.match(thumb.sourcePath,/^(items|cards|sprites)\/\S+\.png$/);
    assert.ok(thumb.width<=96 && thumb.height<=(kind==='cards'?128:96));
    const image=readFileSync(path.join(root,'public/fan-thumbs',thumb.file));
    assert.ok(image.length<=18000);
    assert.equal(image.toString('ascii',0,4),'RIFF');
    assert.equal(image.toString('ascii',8,12),'WEBP');
    assert.equal(createHash('sha256').update(image).digest('hex'),thumb.sha256);
    count++;
   }
  }
 }
 assert.equal(count,779);
});
