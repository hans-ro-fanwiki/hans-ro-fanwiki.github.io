# HANS 職業天賦模擬器 — 2026-11-20 來源審核與開發說明

## 來源界線
- 來源：HANS 官方天賦樹 https://ro.hans-webgametw.com/talents.html 與其引用的 build/talents-YzPGKinw.hzad8fd081.js、build/soul_linker-DllBVIRO.hz1c5a3ce7.js。
- 下載日期 2026-11-20；頁面腳本宣告 commit 1b3ae686，date 2026-11-12T15:13:27.000Z。
- 私人原始資料僅在 Gitignored 的 evidence/hans-talents-20261120/，不得提交公開 Git。
- SHA-256：天賦頁腳本 adddae869a85098291c9f2f1afa16ea8cfa044d1d8879c80d5b416d6b8a28367；資料模組 0201182d55c963b52c029016dd74651640e02c783d487f9077a7cd92ce5bf600。
- 本地 `node scripts/extract-hans-talents.cjs --write` 先檢查 SHA，再用 TypeScript AST 靜態解析；不匯入、執行或 eval 遊戲腳本。只產生天賦拓撲與 metadata，不包含原始 JS 或圖片。
- 裝備卡片目錄 HANS 來源審核另見 docs/HANS_SOURCE_AUDIT.json；兩者不可互相替代或混用咖啡版資料。

## 已完成的模擬器
- 九個一轉職業：劍士、魔法師、弓箭手、服事、盜賊、商人、跆拳道、忍者、神槍手；合計 27 條分支、444 節點。
- 每個節點有官方繁體中文名稱、原文、位置、最大等級與前置條件；來源未能靜態確認的資訊不能猜測。
- 一轉天賦總額 50 點、列門檻基數 5 點；加點／減點與分享還原時均檢查上限、前列配點和前置點滿。
- 分享格式：`?page=talents&tj=<job>&tb=v1.<sourceCommit>.<base36-ranks>`。版本、職業或配點不合法時拒絕還原並提示錯誤。
- 手機 Safari 優先；無帳號、無伺服器端存檔、不會修改遊戲角色；公開網站不載入未授權的天賦圖示。
- 目前提供天賦拓撲、名稱、等級與門檻，以及原站查詢連結；天賦效果全文、不同等級實際數值與傷害加總尚未整合。
- 二轉／三轉及專精互斥規則尚未整合。本版只能模擬九種一轉職業，不得把一轉 50 點規則套用於其他轉職。

## 驗證
- `npm run typecheck`、`npm test`：保留原 8 項測試並增加 4 項天賦驗證。
- `VITE_PUBLIC_MODE=1 npm run build`、`node scripts/verify-public-dist.mjs`：阻擋原始遊戲腳本與未授權素材進正式成品。
- `node scripts/hans-ui-smoke.mjs`：檢查配點、分享網址重新載入、重置，以及 320、375、390、430px 寬度。

## 待辦
1. 靜態抽取並審核二轉、三轉職業天賦、路徑互斥和點數規則。
2. 整合可核對的效果說明與每等級差異，不以名稱臆測加成。
3. 審查原站圖示授權前不發布遊戲素材，維持文字徽章。
4. 上游天賦變更時重新核對 SHA、重建資料，評估歷史分享碼相容性。
