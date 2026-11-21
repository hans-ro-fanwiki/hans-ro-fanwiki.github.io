# HANS 職業技能圖鑑：資料來源與驗證

2026-11-21。**獨立技能資料查詢**，不是天賦配點模擬器。

## 源頭與收錄範圍

- 遊戲與資料：僅 HANS，依 `docs/HANS_SOURCE_AUDIT.json` 所列經 SHA-256 驗證的 2026-11-19 `soul_linker-DllBVIRO.hza78cd192.js`，並與 `public/data/talents.json` 的技能引用核對。
- 收錄：一轉 9 職、二轉 16 職、三轉 16 職；合計 41 個職業、256 筆職業技能引用、244 種唯一技能。重複是多個職業引用同一技能，不是資料被複製。
- 對應名稱：從 HANS 的 `$e`／`Ce` 登錄取得技能 ID、英文原名、圖示識別碼；源內 `aA` 官方名稱字典提供繁中譯名，未對應則明示遊戲原名。
- 效果：先取 HANS 註冊函式中能靜態證明的技能敘述；繁中來源為 `KI` 官方字典或三轉 `L(en,zh)` 雙語原生文本，共有 **170 種**繁中基本敘述及 **101 種**升級說明可顯示。其餘不聲稱已確認。
- 進階技能的基礎冷卻值由 `Ce` 明確的 `cd` 欄位擷取，可確定 **180 種**；一轉登錄多為運行時計算，未在此資料中杜撰冷卻。
- 詳情標籤 `type/tags` 為遊戲登錄分類。技能等級、裝備加成、天賦及實際攻速／冷卻可能改變遊戲顯示，不以基礎冷卻代替最終冷卻。
- **全部缺少的繁中效果不可用傳統 RO／咖啡服／玩家猜測補值。** 即使某個技能名稱類似，HANS 專服規則仍可能不同。

## 查詢路徑與 UI

- 導覽獨立第五頁「技能」，與「天賦」並列；desktop 頂端及 mobile 底部分類都可切換。
- 篩選「全部職業」或具體職業；選擇如 `warlock` 時，自動顯示沿革 `mage → wizard → warlock` 的技能，不會自動混入 `sage → sorcerer`。
- 可切換全部／一轉／二轉／三轉，搜尋技能中文、原始英文、ID 或已確認效果。
- 卡片展開顯示官方已登錄技能的說明、基本冷卻、種類／屬性標籤，無確定值就顯示資料限制。
- 深連結 `?page=skills&sj=warlock&sk=comet` 可直接展示三轉某技能，網址可複製傳人。
- 圖示以受白名單限制的 `https://ro.hans-webgametw.com/assets/icons/<id>.png` 遠端引用；只用於粉絲資料工具展示，不代表擁有或取得再散布授權。若圖片無法載入則中性佔位。Git、Pages artifact、NPM build 均不含原始遊戲圖片或整包 JS。

## 生成與安全

```bash
node scripts/import-hans-skills.cjs --write
npm run typecheck
npm test
VITE_PUBLIC_MODE=1 npm run build
node scripts/verify-public-dist.mjs
node scripts/hans-ui-smoke.mjs
```

- `import-hans-skills.cjs` 用 TypeScript AST **讀取、不執行**已審核且被 Gitignore 的 HANS bundle；嚴格比對 hash，發現版本不符就停止。
- 生成 `public/data/skills.json`（server `hans`，41 職與 244 條技能）。保留來源 hash 與資料政策，無動態程式碼與素材。
- 例：`狂擊` 基礎敘述「對最近的敵人施以重擊」，`隕石術` 基礎冷卻 14 秒，`Comet Fall` 三轉 HANS 原生繁中敘述可讀。
- Chrome/Playwright 驗證 iPhone 尺寸 320／375／390／430px；桌面 761／900／1280px；第 5 導覽、選職路線、三轉效果、深連結、官方圖示載入。iPhone Safari 真機需使用者自行驗證。

## 待辦

1. 剩餘 **74 種技能**缺少可靜態核實的繁中基本敘述，主要是較早期動態函式／未完成的官方翻譯；僅顯示可驗證資料而非錯誤數值。
2. 依遊戲實際更新重新審核 SHA 快照與技能描述，避免將新技能加進舊資料。
3. 若未來能從遊戲公開介面核對每級變化，可依職業追加技能等級切換；先不把天賦倍率當技能等級倍率。
4. 關卡掉落搜尋優化另追蹤於 [GitHub Issue #11](https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues/11)。
