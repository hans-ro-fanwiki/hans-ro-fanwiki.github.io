// Read-only HANS third-job talent AST extractor; never executes game code.
// Caller supplies known existing wiki job IDs to disambiguate duplicate HANS IDs.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import statLabels from '../src/data/hans-stat-labels.json' with {type:'json'};

const HASH='0201182d55c963b52c029016dd74651640e02c783d487f9077a7cd92ce5bf600';
const FILE='evidence/hans-talents-20261120/soul.js';
const NAMES={
 arch_bishop:'大主教',genetic:'基因學者',guillotine_cross:'十字斬首者',
 kagerou:'影狼／朧（三轉）',mechanic:'機械工匠',minstrel:'宮廷樂師／浪姬舞者',
 ranger:'遊俠',rebellion:'反叛者（三轉）',royal_guard:'皇家禁衛隊',
 rune_knight:'盧恩騎士',shadow_chaser:'魅影追蹤者',sorcerer:'妖術師',
 soul_reaper:'獵靈士',star_emperor:'星帝',sura:'修羅',warlock:'咒術士'
};
const BRANCH_NAMES={
 'Lauda Choir':'讚頌聖歌','Tribunal':'審判庭','Sacred Grove':'神聖之林',
 'Cart Remodeling':'手推車改造','Mad Botany':'瘋狂植物學','Biochemistry':'生化研究',
 'Blade Cyclone':'旋刃風暴','Cross Execution':'十字處刑','Toxic Phantom':'劇毒幻影',
 'Huuma Arts':'風魔手裏劍術','Kunai Arts':'苦無術','Shadow Arts':'影之術',
 'Mado Artillery':'魔導機甲砲術','Mado Armor':'魔導機甲裝甲','Fixed Arms':'固定武裝',
 'Storm Concerto':'暴風協奏','Echo Chorus':'回音合唱','Metal Strings':'金屬弦音',
 'Gale of Arrows':'箭矢狂風','Ranger Traps':'遊俠陷阱','Warg Hunt':'狼群狩獵',
 'Gun Dance':'槍舞','Crimson Hunt':'深紅狩獵','Demolition':'爆破',
 'Royal Vanguard':'皇家先鋒','Royal Bulwark':'皇家壁壘','Genesis':'創世之光',
 'Rune Mastery':'盧恩精通','Dragon Rider':'龍騎士','Rune Lancer':'盧恩槍術',
 'Phantom Archery':'幻影射術','Fatal Tricks':'致命詭計','Plagiarist':'模仿者',
 'Spirit Pact':'精靈契約','Psychic Vortex':'精神漩渦','Fire and Ice':'冰火之道',
 'Es Arts':'艾斯法術','Hex':'詛咒','Soul Harvest':'靈魂收割',
 'Corona':'日輪','Emperor\'s Sky':'帝王之天','Nova Heart':'星爆之心',
 'Net of Blows':'連擊之網','Lion Roar':'獅子吼','Tiger Fist':'猛虎拳',
 'Comet Sky':'彗星天際','Sphere Lore':'元素球奧義','Frozen Prison':'冰封牢獄'
};
const STATS={
 critChance:'爆擊率',critMult:'爆擊傷害',flee:'迴避率',haste:'急速',
 speedMult:'移動速度',maxHpPct:'最大生命',damageReduction:'傷害減免',
 bossEliteMult:'頭目／菁英傷害',doubleChance:'雙重攻擊機率',
 projSpeedMult:'投射物速度',areaMult:'技能範圍',damageMult:'傷害',
 pierceChance:'穿透機率',regenStill:'靜止時恢復',armor:'防禦'
};
for(const id of Object.keys(STATS))if(statLabels[id])STATS[id]=statLabels[id].label;
const ACTIONS={
 blind:'致盲效果強化',stun:'暈眩效果強化',slow:'緩速效果強化',
 bleed:'流血效果強化',crit:'爆擊效果強化',mark:'標記效果強化',
 weaken:'削弱敵人',castBuff:'施放技能時追加增益'
};
const FINALS={
 echo:'觸發額外施放',heavy:'強化技能威力',quick:'加快技能發動',
 long:'延長持續時間',field:'產生地面效果',chain:'連鎖施放',
 empower:'強化增益效果',execute:'處決效果',refresh:'重置技能效果',
 leech:'吸收生命',control:'追加控制效果',more:'追加攻擊',
 auto:'觸發自動施放'
};
function getProp(obj,key){
 if(!obj||!ts.isObjectLiteralExpression(obj))return null;
 const prop=obj.properties.find(p=>ts.isPropertyAssignment(p)&&keyOf(p.name)===key);
 return prop?.initializer||null;
}
function keyOf(n){
 if(ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n))return n.text;
 return '';
}
function elements(n){return n&&ts.isArrayLiteralExpression(n)?[...n.elements]:[];}
function literal(n){
 if(!n)return null;
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return n.text;
 if(ts.isNumericLiteral(n))return Number(n.text);
 if(ts.isPrefixUnaryExpression(n)&&(n.operator===ts.SyntaxKind.MinusToken||n.operator===ts.SyntaxKind.PlusToken)){
  const v=literal(n.operand);return typeof v==='number'?(n.operator===ts.SyntaxKind.MinusToken?-v:v):null;
 }
 return null;
}
function numeric(n){const v=literal(n);return typeof v==='number'&&Number.isFinite(v)?v:null;}
function percent(v){return Number((v*100).toFixed(2)).toLocaleString('en-US')+'%';}
function exprName(n){return n&&ts.isCallExpression(n)?n.expression.getText(source):'';}
function specInfo(expr,group,learnSkill){
 if(group==='learn')return {name:learnSkill?.name||String(learnSkill?.id||''),icon:learnSkill?.icon||null,maxRank:1,summary:'學會技能 '+(learnSkill?.name||learnSkill?.id||''),originalName:learnSkill?.name||learnSkill?.id||''};
 if(group==='final'){
  const name=literal(expr.arguments[2]);
  const icon=literal(expr.arguments[3]);
  const method=exprName(expr).split('.').at(-1);
  if(typeof name!=='string'||typeof icon!=='string'||!(method in FINALS))throw Error('Unrecognized third-job final: '+expr.getText(source).slice(0,150));
  return {name,originalName:name,icon,maxRank:1,summary:FINALS[method]+'（終極天賦）'};
 }
 if(!ts.isCallExpression(expr))throw Error('Unexpected node expression');
 let name=null,icon=null,maxRank=null,summary='';
 const method=exprName(expr);
 if(group==='passive'){
  if(method!=='P')throw Error('Unexpected third passive: '+method);
  name=literal(expr.arguments[0]);icon=literal(expr.arguments[1]);maxRank=numeric(expr.arguments[3])??5;
  const stat=expr.arguments[2];
  if(ts.isCallExpression(stat)){
   const statMethod=exprName(stat).split('.').at(-1), val=numeric(stat.arguments[0]),label=STATS[statMethod];
   if(label&&val!==null)summary=label+'每級 +'+(statMethod==='armor'?String(val):percent(val));
  }
 }else if(group==='step'){
  const outer=method==='ut.ic'?expr.arguments[0]:expr;
  if(!ts.isCallExpression(outer))throw Error('Unexpected wrapped third step');
  const kind=exprName(outer);
  const args=outer.arguments;
  name=literal(args[0]);
  if(method==='ut.ic')icon=literal(expr.arguments[1]);
  else if(kind==='dur')icon=literal(args[1]);
  else if(kind.startsWith('S.'))icon=literal(args[2]);
  if(kind==='dur'){
   maxRank=numeric(args[4]);
   const v=numeric(args[3]);
   if(v!==null)summary='持續時間每級 +'+percent(v);
  }else if(kind==='ut.sn'){
   maxRank=numeric(args[3]);const v=numeric(args[2]);
   if(v!==null)summary='攻擊／投射物數量每級 +'+v;
  }else if(['ut.sd','ut.sc','ut.sa'].includes(kind)){
   maxRank=numeric(args[3]);const v=numeric(args[2]);
   const field={'ut.sd':'傷害','ut.sc':'技能急速','ut.sa':'技能範圍／射程'}[kind];
   if(v!==null)summary=field+'每級 +'+percent(v);
  }else if(kind.startsWith('S.')){
   maxRank=numeric(args.at(-1));
   summary=ACTIONS[kind.slice(2)]||'追加技能效果';
  }else throw Error('Unknown third step helper: '+kind);
 }else throw Error('Unsupported group '+group);
 if(typeof name!=='string'||!name.trim()||typeof icon!=='string'||!icon.trim()||!Number.isInteger(maxRank)||maxRank<1||maxRank>10)
  throw Error('Cannot prove third node rank/name/icon: '+expr.getText(source).slice(0,180));
 return {name,originalName:name,icon,maxRank,summary};
}
let source;
export function extractThirdJobs(existingIds){
 const bytes=fs.readFileSync(FILE);
 const sha=createHash('sha256').update(bytes).digest('hex');
 if(sha!==HASH)throw Error('HANS game JS sha changed: third talents require new source audit');
 source=ts.createSourceFile('hans-soul.js',bytes.toString('utf8'),ts.ScriptTarget.Latest,true);
 let registry=null;const trees=new Map(),skills=new Map();
 function traverse(n){
  if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text==='RO_J3'&&ts.isArrayLiteralExpression(n.initializer))registry=n.initializer;
  if(ts.isCallExpression(n)){
   const call=exprName(n);
   if(call==='Ce'&&n.arguments.length>=3){
    const id=literal(n.arguments[0]),name=literal(n.arguments[1]),icon=literal(n.arguments[2]);
    if(typeof id==='string'&&typeof name==='string'&&typeof icon==='string')skills.set(id,{id,name,icon});
   }
   if(call.endsWith('.tree3')&&n.arguments.length===2){
    const id=literal(n.arguments[0]);
    if(typeof id!=='string'||!ts.isObjectLiteralExpression(n.arguments[1]))throw Error('Unexpected third tree signature');
    const list=trees.get(id)||[];list.push(n.arguments[1]);trees.set(id,list);
   }
  }
  ts.forEachChild(n,traverse);
 }
 traverse(source);
 if(!registry)throw Error('HANS RO_J3 registration array missing');
 const roster=elements(registry).map(o=>({
  id:literal(getProp(o,'id')),name:literal(getProp(o,'name')),
  base:literal(getProp(o,'base')),desc:literal(getProp(o,'desc')),rank:literal(getProp(o,'rank'))
 }));
 if(roster.length!==16||trees.size!==16||roster.some(j=>j.rank!==3||!j.id||!j.name||!j.base||trees.get(j.id)?.length!==3))
  throw Error('Third-job registration tree mismatch: '+roster.length+' jobs / '+trees.size+' families');
 const jobs=[];
 for(const meta of roster){
  const alias=existingIds.has(meta.id)?meta.id+'_rank3':meta.id;
  if(existingIds.has(alias)||!NAMES[meta.id])throw Error('Third job alias or name collision: '+alias);
  const output={
   job:alias,sourceJobId:meta.id,name:NAMES[meta.id],originalName:meta.name,
   rank:3,developing:false,description:meta.desc,base:meta.base,
   rule:'HANS 遊戲程式登錄三轉天賦：70 點，三條分支選一條專精，終極天賦需先投入 55 點。',
   skills:[],branches:[]
  };
  const skillRefs=new Map();
  for(const [branchId,b] of trees.get(meta.id).entries()){
   const name=literal(getProp(b,'name')),icon=literal(getProp(b,'icon')),desc=literal(getProp(b,'desc'));
   const skillIds=elements(getProp(b,'skills')).map(literal),passives=elements(getProp(b,'passives')),paths=elements(getProp(b,'paths'));
   if(typeof name!=='string'||typeof icon!=='string'||typeof desc!=='string'||skillIds.length!==2||passives.length!==9||paths.length!==4)
    throw Error('Third branch structure invalid '+meta.id+':'+branchId);
   for(const id of skillIds){if(typeof id!=='string'||!skills.has(id))throw Error('Third skill registration missing: '+id);skillRefs.set(id,skills.get(id));}
   const prefix=alias+'.'+branchId+'.';
   const nodes=[],connections=[];
   function add(id,row,col,sourceExpr,group,extras={}){
    const info=specInfo(sourceExpr,group,extras.learnSkill);
    nodes.push({id:prefix+id,row,col,name:info.name,originalName:info.originalName,icon:info.icon,
     maxRank:info.maxRank,requires:extras.requires||[],learn:group==='learn',ultimate:group==='final',
     weapon:false,path:extras.path||null,summary:info.summary,maxEffect:'',notes:extras.notes||[]});
   }
   for(let index=0;index<2;index++){
    const sid=skillIds[index];
    const id=index===0?'s1':'s2';
    // The first skill is at (0,0); the second at (3,3).
    const info=skills.get(sid);
    const placeholder=ts.factory.createIdentifier('skill');
    add(id,index===0?0:3,index===0?0:3,placeholder,'learn',{learnSkill:info});
   }
   const passiveRows=[0,1,2,4,5,7,8,9,10];
   passives.forEach((p,i)=>add('p'+i,passiveRows[i],2,p,'passive'));
   const first=[1,3,5,8],second=[4,6,7,9];
   for(const [i,p] of paths.entries()){
    const pathName=literal(getProp(p,'name')),pathDesc=literal(getProp(p,'desc'));
    const steps=elements(getProp(p,'steps')),final=getProp(p,'final');
    if(typeof pathName!=='string'||typeof pathDesc!=='string'||steps.length!==4||!final||!ts.isCallExpression(final))
     throw Error('Third path shape changed: '+meta.id+':'+branchId+':'+i);
    const kind=i<2?'s1':'s2',side=i%2===0?'a':'b',col=(i<2?0:3)+(i%2);
    const pathId=kind+side,rows=i<2?first:second;
    let previous=kind;
    for(const [stepIndex,spec] of steps.entries()){
     const id=pathId+(stepIndex+1);
     add(id,rows[stepIndex],col,spec,'step',{
      path:pathId,requires:stepIndex===0?[prefix+kind]:[],
      notes:[pathName+'（'+pathDesc+'）']
     });
     connections.push({from:prefix+previous,to:prefix+id});
     previous=id;
    }
    const finishId=pathId+'f';
    add(finishId,11,col,final,'final',{path:pathId,notes:[pathName+'（'+pathDesc+'）']});
    connections.push({from:prefix+previous,to:prefix+finishId});
   }
   if(nodes.length!==31||new Set(nodes.map(x=>x.id)).size!==31)throw Error('Third nodes incomplete: '+meta.id+':'+branchId);
   output.branches.push({
    id:branchId,name:BRANCH_NAMES[name]||name,originalName:name,desc,
    icon,paths:paths.map(p=>({name:literal(getProp(p,'name')),desc:literal(getProp(p,'desc'))})),
    rows:12,cols:5,connections,talents:nodes
   });
  }
  output.skills=[...skillRefs.values()].map(s=>({id:s.id,icon:s.icon}));
  jobs.push(output);
  existingIds.add(alias);
 }
 if(jobs.length!==16||jobs.reduce((n,j)=>n+j.branches.reduce((m,b)=>m+b.talents.length,0),0)!==1488)
  throw Error('Third extraction node count mismatch');
 return {jobs,sha256:sha,source:'game-registration',cap:70};
}
