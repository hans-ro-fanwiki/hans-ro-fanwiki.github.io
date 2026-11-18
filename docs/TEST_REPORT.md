# P1 私人 Dev／Preview 版驗證（2026-11-17）

## 2026-11-18 Dev：官方來源核對與深色操作版

- 本機獨立分支 `dev/source-integrity-dark-ui-20261118`，**未合併正式**。已核實新版官方 `main-CsViiXMb.js`／`soul_linker-DH9JY1wS.js`／資源 manifest 的 SHA-256，`npm run check:source` 3/3 unchanged。
- `npm run typecheck` **PASS**、`npm test` **28/28 PASS**。增加 4 項取得來源測試：179 件預設可見、108 件隱藏（96 件無來源、12 件候選）；50 件燈籠節扭蛋（Tier 2）與 9 件起始裝備的官方證據；6 筆遊戲官方中文更新與別名。
- `npm run build` **PASS**、`node scripts/verify-public-dist.mjs` **PASS**：舊版審核 789 張 WebP，合計 1,005,658 bytes，沒有原始 PNG 或任何私有 JS／圖片。最新版遊戲資料 SHA 與舊版已授權微縮圖 SHA 分開保存，不能因來源更新自動重新發布圖片。
- `node scripts/dark-ui-smoke.mjs` **PASS**：Headless Chrome iPhone 模擬 320、375、390、430px 橫向溢出 0；暗色卡片主題、三個底部頁籤、預設 179／手動 287 件、隱藏的冰靈拳刃可選查看、1663 波爾多之杖活動扭蛋詳情與 Tier 2、八關全部展開／全部收合／兩關同時展開、Boss 縮圖、JS exceptions 0。
- 初次模擬測試發現橫向滑動篩選使 390px viewport 內容寬度錯誤擴展到 645px、阻擋詳情關閉按鈕；加入 `min-width:0;max-width:100%` 限制後重測全數正常。測試獨立 Chrome 由程式 `finally` 關閉，不動日常瀏覽器。
- 新版來源監測 workflow `source-check.yml` 每日執行一次（UTC 20:19／台灣 04:19），變更才開啟／更新同一個 GitHub Issue。**不自動修改資料或部署**；真正 Issue 通知的 GitHub Actions 上線流程需 Dev 核對與用戶 GitHub 通知設定配合。
- 真實 iPhone Safari 及 GitHub Actions 遠端 CI 需要再驗證後才能進一步提出正式合併。

## Dev 台版名稱、Tier 與主要篩選（2026-11-17）

- 原站 `npm run check:source` 三份 SHA-256 完全一致，仍為本次核對的遊戲版本。僅從目前遊戲 main bundle 的關卡 `tier` 確認 10 個關卡 Tier 值，不將 `wlv` 武器等級誤當物品 Tier。
- twRO 表經編號精準對照 281/287 件裝備、98/98 張卡片及 98 隻卡片關聯怪物。三項特殊裝備與五隻特殊怪物另有人工翻譯；舊譯保留為不與正式新名稱衝突的搜尋別名。
- `npm run typecheck` PASS，`npm test` **24/24 PASS**；`VITE_PUBLIC_MODE=1 npm run build` PASS，`node scripts/verify-public-dist.mjs` PASS：共 789 個 WebP 檔、1,005,658 bytes，無原始 PNG。
- `node scripts/public-smoke.mjs` Chrome 手機 320/375/390/430px PASS：主要裝備部位與職業、收合進階篩選、項鍊（台版體力項鏈）Tier 2、武士刀 Tier 1／2、圖片與聲明均正確，私有 `/game-assets/` 請求 0、JS errors 0。
- `node scripts/mobile-smoke.mjs` Chrome 觸控完整流程 PASS：衣服篩選 29 件、智力／冷卻查詢、關卡篩選／單一展開、從裝備反查柏伊亞嵐島、海神怪物詳情、螢幕無水平溢出。
- `dev/twro-tier-filters-20261117` 於 2026-11-17 完成驗收、Linux CI 成功；使用者於 2026-11-18 核准合併正式 `main`，由原有 Pages 工作流程部署。真實 iPhone Safari 驗收仍待回報。


## 公開粉絲測試維基實際遊戲縮圖（2026-11-17）

- 原站 asset manifest 版本已核對且未變更：`bdbde78da2fd3d8c9084291935a279f2af53f4b456f1141aba6b1fce2db6f526`。
- 本機私人快取 720 張原始 PNG，產出共 779 個微縮 WebP（287 裝備 art + 287 icon + 98 卡面 + 107 怪物代表幀），公開版總計 789 WebP（另 10 張 RO Fan Kit 插畫），合計 1,005,658 bytes；**零原始 PNG 或 sprite atlas**。
- `npm run build` 公開 TypeScript + Vite PASS、`node scripts/verify-public-dist.mjs` 所有小圖 ID/尺寸/SHA-256/PATH 白名單 PASS、`npm test` 21/21 PASS。
- `node scripts/public-smoke.mjs` Windows Chrome Headless PASS：320/375/390/430px、測試站聲明展開、裝備清單、項鍊詳情、波利卡片詳情、波利怪物原站代表幀均成功載入，無 `/game-assets/` 請求、JS errors = 0。
- `ink_snake` / `ink_serpent` 兩個怪物欠缺原站同名 sprite，以通用佔位顯示；使用者 iPhone Safari 驗收待回報。
- 低解析縮圖仍涉及原圖著作權；非營利、出處與聯絡下架管道不構成授權證明。重要使用範圍及撤圖流程見 `docs/PUBLIC_ASSETS.md`。


## 非官方粉絲網站聲明與聯絡入口（2026-11-17）

- 公開模式 TypeScript/Vite build PASS；`npm test` **19/19 PASS**。
- `node scripts/verify-public-dist.mjs` PASS：公開版依舊只有已核准 10 張官方 Fan Kit 小縮圖；私人原版遊戲圖沒有進入公開包。
- Windows Chrome Playwright 觸控測試 `node scripts/public-smoke.mjs` PASS：驗證首頁有非官方／非營利聲明、著作權詳情初始收合、點擊展開成功、權利人文字與 GitHub 專屬聯絡表單 URL 正確、展開時 320px 無水平溢出。
- 同一測試涵蓋 320、375、390、430px、原有怪物縮圖及無私人圖片請求、JavaScript 頁面錯誤 0。GitHub Issues 已確認啟用；公開 Issue 可能被所有人閱讀，介面與表單均提醒不得上傳私人資料。
- 使用者 iPhone Safari 真機驗收尚未進行。


## 公開版 Fan Kit 與 Pages（2026-11-17）

- 19/19 單元測試及 TypeScript/Vite 公開模式建置成功。
- `node scripts/verify-public-dist.mjs` PASS：只含 10 張官方 Fan Kit 96×96 WebP（17,042 Bytes）；沒有私人 `game-assets/` 或 `evidence/`、原圖 PNG 或其他圖像。
- `node scripts/public-smoke.mjs` PASS：Windows Chrome Headless 390px 觸控模擬；波利官方插畫載入 96px，裝備沒載入 RO Survivors 原圖，`/game-assets/` 請求 0、JS errors 0，320/375/390/430px 無橫向溢出。
- 圖像官方來源、署名與條件：`docs/PUBLIC_ASSETS.md`；公開發布後仍需使用者 iPhone Safari 驗收。


## 2026-11-17 最新版驗收補充（屬性搜尋／摺疊關卡）

此節為新版結果，以下歷史 P1 測試內容僅代表舊版（包括過去曾顯示的掉落權重），**不代表目前仍顯示該欄位**。

- Node 測試 **18/18 PASS**：新增屬性數量、中文別名、搜尋+屬性 AND 組合、匹配屬性文字呈現四項測試。
- `npm run build`（TypeScript + Vite）：PASS。
- `node scripts/mobile-smoke.mjs`：PASS（Windows Chrome headless 觸控模擬）；首頁搜尋、衣服29、INT中文別名（裝備6／卡片2）、冷卻（裝備21／卡片5）、進階篩選收合與清除、關卡展開/屬性/裝備卡片切換、單關展開、從項鍊反查關卡及移除權重文字。
- 320／375／390／430px 的展開關卡均無水平溢出；瀏覽器 JavaScript pageerror = 0。
- 私人圖片 720/720 恢復至 `dist/game-assets`；本機 Vite Preview 保留。
- GitHub Pages（private repo）建立嘗試回傳 HTTP 422，因目前方案不支援此倉庫；未修改 visibility、未發布公開站。
- **尚待使用者 iPhone Safari 真機驗收。**


## 驗收範圍

依使用者 iPhone 截圖與後續回報修改：
- 首頁移除四個大型快捷卡；直接顯示「裝備、卡片、關卡、職業」分類及點選式篩選。
- 不在玩家畫面顯示來源核實徽章、證據鍵、SHA、技術說明；內部 JSON 仍保留核對狀態。
- 裝備清單和詳情顯示名稱、對應圖片、ATK/MATK/DEF（有資料時）、附加屬性與星號效果。
- 關卡抽屜直接顯示已收錄的裝備及卡片、圖片、屬性摘要、來源怪物／Boss、原站確認的掉落權重。
- 樹精卡片 4010 的卡面與「+5 冷卻縮減」正常顯示；怪物圖片使用原站 sprite sheet 的單一 frame（保留 atlas bounds）。
- 非官方候選來源未改標為官方。若無法由原站核實掉落關係，介面使用「可能掉落」而非「保證掉落」；`rate` 未驗證百分比語意，僅顯示「掉落權重」。

## 測試結果

測試環境：Windows Chrome Headless + Playwright，390×844 iPhone 觸控模擬；**不是 Safari 真機測試**。
私人網址：`http://100.116.225.68:4177/`，僅 Tailscale 裝置可連。手機需要開啟 Tailscale，電腦要維持開機及 OpenChatX 預覽服務運行。

| 檢查 | 結果 |
|---|---|
| TypeScript + Vite build | 通過 |
| 資料單元測試 | 14/14 通過（完整 ID、九種部位、卡片效果、圖片影格、來源狀態） |
| 首頁與三類主要反查 | 通過（裝備飾品、魔法師、冷卻卡片）；額外確認九個裝備部位、衣服 29 件、完整裝備 287 件與卡片 98 張 |
| 關卡→項鍊→屬性與權重 | 通過（#2603, VIT +1, 權重 100） |
| 320／375／390／430px 水平溢出 | 每種寬度各檢查首頁、飾品、裝備、卡片、怪物 5 畫面，共 20/20 無溢出 |
| Browser back 與分享篩選 | 通過 |
| JavaScript pageerror | 0 |
| 私人裝備圖 | 13/16 `img` 已載入，其餘 3 張位於未捲到的 lazy-loading 列表，非 404 |
| 私人卡片圖 | 6/6 已載入 |
| 私人圖片準備 | 720/720 個 PNG 成功取得並置於本機 gitignored 目錄，109 隻怪物中 107 有官方 sprite frame |
| 真正 iPhone Safari | 待使用者測試 |

截圖（保留本機，不進 Git）：`evidence/iphone-v3-home.png`、`evidence/iphone-v3-armor.png`、`evidence/iphone-v2-stage.png`、`evidence/iphone-v2-item.png`、`evidence/iphone-v2-card.png`。
測試腳本：`node scripts/mobile-smoke.mjs`。

## 私人圖片的處理

作者原站對第三方前端熱連圖片回傳 HTTP 403，Chrome 報 `net::ERR_BLOCKED_BY_ORB`。不以偽造 Referer 規避反盜連；改為使用者電腦對公開資產 URL 直接下載**私人本機測試快取**。僅明確提供 `PRIVATE_DEV_ASSETS=1` 才將目前全部候選索引用到的 720 張 PNG 存於 gitignored `evidence/private-art/` 與 `dist/game-assets/`。

- GitHub 私有 repo 只儲存圖片 metadata 和裁切 frame 座標，**不含 PNG**。
- CI `npm run build` 不包含圖片，未部署至 Pages/Vercel 或任何正式環境。
- **不可將本機含圖片的 dist 直接發布**，公開利用需另行確認圖片授權；缺圖應有佔位。
- 每次修改後執行 `npm run build` 會重新建立 dist，再執行 `$env:PRIVATE_DEV_ASSETS='1'; node scripts/prepare-private-art.mjs` 才能恢復私人圖片。

## 尚未完成的驗收

使用者 iPhone Safari 需驗證真機畫面、返回與分享網址、實際圖片、捲動、卡片顯示比例，並對比遊戲內實測的裝備特性、法師職業條件和卡片效果。尚未得到官方遊戲圖片的公開發布授權，不能將目前私人圖片版本直接當成公開正式站。
