import data from './data/hans-raids.json';
import audit from '../docs/HANS_RAID_SOURCE_20261123.json';
import type {Catalog, Equipment, ImageEvidence, Source} from './types';

export const raids = data.raids;
export type Raid = (typeof raids)[number];

export function parseRaid(value: string | null): string | null {
 return value === 'all' || raids.some(raid=>raid.id===value) ? value : null;
}

export function raidUrl(id: string): string {
 return '?page=stages&raid='+encodeURIComponent(id);
}

export function addRaidSources(catalog: Catalog): Catalog {
 const items = new Map(catalog.items.map(item=>[item.id,item]));
 const cards = new Map(catalog.cards.map(card=>[card.id,card]));
 for (const [rawId, record] of Object.entries(data.extraItems)) {
  const id = Number(rawId);
  if (items.has(id)) continue;
  const base = items.get(record.baseId);
  if (!base) throw Error('Unknown HANS equipment base: '+record.baseId);
  const icon:ImageEvidence = {assetId:rawId,officialPath:record.icon,rights:'not-cleared',renderAllowed:false};
  const item:Equipment = {
   id,name:record.name,originalName:record.originalName,slot:base.slot,jobs:base.jobs,gender:base.gender,
   baseStats:base.baseStats,bonuses:base.bonuses,sources:[],image:icon,icon,
   fieldProvenance:{registration:'official',name:'official'},
  };
  items.set(id,item);
 }
 const evidence = (key:string):NonNullable<Source['evidence']>=>({
  file:audit.main.file,hash:audit.main.sha256,kind:'hans-raid-preview',key,
 });
 for (const raid of raids) {
  for (const id of raid.gear) {
   const item=items.get(id);
   if (!item) throw Error('Unknown HANS raid equipment: '+id);
   items.set(id,{...item,sources:[...item.sources.filter(source=>source.raidId!==raid.id),{
    sourceType:'raid',raidId:raid.id,sourceTier:raid.tier,monsterId:null,stageRefs:[],
    detail:'出現在遊戲內擲骰裝備池',verificationState:'official',evidence:evidence(raid.id+'.pool:'+id),
   }]});
  }
  for (const id of raid.cards) {
   const card=cards.get(id);
   if (!card?.raid) throw Error('Unknown HANS raid card: '+id);
   cards.set(id,{...card,sources:[...card.sources.filter(source=>source.sourceType!=='raid'),{
    sourceType:'raid',raidId:raid.id,monsterId:null,stageRefs:[],
    detail:'遊戲內列為副本掉落；首通後也可用遠征勳章兌換',verificationState:'official',
    evidence:evidence(raid.id+'.cards:'+id),
   }]});
  }
 }
 return {...catalog,items:[...items.values()].sort((a,b)=>a.id-b.id),cards:[...cards.values()]};
}
