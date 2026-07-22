# Sprint 47 IFA Exam Blueprint Calibration

> 範圍：formal pool 285 題。
> 重要限制：repo 目前沒有 IFA 官方考試章節配額；下表的「建議校準帶」是 estimated calibration hypothesis，不是官方規格，也不會改變 Full Mock 題數或抽題流程。

## Current mapped distribution

| 分類 | 題數 | 比例 | 建議校準帶 | 差異判定 |
|---|---:|---:|---:|---|
| Anatomy & Physiology | 69 | 24.2% | 15–25% | 估算帶內 |
| Essential Oil Chemistry | 31 | 10.9% | 10–15% | 估算帶內 |
| Carrier Oil | 54 | 18.9% | 8–15% | 高於估算帶 |
| Safety / Contraindications | 61 | 21.4% | 15–25% | 估算帶內 |
| Blending Theory | 19 | 6.7% | 8–15% | 低於估算帶 |
| Essential Oil Foundations | 14 | 4.9% | 5–10% | 低於估算帶 |
| Essential Oil Materia Medica | 6 | 2.1% | 5–10% | 低於估算帶 |
| Consultation Practice | 8 | 2.8% | 5–10% | 低於估算帶 |
| Professional Practice | 5 | 1.8% | 5–10% | 低於估算帶 |
| Ethics | 12 | 4.2% | 5–10% | 低於估算帶 |
| Cross-topic / Exam Practice | 6 | 2.1% | 0–5% | 需逐題複核 |

## 校準解讀

- Anatomy & Physiology：69 題（24.2%），目前落在估算帶內，但內部仍可能由解剖生理大類集中承擔。
- Carrier Oil：54 題（18.9%），高於估算帶，應先確認官方考綱是否真的給予相同比重。
- Safety / Contraindications：61 題（21.4%），接近上界，安全題不能因比例校準而直接刪除。
- Blending Theory、Essential Oil Materia Medica、Consultation Practice、Professional Practice、Ethics 目前低於估算帶，應列入補 mapping／coverage review，而不是直接新增題目。
- Cross-topic / Exam Practice 的 6 題不能直接當成單一考綱章節，需逐題重分類。

## 建議正式考試比例差異

目前只能提出順序，不能提出官方配額：

1. 先取得 IFA 官方 exam blueprint 或由教學者確認章節 weights。
2. 以 sidecar 的 `review.syllabusCategory` 聚合 actual／expected／gap。
3. 對 over-concentrated 類別先做 duplicate、difficulty、source evidence review；不得因數量高就刪題或改答案。
4. 對低量類別先做 knowledge mapping，確認是否被 Anatomy & Physiology、Safety 等大類吸收。
5. 官方比例確認前，Full Mock 維持既有 formal pool 邊界，不把 estimated band 接入 runtime。

## 目前不能下結論的地方

- 244 題缺少 direct `knowledgeId`，因此不能把 category count 當成 syllabus item coverage。
- 6 題考古題只有 cross-topic provisional mapping。
- 建議校準帶沒有官方來源，僅供 review queue 排序。
