# Sprint 紀錄

Sprint01-03：專案建立、首頁、部署 Sprint04：首頁元件化 Sprint05：Exam UX
Sprint06：首頁 UI Sprint07：Exam→Result→localStorage
Sprint08：RWD、手機操作（進行中）

## Sprint 09－學習進度與提醒系統 v1

### 目標

建立 Week1 正式測驗完成後的本地學習紀錄，並在首頁顯示備考倒數、週進度、今日建議與連續學習天數。

### 修改檔案

- `src/App.tsx`
- `src/views/Home.tsx`
- `src/index.css`

### 新增檔案

- `src/types/study.ts`
- `src/data/studyConfig.ts`
- `src/utils/studyProgress.ts`
- `src/utils/studyReminder.ts`
- `docs/12_學習與提醒系統規格.md`

### 完成功能

- 新增 `ifa-study-progress-v1` 並安全保存 StudySession。
- 正式交卷只寫入一次；未完成離開不寫入。
- 可安全轉換既有 `ifa_exam_state` 的 Week1 最近一次結果。
- 首頁顯示 2026-09-08 考試倒數、週進度、落後提醒、今日建議與 streak。

### 驗證結果

- `npm.cmd run build` 成功。
- `npm.cmd run deploy` 成功並顯示 `Published`。

### 尚未完成項目

- 混合刷題、錯題複習、簡答評分、間隔重複、Dashboard 與 AI Coach。

### 下一 Sprint 建議

Sprint 10：刷題與錯題複習。

## Sprint 09.1－首頁按鈕語意與桌機排版修正

### 三種按鈕定義

- 繼續模擬測驗：只在有效 Week1 草稿存在時顯示，恢復題號、答案、標記與剩餘時間。
- 開始今日任務：顯示 Week1 與今日建議題數；目前導向可實際作答的完整 Week1 測驗。
- 開始測驗：開始新的 Week1 正式測驗；若有草稿，先提供繼續、放棄重來或取消。

### 桌機與 RWD 修正

- 1366px 以上首頁資訊卡採 1+2、2+1 Grid。
- 學習進度與 AI 教練採 2:1 Grid，今日任務維持獨立列。
- 768px 降為兩欄，480px 以下單欄並維持無水平捲動。

### 驗證結果

- `npm.cmd run build` 成功。
- `npm.cmd run deploy` 成功並顯示 `Published`。
- Commit 與 push 完成後記錄 hash。

## Sprint 10－每日任務與每週複習架構 v1

### 完成功能

- Task Planner 依未練習天數與本週進度產生低壓 Week1 任務。
- 每日任務可指定 5、10 或 15 題，不建立重複題庫。
- 每週記憶強化顯示週題量、錯題數與複習提醒。
- 正式完成後以 `ifa-wrong-answers-v1` 保存錯題索引與答題結果。

### 未完成

- 完整錯題本、跨週混題、簡答／默寫與間隔重複。

### 驗證

- Build、Deploy、Commit 與 Push 完成。

## Sprint 10.1－驗收 Bug 修正與 Codex Debug 規範

- 修正 mockExam 離開後草稿被清除的問題。
- 補齊草稿 mode、題目 id 與建立時間。
- 新增短版專案狀態與驗收／Debug 規範。
- Build、Deploy、Commit、Push 完成。

## Sprint 10.2－Playwright 瀏覽器驗證與核心 Bug 修正

### 問題與修正

- Sprint 10.1 未以瀏覽器完整走過草稿、題數與首頁字串流程；本 Sprint 新增可重複執行的最小 Playwright 驗證。
- mockExam 未交卷離開時保留 `ifa-week1-exam-draft-v1`，首頁重新讀取有效草稿後提供「繼續模擬測驗」；daily 與 weeklyCatchUp 不覆蓋正式草稿。
- 今日任務以同一個實際題數傳入說明頁與 Exam，避免首頁建議題數與作答題數不同。
- 首頁非考題 UI 統一為繁體中文：模擬考中心、最近學習紀錄、正在整理資料、學習路線圖、使用中、尚未開放、建置中。

### 驗證

- 新增 `scripts/e2e-sprint-10-2.mjs`、`tests/e2e/sprint-10-2.spec.ts` 與 Playwright 設定。
- `npm.cmd run verify:sprint10.2` 以系統 Chrome 逐步驗證 mockExam 草稿續作、今日任務題數一致與首頁中文化，明確結束並回傳 exit code 0。
- Build、Deploy、Commit 與 Push 於本紀錄更新後執行。

## Sprint 13.1－動態時間與錯題複習排程

### 完成功能

- 正式模擬考以 Week1 全題組、`formal-exam` mode 計時，固定 90 分鐘。
- daily、recovery 與 weeklyCatchUp 以 taskQuestions 和實際 mode 計時；15 題任務不會誤用正式考試的 90 分鐘。
- reviewWrong 以 reviewQuestions 和 `reviewWrong` mode 計時，不覆蓋正式測驗草稿。
- `getReviewableWrongAnswers()` 與 `getWrongAnswerSummary().reviewableCount` 共用 `isReviewableToday`；highRisk、newWrong、reviewing 可複習，mastered 不可複習，improving 當日複習後暫不重複排入。
- 首頁新增今天日期、考試日與距離 IFA 考試資訊。

### 驗證

- `npm.cmd run verify:sprint10.2`、`npm.cmd run verify:sprint11`、`npm.cmd run verify:sprint12`、`npm.cmd run verify:sprint13` 與 `npm.cmd run build` 均通過。

## Sprint 14－完整錯題本 v1

### 完成功能

- 新增 `wrongBook` 頁面與首頁「查看錯題本」入口；空清單顯示引導文案與返回首頁按鈕。
- 顯示錯題總數、待複習、高風險、改善中、已熟練，且 `reviewableCount` 持續與 `getReviewableWrongAnswers()` 共用 `isReviewableToday`。
- 支援全部、待複習、高風險、改善中、已熟練篩選；列表查詢正式題目、顯示狀態與複習統計，缺少題目時安全 fallback。
- 可從目前篩選結果取最多 10 題，交給既有 reviewWrong，不建立第二套複習流程，也不覆蓋正式測驗草稿。

### 驗證

- 新增 `scripts/e2e-sprint-14.mjs` 與 `npm.cmd run verify:sprint14`，驗證首頁入口、空狀態、錯題列表、狀態摘要與篩選後進入 reviewWrong。
- `verify:sprint14`、`verify:sprint13`、`verify:sprint12`、`verify:sprint11`、`verify:sprint10.2` 與 build 均通過。

## Sprint 15－考前核心學習閉環 v1

### 完成功能

- Recent Activity 讀取既有 StudySession，顯示最近 3 筆真實紀錄與安全空狀態；`reviewWrong` 也納入既有 StudyProgress 驗證。
- 每日、每週補強與進度補強任務由可複習錯題優先取約 30%，其餘以 Question Engine 的正式 Week1 題目補足並去重。
- 首頁新增最小規則型學習提醒，依考前 14 天、高風險錯題、今日已完成仍有錯題、本週落後順序提示。

### 驗證

- 新增 `scripts/e2e-sprint-15.mjs`，驗證 Recent Activity 空狀態、daily／reviewWrong 真實紀錄、高風險提示與今日任務進入流程。
- `verify:sprint15` 至 `verify:sprint10.2` 全部通過，build 通過。

## Sprint 16－簡答與默寫練習 v1

### 完成功能

- 新增獨立 sample／needsReview 簡答示範題與對應 Rubric，不納入正式 Week1 題庫、每日任務或完整模擬考。
- 既有 Exam 支援 short-answer 文字輸入與自我檢核 modal；顯示參考答案、必要概念、同義說法、矛盾點與通過分數，不進行自動判分。
- 自我選擇的正確／需要複習結果寫入 `writingPractice` StudySession；需要複習時沿用 wrongAnswerStore，Recent Activity 顯示模式中文。

### 驗證

- 新增 `scripts/e2e-sprint-16.mjs`，驗證文字作答、自我檢核、需要複習、StudySession、錯題與 Recent Activity。
- `verify:sprint16` 至 `verify:sprint10.2` 全部通過，build 通過。

## Sprint 10.3－學習策略定義與首頁 UX 優化

### 完成功能

- 首頁第一層整合考試倒數、本週進度與單一今日任務主 CTA，移除重複的「今日建議」卡片與 CTA。
- 第二層新增連續學習、錯題數與 Week1 題庫覆蓋率；覆蓋率採新 StudySession 的 questionIds 與錯題索引計算，不猜測舊資料。
- 今日任務說明頁改為顯示實際題數與今日練習定位，不再誤稱完整 Week1 正式測驗。
- 新增 `docs/14_出題策略與學習模式.md`，定義每日任務、每週任務、完整模擬考、錯題規則與考前 14 天衝刺方向。
- 瀏覽器驗證新增首頁唯一主 CTA、覆蓋率卡片、今日任務文案與無重複今日建議檢查。

### 驗證

- `npm.cmd run verify:sprint10.2` 使用系統 Chrome，驗證 Resume、今日任務題數、中文化與首頁焦點，exit code 0。
- Build、Deploy、Commit 與 Push 於本紀錄更新後執行。
