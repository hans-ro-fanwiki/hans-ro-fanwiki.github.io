// GitHub Actions: one open notification issue per unresolved HANS source drift.
// Never includes upstream source code, asset bytes, or credentials in the issue.
import {readFileSync} from 'node:fs';
const reportPath=process.argv[2];
if(!reportPath)throw Error('Expected local drift report path');
const report=JSON.parse(readFileSync(reportPath,'utf8'));
if(!report.changed){console.log('No drift; no issue');process.exit(0);}
const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||'')||!token)
 throw Error('GitHub Action repository and GITHUB_TOKEN are required');
const url='https://api.github.com/repos/'+repo;
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ro-wiki-source-monitor'};
async function api(path,method='GET',body) {
 const response=await fetch(url+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 if(!response.ok)throw Error('GitHub '+method+' '+path+' returned '+response.status);
 return response.json();
}
const title='HANS 漢斯服遊戲資料有更新：等待維基核對';
const changed=report.sources.filter(s=>!s.unchanged);
const fingerprint=changed.map(s=>s.source.split('/').at(-1)+':'+s.sha256).join('|');
const marker='來源指紋：'+fingerprint;
const body=[
 'HANS 漢斯服公開資料和維基已審核版本不同。請先人工核實，不會自動修改資料或發布網站。',
 '',
 '檢測時間：'+report.checkedAt,
 '',
 ...changed.map(s=>'- '+s.source+'\n  - 新版 SHA-256：`'+s.sha256+'`\n  - 已審核 SHA-256：`'+s.previous+'`'),
 '',
 marker,
 '',
 '待處理：檢查 HANS 職業、裝備與卡片 ID、取得來源、二章與周目 Tier、活動扭蛋和關卡；完成 Linux CI 與手機預覽驗收後才可合併 main。',
 '檢查方法：`npm run check:source`。請勿把 HANS 完整 JS、原始圖片或私人密鑰提交至此公開 repo。'
].join('\n');
const issues=await api('/issues?state=open&per_page=100');
const existing=issues.find(i=>!i.pull_request&&i.title===title);
if(existing){
 if(existing.body?.includes(marker)){console.log('Already reported as issue #'+existing.number);process.exit(0);}
 await api('/issues/'+existing.number+'/comments','POST',{body});
 console.log('Updated drift issue #'+existing.number);
}else{
 const created=await api('/issues','POST',{title,body});
 console.log('Created drift issue #'+created.number);
}
