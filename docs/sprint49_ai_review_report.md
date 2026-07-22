# Sprint 49 Formal Question AI Review Report

> 日期：2026-07-23（Asia/Taipei）
> 範圍：formal pool 285 題。
> Review mode：deterministic preflight；本次沒有呼叫外部 AI provider，也沒有修改任何題目內容。

## 一、Pipeline 邊界

- Audit 只讀取 formal input JSON 與 Sprint 47 syllabus sidecar。
- Review metadata 以獨立 queue 保存，不回寫 question、answer、explanation、source 或 runtime eligibility。
- aiNotes 目前維持空陣列，等待未來 AI／人工審核填入。
- pending、staging、exam-practice 不在本次 formal audit 範圍。

## 二、Schema

Schema 檔案：src/data/questions/questionReviewSchema.ts

欄位：reviewStatus、answerConfidence、sourceConfidence、explanationQuality、difficultyReview、duplicateRisk、aiNotes。

## 三、Formal pool audit summary

| Check | Result |
|---|---:|
| Formal question count | 285 |
| Missing answer | 0 |
| Low answer confidence | 1 |
| Poor explanation | 21 |
| Missing source lineage | 0 |
| Incomplete source evidence | 41 |
| Missing source version | 285 |
| Missing source page | 285 |
| Duplicate-risk questions | 59 |

### Answer confidence

| Confidence | Count | Percentage |
|---|---:|---:|
| high | 239 | 83.9% |
| medium | 45 | 15.8% |
| low | 1 | 0.4% |

### Explanation quality

| Quality | Count | Percentage |
|---|---:|---:|
| good（40 字以上） | 230 | 80.7% |
| fair（20–39 字） | 34 | 11.9% |
| poor（缺失或少於 20 字） | 21 | 7.4% |

## 四、Difficulty distribution

| Difficulty | Count | Percentage |
|---:|---:|---:|
| 1 | 4 | 1.4% |
| 2 | 204 | 71.6% |
| 3 | 69 | 24.2% |
| 4 | 6 | 2.1% |
| 5 | 2 | 0.7% |

Difficulty 1 與 5 共 6 題，若沒有更高優先級訊號會進入 MEDIUM calibration queue；目前部分題目因 source／explanation 問題升為 HIGH。這是 outlier heuristic，不代表答案錯誤。

## 五、Duplicate similarity

使用 normalized question character-bigram Jaccard similarity：0.55 以上列入觀察，0.70 以上列為 medium，0.85 以上列為 high。這是候選偵測，不是自動判定重複。

| Pair risk | Pair count |
|---|---:|
| high | 2 |
| medium | 17 |
| low | 109 |

| Question A | Question B | Similarity | Risk |
|---:|---:|---:|---|
| 71048 | 71052 | 0.895 | high |
| 70036 | 70038 | 0.867 | high |
| 70106 | 70107 | 0.793 | medium |
| 71047 | 71051 | 0.778 | medium |
| 71019 | 71027 | 0.765 | medium |
| 71045 | 71047 | 0.757 | medium |
| 70033 | 70034 | 0.750 | medium |
| 70034 | 70040 | 0.750 | medium |
| 70034 | 70042 | 0.750 | medium |
| 70036 | 70039 | 0.750 | medium |
| 70037 | 70038 | 0.733 | medium |
| 70037 | 70039 | 0.733 | medium |
| 70038 | 70039 | 0.733 | medium |
| 70020 | 70021 | 0.727 | medium |
| 70020 | 70029 | 0.727 | medium |
| 71045 | 71051 | 0.718 | medium |
| 71047 | 71048 | 0.718 | medium |
| 71047 | 71052 | 0.718 | medium |
| 70038 | 70040 | 0.714 | medium |
| 70033 | 70042 | 0.692 | low |
| 71048 | 71051 | 0.683 | low |
| 71051 | 71052 | 0.683 | low |
| 71043 | 71051 | 0.674 | low |
| 70013 | 70014 | 0.667 | low |
| 70020 | 70026 | 0.667 | low |
| 70021 | 70029 | 0.667 | low |
| 70023 | 70032 | 0.667 | low |
| 70027 | 70028 | 0.667 | low |
| 70099 | 70101 | 0.667 | low |
| 71043 | 71047 | 0.667 | low |

## 六、Category balance

相對 audit band：大於 15% 標為 overrepresented，小於 3% 標為 underrepresented。這不是官方 blueprint 判定。

| Category | Count | Percentage | Balance signal |
|---|---:|---:|---|
| Anatomy & Physiology | 69 | 24.2% | overrepresented |
| Safety / Contraindications | 61 | 21.4% | overrepresented |
| Carrier Oil | 54 | 18.9% | overrepresented |
| Essential Oil Chemistry | 31 | 10.9% | within_audit_band |
| Blending Theory | 19 | 6.7% | within_audit_band |
| Essential Oil Foundations | 14 | 4.9% | within_audit_band |
| Ethics | 12 | 4.2% | within_audit_band |
| Consultation Practice | 8 | 2.8% | underrepresented |
| Cross-topic / Exam Practice | 6 | 2.1% | underrepresented |
| Essential Oil Materia Medica | 6 | 2.1% | underrepresented |
| Professional Practice | 5 | 1.8% | underrepresented |

## 七、Priority queue

| Priority | Count | 規則 |
|---|---:|---|
| HIGH | 42 | answer confidence low、source lineage/evidence 不完整或 explanation poor |
| MEDIUM | 20 | difficulty outlier 或 duplicate risk medium/high |
| LOW | 223 | 未偵測到上述問題 |

### HIGH question IDs

1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16、17、18、19、20、1001、1002、1004、1005、1006、1007、1021、1022、1024、1025、1026、1028、1042、1043、1046、1047、1054、1056、1057、1058、1060、71001

### MEDIUM question IDs

70020、70021、70029、70033、70034、70036、70037、70038、70039、70040、70042、70106、70107、71019、71027、71045、71047、71048、71051、71052

Queue JSON：docs/sprint49_ai_review_queue.json

## 八、後續審核規則

1. HIGH 先核對 answer、source evidence 與 explanation，不由 pipeline 自動修正。
2. MEDIUM 先做 difficulty／duplicate 人工判定，再決定是否送 AI review。
3. LOW 仍保留 pending 狀態，不能直接視為 approved。
4. AI 回填只允許寫入 review sidecar；原始題目內容必須由人工另行決定是否修改。
