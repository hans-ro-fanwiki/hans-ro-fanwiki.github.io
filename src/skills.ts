export interface Skill {
 id:string;
 name:string;
 originalName:string;
 icon:string;
 description:string|null;
 upgradeDescription:string|null;
 descriptionSource:'hans-registered'|'not-static';
 translationState:'official-zh'|'untranslated'|'dynamic';
 cooldown:number|null;
 type:string|null;
 tags:string[];
 cast:string[];
 sourceType:'basic'|'advanced';
}
export interface SkillJob {
 id:string;sourceId:string;name:string;rank:number;
 base:string|null;developing:boolean;skills:string[];
}
export interface SkillCatalog{
 server:'hans';schemaVersion:1;reviewedAt:string;
 source:{sha256:string;relativeFile:string};policy:string;
 jobs:SkillJob[];skills:Skill[];
}
export const RANK_LABELS:Record<number,string>={1:'一轉',2:'二轉',3:'三轉'};
export const SKILL_TAGS:Record<string,string>={
 melee:'近戰',ranged:'遠程',magic:'魔法',physical:'物理',single:'單體',
 area:'範圍',ground:'地面',aoe:'範圍',buff:'增益',passive:'被動',
 fire:'火',water:'水',ice:'冰',wind:'風',earth:'地',lightning:'雷',
 holy:'聖',dark:'暗',poison:'毒',neutral:'無',heal:'治癒',
 aura:'光環',burst:'爆發',ghost:'念',hybrid:'混合',multi:'多段',orbit:'環繞',persistent:'持續',pierce:'穿透',ranged_strike:'遠程打擊',return:'返回',
 projectile:'投射物',summon:'召喚',control:'控制',attack:'攻擊'
};
export function skillAncestors(id:string,jobs:SkillJob[]):Set<string>{
 const byId=new Map(jobs.map(job=>[job.id,job]));
 const ancestors=new Set<string>();
 let current=byId.get(id);
 while(current&&!ancestors.has(current.id)){
  ancestors.add(current.id);
  current=current.base?byId.get(current.base):undefined;
 }
 return ancestors;
}
/** Actual HANS career paths. Some third jobs register their base against
 * the first job (Ninja, Gunslinger) rather than the second job. */
export interface CareerRoute {
 id:string; base:SkillJob; second:SkillJob|null; third:SkillJob|null; jobs:SkillJob[];
}
export function careerRoutes(jobs:SkillJob[]):CareerRoute[]{
 const result:CareerRoute[]=[];
 const first=jobs.filter(job=>job.rank===1);
 for(const base of first){
  const seconds=jobs.filter(job=>job.rank===2&&job.base===base.id);
  for(const second of seconds){
   const thirds=jobs.filter(job=>job.rank===3&&(job.base===second.id||(seconds.length===1&&job.base===base.id)));
   if(!thirds.length){
    result.push({id:second.id,base,second,third:null,jobs:[base,second]});
   }else{
    for(const third of thirds)result.push({id:third.id,base,second,third,jobs:[base,second,third]});
   }
  }
 }
 return result;
}
export function routeForJob(jobs:SkillJob[],jobId:string):CareerRoute|null{
 const routes=careerRoutes(jobs);
 const exact=routes.find(route=>route.id===jobId);
 if(exact)return exact;
 return routes.find(route=>route.second?.id===jobId||route.base.id===jobId)||null;
}
export function routeForSkill(jobs:SkillJob[],skillId:string):CareerRoute|null{
 const routes=careerRoutes(jobs);
 // Prefer the profession where the skill is registered, then its full route.
 const matched=jobs.find(job=>job.skills.includes(skillId));
 return matched?routeForJob(jobs,matched.id):routes.find(route=>route.jobs.some(job=>job.skills.includes(skillId)))||null;
}
export function jobsForSelection(jobs:SkillJob[],selected:string,rank=0):SkillJob[]{
 if(selected==='all')return jobs.filter(job=>rank===0||job.rank===rank);
 const ancestor=skillAncestors(selected,jobs);
 const group=jobs.filter(job=>skillAncestors(job.id,jobs).has(selected)||ancestor.has(job.id));
 return group.filter(job=>rank===0||job.rank===rank);
}
export function searchSkillName(skill:Skill,query:string):boolean{
 const text=(skill.name+' '+skill.originalName+' '+skill.id+' '+skill.description+' '+skill.upgradeDescription).toLocaleLowerCase();
 return text.includes(query.trim().toLocaleLowerCase());
}

const localSkillNames:Record<string,string>={fire_arrow:'火焰箭',holy_smite:'聖擊',retreat:'撤退'};
export function localizedSkillName(skill:Skill):string{
 return /\p{Script=Han}/u.test(skill.name)?skill.name:localSkillNames[skill.id]||skill.name;
}
