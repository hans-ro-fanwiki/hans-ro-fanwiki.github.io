import {abilityTags,abilityTriggers,cardAbilityDetails,cardAbilityText} from './card-abilities.ts';
import type {Card,Equipment} from './types';
import {equipmentSearchEffects} from './equipment-stats.ts';
import statLabels from './data/hans-stat-labels.json' with {type:'json'};

export type SearchEntry=Card|Equipment;
const stats=statLabels as Record<string,{label:string;aliases:string[]}>;
const norm=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const options=(ids:string[]):[string,string][]=>ids.map(id=>[id,stats[id].label]);
export const ATTRIBUTE_GROUPS=[
 {label:'角色屬性',options:options(['str','agi','vit','int','dex','luk'])},
 {label:'攻擊與戰鬥',options:[['attack','攻擊力'],['damage','傷害'],['crit','爆擊'],['hit','命中'],['cooldown',stats.haste.label],['casthaste',stats.castHaste.label],['range',stats.areaMult.label],...options(['doubleChance','critChance','critMult','reachMult','projSpeedMult','extraProjectiles','pierceChance','stunChance','bossUndeadMult','bossEliteMult','dotDmg','lowHpDamage'])]},
 {label:'防禦與生存',options:[['hp','HP'],['armor',stats.armor.label],['flee',stats.flee.label],['reduction',stats.damageReduction.label],...options(['maxHpPct','regen','regenMoving','speedMult','potionMult','pickupRadius','revives','expMult','zenyMult'])]}
] as const;

const aliases=new Map<string,string>();
const linePrefixes:{prefix:string;id:string}[]=[];
for(const [id,{label,aliases:words}] of Object.entries(stats)){
 for(const word of [id,label,...words])aliases.set(norm(word),id);
 for(const word of [label,...words])linePrefixes.push({prefix:norm(word),id});
}
linePrefixes.sort((a,b)=>b.prefix.length-a.prefix.length);
function lineStat(line:string):string|undefined{
 const value=norm(line);
 return linePrefixes.find(({prefix})=>value===prefix||
  (value.startsWith(prefix)&&/^[\s+\-]/.test(value.slice(prefix.length))))?.id;
}
const legacyStat:Record<string,string>={
 cooldown:'haste',casthaste:'castHaste',range:'areaMult',flee:'flee',reduction:'damageReduction'
};
const generalPatterns:Record<string,RegExp>={
 attack:/\bATK\b|\bMATK\b|攻擊力|物理攻擊|魔法攻擊/i,
 damage:/傷害|damage/i,crit:/爆擊|暴擊|critical/i,hit:/命中|\bHIT\b/i,
 hp:/\bHP\b|生命/i,armor:/護甲|\bDEF\b|防禦/i,
 atk:/\bATK\b|物理攻擊/i,matk:/\bMATK\b|魔法攻擊/i
};
const generalAliases:Record<string,string>={暴擊:'crit',爆擊:'crit',命中:'hit',攻擊力:'attack',物攻:'atk',魔攻:'matk',生命:'hp'};
export function effectLines(entry:SearchEntry):string[]{
 return 'slot' in entry?equipmentSearchEffects(entry):entry.bonuses;
}
function statLine(entry:SearchEntry,id:string):string|undefined{
 const lines=effectLines(entry);
 if(!('slot' in entry)){
  const index=entry.effects.findIndex(effect=>effect.stat===id);
  if(index!==-1)return lines[index];
 }
 return lines.find(line=>lineStat(line)===id);
}
function specialLines(entry:SearchEntry):string[]{
 if('slot' in entry)return [];
 const id=entry.id%1000000;
 const details=cardAbilityDetails[id];
 if(!details)return [];
 return ['發現率（尋寶率）',abilityTriggers[details.trigger],...(details.tags||[]).map(tag=>abilityTags[tag]),cardAbilityText(id,1)||''];
}
function attributeLine(entry:SearchEntry,attr:string):string|undefined{
 if(attr==='special')return specialLines(entry).at(-1);
 if(attr.startsWith('trigger:')&&!('slot' in entry))return cardAbilityDetails[entry.id%1000000]?.trigger===attr.slice(8)?specialLines(entry).at(-1):undefined;
 const special=specialLines(entry);
 if(special.includes(attr))return special.at(-1);
 const key=norm(attr);
 const direct=legacyStat[key];
 if(direct)return statLine(entry,direct);
 const pattern=generalPatterns[key];
 if(pattern)return effectLines(entry).find(line=>pattern.test(line));
 const id=aliases.get(key);
 return id?statLine(entry,id):undefined;
}
export function attributeMatches(entry:SearchEntry,attr:string):boolean{
 return !attr||attr==='all'||attributeLine(entry,attr)!==undefined;
}
function queryTerms(query:string):string[]{
 const value=norm(query);
 if(!value)return [];
 if(aliases.has(value)||generalAliases[value]||generalPatterns[value])return [value];
 const parts=value.split(' '),result:string[]=[];
 for(let i=0;i<parts.length;){
  let end=parts.length;
  while(end>i+1&&!aliases.has(parts.slice(i,end).join(' ')))end--;
  result.push(parts.slice(i,end).join(' '));i=end;
 }
 return result;
}
function queryEffect(entry:SearchEntry,term:string):string|undefined{
 const id=aliases.get(term);
 if(id)return statLine(entry,id);
 const attr=generalAliases[term]??(generalPatterns[term]?term:undefined);
 if(attr)return attributeLine(entry,attr);
 return [...effectLines(entry),...specialLines(entry)].find(line=>norm(line).includes(term));
}
export function queryMatches(entry:SearchEntry,query:string):boolean{
 const names=[entry.name,entry.originalName,'#'+entry.id,...(entry.nameAliases||[])].join(' ');
 const plain=norm(names);
 return queryTerms(query).every(term=>plain.includes(term)||queryEffect(entry,term)!==undefined);
}
export function entryMatches(entry:SearchEntry,query:string,attr:string):boolean{
 return queryMatches(entry,query)&&attributeMatches(entry,attr);
}
export function matchedEffect(entry:SearchEntry,query:string,attr:string):string|null{
 if(attr&&attr!=='all'){
  const match=attributeLine(entry,attr);
  if(match)return match;
 }
 for(const term of queryTerms(query)){
  const line=queryEffect(entry,term);
  if(line)return line;
 }
 return null;
}
