#!/usr/bin/env node
/* Extract HANS talent topology using TypeScript AST only.
 * Does not import, run, eval, or bundle the upstream game scripts.
 * Source must be a locally reviewed, gitignored snapshot with the expected hash.
 */
const fs=require('node:fs');
const crypto=require('node:crypto');
const ts=require('typescript');
const path=require('node:path');

const input=process.argv.find((a,i)=>i>1&&!a.startsWith('--'))||'evidence/hans-talents-20261120/soul.js';
const expected='0201182d55c963b52c029016dd74651640e02c783d487f9077a7cd92ce5bf600';
const bytes=fs.readFileSync(input);
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
if(hash!==expected)throw Error('HANS talent snapshot SHA differs; stop and re-audit upstream');
const source=ts.createSourceFile(path.basename(input),bytes.toString('utf8'),ts.ScriptTarget.Latest,true);
const functions=new Map();
const globals=new Map();
const zh=new Map();
const treeCalls=[];
function propKey(n) {
 if(ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n))return n.text;
 return null;
}
function walk(n) {
 if(ts.isFunctionDeclaration(n)&&n.name)functions.set(n.name.text,n);
 if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer){
  if(ts.isArrowFunction(n.initializer)||ts.isFunctionExpression(n.initializer))functions.set(n.name.text,n.initializer);
  else {const list=globals.get(n.name.text)||[];list.push(n);globals.set(n.name.text,list);}
 }
 if(ts.isPropertyAssignment(n)) {
  const k=propKey(n.name);
  if(k&&ts.isStringLiteral(n.initializer)&&/[\u3400-\u9fff]/.test(n.initializer.text))zh.set(k,n.initializer.text);
 }
 if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='Yn'&&n.arguments.length>=2)treeCalls.push(n);
 ts.forEachChild(n,walk);
}
walk(source);
function unbox(n) {
 while(n&&(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isTypeAssertionExpression(n)))n=n.expression;
 return n;
}
const link=(node,scope)=>({node,scope});
function earlierGlobal(name,pos){const arr=globals.get(name)||[];for(let i=arr.length-1;i>=0;i--)if(arr[i].pos<pos)return arr[i].initializer;return null;}
function val(node,scope=new Map(),depth=0) {
 node=unbox(node);
 if(!node||depth>18)return null;
 if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))return node.text;
 if(ts.isNumericLiteral(node))return Number(node.text);
 if(node.kind===ts.SyntaxKind.TrueKeyword)return true;
 if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
 if(ts.isPrefixUnaryExpression(node)&&(node.operator===ts.SyntaxKind.MinusToken||node.operator===ts.SyntaxKind.PlusToken)){
  const x=val(node.operand,scope,depth+1);return typeof x==='number'?(node.operator===ts.SyntaxKind.MinusToken?-x:x):null;
 }
 if(ts.isIdentifier(node)&&scope.has(node.text)){const e=scope.get(node.text);return val(e.node,e.scope,depth+1);}
 if(ts.isIdentifier(node)){const def=earlierGlobal(node.text,node.pos);if(def)return val(def,scope,depth+1);}
 return null;
}
function fromObject(obj,field,scope,depth) {
 let r=null;
 for(const p of obj.properties) {
  if(ts.isSpreadAssignment(p)){const other=read(p.expression,field,scope,depth+1);if(other!==null)r=other;}
  else if(ts.isPropertyAssignment(p)&&propKey(p.name)===field)r=val(p.initializer,scope,depth+1);
  else if(ts.isShorthandPropertyAssignment(p)&&p.name.text===field)r=val(p.name,scope,depth+1);
 }
 return r;
}
function returnBody(fn,scope) {
 const body=fn.body;
 if(!body)return null;
 if(!ts.isBlock(body))return {node:body,scope};
 let ret=null;
 const local=new Map(scope);
 for(const st of body.statements) {
  if(ts.isVariableStatement(st)){
   for(const decl of st.declarationList.declarations)if(ts.isIdentifier(decl.name)&&decl.initializer)local.set(decl.name.text,link(decl.initializer,new Map(local)));
  }else if(ts.isReturnStatement(st)&&st.expression){ret={node:st.expression,scope:local};break;}
 }
 return ret;
}
function read(node,field,scope=new Map(),depth=0) {
 node=unbox(node);
 if(!node||depth>17)return null;
 if(ts.isIdentifier(node)&&scope.has(node.text)){const ref=scope.get(node.text);return read(ref.node,field,ref.scope,depth+1);}
 if(ts.isIdentifier(node)){const def=earlierGlobal(node.text,node.pos);if(def)return read(def,field,scope,depth+1);}
 if(ts.isObjectLiteralExpression(node))return fromObject(node,field,scope,depth);
 if(ts.isCallExpression(node)) {
  let callee=unbox(node.expression);
  // Some wrappers are namespace methods; their source is a static function alias.
  if(ts.isPropertyAccessExpression(callee)&&ts.isIdentifier(callee.name)) {
   const alias=callee.name.text;
   if(functions.has(alias))callee=callee.name;
  }
  if(ts.isIdentifier(callee)&&functions.has(callee.text)){
   const fn=functions.get(callee.text);
   const next=new Map(scope);
   fn.parameters.forEach((p,i)=>{
    if(!ts.isIdentifier(p.name))return;
    const arg=node.arguments[i];
    if(arg)next.set(p.name.text,link(arg,scope));
    else if(p.initializer)next.set(p.name.text,link(p.initializer,scope));
   });
   const b=returnBody(fn,next);
   if(b)return read(b.node,field,b.scope,depth+1);
  }
  // Statics-only fallback for trivial wrappers. Do not manufacture ranks.
  const candidates=[];
  for(const arg of node.arguments){const q=read(arg,field,scope,depth+1);if(q!==null)candidates.push(q);}
  return candidates[0]??null;
 }
 if(ts.isConditionalExpression(node)) {
  const yes=read(node.whenTrue,field,scope,depth+1),no=read(node.whenFalse,field,scope,depth+1);
  return yes!==null&&yes===no?yes:null;
 }
 return null;
}
function member(obj,key){
 if(!ts.isObjectLiteralExpression(obj))return null;
 const x=obj.properties.find(p=>ts.isPropertyAssignment(p)&&propKey(p.name)===key);
 return x&&ts.isPropertyAssignment(x)?unbox(x.initializer):null;
}
function literal(n){return val(n);}
function toZh(raw){return zh.get(raw)||raw;}
const jobs=[];
let missingName=[],missingRank=[];
for(const call of treeCalls) {
 const job=literal(call.arguments[0]),branches=call.arguments[1];
 if(!job||!ts.isArrayLiteralExpression(branches))continue;
 const tree={job,branches:[]};
 for(let bi=0;bi<branches.elements.length;bi++){
  const obj=unbox(branches.elements[bi]);
  if(!ts.isObjectLiteralExpression(obj))continue;
  const branchName=literal(member(obj,'name'))||'';
  const branch={id:bi,name:toZh(branchName),originalName:branchName,talents:[]};
  const talentArray=member(obj,'talents');
  if(!ts.isArrayLiteralExpression(talentArray))throw Error('Missing tree talents '+job+' '+bi);
  for(const entry of talentArray.elements){
   if(!ts.isCallExpression(entry)||entry.expression.getText(source)!=='E')throw Error('Unexpected talent node expression '+job);
   const [row,col,key,spec,req,req2]=entry.arguments;
   const id=job+'.'+bi+'.'+literal(key);
   const rawName=read(spec,'name');
   const maxRank=read(spec,'maxRank');
   const icon=read(spec,'icon');
   if(!rawName)missingName.push(id);
   if(!Number.isInteger(maxRank)||maxRank<1||maxRank>10)missingRank.push({id,spec:spec.getText(source).slice(0,140),maxRank});
   branch.talents.push({
    id,row:literal(row),col:literal(col),name:toZh(rawName||literal(key)||''),
    originalName:rawName||null,maxRank:Number.isInteger(maxRank)&&maxRank>=1&&maxRank<=10?maxRank:null,
    icon:typeof icon==='string'?icon:null,
    requires:[req,req2].filter(Boolean).map(x=>job+'.'+bi+'.'+literal(x))
   });
  }
  tree.branches.push(branch);
 }
 jobs.push(tree);
}
const output={server:'hans',version:1,sourceCommit:'1b3ae686',sourceDate:'2026-11-12',sha256:hash,pointsPerJob:50,branchGate:5,jobs};
console.log('JOBS',jobs.length,'BRANCHES',jobs.reduce((n,j)=>n+j.branches.length,0),'TALENTS',jobs.reduce((n,j)=>n+j.branches.reduce((m,b)=>m+b.talents.length,0),0),'MISSING NAME',missingName.length,'MISSING RANK',missingRank.length);
console.log('MISSING RANK examples',JSON.stringify(missingRank.slice(0,30)));
console.log('MISSING NAME examples',JSON.stringify(missingName.slice(0,15)));
if(process.argv.includes('--write')){
 if(missingName.length||missingRank.length)throw Error('Talent extraction incomplete; do not publish guessed metadata');
 fs.writeFileSync('public/data/talents.json',JSON.stringify(output,null,2)+'\n');
 console.log('WROTE public/data/talents.json');
}
