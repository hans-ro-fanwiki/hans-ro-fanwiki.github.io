// Browser regression for the 11/25 card GS correction. Pass a deployed base URL to verify live.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const live=process.argv[2],server=live?null:await createServer({server:{host:'127.0.0.1',port:5191,strictPort:false}});
let browser;
try{
 await server?.listen();
 const base=live||'http://127.0.0.1:'+server.httpServer.address().port+'/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?page=cards&q='+encodeURIComponent('獸人英雄')+'&mode=gs',{waitUntil:'domcontentloaded'});
  const rows=page.locator('.result-card').filter({hasText:'獸人英雄'});
  await rows.first().waitFor();
  assert.match(await rows.first().innerText(),/252/);
  await rows.first().click();
  const dialog=page.getByRole('dialog');
  await dialog.waitFor();
  assert.match(await dialog.locator('.card-gs-title strong').innerText(),/252 GS/);
  assert.match(await dialog.innerText(),/護甲 \+12\.6/);
  for(const name of ['遠程系','魔法系']){
   await dialog.getByRole('button',{name,exact:true}).click();
   assert.match(await dialog.locator('.card-gs-title strong').innerText(),/252 GS/);
  }
  await page.goto(base+'?page=cards&detail=card:4144&lap=5',{waitUntil:'domcontentloaded'});
  await dialog.locator('.card-gs-title strong').waitFor();
  assert.match(await dialog.locator('.card-gs-title strong').innerText(),/132 GS/);
  assert.match(await dialog.innerText(),/每局復活次數 \+5/);
  assert.doesNotMatch(await dialog.innerText(),/GS 待確認/);
  await dialog.getByRole('button',{name:'六周目',exact:true}).click();
  assert.match(await dialog.locator('.card-gs-title strong').innerText(),/150 GS/);
  assert.match(await dialog.innerText(),/每局復活次數 \+6/);
  assert.deepEqual(errors,[]);
  console.log('PASS',width,'px: raid ranking, detail, class switching, Osiris lap effects and GS');
  await context.close();
 }
}finally{await browser?.close();await server?.close();}
