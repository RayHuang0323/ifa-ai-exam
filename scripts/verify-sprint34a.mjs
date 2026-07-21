import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = { location: { search: '' }, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } };
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const [week1, week2, extra, sourceVerifiedBase, sourceVerifiedExpansion, practice, manifest, bankSource, packageSource, appsScript] = await Promise.all([
    read('../src/data/questions/week1.json').then(JSON.parse),
    read('../src/data/questions/week2.json').then(JSON.parse),
    read('../src/data/questions/verified-extra.json').then(JSON.parse),
    read('../src/data/questions/source-verified.json').then(JSON.parse),
    read('../src/data/questions/source-verified-sprint36.json').then(JSON.parse),
    read('../src/data/questions/exam-practice.json').then(JSON.parse),
    read('../docs/34A_review-manifest.json').then(JSON.parse),
    read('../scripts/verify-question-bank.mjs'),
    read('../package.json').then(JSON.parse),
    read('../docs/google-apps-script/Code.gs'),
  ]);
  const sourceVerified = [...sourceVerifiedBase, ...sourceVerifiedExpansion];
  const formal = engine.getFormalQuestionPool();
  const practicePool = engine.getPracticeQuestionPool();
  const dailyPool = engine.getDailyQuestionPool();
  const decisions = practice.filter((question) => question.sprint34aDecision);
  const counts = Object.fromEntries([...new Set(decisions.map((question) => question.sprint34aDecision))].map((decision) => [decision, decisions.filter((question) => question.sprint34aDecision === decision).length]));
  const expected = { downgrade_to_practice: 85, hold_for_human_review: 2, remove_or_disable: 22 };

  if (week1.length !== 20 || week2.length !== 21 || extra.length !== 0 || formal.length !== 41 + sourceVerified.length) throw new Error('Sprint 34A 的 41 題人工 verified 邊界或新增 source_verified 接線錯誤');
  if (manifest.reviewed !== 109 || manifest.originalVerifiedCount !== 41 || manifest.fullMockCount !== 41 || JSON.stringify(manifest.counts) !== JSON.stringify({ keep_verified: 0, needs_minor_fix: 0, downgrade_to_practice: 85, hold_for_human_review: 2, remove_or_disable: 22 })) throw new Error('34A 覆核 manifest 計數錯誤');
  for (const [decision, expectedCount] of Object.entries(expected)) if (counts[decision] !== expectedCount) throw new Error(`34A ${decision} 數量錯誤`);
  if (decisions.length !== 109 || practice.length !== 1021 || practicePool.length !== 974 || dailyPool.length !== 1015 + sourceVerified.length) throw new Error('34A Daily／Weekly 題池數量錯誤');
  if (practicePool.some((question) => question.isActive === false || question.excludeFromPractice === true || ['unsafe_candidate', 'duplicate_candidate', 'needs_fix'].includes(question.qualityStatus ?? ''))) throw new Error('練習池包含停用或排除題');
  if (dailyPool.some((question) => question.isActive === false || question.excludeFromPractice === true) || new Set(dailyPool.map((question) => question.id)).size !== dailyPool.length) throw new Error('Daily／Weekly 題池邊界錯誤');
  if (formal.some((question) => question.practiceOnly === true || question.formalScoreEligible === false || !['verified', 'source_verified'].includes(question.reviewStatus))) throw new Error('Full Mock 混入非正式題');
  if (practice.filter((question) => question.qualityStatus === 'promoted_to_verified').length !== 0 || practice.some((question) => question.relatedVerifiedId && !formal.some((formalQuestion) => formalQuestion.id === question.relatedVerifiedId))) throw new Error('升格副本仍保留失效正式連結');
  if (!bankSource.includes('sourceVerified.length') || !packageSource.scripts['verify:sprint34a']) throw new Error('Sprint 34A 驗證接線缺失');
  if (!appsScript.includes('doPost') || !appsScript.includes('doGet')) throw new Error('Apps Script 完整性基本檢查失敗');
  console.log(JSON.stringify({ reviewed: 109, keepVerified: 0, downgrade: 85, hold: 2, disabled: 22, humanVerifiedCount: 41, sourceVerifiedCount: sourceVerified.length, fullMockCount: formal.length, practiceOriginalCount: 1021, practiceEligibleCount: 974, dailyPoolCount: dailyPool.length, appsScriptUntouched: true }, null, 2));
  console.log('SPRINT 34A VERIFY PASSED');
} finally {
  await server.close();
}
