import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const questionDir = join(process.cwd(), 'src', 'data', 'questions');
const privateDir = join(process.cwd(), 'private');
const externalRoot = join(process.cwd(), '..', 'IFA_教材資料庫');
const readQuestions = async (name) => {
  const parsed = JSON.parse(await readFile(join(questionDir, name), 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.questions ?? parsed.items ?? [];
};
const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push({ path, size: (await stat(path)).size });
  }
  return files;
};
const classify = (question, source) => {
  if (source === 'week1.json' || source === 'week2.json') return 'verified';
  if (question.sourceType === 'mock-exam' || question.sourceType === 'mock') return 'mock';
  if (question.reviewStatus === 'missing-answer') return 'blocked';
  return 'high_priority_review';
};

const sources = [
  ['week1.json', await readQuestions('week1.json')],
  ['week2.json', await readQuestions('week2.json')],
  ['week2.staging.json', await readQuestions('week2.staging.json')],
  ['pending-review.json', await readQuestions('pending-review.json')],
];
const records = sources.flatMap(([source, questions]) => questions.map((question) => ({ source, question, tier: classify(question, source) })));
const counts = Object.fromEntries(['verified', 'high_priority_review', 'mock', 'blocked'].map((tier) => [tier, records.filter((record) => record.tier === tier).length]));
const ids = new Map();
for (const record of records) ids.set(record.question.id, [...(ids.get(record.question.id) ?? []), record.source]);
const duplicateCandidateIds = [...ids.values()].filter((files) => new Set(files).size > 1).length;
const privateFiles = await walk(privateDir);
const extensionCounts = Object.entries(privateFiles.reduce((result, file) => { const extension = extname(file.path).toLowerCase() || '[none]'; result[extension] = (result[extension] ?? 0) + 1; return result; }, {})).sort();
const privateBytes = privateFiles.reduce((sum, file) => sum + file.size, 0);
const externalFiles = await walk(externalRoot);
const externalReport = await readFile(join(externalRoot, '04_整理報告', '教材整理報告.md'), 'utf8').catch(() => '');
const reportNumber = (label) => Number((externalReport.match(new RegExp(`${label}[^0-9]*(\\d+)`)) ?? [])[1] ?? 0);
const externalCanonical = { recordedFiles: reportNumber('總檔案數'), recordedBytes: reportNumber('總容量'), classifiedFiles: reportNumber('已分類數量'), pendingFiles: reportNumber('待人工確認數量'), duplicateFiles: reportNumber('重複檔案數量'), conflictCandidates: reportNumber('可能與既有題庫衝突候選') };
const externalCandidatePath = join(externalRoot, '05_題庫候選', '10_待驗證題目.json');
const externalCandidatesParsed = JSON.parse((await readFile(externalCandidatePath, 'utf8').catch(() => '[]')).replace(/^\uFEFF/, ''));
const externalCandidates = Array.isArray(externalCandidatesParsed) ? externalCandidatesParsed : externalCandidatesParsed.questions ?? externalCandidatesParsed.items ?? [];
const externalTierCounts = { high_priority_review: externalCandidates.filter((question) => question.sourceType !== 'mock-exam' && question.verification !== 'missing_answer').length, mock: externalCandidates.filter((question) => question.sourceType === 'mock-exam').length, blocked: externalCandidates.filter((question) => question.sourceType !== 'mock-exam' && question.verification === 'missing_answer').length };

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  privateSourceInventory: { fileCount: privateFiles.length, bytes: privateBytes, extensionCounts },
  externalSourceInventory: { physicalFileCount: externalFiles.length, physicalBytes: externalFiles.reduce((sum, file) => sum + file.size, 0), canonicalCollection: externalCanonical, candidateRecords: externalCandidates.length, candidateTierCounts: externalTierCounts },
  questionRecords: counts,
  formalRuntime: { week1: sources[0][1].length, week2: sources[1][1].length, verifiedTotal: counts.verified },
  duplicateCandidateIds,
  policy: 'private originals are inventory-only; only verified enters Question Engine; high_priority_review/mock/blocked stay out of formal scoring',
}, null, 2));
