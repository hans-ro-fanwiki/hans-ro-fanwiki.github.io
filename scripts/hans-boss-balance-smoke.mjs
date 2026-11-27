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
   const response=await page.goto(base+'?page=balance',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   const select=page.getByLabel('更新版本');
   await select.waitFor();
   assert.equal(await select.inputValue(),'0.16.0');
   const buttons=page.getByRole('group',{name:'選擇職業系'}).getByRole('button');
   assert.equal(await buttons.count(),9);
   let rows=0;
   for(const button of await buttons.all()){
    if(width<500)await button.tap();else await button.click();
    rows+=await page.locator('.balance-boss-table tbody tr').count();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   assert.equal(rows,67);
   await page.getByRole('button',{name:'服事系',exact:true}).click();
   const sky=page.locator('.balance-boss-table tr').filter({hasText:'天羅地網'});
   assert.match(await sky.innerText(),/×8\.04/);
   await sky.getByRole('link').click();
   const detail=page.locator('.sk-detail');
   await detail.waitFor();
   assert.match(await detail.innerText(),/首領／菁英傷害倍率 · V0\.16\.0/);
   assert.match(await detail.innerText(),/修羅：×8\.04/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.goto(base+'?page=skills&sj=ranger&sk=aimed_bolt',{waitUntil:'domcontentloaded'});
   await page.locator('.sk-detail').waitFor();
   assert.doesNotMatch(await page.locator('.sk-detail').innerText(),/首領／菁英傷害倍率 · V0\.16\.0/);
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px, all 67 entries, Sura detail, unmodified Ranger');
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 if(server)await new Promise(resolve=>server.httpServer.close(resolve));
}
