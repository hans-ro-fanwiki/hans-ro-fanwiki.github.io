import type {TalentCatalog, TalentNode} from './talents';

/**
 * HANS already provides official Traditional Chinese skill names in skills.json,
 * but the game's third-job talent registration only supplies English talent labels
 * and English marketing copy. Keep the audited raw talents.json intact and derive
 * a Chinese-first reading layer from known game mechanics.
 *
 * Path headings are editorial translations of source English (not official HANS
 * names). Skill names are taken exclusively from the audited HANS skills.json.
 */
interface SkillName {
 id:string;name:string;originalName:string;description?:string|null;
}
export interface HANSNames {
 server:'hans';skills:SkillName[];
}

const PATH_NAMES:Record<string,string[][]> = {
 arch_bishop:[
  ['讚頌之雨','璀璨讚頌','悠長聖歌','戰鬥聖歌'],
  ['群體審判','最終裁決','不息祈禱','熱忱祈禱'],
  ['永生聖樹','憤怒聖樹','復甦','神聖之怒'],
 ],
 genetic:[
  ['砲擊陣列','攻城推車','旋轉推車','鋼鐵推車'],
  ['蔓生','食人植物','尖嘯根系','恐懼之根'],
  ['孢子雲','不穩定孢子','酸液之雨','酸液腐蝕'],
 ],
 guillotine_cross:[
  ['無盡迴旋','鋒刃迴旋','撕裂風暴','撕裂之刃'],
  ['十字連擊','致命十字','群鴉亂舞','深淵之爪'],
  ['蔓延毒霧','致命毒霧','幻影步伐','殺意'],
 ],
 kagerou_rank3:[
  ['花瓣風暴','鋒利風魔','持久符咒','熾焰符咒'],
  ['連鎖爆破','強力爆破','苦無之雨','精鍊苦無'],
  ['十字傷口','十文字','分身群影','暗影之刃'],
 ],
 mechanic:[
  ['連續砲擊','重型砲彈','絕對冰封','冰凍衝擊'],
  ['雙重噴嘴','過熱核心','結界引擎','戰鬥結界'],
  ['砲塔陣線','銀色子彈','彈幕風暴','破甲彈'],
 ],
 minstrel:[
  ['無盡箭雨','重壓箭雨','悠長安可','戰鬥頌歌'],
  ['迴盪回音','音波爆發','持久恩典','治癒聖歌'],
  ['鼓聲陣列','終章','鳴響琴弦','穿刺音符'],
 ],
 ranger:[
  ['無盡箭幕','集中箭幕','悠長微風','狩獵之風'],
  ['地毯式轟炸','重型炸藥','過載線圈','靜電場'],
  ['狼群狩獵','頭狼之咬','定身射擊','鷹眼'],
 ],
 rebellion_rank3:[
  ['無盡槍舞','熾熱槍管','還擊射擊','重型彈藥'],
  ['標記偵察','致命標記','龍尾連爆','龍牙'],
  ['雷霆巨鎚','神之重擊','地雷陣','大型地雷'],
 ],
 royal_guard:[
  ['長槍齊射','強化長槍','集結戰旗','英勇頌歌'],
  ['盾牌連擊','粉碎重壓','皇家儀態','國王恩典'],
  ['連續地震','大地碎裂','光芒之雨','天界裁決'],
 ],
 rune_knight:[
  ['連鎖爆炎','盧恩過載','巨人形態','戰鬥意志'],
  ['野火吐息','龍之怒','恐懼咆哮','咆哮之怒'],
  ['連環槍擊','貫穿長槍','旋風斬','狂風刃'],
 ],
 shadow_chaser:[
  ['三角齊射','致命三角','假面舞會','殘酷面具'],
  ['威脅之舞','致命利刃','誘餌工廠','活體炸彈'],
  ['模仿者','完美複製','暗影魔導書','法術竊取'],
 ],
 sorcerer:[
  ['精靈合唱','精靈羈絆','雷槍之雨','雷霆長槍'],
  ['迴盪波動','心靈壓制','事件視界','虛空重壓'],
  ['烈焰足跡','焦土','水晶風暴','鑽石核心'],
 ],
 soul_reaper:[
  ['靈魂齊射','貫穿艾斯帕','靈魂旋風','強化艾斯嗚'],
  ['蔓延詛咒','束縛詛咒','連鎖引爆','黑暗引爆'],
  ['靈魂囤積','靈魂饗宴','靈魂風暴','靈魂新星'],
 ],
 star_emperor:[
  ['太陽閃焰','太陽黑子','永恆架勢','宇宙律動'],
  ['流星雨','帝王之星','事件視界','重力壓制'],
  ['星象圖','墜落彗星','紅巨星','塌縮之星'],
 ],
 sura:[
  ['千掌連擊','天羅地網','昇龍','龍之怒'],
  ['氣彈連擊','過載氣勁','獅王威儀','獅王之怒'],
  ['雙虎','墮落帝國之路','連環掌之路','新月之路'],
 ],
 warlock:[
  ['彗星群','彗星核心','落石','熔岩核心'],
  ['元素球環','元素球釋放','元素連鎖','漩渦核心'],
  ['冰川連擊','碎裂點','凍結迷霧','脆弱迷霧'],
 ],
};

const PATH_IDS=['s1a','s1b','s2a','s2b'] as const;
const effectLabel = (node:TalentNode):string => {
 const source=(node.summary||'').replace(/（終極天賦）/g,'').trim();
 if(node.ultimate)return '終極・'+(source||'天賦強化');
 const perLevel=source.match(/^(.+?)每級\s*\+/);
 if(perLevel)return perLevel[1].trim()+'提升';
 // The game's helper defines the category but not always a numeric benefit.
 return source && !/[A-Za-z]{3}/.test(source)?source:'天賦效果強化';
};
const localizeAcronyms=(s:string):string=>s
 .replace(/Flee（迴避）/g,'迴避率')
 .replace(/\bFlee\b/g,'迴避率')
 .replace(/\bEXP\b/g,'經驗值')
 .replace(/\bINT\b/g,'智力');

export function localizeTalentCatalog(data:TalentCatalog,skills:HANSNames):TalentCatalog {
 if(data.server!=='hans'||skills.server!=='hans')throw Error('HANS talent/skill source mismatch');
 const skillByOriginal=new Map(skills.skills.map(skill=>[skill.originalName,skill]));
 const skillById=new Map(skills.skills.map(skill=>[skill.id,skill.name]));
 const jobs=data.jobs.map(job=>{
  const rank=job.rank??1;
  const paths=PATH_NAMES[job.job];
  if(rank===3&&(!paths||paths.length!==job.branches.length||paths.some(p=>p.length!==4)))
   throw Error('Missing third-job Chinese path descriptions: '+job.job);
  const branches=job.branches.map((branch,branchIndex)=>{
   if(rank!==3)return {
    ...branch,desc:localizeAcronyms(branch.desc||''),talents:branch.talents.map(node=>({
     ...node,name:localizeAcronyms(node.name),summary:localizeAcronyms(node.summary||''),
     maxEffect:localizeAcronyms(node.maxEffect||''),notes:node.notes?.map(localizeAcronyms)
    }))
   };
   const names=paths[branchIndex];
   const translatedPaths=(branch.paths||[]).map((path,i)=>{
    const pathNodes=branch.talents.filter(t=>t.path===PATH_IDS[i]);
    const steps=pathNodes.filter(t=>!t.ultimate).map(t=>t.summary).filter(Boolean);
    const ultimate=pathNodes.find(t=>t.ultimate)?.summary?.replace('（終極天賦）','');
    return {...path,originalName:path.name,originalDesc:path.desc,name:names[i],
     desc:'強化：'+steps.join('、')+(ultimate?'；終極：'+ultimate:'')+'。'};
   });
   const nodes=branch.talents.map(node=>{
    if(node.learn){
     const skill=skillByOriginal.get(node.originalName||'');
     if(!skill)throw Error('Missing official skill Chinese name for '+node.id);
     return {...node,name:skill.name,
      summary:'學會技能：'+skill.name+(skill.description?'。'+skill.description:'')};
    }
    const pathIndex=PATH_IDS.indexOf(node.path as typeof PATH_IDS[number]);
    const pathName=pathIndex>=0?translatedPaths[pathIndex].name:null;
    return {...node,name:(pathName?pathName+'・':'')+effectLabel(node),
     notes:pathName?['路線：'+pathName,'英文原名：'+node.originalName]:['英文原名：'+node.originalName]};
   });
   // The effect helpers reuse generic categories across unrelated talents.
   // Distinguish only collisions in one branch instead of inventing game names.
   const counts=new Map<string,number>();
   for(const node of nodes)counts.set(node.name,(counts.get(node.name)||0)+1);
   const used=new Map<string,number>();
   for(const node of nodes){
    if((counts.get(node.name)||0)<=1)continue;
    const number=(used.get(node.name)||0)+1;
    used.set(node.name,number);
    node.name+='（'+number+'）';
   }
   const learnNames=nodes.filter(n=>n.learn).map(n=>n.name);
   return {...branch,desc:'核心技能：'+learnNames.join('、')+'。依下方路線選擇強化方向。',
    paths:translatedPaths,talents:nodes};
  });
  return {...job,
   description:rank===3?'三轉天賦專精：'+branches.map(b=>b.name).join('、')+'。':localizeAcronyms(job.description||''),
   skills:job.skills?.map(s=>({...s,name:skillById.get(s.id)||s.id})),branches
  };
 });
 return {...data,jobs};
}
