import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const protectedIds = [1, 20020, 70001];
const storage = new Map([['ifa-answered-question-lock-v1', JSON.stringify(protectedIds)]]);
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
const choiceTypes = new Set(['multipleChoice', 'multiSelect', 'single', 'multiple']);

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [engine, audit] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityAudit.ts'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const sourceVerified = engine.getSourceVerifiedQuestionPool();
  const promptViolations = daily.filter((question) => audit.hasAiGeneratedWording(question.displayQuestion ?? question.question));
  const metadataMissing = daily.filter((question) => !question.questionQuality || typeof question.questionQuality.requiresRevision !== 'boolean' || typeof question.questionQuality.revisionReason !== 'string');
  assert(formal.length === 285, `正式題數異常：${formal.length}`);
  assert(promptViolations.length === 0, `顯示題幹仍含教材／AI 提示語：${promptViolations.map((question) => question.id).join(', ')}`);
  assert(metadataMissing.length === 0, `questionQuality metadata 缺失：${metadataMissing.map((question) => question.id).join(', ')}`);

  const formalChoices = audit.prepareQuestionSequence(formal).filter((question) => choiceTypes.has(question.type) && question.options?.length);
  const dailyChoices = audit.prepareQuestionSequence(daily).filter((question) => choiceTypes.has(question.type) && question.options?.length);
  const highLeakage = [...formalChoices, ...dailyChoices].filter((question) => question.optionQuality?.leakageRisk === 'high');
  const optionMetadataMissing = dailyChoices.filter((question) => !question.optionQuality || question.optionQuality.answerPosition === null);
  assert(highLeakage.length === 0, `選項仍有高風險答案洩漏：${highLeakage.map((question) => question.id).join(', ')}`);
  assert(optionMetadataMissing.length === 0, `optionQuality metadata 或答案位置缺失：${optionMetadataMissing.map((question) => question.id).join(', ')}`);

  const [week1, practice, sourceBatch] = await Promise.all([
    read('src/data/questions/week1.json').then(JSON.parse),
    read('src/data/questions/exam-practice.json').then(JSON.parse),
    read('src/data/questions/source-verified.json').then(JSON.parse),
  ]);
  const rawById = new Map([...week1, ...practice, ...sourceBatch].filter((question) => protectedIds.includes(question.id)).map((question) => [question.id, question]));
  for (const id of protectedIds) {
    const raw = rawById.get(id);
    const runtime = engine.getQuestionById(id);
    assert(raw && runtime, `無法比對已作答題 ${id}`);
    if (raw && runtime) {
      assert(JSON.stringify(runtime.question) === JSON.stringify(raw.question), `已作答題 ${id} 題幹被修改`);
      assert(JSON.stringify(runtime.answer) === JSON.stringify(raw.answer), `已作答題 ${id} 答案被修改`);
      assert(JSON.stringify(runtime.options ?? []) === JSON.stringify(raw.options ?? []), `已作答題 ${id} 選項被修改`);
    }
  }

  const imageQuestions = daily.filter((question) => question.imageRequired === true);
  const imageMetadataMissing = imageQuestions.filter((question) => typeof question.imageSource !== 'string' || !question.imageAlt || typeof question.imageMissing !== 'boolean');
  const missingImagePromptViolations = imageQuestions.filter((question) => question.imageMissing && audit.hasImageDependency(question.displayQuestion ?? question.question));
  assert(imageMetadataMissing.length === 0, `圖片需求題 metadata 不完整：${imageMetadataMissing.map((question) => question.id).join(', ')}`);
  assert(missingImagePromptViolations.length === 0, `缺圖題仍顯示圖片依賴題幹：${missingImagePromptViolations.map((question) => question.id).join(', ')}`);

  const dispositions = { KEEP: 0, REVISE: 0, DOWNGRADE: 0 };
  sourceVerified.forEach((question) => { if (question.sourceReview?.disposition in dispositions) dispositions[question.sourceReview.disposition] += 1; });
  assert(Object.values(dispositions).reduce((total, count) => total + count, 0) === sourceVerified.length, 'source_verified 分類不完整');
  const downgraded = sourceVerified.filter((question) => question.sourceReview?.disposition === 'DOWNGRADE');
  assert(downgraded.every((question) => question.practiceOnly === true && question.formalScoreEligible === false), `DOWNGRADE 未限制為練習題：${downgraded.map((question) => question.id).join(', ')}`);

  const [examSource, resultSource, appsScriptSource] = await Promise.all([
    read('src/components/Exam.tsx'),
    read('src/components/Result.tsx'),
    read('docs/google-apps-script/Code.gs'),
  ]);
  assert(examSource.includes('imageRequired') && examSource.includes('<img') && resultSource.includes('imageRequired') && resultSource.includes('<img'), 'Exam／Result 圖片顯示未接線');
  assert(resultSource.includes('教材名稱：') && resultSource.includes('答案依據：') && resultSource.includes('教材摘錄：'), 'Result 來源資訊顯示不完整');
  assert(appsScriptSource.includes('ExamSessions') && appsScriptSource.includes('AnswerRecords') && appsScriptSource.includes('answeredQuestionHistory') && !appsScriptSource.includes('Sprint 40A'), 'Apps Script 相容性或未修改檢查失敗');

  const distFiles = await walk(join(root, 'dist')).catch(() => []);
  const distText = (await Promise.all(distFiles.map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n');
  const forbidden = [/OPENAI_API_KEY/i, /GEMINI_API_KEY/i, /AI_PROVIDER_(?:API_KEY|SECRET)/i, /sk-[A-Za-z0-9]{20,}/, /AIza[A-Za-z0-9_-]{20,}/, /Google OAuth|Google Login|accounts\.google\.com/i, /private[\\/].*\.(?:pdf|docx)/i];
  forbidden.forEach((pattern) => assert(!pattern.test(distText), `production bundle 含禁止內容：${pattern}`));

  if (errors.length) {
    console.error('SPRINT 40A VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({ formalCount: formal.length, formalExamEligibleCount: formal.filter((question) => question.practiceOnly !== true).length, dailyCount: daily.length, formalRevisionCount: formal.filter((question) => question.questionQuality?.requiresRevision).length, dailyRevisionCount: daily.filter((question) => question.questionQuality?.requiresRevision).length, formalChoiceCount: formalChoices.length, dailyChoiceCount: dailyChoices.length, highLeakageRisk: 0, sourceReview: dispositions, imageRequired: imageQuestions.length, imageMissing: imageQuestions.filter((question) => question.imageMissing).length, answeredCorePreserved: true, appsScriptChanged: false, forbiddenBundleSecrets: false, deploy: false }, null, 2));
  console.log('SPRINT 40A VERIFY PASSED');
} finally {
  await server.close();
}
