import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[\s，。；：、（）()「」『』《》！？!?.,:;\-_/]/g, '');
const questionsDir = path.join(root, 'src', 'data', 'questions');
const files = ['week1.json', 'week2.json', 'verified-extra.json', 'exam-practice.json', 'source-verified.json', 'source-verified-sprint36.json', 'source-verified-sprint37.json'];
const banks = Object.fromEntries(files.map((file) => [file, readJson(path.join(questionsDir, file))]));
const evidenceData = readJson(path.join(root, 'src', 'data', 'sourceEvidenceIndex.json'));
const evidenceById = new Map((evidenceData.evidence ?? []).map((item) => [item.evidenceId, item]));
const sourceFiles = ['source-verified.json', 'source-verified-sprint36.json', 'source-verified-sprint37.json'];
const source = sourceFiles.flatMap((file) => banks[file]);
const errors = [];
const ids = new Map();
const existingQuestionKeys = new Set();

for (const [file, questions] of Object.entries(banks)) {
  for (const question of questions) {
    if (ids.has(question.id)) errors.push(`ID 重複：${question.id}（${ids.get(question.id)} 與 ${file}）`);
    ids.set(question.id, file);
    if (!sourceFiles.includes(file)) existingQuestionKeys.add(`${normalize(question.question)}|${normalize(question.answer ?? question.referenceAnswer)}`);
  }
}

for (const question of source) {
  const required = ['id', 'type', 'question', 'answer', 'explanation', 'category', 'sourceType', 'sourceLabel', 'sourceFile', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis', 'sourceConfidence', 'verificationType', 'reviewStatus'];
  for (const field of required) if (question[field] === undefined || question[field] === null || question[field] === '') errors.push(`source_verified ${question.id} 缺少 ${field}`);
  if (!['multipleChoice', 'multiSelect', 'shortAnswer', 'short_answer', 'essay', 'case', 'case_study'].includes(question.type)) errors.push(`source_verified ${question.id} 題型不在允許範圍：${question.type}`);
  if (['multipleChoice', 'multiSelect'].includes(question.type)) {
    if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`source_verified ${question.id} 缺 options`);
    const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
    if (!answers.every((answer) => question.options.includes(answer))) errors.push(`source_verified ${question.id} answer 不在 options`);
  }
  if (!Array.isArray(question.sourceEvidenceIds) || question.sourceEvidenceIds.length === 0) errors.push(`source_verified ${question.id} sourceEvidenceIds 空白`);
  for (const evidenceId of question.sourceEvidenceIds ?? []) if (!evidenceById.has(evidenceId)) errors.push(`source_verified ${question.id} 找不到 evidence ${evidenceId}`);
  if (/待補|待人工確認/.test(String(question.evidenceExcerpt))) errors.push(`source_verified ${question.id} evidenceExcerpt 不得是待補`);
  if (question.sourceConfidence === 'low') errors.push(`source_verified ${question.id} sourceConfidence 不得為 low`);
  if (question.reviewStatus !== 'source_verified' || question.verificationType !== 'source_verified') errors.push(`source_verified ${question.id} verification 標記錯誤`);
  if (question.formalScoreEligible !== true || question.practiceOnly === true) errors.push(`source_verified ${question.id} 正式／練習邊界錯誤`);
  if (question.deprecated === true || question.isActive === false || question.excludeFromPractice === true || question.qualityStatus === 'duplicate_candidate' || question.qualityStatus === 'unsafe_candidate') errors.push(`source_verified ${question.id} 含停用、重複或風險標記`);
  if (question.generatedBy !== 'sprint37_source_verified_expansion' && question.riskLevel !== 'standard_review') errors.push(`source_verified ${question.id} 不得含高風險標記：${question.riskLevel}`);
  if (question.generatedBy === 'sprint37_source_verified_expansion' && !['standard_review', 'safety_review'].includes(question.riskLevel)) errors.push(`Sprint 37 source_verified ${question.id} riskLevel 不合法：${question.riskLevel}`);
  if (question.generatedBy === 'sprint37_source_verified_expansion' && question.sourceVersion === undefined) errors.push(`Sprint 37 source_verified ${question.id} 缺 sourceVersion`);
  if (question.generatedBy === 'sprint36_source_verified_expansion' && question.sourceConfidence !== 'high' && question.sourceConfidence !== 'medium') errors.push(`Sprint 36 source_verified ${question.id} 信心不足`);
  if (existingQuestionKeys.has(`${normalize(question.question)}|${normalize(question.answer ?? question.referenceAnswer)}`)) errors.push(`source_verified ${question.id} 與既有題目完全重複`);
}

if (source.length < 80) errors.push(`source_verified 可安全建立題數不足：${source.length}`);
if (errors.length) { console.error('source_verified 驗證失敗：'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
const typeCounts = Object.entries(source.reduce((acc, question) => { acc[question.type] = (acc[question.type] || 0) + 1; return acc; }, {}));
console.log(JSON.stringify({ sourceVerifiedCount: source.length, typeCounts, evidenceCount: evidenceById.size, globalQuestionIdCount: ids.size }, null, 2));
console.log('SOURCE VERIFIED VERIFY PASSED');
