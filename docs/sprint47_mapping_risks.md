# Sprint 47 Syllabus Mapping Risk List

> 本清單只記錄風險，不自動修改題庫或正式考試流程。

## P0：考綱映射不完整

- 244 題（85.6%）沒有 direct `knowledgeId`。
- Category-derived mapping 已達 285/285，但全部標示 estimated，不能視為官方 knowledge mapping。
- 6 題 mapping confidence 不是 high，question IDs：1001、1002、1004、1005、1006、1007。

## P1：分類集中與缺口

- Carrier Oil 18.9% 高於本次估算帶。
- Blending Theory、Essential Oil Materia Medica、Consultation Practice、Professional Practice、Ethics 低於本次估算帶。
- Cross-topic / Exam Practice 尚有 6 題，必須逐題拆解到實際考綱分類。
- 目前沒有官方 blueprint，所有 over／under 判定都只能作為 review priority。

## P1：Source 不足

- source lineage 缺失：0 題。
- source evidence（evidence ID、excerpt、answer basis）不完整：41 題。
- source version 缺失或待補：285 題。
- source page 缺失或待補：285 題。

## P1：Explanation 品質

- explanation 缺失：0 題。
- explanation 少於 20 字元：21 題，需人工確認是否足以支持答案。
- explanation 與 answer 完全相同：0 題。

## 處理界線

- 不修改題目文字、答案、解析或原始 source。
- 不把 sidecar mapping 接入 Question Engine。
- 不依 estimated ratio 自動刪題、降權、補題或加入正式池。
- 後續 AI 審核只能提出 mapping candidate、confidence 與 reason，最終狀態需人工核准。
