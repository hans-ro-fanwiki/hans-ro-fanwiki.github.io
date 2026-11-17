import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dist=path.resolve('dist');
assert.ok(existsSync(path.join(dist,'index.html')),'Public build missing index.html');
assert.ok(!existsSync(path.join(dist,'game-assets')),'Private game assets MUST NOT be shipped');
assert.ok(!existsSync(path.join(dist,'evidence')),'Private evidence MUST NOT be shipped');
const listing=(directory)=>readdirSync(directory,{withFileTypes:true}).flatMap(item=>{
 const full=path.join(directory,item.name);
 return item.isDirectory()?listing(full):[full];
});
const files=listing(dist);
const images=files.filter(file=>/\.(?:webp|png|jpg|jpeg|gif)$/i.test(file));
assert.equal(images.length,10,'Exactly the 10 curated Fan Kit thumbnails must ship');
for(const img of images){
 assert.match(img.replaceAll('\\','/'),/\/approved-thumbs\/monsters\/[a-z_]+\.webp$/i);
 const bytes=readFileSync(img);
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length<=10000,'Thumbnails must remain small: '+img);
}
const manifest=JSON.parse(readFileSync(path.join(dist,'approved-thumbs','manifest.json'),'utf8'));
assert.equal(Object.keys(manifest.monsters).length,10);
for(const [id,record] of Object.entries(manifest.monsters)){
 assert.ok(record.source.startsWith('https://ragnarokonline-cf.gungho.jp/special/fankit/assets/img/monster/'),'Official Fan Kit only: '+id);
 assert.ok(record.credit.includes('Gravity Co.'),'Credit required: '+id);
}
const total=images.reduce((n,file)=>n+statSync(file).size,0);
console.log(JSON.stringify({status:'PASS',totalThumbnails:images.length,totalBytes:total,privateArtShipped:false},null,2));
