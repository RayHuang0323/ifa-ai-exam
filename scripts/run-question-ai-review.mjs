import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const totalExpected = 285;
const generatedAt = '2026-07-23';
const formalInputFiles = [
  { file: 'week1.json', kind: 'week1' },
  { file: 'week2.json', kind: 'week2' },
  { file: 'verified-extra.json', kind: 'verified-extra' },
  { file: 'source-verified.json', kind: 'source-verified' },
  { file: 'source-verified-sprint36.json', kind: 'source-verified' },
  { file: 'source-verified-sprint37.json', kind: 'source-verified' },
];
const reviewSchemaVersion = 'sprint49-v1';
const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const difficultyValues = new Set([1, 2, 3, 4, 5]);

const readQuestions = async ({ file, kind }) => {
  const questions = JSON.parse(await readFile(join(root, 'src/data/questions', file), 'utf8'));
  return questions
    .filter((question) => {
      if (kind === 'week1') return true;
      if (kind === 'week2' || kind === 'verified-extra') return question.reviewStatus === 'verified';
      return question.reviewStatus === 'source_verified'
        && question.verificationType === 'source_verified'
        && question.deprecated !== true
        && question.isActive !== false
        && ((question.formalScoreEligible === true && question.practiceOnly !== true)
          || question.sourceReview?.disposition === 'DOWNGRADE');
    })
    .map((question) => ({ ...question, inputFile: file }));
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const answerText = (value) => Array.isArray(value) ? value.filter(hasText).join('；') : String(value ?? '');
const hasAnswer = (question) => Array.isArray(question.answer) ? question.answer.some(hasText) : hasText(question.answer);
const hasSourceLineage = (question) => [question.sourceLabel, question.reference, question.sourceFile].some(hasText);
const hasSourceEvidence = (question) => Array.isArray(question.sourceEvidenceIds)
  && question.sourceEvidenceIds.length > 0
  && hasText(question.evidenceExcerpt)
  && hasText(question.answerBasis);
const hasMeaningfulField = (value) => value !== undefined && value !== null && String(value).trim().length > 0 && !['待補', 'metadata_missing'].includes(String(value).trim());

const normalizeForSimilarity = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/依教材(?:證據|证据)?|根據教材(?:內容)?|請依文件回答|請說明教材中的|ai生成|教材提示語/giu, '')
  .replace(/[^\p{L}\p{N}]+/gu, '');
const ngrams = (value) => {
  const chars = [...value];
  if (chars.length < 2) return new Set(chars);
  return new Set(chars.slice(0, -1).map((_, index) => chars.slice(index, index + 2).join('')));
};
const similarity = (left, right) => {
  const leftSet = ngrams(normalizeForSimilarity(left));
  const rightSet = ngrams(normalizeForSimilarity(right));
  if (leftSet.size === 0 || rightSet.size === 0) return 0;
  let intersection = 0;
  leftSet.forEach((token) => { if (rightSet.has(token)) intersection += 1; });
  return intersection / (leftSet.size + rightSet.size - intersection);
};
const riskForSimilarity = (score) => score >= 0.85 ? 'high' : score >= 0.7 ? 'medium' : score >= 0.55 ? 'low' : 'none';
const riskRank = { none: 0, low: 1, medium: 2, high: 3 };

const allQuestions = (await Promise.all(formalInputFiles.map(readQuestions))).flat();
if (allQuestions.length !== totalExpected) throw new Error(`Formal pool expected ${totalExpected}, got ${allQuestions.length}`);
const ids = new Set();
for (const question of allQuestions) {
  if (ids.has(question.id)) throw new Error(`Duplicate formal question id: ${question.id}`);
  ids.add(question.id);
}

const syllabusMap = JSON.parse(await readFile(join(root, 'src/data/questions/formalQuestionSyllabusMap.json'), 'utf8'));
const mapById = new Map(syllabusMap.entries.map((entry) => [entry.questionId, entry]));
const categoryFor = (question) => mapById.get(question.id)?.review?.syllabusCategory ?? question.category ?? question.chapter ?? 'Unmapped';

const categoryCounts = allQuestions.reduce((counts, question) => {
  const category = categoryFor(question);
  counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}, {});
const categoryBalanceFor = (count) => {
  const percentage = count / allQuestions.length * 100;
  return percentage > 15 ? 'overrepresented' : percentage < 3 ? 'underrepresented' : 'within_audit_band';
};

const duplicatePairs = [];
for (let leftIndex = 0; leftIndex < allQuestions.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < allQuestions.length; rightIndex += 1) {
    const left = allQuestions[leftIndex];
    const right = allQuestions[rightIndex];
    const score = similarity(left.question, right.question);
    const risk = riskForSimilarity(score);
    if (risk !== 'none') duplicatePairs.push({ leftId: left.id, rightId: right.id, score, risk });
  }
}
duplicatePairs.sort((left, right) => right.score - left.score || left.leftId - right.leftId || left.rightId - right.rightId);
const duplicateById = new Map();
duplicatePairs.forEach((pair) => {
  [pair.leftId, pair.rightId].forEach((id) => {
    const previous = duplicateById.get(id);
    if (!previous || riskRank[pair.risk] > riskRank[previous.risk] || (riskRank[pair.risk] === riskRank[previous.risk] && pair.score > previous.score)) {
      duplicateById.set(id, { risk: pair.risk, matchId: id === pair.leftId ? pair.rightId : pair.leftId, score: pair.score });
    }
  });
});

const entries = allQuestions.map((question) => {
  const category = categoryFor(question);
  const answer = answerText(question.answer).trim();
  const answerLooksCorrupted = /whereverpossible|pleaseanswerdirectly|ontheexampaper|請依教材證據|根據教材內容|ai生成/iu.test(answer);
  const answerConfidence = !hasAnswer(question) || answerLooksCorrupted ? 'low' : answer.length < 10 ? 'medium' : 'high';
  const explanationLength = String(question.explanation ?? '').trim().length;
  const explanationQuality = explanationLength === 0 || explanationLength < 20 ? 'poor' : explanationLength < 40 ? 'fair' : 'good';
  const sourceLineage = hasSourceLineage(question);
  const sourceEvidence = hasSourceEvidence(question);
  const sourceVersion = hasMeaningfulField(question.sourceVersion);
  const sourcePage = hasMeaningfulField(question.sourcePage);
  const sourceConfidence = !sourceLineage || !sourceEvidence ? 'low' : (!sourceVersion || !sourcePage ? 'medium' : 'high');
  const difficultyReview = difficultyValues.has(question.difficulty) && question.difficulty !== 1 && question.difficulty !== 5 ? 'aligned' : 'questionable';
  const duplicate = duplicateById.get(question.id);
  const duplicateRisk = duplicate?.risk ?? 'none';
  const reasonCodes = [];
  if (!hasAnswer(question)) reasonCodes.push('answer_missing');
  if (answerConfidence === 'low') reasonCodes.push('answer_confidence_low');
  if (!sourceLineage) reasonCodes.push('source_lineage_missing');
  if (!sourceEvidence) reasonCodes.push('source_evidence_incomplete');
  if (explanationQuality === 'poor') reasonCodes.push(explanationLength === 0 ? 'explanation_missing' : 'explanation_too_short');
  if (difficultyReview === 'questionable') reasonCodes.push('difficulty_outlier');
  if (duplicateRisk !== 'none') reasonCodes.push(`duplicate_risk_${duplicateRisk}`);
  if (categoryBalanceFor(categoryCounts[category]) !== 'within_audit_band') reasonCodes.push(`category_${categoryBalanceFor(categoryCounts[category])}`);
  const priority = answerConfidence === 'low' || sourceConfidence === 'low' || explanationQuality === 'poor'
    ? 'HIGH'
    : difficultyReview === 'questionable' || ['medium', 'high'].includes(duplicateRisk) ? 'MEDIUM' : 'LOW';
  return {
    schemaVersion: reviewSchemaVersion,
    questionId: question.id,
    inputFile: question.inputFile,
    category,
    reviewStatus: 'pending',
    priority,
    answerConfidence,
    sourceConfidence,
    explanationQuality,
    difficultyReview,
    duplicateRisk,
    reasonCodes,
    aiNotes: [],
    audit: {
      hasAnswer: hasAnswer(question),
      explanationLength,
      hasSourceLineage: sourceLineage,
      hasSourceEvidence: sourceEvidence,
      hasSourceVersion: sourceVersion,
      hasSourcePage: sourcePage,
      difficulty: question.difficulty ?? null,
      duplicateMatchId: duplicate?.matchId ?? null,
      duplicateSimilarity: duplicate ? Number(duplicate.score.toFixed(3)) : null,
    },
  };
});

entries.sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || left.questionId - right.questionId);
const priorityCounts = entries.reduce((counts, entry) => { counts[entry.priority] += 1; return counts; }, { HIGH: 0, MEDIUM: 0, LOW: 0 });
const difficultyCounts = allQuestions.reduce((counts, question) => { const key = String(question.difficulty ?? 'unknown'); counts[key] = (counts[key] ?? 0) + 1; return counts; }, {});
const explanationCounts = entries.reduce((counts, entry) => { counts[entry.explanationQuality] += 1; return counts; }, { poor: 0, fair: 0, good: 0, unknown: 0 });
const answerConfidenceCounts = entries.reduce((counts, entry) => { counts[entry.answerConfidence] += 1; return counts; }, { low: 0, medium: 0, high: 0, unknown: 0 });
const sourceConfidenceCounts = entries.reduce((counts, entry) => { counts[entry.sourceConfidence] += 1; return counts; }, { low: 0, medium: 0, high: 0, unknown: 0 });
const duplicateRiskCounts = entries.reduce((counts, entry) => { counts[entry.duplicateRisk] += 1; return counts; }, { none: 0, low: 0, medium: 0, high: 0, unknown: 0 });
const duplicatePairCounts = duplicatePairs.reduce((counts, pair) => { counts[pair.risk] += 1; return counts; }, { low: 0, medium: 0, high: 0 });
const percentage = (count) => `${(count / allQuestions.length * 100).toFixed(1)}%`;
const categoryRows = Object.entries(categoryCounts)
  .sort((left, right) => right[1] - left[1])
  .map(([category, count]) => `| ${category} | ${count} | ${percentage(count)} | ${categoryBalanceFor(count)} |`)
  .join('\n');
const difficultyRows = Object.entries(difficultyCounts)
  .sort((left, right) => Number(left[0]) - Number(right[0]))
  .map(([difficulty, count]) => `| ${difficulty} | ${count} | ${percentage(count)} |`)
  .join('\n');
const highIds = entries.filter((entry) => entry.priority === 'HIGH').map((entry) => entry.questionId);
const mediumIds = entries.filter((entry) => entry.priority === 'MEDIUM').map((entry) => entry.questionId);
const duplicateRows = duplicatePairs.slice(0, 30).map((pair) => `| ${pair.leftId} | ${pair.rightId} | ${pair.score.toFixed(3)} | ${pair.risk} |`).join('\n') || '| 無 | - | - | - |';

const queue = {
  schemaVersion: reviewSchemaVersion,
  generatedAt,
  reviewMode: 'deterministic_preflight',
  aiProviderInvoked: false,
  scope: { pool: 'formal', questionCount: allQuestions.length, inputFiles: formalInputFiles.map((item) => item.file) },
  priorityCounts,
  entries,
};
const report = `# Sprint 49 Formal Question AI Review Report

> 日期：${generatedAt}（Asia/Taipei）
> 範圍：formal pool ${allQuestions.length} 題。
> Review mode：deterministic preflight；本次沒有呼叫外部 AI provider，也沒有修改任何題目內容。

## 一、Pipeline 邊界

- Audit 只讀取 formal input JSON 與 Sprint 47 syllabus sidecar。
- Review metadata 以獨立 queue 保存，不回寫 question、answer、explanation、source 或 runtime eligibility。
- aiNotes 目前維持空陣列，等待未來 AI／人工審核填入。
- pending、staging、exam-practice 不在本次 formal audit 範圍。

## 二、Schema

Schema 檔案：src/data/questions/questionReviewSchema.ts

欄位：reviewStatus、answerConfidence、sourceConfidence、explanationQuality、difficultyReview、duplicateRisk、aiNotes。

## 三、Formal pool audit summary

| Check | Result |
|---|---:|
| Formal question count | ${allQuestions.length} |
| Missing answer | ${entries.filter((entry) => !entry.audit.hasAnswer).length} |
| Low answer confidence | ${answerConfidenceCounts.low} |
| Poor explanation | ${explanationCounts.poor} |
| Missing source lineage | ${entries.filter((entry) => !entry.audit.hasSourceLineage).length} |
| Incomplete source evidence | ${entries.filter((entry) => !entry.audit.hasSourceEvidence).length} |
| Missing source version | ${entries.filter((entry) => !entry.audit.hasSourceVersion).length} |
| Missing source page | ${entries.filter((entry) => !entry.audit.hasSourcePage).length} |
| Duplicate-risk questions | ${entries.filter((entry) => entry.duplicateRisk !== 'none').length} |

### Answer confidence

| Confidence | Count | Percentage |
|---|---:|---:|
| high | ${answerConfidenceCounts.high} | ${percentage(answerConfidenceCounts.high)} |
| medium | ${answerConfidenceCounts.medium} | ${percentage(answerConfidenceCounts.medium)} |
| low | ${answerConfidenceCounts.low} | ${percentage(answerConfidenceCounts.low)} |

### Explanation quality

| Quality | Count | Percentage |
|---|---:|---:|
| good（40 字以上） | ${explanationCounts.good} | ${percentage(explanationCounts.good)} |
| fair（20–39 字） | ${explanationCounts.fair} | ${percentage(explanationCounts.fair)} |
| poor（缺失或少於 20 字） | ${explanationCounts.poor} | ${percentage(explanationCounts.poor)} |

## 四、Difficulty distribution

| Difficulty | Count | Percentage |
|---:|---:|---:|
${difficultyRows}

Difficulty 1 與 5 共 ${entries.filter((entry) => entry.difficultyReview === 'questionable').length} 題，若沒有更高優先級訊號會進入 MEDIUM calibration queue；目前部分題目因 source／explanation 問題升為 HIGH。這是 outlier heuristic，不代表答案錯誤。

## 五、Duplicate similarity

使用 normalized question character-bigram Jaccard similarity：0.55 以上列入觀察，0.70 以上列為 medium，0.85 以上列為 high。這是候選偵測，不是自動判定重複。

| Pair risk | Pair count |
|---|---:|
| high | ${duplicatePairCounts.high} |
| medium | ${duplicatePairCounts.medium} |
| low | ${duplicatePairCounts.low} |

| Question A | Question B | Similarity | Risk |
|---:|---:|---:|---|
${duplicateRows}

## 六、Category balance

相對 audit band：大於 15% 標為 overrepresented，小於 3% 標為 underrepresented。這不是官方 blueprint 判定。

| Category | Count | Percentage | Balance signal |
|---|---:|---:|---|
${categoryRows}

## 七、Priority queue

| Priority | Count | 規則 |
|---|---:|---|
| HIGH | ${priorityCounts.HIGH} | answer confidence low、source lineage/evidence 不完整或 explanation poor |
| MEDIUM | ${priorityCounts.MEDIUM} | difficulty outlier 或 duplicate risk medium/high |
| LOW | ${priorityCounts.LOW} | 未偵測到上述問題 |

### HIGH question IDs

${highIds.length ? highIds.join('、') : '無'}

### MEDIUM question IDs

${mediumIds.length ? mediumIds.join('、') : '無'}

Queue JSON：docs/sprint49_ai_review_queue.json

## 八、後續審核規則

1. HIGH 先核對 answer、source evidence 與 explanation，不由 pipeline 自動修正。
2. MEDIUM 先做 difficulty／duplicate 人工判定，再決定是否送 AI review。
3. LOW 仍保留 pending 狀態，不能直接視為 approved。
4. AI 回填只允許寫入 review sidecar；原始題目內容必須由人工另行決定是否修改。
`;

await mkdir(join(root, 'docs'), { recursive: true });
await writeFile(join(root, 'docs/sprint49_ai_review_report.md'), `${report.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint49_ai_review_queue.json'), `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  formalCount: allQuestions.length,
  priorityCounts,
  answerConfidenceCounts,
  sourceConfidenceCounts,
  explanationCounts,
  difficultyCounts,
  duplicatePairCounts,
  duplicateRiskCounts,
  outputs: ['docs/sprint49_ai_review_report.md', 'docs/sprint49_ai_review_queue.json'],
}, null, 2));
