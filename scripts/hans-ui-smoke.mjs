// Local-only HANS mobile smoke; creates its own isolated Chrome and Vite server.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

process.env.VITE_PUBLIC_MODE='1'; // Check safe release behavior without fetching HANS copyrighted images.
const server=await createServer({configFile:'vite.config.ts',server:{host:'127.0.0.1',port:5188,strictPort:false}});
const folder=path.resolve('evidence/hans-20261119');
mkdirSync(folder,{recursive:true});
let browser,context;
const checks=[];
try{
 await server.listen();
 const addr=server.httpServer.address();
 const base='http://127.0.0.1:'+addr.port+'/';
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args:['--disable-extensions','--no-first-run','--no-default-browser-check']});
 context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'zh-TW'});
 const page=await context.newPage(),errors=[],requested=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>requested.push(r.url()));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.locator('.heading-count').waitFor();
 assert.match(await page.locator('.topbar').innerText(),/HANS/);
 assert.equal(await page.locator('.bottom-nav button').count(),4);
 const initial=Number((await page.locator('.heading-count').innerText()).trim());
 assert.ok(initial>350 && initial<523,'Only verified obtainable equipment shown');
 checks.push({page:'items',items:initial});
 await page.getByRole('checkbox',{name:'顯示取得方式未確認的裝備'}).check();
 assert.equal(Number((await page.locator('.heading-count').innerText()).trim()),523);
 await page.getByRole('textbox',{name:'搜尋裝備、卡片或屬性'}).fill('天使之翼');
 await page.getByRole('button',{name:/天使之翼/}).first().click();
 assert.ok((await page.getByRole('dialog').innerText()).includes('HANS 裝備等級'));
 await page.getByRole('button',{name:'關閉'}).click();
 await page.goto(base+'?page=cards&q=波利',{waitUntil:'networkidle'});
 assert.ok(Number((await page.locator('.heading-count').innerText()).trim())>=1);
 await page.goto(base+'?detail=card:4001&page=cards',{waitUntil:'networkidle'});
 assert.ok((await page.getByRole('dialog').innerText()).includes('迴避 +3%'));
 assert.ok((await page.getByRole('dialog').innerText()).includes('怪物關聯（掉卡方式未確認）'));
 await page.goto(base+'?page=cards',{waitUntil:'networkidle'});
 assert.equal(Number((await page.locator('.heading-count').innerText()).trim()),188);
 await page.getByRole('button',{name:/更多篩選/}).click();
 await page.getByRole('button',{name:'冷卻縮減',exact:true}).click();
 assert.equal(Number((await page.locator('.heading-count').innerText()).trim()),12);
 await page.goto(base+'?page=stages',{waitUntil:'networkidle'});
 assert.equal(Number((await page.locator('.heading-count').innerText()).trim()),17);
 await page.getByRole('button',{name:'全部展開'}).click();
 assert.equal(await page.locator('.stage-body').count(),14,'By default seasonal/story-only stages are hidden');
 await page.getByRole('checkbox',{name:'只看已開放關卡'}).uncheck();
 await page.getByRole('button',{name:'全部展開'}).click();
 assert.equal(await page.locator('.stage-body').count(),await page.locator('.stage-heading').count());
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+2,'Horizontal overflow '+width+': '+JSON.stringify(dims));
  checks.push({width,...dims});
 }
 await page.screenshot({path:path.join(folder,'hans-stages-390.png')});
 await page.goto(base+'?page=talents&tj=mage',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/職業選擇/}).click();
 assert.equal(await page.locator('.tg-jobs-grid .tg-job-group').count(),9,'Game-like nine class groups');
 await page.getByRole('button',{name:/職業選擇/}).click();
 assert.equal(await page.locator('.tg-trees .tg-tree-panel').count(),3,'Three talent branches retained');
 assert.ok(await page.locator('.tg-tree-panel').first().locator('.tg-node').count()>8,'Each branch contains talent icons');
 const flame=page.locator('[data-talent="mage.0.firebolt_dmg"]');
 const wall=page.locator('[data-talent="mage.0.firewall_dmg"]');
 assert.match(await flame.locator('.tg-rank').innerText(),/0\/5/);
 await flame.click();
 assert.match(await flame.locator('.tg-rank').innerText(),/1\/5/);
 assert.match(await page.locator('.tg-detail').innerText(),/火箭術/,'Game effect details are shown in wiki');
 for(let i=0;i<4;i++)await flame.click();
 assert.match(await flame.locator('.tg-rank').innerText(),/5\/5/);
 await wall.click();
 assert.match(await wall.locator('.tg-rank').innerText(),/1\/5/,'Tier opens after spending five points');
 await flame.click();
 assert.match(await flame.locator('.tg-rank').innerText(),/5\/5/,'Max rank cannot be exceeded');
 const buildUrl=page.url();
 assert.ok(buildUrl.includes('tb=v1.'),'URL preserves talent allocations');
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.getByRole('button',{name:'複製連結'}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildUrl,'Copied share URL restores allocation');
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('[data-talent="mage.0.firebolt_dmg"] .tg-rank').innerText(),/5\/5/,'Shared build reloads');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(folder,'hans-talents-390.png'),fullPage:true});
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'重置'}).click();
 assert.match(await page.locator('[data-talent="mage.0.firebolt_dmg"] .tg-rank').innerText(),/0\/5/,'Reset clears allocations');
 await page.goto(base+'?page=talents&tj=wizard',{waitUntil:'networkidle'});
 assert.match(await page.locator('.tg-dev-tag').innerText(),/開發中/);
 await page.locator('[data-talent="wizard.0.s1"]').click();
 assert.match(await page.locator('[data-talent="wizard.0.s1"] .tg-rank').innerText(),/★/);
 checks.push({page:'talents',job:'wizard',nodes:await page.locator('.tg-node').count()});
 await page.goto(base+'?page=talents&tj=warlock',{waitUntil:'networkidle'});
 assert.match(await page.locator('.tg-job-title').innerText(),/咒術士/);
 assert.match(await page.locator('.tg-job-title').innerText(),/三轉/);
 assert.equal(await page.locator('.tg-trees .tg-tree-panel').count(),3);
 assert.equal(await page.locator('.tg-node').count(),93);
 assert.match(await page.locator('.tg-summary').innerText(),/70/,'Third tier has 70 talent points');
 await page.locator('[data-talent="warlock.0.s1"]').click();
 assert.match(await page.locator('[data-talent="warlock.0.s1"] .tg-rank').innerText(),/★/);
 for(let i=0;i<4;i++)await page.locator('[data-talent="warlock.0.p0"]').click();
 await page.locator('[data-talent="warlock.0.s1a1"]').click();
 assert.ok(await page.locator('[data-talent="warlock.0.s1b1"]').evaluate(n=>n.classList.contains('tg-node-locked')),'Alternative third-job skill route must lock');
 const thirdShare=page.url();
 await page.getByRole('button',{name:'複製連結'}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),thirdShare);
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('[data-talent="warlock.0.p0"] .tg-rank').innerText(),/4\/5/,'Third-job share restores');
 await page.screenshot({path:path.join(folder,'hans-third-warlock-390.png'),fullPage:true});
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+2,'Talent page horizontal overflow '+width+': '+JSON.stringify(dims));
  checks.push({page:'talents',width,...dims});
 }
 assert.deepEqual(errors,[],'No unhandled client errors');
 assert.ok(requested.every(url=>!/(?:fan-thumbs|approved-thumbs|game-assets)/.test(url)),
  'No Coffee art path may be requested');
 assert.ok(requested.every(url=>!url.includes('ro.hans-webgametw.com/assets/icons/')),
  'Public-safe talent simulator must not request unapproved HANS icons');
 checks.push({status:'PASS',errors:errors.length});
 writeFileSync(path.join(folder,'hans-mobile-smoke.json'),JSON.stringify(checks,null,2)+'\n');
 console.log(JSON.stringify(checks,null,2));
}finally{await context?.close();await browser?.close();await server.close();}
