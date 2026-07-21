import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const questionsDir = path.join(root, 'src', 'data', 'questions');
const missing = '\u5f85\u88dc';
const read = (file) => JSON.parse(fs.readFileSync(path.join(questionsDir, file), 'utf8').replace(/^\uFEFF/, ''));
const evidenceIndex = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'sourceEvidenceIndex.json'), 'utf8').replace(/^\uFEFF/, ''));
const report = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'sourceMetadataSprint36b.json'), 'utf8'));
const evidenceById = new Map((evidenceIndex.evidence ?? []).map((item) => [item.evidenceId, item]));
const week1 = read('week1.json');
const week2 = read('week2.json');
const verifiedExtra = read('verified-extra.json');
const source36 = [...read('source-verified.json'), ...read('source-verified-sprint36.json')];
const source = [...source36, ...read('source-verified-sprint37.json')];
const practice = read('exam-practice.json');
const formal = [...week1, ...week2, ...verifiedExtra, ...source];
const errors = [];
const isMissing = (value) => value === undefined || value === null || String(value).trim() === '' || String(value).trim() === missing;
const metadataFields = ['sourceFile', 'sourceLabel', 'sourcePage', 'sourceChapter', 'sourceVersion', 'answerBasis', 'evidenceExcerpt', 'sourceEvidenceIds'];
const missingCounts = (questions) => Object.fromEntries(metadataFields.map((field) => [field, questions.filter((question) => isMissing(question[field])).length]));

if (formal.length !== 285) errors.push(`正式題池應為 285 題，實際 ${formal.length} 題`);
if (week1.length + week2.length + verifiedExtra.length !== 41) errors.push('人工 verified 題數不是 41 題');
if (source.length !== 244) errors.push(`source_verified 應為 244 題，實際 ${source.length} 題`);
if (report.changedQuestionCount !== 144) errors.push(`metadata 報告變更題數異常：${report.changedQuestionCount}`);
if (report.changedFields?.sourceChapter !== 144) errors.push('本批 sourceChapter 補齊數應為 144 題');
for (const field of ['sourcePage', 'sourceVersion', 'answerBasis', 'evidenceExcerpt', 'sourceFile', 'sourceLabel', 'sourceEvidenceIds']) {
  if ((report.changedFields?.[field] ?? 0) !== 0) errors.push(`不應在無明確證據下補 ${field}`);
}

const ids = new Set();
for (const question of formal) {
  if (ids.has(question.id)) errors.push(`正式題庫 ID 重複：${question.id}`);
  ids.add(question.id);
  for (const field of metadataFields) {
    if (typeof question[field] === 'string' && /^(undefined|null)$/i.test(question[field].trim())) errors.push(`題目 ${question.id} 的 ${field} 出現 undefined/null`);
  }
}
for (const question of source) {
  const evidence = (question.sourceEvidenceIds ?? []).map((id) => evidenceById.get(id));
  if (!question.sourceEvidenceIds?.length) errors.push(`source_verified ${question.id} 缺 sourceEvidenceIds`);
  if (evidence.some((item) => !item)) errors.push(`source_verified ${question.id} 有無法對應的 evidence`);
  const sections = [...new Set(evidence.filter(Boolean).map((item) => item.section ?? item.chapter ?? item.sourceChapter).filter((value) => !isMissing(value)))];
  if (sections.length === 1 && question.sourceChapter !== sections[0]) errors.push(`source_verified ${question.id} sourceChapter 未與 evidence section 一致`);
  if (sections.length === 0 && !isMissing(question.sourceChapter)) errors.push(`source_verified ${question.id} sourceChapter 無 evidence 支持`);
  for (const item of evidence.filter(Boolean)) {
    const page = item.page ?? item.sourcePage;
    const version = item.version ?? item.sourceVersion;
    if (!isMissing(question.sourcePage) && !isMissing(page) && String(question.sourcePage) !== String(page)) errors.push(`source_verified ${question.id} sourcePage 與 evidence 不一致`);
    if (!isMissing(question.sourceVersion) && !isMissing(version) && String(question.sourceVersion) !== String(version)) errors.push(`source_verified ${question.id} sourceVersion 與 evidence 不一致`);
  }
}

const practiceEligible = practice.filter((question) => question.isActive !== false && question.excludeFromPractice !== true && question.deprecated !== true && !['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus ?? ''));
if (formal.length + practiceEligible.length !== 1259) errors.push(`Daily／Weekly 題池應為 1,259 題，實際 ${formal.length + practiceEligible.length} 題`);
if (source.some((question) => question.practiceOnly === true || question.formalScoreEligible !== true)) errors.push('source_verified 正式／練習邊界錯誤');

if (errors.length) {
  console.error('SPRINT 36B VERIFY FAILED');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  formalCount: formal.length,
  verifiedCount: week1.length + week2.length + verifiedExtra.length,
  sourceVerifiedCount: source.length,
  dailyWeeklyPoolCount: formal.length + practiceEligible.length,
  formalMissing: missingCounts(formal),
  practiceMissing: missingCounts(practice),
  evidenceCount: evidenceById.size,
  sourceEvidenceLinksValid: true,
  changedQuestionCount: report.changedQuestionCount,
  changedFields: report.changedFields,
  coreFieldsChanged: false,
}, null, 2));
console.log('SPRINT 36B VERIFY PASSED');
