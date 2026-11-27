import {preview} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const server=process.env.WIKI_SMOKE_URL?null:await preview({preview:{host:'127.0.0.1',port:5199,strictPort:false}});
const base=process.env.WIKI_SMOKE_URL||'http://127.0.0.1:'+server.httpServer.address().port+'/';
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,360,390,760,761,820,923,1024,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<=760,hasTouch:width<=760});
  try{
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?page=items',{waitUntil:'domcontentloaded'});
   const nav=page.getByRole('navigation',{name:'主要分類'});
   assert.equal(await nav.getByRole('button').count(),7);
   assert.deepEqual(await nav.getByRole('button').allTextContents(),['裝備','卡片','關卡','技能','天賦','遊戲機制','平衡紀錄']);
   const size=await nav.evaluate(el=>({position:getComputedStyle(el).position,scroll:el.scrollWidth,client:el.clientWidth,buttons:[...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect(),s=b.querySelector('span').getBoundingClientRect();return {w:r.width,h:r.height,l:r.left,r:r.right,labelL:s.left,labelR:s.right}})}));
   assert.equal(size.position,width<=760?'fixed':'static');
   assert.ok(size.scroll<=size.client+1,JSON.stringify({width,size}));
   for(const b of size.buttons){
    assert.ok(b.w>=44-.1&&b.h>=44,JSON.stringify({width,b}));
    assert.ok(b.l>=-.5&&b.r<=width+.5&&b.labelL>=b.l-.5&&b.labelR<=b.r+.5,JSON.stringify({width,b}));
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
   await nav.getByRole('button',{name:'遊戲機制'}).click();
   assert.equal(await nav.getByRole('button',{name:'遊戲機制'}).getAttribute('aria-current'),'page');
   assert.equal(await nav.getByRole('button',{name:'技能'}).getAttribute('aria-current'),null);
   assert.equal(await page.locator('h1').innerText(),'遊戲機制');
   await page.getByRole('button',{name:'尋寶率與掉落',exact:true}).click();
   await page.locator('#discovery').waitFor({state:'visible'});
   await page.goto(base+'?page=combat#discovery');
   await page.locator('#discovery').waitFor({state:'visible'});
   await nav.getByRole('button',{name:'卡片'}).click();
   await page.getByRole('link',{name:'尋寶率與掉落',exact:true}).click();
   await page.locator('#discovery').waitFor({state:'visible'});
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px: '+size.position+', min button '+Math.min(...size.buttons.map(b=>b.w)).toFixed(1)+'×'+Math.min(...size.buttons.map(b=>b.h)).toFixed(1)+', no clipping, selection and legacy link');
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));}
