import officialItemCardManifest from '../public/approved-thumbs/item-card-manifest.json';

/** All public imagery comes from curated official RO websites, never RO Survivors game assets. */
export const APPROVED_FANKIT_MONSTER_IDS=[
 'poring','lunatic','drops','picky','rocker','chonchon','ghostring','baphomet','osiris','eddga'
] as const;
const approved=new Set<string>(APPROVED_FANKIT_MONSTER_IDS);
export function approvedFanKitThumb(id:string):string|null{
 return approved.has(id)?import.meta.env.BASE_URL+'approved-thumbs/monsters/'+id+'.webp':null;
}

/** Exact filename-matched thumbnails from GungHo's official RO game-data pages. */
export function approvedOfficialIcon(kind:'item'|'card',id:string|number):string|null{
 const group=kind==='item'?officialItemCardManifest.items:officialItemCardManifest.cards;
 const record=(group as Record<string,{file:string}>)[String(id)];
 return record?import.meta.env.BASE_URL+'approved-thumbs/'+record.file:null;
}

export function isApprovedOfficialIcon(kind:'item'|'card',id:string|number):boolean{
 return Boolean(approvedOfficialIcon(kind,id));
}
