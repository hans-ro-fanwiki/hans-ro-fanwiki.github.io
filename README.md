# RO Survivors｜掉落反查指南（非官方玩家維基）

手機 Safari 優先的繁體中文掉落反查圖鑑。四分類（裝備、卡片、關卡、職業）搭配單一搜尋框、冷卻／INT／DEX／爆擊快捷條件與更多屬性篩選；關卡直接同頁展開／收合並可篩選裝備、卡片、部位、職業與屬性，無重複關卡詳情頁。裝備與卡片顯示圖片、屬性、掉落關卡、怪物；玩家介面不顯示掉落權重、來源核實徽章、證據或程式雜湊。原始權重與核實資訊保留在 JSON 與開發文件。本網站與遊戲作者及 Gravity 無關。

**非官方粉絲站聲明與權利人聯絡：** 網頁頁尾提供可展開的「著作權與免責聲明」及 [內容疑慮／下架申請（GitHub Issue）](https://github.com/lockgipo/ro-survivors-wiki/issues/new?template=content-removal.yml)。這是**公開**的聯絡管道，請勿提交個資或機密；收到權利疑慮會優先查核，必要時儘速下架或調整。原始碼公開不代表遊戲素材已取得開放授權，非營利聲明也不等於自動取得使用許可。

- `npm ci && npm run build && npm test`：Linux / Windows 可執行的靜態檢查。
- `npm run dev`：本機測試。
- `node scripts/build-catalog.cjs <local-gitignored-research-dir>`：在本機以只讀研究資料重建**目前全部候選裝備／卡片／怪物 ID 的精簡檢索索引**（287／98／109），不代表官方完整資料庫；接著執行 `node scripts/sprite-metadata.mjs` 只補入怪物圖片的首幀裁切座標，仍不散布原站 JS、百科整站或遊戲圖片。
- `npm run check:source`：核對公開原站首頁 bundle 及 manifest 哈希；只報告差異，絕不自動發布變更。

資料版本與核對報告：`docs/SOURCE_AUDIT.json`、`docs/SOURCE_REPORT.md`；手機模擬測試：`docs/TEST_REPORT.md`。如需在本機用 Chrome 獨立配置跑 390px 測試，執行 `node scripts/mobile-smoke.mjs`（需保持 Dev Server 運作）。

**公開版圖片（非官方粉絲測試用途）：** 為便於玩家辨認，公開站以 RO Survivors 作者遊戲內 ID 精確對應的 **287 裝備、98 卡片、107 怪物小縮圖**（包含裝備額外 icon 合計 779 張，約 0.99 MB），另保留 10 張官方 Fan Kit 怪物插畫；未找到對應影格的 2 隻怪物保留一般圖示。只有低解析 WebP 檔公開，**不提交遊戲原始 PNG、完整怪物圖集或 JS bundle**。縮圖屬遊戲圖像的著作權衍生內容，非營利與下架聲明不代表已獲正式授權；圖片來源、風險與使用限制見 `docs/PUBLIC_ASSETS.md`。GitHub Pages Actions 於乾淨環境執行 `VITE_PUBLIC_MODE=1` 建置並核對 `node scripts/verify-public-dist.mjs` 逐一檢查縮圖來源與 SHA，不自動擷取新增遊戲圖像。

**私人版圖片：** 原站禁止其他網域直接載入圖片（403）。為供使用者**私人 Tailscale Dev 預覽**，執行 `npm run build` 後，手動設定環境變數 `PRIVATE_DEV_ASSETS=1` 並執行 `node scripts/prepare-private-art.mjs`。該腳本僅快取目前查詢需要的 PNG 到 gitignored `evidence/private-art`，並複製到 gitignored `dist/game-assets`，不把原圖提交至 GitHub、Pages、Vercel 或公開 CDN。`npm run build` 會清空 `dist`，之後必須重新執行這個私用快取步驟。未獲公開授權前不能部署這個含圖片的 `dist`。

**部署原則：** 使用者於 2026-11-17 明確同意像 LumiDex 一樣公開原始碼與 GitHub Pages（https://lockgipo.github.io/ro-survivors-wiki/），供遊戲群組朋友使用，網站為免費非官方粉絲指南，所有人都可能瀏覽。`main` 的單一 CI workflow 先跑測試、建立不含原版遊戲圖片的公開包，再部署至 GitHub Pages；`dev/**` 只測試、不部署。另保留電腦 Tailscale `http://100.116.225.68:4177/` 私人完整圖預覽，電腦及手機 Tailscale 都需在線。公開站使用專門裁切壓縮的低解析粉絲攻略辨識縮圖，遊戲原始 PNG／高解析 art／sprite atlas 不發佈；所有公開縮圖可依權利人通知快速移除。
