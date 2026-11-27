// Project only the reviewed HANS boss/elite skill modifiers. Never execute the bundle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const audit=require('../docs/HANS_SOURCE_AUDIT.json');
const skills=require('../public/data/skills.json');
const source=audit.bossSkillBalance;
const bytes=fs.readFileSync(path.join(root,'evidence',source.directory,source.main.file));
assert.equal(createHash('sha256').update(bytes).digest('hex'),source.main.sha256);
const ast=ts.createSourceFile('hans.js',bytes.toString('utf8'),ts.ScriptTarget.Latest,true);
assert.equal(ast.parseDiagnostics.length,0);
let registry;
function visit(n){
 if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='RO_JOBMULT'){
  assert.ok(!registry&&ts.isObjectLiteralExpression(n.initializer));
  registry=n.initializer;
 }
 ts.forEachChild(n,visit);
}
visit(ast);
assert.ok(registry);
const literal=registry.properties.find(p=>p.name?.getText(ast)==='S');
assert.ok(literal&&ts.isPropertyAssignment(literal));
const entries=JSON.parse(literal.initializer.getText(ast));
const jobs={};
for(const [id,values] of Object.entries(entries)){
 const job=skills.jobs.find(j=>j.rank===3&&j.sourceId===id);
 assert.ok(job,'Unknown third job '+id);
 for(const [skill,value] of Object.entries(values)){
  assert.ok(job.skills.includes(skill)&&Number.isFinite(value)&&value>1,'Invalid job skill '+id+' '+skill);
 }
 jobs[job.id]=values;
}
assert.equal(Object.keys(jobs).length,13);
assert.equal(Object.values(jobs).reduce((n,j)=>n+Object.keys(j).length,0),67);
fs.writeFileSync(path.join(root,'src/data/hans-boss-skill-multipliers.json'),JSON.stringify({version:source.version,reviewedAt:source.date,sha256:source.main.sha256,jobs},null,2)+'\n');
console.log('Verified 13 third jobs and 67 boss/elite skill multipliers.');
