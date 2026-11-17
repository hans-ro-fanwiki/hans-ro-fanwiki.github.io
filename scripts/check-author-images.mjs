// Read-only monitor for the game's publicly served asset manifest.
// This is a discovery tool only: it does NOT cache, embed, or publish images.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const remote='https://ro-survivors.com/assets/manifest.json';
const catalog=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
const previous=JSON.parse(readFileSync('docs/SOURCE_AUDIT.json','utf8'));
const expectedHash=previous.officialBundles.manifest.sha256;
const r=await fetch(remote,{signal:AbortSignal.timeout(18000)});
if(!r.ok)throw Error('Author manifest HTTP '+r.status);
const body=await r.text();
const manifest=JSON.parse(body);
const paths=(obj)=>Object.entries(obj||{}).map(([id,entry])=>({
 id,
 name:entry?.name||'',
 icon:entry?.icon||entry?.image||'',
 art:entry?.art||null
})).filter(x=>/^[0-9]+$/.test(x.id));
const items=paths(manifest.items);
const cards=paths(manifest.cards);
const currentItems=new Map(catalog.items.map(x=>[String(x.id),x]));
const currentCards=new Map(catalog.cards.map(x=>[String(x.id),x]));
const notIndexed=(records,map)=>records.filter(x=>!map.has(x.id));
const missingSource=(records)=>records.filter(x=>!x.icon);
const different=(records,map)=>records.filter(x=>map.has(x.id)&&x.icon&&x.icon!==(
 map.get(x.id).icon?.officialPath||map.get(x.id).image?.officialPath
)).map(x=>({id:x.id,name:x.name,actual:x.icon}));
const report={
 generatedAt:new Date().toISOString(),
 authorManifest:remote,
 authorManifestSha256:createHash('sha256').update(body).digest('hex'),
 baselineManifestSha256:expectedHash,
 summary:{authorManifestChanged:createHash('sha256').update(body).digest('hex')!==expectedHash,
  authorItems:items.length,authorCards:cards.length,indexedItems:currentItems.size,indexedCards:currentCards.size,
  unindexedItemAssetIds:notIndexed(items,currentItems).length,unindexedCardAssetIds:notIndexed(cards,currentCards).length,
  missingItemIcons:missingSource(items).length,missingCardIcons:missingSource(cards).length},
 newItems:notIndexed(items,currentItems),
 newCards:notIndexed(cards,currentCards),
 changedExistingItemImagePaths:different(items,currentItems),
 changedExistingCardImagePaths:different(cards,currentCards)
};
const dest=path.resolve('evidence/author-assets-diff.json');
mkdirSync(path.dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,authorManifestSha256:report.authorManifestSha256,
 examples:{newItems:report.newItems.slice(0,5),newCards:report.newCards.slice(0,5)},report:dest},null,2));
