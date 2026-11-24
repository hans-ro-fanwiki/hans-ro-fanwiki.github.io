import {ChevronDown,ExternalLink,MessageSquarePlus,Shield} from 'lucide-react';
import './site-footer.css';

const REPORT_URL='https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues/new?template=content-removal.yml';
const HANS_URL='https://ro.hans-webgametw.com/';

export function SiteFooter({publicMode,feedbackHref}:{publicMode:boolean;feedbackHref:string}){
 return <footer className="site-footer" aria-label="網站聲明">
  <div className="site-footer-inner">
   <p className="site-footer-lead">HANS 粉絲維基 · 免費 · 非官方</p>
   <p className="site-footer-intro">本站專門整理 HANS 漢斯服的《RO 倖存者》裝備、卡片、怪物、關卡與職業天賦資訊；本網站由玩家獨立製作，與 HANS 伺服器營運團隊、遊戲開發者及權利人均無隸屬或合作關係。與其他版本的遊戲資料不混用。</p>
   <details className="site-footer-disclosure">
    <summary>資料來源與著作權聲明 <ChevronDown size={16} aria-hidden="true"/></summary>
    <div className="site-footer-disclosure-body">
     <p>本站依據 HANS 伺服器公開提供的遊戲資料建立搜尋索引，並將可確認的掉落路徑與僅有怪物關聯的卡片資料分開處理。遊戲可能更新，實際資訊以 HANS 遊戲內為準。</p>
     <p>本站為非商業的粉絲參考專案。遊戲相關名稱、內容、角色、圖片及商標權利仍歸各權利人所有。開放本站程式碼不代表遊戲素材獲得開放授權，非營利聲明亦不構成使用授權。</p>
     <p>若權利人對本站內容有疑慮，請使用下方 GitHub Issue 聯絡；請勿於公開 Issue 張貼個人資料或未公開權利證明。</p>
    </div>
   </details>
   <nav className="site-footer-links" aria-label="相關資訊">
    <a href="?page=combat"><Shield size={15} aria-hidden="true"/>戰鬥機制</a>
    <a href={feedbackHref} target="_blank" rel="noopener noreferrer"><MessageSquarePlus size={15} aria-hidden="true"/>問題回報／功能許願</a>
    <a href={HANS_URL} target="_blank" rel="noopener noreferrer">HANS 漢斯服 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">內容疑慮／下架聯絡 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href="https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io" target="_blank" rel="noopener noreferrer">資料站原始碼 <ExternalLink size={13} aria-hidden="true"/></a>
   </nav>
   {publicMode&&<p className="site-footer-note">遊戲圖片由訪客瀏覽器直接從 HANS 原站載入；本站與 GitHub 不另行保存或發布圖片檔。素材仍屬各權利人，這不代表本站擁有圖像授權。來源圖片失效時會自動使用替代圖示。</p>}
  </div>
 </footer>;
}
