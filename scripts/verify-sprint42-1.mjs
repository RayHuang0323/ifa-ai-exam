import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const protectedIds = [1, 20020, 70001];
const historyKey = 'ifa-answered-question-history-v1';
const initialHistory = JSON.stringify([{ questionId: 70001, learnerId: 'bella', completed: true }]);
const storage = new Map([
  [historyKey, initialHistory],
  ['ifa-answered-question-lock-v1', JSON.stringify(protectedIds)],
]);
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study', 'writing']);
const shortDirections = ['定義', '主要特性', '用途', '安全注意事項'];
const essayDirections = ['比較', '分析', '評估'];
const caseDirections = ['個案背景', '使用需求', '安全限制'];
const aiPromptPattern = /依(?:照)?教材|根據教材|請說明教材中的|教材如何(?:說明|描述)|教材(?:證據|证据)|AI生成|人工智慧|模型生成|提示詞|提示词/i;
const technicalSourcePattern = /(?:^|[\\/])word[\\/]document\.xml|document\.xml|段落\s*\d+|paragraph\s*\d+/i;
const answerValue = (value) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim().length > 0;
const read = (path) => readFile(join(root, path), 'utf8');

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, audit, governance, resultSource, historySource, appsScript, refinementSource] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityAudit.ts'),
    server.ssrLoadModule('/src/utils/questionQualityGovernance.ts'),
    read('src/components/Result.tsx'),
    read('src/services/answeredQuestionHistory.ts'),
    read('docs/google-apps-script/Code.gs'),
    read('src/utils/formalQuestionRefinement.ts'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const sourceVerified = engine.getSourceVerifiedQuestionPool();
  assert(formal.length === 285, `正式題數量異常：${formal.length}`);
  assert(refinementSource.includes('display-only refinement') && refinementSource.includes('shortAnswerDirection'), 'formal refinement layer 未接入或規則標記缺失');

  formal.forEach((question) => {
    const refinement = question.formalQuestionRefinement;
    const display = question.displayQuestion ?? '';
    assert(refinement && typeof refinement.changed === 'boolean', `正式題 ${question.id} 缺 formalQuestionRefinement`);
    assert(display.trim().length > 0, `正式題 ${question.id} 缺 displayQuestion`);
    assert(!aiPromptPattern.test(display), `正式題 ${question.id} displayQuestion 含 AI／教材提示語`);
    assert(!/依教材證據|根據教材證據|請依文件回答/.test(display), `正式題 ${question.id} displayQuestion 含禁用語句`);
    assert(question.questionLanguageAudit?.originalQuestion === question.question, `正式題 ${question.id} 未保留 originalQuestion`);
    assert(question.questionLanguageAudit?.hasAnswer === answerValue(question.answer), `正式題 ${question.id} answer audit 不一致`);
    if (question.type === 'shortAnswer' || question.type === 'short_answer') {
      shortDirections.forEach((direction) => assert(display.includes(direction), `正式題 ${question.id} shortAnswer 缺少「${direction}」`));
    }
    if (question.type === 'essay' || question.type === 'writing') {
      essayDirections.forEach((direction) => assert(display.includes(direction), `正式題 ${question.id} essay 缺少「${direction}」`));
    }
    if (['case', 'case-study', 'case_study'].includes(question.type)) {
      caseDirections.forEach((direction) => assert(display.includes(direction), `正式題 ${question.id} case study 缺少「${direction}」`));
    }
    assert(!technicalSourcePattern.test(String(question.displaySourceFile ?? '')), `正式題 ${question.id} 顯示 technical sourceFile`);
    assert(!technicalSourcePattern.test(String(question.displaySourceChapter ?? '')), `正式題 ${question.id} 顯示 technical sourceChapter`);
  });
  assert(formal.every((question) => nonChoiceTypes.has(question.type) ? question.questionLanguageAudit?.requiredDirections?.length > 0 : true), '正式題非選擇題缺回答方向規則');

  assert(resultSource.includes('教材名稱：') && resultSource.includes('章節：') && resultSource.includes('頁碼：') && resultSource.includes('版本：'), 'Result 缺少教材名稱／章節／頁碼／版本欄位');
  assert(resultSource.includes('缺少：教材資訊待補。'), 'Result 缺少教材資訊待補 fallback');
  assert(!resultSource.includes('教材檔案：') && !resultSource.includes('證據編號：'), 'Result 仍顯示 technical source 欄位');
  assert(!resultSource.includes('word/document.xml') && !resultSource.match(/段落\s*\d+/), 'Result 仍可能顯示技術抽取位置');
  assert(audit.displaySourceValue('word/document.xml 段落 95', '教材章節待補') === '教材章節待補', 'technical source fallback 失效');
  assert(historySource.includes('ifa-answered-question-history-v1') && historySource.includes('ifa-answered-question-history-sync-queue-v1'), 'answered history marker 遺失');
  assert(appsScript.includes('ExamSessions') && appsScript.includes('AnswerRecords') && appsScript.includes('answeredQuestionHistory') && !appsScript.includes('Sprint 42.1'), 'Apps Script 相容性檢查失敗');

  const rawPaths = ['src/data/questions/week1.json', 'src/data/questions/week2.json', 'src/data/questions/verified-extra.json', 'src/data/questions/exam-practice.json', 'src/data/questions/source-verified.json', 'src/data/questions/source-verified-sprint36.json', 'src/data/questions/source-verified-sprint37.json'];
  const rawSources = await Promise.all(rawPaths.map((path) => read(path).then(JSON.parse)));
  const rawById = new Map();
  rawSources.flat().forEach((question) => { if (!rawById.has(question.id)) rawById.set(question.id, question); });
  const formalById = new Map(formal.map((question) => [question.id, question]));
  for (const [id, raw] of rawById) {
    const runtime = formalById.get(id);
    if (!runtime) continue;
    assert(JSON.stringify(runtime.question) === JSON.stringify(raw.question), `正式題 ${id} 原始題幹被修改`);
    assert(JSON.stringify(runtime.answer) === JSON.stringify(raw.answer), `正式題 ${id} 答案被修改`);
  }
  const sourceVerifiedById = new Map(sourceVerified.map((question) => [question.id, question]));
  for (const raw of rawSources.flat().filter((question) => question.reviewStatus === 'source_verified' || question.verificationType === 'source_verified')) {
    const runtime = sourceVerifiedById.get(raw.id) ?? engine.getQuestionById(raw.id);
    assert(runtime, `source_verified ${raw.id} 無法比對`);
    if (runtime) {
      assert(JSON.stringify(runtime.answer) === JSON.stringify(raw.answer), `source_verified ${raw.id} 答案被修改`);
      assert(JSON.stringify(runtime.evidenceExcerpt) === JSON.stringify(raw.evidenceExcerpt), `source_verified ${raw.id} evidenceExcerpt 被修改`);
      assert(JSON.stringify(runtime.answerBasis) === JSON.stringify(raw.answerBasis), `source_verified ${raw.id} answerBasis 被修改`);
    }
  }
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
  const protectedSample = governance.applyQuestionQualityGovernance({ id: 70001, type: 'shortAnswer', category: '解剖生理', question: '依教材證據，「心動週期」是什麼？', answer: '原始答案', explanation: '原始解析' });
  assert(protectedSample.question === '依教材證據，「心動週期」是什麼？' && protectedSample.answer === '原始答案', 'answered lock 核心保護失效');
  assert(protectedSample.displayQuestion !== protectedSample.question, 'answered lock displayQuestion layer 失效');
  assert(storage.get(historyKey) === initialHistory, 'Bella history 被修改');

  if (errors.length) {
    console.error('SPRINT 42.1 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ formalCount: formal.length, sourceVerifiedCount: sourceVerified.length, answeredCorePreserved: true, sourceVerifiedEvidencePreserved: true, historyPreserved: true, appsScriptChanged: false, deploy: false }, null, 2));
    console.log('SPRINT 42.1 VERIFY PASSED');
  }
} finally {
  await server.close();
}

if (!errors.length) console.log('SPRINT 42.1 CORE VERIFY PASSED; BUILD AND BUNDLE SECURITY ARE CHAINED BY THE NPM SCRIPT');
