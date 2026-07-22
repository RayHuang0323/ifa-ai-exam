# Sprint 44 題庫 Inventory

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：`src/data/questions/*.json` 的全部 JSON 陣列。
> 本 Sprint 不修改題目文字、選項、答案、解析或來源內容。

## 一、總覽

目前共有 9 個 JSON 題庫檔案、1,399 筆題目資料。

Question Engine 目前會載入：

- 正式池：`week1.json`、`week2.json`、`verified-extra.json`、三批 `source-verified*.json`
- Daily／Practice 池：`exam-practice.json`
- 不載入 runtime：`pending-review.json`、`week2.staging.json`

`verified-extra.json` 目前為空檔，但保留為正式題庫的既有入口。

本報告的「治理完整率」採 runtime-compatible 判定：

- `category` 可由 legacy `chapter` 提供。
- `source` 可由既有 `source`、`sourceLabel`、`reference` 或 `sourceFile` 提供。
- 短答類型需有 `referenceAnswer`。
- `essay`、`case`、`case_study` 與 candidate 的非選擇題類型需有 `rubric`。

「來源追溯完整率」則要求 `sourceType`、來源標籤、檔案、頁碼、章節、版本、evidence、`answerBasis` 與 review 狀態均可追溯；legacy／practice 題庫未補齊時會被記為不完整。

## 二、逐檔盤點

| JSON | 題數 | 題型分布 | 治理完整率 | 來源追溯完整率 | sourceType／reviewStatus | 狀態 |
|---|---:|---|---:|---:|---|---|
| `exam-practice.json` | 1,021 | `shortAnswer` 248、`essay` 113、`case_study` 138、`multipleChoice` 353、`multiSelect` 169 | 1,021/1,021 | 0/1,021 | `ai_generated_from_material` 851、`extracted_material` 96、`verified-practice` 49、`high_priority_review` 24、`mock` 1；review `needs_review` 979、`practice_ready` 41、`mock_only` 1 | Daily／Practice runtime 題池 |
| `pending-review.json` | 60 | `short-answer` 31、`essay` 16、`case-study` 4、`fill-in` 2、`multiple-choice` 1、`single-choice` 3、`true-false` 1、`formula-design` 2 | 0/60 | 0/60 | `past-exam` 7、`mock-exam` 15、`course-workbook` 24、`student-notes` 14；review `source-page-pending` 33、`missing-answer` 27 | pending，未載入 runtime |
| `source-verified-sprint36.json` | 60 | `shortAnswer` 40、`essay` 15、`case_study` 5 | 60/60 | 0/60 | `extracted_material` 60；`source_verified` 60 | 正式 source-verified 批次 |
| `source-verified-sprint37.json` | 100 | `shortAnswer` 43、`essay` 21、`case_study` 16、`multipleChoice` 10、`multiSelect` 10 | 100/100 | 100/100 | `extracted_material` 100；`source_verified` 100 | 正式 source-verified 批次 |
| `source-verified.json` | 84 | `shortAnswer` 52、`multipleChoice` 32 | 84/84 | 0/84 | `extracted_material` 84；`source_verified` 84 | 正式 source-verified 批次 |
| `verified-extra.json` | 0 | — | — | — | — | 正式入口，目前空檔 |
| `week1.json` | 20 | `single` 11、`multiple` 2、`short_answer` 5、`essay` 1、`case_study` 1 | 15/20 | 0/20 | raw review/sourceType 未填；runtime 由 `chapter`／`reference` 映射為正式 legacy 題 | 正式 legacy 題庫 |
| `week2.json` | 21 | `shortAnswer` 15、`essay` 5、`multipleChoice` 1 | 21/21 | 0/21 | `past_exam` 6、`lecture` 15；`verified` 21 | 正式題庫 |
| `week2.staging.json` | 33 | `short-answer` 21、`essay` 7、`case-study` 2、`single-choice` 2、`formula-design` 1 | 0/33 | 0/33 | `past-exam` 7、`mock-exam` 1、`course-workbook` 17、`student-notes` 8；candidate review `approved-candidate` 31、`supplement-week1-candidate` 2 | staging，未載入 runtime |

## 三、題型分布總計

| raw type | 題數 | 說明 |
|---|---:|---|
| `shortAnswer` | 398 | 目前正式／練習 runtime 使用的短答名稱 |
| `short_answer` | 5 | `week1` legacy 短答名稱 |
| `short-answer` | 52 | pending／staging candidate alias，尚未轉正 |
| `essay` | 178 | 申論 |
| `case_study` | 160 | 正式／runtime 案例題 |
| `case-study` | 6 | candidate alias |
| `multipleChoice` | 396 | 單選題的 runtime 名稱 |
| `multiSelect` | 179 | 多選題的 runtime 名稱 |
| `single` | 11 | `week1` legacy 單選名稱 |
| `multiple` | 2 | `week1` legacy 多選名稱 |
| `fill-in` | 2 | candidate alias，待治理 |
| `multiple-choice` | 1 | candidate alias，待治理 |
| `single-choice` | 5 | candidate alias，待治理 |
| `true-false` | 1 | candidate alias，待治理 |
| `formula-design` | 3 | candidate 非選擇題 alias，待治理 |

## 四、正式題庫與候選資料狀態

目前正式模擬考可用池仍由既有治理規則決定：41 題人工 verified，加上 244 題 source-verified，正式池共 285 題。`exam-practice.json` 的 1,021 題供 Daily／Practice 使用，但其中 review 狀態仍以 `needs_review` 為主，不能直接視為正式考試題。

`pending-review.json` 與 `week2.staging.json` 的資料仍保留候選 ID、candidate type、待補解析與待補評分欄位。兩者不會因本次 inventory 被自動 promoted，也沒有修改內容。

跨全部 JSON 的去重結果：

- 題目 ID 重複：33 組、66 筆，均為 pending 與 staging 之間的候選追蹤 ID。
- 正規化題幹重複：53 組、181 筆，主要包含正式題、練習題與候選資料的來源／版本副本。

這些重複目前只列入治理與 AI 審核準備，不刪除、不合併。

## 五、runtime 風險判定

本次盤點未發現新的 runtime schema bug。既有 runtime 已處理：

- `week1` 的 `chapter` → `category` 與 `reference` → source label legacy mapping。
- 非選擇題缺少 raw `referenceAnswer`／`rubric` 時的 learning-only governance fallback。
- candidate alias type 不進 Question Engine。

因此本 Sprint 不修改題庫資料內容，也不修改考試流程、UI 或 Apps Script。
