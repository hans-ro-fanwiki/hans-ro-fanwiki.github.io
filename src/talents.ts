export interface TalentNode {
 id:string;row:number;col:number;name:string;originalName:string|null;maxRank:number;
 icon:string|null;requires:string[];learn?:boolean;ultimate?:boolean;weapon?:boolean;
 path?:string|null;summary?:string;maxEffect?:string;notes?:string[];
}
export interface TalentBranch {id:number;name:string;originalName:string;talents:TalentNode[];desc?:string;icon?:string|null;paths?:{name:string;desc:string}[];rows?:number;cols?:number;connections?:{from:string;to:string}[]}
export interface TalentJob {job:string;sourceJobId?:string;originalName?:string;name?:string;rank?:number;developing?:boolean;description?:string;rule?:string;base?:string;skills?:{id:string;icon:string|null}[];branches:TalentBranch[]}
export interface TalentCatalog {
 server:'hans';version:number;sourceCommit:string;sourceDate:string;sha256:string;officialTalentPage?:string;
 pointsPerJob:number;pointsByRank?:Record<string,number>;gameThirdJobSourceSha256?:string;branchGate:number;jobs:TalentJob[];
}
export type TalentBuild=Record<string,number>;
export const talentList=(job:TalentJob)=>job.branches.flatMap(b=>b.talents);
export const usedPoints=(build:TalentBuild)=>Object.values(build).reduce((n,r)=>n+r,0);
export const talentBudget=(data:TalentCatalog,job:TalentJob)=>data.pointsByRank?.[String(job.rank??1)]??data.pointsPerJob;

export function gateFor(node:TalentNode,branch:TalentBranch,step:number):number{
 // Match HANS RO_TROW: mutually exclusive path variants count only the larger
 // possible branch, not both, when computing a row's unlock threshold.
 let earlier=0;
 const paths=new Map<string,Map<string,number>>();
 for(const talent of branch.talents){
  if(talent.row>=node.row)continue;
  if(talent.path){
   const family=talent.path.slice(0,-1);
   const variants=paths.get(family)||new Map<string,number>();
   variants.set(talent.path,(variants.get(talent.path)||0)+talent.maxRank);
   paths.set(family,variants);
  }else earlier+=talent.maxRank;
 }
 for(const variants of paths.values())earlier+=Math.max(...variants.values());
 return Math.min(node.row*step,earlier);
}
export function checkBuild(job:TalentJob,build:TalentBuild,total:number,step:number):string|null{
 const nodes=talentList(job),ids=new Map(nodes.map(n=>[n.id,n]));
 for(const [id,value] of Object.entries(build)){
  const node=ids.get(id);
  if(!node)return '包含無效的天賦代碼';
  if(!Number.isInteger(value)||value<0||value>node.maxRank)return '包含不合法的天賦等級';
 }
 if(usedPoints(build)>total)return '配點超過職業點數上限';
 if((job.rank??1)>=2){
  const usedBranches=job.branches.filter(branch=>branch.talents.some(node=>(build[node.id]||0)>0));
  if(usedBranches.length>1)return '二轉／三轉只能在一條專精分支配點';
  for(const branch of usedBranches)for(const skill of ['s1','s2']){
   const pathA=branch.talents.some(node=>node.path===skill+'a'&&(build[node.id]||0)>0);
   const pathB=branch.talents.some(node=>node.path===skill+'b'&&(build[node.id]||0)>0);
   if(pathA&&pathB)return '相同技能的兩條進階路線不能同時配點';
  }
 }
 for(const branch of job.branches)for(const node of branch.talents){
  if(!build[node.id])continue;
  const spentBelow=branch.talents.filter(n=>n.row<node.row).reduce((n,x)=>n+(build[x.id]||0),0);
  if(spentBelow<gateFor(node,branch,step))return node.name+' 尚未滿足該列點數門檻';
  if(node.requires.some(id=>(build[id]||0)!==(ids.get(id)?.maxRank??-1)))return node.name+' 的前置天賦尚未點滿';
 }
 return null;
}
export function changeRank(job:TalentJob,build:TalentBuild,id:string,delta:1|-1,total:number,step:number):TalentBuild|null{
 const node=talentList(job).find(t=>t.id===id);
 if(!node)return null;
 const nextRank=(build[id]||0)+delta;
 if(nextRank<0||nextRank>node.maxRank)return null;
 const next={...build};
 if(nextRank)next[id]=nextRank;else delete next[id];
 return checkBuild(job,next,total,step)?null:next;
}
export function encodeBuild(job:TalentJob,build:TalentBuild,commit:string):string{
 const digits=talentList(job).map(node=>(build[node.id]||0).toString(36)).join('');
 return 'v1.'+commit+'.'+digits;
}
export function decodeBuild(job:TalentJob,token:string,commit:string,total:number,step:number):{build:TalentBuild;error:string|null}{
 if(!token)return {build:{},error:null};
 const parts=token.split('.');
 const nodes=talentList(job);
 if(parts.length!==3||parts[0]!=='v1'||parts[1]!==commit||parts[2].length!==nodes.length||!/^[0-9a-z]+$/.test(parts[2]))
  return {build:{},error:'這份分享配點與目前天賦版本不相容'};
 const build:TalentBuild={};
 nodes.forEach((node,i)=>{const value=parseInt(parts[2][i],36);if(value>0)build[node.id]=value});
 const error=checkBuild(job,build,total,step);
 return error?{build:{},error:'分享配點驗證失敗：'+error}:{build,error:null};
}

// All career stages share one stateless, version-checked URL. The legacy v1
// single-job decoder above remains available for old shared links.
export interface TalentCareer {active:string;jobs:string[];builds:Record<string,TalentBuild>}
export function jobLineage(data:TalentCatalog,job:TalentJob):TalentJob[]{
 const path:TalentJob[]=[];
 let current:TalentJob|undefined=job;
 while(current){
  if(path.some(j=>j.job===current!.job))throw Error('Invalid talent job lineage');
  path.unshift(current);
  current=current.base?data.jobs.find(j=>j.job===current!.base):undefined;
 }
 return path;
}
export function createCareer(data:TalentCatalog,job:TalentJob,build:TalentBuild={}):TalentCareer{
 return {active:job.job,jobs:jobLineage(data,job).map(j=>j.job),builds:Object.keys(build).length?{[job.job]:build}:{}};
}
export function chooseCareerJob(data:TalentCatalog,current:TalentCareer,selected:TalentJob):TalentCareer{
 const lineage=jobLineage(data,selected).map(j=>j.job);
 const previous=current.jobs.map(id=>data.jobs.find(j=>j.job===id)).filter((j):j is TalentJob=>!!j);
 const root=previous.find(j=>j.rank===1);
 let ids=lineage;
 if(root?.job===lineage[0]){
  if(selected.rank===1)ids=current.jobs;
  else if(selected.rank===2){
   const third=previous.find(j=>j.rank===3&&(j.base===selected.job||j.base===lineage[0]));
   ids=[lineage[0],selected.job,...(third?[third.job]:[])];
  }else if(selected.rank===3&&lineage.length===2){
   const second=previous.find(j=>j.rank===2);
   if(second)ids=[lineage[0],second.job,selected.job];
  }
 }
 const builds:Record<string,TalentBuild>={};
 for(const id of ids)if(current.builds[id])builds[id]=current.builds[id];
 return {active:selected.job,jobs:ids,builds};
}
function checksum(bytes:number[]):number{
 let crc=0xffff;
 for(const b of bytes){
  crc^=b<<8;
  for(let i=0;i<8;i++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;
 }
 return crc;
}
export function encodeCareer(data:TalentCatalog,career:TalentCareer):string{
 if(!/^[0-9a-f]{8}$/i.test(data.sourceCommit))throw Error('Invalid HANS source revision');
 const active=data.jobs.find(j=>j.job===career.active);
 if(!active)throw Error('Invalid active job');
 const bytes=[0x20+(active.rank??1)];
 for(let i=0;i<8;i+=2)bytes.push(parseInt(data.sourceCommit.slice(i,i+2),16));
 for(const rank of [1,2,3]){
  const job=data.jobs.find(j=>career.jobs.includes(j.job)&&j.rank===rank);
  const index=job?data.jobs.indexOf(job):255;
  const body:number[]=[];
  if(job){
   let last=-1;
   talentList(job).forEach((node,index)=>{
    const value=career.builds[job.job]?.[node.id]||0;
    if(!value)return;
    if(!Number.isInteger(value)||value<1||value>15)throw Error('Unencodable talent rank');
    let gap=index-last-1;
    while(gap>=15){body.push(0xf0);gap-=15}
    body.push((gap<<4)|value);
    last=index;
   });
  }
  if(body.length>255)throw Error('Talent build too large');
  bytes.push(index,body.length,...body);
 }
 const crc=checksum(bytes);
 bytes.push(crc>>8,crc&255);
 return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeCareer(data:TalentCatalog,token:string):{career:TalentCareer|null;error:string|null}{
 const invalid='這份三階配點連結無效、損壞或與目前 HANS 天賦版本不相容';
 if(!/^[A-Za-z0-9_-]{10,1024}$/.test(token))return {career:null,error:invalid};
 try{
  const raw=atob(token.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-token.length%4)%4));
  const bytes=Array.from(raw,c=>c.charCodeAt(0));
  if(bytes.length<13||bytes[0]<0x21||bytes[0]>0x23)return {career:null,error:invalid};
  const expected=bytes.at(-2)!*256+bytes.at(-1)!;
  if(checksum(bytes.slice(0,-2))!==expected)return {career:null,error:invalid};
  if(bytes.slice(1,5).map(b=>b.toString(16).padStart(2,'0')).join('')!==data.sourceCommit.toLowerCase())return {career:null,error:invalid};
  const jobs:TalentJob[]=[],builds:Record<string,TalentBuild>={};
  let offset=5;
  for(const rank of [1,2,3]){
   if(offset+2>bytes.length-2)return {career:null,error:invalid};
   const index=bytes[offset++],length=bytes[offset++];
   if(offset+length>bytes.length-2)return {career:null,error:invalid};
   if(index===255){if(length)return {career:null,error:invalid};continue}
   const job=data.jobs[index];
   if(!job||job.rank!==rank)return {career:null,error:invalid};
   const build:TalentBuild={},nodes=talentList(job);
   let pos=-1;
   const end=offset+length;
   while(offset<end){
    const byte=bytes[offset++];
    if(byte===0xf0){pos+=15;continue}
    const value=byte&15;
    pos+=(byte>>4)+1;
    if(value===0||!nodes[pos]||value>nodes[pos].maxRank)return {career:null,error:invalid};
    build[nodes[pos].id]=value;
   }
   const error=checkBuild(job,build,talentBudget(data,job),data.branchGate);
   if(error)return {career:null,error:'分享配點驗證失敗：'+error};
   jobs.push(job);
   if(Object.keys(build).length)builds[job.job]=build;
  }
  if(offset!==bytes.length-2||!jobs.length||jobs[0].rank!==1)return {career:null,error:invalid};
  if(jobs[1]&&jobs[1].rank===2&&jobs[1].base!==jobs[0].job)return {career:null,error:invalid};
  const third=jobs.find(j=>j.rank===3),second=jobs.find(j=>j.rank===2);
  if(third&&third.base!==jobs[0].job&&third.base!==second?.job)return {career:null,error:invalid};
  const active=jobs.find(j=>j.rank===bytes[0]-0x20);
  if(!active)return {career:null,error:invalid};
  return {career:{active:active.job,jobs:jobs.map(j=>j.job),builds},error:null};
 }catch{return {career:null,error:invalid}}
}
