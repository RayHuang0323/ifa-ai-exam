# Technical Debt

-   未安裝 Tailwind 編譯流程，目前以 `src/index.css` 的最小 utility fallback 支援既有頁面樣式。
-   Recent Activity 尚未顯示 `ifa-study-progress-v1` 的真實最近一次紀錄。
-   學習紀錄已涵蓋目前可用的正式測驗、指定題數任務與錯題複習；尚未涵蓋混合刷題。
-   尚無自動化測試覆蓋 localStorage migration、提醒規則與日期邊界。
-   AI Coach 尚未實作。
-   Week1 未完成測驗草稿目前為單一 localStorage draft，尚未提供跨裝置或多份草稿管理。
-   尚無完整錯題本、跨週混題、簡答／默寫、間隔重複與 AI Coach 真實分析。
-   已有 Sprint 10.2 與 Sprint 13.1 瀏覽器驗證覆蓋草稿恢復、指定題數任務、錯題複習完整交卷與 Result；尚未涵蓋 localStorage migration、提醒規則與日期邊界。
-   Week1 題庫覆蓋率從新 StudySession 的 `questionIds` 與既有錯題索引計算；舊 Session 未保存題目 ID，無法回推精確覆蓋率。

## Sprint 13.1 已移除

- 已移除正式模擬考、今日任務與錯題複習共用 90 分鐘造成的時間接線風險。
- 已移除首頁待複習數與錯題複習入口題組可能不一致的風險；兩者共用 `isReviewableToday`。
- 已補上錯題複習答對、Result 統計與同日 improving 排除的瀏覽器驗證。

## 仍存在

- 尚無完整錯題本頁面、跨週混題、簡答／默寫、間隔重複與 AI Coach 真實分析。
- 尚無自動化測試覆蓋 localStorage migration、提醒規則與日期邊界。
