import {preview} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const live=process.env.WIKI_SMOKE_URL;
const server=live?null:await preview({preview:{host:'127.0.0.1',port:5199,strictPort:false}});
const base=live||'http://127.0.0.1:'+server.httpServer.address().port+'/';
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,timezoneId:'America/Los_Angeles'});
  try{
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'domcontentloaded'});
   const history=page.locator('.wiki-updates');
   await history.waitFor();
   const summary=history.locator(':scope > summary');
   const timestamp=summary.locator('time');
   assert.equal(await history.getAttribute('open'),null);
   const iso=await timestamp.getAttribute('datetime');
   assert.equal(await timestamp.innerText(),new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso)).replace(/-/g,'/'));
   assert.equal(await history.locator('.wiki-update-entry').first().isVisible(),false);
   if(width<500)await summary.tap();else await summary.click();
   assert.equal(await history.locator('.wiki-update-entry:visible').count(),3);
   assert.match(await history.locator('.wiki-update-entry').first().innerText(),/第三章遠征、王卡與寵物改造[\s\S]*全 243 張卡的 GS[\s\S]*39 種寵物/);
   const older=history.locator('.wiki-updates-older > summary');
   if(width<500)await older.tap();else await older.click();
   assert.ok(await history.locator('.wiki-update-entry:visible').count()>=9);
   assert.match(await history.innerText(),/保留已填數值[\s\S]*一般卡與副本版分開搜尋/);
   assert.equal(await history.locator('.wiki-update-entry').last().locator('time').innerText(),'2026/11/19');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.reload({waitUntil:'domcontentloaded'});
   await timestamp.waitFor();
   assert.equal(await timestamp.getAttribute('datetime'),iso);
   assert.equal(await history.getAttribute('open'),null);
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px, Taipei time '+await timestamp.innerText());
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 if(server)await new Promise(resolve=>server.httpServer.close(resolve));
}
