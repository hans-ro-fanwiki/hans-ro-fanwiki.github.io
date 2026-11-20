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
