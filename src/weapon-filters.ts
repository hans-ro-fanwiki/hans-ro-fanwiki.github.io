import type {Equipment} from './types.ts';
import {gearRecord} from './equipment-stats.ts';

// HANS V0.15.1: e6 (job expansion), tl (lineage), qn / RO_EQL / RO_BOW (eligibility).
// Catalog uses distinct Wiki IDs for extended rank-three jobs; game uses kagerou/rebellion.
const PARENT:Record<string,string>={
 knight:'swordsman',crusader:'swordsman',wizard:'mage',sage:'mage',hunter:'archer',bard:'archer',
 priest:'acolyte',monk:'acolyte',assassin:'thief',rogue:'thief',blacksmith:'merchant',alchemist:'merchant',
 star_gladiator:'taekwon',soul_linker:'taekwon',
 arch_bishop:'priest',genetic:'alchemist',guillotine_cross:'assassin',mechanic:'blacksmith',minstrel:'bard',ranger:'hunter',
 royal_guard:'crusader',rune_knight:'knight',shadow_chaser:'rogue',sorcerer:'sage',soul_reaper:'soul_linker',star_emperor:'star_gladiator',sura:'monk',warlock:'wizard',
 kagerou:'ninja',rebellion:'gunslinger',kagerou_rank3:'kagerou',rebellion_rank3:'rebellion'
};
const SECOND=['knight','crusader','wizard','sage','hunter','bard','priest','monk','assassin','rogue','blacksmith','alchemist','star_gladiator','soul_linker'];
const EXTRA:Record<string,string[]>={'활':['rogue'],'롯드':['soul_linker'],'책':['priest']};
const REMOVE:Record<string,string[]>={'활':['assassin']};
export const WEAPON_TYPES=[
 ['sword','單手劍','검'],['twohand-sword','雙手劍','양손검'],['dagger','短劍','단검'],
 ['spear','單手槍','창'],['twohand-spear','雙手槍','양손창'],['axe','單手斧','도끼'],['twohand-axe','雙手斧','양손도끼'],
 ['mace','鈍器','클럽'],['knuckle','拳套','너클'],['katar','拳刃','카타르'],['staff','法杖','롯드'],['book','書本','책'],
 ['bow','弓','활'],['instrument','樂器','악기'],['whip','鞭子','채찍'],['pistol','手槍','권총'],['rifle','步槍','라이플'],
 ['shotgun','霰彈槍','샷건'],['shuriken','手裏劍','수리검'],['taekwon','跆拳系武器',''],
 ['unknown','武器類型未確認','?']
] as const;
export function weaponType(item:Equipment):string|null{
 if(item.slot!=='weapon')return null;
 const record=gearRecord(item);
 if(!record)return 'unknown';
 if(!record.weaponType)return item.jobs.includes('taekwon')?'taekwon':'unknown';
 return WEAPON_TYPES.find(x=>x[2]===record.weaponType)?.[0]??'unknown';
}
export function weaponLabel(item:Equipment):string|null{
 const type=weaponType(item);
 return WEAPON_TYPES.find(x=>x[0]===type)?.[1]??null;
}
export function jobFamily(job:string):string{
 const seen=new Set<string>();
 while(PARENT[job]&&!seen.has(job)){seen.add(job);job=PARENT[job];}
 return job;
}
export function equipmentUsableBy(item:Equipment,job:string):boolean{
 if(job==='all'||!item.jobs.length)return true;
 const type=gearRecord(item)?.weaponType??'';
 const allowed=new Set(item.jobs);
 for(const j of SECOND)if(item.jobs.includes(PARENT[j]))allowed.add(j);
 for(const j of EXTRA[type]??[])allowed.add(j);
 for(const j of REMOVE[type]??[])allowed.delete(j);
 const lineage=new Set<string>();
 for(let j:string|undefined=job;j&&!lineage.has(j);j=PARENT[j])lineage.add(j);
 // Gender-specific items are included; the Wiki has no gender filter.
 return [...lineage].some(j=>allowed.has(j))||(type==='활'&&(lineage.has('rogue')||job==='thief'));
}
export function isWeaponSubtype(slot:string){return slot.startsWith('weapon:');}
export function equipmentMatchesSlot(item:Equipment,slot:string):boolean{
 return slot==='all'||(isWeaponSubtype(slot)?weaponType(item)===slot.slice(7):item.slot===slot);
}
export function weaponOptions(items:readonly Equipment[],job:string):[string,string][]{
 const types=new Set(items.filter(x=>equipmentUsableBy(x,job)).map(weaponType));
 return WEAPON_TYPES.filter(([key])=>types.has(key)).map(([key,label])=>['weapon:'+key,label]);
}
export function normalizeEquipmentSlot(slot:string,job:string,items:readonly Equipment[]):string{
 return isWeaponSubtype(slot)&&!weaponOptions(items,job).some(([key])=>key===slot)?'weapon':slot;
}
