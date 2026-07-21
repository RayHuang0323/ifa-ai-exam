import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const practice = readJson('src/data/questions/exam-practice.json');
const formal = [
  ...readJson('src/data/questions/week1.json'),
  ...readJson('src/data/questions/week2.json'),
];
const formalIds = new Set(formal.map((q) => q.id));

const byId = (a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
const sorted = (items) => [...items].sort(byId);
const sample = (items, count) => sorted(items).slice(0, count);
const questionText = (q) => String(q.question ?? q.prompt ?? '').trim();
const answerText = (q) => JSON.stringify(q.answer ?? q.referenceAnswer ?? q.answerGuide ?? '').trim();
const summary = (q) => ({
  id: q.id,
  type: q.type,
  category: q.category,
  weekTag: q.weekTag ?? null,
  riskLevel: q.riskLevel ?? null,
  sourceType: q.sourceType ?? null,
  sourceFile: q.sourceFile ?? null,
  sourcePage: q.sourcePage ?? null,
  question: questionText(q).slice(0, 120),
  answer: answerText(q).slice(0, 120),
});

const normalize = (value) => String(value)
  .toLowerCase()
  .replace(/[「」『』（）()［］【】、，。；：！？!?,.\s]/g, '')
  .trim();

const grams = (value) => {
  const normalized = normalize(value);
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
};

const jaccard = (left, right) => {
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection || 1);
};

const safety = practice.filter((q) => q.riskLevel === 'safety_review');
const formula = practice.filter((q) => q.category === '配方設計' || /濃度|用量|稀釋|調油|配方/.test(questionText(q)));
const cases = practice.filter((q) => q.type === 'case_study' || q.category === '案例題');
const legal = practice.filter((q) => /法規|IFA|倫理|諮詢流程|個案評估|職業倫理|轉介/.test(String(q.category ?? '')));

const samples = {
  safety: sample(safety, 80),
  formula: sample(formula, 40),
  cases: sample(cases, 40),
  legal: sample(legal, 30),
};

const exactQuestionGroups = new Map();
for (const q of practice) {
  const key = normalize(questionText(q));
  if (!key) continue;
  const group = exactQuestionGroups.get(key) ?? [];
  group.push(q.id);
  exactQuestionGroups.set(key, group);
}
const exactDuplicateGroups = [...exactQuestionGroups.values()].filter((group) => group.length > 1);

const allForNearDuplicate = [...practice, ...formal];
const gramCache = new Map(allForNearDuplicate.map((q) => [q.id, grams(questionText(q))]));
const nearDuplicatePairs = [];
let nearDuplicatePairCount = 0;
let nearDuplicateFormalPairCount = 0;
let nearDuplicatePracticePairCount = 0;
const nearDuplicateIds = new Set();
for (let leftIndex = 0; leftIndex < allForNearDuplicate.length; leftIndex += 1) {
  const left = allForNearDuplicate[leftIndex];
  const leftText = normalize(questionText(left));
  if (leftText.length < 18) continue;
  for (let rightIndex = leftIndex + 1; rightIndex < allForNearDuplicate.length; rightIndex += 1) {
    const right = allForNearDuplicate[rightIndex];
    if (left.category !== right.category) continue;
    const rightText = normalize(questionText(right));
    if (rightText.length < 18) continue;
    const similarity = jaccard(gramCache.get(left.id), gramCache.get(right.id));
    if (similarity >= 0.82) {
      nearDuplicatePairCount += 1;
      nearDuplicateIds.add(left.id);
      nearDuplicateIds.add(right.id);
      if (formalIds.has(left.id) || formalIds.has(right.id)) nearDuplicateFormalPairCount += 1;
      else nearDuplicatePracticePairCount += 1;
      if (nearDuplicatePairs.length < 100) {
        nearDuplicatePairs.push({
          leftId: left.id,
          rightId: right.id,
          category: left.category,
          similarity: Number(similarity.toFixed(3)),
          left: questionText(left).slice(0, 100),
          right: questionText(right).slice(0, 100),
        });
      }
    }
  }
}

const unsafeClaimPattern = /可治癒|能治癒|可治療|能治療|治好|取代醫療|不用就醫|不需就醫|平衡荷爾蒙/;
const unsafeClaimHits = practice.filter((q) => unsafeClaimPattern.test(`${questionText(q)} ${answerText(q)} ${q.explanation ?? ''} ${q.answerGuide ?? ''}`));
const missingAnswer = practice.filter((q) => !q.answer && !q.referenceAnswer && !q.answerGuide);
const missingSourceFile = practice.filter((q) => !q.sourceFile);
const missingSourcePage = practice.filter((q) => !q.sourcePage);
const blocked = practice.filter((q) => q.reviewStatus === 'blocked' || q.reviewStatus === 'blocked_candidate' || q.status === 'blocked');
const mock = practice.filter((q) => q.sourceType === 'mock');
const formalIdOverlap = practice.filter((q) => formal.some((f) => f.id === q.id));
const ai = practice.filter((q) => q.sourceType === 'ai_generated_from_material');
const excludedPractice = practice.filter((q) => q.isActive === false || q.excludeFromPractice === true || ['unsafe_candidate', 'duplicate_candidate'].includes(q.qualityStatus));
const eligiblePractice = practice.filter((q) => !excludedPractice.includes(q));
const exactDuplicateIds = new Set(exactDuplicateGroups.flat());
const candidates = sorted(practice.filter((q) =>
  ['extracted_material', 'high_priority_review'].includes(q.sourceType)
  && q.riskLevel !== 'safety_review'
  && ['multipleChoice', 'multiSelect', 'shortAnswer'].includes(q.type)
  && !exactDuplicateIds.has(q.id)
  && !nearDuplicateIds.has(q.id)
  && !/安全|禁忌|配方|案例|個案|諮詢|法規|IFA|倫理|轉介|植物油|精油個論|按摩|考古題/.test(String(q.category ?? ''))
  && q.reviewStatus !== 'blocked'
  && !unsafeClaimPattern.test(`${questionText(q)} ${answerText(q)} ${q.explanation ?? ''}`),
)).slice(0, 1);

const counts = (items, key) => Object.fromEntries(
  [...items.reduce((map, item) => {
    const value = item[key] ?? '(missing)';
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map())].sort(([left], [right]) => String(left).localeCompare(String(right), 'zh-Hant')),
);

console.log(JSON.stringify({
  overview: {
    total: practice.length,
    ai: ai.length,
    safetyReview: safety.length,
    mock: mock.length,
    blocked: blocked.length,
    excludedFromPractice: excludedPractice.length,
    eligiblePractice: eligiblePractice.length,
    formalIdOverlap: formalIdOverlap.length,
    missingAnswer: missingAnswer.length,
    missingSourceFile: missingSourceFile.length,
    missingSourcePage: missingSourcePage.length,
    typeCounts: counts(practice, 'type'),
    categoryCounts: counts(practice, 'category'),
    weekCounts: counts(practice, 'weekTag'),
    qualityStatusCounts: counts(practice, 'qualityStatus'),
  },
  sampleCounts: {
    safety: samples.safety.length,
    formula: samples.formula.length,
    cases: samples.cases.length,
    legal: samples.legal.length,
  },
  samples: Object.fromEntries(Object.entries(samples).map(([key, items]) => [key, items.map(summary)])),
  duplicateScan: {
    exactDuplicateGroupCount: exactDuplicateGroups.length,
    exactDuplicateGroups,
    nearDuplicatePairCount,
    nearDuplicateFormalPairCount,
    nearDuplicatePracticePairCount,
    nearDuplicatePairs,
  },
  safetyChecks: {
    unsafeClaimHitCount: unsafeClaimHits.length,
    unsafeClaimHits: unsafeClaimHits.map(summary),
    missingAnswerInSafety: safety.filter((q) => !q.answer && !q.referenceAnswer && !q.answerGuide).length,
    missingSourcePageInSafety: safety.filter((q) => !q.sourcePage).length,
  },
  candidateSamples: candidates.map(summary),
}, null, 2));
