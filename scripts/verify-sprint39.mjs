import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) },
};
process.env.VITE_PROGRESS_API_URL = 'https://sprint39-test.invalid/progress';
process.env.VITE_PROGRESS_WRITE_KEY = 'test-write-key';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

try {
  const [profile, history, scheduler, engine, reviewMode, lock] = await Promise.all([
    server.ssrLoadModule('/src/utils/learnerProfile.ts'),
    server.ssrLoadModule('/src/services/answeredQuestionHistory.ts'),
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/config/reviewMode.ts'),
    server.ssrLoadModule('/src/utils/answeredQuestionLock.ts'),
  ]);
  const [appSource, historySource, coachSource, appsScriptSource, packageJson] = await Promise.all([
    read('src/App.tsx'), read('src/services/answeredQuestionHistory.ts'), read('src/views/CoachDashboard.tsx'), read('docs/google-apps-script/Code.gs'), read('package.json').then(JSON.parse),
  ]);
  const distFiles = await walk(join(root, 'dist')).catch(() => []);
  const distText = (await Promise.all(distFiles.map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n');
  const bundleMarkers = ['ifa-answered-question-history-v1', 'ifa-answered-question-history-sync-queue-v1', 'saveAnsweredQuestionHistory', 'getAnsweredQuestionHistory'];
  bundleMarkers.forEach((marker) => assert(distText.includes(marker), `production bundle 缺少 Sprint 39 marker：${marker}`));
  const forbiddenBundlePatterns = [/AI_GRADING_API_KEY/i, /OPENAI_API_KEY/i, /GEMINI_API_KEY/i, /AI_PROVIDER_(?:API_KEY|SECRET)/i, /sk-[A-Za-z0-9]{20,}/, /AIza[A-Za-z0-9_-]{20,}/, /(?:^|[\\/])private(?:[\\/]|$)/i, /IFA_教材庫|新建文件夹/i, /\.(?:pdf|docx)(?:['"`?\s]|$)/i, /google\.accounts|accounts\.google\.com|Google OAuth|Google Login/i];
  forbiddenBundlePatterns.forEach((pattern) => assert(!pattern.test(distText), `production bundle 含禁止內容：${pattern}`));
  assert(distText.includes('VITE_PROGRESS_API_URL') || distText.includes('script.google.com'), 'production bundle 缺少同步 endpoint');
  assert(distText.includes('VITE_PROGRESS_WRITE_KEY') || distText.includes('writeKey'), 'production bundle 缺少同步 write guard');

  const originalFetch = globalThis.fetch;
  const posts = [];
  globalThis.fetch = async (_url, init) => {
    if (init?.method === 'POST') posts.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  profile.applyProfileQuery();
  const learnerStatus = await history.recordAnsweredQuestionHistory([{ sessionId: 's39-learner', questionId: 39001, date: '2026-07-20T12:00:00.000Z', taskType: 'daily', questionType: 'single', category: '解剖生理', result: 'correct', score: 1 }]);
  assert(learnerStatus === 'synced', `Learner history sync 狀態錯誤：${learnerStatus}`);
  assert(history.loadAnsweredQuestionHistory().some((event) => event.questionId === 39001 && event.completed === true), 'Learner 完成題目未建立本機 history event');
  assert(posts.some((event) => event.action === 'saveAnsweredQuestionHistory' && event.questionId === 39001), 'Learner history event 未送往雲端');
  assert(history.loadAnsweredQuestionHistoryQueue().length === 0, '同步成功後 queue 未清除');

  window.location.search = '?profile=coach-test';
  profile.applyProfileQuery();
  const postCount = posts.length;
  const coachStatus = await history.recordAnsweredQuestionHistory([{ sessionId: 's39-coach', questionId: 39002, date: '2026-07-20T12:01:00.000Z', taskType: 'mock', questionType: 'single', category: '測試', result: 'wrong', score: 0 }]);
  assert(coachStatus === 'disabled', 'Coach-test history 應停用');
  assert(posts.length === postCount, 'Coach-test 產生 history POST');
  assert(!history.loadAnsweredQuestionHistory().some((event) => event.questionId === 39002), 'Coach-test 產生隔離 history event');

  window.location.search = '?profile=learner';
  profile.applyProfileQuery();
  scheduler.clearQuestionSchedulerState();
  const candidates = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, formal: true, isImportant: index % 3 === 0 }));
  const permanentCompleted = [1, 2, 3];
  assert(!scheduler.selectDailyQuestionIds(candidates, 20, [], permanentCompleted).some((id) => permanentCompleted.includes(id)), 'Daily 抽到雲端已完成題');
  assert(!scheduler.selectWeeklyQuestionIds(candidates, 20, [], permanentCompleted).some((id) => permanentCompleted.includes(id)), 'Weekly 抽到雲端已完成題');
  assert(reviewMode.FINAL_REVIEW_MODE === false && reviewMode.currentReviewMode === reviewMode.NORMAL_REVIEW, 'Final Review 預設未關閉');
  assert(scheduler.selectFinalReviewQuestionIds(candidates, 10).length === 0, 'Final Review 未啟用時仍抽題');

  const formal = engine.getFormalQuestionPool();
  const requiredFields = ['sourceFile','sourceChapter','sourceVersion','sourcePage','sourceEvidenceIds','evidenceExcerpt','answerBasis','sourceQualityLevel','metadataStatus'];
  const metadataViolations = formal.filter((question) => requiredFields.some((field) => !Object.prototype.hasOwnProperty.call(question, field)));
  const qualityCounts = { A: formal.filter((question) => question.sourceQualityLevel === 'A').length, B: formal.filter((question) => question.sourceQualityLevel === 'B').length, C: formal.filter((question) => question.sourceQualityLevel === 'C').length };
  assert(formal.length === 285, `正式題數應為 285，實際 ${formal.length}`);
  assert(metadataViolations.length === 0, `正式題來源欄位缺失：${metadataViolations.map((question) => question.id).join(', ')}`);
  assert(qualityCounts.A + qualityCounts.B + qualityCounts.C === formal.length, '正式題 A/B/C 分級不完整');

  storage.set('ifa-answered-question-lock-v1', JSON.stringify([1]));
  assert(lock.isQuestionProtected(1), 'answered lock 失效');
  assert(appSource.includes('if (!profile.isTest) void syncExamStarted') && appSource.includes('if (!profile.isTest && sessionId)'), 'Sprint 37A 同步 guard 遺失');
  assert(historySource.includes('saveLocallyAndQueue(events)') && historySource.includes('if (profile.isTest)'), 'history 雙保存或 Coach guard 遺失');
  assert(coachSource.includes('作答歷史分析（唯讀）'), 'Coach Dashboard 缺少唯讀學習分析');
  assert(appsScriptSource.includes("sheet('answeredQuestionHistory'") && appsScriptSource.includes("action === 'getCoachLearningAnalysis'"), 'Apps Script 缺少 history 工作表或 Coach 查詢');
  assert(packageJson.scripts['verify:sprint39'] === 'node scripts/verify-sprint39.mjs', 'package.json 缺少 verify:sprint39');
  assert(packageJson.scripts['verify:bundle-security'] === 'node scripts/verify-production-bundle-security.mjs', 'package.json 缺少 bundle security check');
  globalThis.fetch = originalFetch;

  if (errors.length) {
    console.error('SPRINT 39 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ cloudHistoryEndpoint: true, localFirstAndQueue: true, coachTestHistory: false, dailyPermanentRepeatBlocked: true, weeklyPermanentRepeatBlocked: true, finalReviewEnabled: reviewMode.FINAL_REVIEW_MODE, formalCount: formal.length, sourceQuality: qualityCounts, answeredLockPreserved: true, sprint37aIsolationPreserved: true }, null, 2));
  console.log('SPRINT 39 VERIFY PASSED');
} finally {
  await server.close();
}
