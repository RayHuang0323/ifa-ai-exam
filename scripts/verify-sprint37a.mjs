import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const storage = new Map();
globalThis.window = {
  location: { search: '' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

process.env.VITE_PROGRESS_API_URL = 'https://sprint37a-test.invalid/progress';
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const learnerProgress = { version: 1, sessions: [], lastStudyDate: null, currentStreak: 0, longestStreak: 0 };

try {
  const [profile, sync, study, reset, lock] = await Promise.all([
    server.ssrLoadModule('/src/utils/learnerProfile.ts'),
    server.ssrLoadModule('/src/services/progressSync.ts'),
    server.ssrLoadModule('/src/utils/studyProgress.ts'),
    server.ssrLoadModule('/src/utils/localLearningReset.ts'),
    server.ssrLoadModule('/src/utils/answeredQuestionLock.ts'),
  ]);
  const [appSource, syncSource, homeSource, resetSource, packageSource, appsScriptStatus] = await Promise.all([
    read('src/App.tsx'),
    read('src/services/progressSync.ts'),
    read('src/views/Home.tsx'),
    read('src/utils/localLearningReset.ts'),
    read('package.json').then(JSON.parse),
    execFileAsync('git', ['diff', '--name-only', '--', 'docs/google-apps-script']),
  ]);

  assert(appSource.includes('if (!profile.isTest) void syncExamStarted'), 'App 缺少 Coach start sync guard');
  assert(appSource.includes('if (profile.isTest || !sessionId) return;'), 'App 缺少 Coach progress checkpoint guard');
  assert(appSource.includes('if (!profile.isTest && sessionId)'), 'App 缺少 Coach completed sync guard');
  assert(appSource.includes('if (!profile.isTest) {'), 'App 缺少正式本機紀錄 guard');
  assert(syncSource.includes('if (profile.isTest || event.isTest) return \'disabled\';'), 'progressSync 缺少 Coach POST guard');
  assert(syncSource.includes('getProfileStorageKey(pendingSyncKey)'), '同步 queue 未做 profile 隔離');
  assert(resetSource.includes('getProfileStorageKey(key)'), '重置流程未做 profile 隔離');
  assert(homeSource.includes('重置本瀏覽器今日任務'), '今日任務重置文字未更新');
  assert(homeSource.includes('重置本瀏覽器測試資料'), '測試資料重置文字未更新');
  assert(homeSource.includes('只影響此裝置，不影響 Google Sheet 或正式學習紀錄'), '今日任務重置說明未更新');
  assert(homeSource.includes('只清除此裝置測試資料，不影響 learner 紀錄'), '測試資料重置說明未更新');
  assert(packageSource.scripts['verify:sprint37a'] === 'node scripts/verify-sprint37a.mjs', 'package.json 缺少 verify:sprint37a');
  assert(appsScriptStatus.stdout.trim() === '', 'Sprint 37A 不得修改 Apps Script');

  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }); };

  window.location.search = '?profile=coach-test';
  profile.applyProfileQuery();
  const rawBefore = JSON.stringify(learnerProgress);
  window.localStorage.setItem('ifa-study-progress-v1', rawBefore);
  const coachStatus = await sync.syncExamCompleted({ sessionId: 'coach-test-session', examId: 'coach-test', examTitle: 'Coach Test', examType: 'formal-exam', startedAt: new Date().toISOString(), questionCount: 1, answeredCount: 1, correctCount: 1, wrongCount: 0, unansweredCount: 0, score: 100, durationSeconds: 1, answers: [] });
  assert(coachStatus === 'disabled', `Coach sync 應停用，實際 ${coachStatus}`);
  assert(fetchCalls === 0, 'Coach Test 呼叫了正式同步 fetch');
  study.recordStudySession({ id: 'coach-local-session', date: '2026-07-19', weekId: 'all-weeks', mode: 'formal-exam', answeredCount: 1, correctCount: 1, wrongCount: 0, durationSeconds: 1, completedAt: new Date().toISOString() });
  assert(window.localStorage.getItem('ifa-study-progress-v1') === rawBefore, 'Coach Test 改寫 Bella study progress');
  assert(window.localStorage.getItem('ifa-coach-test-ifa-study-progress-v1') !== null, 'Coach Test 未寫入隔離 study key');
  lock.protectQuestionIds([37901]);
  assert(window.localStorage.getItem('ifa-answered-question-lock-v1') === null, 'Coach Test 改寫 Bella answered lock');
  assert(window.localStorage.getItem('ifa-coach-test-ifa-answered-question-lock-v1') !== null, 'Coach lock 未隔離');

  window.localStorage.setItem('ifa-daily-task-v2-state', 'learner-daily');
  window.localStorage.setItem('ifa-coach-test-ifa-daily-task-v2-state', 'coach-daily');
  reset.resetDailyTask();
  assert(window.localStorage.getItem('ifa-daily-task-v2-state') === 'learner-daily', 'Coach reset 清除了 learner Daily key');
  assert(window.localStorage.getItem('ifa-coach-test-ifa-daily-task-v2-state') === null, 'Coach reset 未清除測試 Daily key');

  window.location.search = '?profile=learner';
  profile.applyProfileQuery();
  const learnerStatus = await sync.syncExamStarted({ sessionId: 'learner-sync-session', examId: 'formal-exam', examTitle: 'Learner Test', examType: 'formal-exam', startedAt: new Date().toISOString(), questionCount: 1 });
  assert(learnerStatus === 'synced', `Learner sync 未維持可用，實際 ${learnerStatus}`);
  assert(fetchCalls === 1, 'Learner sync 未呼叫正式同步 fetch');
  assert(study.loadStudyProgress().sessions.length === 0, 'Learner 讀取到 Coach study progress');
  assert(window.localStorage.getItem('ifa-study-progress-v1') === rawBefore, 'Learner 原有 study progress 被改寫');
  globalThis.fetch = originalFetch;
} finally {
  await server.close();
}

if (errors.length) {
  console.error('SPRINT 37A VERIFY FAILED');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({ coachProgressSync: false, coachLocalStoragePrefix: 'ifa-coach-test-', learnerSyncPreserved: true, resetScoped: true, answeredLockScoped: true, appsScriptChanged: false }, null, 2));
console.log('SPRINT 37A VERIFY PASSED');
