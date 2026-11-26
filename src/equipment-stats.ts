import type {Equipment} from './types.ts';
import data from './data/hans-equipment-rules.json' with {type:'json'};
import type {GearTierOption} from './tier.ts';
import statLabels from './data/hans-stat-labels.json' with {type:'json'};

type GearRecord={slot:string;weaponType?:string;starter?:boolean;secret?:boolean;magicBase?:boolean;fixed:string[]};
const records:Record<string,GearRecord>=data.records;
const fixedValues:Record<string,number>=data.fixedValues;
const defense:Record<string,number>=data.defBySlot;
const weaponWeights:Record<string,number>=data.weaponWeights;
export const EQUIPMENT_RULES_VERSION=data.version;
export const EQUIPMENT_QUALITIES=['普通','優良','稀有','史詩','傳說'] as const;
const labels:Record<string,[string,string?]>={
 str:['STR'],agi:['AGI'],vit:['VIT'],int:['INT'],dex:['DEX'],luk:['LUK'],
 crit:['爆擊率','%'],flee:['迴避','%'],cd:['急速','%'],spd:['移動速度','%'],area:['攻擊範圍','%'],cast:['施法急速','%'],
 hp:['HP'],armor:['護甲'],dr:['減傷','%'],regen:['HP 回復',' HP/s'],critDmg:['爆擊傷害','%'],stun:['命中暈眩率','%'],
 boss:['Boss／不死系傷害','%'],dot:['持續傷害','%'],reach:['近戰距離','%'],proj:['投射物速度','%'],
 zeny:['Zeny 獲得','%'],pickup:['拾取範圍','%'],potion:['藥水回復','%'],lowHp:['低 HP 時傷害','%'],pierce:['穿透率','%']
};
export const gearRecord=(item:Equipment)=>records[String(item.id)];
function number(n:number){return String(Number(n.toFixed(2)));}
function effect(key:string,value?:number):string{
 const [fallback,unit]=labels[key]??[key];
 const statId=({crit:'critChance',flee:'flee',cd:'haste',spd:'speedMult',area:'areaMult',cast:'castHaste',hp:'maxHp',armor:'armor',dr:'damageReduction',regen:'regen',critDmg:'critMult',stun:'stunChance',boss:'bossUndeadMult',dot:'dotDmg',reach:'reachMult',proj:'projSpeedMult',zeny:'zenyMult',pickup:'pickupRadius',potion:'potionMult',lowHp:'lowHpDamage',pierce:'pierceChance'} as Record<string,string>)[key]??key;
 const label=(statLabels as Record<string,{label:string}>)[statId]?.label??fallback;
 if(value===undefined)return label;
 return label+' +'+number(unit==='%'?value*100:value)+(unit??'');
}
export function fixedEquipmentEffects(item:Equipment,option?:GearTierOption):string[]{
 const record=gearRecord(item);
 if(!record)return item.bonuses;
 const factor=option?option.tier+(option.raid?1:0):undefined;
 return [...item.bonuses,...record.fixed.map(key=>effect(key,factor===undefined?undefined:fixedValues[key]*factor))];
}
export function equipmentBaseStats(item:Equipment,option:GearTierOption,quality=0):string[]{
 const r=gearRecord(item);if(!r||r.starter)return [];
 const t=option.tier;
 const tier=option.raid?Math.min(11,t+1):Math.min(t>8?10:t>3?8:3,t+(r.secret?1:0));
 if(r.slot!=='weapon'){const def=(defense[r.slot]??0)*tier;return def?['DEF +'+number(Math.round(def*10)/10)]:[];}
 const weight=weaponWeights[r.weaponType??'']??(!r.weaponType&&item.jobs.includes('taekwon')?.8:.15);
 const [low,high]=data.weaponRange;
 const raw=(low+(high-low)*weight)*Math.pow(data.weaponGrowth,tier-1)*(data.qualityBase[quality]??1);
 const magic=r.weaponType==='롯드'||r.weaponType==='책';
 const atk=Math.round(raw*(magic?data.weaponMagicRatio:1));
 const matk=magic||r.magicBase?Math.round(raw):0;
 return [atk?'ATK +'+atk:null,matk?'MATK +'+matk:null].filter((x):x is string=>x!==null);
}
export function equipmentSearchEffects(item:Equipment):string[]{
 const r=gearRecord(item);
 if(!r)return item.bonuses;
 return [...fixedEquipmentEffects(item),...(r.starter?[]:r.slot==='weapon'?['ATK',...(r.weaponType==='롯드'||r.weaponType==='책'||r.magicBase?['MATK']:[])]:defense[r.slot]?['DEF']:[])];
}
const PIERCE_WEAPONS=new Set(['활','권총','라이플','샷건','수리검','악기']);
export function equipmentAffixPools(item:Equipment,option?:GearTierOption){
 const r=gearRecord(item);if(!r||r.starter)return null;
 const t=option&&!option.raid?option.tier:undefined;
 const value=(k:string,v:number)=>effect(k,t===undefined?undefined:v*t);
 const offensive=['crit','cd','area',...(r.slot==='armor'||r.slot==='weapon'&&PIERCE_WEAPONS.has(r.weaponType??'')?['pierce']:[])];
 return {attributes:['str','agi','vit','int','dex','luk'].map(k=>value(k,1)),
  offensive:offensive.map(k=>value(k,.01)),defensive:[value('hp',5),value('armor',.4),value('spd',.01),value('flee',.01)]};
}
