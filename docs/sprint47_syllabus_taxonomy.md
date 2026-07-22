# Sprint 47 Syllabus Taxonomy

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：runtime formal pool 285 題。
> 狀態：estimated；本 repo 未提供 IFA 官方考試 topic weights，因此以下 taxonomy 是校準用工作分類，不宣稱為官方考綱。

## 分類原則

- 保留原題庫的 `category`／`chapter`，不修改原始題目資料。
- 以 sidecar 的 `review.syllabusCategory` 提供考綱級分類。
- 已有 `knowledgeId` 的題目保留原 ID；沒有 ID 的題目只做 category-derived estimated mapping。
- `考古題` 無法單靠原 category 判定單一章節，先放入 Cross-topic / Exam Practice，列為逐題複核。
- 本分類不會被 Question Engine、Learner、Coach 或 Full Mock 載入。

## Estimated taxonomy

| Code | Syllabus category | 原始 category aliases | 建議校準帶 | 定義 |
|---|---|---|---:|---|
| ANATOMY_PHYSIOLOGY | Anatomy & Physiology | 解剖生理、心血管、神經、內分泌、生理學、泌尿、人體解剖、淋巴 | 15–25% | 人體解剖、生理系統、循環、神經、內分泌、淋巴與泌尿等基礎知識。 |
| ESSENTIAL_OIL_CHEMISTRY | Essential Oil Chemistry | 精油化學 | 10–15% | 精油化學家族、主要成分、化學型與成分相關的安全判讀。 |
| CARRIER_OIL | Carrier Oil | 植物油／基底油 | 8–15% | 植物油／基底油的脂肪酸、性質、保存、質地與選用。 |
| SAFETY_CONTRAINDICATIONS | Safety / Contraindications | 安全禁忌、孕婦安全、兒童安全、用藥詢問、疾病與轉介 | 15–25% | 安全禁忌、孕婦與兒童、用藥、疾病辨識、停止操作與轉介界線。 |
| BLENDING_THEORY | Blending Theory | 配方濃度與稀釋 | 8–15% | 配方設計、濃度、稀釋計算與配伍邏輯。 |
| ESSENTIAL_OIL_FOUNDATIONS | Essential Oil Foundations | 精油基礎 | 5–10% | 精油基本概念、萃取、使用方式與基礎辨識。 |
| ESSENTIAL_OIL_MATERIA_MEDICA | Essential Oil Materia Medica | 精油個論 | 5–10% | 單支精油個論、拉丁名、部位、化學與個案使用重點。 |
| CONSULTATION_PRACTICE | Consultation Practice | 諮詢流程 | 5–10% | 初談、需求與安全資料收集、紀錄、追蹤及個案評估。 |
| PROFESSIONAL_PRACTICE | Professional Practice | 按摩與實務 | 5–10% | 按摩與實務操作、服務界線、實作判斷與專業工作流程。 |
| ETHICS | Ethics | 職業倫理 | 5–10% | 知情同意、保密、紀錄保存、專業責任與醫療宣稱界線。 |
| CROSS_TOPIC_EXAM_PRACTICE | Cross-topic / Exam Practice | 考古題 | 0–5% | 目前只有考古題標籤，尚不足以代表單一考綱分類，必須逐題複核。 |

## Mapping 產物

- Sidecar：`src/data/questions/formalQuestionSyllabusMap.json`
- 建置工具：`scripts/build-sprint47-syllabus-mapping.mjs`
- 產物只保存 question ID 與 review metadata，不複製 question、answer、explanation。
- 目前 285/285 題都有 syllabus category；6 題需要逐題 mapping review。
