# HANS 職業天賦模擬器 — 來源審核與交接（2026-11-20）

## 來源及資料界線
- 官方比對頁：https://ro.hans-webgametw.com/talents.html 。
- HANS 天賦頁公開列出 25 個職業：一轉 9、二轉 16；75 棵分支、1,680 個節點。二轉均標示「開發中」，其規則及效果可能改動；三轉未出現在目前官方公開天賦頁，故本站不將三轉當作可遊玩天賦。
- 審查日期 2026-11-20。HANS 天賦腳本宣告 commit `1b3ae686`、日期 `2026-11-12T15:13:27.000Z`；依該頁面實際渲染的繁體中文標題、排列、天賦面板與說明交叉核對。
- 天賦腳本 SHA-256：`adddae869a85098291c9f2f1afa16ea8cfa044d1d8879c80d5b416d6b8a28367`。
- HANS 資料模組 SHA-256：`0201182d55c963b52c029016dd74651640e02c783d487f9077a7cd92ce5bf600`。
- 已核對的本地公開頁面 DOM 資料快照 SHA-256：`f472fc6521ca987be9cb4ef7036e566e0737329e9de4c6894ae881150557a65a`；規格化匯入器會核對這個雜湊，避免未重新審核就替換資料。
- `evidence/hans-talents-20261120/` 全部 Gitignored：存放靜態 source JS、官方頁面渲染 DOM 事實快照、視覺對照截圖以及一轉 AST 資料。**不提交原始 JS、官方技能圖或私人截圖到 Git**。
- 本專案公開的 `public/data/talents.json` 是規格化資料：職業、節點 ID、分支、座標、技能名稱、上限、效果簡述、前置線、專精路線等；沒有原站 bundle 或圖片檔。
- 嚴格不可用 Coffee 版／其他 RO 服的天賦資料補缺；來源不明應標示未確認或維持缺席。

## 重建流程（只在重新審核來源後使用）
1. 首先確認官方頁面、相關 JS 檔案及來源 SHA；官方有更新時先建立新審核快照和相容性測試。
2. `node scripts/extract-hans-talents.cjs --write`：用 TypeScript AST 對固定 SHA 的本機原始快照靜態抽取 **一轉中間檔** `evidence/hans-talents-20261120/first-job-talents.json`；不執行下載的遊戲 JS。
3. `node evidence/hans-talents-20261120/capture-talent-data.mjs`：以隔離的 Chrome 開啟官方公開天賦頁、取得 25 個目前公開可選的職業與渲染後的結構資料，保存為本機忽略的 `official-rendered.json`；不採集登入資料，僅遊戲公開資訊。
4. `node scripts/normalize-hans-talents.mjs`：合併 AST 一轉與官方頁面快照，檢查一轉座標、rank、ID 以及總數，重建 `public/data/talents.json`。
5. 重新執行測試、公開版 build、安全檢查與手機／桌面 UI 測試；不得因上游版號異動直接忽略 SHA 審核。

## 模擬器功能
- 第四分頁「天賦」：可選 25 職、桌面顯示三棵並排天賦樹、手機預設收合選職業面板並以分頁切換三棵樹。
- 採 HANS 官方的分支、節點位置與前置連線，顯示不同階層及已分配點數；點擊圖示加點，說明面板可逐點增減。
- 一轉／二轉各自使用 50 點天賦額度、列門檻基數 5，跨列要求及前置滿級需滿足；二轉只能投資一條分支，同技能進階路線 A/B 互斥。
- 效果簡述及滿級說明來自公開官方天賦頁，可在本站點擊查看；不宣稱完整角色傷害模擬。
- 版本化分享 URL：`?page=talents&tj=<job>&tb=v1.<sourceCommit>.<base36-ranks>`。原有一轉分享碼保留相同節點序列及版本，可相容還原；非法或不相容來源以錯誤訊息拒絕。
- 公開版 `VITE_PUBLIC_MODE=1` 完全不載入原站技能圖示，使用專案既有 Lucide 圖示及原創配色代替；僅私人 Dev 預覽允許直接遠端顯示 HANS 站上技能圖片以核對排版。原版圖片是否可正式公開，需要額外取得授權或獨立權利審核。
- 不需要登入或資料庫，不會改變遊戲角色。

## 驗證與限制
- `npm run typecheck`、`npm test`、`VITE_PUBLIC_MODE=1 npm run build`、`node scripts/verify-public-dist.mjs`。
- `node scripts/hans-ui-smoke.mjs` 在隔離 Chrome 測試配點、分享、重載、重置、二轉頁面及 320／375／390／430px 寬度，不修改使用者既有 Chrome。私人預覽也由隔離瀏覽器測試，完成後關閉。
- 尚未支援三轉：官方天賦頁目前沒有列出三轉職業及可驗收的公開樹，不能從疑似未上線程式結構推測正式可用規則。
- 二轉 HANS 明確標示「開發中」，模擬器忠實顯示此狀態，且後續來源更新可能使舊分享碼失效。
