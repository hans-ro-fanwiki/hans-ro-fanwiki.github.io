import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,BookOpen,ChevronDown,ChevronRight,Gem,GitBranch,History,Map as MapIcon,Search,Shield,SlidersHorizontal,Swords,Target,WandSparkles,X} from 'lucide-react';
import type {Card,Catalog,Equipment,ImageEvidence,Kind,Monster,Page,Source,Stage} from './types';
import './styles.css';
import './search.css';
import './dark.css';
import {ATTRIBUTE_GROUPS,entryMatches,matchedEffect} from './search';
import {matchesStageType,parseStageType} from './stage-type';
import type {StageType} from './stage-type';
import {parseStageChapter,stageChapterGroups} from './stage-chapter';
import type {StageChapter} from './stage-chapter';
import {SiteFooter} from './SiteFooter';
import {TalentSimulator} from './TalentSimulator';
import {SkillsEncyclopedia} from './SkillsEncyclopedia';
import {BalanceHistory} from './BalanceHistory';
import {equipmentTier} from './tier';
import {hasConfirmedAcquisition} from './acquisition';
import {cardEffects,cardId,cardMultiplier,cardName,cardScore,clampLap,gsRepresentativeJob,gsScalingForJob,isRaidOnlyCard,GS_SCALING_LABELS,stageLapInfo,stageTierLabel} from './laps';
import type {LapRules} from './types';
import {rankCardsByGs} from './card-ranking';
import {FestivalNotes,GameNotes} from './game-notes';

type View={page:Page;slot:string;job:string;source:string;query:string;attr:string;mode:'list'|'stages'|'gs';stageType:StageType;stageChapter:StageChapter;lap:number;gsJob:string;showUnknown:boolean;detail:string|null;stage:string|null;tj:string;tb:string;t:string;skillJob:string;skillRank:number;skillId:string|null};
type GameEntry=Equipment|Card;
const SLOTS:Record<string,string>={weapon:'武器',head_top:'頭飾（上）',head_mid:'頭飾（中）',head_low:'頭飾（下）',armor:'衣服',shield:'盾牌',garment:'披肩',shoes:'鞋子',acc:'飾品'};
const CARD_SLOTS:Record<string,string>={weapon:'武器',armor:'盔甲',shield:'盾牌',garment:'披肩',shoes:'鞋子',accessory:'飾品',headgear:'頭飾'};
const cardSlot=(card:Card)=>CARD_SLOTS[card.equipSlot||'']||card.equipSlot||'部位未確認';
const STAGE_TYPES:[StageType,string][]=[['all','全部'],['normal','一般遠征'],['event','活動關卡'],['story','劇情關卡']];
function equipmentJobs(data:Catalog):[string,string][]{
 const ids=new Set(data.items.flatMap(item=>item.jobs));
 return [['all','全部'],...data.lapRules.jobs.filter(job=>ids.has(job.id)).map(job=>[job.id,job.name] as [string,string])];
}
const SOURCES:Record<string,string>={monsterDrop:'怪物掉落',bossDrop:'Boss 掉落',story:'劇情',event:'活動',reward:'獎勵',starter:'初始裝備',raid:'團隊遠征副本'};
const LABELS:Record<Page,string>={items:'裝備',cards:'卡片',stages:'關卡',skills:'技能',talents:'天賦',balance:'平衡紀錄'};
// HANS-only. All artwork is loaded by reference from the HANS image host;
// the public repository and Pages artifact never contain game image files.
const PUBLIC_MODE=import.meta.env.VITE_PUBLIC_MODE==='1';
const ASSET_ROOT='https://ro.hans-webgametw.com/assets/';
const EMPTY:View={page:'items',slot:'all',job:'all',source:'all',query:'',attr:'all',mode:'list',stageType:'all',stageChapter:'all',lap:1,gsJob:'swordsman',showUnknown:false,detail:null,stage:null,tj:'swordsman',tb:'',t:'',skillJob:'all',skillRank:0,skillId:null};
function readLocation():View{
 const q=new URLSearchParams(location.search);
 const page=q.get('page')||(q.has('t')?'talents':'items');
 const legacyEffect:Record<string,string>={cooldown:'cooldown',crit:'crit',damage:'damage',defense:'armor',hp:'hp'};
 return {page:(Object.prototype.hasOwnProperty.call(LABELS,page)?page:'items') as Page,slot:q.get('slot')||'all',job:q.get('job')||'all',
 source:q.get('source')||'all',query:q.get('q')||'',attr:q.get('attr')||legacyEffect[q.get('effect')||'']||'all',mode:q.get('mode')==='stages'?'stages':page==='cards'&&q.get('mode')==='gs'?'gs':'list',stageType:parseStageType(q.get('sg'),q.get('open')),stageChapter:parseStageChapter(q.get('ch')),lap:clampLap(Number(q.get('lap')||1)),gsJob:q.get('gsjob')||'swordsman',showUnknown:q.get('unknown')==='1',detail:q.get('detail')||null,stage:q.get('stage')||null,tj:q.get('tj')||'swordsman',tb:q.get('tb')||'',t:q.get('t')||'',skillJob:q.get('sj')||'all',skillRank:[0,1,2,3].includes(Number(q.get('sr')))?Number(q.get('sr')):0,skillId:q.get('sk')||null};
}
function pathFor(v:View){
 const q=new URLSearchParams();
 if(v.page!=='items')q.set('page',v.page);
 if(v.slot!=='all')q.set('slot',v.slot);
 if(v.job!=='all')q.set('job',v.job);
 if(v.source!=='all')q.set('source',v.source);
 if(v.query.trim())q.set('q',v.query.trim());
 if(v.attr!=='all')q.set('attr',v.attr);
 if(v.mode==='stages')q.set('mode','stages');
 if(v.page==='cards'&&v.mode==='gs')q.set('mode','gs');
 if(v.stageType!=='all')q.set('sg',v.stageType);
 if(v.stageChapter!=='all')q.set('ch',v.stageChapter);
 if(v.lap!==1)q.set('lap',String(v.lap));
 if(v.gsJob!=='swordsman'&&v.page==='cards')q.set('gsjob',v.gsJob);
 if(v.showUnknown)q.set('unknown','1');
 if(v.detail)q.set('detail',v.detail);
 if(v.stage)q.set('stage',v.stage);
 if(v.page==='talents'){if(v.t)q.set('t',v.t);else{if(v.tj!=='swordsman')q.set('tj',v.tj);if(v.tb)q.set('tb',v.tb);}}
 if(v.page==='skills'){if(v.skillJob!=='all')q.set('sj',v.skillJob);if(v.skillRank!==0)q.set('sr',String(v.skillRank));if(v.skillId)q.set('sk',v.skillId);}
 return location.pathname+(q.size?'?'+q.toString():'');
}
function Chip({active,children,onClick}:{active:boolean;children:React.ReactNode;onClick:()=>void}){
 return <button type="button" className={'chip '+(active?'selected':'')} aria-pressed={active} onClick={onClick}>{children}</button>;
}
function LapPicker({rules,lap,setLap}:{rules:LapRules;lap:number;setLap:(lap:number)=>void}){
 return <div className="lap-picker" role="group" aria-label="選擇週目">
  <div className="filter-label">週目</div>
  <div className="chips">{rules.labels.map((label,index)=><Chip key={index} active={lap===index+1} onClick={()=>setLap(index+1)}>{label}</Chip>)}</div>
 </div>;
}
function safeImageUrl(x:ImageEvidence|null|undefined):string|null{
 if(!x || !/^(items|cards)\/[a-zA-Z0-9_-]+(?:_art)?\.png$/.test(x.officialPath))return null;
 return ASSET_ROOT+x.officialPath;
}
function StageArtwork({stage}:{stage:Stage}){
 const src=stage.image?.officialPath;
 const url=src&&/^maps\/[a-z0-9_]+\/minimap\.png$/.test(src)?ASSET_ROOT+src:null;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[url]);
 return <span className="art stage">{url&&!failed?
  <img className="stage-map-image" src={url} alt={stage.name+'地圖縮圖'} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:
  <MapIcon size={26} strokeWidth={1.7}/>}</span>;
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
 const frame=null as Monster['spriteFrame']|null;
 const edge=large?112:58;
 const scale=frame?Math.min((edge-8)/frame.width,(edge-8)/frame.height,large?1.5:1):1;
 return <span className={'art '+kind+(large?' large':'')}>
  {imageUrl?<img loading={large?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" src={imageUrl} alt={entity?.name||'裝備圖片'}
   className={kind==='card'?'card-image':kind==='monster'?'art-image':item?.image?.officialPath?.endsWith('_art.png')?'art-image':'art-icon-image'}
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
function TierTag({item,stages}:{item:Equipment;stages:Map<string,Stage>}){
 const tier=equipmentTier(item,stages);
 return <span className={'tier-chip '+tier.status} title="此處為取得關卡的 Tier；同一裝備可能有不同 Tier">{tier.text}</span>;
}
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
function matchesSource(s:Source,filter:string,stages:Map<string,Stage>,stageId?:string){
 if(filter==='all')return true;
 if(s.verificationState!=='official')return false;
 if(s.sourceType!=='monsterDrop')return s.sourceType===filter;
 return s.stageRefs.some(ref=>ref.verified&&(!stageId||ref.stageId===stageId)&&
  (filter==='bossDrop'?ref.boss:filter==='monsterDrop'?!ref.boss:filter==='event'&&stages.get(ref.stageId)?.season));
}
function App(){
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [error,setError]=useState('');
 const [state,setState]=useState<View>(readLocation);
 const [visibleCount,setVisibleCount]=useState(40);
 const [showFilters,setShowFilters]=useState(false);
 const detailTriggerRef=useRef<HTMLElement|null>(null);
 const detailCloseRef=useRef<HTMLButtonElement|null>(null);
 const focusedStage=state.stage;
 useEffect(()=>{
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+'data/catalog.json?schema=2',{signal:ac.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()}).then(d=>{if(d.server!=='hans'||d.schemaVersion!==2||d.lapRules?.max!==6)throw Error('HANS 資料版本不相容');setCatalog(d as Catalog)}).catch(e=>{if(e.name!=='AbortError')setError('資料載入失敗，請重新整理。')});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{
  if(!history.state)history.replaceState({scroll:0},'',location.href);
  const pop=()=>{setState(readLocation());requestAnimationFrame(()=>scrollTo(0,history.state?.scroll||0));};
  window.addEventListener('popstate',pop);return ()=>window.removeEventListener('popstate',pop);
 },[]);
 useEffect(()=>{document.body.style.overflow=state.detail?'hidden':'';return ()=>{document.body.style.overflow='';};},[state.detail]);
 useEffect(()=>setVisibleCount(40),[state.page,state.slot,state.job,state.source,state.query,state.attr,state.mode,state.stageType,state.stageChapter,state.showUnknown,state.lap,state.gsJob]);
 const navigate=useCallback((patch:Partial<View>,top=false,replace=false)=>{
  const next={...state,...patch};
  history.replaceState({...history.state,scroll:scrollY},'',location.href);
  const url=pathFor(next);
  if(replace)history.replaceState({scroll:scrollY,detailParent:next.detail?history.state?.detailParent:false},'',url);
  else history.pushState({scroll:top?0:scrollY,detailParent:!!next.detail},'',url);
  setState(next);
  if(top)scrollTo({top:0,behavior:'instant'});
 },[state]);
 const stages=useMemo(()=>new Map((catalog?.stages||[]).map(x=>[x.id,x])),[catalog]);
 const monsters=useMemo(()=>new Map((catalog?.monsters||[]).map(x=>[x.id,x])),[catalog]);
 const items=useMemo(()=>new Map((catalog?.items||[]).map(x=>[x.id,x])),[catalog]);
 const cards=useMemo(()=>new Map((catalog?.cards||[]).map(x=>[x.id,x])),[catalog]);
 const openDetail=(kind:Kind,id:string|number)=>{
  if(kind!=='stage'&&document.activeElement instanceof HTMLElement&&!document.activeElement.closest('.sheet'))
   detailTriggerRef.current=document.activeElement;
  if(kind==='stage'){
   navigate({...EMPTY,page:'stages',stage:String(id),stageChapter:String(stages.get(String(id))?.chapter||'all') as StageChapter,lap:state.lap,gsJob:state.gsJob},true);
   return;
  }
  navigate({detail:kind+':'+id});
 };
 const closeDetail=()=>navigate({detail:null},false,true);
 const backFromDetail=()=>{if(history.state?.detailParent)history.back();else closeDetail();};
 useEffect(()=>{
  if(!state.detail||!catalog)return;
  const sheet=document.querySelector<HTMLElement>('.sheet');
  if(!sheet)return;
  detailCloseRef.current?.focus({preventScroll:true});
  const onDialogKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){
    event.preventDefault();
    detailCloseRef.current?.click();
    return;
   }
   if(event.key!=='Tab')return;
   const focusable=Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
    .filter(element=>element.getClientRects().length>0);
   if(!focusable.length){event.preventDefault();sheet.focus();return}
   const first=focusable[0],last=focusable[focusable.length-1],current=document.activeElement;
   if(event.shiftKey&&(current===first||!sheet.contains(current))){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&(current===last||!sheet.contains(current))){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onDialogKey);
  return ()=>{
   document.removeEventListener('keydown',onDialogKey);
   if(!document.querySelector('.sheet')&&detailTriggerRef.current?.isConnected)
    detailTriggerRef.current.focus({preventScroll:true});
  };
 },[state.detail,catalog]);
 useEffect(()=>{
  const oldStage=state.detail?.match(/^stage:(.+)$/);
  if(oldStage&&catalog){
   navigate({...EMPTY,page:'stages',stage:oldStage[1],lap:state.lap,gsJob:state.gsJob},true,true);
  }
 },[state.detail,catalog,stages,navigate]);
 const matchingEquip=useMemo(()=>catalog?.items.filter(i=>
  (state.slot==='all'||i.slot===state.slot)&&
  (state.job==='all'||!i.jobs.length||i.jobs.includes(state.job))&&
  (i.sources.some(s=>matchesSource(s,state.source,stages))||state.source==='all')&&
  entryMatches(i,state.query,state.attr)
  )||[],[catalog,state.slot,state.job,state.source,state.query,state.attr,stages]);
 const equip=useMemo(()=>matchingEquip.filter(i=>state.showUnknown||hasConfirmedAcquisition(i)),[matchingEquip,state.showUnknown]);
 const hiddenEquipCount=matchingEquip.length-equip.length;
 const cardList=useMemo(()=>catalog?.cards.filter(c=>(state.slot==='all'||c.equipSlot===state.slot)&&
  (state.source==='raid'?!!c.raid:c.sources.some(s=>matchesSource(s,state.source,stages))||state.source==='all')&&
  entryMatches(c,state.query,state.attr))||[],[catalog,state.slot,state.source,state.query,state.attr,stages]);
 // Score and fully sort the filtered cards before slicing into 40-card pages.
 const rankedCards=useMemo(()=>catalog&&state.page==='cards'&&state.mode==='gs'
  ?rankCardsByGs(cardList,catalog.lapRules,state.lap,state.gsJob):[],
  [catalog,cardList,state.page,state.mode,state.lap,state.gsJob]);
 const rankedScores=useMemo(()=>new Map(rankedCards.map(({card,score})=>[card.id,score])),[rankedCards]);
 const list:GameEntry[]=state.page==='cards'?(state.mode==='gs'?rankedCards.map(({card})=>card):cardList):equip;
 const searchActive=Boolean(state.query.trim()||state.attr!=='all');
 const advancedCount=Number(state.attr!=='all')+Number(state.source!=='all');
 const attributeName=ATTRIBUTE_GROUPS.reduce<string|undefined>((found,group)=>{
  if(found)return found;
  for(const [key,label] of group.options)if(key===state.attr)return label;
  return undefined;
 },undefined);
 const activeAdvancedLabels=[
  state.attr!=='all'?attributeName||state.attr:null,
  state.source!=='all'?SOURCES[state.source]||state.source:null
 ].filter(Boolean).join(' · ');
 const clearSearchFilters=()=>navigate({query:'',slot:'all',job:'all',source:'all',attr:'all'});
 const slotOrder=['acc','weapon','shield','armor','shoes','garment','head_top','head_mid','head_low'];
 const slots=[...new Set(catalog?.items.map(i=>i.slot)||[])].sort((a,b)=>slotOrder.indexOf(a)-slotOrder.indexOf(b));
 const [detailKind,...detailParts]=state.detail?.split(':')||[];
 const detailId=detailParts.join(':');
 const selectedItem=detailKind==='item'?items.get(Number(detailId)):undefined;
 const selectedCard=detailKind==='card'?cards.get(Number(detailId)):undefined;
 const selectedMonster=detailKind==='monster'?monsters.get(detailId):undefined;
 const sourceLine=(entry:GameEntry)=>{
  const refs=entry.sources.filter(s=>s.sourceType==='monsterDrop'&&s.verificationState==='official').flatMap(s=>s.stageRefs.filter(r=>r.verified));
  const names=[...new Set(refs.map(ref=>{
   const stage=stages.get(ref.stageId);
   const boss='slot'in entry?'':ref.boss?'（Boss）':'';
   return (stage?.name||ref.stageId)+boss;
  }))];
  if('raid' in entry&&entry.raid&&!names.length)return '團隊遠征副本';
  if(names.length)return names.slice(0,2).join('、')+(names.length>2?' 等':'');
  const official=entry.sources.find(s=>s.verificationState==='official'&&s.detail);
  if(official)return official.detail!;
  if(entry.sources.length)return '取得方式待確認';
  return '尚無已確認取得管道';
 };
 return <>
  <header className="topbar">
   <div className="top-inner">
    <span className="brand-mark">H</span>
    <span className="brand-names"><strong>RO 倖存者｜HANS 粉絲維基</strong><small>非官方玩家製作 · HANS 專屬{PUBLIC_MODE?'':' · 開發預覽'}</small></span>
    <nav className="bottom-nav" aria-label="主要分類">
     {([['items',Shield],['cards',BookOpen],['stages',MapIcon],['skills',WandSparkles],['talents',GitBranch],['balance',History]] as const).map(([page,Icon])=>
      <button type="button" key={page} className={state.page===page?'active':''} onClick={()=>{if(page!==state.page)navigate({...EMPTY,page,lap:state.lap,gsJob:state.gsJob,showUnknown:state.showUnknown},true)}} aria-current={state.page===page?'page':undefined}><Icon size={21}/><span>{LABELS[page]}</span></button>)}
    </nav>
   </div>
  </header>
  <main className="container">
   <section className="content-section">
    <div className="section-heading"><h1>{LABELS[state.page]}</h1>{state.page!=='talents'&&state.page!=='skills'&&state.page!=='balance'&&<span className="heading-count">
      {state.page==='items'?equip.length:state.page==='cards'?(state.mode==='gs'?rankedCards.length:cardList.length):catalog?.stages.filter(stage=>matchesStageType(stage,state.stageType)&&(state.stageChapter==='all'||String(stage.chapter)===state.stageChapter)).length||0}
     </span>}</div>
    {state.page==='balance'?<BalanceHistory/>:state.page==='talents'?<TalentSimulator jobId={state.tj} token={state.tb} packed={state.t} onRoute={(tj,tb,t,replace=false)=>navigate({tj,tb,t,page:'talents'},false,replace)}/>:state.page==='skills'?<SkillsEncyclopedia jobId={state.skillJob} rank={state.skillRank} query={state.query} selectedId={state.skillId} onChange={(patch,replace=true)=>navigate(patch,false,replace)}/>:<>
    {error&&<div className="empty-state">{error}</div>}
    {!catalog&&!error&&<div className="empty-state">讀取中…</div>}
    {catalog&&<>
     <section className="search-panel">
      <label className="search-field"><Search size={20}/><input aria-label="搜尋裝備、卡片或屬性" placeholder="搜尋裝備、卡片、INT、冷卻…" value={state.query} onChange={e=>navigate({query:e.target.value},false,true)}/>{state.query&&<button type="button" className="search-clear" aria-label="清除搜尋" onClick={()=>navigate({query:''})}><X size={18}/></button>}</label>
      {state.page==='cards'&&catalog&&<LapPicker rules={catalog.lapRules} lap={state.lap} setLap={lap=>navigate({lap})}/>}
      {state.page==='cards'&&<div className="primary-filters"><div className="filter-block" role="group" aria-label="卡片鑲嵌部位"><div className="filter-label">鑲嵌部位</div><div className="chips"><Chip active={state.slot==='all'} onClick={()=>navigate({slot:'all'})}>全部</Chip>{Object.entries(CARD_SLOTS).map(([slot,label])=><Chip key={slot} active={state.slot===slot} onClick={()=>navigate({slot})}>{label}</Chip>)}</div></div></div>}
      {state.page==='items'&&<div className="primary-filters">
       <div className="filter-block" role="group" aria-label="裝備部位"><div className="filter-label">裝備部位</div><div className="chips"><Chip active={state.slot==='all'} onClick={()=>navigate({slot:'all'})}>全部</Chip>{slots.map(slot=><Chip key={slot} active={state.slot===slot} onClick={()=>navigate({slot})}>{SLOTS[slot]||slot}</Chip>)}</div></div>
       <div className="filter-block" role="group" aria-label="職業"><div className="filter-label">職業</div><div className="chips">{equipmentJobs(catalog).map(([job,name])=><Chip key={job} active={state.job===job} onClick={()=>navigate({job})}>{name}</Chip>)}</div></div>
      </div>}
      <div className="search-filter-row">
       <button className="search-more" type="button" aria-expanded={showFilters} aria-controls="advanced-filters" onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={16}/>更多篩選{advancedCount>0?'（'+advancedCount+'）':''}<ChevronDown size={15}/></button>
       {advancedCount>0&&<span className="applied-filters" aria-label="已套用的進階篩選">已套用：{activeAdvancedLabels}</span>}
       {advancedCount>0&&<button className="search-more clear-extra" type="button" onClick={()=>navigate({attr:'all',source:'all'})}>清除進階條件</button>}
      </div>
      {showFilters&&<div className="filter-panel" id="advanced-filters">
       {ATTRIBUTE_GROUPS.map(group=><div key={group.label} className="filter-block"><div className="filter-label">{group.label}</div><div className="chips">{group.options.map(([key,label])=><Chip key={key} active={state.attr===key} onClick={()=>navigate({attr:state.attr===key?'all':key})}>{label}</Chip>)}</div></div>)}
       <div className="filter-block"><div className="filter-label">取得方式</div><div className="chips"><Chip active={state.source==='all'} onClick={()=>navigate({source:'all'})}>全部</Chip>{Object.entries(SOURCES).filter(([v])=>state.page==='items'||['monsterDrop','bossDrop','event','raid'].includes(v)).map(([v,name])=><Chip key={v} active={state.source===v} onClick={()=>navigate({source:v})}>{name}</Chip>)}</div></div>
       <button className="search-more" type="button" onClick={()=>{navigate({query:'',attr:'all',slot:'all',job:'all',source:'all'});setShowFilters(false)}}>清除所有篩選</button>
      </div>}
     </section>
     {(state.page==='items'||state.page==='cards')&&<>
      <div className="results-toolbar">
       <div className={'segment'+(state.page==='cards'?' card-view-tabs':'')} role="group" aria-label="瀏覽方式">
         <button type="button" aria-pressed={state.mode==='list'} className={state.mode==='list'?'on':''} onClick={()=>navigate({mode:'list'})}>依{state.page==='items'?'裝備':'卡片'}看</button>
         <button type="button" aria-pressed={state.mode==='stages'} className={state.mode==='stages'?'on':''} onClick={()=>navigate({mode:'stages'})}>依關卡看</button>
         {state.page==='cards'&&<button type="button" aria-pressed={state.mode==='gs'} className={state.mode==='gs'?'on':''} onClick={()=>navigate({mode:'gs'})}>GS 排行</button>}
        </div>

       </div>
       {state.page==='cards'&&state.mode==='gs'&&<div className="gs-ranking-panel">
         <div className="gs-ranking-heading"><strong>卡片 GS 貢獻排行</strong><span>依卡片對裝備 GS 的貢獻由高至低排列</span></div>
         <div className="gs-class-options" role="group" aria-label="GS 排行計算類型">
          {[GS_SCALING_LABELS[0],GS_SCALING_LABELS[2],GS_SCALING_LABELS[1]].filter(item=>Object.hasOwn(catalog.lapRules.scoring.classes,item.id)).map(item=>{
           const representative=gsRepresentativeJob(catalog.lapRules,item.id);
           return <button type="button" key={item.id} className={'gs-class-choice'+(gsScalingForJob(catalog.lapRules,state.gsJob)===item.id?' selected':'')}
            disabled={!representative} aria-pressed={gsScalingForJob(catalog.lapRules,state.gsJob)===item.id}
            onClick={()=>{if(representative)navigate({gsJob:representative})}}>{item.label}</button>;
          })}
         </div>
         {!gsScalingForJob(catalog.lapRules,state.gsJob)&&<p className="gs-unknown">原分享連結的職業不再有效，請選擇計算類型。</p>}
         <p className="card-gs-note">分數沿用 HANS 既有權重推算，並非整套裝備 GS；仍待遊戲面板校準。</p>
        </div>}
        {state.page==='items'&&<div className="source-visibility"><label className="toggle"><input type="checkbox" checked={state.showUnknown} onChange={e=>navigate({showUnknown:e.target.checked})}/>顯示取得方式未確認的裝備</label><small>{state.showUnknown?'已包含未確認資料':hiddenEquipCount>0?'已隱藏 '+hiddenEquipCount+' 件未核實裝備':'目前沒有被隱藏的裝備'}</small></div>}
      {state.mode!=='stages'?<div className="cards-list">
       {list.slice(0,visibleCount).map(entry=><button className={'result-card'+(state.mode==='gs'?' ranked-card':'')} key={entry.id} onClick={()=>openDetail(state.page==='items'?'item':'card',entry.id)}>
        <Artwork kind={state.page==='items'?'item':'card'} entity={entry}/>
        <span className="result-main"><strong>{'slot'in entry?entry.name:cardName(entry,catalog.lapRules,state.lap)}</strong><span className="result-sub">
         <span>{'slot'in entry?(SLOTS[entry.slot]||entry.slot):'卡片｜'+cardSlot(entry)}</span>
         {'slot'in entry&&<TierTag item={entry} stages={stages}/>}
         <span>{'slot'in entry?matchedEffect(entry,state.query,state.attr)||shortStats(entry,3):cardEffects(entry,catalog.lapRules,state.lap).slice(0,3).join(' · ')}</span>
        </span><small className="result-place">{sourceLine(entry)}</small></span>{state.mode==='gs'&&state.page==='cards'?<span className="ranking-score" aria-label={'卡片 GS 貢獻 +'+rankedScores.get(entry.id)+' GS'}>+{rankedScores.get(entry.id)}<small>GS</small></span>:<ChevronRight className="list-arrow" size={18}/>}
       </button>)}
       {list.length>visibleCount&&<button type="button" className="load-more" onClick={()=>setVisibleCount(v=>v+40)}>顯示更多（還有 {list.length-visibleCount} 件）</button>}
       {!list.length&&<div className="search-empty-recovery"><EmptyState>{state.mode==='gs'&&state.page==='cards'
         ?(cardList.length?(state.source==='raid'&&cardList.some(isRaidOnlyCard)?'純副本版卡片目前不計入 GS 排行。':'目前篩選沒有可計分的卡片。'):'目前沒有符合篩選條件的卡片。')
         :hiddenEquipCount>0&&state.page==='items'?'找到的裝備目前沒有核實取得方式，可勾選上方選項查看。':'沒有符合條件的裝備或卡片'}</EmptyState>
        <button type="button" className="search-more" onClick={clearSearchFilters}>清除搜尋與篩選</button>
         {state.mode==='gs'&&<button type="button" className="search-more" onClick={()=>navigate({mode:'list'})}>回依卡片看</button>}
       </div>}
      </div>:<StageBrowser key={state.page} data={catalog} initialKind={state.page==='cards'?'card':'item'} query={state.query} attr={state.attr} stageType={state.stageType} stageChapter={state.stageChapter} onChapterChange={stageChapter=>navigate({stageChapter,stage:null})} onStageTypeChange={stageType=>navigate({stageType,stage:null})} focusedStage={focusedStage} openDetail={openDetail} slot={state.slot} job={state.page==='items'?state.job:'all'} source={state.source} showUnknown={state.showUnknown} lap={state.lap} setLap={lap=>navigate({lap})}/>}
      {state.mode==='list'&&searchActive&&<section className="search-extra">
       <h2 className="search-subtitle">其他{state.page==='items'?'卡片':'裝備'}結果（{state.page==='items'?cardList.length:equip.length}）</h2>
       <div className="cards-list">{(state.page==='items'?cardList:equip).slice(0,40).map(entry=><button key={entry.id} className="result-card" onClick={()=>openDetail('slot'in entry?'item':'card',entry.id)}>
        <Artwork kind={'slot'in entry?'item':'card'} entity={entry}/>
        <span className="result-main"><strong>{'slot'in entry?entry.name:cardName(entry,catalog.lapRules,state.lap)}</strong><span className="result-sub">{'slot'in entry?<TierTag item={entry} stages={stages}/>:<span>卡片｜{cardSlot(entry)}</span>}<span>{'slot'in entry?matchedEffect(entry,state.query,state.attr)||shortStats(entry,2):cardEffects(entry,catalog.lapRules,state.lap).slice(0,2).join(' · ')}</span></span><small className="result-place">{sourceLine(entry)}</small></span><ChevronRight size={18}/>
       </button>)}{(state.page==='items'?cardList:equip).length>40&&<button className="load-more" type="button" onClick={()=>navigate({page:state.page==='items'?'cards':'items',mode:'list'},true)}>查看更多{state.page==='items'?'卡片':'裝備'}</button>}</div>
      </section>}
     </>}
     {state.page==='stages'&&<GameNotes cards={catalog.cards} openCard={id=>openDetail('card',id)}/>}
     {state.page==='stages'&&<StageBrowser data={catalog} query={state.query} attr={state.attr} stageType={state.stageType} stageChapter={state.stageChapter} onChapterChange={stageChapter=>navigate({stageChapter,stage:null})} onStageTypeChange={stageType=>navigate({stageType,stage:null})} focusedStage={focusedStage} openDetail={openDetail} source={state.source} lap={state.lap} setLap={lap=>navigate({lap})}/>}
    </>}
    </>}
   </section>
  </main>
  <SiteFooter publicMode={PUBLIC_MODE}/>
  {state.detail&&catalog&&<div className="sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail()}}>
   <section className="sheet" role="dialog" aria-modal="true" aria-label="詳細資訊"><div className="sheet-grab"/>
    <div className="sheet-head"><button className="back-button" onClick={backFromDetail}><ArrowLeft size={19}/>返回</button><button ref={detailCloseRef} className="icon-button" aria-label="關閉" onClick={closeDetail}><X size={19}/></button></div>
    <div className="sheet-body">
     {selectedItem&&<EquipmentDetail item={selectedItem} rules={catalog.lapRules} lap={state.lap} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedCard&&<CardDetail card={selectedCard} rules={catalog.lapRules} lap={state.lap} setLap={lap=>navigate({lap},false,true)} gsJob={state.gsJob} setGsJob={gsJob=>navigate({gsJob},false,true)} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedMonster&&<MonsterDetail monster={selectedMonster} data={catalog} stages={stages} openDetail={openDetail}/>}
      {!selectedItem&&!selectedCard&&!selectedMonster&&<EmptyState>找不到這筆資料</EmptyState>}
    </div>
   </section>
  </div>}
 </>;
}
function StageBrowser({data,query,attr,stageType,onStageTypeChange,stageChapter,onChapterChange,focusedStage,openDetail,lap,setLap,slot='all',job='all',source='all',showUnknown=false,initialKind='all'}:{
 data:Catalog;query:string;attr:string;stageType:StageType;onStageTypeChange:(value:StageType)=>void;stageChapter:StageChapter;onChapterChange:(value:StageChapter)=>void;lap:number;setLap:(lap:number)=>void;focusedStage:string|null;
 openDetail:(kind:Kind,id:string|number)=>void;slot?:string;job?:string;source?:string;showUnknown?:boolean;initialKind?:'all'|'item'|'card';
}){
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
 const [kind,setKind]=useState(initialKind);
 const [localSlot,setLocalSlot]=useState(slot);
 const [localJob,setLocalJob]=useState(job);
 const [localAttr,setLocalAttr]=useState('all');
 const monsterMap=useMemo(()=>new Map(data.monsters.map(m=>[m.id,m])),[data]);
 const stageMap=useMemo(()=>new Map(data.stages.map(stage=>[stage.id,stage])),[data]);
 useEffect(()=>{
  if(!focusedStage)return;
  setExpanded(prev=>new Set([...prev,focusedStage]));
  const frame=requestAnimationFrame(()=>document.getElementById('stage-heading-'+focusedStage)?.scrollIntoView({block:'start'}));
  return ()=>cancelAnimationFrame(frame);
 },[focusedStage]);
 useEffect(()=>{setLocalSlot(slot);setLocalJob(job)},[slot,job]);
 const chapterGroups=stageChapterGroups(data.stages,stageChapter,s=>matchesStageType(s,stageType));
 const visible=chapterGroups.flatMap(group=>group.stages);
 const eligible=(row:ReturnType<typeof stageRows>[number],stageId:string)=>{
   if(kind!=='all'&&row.kind!==kind)return false;
   if(row.source.verificationState!=='official'&&!showUnknown)return false;
   if(!matchesSource(row.source,source,stageMap,stageId))return false;
   if(!entryMatches(row.item,query,attr)||!entryMatches(row.item,'',localAttr))return false;
  if(row.kind==='item'){
   const item=row.item as Equipment;
   return (showUnknown||hasConfirmedAcquisition(item))&&(localSlot==='all'||item.slot===localSlot)&&(localJob==='all'||!item.jobs.length||item.jobs.includes(localJob));
  }
  return (localSlot==='all'||(row.item as Card).equipSlot===localSlot)&&localJob==='all';
 };
 return <div className="stage-accordion" aria-label="可收合關卡掉落">
  <div className="stage-chapter-picker" role="group" aria-label="選擇章節">
   <span className="filter-label">章節</span>
   <div className="chips">{([['all','全部章節'],['2','第二章'],['1','第一章']] as [StageChapter,string][]).map(([value,label])=>
    <Chip key={value} active={stageChapter===value} onClick={()=>onChapterChange(value)}>{label}（{value==='all'?data.stages.length:data.stages.filter(stage=>String(stage.chapter)===value).length}）</Chip>)}</div>
  </div>
  <div className="stage-type-picker" role="group" aria-label="關卡類別">
   <span className="filter-label">關卡類別</span>
   <div className="chips">{STAGE_TYPES.map(([value,label])=><Chip key={value} active={stageType===value} onClick={()=>onStageTypeChange(value)}>{label}</Chip>)}</div>
  </div>
  <LapPicker rules={data.lapRules} lap={lap} setLap={setLap}/>
  <div className="stage-view-toolbar"><span className="search-hint">目前顯示 {visible.length} 個關卡</span><div className="stage-expansion-actions"><button type="button" className="search-more" onClick={()=>setExpanded(new Set(visible.map(s=>s.id)))}>全部展開</button><button type="button" className="search-more" onClick={()=>setExpanded(new Set())}>全部收合</button></div></div>
  {chapterGroups.map(group=><section className="stage-chapter-section" aria-label={(group.chapter===2?'第二章':'第一章')+'關卡'} key={group.chapter}>
   <div className="stage-chapter-heading"><h2>{group.chapter===2?'第二章':'第一章'}</h2><span>{group.stages.length} 個關卡</span><small>{group.chapter===2?'Lv 71–99 · 裝備 Tier 依週目 T6–T8':'依 HANS 實際關卡與週目資料'}</small></div>
   {group.chapter===2&&<p className="stage-lap-note">帳號任一角色擊敗第一章三週目「迷宮森林・改²」的 MVP 後解鎖。第二章有獨立週目，組隊時所有隊員的帳號都須解鎖欲挑戰的週目。</p>}
   {group.stages.map(stage=>{
   const rows=stageRows(data,stage.id).filter(row=>eligible(row,stage.id));
   const opened=expanded.has(stage.id);
   return <section className="stage-entry" key={stage.id}>
    <button type="button" className="stage-heading" id={'stage-heading-'+stage.id} aria-expanded={opened} aria-controls={'stage-'+stage.id} onClick={()=>setExpanded(previous=>{const next=new Set(previous);if(next.has(stage.id))next.delete(stage.id);else next.add(stage.id);return next})}>
     <StageArtwork stage={stage}/>
     <span className="result-main"><strong>{stage.name}</strong><small>{stageLapInfo(stage,lap)?stageTierLabel(stage,lap)+' · GS '+stageLapInfo(stage,lap)!.gs+' · ':stageTierLabel(stage,lap)+' · '}Lv {stage.levels}{stage.season?' · 活動':stage.story?' · 劇情':''} · {rows.filter(r=>r.source.verificationState==='official').length} 筆掉落{rows.some(r=>r.source.verificationState!=='official')?' · '+rows.filter(r=>r.source.verificationState!=='official').length+' 筆待核關聯':''}</small></span>
     <ChevronDown size={20} style={{transform:opened?'rotate(180deg)':undefined}}/>
    </button>
    {opened&&<div id={'stage-'+stage.id} className="stage-body">
     <p className="stage-lap-note">{stageLapInfo(stage,lap)?'第'+lap+'週目：'+stageTierLabel(stage,lap)+(stage.chapter===1?data.lapRules.suffix[lap-1]:'')+' 裝備、'+data.lapRules.suffix[lap-1]+'卡片。GS '+stageLapInfo(stage,lap)!.gs+' 為入場門檻；實際裝備品質、詞綴與精煉仍為隨機。':'此關卡沒有該週目的遠征設定，不能將下列掉落當作該週目可取得。'}</p>
     <FestivalNotes id={stage.id}/>
     <div className="stage-encounters">
      {([['一般怪物',stage.normalMonsterIds],['Boss',stage.bossMonsterIds]] as const).map(([label,ids])=><div className="stage-encounter-group" key={label}>
       <strong>{label}（{ids.length}）</strong>
       <div className="stage-monster-chips">{ids.map(id=><button key={id} type="button" onClick={()=>openDetail('monster',id)}>
        {monsterMap.get(id)?.name||id}{stage.intruderBossId===id?' · 闖入 Boss':''}
       </button>)}</div>
      </div>)}
     </div>
     <div className="search-filter-row">
      {([['all','全部'],['item','裝備'],['card','卡片']] as const).map(([value,label])=><Chip key={value} active={kind===value} onClick={()=>{setKind(value);if(value==='card'){setLocalSlot('all');setLocalJob('all')}}}>{label}</Chip>)}
     </div>
     <div className="stage-controls">
       {kind==='card'?<label>鑲嵌部位<select aria-label="關卡卡片部位" value={localSlot} onChange={e=>setLocalSlot(e.target.value)}><option value="all">全部部位</option>{Object.entries(CARD_SLOTS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>:
        <><label>部位<select aria-label="關卡部位" value={localSlot} onChange={e=>setLocalSlot(e.target.value)}><option value="all">全部部位</option>{Object.entries(SLOTS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
        <label>職業<select aria-label="關卡職業" value={localJob} onChange={e=>setLocalJob(e.target.value)}>{equipmentJobs(data).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label></>}
      <label>屬性<select aria-label="關卡屬性" value={localAttr} onChange={e=>setLocalAttr(e.target.value)}><option value="all">全部屬性</option>{ATTRIBUTE_GROUPS.map(group=><optgroup key={group.label} label={group.label}>{group.options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</optgroup>)}</select></label>
     </div>
     {rows.length?<div className="compact-results">{rows.map((row,i)=><button type="button" className="compact-item" key={row.kind+'-'+row.item.id+'-'+row.source.monsterId+'-'+i} onClick={()=>openDetail(row.kind,row.item.id)}>
      <Artwork kind={row.kind} entity={row.item}/>
      <span className="compact-copy"><b>{row.kind==='item'?row.item.name:cardName(row.item as Card,data.lapRules,lap)}</b><small>{row.kind==='item'?stageTierLabel(stage,lap)+' · ':'卡片｜'+cardSlot(row.item as Card)+' · '}{row.source.verificationState!=='official'?'未確認掉卡 · ':''}{row.kind==='item'?(matchedEffect(row.item,query,localAttr!=='all'?localAttr:attr)||shortStats(row.item,3)):cardEffects(row.item as Card,data.lapRules,lap).slice(0,3).join(' · ')}</small><small>{row.boss?(stage.intruderBossId===row.source.monsterId?'闖入 Boss · ':'Boss · '):''}{sourceMonsterName(row.source,monsterMap)||'怪物未知'}</small></span><ChevronRight size={16}/>
     </button>)}</div>:<div className="stage-no-results">這個關卡沒有符合條件的掉落物</div>}
    </div>}
   </section>;
  })}
  </section>)}
  {!visible.length&&<EmptyState>沒有符合條件的關卡</EmptyState>}
 </div>;
}
function EmptyState({children}:{children:React.ReactNode}){return <div className="empty-state">{children}</div>;}
function DropRoutes({sources,stages,monsters,openDetail}:{sources:Source[];stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 if(!sources.length)return <EmptyState>尚無取得資訊</EmptyState>;
 return <div className="route-list">{sources.map((s,i)=><div className="route" key={i}>
   <div className="route-top"><strong>{s.sourceType==='monsterDrop'?(s.verificationState!=='official'?'取得方式待確認':s.stageRefs.every(ref=>ref.boss)?'Boss 掉落':'怪物掉落'):SOURCES[s.sourceType]||s.sourceType}</strong></div>
  {s.detail&&<p className="source-detail">{s.detail}{Number.isInteger(s.sourceTier)?' · Tier '+s.sourceTier:''}</p>}
  {s.monsterId&&<button onClick={()=>openDetail('monster',s.monsterId!)}><Target size={16}/><span>{sourceMonsterName(s,monsters)}</span><ChevronRight size={16}/></button>}
   {s.stageRefs.map(r=>{
    const stage=stages.get(r.stageId);
    const boss=r.boss?(stage?.intruderBossId===s.monsterId?' · 闖入 Boss':' · Boss'):'';
    return <button key={r.stageId} onClick={()=>openDetail('stage',r.stageId)}><MapIcon size={16}/><span>{stage?.name||r.stageId}{stage?.season?'（活動）':''}{boss}</span><ChevronRight size={16}/></button>;
   })}
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
function EquipmentDetail({item,rules,lap,stages,monsters,openDetail}:{item:Equipment;rules:LapRules;lap:number;stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 const tier=equipmentTier(item,stages);
 return <><DetailHero kind="item" entry={item} title={item.name} sub={(SLOTS[item.slot]||item.slot)+' · '+tier.text}/>
  <p className="tier-note">HANS 裝備等級：目前選擇第 {lap} 週目。Tier 依取得關卡與週目決定；下方固定效果不代表隨機品質、詞綴、精煉或升星後的最終數值，也不顯示不可靠的固定 GS。</p>
  <StatSection entry={item}/>
  {item.jobs.length>0&&<><h3 className="sheet-section">可用職業</h3><div className="bonus-list">{item.jobs.map(j=><span key={j}>{rules.jobs.find(job=>job.id===j)?.name||'職業名稱待確認'}</span>)}</div></>}
  <h3 className="sheet-section">取得方式</h3><DropRoutes sources={item.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function CardDetail({card,rules,lap,setLap,gsJob,setGsJob,stages,monsters,openDetail}:{
 card:Card;rules:LapRules;lap:number;setLap:(lap:number)=>void;gsJob:string;setGsJob:(job:string)=>void;
 stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void;
}){
 const raidOnly=isRaidOnlyCard(card);
 const score=raidOnly?null:cardScore(card,rules,lap,gsJob);
 const selectedScaling=gsScalingForJob(rules,gsJob);
 const mult=cardMultiplier(card,rules,lap);
 return <><DetailHero kind="card" entry={card} title={cardName(card,rules,lap)} sub={'鑲嵌部位：'+cardSlot(card)}/>
  {!raidOnly&&<>
  <div className="lap-detail"><LapPicker rules={rules} lap={lap} setLap={setLap}/>
   <div className="lap-meta">卡片 ID：{cardId(card,rules,lap)} · 效果倍率 ×{mult}{rules.noScaleCardIds.includes(card.id)?'（特殊卡片不放大）':''}</div>
  </div>
  <h3 className="sheet-section">此週目卡片效果</h3>
  <div className="bonus-list">{cardEffects(card,rules,lap).map((value,index)=><span key={index}>{value}</span>)}</div>
  <div className="card-gs-section">
   <div className="card-gs-title"><h3>卡片 GS 貢獻</h3><strong>{score==null?'尚未確認':'+'+score+' GS'}</strong></div>
   <div className="gs-class-picker" role="group" aria-label="卡片 GS 計算類型">
    <span className="gs-class-label">計算類型</span>
    <div className="gs-class-options">
     {GS_SCALING_LABELS.filter(item=>Object.hasOwn(rules.scoring.classes,item.id)).map(item=>{
      const representative=gsRepresentativeJob(rules,item.id);
      return <button type="button" key={item.id} className={'gs-class-choice'+(selectedScaling===item.id?' selected':'')}
       disabled={!representative} aria-pressed={selectedScaling===item.id}
       onClick={()=>{if(representative)setGsJob(representative)}}>{item.label}</button>;
     })}
    </div>
    {!selectedScaling&&<p className="gs-unknown">原分享連結的職業已不在目前資料中，請選擇計算類型。</p>}
   </div>
   <p className="card-gs-note">目前 HANS 僅使用近戰、魔法、遠程三組卡片 GS 權重，同類型轉職計算結果相同；分數依效果權重及小王／MVP 保底公式推算，僅代表卡片對裝備 GS 的貢獻，非整套裝備 GS。尚待遊戲面板實測校準。</p>
  </div>
  </>}
  {card.raid&&<><h3 className="sheet-section">副本卡片效果（×{card.raid.mult}）</h3>
   <div className="bonus-list">{cardEffects(card,rules,lap,card.raid.mult).map((value,index)=><span key={index}>{value}</span>)}</div>
   <p className="card-gs-note">可於首通對應副本後用遠征勳章兌換。個別副本的掉落與兌換需求以遊戲內為準。</p>
  </>}
  <h3 className="sheet-section">取得方式</h3>
  <DropRoutes sources={card.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function MonsterDetail({monster,data,stages,openDetail}:{monster:Monster;data:Catalog;stages:Map<string,Stage>;openDetail:(kind:Kind,id:string|number)=>void}){
 const results=[...data.items,...data.cards].flatMap((entry)=>{
  const kind:'item'|'card'='slot'in entry?'item':'card';
  return entry.sources.filter(s=>s.monsterId===monster.id).map(s=>({entry,kind,source:s}));
 });
 return <><DetailHero kind="monster" entry={monster} title={monster.name} sub={monster.boss?'Boss':'怪物'}/>
  <h3 className="sheet-section">出現關卡</h3><div className="sub-list">{monster.stages.length===0&&<p className="source-detail">一般遠征的出現關卡尚未登錄。</p>}{monster.stages.map(s=><button key={s.id} onClick={()=>openDetail('stage',s.id)}><MapIcon size={18}/><span>{stages.get(s.id)?.name||s.id}{s.boss?' · Boss':''}</span><ChevronRight size={16}/></button>)}</div>
  <h3 className="sheet-section">裝備掉落與卡片關聯</h3><div className="stage-loot-list">{results.map((r,i)=><button key={r.entry.id+'-'+i} className="loot-row" onClick={()=>openDetail(r.kind,r.entry.id)}><Artwork kind={r.kind} entity={r.entry}/><span className="loot-copy"><b>{r.entry.name}</b><small>{r.source.verificationState==='official'?'':'取得待確認 · '}{r.kind==='item'?equipmentTier(r.entry as Equipment,stages).text+' · ':''}{shortStats(r.entry,3)}</small></span><ChevronRight size={16}/></button>)}</div>
  {!results.length&&<EmptyState>目前沒有已收錄掉落物品</EmptyState>}
 </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
