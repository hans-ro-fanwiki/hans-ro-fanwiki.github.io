import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,BookOpen,Calculator,ChevronDown,ChevronRight,Gem,GitBranch,History,Map as MapIcon,MessageSquarePlus,Search,Shield,SlidersHorizontal,Swords,Target,WandSparkles,X} from 'lucide-react';
import type {Card,Catalog,Equipment,ImageEvidence,Kind,Monster,Page,Source,Stage} from './types';
import './styles.css';
import './search.css';
import './wiki-theme.css';
import './dark.css';
import {ATTRIBUTE_GROUPS,entryMatches,matchedEffect} from './search';
import {matchesStageType,parseStageType} from './stage-type';
import type {StageType} from './stage-type';
import {parseStageChapter,stageChapterGroups} from './stage-chapter';
import type {StageChapter} from './stage-chapter';
import {SiteFooter} from './SiteFooter';
import {TalentSimulator} from './TalentSimulator';
import {SkillsEncyclopedia} from './SkillsEncyclopedia';
import {CombatGuide} from './CombatGuide';
import {BalanceHistory} from './BalanceHistory';
import {equipmentTier,equipmentTierOptions,equipmentMatchesTier,parseTierFilter,TIER_FILTER_OPTIONS} from './tier';
import {equipmentBaseStats,fixedEquipmentEffects,equipmentAffixPools,equipmentSearchEffects,gearRecord,EQUIPMENT_QUALITIES} from './equipment-stats';
import {hasConfirmedAcquisition} from './acquisition';
import {equipmentMatchesSlot,equipmentUsableBy,normalizeEquipmentSlot,weaponOptions,weaponLabel,isWeaponSubtype,jobFamily} from './weapon-filters';
import {cardEffects,cardId,cardMultiplier,cardName,clampLap,gsRepresentativeJob,gsScalingForJob,GS_SCALING_LABELS,stageLapInfo,stageTierLabel} from './laps';
import type {LapRules} from './types';
import {cardGsContribution,catalogCardVariants,raidCardId,rankCardsByGs} from './card-ranking';
import {FestivalNotes,GameNotes,gameSite} from './game-notes';
import {addRaidSources,parseRaid,raids,raidUrl} from './raids';
import {feedbackUrl} from './feedback';
import './raids.css';
import './experience.css';
import './wiki-layout.css';

const ExperienceCalculator=lazy(()=>import('./ExperienceCalculator').then(module=>({default:module.ExperienceCalculator})));

type View={page:Page;slot:string;job:string;tier:string;source:string;query:string;attr:string;mode:'list'|'stages'|'gs';stageType:StageType;stageChapter:StageChapter;lap:number;gsJob:string;showUnknown:boolean;detail:string|null;stage:string|null;raid:string|null;tj:string;tb:string;t:string;skillJob:string;skillRank:number;skillId:string|null};
type GameEntry=Equipment|Card;
const SLOTS:Record<string,string>={weapon:'武器',head_top:'頭飾（上）',head_mid:'頭飾（中）',head_low:'頭飾（下）',armor:'衣服',shield:'盾牌',garment:'披肩',shoes:'鞋子',acc:'飾品'};
const CARD_SLOTS:Record<string,string>={weapon:'武器',armor:'盔甲',shield:'盾牌',garment:'披肩',shoes:'鞋子',accessory:'飾品',headgear:'頭飾'};
const cardSlot=(card:Card)=>CARD_SLOTS[card.equipSlot||'']||card.equipSlot||'部位未確認';
const STAGE_TYPES:[StageType,string][]=[['all','全部'],['normal','一般遠征'],['event','活動關卡'],['story','劇情關卡']];
function EquipmentJobSelect({label,data,value,onChange}:{label:string;data:Catalog;value:string;onChange:(job:string)=>void}){
 const groups=useMemo(()=>{
  const jobs=data.lapRules.jobs;
  return jobs.filter(job=>jobFamily(job.id)===job.id).map(root=>({root,jobs:jobs.filter(job=>jobFamily(job.id)===root.id).sort((a,b)=>a.rank-b.rank)}));
 },[data]);
 return <label className="catalog-select"><span>{label}</span><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>
  <option value="all">全部職業</option>
  {groups.map(({root,jobs})=><optgroup key={root.id} label={root.name+'系'}>{jobs.map(job=><option key={job.id} value={job.id}>{job.name}</option>)}</optgroup>)}
 </select><ChevronDown aria-hidden="true" size={16}/></label>;
}
const SOURCES:Record<string,string>={monsterDrop:'怪物掉落',bossDrop:'Boss 掉落',story:'劇情',event:'活動',reward:'獎勵',starter:'初始裝備',raid:'團隊遠征副本'};
const LABELS:Record<Page,string>={items:'裝備',cards:'卡片',stages:'關卡',skills:'技能',talents:'天賦',balance:'平衡紀錄',experience:'經驗計算機',combat:'戰鬥機制'};
// HANS-only. All artwork is loaded by reference from the HANS image host;
// the public repository and Pages artifact never contain game image files.
const PUBLIC_MODE=import.meta.env.VITE_PUBLIC_MODE==='1';
const ASSET_ROOT='https://ro.hans-webgametw.com/assets/';
const EMPTY:View={page:'items',slot:'all',job:'all',tier:'all',source:'all',query:'',attr:'all',mode:'list',stageType:'all',stageChapter:'all',lap:1,gsJob:'swordsman',showUnknown:false,detail:null,stage:null,raid:null,tj:'swordsman',tb:'',t:'',skillJob:'all',skillRank:0,skillId:null};
function readLocation():View{
 const q=new URLSearchParams(location.search);
 const page=q.get('page')||(q.has('t')?'talents':'items');
 const legacyEffect:Record<string,string>={cooldown:'cooldown',crit:'crit',damage:'damage',defense:'armor',hp:'hp'};
 return {page:(Object.prototype.hasOwnProperty.call(LABELS,page)?page:'items') as Page,slot:q.get('slot')||'all',job:q.get('job')||'all',
 tier:parseTierFilter(q.get('tier')),source:q.get('source')||'all',query:q.get('q')||'',attr:q.get('attr')||legacyEffect[q.get('effect')||'']||'all',mode:q.get('mode')==='stages'?'stages':page==='cards'&&q.get('mode')==='gs'?'gs':'list',stageType:parseStageType(q.get('sg'),q.get('open')),stageChapter:parseStageChapter(q.get('ch')),lap:clampLap(Number(q.get('lap')||1)),gsJob:q.get('gsjob')||'swordsman',showUnknown:q.get('unknown')==='1',detail:q.get('detail')||null,stage:q.get('stage')||null,raid:parseRaid(q.get('raid')),tj:q.get('tj')||'swordsman',tb:q.get('tb')||'',t:q.get('t')||'',skillJob:q.get('sj')||'all',skillRank:[0,1,2,3].includes(Number(q.get('sr')))?Number(q.get('sr')):0,skillId:q.get('sk')||null};
}
function pathFor(v:View){
 const q=new URLSearchParams();
 if(v.page!=='items')q.set('page',v.page);
 if(v.slot!=='all')q.set('slot',v.slot);
 if(v.job!=='all')q.set('job',v.job);
 if(v.tier!=='all'&&(v.page==='items'||v.page==='stages'))q.set('tier',v.tier);
 if(v.source!=='all')q.set('source',v.source);
 if(v.query.trim())q.set('q',v.query.trim());
 if(v.attr!=='all')q.set('attr',v.attr);
 if(v.mode==='stages')q.set('mode','stages');
 if(v.page==='cards'&&v.mode==='gs')q.set('mode','gs');
 if(v.stageType!=='all')q.set('sg',v.stageType);
 if(v.stageChapter!=='all')q.set('ch',v.stageChapter);
 if(v.lap!==1)q.set('lap',String(v.lap));
 if(v.gsJob!=='swordsman')q.set('gsjob',v.gsJob);
 if(v.showUnknown)q.set('unknown','1');
 if(v.detail)q.set('detail',v.detail);
 if(v.stage)q.set('stage',v.stage);
 if(v.raid&&(v.page==='stages'||v.mode==='stages'))q.set('raid',v.raid);
 if(v.page==='talents'){if(v.t)q.set('t',v.t);else{if(v.tj!=='swordsman')q.set('tj',v.tj);if(v.tb)q.set('tb',v.tb);}}
 if(v.page==='skills'){if(v.skillJob!=='all')q.set('sj',v.skillJob);if(v.skillRank!==0)q.set('sr',String(v.skillRank));if(v.skillId)q.set('sk',v.skillId);}
 return location.pathname+(q.size?'?'+q.toString():'');
}
function CatalogSelect({label,value,options,onChange}:{
 label:string;value:string;options:ReadonlyArray<readonly [string,string]>;onChange:(value:string)=>void;
}){
 return <label className="catalog-select"><span>{label}</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>
  {options.map(([id,name])=><option key={id} value={id}>{name}</option>)}
 </select><ChevronDown aria-hidden="true" size={16}/></label>;
}
function EquipmentSlotSelect({label,items,job,value,onChange}:{label:string;items:readonly Equipment[];job:string;value:string;onChange:(slot:string)=>void}){
 const options=useMemo(()=>weaponOptions(items,job),[items,job]);
 const selected=isWeaponSubtype(value)&&!options.some(([key])=>key===value)?'weapon':value;
 return <label className="catalog-select"><span>{label}</span><select aria-label={label} value={selected} onChange={e=>onChange(e.target.value)}>
  <option value="all">全部部位</option>
  <optgroup label="武器"><option value="weapon">全部武器</option>{options.map(([key,name])=><option key={key} value={key}>{name}</option>)}</optgroup>
  <optgroup label="其他裝備">{Object.entries(SLOTS).filter(([key])=>key!=='weapon').map(([key,name])=><option key={key} value={key}>{name}</option>)}</optgroup>
 </select><ChevronDown aria-hidden="true" size={16}/></label>;
}
function Chip({active,children,onClick}:{active:boolean;children:React.ReactNode;onClick:()=>void}){
 return <button type="button" className={'chip '+(active?'selected':'')} aria-pressed={active} onClick={onClick}>{children}</button>;
}
function CardGsBadge({score}:{score:number|null}){
 return <span className="ranking-score" aria-label={score===null?'此卡片尚無可計算的 GS':'卡片 GS 貢獻 +'+score+' GS'}>
  {score===null?'—':'+'+score}<small>GS</small>
 </span>;
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
function StageArtwork({name,path:src}:{name:string;path?:string}){
 const url=src&&/^maps\/[a-z0-9_]+\/minimap\.png$/.test(src)?ASSET_ROOT+src:null;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[url]);
 return <span className="art stage">{url&&!failed?
  <img className="stage-map-image" src={url} alt={name+'地圖縮圖'} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:
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
function effects(e:GameEntry):string[]{
 return 'slot'in e?equipmentSearchEffects(e):e.bonuses;
}
function shortStats(e:GameEntry,max=3){return effects(e).slice(0,max).join(' · ')||('slot'in e?'無固定附加屬性':'效果未收錄');}
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
  fetch(import.meta.env.BASE_URL+'data/catalog.json?schema=2',{signal:ac.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()}).then(d=>{if(d.server!=='hans'||d.schemaVersion!==2||d.lapRules?.max!==6)throw Error('HANS 資料版本不相容');setCatalog(addRaidSources(d as Catalog))}).catch(e=>{if(e.name!=='AbortError')setError('資料載入失敗，請重新整理。')});
  return ()=>ac.abort();
 },[]);
 useEffect(()=>{
  if(!history.state)history.replaceState({scroll:0},'',location.href);
  const pop=()=>{setState(readLocation());requestAnimationFrame(()=>scrollTo(0,history.state?.scroll||0));};
  window.addEventListener('popstate',pop);return ()=>window.removeEventListener('popstate',pop);
 },[]);
 useEffect(()=>{document.body.style.overflow=state.detail?'hidden':'';return ()=>{document.body.style.overflow='';};},[state.detail]);
 useEffect(()=>setShowFilters(false),[state.page]);
 useEffect(()=>setVisibleCount(40),[state.page,state.slot,state.job,state.tier,state.source,state.query,state.attr,state.mode,state.stageType,state.stageChapter,state.showUnknown,state.lap,state.gsJob]);
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
 const cardVariants=useMemo(()=>catalog?catalogCardVariants(catalog.cards,catalog.lapRules):[],[catalog]);
 const cards=useMemo(()=>new Map(cardVariants.map(card=>[card.id,card])),[cardVariants]);
 const openDetail=(kind:Kind,id:string|number)=>{
  if(kind!=='stage'&&document.activeElement instanceof HTMLElement&&!document.activeElement.closest('.sheet'))
   detailTriggerRef.current=document.activeElement;
  if(kind==='stage'){
   navigate({...EMPTY,page:'stages',stage:String(id),stageChapter:String(stages.get(String(id))?.chapter||'all') as StageChapter,lap:state.lap,gsJob:state.gsJob},true);
   return;
  }
  navigate({detail:(kind==='card'&&showRaids&&cards.get(Number(id))&&!cards.get(Number(id))?.raidVariant?'card-base':kind)+':'+id});
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
 const selectedEquipmentSlot=useMemo(()=>catalog?normalizeEquipmentSlot(state.slot,state.job,catalog.items):state.slot,[catalog,state.slot,state.job]);
 useEffect(()=>{if(catalog&&state.page==='items'&&state.slot!==selectedEquipmentSlot)navigate({slot:selectedEquipmentSlot},false,true)},[catalog,state.page,state.slot,selectedEquipmentSlot,navigate]);
 const matchingEquip=useMemo(()=>catalog?.items.filter(i=>
  equipmentMatchesSlot(i,selectedEquipmentSlot)&&
  equipmentUsableBy(i,state.job)&&
  (i.sources.some(s=>matchesSource(s,state.source,stages))||state.source==='all')&&
  equipmentMatchesTier(i,stages,state.tier,s=>matchesSource(s,state.source,stages))&&
  entryMatches(i,state.query,state.attr)
  )||[],[catalog,selectedEquipmentSlot,state.job,state.tier,state.source,state.query,state.attr,stages]);
 const equip=useMemo(()=>matchingEquip.filter(i=>state.showUnknown||hasConfirmedAcquisition(i)),[matchingEquip,state.showUnknown]);
 const hiddenEquipCount=matchingEquip.length-equip.length;
 const cardList=useMemo(()=>cardVariants.filter(c=>(state.slot==='all'||c.equipSlot===state.slot)&&
  (c.sources.some(s=>matchesSource(s,state.source,stages))||state.source==='all')&&
  entryMatches(c,state.query,state.attr)),[cardVariants,state.slot,state.source,state.query,state.attr,stages]);
 // Score and fully sort the filtered cards before slicing into 40-card pages.
 const rankedCards=useMemo(()=>catalog&&state.page==='cards'&&state.mode==='gs'
  ?rankCardsByGs(cardList,catalog.lapRules,state.lap,state.gsJob):[],
  [catalog,cardList,state.page,state.mode,state.lap,state.gsJob]);
 const previewGsScores=useMemo(()=>{
  if(!catalog||state.page!=='cards')return new Map<number,number|null>();
  if(state.mode==='gs')return new Map<number,number|null>(rankedCards.map(({card,score})=>[card.id,score]));
  return new Map<number,number|null>(cardList.map(card=>[card.id,cardGsContribution(card,catalog.lapRules,state.lap,state.gsJob)]));
 },[catalog,cardList,rankedCards,state.page,state.mode,state.lap,state.gsJob]);
 const browseLocations=state.page==='stages'||state.mode==='stages';
 const showRaids=browseLocations&&(!!state.raid||state.source==='raid');
 const reportHref=feedbackUrl(location.href);
 const list:GameEntry[]=state.page==='cards'?(state.mode==='gs'?rankedCards.map(({card})=>card):cardList):equip;
 const searchActive=Boolean(state.query.trim()||state.attr!=='all');
 const advancedCount=Number(state.attr!=='all')+Number(state.source!=='all')+Number(state.page==='items'&&state.showUnknown);
 const attributeName=ATTRIBUTE_GROUPS.reduce<string|undefined>((found,group)=>{
  if(found)return found;
  for(const [key,label] of group.options)if(key===state.attr)return label;
  return undefined;
 },undefined);
 const activeAdvancedLabels=[
  state.attr!=='all'?attributeName||state.attr:null,
  state.source!=='all'?SOURCES[state.source]||state.source:null,
  state.page==='items'&&state.showUnknown?'含取得方式未確認的裝備':null
 ].filter(Boolean).join(' · ');
 const clearSearchFilters=()=>navigate({query:'',slot:'all',job:'all',tier:'all',source:'all',attr:'all',showUnknown:false});

 const [detailKind,...detailParts]=state.detail?.split(':')||[];
 const detailId=detailParts.join(':');
 const selectedItem=detailKind==='item'?items.get(Number(detailId)):undefined;
 const baseDetailId=Number(detailId);
 const selectedCard=(detailKind==='card'||detailKind==='card-base')&&catalog
  ?(detailKind==='card'&&showRaids?cards.get(raidCardId(baseDetailId,catalog.lapRules)):undefined)
   ??cards.get(baseDetailId)??cards.get(raidCardId(baseDetailId,catalog.lapRules))
  :undefined;
 const selectedMonster=detailKind==='monster'?monsters.get(detailId):undefined;
 const otherResults=!catalog?[]:state.page==='items'
  ?cardVariants.filter(card=>entryMatches(card,state.query,state.attr))
  :catalog.items.filter(item=>(state.showUnknown||hasConfirmedAcquisition(item))&&entryMatches(item,state.query,state.attr));
 const sourceLine=(entry:GameEntry)=>{
  const refs=entry.sources.filter(s=>s.sourceType==='monsterDrop'&&s.verificationState==='official').flatMap(s=>s.stageRefs.filter(r=>r.verified));
  const names=[...new Set(refs.map(ref=>{
   const stage=stages.get(ref.stageId);
   const boss='slot'in entry?'':ref.boss?'（Boss）':'';
   return (stage?.name||ref.stageId)+boss;
  }))];
  const raidNames=entry.sources.flatMap(source=>raids.filter(raid=>raid.id===source.raidId).map(raid=>raid.name));
  if(state.source==='raid'||!names.length)names.unshift(...raidNames);
  if(names.length)return names.slice(0,2).join('、')+(names.length>2?' 等':'');
  const official=entry.sources.find(s=>s.verificationState==='official'&&s.detail);
  if(official)return official.detail!;
  if(entry.sources.length)return '取得方式待確認';
  return '尚無已確認取得管道';
 };
 return <>
  <a className="wiki-skip" href="#wiki-main">跳到主要內容</a>
  <header className="topbar">
   <div className="top-inner">
    <span className="brand-mark" aria-hidden="true">H</span>
    <span className="brand-names"><strong>RO 倖存者｜HANS 粉絲維基</strong><small>非官方玩家製作{PUBLIC_MODE?'':' · 開發預覽'}</small></span>
    <nav className="bottom-nav" aria-label="主要分類">
     {([['items',Shield],['cards',BookOpen],['stages',MapIcon],['skills',WandSparkles],['talents',GitBranch],['balance',History]] as const).map(([page,Icon])=>
      <button type="button" key={page} className={state.page===page||state.page==='experience'&&page==='stages'||state.page==='combat'&&page==='skills'?'active':''} onClick={()=>{if(page!==state.page)navigate({...EMPTY,page,lap:state.lap,gsJob:state.gsJob,showUnknown:state.showUnknown},true)}} aria-current={state.page===page||state.page==='experience'&&page==='stages'||state.page==='combat'&&page==='skills'?'page':undefined}><Icon size={21}/><span>{LABELS[page]}</span></button>)}
    </nav>
   </div>
  </header>
  <main className="container" id="wiki-main" tabIndex={-1}>
   <section className="content-section">
    <div className="section-heading"><div className="section-title"><h1>{LABELS[state.page]}</h1>{state.page!=='talents'&&state.page!=='skills'&&state.page!=='balance'&&state.page!=='experience'&&state.page!=='combat'&&!(state.page==='stages'&&state.query.trim())&&<span className="heading-count">
      {state.page==='items'?equip.length:state.page==='cards'?(state.mode==='gs'?rankedCards.length:cardList.length):showRaids?raids.length:catalog?.stages.filter(stage=>matchesStageType(stage,state.stageType)&&(state.stageChapter==='all'||String(stage.chapter)===state.stageChapter)).length||0}
     </span>}</div><div className="section-actions">{state.page==='stages'&&<button type="button" className="search-more calculator-entry" onClick={()=>navigate({...EMPTY,page:'experience'},true)}><Calculator size={16} aria-hidden="true"/>經驗計算機</button>}{(state.page==='skills'||state.page==='items'||state.page==='cards')&&<a href={state.page==='skills'?'?page=combat':'?page=combat#defense'} className="search-more calculator-entry combat-guide-section-link"><Shield size={16} aria-hidden="true"/>戰鬥機制</a>}{state.page==='combat'&&<a href="?page=skills" className="search-more calculator-entry combat-guide-section-link">技能圖鑑</a>}<FeedbackLink href={reportHref}>回報／許願</FeedbackLink></div></div>
    {state.page==='combat'?<CombatGuide/>:state.page==='experience'?<Suspense fallback={<p role="status">讀取中…</p>}><ExperienceCalculator onClose={()=>navigate({...EMPTY,page:'stages'},true)}/></Suspense>:state.page==='balance'?<BalanceHistory/>:state.page==='talents'?<TalentSimulator jobId={state.tj} token={state.tb} packed={state.t} onRoute={(tj,tb,t,replace=false)=>navigate({tj,tb,t,page:'talents'},false,replace)}/>:state.page==='skills'?<SkillsEncyclopedia jobId={state.skillJob} rank={state.skillRank} query={state.query} selectedId={state.skillId} onChange={(patch,replace=true)=>navigate(patch,false,replace)}/>:<>
    {error&&<div className="empty-state">{error}</div>}
    {!catalog&&!error&&<div className="empty-state">讀取中…</div>}
    {catalog&&<>
     {browseLocations&&<div className="segment raid-view-switch" role="group" aria-label="關卡瀏覽方式">
      <button type="button" className={!showRaids?'on':''} aria-pressed={!showRaids} onClick={()=>navigate({raid:null,source:state.source==='raid'?'all':state.source,detail:null})}>一般／活動關卡</button>
      <button type="button" className={showRaids?'on':''} aria-pressed={showRaids} onClick={()=>navigate({raid:'all',stage:null,detail:null})}>團隊副本</button>
     </div>}
     {showRaids?<RaidBrowser selected={state.raid} items={items} cards={cards} openDetail={openDetail}
      page={state.page} view={state} data={catalog} onChange={(patch,replace=false)=>navigate(patch,false,replace)}
      onSelect={raid=>navigate({raid})}/>:<>
     <section className="search-panel" aria-label="搜尋與篩選">
      <div className="search-field">
       <Search size={20} aria-hidden="true"/>
       <input aria-label={state.page==='stages'?'搜尋關卡或掉落':'搜尋裝備、卡片或屬性'} placeholder={state.page==='stages'?'搜尋關卡、怪物或掉落物':'搜尋裝備、卡片、INT、急速…'} value={state.query} onChange={event=>navigate({query:event.target.value,stage:null},false,true)}/>
       {state.query&&<button type="button" className="search-clear" aria-label="清除搜尋" onClick={()=>navigate({query:'',stage:null},false,true)}><X size={18}/></button>}
      </div>
      {state.page!=='stages'&&<div className="primary-filters catalog-filters">
       {state.page==='items'?<>
        <EquipmentSlotSelect label="裝備部位" items={catalog.items} job={state.job} value={state.slot} onChange={slot=>navigate({slot})}/>
        <EquipmentJobSelect label="職業" data={catalog} value={state.job} onChange={job=>navigate({job,slot:normalizeEquipmentSlot(state.slot,job,catalog.items)})}/>
        <CatalogSelect label="裝備等級" value={state.tier} options={TIER_FILTER_OPTIONS} onChange={tier=>navigate({tier})}/>
       </>:<>
        <CatalogSelect label="鑲嵌部位" value={state.slot} options={[['all','全部部位'],...Object.entries(CARD_SLOTS)]} onChange={slot=>navigate({slot})}/>
        {state.mode!=='stages'&&<CatalogSelect label="週目" value={String(state.lap)} options={catalog.lapRules.labels.map((label,index)=>[String(index+1),label])} onChange={lap=>navigate({lap:Number(lap)})}/>}
       </>}
      </div>}
      <div className="catalog-actions">
       {(state.page==='items'||state.page==='cards')&&<div className={'segment'+(state.page==='cards'?' card-view-tabs':'')} role="group" aria-label="瀏覽方式">
        <button type="button" aria-pressed={state.mode==='list'} className={state.mode==='list'?'on':''} onClick={()=>navigate({mode:'list'})}>依{state.page==='items'?'裝備':'卡片'}看</button>
        <button type="button" aria-pressed={state.mode==='stages'} className={state.mode==='stages'?'on':''} onClick={()=>navigate({mode:'stages'})}>依關卡看</button>
        {state.page==='cards'&&<button type="button" aria-pressed={state.mode==='gs'} className={state.mode==='gs'?'on':''} onClick={()=>navigate({mode:'gs'})}>GS 高→低</button>}
       </div>}
       <div className="search-filter-row">
        <button className="search-more filter-trigger" type="button" aria-expanded={showFilters} aria-controls="advanced-filters" onClick={()=>setShowFilters(value=>!value)}><SlidersHorizontal size={16} aria-hidden="true"/>更多篩選{advancedCount>0?'（'+advancedCount+'）':''}<ChevronDown size={15} aria-hidden="true"/></button>
        {state.page!=='stages'&&state.mode!=='stages'&&<button type="button" className="search-more" onClick={()=>navigate({mode:'stages',raid:'all',stage:null},true)}>查團隊副本</button>}
       </div>
      </div>
      {advancedCount>0&&<div className="search-filter-row"><span className="applied-filters" aria-label="已套用的進階篩選">已套用：{activeAdvancedLabels}</span><button className="search-more clear-extra" type="button" onClick={()=>navigate({attr:'all',source:'all',showUnknown:false})}>清除進階條件</button></div>}
      <div className="filter-panel" id="advanced-filters" hidden={!showFilters}>
       {ATTRIBUTE_GROUPS.map(group=><div key={group.label} className="filter-block"><div className="filter-label">{group.label}</div><div className="chips">{group.options.map(([key,label])=><Chip key={key} active={state.attr===key} onClick={()=>navigate({attr:state.attr===key?'all':key})}>{label}</Chip>)}</div></div>)}
       <div className="filter-block"><div className="filter-label">取得方式</div><div className="chips"><Chip active={state.source==='all'} onClick={()=>navigate({source:'all'})}>全部</Chip>{Object.entries(SOURCES).filter(([v])=>state.page==='items'||['monsterDrop','bossDrop','event','raid'].includes(v)).map(([v,name])=><Chip key={v} active={state.source===v} onClick={()=>navigate({source:v})}>{name}</Chip>)}</div></div>
       {state.page==='items'&&<div className="source-visibility"><label className="toggle"><input type="checkbox" checked={state.showUnknown} onChange={event=>navigate({showUnknown:event.target.checked})}/>顯示取得方式未確認的裝備</label>{!state.showUnknown&&hiddenEquipCount>0&&<small>已隱藏 {hiddenEquipCount} 件未核實裝備</small>}</div>}
       <button className="search-more" type="button" onClick={()=>{clearSearchFilters();setShowFilters(false)}}>清除所有篩選</button>
      </div>
     </section>
     {(state.page==='items'||state.page==='cards')&&<>
      {state.page==='cards'&&state.mode!=='stages'&&<div className="gs-ranking-panel">
       <GsClassPicker rules={catalog.lapRules} gsJob={state.gsJob} onChange={gsJob=>navigate({gsJob})}/>
      </div>}
      {state.mode!=='stages'?<div className="cards-list">
       {list.slice(0,visibleCount).map(entry=><LootResult key={entry.id} entry={entry} rules={catalog.lapRules} lap={state.lap}
        onOpen={openDetail} source={sourceLine(entry)} score={previewGsScores.get(entry.id)}
        tier={'slot'in entry?equipmentTier(entry,stages).text:undefined}
        effect={'slot'in entry?matchedEffect(entry,state.query,state.attr)||undefined:undefined}/>)}
       {list.length>visibleCount&&<button type="button" className="load-more" onClick={()=>setVisibleCount(v=>v+40)}>顯示更多（還有 {list.length-visibleCount} 件）</button>}
       {!list.length&&<div className="search-empty-recovery"><EmptyState>{state.mode==='gs'&&state.page==='cards'
         ?(cardList.length?'目前篩選沒有可計分的卡片。':'目前沒有符合篩選條件的卡片。')
         :hiddenEquipCount>0&&state.page==='items'?'找到的裝備目前沒有核實取得方式，可選擇顯示未確認裝備。':'沒有符合條件的裝備或卡片'}</EmptyState>
        {hiddenEquipCount>0&&state.page==='items'&&<button type="button" className="search-more" onClick={()=>navigate({showUnknown:true})}>顯示未確認裝備</button>}
        <button type="button" className="search-more" onClick={clearSearchFilters}>清除搜尋與篩選</button>
         {state.mode==='gs'&&<button type="button" className="search-more" onClick={()=>navigate({mode:'list'})}>回依卡片看</button>}
       </div>}
      </div>:<StageBrowser key={state.page} data={catalog} initialKind={state.page==='cards'?'card':'item'} query={state.query} attr={state.attr} stageType={state.stageType} stageChapter={state.stageChapter} onChapterChange={stageChapter=>navigate({stageChapter,stage:null})} onStageTypeChange={stageType=>navigate({stageType,stage:null})} focusedStage={focusedStage} openDetail={openDetail} slot={state.slot} job={state.page==='items'?state.job:'all'} onGearChange={state.page==='items'?(slot,job)=>navigate({slot,job}):undefined} tierFilter={state.page==='items'?state.tier:'all'} source={state.source} showUnknown={state.showUnknown} gsJob={state.gsJob} lap={state.lap} setLap={lap=>navigate({lap})}/>}
      {state.mode==='list'&&searchActive&&otherResults.length>0&&<details className="search-extra">
       <summary className="search-subtitle">其他{state.page==='items'?'卡片':'裝備'}結果（{otherResults.length}）</summary>
       <div className="cards-list">{otherResults.slice(0,40).map(entry=><LootResult key={entry.id} entry={entry} rules={catalog.lapRules}
        lap={state.lap} onOpen={openDetail} source={sourceLine(entry)}
        tier={'slot'in entry?equipmentTier(entry,stages).text:undefined}
        score={'slot'in entry?undefined:cardGsContribution(entry,catalog.lapRules,state.lap,state.gsJob)}/>)}
       {otherResults.length>40&&<button className="load-more" type="button" onClick={()=>navigate({page:state.page==='items'?'cards':'items',mode:'list',slot:'all',job:'all'},true)}>查看更多{state.page==='items'?'卡片':'裝備'}</button>}</div>
      </details>}
     </>}
     {state.page==='stages'&&<StageBrowser data={catalog} query={state.query} attr={state.attr} stageType={state.stageType} stageChapter={state.stageChapter} onChapterChange={stageChapter=>navigate({stageChapter,stage:null})} onStageTypeChange={stageType=>navigate({stageType,stage:null})} focusedStage={focusedStage} openDetail={openDetail} source={state.source} gsJob={state.gsJob} lap={state.lap} setLap={lap=>navigate({lap})}/>}
     {state.page==='stages'&&<GameNotes/>}
    </>}
    </>}
    </>}
   </section>
  </main>
  <SiteFooter publicMode={PUBLIC_MODE} feedbackHref={reportHref}/>
  {state.detail&&catalog&&<div className="sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail()}}>
   <section className="sheet" role="dialog" aria-modal="true" aria-label="詳細資訊"><div className="sheet-grab"/>
    <div className="sheet-head"><button className="back-button" onClick={backFromDetail}><ArrowLeft size={19}/>返回</button><FeedbackLink href={feedbackUrl(location.href,selectedCard?.id)}>回報資料</FeedbackLink><button ref={detailCloseRef} className="icon-button" aria-label="關閉" onClick={closeDetail}><X size={19}/></button></div>
    <div className="sheet-body">
     {selectedItem&&<EquipmentDetail key={selectedItem.id} item={selectedItem} rules={catalog.lapRules} lap={state.lap} tierFilter={state.page==='items'?state.tier:'all'} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedCard&&<CardDetail card={selectedCard} counterpart={cards.get(selectedCard.raidVariant?selectedCard.id-catalog.lapRules.max*catalog.lapRules.cardStep:raidCardId(selectedCard.id,catalog.lapRules))} rules={catalog.lapRules} lap={state.lap} setLap={lap=>navigate({lap},false,true)} gsJob={state.gsJob} setGsJob={gsJob=>navigate({gsJob},false,true)} stages={stages} monsters={monsters} openDetail={openDetail}/>}
     {selectedMonster&&<MonsterDetail monster={selectedMonster} data={catalog} lap={state.lap} gsJob={state.gsJob} stages={stages} openDetail={openDetail}/>}
      {!selectedItem&&!selectedCard&&!selectedMonster&&<EmptyState>找不到這筆資料</EmptyState>}
    </div>
   </section>
  </div>}
 </>;
}
function GsClassPicker({rules,gsJob,onChange}:{rules:LapRules;gsJob:string;onChange:(job:string)=>void}){
 const selected=gsScalingForJob(rules,gsJob);
 return <div className="gs-class-picker" role="group" aria-label="GS 計算類型">
  <span className="gs-class-label">GS 計算類型</span>
  <div className="gs-class-options">{GS_SCALING_LABELS.map(({id,label})=>{
   const representative=gsRepresentativeJob(rules,id);
   if(!representative)return null;
   return <button type="button" key={id} className={'gs-class-choice'+(selected===id?' selected':'')}
    aria-pressed={selected===id} onClick={()=>onChange(representative)}>{label}</button>;
  })}</div>
  {!selected&&<p className="gs-unknown">請重新選擇計算類型。</p>}
 </div>;
}
function LootResult({entry,rules,lap,source,tier,effect,score,onOpen}:{
 entry:GameEntry;rules:LapRules;lap:number;source?:string;tier?:string;effect?:string;score?:number|null;
 onOpen:(kind:'item'|'card',id:number)=>void;
}){
 const item='slot'in entry?entry:null;
 const card='slot'in entry?null:entry;
 return <button type="button" className={'result-card loot-result'+(card?' card-with-gs':'')} onClick={()=>onOpen(item?'item':'card',entry.id)}>
  <Artwork kind={item?'item':'card'} entity={entry}/>
  <span className="result-main"><strong>{card?cardName(card,rules,lap):entry.name}</strong>
   <span className="result-sub"><span>{item?weaponLabel(item)||SLOTS[item.slot]||item.slot:cardSlot(card!)}{tier?' · '+tier:''}</span>
    <span>{effect||(card?cardEffects(card,rules,lap).join(' · '):shortStats(entry,3))}</span></span>
   {source&&<small className="result-place">{source}</small>}
  </span>
  {card?<CardGsBadge score={score??null}/>:<ChevronRight className="list-arrow" size={18}/>}
 </button>;
}
function FeedbackLink({href,children}:{href:string;children:React.ReactNode}){
 return <a className="feedback-link" href={href} target="_blank" rel="noopener noreferrer">
  <MessageSquarePlus size={16} aria-hidden="true"/>{children}
 </a>;
}
function RaidBrowser({selected,items,cards,page,view,data,onChange,onSelect,openDetail}:{
 selected:string|null;items:Map<number,Equipment>;cards:Map<number,Card>;page:Page;view:View;data:Catalog;
 onChange:(patch:Partial<View>,replace?:boolean)=>void;onSelect:(id:string)=>void;openDetail:(kind:Kind,id:number)=>void;
}){
 const [kind,setKind]=useState<'all'|'item'|'card'>(page==='cards'?'card':page==='items'?'item':'all');
 const resultsRef=useRef<HTMLElement>(null);
 const jobNames=new Map(data.lapRules.jobs.map(job=>[job.id,job.name]));
 const selectedSlot=kind==='item'?normalizeEquipmentSlot(view.slot,view.job,data.items):view.slot;
 const changeKind=(value:typeof kind)=>{setKind(value);onChange({slot:'all',job:'all'})};
 const terms=view.query.trim().toLocaleLowerCase();
 const results=raids.map(raid=>{
  const matchesTitle=[raid.name,raid.boss,'T'+raid.tier].some(value=>value.toLocaleLowerCase().includes(terms));
  const gear=kind==='card'?[]:raid.gear.map(id=>items.get(id)!).filter(item=>
   equipmentMatchesSlot(item,selectedSlot)&&equipmentUsableBy(item,view.job)&&
   (view.tier==='all'||view.tier===String(raid.tier))&&entryMatches(item,matchesTitle?'':view.query,view.attr));
  const lootCards=kind==='item'?[]:raid.cards.map(id=>cards.get(raidCardId(id,data.lapRules))!).filter(card=>
   (view.slot==='all'||card.equipSlot===view.slot)&&entryMatches(card,matchesTitle?'':view.query,view.attr));
  return {raid,gear,lootCards};
 }).filter(result=>result.gear.length||result.lootCards.length);
 const result=results.find(entry=>entry.raid.id===selected)||results[0];
 const {raid,gear,lootCards}=result??{raid:raids[0],gear:[],lootCards:[]};
 const filtered=!!terms||view.slot!=='all'||view.job!=='all'||view.tier!=='all'||view.attr!=='all';
 const filterOptions=kind==='all'?null:kind==='item'?<EquipmentSlotSelect label="副本裝備部位" items={data.items} job={view.job} value={selectedSlot} onChange={slot=>onChange({slot})}/>:<CatalogSelect label="副本卡片部位" value={view.slot} options={[['all','全部部位'],...Object.entries(CARD_SLOTS)]} onChange={slot=>onChange({slot})}/>;
 return <section className="raid-browser" aria-label="團隊遠征副本">
  {page!=='stages'&&<button type="button" className="search-more raid-return" onClick={()=>onChange({mode:'list',raid:null})}>返回依{page==='cards'?'卡片':'裝備'}看</button>}
  <div className="search-field"><Search size={20} aria-hidden="true"/><input aria-label="搜尋副本掉落" placeholder="搜尋副本、首領、掉落名稱或屬性" value={view.query} onChange={event=>onChange({query:event.target.value},true)}/>{view.query&&<button type="button" className="search-clear" aria-label="清除副本搜尋" onClick={()=>onChange({query:''},true)}><X size={18}/></button>}</div>
  {page==='stages'&&<div className="chips" role="group" aria-label="掉落類型">
   <Chip active={kind==='all'} onClick={()=>changeKind('all')}>全部掉落</Chip><Chip active={kind==='item'} onClick={()=>changeKind('item')}>裝備</Chip><Chip active={kind==='card'} onClick={()=>changeKind('card')}>卡片</Chip>
  </div>}
  <div className="stage-controls raid-controls">
   {filterOptions}
   {kind==='item'&&<EquipmentJobSelect label="副本職業" data={data} value={view.job} onChange={job=>onChange({job,slot:normalizeEquipmentSlot(selectedSlot,job,data.items)})}/>}
   {kind!=='card'&&<label>裝備等級<select aria-label="副本裝備等級" value={view.tier} onChange={e=>onChange({tier:e.target.value})}>{TIER_FILTER_OPTIONS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
   <label>屬性<select value={view.attr} onChange={event=>onChange({attr:event.target.value})}>
    <option value="all">全部屬性</option>{ATTRIBUTE_GROUPS.map(group=><optgroup key={group.label} label={group.label}>{group.options.map(([id,label])=><option key={id} value={id}>{label}</option>)}</optgroup>)}
   </select></label>
   {filtered&&<button type="button" className="search-more" onClick={()=>onChange({query:'',slot:'all',job:'all',tier:'all',attr:'all'})}>清除篩選</button>}
  </div>
  <div className="stage-lap-note">
   <strong>V0.15.0 · 11/23 正式開放</strong>
   <p>到廣場找「遠征副本管理員」。每團 6～30 人，須 Base Lv 50 且達到該關個人 GS。每個副本每天可挑戰 1 次，失敗也計次。</p>
   <details><summary>擲骰、勳章兌換與刻印規則</summary>
    <ul>
     <li>首領和精英的戰利品以「需要／貪婪／放棄」擲骰分配。通關另得遠征勳章。</li>
     <li>遠征勳章可兌換材料、刻印、副本品級裝備箱及卡片。卡片須首通對應副本。裝備箱須首通任一副本，依最高首通副本決定 Tier，可自選部位。</li>
     <li>第 4 關起通關可獲遠征刻印，首通另有加發。傳說裝備可二選一追加職業適用詞條，之後可重洗，刻印後裝備綁定帳號。</li>
     <li>遊戲介面說明首通勳章為 3 倍，加發部分不計入每週上限。實際兌換價格、每週限額與伺服器調整以遊戲內為準。</li>
    </ul>
    <a href={gameSite}>漢斯服最新消息</a>
   </details>
  </div>
  <div className="raid-chooser" role="group" aria-label="選擇副本">
   {results.map(({raid:entry,gear,lootCards})=><button type="button" key={entry.id} className="raid-choice" aria-pressed={entry.id===result?.raid.id} onClick={()=>{
    onSelect(entry.id);
    requestAnimationFrame(()=>resultsRef.current?.scrollIntoView({block:'start'}));
   }}>
    <StageArtwork name={entry.name} path={'maps/'+entry.map+'/minimap.png'}/>
    <span className="raid-choice-copy"><strong>{entry.name}</strong><small>T{entry.tier} · GS {entry.gs.toLocaleString('zh-TW')}</small>{filtered&&<small>{[gear.length?gear.length+' 件裝備':'',lootCards.length?lootCards.length+' 張卡片':''].filter(Boolean).join(' · ')}</small>}</span>
   </button>)}
  </div>
  {!result&&<EmptyState>沒有符合條件的副本掉落</EmptyState>}
  {result&&<article ref={resultsRef} className="raid-details" key={raid.id}>
   <h2>{raid.name}</h2>
   <p className="raid-detail-meta">首領 {raid.boss} · T{raid.tier} · 個人 GS {raid.gs.toLocaleString('zh-TW')} · {raid.minutes} 分鐘</p>
   {raid.baseHealers>0&&<p><strong>硬性補師門檻</strong>　6 人起至少 {raid.baseHealers} 位{raid.healerRequirements.map(([players,healers])=>'；'+players+' 人起至少 '+healers+' 位').join('')}</p>}
   {raid.recommendedRoles.length>0&&<p><strong>建議隊伍組成</strong>　{raid.recommendedRoles.map(({label,percent,min})=>label+(percent?' ≥'+percent+'%':'')+(min?' ≥'+min+' 位':'')).join('、')}</p>}
   <p>{raid.traits.join('；')}</p>
   <details className="stage-lap-note"><summary>關卡流程</summary>
    <ol>{raid.zones.map(zone=><li key={zone}>{zone}</li>)}</ol>
   </details>
   {lootCards.length>0&&<>
    <GsClassPicker rules={data.lapRules} gsJob={view.gsJob} onChange={gsJob=>onChange({gsJob})}/>
    <h3>副本卡片（{lootCards.length} 張）</h3>
    <p className="raid-detail-meta">副本掉落；首通此副本後也可用遠征勳章兌換。</p>
    <div className="raid-pool">{lootCards.map(card=><LootResult key={card.id} entry={card} rules={data.lapRules} lap={view.lap}
     source={raid.name} score={cardGsContribution(card,data.lapRules,view.lap,view.gsJob)} onOpen={openDetail}/>)}</div>
   </>}
   {gear.length>0&&<details className="stage-lap-note" open={filtered||kind==='item'?true:undefined}><summary>T{raid.tier} 擲骰裝備（{gear.length} 件）</summary>
    <p>首領裝備池每 {raid.gearPerBoss} 人分配 1 件，精英另計。單品掉落機率未公開。</p>
    <div className="raid-pool">{gear.map(item=><LootResult key={item.id} entry={item} rules={data.lapRules} lap={view.lap} tier={'T'+raid.tier}
     source={item.jobs.length?item.jobs.map(id=>jobNames.get(id)||id).join('／'):'全職業'} onOpen={openDetail}/>)}</div>
   </details>}
   <h3>通關與首通獎勵</h3>
   <p>通關另有遠征勳章{raids.indexOf(raid)>=3?'及遠征刻印':''}。材料預覽如下：</p>
   <ul>{raid.materials.map(material=><li key={material}>{material}</li>)}</ul>
   <p className="raid-detail-meta">小數沿用遊戲預覽的顯示方式。單場實際數量以結算為準。</p>
   <p><strong>首通</strong>　{raid.firstClear}</p>
   <FeedbackLink href={feedbackUrl(location.origin+location.pathname+raidUrl(raid.id))}>回報此副本資料</FeedbackLink>
  </article>}
 </section>;
}
function StageBrowser({data,query,attr,stageType,onStageTypeChange,stageChapter,onChapterChange,focusedStage,openDetail,gsJob,lap,setLap,slot='all',job='all',tierFilter='all',source='all',showUnknown=false,initialKind='all',onGearChange}:{
 data:Catalog;query:string;attr:string;stageType:StageType;onStageTypeChange:(value:StageType)=>void;stageChapter:StageChapter;onChapterChange:(value:StageChapter)=>void;gsJob:string;lap:number;setLap:(lap:number)=>void;focusedStage:string|null;
 openDetail:(kind:Kind,id:string|number)=>void;slot?:string;job?:string;tierFilter?:string;source?:string;showUnknown?:boolean;initialKind?:'all'|'item'|'card';onGearChange?:(slot:string,job:string)=>void;
}){
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
 const [kind,setKind]=useState(initialKind);
 const [localSlot,setLocalSlot]=useState(initialKind==='card'?'all':slot);
 const [localCardSlot,setLocalCardSlot]=useState(initialKind==='card'?slot:'all');
 const [localJob,setLocalJob]=useState(job);
 const [localAttr,setLocalAttr]=useState('all');
 const effectiveSlot=useMemo(()=>normalizeEquipmentSlot(localSlot,localJob,data.items),[localSlot,localJob,data]);
 const changeGear=(nextSlot:string,nextJob:string)=>{setLocalSlot(nextSlot);setLocalJob(nextJob);onGearChange?.(nextSlot,nextJob)};
 const monsterMap=useMemo(()=>new Map(data.monsters.map(m=>[m.id,m])),[data]);
 const stageMap=useMemo(()=>new Map(data.stages.map(stage=>[stage.id,stage])),[data]);
 useEffect(()=>{
  if(!focusedStage)return;
  setExpanded(prev=>new Set([...prev,focusedStage]));
  const frame=requestAnimationFrame(()=>document.getElementById('stage-heading-'+focusedStage)?.scrollIntoView({block:'start'}));
  return ()=>cancelAnimationFrame(frame);
 },[focusedStage]);
 useEffect(()=>{if(initialKind==='card')setLocalCardSlot(slot);else{setLocalSlot(slot);setLocalJob(job)}},[slot,job,initialKind]);
 const eligible=(row:ReturnType<typeof stageRows>[number],stageId:string,dropQuery:string)=>{
   if(kind!=='all'&&row.kind!==kind)return false;
   if(row.source.verificationState!=='official'&&!showUnknown)return false;
   if(!matchesSource(row.source,source,stageMap,stageId))return false;
   if(!entryMatches(row.item,dropQuery,attr)||!entryMatches(row.item,'',localAttr))return false;
  if(row.kind==='item'){
   const item=row.item as Equipment;
   const stageTier=stageMap.get(stageId)?.lapTiers[lap-1];
   const tierOk=tierFilter==='all'||(tierFilter!=='unknown'&&stageTier===Number(tierFilter));
   return tierOk&&(showUnknown||hasConfirmedAcquisition(item))&&equipmentMatchesSlot(item,effectiveSlot)&&equipmentUsableBy(item,localJob);
  }
  if(kind==='card')return localCardSlot==='all'||(row.item as Card).equipSlot===localCardSlot;
  return (effectiveSlot==='all'||(row.item as Card).equipSlot===effectiveSlot)&&localJob==='all';
 };
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const rowsByStage=new Map<string,ReturnType<typeof stageRows>>();
 const chapterGroups=stageChapterGroups(data.stages,stageChapter,stage=>{
  if(!matchesStageType(stage,stageType))return false;
  if(!terms.length&&(tierFilter==='all'||kind==='card'))return true;
  const names=initialKind==='all'
   ?[stage.name,...[...stage.normalMonsterIds,...stage.bossMonsterIds].map(id=>monsterMap.get(id)?.name||'')]
   :[];
  const matchesName=names.some(name=>terms.every(term=>name.toLocaleLowerCase().includes(term)));
  const rows=stageRows(data,stage.id).filter(row=>eligible(row,stage.id,matchesName?'':query));
  rowsByStage.set(stage.id,rows);
  return ((tierFilter==='all'||kind==='card')&&matchesName)||rows.length>0||stage.id===focusedStage;
 });
 const visible=chapterGroups.flatMap(group=>group.stages);
 const singleSearchResult=terms.length&&visible.length===1?visible[0].id:null;
 useEffect(()=>{
  if(singleSearchResult)setExpanded(previous=>new Set([...previous,singleSearchResult]));
 },[singleSearchResult]);
 return <div className="stage-accordion" aria-label="可收合關卡掉落">
  <div className="stage-filters"><div className="stage-chapter-picker" role="group" aria-label="選擇章節">
   <span className="filter-label">章節</span>
   <div className="chips">{([['all','全部章節'],['2','第二章'],['1','第一章']] as [StageChapter,string][]).map(([value,label])=>
    <Chip key={value} active={stageChapter===value} onClick={()=>onChapterChange(value)}>{label}（{value==='all'?data.stages.length:data.stages.filter(stage=>String(stage.chapter)===value).length}）</Chip>)}</div>
  </div>
  <div className="stage-type-picker" role="group" aria-label="關卡類別">
   <span className="filter-label">關卡類別</span>
   <div className="chips">{STAGE_TYPES.map(([value,label])=><Chip key={value} active={stageType===value} onClick={()=>onStageTypeChange(value)}>{label}</Chip>)}</div>
  </div>
  <LapPicker rules={data.lapRules} lap={lap} setLap={setLap}/></div>
  <div className="stage-view-toolbar"><span className="search-hint" role="status">目前顯示 {visible.length} 個關卡</span>{visible.length>0&&<div className="stage-expansion-actions"><button type="button" className="search-more" onClick={()=>setExpanded(new Set(visible.map(s=>s.id)))}>全部展開</button><button type="button" className="search-more" onClick={()=>setExpanded(new Set())}>全部收合</button></div>}</div>
  {chapterGroups.map(group=><section className="stage-chapter-section" aria-label={(group.chapter===2?'第二章':'第一章')+'關卡'} key={group.chapter}>
   <div className="stage-chapter-heading"><h2>{group.chapter===2?'第二章':'第一章'}</h2><span>{group.stages.length} 個關卡</span><small>{group.chapter===2?'Lv 71–99 · 裝備 Tier 依週目 T6–T8':'依 HANS 實際關卡與週目資料'}</small></div>
   {group.chapter===2&&<p className="stage-lap-note">帳號任一角色擊敗第一章三週目「迷宮森林・改²」的 MVP 後解鎖。第二章有獨立週目，組隊時所有隊員的帳號都須解鎖欲挑戰的週目。</p>}
   {group.stages.map(stage=>{
   const rows=rowsByStage.get(stage.id)??stageRows(data,stage.id).filter(row=>eligible(row,stage.id,query));
   const opened=expanded.has(stage.id);
   return <section className="stage-entry" key={stage.id}>
    <button type="button" className="stage-heading" id={'stage-heading-'+stage.id} aria-expanded={opened} aria-controls={'stage-'+stage.id} onClick={()=>setExpanded(previous=>{const next=new Set(previous);if(next.has(stage.id))next.delete(stage.id);else next.add(stage.id);return next})}>
     <StageArtwork name={stage.name} path={stage.image?.officialPath}/>
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
      {([['all','全部'],['item','裝備'],['card','卡片']] as const).map(([value,label])=><Chip key={value} active={kind===value} onClick={()=>setKind(value)}>{label}</Chip>)}
     </div>
     <div className="stage-controls">
       {kind==='card'?<label>鑲嵌部位<select aria-label="關卡卡片部位" value={localCardSlot} onChange={e=>setLocalCardSlot(e.target.value)}><option value="all">全部部位</option>{Object.entries(CARD_SLOTS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>:
        <><EquipmentSlotSelect label="關卡部位" items={data.items} job={localJob} value={effectiveSlot} onChange={slot=>changeGear(slot,localJob)}/>
        <EquipmentJobSelect label="關卡職業" data={data} value={localJob} onChange={job=>changeGear(normalizeEquipmentSlot(effectiveSlot,job,data.items),job)}/></>}
      <label>屬性<select aria-label="關卡屬性" value={localAttr} onChange={e=>setLocalAttr(e.target.value)}><option value="all">全部屬性</option>{ATTRIBUTE_GROUPS.map(group=><optgroup key={group.label} label={group.label}>{group.options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</optgroup>)}</select></label>
     </div>
     {rows.length?<div className="compact-results">{rows.map((row,i)=><LootResult key={row.kind+'-'+row.item.id+'-'+i}
      entry={row.item} rules={data.lapRules} lap={lap} onOpen={openDetail}
      tier={row.kind==='item'?stageTierLabel(stage,lap):undefined}
      effect={row.kind==='item'?matchedEffect(row.item,query,localAttr!=='all'?localAttr:attr)||undefined:undefined}
      score={'slot'in row.item?undefined:cardGsContribution(row.item,data.lapRules,lap,gsJob)}
      source={[row.source.verificationState==='official'?'':'取得待確認',row.boss?(stage.intruderBossId===row.source.monsterId?'闖入 Boss':'Boss'):'',
       sourceMonsterName(row.source,monsterMap)].filter(Boolean).join(' · ')}/>)}</div>:<div className="stage-no-results">這個關卡沒有符合條件的掉落物</div>}
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
  {s.raidId&&<a className="raid-route" href={raidUrl(s.raidId)}>{raids.find(raid=>raid.id===s.raidId)?.name}<ChevronRight size={14}/></a>}
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
function EquipmentDetail({item,rules,lap,tierFilter,stages,monsters,openDetail}:{item:Equipment;rules:LapRules;lap:number;tierFilter:string;stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void}){
 const tier=equipmentTier(item,stages),record=gearRecord(item);
 const options=equipmentTierOptions(item,stages);
 const optionKey=(x:{tier:number;raid:boolean})=>(x.raid?'raid:':'normal:')+x.tier;
 const first=options.find(x=>String(x.tier)===tierFilter)??equipmentTierOptions(item,stages,lap)[0]??options[0];
 const [selection,setSelection]=useState(first?optionKey(first):'');
 const [quality,setQuality]=useState(0);
 const option=options.find(x=>optionKey(x)===selection)??first;
 const fixed=fixedEquipmentEffects(item,option);
 const base=option?equipmentBaseStats(item,option,quality):[];
 const affixes=equipmentAffixPools(item,option);
 return <><DetailHero kind="item" entry={item} title={item.name} sub={(weaponLabel(item)||SLOTS[item.slot]||item.slot)+' · '+tier.text}/>
  <section className="equipment-preview">
   <h3 className="sheet-section">裝備能力預覽</h3>
   {options.length>0&&!record?.starter&&<div className="stage-controls equipment-preview-controls">
    <CatalogSelect label="裝備等級" value={option?optionKey(option):''} options={options.map(x=>[optionKey(x),(x.raid?'副本 ':'')+'T'+x.tier])} onChange={setSelection}/>
    <CatalogSelect label="裝備品質" value={String(quality)} options={EQUIPMENT_QUALITIES.map((label,index)=>[String(index),label])} onChange={v=>setQuality(Number(v))}/>
   </div>}
   <p className="tier-note">HANS 裝備等級：按已核實的掉落來源及週目提供預覽。數值未計精煉、升星、卡片與刻印；固定效果與隨機詞綴分開。</p>
   <h3 className="sheet-section">基礎能力</h3>
   {base.length?<div className="bonus-list">{base.map(t=><span key={t}>{t}</span>)}</div>:<p className="tier-note">{!record?'尚未核實':record.starter?'初始裝備沒有額外基礎能力。':!option?'取得等級尚未核實，無法計算數值。':'此部位無獨立 ATK、MATK 或 DEF。'}</p>}
   <h3 className="sheet-section">固定專屬效果</h3>
   {fixed.length?<div className="bonus-list">{fixed.map((t,i)=><span key={i}>{t}</span>)}</div>:<p className="tier-note">{record?'無固定專屬詞條。':'尚未核實固定專屬詞條。'}</p>}
   {record?.fixed.length&& !option?<p className="tier-note">已確認詞條種類；數值依實際 Tier 而定。</p>:null}
   {affixes&&<><h3 className="sheet-section">隨機／可洗鍊詞綴</h3>
    <p className="tier-note">{['普通：無隨機詞綴','優良：1 條能力值','稀有：1 條能力值、1 條攻擊類','史詩：2 條能力值、1 條攻擊類、1 條防禦類','傳說：2 條能力值、1 條攻擊類、1 條防禦類；符合條件時另有技能傷害'][quality]}。傳說可洗鍊指定詞綴，並非更改固定效果。</p>
    <details className="search-extra" open={quality>0}><summary className="search-subtitle">查看可出現的隨機詞綴</summary>
     <div className="equipment-affix-group"><strong>能力值</strong><div className="bonus-list">{affixes.attributes.map(t=><span key={t}>{t}</span>)}</div></div>
     <div className="equipment-affix-group"><strong>攻擊類</strong><div className="bonus-list">{affixes.offensive.map(t=><span key={t}>{t}</span>)}</div></div>
     <div className="equipment-affix-group"><strong>防禦類</strong><div className="bonus-list">{affixes.defensive.map(t=><span key={t}>{t}</span>)}</div></div>
     <div className="equipment-affix-group"><strong>技能傷害</strong><p className="tier-note">傳說裝備依職業、裝備限制與 Tier 產生適用技能；基礎傷害詞綴 +10%～20%。</p></div>
     {option?.raid&&<p className="tier-note">副本隨機詞綴的最終數值依實際伺服器生成結果，這裡只列種類。</p>}
    </details>
   </>}
  </section>
  {item.jobs.length>0&&<><h3 className="sheet-section">可用職業</h3><div className="bonus-list">{rules.jobs.filter(job=>equipmentUsableBy(item,job.id)).map(job=><span key={job.id}>{job.name}</span>)}</div>{item.gender&&<p className="tier-note">此裝備另有性別限制（{item.gender==='m'?'男性':item.gender==='f'?'女性':item.gender}）。</p>}</>}
  <h3 className="sheet-section">取得方式</h3><DropRoutes sources={item.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function CardDetail({card,counterpart,rules,lap,setLap,gsJob,setGsJob,stages,monsters,openDetail}:{
 card:Card;counterpart?:Card;rules:LapRules;lap:number;setLap:(lap:number)=>void;gsJob:string;setGsJob:(job:string)=>void;
 stages:Map<string,Stage>;monsters:Map<string,Monster>;openDetail:(kind:Kind,id:string|number)=>void;
}){
 const raidOnly=!!card.raidVariant;
 const score=cardGsContribution(card,rules,lap,gsJob);
 const mult=cardMultiplier(card,rules,lap);
 return <><DetailHero kind="card" entry={card} title={(raidOnly&&card.raid?card.name+card.raid.suffix:cardName(card,rules,lap))} sub={'鑲嵌部位：'+cardSlot(card)}/>
  {!raidOnly&&<>
  <div className="lap-detail"><LapPicker rules={rules} lap={lap} setLap={setLap}/>
   <div className="lap-meta">卡片 ID：{cardId(card,rules,lap)} · 效果倍率 ×{mult}</div>
  </div>
  </>}
  <h3 className="sheet-section">{raidOnly?'副本卡片效果（×'+card.raid!.mult+'）':'此週目卡片效果'}</h3>
  <div className="bonus-list">{cardEffects(card,rules,lap).map((value,index)=><span key={index}>{value}</span>)}</div>
  <div className="card-gs-section">
   <div className="card-gs-title"><h3>卡片 GS 貢獻</h3><strong>{score==null?'尚未確認':'+'+score+' GS'}</strong></div>
   {card.id===4144&&<p className="card-gs-note">此卡的復活次數隨週目增加；GS 依官方特殊公式，每提升一週目增加基礎 GS 的 30%。</p>}
   {raidOnly&&<p className="card-gs-note">副本卡片的 GS 為效果換算分數與該卡專屬保底兩者較高值，不受一般週目選擇影響。</p>}
   <GsClassPicker rules={rules} gsJob={gsJob} onChange={setGsJob}/>
  </div>
  {counterpart&&<button type="button" className="search-more" onClick={()=>openDetail('card',counterpart.id)}>查看{raidOnly?'一般版':'副本版'}</button>}
  <h3 className="sheet-section">取得方式</h3>
  <DropRoutes sources={card.sources} stages={stages} monsters={monsters} openDetail={openDetail}/>
 </>;
}
function MonsterDetail({monster,data,lap,gsJob,stages,openDetail}:{monster:Monster;data:Catalog;lap:number;gsJob:string;stages:Map<string,Stage>;openDetail:(kind:Kind,id:string|number)=>void}){
 const results=[...data.items,...data.cards].flatMap(entry=>
  entry.sources.filter(source=>source.monsterId===monster.id).map(source=>({entry,source})));
 return <><DetailHero kind="monster" entry={monster} title={monster.name} sub={monster.boss?'Boss':'怪物'}/>
  <h3 className="sheet-section">出現關卡</h3><div className="sub-list">{monster.stages.length===0&&<p className="source-detail">一般遠征的出現關卡尚未登錄。</p>}{monster.stages.map(s=><button key={s.id} onClick={()=>openDetail('stage',s.id)}><MapIcon size={18}/><span>{stages.get(s.id)?.name||s.id}{s.boss?' · Boss':''}</span><ChevronRight size={16}/></button>)}</div>
  <h3 className="sheet-section">裝備掉落與卡片關聯</h3>
  <div className="stage-loot-list">{results.map(({entry,source},i)=><LootResult key={entry.id+'-'+i} entry={entry}
   rules={data.lapRules} lap={lap} onOpen={openDetail} source={source.verificationState==='official'?undefined:'取得待確認'}
   tier={'slot'in entry?equipmentTier(entry,stages).text:undefined}
   score={'slot'in entry?undefined:cardGsContribution(entry,data.lapRules,lap,gsJob)}/>)}</div>
  {!results.length&&<EmptyState>目前沒有已收錄掉落物品</EmptyState>}
 </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
