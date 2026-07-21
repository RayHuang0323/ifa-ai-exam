import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
const hasValue = (value) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 && value !== '待補' : value !== undefined && value !== null;
const hasMetadataField = (question, field) => Object.prototype.hasOwnProperty.call(question, field)
  && question[field] !== undefined
  && question[field] !== null
  && (typeof question[field] !== 'string' || question[field].trim().length > 0);
const choiceTypes = new Set(['single', 'multiple', 'multipleChoice', 'multiSelect']);
const nonChoiceTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case']);
const requiredMetadata = ['sourceFile', 'sourceChapter', 'sourceVersion', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis'];
const displayFields = ['question', 'options', 'referenceAnswer', 'sampleAnswer', 'explanation', 'rubric'];
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });

try {
  const [engine, quality, scheduler, lock] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/questionQualityGovernance.ts'),
    server.ssrLoadModule('/src/utils/questionScheduler.ts'),
    server.ssrLoadModule('/src/utils/answeredQuestionLock.ts'),
  ]);
  const [appSource, syncSource, packageSource] = await Promise.all([
    read('src/App.tsx'),
    read('src/services/progressSync.ts'),
    read('package.json').then(JSON.parse),
  ]);
  const errors = [];
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  const sourceVerified = engine.getSourceVerifiedQuestionPool();
  const isIncomplete = (question) => choiceTypes.has(question.type)
    ? !hasValue(question.answer) || !hasValue(question.explanation)
    : nonChoiceTypes.has(question.type)
      ? !hasValue(question.referenceAnswer) || !hasValue(question.sampleAnswer) || !hasValue(question.keyPoints) || !hasValue(question.explanation) || !hasValue(question.answerBasis) || (question.type === 'essay' && (!hasValue(question.answerGuide) || !hasValue(question.rubric) || !hasValue(question.commonOmissions)))
      : false;

  const promptViolations = daily.filter((question) => quality.hasEvidencePromptWording(question.question));
  const imageViolations = daily.filter((question) => quality.hasImageDependency(question.question));
  const simplifiedViolations = daily.filter((question) => displayFields.some((field) => quality.hasSimplifiedCharacters(JSON.stringify(question[field] ?? ''))));
  const incompleteFormal = formal.filter(isIncomplete);
  const sourceMetadataViolations = sourceVerified.filter((question) => requiredMetadata.some((field) => !hasMetadataField(question, field)));
  const metadataStatusViolations = sourceVerified.filter((question) => {
    const hasDocumentaryGap = requiredMetadata.some((field) => !hasValue(question[field]));
    return hasDocumentaryGap ? question.metadataStatus !== 'metadata_missing' : question.metadataStatus !== 'complete';
  });
  if (promptViolations.length) errors.push(`question 含依教材證據：${promptViolations.map((question) => question.id).join(', ')}`);
  if (imageViolations.length) errors.push(`仍依賴圖片的 active 題：${imageViolations.map((question) => question.id).join(', ')}`);
  if (simplifiedViolations.length) errors.push(`active 題仍有簡體字：${simplifiedViolations.map((question) => question.id).join(', ')}`);
  if (incompleteFormal.length) errors.push(`正式題解析欄位不完整：${incompleteFormal.map((question) => question.id).join(', ')}`);
  if (sourceMetadataViolations.length) errors.push(`source_verified metadata 欄位不完整：${sourceMetadataViolations.map((question) => question.id).join(', ')}`);
  if (metadataStatusViolations.length) errors.push(`source_verified metadata 缺口標記錯誤：${metadataStatusViolations.map((question) => question.id).join(', ')}`);

  storage.clear();
  scheduler.clearQuestionSchedulerState();
  const candidates = Array.from({ length: 50 }, (_, index) => ({ id: index + 1, formal: false }));
  const completedAt = new Date(Date.now() - 86400000).toISOString();
  scheduler.seedSchedulerFromHistoricalSessions([{ id: 'bella-completed', mode: 'daily', questionIds: [1, 2, 3], answeredQuestionIds: [1, 2, 3], startedAt: completedAt, completedAt }]);
  const dailySelection = scheduler.selectDailyQuestionIds(candidates, 20);
  const weeklySelection = scheduler.selectWeeklyQuestionIds(candidates, 20);
  if (dailySelection.some((id) => [1, 2, 3].includes(id))) errors.push('Daily 抽到 Bella 已完成題目');
  if (weeklySelection.some((id) => [1, 2, 3].includes(id))) errors.push('Weekly 抽到 Bella 已完成題目');

  storage.clear();
  storage.set('ifa-answered-question-lock-v1', JSON.stringify([70001]));
  const protectedQuestion = quality.applyQuestionQualityGovernance({ id: 70001, type: 'shortAnswer', question: '依教材證據，「腎单位」是什麼？', answer: '肾单位', explanation: '说明' });
  if (protectedQuestion.question !== '依教材證據，「腎单位」是什麼？') errors.push('已作答題的核心題幹不應被治理層改寫');
  if (!lock.isQuestionProtected(70001)) errors.push('answered lock 未正確保護已作答題');

  if (!appSource.includes('if (!profile.isTest) void syncExamStarted') || !syncSource.includes("if (profile.isTest || event.isTest) return 'disabled';")) errors.push('Coach Test 同步隔離 guard 遺失');
  if (packageSource.scripts['verify:sprint38'] !== 'node scripts/verify-sprint38.mjs') errors.push('package.json 缺少 verify:sprint38');

  if (errors.length) {
    console.error('SPRINT 38 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(JSON.stringify({ formalCount: formal.length, dailyWeeklyPoolCount: daily.length, sourceVerifiedCount: sourceVerified.length, unresolvedImageQuestions: imageViolations.length, evidencePromptQuestions: promptViolations.length, simplifiedQuestionRecords: simplifiedViolations.length, incompleteFormalQuestions: incompleteFormal.length, sourceMetadataFieldViolations: sourceMetadataViolations.length, metadataStatusViolations: metadataStatusViolations.length, dailyCompletedRepeatBlocked: true, weeklyCompletedRepeatBlocked: true, answeredLockPreserved: true, coachIsolationPreserved: true }, null, 2));
  console.log('SPRINT 38 VERIFY PASSED');
} finally {
  await server.close();
}
