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
 assert.equal(await page.locator('.primary-filters').count(),1,'equipment slot and job are primary filters');
 await page.getByRole('group',{name:'裝備部位'}).getByRole('button',{name:'武器'}).waitFor();
 await page.getByRole('group',{name:'職業'}).getByRole('button',{name:'魔法師系'}).waitFor();
 assert.equal(await page.locator('#advanced-filters').count(),0,'advanced filters collapsed by default');
 await page.getByRole('button',{name:/更多篩選/}).click();
 await page.locator('#advanced-filters').getByRole('button',{name:'冷卻',exact:true}).waitFor();
 assert.equal(await page.locator('.primary-filters').count(),1,'primary filters remain visible when advanced expands');
 const footer=page.locator('footer.site-footer');
 await footer.getByText(/Gravity Co/).waitFor();
 await footer.getByText(/非官方・免費・非營利・開源的粉絲測試資料站/).waitFor();
 const disclosure=footer.locator('details.site-footer-disclosure');
 assert.equal(await disclosure.evaluate(node=>node.open),false,'disclaimer initially collapsed');
 await footer.locator('summary').click();
 assert.equal(await disclosure.evaluate(node=>node.open),true,'disclaimer opens on tap');
 await footer.getByText(/其著作權及商標權依實際情況歸各自合法權利人所有/).waitFor();
 const report=footer.getByRole('link',{name:/內容疑慮／下架聯絡/});
 assert.match((await report.getAttribute('href'))||'',/issues\/new\?template=content-removal\.yml$/,'contact link points to dedicated report form');
 assert.equal(await report.getAttribute('target'),'_blank');
 await page.setViewportSize({width:320,height:844});
 const disclaimerWidth=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
 assert.ok(disclaimerWidth.document<=disclaimerWidth.viewport+1,'expanded disclaimer fits 320px');
 const firstItems=page.locator('.art.item img[src*="fan-thumbs/items/"]');
 assert.ok(await firstItems.count()>0,'Public equipment list has matching game thumbnails');
 assert.ok(await firstItems.first().evaluate(img=>img.complete && img.naturalWidth>0),'First item thumbnail loads');
 await page.goto(base+'?detail=monster:poring',{waitUntil:'networkidle'});
 const art=page.getByRole('dialog').locator('img[src*="fan-thumbs/monsters/poring.webp"]');
 await art.waitFor();
 assert.ok(await art.evaluate(img=>img.complete&&img.naturalWidth>0),'RO Survivors Poring representative frame loads');
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});
  const sizes=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth}));
  assert.ok(sizes.doc<=sizes.viewport+1,'horizontal scroll at '+width+'px');
 }
 await page.goto(base+'?detail=card:4001',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'波利卡片'}).waitFor();
 const cardArt=page.getByRole('dialog').locator('img[src*="fan-thumbs/cards/4001.webp"]');
 assert.ok(await cardArt.evaluate(img=>img.complete&&img.naturalWidth===96),'RO Survivors card thumbnail loads');
 await page.goto(base+'?detail=item:2603',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'體力項鏈'}).waitFor();
 await page.getByRole('dialog').getByText(/Tier 2/).waitFor();
 const itemArt=page.getByRole('dialog').locator('img[src*="fan-thumbs/items/2603.webp"]');
 assert.ok(await itemArt.evaluate(img=>img.complete&&img.naturalWidth>0),'RO Survivors item art thumbnail loads');
 await page.goto(base+'?detail=item:1117',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'武士刀'}).waitFor();
 await page.getByRole('dialog').getByText(/Tier 1／2/).waitFor();
 assert.ok(requested.every(url=>!url.includes('/game-assets/')),'Private game asset request in public mode');
 assert.deepEqual(errors,[],'no JavaScript errors');
 const summary={status:'PASS',thumbs:['fan-thumbs/monsters/poring.webp','fan-thumbs/items/2603.webp','fan-thumbs/cards/4001.webp'],widths:[320,375,390,430],privateGameArtRequests:0,pageErrors:0};
 writeFileSync(path.join(evidence,'public-smoke.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary));
}finally {
 await context?.close();
}
