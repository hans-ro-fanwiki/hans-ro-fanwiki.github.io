import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const dist=path.resolve('dist');
const root=path.join(dist,'approved-thumbs');
assert.ok(existsSync(path.join(dist,'index.html')),'Public build missing index.html');
assert.ok(!existsSync(path.join(dist,'game-assets')),'Private game assets MUST NOT be shipped');
assert.ok(!existsSync(path.join(dist,'evidence')),'Private evidence MUST NOT be shipped');
const listing=(directory)=>readdirSync(directory,{withFileTypes:true}).flatMap(item=>{
 const full=path.join(directory,item.name);
 return item.isDirectory()?listing(full):[full];
});
const files=listing(dist);
const images=files.filter(file=>/\.(?:webp|png|jpg|jpeg|gif)$/i.test(file));
const monsterManifest=JSON.parse(readFileSync(path.join(root,'manifest.json'),'utf8'));
const iconManifest=JSON.parse(readFileSync(path.join(root,'item-card-manifest.json'),'utf8'));
const expected=new Map();
for(const [id,record] of Object.entries(monsterManifest.monsters)){
 assert.ok(record.source.startsWith('https://ragnarokonline-cf.gungho.jp/special/fankit/assets/img/monster/'),'Invalid Fan Kit source: '+id);
 assert.ok(record.credit.includes('Gravity Co.'),'Credit required: '+id);
 expected.set('monsters/'+id+'.webp',{size:record.size});
}
for(const group of ['items','cards']){
 for(const [id,record] of Object.entries(iconManifest[group])){
  assert.equal(record.file,group+'/'+id+'.webp','File path must match group/id');
  assert.match(record.sourcePage,/^https:\/\/ragnarokonline\.gungho\.jp\/navi\/gamedata\/(?:card|weapon|protector)\//);
  assert.match(record.sourceUrl,new RegExp('^https://ragnarokonline\\.gungho\\.jp/navi/gamedata/images/'+(group==='cards'?'card':'(?:weapon|helmet)')+'/'));
  assert.ok(record.credit.includes('Gravity Co.'),'Credit required: '+id);
  expected.set(record.file,{sha256:record.sha256});
 }
}
assert.equal(Object.keys(monsterManifest.monsters).length,10,'Curated monster count changed');
assert.equal(Object.keys(iconManifest.items).length,92,'Unreviewed equipment entries');
assert.equal(Object.keys(iconManifest.cards).length,66,'Unreviewed card entries');
assert.equal(images.length,expected.size,'Unexpected image count');
for(const img of images){
 const local=path.relative(root,img).replaceAll('\\','/');
 assert.ok(expected.has(local),'Unapproved image shipped '+local);
 const bytes=readFileSync(img);
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length<=10000,'Thumbnails must remain small: '+img);
 const match=expected.get(local);
 if(match.sha256)assert.equal(createHash('sha256').update(bytes).digest('hex'),match.sha256);
 if(match.size)assert.equal(bytes.length,match.size);
}
console.log(JSON.stringify({status:'PASS',monsters:Object.keys(monsterManifest.monsters).length,items:Object.keys(iconManifest.items).length,cards:Object.keys(iconManifest.cards).length,images:images.length,totalBytes:images.reduce((n,file)=>n+statSync(file).size,0),privateArtShipped:false},null,2));
