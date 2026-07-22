# Sprint 45 正式題庫 Audit

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：Question Engine 的正式來源：`week1.json`、`week2.json`、`verified-extra.json`、`source-verified.json`、`source-verified-sprint36.json`、`source-verified-sprint37.json`。
> 原則：本 Sprint 不修改題目文字、選項、答案、解析、來源內容或 UI／Apps Script。

## 一、正式題庫邊界

正式來源 raw records 共 285 題：

| 來源 | 題數 | runtime 狀態 |
|---|---:|---|
| `week1.json` | 20 | legacy verified，runtime 由 `chapter`／`reference` 映射欄位 |
| `week2.json` | 21 | `reviewStatus: verified` |
| `verified-extra.json` | 0 | 正式入口保留，目前空檔 |
| `source-verified.json` | 84 | `source_verified` |
| `source-verified-sprint36.json` | 60 | `source_verified` |
| `source-verified-sprint37.json` | 100 | `source_verified` |
| **合計** | **285** | Question Engine formal pool |

`exam-practice.json`、`pending-review.json`、`week2.staging.json` 不屬於 Full Mock 的正式來源。

## 二、核心欄位 Audit

以 runtime-compatible schema 檢查：

- `id`、`type`、`question`、`answer`、`explanation` 必須為非空值。
- `category` 接受既有 `category` 或 legacy `chapter`。
- `source` 接受既有 `source`、`sourceLabel`、`reference` 或 `sourceFile`，並將 alias 視為來源 lineage。

結果：**285 / 285 題核心欄位完整**。

| 檢查項目 | 缺少題數 |
|---|---:|
| `id` | 0 |
| `type` | 0 |
| `question` | 0 |
| `answer` | 0 |
| `explanation` | 0 |
| `category`／`chapter` | 0 |
| `source` lineage | 0 |
| 正式池內重複 ID | 0 |

補充：`week1.json` 的 20 題沒有現代 `category`、`sourceType`、`reviewStatus` raw key，但有 `chapter` 與 `reference`；Question Engine 已明確映射為 `category`、`sourceLabel`、`past_exam`、`verified`。這是 legacy schema 差異，不是目前 runtime 讀取錯誤。

來源追溯 metadata 則有分級差異：100 / 285 題具備完整 source evidence、版本與頁碼欄位，185 題仍被 runtime 標示為 partial／missing metadata；這不等同於缺少來源文字，需在後續 AI／人工來源確認時處理。

## 三、正式題庫品質分析

### 1. 題型比例

| 題型 | 題數 | 比例 |
|---|---:|---:|
| `shortAnswer` | 150 | 52.6% |
| `short_answer` | 5 | 1.8% |
| `essay` | 42 | 14.7% |
| `case_study` | 22 | 7.7% |
| `multipleChoice` | 43 | 15.1% |
| `multiSelect` | 10 | 3.5% |
| `single` | 11 | 3.9% |
| `multiple` | 2 | 0.7% |
| **合計** | **285** | **100%** |

正式池共有 219 題非選擇題、66 題選擇題。`single`／`multiple` 是 Week 1 legacy type；現代題庫主要使用 `multipleChoice`／`multiSelect`。

### 2. 主題比例

| 主題 | 題數 | 比例 |
|---|---:|---:|
| 植物油／基底油 | 54 | 18.9% |
| 解剖生理 | 49 | 17.2% |
| 精油化學 | 31 | 10.9% |
| 安全禁忌 | 28 | 9.8% |
| 配方濃度與稀釋 | 19 | 6.7% |
| 精油基礎 | 14 | 4.9% |
| 職業倫理 | 12 | 4.2% |
| 孕婦安全 | 9 | 3.2% |
| 兒童安全 | 8 | 2.8% |
| 諮詢流程 | 8 | 2.8% |
| 用藥詢問 | 8 | 2.8% |
| 疾病與轉介 | 8 | 2.8% |
| 考古題 | 6 | 2.1% |
| 精油個論 | 6 | 2.1% |
| 按摩與實務 | 5 | 1.8% |
| 心血管 | 4 | 1.4% |
| 神經 | 4 | 1.4% |
| 內分泌 | 4 | 1.4% |
| 生理學 | 3 | 1.1% |
| 泌尿 | 2 | 0.7% |
| 人體解剖 | 2 | 0.7% |
| 淋巴 | 1 | 0.4% |

主題分布不是考試藍圖配額；目前只是正式題庫現況，後續若要調整比例必須先取得正式 syllabus 或人工審核決定。

### 3. 解析、來源、重複與難度

- 缺少 `explanation`：0 題。
- 缺少 source lineage：0 題；但 185 題的完整頁碼／版本／evidence metadata 仍待補。
- 正式題庫內正規化題幹重複：0 組、0 題。
- 跨正式／practice／candidate 的重複題，已在 Sprint 44 inventory 記錄，不在本 Sprint 刪除。

難度分布：

| difficulty | 題數 | 比例 |
|---:|---:|---:|
| 1 | 4 | 1.4% |
| 2 | 204 | 71.6% |
| 3 | 69 | 24.2% |
| 4 | 6 | 2.1% |
| 5 | 2 | 0.7% |

目前正式池高度集中於 difficulty 2；這是內容品質與考試藍圖風險，不能透過程式自動改難度。

## 四、Full Mock 驗證

### 題庫來源與題數

Full Mock 啟動流程：

1. 讀取 `getFormalQuestionPool()`。
2. 再以 `practiceOnly !== true`、`formalScoreEligible !== false`、`answerConfidence !== 'C'`、`questionConfidence !== 'C'` 過濾。
3. 交給 `selectMockQuestionIds`，candidate 必須標記 `formal: true`。

因此 Full Mock 不會直接讀取 `exam-practice.json`、`pending-review.json` 或 `week2.staging.json`。

正式池 285 題中，source-verified 題 71001 因題幹疑似截斷，被 runtime governance 降為 `practiceOnly`／C 級；Full Mock 正確排除該題，實際可抽 **284 題**。設定時間為 `exam-config.json` 的 **90 分鐘**。

### 題型比例

Full Mock 的 284 題實際可用分布為：

- `shortAnswer` 149、`short_answer` 5
- `essay` 42、`case_study` 22
- `multipleChoice` 43、`multiSelect` 10
- `single` 11、`multiple` 2

目前 Full Mock 沒有額外固定題型配額，而是使用所有通過 confidence gate 的正式題；這符合「正式題優先、C 級不進正式計分」的既有策略。

### Result、錯題與紀錄

- Result 顯示作答狀態、正解、解析、來源 evidence 與正式／練習狀態。
- 選擇題答錯會寫入 `ifa-wrong-answers-v1`，並建立 study session 的 `wrongQuestionIds`。
- 完成題目會寫入 `ifa-answered-question-history-v1`；網路不可用時保留 sync queue。
- `shortAnswer`／`essay`／`case_study` 屬 self-check learning flow，不會被誤算為正式 objective wrong；Result 以 pending self-review 顯示。

## 五、Daily Task 驗證

- Daily 題池：1,259 題 = formal 285 + practice eligible 974。
- 基本任務：30 題。
- 加做上限：90 題。
- 可以抽到正式題，candidate 以 `formal: true` 標記。
- 已完成題會由 local study sessions、answered history 與 scheduler state 排除。
- 近 3 日 Daily／Weekly／Mock 題目會進入 recent exclusion，未完成題則可作為 carryover 優先安排。
- 開始時記錄 `recordQuestionsShown`；交卷時保存 answered history、study session、錯題與 Daily completion state。

現有驗證結果：

- Sprint 41 scheduler verification：通過，Daily 1,259 題、20 題 C 級 2 題上限、40 題 C 級 4 題上限。
- Existing Playwright suite：6 / 6 通過，包含 Full Mock resume、Daily 題數與 Sprint 43 的 Daily 交卷／Result／Coach 流程。

## 六、結論與剩餘風險

本次沒有發現需要修改的 runtime bug、題庫讀取錯誤或明確流程錯誤，因此未修改 source code 或 JSON 題庫。

仍需後續處理：

1. 題庫正式來源 metadata 有 185 題尚未達完整 evidence／版本／頁碼追溯。
2. 題目 71001 保留在 source-verified／Daily 可用邊界，但已被 Full Mock 排除；其題幹疑似截斷，應由未來 AI／人工 review 決定是否修正或停用。
3. Full Mock 實際為 284 題而非 raw formal pool 的 285 題，原因是 C 級 gate，不是抽題混入 practice 題。
4. difficulty 2 佔 71.6%，正式考試難度藍圖仍需人工確認。

Sprint 45 不修改答案、不改題目內容、不改 UI 架構、不改 Apps Script。
