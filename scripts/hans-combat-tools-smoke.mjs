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
  const nav=page.getByRole('navigation',{name:'戰鬥機制目錄'});
  const sections=[['timing','急速與冷卻'],['cast','施法急速'],['geometry','範圍與距離'],['defense','承傷與減傷']];
  async function choose(id){
   const label=sections.find(([key])=>key===id)[1];
   const button=nav.getByRole('button',{name:label,exact:true});
   if(width<500)await button.tap();else await button.click();
   assert.equal(await button.getAttribute('aria-pressed'),'true');
   assert.equal(new URL(page.url()).hash,'#'+id);
   for(const [key] of sections)assert.equal(await page.locator('#'+key).isVisible(),key===id,'visible section '+key);
   const visible=page.locator('#'+id);
   const rect=await visible.boundingBox();
   assert.ok(rect.y<844&&rect.y+rect.height>0,'selected tool appears in viewport: '+id);
  }
  await nav.getByRole('button',{name:'急速與冷卻',exact:true}).waitFor();
  assert.equal(await nav.getByRole('button',{name:'急速與冷卻',exact:true}).getAttribute('aria-pressed'),'true');
  for(const id of ['cast','geometry','defense','timing'])await choose(id);
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
  await choose('cast');
  const cast=page.locator('#cast');assert.match(await cast.locator('.combat-tool-result').first().innerText(),/1\.2 秒/);
  await cast.getByRole('combobox').selectOption('area');assert.match(await cast.locator('.combat-tool-result').first().innerText(),/1\.6 秒/);
  await choose('defense');
  const defense=page.locator('#defense');assert.match(await defense.locator('.combat-tool-result').first().innerText(),/18/);
  await defense.getByLabel('一般減傷 Buff（%）').fill('30');assert.match(await defense.locator('.combat-tool-result').first().innerText(),/11/);
  await choose('geometry');
  const range=page.locator('#geometry');await range.getByLabel('目前原始加成（%）').fill('100');assert.match(await range.locator('.combat-tool-result').first().innerText(),/1\.67 倍/);
  await choose('timing');
  assert.equal(await cd.getByLabel('目前全域急速（%）').inputValue(),'101','switching retains input values');
  assert.equal(await cd.getByLabel('基礎冷卻（秒）').inputValue(),'14');
  for(const [id,label] of sections){
   await page.goto(base+'?page=combat#'+id,{waitUntil:'domcontentloaded'});
   await page.locator('#'+id).waitFor({state:'visible'});
   assert.equal(await nav.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');
   for(const [key] of sections)assert.equal(await page.locator('#'+key).isVisible(),key===id);
  }
  await choose('timing');
  const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.scroll<=size.width+2,JSON.stringify(size));assert.deepEqual(errors,[]);
  await page.screenshot({path:'evidence/combat-tools-'+width+'.png',fullPage:true});
  await context.close();console.log('PASS',width,'px, all four navigation buttons, deep links, retained inputs, calculators, no overflow or page errors');
 }
}finally{await browser?.close();await server.close();}
