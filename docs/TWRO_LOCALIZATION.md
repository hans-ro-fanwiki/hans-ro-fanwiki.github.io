# RO Survivors 台版名稱與 Tier 對照（Dev，2026-11-17）

## 台灣 RO 名稱

- 依 **物品數字 ID** 對應 OpenKore 的 twRO client display-name table（不是用字面相似或翻譯模型猜名稱）：
  https://github.com/OpenKore/openkore/blob/35a5292c778019c98b9dc45df8d3bd3f96d48c40/tables/twRO/items.txt
- 本地檔案 `docs/TWRO_NAMES.json` 只保存這次維基有用到的 **281 件裝備、98 張卡片** 名稱，以及來源提交版本與 SHA-256。來源名冊原文放在 gitignored `evidence/twro-translation/items.txt`，**不公開整張外部資料表**。
- 已對照台版 RO 當前資料站個別例子：卡片 4077 `Phen Card` → **劍魚卡片**、4089 `Swordfish Card` → **異變魚卡片**、4100 `Sohee Card` → **鬼女卡片**；裝備 1221 `Gladius` → **長柄短劍**、2603 `Necklace` → **體力項鏈**。
- 卡片 98 張都可依原本 monster ID 關聯推導原名的台版怪物譯名，未另引入遊戲怪物數值。怪物剩餘 11 個未與卡片同名對應，其中 5 個較容易直譯的自創／活動名稱使用**非官方手動翻譯**並在 `manualFallbackMonsters` 單獨記錄。
- 6 件裝備沒有在該 twRO 表找到數字 ID：`1663,2666,2708,13435,20813,28560`。其中 3 件原本已是中文，另外 3 件（希望燈籠、中式手工藝品、陰陽護符）是手動譯名，單列於 `manualFallbackItems`，**不宣稱台灣原版 RO 官方採用此譯名**。
- 每筆保留 `originalName` 英文原名與非衝突的前版中文 `nameAliases`，搜尋舊譯、英文、台版中文皆可。若某個舊譯與**其他**台版正名衝突，優先保留正名唯一性（例如「劍魚卡片」只能指 Phen，不會錯搜到原來錯譯的 Swordfish）。
- 名稱翻譯來源與 RO Survivors 實際卡片效果／武器規則是不同資料；**絕不以台版 RO 數值覆蓋遊戲效果**。所有遊戲原有的 ID、圖片路徑、掉落來源與裝備職業限制均保留。

## Tier 的真正意義

研究目前原站 `main-2n_YvaNQ.js`、SHA-256：
`75e30eb32412865756af386132f6d10b3ed46062890122e185eff1a34b87732b`。

遊戲程式中關卡表 `Le` 定義 `tier`，關卡中掉落使用 `itemTier(){return My(this.stageId)}`，而持有物品也可以由物品自己的 `tier` 或 `ilvl` 回推階級。**同一件基本裝備 ID 的不同獲得實例可能不是同個 Tier**；不能將 `baseStats.wlv`（武器等級）當作 Tier。具體如下：

| Tier | 遊戲關卡 |
|---|---|
| 1 | 普隆德拉原野、普隆德拉地下水道、失事輪 |
| 2 | 柏伊亞嵐島、斐揚森林、斐揚洞穴、普隆德拉城、燈籠節 |
| 3 | 獸人村、夢羅克金字塔 |

維基靜態清單依 **已確認的掉落怪物→關卡關係** 彙整來源 Tier。例如武士刀可顯示 `Tier 1／2`；目前來源不足的活動裝備只顯示 `Tier 未確認`。可能但未驗證的關卡關係以 `可能 Tier N` 標記。物品詳情提醒這不是玩家目前持有實例的 Tier；若日後新增角色裝備匯入功能，才可依實例展示實際 Tier。

## 可重現更新與安全

1. 當新遊戲版本發布時先跑 `npm run check:source`，比較目前原站 bundle／資產 SHA。若有變動，先人工核對再重建候選資料；不要把舊的來源雜湊套用新資料。
2. 從已確認的 twRO display table 產生本次限定 ID 名稱對照：`python scripts/prepare-twro-names.py`（本機需有 gitignored table）。不要直接把網路資料表當成可任意重新發布的素材庫。
3. 原始候選資料重建：`node scripts/build-catalog.cjs <ignored-research-dir>`，它會自行讀取名稱對照並從原站 JS 嚴格核對 Tier；或者當前僅需重新套名稱/Tier 使用 `node scripts/apply-name-tier-enrichment.cjs`（需已審核的 `evidence/ro-original-source/main.js`）。
4. `npm test`、`npm run typecheck`、公開模式 build 與 `scripts/verify-public-dist.mjs` 驗證，不發布原始遊戲 PNG 或他人整站資料。
5. 目前修改先在 `dev/twro-tier-filters-20261117` 驗收，**未由本次操作直接推送 main／公開 GitHub Pages**。
