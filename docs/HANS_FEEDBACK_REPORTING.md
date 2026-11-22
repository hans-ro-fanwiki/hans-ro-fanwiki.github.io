# HANS 粉絲維基｜問題回報與功能許願

## 玩家入口與實際提交方式

- 頁面標題右側「回報／許願」適用全部六個分頁；網頁下方亦有「問題回報」「功能許願」入口。
- 卡片／裝備／怪物詳情視窗的「回報資料」會自動補上名稱、基礎 ID、週目卡片 ID、GS 類型與當前分享網址。使用者不用手動抄寫 ID。
- 站內面板只要求簡短標題與描述；兩種送件類型可直接切換。送件資料使用 GitHub Issue Form 的欄位 URL 參數預填到對應表單。**按下『前往 GitHub 完成送出』只是開啟 GitHub 編輯畫面，並非成功送出。** 使用者需要登入 GitHub，再點 GitHub 的 Submit new issue 才會建立公開回報；可在 GitHub 上追加截圖。
- 因本站僅用 GitHub Pages 靜態架構，未設定另外的免登入回報 API、資料庫或管理帳號；這次沒有宣稱匿名回報已啟用。若使用者沒有 GitHub 帳號，可以先按「複製回報內容」保留資訊，之後再透過登入 GitHub 回報。網頁不將回報存在瀏覽器或第三方後端。
- 回報內容會公開在 GitHub Issues：明確提醒不要張貼聯絡方式、遊戲登入憑證、敏感資訊或私人照片；該專案現有的著作權申訴 Issue Form 依舊獨立。

## 管理者查看及處理

- 所有回報：<https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues>
- 問題／資料勘誤：<https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues?q=is%3Aissue+label%3Abug>
- 功能許願：<https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/issues?q=is%3Aissue+label%3Aenhancement>
- GitHub Issue Form 預設套用現有 `bug` 或 `enhancement` label；登入 GitHub 帳號後可留言追問、附上來源與截圖、指派、設 `duplicate` / `invalid` / `wontfix` 並以 Open/Closed 管理。這些 label 已在 repo 存在，不新增額外流程或付費服務。
- 回報是**待查證資訊**，不因玩家提問就把官方數據判定為錯誤。收到如歐西里斯卡片 GS 的回報，應核對 HANS 版本／卡片 ID／週目／職業類型／遊戲內畫面，再決定更正或保留標記。

## 測試與限制

- 前端 GitHub 預填網址、兩種模板與 Markdown 複製備援由 `tests/hans-feedback.test.mjs` 驗證。
- iPhone Safari 與桌面需測試全站入口、詳情入口、表單鍵盤操作、GitHub 外開、路由回到原頁及 320px 最小寬度。
- 無公開寫入 API、GitHub Token、第三方表單金鑰，沒有替訪客直接建立 Issue 的權限。**實際 GitHub 帳號登入與最終 Issue 提交需由使用者執行**；無法以靜態測試聲稱已完成真實訪客提交。
