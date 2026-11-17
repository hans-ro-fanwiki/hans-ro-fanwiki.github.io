/** Only manually reviewed GungHo RO Fan Kit monster illustrations. No RO Survivors game art. */
export const APPROVED_FANKIT_MONSTER_IDS=[
 'poring','lunatic','drops','picky','rocker','chonchon','ghostring','baphomet','osiris','eddga'
] as const;
const approved=new Set<string>(APPROVED_FANKIT_MONSTER_IDS);
export function approvedFanKitThumb(id:string):string|null{
 return approved.has(id)?import.meta.env.BASE_URL+'approved-thumbs/monsters/'+id+'.webp':null;
}
