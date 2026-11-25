// Local or deployed browser regression for equipment previews and tier filters.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const live=process.argv[2],server=live?null:await createServer({server:{host:'127.0.0.1',port:5192,strictPort:false}});
let browser;
try{
 await server?.listen();
 const base=live||'http://127.0.0.1:'+server.httpServer.address().port+'/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?q='+encodeURIComponent('陰暗步行長靴'),{waitUntil:'domcontentloaded'});
  const row=page.locator('.result-card').filter({hasText:'陰暗步行長靴'}).first();
  await row.waitFor();
  const filter=page.getByLabel('裝備等級',{exact:true});
  await filter.selectOption('5');await row.waitFor({state:'detached'});
  await filter.selectOption('8');await row.waitFor();
  assert.equal(new URL(page.url()).searchParams.get('tier'),'8');
  await page.reload({waitUntil:'domcontentloaded'});await row.waitFor();
  await row.click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  assert.match(await dialog.innerText(),/DEF \+16/);
  assert.match(await dialog.innerText(),/減傷 \+8%/);
  await dialog.getByLabel('裝備等級',{exact:true}).selectOption('normal:6');
  assert.match(await dialog.innerText(),/DEF \+12/);
  assert.match(await dialog.innerText(),/減傷 \+6%/);
  await dialog.getByLabel('裝備品質',{exact:true}).selectOption('4');
  assert.match(await dialog.innerText(),/INT \+6/);
  assert.match(await dialog.innerText(),/急速 \+6%/);
  assert.match(await dialog.innerText(),/傳說可洗鍊指定詞綴/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  assert.deepEqual(errors,[]);
  console.log('PASS',width,'px: T5 exclusion, T8 selection/deep link, DEF/fixed effects, random affixes');
  await context.close();
 }
}finally{await browser?.close();await server?.close();}
