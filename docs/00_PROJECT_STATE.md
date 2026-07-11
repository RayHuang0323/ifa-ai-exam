# 專案目前狀態

- 目前版本：Sprint 15
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
- Question Engine v1 已提供題庫查詢與覆蓋率；新 StudySession 保存完整題目 ID 與作答分類，舊紀錄缺少 ID 時覆蓋率為估算。

## Sprint 13.1 完成

- 首頁顯示今天日期、考試日與距離 IFA 考試。
- 時間依模式與實際題組計算：formal-exam 固定 90 分鐘；daily／recovery 為 10～30 分鐘；weeklyCatchUp 為 20～60 分鐘；reviewWrong 為 5～20 分鐘。
- daily 的 15 題選擇題與 reviewWrong 不再顯示或使用 90 分鐘；正式模擬考維持 90 分鐘。
- `getWrongAnswerSummary().reviewableCount` 與 `getReviewableWrongAnswers()` 共用 `isReviewableToday`；同日已複習且 improving 的題目不列入錯題複習。

## Sprint 14 完成

- 新增完整錯題本 v1：首頁可進入、可看全部錯題與狀態摘要、可依狀態篩選，並可從目前篩選結果啟動既有 reviewWrong。
- 錯題本只讀取 `ifa-wrong-answers-v1` 的索引與統計，顯示題目時一律透過 Question Engine 查詢正式 Week1 題庫。
- 錯題本可處理題目不存在的紀錄並顯示「題目資料待確認」，不會白屏。

## Sprint 15 完成

- 首頁 Recent Activity 顯示最近 3 筆真實 `ifa-study-progress-v1` StudySession，包含時間、模式、題數、答對／答錯、正確率與花費時間。
- 每日任務會從可複習錯題優先混入約 30% 題目，其餘由正式 Week1 題庫補足且不重複。
- 首頁以規則型提示處理高風險錯題、今日已完成、本週進度與考前 14 天衝刺，不使用 AI 或外部 API。
