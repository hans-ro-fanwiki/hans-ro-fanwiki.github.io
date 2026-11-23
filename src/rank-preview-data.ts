import type {TalentBuild,TalentCatalog} from './talents.ts';
import {decodeCareer,encodeCareer,jobLineage} from './talents.ts';

export interface GearAffix {stat:string;value:number;skill?:string}
export interface RankedGear {
 slot:string;itemId:number;tier?:number;ilvl?:number;quality?:number;refine?:number;star?:number;
 cards?:number[];affixes:GearAffix[];ex?:GearAffix;
}
export interface RankProfile {
 capturedAt:string;level:number;jobLevel:number;gs:number;reb?:number;
 gear:RankedGear[];talents:TalentBuild;stats:Record<string,number>;record:Record<string,number>;
}
export interface RankRow {rank:number;name:string;job:string;promotion?:string;score:number;profile:RankProfile|null}
export interface RankBoard {id:string;name:string;rankedAt:number;total:number;rows:RankRow[]}
export interface RankSnapshot {server:'hans';capturedAt:string;boards:RankBoard[]}

export function profileTalents(data:TalentCatalog,row:RankRow){
 const actual=row.profile?.talents??{};
 const promotion=row.promotion||row.job;
 const job=data.jobs.find(job=>job.job===promotion)||data.jobs.find(job=>job.sourceJobId===promotion);
 if(!job)return {tree:null,groups:[],unknown:Object.entries(actual)};
 const lineage=jobLineage(data,job);
 const mapped=new Set<string>();
 const builds:Record<string,TalentBuild>={};
 const groups=lineage.map(stage=>{
  const build:TalentBuild={};
  const branches=stage.branches.flatMap(branch=>{
   const nodes=branch.talents.flatMap(node=>{
    const points=actual[node.id];
    if(!points)return [];
    mapped.add(node.id);
    build[node.id]=points;
    return [{label:node.name,points}];
   });
   return nodes.length?[{name:branch.name,nodes}]:[];
  });
  builds[stage.job]=build;
  return {id:stage.job,name:stage.name||stage.job,branches,points:Object.values(build).reduce((sum,rank)=>sum+rank,0)};
 });
 const unknown=Object.entries(actual).filter(([id])=>!mapped.has(id));
 let tree:string|null=null;
 if(!unknown.length&&mapped.size){
  try{
   const packed=encodeCareer(data,{active:job.job,jobs:lineage.map(stage=>stage.job),builds});
   if(decodeCareer(data,packed).career)tree=packed;
  }catch{/* The original node list remains readable if the simulator cannot reproduce it. */}
 }
 return {tree,groups,unknown};
}
