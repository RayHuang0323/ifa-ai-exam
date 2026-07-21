import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const root = process.cwd();
const questionDir = join(root, 'src', 'data', 'questions');
const externalRoot = join(root, '..', 'IFA_教材資料庫');

const readJson = async (filePath, fallback = []) => {
  try {
    const parsed = JSON.parse((await readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
    return Array.isArray(parsed) ? parsed : parsed.questions ?? parsed.items ?? fallback;
  } catch {
    return fallback;
  }
};
const clean = (value) => String(value ?? '').trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const sourceFileName = (value) => {
  const normalized = clean(value).replaceAll('\\', '/');
  return normalized ? basename(normalized) : '整理候選資料';
};
const normalizeType = (question) => {
  const type = clean(question.type).toLowerCase();
  if (type.includes('case')) return 'case_study';
  if (type.includes('essay') || type.includes('formula')) return 'essay';
  if (type.includes('short') || type.includes('fill')) return 'shortAnswer';
  if (type.includes('true') || type.includes('choice') || type === 'single' || type === 'multiple') return 'multipleChoice';
  return 'shortAnswer';
};

const externalCandidates = await readJson(join(externalRoot, '05_題庫候選', '10_待驗證題目.json'));
const staging = await readJson(join(questionDir, 'week2.staging.json'));
const pending = await readJson(join(questionDir, 'pending-review.json'));
const week1 = await readJson(join(questionDir, 'week1.json'));
const week2 = await readJson(join(questionDir, 'week2.json'));
const candidates = externalCandidates.length ? externalCandidates : [...staging, ...pending];
const seenCandidateQuestions = new Set();
const candidatePractice = [];

for (const candidate of candidates) {
  const question = clean(candidate.question);
  const answer = candidate.answer;
  const isMock = candidate.sourceType === 'mock-exam' || candidate.sourceType === 'mock';
  const blocked = candidate.verification === 'missing_answer' || !question || answer == null || (typeof answer === 'string' && !answer.trim());
  if (blocked || seenCandidateQuestions.has(normalize(question))) continue;
  seenCandidateQuestions.add(normalize(question));
  candidatePractice.push({
    id: 20000 + candidatePractice.length + 1,
    sourceCandidateId: clean(candidate.id),
    weekId: 'exam-practice',
    knowledgeId: undefined,
    type: normalizeType(candidate),
    chapter: clean(candidate.category) || '教材重點',
    category: clean(candidate.category) || '教材重點',
    difficulty: Number.isFinite(candidate.difficulty) ? candidate.difficulty : 3,
    question,
    options: Array.isArray(candidate.options) && candidate.options.length ? candidate.options : undefined,
    answer,
    referenceAnswer: answer,
    explanation: clean(candidate.explanation) || '請依來源與參考答案自行檢核；本題尚未納入正式成績。',
    answerGuide: clean(candidate.explanation) || '依參考答案自評，必要時回看來源教材。',
    sourceType: isMock ? 'mock' : 'high_priority_review',
    sourceLabel: isMock ? '模擬題（非歷屆試題）' : '教材整理重點（待人工核對）',
    sourceFile: sourceFileName(candidate.sourceFile ?? candidate.source),
    sourcePage: candidate.sourcePage ?? undefined,
    reviewStatus: isMock ? 'mock_only' : 'needs_review',
    formalScoreEligible: false,
    practiceOnly: true,
    priority: isMock ? 2 : 5,
  });
}

const formalPractice = [...week1, ...week2].map((question, index) => ({
  id: 40000 + index + 1,
  sourceCandidateId: String(question.id),
  weekId: 'exam-practice',
  type: normalizeType(question),
  chapter: clean(question.chapter ?? question.category) || '正式題練習',
  category: clean(question.chapter ?? question.category) || '正式題練習',
  difficulty: Number.isFinite(question.difficulty) ? question.difficulty : 3,
  question: question.question,
  options: question.options,
  answer: question.answer,
  referenceAnswer: question.answer,
  explanation: question.explanation || '正式題練習副本；本次練習不另計正式成績。',
  answerGuide: question.explanation || '請依正式題參考答案檢核。',
  sourceType: 'verified-practice',
  sourceLabel: '正式題練習副本（不列正式成績）',
  sourceFile: 'src/data/questions',
  reviewStatus: 'practice_ready',
  formalScoreEligible: false,
  practiceOnly: true,
  priority: 3,
}));

const output = [...candidatePractice, ...formalPractice];
await writeFile(join(questionDir, 'exam-practice.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  file: 'src/data/questions/exam-practice.json',
  total: output.length,
  candidatePractice: candidatePractice.length,
  formalPracticeCopies: formalPractice.length,
  types: Object.fromEntries([...new Set(output.map((question) => question.type))].map((type) => [type, output.filter((question) => question.type === type).length])),
  sources: Object.fromEntries([...new Set(output.map((question) => question.sourceType))].map((sourceType) => [sourceType, output.filter((question) => question.sourceType === sourceType).length])),
}, null, 2));
