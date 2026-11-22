import type {Card,LapRules} from './types';
import {cardName,cardScore,isRaidOnlyCard} from './laps.ts';

export interface RankedCard {card:Card;score:number}

/** Same GS visibility and calculation rule for card previews, ranking and detail. */
export function cardGsContribution(card:Card,rules:LapRules,lap:number,jobId:string):number|null{
 if(isRaidOnlyCard(card))return null;
 const score=cardScore(card,rules,lap,jobId);
 return score!==null&&Number.isFinite(score)?score:null;
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
