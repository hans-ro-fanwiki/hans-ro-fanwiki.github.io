import data from './data/hans-experience.json' with {type:'json'};

export const experienceData = data;
type ExperienceStage = (typeof data.stages)[number];
type Monster = {level:number;exp:number};
type Advancement = 'first'|'expanded'|'second'|'third';
export type ExperienceOptions = {
  baseLevel:number;jobLevel:number;advancement:Advancement;maxLap:number;gs?:number;season:boolean;
  count:number;events:number;killsPerMinute?:number;extraSeconds:number;serverExp:number;
};
export const defaultExperienceOptions:ExperienceOptions = {
  baseLevel:50,jobLevel:1,advancement:'first',maxLap:1,season:true,count:1,events:1,extraSeconds:45,serverExp:1,
};

const monsters:Record<string,Monster> = data.monsters;
const stages = new Map(data.stages.map(stage=>[stage.id,stage]));
const averages = new Map(data.stages.map(stage=>{
  let level=0,exp=0,seconds=0;
  for(const wave of stage.waves){
    const duration=wave.to-wave.from;
    for(const id of wave.pool){
      level+=monsters[id].level*duration/wave.pool.length;
      exp+=monsters[id].exp*duration/wave.pool.length;
    }
    seconds+=duration;
  }
  return [stage.id,{level:level/seconds,exp:exp/seconds}] as const;
}));
const mazeId=data.chapterOne.at(-1)!;

export function lapExperience(stage:ExperienceStage,lap:number){
  const average=averages.get(stage.id)!;
  const rule=data.lap;
  const isChapterTwo=stage.chapterTwoBase!==undefined;
  let levelOffset=0;
  let monsterExp=1;
  let baseLap=stage.chapterTwoBase?.[lap-1]??1;
  if(lap>1&&!isChapterTwo){
    const reference=stage.season?average:averages.get(mazeId)!;
    const place=stage.season?data.chapterOne.length:data.chapterOne.indexOf(stage.id)+1;
    const span=data.chapterOne.length;
    const fraction=((lap-2)*span+place)/(span*(data.maxLap-1));
    levelOffset=Math.max(0,Math.round(reference.level-average.level));
    if(lap>=rule.from) levelOffset=Math.max(levelOffset,Math.round(rule.base+rule.span*fraction-average.level));
    monsterExp=Math.max(1,reference.exp/Math.max(.1,average.exp));
    baseLap=rule.mult[lap-1];
  }
  return {levelOffset,monsterExp,baseLap,averageLevel:average.level+levelOffset,newPenalty:isChapterTwo||lap>=rule.from,
    cap:lap>1&&!isChapterTwo?Math.max(stage.jobCap,stages.get(mazeId)!.jobCap):stage.jobCap};
}

export function experienceFactors(playerLevel:number,monsterLevel:number,baseLap:number,newPenalty:boolean){
  const difference=Math.max(0,playerLevel-monsterLevel);
  if(!newPenalty){
    const penalty=Math.max(data.base.legacyFloor,data.base.legacyDecay**difference);
    return {base:penalty,job:penalty};
  }
  const {pen,minLv,lowMult,baseK,jobK}=data.lap;
  const penalty=Math.max(pen.floor,1-pen.slope*difference);
  return {base:(playerLevel>=minLv?baseLap:lowMult)*baseK*penalty,job:jobK*penalty};
}

export function eventIntervals(events:number){
  return {elite:data.spawn.eliteInterval/events,horde:data.spawn.hordeInterval/events};
}

function nextBase(level:number){return Math.round(30*level*level*1.07**level)}
function nextJob(level:number){
  const {curveScale,curveLevel}=data.job;
  const scaled=curveLevel*level;
  return Math.max(10,Math.round(curveScale*curveLevel*30*scaled*scaled*1.07**scaled));
}

export function estimateExperience(stage:ExperienceStage,lap:number,options:ExperienceOptions){
  const {baseLevel,jobLevel,advancement,count,events,killsPerMinute,extraSeconds,serverExp}=options;
  const rule=lapExperience(stage,lap);
  const jobRank=advancement==='third'?3:advancement==='second'?2:1;
  const jobMax=advancement==='expanded'?70:data.job.levels[jobRank];
  const softCap=rule.cap*jobMax/50;
  const jobScale=stage.jobExp*data.job.scale/data.job.rankDivisor[jobRank-1];
  const lastBoss=stage.bosses.at(-1)!.time;
  const intervals=eventIntervals(events);
  const perSecondBudget=(killsPerMinute??Infinity)/60;
  let base=0,job=0,baseNow=baseLevel,jobNow=Math.min(jobLevel,jobMax),baseProgress=0,jobProgress=0;
  let waveIndex=0,bossIndex=0,easeUntil=0,nextElite=intervals.elite,nextHorde=intervals.horde;
  let normalKills=0,eliteKills=0,hordeKills=0;
  function credit(averagedMonsters:Monster[],kills:number){
    if(kills<=0)return;
    let rawBase=0,rawJob=0;
    for(const monster of averagedMonsters){
      const factors=experienceFactors(baseNow,monster.level+rule.levelOffset,rule.baseLap,rule.newPenalty);
      rawBase+=monster.exp*factors.base;
      rawJob+=monster.exp*factors.job;
    }
    const weight=kills*serverExp*rule.monsterExp/averagedMonsters.length;
    const baseGain=rawBase*weight;
    const jobGain=rawJob*weight*jobScale*(jobNow<softCap?1:data.job.softCapDecay**(jobNow-softCap+1));
    base+=baseGain;
    job+=jobGain;
    baseProgress+=baseGain;
    jobProgress+=jobGain;
    while(baseNow<data.base.max&&baseProgress>=nextBase(baseNow))baseProgress-=nextBase(baseNow++);
    while(jobNow<jobMax&&jobProgress>=nextJob(jobNow))jobProgress-=nextJob(jobNow++);
  }
  const waves=stage.waves.map(wave=>({...wave,monsters:wave.pool.map(id=>monsters[id])}));
  const hordeStocks=new Map<number,number>();
  for(let time=0;time<lastBoss;time++){
    while(stage.bosses[bossIndex]?.time===time){
      credit([monsters[stage.bosses[bossIndex++].id]],1);
      easeUntil=time+(stage.bossEase?.sec??0);
    }
    while(waveIndex+1<waves.length&&time>=waves[waveIndex].to)waveIndex++;
    const wave=waves[waveIndex];
    const eased=time<easeUntil;
    const warmup=Math.min(1,data.spawn.initialRate+(1-data.spawn.initialRate)*(time+.5)/data.spawn.warmupSeconds);
    const supply=wave.rate*count*warmup*(eased?(stage.bossEase?.rate??1):1);
    let hordeAdded=0;
    while(nextHorde<time+1){
      if(nextHorde>=easeUntil)hordeAdded+=Math.round(Math.min(120,36+nextHorde/8)*count);
      nextHorde+=intervals.horde;
    }
    if(hordeAdded>0)hordeStocks.set(waveIndex,(hordeStocks.get(waveIndex)??0)+hordeAdded);
    const releaseWindow=Math.max(1,Math.min(intervals.horde,lastBoss-time));
    const hordeSupply=[...hordeStocks.values()].reduce((total,stock)=>total+stock/releaseWindow,0);
    const potential=supply+hordeSupply;
    const fraction=Math.min(1,perSecondBudget/potential);
    const available=supply*fraction;
    // Elites replace an eligible regular spawn, rather than spawning as an extra monster.
    let elite=0;
    while(nextElite<time+1){
      elite++;
      nextElite+=intervals.elite;
    }
    elite=Math.min(available,elite*fraction);
    eliteKills+=elite;
    normalKills+=available-elite;
    credit(wave.monsters,available+4*elite);
    for(const [index,stock] of hordeStocks){
      const kills=stock*fraction/releaseWindow;
      credit(waves[index].monsters,kills);
      hordeKills+=kills;
      if(stock-kills<1e-6) hordeStocks.delete(index);
      else hordeStocks.set(index,stock-kills);
    }
  }
  for(const boss of stage.bosses.slice(bossIndex))credit([monsters[boss.id]],1);
  const minutes=(lastBoss+data.victorySeconds+extraSeconds)/60;
  return {stage,lap,rule,minutes,base:Math.round(base),job:Math.round(job),basePerMinute:base/minutes,
    jobPerMinute:job/minutes,jobMax,baseNow,jobNow,ordinary:normalKills,elite:eliteKills,horde:hordeKills};
}
export type ExperienceEstimate=ReturnType<typeof estimateExperience>;

export function rankExperience(options:ExperienceOptions,target:'base'|'job'){
  return data.stages.filter(stage=>!stage.season||options.season).flatMap(stage=>
    stage.gs.slice(0,options.maxLap).flatMap((gs,index)=>gs===null||(options.gs!==undefined&&gs>options.gs)
      ?[]:[estimateExperience(stage,index+1,options)]))
    .sort((a,b)=>target==='base'?b.basePerMinute-a.basePerMinute:b.jobPerMinute-a.jobPerMinute);
}
