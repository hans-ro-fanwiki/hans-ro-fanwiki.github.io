# RO 倖存者｜HANS 粉絲維基（HANS）：專案狀態（2026-11-20）

## 實際來源與分支
- **目前 Repository**：`hans-ro-fanwiki/hans-ro-fanwiki.github.io`（2026-11-19 從 `lockgipo/ro-survivors-hans-wiki` 原庫移轉並改名；原 Repository ID `1460983693`、Git 歷史、Issues 與 PR 保留）。
- **正式網站已上線**：https://hans-ro-fanwiki.github.io/（GitHub Pages Workflow；2026-11-19 Actions #44548771895 deploy 成功；首頁、JavaScript、catalog 均 HTTP 200）。原 Pages https://lockgipo.github.io/ro-survivors-hans-wiki/ 實測 HTTP 404，不自動轉址。詳見 `docs/ORG_FANWIKI_MOVE.md`。
- 正式分支：`main`，GitHub Actions 通過驗證後部署 Pages。HANS 原始改版分支 `dev/hans-only-wiki-20261119` 源自舊 `main` commit `20585eb`；上線後以 `main` 為準。
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

## 2026-11-20 天賦模擬器（正式站已上線）
- 原開發分支 `dev/talent-simulator-20261120` 已通過 Linux CI，以 fast-forward 合併到 `main`，功能提交 `405b3c9`；GitHub Actions `44710397427` 的 verify/deploy 均成功。
- 正式站 https://hans-ro-fanwiki.github.io/?page=talents&tj=warlock 已在隔離 Chrome 390px 實測：200、咒術士 93 個節點、70 點上限、0 前端錯誤。線上 `data/talents.json` HTTP 200，41 職、16 個三轉、3,168 節點，確認不是只有 Dev 有資料。
- 2026-11-20 HANS 官方天賦頁 1b3ae686 對應資料 SHA 審核後，透過 AST 靜態抽取九個一轉職業、27 個分支、444 個節點，輸出 `public/data/talents.json`；原始腳本僅留 Gitignored evidence。
- 新增 `src/TalentSimulator.tsx`、`src/talents.ts` 與暗色手機版樣式，使用 50 點上限、列門檻、前置依賴檢查，分享網址經來源版本與配置驗證。
- 2026-11-20 第二輪改版：以 HANS 官方天賦頁實際 DOM 與安全快照核對，擴充為九個一轉、十六個官方開發中的二轉，共 25 職、75 分支、1,680 節點，加入效果說明與專精／路線互斥。介面重做為 HANS 天賦樹式三欄、手機分支切換、官方式節點連線與進度提示。
- 2026-11-20 三轉補齊：從 SHA 固定的當前 HANS 遊戲本體 `RO_J3`＋`K.tree3` AST 解析出 16 個三轉、48 分支、1,488 節點。總計 41 職、123 分支、3,168 節點。獨立天賦展示頁只有一二轉，但遊戲程式已登錄三轉，不能只根據展示頁缺席就排除。
- 三轉獨立 70 點、12 列、前列 55 點可解鎖終極；已跑 48 分支合法配點可達性測試。`kagerou` 與 `rebellion` 在二轉及三轉的遊戲登錄重複 ID，為維基選職／分享另用 `kagerou_rank3`、`rebellion_rank3` 別名（保留 `sourceJobId`）。
- 三轉天賦部分名稱尚為遊戲程式英文原名，公式僅能靜態確認的項目轉成中文效果摘要，來源無法確認的數值不可猜測。
- 2026-11-20 圖示修正：前一版故意以 `VITE_PUBLIC_MODE=1` 封鎖裝備／卡片及天賦圖示，造成正式站只看到 Lucide；**實際上圖示代碼及圖片 URL 已完整保存在 HANS 資料快照中，並非分支漏合併**。依使用者明確要求，現在在正式版僅引用原站 `assets/icons/`、`assets/items/`、`assets/cards/` 的 HTTPS 圖片，不打包、不存 Git，失敗退回中性圖示。Playwright 已確認四種圖示（裝備、卡片、一轉、三轉）自然寬度 >0，320–430px 排版通過，安全 dist 中仍 0 圖片。圖像權利未因此變為公開授權；保留來源與下架聲明。詳見 `docs/HANS_TALENTS_SIMULATOR.md`。
- 詳見 `docs/HANS_TALENTS_SIMULATOR.md`；所有新功能完成前避免使用舊 Coffee 數據。

## 關鍵不確定性
- 卡片 `Me` register 表示卡片與怪物對應，**不保證掉卡**；卡片來源暫為 candidate。需追查直接掉卡／扭蛋／活動限定。
- 角色裝備職業限制、二三轉、特殊掉落、季節活動開放與遊戲圖片尚未完整確認；第二章 Tier 依周目可能 T6–8，不能用關卡最高 Tier 當每件裝備實際等級。
- 使用者已於 2026-11-19 授權 HANS 改版正式上線，並要求未來維基修改通過基本檢查後預設直接上正式。未核實的遊戲資料仍維持未知或候選，不應為了發布而編造。

## 後續步驟
1. 檢查 HANS 2026-11-19 最新遊戲與資料差異，修正卡片、活動、劇情取得管道；保守處理來源／掉落率。
2. 檢查圖片的私人預覽顯示與公開授權；若暫不發布圖片則使用中性佔位圖示，禁止沿用咖啡版圖片。
3. 更新及驗證前端搜尋與關卡 UI，Chrome 模擬窄螢幕／iPhone Safari 待實際驗收。
4. 日常維基改動在 Linux typecheck/test/build 通過後更新 `main`，GitHub Actions 自動部署 Pages；大型研究可先在 `dev/**` 測試，無須每次詢問上線同意。

本檔是活的交接紀錄。以 Git branch、原始碼、測試和審核 SHA 為準，不用過去對話推測專案狀態。
