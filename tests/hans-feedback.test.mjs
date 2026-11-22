import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {feedbackIssueUrl,feedbackDraftText,FEEDBACK_ISSUES_URL} from '../src/feedback.ts';

const context={subject:'卡片：俄塞里斯・改⁵卡片（原始 ID 4144，週目卡 ID 5004144，GS 類型 magic）',
 pageUrl:'https://hans-ro-fanwiki.github.io/?page=cards&mode=gs&lap=6&detail=card%3A4144'};

test('problem issue form opens with exact item, page, title and user observation',()=>{
 const url=new URL(feedbackIssueUrl('problem','GS 分數顯示有差異','六週目顯示 +210，但遊戲內是 +180，請確認。',context));
 assert.equal(url.origin,'https://github.com');
 assert.equal(url.pathname,'/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues/new');
 assert.equal(url.searchParams.get('template'),'problem-report.yml');
 assert.equal(url.searchParams.get('title'),'[問題回報] GS 分數顯示有差異');
 assert.equal(url.searchParams.get('item_context'),context.subject);
 assert.equal(url.searchParams.get('page_url'),context.pageUrl);
 assert.equal(url.searchParams.get('description'),'六週目顯示 +210，但遊戲內是 +180，請確認。');
 assert.equal(FEEDBACK_ISSUES_URL,url.origin+'/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues');
});

test('wish uses a separate GitHub form without changing page context',()=>{
 const url=new URL(feedbackIssueUrl('wish','卡片比較','希望可以同時比較三張不同部位的卡片 GS。',context));
 assert.equal(url.searchParams.get('template'),'feature-request.yml');
 assert.equal(url.searchParams.get('title'),'[功能許願] 卡片比較');
 assert.equal(url.searchParams.get('description'),'希望可以同時比較三張不同部位的卡片 GS。');
 assert.equal(url.searchParams.get('page_url'),context.pageUrl);
});

test('issue URL safely encodes characters, clamps overly long text, and has copyable backup',()=>{
 const url=new URL(feedbackIssueUrl('problem',' 測試 \u0026 <script> ', '中文及空白 '.repeat(300),context));
 assert.equal(url.searchParams.get('title'),'[問題回報] 測試 & <script>');
 assert.ok(url.searchParams.get('description').length<=500);
 assert.ok(!url.toString().includes('<script>'));
 const text=feedbackDraftText('problem','GS 問題','實際顯示不符合',context);
 assert.match(text,/GS 問題/);assert.match(text,/實際顯示不符合/);assert.ok(text.includes(context.pageUrl));
});

test('both GitHub templates exist and accept the same prefilled fields and existing triage labels',()=>{
 for(const [name,label] of [['problem-report.yml','bug'],['feature-request.yml','enhancement']]){
  const form=readFileSync(new URL('../.github/ISSUE_TEMPLATE/'+name,import.meta.url),'utf8');
  assert.match(form,new RegExp('labels: \\["'+label+'"\\]'));
  for(const key of ['item_context','page_url','description'])assert.ok(form.includes('id: '+key),'missing prefill field '+key);
  assert.match(form,/required: true/);
 }
});
