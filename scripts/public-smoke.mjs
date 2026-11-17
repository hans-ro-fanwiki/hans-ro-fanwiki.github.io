import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4179/';
const evidence=path.resolve('evidence');
mkdirSync(evidence,{recursive:true});
const profile=path.join(evidence,'playwright-public-profile');
let context;
try {
 context=await chromium.launchPersistentContext(profile,{
  executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  locale:'zh-TW',args:['--disable-extensions','--no-first-run','--no-default-browser-check']
 });
 const page=context.pages()[0]||await context.newPage();
 const requested=[];
 const errors=[];
 page.on('request',r=>requested.push(r.url()));
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'裝備',exact:true}).waitFor();
 await page.locator('.art-credits').getByText(/Gravity Co/).waitFor();
 assert.ok(await page.locator('.art.item img[src*="approved-thumbs/items/"]').count()>0,'Official equipment thumbnails display on the public list');
 await page.goto(base+'?detail=monster:poring',{waitUntil:'networkidle'});
 const art=page.getByRole('dialog').locator('img[src*="approved-thumbs/monsters/poring.webp"]');
 await art.waitFor();
 assert.ok(await art.evaluate(img=>img.complete&&img.naturalWidth===96),'approved Poring thumb loads');
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});
  const sizes=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth}));
  assert.ok(sizes.doc<=sizes.viewport+1,'horizontal scroll at '+width+'px');
 }
 await page.goto(base+'?detail=item:1202',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'小刀'}).waitFor();
 const itemArt=page.getByRole('dialog').locator('img[src*="approved-thumbs/items/1202.webp"]');
 assert.ok(await itemArt.evaluate(img=>img.complete&&img.naturalWidth===96),'official knife thumb loads');
 await page.goto(base+'?detail=card:4001',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'波利卡片'}).waitFor();
 const cardArt=page.getByRole('dialog').locator('img[src*="approved-thumbs/cards/4001.webp"]');
 assert.ok(await cardArt.evaluate(img=>img.complete&&img.naturalWidth===96),'official Poring card thumb loads');
 await page.goto(base+'?detail=item:2603',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'項鍊'}).waitFor();
 assert.equal(await page.getByRole('dialog').locator('.art.item img').count(),0,'Item uses placeholder');
 assert.ok(requested.every(url=>!url.includes('/game-assets/')),'Private game asset request in public mode');
 assert.deepEqual(errors,[],'no JavaScript errors');
 const summary={status:'PASS',thumbs:['monsters/poring.webp','items/1202.webp','cards/4001.webp'],widths:[320,375,390,430],privateGameArtRequests:0,pageErrors:0};
 writeFileSync(path.join(evidence,'public-smoke.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary));
}finally {
 await context?.close();
}
