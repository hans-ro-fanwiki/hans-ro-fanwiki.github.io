import type {Card,LapRules} from './types';
import {cardName,cardScore,isRaidOnlyCard} from './laps.ts';

export interface RankedCard {card:Card;score:number}

/** Shared audited score for previews, ranking and detail. */
export function cardGsContribution(card:Card,rules:LapRules,lap:number,jobId:string):number|null{
 if(isRaidOnlyCard(card)&&!card.raidVariant)return null;
 const officialScore=cardScore(card,rules,lap,jobId);
 if(officialScore===null||!Number.isFinite(officialScore))return null;
 return officialScore;
}

/** Filter upstream, score each card once, sort completely, then page in the UI. */
export function rankCardsByGs(cards:readonly Card[],rules:LapRules,lap:number,jobId:string):RankedCard[]{
 const scored:RankedCard[]=[];
 for(const card of cards){
  const score=cardGsContribution(card,rules,lap,jobId);
  if(score!==null)scored.push({card,score});
 }
 return scored.sort((a,b)=>b.score-a.score||
  cardName(a.card,rules,lap).localeCompare(cardName(b.card,rules,lap),'zh-Hant')||
  a.card.id-b.card.id);
}

export function raidCardId(baseId:number,rules:LapRules):number{
 return baseId+rules.max*rules.cardStep;
}

/** Build distinct searchable cards while preserving base IDs for existing links. */
export function catalogCardVariants(cards:readonly Card[],rules:LapRules):Card[]{
 return cards.flatMap(card=>{
  if(!card.raid)return [card];
  const name=card.name+card.raid.suffix;
  const variant:Card={...card,id:raidCardId(card.id,rules),raidVariant:true,nameAliases:[name,name.replace('・',' '),name.replace('・',''),card.name.replace(/卡片$/,'')+card.raid.suffix.replace('・','')],
   sources:card.sources.filter(source=>source.sourceType==='raid')};
  if(isRaidOnlyCard(card))return [variant];
  return [{...card,raid:undefined,nameAliases:card.nameAliases?.filter(alias=>alias!==name),
   sources:card.sources.filter(source=>source.sourceType!=='raid')},variant];
 });
}
