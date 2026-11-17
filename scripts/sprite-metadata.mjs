// Collect only one sprite-frame rectangle and PNG dimensions for each monster.
// No image or upstream sprite JSON is written into the repository.
import {readFileSync,writeFileSync} from 'node:fs';
const file='public/data/catalog.json';
const catalog=JSON.parse(readFileSync(file,'utf8'));
const base='https://ro-survivors.com/assets/';
let ok=0,failed=0;
async function update(m){
 const json=m.sprite?.officialPath;
 if(!json || !/^sprites\/[a-z0-9_-]+\.json$/i.test(json))return;
 try {
  const r=await fetch(base+json);
  if(!r.ok)throw Error('sprite JSON HTTP '+r.status);
  const meta=await r.json();
  const frame=meta.frames?.find(f=>Array.isArray(f)&&f.length>=4&&f[2]>0&&f[3]>0);
  if(!frame || !/^[\w.-]+\.png$/i.test(meta.image))throw Error('No usable frame');
  const url=json.slice(0,json.lastIndexOf('/')+1)+meta.image;
  const pic=await fetch(base+url);
  if(!pic.ok)throw Error('sprite PNG HTTP '+pic.status);
  const buf=Buffer.from(await pic.arrayBuffer());
  if(buf.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Not a PNG');
  const sheetWidth=buf.readUInt32BE(16),sheetHeight=buf.readUInt32BE(20);
  const [x,y,width,height]=frame;
  if(x+width>sheetWidth||y+height>sheetHeight)throw Error('Invalid frame bounds');
  m.spriteFrame={url,x,y,width,height,sheetWidth,sheetHeight};
  ok++;
 }catch(e){failed++;console.warn(m.id,e.message);}
}
for(let i=0;i<catalog.monsters.length;i+=6){
 await Promise.all(catalog.monsters.slice(i,i+6).map(update));
}
writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({spriteFrames:ok,missing:failed,total:catalog.monsters.length}));
