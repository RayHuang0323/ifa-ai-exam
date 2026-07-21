import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const questionDir = join(projectRoot, 'src', 'data', 'questions');
const stagingPath = join(questionDir, 'week2.staging.json');
const pendingPath = join(questionDir, 'pending-review.json');
const week1Path = join(questionDir, 'week1.json');
const allowedPendingStatuses = new Set([
  'missing-answer',
  'source-page-pending',
  'manual-review-required',
  'conflict-review',
]);

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const normalize = (value) => String(value)
  .toLowerCase()
  .replace(/[\s\p{P}\p{S}]/gu, '');
const questionKey = (question) => `${normalize(question.question)}|${(question.options ?? []).map(normalize).join('|')}`;
const answerMatchesOptions = (question) => {
  if (!question.options?.length || question.answer == null) return true;
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
  return answers.every((answer) => question.options.includes(answer));
};
const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return ['.ts', '.tsx', '.js', '.mjs'].includes(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
};

const [staging, pending, week1] = await Promise.all([
  readJson(stagingPath),
  readJson(pendingPath),
  readJson(week1Path),
]);

const errors = [];
if (!Array.isArray(staging)) errors.push('week2.staging.json 必須是 JSON 陣列。');
if (!Array.isArray(pending)) errors.push('pending-review.json 必須是 JSON 陣列。');

const ids = new Set();
const week1Keys = new Set(week1.map(questionKey));
for (const question of staging) {
  if (ids.has(question.id)) errors.push(`staging 題目 ID 重複：${question.id}`);
  ids.add(question.id);
  if (week1Keys.has(questionKey(question))) errors.push(`staging 與 Week1 完全重複：${question.id}`);
  if (!answerMatchesOptions(question)) errors.push(`staging 答案未對應選項：${question.id}`);
  if (question.reviewStatus === 'missing-answer') errors.push(`staging 不得包含 missing-answer：${question.id}`);
  if (question.answer == null) errors.push(`staging 必須保留來源答案：${question.id}`);
}

for (const question of pending) {
  if (!allowedPendingStatuses.has(question.reviewStatus)) errors.push(`pending reviewStatus 無效：${question.id}`);
}

const sourceFiles = await collectSourceFiles(join(projectRoot, 'src'));
const runtimeFiles = sourceFiles.filter((path) => !path.includes(`${join('src', 'data', 'questions')}`));
for (const path of runtimeFiles) {
  const source = await readFile(path, 'utf8');
  if (/from\s+['"][^'"]*pending-review(?:\.json)?['"]/.test(source)) {
    errors.push(`pending-review.json 不得被正式 runtime 匯入：${basename(path)}`);
  }
}

if (errors.length) {
  console.error('題庫 staging 驗證失敗：');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`題庫 staging 驗證通過：${staging.length} 題 staging、${pending.length} 題 pending-review。`);
