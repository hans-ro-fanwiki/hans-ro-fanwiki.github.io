import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const dist=path.resolve('dist');
assert.ok(existsSync(path.join(dist,'index.html')),'Public build missing index.html');
assert.ok(!existsSync(path.join(dist,'game-assets')),'Original game asset cache MUST NOT ship');
assert.ok(!existsSync(path.join(dist,'evidence')),'Private evidence MUST NOT ship');

const catalog=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
const fanManifest=JSON.parse(readFileSync(path.join(dist,'fan-thumbs','manifest.json'),'utf8'));
const originalManifest=JSON.parse(readFileSync(path.join(dist,'approved-thumbs','manifest.json'),'utf8'));
assert.equal(fanManifest.sourceManifestSha256,catalog.official.manifest.sha256,'Outdated fan-thumbnail manifest');
assert.deepEqual(Object.keys(fanManifest.items).sort(),catalog.items.map(i=>String(i.id)).sort(),'Equipment thumbnail ID coverage');
assert.deepEqual(Object.keys(fanManifest.cards).sort(),catalog.cards.map(i=>String(i.id)).sort(),'Card thumbnail ID coverage');
assert.deepEqual(Object.keys(fanManifest.monsters).sort(),catalog.monsters.filter(m=>m.spriteFrame).map(m=>m.id).sort(),'Monster thumbnail coverage');

const expected=new Map();
for(const [kind,records] of [['items',fanManifest.items],['cards',fanManifest.cards],['monsters',fanManifest.monsters]]){
 for(const [id,entry] of Object.entries(records)){
  const thumbs=kind==='items'?[entry.art,entry.icon].filter(Boolean):[entry];
  for(const info of thumbs){
   assert.match(info.file,new RegExp('^'+kind+'/'+id+(kind==='items'?'(?:_icon)?':'')+'\\.webp$'),'Unexpected thumbnail filename');
   assert.match(info.sourcePath,new RegExp('^(?:'+(kind==='items'?'items':kind==='cards'?'cards':'sprites')+')/[a-zA-Z0-9_-]+(?:_art)?\\.png$'),'Unexpected source path');
   assert.ok(info.width>0 && info.height>0 && info.width<=96 && info.height<=(kind==='cards'?128:96),'Out of bounds fan thumbnail dimensions');
   assert.ok(info.bytes>0 && info.bytes<=18000);
   assert.match(info.sha256,/^[0-9a-f]{64}$/);
   assert.match(info.sourceSha256,/^[0-9a-f]{64}$/);
   expected.set('fan-thumbs/'+info.file,{hash:info.sha256,bytes:info.bytes});
  }
 }
}
assert.equal(Object.keys(originalManifest.monsters).length,10);
for(const [id,record] of Object.entries(originalManifest.monsters)){
 assert.match(record.source,/^https:\/\/ragnarokonline-cf\.gungho\.jp\/special\/fankit\/assets\/img\/monster\//);
 assert.ok(record.credit.includes('Gravity Co.'));
 expected.set('approved-thumbs/monsters/'+id+'.webp',{maxSize:10000});
}
const listing=(directory)=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
 const full=path.join(directory,entry.name);
 return entry.isDirectory()?listing(full):[full];
});
const images=listing(dist).filter(file=>/\.(?:webp|png|jpg|jpeg|gif|svg)$/i.test(file));
assert.equal(images.length,expected.size,'Public image inventory differs from reviewed thumbnails');
for(const file of images){
 const rel=path.relative(dist,file).replaceAll('\\','/');
 assert.ok(expected.has(rel),'Unreviewed image in public build: '+rel);
 const buf=readFileSync(file),record=expected.get(rel);
 assert.equal(buf.toString('ascii',0,4),'RIFF','Only WebP thumbnails may ship');
 assert.equal(buf.toString('ascii',8,12),'WEBP','Corrupt WebP thumbnail');
 if(record.hash)assert.equal(createHash('sha256').update(buf).digest('hex'),record.hash,'Image SHA mismatch: '+rel);
 if(record.bytes)assert.equal(buf.length,record.bytes,'Image size mismatch: '+rel);
 if(record.maxSize)assert.ok(buf.length<record.maxSize);
}
console.log(JSON.stringify({status:'PASS',equipment:Object.keys(fanManifest.items).length,cards:Object.keys(fanManifest.cards).length,monsters:Object.keys(fanManifest.monsters).length,
 publicThumbnails:images.length,totalBytes:images.reduce((n,f)=>n+statSync(f).size,0),rawGamePngShipped:false},null,2));
