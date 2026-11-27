import {cardAbilities} from './card-combat-score.ts';

export const abilityTriggers = {
 move:'移動', hit:'命中', basic:'普攻命中', critical:'爆擊', cast:'施放技能',
 hurt:'受擊', dodge:'閃避', kill:'擊殺', health:'HP 門檻', interval:'定時', revive:'復活',
} as const;
export type AbilityTrigger = keyof typeof abilityTriggers;
export const abilityTags = {lifesteal:'吸血',burn:'燃燒',shield:'護盾',conditional:'條件增傷'} as const;
type AbilityTag = keyof typeof abilityTags;
type Params = Record<string,number>;
type Description = (p:Params)=>string;
interface Details {trigger:AbilityTrigger;tags?:AbilityTag[];describe:Description}
const pct = (value:number)=>Number((value*100).toFixed(3))+'%';

export const cardAbilityDetails:Readonly<Partial<Record<number,Details>>> = {
 4123:{trigger:'move',tags:['conditional'],describe:p=>`持續移動 ${p.move} 秒可強化下一擊至 ${p.mult} 倍，周圍 ${p.r} 公尺的其他敵人另受該擊 ${pct(p.splash)} 傷害。間隔 ${p.cd} 秒。`},
 4128:{trigger:'hurt',describe:p=>`每 ${p.cd} 秒可免除一次受擊，並向該攻擊者反彈原傷害的 ${p.refl} 倍。`},
 4131:{trigger:'cast',describe:p=>`每累計施法 ${p.n} 次，最後一次保證觸發雙重施法。`},
 4134:{trigger:'basic',tags:['lifesteal'],describe:p=>`吸血增加 ${pct(p.ls)}，每秒上限為最大 HP 的 3%。普攻命中有 ${pct(p.chance)} 機率在 ${p.range} 公尺內放出連鎖蝙蝠，最多擊中 ${p.n} 個目標，各受本次命中 ${pct(p.pct)} 傷害，每個目標回復最大 HP 的 ${pct(p.heal)}。`},
 4137:{trigger:'kill',tags:['conditional'],describe:p=>`擊敗菁英或頭目後 ${p.secs} 秒內，傷害提高 ${pct(p.dmg)}。`},
 4143:{trigger:'health',describe:p=>`自身 HP 低於 ${pct(p.hp)} 時，持續 ${p.secs} 秒減傷 ${pct(p.red)} 並每秒回復最大 HP 的 ${pct(p.heal)}。冷卻 ${p.cd} 秒。`},
 4144:{trigger:'revive',describe:p=>`每局首次復活獲得 ${p.inv} 秒無敵，周圍 ${p.r} 公尺敵人受到平均單次傷害的 ${p.mult} 倍。重複插卡也只觸發一次。`},
 4145:{trigger:'cast',describe:p=>`每隔 ${p.every} 秒可讓下一次施放的技能縮短 ${pct(p.cut)} 冷卻。`},
 4147:{trigger:'critical',describe:p=>`爆擊會波及 ${p.r} 公尺內的其他敵人，追加本次命中 ${pct(p.pct)} 傷害。`},
 4168:{trigger:'interval',describe:p=>`每 ${p.every} 秒向附近敵人密集處降下隕石，半徑 ${p.r} 公尺，傷害為平均單次傷害的 ${p.mult} 倍。`},
 4197:{trigger:'hurt',describe:p=>`致命受擊時留下 1 HP，接著無敵 ${p.inv} 秒。冷卻 ${p.cd} 秒。`},
 4238:{trigger:'hit',describe:p=>`對同一敵人累計命中 ${p.n} 次時放出連鎖閃電，最多牽連 ${p.bounce} 個目標，各受本次命中 ${pct(p.pct)} 傷害。`},
 4243:{trigger:'interval',describe:p=>`每 ${p.every} 秒回復最大 HP 的 ${pct(p.heal)}，並向敵人密集處投下炸彈。炸彈半徑 ${p.r} 公尺，傷害為平均單次傷害的 ${p.mult} 倍。`},
 4263:{trigger:'health',tags:['conditional'],describe:p=>`自身每損失 10% HP，傷害增加 ${pct(p.per)}，最多增加 ${pct(p.max)}。`},
 4276:{trigger:'hit',tags:['burn','conditional'],describe:p=>`使燃燒可以爆擊，並對燃燒中的敵人額外造成 ${pct(p.burn)} 傷害。`},
 4318:{trigger:'hit',tags:['conditional'],describe:p=>`命中有 ${pct(p.chance)} 機率令非頭目冰凍 ${p.secs} 秒。對冰凍目標傷害變為 ${p.mult} 倍，擊殺時波及 ${p.r} 公尺，傷害為平均單次傷害的 ${p.shatter} 倍。`},
 4330:{trigger:'hit',describe:p=>`範圍技能可對命中目標附加 3 秒持續傷害，總額按該擊的 ${pct(p.pct)} 計算。同一目標間隔 ${p.cd} 秒。`},
 4372:{trigger:'health',tags:['shield'],describe:p=>`低於 ${pct(p.hp)} HP 時取得持續 ${p.secs} 秒的護盾，吸收量為最大 HP 的 ${pct(p.shield)}，並對 ${p.r} 公尺內敵人造成平均單次傷害的 ${p.mult} 倍。冷卻 ${p.cd} 秒。`},
 4386:{trigger:'hurt',describe:p=>`每承受 ${p.n} 次命中，對 ${p.r} 公尺內敵人回敬平均單次傷害的 ${p.mult} 倍。`},
 4407:{trigger:'kill',tags:['conditional'],describe:p=>`累計擊倒 ${p.kills} 個敵人時觸發落槍，對 ${p.r} 公尺內造成平均單次傷害的 ${p.mult} 倍，並提高自身傷害 ${pct(p.dmg)}，持續 ${p.secs} 秒。`},
 4419:{trigger:'interval',tags:['shield'],describe:p=>`每 ${p.every} 秒取得最大 HP ${pct(p.shield)} 的護盾。護盾破裂時，對 ${p.r} 公尺內敵人造成平均單次傷害的 ${p.mult} 倍。`},
 4430:{trigger:'critical',tags:['burn'],describe:p=>`爆擊給目標附加 3 秒燃燒，總額按本次命中 ${pct(p.pct)} 計算。`},
 4441:{trigger:'health',tags:['conditional'],describe:p=>`自身 HP 低於 40% 時提高傷害 ${pct(p.low)}。`},
 4456:{trigger:'health',tags:['conditional'],describe:p=>`自身 HP 高於 ${pct(p.hp)} 時減傷 ${pct(p.red)}，並提高輸出 ${pct(p.dmg)}。`},
 4485:{trigger:'interval',tags:['conditional'],describe:p=>`每 ${p.every} 秒標記附近的頭目或菁英 ${p.secs} 秒，對標記目標提高傷害 ${pct(p.dmg)}。爆擊標記目標時追加至多 ${p.bounce} 個其他目標，各受該擊 ${pct(p.pct)} 傷害。`},
 4487:{trigger:'critical',tags:['burn'],describe:p=>`範圍技能爆擊可對 ${p.r} 公尺內敵人追加火柱傷害 ${pct(p.pct)}，並附加 ${pct(p.burn)} 燃燒，均以本次命中為基準。間隔 ${p.cd} 秒。`},
 4490:{trigger:'dodge',tags:['conditional'],describe:p=>`閃避成功後提高傷害 ${pct(p.dmg)}，持續 ${p.secs} 秒。接下來 ${p.shots} 次命中會釋放狐火，最多彈跳到 ${p.bounce} 個目標，各受該擊 ${pct(p.pct)} 傷害。冷卻 ${p.cd} 秒。`},
 4525:{trigger:'hurt',describe:p=>`受到命中時有 ${pct(p.chance)} 機率暈眩周圍 ${p.r} 公尺內的非頭目 ${p.secs} 秒。冷卻 ${p.cd} 秒。`},
 4534:{trigger:'hurt',describe:p=>`受擊時有 ${pct(p.chance)} 機率反擊周圍 ${p.r} 公尺，傷害為平均單次傷害的 ${p.mult} 倍，非頭目另暈眩 ${p.stun} 秒。`},
 4601:{trigger:'hit',tags:['conditional'],describe:p=>`命中頭目或不死系會標記目標 ${p.secs} 秒，對該目標的傷害每層提高 ${pct(p.per)}，最多 ${p.max} 層。`},
 4980:{trigger:'basic',describe:p=>`普攻命中有 ${pct(p.chance)} 機率額外施放一個隨機已學技能，傷害為原本的 ${pct(p.mult)}。間隔 ${p.cd} 秒。`},
 4983:{trigger:'dodge',describe:p=>`成功閃避時回復最大 HP 的 ${pct(p.heal)}。間隔 ${p.cd} 秒。`},
 4985:{trigger:'health',tags:['conditional'],describe:p=>`目標 HP 低於 ${pct(p.hp)} 時，對頭目傷害為 ${p.boss} 倍，對其他目標為 ${p.mult} 倍。`},
};
export const cardSets = [
 {sealed:4490,partner:4263,name:'九尾',effect:(p:Params)=>`狐火彈跳 ${p.setBounce} 個目標，閃避後傷害加成提高至 ${pct(p.setDmg)}。`},
 {sealed:4485,partner:4407,name:'夢魘',effect:(p:Params)=>`夢魘標記延長到 ${p.setSecs} 秒，對標記目標傷害加成提高至 ${pct(p.setDmg)}。`},
 {sealed:4487,partner:4430,name:'焰王',effect:(p:Params)=>`火柱傷害提高至 ${pct(p.setPct)}，伊夫利特卡的燃燒改為該次爆擊傷害的 ${pct(p.setSoul)}。`},
] as const;
export function cardAbilityText(id:number,level:number){
 const ability=cardAbilities[id];
 const details=cardAbilityDetails[id];
 const params=ability?.levels[level-1];
 return params&&details?details.describe(params):undefined;
}
export function cardSetEffect(sealed:number,level:number){
 const params=cardAbilities[sealed]?.levels[level-1];
 return params&&cardSets.find(set=>set.sealed===sealed)?.effect(params);
}
