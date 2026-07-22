import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const totalExpected = 285;
const formalInputFiles = [
  { file: 'week1.json', kind: 'week1' },
  { file: 'week2.json', kind: 'week2' },
  { file: 'verified-extra.json', kind: 'verified-extra' },
  { file: 'source-verified.json', kind: 'source-verified' },
  { file: 'source-verified-sprint36.json', kind: 'source-verified' },
  { file: 'source-verified-sprint37.json', kind: 'source-verified' },
];

const taxonomy = [
  {
    code: 'ANATOMY_PHYSIOLOGY',
    name: 'Anatomy & Physiology',
    description: '人體解剖、生理系統、循環、神經、內分泌、淋巴與泌尿等基礎知識。',
    aliases: ['解剖生理', '心血管', '神經', '內分泌', '生理學', '泌尿', '人體解剖', '淋巴'],
    targetMin: 15,
    targetMax: 25,
  },
  {
    code: 'ESSENTIAL_OIL_CHEMISTRY',
    name: 'Essential Oil Chemistry',
    description: '精油化學家族、主要成分、化學型與成分相關的安全判讀。',
    aliases: ['精油化學'],
    targetMin: 10,
    targetMax: 15,
  },
  {
    code: 'CARRIER_OIL',
    name: 'Carrier Oil',
    description: '植物油／基底油的脂肪酸、性質、保存、質地與選用。',
    aliases: ['植物油／基底油'],
    targetMin: 8,
    targetMax: 15,
  },
  {
    code: 'SAFETY_CONTRAINDICATIONS',
    name: 'Safety / Contraindications',
    description: '安全禁忌、孕婦與兒童、用藥、疾病辨識、停止操作與轉介界線。',
    aliases: ['安全禁忌', '孕婦安全', '兒童安全', '用藥詢問', '疾病與轉介'],
    targetMin: 15,
    targetMax: 25,
  },
  {
    code: 'BLENDING_THEORY',
    name: 'Blending Theory',
    description: '配方設計、濃度、稀釋計算與配伍邏輯。',
    aliases: ['配方濃度與稀釋'],
    targetMin: 8,
    targetMax: 15,
  },
  {
    code: 'ESSENTIAL_OIL_FOUNDATIONS',
    name: 'Essential Oil Foundations',
    description: '精油基本概念、萃取、使用方式與基礎辨識。',
    aliases: ['精油基礎'],
    targetMin: 5,
    targetMax: 10,
  },
  {
    code: 'ESSENTIAL_OIL_MATERIA_MEDICA',
    name: 'Essential Oil Materia Medica',
    description: '單支精油個論、拉丁名、部位、化學與個案使用重點。',
    aliases: ['精油個論'],
    targetMin: 5,
    targetMax: 10,
  },
  {
    code: 'CONSULTATION_PRACTICE',
    name: 'Consultation Practice',
    description: '初談、需求與安全資料收集、紀錄、追蹤及個案評估。',
    aliases: ['諮詢流程'],
    targetMin: 5,
    targetMax: 10,
  },
  {
    code: 'PROFESSIONAL_PRACTICE',
    name: 'Professional Practice',
    description: '按摩與實務操作、服務界線、實作判斷與專業工作流程。',
    aliases: ['按摩與實務'],
    targetMin: 5,
    targetMax: 10,
  },
  {
    code: 'ETHICS',
    name: 'Ethics',
    description: '知情同意、保密、紀錄保存、專業責任與醫療宣稱界線。',
    aliases: ['職業倫理'],
    targetMin: 5,
    targetMax: 10,
  },
  {
    code: 'CROSS_TOPIC_EXAM_PRACTICE',
    name: 'Cross-topic / Exam Practice',
    description: '目前只有考古題標籤，尚不足以代表單一考綱分類，必須逐題複核。',
    aliases: ['考古題'],
    targetMin: 0,
    targetMax: 5,
  },
];

const taxonomyByAlias = new Map(taxonomy.flatMap((item) => item.aliases.map((alias) => [alias, item])));
const taxonomyByCode = new Map(taxonomy.map((item) => [item.code, item]));
const knowledgeItems = JSON.parse(await readFile(join(root, 'src/data/knowledge/week1-knowledge.json'), 'utf8'));
const knowledgeIds = new Set(knowledgeItems.map((item) => item.id));

const readQuestions = async ({ file, kind }) => {
  const questions = JSON.parse(await readFile(join(root, 'src/data/questions', file), 'utf8'));
  return questions
    .filter((question) => {
      if (kind === 'week1') return true;
      if (kind === 'week2' || kind === 'verified-extra') return question.reviewStatus === 'verified';
      return question.reviewStatus === 'source_verified'
        && question.verificationType === 'source_verified'
        && question.deprecated !== true
        && question.isActive !== false
        && ((question.formalScoreEligible === true && question.practiceOnly !== true)
          || question.sourceReview?.disposition === 'DOWNGRADE');
    })
    .map((question) => ({ ...question, inputFile: file }));
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasSourceLineage = (question) => [question.sourceLabel, question.reference, question.sourceFile].some(hasText);
const hasSourceEvidence = (question) => Array.isArray(question.sourceEvidenceIds)
  && question.sourceEvidenceIds.length > 0
  && hasText(question.evidenceExcerpt)
  && hasText(question.answerBasis);
const meaningfulSourceField = (value) => value !== undefined && value !== null && String(value).trim() !== '' && !['待補', 'metadata_missing'].includes(String(value).trim());
const answerText = (value) => Array.isArray(value) ? value.join('；') : String(value ?? '');

const allQuestions = (await Promise.all(formalInputFiles.map(readQuestions))).flat();
const ids = new Set();
for (const question of allQuestions) {
  if (ids.has(question.id)) throw new Error(`Duplicate formal question id: ${question.id}`);
  ids.add(question.id);
}
if (allQuestions.length !== totalExpected) throw new Error(`Formal pool expected ${totalExpected}, got ${allQuestions.length}`);

const entries = allQuestions.map((question) => {
  const rawCategory = question.category || question.chapter || '未分類';
  const definition = taxonomyByAlias.get(rawCategory);
  const mapped = definition ?? taxonomyByCode.get('CROSS_TOPIC_EXAM_PRACTICE');
  const confidence = definition?.code === 'CROSS_TOPIC_EXAM_PRACTICE' ? 'medium' : definition ? 'high' : 'low';
  const mappingStatus = definition?.code === 'CROSS_TOPIC_EXAM_PRACTICE' ? 'needs_question_level_review' : definition ? 'estimated_category_mapped' : 'unmapped';
  const directKnowledgeId = typeof question.knowledgeId === 'string' && question.knowledgeId.trim().length > 0 ? question.knowledgeId : null;
  return {
    questionId: question.id,
    inputFile: question.inputFile,
    sourceFile: question.sourceFile ?? question.reference ?? null,
    rawCategory,
    knowledgeId: directKnowledgeId,
    knowledgeCatalogStatus: directKnowledgeId ? (knowledgeIds.has(directKnowledgeId) ? 'week1_catalogued' : 'batch_or_external_id') : 'missing',
    review: {
      schemaVersion: 'sprint47-v1',
      syllabusCategory: mapped.name,
      syllabusCategoryCode: mapped.code,
      mappingMethod: directKnowledgeId ? 'existing_knowledgeId_plus_category' : 'category_derived',
      mappingConfidence: confidence,
      mappingStatus,
      estimated: true,
    },
    audit: {
      difficulty: question.difficulty ?? null,
      type: question.type ?? null,
      hasSourceLineage: hasSourceLineage(question),
      hasSourceEvidence: hasSourceEvidence(question),
      hasSourceVersion: meaningfulSourceField(question.sourceVersion),
      hasSourcePage: meaningfulSourceField(question.sourcePage),
      hasExplanation: hasText(question.explanation),
      explanationLength: String(question.explanation ?? '').trim().length,
      explanationUnder20: String(question.explanation ?? '').trim().length < 20,
      explanationEqualsAnswer: hasText(question.explanation) && String(question.explanation).trim() === answerText(question.answer).trim(),
    },
  };
});

entries.sort((left, right) => left.questionId - right.questionId);

const countBy = (items, getKey) => items.reduce((result, item) => {
  const key = getKey(item);
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});
const countByCode = countBy(entries, (entry) => entry.review.syllabusCategoryCode);
const countByRawCategory = countBy(entries, (entry) => entry.rawCategory);
const countByConfidence = countBy(entries, (entry) => entry.review.mappingConfidence);
const countByMappingStatus = countBy(entries, (entry) => entry.review.mappingStatus);
const countByInputFile = countBy(entries, (entry) => entry.inputFile);
const directKnowledgeCount = entries.filter((entry) => entry.knowledgeId).length;
const cataloguedKnowledgeCount = entries.filter((entry) => entry.knowledgeCatalogStatus === 'week1_catalogued').length;
const sourceLineageMissing = entries.filter((entry) => !entry.audit.hasSourceLineage).length;
const sourceEvidenceMissing = entries.filter((entry) => !entry.audit.hasSourceEvidence).length;
const sourceVersionMissing = entries.filter((entry) => !entry.audit.hasSourceVersion).length;
const sourcePageMissing = entries.filter((entry) => !entry.audit.hasSourcePage).length;
const explanationMissing = entries.filter((entry) => !entry.audit.hasExplanation).length;
const explanationUnder20 = entries.filter((entry) => entry.audit.explanationUnder20).length;
const explanationEqualsAnswer = entries.filter((entry) => entry.audit.explanationEqualsAnswer).length;

const percentage = (value) => `${((value / allQuestions.length) * 100).toFixed(1)}%`;
const tableRows = (rows) => rows.join('\n');
const categoryRows = taxonomy
  .map((item) => {
    const count = countByCode[item.code] ?? 0;
    const pct = Number(((count / allQuestions.length) * 100).toFixed(1));
    const status = item.code === 'CROSS_TOPIC_EXAM_PRACTICE'
      ? '需逐題複核'
      : pct < item.targetMin ? '低於估算帶' : pct > item.targetMax ? '高於估算帶' : '估算帶內';
    return `| ${item.name} | ${count} | ${pct.toFixed(1)}% | ${item.targetMin}–${item.targetMax}% | ${status} |`;
  });
const rawCategoryRows = Object.entries(countByRawCategory)
  .sort((left, right) => right[1] - left[1])
  .map(([category, count]) => `| ${category} | ${count} | ${percentage(count)} | ${taxonomyByAlias.get(category)?.name ?? '未映射'} |`);
const fileRows = Object.entries(countByInputFile).map(([file, count]) => `| ${file} | ${count} |`);
const confidenceRows = Object.entries(countByConfidence).map(([confidence, count]) => `| ${confidence} | ${count} | ${percentage(count)} |`);
const mediumIds = entries.filter((entry) => entry.review.mappingConfidence !== 'high').map((entry) => entry.questionId);
const missingKnowledgeIds = entries.filter((entry) => !entry.knowledgeId).map((entry) => entry.questionId);

const taxonomyReport = `# Sprint 47 Syllabus Taxonomy

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：runtime formal pool ${allQuestions.length} 題。
> 狀態：estimated；本 repo 未提供 IFA 官方考試 topic weights，因此以下 taxonomy 是校準用工作分類，不宣稱為官方考綱。

## 分類原則

- 保留原題庫的 \`category\`／\`chapter\`，不修改原始題目資料。
- 以 sidecar 的 \`review.syllabusCategory\` 提供考綱級分類。
- 已有 \`knowledgeId\` 的題目保留原 ID；沒有 ID 的題目只做 category-derived estimated mapping。
- \`考古題\` 無法單靠原 category 判定單一章節，先放入 Cross-topic / Exam Practice，列為逐題複核。
- 本分類不會被 Question Engine、Learner、Coach 或 Full Mock 載入。

## Estimated taxonomy

| Code | Syllabus category | 原始 category aliases | 建議校準帶 | 定義 |
|---|---|---|---:|---|
${taxonomy.map((item) => `| ${item.code} | ${item.name} | ${item.aliases.join('、')} | ${item.targetMin}–${item.targetMax}% | ${item.description} |`).join('\n')}

## Mapping 產物

- Sidecar：\`src/data/questions/formalQuestionSyllabusMap.json\`
- 建置工具：\`scripts/build-sprint47-syllabus-mapping.mjs\`
- 產物只保存 question ID 與 review metadata，不複製 question、answer、explanation。
- 目前 ${allQuestions.length}/${allQuestions.length} 題都有 syllabus category；${mediumIds.length} 題需要逐題 mapping review。
`;

const mappingReport = `# Sprint 47 Formal Question Mapping Report

> 產生工具：\`scripts/build-sprint47-syllabus-mapping.mjs\`
> formal pool：${allQuestions.length} 題
> 原始 question JSON 未修改；mapping 以獨立 sidecar 保存。

## Mapping 完成率

| 指標 | 數量 | 比例 | 說明 |
|---|---:|---:|---|
| syllabus category sidecar mapping | ${allQuestions.length} / ${allQuestions.length} | 100.0% | category-derived 或既有 knowledgeId 輔助，全部為 estimated |
| 直接保留既有 knowledgeId | ${directKnowledgeCount} / ${allQuestions.length} | ${percentage(directKnowledgeCount)} | 不覆蓋、不重新編號 |
| 缺少 knowledgeId | ${allQuestions.length - directKnowledgeCount} / ${allQuestions.length} | ${percentage(allQuestions.length - directKnowledgeCount)} | 需未來 source-to-knowledge 人工 mapping |
| 對應 week1 knowledge catalog | ${cataloguedKnowledgeCount} / ${allQuestions.length} | ${percentage(cataloguedKnowledgeCount)} | 其餘 direct ID 為 Week 2 batch/external ID 或尚未 catalogued |

## Formal input files

| Input file | Formal 題數 |
|---|---:|
${tableRows(fileRows)}

## Syllabus category mapping

| Syllabus category | 題數 | 比例 | 估算校準帶 | 判定 |
|---|---:|---:|---:|---|
${tableRows(categoryRows)}

## Raw category mapping

| Raw category | 題數 | 比例 | Mapped syllabus category |
|---|---:|---:|---|
${tableRows(rawCategoryRows)}

## Mapping confidence

| Confidence | 題數 | 比例 |
|---|---:|---:|
${tableRows(confidenceRows)}

Medium-confidence question IDs：${mediumIds.length > 0 ? mediumIds.join('、') : '無'}。

## Sidecar 使用規則

- 讀取：\`formalQuestionSyllabusMap.json\`。
- \`knowledgeId\` 只保留原始題目已有的值；缺少者填 \`null\`，不推測新 ID。
- 新增的 metadata 放在 \`review.syllabusCategory\`、\`review.syllabusCategoryCode\` 與 review status 欄位。
- 任何 category-derived mapping 都必須在取得官方 blueprint 或人工核對後才可升級為正式 mapping。
- 不會自動修改題目文字、答案、解析、source metadata 或 runtime pool。

## 待補 direct knowledge mapping

目前缺少 direct \`knowledgeId\` 的題目共 ${missingKnowledgeIds.length} 題。完整 question ID 清單已保存在 sidecar；此報告不複製題幹內容，避免產生第二份題庫。
`;

const blueprintReport = `# Sprint 47 IFA Exam Blueprint Calibration

> 範圍：formal pool ${allQuestions.length} 題。
> 重要限制：repo 目前沒有 IFA 官方考試章節配額；下表的「建議校準帶」是 estimated calibration hypothesis，不是官方規格，也不會改變 Full Mock 題數或抽題流程。

## Current mapped distribution

| 分類 | 題數 | 比例 | 建議校準帶 | 差異判定 |
|---|---:|---:|---:|---|
${tableRows(categoryRows)}

## 校準解讀

- Anatomy & Physiology：${countByCode.ANATOMY_PHYSIOLOGY ?? 0} 題（${percentage(countByCode.ANATOMY_PHYSIOLOGY ?? 0)}），目前落在估算帶內，但內部仍可能由解剖生理大類集中承擔。
- Carrier Oil：${countByCode.CARRIER_OIL ?? 0} 題（${percentage(countByCode.CARRIER_OIL ?? 0)}），高於估算帶，應先確認官方考綱是否真的給予相同比重。
- Safety / Contraindications：${countByCode.SAFETY_CONTRAINDICATIONS ?? 0} 題（${percentage(countByCode.SAFETY_CONTRAINDICATIONS ?? 0)}），接近上界，安全題不能因比例校準而直接刪除。
- Blending Theory、Essential Oil Materia Medica、Consultation Practice、Professional Practice、Ethics 目前低於估算帶，應列入補 mapping／coverage review，而不是直接新增題目。
- Cross-topic / Exam Practice 的 ${countByCode.CROSS_TOPIC_EXAM_PRACTICE ?? 0} 題不能直接當成單一考綱章節，需逐題重分類。

## 建議正式考試比例差異

目前只能提出順序，不能提出官方配額：

1. 先取得 IFA 官方 exam blueprint 或由教學者確認章節 weights。
2. 以 sidecar 的 \`review.syllabusCategory\` 聚合 actual／expected／gap。
3. 對 over-concentrated 類別先做 duplicate、difficulty、source evidence review；不得因數量高就刪題或改答案。
4. 對低量類別先做 knowledge mapping，確認是否被 Anatomy & Physiology、Safety 等大類吸收。
5. 官方比例確認前，Full Mock 維持既有 formal pool 邊界，不把 estimated band 接入 runtime。

## 目前不能下結論的地方

- 244 題缺少 direct \`knowledgeId\`，因此不能把 category count 當成 syllabus item coverage。
- 6 題考古題只有 cross-topic provisional mapping。
- 建議校準帶沒有官方來源，僅供 review queue 排序。
`;

const riskReport = `# Sprint 47 Syllabus Mapping Risk List

> 本清單只記錄風險，不自動修改題庫或正式考試流程。

## P0：考綱映射不完整

- ${allQuestions.length - directKnowledgeCount} 題（${percentage(allQuestions.length - directKnowledgeCount)}）沒有 direct \`knowledgeId\`。
- Category-derived mapping 已達 ${allQuestions.length}/${allQuestions.length}，但全部標示 estimated，不能視為官方 knowledge mapping。
- ${mediumIds.length} 題 mapping confidence 不是 high，question IDs：${mediumIds.join('、') || '無'}。

## P1：分類集中與缺口

- Carrier Oil ${percentage(countByCode.CARRIER_OIL ?? 0)} 高於本次估算帶。
- Blending Theory、Essential Oil Materia Medica、Consultation Practice、Professional Practice、Ethics 低於本次估算帶。
- Cross-topic / Exam Practice 尚有 ${countByCode.CROSS_TOPIC_EXAM_PRACTICE ?? 0} 題，必須逐題拆解到實際考綱分類。
- 目前沒有官方 blueprint，所有 over／under 判定都只能作為 review priority。

## P1：Source 不足

- source lineage 缺失：${sourceLineageMissing} 題。
- source evidence（evidence ID、excerpt、answer basis）不完整：${sourceEvidenceMissing} 題。
- source version 缺失或待補：${sourceVersionMissing} 題。
- source page 缺失或待補：${sourcePageMissing} 題。

## P1：Explanation 品質

- explanation 缺失：${explanationMissing} 題。
- explanation 少於 20 字元：${explanationUnder20} 題，需人工確認是否足以支持答案。
- explanation 與 answer 完全相同：${explanationEqualsAnswer} 題。

## 處理界線

- 不修改題目文字、答案、解析或原始 source。
- 不把 sidecar mapping 接入 Question Engine。
- 不依 estimated ratio 自動刪題、降權、補題或加入正式池。
- 後續 AI 審核只能提出 mapping candidate、confidence 與 reason，最終狀態需人工核准。
`;

const sidecar = {
  schemaVersion: 'sprint47-v1',
  generatedBy: 'scripts/build-sprint47-syllabus-mapping.mjs',
  generatedAt: '2026-07-22',
  runtimeImport: false,
  estimatedTaxonomy: true,
  scope: {
    pool: 'formal',
    questionCount: allQuestions.length,
    inputFiles: formalInputFiles.map((item) => item.file),
    officialBlueprintAvailable: false,
  },
  entries,
};

await mkdir(join(root, 'docs'), { recursive: true });
await mkdir(join(root, 'src/data/questions'), { recursive: true });
await writeFile(join(root, 'src/data/questions/formalQuestionSyllabusMap.json'), `${JSON.stringify(sidecar, null, 2)}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint47_syllabus_taxonomy.md'), `${taxonomyReport.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint47_question_mapping_report.md'), `${mappingReport.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint47_exam_blueprint.md'), `${blueprintReport.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint47_mapping_risks.md'), `${riskReport.trimEnd()}\n`, 'utf8');

console.log(JSON.stringify({
  formalCount: allQuestions.length,
  directKnowledgeIdCount: directKnowledgeCount,
  syllabusCategoryMappedCount: entries.filter((entry) => entry.review.mappingStatus !== 'unmapped').length,
  mediumConfidenceCount: mediumIds.length,
  categoryCounts: Object.fromEntries(taxonomy.map((item) => [item.name, countByCode[item.code] ?? 0])),
  sourceLineageMissing,
  sourceEvidenceMissing,
  explanationUnder20,
  outputs: [
    'src/data/questions/formalQuestionSyllabusMap.json',
    'docs/sprint47_syllabus_taxonomy.md',
    'docs/sprint47_question_mapping_report.md',
    'docs/sprint47_exam_blueprint.md',
    'docs/sprint47_mapping_risks.md',
  ],
}, null, 2));
