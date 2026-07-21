import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = {
  location: { search: '' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

try {
  const [dailyTask, engine] = await Promise.all([
    server.ssrLoadModule('/src/utils/dailyTaskV2.ts'),
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
  ]);
  const practice = JSON.parse(await read('../src/data/questions/exam-practice.json'));
  const extra = JSON.parse(await read('../src/data/questions/verified-extra.json'));
  const formal = engine.getFormalQuestionPool();
  const practicePool = engine.getPracticeQuestionPool();
  const dailyPool = engine.getDailyQuestionPool();

  if (formal.length < 41 || formal.length !== 41 + extra.length || engine.getVerifiedExtraQuestionPool().length !== extra.length) throw new Error('Sprint 34 正式題庫邊界或補充檔案接線錯誤');
  if (new Set(formal.map((question) => question.id)).size !== formal.length) throw new Error('正式題庫 ID 不唯一');
  if (extra.some((question) => question.reviewStatus !== 'verified' || question.practiceOnly === true || question.formalScoreEligible === false || !question.verifiedBy || !question.verifiedAt || !question.sourcePage || question.riskLevel === 'safety_review' || question.sourceType === 'mock')) throw new Error('補充正式題目欄位或風險邊界錯誤');
  if (extra.some((question) => /private|\.pdf|\.docx/i.test(JSON.stringify(question)))) throw new Error('正式補充題暴露 private 檔案');

  const promoted = practice.filter((question) => question.qualityStatus === 'promoted_to_verified');
  if (promoted.length !== 0 || practice.some((question) => question.relatedVerifiedId && !formal.some((formalQuestion) => formalQuestion.id === question.relatedVerifiedId))) throw new Error('Sprint 34A 降級後仍有失效的正式題連結');
  if (practicePool.some((question) => question.qualityStatus === 'promoted_to_verified' || question.excludeFromPractice === true || question.isActive === false || question.qualityStatus === 'unsafe_candidate' || question.qualityStatus === 'duplicate_candidate')) throw new Error('Daily／Weekly 練習池包含被排除題目');
  if (practicePool.some((question) => question.practiceOnly !== true)) throw new Error('練習池出現非 practiceOnly 題');
  if (new Set(dailyPool.map((question) => question.id)).size !== dailyPool.length) throw new Error('正式題與練習題合併後出現重複 ID');
  if (dailyPool.length !== formal.length + practicePool.length) throw new Error('Daily 題庫合併數量錯誤');
  if (formal.some((question) => question.practiceOnly === true || question.formalScoreEligible === false)) throw new Error('Full Mock 正式池混入 practiceOnly 題');

  storage.clear();
  const pool = Array.from({ length: 200 }, (_, index) => index + 1);
  const dayOne = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-15');
  if (dayOne.state.dailyTarget !== 30 || dayOne.state.dailyDisplayLimit !== 90 || dayOne.activeQuestionIds.length !== 30 || dayOne.maximumQuestionCount !== 90 || dayOne.canAddQuestionCount !== 60) throw new Error('Daily Task 預設 30 題或 90 題上限錯誤');
  const extended = dailyTask.extendDailyTaskV2Plan(pool, 90, '2026-07-15');
  if (extended.activeQuestionIds.length !== 90 || extended.state.assignedQuestionIds.length !== 90 || new Set(extended.activeQuestionIds).size !== 90) throw new Error('Daily Task 加做至 90 題失敗');
  dailyTask.completeDailyTaskV2Questions(extended.activeQuestionIds.slice(0, 30), pool);
  const nextDay = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-16');
  if (nextDay.carryoverCount !== 60 || nextDay.activeQuestionIds.length !== 90 || !nextDay.activeQuestionIds.slice(0, 60).every((id, index) => id === extended.activeQuestionIds[index + 30])) throw new Error('未完成保留題未優先帶入下一日');

  storage.clear();
  const historyPlan = dailyTask.getDailyTaskV2Plan(pool, Array.from({ length: 30 }, (_, index) => index + 1), '2026-07-15');
  if (historyPlan.activeQuestionIds.some((id) => id <= 30) || historyPlan.activeQuestionIds[0] !== 31) throw new Error('已完成題目未從短期每日任務排除');

  storage.clear();
  storage.set('ifa-daily-task-v2-state', JSON.stringify({ date: '2026-07-14', assignedQuestionIds: Array.from({ length: 90 }, (_, index) => index + 1), completedQuestionIds: [], carryoverQuestionIds: Array.from({ length: 120 }, (_, index) => index + 1), dailyTarget: 30, dailyDisplayLimit: 45, generatedAt: '2026-07-14T00:00:00.000Z', updatedAt: '2026-07-14T00:00:00.000Z' }));
  const oversizedCarryover = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-15');
  if (oversizedCarryover.activeQuestionIds.length !== 90 || new Set(oversizedCarryover.activeQuestionIds).size !== 90) throw new Error('未完成保留題超過 90 題時未安全分批');

  const [appSource, homeSource, missionSource, practiceSource, engineSource, packageSource] = await Promise.all([
    read('../src/App.tsx'),
    read('../src/views/Home.tsx'),
    read('../src/components/home/MissionSection.tsx'),
    read('../src/views/PracticeCenter.tsx'),
    read('../src/utils/questionEngine.ts'),
    read('../package.json'),
  ]);
  if (!appSource.includes('extendDailyTaskV2Plan') || !missionSource.includes('今日基本任務') || !missionSource.includes('今日可加做') || !missionSource.includes('今日加做題目') || !practiceSource.includes('今日最高上限') || !homeSource.includes('dailyMaximum')) throw new Error('Daily Task 30／90 題繁中介面或接線缺失');
  if (missionSource.includes('carryover →') || practiceSource.includes('carryover →') || homeSource.includes('carryover →')) throw new Error('介面顯示內部英文命名');
  if (!engineSource.includes("verified-extra.json") || !JSON.parse(packageSource).scripts['verify:sprint34']) throw new Error('Sprint 34 題庫或驗證腳本未接線');

  const distFiles = await read('../dist/index.html').catch(() => '');
  const distJs = distFiles ? await Promise.all([...distFiles.matchAll(/assets\/([^"']+\.js)/g)].map((match) => read(`../dist/assets/${match[1]}`).catch(() => ''))) : [];
  const bundle = distJs.join('\n');
  if (bundle && /AI_GRADING_API_KEY|sk-[A-Za-z0-9]{20,}|Google Login|Google OAuth|\.pdf|\.docx/i.test(bundle)) throw new Error('production bundle 含禁止內容');
  console.log(JSON.stringify({
    formalCount: formal.length,
    verifiedExtraCount: extra.length,
    practicePoolCount: practicePool.length,
    dailyPoolCount: dailyPool.length,
    promotedCount: promoted.length,
    reviewedSprint34Count: practice.filter((question) => question.sprint34aDecision).length,
    dailyDefault: 30,
    dailyMaximum: 90,
    fullMockVerifiedOnly: formal.every((question) => question.reviewStatus === 'verified' && question.practiceOnly !== true),
    noPrivateBundle: true,
  }, null, 2));
  console.log('SPRINT 34 VERIFY PASSED');
} finally {
  await server.close();
}
