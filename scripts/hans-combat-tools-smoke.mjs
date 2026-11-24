import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:5199,strictPort:false}});
let browser;
try{
 await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port+'/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,locale:'zh-TW'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?page=combat',{waitUntil:'domcontentloaded'});
  const cd=page.locator('#timing');await cd.getByRole('heading',{name:'急速與冷卻計算機'}).waitFor();
  const res=cd.locator('.combat-tool-result');
  assert.match(await res.nth(0).innerText(),/6\.67 秒/);
  assert.match(await res.nth(1).innerText(),/5\.71 秒/);
  await cd.getByLabel('目前全域急速（%）').fill('100');
  assert.match(await res.nth(0).innerText(),/5 秒/);
  await cd.getByRole('slider').focus();await cd.getByRole('slider').press('ArrowRight');
  assert.equal(await cd.getByLabel('目前全域急速（%）').inputValue(),'101');
  await cd.getByRole('searchbox').fill('Abracadabra');
  await cd.getByRole('option',{name:/隨機技能/}).waitFor({state:'attached'});
  await cd.getByRole('combobox').selectOption('abracadabra');
  assert.equal(await cd.getByLabel('基礎冷卻（秒）').inputValue(),'14');
  await cd.getByText('查閱 隨機技能 適用的詞條與神格').click();
  await cd.getByRole('heading',{name:'哪些詞條會影響這招？'}).waitFor();
  const cast=page.locator('#cast');assert.match(await cast.locator('.combat-tool-result').first().innerText(),/1\.2 秒/);
  await cast.getByRole('combobox').selectOption('area');assert.match(await cast.locator('.combat-tool-result').first().innerText(),/1\.6 秒/);
  const defense=page.locator('#defense');assert.match(await defense.locator('.combat-tool-result').first().innerText(),/18/);
  await defense.getByLabel('一般減傷 Buff（%）').fill('30');assert.match(await defense.locator('.combat-tool-result').first().innerText(),/11/);
  const range=page.locator('#geometry');await range.getByLabel('目前原始加成（%）').fill('100');assert.match(await range.locator('.combat-tool-result').first().innerText(),/1\.67 倍/);
  const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.scroll<=size.width+2,JSON.stringify(size));assert.deepEqual(errors,[]);
  await page.screenshot({path:'evidence/combat-tools-'+width+'.png',fullPage:true});
  await context.close();console.log('PASS',width,'px, calculators, skill lookup, no overflow or page errors');
 }
}finally{await browser?.close();await server.close();}
