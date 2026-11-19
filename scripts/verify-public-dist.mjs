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
const stages=new Map(deployed.stages.map(stage=>[stage.id,stage]));
for(const entry of [...deployed.items,...deployed.cards]){
 assert.ok(entry.name&&entry.originalName,'HANS source names missing');
 for(const key of ['image','icon'])if(entry[key]) {
  assert.equal(entry[key].rights,'not-cleared','Image silently approved');
  assert.equal(entry[key].renderAllowed,false,'Unreviewed HANS art marked public');
 }
 for(const source of entry.sources||[]){
  assert.equal(source.evidence?.hash,audited.hans.soul.sha256,'Legacy source evidence present');
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
assert.match(html,/HANS 漢斯服/);
assert.doesNotMatch(html,/ro-survivors\.com|fan-thumbs|approved-thumbs/);
console.log(JSON.stringify({status:'PASS',server:'hans',equipment:deployed.items.length,
 cards:deployed.cards.length,stages:deployed.stages.length,monsters:deployed.monsters.length,
 shippedImages:images.length,rawGameCodeShipped:false},null,2));
