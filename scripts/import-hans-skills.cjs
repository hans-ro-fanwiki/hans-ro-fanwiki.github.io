#!/usr/bin/env node
// HANS skills are read from a reviewed, SHA-pinned local game snapshot.
// NEVER execute/eval/source-import the HANS bundle or publish it as an asset.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const ts=require('typescript');

const root=path.resolve(__dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/HANS_SOURCE_AUDIT.json'),'utf8'));
const base=path.join(root,'evidence/hans-20261119');
const sourceFile=path.join(base,audit.hans.soul.file);
const sourceBytes=fs.readFileSync(sourceFile);
const sha=createHash('sha256').update(sourceBytes).digest('hex');
if(sha!==audit.hans.soul.sha256)throw Error('HANS skill source SHA differs from audited snapshot');
const ast=ts.createSourceFile('hans-soul.js',sourceBytes.toString('utf8'),ts.ScriptTarget.Latest,true);
if(ast.parseDiagnostics.length)throw Error('Unable to parse audited HANS skill source');
const talents=JSON.parse(fs.readFileSync(path.join(root,'public/data/talents.json'),'utf8'));
if(talents.server!=='hans'||talents.jobs.length!==41)throw Error('Unexpected HANS job registry');

const keyOf=n=>(n&&(ts.isStringLiteral(n)||ts.isNumericLiteral(n)||ts.isIdentifier(n)))?n.text:null;
const str=n=>(n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)))?n.text:null;
const number=n=>n&&ts.isNumericLiteral(n)?Number(n.text):null;
const arr=n=>ts.isArrayLiteralExpression(n)?n.elements.map(str).filter(x=>typeof x==='string'):[];
function translateMap(id){
 const map=new Map();
 let found=false;
 function mergeLiteral(obj){
  if(!obj||!ts.isObjectLiteralExpression(obj))throw Error('Nonliteral HANS translation block: '+id);
  for(const property of obj.properties){
   if(!ts.isPropertyAssignment(property))continue;
   const key=keyOf(property.name),val=str(property.initializer);
   if(key&&val)map.set(key,val);
  }
 }
 // HANS registers early translations in aA/KI declarations, then appends
 // third-job translations with Object.assign(aA, {...}). Both must be read.
 for(const st of ast.statements){
  if(ts.isVariableStatement(st)){
   for(const d of st.declarationList.declarations){
    if(ts.isIdentifier(d.name)&&d.name.text===id){
     mergeLiteral(d.initializer);found=true;
    }
   }
  }else if(ts.isExpressionStatement(st)&&ts.isCallExpression(st.expression)){
   const call=st.expression,callee=call.expression;
   if(ts.isPropertyAccessExpression(callee)&&ts.isIdentifier(callee.expression)&&callee.expression.text==='Object'&&callee.name.text==='assign'
     &&call.arguments.length>=2&&ts.isIdentifier(call.arguments[0])&&call.arguments[0].text===id){
    for(const addition of call.arguments.slice(1))mergeLiteral(addition);
    found=true;
   }
  }
 }
 if(!found)throw Error('Missing audited HANS translation table: '+id);
 return map;
}
const names=translateMap('aA'),descs=translateMap('KI');
const skillIds=new Set(talents.jobs.flatMap(job=>(job.skills||[]).map(s=>s.id)));
const registry=new Map();
function literalDescription(node){
 if(!node)return null;
 if(ts.isParenthesizedExpression(node))return literalDescription(node.expression);
 if(str(node))return str(node);
 if(ts.isCallExpression(node)){
  // Third-job skills register their own bilingual descriptions through L(en, zh).
  if(ts.isIdentifier(node.expression)&&node.expression.text==='L'&&node.arguments.length===2)
   return str(node.arguments[1]);
  if(node.arguments.length===1&&str(node.arguments[0]))return str(node.arguments[0]);
 }
 return null;
}
function splitDescriptions(node){
 if(!node)return [null,null];
 const expr=(ts.isArrowFunction(node)||ts.isFunctionExpression(node))?node.body:node;
 if(ts.isBlock(expr)){
  const ret=expr.statements.find(st=>ts.isReturnStatement(st));
  return ret?splitDescriptions(ret.expression):[null,null];
 }
 if(ts.isConditionalExpression(expr)){
  // Source registration uses rank===1?baseDescription:upgradeDescription.
  const cond=expr.condition.getText(ast);
  if(/(?:===|==)\s*1\b/.test(cond))return [literalDescription(expr.whenTrue),literalDescription(expr.whenFalse)];
  return [null,null];
 }
 return [literalDescription(expr),null];
}
function readMeta(node){
 const result={cooldown:null,type:null,tags:[],cast:[]};
 if(!node||!ts.isObjectLiteralExpression(node))return result;
 for(const prop of node.properties){
  if(!ts.isPropertyAssignment(prop))continue;
  const key=keyOf(prop.name),val=prop.initializer;
  if(key==='cd')result.cooldown=number(val);
  if(key==='type')result.type=str(val);
  if(key==='tags')result.tags=arr(val);
  if(key==='cast')result.cast=arr(val);
 }
 return result;
}
function visit(node){
 if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['$e','Ce'].includes(node.expression.text)){
  const args=node.arguments,id=str(args[0]),originalName=str(args[1]),icon=str(args[2]);
  if(id&&skillIds.has(id)){
   if(!originalName||!icon||registry.has(id))throw Error('Duplicate or malformed HANS skill: '+id);
   const specialized=node.expression.text==='Ce';
   const texts=splitDescriptions(args[specialized?4:3]);
   const metadata=readMeta(specialized?args[3]:null);
   const localization=texts.map(raw=>raw?(/[\u3400-\u9fff]/.test(raw)?raw:descs.get(raw)||null):null);
   registry.set(id,{id,name:names.get(originalName)||originalName,originalName,icon,
    description:localization[0],upgradeDescription:localization[1],
    descriptionSource:texts[0]?'hans-registered':'not-static',
    translationState:texts[0]?(localization[0]?'official-zh':'untranslated'):'dynamic',
    cooldown:metadata.cooldown,type:metadata.type,tags:metadata.tags,cast:metadata.cast,
    sourceType:specialized?'advanced':'basic'});
  }
 }
 ts.forEachChild(node,visit);
}
visit(ast);
const unknown=[...skillIds].filter(id=>!registry.has(id));
if(unknown.length)throw Error('Missing HANS registrations for: '+unknown.join(','));
const skillRows=[...registry.values()].sort((a,b)=>a.id.localeCompare(b.id));
const jobs=talents.jobs.map(job=>({
 id:job.job,sourceId:job.sourceJobId||job.job,name:job.name,rank:job.rank??1,
 base:job.base||null,developing:!!job.developing,skills:job.skills.map(ref=>{
  const entry=registry.get(ref.id);
  if(ref.icon&&entry.icon!==ref.icon)throw Error('HANS skills disagree with talent icon: '+job.job+'/'+ref.id);
  return ref.id;
 })
}));
const data={
 server:'hans',schemaVersion:1,reviewedAt:audit.reviewedAt,
 source:{sha256:sha,relativeFile:audit.hans.soul.file},
 policy:'HANS audited skill registry only. Show confirmed official zh localization; do not invent unavailable descriptions, per-level formulas or cooldowns.',
 jobs,skills:skillRows
};
const count=key=>skillRows.filter(s=>s[key]).length;
console.log(JSON.stringify({jobs:jobs.length,refs:jobs.reduce((x,j)=>x+j.skills.length,0),
 unique:skillRows.length,baseDescriptions:count('description'),
 upgradeDescriptions:count('upgradeDescription'),cooldowns:count('cooldown'),
 untranslated:skillRows.filter(s=>s.translationState!=='official-zh').slice(0,12).map(s=>[s.id,s.translationState]),
 examples:['bash','firebolt','meteor_storm','brandish_spear','comet'].map(k=>registry.get(k)).filter(Boolean)
},null,2));
if(process.argv.includes('--write')){
 const dest=path.join(root,'public/data/skills.json');
 fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
 console.log('Written HANS-only',dest);
}
