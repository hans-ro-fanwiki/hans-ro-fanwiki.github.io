import {preview} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const server=process.env.WIKI_SMOKE_URL?null:await preview({preview:{host:'127.0.0.1',port:5199,strictPort:false}});
const base=process.env.WIKI_SMOKE_URL||'http://127.0.0.1:'+server.httpServer.address().port+'/';
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?page=experience',{waitUntil:'domcontentloaded'});
   await page.locator('.xp-list > li').first().waitFor();
   assert.equal(await page.getByLabel('目前 Base Lv').inputValue(),'60');
   assert.equal(await page.getByLabel('怪物數量（遊戲設定 %）').inputValue(),'2000');
   assert.equal(await page.getByLabel('事件數量（遊戲設定 %）').inputValue(),'2000');
   assert.match(await page.locator('.xp-results-heading').innerText(),/單場 Base 經驗排行/);
   assert.doesNotMatch(await page.locator('.xp-panel').innerText(),/每小時|每分鐘|遊戲速度|假設清怪比例/);
   const panel=page.locator('.xp-calibration');
   assert.equal(await panel.getAttribute('open'),null);
   await page.getByLabel('目前 Base Lv').fill('67');
   await page.getByLabel('怪物數量（遊戲設定 %）').fill('2000');
   await page.getByLabel('事件數量（遊戲設定 %）').fill('2000');
   await panel.locator('summary').click();
   await panel.getByLabel('實測關卡').selectOption('c2_nif');
   await panel.getByLabel('怪物擊殺數').fill('186055');
   await panel.getByLabel('結算 Base EXP').fill('4939408');
   await panel.getByLabel('結算 Job EXP（選填）').fill('1866');
   await panel.getByRole('button',{name:'套用實測數據'}).click();
   const rows=panel.locator('tbody tr');
   assert.match(await rows.first().innerText(),/186,055/);
   assert.match(await rows.first().innerText(),/4,939,408/);
   assert.match(await rows.first().innerText(),/1,866/);
   assert.ok(await rows.count()>=4);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
   await panel.getByRole('button',{name:'清除校準'}).click();
   assert.equal(await panel.locator('.xp-cal-results').count(),0);
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px default ranking, optional calibration, data and reset');
  }finally{await context.close();}
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));}
