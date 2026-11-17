import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://100.116.225.68:4177/';
const folder=path.resolve('evidence');
mkdirSync(folder,{recursive:true});
const profile=path.join(folder,'playwright-mobile-profile');
const summary=[];
let context;
async function layout(page,label){
 const v=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('button')].filter(b=>getComputedStyle(b).visibility!=='hidden').length}));
 assert.ok(v.document<=v.width+1,label+': horizontal overflow '+JSON.stringify(v));
 summary.push({label,...v});
}
async function imageStatus(page,label){
 await page.waitForTimeout(800);
 const result=await page.evaluate(()=>({images:document.images.length,loaded:[...document.images].filter(x=>x.complete&&x.naturalWidth>0).length,broken:[...document.images].filter(x=>x.complete&&x.naturalWidth===0).length}));
 summary.push({label,...result});
 return result;
}
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:true,viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,
  locale:'zh-TW',args:['--disable-extensions','--no-first-run','--no-default-browser-check']});
 const page=context.pages()[0]||await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'裝備',exact:true}).waitFor();
 assert.equal(await page.getByText('刷飾品').count(),0);
 assert.equal(await page.getByText('原站核實').count(),0);
 assert.equal(await page.getByText('證據').count(),0);
 await layout(page,'homepage');
 await page.screenshot({path:path.join(folder,'iphone-v2-home.png')});
 await page.getByRole('button',{name:'飾品',exact:true}).click();
 assert.match(page.url(),/slot=acc/);
 await page.getByRole('button',{name:/柏伊亞嵐島/}).first().waitFor();
 await layout(page,'accessory by stage');
 await page.screenshot({path:path.join(folder,'iphone-v2-accessory.png')});
 await page.getByRole('button',{name:/柏伊亞嵐島/}).first().click();
 await page.getByRole('dialog').getByText('裝備掉落').waitFor();
 assert.ok(await page.getByRole('dialog').getByText('項鍊',{exact:true}).count()>0);
 assert.ok(await page.getByRole('dialog').getByText('權重 100').count()>0);
 await layout(page,'stage detail');
 await page.screenshot({path:path.join(folder,'iphone-v2-stage.png')});
 await page.getByRole('dialog').getByRole('button',{name:/項鍊/}).first().click();
 await page.getByRole('dialog').getByRole('heading',{name:'項鍊'}).waitFor();
 await page.getByRole('dialog').getByText('★ +1 VIT').waitFor();
 await page.getByRole('dialog').getByText('掉落權重 100').first().waitFor();
 await layout(page,'equipment detail');
 await page.screenshot({path:path.join(folder,'iphone-v2-item.png')});
 await imageStatus(page,'item image');
 await page.goBack();
 await page.goBack();
 await page.getByRole('button',{name:'魔法師系'}).click();
 assert.match(page.url(),/job=mage/);
 await layout(page,'mage list');
 await page.getByRole('button',{name:'卡片',exact:true}).last().click();
 await page.getByRole('button',{name:'冷卻縮減',exact:true}).click();
 assert.match(page.url(),/effect=cooldown/);
 await page.getByRole('button',{name:/樹精卡片/}).first().click();
 await page.getByRole('dialog').getByRole('heading',{name:'樹精卡片'}).waitFor();
 await page.getByRole('dialog').getByText('+5 冷卻縮減').waitFor();
 await layout(page,'cooldown card');
 await page.screenshot({path:path.join(folder,'iphone-v2-card.png')});
 await imageStatus(page,'card image');
 await page.goto(base+'?page=cards&effect=cooldown',{waitUntil:'networkidle'});
 assert.ok(await page.getByRole('button',{name:/樹精卡片/}).count()>0);
 assert.deepEqual(errors,[]);
 summary.push({label:'flow',status:'PASS',queries:3,history:'PASS',deepLinks:'PASS',pageErrors:errors.length});
 writeFileSync(path.join(folder,'mobile-check-results.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
}finally{
 await context?.close();
}
