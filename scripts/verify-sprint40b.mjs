import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const protectedIds = [1, 20020, 70001];
const historyKey = 'ifa-answered-question-history-v1';
const initialHistory = JSON.stringify([{ questionId: 70001, learnerId: 'bella', completed: true }]);
const storage = new Map([[historyKey, initialHistory], ['ifa-answered-question-lock-v1', JSON.stringify(protectedIds)]]);
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const read = (path) => readFile(join(root, path), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const choiceTypes = new Set(['multipleChoice', 'multiSelect', 'single', 'multiple']);
const candidate = (question, formal = false) => ({
  id: question.id,
  formal,
  questionConfidence: question.questionConfidence,
  practiceOnly: question.practiceOnly,
  formalScoreEligible: question.formalScoreEligible,
  isActive: question.isActive,
  excludeFromPractice: question.excludeFromPractice,
  qualityStatus: question.qualityStatus,
});

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, scheduler, appSource, historySource, appsScript] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    read('src/App.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const confidenceCounts = { A: 0, B: 0, C: 0 };
  formal.forEach((question) => { confidenceCounts[question.questionConfidence] += 1; });
  assert(formal.length === 285, `正式題池數量異常：${formal.length}`);
  assert(confidenceCounts.A === 0 && confidenceCounts.B === 284 && confidenceCounts.C === 1, `分級數量異常：${JSON.stringify(confidenceCounts)}`);
  assert(formal.every((question) => ['A', 'B', 'C'].includes(question.questionConfidence)), '正式題缺少 questionConfidence');

  const fullMockCandidates = formal.map((question) => candidate(question, true));
  const mockIds = scheduler.selectMockQuestionIds(fullMockCandidates, formal.length);
  const cIds = new Set(formal.filter((question) => question.questionConfidence === 'C').map((question) => question.id));
  assert(mockIds.length === 284, `Full Mock 可用題數應為 284，實際 ${mockIds.length}`);
  assert(!mockIds.some((id) => cIds.has(id)), 'Full Mock 混入 C 級題');
  assert(appSource.includes('questionConfidence !== \'C\'') && appSource.includes('questionConfidence: question.questionConfidence'), 'App 未接入 Full Mock 分級邊界');

  const dailyCandidates = daily.map((question) => candidate(question, question.questionConfidence !== 'C'));
  const daily20 = scheduler.selectDailyQuestionIds(dailyCandidates, 20);
  const daily40 = scheduler.selectDailyQuestionIds(dailyCandidates, 40);
  const dailyC20 = daily20.filter((id) => daily.find((question) => question.id === id)?.questionConfidence === 'C').length;
  const dailyC40 = daily40.filter((id) => daily.find((question) => question.id === id)?.questionConfidence === 'C').length;
  assert(daily20.length === 20 && dailyC20 <= 2, `Daily 20 題 C 級比例超過 10%：${daily20.length}/${dailyC20}`);
  assert(daily40.length === 40 && dailyC40 <= 4, `Daily 40 題 C 級比例超過 10%：${daily40.length}/${dailyC40}`);

  const rawSources = await Promise.all(['src/data/questions/week1.json', 'src/data/questions/exam-practice.json', 'src/data/questions/source-verified.json'].map((path) => read(path).then(JSON.parse)));
  const rawById = new Map(rawSources.flat().filter((question) => protectedIds.includes(question.id)).map((question) => [question.id, question]));
  for (const id of protectedIds) {
    const raw = rawById.get(id);
    const runtime = engine.getQuestionById(id);
    assert(raw && runtime, `已作答題 ${id} 無法比對`);
    if (raw && runtime) {
      assert(JSON.stringify(runtime.question) === JSON.stringify(raw.question), `已作答題 ${id} 題幹被修改`);
      assert(JSON.stringify(runtime.answer) === JSON.stringify(raw.answer), `已作答題 ${id} 答案被修改`);
      assert(JSON.stringify(runtime.options ?? []) === JSON.stringify(raw.options ?? []), `已作答題 ${id} 選項被修改`);
    }
  }
  assert(storage.get(historyKey) === initialHistory, 'Bella answeredQuestionHistory 被修改');
  assert(historySource.includes('ifa-answered-question-history-v1'), 'Bella history marker 遺失');
  assert(appsScript.includes('ExamSessions') && appsScript.includes('AnswerRecords') && appsScript.includes('answeredQuestionHistory') && !appsScript.includes('Sprint 40B'), 'Apps Script 相容性檢查失敗');

  if (errors.length) {
    console.error('SPRINT 40B VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formalCount: formal.length, confidenceCounts, fullMockCount: mockIds.length, dailyCount: daily.length, daily20CCount: dailyC20, daily40CCount: dailyC40, answeredCorePreserved: true, historyPreserved: true, appsScriptChanged: false, deploy: false }, null, 2));
  console.log('SPRINT 40B VERIFY PASSED');
} finally {
  await server.close();
}
