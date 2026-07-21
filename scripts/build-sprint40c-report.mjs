import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const docsDir = join(root, 'docs');
const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const confidenceReason = (question) => {
  const reasons = [];
  if (question.answerConfidence === 'A+') reasons.push('考古題，答案可直接追溯至正式試卷來源');
  if (question.answerConfidence === 'A') reasons.push('教材證據與答案依據完整可追溯；metadata 仍可補強');
  if (question.answerConfidence === 'B') {
    if (question.sourceReview?.disposition === 'REVISE') reasons.push(...question.sourceReview.reasons);
    if (question.sourceType === 'lecture') reasons.push('課程整理題，需人工再確認教材原文');
    if (question.questionNaturalnessAudit?.issues?.length) reasons.push(...question.questionNaturalnessAudit.issues);
    if (!reasons.length) reasons.push('答案方向可用，但來源或正式題型仍需補強');
  }
  if (question.answerConfidence === 'C') reasons.push('答案／題幹不適合作為正式用途，practiceOnly');
  if (question.metadataCompleteness === 'partial') reasons.push('來源 metadata 部分完整');
  if (question.metadataCompleteness === 'missing') reasons.push('來源 metadata 缺失');
  return [...new Set(reasons.filter(Boolean))].join('；');
};

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const formal = [...engine.getFormalQuestionPool()].sort((left, right) => left.id - right.id);
  const confidenceCounts = { 'A+': 0, A: 0, B: 0, C: 0 };
  const metadataCounts = { complete: 0, partial: 0, missing: 0 };
  formal.forEach((question) => {
    confidenceCounts[question.answerConfidence ?? 'B'] += 1;
    metadataCounts[question.metadataCompleteness ?? 'missing'] += 1;
  });
  const rows = formal.map((question) => `| ${question.id} | ${question.answerConfidence ?? 'B'} | ${question.metadataCompleteness ?? 'missing'} | ${confidenceReason(question)} |`).join('\n');
  const report = `# Sprint 40C 正式題庫雙軸可信度報告\n\n## 答案可信度\n\n| answerConfidence | 題數 | 定義 |\n|---|---:|---|\n| A+ | ${confidenceCounts['A+']} | 考古題或可直接追溯的正式答案 |\n| A | ${confidenceCounts.A} | 教材明確支持、答案可靠；metadata 可補強 |\n| B | ${confidenceCounts.B} | 教材概念整理或題幹／來源仍需人工確認 |\n| C | ${confidenceCounts.C} | 不進正式用途，僅 practiceOnly |\n\n## metadata 完整度\n\n| metadataCompleteness | 題數 | 定義 |\n|---|---:|---|\n| 完整（complete） | ${metadataCounts.complete} | sourceFile、sourceVersion、sourceChapter、sourcePage、Evidence 與 answerBasis 齊全 |\n| 部分（partial） | ${metadataCounts.partial} | 有來源與 Evidence，但版本／頁碼等欄位仍待補 |\n| 缺失（missing） | ${metadataCounts.missing} | 來源追溯欄位不足 |\n\n兩個軸彼此獨立：metadata 缺失不會自動把可信答案降為 C；答案不可信也不會因 metadata 完整而升級。\n\n本報告涵蓋 verified 41 題與 source_verified 244 題，共 ${formal.length} 題。只新增 runtime metadata 與 display audit，不修改題庫核心、已作答紀錄、Bella history 或 Apps Script。\n\n## 逐題結果\n\n| questionId | answerConfidence | metadataCompleteness | reason |\n|---:|:---:|:---:|---|\n${rows}\n`;
  await mkdir(docsDir, { recursive: true });
  await writeFile(join(docsDir, '40C_question_confidence_report.md'), report, 'utf8');
  console.log(JSON.stringify({ formalCount: formal.length, confidenceCounts, metadataCounts }, null, 2));
} finally {
  await server.close();
}
