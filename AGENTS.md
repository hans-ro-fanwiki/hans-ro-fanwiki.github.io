# RO 倖存者｜HANS 粉絲維基 — Agents 工作規則

- 專案是 HANS-only，GitHub repo **已移轉**為 `hans-ro-fanwiki/hans-ro-fanwiki.github.io`，正式 Pages URL 為 `https://hans-ro-fanwiki.github.io/`，以 `main` 為正式資料來源。使用者已授權 2026-11-19 上正式，並指定之後維基修改預設通過驗證後直接發布；舊 Pages 網址不保證轉址。
- Source of truth：`README.md`、`PROJECT_CONTEXT.md`、`docs/HANS_SOURCE_AUDIT.json`、實際 repo branch 和 `public/data/catalog.json` 的 `server:'hans'`。唯一遊戲原站 https://ro.hans-webgametw.com/。
- 禁止用咖啡版／twRO 的卡片、屬性、裝備、地圖或素材補洞；HANS 來源不明的資料保持 candidate/unknown。
- 僅使用本機 Gitignored、雜湊驗證的 HANS JS/manifest 進行 AST 靜態分析；不在公開 repo 包含原始遊戲 bundle、未授權圖片、完整角色圖集、秘密或帳號資料。
- `scripts/import-hans-source.cjs` 僅對審核過、SHA 相符的 HANS 快照重建 `public/data/catalog.json`；上游腳本格式或雜湊異常時停止而非猜測。
- HANS 卡片與怪物對應的註冊不等於確定可掉卡；活動、卡包、扭蛋及故事關卡不可宣稱普通怪物掉落。所有 rawRate 僅為遊戲權重，不是百分比。
- HANS 特殊能力、冷卻、INT、爆擊等以 HANS 實際運作效果／官方資料為準，切勿照抄 manifest 上沿用傳統 RO 的圖片敘述。
- 保留手機 Safari 優先搜尋、物品部位／職業篩選、怪物／關卡雙向反查、深色介面、可選擇顯示來源未知裝備。第二章依周目 T6～8，禁止虛構固定 T8 裝備。
- 2026-11-20 使用者明確要求裝備、卡片與天賦頁顯示實際 HANS 圖示；前端可對經確認的官方圖片路徑直接引用 `https://ro.hans-webgametw.com/assets/` 原站圖片，必須驗證實際載入和失敗 fallback。**這是外部來源參照，並不表示取得圖片使用或再散布授權**；不得將 HANS 原始遊戲圖片／素材放進公開 Git、Pages artifact，保留著作權／非官方／下架資訊。如權利人要求停止使用，應移除圖片引用。
- 開發節省 CI：一般 commit 只跑 Linux TypeScript/test/build；`dev/**` 不部署，`main` 通過 CI 後自動發布；避免重複 push/PR workflow。大型未驗證改動仍先測試，資料不確定性不得省略。
- 常用驗證：`node scripts/import-hans-source.cjs`（僅有本機快照才能重建）、`npm test`、`npm run typecheck`、`VITE_PUBLIC_MODE=1 npm run build`、`node scripts/verify-public-dist.mjs`、`npm run check:source`。網站檢查 HTTP 503 代表上游暫不可用，不是 HANS 更新。

- 組織移轉已於 2026-11-19 完成，實際移轉及驗收見 `docs/ORG_FANWIKI_MOVE.md`。GitHub Pages 採用 Organization 首頁倉庫；任何網站連結更新均需通過 Dev CI、`main` Pages 部署及實際 HTTP 驗證。新組織若尚未授權 GitHub App，使用已授權的本機 GitHub CLI 或請使用者授權，不得假定外部工具已擁有新組織權限。
