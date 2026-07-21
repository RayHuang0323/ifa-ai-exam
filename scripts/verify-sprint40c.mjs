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
const candidate = (question, formal = false) => ({
  id: question.id,
  formal,
  answerConfidence: question.answerConfidence,
  questionConfidence: question.questionConfidence,
  practiceOnly: question.practiceOnly,
  formalScoreEligible: question.formalScoreEligible,
  isActive: question.isActive,
  excludeFromPractice: question.excludeFromPractice,
  qualityStatus: question.qualityStatus,
});
const isTop = (question) => question?.answerConfidence === 'A+' || question?.answerConfidence === 'A';

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, audit, scheduler, appSource, historySource, appsScript] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityAudit.ts'),
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    read('src/App.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const confidenceCounts = { 'A+': 0, A: 0, B: 0, C: 0 };
  const metadataCounts = { complete: 0, partial: 0, missing: 0 };
  formal.forEach((question) => {
    confidenceCounts[question.answerConfidence] += 1;
    metadataCounts[question.metadataCompleteness] += 1;
  });
  assert(formal.length === 285, `正式題池數量異常：${formal.length}`);
  assert(JSON.stringify(confidenceCounts) === JSON.stringify({ 'A+': 26, A: 62, B: 196, C: 1 }), `answerConfidence 分布異常：${JSON.stringify(confidenceCounts)}`);
  assert(JSON.stringify(metadataCounts) === JSON.stringify({ complete: 0, partial: 244, missing: 41 }), `metadataCompleteness 分布異常：${JSON.stringify(metadataCounts)}`);
  assert(formal.every((question) => ['A+', 'A', 'B', 'C'].includes(question.answerConfidence) && ['complete', 'partial', 'missing'].includes(question.metadataCompleteness)), '雙軸 metadata 缺失');
  assert(formal.every((question) => question.questionNaturalnessAudit && typeof question.questionNaturalnessAudit.natural === 'boolean'), 'questionNaturalnessAudit 缺失');
  assert(daily.every((question) => !audit.hasAiGeneratedWording(question.displayQuestion ?? question.question)), 'Daily 顯示層仍含 AI／教材提示語');

  const fullMockCandidates = formal.map((question) => candidate(question, true));
  const fullMockIds = scheduler.selectMockQuestionIds(fullMockCandidates, formal.length);
  const cIds = new Set(formal.filter((question) => question.answerConfidence === 'C').map((question) => question.id));
  assert(fullMockIds.length === 284, `Full Mock 合法題數應為 284，實際 ${fullMockIds.length}`);
  assert(!fullMockIds.some((id) => cIds.has(id)), 'Full Mock 混入 C 級題');
  assert(appSource.includes("question.answerConfidence !== 'C'") && appSource.includes('answerConfidence: question.answerConfidence'), 'App 未接入 answerConfidence Full Mock 邊界');

  const dailyCandidates = daily.map((question) => candidate(question, question.answerConfidence !== 'C'));
  const daily20 = scheduler.selectDailyQuestionIds(dailyCandidates, 20);
  const daily40 = scheduler.selectDailyQuestionIds(dailyCandidates, 40);
  const byId = new Map(daily.map((question) => [question.id, question]));
  const dailyC20 = daily20.filter((id) => byId.get(id)?.answerConfidence === 'C').length;
  const dailyC40 = daily40.filter((id) => byId.get(id)?.answerConfidence === 'C').length;
  assert(daily20.length === 20 && dailyC20 <= 2, `Daily 20 題 C 級超過 10%：${daily20.length}/${dailyC20}`);
  assert(daily40.length === 40 && dailyC40 <= 4, `Daily 40 題 C 級超過 10%：${daily40.length}/${dailyC40}`);
  assert(daily20.slice(0, 18).every((id) => isTop(byId.get(id))), 'Daily 未優先使用 A+/A 題');
  assert(daily40.slice(0, 36).every((id) => isTop(byId.get(id))), 'Daily 40 題未優先使用 A+/A 題');

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
  assert(storage.get(historyKey) === initialHistory, 'Bella history 被修改');
  assert(historySource.includes('ifa-answered-question-history-v1') && historySource.includes('ifa-answered-question-history-sync-queue-v1'), 'answeredQuestionHistory marker 遺失');
  assert(appsScript.includes('ExamSessions') && appsScript.includes('AnswerRecords') && appsScript.includes('answeredQuestionHistory') && !appsScript.includes('Sprint 40C'), 'Apps Script 相容性檢查失敗');

  if (errors.length) {
    console.error('SPRINT 40C VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formalCount: formal.length, confidenceCounts, metadataCounts, fullMockCount: fullMockIds.length, dailyCount: daily.length, daily20CCount: dailyC20, daily40CCount: dailyC40, naturalnessAudit: true, answeredCorePreserved: true, historyPreserved: true, appsScriptChanged: false, deploy: false }, null, 2));
  console.log('SPRINT 40C VERIFY PASSED');
} finally {
  await server.close();
}
