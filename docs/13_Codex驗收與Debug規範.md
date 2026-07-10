# Codex 驗收與 Debug 規範

Build 或 Deploy 成功不等於功能驗收成功。每次互動修改必須重現問題、修正後模擬使用者流程；無法自動化時至少提供手動驗證清單。

互動流程驗證優先使用瀏覽器。內建瀏覽器不可用時，應優先使用 Playwright 搭配系統 Chrome 或 Edge；每次只驗證本次影響的 1～3 條流程。若 Playwright Test Runner 的 webServer 流程無法正常結束，但 Playwright API 可用，可採用 `scripts/e2e-*.mjs` 直接腳本：腳本必須實際開啟瀏覽器、逐步操作、驗證 DOM 與 localStorage、輸出明確 exit code，並在 finally 關閉瀏覽器與開發伺服器。

標準順序為：瀏覽器重現問題 → 檢查狀態與程式 → 最小修正 → 同流程瀏覽器複驗 → Build → Deploy → Commit／Push。TypeScript、Build、Deploy 均不能代替瀏覽器互動驗收。

必測：首頁、開始 mockExam、中途離開、首頁 resume、草稿恢復、今日任務題數一致、今日任務不覆蓋草稿、正式交卷、進度與錯題更新、重新整理後 localStorage、損壞 localStorage、手機與桌機排版。

每個 Bug 回報原因、影響檔案、修正前後行為、驗證步驟與殘留風險。localStorage 需記錄 key、寫入／清除時機、損壞處理、覆蓋關係與重複累加風險。除題目內容與品牌名稱外，UI 使用繁體中文。
