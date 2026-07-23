# Sprint 紀錄

Sprint01-03：專案建立、首頁、部署 Sprint04：首頁元件化 Sprint05：Exam UX
Sprint06：首頁 UI Sprint07：Exam→Result→localStorage
Sprint08：RWD、手機操作（進行中）

## Sprint 18－題庫候選審核與安全整合第一批

### 完成功能

- 新增 `src/data/questions/week2.staging.json`：僅收錄有來源答案且無已知答案衝突的 33 題候選，未匯入 Question Engine 或任何練習流程。
- 新增 `src/data/questions/pending-review.json`：保留 60 題人工審核佇列；27 題缺答案維持 `missing-answer`，其餘有答案候選因原始頁碼尚未確認而標記 `source-page-pending`。
- 新增 `src/data/questions/questionMeta.ts`，定義審核狀態、來源優先序及治理註解，僅作資料治理使用。
- 新增 `scripts/validate-question-staging.mjs` 與 `validate:questions:staging`，驗證 staging／pending JSON、ID、Week1 重複、選項答案對應與 pending 不被 runtime 匯入。
- 其中 2 題只標為 `supplement-week1-candidate`，供人工補來源或解析；不得覆蓋既有 Week1 題目或答案。

### 安全限制確認

- 未修改 Week1 題庫、既有答案、Question Engine、localStorage key 或練習流程。
- 未補寫缺答案題目的答案；未發現答案衝突時也未自行改寫來源答案。
- 未部署；Sprint 完成後停止。

### 驗證

- `npm run validate:questions:staging` 與 `npm run build` 於本 Sprint 完成前執行。

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

## Sprint 17－首頁瘦身與練習中心 v1

### 完成功能

- 新增 `PracticeCenter` 頁面，提供今日任務、錯題複習、錯題本、完整模擬考與簡答／默寫練習卡片。
- 首頁改為今日學習儀表板，不再展開完整模擬考、錯題複習或簡答／默寫功能卡。
- 所有卡片直接接既有 App handler；沒有新增重複流程、state machine 或 localStorage key。

### 驗證

- 新增 `scripts/e2e-sprint-17.mjs`；驗證首頁資訊、練習中心、今日任務、合法錯題、錯題本與簡答／默寫入口。
- `verify:sprint17` 至 `verify:sprint10.2` 全部通過。

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

## Sprint 19－Google 登入＋Apps Script 試算表同步基礎

### 完成功能

- 新增 `src/auth/googleAuth.ts` 與 `src/auth/useAuthSession.ts`，依環境變數 email 白名單判斷 `coach`、`learner` 或 `unauthorized`。
- 新增 localStorage 進度摘要、Apps Script Web App client、學員同步卡片與教練只讀最近 7 天摘要雛形。
- Result 完成後加入非阻塞 `upsertProgress`；同步失敗保留 `ifa-progress-sync-pending-v1`，不阻斷本機練習。
- 新增 Apps Script 範本與部署說明，支援學員按日期 upsert、教練／學員讀取最近摘要。

### 安全與範圍確認

- 未設定 `.env` 時 localStorage 本機練習仍可使用；未新增或修改既有 localStorage key。
- 未將 client secret、API key、真實 email 或 token 寫入前端原始碼。
- 第一版 Apps Script 採 API key＋email allowlist 簡化驗證，尚未驗證 Google ID token 簽章與 audience。
- 未匯入 `pending-review.json` 或 `week2.staging.json`，未修改 Week1、正式練習流程或題庫答案；未部署。

### 驗證

- `npm.cmd run verify:sprint19` 通過。
- `npm.cmd run validate:questions:staging` 通過。
- `npm.cmd run build` 通過。

## Sprint 19.1－Google 登入安全補強與實際串接準備

### 安全補強

- Google credential／ID token 會保留於 session，並隨 token `exp` 到期清除；過期 session 不再呼叫遠端同步。
- 前端同步 payload 改為只送 `action`、`idToken`、`apiKey` 與必要的 `progress`，不再送出前端 email／role 作為後端授權依據。
- Apps Script 使用 `GOOGLE_CLIENT_ID` 與 Google 官方 tokeninfo endpoint 驗證 `aud`、`iss`、`exp`、`email_verified`，再由已驗證 email 判定角色。
- `upsertProgress` 只接受已驗證 learner；`getProgress` 只接受已驗證 coach 或 learner；學員 email 由後端寫入 Sheet。
- `Progress` 工作表改為依名稱取得，並在表頭順序錯誤時拒絕操作，不覆蓋既有資料。

### 人工串接準備

- `.env.example`、Apps Script README 已補上 OAuth origins、Script Properties、Web App `/exec` 部署與測試步驟。
- Google OAuth Client ID、Web App URL、正式 `.env` 與 GitHub Pages 部署仍未設定／未執行。
- 未修改 Week1、補充題庫、既有 localStorage key 或本機練習 fallback。

### 驗證

- `npm.cmd run verify:sprint19` 通過。
- `npm.cmd run verify:sprint19-1` 通過。
- `npm.cmd run validate:questions:staging` 通過。
- `npm.cmd run verify:sprint17` 通過。
- `npm.cmd run build` 通過。
# Sprint 24A（Google Sheets 學習紀錄同步）

- 以 Google Apps Script + Google Sheets 記錄測驗開始、每五題進度、完成結果與答題資料。
- localStorage 仍是作答、草稿與恢復的主要流程；未導入 Google Auth、OAuth、Client ID、帳號密碼或會員系統。
- Apps Script 以可選 WRITE_KEY 作為簡易防誤寫，Coach Dashboard 尚未建立。

## Sprint 24A.1

- 以裝置 localStorage profile 區分 Bella 正式作答與 Ray 測試，沒有 Google Auth、帳密或會員系統。
- Apps Script 在既有 header 最後追加 profile 欄位，保留舊資料與 `舊_學習進度`。

## Sprint 24B

- Coach Dashboard 以查看碼讀取 Bella 正式資料，Ray Test 與 System Test 不納入統計。
- `COACH_READ_KEY` 僅存在 Apps Script Properties，前端只暫存使用者輸入的值於 sessionStorage。

## Sprint 24C-0

- Coach 可勾選「記住此裝置」將查看碼留在本機 localStorage，或使用預設 sessionStorage；「清除查看碼」會清除兩者。
- Case／case_study、申論與簡答改為待自評，結果頁僅以具有明確規則的題型計算自動分數與正確率。
- 未新增 Daily Task v2、30 題或 carryover；未修改 Apps Script `Code.gs`，因此不需重新部署。

## Sprint 24C-1

- 新增 `ifa-daily-task-v2-state`，記錄每日指派、完成與 carryover 題目；保留原本草稿、錯題與進度 key。
- 每日最多加入 30 題，carryover 優先且總顯示不超過 45 題。現有 Week1 題庫不足時不重複或新增未確認題。
- Coach Dashboard 僅修正 UI 對比與狀態標籤，未變更查詢 API、Apps Script 或資料篩選。

## Sprint 24D－正式題庫整合 v1

- 新增 `src/data/questions/week2.json`：6 題使用者整理考古題與 15 題課程練習，答案原文保留，來源標籤已去除 private 路徑。
- 20 題 Week1 與 21 題 Week2 組成 41 題 verified 正式池；Daily v2 可取 30 題，carryover 與不重複規則不變。
- 12 題需人工確認（含 1 題明確 mock）保留在 staging，不進 Daily、模擬考或錯題正式流程。
- Apps Script、Coach Dashboard、原始 PDF 與既有 Week1 答案均未修改。

## Sprint 24E－Remote-first 與 Weekly Review

- `getLearnerHomeSummary` 僅回傳 baseline 後 Bella 正式資料；首頁不再把本機舊測試紀錄當作正式進度。
- `?resetDailyTask=1` 只清 Daily Task v2 state/draft；`?resetLocalProgress=1` 清本機進度、錯題與舊 result，不清 profile、Coach 查看碼或同步 queue。
- Apps Script 已修改，需重新貼上 `Code.gs`、新增版本並重新部署；可選 `OFFICIAL_START_DATE` Script Property 未設定時預設 `2026-07-14`。

## Sprint 25（規劃，尚未執行）

- 題庫大盤點與正式匯入規劃：掃描 private 原始資料、staging、pending-review 與已整理分類副本，統計可安全轉 verified 的題量。
- 依 Week1／Week2／Week3／Week4 分類，建立不暴露 private PDF/DOCX 的匯入流程；不猜答案，needs_review 不進正式池，mock 必須標示「模擬題（非歷屆試題）」。
- Daily Task、Weekly Review、完整模擬考持續共用 Question Engine；本 Sprint 24E 未執行匯入。

## Sprint 25.1－首頁統計全面 remote-first

- `getLearnerHomeSummary` 新增 coverage summary；Apps Script 依 Bella baseline 後 AnswerRecords 的 questionId 去重計算 Week1／Week2／全題庫覆蓋率。
- 前端傳入 Question Engine verified 題號集合作分母；未知 questionId 忽略，空 AnswerRecords 回傳 0。
- `Code.gs` 已修改，需重新貼回 Apps Script 並重新部署 Web App。

## Sprint 26－題庫定位與匯入準備

- 找到同層外部 `IFA_教材資料庫`；其整理報告記載 149 檔／1.22 GiB，實體含鏡像與備份為 477 檔／3.67 GiB。
- 讀取候選報告與 canonical 60 題候選；32 題 high_priority_review、15 題 mock、13 題 blocked。來源頁與答案尚未人工核對，本次未新增 verified 題。
- private 原始檔仍維持外部 inventory-only，不進 `src/data/questions`、dist 或 GitHub Pages。

## Sprint 26A－候選題去重與人工核對準備

- 新增可重跑 `scripts/export-review-candidates.mjs` 與 `npm.cmd run export:review-candidates`。
- 產生 60 題人工核對清單（high_priority_review 32、mock 15、blocked 13），不複製 private PDF/DOCX 全文。
- 產生 33 組 staging／pending-review 重複候選報告；建議保留 staging 作工作 canonical、pending 保留為審計軌跡，不直接刪除任何資料。
- 新增 verified 匯入欄位規格；本次未升格題目、未修改正式答案、未修改 runtime 或 Apps Script。

## Sprint 26B－兩週內候選匯入審查

# Sprint 27：50 天題庫工廠 v1

# Sprint 28：AI 教材題庫工廠 v2

- 以正式題、knowledge mapping、staging／pending 有答案候選生成 260 題教材 AI 萃取練習題，總題數 430 題。
- 來源標籤固定為「教材 AI 萃取練習題（非歷屆試題）」；reviewStatus 固定 `needs_review`，不升格 verified。
- 52 題安全／禁忌／轉介相關題標 `safety_review`，解析加入不診斷、不治療承諾與必要轉介界線。

- 外部 canonical 60 題中，33 題有答案但與既有練習候選重複；27 題因缺答案維持 blocked，不進 `examPractice`。
- 以 32 題具答案的 high-priority 候選建立 96 題教材萃取練習變體；新增題不升格 verified。
- 170 題分布：`extracted_material` 96、`high_priority_review` 32、`verified-practice` 41、`mock` 1；mock 固定標示「模擬題（非歷屆試題）」。

- 審查 33 題 staging：23 題 approved past-exam／course-workbook、8 題 student-notes、1 題 past-exam supplement、1 題 mock supplement。
- 23 題中 21 題與既有 verified 題重複；2 題因醫療／禁忌或專業核對標籤維持人工審核。
- 本次未新增正式題，未修改 Week1／Week2、Apps Script 或任何考試流程。

# Sprint 29：1000 題目標第二階段

- Audit 確認既有題庫偏重解剖生理與安全禁忌；植物油、配方、案例、法規／倫理與諮詢流程為弱項。
- 可讀來源包含 `植物油.xlsx`、`精油信息表.xlsx`、候選 JSON、staging、pending-review 與規範 mapping；private PDF/DOCX 僅 inventory，不部署。
- 外部 canonical 60 題分為 high_priority_review 32、mock 15、blocked 13；缺答案、衝突與 mock-only 資料未混入正式或 AI 答案來源。
- 由 430 題新增 290 題，達 720 題；AI 題 550、verified 41。新增弱科：植物油 46、配方 42、案例 45、法規 30、諮詢 55、職業倫理 22、精油個論 50。
- 全池 Week3～Week8 為 84／124／4／145／53／1；因安全風險優先，部分配方題落在 Week4。
- 未修改 verified 答案、Apps Script、Exam／Result／Coach Dashboard；未執行 AI 申論判分或 verified 升格。

# Sprint 30：1000 題目標收斂

- Audit：720 題中 Week5 僅 4 題、Week8 僅 1 題；Week4／Week6 偏重，配方與綜合跨章節題需要獨立 routing。
- 可用來源仍為植物油／精油整理 XLSX、幼兒濃度與純露資料、配方候選、案例／倫理規範、staging／pending；缺答案、衝突、blocked 與 mock-only 保持隔離。
- 新增 301 題，`examPractice` 達 1021 題；verified 維持 41 題，AI 題 851 題，`safety_review` 540 題。
- Week5 新增 90 題，Week8 新增 80 題；Sprint 30 新增題型為 MC108、multiSelect60、shortAnswer40、case_study60、essay33。
- 新增主題：配方設計 90、考前綜合題 80、案例題 51、法規／IFA 17、職業倫理 9、諮詢流程 41、植物油 11、精油個論 2。
- 未修改 verified、Apps Script、Exam／Result／Coach Dashboard；未執行 AI 申論評分或自動 verified 升格。

# Sprint 31：examPractice 品質抽查與高風險題審核

- Audit：examPractice 1,021 題、AI 851 題、safety_review 540 題、verified 41 題、blocked 0 題；practice／formal ID 重疊 0 題。
- 依固定 ID 順序抽查 safety 80、配方 40、案例 40、法規／IFA／倫理 30；全庫 near-duplicate 掃描 329 組，其中 21 組為 examPractice exact duplicate，16 組涉及 verified 題。
- 發現 4 題含「可平衡荷爾蒙」等需保守改寫的 `unsafe_candidate`；建立 21 題 duplicate 建議封存／合併清單與 1 題 verified candidate，均未直接改題或升格。
- 1,021 題皆缺 sourcePage；本 Sprint 不猜填來源頁碼，列為來源追溯技術債。
- 未修改題庫 runtime、verified、Apps Script、Exam／Result／Coach Dashboard；不需部署，未執行 AI 申論評分。

# Sprint 31A：examPractice 題庫清理與風險題封存

- 維持原始 1,021 題，不新增、不直接刪題；4 題 unsafe 加上 `unsafe_candidate`、`isActive=false`、`excludeFromPractice=true`。
- 21 組 exact duplicate 保留 200xx canonical，40021～40041 副本加上 `duplicate_candidate`、`duplicateOf` 並停用；保留檔案以利追蹤。
- 16 組 verified near-duplicate 以 8 個 active `verified-practice` canonical 加 8 個停用 duplicate 副本處理；verified 仍為 41 題。
- Question Engine 與 validator 新增清理 metadata 支援；清理後 practice pool 996 題，Daily／Weekly 排除 25 題，Full Mock 維持 verified-only。
- 20020 僅更新人工確認文件，未升格 verified；未修改 Apps Script 或執行 AI 申論評分。

# Sprint 31C：未作答解析與未完成題目保留

- Audit 確認 Exam 以空字串／空陣列辨識未作答，Result 原先只列錯題；本 Sprint 改為交卷後列出所有題目，空白題也能查看正確答案、參考答案與解析。
- Result 統計將未作答與答錯分開；未作答不算完成、不寫入錯題本，非選擇題有文字才列為待自評，空白非選擇題仍列未作答。
- Daily Task v2 在交卷時明確保存尚未作答的 assigned 題目，下一次任務先安排保留題；完成作答後移出。Home 與練習中心均使用 verified 加 examPractice 來源池。
- 新增本機未完成保留題紀錄，Weekly Review 優先順序為未完成題、錯題、其他可用題；Full Mock 維持 41 題 verified-only。
- Google Sheet 同步不修改 Apps Script；前端送出所有題目的空答案與狀態，正式成績仍排除 practiceOnly 題。
- 未新增題庫、未修改 verified 答案、未執行 AI 申論評分或自動升格 verified。

# Sprint 32：非選擇題參考答案、示範答案與 AI 輔助評分

- Audit：全庫共有 521 題非選擇題，examPractice 499 題、verified 22 題；原先 521 題皆缺高分示範答案、評分重點與 rubric，22 題缺 referenceAnswer／answerGuide，521 題頁碼待補。
- 以既有 answer、answerGuide、explanation、sourceLabel、sourceFile 建立保守學習 metadata；新增 referenceAnswer、sampleAnswer、keyPoints、rubric、commonOmissions、teacherExplanation、sourcePage，不改既有 verified 答案。
- 題型分布：shortAnswer 263、essay 119、case_study 139；case_study 全數標示 safety_review，安全／配方／轉介題採保守答題方向。
- Result 交卷後顯示參考答案、高分示範答案、評分重點、老師解析、常見漏答提醒與教材來源；未作答不送 AI，仍保留至未完成保留題。
- 新增前端 AI 評分服務與本機保存：AI 輸出掌握程度、0～3 分建議、命中／漏答、風險、補強、來源與信心；不混入 objective 正確率與 verified 成績。
- `docs/google-apps-script/Code.gs` 新增 `aiGradeAnswer` 安全代理；金鑰僅讀取 Script Properties。未設定 `AI_GRADING_API_KEY`、provider 或 model 時回傳停用，不影響既有 progress sync。
- 本 Sprint 未自動升格 verified、未修改 Apps Script Sheet schema、未執行 AI 申論正式評分；更新 Code.gs 後仍需在 Apps Script Web App 建立新版本才會實際啟用代理。

# Sprint 33：AI 輔助評分健康檢查與實測工具

- Audit 確認 endpoint action 為 `aiGradeAnswer`；provider 預設 `openai-compatible`，endpoint 預設 OpenAI Chat Completions，model 必須由 Script Properties 設定。
- 新增 `coach-test` 專用固定安全題健康檢查；Bella 學員模式不顯示，測試結果只在畫面呈現，不保存到 AI 評分紀錄或正式成績。
- 增加前端對未啟用、API 失敗、非 JSON 與缺欄位回覆的安全 fallback；高風險題可回傳 0～3 分或「需人工確認」。
- 本 Sprint 未新增題目、未修改 verified、未修改 AnswerRecords schema；AI 分數仍不進正式正確率。Apps Script 需人工設定金鑰、模型並重新部署後才能做真實 provider 呼叫。

# Sprint 33A：本機規準輔助評分正式啟用與 Code.gs 完整性稽核

- 使用者決策為零 API 費用；本 Sprint 不呼叫 OpenAI、Gemini 或其他遠端 AI，Result 預設直接使用瀏覽器本機規準評分。
- `localRubricGrading` 支援 0～3 分、同義詞與核心概念命中、否定／危險敘述、複製題與重複文字、防灌水，以及 shortAnswer、essay、case、配方題的題型差異；資料不足或高風險時回傳「需人工確認」。
- `AiReviewRecord` 增加 `gradingMethod=local_rubric` 與中文標示；分數只保存本機，不進 AnswerRecords、正式 verified 正確率、錯題本或未完成保留題。
- coach-test 健康檢查改為直接測試本機規準，顯示「本機規準評分：可用」與「遠端 AI：未啟用（未來選配）」；Bella learner 模式不顯示 debug 工具。
- 稽核 `Code.gs` 確認 progress sync、Learner remote-first summary、Coach 查詢、WRITE_KEY／COACH_READ_KEY、eventId 去重、lock finally 與 AI endpoint 分支順序完整；空白 AI 屬性不影響一般同步。
- 本 Sprint 不修改 Apps Script 外部部署；若使用者僅貼入新版 Code.gs 尚未部署，現階段不需重新貼上／部署。未來啟用遠端 provider 才需另行設定 Script Properties 與部署。

# Sprint 34：Daily Task 90 題彈性上限與 verified 第一批擴充

- Audit：既有 verified 41 題、examPractice 原始 1,021 題；清理後可抽練習 996 題。Daily Task 原上限 45 題，已確認需要改為基本 30 題、可選上限 90 題。
- 題庫升格：新增 109 題至 `src/data/questions/verified-extra.json`，正式總數 150 題。新增 multipleChoice 63 題、shortAnswer 46 題；AI 教材萃取來源 69 題、教材／整理資料來源 40 題。
- 來源與風險閘門：排除 safety_review、mock、unsafe、duplicate、缺答案／解析／來源與明顯醫療或危險內容；同一批相同核心問法最多保留 3 個變體，仍留下後續近似題人工抽查工作。
- 原練習副本以 `promoted_to_verified`、`relatedVerifiedId`、`isActive=false`、`excludeFromPractice=true` 追蹤；examPractice 原始檔不刪題，練習可抽數降為 887 題，Daily／Weekly 合併來源池為 1,037 題。
- Daily Task 已新增延伸計畫 API：預設不變為 30 題；加做按鈕才延伸至最多 90 題；未完成保留題優先，超過上限分批且不 crash。Full Mock 改讀 150 題 verified，未升格練習題不會混入。
- 驗證：新增 `verify:sprint34`，覆蓋正式／練習邊界、升格副本排除、30／90 題、跨日保留、超過 90 題分批與 production 禁止內容；Apps Script 未修改。

# Sprint 34A 完成

- 完成 Sprint 34 新升格 109 題的全量結構、答案、來源、風險與近似題覆核；沒有為了維持 150 題而硬保留問題題。
- 85 題降回 practiceOnly、2 題待人工確認、22 題停用；verified 正式題庫為 41 題，Full Mock 可用 41 題且維持 verified-only。
- examPractice 原始 1,021 題，清理後可抽 974 題；Daily／Weekly 合併來源池 1,015 題，Daily 30／90 題規則與未完成保留題不受影響。
- 新增覆核、保留、降級與正式模擬考可信度文件；未修改 Apps Script、原 41 題答案、規準輔助評分或正式統計。
- 下一階段先人工補來源頁／版本、重新設計選項並逐題確認，再提出小批 verified candidate；不自動擴充第二批。
## Sprint 35：教材證據式正式題庫與歷史保護

- 建立 source_verified：84 題；每題具有實際 evidenceExcerpt、answerBasis、sourceEvidenceIds 與來源檔。
- 人工 verified 仍為 41 題；Full Mock 使用 verified + source_verified，共 125 題。
- Daily／Weekly 使用正式池 + 974 題可抽 examPractice，共 1,099 題；30／90 題規則不變。
- 原訂 120 題未達，因高風險、片段黏連、答案衝突或來源不足而排除，禁止為數量硬湊。
- 已作答或可能同步過的既有題目核心欄位不可修改；錯題採 deprecated + supersededBy + 新 ID。
- source_verified 與人工 verified 分層，無需逐題人工確認，但必須可由教材證據直接支持。

## Sprint 35.1：正式題庫上線確認

- 線上 production bundle 已確認 Sprint 35 題庫標記，正式池為 verified 41 + source_verified 84 = 125 題。
- Daily／Weekly 題池 1,099 題，Daily 30 題基本任務與 90 題可選上限維持。
- Bella learner 可正常進入今日任務；source_verified Result 顯示來源與答案依據。
- 新增 Coach Test 題庫版本顯示 `Sprint 35 source_verified v1`；Apps Script／API 均不需變更。
- 無 OpenAI／Gemini API 依賴；Apps Script 未修改。後續技術債為擴充高品質可抽文字教材與遠端 AnswerRecords 唯讀鎖定清單。

## Sprint 35B 完成

- 建立共用 `questionScheduler.ts`，記錄題目首次／最近出現、出現次數、作答／完成次數、模式與掌握度。
- Daily／Weekly 改以 Scheduler 避免近期重複；未完成保留題仍由 Daily Task v2 優先保留。Full Mock 維持 verified + source_verified，單回不重複，跨回只允許重要正式題小比例重現。
- 新增第一輪覆蓋率與 Stage A／B／C 策略文件；本 Sprint 沒有新增題目、沒有修改已作答題核心欄位、沒有修改 Apps Script。
- 簡答／申論數量盤點與下一階段 source_verified 小批擴充規劃見 `docs/35B_簡答申論擴充規劃.md`。

# Sprint 36：簡答／申論／案例 source_verified 第二批擴充

- Preflight：evidence index 3,982 chunks；可抽取文字來源 70 個；本批只使用解剖生理、精油基礎、精油化學、植物油／基底油的低風險證據。
- 新增 60 題：shortAnswer 40、essay 15、case_study 5；新 ID 71001～71060，source_verified 總數 144 題。
- Full Mock 正式池為 185 題；Daily／Weekly 題池為 1,159 題；Daily 30／90、Weekly 近 7 日避重、完整模擬考正式池與第一輪完成率均維持。
- 每題均有 sourceEvidenceIds、evidenceExcerpt、answerBasis、sourceLabel、sourceFile、sourceConfidence；非選擇題具備 referenceAnswer、sampleAnswer、keyPoints、rubric 與 explanation。
- 高風險主題與不足證據內容排除；未修改已作答題、原 verified 41 題、原 source_verified 84 題、Apps Script 或 API 設定。
- 詳細文件：`docs/36_source_verified第二批擴充報告.md`、`docs/36_簡答申論案例題清單.md`、`docs/36_排除與不足證據報告.md`、`docs/36_正式題池更新報告.md`。


## Sprint 36A：非選擇題自動規準評分與來源欄位

- 完成本機規準自動評分與作答狀態轉譯。
- 不再以待自評作為主要顯示；空白答案為未作答，舊紀錄可安全顯示或補跑。
- 未修改 Apps Script、題目核心欄位或遠端 AnswerRecords schema。

## Sprint 36B：正式題池來源追溯 metadata 補齊

- 正式題池 185 題完成來源欄位稽核；沒有新增題目，沒有修改任何已作答題核心欄位。
- source_verified 144 題均可對應 sourceEvidenceIndex；本批安全補入 144 題 `sourceChapter`，值為索引原始 section／段落定位。
- sourcePage 與 sourceVersion 在索引中沒有明確資料，補入數均為 0；不以檔名、段落號或索引建立時間猜造。
- source_verified 原有 answerBasis／evidenceExcerpt 已完整；verified 41 題無可直接對應 evidence，保留待補。
- 新增 `verify:sprint36b` 與機讀 metadata 報告；Apps Script 未修改、無 API 依賴、Sprint 35B 排程與 Sprint 36A 規準評分維持。

# Sprint 37：source_verified 第三批擴充完成

- 新增 100 題教材證據正式題：shortAnswer 43、essay 21、case_study 16、multipleChoice 10、multiSelect 10。
- source_verified 由 144 題增至 244 題，Full Mock 由 185 題增至 285 題，Daily／Weekly 由 1,159 題增至 1,259 題。
- 高風險覆蓋為孕婦 9、兒童 8、疾病／轉介 8、用藥 8；只納入教材明確支持的詢問、限制、衛生、倫理與轉介內容。
- 每題都有 source evidence、evidenceExcerpt、answerBasis、sourcePage／sourceChapter／sourceVersion、非選擇題規準欄位；頁碼與版本缺證據時保留待補。
- `verify:sprint37`、answered lock、source_verified、Sprint 35B、Sprint 36／36A、question bank、practice、nonchoice、build、lint 與 diff check 納入交付驗證；本批未執行 deploy。

# Sprint 37A：Coach 測試隔離與學習紀錄安全檢查

- Audit 確認原 Coach Test 可能呼叫正式 progress sync，並與 Bella 共用 study progress、錯題、Daily Task、Scheduler、草稿與 answered lock 本機 key。
- 以最小前端修正處理：App 不執行 Coach 的正式同步與 learner 紀錄寫入，`progressSync` 再加第二層拒絕 guard；Apps Script 不需修改。
- Coach 本機資料全面使用 `ifa-coach-test-` prefix，learner 原 key 保持不變；reset 只移除目前 profile 的本機資料。
- 新增 `verify:sprint37a`，驗證 Coach 不送 POST、learner 仍可同步、LocalStorage／answered lock 隔離與重置邊界；題庫未修改。
- `verify:sprint37a` 與 build 通過；本 Sprint 未執行 deploy，未進入下一 Sprint。

# Sprint 38：題庫品質治理、解析完整性、來源追溯與考題重複控制

- 未新增題目、未修改題庫 JSON、未改動 Bella learner 歷史紀錄或 Apps Script。
- 以執行期治理層處理 active 題的缺圖語句、144 題「依教材證據」題幹語氣與 69 題正式題的簡體中文字；已作答題由 Answered Question Lock 保持核心欄位不變。
- 原始正式題有 31 題缺少部分非選擇題輔助解析欄位，現已補足本機規準所需顯示欄位；正式池檢核缺解析題數為 0。
- 正式池 285 題與 source_verified 244 題的 metadata 欄位結構完整；沒有可證實的版本／既有 evidence 時標記 `metadata_missing`，不假造來源。
- Daily／Weekly 候選題新增全歷史完成排除，測試確認已完成 ID 不會再次抽到；Sprint 35B 與 Sprint 37A 邊界維持。
- 詳見 `docs/38_圖片題檢查報告.md`、`docs/38_解析完整性報告.md`、`docs/38_繁體中文檢查報告.md`、`docs/38_來源缺口報告.md`、`docs/38_非選擇題品質改善報告.md`、`docs/38_題目重複檢查報告.md`。
# Sprint 39：學習歷史同步、來源追溯、Final Review 基礎（2026-07-20）

以考試可靠性為優先，新增逐題永久 history 雙保存、Google Sheet 唯讀歷史查詢、Daily／Weekly 永久避重、Final Review 關閉狀態的選題基礎，以及 Coach 唯讀分析。正式題未修改任何答案或核心內容；Apps Script 只新增 history 工作表與查詢／寫入分支，既有同步流程不變。

# Sprint 40～40C：正式題庫品質治理與可信度分級

- 完成正式題與 Daily 題庫的題幹語意、選項公平性、缺圖、解析完整性與來源欄位 audit；治理只新增 runtime metadata/display layer，不改 canonical 題目或歷史資料。
- 正式題分級為 A 0、B 284、C 1；C 題 71001 以 practiceOnly／formalScoreEligible=false 隔離。答案可信度與 metadata 完整度分開計算，避免來源欄位缺漏錯誤地改變答案可信度。
- 缺圖題沒有生成醫療圖片，改用已驗證的文字替代顯示；medium option similarity 保留人工審核，不自動重寫干擾選項。

# Sprint 41：B 級題品質評估

- 針對 196 題初始 B 級題逐題評估；152 題升為 answerConfidence A，44 題保留 B，0 題新增降級。
- 評估使用既有題幹、答案、evidence、選項品質與 display 題幹；sourceVersion／sourcePage 缺口仍列待補，沒有猜造或改寫答案。

# Sprint 42：題目語意與解析品質 Audit

- 完成正式 285 題與 Daily 1,259 題的顯示題幹與解析欄位 audit；原始題幹保留於 `question`，學員介面改讀 `displayQuestion`。
- 顯示層清理 AI／教材提示語、技術抽取位置與不自然句型；非選擇題補足作答方向，Result 統一顯示答案重點、解析與來源 fallback。

# Sprint 42.1：正式題語意人工化與 refinement

- 正式 285 題中 217 題完成 display refinement、68 題保留、41 題列人工確認；不修改 `question`、`answer`、`evidenceExcerpt`、`answerBasis`、Bella history、Apps Script 或 answered lock。
- `verify:sprint42-1` 通過正式題數量、來源／歷史保護、TypeScript build 與 production bundle security；本 Sprint 未 deploy。

# Sprint 56：Past Exam Extraction Pipeline

- 建立只讀 `scripts/sprint56-past-exam-pipeline.py`，以 Sprint 55 inventory 為輸入，將 157 個 exam-like source document 分為 `official_exam_candidate` 16、`textbook_exam_candidate` 52、`practice_only` 72、`unknown` 17。
- 產生 882 個具題目訊號的 extraction records；另保留 1,240 個低訊號編號片段與不可讀／圖片-only source review records，全部進 `pending_review` queue，不建立 runtime 題目 ID。
- Formal baseline 維持 285 題：official_exam 25、textbook 259、unknown 1。候選與 Formal 的 exact normalized match 為 0；pipeline 不因此自動新增、覆蓋、合併或刪除題目。
- 明示答案才保存 `answer_status=source_stated` 與 `answer_source`；沒有答案一律 `unknown`，不由檔名、選項或模型推論補答。
- 建立 review-only image metadata schema 與 `public/question-assets/` staging 說明；本 Sprint 不 OCR、不複製 private 圖片、不把圖片 binary 或來源路徑打包進 runtime。
- 產出 `sprint56_past_exam_inventory.md`、metadata-only `sprint56_past_exam_review_queue.json` 與 `sprint56_past_exam_coverage.md`；完整含題目／選項／明示答案的 `sprint56_past_exam_extractions.json` 僅保留本機並由 `.gitignore` 排除，未修改 canonical question JSON、UI、Daily／Weekly、scheduler、blueprint 或 Apps Script。
