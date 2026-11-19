# RO 倖存者｜漢斯服維基（HANS）：專案狀態（2026-11-19）

## 實際來源與分支
- Repository: `lockgipo/ro-survivors-hans-wiki`（由舊 `ro-survivors-wiki` 更名；維持歷史提交與分支）。
- HANS 專屬網站預定網址：https://lockgipo.github.io/ro-survivors-hans-wiki/。GitHub Pages 專案站改名後舊網址**不保證轉址**，新網址需經 main 正式部署並驗證才能宣告上線。
- 工作分支：`dev/hans-only-wiki-20261119`，從 `main` commit `20585eb` 切出；`main` 仍為舊版，HANS 內容未合併／未部署。此次更改網址與 Repo 名稱，不代表 HANS 頁面已正式發布。
- 開發主機根目錄：`C:\AI-Workspace\ro-survivors-wiki`。
- HANS 唯一上游遊戲網址：https://ro.hans-webgametw.com/。
- 所有新版靜態資料以 `docs/HANS_SOURCE_AUDIT.json` 記錄的 2026-11-19 HANS bundle SHA-256／manifest 為準；不混用咖啡版 `ro-survivors.com` 的數據、素材或 twRO 數值。

## 目前已實作
- 獨立重新擷取 `public/data/catalog.json`（`server: hans`）：
  - 523 筆 HANS 裝備；437 筆有至少一個官方登錄來源，未確認裝備預設隱藏
  - 188 筆 HANS 卡片，實際 HANS 修飾器效果已抽取；怪物名稱關聯不當直接掉卡證明
  - 195 筆怪物；17 筆關卡（第二章 5 筆）；怪物池 207 個關卡關聯
- `scripts/import-hans-source.cjs` 使用 TypeScript AST **只解析本機 Gitignored 快照，不執行原站 JavaScript**；SHA 不符就中止。HANS 主程式／模組／manifest 的原始完整檔案放 `evidence/hans-20261119`，不放入公開 Git。
- `src/main.tsx` 保留三個頁面：裝備／卡片／關卡；支援繁中 + 英文原名與屬性搜尋、部位與職業篩選、雙向反查，HANS-only guard，深色主題。
- 官方監控 `scripts/check-official.mjs` 已切 HANS，`source-check.yml` 仍每天一次提醒 GitHub Issue，不做自動改版或正式部署。
- 原咖啡版 WebP／FanKit、來源審核文件、舊驗證腳本已從 Dev 追蹤移除；新公開建置禁止輸出未獲授權圖片，和私人 HANS 來源研究快照分隔。
- `tests/hans-catalog.test.mjs`：8 項新測試；TypeScript／Vite／公開 dist 安全檢查已通過（2026-11-19）。HANS 上游偶發 HTTP 503，後已恢復且三個來源 SHA 核對相同。

## 關鍵不確定性
- 卡片 `Me` register 表示卡片與怪物對應，**不保證掉卡**；卡片來源暫為 candidate。需追查直接掉卡／扭蛋／活動限定。
- 角色裝備職業限制、二三轉、特殊掉落、季節活動開放與遊戲圖片尚未完整確認；第二章 Tier 依周目可能 T6–8，不能用關卡最高 Tier 當每件裝備實際等級。
- 本次主改版發生在 Dev，**使用者未在本次對話明確要求直接上正式**，禁止擅自修改 main，等待發布授權。

## 後續步驟
1. 檢查 HANS 2026-11-19 最新遊戲與資料差異，修正卡片、活動、劇情取得管道；保守處理來源／掉落率。
2. 檢查圖片的私人預覽顯示與公開授權；若暫不發布圖片則使用中性佔位圖示，禁止沿用咖啡版圖片。
3. 更新及驗證前端搜尋與關卡 UI，Chrome 模擬窄螢幕／iPhone Safari 待實際驗收。
4. 變更推送 `dev/**` 啟動 Linux CI；確定一致後向使用者說明發布條件，經批准才合併 main。

本檔是活的交接紀錄。以 Git branch、原始碼、測試和審核 SHA 為準，不用過去對話推測專案狀態。
