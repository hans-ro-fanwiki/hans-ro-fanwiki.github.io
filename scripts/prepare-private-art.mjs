// Explicit, PRIVATE-ONLY asset preparation for the owner's local Tailscale preview.
// Do not publish dist/ or evidence/private-art/ to GitHub, Pages or any public host.
// The game art remains the property of its respective rights holders.
import {readFileSync,mkdirSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import path from 'node:path';
if(process.env.PRIVATE_DEV_ASSETS!=='1')throw Error('Private asset cache requires PRIVATE_DEV_ASSETS=1');
const catalog=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
const expectedVersion=catalog.official.manifest.sha256;
if(!/^[0-9a-f]{64}$/.test(expectedVersion))throw Error('Missing official asset manifest hash');
const allowed=new Set();
function include(record){const p=record?.officialPath;if(p&&/^(?:items|cards)\/[A-Za-z0-9_-]+(?:_art)?\.png$/.test(p))allowed.add(p);}
for(const e of catalog.items){include(e.image);include(e.icon);}
for(const c of catalog.cards){include(c.image);}
for(const m of catalog.monsters){const p=m.spriteFrame?.url;if(p&&/^sprites\/[A-Za-z0-9_-]+\.png$/.test(p))allowed.add(p);}
const items=[...allowed];
const sourceRoot=path.resolve('evidence/private-art');
const localRoot=path.resolve('dist/game-assets');
if(!existsSync('dist/index.html'))throw Error('Run npm run build before preparing private assets');
let downloaded=0,failed=0,cached=0;
async function acquire(p){
 const stash=path.join(sourceRoot,p),dest=path.join(localRoot,p);
 mkdirSync(path.dirname(dest),{recursive:true});
 try{
  if(!existsSync(stash)){
   const r=await fetch('https://ro-survivors.com/assets/'+p,{signal:AbortSignal.timeout(18000)});
   if(!r.ok)throw Error('HTTP '+r.status);
   const contentType=r.headers.get('content-type')||'';
   if(!contentType.startsWith('image/png'))throw Error('Unexpected MIME '+contentType);
   const bytes=Buffer.from(await r.arrayBuffer());
   if(bytes.length>9*1024*1024||bytes.length<50||bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Invalid PNG');
   mkdirSync(path.dirname(stash),{recursive:true});
   writeFileSync(stash,bytes);
   downloaded++;
  }else cached++;
  copyFileSync(stash,dest);
 }catch(e){failed++; console.warn('Unavailable image: '+p+' ('+e.message+')');}
}
for(let i=0;i<items.length;i+=8)await Promise.all(items.slice(i,i+8).map(acquire));
console.log(JSON.stringify({privatePreview:true,assets:items.length,newlyDownloaded:downloaded,reused:cached,failed,localDirectory:localRoot}));
