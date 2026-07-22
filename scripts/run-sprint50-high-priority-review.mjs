import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const generatedAt = '2026-07-23';
const queuePath = 'docs/sprint49_ai_review_queue.json';
const inputFiles = [
  'week1.json',
  'week2.json',
  'verified-extra.json',
  'source-verified.json',
  'source-verified-sprint36.json',
  'source-verified-sprint37.json',
];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const answerText = (value) => Array.isArray(value) ? value.join('\n') : String(value ?? '');
const display = (value, fallback = '未提供') => hasText(value) ? String(value).trim() : fallback;
const escapeFence = (value) => String(value ?? '').replaceAll('```', '` ` `');

const queue = JSON.parse(await readFile(join(root, queuePath), 'utf8'));
const questionsByKey = new Map();
for (const file of inputFiles) {
  const questions = JSON.parse(await readFile(join(root, 'src/data/questions', file), 'utf8'));
  for (const question of questions) questionsByKey.set(`${file}:${question.id}`, question);
}

const highEntries = queue.entries.filter((entry) => entry.priority === 'HIGH');
if (highEntries.length !== 42) throw new Error(`Expected 42 HIGH entries, got ${highEntries.length}`);

const reasonLabels = {
  source_evidence_incomplete: 'source evidence 未同時提供 evidence id、摘錄與 answer basis，無法直接完成來源核對。',
  explanation_too_short: 'explanation 少於 20 字，且目前是固定的來源自我檢核提示，無法支援學習。',
  answer_confidence_low: 'answer 或 question 含有疑似教材模板／作答指示語，需人工判定是否為有效題目。',
  difficulty_outlier: 'difficulty 為 1 或 5，需人工校準；不等同於答案錯誤。',
  category_overrepresented: '分類在 formal pool 中偏集中，屬 coverage context，不是單題內容錯誤。',
  category_underrepresented: '分類在 formal pool 中偏少，屬 coverage context，不是單題內容錯誤。',
};

const reasonText = (codes) => codes.map((code) => reasonLabels[code] ?? code).join(' ');
const sourceFor = (question) => ({
  reference: display(question.reference),
  source: display(question.source),
  sourceLabel: display(question.sourceLabel),
  sourceFile: display(question.sourceFile),
  sourceVersion: display(question.sourceVersion),
  sourcePage: display(question.sourcePage),
  sourceEvidenceIds: Array.isArray(question.sourceEvidenceIds) && question.sourceEvidenceIds.length > 0
    ? question.sourceEvidenceIds
    : [],
  evidenceExcerpt: display(question.evidenceExcerpt),
  answerBasis: display(question.answerBasis),
});

const reviewFor = (entry, question) => {
  const answer = answerText(question.answer);
  const corrupted = /whereverpossible|pleaseanswerdirectly|ontheexampaper|請依教材證據/iu.test(`${question.question}\n${answer}`);
  const answerCorrectnessRisk = corrupted ? 'critical' : entry.audit.hasSourceEvidence ? 'low' : 'unverified';
  const reviewDecision = corrupted ? 'rejected' : 'needs_edit';
  let reviewNote;
  if (corrupted) {
    reviewNote = '題目與答案均為教材頁面作答指示語，不是可作答的考試內容；明確建議 rejected。依 Sprint 50 邊界，本次不修改 question 或 answer。';
  } else if (entry.audit.hasSourceEvidence === false && entry.explanationQuality === 'poor') {
    reviewNote = '需要補齊可追溯 source evidence，並以可靠教材重寫 explanation；目前不具備安全改寫依據，因此不回寫 canonical 題庫。';
  } else if (entry.audit.hasSourceEvidence === false) {
    reviewNote = 'answer 與 explanation 目前可讀，但缺少逐題 source evidence，尚不能核准為已完成審核；本次不填入推測來源。';
  } else {
    reviewNote = '需要人工確認此疑似模板題是否保留；本次不修改 question 或 answer。';
  }
  return {
    reviewDecision,
    reviewNote,
    answerCorrectnessRisk,
  };
};

const reviews = highEntries.map((entry) => {
  const question = questionsByKey.get(`${entry.inputFile}:${entry.questionId}`);
  if (!question) throw new Error(`Question not found: ${entry.inputFile}:${entry.questionId}`);
  const decision = reviewFor(entry, question);
  return {
    schemaVersion: queue.schemaVersion,
    questionId: question.id,
    inputFile: entry.inputFile,
    type: question.type,
    question: question.question,
    category: entry.category ?? question.category ?? question.chapter ?? 'Unmapped',
    answer: question.answer,
    explanation: question.explanation,
    source: sourceFor(question),
    reviewReasonCodes: entry.reasonCodes,
    reviewReason: reasonText(entry.reasonCodes),
    checks: {
      answerCorrectnessRisk: decision.answerCorrectnessRisk,
      explanationQuality: entry.explanationQuality,
      sourceEvidence: entry.audit.hasSourceEvidence ? 'complete' : 'incomplete',
      duplicateRisk: entry.duplicateRisk,
      difficultyReview: entry.difficultyReview,
    },
    reviewDecision: decision.reviewDecision,
    reviewNote: decision.reviewNote,
    canonicalChanges: [],
  };
});

const decisionCounts = reviews.reduce((counts, review) => {
  counts[review.reviewDecision] += 1;
  return counts;
}, { approved: 0, needs_edit: 0, rejected: 0 });
const poorExplanationCount = reviews.filter((review) => review.checks.explanationQuality === 'poor').length;
const incompleteEvidenceCount = reviews.filter((review) => review.checks.sourceEvidence === 'incomplete').length;
const duplicateReviews = reviews.filter((review) => ['medium', 'high'].includes(review.checks.duplicateRisk));
const changes = { question: 0, answer: 0, explanation: 0, source: 0, reviewMetadataSidecar: reviews.length };

const output = {
  schemaVersion: queue.schemaVersion,
  generatedAt,
  reviewMode: 'high_priority_manual_review_preparation',
  sourceQueue: queuePath,
  scope: { pool: 'formal', highPriorityCount: reviews.length },
  decisionCounts,
  canonicalChanges: changes,
  entries: reviews,
};

const sourceLines = (source) => [
  `- reference：${source.reference}`,
  `- source：${source.source}`,
  `- sourceLabel：${source.sourceLabel}`,
  `- sourceFile：${source.sourceFile}`,
  `- sourceVersion：${source.sourceVersion}`,
  `- sourcePage：${source.sourcePage}`,
  `- sourceEvidenceIds：${source.sourceEvidenceIds.length ? source.sourceEvidenceIds.join('、') : '未提供'}`,
  `- evidenceExcerpt：${source.evidenceExcerpt}`,
  `- answerBasis：${source.answerBasis}`,
].join('\n');

const viewerSections = reviews.map((review) => [
  `### ${review.questionId}｜${review.category}`,
  `- input：${review.inputFile}`,
  `- type：${review.type}`,
  `- 題目：${review.question}`,
  '- answer：',
  '```text',
  escapeFence(answerText(review.answer)),
  '```',
  '- explanation：',
  '```text',
  escapeFence(review.explanation),
  '```',
  '- source：',
  sourceLines(review.source),
  `- review reason：${review.reviewReason}`,
  `- reviewDecision：${review.reviewDecision}`,
  `- reviewNote：${review.reviewNote}`,
].join('\n')).join('\n\n');

const resultRows = reviews.map((review) => {
  const reason = review.reviewReasonCodes.join(', ');
  return `| ${review.questionId} | ${review.category} | ${review.checks.answerCorrectnessRisk} | ${review.checks.explanationQuality} | ${review.checks.sourceEvidence} | ${review.checks.duplicateRisk} | ${review.reviewDecision} | ${reason} |`;
}).join('\n');

const viewer = `# Sprint 50 HIGH Priority Review Viewer

> 日期：${generatedAt}（Asia/Taipei）
> 範圍：formal pool HIGH priority 42 題。
> 本文件是逐題 review viewer；canonical question、answer、explanation、source 未在本次流程自動回寫。

## Review scope

- 每題保留 id、question、category、answer、explanation、source 與 review reason。
- source evidence 不完整時只標記為 needs_edit，不以推測內容補欄位。
- 71001 明確為教材作答指示語，標記 rejected；question／answer 仍未修改。

## 逐題檢視

${viewerSections}
`;

const result = `# Sprint 50 HIGH Priority Review Result

> 日期：${generatedAt}（Asia/Taipei）
> 範圍：formal pool HIGH priority 42 題。
> Review mode：以 Sprint 49 deterministic queue 為輸入，產生保守的人工審核輸出；未呼叫外部 AI provider。

## 一、結果摘要

| Review decision | 題數 |
|---|---:|
| approved | ${decisionCounts.approved} |
| needs_edit | ${decisionCounts.needs_edit} |
| rejected | ${decisionCounts.rejected} |

- source evidence incomplete：${incompleteEvidenceCount} 題。
- explanation poor：${poorExplanationCount} 題，均為固定「依使用者整理之來源答案進行自我檢核」類短文字，未自動重寫。
- duplicate medium/high：${duplicateReviews.length} 題，僅作候選提示，未自動刪題。
- answer correctness risk：${reviews.filter((review) => review.checks.answerCorrectnessRisk === 'critical').length} 題 critical（71001）；其餘 ${reviews.length - 1} 題因 evidence 不完整列為 unverified，不宣稱答案錯誤。

## 二、逐題檢查矩陣

| ID | Category | Answer risk | Explanation | Source evidence | Duplicate | Decision | Review reason |
|---:|---|---|---|---|---|---|---|
${resultRows}

## 三、明確處置

### 71001

題目內容與答案都是教材頁面中的英文作答指示語，不是有效的定義型題目；這是唯一判定為 \`rejected\` 的項目。由於 Sprint 50 禁止修改 question wording / answer，本次只寫入 review output，沒有把它從正式題庫移除。

### 其餘 41 題

這些題目都有 answer，但逐題 source evidence 尚未完整連結；其中 21 題的 explanation 也只有短提示語。結果標記為 \`needs_edit\`，建議後續先補可靠 source evidence，再由人工決定 explanation 是否重寫。未有足夠證據時不修改答案、不補寫來源、不批次產生 explanation。

## 四、實際 canonical 修改數量

| Field | Modified |
|---|---:|
| question wording | 0 |
| answer | 0 |
| explanation | 0 |
| source fields | 0 |
| review metadata sidecar | ${changes.reviewMetadataSidecar} records |

Review output JSON：\`docs/sprint50_high_priority_review_output.json\`
Review viewer：\`docs/sprint50_high_priority_review.md\`
`;

await writeFile(join(root, 'docs/sprint50_high_priority_review.md'), `${viewer.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint50_high_priority_result.md'), `${result.trimEnd()}\n`, 'utf8');
await writeFile(join(root, 'docs/sprint50_high_priority_review_output.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  formalHighCount: reviews.length,
  decisionCounts,
  incompleteEvidenceCount,
  poorExplanationCount,
  duplicateMediumHighCount: duplicateReviews.length,
  canonicalChanges: changes,
  outputs: [
    'docs/sprint50_high_priority_review.md',
    'docs/sprint50_high_priority_result.md',
    'docs/sprint50_high_priority_review_output.json',
  ],
}, null, 2));
