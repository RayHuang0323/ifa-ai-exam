# Sprint 51 Question Bank Integrity Audit

> 日期：2026-07-23（Asia/Taipei）
> 範圍：`src/data/questions/*.json`、legacy `src/questions/week1.json`、Question Engine、Daily／Weekly／Full Mock routing 與 repository 內的來源 mapping。
> 本 Sprint 只讀取並產生報告；沒有修改題目、答案、UI、Apps Script 或 runtime 流程。

## 一、結論摘要

| 項目 | 數量／結果 |
|---|---:|
| Formal pool | 285 |
| Exam-practice raw | 1,021 |
| Exam-practice runtime 可用 | 974 |
| Staging | 33 |
| Pending review | 60 |
| Explicit `reviewStatus=rejected/blocked` | 0 |
| Practice quality excluded | 25（unsafe 4、duplicate 21） |
| Practice inactive／needs-fix 另排除 | 22 |
| Direct `knowledgeId` formal coverage | 41/285 |
| Formal／practice exact content duplicate | 41 組 |
| Active pool semantic duplicate candidates（Jaccard ≥ 0.70） | 1,076 組 |

目前題庫的正式／練習數量邊界正常，但「題數」不等於「獨立知識覆蓋」。正式題與 practice 題之間存在 41 組完全相同題幹／選項內容的跨池副本；practice 仍有大量 semantic duplicate candidates。另有 244 題 formal 只有 estimated syllabus mapping，沒有 direct `knowledgeId`。

## 二、JSON inventory

### Canonical question JSON

| 檔案 | 原始題數 | Runtime 分類 | reviewStatus 摘要 | 備註 |
|---|---:|---|---|---|
| `week1.json` | 20 | formal | 欄位缺少 reviewStatus（由 engine 視為 verified） | legacy formal pool |
| `week2.json` | 21 | formal | verified 21 | 人工整理 formal |
| `verified-extra.json` | 0 | formal input | 0 | 目前沒有題目 |
| `source-verified.json` | 84 | formal | source_verified 84 | 教材證據正式題 |
| `source-verified-sprint36.json` | 60 | formal | source_verified 60 | 教材證據第二批 |
| `source-verified-sprint37.json` | 100 | formal | source_verified 100 | 教材證據第三批 |
| **Formal total** | **285** | **formal** | — | Question Engine 實際 formal pool |
| `exam-practice.json` | 1,021 | practice | needs_review 979、practice_ready 41、mock_only 1 | raw practice pool |
| `week2.staging.json` | 33 | staging | approved-candidate 31、supplement-week1-candidate 2 | 不被正式 runtime 匯入 |
| `pending-review.json` | 60 | pending | source-page-pending 33、missing-answer 27 | 不被正式 runtime 匯入 |

`formalQuestionSyllabusMap.json` 是 285 筆的 sidecar mapping object，不是 question array；`runtimeImport=false`。它提供 285/285 的 estimated syllabus category，但不能替代逐題 direct knowledge mapping。

### 額外 legacy JSON

`src/questions/week1.json` 另有 20 題，與 `src/data/questions/week1.json` 的 20 個 ID／題幹完全重疊；目前 runtime 與 scripts 都使用 `src/data/questions/week1.json`。這是 legacy mirror，應避免未來被誤當成第二份題庫。

各 canonical JSON 在檔案內 ID 均唯一；staging 與 pending 則保留相同 candidate ID 供不同治理狀態追蹤，兩者都不進 runtime。

### 題型分布

Formal 285 題：

| 題型 | 題數 |
|---|---:|
| single | 11 |
| multiple | 2 |
| short_answer | 5 |
| essay | 42 |
| case_study | 22 |
| shortAnswer | 150 |
| multipleChoice | 43 |
| multiSelect | 10 |

Runtime 可用 practice 974 題：`shortAnswer` 228、`essay` 106、`case_study` 138、`multipleChoice` 333、`multiSelect` 169。

## 三、Pool 狀態與 rejected／excluded

### Formal

- Week1：20 題，engine 直接視為 verified。
- Week2：21 題，須 `reviewStatus=verified`。
- Source-verified：244 題，須 source evidence、`verificationType=source_verified`、active 且 formal eligible。
- Formal raw source evidence：244/285；Week1／Week2 41 題沒有 `sourceEvidenceIds`。
- Formal raw `sourcePage`：0/285 有實際頁碼。
- Formal raw `sourceVersion`：0/285 有實際版本。

### Practice

Exam-practice 原始 1,021 題中，Question Engine 的 eligibility 排除：

| 排除原因 | 題數 |
|---|---:|
| `unsafe_candidate` + `isActive=false` + `excludeFromPractice=true` | 4 |
| `duplicate_candidate` + `isActive=false` + `excludeFromPractice=true` | 21 |
| `isActive=false` + `excludeFromPractice=true` | 22 |
| **Runtime 可用** | **974** |

目前沒有 explicit `reviewStatus=rejected` 或 `blocked` 的題目；本報告將上述 quality/inactive records 視為 excluded，而不是宣稱已被正式 reject。

## 四、來源分類

分類優先順序：明確 `sourceType=ai_generated_from_material` 判為 AI；`source_verified`／`extracted_material` 判為教材轉題；`week1`、`past_exam` 判為真實考古題；其餘依 source label／reference，無法確認則列未知。`source_verified` 的 label 即使含「非官方歷屆題」，仍依 `sourceType=extracted_material` 分到教材轉題，不視為真實歷屆題。

| Pool | 真實考古題 | 教材轉題 | AI生成題 | 未知來源 | 合計 |
|---|---:|---:|---:|---:|---:|
| Formal | 25 | 259 | 0 | 1 | 285 |
| Practice raw | 1 | 96 | 851 | 73 | 1,021 |
| Staging | 8 | 17 | 0 | 8 | 33 |
| Pending | 7 | 24 | 0 | 29 | 60 |
| **全部 question arrays** | **41** | **396** | **851** | **111** | **1,399** |

Formal 的 259 題教材轉題包含三批 `source-verified` 244 題與 Week2 lecture 15 題；目前沒有明確標為 AI-generated 的 formal 題。

## 五、Duplicate Audit

### 5.1 Exact duplicate

Strict key 採 `question type + normalized question + normalized options`；另以不含 type 的 content key 捕捉 `single`／`multipleChoice` 等舊新型別別名。

以 content key 審核後：

| 範圍 | 結果 |
|---|---:|
| Formal 內部 exact content duplicate | 0 組 |
| Runtime 可用 practice 內部 exact content duplicate | 0 組 |
| Formal ↔ runtime practice exact content duplicate | **41 組** |
| 所有 question JSON exact content groups | 53 組 |
| staging／pending mirror groups | 33 組 |

典型 cross-pool 副本：formal `1–20` 對 practice `40001–40020`；formal `1001、1002、1004–1007、1021–1028、1042–1047、1054、1056–1058、1060` 對應 practice `200xx`。這些是不同 ID，但題幹／選項內容相同，不應計作 41 個新的知識單位。

### 5.2 Semantic duplicate

使用 normalized question 的 character-bigram Jaccard；結果僅為候選偵測，不代表自動刪除或答案錯誤。

| 範圍 | Jaccard ≥ 0.70 | Jaccard ≥ 0.85 |
|---|---:|---:|
| Formal ↔ Formal | 68 | 5 |
| Formal ↔ Practice | 76 | 42 |
| Practice ↔ Practice | 932 | 284 |
| **Active combined pool** | **1,076** | **331** |

高相似候選例：formal `1`／practice `40001` = 1.000、formal `1001`／practice `20001` = 1.000、practice `20021`／`40125` = 0.875。Practice 內部候選數量高，與大量 template variation、同一教材知識點的多種問法有關，需後續以人工 knowledge mapping 判斷，不宜只靠文字相似度刪除。

### 5.3 Same knowledge point

- Formal 只有 41/285 題具 direct `knowledgeId`；三批 source-verified 244 題沒有 direct `knowledgeId`。
- Practice 1,021 題沒有 direct `knowledgeId`。
- Formal sidecar 雖完成 285/285 syllabus category mapping，但全數為 estimated category mapping，不能視為 direct knowledge point mapping。
- 已知 direct `knowledgeId` 重複只有 `EN002`：題目 10 與 18；文字相似度未達 semantic duplicate，屬同知識點的不同問題，不判定為重複題。
- 因 practice 與 244 題 formal 缺 direct knowledgeId，same-knowledge-point audit 目前不完整；這是本題庫最主要的治理缺口之一。

## 六、Daily／Weekly／Full Mock 使用分析

### Daily

Runtime 呼叫 `getDailyQuestionPool()`，來源為：

`formal 285 + runtime eligible practice 974 = 1,259 題`

Daily 基本目標 30 題，單日最高 90 題。`selectDailyQuestionIds()`：

- 以 Daily、Weekly、Mock 三種 mode 最近 3 日題目建立 exclusion set。
- 另排除已完成題與 scheduler 已完成題。
- 同一選擇結果使用 unique ID，不會在當次任務內重複。
- 未完成 carryover 題可穿越 3 日 exclusion，這是保留題設計，不是去重失效。

結論：近 3 日去重在 code level 有效，但 repository 沒有實際 learner localStorage history，無法由靜態資料計算真實使用者的重複率。

### Weekly

`handleStartWeeklyReview()` 目前使用：

`getFormalQuestionPool() + getPracticeQuestionPool() = 1,259 題`

每次最多選 40 題，`selectWeeklyQuestionIds()` 以最近 7 日 Daily／Weekly／Mock 題目做排除，並保留 unanswered、wrong answer、carryover 的優先例外。

結論：Weekly **不是固定正式題池**，目前與 Daily 使用相同的 formal＋practice candidate pool。這與 `docs/08_題庫規範.md` 中「Weekly Review 僅讀正式 verified pool」的治理文字不一致，應列為後續 runtime policy reconciliation 風險；本 Sprint 按要求不修改流程。

### Full Mock

- `prepareNewExam()` 只從 `getFormalQuestionPool()` 建立候選。
- `isFullMockEligibleQuestion()` 排除 `practiceOnly`、`formalScoreEligible=false`、answer/question confidence C。
- Weighted blueprint 固定題數為 60。
- practice、staging、pending、unsafe、duplicate candidate 不會進 Full Mock。
- 題目抽選使用 estimated blueprint category weights，不是官方 IFA blueprint。

結論：Full Mock 的題源隔離正確，正式 pool 限制成立；目前正式 mock 是 60/285 的 weighted selection。

### Cross-mode overlap

Daily 與 Weekly candidate pool 完全重疊；兩者依 3 日／7 日 scheduler exclusion 降低近期重複，但跨週期仍可能重複，且錯題、未完成題與 carryover 會有意穿越 exclusion。這是複習策略，不是獨立題庫保證。

另發現 mock resume path 會重新從 formal eligible pool 建立題目，而不是直接以 draft 的 question IDs 還原；這不改變題源邊界，但可能造成「恢復後題組與原草稿不完全相同」的流程風險，留待後續專項處理。

## 七、Google Sheet reconciliation

Repository 內沒有 Google Sheet 題庫 export、CSV、XLSX 或 question-row mapping。現有：

- `docs/google-apps-script/Code.gs`：同步 ExamSessions／AnswerRecords 與 Coach summary，不保存題庫 export。
- `src/data/knowledge/sourceMappings.json`：空陣列 `[]`，沒有 Google Sheet 題目 mapping。
- `docs/google-apps-script/README.md`：只描述 progress／answer records schema，沒有題庫 row count。

因此本 Sprint 無法做外部 Google Sheet row count vs JSON row count 的數值 reconciliation。

Repository 內部統計檔 `src/config/questionBankVersion.ts` 的 `verifiedCount=41`、`sourceVerifiedCount=244`、`fullMockEligibleCount=285`、`dailyWeeklyPoolCount=1259` 與本次 JSON／runtime audit 一致。

但 `docs/35_FullMock題庫來源更新報告.md` 仍記載舊數字 formal 125、Daily／Weekly 1,099；該文件已過時，不應作為目前題庫統計來源。

## 八、Integrity risks

1. Formal 244 題缺 direct `knowledgeId`；practice 1,021 題全部缺 direct `knowledgeId`，無法可靠完成跨池 knowledge-point 去重。
2. Formal／practice 有 41 組 exact content duplicate；目前靠不同 ID 與 practice metadata 區隔，仍會同時出現在 Daily／Weekly candidate pool。
3. Practice semantic duplicate candidates 達 1,076 組，需以 knowledge point、答案目的與題型人工分群。
4. Weekly runtime 使用 practice 題，與題庫規範宣告的 verified-only policy 不一致。
5. Formal raw sourcePage/sourceVersion 皆為缺口；source-verified 有 evidence，但來源版本／頁碼治理仍不完整。
6. `src/questions/week1.json` 是未被 runtime 使用的 20 題 legacy mirror，存在未來誤匯入風險。
7. Repository 沒有 Google Sheet 題庫 export，因此外部資料源無法完成 row-level reconciliation。
8. Mock resume 可能未以原 draft question IDs 還原，需另行做流程修正與 E2E 覆蓋。

## 九、Audit boundary

本報告沒有修改任何 JSON 題庫、答案、題目文字、UI、Apps Script、Daily scheduler 或 Weekly／Mock runtime。Duplicate 與 semantic 結果都是 review candidates，不代表自動刪除、降級或答案判錯。
