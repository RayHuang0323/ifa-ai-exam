# Sprint 46 Formal Question Review

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：Question Engine formal pool，共 285 題。
> 本文件只產出 review 結果與風險，不覆蓋原題目答案、解析或來源。

## 一、Review 邊界

Formal pool 由 `week1.json`、`week2.json`、`verified-extra.json` 與三批 `source-verified*.json` 組成。`exam-practice.json`、`pending-review.json`、`week2.staging.json` 不在本次 formal review 的可 promotion 範圍。

目前 runtime quality gate：

- answer confidence：A+ 26、A 214、B 44、C 1。
- question confidence：A 88、B 196、C 1。
- source review：`KEEP` 62、`REVISE` 181、`DOWNGRADE` 1；Week 1 legacy 41 題沒有 sourceReview metadata。
- metadata completeness：complete 0、partial 244、missing 41。source evidence 大多存在，但版本／頁碼欄位仍不完整。

這些欄位是 runtime review signal，不會改變 raw `answer` 或 `explanation`。

## 二、Difficulty 分布

| difficulty | 題數 | 比例 |
|---:|---:|---:|
| 1 | 4 | 1.4% |
| 2 | 204 | 71.6% |
| 3 | 69 | 24.2% |
| 4 | 6 | 2.1% |
| 5 | 2 | 0.7% |

主要 review 結論：difficulty 2 高度集中。這只能形成 calibration queue，不能由 AI 直接改寫 difficulty。

## 三、Topic 分布

| Topic | 題數 | 比例 |
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

相對集中區為植物油／基底油、解剖生理、精油化學；安全禁忌接近 10% 警戒線。這是現況分布，不代表正式考試 blueprint 配額。

## 四、Question type 分布

| type | 題數 | 比例 |
|---|---:|---:|
| `shortAnswer` | 150 | 52.6% |
| `short_answer` | 5 | 1.8% |
| `essay` | 42 | 14.7% |
| `case_study` | 22 | 7.7% |
| `multipleChoice` | 43 | 15.1% |
| `multiSelect` | 10 | 3.5% |
| `single` | 11 | 3.9% |
| `multiple` | 2 | 0.7% |

正式 pool 共 219 題非選擇題、66 題選擇題。`single`／`multiple` 為 Week 1 legacy type，未在本 Sprint 強制轉換。

## 五、Source completeness

核心 source lineage 285 / 285 可由 `sourceLabel`、`reference` 或 `sourceFile` 取得，沒有正式題目完全沒有來源欄位。

但完整 evidence metadata 仍有差距：

- 244 題 source-verified 有 source evidence ID 與 evidence excerpt，但部分 source version／page 仍待補。
- 41 題 Week 1／Week 2 人工 verified 或 legacy 題沒有同等完整的 evidence metadata。
- AI review 必須把「有來源標籤」與「可重現的來源證據」分開判定。

## 六、Explanation quality

靜態檢查結果：

- `explanation` 非空：285 / 285。
- 與 answer 完全相同：0 題。
- explanation 包含完整 answer 文字：115 題；這可能是合理的概念解釋，不直接視為錯誤。
- explanation 長度中位數：52 字元。
- explanation 長度低於 20 字元：21 題，列入人工抽查 queue。
- explanation 長度範圍：18–185 字元。

目前題目語言／顯示品質 audit 另外標記：

- language audit needs improvement：257 題。
- naturalness audit needs improvement：182 題。
- 原始題幹過短：14 題。
- 含教材／AI 提示語：182 題。

這些是 review signal，不是本 Sprint 的答案或題幹修改授權。後續 AI 只能提出建議，必須由人工決定是否修正。

## 七、Review 建議

優先順序：

1. C 級 71001：維持 Full Mock 隔離，人工決定停用或修正。
2. explanation < 20 字元的 21 題：確認是否真的能支持答案。
3. `REVISE` 的 181 題：先核對 evidence 與題幹自然度。
4. difficulty 2 題群：依正式 syllabus 重新校準，不由 AI 自動覆寫。

本文件不會自動加入正式題、修改原答案，亦不接入 UI／考試流程。
