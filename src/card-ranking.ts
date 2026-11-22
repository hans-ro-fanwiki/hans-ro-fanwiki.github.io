import type {Card,LapRules} from './types';
import {cardName,cardScore,isRaidOnlyCard} from './laps.ts';

export interface RankedCard {card:Card;score:number}

/** Filter upstream, score each card once, sort completely, then page in the UI. */
export function rankCardsByGs(cards:readonly Card[],rules:LapRules,lap:number,jobId:string):RankedCard[]{
 const scored:RankedCard[]=[];
 for(const card of cards){
  if(isRaidOnlyCard(card))continue;
  const score=cardScore(card,rules,lap,jobId);
  if(score!==null&&Number.isFinite(score))scored.push({card,score});
 }
 return scored.sort((a,b)=>b.score-a.score||
  cardName(a.card,rules,lap).localeCompare(cardName(b.card,rules,lap),'zh-Hant')||
  a.card.id-b.card.id);
}
