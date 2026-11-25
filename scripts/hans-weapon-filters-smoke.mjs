import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const live=process.argv[2],server=live?null:await createServer({server:{host:'127.0.0.1',port:5193,strictPort:false}});
let browser;
try{
 await server?.listen();
 const base=live||'http://127.0.0.1:'+server.httpServer.address().port+'/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const opts=locator=>locator.locator('option').evaluateAll(xs=>xs.map(x=>x.value));
  const check=async(slot,job)=>{
   await slot.waitFor();await job.waitFor();
   await job.selectOption('swordsman');
   assert.ok((await opts(slot)).includes('weapon:twohand-sword'));
   assert.ok(!(await opts(slot)).includes('weapon:staff'));
   await slot.selectOption('weapon:twohand-sword');
   await job.selectOption('mage');
   assert.equal(await slot.inputValue(),'weapon');
   assert.ok((await opts(slot)).includes('weapon:staff'));
   assert.ok(!(await opts(slot)).includes('weapon:twohand-sword'));
   assert.ok((await opts(slot)).includes('shoes'));
   await job.selectOption('sura');
   assert.ok((await opts(slot)).includes('weapon:knuckle'));
   await slot.selectOption('weapon:knuckle');
   await job.selectOption('monk');
   assert.equal(await slot.inputValue(),'weapon:knuckle');
   const box=await slot.boundingBox();assert.ok(box.height>=44);
   assert.equal(await slot.locator('optgroup').count(),2);
   assert.ok(await job.locator('optgroup').count()>=9);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  };
  await page.goto(base+'?page=items',{waitUntil:'domcontentloaded'});
  await check(page.getByLabel('裝備部位',{exact:true}),page.getByLabel('職業',{exact:true}));
  assert.equal(new URL(page.url()).searchParams.get('slot'),'weapon:knuckle');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByLabel('裝備部位',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('裝備部位',{exact:true}).inputValue(),'weapon:knuckle');
  const result=page.locator('.result-card').filter({hasText:'拳套'}).first();await result.waitFor();
  await result.click();assert.match(await page.getByRole('dialog').innerText(),/拳套/);
  await page.goto(base+'?page=stages&stage=c2_clock',{waitUntil:'domcontentloaded'});
  const section=page.locator('#stage-c2_clock');await section.waitFor();
  await section.getByRole('button',{name:'裝備',exact:true}).click();
  await check(section.getByLabel('關卡部位',{exact:true}),section.getByLabel('關卡職業',{exact:true}));
  await section.getByRole('button',{name:'卡片',exact:true}).click();
  assert.equal(await section.getByLabel('關卡卡片部位',{exact:true}).inputValue(),'all');
  await section.getByRole('button',{name:'裝備',exact:true}).click();
  assert.equal(await section.getByLabel('關卡部位',{exact:true}).inputValue(),'weapon:knuckle');
  await page.goto(base+'?page=items&mode=stages&raid=all',{waitUntil:'domcontentloaded'});
  await check(page.getByLabel('副本裝備部位',{exact:true}),page.getByLabel('副本職業',{exact:true}));
  assert.deepEqual(errors,[]);
  console.log('PASS',width,'px: grouped selectors, linked jobs, fallback, non-weapon slots, deep link, stage and raid');
  await context.close();
 }
}finally{await browser?.close();await server?.close();}
