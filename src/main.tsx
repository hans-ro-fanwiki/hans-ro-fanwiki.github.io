import {useCallback,useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Archive,ArrowLeft,ArrowRight,BookOpen,ChevronRight,CircleHelp,Crown,Gem,Layers,Map as MapIcon,Shield,Sparkles,Swords,Tag,Target,WandSparkles,X} from 'lucide-react';
import type {Catalog,Card,Equipment,Kind,Monster,Page,Source,Stage,Verified} from './types';
import './styles.css';

type ViewState={page:Page;slot:string;job:string;effect:string;source:string;mode:'list'|'stages';onlyOpen:boolean;detail:string|null};
const SLOTS:Record<string,string>={weapon:'武器',head_top:'頭飾（上）',head_mid:'頭飾（中）',head_low:'頭飾（下）',armor:'衣服',shield:'盾牌',garment:'披肩',shoes:'鞋子',acc:'飾品'};
const JOBS:Record<string,string>={all:'全部',mage:'魔法師系',swordsman:'劍士系',archer:'弓箭手系',acolyte:'服事系',thief:'盜賊系',merchant:'商人系',ninja:'忍者系'};
const SOURCE_NAMES:Record<string,string>={monsterDrop:'怪物掉落',bossDrop:'Boss 掉落',story:'劇情',event:'活動',reward:'獎勵',starter:'初始裝備'};
const PAGE_LABELS:Record<Page,string>={items:'裝備',cards:'卡片',stages:'關卡',jobs:'職業'};
function initialState():ViewState{
 const q=new URLSearchParams(location.search);
 const page=q.get('page')||'items';
 return {page:(page in PAGE_LABELS?page:'items') as Page,slot:q.get('slot')||'all',job:q.get('job')||'all',
 effect:q.get('effect')||'all',source:q.get('source')||'all',mode:q.get('mode')==='stages'?'stages':'list',
 onlyOpen:q.get('open')!=='0',detail:q.get('detail')||null};
}
function urlState(s:ViewState){
 const q=new URLSearchParams();
 if(s.page!=='items')q.set('page',s.page);
 if(s.slot!=='all')q.set('slot',s.slot);
 if(s.job!=='all')q.set('job',s.job);
 if(s.effect!=='all')q.set('effect',s.effect);
 if(s.source!=='all')q.set('source',s.source);
 if(s.mode==='stages')q.set('mode','stages');
 if(!s.onlyOpen)q.set('open','0');
 if(s.detail)q.set('detail',s.detail);
 return location.pathname+(q.size?'?'+q:'');
}
function Chip({active,children,onClick}:{active:boolean;children:React.ReactNode;onClick:()=>void}){
 return <button type="button" className={'chip '+(active?'selected':'')} aria-pressed={active} onClick={onClick}>{children}</button>;
}
function Evidence({state}:{state:Verified}){
 return <span className={'evidence '+state}>{state==='official'?'原站核實':state==='candidate'?'非官方待核':'來源不明'}</span>;
}
function IconArt({kind,slot,compact=false}:{kind:Kind;slot?:string;compact?:boolean}){
 const Icon=kind==='card'?BookOpen:kind==='monster'?Target:kind==='stage'?MapIcon:slot==='acc'?Gem:slot==='weapon'?Swords:Shield;
 return <div className={'icon-art '+kind+(compact?' compact':'')} role="img" aria-label="授權未確認，使用中性圖示"><Icon size={compact?21:29} strokeWidth={1.5}/></div>;
}
function App(){
 const [catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState('');
 const [state,setState]=useState<ViewState>(initialState);
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/catalog.json',{signal:ac.signal}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
  .then(d=>setCatalog(d as Catalog)).catch(e=>{if(e.name!=='AbortError')setError('無法讀取資料：'+e.message)});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{
  if(!history.state)history.replaceState({scroll:0},'',location.href);
  const onPop=()=>{setState(initialState());requestAnimationFrame(()=>window.scrollTo(0,history.state?.scroll||0));};
  window.addEventListener('popstate',onPop);
  return ()=>window.removeEventListener('popstate',onPop);
 },[]);
 const go=useCallback((patch:Partial<ViewState>,toTop=false)=>{
  const next={...state,...patch};
  history.replaceState({scroll:window.scrollY},'',location.href);
  history.pushState({scroll:toTop?0:window.scrollY},'',urlState(next));
  setState(next);
  if(toTop)window.scrollTo({top:0,behavior:'instant'});
 },[state]);
 const stageMap=useMemo(()=>new Map((catalog?.stages||[]).map(x=>[x.id,x])),[catalog]);
 const monsterMap=useMemo(()=>new Map((catalog?.monsters||[]).map(x=>[x.id,x])),[catalog]);
 const itemMap=useMemo(()=>new Map((catalog?.items||[]).map(x=>[x.id,x])),[catalog]);
 const cardMap=useMemo(()=>new Map((catalog?.cards||[]).map(x=>[x.id,x])),[catalog]);
 const quick=(name:string)=>{
  if(name==='accessory')go({page:'items',slot:'acc',job:'all',effect:'all',mode:'stages',source:'monsterDrop',detail:null,onlyOpen:true},true);
  if(name==='mage')go({page:'items',slot:'all',job:'mage',effect:'all',mode:'list',source:'all',detail:null,onlyOpen:true},true);
  if(name==='cooldown')go({page:'cards',effect:'cooldown',mode:'list',detail:null,source:'all',onlyOpen:true},true);
  if(name==='stages')go({page:'stages',detail:null,onlyOpen:true},true);
 };
 const sources=(v:Equipment|Card)=>v.sources.filter(s=>state.source==='all'||s.sourceType===state.source);
 const itemList=useMemo(()=> (catalog?.items||[]).filter(i=>
  (state.slot==='all'||i.slot===state.slot) &&
  (state.job==='all'||i.jobs.includes(state.job)||i.jobs.length===0) &&
  (state.source==='all'||i.sources.some(x=>x.sourceType===state.source))
 ).sort((a,b)=>Number(hasVerified(b.sources))-Number(hasVerified(a.sources))||a.id-b.id),[catalog,state.slot,state.job,state.source]);
 const cardList=useMemo(()=>(catalog?.cards||[]).filter(c=>
  (state.effect==='all'||c.tags.includes(state.effect)) &&
  (state.source==='all'||c.sources.some(x=>x.sourceType===state.source))
 ),[catalog,state.effect,state.source]);
 const activeStage=(id:string)=> !state.onlyOpen||!!stageMap.get(id)?.open;
 const itemByStage=useMemo(()=>groupByStage(itemList),[itemList]);
 const cardByStage=useMemo(()=>groupByStage(cardList),[cardList]);
 const currentList: (Equipment|Card)[]=state.page==='items'?itemList:cardList;
 const group=state.page==='items'?itemByStage:cardByStage;
 const allSlots=Array.from(new Set((catalog?.items||[]).map(i=>i.slot))).sort((a,b)=>(a==='acc'?-1:0)-(b==='acc'?-1:0));
 const openDetail=(kind:Kind,id:string|number)=>go({detail:kind+':'+id},false);
 const closeDetail=()=>go({detail:null},false);
 const onNav=(page:Page)=>go({page,detail:null,mode:'list',source:'all',slot:'all',job:'all',effect:'all'},true);
 function sourceSummary(v:Equipment|Card){
  const places=[...new Set(v.sources.flatMap(src=>src.sourceType==='monsterDrop'?src.stageRefs.map(ref=>ref.stageId).filter(activeStage):[]))];
  if(places.length)return places.slice(0,3).map(id=>stageMap.get(id)?.name||id).join(' · ')+(places.length>3?' 等':'');
  return v.sources.some(x=>x.sourceType!=='monsterDrop')?'活動／劇情等非一般掉落':'目前沒有已確認取得來源';
 }
 const selectedDetail=state.detail?.split(':')||[];
 const detailKind=selectedDetail[0] as Kind|'about';
 const detailId=selectedDetail.slice(1).join(':');
 const detailItem=detailKind==='item'?itemMap.get(Number(detailId)):undefined;
 const detailCard=detailKind==='card'?cardMap.get(Number(detailId)):undefined;
 const detailMonster=detailKind==='monster'?monsterMap.get(detailId):undefined;
 const detailStage=detailKind==='stage'?stageMap.get(detailId):undefined;
 return <>
  <header className="topbar">
   <div className="top-inner"><div className="brand"><span className="brand-mark">R</span><span><strong>RO Survivors</strong><small>掉落反查指南</small></span></div>
    <span className="dev-label">DEV PREVIEW</span></div>
  </header>
  <main className="container">
   <section className="intro"><div className="eyebrow"><span className="dot"/> 非官方玩家整理 · 按分類找來源</div>
    <h1>想刷什麼，<span>直接找哪關。</span></h1>
    <p>不必輸入關鍵字。選裝備、卡片或職業，即可查看對應怪物與關卡。</p>
   </section>
   <div className="quick-grid" aria-label="快速查詢">
    <button onClick={()=>quick('accessory')} className="quick"><span className="quick-icon violet"><Gem size={23}/></span><span><b>刷飾品</b><small>哪關會掉？</small></span><ChevronRight size={17}/></button>
    <button onClick={()=>quick('mage')} className="quick"><span className="quick-icon blue"><WandSparkles size={23}/></span><span><b>法師裝備</b><small>可穿哪些？</small></span><ChevronRight size={17}/></button>
    <button onClick={()=>quick('cooldown')} className="quick"><span className="quick-icon peach"><Sparkles size={23}/></span><span><b>冷卻卡片</b><small>找掉落怪物</small></span><ChevronRight size={17}/></button>
    <button onClick={()=>quick('stages')} className="quick"><span className="quick-icon mint"><MapIcon size={23}/></span><span><b>目前可刷關卡</b><small>瀏覽所有關卡</small></span><ChevronRight size={17}/></button>
   </div>
   <section className="content-section">
    <div className="section-heading"><div><div className="section-kicker">圖鑑瀏覽</div><h2>{PAGE_LABELS[state.page]}<span className="heading-count">{state.page==='items'?itemList.length:state.page==='cards'?cardList.length:state.page==='stages'?catalog?.stages.length||0:'選擇職業'}</span></h2></div>
      <button className="version-button" onClick={()=>go({detail:'about:source'})}><CircleHelp size={16}/>資料說明</button></div>
    {error&&<p className="notice error">{error}</p>}
    {!catalog&&!error&&<div className="empty-state">正在載入靜態資料…</div>}
    {catalog&&<>
     {state.page==='items'&&<>
      <div className="filter-block"><div className="filter-label"><Layers size={15}/>裝備部位</div>
       <div className="chips"><Chip active={state.slot==='all'} onClick={()=>go({slot:'all',mode:'list'})}>全部</Chip>{allSlots.map(s=><Chip key={s} active={state.slot===s} onClick={()=>go({slot:s,mode:s==='acc'?'stages':'list'})}>{SLOTS[s]||s}</Chip>)}</div>
      </div>
      <div className="filter-block"><div className="filter-label"><WandSparkles size={15}/>可用職業 <span className="filter-note">限制仍在核實</span></div>
       <div className="chips">{Object.entries(JOBS).map(([id,name])=><Chip key={id} active={state.job===id} onClick={()=>go({job:id})}>{name}</Chip>)}</div>
      </div>
     </>}
     {state.page==='cards'&&<div className="filter-block"><div className="filter-label"><Sparkles size={15}/>卡片效果</div>
      <div className="chips">{[['all','全部'],['cooldown','冷卻縮減'],['crit','爆擊']].map(([id,label])=><Chip key={id} active={state.effect===id} onClick={()=>go({effect:id})}>{label}</Chip>)}</div>
      </div>}
     {(state.page==='cards'||state.page==='items')&&<>
      <div className="filter-block"><div className="filter-label"><Tag size={15}/>取得方式</div>
        <div className="chips">{[['all','全部'],...Object.entries(SOURCE_NAMES)].map(([id,name])=><Chip key={id} active={state.source===id} onClick={()=>go({source:id})}>{name}</Chip>)}</div></div>
      <div className="results-toolbar"><div className="segment"><button className={state.mode==='list'?'on':''} onClick={()=>go({mode:'list'})}>依{state.page==='items'?'裝備':'卡片'}看</button><button className={state.mode==='stages'?'on':''} onClick={()=>go({mode:'stages'})}>依關卡看</button></div>
       <label className="toggle"><input type="checkbox" checked={state.onlyOpen} onChange={e=>go({onlyOpen:e.target.checked})}/>僅候選開放</label></div>
      <p className="result-hint">已核實來源優先顯示；未確認關聯不代表一定會掉。開放狀態目前仍待原站核對。</p>
      {state.mode==='list'?<div className="cards-list">
       {currentList.map(v=><button key={v.id} className="result-card" onClick={()=>openDetail(state.page==='items'?'item':'card',v.id)}>
        <IconArt kind={state.page==='items'?'item':'card'} slot={'slot'in v?v.slot:undefined}/>
        <span className="result-main"><strong>{v.name}</strong><span className="result-sub">{'slot'in v?(SLOTS[v.slot]||v.slot):v.bonuses.join(' · ')}</span><small className="result-place">{sourceSummary(v)}</small>
          <span className="result-tags"><Evidence state={hasVerified(sources(v))?'official':'candidate'}/><span className="id-tag">#{v.id}</span></span></span>
        <ChevronRight size={18} className="list-arrow"/>
       </button>)}
       {!currentList.length&&<div className="empty-state"><Archive size={32}/><h3>沒有符合條件的資料</h3><p>可切換部位、職業或來源條件；未核實來源不會被補成掉落關卡。</p></div>}
      </div>:<div className="cards-list">
       {[...group.entries()].filter(([id])=>activeStage(id)).sort((a,b)=>Number(!!stageMap.get(b[0])?.open)-Number(!!stageMap.get(a[0])?.open)).map(([id,values])=><div className="stage-group" key={id}>
        <button className="stage-group-heading" onClick={()=>openDetail('stage',id)}><IconArt kind="stage" compact/><span><strong>{stageMap.get(id)?.name||id}</strong><small>{values.length} 件符合 · {stageMap.get(id)?.levels||'等級未知'}</small></span><ChevronRight size={18}/></button>
        <div className="compact-results">{values.map(v=><button key={v.id} className="compact-item" onClick={()=>openDetail(state.page==='items'?'item':'card',v.id)}><span>{v.name}</span><Evidence state={v.sources.some(s=>s.stageRefs.some(r=>r.stageId===id&&r.verified))?'official':'candidate'}/><ChevronRight size={15}/></button>)}</div>
       </div>)}
       {![...group.keys()].some(activeStage)&&<div className="empty-state"><MapIcon size={32}/><h3>沒有已定位的來源關卡</h3><p>目前查到的來源可能屬於活動／劇情，或尚無可靠的關卡關聯。</p></div>}
       <div className="notice">有來源但無法確定在哪個關卡的物品，請切換「依裝備／卡片看」查看，避免錯誤推薦。</div>
      </div>}
     </>}
     {state.page==='stages'&&<>
      <div className="results-toolbar"><div className="filter-label"><MapIcon size={15}/>關卡清單</div><label className="toggle"><input type="checkbox" checked={state.onlyOpen} onChange={e=>go({onlyOpen:e.target.checked})}/>僅候選開放</label></div>
      <p className="result-hint">怪物池與 Boss ID 取自遊戲作者的公開版本；關卡是否開放仍依候選資料標示。</p>
      <div className="cards-list">{catalog.stages.filter(active=>!state.onlyOpen||active.open).map(s=><button className="result-card" key={s.id} onClick={()=>openDetail('stage',s.id)}>
       <IconArt kind="stage"/><span className="result-main"><strong>{s.name}</strong><span className="result-sub">建議 Lv {s.levels} · {s.season?'季節限定':s.story?'含劇情':'一般關卡'}</span><small className="result-place">{s.normalMonsterIds.length} 種怪物 · {s.bossMonsterIds.length} 種 Boss</small><span className="result-tags"><Evidence state={s.provenance.pool==='official'?'official':'candidate'}/><span className="id-tag">{s.open?'候選開放':'候選未開放'}</span></span></span><ChevronRight size={18} className="list-arrow"/></button>)}</div>
     </>}
     {state.page==='jobs'&&<>
      <p className="result-hint">職業裝備限制尚待逐件驗證，目前為非官方候選適用清單。</p>
      <div className="job-grid">{Object.entries(JOBS).filter(([id])=>id!=='all').map(([id,name])=><button className="job-card" key={id} onClick={()=>go({page:'items',job:id,slot:'all',mode:'list',source:'all'},true)}><WandSparkles size={24}/><strong>{name}</strong><small>{catalog.items.filter(i=>i.jobs.includes(id)||i.jobs.length===0).length} 件候選裝備</small><ArrowRight size={17}/></button>)}</div>
     </>}
    </>}
   </section>
   <footer><div className="footer-title">來源可追溯，未核實不猜測</div><p>遊戲原站：<a href="https://ro-survivors.com/" target="_blank" rel="noreferrer">ro-survivors.com</a> · 資料版本 {catalog?.sourceVersion||'載入中'}</p><p>非官方玩家專案，與遊戲作者或 Gravity 無關。圖片權利未確認，Preview 只顯示中性佔位圖。</p></footer>
  </main>
  <nav className="bottom-nav" aria-label="主要分類">
   {([['items',Archive],['cards',BookOpen],['stages',MapIcon],['jobs',WandSparkles]] as const).map(([page,Icon])=><button key={page} className={state.page===page?'active':''} onClick={()=>onNav(page)} aria-current={state.page===page?'page':undefined}><Icon size={21}/><span>{PAGE_LABELS[page]}</span></button>)}
  </nav>
  {state.detail&&<div className="sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail()}}>
   <section className="sheet" role="dialog" aria-modal="true" aria-label="詳細資訊"><div className="sheet-grab"/><div className="sheet-head"><button className="back-button" onClick={()=>history.back()}><ArrowLeft size={18}/>返回</button><button className="icon-button" aria-label="關閉" onClick={closeDetail}><X size={20}/></button></div>
    <div className="sheet-body">
     {detailItem&&<EntityDetail title={detailItem.name} id={String(detailItem.id)} kind="item" slot={detailItem.slot} verified={hasVerified(detailItem.sources)} meta={detailItem.originalName} bonuses={detailItem.bonuses} notes={'可裝職業：'+(detailItem.jobs.map(x=>JOBS[x]||x).join('、')||'共通／限制待核')} sources={detailItem.sources} catalog={catalog!} stageMap={stageMap} monsterMap={monsterMap} openDetail={openDetail}/>}
     {detailCard&&<EntityDetail title={detailCard.name} id={String(detailCard.id)} kind="card" verified={false} meta={'可鑲嵌：'+(detailCard.equipSlot||'未核實')} bonuses={detailCard.bonuses} notes="下列卡片效果文字為非官方候選，仍待原站核實，不換算不明單位。" sources={detailCard.sources} catalog={catalog!} stageMap={stageMap} monsterMap={monsterMap} openDetail={openDetail}/>}
     {detailStage&&<><DetailTitle name={detailStage.name} kind="stage" subtitle={'Lv '+detailStage.levels+' · '+(detailStage.open?'候選開放':'候選未開放')} id={detailStage.id}/>
      <h3 className="sheet-section">關卡怪物池 <Evidence state={detailStage.provenance.pool}/></h3>
      <div className="sub-list">{detailStage.normalMonsterIds.map(id=><button key={id} onClick={()=>openDetail('monster',id)}><Target size={17}/><span>{monsterMap.get(id)?.name||id}</span><ChevronRight size={16}/></button>)}</div>
      <h3 className="sheet-section">Boss <Evidence state={detailStage.provenance.boss}/></h3>
      <div className="sub-list">{detailStage.bossMonsterIds.map(id=><button key={id} onClick={()=>openDetail('monster',id)}><Crown size={17}/><span>{monsterMap.get(id)?.name||id}</span><ChevronRight size={16}/></button>)}</div>
      <p className="sheet-note">關卡開放狀態與等級目前屬非官方候選；Boss 與怪物池若標記原站核實，表示已對上目前版本的 ID。</p></>}
     {detailMonster&&<><DetailTitle name={detailMonster.name} id={detailMonster.id} kind="monster" subtitle={detailMonster.boss?'Boss / 特殊怪':'一般怪物'}/>
      <h3 className="sheet-section">出現關卡</h3><div className="sub-list">{detailMonster.stages.map(x=><button key={x.id} onClick={()=>openDetail('stage',x.id)}><MapIcon size={17}/><span>{stageMap.get(x.id)?.name||x.id} {x.boss?'· Boss':''}</span><Evidence state="official"/></button>)}</div>
      <h3 className="sheet-section">相關裝備／卡片</h3><div className="sub-list">{catalog!.items.filter(i=>i.sources.some(s=>s.monsterId===detailMonster.id)).map(i=><button key={i.id} onClick={()=>openDetail('item',i.id)}><Gem size={17}/><span>{i.name}</span><ChevronRight size={16}/></button>)}{catalog!.cards.filter(c=>c.monsterId===detailMonster.id).map(c=><button key={c.id} onClick={()=>openDetail('card',c.id)}><BookOpen size={17}/><span>{c.name} · 待核</span><ChevronRight size={16}/></button>)}</div>
      <p className="sheet-note">所列相關裝備／卡片需進入個別詳情查看核實狀態，關卡出現不代表必定掉落。</p></>}
     {detailKind==='about'&&<><div className="about-icon"><CircleHelp size={28}/></div><h2>關於資料來源</h2><p className="sheet-note">目前資料根據 2026/11/17 公開的遊戲作者 JS bundle，逐筆確認關卡怪物池、Boss 和部分裝備掉落。中文翻譯、職業規則、卡片效果與關卡開放狀態仍有候選欄位。</p><h3 className="sheet-section">標記說明</h3><p><Evidence state="official"/> 原站代碼可追溯關聯及 ID。</p><p><Evidence state="candidate"/> 來自非官方百科，尚需驗證。</p><p><Evidence state="unknown"/> 缺少可靠來源，未提供關卡結論。</p><p className="sheet-note">不把 drop rate 權重推成玩家實際機率。圖片尚未獲得明確使用授權，僅顯示中性圖案。</p><a href="https://ro-survivors.com/legal.html" target="_blank" rel="noreferrer">查看遊戲作者權利說明 <ArrowRight size={15}/></a></>}
    </div>
   </section></div>}
 </>;
}
function hasVerified(sources:Source[]){return sources.some(s=>s.verificationState==='official'&&s.stageRefs.some(x=>x.verified));}
function groupByStage<T extends Equipment|Card>(items:T[]):Map<string,T[]>{
 const out=new Map<string,T[]>();
 for(const i of items)for(const id of new Set(i.sources.filter(s=>s.sourceType==='monsterDrop').flatMap(s=>s.stageRefs.map(x=>x.stageId)))){
  const row=out.get(id)||[];row.push(i);out.set(id,row);
 }
 return out;
}
function DetailTitle({name,kind,id,subtitle}:{name:string;kind:Kind;id:string;subtitle:string}){
 return <div className="detail-title"><IconArt kind={kind}/><div><span className="detail-id">ID {id}</span><h2>{name}</h2><p>{subtitle}</p></div></div>;
}
function EntityDetail({title,id,kind,slot,verified,meta,notes,bonuses,sources,stageMap,monsterMap,openDetail}:{
 title:string;id:string;kind:Kind;slot?:string;verified:boolean;meta:string;notes:string;bonuses:string[];sources:Source[];
 catalog:Catalog;stageMap:Map<string,Stage>;monsterMap:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void;
}){
 const noSource=!sources.length;
 return <><DetailTitle name={title} id={id} kind={kind} subtitle={(slot?SLOTS[slot]+' · ':'')+meta}/>
  <div className="detail-evidence"><Evidence state={verified?'official':'candidate'}/><span>每欄來源可能不同，請看個別取得途徑</span></div>
  <h3 className="sheet-section">屬性／效果 <Evidence state="candidate"/></h3>
  {bonuses.length?<div className="bonus-list">{bonuses.map((v,i)=><span key={i}>{v}</span>)}</div>:<p className="sheet-note">目前沒有已核實的屬性說明</p>}
  <p className="sheet-note">{notes}</p><h3 className="sheet-section">取得途徑</h3>
  {noSource&&<p className="empty-inline">目前沒有已確認取得來源</p>}
  {sources.map((src,i)=><div key={i} className="source-card"><div className="source-line"><strong>{SOURCE_NAMES[src.sourceType]||src.sourceType}</strong><Evidence state={src.verificationState}/></div>
   {src.monsterId&&<button className="source-link" onClick={()=>openDetail('monster',src.monsterId!)}><Target size={17}/><span>{monsterMap.get(src.monsterId)?.name||src.monsterId}</span><ChevronRight size={15}/></button>}
   {!!src.stageRefs.length&&<div className="source-stages">{src.stageRefs.map(ref=><button key={ref.stageId} onClick={()=>openDetail('stage',ref.stageId)}><MapIcon size={14}/>{stageMap.get(ref.stageId)?.name||ref.stageId}{ref.boss?' · Boss':''}<Evidence state={ref.verificationState}/></button>)}</div>}
   {src.sourceType==='monsterDrop'&&!src.stageRefs.length&&<p className="sheet-note">目前無法由原站核實來源關卡</p>}
   {src.sourceType!=='monsterDrop'&&<p className="sheet-note">此來源不屬一般怪物掉落，請勿當成刷圖建議。</p>}
   {src.evidence&&<p className="audit-footnote">證據：{src.evidence.file} · {src.evidence.key} · SHA {src.evidence.hash.slice(0,12)}…</p>}
  </div>)}
  <p className="sheet-note">圖像 ID 已比對作者的資產清單；目前未獲使用授權，故不載入原圖。掉落權重不是實際機率。</p>
 </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
