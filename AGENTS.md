# RO 倖存者｜HANS 粉絲維基 — Agents 工作規則

- 專案是 HANS-only，GitHub repo 目標為 `hans-ro-fanwiki/hans-ro-fanwiki.github.io`，正式 Pages 目標為 `https://hans-ro-fanwiki.github.io/`（僅於完成組織移轉後生效），以 `main` 為正式資料來源。使用者已授權 2026-11-19 上正式，並指定之後維基修改預設通過驗證後直接發布；舊 Pages 網址不保證轉址。
- Source of truth：`README.md`、`PROJECT_CONTEXT.md`、`docs/HANS_SOURCE_AUDIT.json`、實際 repo branch 和 `public/data/catalog.json` 的 `server:'hans'`。唯一遊戲原站 https://ro.hans-webgametw.com/。
- 禁止用咖啡版／twRO 的卡片、屬性、裝備、地圖或素材補洞；HANS 來源不明的資料保持 candidate/unknown。
- 僅使用本機 Gitignored、雜湊驗證的 HANS JS/manifest 進行 AST 靜態分析；不在公開 repo 包含原始遊戲 bundle、未授權圖片、完整角色圖集、秘密或帳號資料。
- `scripts/import-hans-source.cjs` 僅對審核過、SHA 相符的 HANS 快照重建 `public/data/catalog.json`；上游腳本格式或雜湊異常時停止而非猜測。
- HANS 卡片與怪物對應的註冊不等於確定可掉卡；活動、卡包、扭蛋及故事關卡不可宣稱普通怪物掉落。所有 rawRate 僅為遊戲權重，不是百分比。
- HANS 特殊能力、冷卻、INT、爆擊等以 HANS 實際運作效果／官方資料為準，切勿照抄 manifest 上沿用傳統 RO 的圖片敘述。
- 保留手機 Safari 優先搜尋、物品部位／職業篩選、怪物／關卡雙向反查、深色介面、可選擇顯示來源未知裝備。第二章依周目 T6～8，禁止虛構固定 T8 裝備。
- 圖像必須經獨立來源、授權及技術驗證；未確認時公開 Pages 用圖示佔位，不把私人 Dev 原圖／hotlink 當公開授權。
- 開發節省 CI：一般 commit 只跑 Linux TypeScript/test/build；`dev/**` 不部署，`main` 通過 CI 後自動發布；避免重複 push/PR workflow。大型未驗證改動仍先測試，資料不確定性不得省略。
- 常用驗證：`node scripts/import-hans-source.cjs`（僅有本機快照才能重建）、`npm test`、`npm run typecheck`、`VITE_PUBLIC_MODE=1 npm run build`、`node scripts/verify-public-dist.mjs`、`npm run check:source`。網站檢查 HTTP 503 代表上游暫不可用，不是 HANS 更新。

- 組織搬遷以 `docs/ORG_FANWIKI_MOVE.md` 為準；此 dev 分支**不可在建立組織並移轉/改名倉庫前合併**，否則會令現有網站 canonical 和 Issue 連結錯誤。移轉後才更新正式狀態、CHANGELOG 與來源連結。
