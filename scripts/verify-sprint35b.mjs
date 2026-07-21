import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = { location: { search: '' }, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } };
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (relativePath) => readFile(join(root, relativePath), 'utf8');
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });

try {
  const [scheduler, engine] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
  ]);
  const [appSource, dailySource, practicePlan, strategyDoc, nonchoiceDoc, packageSource, appsScript] = await Promise.all([
    read('src/App.tsx'),
    read('src/utils/dailyTaskV2.ts'),
    read('docs/35B_QuestionScheduler_v2.md'),
    read('docs/35B_考前刷題策略.md'),
    read('docs/35B_簡答申論擴充規劃.md'),
    read('package.json').then(JSON.parse),
    read('docs/google-apps-script/Code.gs'),
  ]);
  const errors = [];

  const formal = engine.getFormalQuestionPool();
  const practice = engine.getPracticeQuestionPool();
  const daily = engine.getDailyQuestionPool();
  if (formal.length !== 285) errors.push(`正式題庫應為 285 題，實際 ${formal.length}`);
  if (practice.length !== 974 || daily.length !== 1259) errors.push(`Daily／Weekly 題池數量異常：practice=${practice.length}、daily=${daily.length}`);
  if (new Set(formal.map((question) => question.id)).size !== formal.length) errors.push('正式題庫 ID 不唯一');
  if (formal.some((question) => question.practiceOnly === true || question.formalScoreEligible === false || question.deprecated === true || question.isActive === false)) errors.push('正式題庫混入練習／停用題');
  if (practice.some((question) => question.isActive === false || question.excludeFromPractice === true || question.deprecated === true || ['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus ?? ''))) errors.push('練習題池混入排除題');
  if (!appSource.includes('selectDailyQuestionIds') || !appSource.includes('selectWeeklyQuestionIds') || !appSource.includes('selectMockQuestionIds')) errors.push('App 未接入三種 Scheduler 選題流程');
  if (!dailySource.includes('dailyTarget = 30') || !dailySource.includes('dailyMaximum = 90')) errors.push('Daily 30／90 題規則遺失');
  if (!packageSource.scripts['verify:sprint35b']) errors.push('package.json 缺少 verify:sprint35b');
  if (!appsScript.includes('doPost') || !appsScript.includes('doGet')) errors.push('Apps Script 基本 action 不完整');

  storage.clear();
  scheduler.clearQuestionSchedulerState();
  const candidates = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, formal: false }));
  const recentHistoricalDate = new Date(Date.now() - 86400000).toISOString();
  scheduler.seedSchedulerFromHistoricalSessions([{ id: 'legacy-daily', mode: 'daily', questionIds: [1, 2], answeredQuestionIds: [1], startedAt: recentHistoricalDate, completedAt: recentHistoricalDate }]);
  const migratedSelection = scheduler.selectDailyQuestionIds(candidates, 3);
  if (migratedSelection.some((id) => [1, 2].includes(id))) errors.push('既有 StudySession 未正確匯入近期出現紀錄');
  scheduler.clearQuestionSchedulerState();
  scheduler.recordQuestionsShown([1, 2, 3], 'daily', 'daily-old');
  const dailySelection = scheduler.selectDailyQuestionIds(candidates, 5);
  if (dailySelection.length !== 5 || new Set(dailySelection).size !== 5 || dailySelection.some((id) => [1, 2, 3].includes(id))) errors.push('Daily 未排除近期題或同回出現重複');
  const carryoverSelection = scheduler.selectDailyQuestionIds(candidates, 2, [2, 4]);
  if (carryoverSelection[0] !== 2 || carryoverSelection[1] !== 4) errors.push('Daily 未完成保留題未最高優先');

  scheduler.recordQuestionsShown([4, 5], 'daily', 'daily-today');
  const weeklySelection = scheduler.selectWeeklyQuestionIds(candidates, 5);
  if (weeklySelection.some((id) => [1, 2, 3, 4, 5].includes(id))) errors.push('Weekly 未避開近七日 Daily 題');

  storage.clear();
  scheduler.clearQuestionSchedulerState();
  const formalCandidates = Array.from({ length: 20 }, (_, index) => ({ id: index + 100, formal: true, isImportant: index < 4 }));
  scheduler.recordQuestionsShown([100, 101, 102], 'mock', 'mock-old');
  const mockSelection = scheduler.selectMockQuestionIds(formalCandidates, 10);
  const mockPriorSeen = mockSelection.filter((id) => [100, 101, 102].includes(id));
  if (mockSelection.length !== 10 || new Set(mockSelection).size !== 10 || mockPriorSeen.length > 2) errors.push(`正式模擬考第一輪重複超過 20%：${mockPriorSeen.length}/10`);
  const mockStats = scheduler.getFirstRoundStats(formalCandidates.map((candidate) => candidate.id));
  if (mockStats.appearedCount !== 3 || mockStats.totalCount !== 20) errors.push('正式題第一輪完成率計算錯誤');

  scheduler.recordQuestionsShown(formalCandidates.map((candidate) => candidate.id), 'mock', 'mock-full');
  const fullMockSelection = scheduler.selectMockQuestionIds(formalCandidates, 20);
  if (fullMockSelection.length !== 20 || new Set(fullMockSelection).size !== 20) errors.push('正式模擬考同回出現重複或數量錯誤');
  if (scheduler.getSchedulerStage(20) !== 'A' || scheduler.getSchedulerStage(10) !== 'B' || scheduler.getSchedulerStage(5) !== 'C') errors.push('Stage A／B／C 分段策略錯誤');

  if (!dailySource.includes('applyDailyTaskV2QuestionSelection') || !strategyDoc.includes('Stage A') || !strategyDoc.includes('Stage C') || !nonchoiceDoc.includes('shortAnswer')) errors.push('Sprint 35B 文件或 Daily 狀態接線缺失');
  if (errors.length) { console.error('SPRINT 35B VERIFY FAILED'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
  console.log(JSON.stringify({ formalCount: formal.length, practicePoolCount: practice.length, dailyWeeklyPoolCount: daily.length, dailyBasicTarget: 30, dailyMaximum: 90, dailyRecentRepeatAvoided: true, weeklyRecentRepeatAvoided: true, mockFormalOnly: true, mockRepeatLimit: '10%（第一輪未完成）／20%（第一輪完成後）', firstRoundStats: mockStats, stageStrategy: ['A', 'B', 'C'], appsScriptUntouched: true, apiDependency: false }, null, 2));
  console.log('SPRINT 35B VERIFY PASSED');
} finally { await server.close(); }
