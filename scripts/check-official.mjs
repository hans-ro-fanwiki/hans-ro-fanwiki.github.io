// HANS source-drift monitor: checks only public metadata and bundle digests.
// Detection alerts for human review; it never automatically publishes changed game data.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const audit=JSON.parse(readFileSync(new URL('../docs/HANS_SOURCE_AUDIT.json',import.meta.url),'utf8'));
const latest=JSON.parse(readFileSync(new URL('../docs/HANS_CHAPTER3_SOURCE.json',import.meta.url),'utf8'));
const base=audit.hans.baseUrl.replace(/\/$/,'')+'/';
const reportFile=process.argv.indexOf('--report-file')>=0?process.argv[process.argv.indexOf('--report-file')+1]:null;
const digest=body=>createHash('sha256').update(body).digest('hex');
async function get(url){
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  try {
   const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'HANS-Wiki-Update-Checker/1.0'}});
   if(response.ok)return Buffer.from(await response.arrayBuffer());
   if(![429,500,502,503,504].includes(response.status))throw Error('HANS HTTP '+response.status+': '+url);
   lastError=Error('HANS transient HTTP '+response.status+': '+url);
  }catch(error){lastError=error;}
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,(attempt+1)*900));
 }
 throw lastError;
}
try{
 const html=(await get(base)).toString('utf8');
 const bundles={};
 for(const kind of ['main','soul_linker']){
   const re=new RegExp('(?:\\./)?build/('+kind+'-[\\w-]+\\.hz[\\da-f]+\\.js)','g');
   const match=[...html.matchAll(re)][0];
   if(!match)throw Error('HANS HTML did not declare '+kind+' bundle');
   bundles[kind]=base+'build/'+match[1];
 }
 const assets=[
  {name:'main',url:bundles.main,expected:latest.main.sha256},
  {name:'soul',url:bundles.soul_linker,expected:latest.soul.sha256},
  {name:'manifest',url:base+audit.hans.manifest.path,expected:latest.manifest.sha256}
 ];
 const sources=[];
 for(const entry of assets){
  const sha256=digest(await get(entry.url));
  sources.push({name:entry.name,source:entry.url,sha256,previous:entry.expected,unchanged:sha256===entry.expected});
 }
 const changed=sources.some(source=>!source.unchanged);
 const result={server:'hans',checkedAt:new Date().toISOString(),changed,sources};
 if(reportFile)writeFileSync(reportFile,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({checkedAt:result.checkedAt,changed,sources:sources.map(s=>({name:s.name,unchanged:s.unchanged,sha256:s.sha256}))},null,2));
 process.exitCode=changed?2:0;
}catch(error){console.error('HANS source check failed:',error.message);process.exitCode=1;}
