// One-time/repeatable catalog enrichment using reviewed local source bundles.
// The original large JS files live only in gitignored evidence, never in public dist.
const fs=require('node:fs');
const {enrichCatalog}=require('./catalog-enrichment.cjs');
const catalogPath='public/data/catalog.json';
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const main=fs.readFileSync('evidence/ro-original-source/main.js','utf8');
const nameMap=JSON.parse(fs.readFileSync('docs/TWRO_NAMES.json','utf8'));
const counts=enrichCatalog(catalog,main,nameMap);
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({sourceVersion:catalog.official.main.sha256,tiers:catalog.stages.map(s=>[s.id,s.tier]),...counts},null,2));
