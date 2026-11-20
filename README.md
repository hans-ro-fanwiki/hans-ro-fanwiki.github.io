# RO 倖存者｜HANS 粉絲維基（非官方）

本專案自 2026-11-19 起**僅支援 HANS 漢斯服**。舊咖啡版資料、照片、來源審核與匯入腳本已從 HANS 維基移除，不應再混入新資料。

- HANS 遊戲入口：https://ro.hans-webgametw.com/
- GitHub Repo：https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io
- 正式網站：https://hans-ro-fanwiki.github.io/
- 移轉前 Pages 網址：https://lockgipo.github.io/ro-survivors-hans-wiki/
- 舊 Pages 網址：https://lockgipo.github.io/ro-survivors-wiki/ （GitHub 不保證專案網站改名後自動轉址）
- **發布規則**：使用者已授權 HANS 正式版部署，日後維基修正經 Linux 驗證後預設直接更新 `main`，由 GitHub Actions 發布。
- 組織移轉：2026-11-19 從個人帳號完整移入 `hans-ro-fanwiki`，改名為 Pages 首頁倉庫 `hans-ro-fanwiki.github.io`，保留原 Repository ID、Issues、PR 與提交歷史。詳見 `docs/ORG_FANWIKI_MOVE.md`。
- 歷史開發分支：`dev/hans-only-wiki-20261119`；正式版本以 `main` 為準。

## HANS 專屬資料（來源快照 2026-11-19）

| 類別 | 筆數 | 來源與信心水平 |
|---|---:|---|
| 裝備 | 523 | 漢斯遊戲內註冊，ID 與 HANS manifest 名稱核對 |
| 卡片 | 188 | 核對擊殺掉卡流程與怪物池，66 張具 Boss 掉落來源 |
| 怪物 | 195 | 漢斯關卡波次、Boss 與裝備掉落表 |
| 關卡 | 17 | 漢斯可選關卡索引，含五張第二章關卡 |
| 具有來源的裝備 | 451 | 有遊戲內的怪物掉落表或角色初始來源 |

裝備與卡片的實際能力修改值，取自 HANS JS 中的 `Z`、`re`、`Me` 與狀態修改函式，不用 RO 道具清單的傳統說明冒充實戰效果。每件道具來源可反查怪物與關卡，玩家介面不公開掉落權重，也不誤把權重當成機率。第二章 Tier 隨周目可為 T6／T7／T8，不能直接將關卡配置中的最高 T8 當作每場必掉 T8。

**已知限制：**部分裝備來源尚未查到，預設隱藏、可勾選恢復；188 張卡片均收錄直接掉落來源，含節慶與第二章的 4 隻闖入 Boss。劇情場次停用掉卡，卡片回收員與節慶抽獎的逐卡獎池仍待核對。依使用者 2026-11-20 要求，**正式版會從 HANS 原站直接載入裝備、卡片與天賦圖示**（遠端網址白名單、載入失敗顯示替代圖示）；不將遊戲素材複製、託管或發佈到 GitHub Pages。原作圖像權利仍屬原權利人，外部引用不代表取得再散布授權；如權利人要求將移除引用。怪物 Sprite 圖片尚待處理。

## 職業天賦模擬器（2026-11-20 已上線）

- 天賦模擬器收錄 HANS 的**一轉 9 職、二轉 16 職、三轉 16 職，合計 41 職、123 條分支、3,168 個節點**；桌面三樹並排、手機分支切換、節點連線、層級解鎖及技能摘要。
- 一轉與二轉以 HANS 天賦展示頁核對；**三轉改從 HANS 遊戲本體已註冊的 `RO_J3` 職業與 `tree3` 天賦結構靜態抽取**（16 職、48 分支、1,488 個節點），且已核對目前線上 JS SHA。三轉各自獨立 70 點上限、12 列；48 條路線均有可達成終極天賦的合法配點測試。
- 全階段都有加減點、全部重置目前職業的三條分支、原生分享／複製網址；二、三轉專精分支擇一，進階路線互斥。二轉在展示頁標示「開發中」；三轉雖有遊戲程式登錄，但部分技能名稱仍沿用 HANS 程式內英文、效果摘要須實戰核對，不能宣稱獨立展示頁已更新。
- **正式版圖示已開啟 HANS 原站圖片遠端參照**：所有一／二／三轉天賦節點及職業分支可顯示對應圖示，原站載入失敗才退回 Lucide 中性圖示；無遊戲素材檔案進入 repo 或 Pages。
- **操作（2026-11-20）**：電腦滑鼠左鍵加點、右鍵退點，移入／鍵盤聚焦即在技能旁顯示說明；鍵盤 `+`／`-` 配點、`Esc` 關閉。手機單次點選只查看，改由不遮住底部導航的精簡資訊面板按 `+`／`-` 配點，可展開完整說明；分支切換列可隨捲動保持可見。
- 詳細來源、限制與開發驗證請參考 `docs/HANS_TALENTS_SIMULATOR.md`。

## 技術與驗證

Stack：React 19、TypeScript、Vite；手機 Safari 優先，保留裝備／卡片／關卡／天賦四分頁（**桌面頂部、手機底部**）、中文與英文關鍵字、屬性／職業／部位篩選與反查。

```bash
npm ci --ignore-scripts
npm run typecheck
npm test
VITE_PUBLIC_MODE=1 npm run build
node scripts/verify-public-dist.mjs
```

私有 Dev 預覽：`npm run dev`（此模式可顯示 HANS 原站圖片，不可直接公開部署）。HANS 資料匯入採**當下自行下載、人工驗證、放入 gitignored evidence** 的完整版本快照：

```bash
node scripts/import-hans-source.cjs evidence/hans-20261119
npm run check:source
```

匯入器執行前會校驗 `docs/HANS_SOURCE_AUDIT.json` 固定三個 SHA-256，只執行 TypeScript AST 靜態解析，不執行 HANS 遊戲 JS，不自動下載原始圖片，也不允許其他版本被用作缺失資料備援。更新版本要先重做人工核對並更新審核雜湊；工作流程在 Linux 跑，不使用 macOS runner。

每日的 Source Monitor 僅比較 HANS 公開程式與清單 SHA：真正更新開／更新 GitHub Issue，網站無法連線則維持失敗狀態，不當作資料已更新，不自動修改或部署。

詳細工作狀態與後續事項見 `PROJECT_CONTEXT.md`、`docs/HANS_MIGRATION_PLAN.md`。

## 著作權與資料準確性

本站為免費非官方粉絲參考工具，與 HANS、RO 作者或相關權利人無隸屬關係。開放原始碼不構成使用遊戲圖像的授權；權利人可透過 GitHub Issue 提出內容疑慮。請勿上傳原站完整遊戲 JS、原始圖片、登入憑證或私人資料。
