# RO Survivors｜掉落反查指南（獨立 Dev 專案）

手機 Safari 優先的繁體中文掉落反查圖鑑。四分類（裝備、卡片、關卡、職業）搭配單一搜尋框、冷卻／INT／DEX／爆擊快捷條件與更多屬性篩選；關卡直接同頁展開／收合並可篩選裝備、卡片、部位、職業與屬性，無重複關卡詳情頁。裝備與卡片顯示圖片、屬性、掉落關卡、怪物；玩家介面不顯示掉落權重、來源核實徽章、證據或程式雜湊。原始權重與核實資訊保留在 JSON 與開發文件。本網站與遊戲作者及 Gravity 無關。

- `npm ci && npm run build && npm test`：Linux / Windows 可執行的靜態檢查。
- `npm run dev`：本機測試。
- `node scripts/build-catalog.cjs <local-gitignored-research-dir>`：在本機以只讀研究資料重建**目前全部候選裝備／卡片／怪物 ID 的精簡檢索索引**（287／98／109），不代表官方完整資料庫；接著執行 `node scripts/sprite-metadata.mjs` 只補入怪物圖片的首幀裁切座標，仍不散布原站 JS、百科整站或遊戲圖片。
- `npm run check:source`：核對公開原站首頁 bundle 及 manifest 哈希；只報告差異，絕不自動發布變更。

資料版本與核對報告：`docs/SOURCE_AUDIT.json`、`docs/SOURCE_REPORT.md`；手機模擬測試：`docs/TEST_REPORT.md`。如需在本機用 Chrome 獨立配置跑 390px 測試，執行 `node scripts/mobile-smoke.mjs`（需保持 Dev Server 運作）。

**圖片：** 原站禁止其他網域直接載入圖片（403）。為供使用者**私人 Tailscale Dev 預覽**，執行 `npm run build` 後，手動設定環境變數 `PRIVATE_DEV_ASSETS=1` 並執行 `node scripts/prepare-private-art.mjs`。該腳本僅快取目前查詢需要的 PNG 到 gitignored `evidence/private-art`，並複製到 gitignored `dist/game-assets`，不把原圖提交至 GitHub、Pages、Vercel 或公開 CDN。`npm run build` 會清空 `dist`，之後必須重新執行這個私用快取步驟。未獲公開授權前不能部署這個含圖片的 `dist`。

**部署原則：** GitHub 使用獨立 private repo；目前只在電腦的 Tailscale IP `100.116.225.68:4177` 提供隔離 Dev Preview（電腦及管理中的 Vite Preview 需持續運作，手機需連 Tailscale）。2026-11-17 透過 GitHub API 嘗試為 private repo 開通 Pages，回傳 HTTP 422：`Your current plan does not support GitHub Pages for this repository.` 相同帳號的公開 LumiDex repo 有已啟用的 Pages；本專案**未獲改為公開 repo 的授權**，因此不擅自改 visibility 或上公共正式站。另有遊戲圖片公開再散布權利未解決，公開部署不可包含私人圖檔。Vercel 帳號 scope 未授權，沒有使用。
