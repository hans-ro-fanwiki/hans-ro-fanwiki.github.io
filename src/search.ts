import type {Card,Equipment} from './types';
import {equipmentSearchEffects} from './equipment-stats.ts';

export type SearchEntry=Card|Equipment;
export const ATTRIBUTE_GROUPS=[
 {label:'角色屬性',options:[['str','STR'],['agi','AGI'],['vit','VIT'],['int','INT'],['dex','DEX'],['luk','LUK']]},
 {label:'攻擊與戰鬥',options:[['attack','攻擊力'],['damage','傷害'],['crit','爆擊'],['hit','命中'],['cooldown','急速'],['casthaste','施法急速'],['range','攻擊範圍']]},
 {label:'防禦與生存',options:[['hp','HP'],['armor','護甲'],['flee','迴避'],['reduction','減傷']]}
] as const;
const attrPatterns:Record<string,RegExp>={
 str:/\bSTR\b|力量/i,agi:/\bAGI\b|敏捷/i,vit:/\bVIT\b|體質/i,int:/\bINT\b|智力/i,dex:/\bDEX\b|靈巧/i,luk:/\bLUK\b|幸運/i,
 attack:/\bATK\b|\bMATK\b|攻擊力|物理攻擊|魔法攻擊/i,cooldown:/冷卻|^急速\b|^急速(?:\s|$)|cooldown|^haste\b|\bCD\b/i,haste:/^急速(?:\s|$)|^haste\b/i,casthaste:/施法急速|詠唱速度|cast\s*haste/i,damage:/傷害|damage/i,crit:/爆擊|暴擊|critical/i,
 hit:/命中|\bHIT\b/i,range:/範圍|range/i,hp:/\bHP\b|生命/i,
 armor:/護甲|\bDEF\b|防禦/i,flee:/迴避|flee/i,
 reduction:/減傷|受到傷害|傷害減免/i,atk:/\bATK\b|物理攻擊/i,matk:/\bMATK\b|魔法攻擊/i
};
const aliases:Record<string,string>={
 智力:'int',靈巧:'dex',力量:'str',敏捷:'agi',體質:'vit',幸運:'luk',
 減cd:'cooldown',cd:'cooldown',冷卻縮減:'cooldown',冷卻:'cooldown',急速:'haste',施法急速:'casthaste',詠唱速度:'casthaste',
 暴擊:'crit',爆擊:'crit',迴避:'flee',命中:'hit',護甲:'armor',
 血量:'hp',生命:'hp',攻擊範圍:'range',範圍:'range',減傷:'reduction',
 攻擊力:'attack',物攻:'atk',魔攻:'matk'
};
export function effectLines(entry:SearchEntry):string[]{
 if(!('slot'in entry))return entry.bonuses;
 return equipmentSearchEffects(entry);
}
export function attributeMatches(entry:SearchEntry,attr:string):boolean{
 if(!attr||attr==='all')return true;
 const re=attrPatterns[attr.toLowerCase()];
 return re?effectLines(entry).some(v=>re.test(v)):false;
}
export function queryMatches(entry:SearchEntry,query:string):boolean{
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 if(!terms.length)return true;
 const lines=effectLines(entry);
 const plain=[entry.name,entry.originalName,...(entry.nameAliases||[]),...lines].join(' ').toLowerCase();
 return terms.every(term=>{
  const attr=aliases[term]||(attrPatterns[term]?term:null);
  // Names still match literally; recognized stat aliases must also match actual effects.
  if(attr==='haste'||attr==='casthaste'||attr==='cooldown')return [entry.name,entry.originalName,...(entry.nameAliases||[])].join(' ').toLowerCase().includes(term)||attributeMatches(entry,attr);
  return plain.includes(term)||(attr?attributeMatches(entry,attr):false);
 });
}
export function entryMatches(entry:SearchEntry,query:string,attr:string):boolean{
 return queryMatches(entry,query)&&attributeMatches(entry,attr);
}
export function matchedEffect(entry:SearchEntry,query:string,attr:string):string|null{
 const lines=effectLines(entry);
 if(attr&&attr!=='all'){
  const re=attrPatterns[attr.toLowerCase()];
  const match=re&&lines.find(x=>re.test(x));
  if(match)return match;
 }
 for(const term of query.trim().toLowerCase().split(/\s+/).filter(Boolean)){
  const target=aliases[term]||(attrPatterns[term]?term:null);
  const rx=target?attrPatterns[target]:null;
  const line=lines.find(x=>target==='haste'||target==='casthaste'||target==='cooldown'?(rx?.test(x)??false):x.toLowerCase().includes(term)||(rx?.test(x)??false));
  if(line)return line;
 }
 return null;
}
