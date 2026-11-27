import {preview} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const server=process.env.WIKI_SMOKE_URL?null:await preview({preview:{host:'127.0.0.1',port:5199,strictPort:false}});
const base=process.env.WIKI_SMOKE_URL||'http://127.0.0.1:'+server.httpServer.address().port+'/';
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  try{
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const route of ['items','cards']){
    await page.goto(base+'?page='+route,{waitUntil:'domcontentloaded'});
    await page.getByRole('link',{name:'尋寶率與掉落',exact:true}).click();
    const section=page.locator('#discovery');
    await section.waitFor({state:'visible'});
    assert.match(await section.innerText(),/5\.01%/);
    await section.getByLabel('額外尋寶率（%）').fill('300');
    assert.match(await section.innerText(),/7\.48%/);
    await section.getByLabel('最低品質').selectOption('4');
    assert.match(await section.innerText(),/100\.00%/);
    await section.getByText('王卡、一般怪卡與寵物蛋：真正的掉落率',{exact:true}).click();
    assert.match(await section.innerText(),/7\.5%/);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
    await page.getByRole('button',{name:'急速與冷卻',exact:true}).click();
    assert.equal(await section.isVisible(),false);
    assert.equal(await page.locator('#timing').isVisible(),true);
   }
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px: both links, calculator, FAQ and existing tab');
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));}
