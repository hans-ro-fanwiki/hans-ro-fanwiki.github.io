#!/usr/bin/env node
// Static projection only: never executes or distributes the HANS bundles.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const audit=require('../docs/HANS_SOURCE_AUDIT.json');
const snapshot=path.join(root,'evidence/hans-20261125');
const source={main:{file:'main-BNOcv2PN.hza77c7ae5.js',sha256:'fc2283e1288163f908dccaff5032710e70c177c597b3e285b1e7dfc14b6eb325'},soul:{file:'soul_linker-DllBVIRO.hzffce8ada.js',sha256:'f5dab8dc8f4c3a207ea6cbddb7e719ecb837fb29f93d8f008cd52a172e37bcad'}};
function parse(key){const r=source[key],bytes=fs.readFileSync(path.join(snapshot,r.file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('Source hash mismatch '+key);const ast=ts.createSourceFile(r.file,bytes.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(ast.parseDiagnostics.length)throw Error('Source parse failed');return ast;}
const soul=parse('soul'),main=parse('main');
function decl(ast,name){for(const st of ast.statements)if(ts.isVariableStatement(st))for(const d of st.declarationList.declarations)if(d.name.getText(ast)===name)return d.initializer;throw Error('Missing '+name);}
function literal(n){if(!n)return undefined;if(ts.isNumericLiteral(n))return Number(n.text);if(ts.isStringLiteral(n))return n.text;if(n.kind===ts.SyntaxKind.TrueKeyword)return true;if(n.kind===ts.SyntaxKind.FalseKeyword)return false;if(ts.isPrefixUnaryExpression(n)){const x=literal(n.operand);if(n.operator===ts.SyntaxKind.MinusToken)return -x;if(n.operator===ts.SyntaxKind.ExclamationToken)return !x;}
if(ts.isArrayLiteralExpression(n))return n.elements.map(literal);if(ts.isObjectLiteralExpression(n))return Object.fromEntries(n.properties.map(p=>{if(!ts.isPropertyAssignment(p))throw Error('Unexpected literal');return [p.name.text,literal(p.initializer)];}));throw Error('Unsupported literal '+n.getText().slice(0,80));}
const fixedKeys=literal(decl(soul,'s6')),fixedValues=Object.fromEntries(decl(soul,'o6').properties.map(p=>[p.name.text,literal(p.initializer.elements[1])]));
const catalog=require('../public/data/catalog.json'),extra=require('../src/data/hans-raids.json').extraItems;
const registered=new Map();
function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&['Z','re','wr','Bd'].includes(n.expression.text)&&n.arguments[0]&&ts.isNumericLiteral(n.arguments[0])){
const [idNode,slotNode]=n.arguments,id=literal(idNode),op=n.expression.text,slot=literal(slotNode),old=registered.get(id);
const metaNode=n.arguments[op==='wr'?2:op==='Bd'?3:4];
const meta=metaNode&&ts.isObjectLiteralExpression(metaNode)?Object.fromEntries(metaNode.properties.filter(p=>ts.isPropertyAssignment(p)&&['wtype','base','secret'].includes(p.name.text)).map(p=>[p.name.text,literal(p.initializer)])):{};
const base=op==='re'?literal(n.arguments[3]):op==='Bd'?literal(n.arguments[2]):meta.base;
const def=op==='re'&&old?{...old,base}:{slot,...meta,base,starter:op==='wr',secret:op==='Bd'||!!meta.secret};
registered.set(id,def);
}ts.forEachChild(n,visit);}
visit(soul);
const all=[...catalog.items,...Object.entries(extra).map(([id,r])=>({id:+id,slot:registered.get(r.baseId)?.slot,baseId:r.baseId}))];
const records={};
for(const item of all){const d=registered.get(item.id)||registered.get(item.baseId);if(!d||d.slot!==item.slot)throw Error('Unknown registration '+item.id);
const keys=fixedKeys[item.id]||[];for(const k of keys)if(!Object.hasOwn(fixedValues,k))throw Error('Unknown fixed effect '+k);
records[item.id]={slot:d.slot,...d.wtype?{weaponType:d.wtype}:{},...d.starter?{starter:true}:{},...d.secret?{secret:true}:{},...d.base?.matk?{magicBase:true}:{},fixed:keys};}
const quality=decl(soul,'Pp').expression.expression; // array before .map translation
const qualityBase=quality.elements.map(x=>literal(x).baseMult);
const result={version:'0.15.1',date:'2026-11-25',source,defBySlot:literal(decl(main,'gC')),weaponWeights:literal(decl(main,'pC')),weaponRange:literal(decl(soul,'_W')),weaponGrowth:literal(decl(soul,'NN')),weaponMagicRatio:literal(decl(main,'fC')),qualityBase,fixedValues,records};
const out=JSON.stringify(result,null,0)+'\n',file=path.join(root,'src/data/hans-equipment-rules.json');
if(process.argv.includes('--write'))fs.writeFileSync(file,out);else if(fs.readFileSync(file,'utf8')!==out)throw Error('Projection changed; audit before --write');
console.log('Equipment records:',Object.keys(records).length,'fixed:',Object.values(records).filter(r=>r.fixed.length).length,'fixed kinds:',Object.keys(fixedValues).length);
