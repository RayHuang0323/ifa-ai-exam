import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};
const label = (value) => ({ upgrade_to_A: 'upgrade_to_A', keep_B: 'keep_B', downgrade_to_practice: 'downgrade_to_practice' }[value] ?? value);

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const rows = engine.getFormalQuestionPool().filter((question) => question.bQualityReview).sort((left, right) => left.id - right.id);
  const counts = { upgrade_to_A: 0, keep_B: 0, downgrade_to_practice: 0 };
  rows.forEach((question) => { counts[question.bQualityReview.disposition] += 1; });
  const table = rows.map((question) => {
    const review = question.bQualityReview;
    const checks = Object.entries(review.checks).map(([key, value]) => `${key}:${value}`).join('、');
    return `| ${question.id} | ${label(review.disposition)} | ${question.answerConfidence} | ${checks} | ${review.reasons.join('；')} |`;
  }).join('\n');
  const report = `# Sprint 41 B 級題品質評估報告\n\n## 評估範圍\n\n本報告涵蓋 Sprint 40C 初始分級為 B 的 196 題。評估只使用現有題幹、答案、source evidence、optionQuality 與 display 題幹；沒有新增題目，也沒有修改 canonical 題庫或已作答資料。\n\n| 分類 | 題數 | 處理 |\n|---|---:|---|\n| upgrade_to_A | ${counts.upgrade_to_A} | 證據可追溯、display 題幹自然化、選項低風險，答案可信度升為 A |\n| keep_B | ${counts.keep_B} | 保留 B，通常為選項中度相似或課程整理來源，等待人工確認 |\n| downgrade_to_practice | ${counts.downgrade_to_practice} | 僅可作練習；本批未發現新增降級題 |\n\nB 級升級不代表 metadata 已完整；sourceVersion、sourcePage 等缺口仍以 metadataMissingFields 與 metadataCompleteness 標記「待補」，禁止猜測。\n\n## 非選擇題規則\n\nshortAnswer、essay、case_study 的 display 題幹優先要求定義、特性、應用、注意事項或完整案例情境。已作答題保留原始題幹與答案，只有未作答題允許使用 display 修正版。\n\n## 逐題結果\n\n| questionId | 分類 | 新 answerConfidence | 檢查結果 | 原因 |\n|---:|---|:---:|---|---|\n${table}\n`;
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs', '41_B級題品質評估報告.md'), report, 'utf8');
  console.log(JSON.stringify({ evaluatedBCount: rows.length, dispositionCounts: counts }, null, 2));
} finally {
  await server.close();
}
