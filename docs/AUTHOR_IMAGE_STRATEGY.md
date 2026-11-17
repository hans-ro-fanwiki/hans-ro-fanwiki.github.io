# RO Survivors 圖片來源優先方案（2026-11-17）

## 產品目標

玩家在裝備清單、卡片清單、關卡掉落和詳情中看到 **RO Survivors 作者網站當前的同款圖片**，避免從舊 RO 版本套錯圖；日後作者新增自創裝備或卡片，圖片依遊戲物品 ID 能更新。保持行動裝置版面簡潔，畫面沒有無意義的來源/權重狀態。

## 核實的技術現況

- 作者網站 `https://ro-survivors.com/assets/manifest.json` 可取得。當前 471 個 `items` ID、98 個 `cards` ID，條目含 `name`, `icon`, `art`／`image` 等字串路徑。這些是原站公開資源清單，不等於第三方圖片再散布授權。
- 例如 `items[1202].icon = "items/1202.png"`、`cards[4001].image = "cards/4001.png"`。圖片完整 URL 通常是 `https://ro-survivors.com/assets/` 加上路徑。作者站的跨站直接引用先前出現 HTTP 403；**不使用偽造 Referer、繞過反盜連或第三方轉發服務**。
- 本機完整圖的私人 Tailscale 版已有 `evidence/private-art`／`dist/game-assets` 720 張快取（含卡圖、裝備 icon/art、怪物 sprites），已經以同 ID 直接呈現原作者版圖示。**不得把私人資料夾直接上傳公共 GitHub Pages**。
- `node scripts/check-author-images.mjs` 只讀原站公開 manifest，與目前 `catalog.json` 做 ID/路徑比較，輸出到 gitignored `evidence/author-assets-diff.json`。2026-11-17 驗證：作者 manifest SHA-256 與現有基準完全一致、471 個 items、98 個 cards；其中目前圖鑑尚未索引 184 個 item 資源 ID，**多數可能是藥水等非裝備，不是「新上架的184件裝備」**。新版本應看 `authorManifestChanged` 判斷，再手動核對其類型與可用性。
- 另有來源是日本 RO 官方圖片網頁的 `92 裝備 + 66 卡片` 同名圖片，作為**備援候選**存於 `dev/official-ro-icon-audit` branch（尚未正式部署）。它們可能與 RO Survivors 版本不同，不應無條件優先於作者圖。

## 預計運行方式

1. 資料層用作者 manifest 裡的物品 ID 與路徑做一對一映射，不能以中文同名猜圖。原站版號／manifest SHA 改變時比較新增、更名、圖片路徑變動；新物品先核對遊戲分類與掉落資料。
2. **私人 Dev/Tailscale** 繼續用作者實際 PNG：裝備清單以原比例 icon 優先、詳情優先 art，卡片保留原始直式卡面比例；這是外觀對齊測試環境。
3. **公開版** 原則上用作者正式允許的可嵌入圖片網址（最好由作者設定可引用的圖片路徑／允許本站 Referer）；若需自行存放低解析縮圖或使用遊戲截圖，仍需有適用使用依據。截圖重製並不自動消除原始圖像著作權。
4. 已獲公開使用依據者提供單一對應圖片；其餘暫保留目前有來源的官方 RO 圖示或中性替代。任何新圖片須可刪除、可追來源，不把原圖當成開放素材。
5. UI 附「非官方、無盈利、資料可能與原站不同」與權利歸屬／連結，提供權利人通知後可快速移除的流程。若作者新增**完全原創圖**，其本人仍需允許我們使用；若借用 Gravity 素材，單靠作者同意不等於取得 Gravity 授權。

## 不可混淆的事項

- `<img src="https://ro-survivors.com/...">` 技術上要原站願意讓其他網站引用；不能把 HTTP 200 直接下載當成熱連、存放、發布的許可。
- 從遊戲畫面截取 64×64 並改成 WebP，和直接把原始 PNG 轉成 WebP，**都涉及重製著作權圖片**；縮小、標示出處、免費、只在群組分享，對合理使用有幫助但不能保證合法。
- 原站法律文件：https://ro-survivors.com/legal.html；作者聯絡方式：hello@ro-survivors.com。作者聲明現有遊戲圖示來自 Ragnarok Online 客戶端，權利屬 Gravity／Lee Myoung-Jin；其程式碼由作者保留。
- 在圖片公開範圍尚未確定前，禁止為了美觀改 GitHub Actions 直接發佈整批由原站擷取的 PNG／截圖；本次先保留可還原的試驗分支。
