# 專案目前狀態

- 目前版本：Sprint 10.3
- 正式考試日期：2026-09-08
- 正式題庫來源：`src/data/questions/`
- 可用題庫：Week1
- 原始資料：`private/考古題原始資料/`
- 不使用登入、後端或資料庫。
- localStorage：`ifa-week1-exam-draft-v1`（mockExam 草稿）、`ifa-study-progress-v1`（學習進度）、`ifa-wrong-answers-v1`（錯題索引）。
- 首頁按鈕：繼續模擬測驗＝resume mockExam 草稿；開始今日任務＝指定題數低壓練習；開始測驗＝完整 Week1 正式模擬。
- 模式：`mockExam`、`daily`、`weeklyCatchUp`。
- 限制：不建立重複題庫、不修改正式答案、不覆蓋正式測驗草稿、不新增假 Week2～Week8、UI 預設繁體中文、Build 成功才 Deploy、Sprint 完成即停止。
- 互動流程修改必須以瀏覽器逐步驗證；TypeScript、Build 與 Deploy 只能作為最後確認，不能取代流程驗收。Sprint 10.2 使用 `scripts/e2e-sprint-10-2.mjs` 搭配系統 Chrome 驗證草稿續作、今日任務題數與首頁中文化。
- 首頁第一層聚焦今日要做什麼：考試倒數、本週進度與唯一的今日任務主 CTA；第二層顯示連續學習、錯題與 Week1 題庫覆蓋率。
