# HANS 粉絲維基：GitHub Organization 搬遷紀錄

狀態：原始 Repository 已移轉、改名；GitHub Pages 已設為 Workflow 發布，**等待 PR #9 合併及新網址實際驗收**。

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

## 正式驗收清單
- [ ] 合併 PR #9 到 `main`，只在 Linux typecheck、tests、public build、asset guard 通過後操作
- [ ] 確認新的 `main` GitHub Actions Pages deploy 為 success
- [ ] `https://hans-ro-fanwiki.github.io/` 回應 HTTP 200，HTML title 與 canonical 正確
- [ ] `https://hans-ro-fanwiki.github.io/data/catalog.json` 同源載入且 `server:'hans'`
- [ ] 搜尋、裝備／卡片／關卡、手機窄螢幕、Issue / GitHub 原始碼連結正常
- [ ] 覆查 README/AGENTS/PROJECT_CONTEXT 正式現況；新組織 GitHub App 安裝權限視需要設定
- [ ] 遷移驗收後更新本檔為完成狀態

## 風險與注意
- 移轉後 GitHub Repository URL 可以自動導向新 GitHub Repository，但**原 GitHub Pages 網址不保證轉址**；不要把舊 Pages 書籤視為有遷移保障。
- 若日後需要舊 Pages 轉址，需另行設計；直接於個人帳號重建同名 repo 可能干擾 GitHub 舊 Repository URL 重新導向。
- Organization 會員資訊、公開 Git 提交作者與歷史仍可能暴露個人帳號；網址中不出現 `lockgipo` 不等於匿名。
- 只變更維基名稱、連結、頁面宣告；禁止引入未授權 HANS 原始圖片、舊 Coffee 資料或機密資訊。
- 本站仍是 HANS-only；上游有無更新的監控不自動將未核實資料送上正式。
