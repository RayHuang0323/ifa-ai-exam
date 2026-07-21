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
const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study']);

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, audit, scheduler, appSource, historySource, appsScript, report] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityAudit.ts'),
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    read('src/App.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
    read('docs/41_B級題品質評估報告.md'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const confidenceCounts = { 'A+': 0, A: 0, B: 0, C: 0 };
  const bReviewCounts = { upgrade_to_A: 0, keep_B: 0, downgrade_to_practice: 0 };
  formal.forEach((question) => {
    confidenceCounts[question.answerConfidence] += 1;
    if (question.bQualityReview) bReviewCounts[question.bQualityReview.disposition] += 1;
  });
  assert(formal.length === 285, `正式題池數量異常：${formal.length}`);
  assert(JSON.stringify(confidenceCounts) === JSON.stringify({ 'A+': 26, A: 214, B: 44, C: 1 }), `answerConfidence 分布異常：${JSON.stringify(confidenceCounts)}`);
  assert(JSON.stringify(bReviewCounts) === JSON.stringify({ upgrade_to_A: 152, keep_B: 44, downgrade_to_practice: 0 }), `B級評估分布異常：${JSON.stringify(bReviewCounts)}`);
  assert(formal.every((question) => Array.isArray(question.metadataMissingFields)), '正式題缺少 metadataMissingFields');
  assert(formal.every((question) => question.questionNaturalnessAudit && typeof question.questionNaturalnessAudit.natural === 'boolean'), 'questionNaturalnessAudit 缺失');
  assert(formal.filter((question) => nonChoiceTypes.has(question.type)).every((question) => !/^「[^」]+」是什麼[？?]$/.test(question.displayQuestion ?? question.question)), '非選擇題仍有過短 XX 是什麼題幹');

  const fullMockCandidates = formal.map((question) => candidate(question, true));
  const fullMockIds = scheduler.selectMockQuestionIds(fullMockCandidates, formal.length);
  const formalById = new Map(formal.map((question) => [question.id, question]));
  const fullMockB = fullMockIds.filter((id) => formalById.get(id)?.answerConfidence === 'B').length;
  const fullMockC = fullMockIds.filter((id) => formalById.get(id)?.answerConfidence === 'C').length;
  assert(fullMockIds.length === 284, `Full Mock 題數應為 284，實際 ${fullMockIds.length}`);
  assert(fullMockB / Math.max(1, fullMockIds.length) <= 0.2, `Full Mock B級超過20%：${fullMockB}/${fullMockIds.length}`);
  assert(fullMockC === 0, 'Full Mock 混入 C 級題');
  assert(appSource.includes('answerConfidence: question.answerConfidence') && appSource.includes("question.answerConfidence !== 'C'"), 'App 未接入正式可信度邊界');

  const dailyCandidates = daily.map((question) => candidate(question, question.answerConfidence !== 'C'));
  const daily20 = scheduler.selectDailyQuestionIds(dailyCandidates, 20);
  const daily40 = scheduler.selectDailyQuestionIds(dailyCandidates, 40);
  const dailyById = new Map(daily.map((question) => [question.id, question]));
  const dailyC20 = daily20.filter((id) => dailyById.get(id)?.answerConfidence === 'C').length;
  const dailyC40 = daily40.filter((id) => dailyById.get(id)?.answerConfidence === 'C').length;
  assert(daily20.length === 20 && dailyC20 <= 2, `Daily 20 題 C級超過10%：${daily20.length}/${dailyC20}`);
  assert(daily40.length === 40 && dailyC40 <= 4, `Daily 40 題 C級超過10%：${daily40.length}/${dailyC40}`);
  assert(daily20.slice(0, 18).every((id) => isTop(dailyById.get(id))), 'Daily 未優先 A+/A');
  assert(daily40.slice(0, 36).every((id) => isTop(dailyById.get(id))), 'Daily 40 題未優先 A+/A');

  const imageQuestions = formal.filter((question) => question.imageRequired === true);
  assert(imageQuestions.every((question) => Object.prototype.hasOwnProperty.call(question, 'imageReference')), '圖片題缺少 imageReference');
  assert(imageQuestions.filter((question) => question.imageMissing).every((question) => question.imageReference === null && !audit.hasImageDependency(question.displayQuestion ?? question.question)), '缺圖題仍依賴圖片題幹或 imageReference 錯誤');
  assert((report.match(/^\| \d+ \| (upgrade_to_A|keep_B|downgrade_to_practice) \|/gm) ?? []).length === 196, 'B級評估報告未列完整196題');

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
  assert(historySource.includes('ifa-answered-question-history-v1') && historySource.includes('ifa-answered-question-history-sync-queue-v1'), 'history sync marker 遺失');
  assert(appsScript.includes('ExamSessions') && appsScript.includes('AnswerRecords') && appsScript.includes('answeredQuestionHistory') && !appsScript.includes('Sprint 41'), 'Apps Script 相容性檢查失敗');

  if (errors.length) {
    console.error('SPRINT 41 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formalCount: formal.length, confidenceCounts, bReviewCounts, fullMockCount: fullMockIds.length, fullMockBCount: fullMockB, dailyCount: daily.length, daily20CCount: dailyC20, daily40CCount: dailyC40, imageQuestionCount: imageQuestions.length, answeredCorePreserved: true, historyPreserved: true, appsScriptChanged: false, deploy: false }, null, 2));
  console.log('SPRINT 41 VERIFY PASSED');
} finally {
  await server.close();
}
