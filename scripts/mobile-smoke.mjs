import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://100.116.225.68:4177/';
const folder=path.resolve('evidence');
mkdirSync(folder,{recursive:true});
const profile=path.join(folder,'playwright-mobile-profile');
let context;
const summary=[];
async function checkOverflow(page,label){
 const values=await page.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth,html:document.documentElement.scrollWidth}));
 summary.push({label,...values});
 assert.ok(values.html <= values.viewport+1, label+' horizontal overflow '+JSON.stringify(values));
}
try{
 context=await chromium.launchPersistentContext(profile,{
  executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:true,viewport:{width:390,height:844},screen:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'zh-TW',
  args:['--disable-extensions','--no-first-run','--no-default-browser-check']
 });
 const page=context.pages()[0]||await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByText('想刷什麼，').waitFor();
 await checkOverflow(page,'homepage');
 await page.screenshot({path:path.join(folder,'iphone-home-390.png')});
 await page.getByRole('button',{name:/刷飾品/}).click();
 assert.match(page.url(),/slot=acc/);
 await page.getByText('柏伊亞嵐島',{exact:true}).first().waitFor();
 await checkOverflow(page,'accessory by stage');
 await page.screenshot({path:path.join(folder,'iphone-accessory-390.png')});
 const row=page.getByRole('button',{name:/項鍊/}).first();
 await row.click();
 await page.getByRole('dialog').getByText('ID 2603').waitFor();
 await checkOverflow(page,'detail sheet');
 await page.goBack({waitUntil:'domcontentloaded'});
 assert.match(page.url(),/slot=acc/);
 await page.getByRole('button',{name:/法師裝備/}).click();
 assert.match(page.url(),/job=mage/);
 await checkOverflow(page,'mage equipment');
 await page.getByRole('button',{name:/冷卻卡片/}).click();
 assert.match(page.url(),/effect=cooldown/);
 await page.getByRole('button',{name:/樹精卡片/}).first().click();
 await page.getByRole('dialog').getByText('ID 4010').waitFor();
 await checkOverflow(page,'cooldown card');
 await page.screenshot({path:path.join(folder,'iphone-cooldown-390.png')});
 await page.goBack();
 const direct=base+'?page=cards&effect=cooldown';
 await page.goto(direct,{waitUntil:'networkidle'});
 assert.ok((await page.getByRole('button',{name:/樹精卡片/}).count())>0);
 await page.screenshot({path:path.join(folder,'iphone-shared-link.png')});
 assert.deepEqual(errors,[]);
 summary.push({label:'interactions',status:'PASS',queries:3,history:'PASS',shareQuery:'PASS',pageErrors:errors.length});
 writeFileSync(path.join(folder,'mobile-check-results.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
}finally{
 await context?.close();
}
