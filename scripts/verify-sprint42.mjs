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
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) },
};

const read = (path) => readFile(join(root, path), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study', 'writing']);
const aiPromptPattern = /依(?:照)?教材(?:\s*(?:證據|证据|evidence))?|根據教材(?:內容)?(?:指出|說明)?|請說明教材中的|請依文件回答|AI生成|提示詞/i;
const technicalSourcePattern = /(?:^|[\\/])word[\\/]document\.xml|document\.xml|段落\s*\d+|paragraph\s*\d+/i;
const answerValue = (value) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim().length > 0;
const summary = (questions) => {
  const needing = questions.filter((question) => question.questionLanguageAudit?.needsImprovement);
  const issueCounts = {};
  needing.forEach((question) => (question.questionLanguageAudit?.issues ?? []).forEach((issue) => { issueCounts[issue] = (issueCounts[issue] ?? 0) + 1; }));
  return { total: questions.length, nonChoice: questions.filter((question) => nonChoiceTypes.has(question.type)).length, needsImprovement: needing.length, issueCounts };
};

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, audit, governance, resultSource, historySource, appsScript, report] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityAudit.ts'),
    server.ssrLoadModule('/src/utils/questionQualityGovernance.ts'),
    read('src/components/Result.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
    read('docs/42_question_language_audit.md').catch(() => ''),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const inspect = (questions, label) => {
    questions.forEach((question) => {
      const language = question.questionLanguageAudit;
      assert(language && language.originalQuestion === question.question, `${label} ${question.id} 未保留 originalQuestion`);
      assert(typeof question.displayQuestion === 'string' && question.displayQuestion.trim().length > 0, `${label} ${question.id} 缺 displayQuestion`);
      assert(!aiPromptPattern.test(question.displayQuestion ?? ''), `${label} ${question.id} displayQuestion 含 AI 提示語`);
      assert(!/依教材證據|根據教材證據|請依文件回答/.test(question.displayQuestion ?? ''), `${label} ${question.id} displayQuestion 含禁用語句`);
      assert(!technicalSourcePattern.test(String(question.displaySourceFile ?? '')), `${label} ${question.id} 顯示 technical sourceFile`);
      assert(!technicalSourcePattern.test(String(question.displaySourceChapter ?? '')), `${label} ${question.id} 顯示 technical sourceChapter`);
      assert(!technicalSourcePattern.test(String(question.displaySourceLocation ?? '')), `${label} ${question.id} 顯示 technical sourceLocation`);
      assert(language?.hasAnswer === answerValue(question.answer), `${label} ${question.id} answer audit 不一致`);
      assert(language?.hasExplanation === Boolean(question.explanation?.trim()), `${label} ${question.id} explanation audit 不一致`);
      if (nonChoiceTypes.has(question.type)) assert(language?.requiredDirections?.length > 0, `${label} ${question.id} 非選擇題缺回答方向規則`);
    });
  };
  inspect(formal, '正式題');
  inspect(daily, 'Daily');
  assert(formal.length === 285, `正式題數量異常：${formal.length}`);
  assert(formal.every((question) => question.questionLanguageAudit), '正式題 questionLanguageAudit 缺失');
  assert(daily.every((question) => question.questionLanguageAudit), 'Daily questionLanguageAudit 缺失');
  assert(report.includes('Sprint 42') && report.includes('正式題') && report.includes('Daily'), 'Sprint 42 audit 報告缺失');
  assert(resultSource.includes('【答案重點】') && resultSource.includes('【解析】') && resultSource.includes('【來源】'), 'Result 缺少標準解析格式');
  assert(resultSource.includes('教材位置：') && !resultSource.includes('word/document.xml') && audit.displaySourceValue('word/document.xml 段落 95', '教材章節待補') === '教材章節待補', 'Result 仍可能顯示 technical source');
  assert(historySource.includes('ifa-answered-question-history-v1') && historySource.includes('ifa-answered-question-history-sync-queue-v1'), 'history marker 遺失');
  assert(appsScript.includes('ExamSessions') && appsScript.includes('AnswerRecords') && appsScript.includes('answeredQuestionHistory') && !appsScript.includes('Sprint 42'), 'Apps Script 相容性檢查失敗');

  const rawSources = await Promise.all(['src/data/questions/week1.json', 'src/data/questions/exam-practice.json', 'src/data/questions/source-verified.json', 'src/data/questions/source-verified-sprint36.json', 'src/data/questions/source-verified-sprint37.json'].map((path) => read(path).then(JSON.parse)));
  const rawById = new Map(rawSources.flat().map((question) => [question.id, question]));
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
  for (const raw of rawSources.flat().filter((question) => question.reviewStatus === 'source_verified' || question.verificationType === 'source_verified')) {
    const runtime = engine.getQuestionById(raw.id);
    if (!runtime) continue;
    assert(JSON.stringify(runtime.answer) === JSON.stringify(raw.answer), `source_verified ${raw.id} 答案被修改`);
    assert(JSON.stringify(runtime.evidenceExcerpt) === JSON.stringify(raw.evidenceExcerpt), `source_verified ${raw.id} evidenceExcerpt 被修改`);
    assert(JSON.stringify(runtime.answerBasis) === JSON.stringify(raw.answerBasis), `source_verified ${raw.id} answerBasis 被修改`);
  }
  assert(storage.get(historyKey) === initialHistory, 'Bella history 被修改');
  const protectedSample = governance.applyQuestionQualityGovernance({ id: 70001, type: 'shortAnswer', category: '解剖生理', question: '依教材證據，「心動週期」是什麼？', answer: '原始答案', explanation: '原始解析' });
  assert(protectedSample.question === '依教材證據，「心動週期」是什麼？' && protectedSample.answer === '原始答案', 'answered lock 核心保護失效');
  assert(protectedSample.displayQuestion !== protectedSample.question, 'displayQuestion 未與原始題幹分離');
  if (errors.length) {
    console.error('SPRINT 42 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formal: summary(formal), daily: summary(daily), answeredCorePreserved: true, sourceVerifiedEvidencePreserved: true, historyPreserved: true, appsScriptChanged: false, deploy: false }, null, 2));
  console.log('SPRINT 42 VERIFY PASSED');
} finally {
  await server.close();
}
