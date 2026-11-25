// HANS V0.15.1 2026-11-25, audited RO_CARDFLOOR and soul lap generation.
export const RAID_GS_RULES:Readonly<Record<number,{rank:'mvp'|'mini';coefficient:number}>>={
 4143:{rank:'mvp',coefficient:7},4145:{rank:'mvp',coefficient:4.9},
 4456:{rank:'mvp',coefficient:4.2},4533:{rank:'mini',coefficient:1.4},
 4534:{rank:'mvp',coefficient:4.2},4601:{rank:'mvp',coefficient:2.8},
 4603:{rank:'mini',coefficient:1.12},4980:{rank:'mvp',coefficient:1.26},
 4981:{rank:'mini',coefficient:1.15},4982:{rank:'mini',coefficient:1.68},
 4983:{rank:'mvp',coefficient:1.96},4984:{rank:'mini',coefficient:3.5},
 4985:{rank:'mvp',coefficient:5.6},4986:{rank:'mini',coefficient:2.8},
 4987:{rank:'mini',coefficient:1.75},
};
export const RAID_GS_MIN_COEFFICIENT=3.5;
export const RAID_GS_EXTRA_MULTIPLIER=1.2;
// Osiris effect multiplier = lap; GS = rounded base raw GS × (1 + .3 × (lap-1)).
export const CARD_PER_LAP_IDS:ReadonlySet<number>=new Set([4144]);
export const PER_LAP_GS_INCREMENT=.3;
