// Local only: isolated Chrome, owned by this script and closed in finally.
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.PREVIEW_URL||'http://127.0.0.1:5188/';
const output=path.resolve('evidence');
mkdirSync(output,{recursive:true});
let browser,context;
const checks=[];
async function inspect(page,label){
 const dims=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth}));
 assert.ok(dims.doc<=dims.width+1,label+': horizontal overflow: '+JSON.stringify(dims));
 checks.push({label,...dims});
}
try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args:['--disable-extensions','--no-first-run','--no-default-browser-check']});
 context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,locale:'zh-TW'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'裝備',exact:true}).waitFor();
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'179','Default only approved obtainable gear');
 assert.equal(await page.locator('.bottom-nav button').count(),3,'Three bottom tabs');
 assert.equal(await page.getByRole('button',{name:'職業',exact:true}).count(),0,'Redundant job tab removed');
 const dark=await page.locator('.content-section').evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.equal(dark,'rgb(32, 43, 48)','Dark slate panel background');
 const unknown=page.getByRole('checkbox',{name:'顯示取得方式未確認的裝備'});
 assert.equal(await unknown.isChecked(),false);
 await page.screenshot({path:path.join(output,'dev-dark-home-390.png'),fullPage:false});
 await page.getByRole('textbox',{name:'搜尋裝備、卡片或屬性'}).fill('冰靈拳刃');
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'0');
 assert.match(await page.locator('.empty-state').first().innerText(),/取得方式/);
 await unknown.check();
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'1','Unknown item opt-in');
 assert.ok((await page.locator('.result-card').first().innerText()).includes('冰靈拳刃'));
 await inspect(page,'unknown item opt-in 390px');
 await page.goto(base+'?unknown=1',{waitUntil:'networkidle'});
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'287','Opt-in in shared URL');
 await page.goto(base+'?detail=item:1663',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'波爾多之杖'}).waitFor();
 assert.ok((await page.getByRole('dialog').innerText()).includes('燈籠節限定扭蛋'));
 assert.ok((await page.getByRole('dialog').innerText()).includes('Tier 2'));
 await page.getByRole('button',{name:'關閉'}).click();
 await page.getByRole('button',{name:'關卡',exact:true}).last().click();
 assert.equal(await page.locator('.stage-body').count(),0);
 assert.ok(await page.locator('.stage-heading .art.monster img').count()>0,'Stage cover uses a pre-reviewed monster WebP');
 await page.getByRole('button',{name:'全部展開'}).click();
 assert.equal(await page.locator('.stage-body').count(),8,'All open stages expanded');
 for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});await inspect(page,'all expanded '+width+'px');}
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(output,'dev-dark-stage-390.png'),fullPage:false});
 await page.getByRole('button',{name:'全部收合'}).click();
 assert.equal(await page.locator('.stage-body').count(),0);
 await page.locator('.stage-heading').first().click();
 await page.locator('.stage-heading').nth(1).click();
 assert.equal(await page.locator('.stage-body').count(),2,'Independent panels remain expanded');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 checks.push({label:'final',status:'PASS',errors:errors.length});
 writeFileSync(path.join(output,'dev-dark-smoke.json'),JSON.stringify(checks,null,2)+'\n');
 console.log(JSON.stringify(checks,null,2));
}finally{
 await context?.close();
 await browser?.close();
}
