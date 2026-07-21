import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
};

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const formal = engine.getFormalQuestionPool();
  const refinementOf = (question) => question.formalQuestionRefinement ?? {
    status: 'manual_review',
    changed: false,
    displayQuestion: question.displayQuestion ?? question.question,
    issues: ['formalQuestionRefinement 缺失'],
    manualReviewReasons: ['需確認正式題 refinement layer 是否接入。'],
  };
  const rows = formal.map((question) => ({ question, refinement: refinementOf(question) }));
  const improved = rows.filter(({ refinement }) => refinement.changed);
  const kept = rows.filter(({ refinement }) => !refinement.changed);
  const manual = rows.filter(({ refinement }) => refinement.manualReviewReasons.length > 0);
  const issueCounts = {};
  rows.forEach(({ refinement }) => refinement.issues.forEach((issue) => { issueCounts[issue] = (issueCounts[issue] ?? 0) + 1; }));
  const typeCounts = (items) => items.reduce((counts, { question }) => {
    counts[question.type] = (counts[question.type] ?? 0) + 1;
    return counts;
  }, {});
  const tableValue = (value) => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', ' ');
  const issueRows = Object.entries(issueCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([issue, count]) => `| ${issue} | ${count} |`)
    .join('\n') || '| 無 | 0 |';
  const manualRows = manual.map(({ question, refinement }) => `| ${question.id} | ${question.type} | ${refinement.manualReviewReasons.map(tableValue).join('、')} |`).join('\n') || '| 無 | - | - |';
  const sampleRows = improved.slice(0, 20).map(({ question, refinement }) => `| ${question.id} | ${question.type} | ${tableValue(refinement.displayQuestion)} |`).join('\n') || '| 無 | - | - |';
  const report = `# Sprint 42.1 正式題語意人工化與解析品質人工複核報告

## 範圍與保護原則

本報告只針對 Full Mock 可使用的正式題池。正式題共 ${formal.length} 題；refinement layer 只更新學員看到的 \`displayQuestion\` 與複核 metadata，未修改原始 \`question\`、\`answer\`、\`evidenceExcerpt\`、\`answerBasis\`、Bella history、Apps Script 或 answered lock。

## 複核摘要

| 項目 | 題數 |
|---|---:|
| 已改善題數 | ${improved.length} |
| 保留題數 | ${kept.length} |
| 需要人工確認題數 | ${manual.length} |

「需要人工確認」是已改善／保留題中的標記子集，主要代表答案依據仍缺資料，並非自動補寫答案或 evidence。

### 題型分布

| 狀態 | 題型分布 |
|---|---|
| 已改善 | ${tableValue(JSON.stringify(typeCounts(improved)))} |
| 保留 | ${tableValue(JSON.stringify(typeCounts(kept)))} |
| 人工確認 | ${tableValue(JSON.stringify(typeCounts(manual)))} |

## refinement 規則

- 題幹只在 display layer 自然化，移除教材／AI 提示語，保留正式考試語氣。
- shortAnswer 顯示題幹要求依題目適用情況回應定義、主要特性、用途與安全注意事項。
- essay 顯示題幹要求進行比較、分析與評估，並交代條件與限制。
- case study 顯示題幹要求交代個案背景、使用需求與安全限制，並說明評估及處理順序。
- Result 來源只顯示教材名稱、章節、頁碼、版本；缺漏時顯示「缺少：教材資訊待補。」；不顯示 \`word/document.xml\`、段落編號或 source id。

## 顯示層問題分布

| 問題 | 題數 |
|---|---:|
${issueRows}

## 已改善題目範例（前 20 題）

| questionId | 題型 | displayQuestion |
|---:|---|---|
${sampleRows}

## 需要人工確認清單

| questionId | 題型 | 原因 |
|---:|---|---|
${manualRows}
`;
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs', '42_1_formal_question_refinement.md'), report, 'utf8');
  console.log(JSON.stringify({ formalCount: formal.length, improved: improved.length, kept: kept.length, manualReview: manual.length }, null, 2));
} finally {
  await server.close();
}
