# P1 私人 Dev／Preview 版驗證（2026-11-17）

## 驗收範圍

依使用者 iPhone 截圖與後續回報修改：
- 首頁移除四個大型快捷卡；直接顯示「裝備、卡片、關卡、職業」分類及點選式篩選。
- 不在玩家畫面顯示來源核實徽章、證據鍵、SHA、技術說明；內部 JSON 仍保留核對狀態。
- 裝備清單和詳情顯示名稱、對應圖片、ATK/MATK/DEF（有資料時）、附加屬性與星號效果。
- 關卡抽屜直接顯示已收錄的裝備及卡片、圖片、屬性摘要、來源怪物／Boss、原站確認的掉落權重。
- 樹精卡片 4010 的卡面與「+5 冷卻縮減」正常顯示；怪物圖片使用原站 sprite sheet 的單一 frame（保留 atlas bounds）。
- 非官方候選來源未改標為官方。若無法由原站核實掉落關係，介面使用「可能掉落」而非「保證掉落」；`rate` 未驗證百分比語意，僅顯示「掉落權重」。

## 測試結果

測試環境：Windows Chrome Headless + Playwright，390×844 iPhone 觸控模擬；**不是 Safari 真機測試**。
私人網址：`http://100.116.225.68:4177/`，僅 Tailscale 裝置可連。手機需要開啟 Tailscale，電腦要維持開機及 OpenChatX 預覽服務運行。

| 檢查 | 結果 |
|---|---|
| TypeScript + Vite build | 通過 |
| 資料單元測試 | 14/14 通過（完整 ID、九種部位、卡片效果、圖片影格、來源狀態） |
| 首頁與三類主要反查 | 通過（裝備飾品、魔法師、冷卻卡片）；額外確認九個裝備部位、衣服 29 件、完整裝備 287 件與卡片 98 張 |
| 關卡→項鍊→屬性與權重 | 通過（#2603, VIT +1, 權重 100） |
| 320／375／390／430px 水平溢出 | 每種寬度各檢查首頁、飾品、裝備、卡片、怪物 5 畫面，共 20/20 無溢出 |
| Browser back 與分享篩選 | 通過 |
| JavaScript pageerror | 0 |
| 私人裝備圖 | 13/16 `img` 已載入，其餘 3 張位於未捲到的 lazy-loading 列表，非 404 |
| 私人卡片圖 | 6/6 已載入 |
| 私人圖片準備 | 720/720 個 PNG 成功取得並置於本機 gitignored 目錄，109 隻怪物中 107 有官方 sprite frame |
| 真正 iPhone Safari | 待使用者測試 |

截圖（保留本機，不進 Git）：`evidence/iphone-v3-home.png`、`evidence/iphone-v3-armor.png`、`evidence/iphone-v2-stage.png`、`evidence/iphone-v2-item.png`、`evidence/iphone-v2-card.png`。
測試腳本：`node scripts/mobile-smoke.mjs`。

## 私人圖片的處理

作者原站對第三方前端熱連圖片回傳 HTTP 403，Chrome 報 `net::ERR_BLOCKED_BY_ORB`。不以偽造 Referer 規避反盜連；改為使用者電腦對公開資產 URL 直接下載**私人本機測試快取**。僅明確提供 `PRIVATE_DEV_ASSETS=1` 才將目前全部候選索引用到的 720 張 PNG 存於 gitignored `evidence/private-art/` 與 `dist/game-assets/`。

- GitHub 私有 repo 只儲存圖片 metadata 和裁切 frame 座標，**不含 PNG**。
- CI `npm run build` 不包含圖片，未部署至 Pages/Vercel 或任何正式環境。
- **不可將本機含圖片的 dist 直接發布**，公開利用需另行確認圖片授權；缺圖應有佔位。
- 每次修改後執行 `npm run build` 會重新建立 dist，再執行 `$env:PRIVATE_DEV_ASSETS='1'; node scripts/prepare-private-art.mjs` 才能恢復私人圖片。

## 尚未完成的驗收

使用者 iPhone Safari 需驗證真機畫面、返回與分享網址、實際圖片、捲動、卡片顯示比例，並對比遊戲內實測的裝備特性、法師職業條件和卡片效果。尚未得到官方遊戲圖片的公開發布授權，不能將目前私人圖片版本直接當成公開正式站。
