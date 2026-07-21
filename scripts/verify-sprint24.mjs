import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = { location: { search: '' }, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } };
const root = fileURLToPath(new URL('..', import.meta.url));
const base = (sessionId) => ({ sessionId, examId: 'daily', examTitle: '今日任務', examType: 'daily', startedAt: '2026-07-13T00:00:00.000Z' });
const load = async (url, key, fetchImpl) => {
  process.env.VITE_PROGRESS_API_URL = url;
  process.env.VITE_PROGRESS_WRITE_KEY = key;
  globalThis.fetch = fetchImpl;
  const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
  const service = await server.ssrLoadModule('/src/services/progressSync.ts');
  const profile = await server.ssrLoadModule('/src/utils/learnerProfile.ts');
  const coach = await server.ssrLoadModule('/src/services/coachApi.ts');
  const learnerHome = await server.ssrLoadModule('/src/services/learnerHomeApi.ts');
  const reset = await server.ssrLoadModule('/src/utils/localLearningReset.ts');
  const result = await server.ssrLoadModule('/src/components/Result.tsx');
  const dailyTask = await server.ssrLoadModule('/src/utils/dailyTaskV2.ts');
  const questionEngine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  return { service, profile, coach, learnerHome, reset, result, dailyTask, questionEngine, close: () => server.close() };
};
const okFetch = (calls) => async (_url, init) => { calls.push(JSON.parse(init.body)); return new Response(JSON.stringify({ success: true }), { status: 200 }); };
let current;
try {
  storage.clear();
  window.location.search = '';
  current = await load('', '', async () => { throw new Error('must not fetch'); });
  const bella = current.profile.getLearnerProfile();
  if (bella.learnerId !== 'bella' || bella.learnerName !== 'Bella' || bella.sourceRole !== 'learner' || bella.isTest !== false) throw new Error('default Bella profile failed');
  window.location.search = '?profile=coach-test'; const ray = current.profile.applyProfileQuery();
  if (ray.learnerId !== 'ray-test' || ray.learnerName !== 'Ray Test' || ray.sourceRole !== 'coach-test' || ray.isTest !== true) throw new Error('coach-test profile failed');
  window.location.search = '?profile=learner'; const restored = current.profile.applyProfileQuery();
  if (restored.learnerId !== 'bella' || restored.sourceRole !== 'learner' || restored.isTest !== false) throw new Error('learner profile restore failed');
  if (await current.service.syncExamStarted({ ...base('disabled'), questionCount: 5 }) !== 'disabled') throw new Error('missing URL must be disabled');
  const resultStats = current.result.getResultStats([
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '', explanation: '' },
    { id: 2, type: 'short-answer', answer: '參考答案', chapter: '', question: '', explanation: '' },
    { id: 3, type: 'essay', answer: '答題方向', chapter: '', question: '', explanation: '' },
    { id: 4, type: 'case_study', answer: '案例方向', chapter: '', question: '', explanation: '' },
    { id: 5, type: 'case', answer: '案例方向', chapter: '', question: '', explanation: '' },
  ], { 1: 'A', 2: '參考答案', 3: '答題方向', 4: '案例方向' });
  if (resultStats.autoGradedCount !== 1 || resultStats.correctCount !== 1 || resultStats.accuracy !== 100 || resultStats.pendingSelfCheckCount !== 3 || resultStats.completedCount !== 4 || resultStats.unansweredCount !== 1 || resultStats.reviewItems.length !== 5) throw new Error('Result auto/self-check/unanswered separation failed');
  storage.clear();
  const formalPool = current.questionEngine.getFormalQuestionPool();
  const formalCount = formalPool.length;
  const formalDaily = current.dailyTask.getDailyTaskV2Plan(formalPool.map((question) => question.id), [], '2026-07-13');
  if (formalCount < 41 || current.questionEngine.getQuestionsByWeek('week-2').length !== 21 || current.questionEngine.getAvailableWeeks().join(',') !== 'week-1,week-2' || formalDaily.activeQuestionIds.length !== 30 || new Set(formalDaily.activeQuestionIds).size !== 30) throw new Error('formal question pool or Daily Task v2 integration failed');
  const smallPool = Array.from({ length: 20 }, (_, index) => index + 1);
  const smallPlan = current.dailyTask.getDailyTaskV2Plan(smallPool, [], '2026-07-13');
  if (smallPlan.state.dailyTarget !== 30 || smallPlan.state.dailyDisplayLimit !== 90 || smallPlan.activeQuestionIds.length !== 20 || !smallPlan.isInsufficient || new Set(smallPlan.activeQuestionIds).size !== 20) throw new Error('Daily Task v2 must not repeat an insufficient question pool');
  storage.clear();
  const largePool = Array.from({ length: 60 }, (_, index) => index + 1);
  const dayOne = current.dailyTask.getDailyTaskV2Plan(largePool, [], '2026-07-13');
  current.dailyTask.completeDailyTaskV2Questions(dayOne.activeQuestionIds.slice(0, 10), largePool);
  const sameDay = current.dailyTask.getDailyTaskV2Plan(largePool, [], '2026-07-13');
  const dayTwo = current.dailyTask.getDailyTaskV2Plan(largePool, [], '2026-07-14');
  if (sameDay.completedCount !== 10 || sameDay.activeQuestionIds.length !== 20 || dayTwo.carryoverCount !== 20 || dayTwo.activeQuestionIds.length !== 50 || !dayTwo.activeQuestionIds.slice(0, 20).every((id, index) => id === dayOne.activeQuestionIds[index + 10]) || new Set(dayTwo.activeQuestionIds).size !== 50) throw new Error('Daily Task v2 carryover, priority, or display limit failed');
  await current.close();

  const calls = [];
  window.location.search = '?profile=coach-test';
  current = await load('https://example.invalid/sync', 'test-key', okFetch(calls));
  current.profile.applyProfileQuery();
  await current.service.syncExamStarted({ ...base('start'), questionCount: 5 }); await current.service.syncExamStarted({ ...base('start'), questionCount: 5 });
  await current.service.syncExamProgress({ ...base('progress'), answeredCount: 5, questionCount: 10, progressPercent: 50 }); await current.service.syncExamProgress({ ...base('progress'), answeredCount: 5, questionCount: 10, progressPercent: 50 });
  const completed = { ...base('complete'), questionCount: 1, answeredCount: 1, correctCount: 1, wrongCount: 0, unansweredCount: 0, score: 100, durationSeconds: 3, answers: [] };
  await current.service.syncExamCompleted(completed); await current.service.syncExamCompleted(completed);
  if (calls.length !== 3 || calls.some((body) => body.writeKey !== 'test-key' || body.learnerName !== 'Ray Test' || body.sourceRole !== 'coach-test' || body.deviceLabel !== 'ray-device' || body.isTest !== true)) throw new Error('event profile, de-duplication, or write key failed');
  await current.close();

  storage.clear(); let fail = true;
  current = await load('https://example.invalid/sync', '', async (_url, init) => { if (fail) throw new Error('offline'); return new Response(JSON.stringify({ success: true }), { status: 200 }); });
  if (await current.service.syncExamStarted({ ...base('retry'), questionCount: 1 }) !== 'pending') throw new Error('failed request was not queued');
  if (JSON.parse(storage.get('ifa-progress-sync-queue-v1')).length !== 1) throw new Error('queue not stored');
  fail = false; await current.service.retryPendingSync(); if (storage.get('ifa-progress-sync-queue-v1') !== '[]') throw new Error('successful retry did not clear queue');
  await current.close();

  storage.clear(); current = await load('https://example.invalid/sync', '', async () => { throw new Error('offline'); });
  for (let index = 0; index < 105; index += 1) await current.service.syncExamStarted({ ...base(`limit-${index}`), questionCount: 1 });
  if (JSON.parse(storage.get('ifa-progress-sync-queue-v1')).length !== 100) throw new Error('queue limit failed');
  await current.close();

  const coachCalls = [];
  current = await load('https://example.invalid/sync', '', async (url) => { const action = new URL(url).searchParams.get('action'); coachCalls.push(action); const data = action === 'getCoachSummary' ? { learnerId: 'bella', learnerName: 'Bella', totalAnsweredCount: 4 } : action === 'getRecentSessions' ? [{ sessionId: 'bella-completed', status: 'completed', score: 80 }, { sessionId: 'ray-test', learnerId: 'ray-test', isTest: true }] : { session: { sessionId: 'bella-completed', status: 'completed' }, answers: [] }; return new Response(JSON.stringify({ success: true, data }), { status: 200 }); });
  const coachSummary = await current.coach.getCoachSummary('read-key'); const coachSessions = await current.coach.getRecentSessions('read-key'); const coachDetails = await current.coach.getSessionDetails('read-key', 'bella-completed');
  if (coachSummary.learnerId !== 'bella' || coachSessions[0].sessionId !== 'bella-completed' || coachDetails.session.sessionId !== 'bella-completed' || coachCalls.join(',') !== 'getCoachSummary,getRecentSessions,getSessionDetails') throw new Error('coach API request failed');
  await current.close();

  storage.clear();
  storage.set('ifa-daily-task-v2-state', 'daily'); storage.set('ifa-daily-task-v2-draft', 'draft'); storage.set('ifa-study-progress-v1', 'progress'); storage.set('ifa-wrong-answers-v1', 'wrong'); storage.set('ifa-learner-profile-v1', 'profile'); storage.set('ifa-coach-read-key-remembered-v1', 'coach'); storage.set('ifa-progress-sync-queue-v1', 'queue');
  current = await load('https://example.invalid/sync', 'test-key', async (url) => {
    const parsedUrl = new URL(url); const action = parsedUrl.searchParams.get('action');
    if (action !== 'getLearnerHomeSummary') throw new Error('unexpected learner home action');
    const coverageSets = JSON.parse(parsedUrl.searchParams.get('coverageSets') ?? '{}');
    if (coverageSets.week1?.length !== 20 || coverageSets.week2?.length !== 21 || coverageSets.all?.length !== formalCount) throw new Error('coverage question sets missing');
    return new Response(JSON.stringify({ success: true, data: { learnerId: 'bella', learnerName: 'Bella', officialStartDate: '2026-07-14', todayAnsweredCount: 0, todayCompletedSessions: 0, weekAnsweredCount: 0, weekCompletedSessions: 0, totalAnsweredCount: 0, totalCorrectCount: 0, totalWrongCount: 0, overallAccuracy: null, recentActivities: [], wrongAnswerCount: 0, lastActivityAt: null, generatedAt: '2026-07-14T00:00:00.000Z', coverage: { week1: { practicedCount: 0, totalCount: 20, remainingCount: 20, percent: 0 }, week2: { practicedCount: 0, totalCount: 21, remainingCount: 21, percent: 0 }, all: { practicedCount: 0, totalCount: formalCount, remainingCount: formalCount, percent: 0 } } } }), { status: 200 });
  });
  const homeSummary = await current.learnerHome.getLearnerHomeSummary();
  if (homeSummary.learnerId !== 'bella' || homeSummary.officialStartDate !== '2026-07-14' || homeSummary.totalAnsweredCount !== 0 || homeSummary.coverage.week1.practicedCount !== 0 || homeSummary.coverage.all.totalCount !== formalCount) throw new Error('remote-first learner summary failed');
  current.reset.resetDailyTask();
  if (storage.has('ifa-daily-task-v2-state') || storage.has('ifa-daily-task-v2-draft') || storage.has('ifa-unanswered-questions-v1') || !storage.has('ifa-study-progress-v1') || !storage.has('ifa-learner-profile-v1') || !storage.has('ifa-coach-read-key-remembered-v1') || !storage.has('ifa-progress-sync-queue-v1')) throw new Error('daily reset scope failed');
  current.reset.resetLocalProgress();
  if (storage.has('ifa-study-progress-v1') || storage.has('ifa-wrong-answers-v1') || storage.has('ifa_exam_state') || storage.has('ifa-unanswered-questions-v1') || !storage.has('ifa-learner-profile-v1') || !storage.has('ifa-coach-read-key-remembered-v1') || !storage.has('ifa-progress-sync-queue-v1')) throw new Error('local reset scope failed');
  await current.close();

  const dashboardSource = await readFile(new URL('../src/views/CoachDashboard.tsx', import.meta.url), 'utf8');
  const resultSource = await readFile(new URL('../src/components/Result.tsx', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const examSource = await readFile(new URL('../src/components/Exam.tsx', import.meta.url), 'utf8');
  const homeSource = await readFile(new URL('../src/views/Home.tsx', import.meta.url), 'utf8');
  const practiceSource = await readFile(new URL('../src/views/PracticeCenter.tsx', import.meta.url), 'utf8');
  const appsScriptSource = await readFile(new URL('../docs/google-apps-script/Code.gs', import.meta.url), 'utf8');
  if (!dashboardSource.includes("'ifa-coach-read-key-remembered-v1'") || !dashboardSource.includes('localStorage.getItem(rememberedKey) ?? sessionStorage.getItem') || !dashboardSource.includes('localStorage.setItem(rememberedKey, nextKey)') || !dashboardSource.includes('sessionStorage.removeItem(coachReadKeyStorageKey)') || !dashboardSource.includes('localStorage.removeItem(rememberedKey)') || !dashboardSource.includes('記住此裝置') || !dashboardSource.includes('清除查看碼')) throw new Error('coach read-key remember or clear behavior missing');
  if (dashboardSource.includes('bg-white') || !dashboardSource.includes('bg-slate-900') || !dashboardSource.includes('text-slate-100') || !dashboardSource.includes('break-words') || !dashboardSource.includes('判定：')) throw new Error('coach dashboard contrast or detail labels missing');
  if (!resultSource.includes('自動判分題數') || !resultSource.includes('自動判分正確率') || !resultSource.includes('非選擇題待規準評估') || !resultSource.includes('總完成題數') || !resultSource.includes('非選擇題可使用規準輔助評分') || !resultSource.includes('不列入正式 verified 成績')) throw new Error('Result separation UI missing');
  if (!appSource.includes("isCorrect: isSelfCheckQuestion(question) ? null") || !appSource.includes("status: getAnswerStatus(question)") || !appSource.includes("'case_study', 'case'")) throw new Error('manual answer sync safety missing');
  if (!appSource.includes('dailyTaskV2DraftStorageKey') || !examSource.includes('draftStorageKey') || !appSource.includes('loadExamDraft() ?? loadExamDraft(dailyTaskV2DraftStorageKey)')) throw new Error('Daily Task v2 must keep the original exam draft separate');
  if (!homeSource.includes('getLearnerHomeSummary') || !homeSource.includes('正式進度來源：Google Sheet') || !homeSource.includes('遠端進度暫時無法讀取，以下為本機暫存') || !homeSource.includes('coach-reset-tools')) throw new Error('remote-first home source or coach reset tools missing');
  if (!homeSource.includes("remoteStatus === 'ready' && remote ? { completed: remote.weekAnsweredCount") || !homeSource.includes("remoteStatus === 'ready' && remote ? remote.recentActivities : undefined")) throw new Error('remote success must remain authoritative, including empty summaries');
  if (!appSource.includes("resetDailyTask") || !appSource.includes("resetLocalProgress") || !appSource.includes("params.get('resetDailyTask')") || !appSource.includes("params.get('resetLocalProgress')")) throw new Error('reset query handling missing');
  if (!practiceSource.includes('practice-weekly-review-card') || !appSource.includes("weeklyReview") || !appSource.includes("examType: sessionMode")) throw new Error('weekly review entry or sync mode missing');
  if (!appsScriptSource.includes("action === 'getLearnerHomeSummary'") || !appsScriptSource.includes("DEFAULT_OFFICIAL_START_DATE = '2026-07-14'") || !appsScriptSource.includes("filter(bellaOnly).filter(afterBaseline)") || !appsScriptSource.includes("verifyHomeReadKey(params)") || !appsScriptSource.includes('coverageFor(sessions, params)') || !appsScriptSource.includes('parseCoverageSets')) throw new Error('Apps Script learner summary contract missing');
  if (!homeSource.includes('week2-coverage') || !homeSource.includes('all-coverage') || !homeSource.includes('本機暫存估算')) throw new Error('remote coverage UI missing');
  if (dashboardSource.includes('GoogleLogin') || dashboardSource.includes('GoogleOAuthProvider') || appSource.includes('GoogleLogin') || appSource.includes('GoogleOAuthProvider')) throw new Error('Google Auth unexpectedly present');
  console.log('SPRINT 24 VERIFY PASSED');
} catch (error) { console.error(error); process.exitCode = 1; } finally { try { await current?.close(); } catch {} }
