import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
};

const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study', 'writing']);
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const summarize = (questions) => {
    const needing = questions.filter((question) => question.questionLanguageAudit?.needsImprovement);
    const issues = {};
    needing.forEach((question) => (question.questionLanguageAudit?.issues ?? []).forEach((issue) => { issues[issue] = (issues[issue] ?? 0) + 1; }));
    return {
      total: questions.length,
      nonChoice: questions.filter((question) => nonChoiceTypes.has(question.type)).length,
      needsImprovement: needing.length,
      issues,
      examples: needing.slice(0, 20).map((question) => ({ id: question.id, type: question.type, issues: question.questionLanguageAudit?.issues ?? [], displayQuestion: question.displayQuestion })),
    };
  };
  const formalSummary = summarize(formal);
  const dailySummary = summarize(daily);
  const issueRows = (issues) => Object.entries(issues).sort((left, right) => right[1] - left[1]).map(([issue, count]) => `| ${issue} | ${count} |`).join('\n') || '| 無 | 0 |';
  const exampleRows = (examples) => examples.map((example) => `| ${example.id} | ${example.type} | ${example.issues.join('、') || '無'} | ${example.displayQuestion} |`).join('\n') || '| 無 | - | - | - |';
  const report = `# Sprint 42 題目語意與解析品質 Audit

## 範圍與原則

本報告檢查正式題池與 Daily 題池的顯示題幹、答案、解析與答案依據。原始題幹保留在 \`question\`，學員介面使用 \`displayQuestion\`；本次沒有修改答案、source_verified 原始 evidence、已作答核心欄位、Bella history 或 Apps Script。

## 題池摘要

| 題池 | 題數 | 非選擇題 | 需要改善 |
|---|---:|---:|---:|
| 正式題 | ${formalSummary.total} | ${formalSummary.nonChoice} | ${formalSummary.needsImprovement} |
| Daily | ${dailySummary.total} | ${dailySummary.nonChoice} | ${dailySummary.needsImprovement} |

## 正式題問題分布

| 問題 | 題數 |
|---|---:|
${issueRows(formalSummary.issues)}

## Daily 問題分布

| 問題 | 題數 |
|---|---:|
${issueRows(dailySummary.issues)}

## 顯示層規則

- shortAnswer：補上主題背景與定義、特性、功能／用途或適用注意事項的回答方向。
- essay：補上主題界定、原因／關係、條件與限制或評估方向。
- case_study：以案例情境呈現，補上個案背景、問題、評估／處理順序與安全界線。
- 所有題型均保留 canonical 題幹；AI／教材提示語只在 display layer 清理。

## 正式題改善範例（前 20 筆）

| questionId | 題型 | 問題 | displayQuestion |
|---:|---|---|---|
${exampleRows(formalSummary.examples)}

## 來源與解析顯示

Result 統一顯示「【答案重點】」「【解析】」「【來源】」。技術抽取位置（例如 \`word/document.xml\`、段落編號）不直接呈現；缺少教材章節、頁碼、版本、答案依據或 evidence 時顯示「教材章節待補」或「來源資料待補」。
`;
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs', '42_question_language_audit.md'), report, 'utf8');
  console.log(JSON.stringify({ formal: formalSummary, daily: dailySummary }, null, 2));
} finally {
  await server.close();
}
