import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = async (name) => JSON.parse(await readFile(join(root, 'src', 'data', 'questions', name), 'utf8'));
const [week1, week2, verifiedExtra, sourceVerified, sourceVerifiedSprint36, sourceVerifiedSprint37, pastExamVerified, staging] = await Promise.all([readJson('week1.json'), readJson('week2.json'), readJson('verified-extra.json'), readJson('source-verified.json'), readJson('source-verified-sprint36.json'), readJson('source-verified-sprint37.json'), readJson('past-exam-verified.json'), readJson('week2.staging.json')]);
const errors = [];
const ids = new Set();
const formal = [...week1, ...week2, ...verifiedExtra, ...sourceVerified, ...sourceVerifiedSprint36, ...sourceVerifiedSprint37, ...pastExamVerified];
const automaticTypes = new Set(['single', 'multiple', 'multipleChoice', 'multiSelect']);
const manualTypes = new Set(['short_answer', 'shortAnswer', 'essay', 'case', 'case_study']);

for (const question of formal) {
  if (ids.has(question.id)) errors.push(`正式題庫 ID 重複：${question.id}`);
  ids.add(question.id);
  for (const field of ['id', 'type', 'question', 'answer', 'difficulty']) if (question[field] === undefined || question[field] === null || question[field] === '') errors.push(`題目 ${question.id} 缺少 ${field}`);
  if (automaticTypes.has(question.type) && (!Array.isArray(question.options) || question.options.length < 2)) errors.push(`選擇題 ${question.id} 缺少有效 options`);
  if (automaticTypes.has(question.type)) {
    const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
    if (!answers.every((answer) => question.options.includes(answer))) errors.push(`選擇題 ${question.id} 的 answer 不在 options`);
  }
  if (!automaticTypes.has(question.type) && !manualTypes.has(question.type)) errors.push(`題目 ${question.id} 題型未標準化：${question.type}`);
  if (manualTypes.has(question.type) && (typeof question.answer !== 'string' || !question.answer.trim())) errors.push(`非選擇題 ${question.id} 缺少參考答案或方向`);
}

for (const question of [...week2, ...verifiedExtra]) {
  for (const field of ['sourceType', 'sourceLabel', 'reviewStatus']) if (!question[field]) errors.push(`Week2 題目 ${question.id} 缺少 ${field}`);
  if (question.reviewStatus !== 'verified') errors.push(`正式題 ${question.id} 不得為 ${question.reviewStatus}`);
  if (question.sourceType === 'mock') errors.push(`mock 題 ${question.id} 不得進入正式池`);
  if (/private|新建文件夹|\.pdf|\.docx/i.test(JSON.stringify(question))) errors.push(`Week2 題目 ${question.id} 暴露 private 原始資料路徑`);
}

for (const question of verifiedExtra) {
  for (const field of ['verifiedBy', 'verifiedAt']) if (!question[field]) errors.push(`Sprint 34 正式題 ${question.id} 缺少 ${field}`);
  if (question.practiceOnly === true || question.formalScoreEligible === false) errors.push(`Sprint 34 正式題 ${question.id} 不得保留 practiceOnly 或 formalScoreEligible=false`);
  if (!question.sourcePage) errors.push(`Sprint 34 正式題 ${question.id} 缺少 sourcePage（可填「待補」）`);
}

for (const question of [...sourceVerified, ...sourceVerifiedSprint36, ...sourceVerifiedSprint37]) {
  for (const field of ['sourceType', 'sourceLabel', 'sourceFile', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis', 'sourceConfidence', 'verificationType']) if (!question[field] || (Array.isArray(question[field]) && question[field].length === 0)) errors.push(`source_verified 題目 ${question.id} 缺少 ${field}`);
  if (question.reviewStatus !== 'source_verified' || question.verificationType !== 'source_verified') errors.push(`教材證據正式題 ${question.id} 標記錯誤`);
  if (question.practiceOnly === true || question.formalScoreEligible !== true || question.deprecated === true || question.isActive === false) errors.push(`教材證據正式題 ${question.id} 正式池邊界錯誤`);
}
for (const question of pastExamVerified) {
  for (const field of ['sourceType', 'sourceLabel', 'sourceFile', 'sourcePage', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis', 'sourceConfidence', 'verificationType', 'verifiedBy', 'verifiedAt']) if (!question[field] || (Array.isArray(question[field]) && question[field].length === 0)) errors.push(`past_exam 題目 ${question.id} 缺少 ${field}`);
  if (question.sourceType !== 'past_exam' || question.verificationType !== 'past_exam' || question.reviewStatus !== 'verified') errors.push(`past_exam 題目 ${question.id} 標記錯誤`);
  if (question.practiceOnly === true || question.formalScoreEligible !== true || question.isActive === false) errors.push(`past_exam 題目 ${question.id} 正式池邊界錯誤`);
  if (/private[\\/]|external[\\/]/i.test(JSON.stringify(question))) errors.push(`past_exam 題目 ${question.id} 暴露私有原始資料路徑`);
}
const stagingNeedsReview = staging.filter((question) => question.reviewStatus !== 'approved-candidate' || question.sourceType === 'mock-exam' || question.sourceType === 'student-notes' || (question.tags ?? []).some((tag) => /需|不可/.test(tag)));
const stagingMock = staging.filter((question) => question.sourceType === 'mock-exam');
if (stagingMock.some((question) => question.sourceLabel !== '模擬題（非歷屆試題）')) errors.push('mock staging 題必須標示「模擬題（非歷屆試題）」');
if (week1.length !== 20 || week2.length !== 21 || formal.length !== week1.length + week2.length + verifiedExtra.length + sourceVerified.length + sourceVerifiedSprint36.length + sourceVerifiedSprint37.length + pastExamVerified.length) errors.push(`正式題數異常：Week1 ${week1.length}、Week2 ${week2.length}、補充 ${verifiedExtra.length}、教材證據 ${sourceVerified.length + sourceVerifiedSprint36.length + sourceVerifiedSprint37.length}、past_exam ${pastExamVerified.length}、合計 ${formal.length}`);
if (stagingNeedsReview.length !== 12 || stagingMock.length !== 1) errors.push(`審核分類異常：needs_review ${stagingNeedsReview.length}、mock ${stagingMock.length}`);

if (errors.length) {
  console.error('正式題庫驗證失敗：'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1);
}
console.log(`正式題庫驗證通過：人工 verified ${week1.length + week2.length + verifiedExtra.length} 題、教材證據 source_verified ${sourceVerified.length + sourceVerifiedSprint36.length + sourceVerifiedSprint37.length} 題、past_exam ${pastExamVerified.length} 題、正式池合計 ${formal.length} 題；needs_review ${stagingNeedsReview.length} 題、mock ${stagingMock.length} 題。`);
