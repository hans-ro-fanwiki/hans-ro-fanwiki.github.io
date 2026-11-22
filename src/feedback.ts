/** Public GitHub Issues handoff. GitHub authentication and final submission happen there. */
export type FeedbackKind='problem'|'wish';
export interface FeedbackContext {subject:string; pageUrl:string}

export const FEEDBACK_ISSUES_URL='https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues';
const NEW_ISSUE_URL=FEEDBACK_ISSUES_URL+'/new';

export function feedbackIssueUrl(kind:FeedbackKind,title:string,description:string,context:FeedbackContext):string{
 const url=new URL(NEW_ISSUE_URL);
 url.searchParams.set('template',kind==='problem'?'problem-report.yml':'feature-request.yml');
 url.searchParams.set('title',(kind==='problem'?'[問題回報] ':'[功能許願] ')+title.trim().slice(0,90));
 url.searchParams.set('description',description.trim().slice(0,500));
 url.searchParams.set('item_context',context.subject.slice(0,220));
 url.searchParams.set('page_url',context.pageUrl.slice(0,500));
 return url.toString();
}

export function feedbackDraftText(kind:FeedbackKind,title:string,description:string,context:FeedbackContext):string{
 return [
  (kind==='problem'?'[問題回報] ':'[功能許願] ')+title.trim(),
  '',
  '回報內容：',
  description.trim(),
  '',
  '相關頁面：',
  context.pageUrl,
  '相關資料：',
  context.subject
 ].join('\n');
}
