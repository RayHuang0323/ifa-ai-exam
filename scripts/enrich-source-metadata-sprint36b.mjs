import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const questionsDir = path.join(root, 'src', 'data', 'questions');
const missing = '\u5f85\u88dc';
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(questionsDir, file), 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (file, value) => fs.writeFileSync(path.join(questionsDir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const isMissing = (value) => value === undefined || value === null || String(value).trim() === '' || String(value).trim() === missing;
const coreFields = ['id', 'type', 'question', 'options', 'answer', 'referenceAnswer'];

const evidenceIndex = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'sourceEvidenceIndex.json'), 'utf8').replace(/^\uFEFF/, ''));
const evidenceById = new Map((evidenceIndex.evidence ?? []).map((evidence) => [evidence.evidenceId, evidence]));
const metadataFiles = ['week1.json', 'week2.json', 'source-verified.json', 'source-verified-sprint36.json'];
const before = new Map();
const changes = [];
const fieldCounts = { sourcePage: 0, sourceChapter: 0, sourceVersion: 0, answerBasis: 0, evidenceExcerpt: 0, sourceFile: 0, sourceLabel: 0, sourceEvidenceIds: 0 };
const unresolved = [];

for (const file of metadataFiles) {
  const questions = readJson(file);
  for (const question of questions) before.set(question.id, Object.fromEntries(coreFields.map((field) => [field, JSON.stringify(question[field] ?? null)])));
  for (const question of questions) {
    const old = { ...question };
    const evidence = (question.sourceEvidenceIds ?? []).map((id) => evidenceById.get(id)).filter(Boolean);
    const sections = [...new Set(evidence.map((item) => item.section ?? item.chapter ?? item.sourceChapter).filter((value) => !isMissing(value)))];
    const pages = [...new Set(evidence.map((item) => item.page ?? item.sourcePage).filter((value) => !isMissing(value)))];
    const versions = [...new Set(evidence.map((item) => item.version ?? item.sourceVersion).filter((value) => !isMissing(value)))];
    const excerpts = evidence.map((item) => item.excerpt).filter((value) => !isMissing(value));

    if (isMissing(question.sourcePage) && pages.length === 1) question.sourcePage = pages[0];
    if (isMissing(question.sourceChapter) && sections.length === 1) question.sourceChapter = sections[0];
    if (isMissing(question.sourceVersion) && versions.length === 1) question.sourceVersion = versions[0];
    if (isMissing(question.evidenceExcerpt) && excerpts.length === 1) question.evidenceExcerpt = excerpts[0];

    for (const field of Object.keys(fieldCounts)) if (isMissing(old[field]) && !isMissing(question[field])) fieldCounts[field] += 1;
    const changedFields = Object.keys(fieldCounts).filter((field) => JSON.stringify(old[field] ?? null) !== JSON.stringify(question[field] ?? null));
    if (changedFields.length) changes.push({ id: question.id, file, fields: changedFields, evidenceIds: question.sourceEvidenceIds ?? [], sourceLocation: question.sourceLocation ?? sections[0] ?? missing });

    const missingFields = ['sourcePage', 'sourceChapter', 'sourceVersion', 'answerBasis', 'evidenceExcerpt'].filter((field) => isMissing(question[field]));
    if (missingFields.length) unresolved.push({ id: question.id, file, missingFields });
  }
  writeJson(file, questions);
}

for (const [id, snapshot] of before) {
  const file = metadataFiles.find((candidate) => readJson(candidate).some((question) => question.id === id));
  const question = readJson(file).find((candidate) => candidate.id === id);
  for (const field of coreFields) if (snapshot[field] !== JSON.stringify(question[field] ?? null)) throw new Error(`核心欄位被改動：${id}.${field}`);
}

const report = {
  sprint: '36B',
  generatedAt: new Date().toISOString(),
  evidenceCount: evidenceById.size,
  files: metadataFiles,
  changedQuestionCount: changes.length,
  changedFields: fieldCounts,
  changes,
  unresolved,
  rule: '只使用 evidence index 明確存在的 page、section/chapter、version、excerpt；沒有證據時不補值。',
};
fs.writeFileSync(path.join(root, 'src', 'data', 'sourceMetadataSprint36b.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ changedQuestionCount: changes.length, changedFields: fieldCounts, unresolvedCount: unresolved.length, evidenceCount: evidenceById.size }, null, 2));
