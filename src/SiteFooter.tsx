import {ChevronDown,ExternalLink} from 'lucide-react';
import './site-footer.css';

const REPORT_URL='https://github.com/lockgipo/ro-survivors-wiki/issues/new?template=content-removal.yml';
const HANS_URL='https://ro.hans-webgametw.com/';

export function SiteFooter({publicMode}:{publicMode:boolean}){
 return <footer className="site-footer" aria-label="網站聲明">
  <div className="site-footer-inner">
   <p className="site-footer-lead">HANS 專屬 · 免費 · 非官方玩家資料站</p>
   <p className="site-footer-intro">本站專門整理 HANS 漢斯服的《RO 倖存者》裝備、卡片、怪物與關卡資訊；並非遊戲開發者或權利人的官方網站。與其他版本的遊戲資料不混用。</p>
   <details className="site-footer-disclosure">
    <summary>資料來源與著作權聲明 <ChevronDown size={16} aria-hidden="true"/></summary>
    <div className="site-footer-disclosure-body">
     <p>本站依據 HANS 伺服器公開提供的遊戲資料建立搜尋索引，並將可確認的掉落路徑與僅有怪物關聯的卡片資料分開處理。遊戲可能更新，實際資訊以 HANS 遊戲內為準。</p>
     <p>本站為非商業的粉絲參考專案。遊戲相關名稱、內容、角色、圖片及商標權利仍歸各權利人所有。開放本站程式碼不代表遊戲素材獲得開放授權，非營利聲明亦不構成使用授權。</p>
     <p>若權利人對本站內容有疑慮，請使用下方 GitHub Issue 聯絡；請勿於公開 Issue 張貼個人資料或未公開權利證明。</p>
    </div>
   </details>
   <nav className="site-footer-links" aria-label="相關資訊">
    <a href={HANS_URL} target="_blank" rel="noopener noreferrer">HANS 漢斯服 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">內容疑慮／下架聯絡 <ExternalLink size={13} aria-hidden="true"/></a>
    <a href="https://github.com/lockgipo/ro-survivors-wiki" target="_blank" rel="noopener noreferrer">資料站原始碼 <ExternalLink size={13} aria-hidden="true"/></a>
   </nav>
   {publicMode&&<p className="site-footer-note">公開版本目前不附帶未經獨立審核的 HANS 原始遊戲圖像；私人開發預覽顯示的遊戲來源圖片不包含在公開發佈物中。</p>}
  </div>
 </footer>;
}
