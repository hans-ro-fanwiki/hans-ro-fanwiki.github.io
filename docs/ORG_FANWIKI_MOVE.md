# HANS 粉絲維基：GitHub Organization 搬遷紀錄

狀態：**已完成（2026-11-19）**。原始 Repository 已移轉、改名，PR #9 已合併，GitHub Pages 透過 Actions 成功部署並完成 HTTP 與手機版驗證。

## 正式識別
- Organization: `hans-ro-fanwiki`（已建立；使用者為 Owner）
- Repository: https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io
- 組織 Pages 根網址: https://hans-ro-fanwiki.github.io/
- 原始 Repository: `lockgipo/ro-survivors-hans-wiki`（移轉前）
- 原始 Pages: https://lockgipo.github.io/ro-survivors-hans-wiki/
- 站名：**RO 倖存者｜HANS 粉絲維基**，明確標示「非官方玩家製作」，與 HANS 營運團隊、遊戲權利人沒有隸屬或合作關係。

## 已完成（2026-11-19）
1. 使用者建立免費 Organization，登入使用者 `lockgipo` 的 `gh` 認證查證組織會員為 `admin/active`。
2. 透過 GitHub 官方 Repository Transfer API 將原始 Repository 移到新組織，並同時改名為 `hans-ro-fanwiki.github.io`。
3. 移轉前後 Repo ID **1460983693** 一致，`main`、Dev 分支與 PR #9 保留，原始提交歷史不重建。
4. Pages 配置從 API 確認 `html_url=https://hans-ro-fanwiki.github.io/`、`build_type=workflow`、`https_enforced=true`；Actions 已啟用。開發電腦的 `origin` 已換新 remote。
5. 搬遷準備分支 `dev/org-hans-ro-fanwiki-20261119`：網站品牌、非官方聲明、canonical、原始碼與 Issue 連結均改為新站，Dev CI 初版通過。

## 正式驗收結果（2026-11-19）
- [x] PR #9 已合併到 `main`：commit `5891aad4656e0b785cdf050e25c8e91e4b32062d`，版本 0.2.1
- [x] GitHub Actions #44548771895 驗證與 GitHub Pages 部署皆為 success（Ubuntu Linux，無 macOS）
- [x] https://hans-ro-fanwiki.github.io/：HTTP 200；title 為「RO 倖存者｜HANS 粉絲維基」、canonical 為組織首頁、非官方聲明存在
- [x] /data/catalog.json：HTTP 200；`server:'hans'`；523 裝備、188 卡片、195 怪物、17 關卡；前端 JavaScript 資產 HTTP 200
- [x] 本機 Chrome / Playwright 互動 smoke：裝備篩選、卡片效果與關卡展開正常，320/375/390/430px 無水平溢出或 JS 例外
- [x] README、AGENTS、PROJECT_CONTEXT 已改為新倉庫與網站；Repository description/homepage 同步更新
- [x] 原始 Pages URL 實測 HTTP 404；已知舊書籤不會自動轉址

補充：ChatGPT 連接的 GitHub App 目前只安裝於個人帳號，未顯示新 Organization；日後如要直接使用該連接編輯新組織 Repo，可由組織 Owner 另行授權。OpenChatX 本機 `gh` CLI 已可管理新倉庫。

## 風險與注意
- 移轉後 GitHub Repository URL 可以自動導向新 GitHub Repository，但**原 GitHub Pages 網址不保證轉址**；不要把舊 Pages 書籤視為有遷移保障。
- 若日後需要舊 Pages 轉址，需另行設計；直接於個人帳號重建同名 repo 可能干擾 GitHub 舊 Repository URL 重新導向。
- Organization 會員資訊、公開 Git 提交作者與歷史仍可能暴露個人帳號；網址中不出現 `lockgipo` 不等於匿名。
- 只變更維基名稱、連結、頁面宣告；禁止引入未授權 HANS 原始圖片、舊 Coffee 資料或機密資訊。
- 本站仍是 HANS-only；上游有無更新的監控不自動將未核實資料送上正式。
