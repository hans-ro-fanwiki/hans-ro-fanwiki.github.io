# P1 Dev／Preview 390px 行動介面驗證（2026-11-17）
 
## 執行環境

- Windows 10 + Chrome Headless（獨立隔離的 Playwright 瀏覽器，**模擬** iPhone 390×844 viewport、觸控與 zh-TW locale）。
- 靜態網站由 Vite Preview 提供，僅綁定電腦 Tailscale 位址 `100.116.225.68:4177`，不部署 Production。
- 測試腳本：`node scripts/mobile-smoke.mjs`，使用者可在本機重跑。Playwright 使用獨立 profile，`finally` 執行 `context.close()`，不碰使用者的日常 Chrome。
- 真正的 iPhone Safari 尚未測試；需使用者安裝／打開 Preview 後驗收，不將 Chrome 模擬當成 Safari 實測。

## 本輪通過

| 需求 | 檢查方式 | 結果 |
|---|---|---|
| 首頁快速入口 | 390px 模擬瀏覽器 | 通過 |
| 「刷飾品」 | 點選後 `slot=acc`、`mode=stages`，顯示柏伊亞嵐島，進項鍊 #2603 詳情 | 通過 |
| 「法師裝備」 | 點選後 `job=mage`，列表顯示候選裝備 | 通過（職業來源仍須核實） |
| 「冷卻卡片」 | 點選後 `effect=cooldown`，樹精卡片 #4010 的原始效果文字顯示 | 通過（卡片資料仍待核） |
| 詳情返回 | 點進詳情後瀏覽器上一頁，回到原篩選 URL | 通過 |
| 可分享篩選 | 直接以 `?page=cards&effect=cooldown` 開啟 | 通過 |
| 水平溢出 | 實際 headless JS `document.documentElement.scrollWidth` 在首頁、飾品、法師、卡片及詳情均 390px | 5/5 通過 |
| JavaScript 執行錯誤 | Playwright `pageerror` 監聽 | 0 |
| 資料不誤宣稱官方 | Node 單元測試，來源關係與候選標籤 | 7/7 通過 |
| Linux CI | GitHub Actions Dev checks, commit `b859e14` | 已通過；後續 commit 需重跑 |
| 圖像可用性 | 僅中性佔位圖，官方資產 ID 在 JSON 中但未對外載入 | 技術備援通過；官方圖實際展示尚未完成 |

## 尚需使用者 iPhone Safari 實測

- 在 iPhone 開啟 Tailscale，連線 Dev URL；確認頁面能開啟（目前 iPhone 在 Tailscale 狀態查詢顯示離線）。
- 切換四大分類、三個快捷入口、從詳情返回後保留篩選與捲動位置。
- Safari 實機觸控目標、瀏覽器前進／返回、分享 URL、底部安全區與字級。
- 官方圖片的使用權／外連條件未確認，不將只有佔位圖視為完成 v1.1 圖像驗收。
