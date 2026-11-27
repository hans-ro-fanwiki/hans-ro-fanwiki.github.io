export interface EquipmentInstance {
 itemId:number;
 tier?:number;
 ilvl?:number;
 src?:string;
 rg?:number;
 wbs?:boolean|number;
}

/** High-level equipment names depend on the instance, including legacy drops. */
export function equipmentChapterSuffix(item:EquipmentInstance,thirdChapterId:boolean,thirdChapterSource:boolean):string {
 const tier=item.tier??0;
 if(item.rg===1)return '・副本T'+tier;
 if(tier>8)return (item.wbs?'・世界王T':'・T')+tier;
 if((item.ilvl??0)>70)return (thirdChapterId||thirdChapterSource?'・三章T':'・二章T')+(tier||8);
 return '';
}
