import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const read = (path) => readFile(join(root, path), 'utf8');
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
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study', 'writing']);

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, grading, governance] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/localRubricGrading.ts'),
    server.ssrLoadModule('/src/utils/questionQualityGovernance.ts'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const nonChoice = daily.filter((question) => nonChoiceTypes.has(question.type));
  const rubricMissing = nonChoice.filter((question) => {
    const rubric = question.rubric;
    return !rubric || Array.isArray(rubric) || !Array.isArray(rubric.requiredConcepts) || !Array.isArray(rubric.fullScore) || !Array.isArray(rubric.partialScore) || !Array.isArray(rubric.lowScore) || !Array.isArray(rubric.zeroScore) || !Array.isArray(rubric.forbiddenPatterns) || typeof rubric.minimumAnswerLength !== 'number';
  });
  assert(formal.length === 285, `正式題數異常：${formal.length}`);
  assert(rubricMissing.length === 0, `非選擇題 rubric metadata 缺失：${rubricMissing.map((question) => question.id).join(', ')}`);

  const rubric = {
    fullScore: ['主要概念完整'],
    partialScore: ['缺少部分重要概念'],
    lowScore: ['只有片面描述'],
    zeroScore: ['空白、無關、測試或灌水文字'],
    requiredConcepts: ['\u5b55\u5a66', '\u5152\u7ae5', '\u75be\u75c5\u53f2', '\u7528\u85e5\u72c0\u6cc1', '\u8f49\u4ecb'],
    forbiddenPatterns: ['\u4e0d\u77e5\u9053', 'test', 'abc'],
    minimumAnswerLength: 10,
  };
  const gradingInput = {
    questionId: 40001,
    sessionId: 'sprint40-verify',
    examType: 'daily',
    question: '\u5b89\u5168\u4f7f\u7528\u7cbe\u6cb9\u6ce8\u610f\u4e8b\u9805',
    type: 'shortAnswer',
    referenceAnswer: 'source',
    sampleAnswer: 'source',
    keyPoints: rubric.requiredConcepts,
    rubric,
    category: '\u5b89\u5168',
    sourceLabel: '\u6559\u6750',
    sourceFile: 'source.docx',
    sourcePage: '1',
    sourceChapter: '\u5b89\u5168',
    sourceVersion: 'v1',
    answerBasis: '\u6559\u6750\u6839\u64da',
    evidenceExcerpt: '\u6559\u6750\u6458\u9304',
  };
  const noiseReview = grading.gradeWithLocalRubric({ ...gradingInput, userAnswer: 'testtest' });
  const validReview = grading.gradeWithLocalRubric({ ...gradingInput, userAnswer: '\u9700\u8981\u6ce8\u610f\u5b55\u5a66\u3001\u5152\u7ae5\u53ca\u75be\u75c5\u7528\u85e5\u72c0\u6cc1\uff0c\u5fc5\u8981\u6642\u8f49\u4ecb\u5c08\u696d\u4eba\u54e1\u3002' });
  assert(noiseReview.aiScoreSuggestion === 0 && noiseReview.aiReviewStatus === 'not_mastered', 'testtest 未被判為 0 分');
  assert(validReview.aiScoreSuggestion === 3 && validReview.aiReviewStatus === 'mastered', '完整安全回答未取得高分');

  storage.set('ifa-answered-question-lock-v1', JSON.stringify([70001]));
  const rawQuestion = '依教材證據，「心动周期」是什麼？';
  const rawAnswer = '从一次心跳的起始到下一次心跳的起始';
  const protectedQuestion = governance.applyQuestionQualityGovernance({ id: 70001, type: 'shortAnswer', question: rawQuestion, answer: rawAnswer, keyPoints: ['心動週期'], rubric: [{ score: 3, label: '掌握', description: '完整' }] });
  assert(protectedQuestion.question === rawQuestion && protectedQuestion.answer === rawAnswer, '已作答題核心欄位被修改');
  assert(protectedQuestion.rubric && !Array.isArray(protectedQuestion.rubric) && Array.isArray(protectedQuestion.rubric.requiredConcepts), '已作答題未取得 rubric metadata');

  const [resultSource, historySource, appsScriptSource] = await Promise.all([
    read('src/components/Result.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
  ]);
  assert(resultSource.includes('高分回答應包含') && resultSource.includes('教材名稱：') && resultSource.includes('來源資料待補'), 'Result 未完整顯示 Sprint 40 內容');
  assert(historySource.includes('ifa-answered-question-history-v1') && historySource.includes('ifa-answered-question-history-sync-queue-v1'), 'answeredQuestionHistory marker 遺失');
  assert(appsScriptSource.includes('ExamSessions') && appsScriptSource.includes('AnswerRecords') && appsScriptSource.includes('answeredQuestionHistory') && !appsScriptSource.includes('Sprint 40'), 'Apps Script 相容性檢查失敗');

  const distFiles = await walk(join(root, 'dist')).catch(() => []);
  const distText = (await Promise.all(distFiles.map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n');
  const forbidden = [/OPENAI_API_KEY/i, /GEMINI_API_KEY/i, /AI_PROVIDER_(?:API_KEY|SECRET)/i, /sk-[A-Za-z0-9]{20,}/, /AIza[A-Za-z0-9_-]{20,}/, /Google OAuth|Google Login|accounts\.google\.com/i, /private[\\/].*\.(?:pdf|docx)/i];
  forbidden.forEach((pattern) => assert(!pattern.test(distText), `production bundle 含禁止內容：${pattern}`));

  if (errors.length) {
    console.error('SPRINT 40 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formalCount: formal.length, nonChoiceCount: nonChoice.length, rubricMissing: 0, noiseScore: noiseReview.aiScoreSuggestion, validScore: validReview.aiScoreSuggestion, answeredCorePreserved: true, historyPreserved: true, appsScriptChanged: false, forbiddenBundleSecrets: false, deploy: false }, null, 2));
  console.log('SPRINT 40 VERIFY PASSED');
} finally {
  await server.close();
}
