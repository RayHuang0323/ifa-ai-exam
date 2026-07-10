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
