import {useCallback,useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,BookOpen,ChevronDown,ChevronRight,Gem,Map as MapIcon,Search,Shield,SlidersHorizontal,Swords,Target,WandSparkles,X} from 'lucide-react';
import type {Card,Catalog,Equipment,ImageEvidence,Kind,Monster,Page,Source,Stage} from './types';
import './styles.css';
import './search.css';
import {ATTRIBUTE_GROUPS,entryMatches,matchedEffect} from './search';

type View={page:Page;slot:string;job:string;effect:string;source:string;query:string;attr:string;mode:'list'|'stages';onlyOpen:boolean;detail:string|null};
type GameEntry=Equipment|Card;
const SLOTS:Record<string,string>={weapon:'武器',head_top:'頭飾（上）',head_mid:'頭飾（中）',head_low:'頭飾（下）',armor:'衣服',shield:'盾牌',garment:'披肩',shoes:'鞋子',acc:'飾品'};
const JOBS:Record<string,string>={all:'全部',mage:'魔法師系',swordsman:'劍士系',archer:'弓箭手系',acolyte:'服事系',thief:'盜賊系',merchant:'商人系',ninja:'忍者系'};
const SOURCES:Record<string,string>={monsterDrop:'怪物掉落',bossDrop:'Boss 掉落',story:'劇情',event:'活動',reward:'獎勵',starter:'初始裝備'};
const LABELS:Record<Page,string>={items:'裝備',cards:'卡片',stages:'關卡',jobs:'職業'};
// Same-origin private preview proxy avoids the upstream image hotlink block.
const ASSET_ROOT=import.meta.env.BASE_URL+'game-assets/';
const EMPTY:View={page:'items',slot:'all',job:'all',effect:'all',source:'all',query:'',attr:'all',mode:'list',onlyOpen:true,detail:null};
function readLocation():View{
 const q=new URLSearchParams(location.search);
 const page=q.get('page')||'items';
 return {page:(page in LABELS?page:'items') as Page,slot:q.get('slot')||'all',job:q.get('job')||'all',effect:q.get('effect')||'all',
 source:q.get('source')||'all',query:q.get('q')||'',attr:q.get('attr')||'all',mode:q.get('mode')==='stages'?'stages':'list',onlyOpen:q.get('open')!=='0',detail:q.get('detail')||null};
}
function pathFor(v:View){
 const q=new URLSearchParams();
 if(v.page!=='items')q.set('page',v.page);
 if(v.slot!=='all')q.set('slot',v.slot);
 if(v.job!=='all')q.set('job',v.job);
 if(v.effect!=='all')q.set('effect',v.effect);
 if(v.source!=='all')q.set('source',v.source);
 if(v.query.trim())q.set('q',v.query.trim());
 if(v.attr!=='all')q.set('attr',v.attr);
 if(v.mode==='stages')q.set('mode','stages');
 if(!v.onlyOpen)q.set('open','0');
 if(v.detail)q.set('detail',v.detail);
 return location.pathname+(q.size?'?'+q.toString():'');
}
function Chip({active,children,onClick}:{active:boolean;children:React.ReactNode;onClick:()=>void}){
 return <button type="button" className={'chip '+(active?'selected':'')} aria-pressed={active} onClick={onClick}>{children}</button>;
}
function safeImageUrl(x:ImageEvidence|null|undefined):string|null{
 if(!x || !/^(items|cards)\/[a-zA-Z0-9_-]+(?:_art)?\.png$/.test(x.officialPath))return null;
 return ASSET_ROOT+x.officialPath;
}
function Artwork({kind,entity,large=false}:{kind:Kind;entity?:Equipment|Card|Monster|null;large?:boolean}){
 const item=kind==='item'?entity as Equipment:undefined;
 const card=kind==='card'?entity as Card:undefined;
 const monster=kind==='monster'?entity as Monster:undefined;
 const initial=safeImageUrl(item?.image||card?.image);
 const backup=safeImageUrl(item?.icon);
 const [imageUrl,setImageUrl]=useState(initial);
 useEffect(()=>setImageUrl(initial),[initial]);
 const Icon=kind==='card'?BookOpen:kind==='monster'?Target:kind==='stage'?MapIcon:item?.slot==='acc'?Gem:item?.slot==='weapon'?Swords:Shield;
 const frame=monster?.spriteFrame;
 const edge=large?112:58;
 const scale=frame?Math.min((edge-8)/frame.width,(edge-8)/frame.height,large?1.5:1):1;
 return <span className={'art '+kind+(large?' large':'')}>
  {imageUrl?<img loading={large?'eager':'lazy'} decoding="async" src={imageUrl} alt={entity?.name||'裝備圖片'}
   className={kind==='card'?'card-image':item?.image?.officialPath?.endsWith('_art.png')?'art-image':'art-icon-image'}
   onError={()=>setImageUrl(imageUrl===initial&&backup!==initial?backup:null)}/>
  :frame&&/^sprites\/[\w-]+\.png$/.test(frame.url)?<span className="sprite-frame" role="img" aria-label={monster?.name||'怪物'}
   style={{width:frame.width*scale,height:frame.height*scale,
    backgroundImage:`url("${ASSET_ROOT+frame.url}")`,backgroundSize:`${frame.sheetWidth*scale}px ${frame.sheetHeight*scale}px`,
    backgroundPosition:`-${frame.x*scale}px -${frame.y*scale}px`}}/>
  :<Icon size={large?35:25} strokeWidth={1.5}/>}
 </span>;
}
function baseText(e:Equipment){const b=e.baseStats;if(!b)return [];return (['atk','matk','def'] as const).filter(k=>Number.isFinite(b[k])&&b[k]!==0).map(k=>k.toUpperCase()+' +'+b[k]);}
function effects(e:GameEntry):string[]{
 return 'slot'in e?[...baseText(e),...e.bonuses,...(e.starBonuses||[])]:e.bonuses;
}
function shortStats(e:GameEntry,max=3){return effects(e).slice(0,max).join(' · ')||('slot'in e?'無附加屬性':'效果未收錄');}
function sourceMonsterName(src:Source,monsterMap:Map<string,Monster>){
 return src.monsterId?monsterMap.get(src.monsterId)?.name||src.monsterId:null;
}
function stageRows(data:Catalog,stageId:string){
 const result:{item:GameEntry;kind:'item'|'card';source:Source;boss:boolean}[]=[];
 for(const [kind,list] of [['item',data.items],['card',data.cards]] as const)for(const item of list)for(const source of item.sources){
  const ref=source.stageRefs.find(r=>r.stageId===stageId);
  if(source.sourceType==='monsterDrop'&&ref)result.push({item,kind,source,boss:ref.boss});
 }
 return result.sort((a,b)=>Number(b.source.verificationState==='official')-Number(a.source.verificationState==='official')||a.item.name.localeCompare(b.item.name,'zh'));
}
function App(){
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [error,setError]=useState('');
 const [state,setState]=useState<View>(readLocation);
 const [visibleCount,setVisibleCount]=useState(40);
 const [showFilters,setShowFilters]=useState(false);
 const [focusedStage,setFocusedStage]=useState<string|null>(null);
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/catalog.json',{signal:ac.signal}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()}).then(d=>setCatalog(d as Catalog)).catch(e=>{if(e.name!=='AbortError')setError('資料載入失敗，請重新整理。')});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{
  if(!history.state)history.replaceState({scroll:0},'',location.href);
  const pop=()=>{setState(readLocation());requestAnimationFrame(()=>scrollTo(0,history.state?.scroll||0));};
  window.addEventListener('popstate',pop);return ()=>window.removeEventListener('popstate',pop);
 },[]);
 useEffect(()=>{document.body.style.overflow=state.detail?'hidden':'';return ()=>{document.body.style.overflow='';};},[state.detail]);
 useEffect(()=>setVisibleCount(40),[state.page,state.slot,state.job,state.effect,state.source,state.query,state.attr,state.mode,state.onlyOpen]);
 const navigate=useCallback((patch:Partial<View>,top=false,replace=false)=>{
  const next={...state,...patch};
  history.replaceState({scroll:scrollY},'',location.href);
  const url=pathFor(next);
  if(replace)history.replaceState({scroll:scrollY},'',url);
  else history.pushState({scroll:top?0:scrollY},'',url);
  setState(next);
  if(top)scrollTo({top:0,behavior:'instant'});
 },[state]);
 const stages=useMemo(()=>new Map((catalog?.stages||[]).map(x=>[x.id,x])),[catalog]);
 const monsters=useMemo(()=>new Map((catalog?.monsters||[]).map(x=>[x.id,x])),[catalog]);
 const items=useMemo(()=>new Map((catalog?.items||[]).map(x=>[x.id,x])),[catalog]);
 const cards=useMemo(()=>new Map((catalog?.cards||[]).map(x=>[x.id,x])),[catalog]);
 const openDetail=(kind:Kind,id:string|number)=>{
  if(kind==='stage'){
   setFocusedStage(String(id));
   navigate({...EMPTY,page:'stages',detail:null},true);
   return;
  }
  navigate({detail:kind+':'+id});
 };
 const closeDetail=()=>navigate({detail:null},false,true);
 useEffect(()=>{const oldStage=state.detail?.match(/^stage:(.+)$/);if(oldStage){setFocusedStage(oldStage[1]);navigate({...EMPTY,page:'stages',detail:null},true,true)}},[state.detail,navigate]);
 const visibleStage=(id:string)=>!state.onlyOpen||!!stages.get(id)?.open;
 const equip=useMemo(()=>catalog?.items.filter(i=>
  (state.slot==='all'||i.slot===state.slot)&&
  (state.job==='all'||!i.jobs.length||i.jobs.includes(state.job))&&
  (state.source==='all'||i.sources.some(s=>state.source==='bossDrop'?s.sourceType==='monsterDrop'&&s.stageRefs.some(r=>r.boss):s.sourceType===state.source))&&
  entryMatches(i,state.query,state.attr)
 )||[],[catalog,state.slot,state.job,state.source,state.query,state.attr]);
 const cardList=useMemo(()=>catalog?.cards.filter(c=>(state.effect==='all'||c.tags.includes(state.effect))&&
  (state.source==='all'||c.sources.some(s=>state.source==='bossDrop'?s.sourceType==='monsterDrop'&&s.stageRefs.some(r=>r.boss):s.sourceType===state.source))&&
  entryMatches(c,state.query,state.attr))||[],[catalog,state.effect,state.source,state.query,state.attr]);
 const list:GameEntry[]=state.page==='cards'?cardList:equip;
 const searchActive=Boolean(state.query.trim()||state.attr!=='all');
 const nameCounts=useMemo(()=>{
  const found=new Map<string,number>();
  for(const entry of catalog?(state.page==='cards'?catalog.cards:catalog.items):[])found.set(entry.name,(found.get(entry.name)||0)+1);
  return found;
 },[catalog,state.page]);
 const slots=[...new Set(catalog?.items.map(i=>i.slot)||[])].sort((a,b)=>Number(b==='acc')-Number(a==='acc'));
 const [detailKind,...detailParts]=state.detail?.split(':')||[];
 const detailId=detailParts.join(':');
 const selectedItem=detailKind==='item'?items.get(Number(detailId)):undefined;
 const selectedCard=detailKind==='card'?cards.get(Number(detailId)):undefined;
 const selectedMonster=detailKind==='monster'?monsters.get(detailId):undefined;
 const sourceLine=(entry:GameEntry)=>{
  const names=[...new Set(entry.sources.filter(s=>s.sourceType==='monsterDrop').flatMap(s=>s.stageRefs.map(r=>r.stageId)).filter(visibleStage))];
  if(names.length)return names.slice(0,2).map(id=>stages.get(id)?.name||id).join('、')+(names.length>2?' 等':'');
  return entry.sources.some(s=>s.sourceType!=='monsterDrop')?'劇情／活動等其他取得方式':'取得地點未知';
 };
 return <>
  <header className="topbar"><div className="top-inner"><span className="brand-mark">R</span><span className="brand-names"><strong>RO Survivors</strong><small>掉落圖鑑</small></span></div></header>
  <main className="container">
   <section className="content-section">
    <div className="section-heading"><h1>{LABELS[state.page]}</h1><span className="heading-count">
      {state.page==='items'?equip.length:state.page==='cards'?cardList.length:state.page==='stages'?catalog?.stages.length||0:''}
     </span></div>
    {error&&<div className="empty-state">{error}</div>}
    {!catalog&&!error&&<div className="empty-state">讀取中…</div>}
    {catalog&&<>
     {state.page!=='jobs'&&<section className="search-panel">
      <label className="search-field"><Search size={20}/><input aria-label="搜尋裝備、卡片或屬性" placeholder="搜尋裝備、卡片、INT、冷卻…" value={state.query} onChange={e=>navigate({query:e.target.value},false,true)}/>{state.query&&<button type="button" className="search-clear" aria-label="清除搜尋" onClick={()=>navigate({query:''})}><X size={18}/></button>}</label>
      <div className="search-filter-row">
       {([['cooldown','冷卻'],['int','INT'],['dex','DEX'],['crit','爆擊']] as const).map(([key,label])=><Chip key={key} active={state.attr===key} onClick={()=>navigate({attr:state.attr===key?'all':key})}>{label}</Chip>)}
       <button className="search-more" type="button" aria-expanded={showFilters} onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={16}/>篩選<ChevronDown size={15}/></button>
      </div>
      {showFilters&&<div className="filter-panel">
       {ATTRIBUTE_GROUPS.map(group=><div key={group.label} className="filter-block"><div className="filter-label">{group.label}</div><div className="chips">{group.options.map(([key,label])=><Chip key={key} active={state.attr===key} onClick={()=>navigate({attr:state.attr===key?'all':key})}>{label}</Chip>)}</div></div>)}
       {(state.page==='items'||state.page==='cards')&&<><div className="filter-block"><div className="filter-label">裝備部位</div><div className="chips"><Chip active={state.slot==='all'} onClick={()=>navigate({slot:'all'})}>全部</Chip>{slots.map(slot=><Chip key={slot} active={state.slot===slot} onClick={()=>navigate({slot})}>{SLOTS[slot]||slot}</Chip>)}</div></div>
       <div className="filter-block"><div className="filter-label">職業</div><div className="chips">{Object.entries(JOBS).map(([job,name])=><Chip key={job} active={state.job===job} onClick={()=>navigate({job})}>{name}</Chip>)}</div></div>
       <div className="filter-block"><div className="filter-label">取得方式</div><div className="chips">{([['all','全部'],...Object.entries(SOURCES)]).map(([v,name])=><Chip key={v} active={state.source===v} onClick={()=>navigate({source:v})}>{name}</Chip>)}</div></div>
       {state.page==='cards'&&<div className="filter-block"><div className="filter-label">卡片效果</div><div className="chips">{([['all','全部'],['cooldown','冷卻縮減'],['crit','爆擊'],['damage','傷害'],['defense','防禦'],['hp','HP']] as const).map(([v,label])=><Chip key={v} active={state.effect===v} onClick={()=>navigate({effect:v})}>{label}</Chip>)}</div></div>}</>}
       <button className="search-more" type="button" onClick={()=>{navigate({query:'',attr:'all',slot:'all',job:'all',source:'all',effect:'all'});setShowFilters(false)}}>清除所有篩選</button>
      </div>}
     </section>}
     {(state.page==='items'||state.page==='cards')&&<>
      <div className="results-toolbar">
       <div className="segment"><button className={state.mode==='list'?'on':''} onClick={()=>navigate({mode:'list'})}>依{state.page==='items'?'裝備':'卡片'}看</button><button className={state.mode==='stages'?'on':''} onClick={()=>navigate({mode:'stages'})}>依關卡看</button></div>
       <label className="toggle"><input type="checkbox" checked={state.onlyOpen} onChange={e=>navigate({onlyOpen:e.target.checked})}/>只看已開放關卡</label>
      </div>
      {state.mode==='list'?<div className="cards-list">
       {list.slice(0,visibleCount).map(entry=><button className="result-card" key={entry.id} onClick={()=>openDetail(state.page==='items'?'item':'card',entry.id)}>
        <Artwork kind={state.page==='items'?'item':'card'} entity={entry}/>
        <span className="result-main"><strong>{entry.name}{(nameCounts.get(entry.name)||0)>1&&<small className="variant-id"> #{entry.id}</small>}</strong><span className="result-sub">{state.page==='items'&&'slot'in entry?(SLOTS[entry.slot]||entry.slot)+'　':'卡片　'}{matchedEffect(entry,state.query,state.attr)||shortStats(entry,3)}</span><small className="result-place">{sourceLine(entry)}</small></span><ChevronRight className="list-arrow" size={18}/>
       </button>)}
       {list.length>visibleCount&&<button type="button" className="load-more" onClick={()=>setVisibleCount(v=>v+40)}>顯示更多（還有 {list.length-visibleCount} 件）</button>}
       {!list.length&&<EmptyState>沒有符合條件的裝備或卡片</EmptyState>}
      </div>:<StageBrowser data={catalog} query={state.query} attr={state.attr} onlyOpen={state.onlyOpen} focusedStage={focusedStage} openDetail={openDetail} slot={state.page==='items'?state.slot:'all'} job={state.page==='items'?state.job:'all'} source={state.source}/>}
      {state.mode==='list'&&searchActive&&<section className="search-extra">
       <h2 className="search-subtitle">其他{state.page==='items'?'卡片':'裝備'}結果（{state.page==='items'?cardList.length:equip.length}）</h2>
       <div className="cards-list">{(state.page==='items'?cardList:equip).slice(0,40).map(entry=><button key={entry.id} className="result-card" onClick={()=>openDetail('slot'in entry?'item':'card',entry.id)}>
        <Artwork kind={'slot'in entry?'item':'card'} entity={entry}/>
        <span className="result-main"><strong>{entry.name}</strong><span className="result-sub">{matchedEffect(entry,state.query,state.attr)||shortStats(entry,2)}</span><small className="result-place">{sourceLine(entry)}</small></span><ChevronRight size={18}/>
       </button>)}{(state.page==='items'?cardList:equip).length>40&&<button className="load-more" type="button" onClick={()=>navigate({page:state.page==='items'?'cards':'items',mode:'list'},true)}>查看更多{state.page==='items'?'卡片':'裝備'}</button>}</div>
      </section>}
     </>}
     {state.page==='stages'&&<><div className="stage-view-toolbar"><span className="search-hint">點擊關卡即可展開或收合</span><label className="toggle"><input type="checkbox" checked={state.onlyOpen} onChange={e=>navigate({onlyOpen:e.target.checked})}/>只看已開放關卡</label></div><StageBrowser data={catalog} query={state.query} attr={state.attr} onlyOpen={state.onlyOpen} focusedStage={focusedStage} openDetail={openDetail}/></>}
     {state.page==='jobs'&&<div className="job-grid">{Object.entries(JOBS).filter(([v])=>v!=='all').map(([id,name])=><button className="job-card" key={id} onClick={()=>navigate({page:'items',job:id,slot:'all',source:'all',mode:'list'},true)}><WandSparkles size={24}/><b>{name}</b><small>{catalog.items.filter(i=>!i.jobs.length||i.jobs.includes(id)).length} 件裝備</small><ChevronRight size={17}/></button>)}</div>}
    </>}
   </section>
  </main>
  <nav className="bottom-nav" aria-label="分類">
   {([['items',Shield],['cards',BookOpen],['stages',MapIcon],['jobs',WandSparkles]] as const).map(([page,Icon])=><button key={page} className={state.page===page?'active':''} onClick={()=>navigate({...EMPTY,page},true)} aria-current={state.page===page?'page':undefined}><Icon size={21}/><span>{LABELS[page]}</span></button>)}
  </nav>
  {state.detail&&catalog&&<div className="sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail()}}>
   <section className="sheet" role="dialog" aria-modal="true" aria-label="詳細資訊"><div className="sheet-grab"/>
    <div className="sheet-head"><button className="back-button" onClick={()=>history.back()}><ArrowLeft size={19}/>返回</button><button className="icon-button" aria-label="關閉" onClick={closeDetail}><X size={19}/></button></div>
    <div className="sheet-body">
     {selectedItem&&<EquipmentDetail item={selectedItem} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedCard&&<CardDetail card={selectedCard} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedMonster&&<MonsterDetail monster={selectedMonster} data={catalog} stages={stages} openDetail={openDetail}/>}
    </div>
   </section>
  </div>}
 </>;
}
function StageBrowser({data,query,attr,onlyOpen,focusedStage,openDetail,slot='all',job='all',source='all'}:{
 data:Catalog;query:string;attr:string;onlyOpen:boolean;focusedStage:string|null;
 openDetail:(kind:Kind,id:string|number)=>void;slot?:string;job?:string;source?:string;
}){
 const [expanded,setExpanded]=useState<string|null>(null);
 const [kind,setKind]=useState<'all'|'item'|'card'>('all');
 const [localSlot,setLocalSlot]=useState(slot);
 const [localJob,setLocalJob]=useState(job);
 const [localAttr,setLocalAttr]=useState('all');
 const monsterMap=useMemo(()=>new Map(data.monsters.map(m=>[m.id,m])),[data]);
 useEffect(()=>{if(focusedStage)setExpanded(focusedStage)},[focusedStage]);
 useEffect(()=>{setLocalSlot(slot);setLocalJob(job)},[slot,job]);
 const visible=data.stages.filter(s=>!onlyOpen||s.open);
 const eligible=(row:ReturnType<typeof stageRows>[number])=>{
  if(kind!=='all'&&row.kind!==kind)return false;
  if(source==='bossDrop'&&!row.boss)return false;
  if(source!=='all'&&source!=='bossDrop'&&source!=='monsterDrop')return false;
  if(!entryMatches(row.item,query,attr)||!entryMatches(row.item,'',localAttr))return false;
  if(row.kind==='item'){
   const item=row.item as Equipment;
   return (localSlot==='all'||item.slot===localSlot)&&(localJob==='all'||!item.jobs.length||item.jobs.includes(localJob));
  }
  return localSlot==='all'&&localJob==='all';
 };
 return <div className="stage-accordion" aria-label="可收合關卡掉落">
  <div className="stage-view-toolbar"><span className="search-hint">目前顯示 {visible.length} 個關卡</span><button type="button" className="search-more" onClick={()=>setExpanded(null)}>全部收合</button></div>
  {visible.map(stage=>{
   const rows=stageRows(data,stage.id).filter(eligible);
   const opened=expanded===stage.id;
   return <section className="stage-entry" key={stage.id}>
    <button type="button" className="stage-heading" aria-expanded={opened} aria-controls={'stage-'+stage.id} onClick={()=>setExpanded(opened?null:stage.id)}>
     <Artwork kind="stage"/>
     <span className="result-main"><strong>{stage.name}</strong><small>Lv {stage.levels} · {rows.length} 筆符合掉落</small></span>
     <ChevronDown size={20} style={{transform:opened?'rotate(180deg)':undefined}}/>
    </button>
    {opened&&<div id={'stage-'+stage.id} className="stage-body">
     <div className="search-filter-row">
      {([['all','全部'],['item','裝備'],['card','卡片']] as const).map(([value,label])=><Chip key={value} active={kind===value} onClick={()=>{setKind(value);if(value==='card'){setLocalSlot('all');setLocalJob('all')}}}>{label}</Chip>)}
     </div>
     <div className="stage-controls">
      <label>部位<select aria-label="關卡部位" value={localSlot} onChange={e=>setLocalSlot(e.target.value)}><option value="all">全部部位</option>{Object.entries(SLOTS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      <label>職業<select aria-label="關卡職業" value={localJob} onChange={e=>setLocalJob(e.target.value)}>{Object.entries(JOBS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      <label>屬性<select aria-label="關卡屬性" value={localAttr} onChange={e=>setLocalAttr(e.target.value)}><option value="all">全部屬性</option>{ATTRIBUTE_GROUPS.map(group=><optgroup key={group.label} label={group.label}>{group.options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</optgroup>)}</select></label>
     </div>
     {rows.length?<div className="compact-results">{rows.map((row,i)=><button type="button" className="compact-item" key={row.kind+'-'+row.item.id+'-'+row.source.monsterId+'-'+i} onClick={()=>openDetail(row.kind,row.item.id)}>
      <Artwork kind={row.kind} entity={row.item}/>
      <span className="compact-copy"><b>{row.item.name}</b><small>{matchedEffect(row.item,query,localAttr!=='all'?localAttr:attr)||shortStats(row.item,3)}</small><small>{row.boss?'Boss · ':''}{sourceMonsterName(row.source,monsterMap)||'怪物未知'}</small></span><ChevronRight size={16}/>
     </button>)}</div>:<div className="stage-no-results">這個關卡沒有符合條件的掉落物</div>}
    </div>}
   </section>;
  })}
  {!visible.length&&<EmptyState>沒有符合條件的關卡</EmptyState>}
 </div>;
}
function EmptyState({children}:{children:React.ReactNode}){return <div className="empty-state">{children}</div>;}
function DropRoutes({sources,stages,monsters,openDetail}:{sources:Source[];stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 if(!sources.length)return <EmptyState>尚無取得資訊</EmptyState>;
 return <div className="route-list">{sources.map((s,i)=><div className="route" key={i}>
  <div className="route-top"><strong>{s.sourceType==='monsterDrop'&&s.verificationState!=='official'?'可能掉落':SOURCES[s.sourceType]||s.sourceType}{s.stageRefs.some(r=>r.boss)?' · Boss':''}</strong></div>
  {s.monsterId&&<button onClick={()=>openDetail('monster',s.monsterId!)}><Target size={16}/><span>{sourceMonsterName(s,monsters)}</span><ChevronRight size={16}/></button>}
  {s.stageRefs.map(r=><button key={r.stageId} onClick={()=>openDetail('stage',r.stageId)}><MapIcon size={16}/><span>{stages.get(r.stageId)?.name||r.stageId}{r.boss?'（Boss）':''}</span><ChevronRight size={16}/></button>)}
  {s.sourceType==='monsterDrop'&&!s.stageRefs.length&&<small>出現關卡尚未確認</small>}
 </div>)}</div>;
}
function DetailHero({kind,entry,title,sub}:{kind:Kind;entry?:Equipment|Card|Monster;title:string;sub?:string}){
 return <div className="detail-hero"><Artwork kind={kind} entity={entry} large/><div className="hero-info"><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>;
}
function StatSection({entry}:{entry:GameEntry}){
 const e=effects(entry);if(!e.length)return null;
 return <><h3 className="sheet-section">{'slot'in entry?'裝備效果':'卡片效果'}</h3><div className="bonus-list">{'slot'in entry?<>
  {baseText(entry).map((t,i)=><span key={'base'+i}>{t}</span>)}
  {entry.bonuses.map((t,i)=><span key={'bonus'+i}>{t}</span>)}
  {(entry.starBonuses||[]).map((t,i)=><span key={'star'+i}>{t}</span>)}
  {(entry.starBonusesMax||[]).map((t,i)=><span key={'maxstar'+i}>滿星：{t}</span>)}
 </>:entry.bonuses.map((t,i)=><span key={i}>{t}</span>)}</div></>;
}
function EquipmentDetail({item,stages,monsters,openDetail}:{item:Equipment;stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 return <><DetailHero kind="item" entry={item} title={item.name} sub={SLOTS[item.slot]||item.slot}/>
  <StatSection entry={item}/>
  {item.jobs.length>0&&<><h3 className="sheet-section">可用職業</h3><div className="bonus-list">{item.jobs.map(j=><span key={j}>{JOBS[j]||j}</span>)}</div></>}
  <h3 className="sheet-section">取得方式</h3><DropRoutes sources={item.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function CardDetail({card,stages,monsters,openDetail}:{card:Card;stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 return <><DetailHero kind="card" entry={card} title={card.name} sub={card.equipSlot?'鑲嵌部位：'+card.equipSlot:'卡片'}/>
  <StatSection entry={card}/><h3 className="sheet-section">取得方式</h3>
  <DropRoutes sources={card.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function MonsterDetail({monster,data,stages,openDetail}:{monster:Monster;data:Catalog;stages:Map<string,Stage>;openDetail:(kind:Kind,id:string|number)=>void}){
 const results=[...data.items,...data.cards].flatMap((entry)=>{
  const kind:'item'|'card'='slot'in entry?'item':'card';
  return entry.sources.filter(s=>s.monsterId===monster.id).map(s=>({entry,kind,source:s}));
 });
 return <><DetailHero kind="monster" entry={monster} title={monster.name} sub={monster.boss?'Boss':'怪物'}/>
  <h3 className="sheet-section">出現關卡</h3><div className="sub-list">{monster.stages.map(s=><button key={s.id} onClick={()=>openDetail('stage',s.id)}><MapIcon size={18}/><span>{stages.get(s.id)?.name||s.id}{s.boss?' · Boss':''}</span><ChevronRight size={16}/></button>)}</div>
  <h3 className="sheet-section">掉落物品</h3><div className="stage-loot-list">{results.map((r,i)=><button key={r.entry.id+'-'+i} className="loot-row" onClick={()=>openDetail(r.kind,r.entry.id)}><Artwork kind={r.kind} entity={r.entry}/><span className="loot-copy"><b>{r.entry.name}</b><small>{shortStats(r.entry,3)}</small></span><ChevronRight size={16}/></button>)}</div>
  {!results.length&&<EmptyState>目前沒有已收錄掉落物品</EmptyState>}
 </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
