# Sprint 47 Formal Question Mapping Report

> 產生工具：`scripts/build-sprint47-syllabus-mapping.mjs`
> formal pool：285 題
> 原始 question JSON 未修改；mapping 以獨立 sidecar 保存。

## Mapping 完成率

| 指標 | 數量 | 比例 | 說明 |
|---|---:|---:|---|
| syllabus category sidecar mapping | 285 / 285 | 100.0% | category-derived 或既有 knowledgeId 輔助，全部為 estimated |
| 直接保留既有 knowledgeId | 41 / 285 | 14.4% | 不覆蓋、不重新編號 |
| 缺少 knowledgeId | 244 / 285 | 85.6% | 需未來 source-to-knowledge 人工 mapping |
| 對應 week1 knowledge catalog | 20 / 285 | 7.0% | 其餘 direct ID 為 Week 2 batch/external ID 或尚未 catalogued |

## Formal input files

| Input file | Formal 題數 |
|---|---:|
| week1.json | 20 |
| week2.json | 21 |
| source-verified.json | 84 |
| source-verified-sprint36.json | 60 |
| source-verified-sprint37.json | 100 |

## Syllabus category mapping

| Syllabus category | 題數 | 比例 | 估算校準帶 | 判定 |
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

## Raw category mapping

| Raw category | 題數 | 比例 | Mapped syllabus category |
|---|---:|---:|---|
| 植物油／基底油 | 54 | 18.9% | Carrier Oil |
| 解剖生理 | 49 | 17.2% | Anatomy & Physiology |
| 精油化學 | 31 | 10.9% | Essential Oil Chemistry |
| 安全禁忌 | 28 | 9.8% | Safety / Contraindications |
| 配方濃度與稀釋 | 19 | 6.7% | Blending Theory |
| 精油基礎 | 14 | 4.9% | Essential Oil Foundations |
| 職業倫理 | 12 | 4.2% | Ethics |
| 孕婦安全 | 9 | 3.2% | Safety / Contraindications |
| 兒童安全 | 8 | 2.8% | Safety / Contraindications |
| 諮詢流程 | 8 | 2.8% | Consultation Practice |
| 用藥詢問 | 8 | 2.8% | Safety / Contraindications |
| 疾病與轉介 | 8 | 2.8% | Safety / Contraindications |
| 考古題 | 6 | 2.1% | Cross-topic / Exam Practice |
| 精油個論 | 6 | 2.1% | Essential Oil Materia Medica |
| 按摩與實務 | 5 | 1.8% | Professional Practice |
| 心血管 | 4 | 1.4% | Anatomy & Physiology |
| 神經 | 4 | 1.4% | Anatomy & Physiology |
| 內分泌 | 4 | 1.4% | Anatomy & Physiology |
| 生理學 | 3 | 1.1% | Anatomy & Physiology |
| 泌尿 | 2 | 0.7% | Anatomy & Physiology |
| 人體解剖 | 2 | 0.7% | Anatomy & Physiology |
| 淋巴 | 1 | 0.4% | Anatomy & Physiology |

## Mapping confidence

| Confidence | 題數 | 比例 |
|---|---:|---:|
| high | 279 | 97.9% |
| medium | 6 | 2.1% |

Medium-confidence question IDs：1001、1002、1004、1005、1006、1007。

## Sidecar 使用規則

- 讀取：`formalQuestionSyllabusMap.json`。
- `knowledgeId` 只保留原始題目已有的值；缺少者填 `null`，不推測新 ID。
- 新增的 metadata 放在 `review.syllabusCategory`、`review.syllabusCategoryCode` 與 review status 欄位。
- 任何 category-derived mapping 都必須在取得官方 blueprint 或人工核對後才可升級為正式 mapping。
- 不會自動修改題目文字、答案、解析、source metadata 或 runtime pool。

## 待補 direct knowledge mapping

目前缺少 direct `knowledgeId` 的題目共 244 題。完整 question ID 清單已保存在 sidecar；此報告不複製題幹內容，避免產生第二份題庫。
