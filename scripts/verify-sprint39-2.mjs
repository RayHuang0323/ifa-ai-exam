import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';

const root = process.cwd();
const displayFields = [
  'displayQuestion', 'displayOptions', 'displayAnswer', 'displayReferenceAnswer',
  'displayEvidenceExcerpt', 'displayAnswerBasis', 'displaySourceFile', 'displaySourceLabel',
  'displaySourceLocation', 'displaySourceChapter', 'displaySourceVersion', 'displaySourcePage',
];

const makeWindow = (search, entries = {}) => {
  const storage = new Map(Object.entries(entries));
  globalThis.window = {
    location: { search },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };
  return storage;
};

const loadProfile = async (search, entries = {}) => {
  makeWindow(search, entries);
  const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
  const modules = {
    profile: await server.ssrLoadModule('/src/utils/learnerProfile.ts'),
    governance: await server.ssrLoadModule('/src/utils/questionQualityGovernance.ts'),
    engine: await server.ssrLoadModule('/src/utils/questionEngine.ts'),
    lock: await server.ssrLoadModule('/src/utils/answeredQuestionLock.ts'),
  };
  return { server, ...modules };
};

const valueHas = (value, predicate) => Array.isArray(value) ? value.some((item) => predicate(String(item))) : typeof value === 'string' && predicate(value);
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const learner = await loadProfile('?profile=learner');
try {
  const formal = learner.engine.getFormalQuestionPool();
  assert(formal.length === 285, `正式題數應為 285，實際 ${formal.length}`);
  const displayViolations = formal.filter((question) => displayFields.some((field) => valueHas(question[field], learner.governance.hasSimplifiedCharacters)));
  const promptViolations = formal.filter((question) => learner.governance.hasEvidencePromptWording(question.displayQuestion ?? question.question) || learner.governance.hasAiPromptWording(question.displayQuestion ?? question.question));
  assert(displayViolations.length === 0, `正式題顯示層仍含簡體字：${displayViolations.map((question) => question.id).join(', ')}`);
  assert(promptViolations.length === 0, `正式題顯示層仍含 AI 題幹殘留：${promptViolations.map((question) => question.id).join(', ')}`);
  assert(formal.every((question) => displayFields.filter((field) => field.startsWith('display')).every((field) => Object.prototype.hasOwnProperty.call(question, field) || !['displayQuestion', 'displayEvidenceExcerpt', 'displayAnswerBasis'].includes(field))), '正式題顯示治理欄位未完整建立');

  const protectedId = 70001;
  const lockStorage = makeWindow('?profile=learner', { 'ifa-answered-question-lock-v1': JSON.stringify([protectedId]) });
  const protectedQuestion = learner.governance.applyQuestionQualityGovernance({
    id: protectedId,
    type: 'shortAnswer',
    question: '依教材證據，「心动周期」是什麼？',
    answer: '心动周期',
    evidenceExcerpt: '心动周期的教材摘錄',
    answerBasis: '依教材證據核對',
  });
  assert(lockStorage.get('ifa-answered-question-lock-v1') === JSON.stringify([protectedId]), '已作答 lock 被治理流程修改');
  assert(protectedQuestion.question === '依教材證據，「心动周期」是什麼？' && protectedQuestion.answer === '心动周期', '已作答題核心欄位遭修改');
  assert(!learner.governance.hasEvidencePromptWording(protectedQuestion.displayQuestion ?? '') && !learner.governance.hasSimplifiedCharacters(protectedQuestion.displayQuestion ?? ''), '已作答題顯示治理未生效');
  assert(!learner.governance.hasSimplifiedCharacters(protectedQuestion.displayEvidenceExcerpt ?? ''), '已作答題教材摘錄顯示未繁體化');
} finally {
  await learner.server.close();
}

const coach = await loadProfile('?profile=coach-test', { 'ifa-answered-question-lock-v1': JSON.stringify([70001]) });
try {
  const profile = coach.profile.getLearnerProfile();
  const question = coach.engine.getQuestionById(70001);
  assert(profile.isTest === true && profile.sourceRole === 'coach-test', 'coach-test profile 未在題池建立前初始化');
  assert(question && !coach.lock.isQuestionProtected(70001), 'coach-test 錯誤共用 Bella answered lock');
  assert(question && !coach.governance.hasEvidencePromptWording(question.question), 'coach-test 題幹仍含 AI 殘留');
} finally {
  await coach.server.close();
}

if (errors.length) {
  console.error('SPRINT 39.2 VERIFY FAILED');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({ formalCount: 285, displaySimplifiedViolations: 0, displayAiPromptViolations: 0, answeredCorePreserved: true, answeredDisplayTraditionalized: true, learnerCoachProfileIsolation: true, deploy: false }, null, 2));
console.log('SPRINT 39.2 VERIFY PASSED');
