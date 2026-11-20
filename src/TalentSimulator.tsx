import {useEffect,useMemo,useState} from 'react';
import {Check,Copy,ExternalLink,Link as LinkIcon,Minus,Plus,RotateCcw,Share2} from 'lucide-react';
import type {TalentBranch,TalentBuild,TalentCatalog,TalentJob,TalentNode} from './talents';
import {changeRank,decodeBuild,encodeBuild,gateFor,talentList,usedPoints} from './talents';
import './talent.css';

const JOB_LABELS:Record<string,string>={
 swordsman:'劍士',mage:'魔法師',archer:'弓箭手',acolyte:'服事',thief:'盜賊',
 merchant:'商人',taekwon:'跆拳道',ninja:'忍者',gunslinger:'神槍手'
};
type Props={jobId:string;token:string;onRoute:(job:string,token:string,replace?:boolean)=>void};

function TalentsMap({job,branch,build,total,gate,onChange,onSelect,selectedId}:{
 job:TalentJob;branch:TalentBranch;build:TalentBuild;total:number;gate:number;
 onChange:(id:string,delta:1|-1)=>void;onSelect:(id:string)=>void;selectedId:string|null;
}){
 const rows=Math.max(1,...branch.talents.map(x=>x.row+1));
 const nodes=new Map(talentList(job).map(n=>[n.id,n]));
 const lines=branch.talents.flatMap(n=>n.requires.map(id=>[nodes.get(id),n] as const).filter(pair=>pair[0]!==undefined));
 const coord=(node:TalentNode)=>[(node.col+.5)*100,(node.row+.5)*100] as const;
 return <div className="talent-tree-scroll">
  <div className="talent-tree" style={{minHeight:rows*108}}>
   <svg className="talent-connections" viewBox={'0 0 400 '+rows*108} preserveAspectRatio="none" aria-hidden="true">
    {lines.map(([from,to])=>{if(!from)return null;const [x1]=coord(from),[x2]=coord(to);
     const y1=(from.row+.5)*108,y2=(to.row+.5)*108;
     return <path key={from.id+'-'+to.id} d={'M '+x1+' '+y1+' V '+((y1+y2)/2)+' H '+x2+' V '+y2}
      className={build[from.id]===from.maxRank?'talent-path active':'talent-path'}/>;
    })}
   </svg>
   <div className="talent-grid" style={{gridTemplateRows:'repeat('+rows+',108px)'}}>
    {branch.talents.map(node=>{
     const current=build[node.id]||0;
     const afterAdd=changeRank(job,build,node.id,1,total,gate);
     const canMinus=changeRank(job,build,node.id,-1,total,gate)!==null;
     const canAdd=afterAdd!==null;
     return <div className={'talent-tile'+(current?' invested':'')+(selectedId===node.id?' focused':'')}
       key={node.id} style={{gridColumn:node.col+1,gridRow:node.row+1}}>
      <button type="button" className="talent-core" aria-label={node.name+' '+current+'/'+node.maxRank+'，查看或增加配點'}
        aria-pressed={selectedId===node.id} onClick={()=>{onSelect(node.id);if(canAdd)onChange(node.id,1);}}>
       <span className="talent-emblem" aria-hidden="true">{node.name.slice(0,1)}</span>
       <span className="talent-name">{node.name}</span>
       <span className="talent-rank">{current}/{node.maxRank}</span>
      </button>
      <div className="talent-stepper">
       <button type="button" disabled={!canMinus} aria-label={'減少 '+node.name+' 一點'} onClick={()=>{onSelect(node.id);onChange(node.id,-1)}}><Minus size={15}/></button>
       <button type="button" disabled={!canAdd} aria-label={'增加 '+node.name+' 一點'} onClick={()=>{onSelect(node.id);onChange(node.id,1)}}><Plus size={15}/></button>
      </div>
     </div>;
    })}
   </div>
  </div>
 </div>;
}
export function TalentSimulator({jobId,token,onRoute}:Props){
 const [data,setData]=useState<TalentCatalog|null>(null);
 const [error,setError]=useState('');
 const [branchIndex,setBranchIndex]=useState(0);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [feedback,setFeedback]=useState('');
 useEffect(()=>{
  const abort=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/talents.json',{signal:abort.signal})
   .then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()})
   .then((json:TalentCatalog)=>{
    if(json.server!=='hans'||!json.sourceCommit||!json.jobs?.length)throw Error('資料驗證失敗');
    setData(json);
   }).catch(e=>{if(e.name!=='AbortError')setError('天賦資料載入失敗，請重新整理。')});
  return ()=>abort.abort();
 },[]);
 useEffect(()=>{setBranchIndex(0);setSelectedId(null);setFeedback('')},[jobId]);
 const job=useMemo(()=>data?.jobs.find(j=>j.job===jobId)||data?.jobs[0]||null,[data,jobId]);
 const parsed=useMemo(()=>job&&data?decodeBuild(job,token,data.sourceCommit,data.pointsPerJob,data.branchGate):{build:{},error:null},[job,data,token]);
 const build=parsed.build;
 const branch=job?.branches[branchIndex]||job?.branches[0];
 const selectedNode=job?talentList(job).find(n=>n.id===selectedId):null;
 const selectedBranch=job?.branches.find(b=>b.talents.some(n=>n.id===selectedNode?.id));
 const remaining=data?data.pointsPerJob-usedPoints(build):0;
 const update=(newBuild:TalentBuild)=>{if(job&&data){setFeedback('');onRoute(job.job,encodeBuild(job,newBuild,data.sourceCommit),true)}};
 const adjust=(id:string,delta:1|-1)=>{if(!job||!data)return;const result=changeRank(job,build,id,delta,data.pointsPerJob,data.branchGate);if(result)update(result)};
 const copyUrl=()=>{
  if(!job||!data)return '';
  const url=new URL(location.pathname,location.origin);
  url.searchParams.set('page','talents');
  url.searchParams.set('tj',job.job);
  url.searchParams.set('tb',encodeBuild(job,build,data.sourceCommit));
  return url.href;
 };
 const share=async()=>{
  if(!job)return;
  const url=copyUrl(),title='HANS '+(JOB_LABELS[job.job]||job.job)+'天賦配點';
  try{
   if(navigator.share){await navigator.share({title,url});setFeedback('已開啟分享選單');return;}
   if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setFeedback('配點網址已複製');return;}
   window.prompt('複製這個配點網址',url);setFeedback('已顯示配點網址');
  }catch(e){if((e as Error).name!=='AbortError')setFeedback('分享失敗，請改用複製連結')}
 };
 const copy=async()=>{
  const url=copyUrl();if(!url)return;
  try{await navigator.clipboard.writeText(url);setFeedback('配點網址已複製');}
  catch{window.prompt('複製這個配點網址',url)}
 };
 if(error)return <p className="talent-notice" role="alert">{error}</p>;
 if(!data||!job||!branch)return <p className="talent-notice">天賦資料讀取中…</p>;
 return <section className="talent-simulator" aria-label="HANS 天賦模擬器">
  <p className="talent-intro">選擇職業、點擊天賦配點，完成後直接分享給朋友。依 HANS 天賦列門檻與前置條件限制，不會修改遊戲角色。</p>
  <label className="talent-job-picker">選擇職業
   <select value={job.job} onChange={e=>onRoute(e.target.value,'')}>
    {data.jobs.map(j=><option key={j.job} value={j.job}>{JOB_LABELS[j.job]||j.job}</option>)}
   </select>
  </label>
  <div className="talent-summary">
   <div><small>已使用</small><strong>{usedPoints(build)} <span>/ {data.pointsPerJob}</span></strong></div>
   <div><small>剩餘點數</small><strong>{remaining}</strong></div>
   <div className="talent-main-actions">
    <button type="button" className="talent-share" onClick={share}><Share2 size={17}/>分享配點</button>
    <button type="button" className="talent-action" onClick={copy}><Copy size={16}/>複製連結</button>
    <button type="button" className="talent-action" disabled={!usedPoints(build)} onClick={()=>{if(confirm('要清空這個職業的全部天賦配點嗎？'))update({})}}><RotateCcw size={16}/>重置</button>
   </div>
  </div>
  {parsed.error&&<p role="alert" className="talent-warning">{parsed.error}</p>}
  {feedback&&<p role="status" className="talent-success"><Check size={15}/>{feedback}</p>}
  <div role="tablist" aria-label="天賦分支" className="talent-branch-tabs">
   {job.branches.map((b,i)=>{
    const points=b.talents.reduce((n,t)=>n+(build[t.id]||0),0);
    return <button key={b.id} type="button" role="tab" aria-selected={branchIndex===i}
     className={branchIndex===i?'active':''} onClick={()=>{setBranchIndex(i);setSelectedId(null)}}>
     {b.name}<small>{points} 點</small></button>;
   })}
  </div>
  <div className="talent-branch-heading"><h2>{branch.name}</h2><span>點擊天賦增加一點；− 可退點</span></div>
  <TalentsMap key={job.job+'-'+branch.id} job={job} branch={branch} build={build} total={data.pointsPerJob} gate={data.branchGate}
   onChange={adjust} onSelect={setSelectedId} selectedId={selectedId}/>
  {selectedNode&&selectedBranch&&<aside className="talent-inspect" aria-label="所選天賦資訊">
   <strong>{selectedNode.name}</strong><small>{selectedNode.originalName} · {build[selectedNode.id]||0}/{selectedNode.maxRank}</small>
   <p>此天賦位於「{selectedBranch.name}」第 {selectedNode.row+1} 列。{gateFor(selectedNode,selectedBranch,data.branchGate)>0?'需要先在前面的列投入 '+gateFor(selectedNode,selectedBranch,data.branchGate)+' 點。':'無前列點數限制。'}</p>
   {selectedNode.requires.map(id=>{const n=talentList(job).find(x=>x.id===id);return n&&<p key={id}>前置：{n.name} 需點滿 {n.maxRank} 點（目前 {build[id]||0} 點）。</p>})}
   <a href={'https://ro.hans-webgametw.com/talents.html#'+encodeURIComponent(job.job)} target="_blank" rel="noopener noreferrer">到 HANS 官方查看天賦效果 <ExternalLink size={14}/></a>
  </aside>}
  <p className="talent-footnote"><LinkIcon size={15}/>分享網址會保存職業與完整配點，不需登入。這一版先支援九個一轉職業；二轉專精與三轉天賦仍在核對。天賦名稱、位置、上限與門檻來自 HANS 官方資料（{data.sourceDate}）；效果全文請參考官方頁面。</p>
 </section>;
}
