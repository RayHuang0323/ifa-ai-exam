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

const typeLabel = (type) => ({ shortAnswer: '簡答', short_answer: '簡答', essay: '申論', case_study: '案例', case: '案例', multipleChoice: '單選', multiSelect: '複選', single: '單選', multiple: '複選' }[type] ?? type);
const isNonChoice = (question) => ['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'writing'].includes(question.type);
const confidenceReason = (question) => {
  const reasons = [];
  if (question.questionConfidence === 'A') reasons.push('來源品質 A、題幹清晰、選項公平');
  if (question.questionConfidence === 'B') {
    if (question.sourceQualityLevel !== 'A') reasons.push(`來源品質 ${question.sourceQualityLevel ?? '待評估'}，版本／頁碼或追溯欄位仍需補強`);
    if (question.sourceReview?.disposition === 'REVISE') reasons.push(...question.sourceReview.reasons);
    if (question.questionQuality?.requiresRevision) reasons.push(question.questionQuality.revisionReason);
    if (!reasons.length) reasons.push('答案可追溯，但仍需完成正式題來源或題型複核');
  }
  if (question.questionConfidence === 'C') reasons.push('practiceOnly；不適合作為正式模擬考題');
  return [...new Set(reasons.filter(Boolean))].join('；');
};

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const formal = [...engine.getFormalQuestionPool()].sort((left, right) => left.id - right.id);
  const counts = { A: 0, B: 0, C: 0 };
  formal.forEach((question) => { counts[question.questionConfidence ?? 'B'] += 1; });

  const rankingRows = formal.map((question) => `| ${question.id} | ${question.questionConfidence ?? 'B'} | ${typeLabel(question.type)} | ${confidenceReason(question)} |`).join('\n');
  const ranking = `# Sprint 40B 正式題池品質分級\n\n## 分級摘要\n\n| 等級 | 題數 | 使用範圍 |\n|---|---:|---|\n| A | ${counts.A} | 可直接進入 Full Mock |\n| B | ${counts.B} | 可進入 Full Mock、Daily、Weekly；持續補強 |\n| C | ${counts.C} | practiceOnly；不得進入 Full Mock |\n\n本次範圍為 verified 41 題與 source_verified 244 題，共 ${formal.length} 題。分級只新增 runtime metadata，不改寫題幹、答案、選項或任何歷史紀錄。\n\nA 級需同時具備完整來源品質 A、清晰正式題幹、低選項洩漏風險，且無圖片缺口。本次來源版本／頁碼尚未完整，因此目前 A 級為 ${counts.A} 題；這是來源治理結果，不代表答案已被判定錯誤。\n\n## 逐題分級\n\n| questionId | 分類 | 題型 | 原因 |\n|---:|:---:|---|---|\n${rankingRows}\n`;

  const queue = formal.map((question) => {
    const flags = [];
    let priority = 99;
    if (question.sourceReview?.disposition === 'REVISE') { priority = Math.min(priority, 1); flags.push('Formal REVISE'); }
    if (question.imageMissing) { priority = Math.min(priority, 2); flags.push('圖片缺失'); }
    if (isNonChoice(question)) { priority = Math.min(priority, 3); flags.push('非選擇題'); }
    if (question.questionQuality?.clarity === 'needs_review') { priority = Math.min(priority, 4); flags.push('語意模糊／需複核'); }
    if (question.questionConfidence === 'C') { priority = Math.min(priority, 4); flags.push('C 級 practiceOnly'); }
    return priority === 99 ? null : { question, priority, flags: [...new Set(flags)] };
  }).filter(Boolean).sort((left, right) => left.priority - right.priority || left.question.id - right.question.id);
  const priorityCounts = Object.fromEntries([1, 2, 3, 4].map((priority) => [priority, queue.filter((item) => item.priority === priority).length]));
  const queueRows = queue.map(({ question, priority, flags }) => `| ${priority} | ${question.id} | ${question.questionConfidence ?? 'B'} | ${typeLabel(question.type)} | ${flags.join('、')} | ${confidenceReason(question)} |`).join('\n');
  const queueReport = `# Sprint 40B 人工複核清單\n\n清單依下列優先順序排序；同一題只出現一次，採最高優先級。\n\n1. Formal REVISE：${priorityCounts[1]} 題\n2. 圖片缺失：${priorityCounts[2]} 題\n3. 非選擇題：${priorityCounts[3]} 題\n4. 語意模糊／C 級：${priorityCounts[4]} 題\n\n人工複核時不得修改已作答題核心欄位；需先檢查 answered lock，再決定是否建立未作答題的修訂版本。\n\n| 優先級 | questionId | 分級 | 題型 | 複核項目 | 原因 |\n|---:|---:|:---:|---|---|---|\n${queueRows}\n`;

  await mkdir(docsDir, { recursive: true });
  await writeFile(join(docsDir, '40B_formal_question_ranking.md'), ranking, 'utf8');
  await writeFile(join(docsDir, '40B_manual_review_queue.md'), queueReport, 'utf8');
  console.log(JSON.stringify({ formalCount: formal.length, confidenceCounts: counts, reviewQueueCount: queue.length, priorityCounts }, null, 2));
} finally {
  await server.close();
}
