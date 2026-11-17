# RO Survivors｜掉落反查指南（獨立 Dev 專案）

手機 Safari 優先的繁體中文圖鑑。可直接點選「刷飾品」「法師裝備」「冷卻卡片」「目前可刷關卡」，不需輸入。資料核對分為遊戲原站已核實、非官方待核、目前來源不明。此站與遊戲作者及 Gravity 無關。

- `npm ci && npm run build && npm test`：Linux / Windows 可執行的靜態檢查。
- `npm run dev`：本機測試。
- `node scripts/build-catalog.cjs <local-gitignored-research-dir>`：在本機以只讀研究資料產生**目標查詢子集**；不散布原站 JS、百科整站或遊戲圖片。
- `npm run check:source`：核對公開原站首頁 bundle 及 manifest 哈希；只報告差異，絕不自動發布變更。

資料版本與核對報告：`docs/SOURCE_AUDIT.json`、`docs/SOURCE_REPORT.md`。

**圖片狀態：** 原站圖片 ID 與資產路徑已記錄；使用授權／外部引用未獲確認，目前 Preview 僅呈現原創 CSS 中性圖示，不載入受保護的遊戲圖像。

**部署原則：** GitHub 使用獨立 private repo，正式 production 禁止直接部署。Preview 由 Vercel 預覽環境生成，不自動跟 production branch 發布。
