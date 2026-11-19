# RO Survivors｜掉落反查指南（非官方玩家維基）

## 2026-11-19 正式版：卡片取得來源全面核對與最新版資料

- **公開網站：** https://lockgipo.github.io/ro-survivors-wiki/ 。2026-11-19 使用者明確授權完成新一輪校對後直接發布。
- 最新已核對官方主程式 `main-DYrSsWlK.js`、資料模組 `soul_linker-DK2o6MJV.js`，連同同版 manifest 均有 SHA-256 保存在 `docs/SOURCE_AUDIT.json`。原始作者 JS 只保留 gitignored 本地證據，不上傳 GitHub。
- **98 張卡片重新核對**：77 張已確認於正常關卡怪物掉落、9 張來自節慶扭蛋、白素貞扭蛋 1 張（ID 4372）、蛇王扭蛋 1 張（ID 4330）。另 10 張暫無可核實正常關卡（包含僅劇情場景、未開放關卡或根本尚未列入已開放怪物池），不虛構來源。
- 注意「失事輪」一般刷圖與 `sunken_story` 獨立劇情版不同；`prt_castle` 是劇情限定，不可宣稱掉落一般怪物卡片；燈籠節本身的直接怪物卡片掉落關閉，改用節慶扭蛋。墨蛇君是活動稀有 Boss，但**卡片來源為蛇王扭蛋**，不是打到 Boss 就直接掉卡。
- **287 件裝備**物品 ID 與裝備欄位全部核對；171 件數字基礎 ATK/MATK/DEF 有直接官方定義核對；50 件節慶裝備、9 件起始裝備及原有 155 筆怪物裝備掉落保持正確。其他 108 件未核實來源裝備仍預設隱藏、可切換查看。
- 卡片星級效果／數字說明及部分裝備效果、職業限制**尚未逐條完全驗證**，仍保留原有候選資料，不宣稱全資料零誤差。新官方客戶端可能再次更新；使用同一套人工審核 + 每日差異通知，不自動部署未核實內容。

## 2026-11-18（歷史）官方資料核實、深色介面及來源更新提醒

**歷史記錄：本節於 2026-11-19 經 PR #6 合併並正式發布，不再是待發布 Dev 版本。**

- 已依 2026-11-18 作者現行公開遊戲程式與物品資源清單逐一核對 287 裝備／98 卡片的原文 ID 與繁體名稱，修正 6 個名稱差異，保留不衝突的舊譯及英文搜尋別名。遊戲作者自身繁體翻譯優先，twRO 表只做舊版備援；遊戲屬性與卡片效果不能套用原版 RO 數值。
- 已核實 50 件燈籠節限定扭蛋裝備，來源顯示「燈籠節限定扭蛋」，全部標示已核實的 Tier 2；同名一般／活動變種仍按各自 item ID、星級屬性區分。還有 9 件角色初始裝備有官方取得來源，但不憑空指定 Tier。
- 其餘 108 件沒有可信具體取得管道（96 件未收錄任何來源、12 件只有候選劇情／獎勵資料）**預設不顯示**；勾選「顯示取得方式未確認的裝備」可恢復查看 287 件，URL 支援 `?unknown=1`。保留項目資料與直接詳情 URL，不推測會掉落。
- 底部導航精簡成裝備／卡片／關卡；職業仍可於裝備與關卡篩選。關卡可全部展開／收合並能同時開啟多關；使用已核對、原本允許公開的 Boss 低解析 WebP 作關卡縮圖，沒有可信代表圖則退回通用圖示，不新發佈官方原圖。
- 改為深石板色搭配低飽和青綠主題，整理 iPhone 搜尋與篩選橫向溢出、抽屜及頁尾對比。沒有加入額外 UI 套件。
- `.github/workflows/source-check.yml` **每天一次**檢查官方主 JS、遊戲資料 JS、素材清單的 SHA-256 是否與審核版本不同；偵測到異動時用 GitHub Issues 建立／更新一個去重提醒，不自動更新資料或部署。GitHub Issues 通知是否推送至手機依自己的 GitHub 通知設定。
- 原始遊戲 JS 只存於 gitignored `evidence/current-source-20261118/`，不會提交到公開 Repo。重跑核實需從遊戲原站重新取得最新檔案、人工驗證規則及內容，再執行 `node scripts/reconcile-official.cjs <gitignored-official-snapshot-directory>`。遇到不一致會中止而不是盲目套新版本。舊候選索引重建器已保護，避免覆寫。
- 自動測試：`npm run typecheck`、`npm test`（28 項）、`npm run build`、`node scripts/verify-public-dist.mjs`、`npm run check:source`；iPhone Chrome 模擬可執行 `node scripts/dark-ui-smoke.mjs`（需在 127.0.0.1:5188 執行 Dev server），驗證 320/375/390/430px 與主要操作。真實 iPhone Safari 待使用者驗收。

手機 Safari 優先的繁體中文掉落反查圖鑑。三分類（裝備、卡片、關卡）搭配單一搜尋框；裝備頁**直接顯示部位與職業**，其他冷卻／INT／DEX／爆擊／取得方式等集中在「更多篩選」。關卡直接同頁展開／收合並可篩選裝備、卡片、部位、職業與屬性，無重複關卡詳情頁。裝備與卡片顯示圖片、屬性、掉落關卡、怪物；玩家介面不顯示掉落權重、來源核實徽章、證據或程式雜湊。原始權重與核實資訊保留在 JSON 與開發文件。本網站與遊戲作者及 Gravity 無關。

**非官方粉絲站聲明與權利人聯絡：** 網頁頁尾提供可展開的「著作權與免責聲明」及 [內容疑慮／下架申請（GitHub Issue）](https://github.com/lockgipo/ro-survivors-wiki/issues/new?template=content-removal.yml)。這是**公開**的聯絡管道，請勿提交個資或機密；收到權利疑慮會優先查核，必要時儘速下架或調整。原始碼公開不代表遊戲素材已取得開放授權，非營利聲明也不等於自動取得使用許可。

- `npm ci && npm run build && npm test`：Linux / Windows 可執行的靜態檢查。
- `npm run dev`：本機測試。
- **官方資料更新：**先取得並人工檢查原站快照至 gitignored 研究資料夾，使用 `node scripts/reconcile-official.cjs evidence/current-source-20261119` 核對固定 ID、譯名、裝備／卡片／扭蛋／關卡關係。舊 `build-catalog.cjs` 為封存候選重建器，預設停用，不能用於覆蓋目前已核實的正式資料。
- `npm run check:source`：核對公開原站首頁 bundle 及 manifest 哈希；只報告差異，絕不自動發布變更。

資料版本與核對報告：`docs/SOURCE_AUDIT.json`、`docs/SOURCE_REPORT.md`；台版 RO 物品 ID 中文對照、Tier 來源與例外：`docs/TWRO_LOCALIZATION.md`、`docs/TWRO_NAMES.json`；手機模擬測試：`docs/TEST_REPORT.md`。

**台版中文化／Tier（2026-11-18 核准正式發布）：** 已按台版 twRO 數字 ID 對照 281 件裝備、98 張卡片與 98 隻對應怪物，3 件未見台版對照裝備及 5 隻特殊怪物採明確標記的手動譯名，其他未對應者保留原文。英文原名及不衝突的舊中文仍可搜尋。移除清單名稱後的 `#物品ID`；每件裝備顯示從**取得關卡**可核對的 Tier，未知則明確標示未確認，不能把武器等級誤當 Tier。此版本由 `dev/twro-tier-filters-20261117` 驗證後合併 `main`，依既有 Linux CI 部署至正式 GitHub Pages。如需在本機用 Chrome 獨立配置跑 390px 測試，執行 `node scripts/mobile-smoke.mjs`（需保持 Dev Server 運作）。

**公開版圖片（非官方粉絲測試用途）：** 為便於玩家辨認，公開站以 RO Survivors 作者遊戲內 ID 精確對應的 **287 裝備、98 卡片、107 怪物小縮圖**（包含裝備額外 icon 合計 779 張，約 0.99 MB），另保留 10 張官方 Fan Kit 怪物插畫；未找到對應影格的 2 隻怪物保留一般圖示。只有低解析 WebP 檔公開，**不提交遊戲原始 PNG、完整怪物圖集或 JS bundle**。縮圖屬遊戲圖像的著作權衍生內容，非營利與下架聲明不代表已獲正式授權；圖片來源、風險與使用限制見 `docs/PUBLIC_ASSETS.md`。GitHub Pages Actions 於乾淨環境執行 `VITE_PUBLIC_MODE=1` 建置並核對 `node scripts/verify-public-dist.mjs` 逐一檢查縮圖來源與 SHA，不自動擷取新增遊戲圖像。

**私人版圖片：** 原站禁止其他網域直接載入圖片（403）。為供使用者**私人 Tailscale Dev 預覽**，執行 `npm run build` 後，手動設定環境變數 `PRIVATE_DEV_ASSETS=1` 並執行 `node scripts/prepare-private-art.mjs`。該腳本僅快取目前查詢需要的 PNG 到 gitignored `evidence/private-art`，並複製到 gitignored `dist/game-assets`，不把原圖提交至 GitHub、Pages、Vercel 或公開 CDN。`npm run build` 會清空 `dist`，之後必須重新執行這個私用快取步驟。未獲公開授權前不能部署這個含圖片的 `dist`。

**部署原則：** 使用者於 2026-11-17 明確同意像 LumiDex 一樣公開原始碼與 GitHub Pages（https://lockgipo.github.io/ro-survivors-wiki/），供遊戲群組朋友使用，網站為免費非官方粉絲指南，所有人都可能瀏覽。`main` 的單一 CI workflow 先跑測試、建立不含原版遊戲圖片的公開包，再部署至 GitHub Pages；`dev/**` 只測試、不部署。另保留電腦 Tailscale `http://100.116.225.68:4177/` 私人完整圖預覽，電腦及手機 Tailscale 都需在線。公開站使用專門裁切壓縮的低解析粉絲攻略辨識縮圖，遊戲原始 PNG／高解析 art／sprite atlas 不發佈；所有公開縮圖可依權利人通知快速移除。
