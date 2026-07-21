import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataPath = (name) => join(root, 'src', 'data', 'questions', name);
const readJson = async (name) => JSON.parse(await readFile(dataPath(name), 'utf8'));

const [week1, week2, extra, practice] = await Promise.all([
  readJson('week1.json'),
  readJson('week2.json'),
  readJson('verified-extra.json'),
  readJson('exam-practice.json'),
]);

const formal = [...week1, ...week2, ...extra];
const normalize = (value) => String(value ?? '')
  .toLocaleLowerCase('zh-Hant')
  .replace(/[「」『』“”"'’‘()（）［］【】《》〈〉：:、，,。．.；;！!？?\s\-—_]/g, '');
const textOf = (question) => JSON.stringify({ question: question.question, answer: question.answer, explanation: question.explanation, referenceAnswer: question.referenceAnswer, answerGuide: question.answerGuide });
const fields = (question) => ({
  id: question.id,
  type: question.type,
  category: question.category,
  sourceType: question.sourceType,
  sourcePage: question.sourcePage,
  sourceFile: question.sourceFile,
});

const issueMap = new Map(extra.map((question) => [question.id, new Set()]));
const add = (id, issue) => issueMap.get(id)?.add(issue);
const genericMarkers = [
  '請用一句話整理',
  '尚待人工',
  '依來源與參考答案自行檢核',
  'factory-v1-variant',
  '依參考答案自評',
];
const dangerPattern = /(治療|治癒|診斷|取代醫療|自行停藥|停藥|藥物交互|孕婦|妊娠|嬰幼兒|兒童|癲癇|高血壓|氣喘|肝病|腎病|疾病史|用藥|禁忌|危險濃度|濃度越高|光敏|光毒|轉介|醫療專業|法規|IFA)/i;

for (const question of extra) {
  for (const field of ['id', 'type', 'question', 'answer', 'explanation', 'category', 'sourceType', 'sourceLabel', 'sourceFile', 'sourcePage', 'reviewStatus', 'verifiedBy', 'verifiedAt']) {
    if (question[field] === undefined || question[field] === null || question[field] === '') add(question.id, `missing:${field}`);
  }
  if (question.reviewStatus !== 'verified') add(question.id, `status:${question.reviewStatus}`);
  if (question.practiceOnly === true || question.formalScoreEligible === false) add(question.id, 'formal-boundary');
  if (question.riskLevel === 'safety_review') add(question.id, 'safety_review');
  if (question.sourceType === 'mock' || question.reviewStatus === 'mock_only') add(question.id, 'mock');
  if (dangerPattern.test(textOf(question))) add(question.id, 'risk-language');
  if (genericMarkers.some((marker) => textOf(question).includes(marker))) add(question.id, 'generation-marker');
  if (question.sourcePage === '待補') add(question.id, 'source-page-pending');
  if (question.type === 'multipleChoice' || question.type === 'multiSelect') {
    if (!Array.isArray(question.options) || question.options.length < 3) add(question.id, 'options-insufficient');
    const optionKeys = (question.options ?? []).map(normalize);
    if (new Set(optionKeys).size !== optionKeys.length) add(question.id, 'duplicate-options');
    const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
    if (answers.some((answer) => !optionKeys.includes(normalize(answer)))) add(question.id, 'answer-not-in-options');
    if (question.type === 'multipleChoice' && answers.length !== 1) add(question.id, 'multiple-choice-answer-count');
    if (question.type === 'multiSelect' && answers.length < 2) add(question.id, 'multi-select-answer-count');
  } else {
    const reference = String(question.referenceAnswer ?? question.answerGuide ?? question.answer ?? '').trim();
    if (!reference) add(question.id, 'nonchoice-answer-empty');
    if (question.type === 'shortAnswer' && question.question.includes('請用一句話整理')) add(question.id, 'synthetic-short-answer-stem');
    if (reference && normalize(reference) === normalize(question.question)) add(question.id, 'answer-copies-stem');
    if (!question.keyPoints || !Array.isArray(question.keyPoints) || question.keyPoints.length < 2) add(question.id, 'key-points-weak');
    if (!question.rubric || !Array.isArray(question.rubric) || question.rubric.length < 3) add(question.id, 'rubric-weak');
  }
}

const questionKeys = new Map();
for (const question of formal) {
  const key = normalize(question.question);
  if (!key) continue;
  if (!questionKeys.has(key)) questionKeys.set(key, []);
  questionKeys.get(key).push(question);
}
const exactDuplicateGroups = [...questionKeys.values()].filter((group) => group.length > 1);
for (const group of exactDuplicateGroups) {
  for (const question of group) if (issueMap.has(question.id)) add(question.id, `exact-duplicate:${group.map((item) => item.id).join(',')}`);
}

const trigrams = (value) => {
  const normalized = normalize(value);
  const set = new Set();
  for (let index = 0; index < normalized.length - 2; index += 1) set.add(normalized.slice(index, index + 3));
  return set;
};
const jaccard = (left, right) => {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
};
const extraTrigrams = extra.map((question) => [question, trigrams(question.question)]);
const allTrigrams = formal.map((question) => [question, trigrams(question.question)]);
const nearDuplicatePairs = [];
for (const [question, tokens] of extraTrigrams) {
  for (const [other, otherTokens] of allTrigrams) {
    if (question.id === other.id) continue;
    const score = jaccard(tokens, otherTokens);
    if (score >= 0.72 && normalize(question.question) !== normalize(other.question)) {
      nearDuplicatePairs.push({ ids: [question.id, other.id], score: Number(score.toFixed(3)), questions: [question.question, other.question] });
      add(question.id, `near-duplicate:${other.id}`);
    }
  }
}

const bySource = Object.groupBy(extra, (question) => question.sourceType ?? 'missing');
const byType = Object.groupBy(extra, (question) => question.type ?? 'missing');
const byCategory = Object.groupBy(extra, (question) => question.category ?? 'missing');
const issueCounts = {};
for (const issues of issueMap.values()) for (const issue of issues) issueCounts[issue.split(':')[0]] = (issueCounts[issue.split(':')[0]] ?? 0) + 1;

const result = {
  totals: { originalVerified: week1.length + week2.length, sprint34New: extra.length, formal: formal.length, practice: practice.length },
  distributions: {
    type: Object.fromEntries(Object.entries(byType).map(([key, values]) => [key, values.length])),
    sourceType: Object.fromEntries(Object.entries(bySource).map(([key, values]) => [key, values.length])),
    category: Object.fromEntries(Object.entries(byCategory).map(([key, values]) => [key, values.length])),
    riskLevel: Object.fromEntries(Object.entries(Object.groupBy(extra, (question) => question.riskLevel ?? 'missing')).map(([key, values]) => [key, values.length])),
  },
  issueCounts,
  exactDuplicateGroups: exactDuplicateGroups.map((group) => group.map(fields)),
  nearDuplicatePairs: nearDuplicatePairs.sort((left, right) => right.score - left.score),
  issues: Object.fromEntries([...issueMap.entries()].filter(([, issues]) => issues.size).map(([id, issues]) => [id, [...issues]])),
  samples: {
    multipleChoice: extra.filter((question) => question.type === 'multipleChoice').slice(0, 8).map((question) => ({ id: question.id, question: question.question, options: question.options, answer: question.answer, tags: question.tags })),
    shortAnswer: extra.filter((question) => question.type === 'shortAnswer').slice(0, 8).map((question) => ({ id: question.id, question: question.question, answer: question.answer, explanation: question.explanation, tags: question.tags })),
  },
};

console.log(JSON.stringify(result, null, 2));
