import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.PREVIEW_URL||'http://100.116.225.68:4177/';
const folder=path.resolve('evidence');
mkdirSync(folder,{recursive:true});
const profile=path.join(folder,'playwright-mobile-v4-profile');
const summary=[];
let context;
async function layout(page,label){
 const v=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth}));
 assert.ok(v.document<=v.width+1,label+': horizontal overflow '+JSON.stringify(v));
 summary.push({label,...v});
}
async function noWeight(page,label){
 const txt=await page.locator('body').innerText();
 assert.ok(!txt.includes('掉落權重')&&!txt.includes('權重 '),label);
}
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:true,viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,
  locale:'zh-TW',args:['--disable-extensions','--no-first-run','--no-default-browser-check']});
 const page=context.pages()[0]||await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'裝備',exact:true}).waitFor();
 const search=page.getByRole('textbox',{name:'搜尋裝備、卡片或屬性'});
 await search.waitFor();
 await noWeight(page,'home');
 await layout(page,'home with compact search');
 assert.equal(await page.getByRole('button',{name:'衣服',exact:true}).count(),0,'filters initially collapsed');
 await page.getByRole('button',{name:'篩選',exact:true}).click();
 const slots=['飾品','衣服','武器','盾牌','披肩','鞋子','頭飾（上）','頭飾（中）','頭飾（下）'];
 for(const slot of slots)assert.equal(await page.getByRole('button',{name:slot,exact:true}).count(),1,slot);
 await page.getByRole('button',{name:'衣服',exact:true}).click();
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'29');
 await page.getByRole('button',{name:'篩選',exact:true}).click();
 await layout(page,'armor filtered');
 await page.screenshot({path:path.join(folder,'iphone-v4-armor.png')});
 await page.getByRole('button',{name:'篩選',exact:true}).click();
 await page.getByRole('button',{name:'清除所有篩選'}).click();
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'287');
 await search.fill('智力');
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'6','Chinese INT alias matches equipment');
 assert.ok((await page.getByText(/其他卡片結果/).innerText()).includes('2'),'cross-index includes cards');
 await layout(page,'Chinese attribute alias');
 await page.screenshot({path:path.join(folder,'iphone-v4-int.png')});
 await search.fill('');
 await page.getByRole('button',{name:'冷卻',exact:true}).click();
 assert.equal((await page.locator('.heading-count').innerText()).trim(),'21','cooldown equipment');
 assert.ok((await page.getByText(/其他卡片結果/).innerText()).includes('5'),'cooldown cards');
 await noWeight(page,'cooldown list');
 await layout(page,'cooldown results');
 await page.screenshot({path:path.join(folder,'iphone-v4-cooldown.png')});
 await page.getByRole('button',{name:'關卡',exact:true}).last().click();
 assert.equal(await page.locator('.stage-body').count(),0,'all stages collapsed by default');
 const stages=page.locator('.stage-heading');
 assert.ok(await stages.count()>=5);
 await stages.first().click();
 assert.equal(await page.locator('.stage-body').count(),1);
 await page.getByRole('combobox',{name:'關卡屬性'}).selectOption('cooldown');
 await page.locator('.stage-body').getByRole('button',{name:'卡片',exact:true}).click();
 assert.equal(await page.locator('.stage-body').count(),1,'stage remains open after filtering cards');
 await page.locator('.stage-body').getByRole('button',{name:'裝備',exact:true}).click();
 await noWeight(page,'expanded stage');
 for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});await layout(page,'expanded stage '+width+'px');}
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(folder,'iphone-v4-stage.png')});
 await stages.nth(1).click();
 assert.equal(await page.locator('.stage-body').count(),1,'only one stage expanded');
 await page.getByRole('button',{name:'全部收合'}).click();
 assert.equal(await page.locator('.stage-body').count(),0);
 await page.goto(base+'?detail=item:2603',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:'項鍊'}).waitFor();
 await page.getByRole('dialog').getByText('★ +1 VIT',{exact:true}).waitFor();
 await noWeight(page,'item details');
 const stageLink=page.getByRole('dialog').getByRole('button',{name:/柏伊亞嵐島/}).first();
 await stageLink.click();
 await page.getByRole('heading',{name:'關卡',exact:true}).waitFor();
 assert.equal(await page.getByRole('dialog').count(),0,'stage opens inline instead of a redundant dialog');
 assert.ok(await page.locator('.stage-heading[aria-expanded=true]').count()===1,'deep-linked stage automatically expanded');
 await layout(page,'reverse lookup from item to stage');
 await page.goto(base+'?detail=monster:strouf',{waitUntil:'networkidle'});
 await page.getByRole('dialog').getByRole('heading',{name:/史特勞夫/}).waitFor();
 await noWeight(page,'monster details');
 assert.deepEqual(errors,[]);
 summary.push({label:'flow',status:'PASS',errors:errors.length});
 writeFileSync(path.join(folder,'mobile-check-results.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
}finally{
 await context?.close();
}
