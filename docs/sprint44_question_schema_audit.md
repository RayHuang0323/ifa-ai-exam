# Sprint 44 題庫 Schema Audit

> 目的：建立題庫正式化前的固定治理規則。
> 原則：本 Sprint 只檢查 schema；不改題目文字、選項、答案、解析或來源內容。

## 一、最低治理 schema

每筆準備進入正式或 Daily runtime 的題目，至少需要：

```text
id
type
question
answer
explanation
category
source
```

本 repo 的既有 source 欄位名稱為 `sourceLabel` 或 legacy `reference`；正式化時把它們視為 source lineage，不要求現在立刻重寫所有舊資料。`week1` 的 `chapter` 也由 Question Engine 映射為 `category`。

條件欄位：

- 短答：`shortAnswer`、`short_answer`、`short-answer` 等短答 alias 必須有非空 `referenceAnswer`。
- 申論：`essay` 必須有非空 `rubric`。
- 案例與其他非選擇題：`case`、`case_study`、`case-study`、`formula-design` 也應有 `rubric`，作為正式化的延伸門檻。
- 選擇題：`options` 至少 2 個；`answer` 必須存在於 `options`。多選題答案可為字串陣列。
- runtime type 應使用既有 canonical type；candidate alias 需在人工審核後轉換，不在 audit 階段猜測。

## 二、缺欄位結果

下表針對 raw JSON 記錄缺口；治理完整率已採 inventory 定義的 legacy alias，但條件欄位仍要求原始存在。

| JSON | 缺 answer | 缺 explanation | 短答缺 referenceAnswer | essay 缺 rubric | 案例／其他非選擇題缺 rubric | 備註 |
|---|---:|---:|---:|---:|---:|---|
| `exam-practice.json` | 0 | 0 | 0 | 0 | 0 | runtime practice schema 通過 |
| `pending-review.json` | 27 | 60 | 31 | 16 | 6 | candidate，未進 runtime |
| `source-verified-sprint36.json` | 0 | 0 | 0 | 0 | 0 | source-verified |
| `source-verified-sprint37.json` | 0 | 0 | 0 | 0 | 0 | source-verified |
| `source-verified.json` | 0 | 0 | 0 | 0 | 0 | source-verified |
| `verified-extra.json` | 0 | 0 | 0 | 0 | 0 | 目前 0 題 |
| `week1.json` | 0 | 0 | 5 | 0 | 0 | legacy 短答由 runtime fallback 到 `answer` |
| `week2.json` | 0 | 0 | 0 | 0 | 0 | 正式題庫 schema 通過 |
| `week2.staging.json` | 0 | 33 | 21 | 7 | 3 | candidate，未進 runtime |

## 三、欄位與 type 異常

### 1. Legacy／candidate type

正式 runtime 目前接受既有的 `single`、`multiple`、`multipleChoice`、`multiSelect`、`short_answer`、`shortAnswer`、`essay`、`case`、`case_study`。以下 type 只出現在 pending／staging candidate，尚未轉正：

```text
short-answer, case-study, fill-in, multiple-choice,
single-choice, true-false, formula-design
```

這些 alias 需要未來人工決定 canonical type 與 scoring semantics；本 Sprint 不自動轉換。

### 2. Metadata gap

- `week1.json` raw 資料缺少 `category`、`sourceType`、`reviewStatus` 等現代欄位，但每題有 `chapter`／`reference`，runtime 已有明確 mapping。
- `source-verified.json` 與 `source-verified-sprint36.json` 的 source evidence 仍有版本／追溯 metadata 待補，runtime 會標示 `metadata_missing`，不因此改寫來源。
- `exam-practice.json` 的 source lineage 以 `sourceLabel` 為主；`sourceFile`、頁碼與完整教材證據不是每題都有，因此不應把 practice-ready 誤標成 source-verified。
- `pending-review.json` 的 27 筆 missing-answer 與全部缺 explanation 是候選資料問題，不可直接 promoted。

### 3. Duplicate policy

全 JSON 掃描得到 33 組重複 ID（pending／staging candidate tracking）與 53 組正規化題幹重複（181 筆）。這些是治理輸入，不是本 Sprint 的刪題理由。未來要依來源、版本、review status 與正式／練習用途進行人工裁決。

## 四、現有驗證結果

本次 schema audit 同時執行既有題庫 validators：

- `validate:questions:bank`：通過，正式池 285 題。
- `validate:questions:practice`：通過，exam-practice 1,021 題。
- `validate:questions:nonchoice`：通過，非選擇題 521 題。
- `validate:questions:staging`：通過，staging 33 題、pending-review 60 題。

結論：沒有發現需要修改題庫文字或新增 runtime fallback 的新 schema bug。本 Sprint 不修改 JSON 題庫。
