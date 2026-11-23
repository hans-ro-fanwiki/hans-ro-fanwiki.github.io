// Enforce strict HANS-only, no-art public release on every Linux CI build.
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve('dist');
assert.ok(existsSync(path.join(root,'index.html')),'Public build missing index.html');
for(const old of ['game-assets','fan-thumbs','approved-thumbs','evidence','private-art'])
 assert.ok(!existsSync(path.join(root,old)),'Obsolete or private asset directory shipped: '+old);

const deployed=JSON.parse(readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const audited=JSON.parse(readFileSync('docs/HANS_SOURCE_AUDIT.json','utf8'));
assert.equal(deployed.server,'hans','Refuse publishing any non-HANS catalog');
assert.equal(deployed.official.baseUrl,audited.hans.baseUrl);
for(const source of ['main','soul','manifest'])
 assert.equal(deployed.official[source].sha256,audited.hans[source].sha256,'HANS source hash drift: '+source);
assert.ok(deployed.items.length>=350,'Unexpectedly incomplete HANS equipment');
assert.ok(deployed.cards.length>=130,'Unexpectedly incomplete HANS cards');
assert.ok(deployed.stages.length>=15,'Unexpectedly incomplete HANS stage list');
assert.equal(deployed.schemaVersion,2,'HANS lap-aware catalog missing');
assert.equal(deployed.lapRules.max,6);
assert.equal(deployed.lapRules.jobs.length,41);
assert.ok(deployed.cards.every(c=>c.effects?.length===c.bonuses.length),'Card scoring modifiers missing');
assert.ok(deployed.stages.every(s=>s.lapTiers?.length===6&&s.lapGS?.length===6),'Stage lap mapping incomplete');
const skills=JSON.parse(readFileSync(path.join(root,'data/skills.json'),'utf8'));
assert.equal(skills.server,'hans','Refuse publishing non-HANS job skill sources');
assert.equal(skills.schemaVersion,1,'HANS job skill schema mismatch');
assert.equal(skills.source.sha256,audited.skillsSoul.sha256,'HANS skill SHA mismatch');
assert.equal(skills.jobs.length,41,'Incomplete HANS first-to-third job catalog');
assert.equal(skills.skills.length,244,'Incomplete HANS skill registry');
assert.equal(skills.jobs.reduce((n,j)=>n+j.skills.length,0),256);
const balance=JSON.parse(readFileSync(path.join(root,'data/balance.json'),'utf8'));
assert.equal(balance.checkedAt,skills.reviewedAt,'Balance and skill verification dates differ');
assert.ok(skills.skills.every(s=>s.description),'Missing HANS Chinese skill descriptions');
const skillById=new Map(skills.skills.map(s=>[s.id,s]));
const thirdSkillIds=new Set(skills.jobs.filter(j=>j.rank===3).flatMap(j=>j.skills));
assert.equal(thirdSkillIds.size,96,'Incomplete HANS third-job skill list');
assert.ok([...thirdSkillIds].every(id=>/[\u3400-\u9fff]/.test(skillById.get(id)?.name||'')),
 'Third-job skill titles must use HANS native Chinese translation table');
assert.ok(skills.skills.every(s=>/^[a-z0-9_-]+$/i.test(s.icon)&&!s.image&&!s.url));
const stages=new Map(deployed.stages.map(stage=>[stage.id,stage]));
for(const entry of [...deployed.items,...deployed.cards]){
 assert.ok(entry.name&&entry.originalName,'HANS source names missing');
 for(const key of ['image','icon'])if(entry[key]) {
  assert.equal(entry[key].rights,'not-cleared','Image silently approved');
  assert.equal(entry[key].renderAllowed,false,'Unreviewed HANS art marked public');
 }
 for(const source of entry.sources||[]){
  const registered=[audited.hans.main,audited.hans.soul].find(file=>file.file===source.evidence?.file);
  assert.ok(registered&&registered.sha256===source.evidence?.hash,'Unreviewed source evidence present');
  for(const ref of source.stageRefs||[])assert.ok(stages.has(ref.stageId),'Non-HANS stage referenced: '+ref.stageId);
 }
}
const files=(folder)=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
 const full=path.join(folder,entry.name);
 return entry.isDirectory()?files(full):[full];
});
const shipped=files(root).map(f=>path.relative(root,f).replaceAll('\\','/'));
const images=shipped.filter(f=>/\.(?:png|webp|jpe?g|gif|svg|avif)$/i.test(f));
assert.deepEqual(images,[],'No unreviewed HANS or legacy image may ship');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const rankHtml=readFileSync(path.join(root,'520520520/index.html'),'utf8');
for (const page of [html,rankHtml]) {
 const policy=page.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
 assert.ok(policy&&policy.index<page.indexOf('<script'),'CSP must precede scripts');
 for (const directive of ["default-src 'none'","script-src 'self'","style-src 'self'","connect-src 'self'","base-uri 'none'","form-action 'none'"])
  assert.ok(policy[1].split('; ').includes(directive),'Missing CSP directive: '+directive);
 assert.match(page,/<meta name="referrer" content="no-referrer">/);
}
const publicEntry=html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
assert.ok(publicEntry,'Public wiki entry script missing');
assert.doesNotMatch(html+readFileSync(path.join(root,publicEntry),'utf8'),/520520520/,'Ranking must stay outside the public wiki entry');
for (const sitemap of shipped.filter(file=>/^sitemap.*\.xml$/i.test(file)))
 assert.doesNotMatch(readFileSync(path.join(root,sitemap),'utf8'),/520520520/,'Ranking must stay outside sitemap');
assert.match(rankHtml,/<meta name="robots" content="noindex, nofollow">/);
assert.deepEqual(readFileSync(path.join(root,'520520520/snapshot.json')),readFileSync('public/520520520/snapshot.json'));
assert.match(html,/HANS 漢斯服/);
assert.doesNotMatch(html,/ro-survivors\.com|fan-thumbs|approved-thumbs/);
console.log(JSON.stringify({status:'PASS',server:'hans',equipment:deployed.items.length,
 cards:deployed.cards.length,stages:deployed.stages.length,monsters:deployed.monsters.length,
 shippedImages:images.length,rawGameCodeShipped:false},null,2));
