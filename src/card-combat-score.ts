import model from './data/hans-card-model.json' with {type:'json'};
import abilities from './data/hans-card-abilities.json' with {type:'json'};
import type {CardEffect} from './types.ts';

export interface CardAbility {
 discovery:number;
 lifesteal?:number[];
 lowHpDamage?:number[];
 burnCrit?:number;
 levels:Record<string,number>[];
}

export const cardAbilities:Readonly<Partial<Record<number,CardAbility>>> = abilities;
const rawBonus:Partial<Record<number,number[]>> = model.MX;
const modeledBonus:Partial<Record<number,number[]>> = model.MV2;
const monsterChapter:Partial<Record<string,number>> = model.CHM;
const section = model.MC.SH;
const attributes:Record<string,Partial<Record<string,number>>> = model.MC.STATW;

/** Combat value with the reference stats for the card's origin and modification. */
export function modeledCardGs(effects:CardEffect[],scaling:string,chapter:number,level:number,raid:boolean):number {
 const reference = raid||chapter===3||chapter===2&&level>=4 ? model.RF.ch3
  : chapter===2||level>=4 ? model.RF.ch2 : model.RF.ch1;
 const values = new Map<string,number>();
 for(const {stat,value} of effects)values.set(stat,(values.get(stat)||0)+value);
 const growth=(x:number)=>x>0?1+x/(1+x/2):1+x;
 const reduction=(x:number)=>x>0?.85*x/(x+40):x/100;
 const logRatio=(after:number,before:number)=>Math.log(after/before);
 const r=reference;
 let offense=0, survival=0, flat=0;
 for(const [stat,value] of values){
  switch(stat){
   case 'damageMult': offense+=logRatio(r.D+value,r.D); break;
   case 'haste': offense+=section.haste*logRatio(1+r.H+value,1+r.H); break;
   case 'castHaste': offense+=(scaling==='magic'?section.castMagic:section.castOther)*logRatio(1+r.C+value,1+r.C); break;
   case 'critChance': {
    const chance=Math.min(1,r.c+value);
    const overflow=Math.max(0,r.c+value-1)*5;
    offense+=logRatio(1+chance*(r.m+overflow-1),1+r.c*(r.m-1)); break;
   }
   case 'critMult': offense+=logRatio(1+r.c*(r.m+value-1),1+r.c*(r.m-1)); break;
   case 'bossEliteMult': offense+=section.boss*logRatio(r.B+value,r.B); break;
   case 'bossUndeadMult': offense+=section.bossUndead*logRatio(r.B+value,r.B); break;
   case 'areaMult': offense+=section.area*logRatio(growth(r.A+value),growth(r.A)); break;
   case 'speedMult': {
    const gain=section.speed*logRatio(growth(r.V+value),growth(r.V));
    offense+=gain/2; survival+=gain/2; break;
   }
   case 'doubleChance': offense+=logRatio(1+section.double*(r.dc+value),1+section.double*r.dc); break;
   case 'dotDmg': offense+=logRatio(1+section.dot*(r.dot+value),1+section.dot*r.dot); break;
   case 'pierceChance': offense+=(scaling==='ranged'?section.pierceR:section.pierceO)*value; break;
   case 'stunChance': survival+=section.stun*value; break;
   case 'damageReduction': survival+=logRatio(1-reduction(r.R),1-reduction(r.R+100*value)); break;
   case 'flee': survival+=logRatio(1-Math.min(.5,r.f),1-Math.min(.5,r.f+value)); break;
   case 'armor': survival+=r.hit>value?logRatio(r.hit,r.hit-value):.5; break;
   case 'maxHp': survival+=logRatio(r.HP+value,r.HP); break;
   case 'maxHpPct': survival+=logRatio(r.P+value,r.P); break;
   case 'regen': case 'regenMoving': case 'regenStill':
    survival+=Math.log(Math.max(.01,1+(stat==='regen'?1:.5)*value*section.regenSec/(r.HP*r.P))); break;
   case 'revives': survival+=section.revive*Math.log(1+value); break;
   case 'str': case 'agi': case 'vit': case 'int': case 'dex': case 'luk':
    flat+=((attributes[scaling]||attributes.melee)[stat]||1)*value; break;
  }
 }
 return Math.max(0,Math.round(250*(offense+survival)+flat));
}

export function cardCombatScore(id:number,monster:string|null,effects:CardEffect[],raw:number,scaling:string,level:number,raid:boolean):number {
 const legacy=raw+Math.round(rawBonus[id]?.[level-1]||0);
 if(id===4144)return legacy;
 const score=modeledCardGs(effects,scaling,monsterChapter[monster||'']||1,level,raid)
  +Math.round(modeledBonus[id]?.[level-1]||0);
 return Math.max(legacy,score);
}

export function abilityGsEffects(id:number,level:number):CardEffect[] {
 const ability=cardAbilities[id];
 return [
  {stat:'lifesteal',value:ability?.lifesteal?.[level-1]||0},
  {stat:'lowHpDamage',value:ability?.lowHpDamage?.[level-1]||0}
 ].filter(effect=>effect.value!==0);
}
