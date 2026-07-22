# Sprint 43 題庫品質 Audit

> Audit 日期：2026-07-22（Asia/Taipei）
> 範圍：`src/data/questions/*.json` 全部資料，以及 `writingPracticeSamples.ts` 的獨立示範題。
> 原則：本報告只記錄問題；不修改題目文字、答案或來源內容。

## 一、掃描範圍與 runtime 邊界

| 檔案 | 題數 | runtime 用途 |
|---|---:|---|
| `week1.json` | 20 | 正式池（runtime 補上 legacy metadata） |
| `week2.json` | 21 | 正式池 |
| `verified-extra.json` | 0 | 正式池補充檔，目前為空 |
| `source-verified.json` | 84 | 正式池 |
| `source-verified-sprint36.json` | 60 | 正式池 |
| `source-verified-sprint37.json` | 100 | 正式池 |
| `exam-practice.json` | 1,021 | Daily／Weekly 練習池；不列正式成績 |
| `week2.staging.json` | 33 | staging，不匯入 runtime |
| `pending-review.json` | 60 | 人工審核佇列，不匯入 runtime |
| `writingPracticeSamples.ts` | 1 | 獨立簡答示範，不進正式／Daily／Full Mock |

JSON 合計 **1,399 題**。正式 Question Engine 目前建立 **285 題**正式池；`examPractice` 只作可抽練習題，staging／pending-review 不在 runtime import 清單內。

## 二、必填欄位與缺漏

正式題與可抽練習題的 `id`、`type`、`question`、`answer`、`explanation`、`difficulty`、`sourceType`、`sourceLabel`、`reviewStatus` 掃描結果如下：

| 檔案 | 缺 answer | 缺 explanation | 缺 referenceAnswer（非選擇題） | 缺 rubric（essay） |
|---|---:|---:|---:|---:|
| `week1.json` | 0 | 0 | 5（14–18） | 0 |
| `week2.json` | 0 | 0 | 0 | 0 |
| `source-verified.json` | 0 | 0 | 0 | 0 |
| `source-verified-sprint36.json` | 0 | 0 | 0 | 0 |
| `source-verified-sprint37.json` | 0 | 0 | 0 | 0 |
| `verified-extra.json` | 0 | 0 | 0 | 0 |
| `exam-practice.json` | 0 | 0 | 0 | 0 |
| `week2.staging.json` | 0 | 33 | 30 | 7 |
| `pending-review.json` | 27 | 60 | 51 | 16 |

staging／pending-review 的缺漏屬於既有人工審核邊界，沒有被 Question Engine 匯入；本 Sprint 不補答案、解析或 rubric。正式 source_verified 批次的非選擇題 referenceAnswer、sampleAnswer、keyPoints、rubric、explanation 均具備。

獨立示範題 `writingPracticeSamples.ts` 的 ID 9001 使用 legacy `answer`／`reference` 形狀，未提供 `referenceAnswer` 或 rubric；它只供練習中心示範，Result 會安全 fallback 至 `answer`，不屬正式考試題。

## 三、題型格式檢查

### 可抽 runtime 練習池

`exam-practice.json` 發現 2 筆 schema 不一致：

| ID | 目前 type | answer 形狀 | 影響 |
|---:|---|---|---|
| 40004 | `multipleChoice` | `string[]`（2 個答案） | Exam 會以單選 radio 呈現，無法正確完成多選作答 |
| 40013 | `multipleChoice` | `string[]`（2 個答案） | 同上 |

這兩筆不是題目內容或答案問題，而是多選答案與題型標籤不一致。Phase 4 已將 type metadata 修正為 `multiSelect`，保留原題幹、options、answer、referenceAnswer 與 explanation。

### staging／pending-review

候選資料的格式缺口均未進 runtime：

- `pending-review.json`：60 筆 ID 為字串型候選 ID；9 筆使用尚未整合的候選 type（`fill-in`、`multiple-choice`、`single-choice`、`true-false`、`formula-design`）。
- `week2.staging.json`：33 筆 ID 為字串型候選 ID；3 筆使用尚未整合的候選 type（`single-choice`、`formula-design`）。

JSON parse、正式題型、選擇題 options 結構與正式題答案／options 對應未發現其他錯誤。

## 四、metadata 完整度

### 正式／練習來源 metadata

- `exam-practice.json`：可抽題需要的 `sourceFile`、`practiceOnly`、`formalScoreEligible` 均存在。
- `source-verified.json`：84 題缺 `sourceVersion` 與 raw `metadataStatus`；runtime 會依規範轉為 `metadata_missing`，不猜造版本。
- `source-verified-sprint36.json`：60 題缺 `sourceVersion` 與 raw `metadataStatus`；頁碼／版本缺口維持待補。
- `source-verified-sprint37.json`：100 題缺 raw `metadataStatus`；其餘 source evidence 欄位由既有驗證流程檢查。
- `week1.json`：legacy 題目缺少部分 raw `sourceFile`／`sourcePage`，且未帶現代 `sourceType`／`reviewStatus`；Question Engine 以既有相容層注入 `past_exam`／`verified`，缺少的來源欄位在顯示層標記待補。
- `week2.json`：21 題缺 raw `sourceChapter`、`sourceVersion`、`sourceEvidenceIds`、`evidenceExcerpt`、`answerBasis`；另有 1 題缺 `sourceFile`／`sourcePage`。未因缺口猜填來源。

### 候選 metadata

- `pending-review.json`：60 題缺 `sourceLabel`；其中 27 題另缺 answer，全部缺正式 runtime 所需 `sourceFile`／`practiceOnly`／`formalScoreEligible`。
- `week2.staging.json`：32 題缺 `sourceLabel`；全部缺 `explanation`，並維持 staging 狀態。

這些候選 metadata 缺口不會污染正式池；若要升格，需依人工 reviewer／來源／答案閘門另行處理。

## 五、重複檢查

- 全部 JSON 以題幹去除空白／標點／大小寫後比對：**53 組、181 筆**重複題幹紀錄。
- 全域重複 ID：**33 組**，均為 `pending-review.json` 與 `week2.staging.json` 的候選 ID 重複；這是既有 staging／審計軌跡，未被 runtime 匯入。
- 題幹重複包含正式題與 `examPractice` 的練習副本，以及 staging／pending 候選；正式池本身由既有 Question Engine 與驗證流程維持唯一 ID，不把候選資料納入正式抽題。
- 本 Sprint 不刪除、不合併、不修改任何題目內容；重複資料保留供既有治理與人工審核追蹤。

## 六、處置結論

1. 2 筆可抽練習題的 type schema 已修正：40004、40013 `multipleChoice` → `multiSelect`；未改題目內容。
2. staging／pending-review 的缺答案、缺解析、缺 referenceAnswer、缺 rubric、候選 ID/type 與 metadata 缺口維持原狀，沒有進 runtime。
3. 正式 source_verified 的 raw metadata 待補欄位不影響目前 runtime，且由治理層以 `metadata_missing`／「待補」安全呈現。
4. 題庫 audit 未發現需要修改正式答案、解析、Apps Script 或 UI 架構的問題。
