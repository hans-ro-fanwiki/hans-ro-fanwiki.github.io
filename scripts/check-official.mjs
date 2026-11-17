import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const previous=JSON.parse(readFileSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url),'utf8')).officialBundles;
const home=await fetch('https://ro-survivors.com/');
if(!home.ok)throw Error('Official homepage: '+home.status);
const html=await home.text();
const main=html.match(/src="\.\/build\/(main-[^"]+\.js)"/)?.[1];
const soul=html.match(/href="\.\/build\/(soul_linker-[^"]+\.js)"/)?.[1];
if(!main||!soul)throw Error('Official bundle locations could not be safely determined');
const targets=[{url:'https://ro-survivors.com/build/'+main,previous:previous.main},{url:'https://ro-survivors.com/build/'+soul,previous:previous.soul},{url:'https://ro-survivors.com/assets/manifest.json',previous:previous.manifest}];
let changed=false;
for(const {url,previous:ref} of targets){
 const resp=await fetch(url);if(!resp.ok)throw Error(url+': HTTP '+resp.status);
 const hash=createHash('sha256').update(Buffer.from(await resp.arrayBuffer())).digest('hex');
 const same=hash===ref.sha256;
 console.log(JSON.stringify({source:url,sha256:hash,previous:ref.sha256,unchanged:same}));
 changed ||= !same;
}
if(changed){console.error('Source changed: manual extraction and evidence review required, no production update.');process.exitCode=2;}
