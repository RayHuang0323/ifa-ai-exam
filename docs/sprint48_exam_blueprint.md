# Sprint 48 IFA Exam Blueprint Weighted Mock Calibration

> 日期：2026-07-23（Asia/Taipei）
> 狀態：estimated blueprint；repo 目前沒有 IFA 官方章節比例或正式考試題數規格。
> 本文件只校準 Full Mock，不修改題目、答案、解析、UI、Apps Script 或 Daily Task。

## 一、正式題庫目前比例

正式題庫共 285 題；71001 因 confidence C／practice-only runtime gate 不進 Full Mock，因此 eligible formal 題為 284 題。

| Category | Formal 題數 | Formal 比例 |
|---|---:|---:|
| Anatomy & Physiology | 69 | 24.2% |
| Safety / Contraindications | 61 | 21.4% |
| Carrier Oil | 54 | 18.9% |
| Essential Oil Chemistry | 31 | 10.9% |
| Blending Theory | 19 | 6.7% |
| Essential Oil Foundations | 14 | 4.9% |
| Ethics | 12 | 4.2% |
| Consultation Practice | 8 | 2.8% |
| Essential Oil Materia Medica | 6 | 2.1% |
| Cross-topic / Exam Practice | 6 | 2.1% |
| Professional Practice | 5 | 1.8% |

## 二、Weighted mock config

設定檔：`src/data/examBlueprint.ts`

- 固定校準題數：60 題。
- 權重總和：100%。
- 題目只從 eligible formal pool 抽取。
- 題型、答案可信度、scheduler score 與出現紀錄仍由既有流程處理。
- 權重是 estimated calibration hypothesis，不是官方 IFA blueprint。

| Category | Weight | Mock target |
|---|---:|---:|
| Anatomy & Physiology | 20% | 12 |
| Essential Oil Chemistry | 12% | 7 |
| Carrier Oil | 10% | 6 |
| Safety / Contraindications | 20% | 12 |
| Blending Theory | 10% | 6 |
| Essential Oil Foundations | 8% | 5 |
| Essential Oil Materia Medica | 6% | 4 |
| Consultation Practice | 5% | 3 |
| Professional Practice | 4% | 2 |
| Ethics | 3% | 2 |
| Cross-topic / Exam Practice | 2% | 1 |
| **Total** | **100%** | **60** |

題數採 largest-remainder allocation，避免四捨五入後總題數偏離 60 題。

## 三、抽題邊界

- `formal === true`、`practiceOnly !== true`、`formalScoreEligible !== false`。
- 排除 answer／question confidence C 題；目前 71001 不會進入 Full Mock。
- 同一回不重複題目。
- practice 題、staging 題、pending-review 題不會進入 Full Mock。
- `recordQuestionsShown`、答題紀錄、完成紀錄、錯題保存沿用原流程。
- Daily Task 仍使用原 `selectDailyQuestionIds`，不讀取 weighted mock config。

## 四、校準限制

- 60 題是本 Sprint 的固定校準題數，不宣稱為官方 IFA 考試題數。
- 若未來取得官方 blueprint，只需調整 config weight／questionCount，再重新執行驗證；不需修改題庫內容。
- 若某分類可用題不足，selector 會以正式池剩餘容量補位，並在測試／報告中暴露偏差，不會重複或混入練習題。
