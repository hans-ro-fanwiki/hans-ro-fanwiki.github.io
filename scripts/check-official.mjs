// Compare pinned, reviewed official assets against currently served files.
// Drift exits 2; network/parser errors exit 1. Never imports upstream executable code.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const pinned=JSON.parse(readFileSync(new URL('../docs/SOURCE_AUDIT.json',import.meta.url),'utf8')).officialBundles;
const outputAt=process.argv.indexOf('--report-file');
const reportPath=outputAt>=0?process.argv[outputAt+1]:null;
if(outputAt>=0&&!reportPath)throw Error('--report-file requires a path');
const home=await fetch('https://ro-survivors.com/');
if(!home.ok)throw Error('Official homepage: '+home.status);
const html=await home.text();
const main=html.match(/src="\.\/build\/(main-[^"]+\.js)"/)?.[1];
const soul=html.match(/href="\.\/build\/(soul_linker-[^"]+\.js)"/)?.[1];
if(!main||!soul)throw Error('Official bundle locations could not be safely determined');
const targets=[
  {url:'https://ro-survivors.com/build/'+main,previous:pinned.main},
  {url:'https://ro-survivors.com/build/'+soul,previous:pinned.soul},
  {url:'https://ro-survivors.com/assets/manifest.json',previous:pinned.manifest}
];
const sources=[];
for(const {url,previous} of targets){
 const resp=await fetch(url);
 if(!resp.ok)throw Error(url+': HTTP '+resp.status);
 const hash=createHash('sha256').update(Buffer.from(await resp.arrayBuffer())).digest('hex');
 const entry={source:url,sha256:hash,previous:previous.sha256,unchanged:hash===previous.sha256};
 sources.push(entry);
 console.log(JSON.stringify(entry));
}
const changed=sources.some(s=>!s.unchanged);
const report={checkedAt:new Date().toISOString(),changed,sources};
if(reportPath)writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
if(changed){console.error('Official source changed: review diff; never auto-publish.');process.exitCode=2;}
