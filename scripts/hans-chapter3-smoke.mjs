import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const base=process.env.WIKI_SMOKE_URL||'http://127.0.0.1:5189/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 for(const width of [320,390,1280]){
  const mobile=width<500;
  const context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile,locale:'zh-TW'});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(8500);
  page.on('pageerror',error=>errors.push(error.message));
  const go=path=>page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});
  const press=locator=>mobile?locator.tap():locator.click();
  const fits=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
  try {
   await go('?page=stages&ch=3&lap=6');
   const stages=page.getByRole('region',{name:'第三章關卡'});
   const amatsu=stages.getByRole('button',{name:/天津・百鬼夜行祭/});
   await amatsu.waitFor();
   assert.match(await amatsu.innerText(),/三章 T8 · GS 7000/);
   assert.equal(await stages.locator('.stage-heading').count(),3);
   await press(amatsu);
   const drop=stages.getByRole('button',{name:/狐狸面具・三章T8/}).first();
   await drop.waitFor();
   const raw=drop.locator('img').first();
   await raw.waitFor();
   await raw.scrollIntoViewIfNeeded();
   await page.waitForFunction(image=>image.complete&&image.naturalWidth>0,await raw.elementHandle(),{timeout:8500});
   console.log('Chapter drops loaded at '+width+'px');
   assert.ok(await raw.evaluate(image=>image.naturalWidth>0));
   assert.ok(await fits(),'stages at '+width);
   await press(drop);
   const detail=page.getByRole('dialog');
   await detail.waitFor();
   assert.match(await detail.innerText(),/天津・百鬼夜行祭/);
   await page.keyboard.press('Escape');
   await detail.waitFor({state:'hidden'});

   await go('?page=items');
   await page.getByLabel('裝備章節').selectOption('3');
   assert.match(page.url(),/ch=3/);
   await page.getByRole('textbox',{name:'搜尋裝備、卡片或屬性'}).fill('狐狸面具');
   await page.locator('.loot-result').filter({hasText:'狐狸面具・三章T8'}).first().waitFor();
   console.log('Equipment filter passed at '+width+'px');
   assert.ok(await fits(),'items at '+width);

   await go('?page=cards&lap=6&mode=gs');
   await page.getByLabel('特殊能力').selectOption('trigger:dodge');
   const sealed=page.locator('.loot-result').filter({hasText:'封印月夜貓'});
   await sealed.waitFor();
   assert.match(await sealed.innerText(),/198/);
   await press(sealed);
   await detail.waitFor();
   assert.match(await detail.innerText(),/特殊能力 · 改 5/);
   assert.match(await detail.innerText(),/尋寶率 \+5 個百分點/);
   const cardArt=detail.locator('img').first();
   await cardArt.waitFor();
   await cardArt.scrollIntoViewIfNeeded();
   await page.waitForFunction(image=>image.complete&&image.naturalWidth>0,await cardArt.elementHandle(),{timeout:8500});
   assert.ok(await cardArt.evaluate(image=>image.naturalWidth>0));
   await page.keyboard.press('Escape');
   await detail.waitFor({state:'hidden'});
   await press(page.getByText('王卡套裝與效果預覽',{exact:true}));
   await page.getByLabel('套裝',{exact:true}).selectOption('2');
   assert.match(await page.locator('.card-set-preview').innerText(),/火柱傷害提高至 120%/);
   console.log('Cards passed at '+width+'px');
   assert.ok(await fits(),'cards at '+width);

   await go('?page=cards&detail=card:6004143');
   await detail.getByText('特殊能力 · 副本版',{exact:true}).waitFor();
   assert.match(await detail.innerText(),/252 GS/);

   await go('?page=combat#discovery');
   await page.locator('#discovery').getByText('305%',{exact:true}).waitFor();
   await press(page.getByRole('button',{name:'寵物圖鑑',exact:true}));
   await page.getByLabel('寵物',{exact:true}).selectOption('drops');
   await page.getByLabel('蛋的週目').selectOption('6');
   await page.getByRole('checkbox',{name:/裝備寵物飾品/}).check();
   await page.getByText('傷害 +13.5%',{exact:true}).waitFor();
   assert.ok(await fits(),'pets at '+width);

   await go('?page=experience');
   await page.getByLabel('目前戰力 GS（選填）').fill('4499');
   assert.equal(await page.locator('.xp-list').getByText(/天津・百鬼夜行祭|吉芬尼亞・魔界假面舞會|托爾火山・跨年煙火祭/).count(),0);
   await page.getByLabel('目前戰力 GS（選填）').fill('4500');
   await page.locator('.xp-list').getByText(/天津・百鬼夜行祭|吉芬尼亞・魔界假面舞會|托爾火山・跨年煙火祭/).first().waitFor();
   assert.ok(await fits(),'experience at '+width);

   await page.route('**/cards/4263.png',route=>route.abort());
   await go('?page=cards&detail=card:4263');
   await detail.waitFor();
   await detail.locator('.detail-hero .art svg').waitFor();
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px: chapter, loot, filters, card GS and sets, pets, discovery, XP, and artwork fallback');
  }finally{await context.close();}
 }
}finally{await browser.close();}
