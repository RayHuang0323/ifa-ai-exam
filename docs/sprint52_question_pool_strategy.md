# Sprint 52 Question Pool Strategy

> 本報告只新增題庫治理 metadata 與選題策略檢查；沒有修改任何 JSON 題目、question、answer、explanation 或 Apps Script。

## 1. 題庫盤點與來源分類

`src/data/questions/` 內的題目 JSON 分為 formal、practice、staging、pending 四種治理狀態。`formalQuestionSyllabusMap.json` 是 mapping metadata，不重複計入題目數。

| JSON 題庫 | 題數 | 治理狀態 |
|---|---:|---|
| `week1.json` | 20 | formal |
| `week2.json` | 21 | formal |
| `verified-extra.json` | 0 | formal |
| `source-verified.json` | 84 | formal |
| `source-verified-sprint36.json` | 60 | formal |
| `source-verified-sprint37.json` | 100 | formal |
| `exam-practice.json` | 1,021 | practice；runtime eligible 974 |
| `week2.staging.json` | 33 | staging |
| `pending-review.json` | 60 | pending |
| **合計** | **1,399** | question records |

逐檔來源分類結果：

| JSON | `official_exam` | `textbook` | `ai_generated` | `unknown` |
|---|---:|---:|---:|---:|
| `week1.json` | 19 | 0 | 0 | 1 |
| `week2.json` | 6 | 15 | 0 | 0 |
| `verified-extra.json` | 0 | 0 | 0 | 0 |
| `source-verified.json` | 0 | 84 | 0 | 0 |
| `source-verified-sprint36.json` | 0 | 60 | 0 | 0 |
| `source-verified-sprint37.json` | 0 | 100 | 0 | 0 |
| `exam-practice.json` | 0 | 96 | 851 | 74 |
| `week2.staging.json` | 8 | 0 | 0 | 25 |
| `pending-review.json` | 7 | 0 | 0 | 53 |
| **合計** | **40** | **355** | **851** | **153** |

Formal 285 題的分類為 `official_exam` 25、`textbook` 259、`unknown` 1；practice raw 1,021 題的分類為 `textbook` 96、`ai_generated` 851、`unknown` 74。這代表 practice 約 83.4% 是明確 AI-generated，Weekly 不應把 practice 當成與 formal 等權來源。

來源 metadata 統一使用四個值：

- `official_exam`：有歷屆／試卷證據；術科考官建議若沒有明確歷屆證據不歸入此類。
- `textbook`：教材、講義或 source-verified evidence lineage。
- `ai_generated`：明確標示 AI 生成或教材 AI 萃取。
- `unknown`：mock、待人工核對、缺少可驗證 lineage 或其他尚不能判定者。

目前 canonical question records 的分類結果由 `npm run verify:sprint52` 重新計算並列印；報告中的 `unknown` 是治理上的保守標記，不代表答案錯誤。`mock`、`high_priority_review`、`verified-practice` 只有在有明確 lineage 時才可升級，不會因名稱推定為 official。

## 2. 使用策略

| 模式 | 題庫策略 | 狀態 |
|---|---|---|
| Full Mock | 只讀 formal pool，維持 weighted blueprint 與固定 60 題 | 已落實 |
| Weekly | formal＋practice，但 formal candidate 取得明確優先權；最近 7 日 Daily／Weekly／Mock 題目排除 | Sprint 52 強化 |
| Daily | formal＋practice；完成過的 question ID 與 semantic duplicate group 不再重抽，最近 3 日題目及其 duplicate group 排除 | Sprint 52 強化 |

`src/utils/questionEngine.ts` 維持 Daily 的 formal＋practice pool；`src/utils/weightedMockSelection.ts` 維持 Full Mock formal-only 篩選。未調整 Daily target、scheduler、UI 架構或 Apps Script API。

## 3. Non-destructive metadata

新增 `src/data/questions/questionPoolMetadata.ts`，以 sidecar metadata 方式提供：

- `questionSourceType`
- `duplicateGroupId`
- `duplicateRisk`：`none`、`low`、`medium`、`high`

Exact content、既有 `duplicateOf`／`relatedVerifiedId` lineage，以及 character-bigram Jaccard >= 0.85 的高風險 semantic match 會建立同一個 deterministic duplicate group。Jaccard >= 0.70 或 >= 0.55 但未形成高風險 group 時，僅保留 `duplicateRisk`，不刪題、不改題目內容。

## 4. Duplicate 與 pool 邊界

- Formal pool 保持 285 題，沒有 practice、staging 或 pending 題目進入 Full Mock。
- Practice raw 為 1,021 題，其中 47 題目前因既有 inactive／exclude／quality status 不進 runtime practice；runtime practice 為 974 題。
- Exact duplicate：formal 0 組、runtime practice 0 組、formal＋runtime practice 跨池 41 組。
- Runtime formal＋practice 以相同 category 做 semantic audit，Jaccard >= 0.85 的高風險 pair 為 732 組；這是 review signal，不代表 732 題都應刪除。
- Exact／semantic duplicate 只做 metadata 與選題排除；不刪除題目，也不改寫 answer、explanation 或 question wording。
- staging、pending 不會因本 Sprint 自動加入任何 runtime pool。

## 5. 驗證規則

`npm run verify:sprint52` 檢查：

1. 所有 question JSON 的數量、來源分類與 formal/runtime pool 邊界。
2. formal 與 runtime practice 的 ID 唯一性與 exact duplicate audit。
3. semantic duplicate audit 與 sidecar metadata 欄位。
4. scheduler 是否以 completed ID、duplicate group、Daily 3 日／Weekly 7 日排除線選題。
5. Full Mock formal-only、Daily formal＋practice、Weekly formal-priority routing。

Playwright E2E 另驗證 Daily／Weekly 實際 session 的近期題目不重疊，以及既有 Full Mock 固定 60 題流程。

## 6. 尚未自動處理的風險

- `unknown` 題目仍需人工確認來源 lineage；本 Sprint 不自行推定為正式考古題。
- semantic similarity 是治理用 heuristic，不是答案正確性判定；高風險群組仍需人工 review。
- Weekly 仍保留 practice 作為 formal 不足或複習補充來源，正式考試成績仍只由 Full Mock formal pool 計算。
- repository 沒有 Google Sheet 題庫 export，無法進行外部 Sheet row-level reconciliation。
