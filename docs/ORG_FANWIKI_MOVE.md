# HANS 粉絲維基：GitHub Organization 搬遷計畫

狀態：準備階段（尚未建立 Organization，尚未移轉／改名 Repository，尚未啟用新網址）。

## 目的與名稱
- Organization: `hans-ro-fanwiki`
- 目標 Repository: `hans-ro-fanwiki/hans-ro-fanwiki.github.io`
- 目標 GitHub Pages: https://hans-ro-fanwiki.github.io/
- 目前 Repo: `lockgipo/ro-survivors-hans-wiki`
- 目前 Pages: https://lockgipo.github.io/ro-survivors-hans-wiki/
- 站名：RO 倖存者｜HANS 粉絲維基。明確標示玩家自行製作，與 HANS 伺服器營運方沒有隸屬或合作關係。

## 執行順序（使用者已同意搬遷）
1. 使用者在 GitHub 建立免費組織 `hans-ro-fanwiki`，並確認自己為 Owner；**不要先建立同名 Repository**，避免阻礙完整移轉。
2. 確認該組織具有收取公開 Repository 的權限，且 ChatGPT 的 GitHub 連接可存取；必要時在該組織安裝 GitHub 連接。
3. 從現有 Repository 的 Settings → General → Danger Zone → Transfer，將其移到組織；可於移轉階段直接將 Repository 改名為 `hans-ro-fanwiki.github.io`，否則轉移後再改名。不要重建空倉庫來取代。
4. 核對移轉後 Git 歷史、main 分支、Issues、Actions、Pages；檢查環境保護與發佈權限。
5. 重新確認 `dev/org-hans-ro-fanwiki-20261119` 準備分支與 main 沒有衝突；完成 Linux typecheck、test、Vite public build、公開資產檢查；**此時才合併**搬遷設定。
6. 讓 GitHub Actions 部署組織首頁，驗證根網址 HTTP 200、主畫面與 data/catalog.json 同源載入、行動版、canonical、內容疑慮連結，以及 `server: hans` 資料。
7. 更新 `PROJECT_CONTEXT.md`／`AGENTS.md`／`README.md` 現況，增加 CHANGELOG 紀錄，並將本計畫狀態改為完成；本機 origin URL 更新。
8. 舊 Pages URL 不會自動轉址。如果需要保留舊書籤，評估舊 repo 位置建立轉址頁（但此舉會取消 GitHub 對舊 Repo URL 的自動重新導向），不應在沒有評估前重建同名 repo。

## 風險與驗證
- 僅改變名稱、網址、站台標示；不得變更 HANS 遊戲資料或引入未授權素材。
- `vite.config.ts` 已採 `base:'./'`；目前資產相對路徑可支援 root Pages。仍應在新網址實測搜尋、分頁與查詢網址。
- Organization 公開成員、Git 提交作者及歷史記錄可能仍連結至個人帳號；新網址隱去個人帳號**不等於完全匿名**。
- 原 Repo 在移轉與正式驗證前保持正常營運；本分支不得自動部署到正式網站。
