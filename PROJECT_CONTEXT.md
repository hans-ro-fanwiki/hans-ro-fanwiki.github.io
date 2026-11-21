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
  - 523 筆 HANS 裝備；451 筆有至少一個官方登錄來源，未確認裝備預設隱藏
  - 188 筆 HANS 卡片均有非劇情的怪物擊殺掉落來源，其中 66 筆有 Boss 路線
  - 195 筆怪物；17 筆關卡（第二章 5 筆）；怪物池 211 個關卡關聯
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
- 2026-11-20 桌面導航修正：之前 `.bottom-nav{display:none}`，只在 mobile CSS 打開，造成桌面無法切換裝備／卡片／關卡／天賦。已將同一組四分頁放進頂端 header，桌面橫向顯示、手機維持底部 fixed；Playwright 驗證 761/900/1280px 桌面導航可見、四頁可點、無橫向溢出，手機 320–430px 亦正常。
- 天賦新增「全部重置」，清空目前職業三條分支、關閉節點詳情並從網址移除配點。卡片的關卡連結會開啟指定關卡，節慶關也可直接開啟。
- 2026-11-20 天賦 UX 優化：針對 HANS 官方 `talents.html#swordsman` 樹狀界面和使用者桌面／手機截圖，由 OpenChatX 的 `skills.design-taste-review` 及 `skills.apple-design` 指引調整操作。電腦左鍵 +1、右鍵 -1、hover／focus 靠近節點的詳情框、`+`／`-` 與 `Esc` 鍵盤操作；手機單擊只預覽，獨立 `+`／`-` 按鈕控制、可展開精簡底部說明、分支 tabs sticky；仍保留原 41 職 3,168 點、分享網址、全部重置、實際圖示與限制。已在隔離 Chrome 驗證手機 320／375／390／430px、桌面 761／900／1280px、mouse/contextmenu、鍵盤、tooltip、URL 分享，真機 Safari 尚待使用者測試。詳見 `docs/HANS_TALENTS_SIMULATOR.md`。

- 2026-11-20 天賦提示框微調：桌面 `placeDetail` 改為優先將面板置於所選技能正下方（置中對齊、靠邊夾取；下方不足則往上），不再預設靠技能側邊。滑鼠離開節點或面板延遲 320ms 收合，進入面板可取消計時，避免從技能移向面板時閃退；手機底部面板和分享／配點邏輯不變。Playwright 已驗證位置、延遲消失、面板互動、其他裝置操作。相關提交與 CI 以 GitHub 最新結果為準。

- 2026-11-20 天賦合併分享 Dev 更新（0.3.0-dev.8）：滑鼠離開關閉延遲改 200ms；單一轉職路線的一／二／三轉可保留獨立配點、以明確階段切換及對應職業選單操作；分享與網址狀態改以 `?t=` 精簡稀疏配置（來源版號、CRC16 驗證），無外部縮網址依賴，並向下相容 `tj/tb=v1`；「全部重置」改清空三階。已新增單元及 Playwright 三階分享／200ms 測試，真機 Safari 仍待實測。Dev CI 和正式部署狀態須另依 GitHub Actions 確認。

- 2026-11-20 維基 UI Dev 0.3.0-dev.9：移除重複的天賦「分享配點」按鈕，保留三階合併的「複製連結」；卡片列表與關卡掉落直接顯示 HANS 註冊的鑲嵌部位，新增部位篩選；攻擊／生存屬性與卡片效果共用統一篩選（保留舊 `effect` 參數導入）。關卡預設顯示全部 17 張，以一般遠征／活動／劇情分類；17 張原站 `maps/<mapId>/minimap.png` 逐張 HTTP 200 並依 HANS 已審核 SHA 快照的地圖對應輸出到 `catalog.json`，前端直接引用 HANS HTTPS 且失敗回退圖示，原始地圖圖片不加入 Git/Pages。新增單元與 Chrome 320–430px、活動地圖縮圖實際載入回歸；後續以 Actions 和正式站驗證結果為準。

- 2026-11-20 Dev 0.3.0-dev.10：已透過 HANS 2026-11-19 經 SHA 驗證快照的主程式 `RO_LAPC`、`RO_C2T`、`RO_LAPK`、`RO_CARDLAP`、`RO_CARDFLOOR`、`Ti`/ `AC`/ `Bk`/ `CC`/ `TC` 以及 soul `Me` 靜態註冊補齊：188 張卡片的原始效果向量、6 週目倍率／例外（4144）、每張卡的週目 ID、41 職業 GS 權重與小王/MVP 保底；17 個關卡的第一章公式／第二章 T6～T8 表格、週目裝備 Tier 與 GS 入場門檻。卡片與關卡加入週目選擇及網址 `lap` 狀態，卡片詳情加入職業 GS 下拉選單；裝備只保留基礎資訊和階級，不虛構隨機詞綴／精煉／固定 GS。以 `schemaVersion:2` 生成 `catalog.json`；校驗依單元、瀏覽器實測和 CI，卡片 GS 仍待遊戲實際面板校準。使用 SHA 審核靜態快照，不執行／公開遊戲 bundle。

- 2026-11-20 天賦 UX Dev 0.3.0-dev.11：依手機與電腦操作截圖回饋，不再使用在技能附近浮動的 200ms 收合說明框。桌面改在三棵天賦樹上方保留固定高度、隨 hover／focus 更新的**資訊列**，不阻擋滑鼠直接左鍵加 1、右鍵退 1；主動按「查看完整說明」才把額外內容展開。手機仍是點技能選取、固定在底部導覽上方的精簡加減點工具列，可展開完整內容。已移除 obsolete popup 定位及定時器，維持三階分享／重置／圖示和點數規則；更新 Chrome 連續點擊、資訊列不覆蓋、手機按鈕與尺寸回歸，真機 Safari 仍待驗收。

- 2026-11-20 Dev 0.3.0-dev.12 全站 UX 與配色：經 OpenChatX `skills.design-taste-review`、`skills.apple-design` 檢視四頁，天賦樹自白底亮藍漸層改為與 `dark.css` 一致的深灰／薄荷綠；技能圖、節點鎖定與配點、三階網址不變，手機點擊面積改善。進階條件收合仍顯示選擇名稱，搜尋零結果提供一鍵清除；裝備／卡片詳情支援 Escape、Tab 邊界與焦點返回。完整已修與待排程改善清單：`docs/HANS_UX_REVIEW_20261120.md`。Chrome 320–430px／761–1280px、TypeScript／單元／公開版安全測試依最新 CI 結果；iPhone Safari 真機待驗收。

- 2026-11-21 Dev 0.3.0-dev.13：新增獨立「技能」頁（非天賦配點），由經 SHA 固定的 HANS 2026-11-19 soul 遊戲註冊 `$e`／`Ce`、官方繁中翻譯 `aA`／`KI` 及三轉雙語 `L(en,zh)` 靜態解析，收錄一轉 9＋二轉 16＋三轉 16＝41 職、256 筆技能引用／244 種技能、170 種已確認繁中技能說明、101 種升級說明、180 種基礎冷卻。未能核實的說明不虛構，保留遊戲英文原名。提供按職業及一／二／三轉篩選、繁中英文搜尋、詳情展開、`?page=skills&sj=...&sk=...` 深連結，官方圖示僅遠端載入；既有天賦、裝備、卡片與關卡邏輯不變。新資料由 `scripts/import-hans-skills.cjs` SHA 驗證生成 `public/data/skills.json`。資料與限制：`docs/HANS_SKILLS_CATALOG.md`。原全站待修「依關卡看掉落搜尋與篩選」建立 GitHub [Issue #11](https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues/11)，本版不改掉落演算法。

- 2026-11-21 Dev 0.3.0-dev.14：依 iPhone Safari 真機截圖，技能職業選擇由原生 41 項長下拉改為「全部／一轉／二轉／三轉」**高度受限的摺疊選單**，點階段才顯示職業、一次只展開一組、選職即收合，支援 Escape／點選外側關閉；移除技能與天賦 UI 的「二轉開發中」提示（保留資料源開發狀態不影響判定）。重新稽核 SHA 審核 HANS soul 快照，發現第三轉 96 種技能繁中名稱位於**後續 `Object.assign(aA,{...})` 登錄**而非初始 `aA` 字典；匯入器原先漏讀，現已修復並核對 96/96，英文原名仍用於搜尋。測試加上 96 項繁中來源斷言及 Chrome 折疊／手機版面回歸；iPhone Safari 真機改版後仍待驗收。

- 2026-11-21 Dev 0.3.0-dev.15 技能 UX：經 OpenChatX `skills.design-taste-review` 評估與真實 HANS `skills.json` `jobs[].base/rank` 核對，將 41 職依轉職階段的長下拉改為**9 一轉起始職業 → 16 條實際轉職路線**（各起始職業 1–2 條），忍者、神槍手的第三轉 `base` 直接對一轉，搭配該系唯一二轉。預設無路線不顯示 256 筆，直接搜尋技能／職業可跨全職業，選路線自動收合、顯示該路線一二三轉，記住上次路線於可用的 localStorage。保留舊 `sj`／`sk` URL、搜尋詞／轉職階段篩選、瀏覽器返回；新增 `careerRoutes` 等純函式與單元及 Chrome 320–430px、桌面回歸。HANS 圖像、天賦配點與來源公式不變；GitHub Issues #11/#12 未納入本次修改，iPhone Safari 真機待驗收。

- 2026-11-21 Dev 0.3.0-dev.16 卡片 GS 選擇器：修復先前漏執行的 Issue #12，現有 HANS `lapRules` 41 職 `scaling` 分為 melee 20、magic 10、ranged 11 三種，`cardScore` 只取三組 `scoring.classes` 權重。介面從二／三轉 41 職原生長選單改為「近戰系／魔法系／遠程系」三個至少 46px 的按鈕，實際 GS 計算公式不動，`gsjob` 舊職業 ID 深連結仍能依 `scaling` 正確還原選取及數值；新增全部 188 卡 × 6 週目 × 41 職同權重一致性測試，以及 Chrome 320–430px/桌面測試。GS 仍是依來源的估算、待遊戲面板校準。Issue #11 關卡篩選仍未實作，真機 Safari 待驗收。

## 關鍵不確定性
- 卡片掉落已核對 HANS 的 `killEnemy`、`kW` 與關卡怪物池。匯入器納入 4 個 `intruder` Boss 並排除劇情掉落。11/20 線上版本的關卡表及此擊殺邏輯與 11/19 審核快照相同。活動抽獎與卡片回收員的逐卡獎池尚未確認。
- 角色裝備職業限制、二三轉、特殊掉落、季節活動開放與遊戲圖片尚未完整確認；第二章 Tier 依周目可能 T6–8，不能用關卡最高 Tier 當每件裝備實際等級。
- 使用者已於 2026-11-19 授權 HANS 改版正式上線，並要求未來維基修改通過基本檢查後預設直接上正式。未核實的遊戲資料仍維持未知或候選，不應為了發布而編造。

- 2026-11-21 Dev 0.3.0-dev.17 天賦中文化：`src/talent-zh.ts` 在顯示層合併既有 HANS `talents.json`／`skills.json`；16 個三轉職業、48 條分支、192 條路線、1,488 個節點改為中文優先；96 個學習技能以已審核官方繁中對照並可顯示官方技能描述，其他節點以來源可確認的效果摘要命名並去除同分支名稱重複，保留英文原名供查證，不能稱為官方天賦名稱。修正一／二轉少量 Flee／EXP／INT 英文縮寫；不更動 HANS 原始資料、配點上限、分享碼、技能圖與關卡計算。新增完整中文化回歸單元測試，Linux 驗證、CI／正式發布需依最新 GitHub 工作流程核實。

## 後續步驟
1. 後續核對活動抽獎及卡片回收員的逐卡獎池。
2. 檢查圖片的私人預覽顯示與公開授權；若暫不發布圖片則使用中性佔位圖示，禁止沿用咖啡版圖片。
3. 更新及驗證前端搜尋與關卡 UI，Chrome 模擬窄螢幕／iPhone Safari 待實際驗收。
4. 日常維基改動在 Linux typecheck/test/build 通過後更新 `main`，GitHub Actions 自動部署 Pages；大型研究可先在 `dev/**` 測試，無須每次詢問上線同意。

本檔是活的交接紀錄。以 Git branch、原始碼、測試和審核 SHA 為準，不用過去對話推測專案狀態。
