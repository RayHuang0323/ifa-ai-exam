import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const storage = new Map();
globalThis.window = {
  location: { search: '?profile=coach-test' },
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) },
};
const questionDir = join(root, 'src', 'data', 'questions');
const reportPath = join(root, 'docs', 'sprint52_question_pool_strategy.md');
const metadataPath = join(questionDir, 'questionPoolMetadata.ts');
const enginePath = join(root, 'src', 'utils', 'questionEngine.ts');
const schedulerPath = join(root, 'src', 'utils', 'questionScheduler.ts');

const normalize = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[「」『』"'`“”‘’，。！？、；：,.!?;:()[\]{}]/g, '');

const classify = (question, fileName) => {
  const sourceType = normalize(question.sourceType);
  const sourceText = normalize(`${question.sourceLabel ?? ''} ${question.reference ?? ''} ${question.sourceFile ?? ''}`);
  const ai = sourceType.includes('ai_generated') || normalize(`${question.sourceLabel ?? ''} ${question.generatedBy ?? ''}`).includes('ai');
  if (ai) return 'ai_generated';
  if (['extracted_material', 'source_verified', 'lecture', 'textbook'].includes(sourceType)) return 'textbook';
  if (['mock', 'high_priority_review', 'verified-practice', 'student-notes', 'pending-review', 'staging'].includes(sourceType)) return 'unknown';
  if (['past_exam', 'past-exam', 'official_exam', 'official'].includes(sourceType)) {
    return sourceText.includes('術科') || sourceText.includes('考官') ? 'unknown' : 'official_exam';
  }
  if (sourceText.includes('術科') || sourceText.includes('考官')) return 'unknown';
  if (sourceText.includes('歷屆') || sourceText.includes('考古題') || sourceText.includes('期末試卷')) return 'official_exam';
  if (sourceText.includes('教材') || sourceText.includes('講義')) return 'textbook';
  return 'unknown';
};

const readJson = async (fileName) => JSON.parse(await readFile(join(questionDir, fileName), 'utf8'));
const fileNames = (await import('node:fs/promises')).readdir(questionDir);
const questionFiles = (await fileNames).filter((fileName) => fileName.endsWith('.json'));
const files = [];
for (const fileName of questionFiles) {
  const value = await readJson(fileName);
  if (Array.isArray(value)) files.push({ fileName, questions: value });
}

const allQuestions = files.flatMap(({ fileName, questions }) => questions.map((question) => ({ ...question, inputFile: fileName })));
const formalFiles = new Set(['week1.json', 'week2.json', 'verified-extra.json', 'source-verified.json', 'source-verified-sprint36.json', 'source-verified-sprint37.json', 'past-exam-verified.json']);
const formal = allQuestions.filter((question) => formalFiles.has(question.inputFile));
const pastExam = allQuestions.filter((question) => question.inputFile === 'past-exam-verified.json');
const practice = allQuestions.filter((question) => question.inputFile === 'exam-practice.json' && question.isActive !== false && question.excludeFromPractice !== true && question.qualityStatus !== 'unsafe_candidate' && question.qualityStatus !== 'duplicate_candidate');
const runtime = [...formal, ...practice];

const countBy = (questions, selector) => questions.reduce((counts, question) => {
  const key = selector(question);
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});

const exactGroups = (questions) => {
  const groups = new Map();
  questions.forEach((question) => {
    const key = `${normalize(question.question)}::${Array.isArray(question.options) ? question.options.map(normalize).sort().join('|') : ''}`;
    groups.set(key, [...(groups.get(key) ?? []), question.id]);
  });
  return [...groups.values()].filter((group) => group.length > 1);
};

const bigrams = (value) => {
  const normalized = normalize(value);
  const result = new Set();
  if (normalized.length < 2) return result.add(normalized);
  for (let index = 0; index < normalized.length - 1; index += 1) result.add(normalized.slice(index, index + 2));
  return result;
};
const jaccard = (left, right) => {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  left.forEach((value) => { if (right.has(value)) intersection += 1; });
  return intersection / (left.size + right.size - intersection);
};
const semanticPairs = (questions, threshold) => {
  const pairs = [];
  const fingerprints = new Map(questions.map((question) => [question.id, bigrams(`${question.question} ${Array.isArray(question.options) ? question.options.join(' ') : ''}`)]));
  for (let leftIndex = 0; leftIndex < questions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < questions.length; rightIndex += 1) {
      const left = questions[leftIndex];
      const right = questions[rightIndex];
      if (normalize(left.category ?? left.chapter) !== normalize(right.category ?? right.chapter)) continue;
      const score = jaccard(fingerprints.get(left.id), fingerprints.get(right.id));
      if (score >= threshold) pairs.push({ left: left.id, right: right.id, score: Number(score.toFixed(3)) });
    }
  }
  return pairs;
};

const errors = [];
const formalIds = new Set();
for (const question of formal) {
  if (formalIds.has(question.id)) errors.push(`formal duplicate id ${question.id}`);
  formalIds.add(question.id);
}
const runtimeIds = new Set();
for (const question of runtime) {
  if (runtimeIds.has(question.id)) errors.push(`runtime duplicate id ${question.id}`);
  runtimeIds.add(question.id);
}
if (formal.length !== 359) errors.push(`formal count expected 359 (285 baseline + 74 past_exam), got ${formal.length}`);
if (pastExam.length !== 74 || pastExam.some((question) => question.sourceType !== 'past_exam' || question.priority < 20)) errors.push(`Sprint 62 past_exam integration expected 74 questions with priority >= 20, got ${pastExam.length}`);
if (practice.length !== 974) errors.push(`runtime practice count expected 974, got ${practice.length}`);

const [metadata, engine, scheduler, report] = await Promise.all([
  readFile(metadataPath, 'utf8'),
  readFile(enginePath, 'utf8'),
  readFile(schedulerPath, 'utf8'),
  readFile(reportPath, 'utf8'),
]);
for (const required of ['official_exam', 'textbook', 'ai_generated', 'unknown', 'duplicateGroupId', 'duplicateRisk']) if (!metadata.includes(required)) errors.push(`metadata missing ${required}`);
for (const required of ['buildQuestionPoolMetadata', 'questionPoolMetadata', 'getDailyQuestionPool', 'getPracticeQuestionPool', 'pastExamPool', 'withSourcePriority']) if (!engine.includes(required)) errors.push(`engine missing ${required}`);
for (const required of ['candidateGroupKey', 'completedGroups', 'recentGroups', 'days: 3', 'days: 7', '1000']) if (!scheduler.includes(required)) errors.push(`scheduler missing ${required}`);
if (!report.includes('Sprint 52') || !report.includes('Full Mock') || !report.includes('Weekly') || !report.includes('Daily')) errors.push('strategy report is incomplete');

const runtimeServer = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
let runtimeFormalCount = 0;
let runtimeEligibleCount = 0;
let runtimePracticeCount = 0;
let runtimeDailyCount = 0;
try {
  const runtimeEngine = await runtimeServer.ssrLoadModule('/src/utils/questionEngine.ts');
  runtimeFormalCount = runtimeEngine.getFormalQuestionPool().length;
  runtimeEligibleCount = runtimeEngine.getFullMockQuestionPool().length;
  runtimePracticeCount = runtimeEngine.getPracticeQuestionPool().length;
  runtimeDailyCount = runtimeEngine.getDailyQuestionPool().length;
} finally {
  await runtimeServer.close();
}
if (runtimeFormalCount !== formal.length) errors.push(`runtime formal count differs from JSON pool: ${runtimeFormalCount} != ${formal.length}`);
if (runtimePracticeCount !== practice.length) errors.push(`runtime practice count differs from JSON pool: ${runtimePracticeCount} != ${practice.length}`);
if (runtimeEligibleCount <= 0 || runtimeEligibleCount >= runtimeFormalCount) errors.push(`runtime full mock eligibility boundary invalid: ${runtimeEligibleCount}/${runtimeFormalCount}`);

if (errors.length) {
  console.error('Sprint 52 verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const summary = {
  jsonQuestionCounts: Object.fromEntries(files.map(({ fileName, questions }) => [fileName, questions.length])),
  sourceType: {
    all: countBy(allQuestions, (question) => classify(question, question.inputFile)),
    formal: countBy(formal, (question) => classify(question, question.inputFile)),
    practiceRaw: countBy(allQuestions.filter((question) => question.inputFile === 'exam-practice.json'), (question) => classify(question, question.inputFile)),
    byFile: Object.fromEntries(files.map(({ fileName, questions }) => [fileName, countBy(questions, (question) => classify(question, fileName))])),
  },
  runtimePool: { formal: runtimeFormalCount, practice: runtimePracticeCount, daily: runtimeDailyCount, fullMock: runtimeEligibleCount, weekly: runtimeDailyCount },
  duplicateAudit: {
    formalExactGroups: exactGroups(formal).length,
    practiceExactGroups: exactGroups(practice).length,
    runtimeExactGroups: exactGroups(runtime).length,
    runtimeSemanticPairsAt85: semanticPairs(runtime, 0.85).length,
  },
};
console.log(JSON.stringify(summary, null, 2));
