import {ChevronDown,ExternalLink} from 'lucide-react';
import './site-footer.css';

const REPORT_URL='https://github.com/lockgipo/ro-survivors-wiki/issues/new?template=content-removal.yml';

export function SiteFooter({publicMode}:{publicMode:boolean}){
 return <footer className="site-footer" aria-label="網站聲明">
  <div className="site-footer-inner">
   <p className="site-footer-lead">非官方・免費・非營利・原始碼公開的玩家攻略維基</p>
   <p className="site-footer-intro">由玩家自發整理，協助查詢《RO Survivors》裝備、卡片與關卡資訊；與遊戲開發者及相關權利人無官方合作或隸屬關係。</p>
   <details className="site-footer-disclosure">
    <summary>著作權與免責聲明 <ChevronDown size={16} aria-hidden="true"/></summary>
    <div className="site-footer-disclosure-body">
     <p>本站為玩家自發製作的免費、非營利攻略資料網站，僅供遊戲資料查詢、攻略分享與玩家交流，不代表《RO Survivors》遊戲開發者、Gravity 或其他原始權利人之官方立場。</p>
     <p>本站提及的遊戲名稱、角色、裝備、卡片、圖像及相關內容，其著作權及商標權依實際情況歸各自合法權利人所有。本站不主張擁有相關遊戲素材的權利。</p>
     <p>本站的原始碼公開，不代表遊戲素材已獲開放授權，亦不表示相關圖像可自由轉載或用於商業用途。非營利及本聲明本身不構成圖片使用授權。</p>
     <p>若您是權利人，或認為網站內容涉及著作權、商標權等疑慮，請透過下方「內容疑慮／下架聯絡」告知相關網址及原因。我們會優先查核，必要時儘速移除或調整相關內容。</p>
     <p className="site-footer-note">聯絡入口使用公開的 GitHub Issue，請勿張貼個人資料、秘密或未公開的權利證明。</p>
    </div>
   </details>
   <nav className="site-footer-links" aria-label="相關資訊">
    <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">內容疑慮／下架聯絡 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href="https://github.com/lockgipo/ro-survivors-wiki" target="_blank" rel="noopener noreferrer">網站原始碼 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href="https://ro-survivors.com/" target="_blank" rel="noopener noreferrer">RO Survivors 遊戲 <ExternalLink size={13} aria-hidden="true"/></a>
   </nav>
   {publicMode&&<div className="site-footer-credits">
    <p>目前公開版僅使用經個別比對的 RO Fan Kit 怪物插畫縮圖，並非《RO Survivors》遊戲截圖；裝備及卡片圖像未公開提供。</p>
    <p>© Gravity Co., Ltd. &amp; Lee MyoungJin(studio DTDS). All Rights Reserved. Published by GungHo Online Entertainment, Inc.</p>
    <p><a href="https://ragnarokonline-cf.gungho.jp/special/fankit/" target="_blank" rel="noopener noreferrer">RO Fan Kit 圖片來源</a> · <a href="https://ragnarokonline.gungho.jp/support/play-manner/copyright.html" target="_blank" rel="noopener noreferrer">官方素材使用規範</a></p>
   </div>}
  </div>
 </footer>;
}
