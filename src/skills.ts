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
