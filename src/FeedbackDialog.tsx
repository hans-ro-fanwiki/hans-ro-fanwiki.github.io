import {useEffect,useRef,useState} from 'react';
import {ClipboardCopy,ExternalLink,X} from 'lucide-react';
import {feedbackDraftText,feedbackIssueUrl,FEEDBACK_ISSUES_URL} from './feedback';
import type {FeedbackContext,FeedbackKind} from './feedback';
import './feedback.css';

export function FeedbackDialog({context,initialKind,onClose}:{
 context:FeedbackContext;initialKind:FeedbackKind;onClose:()=>void;
}){
 const [kind,setKind]=useState<FeedbackKind>(initialKind);
 const [title,setTitle]=useState('');
 const [description,setDescription]=useState('');
 const [copied,setCopied]=useState(false);
 const titleRef=useRef<HTMLInputElement>(null);
 const panelRef=useRef<HTMLElement>(null);
 const valid=title.trim().length>=3&&description.trim().length>=10;
 const url=feedbackIssueUrl(kind,title,description,context);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  titleRef.current?.focus({preventScroll:true});
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return}
   if(event.key!=='Tab'||!panelRef.current)return;
   const controls=[...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled])')]
    .filter(el=>el.getClientRects().length>0);
   if(!controls.length)return;
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return ()=>{document.removeEventListener('keydown',onKey);previous?.focus({preventScroll:true})};
 },[onClose]);
 const copyDraft=async()=>{
  try{
   await navigator.clipboard.writeText(feedbackDraftText(kind,title,description,context));
   setCopied(true);
  }catch{setCopied(false)}
 };
 return <div className="feedback-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section ref={panelRef} className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
   <div className="feedback-dialog-head"><div><h2 id="feedback-title">問題回報／功能許願</h2><p>直接反映資料錯誤、操作問題或想加入的功能</p></div>
    <button type="button" className="feedback-close" onClick={onClose} aria-label="關閉回報視窗"><X size={21}/></button>
   </div>
   <div className="feedback-dialog-body">
    <div className="feedback-kind" role="group" aria-label="回報類型">
     <button type="button" aria-pressed={kind==='problem'} className={kind==='problem'?'active':''} onClick={()=>{setKind('problem');setCopied(false)}}>問題回報</button>
     <button type="button" aria-pressed={kind==='wish'} className={kind==='wish'?'active':''} onClick={()=>{setKind('wish');setCopied(false)}}>功能許願</button>
    </div>
    <div className="feedback-context"><strong>自動附上相關頁面</strong><span>{context.subject}</span>
     <small title={context.pageUrl}>{context.pageUrl}</small></div>
    <label className="feedback-field" htmlFor="feedback-summary"><span>{kind==='problem'?'問題簡述':'想要的功能'}</span>
     <input ref={titleRef} id="feedback-summary" type="text" maxLength={90} autoComplete="off" value={title} onChange={e=>{setTitle(e.target.value);setCopied(false)}} placeholder={kind==='problem'?'例如：這張卡片的 GS 跟遊戲內不同':'例如：希望加入多張卡片比較'}/></label>
    <label className="feedback-field" htmlFor="feedback-description"><span>{kind==='problem'?'發現什麼問題？':'希望怎麼使用？'}</span>
     <textarea id="feedback-description" rows={5} maxLength={500} value={description} onChange={e=>{setDescription(e.target.value);setCopied(false)}} placeholder={kind==='problem'?'例如：我在第六週目看到 GS 180，但網站顯示 210，請幫忙確認。':'例如：希望能選 3 張卡，直接比較魔法系的 GS。'}/></label>
    <p className="feedback-hint">不用先判斷是不是 Bug；有疑問就可以回報。截圖可以在 GitHub 送出頁附上。</p>
    <p className="feedback-public-notice">回報內容會公開顯示在 GitHub，請勿填寫個資、密碼或私密資料。提交時需登入 GitHub；本站不會自行儲存草稿，也不會在此直接送出。</p>
    <div className="feedback-actions">
     <a className={'feedback-submit'+(!valid?' disabled':'')} href={valid?url:undefined} aria-disabled={!valid} tabIndex={valid?0:-1} target="_blank" rel="noopener noreferrer">
      前往 GitHub 完成送出 <ExternalLink size={16} aria-hidden="true"/></a>
     <button className="feedback-copy" type="button" onClick={copyDraft} disabled={!title.trim()&&!description.trim()}><ClipboardCopy size={15} aria-hidden="true"/>{copied?'已複製':'複製回報內容'}</button>
    </div>
    {!valid&&<small className="feedback-validation">請填至少 3 個字的標題、10 個字的說明。</small>}
    <a className="feedback-all-link" href={FEEDBACK_ISSUES_URL} target="_blank" rel="noopener noreferrer">查看目前所有回報與許願 <ExternalLink size={13} aria-hidden="true"/></a>
   </div>
  </section>
 </div>;
}
