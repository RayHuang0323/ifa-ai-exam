# Sprint 46 Boundary Review List

> 目的：集中管理正式題庫邊界與待審核候選。
> 規則：所有項目維持原檔位置；本清單不會自動加入 formal pool，也不覆蓋原答案。

## 一、P0：71001

| 欄位 | 值 |
|---|---|
| ID | `71001` |
| 檔案 | `source-verified-sprint36.json` |
| type | `shortAnswer` |
| current runtime state | `practiceOnly: true`、`formalScoreEligible: false`、answer confidence `C` |
| issue | 題幹疑似保留教材操作指示／截斷文字，不適合作為正式考題 |
| Full Mock | 已排除，Full Mock 實際 284 題 |
| Daily | 仍在 Daily pool 邊界，可能被低 confidence 配額抽到 |
| review decision | `needs_human_review`；不得自動 promotion |

人工 gate：確認原始教材段落、判斷是否能重建成有明確考點的題目；若不能，維持停用或 practice-only。

## 二、P1：pending-review

| 檔案 | 題數 | blocking issue | runtime |
|---|---:|---|---|
| `pending-review.json` | 60 | 全部缺 explanation；27 題缺 answer；31 題短答缺 referenceAnswer；16 題 essay 缺 rubric；另 6 題 case／formula candidate 缺 rubric | 完全排除 |

缺 answer 的 ID：

```text
ifa-source-0008, 0010–0020, 0023, 0027, 0029,
ifa-source-0033, 0037, 0039, 0041, 0044–0045,
ifa-source-0048–0053
```

這裡的短 ID 皆代表完整前綴 `ifa-source-`。所有 60 題仍需先完成答案、解析、來源與 type canonicalization，才可進下一輪 AI／人工 review。

## 三、P1：week2.staging

| 檔案 | 題數 | blocking issue | runtime |
|---|---:|---|---|
| `week2.staging.json` | 33 | 全部缺 explanation；21 題短答缺 referenceAnswer；7 題 essay 缺 rubric；另 3 題 case／formula candidate 缺 rubric | 完全排除 |

staging ID：

```text
ifa-source-0001–0007, 0009, 0021–0022, 0024–0026,
ifa-source-0028, 0030–0032, 0034–0036, 0038, 0040,
ifa-source-0042–0043, 0046–0047, 0054–0060
```

candidate type 包含 `short-answer`、`case-study`、`single-choice`、`formula-design`；必須先決定 canonical type 與評分語義，不能只靠 AI 猜測轉換。

## 四、Promotion gate

任何 pending／staging 題目要離開此清單，至少需要：

1. 核心欄位完整：id、type、question、answer、explanation、category、source。
2. 短答具備 referenceAnswer；申論／案例具備 rubric。
3. source file／chapter／page／version／evidence 可追溯。
4. 通過答案驗證、duplicate review、difficulty review。
5. 高風險安全內容完成人工 review。
6. 人工 reviewer 明確決定 `approved`、`downgrade_to_practice` 或 `rejected`。

本 Sprint 只建立清單與 gate，不修改題庫內容、不自動 promotion。
