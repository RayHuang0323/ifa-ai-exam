import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const practicePath = path.join(root, 'src/data/questions/exam-practice.json');
const week1Path = path.join(root, 'src/data/questions/week1.json');
const week2Path = path.join(root, 'src/data/questions/week2.json');
const extraPath = path.join(root, 'src/data/questions/verified-extra.json');
const reportPath = path.join(root, 'docs/34_verified第一批升格清單.md');
const runAt = new Date().toISOString();
const targetFormalCount = 150;

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));
const writeJson = async (filePath, value) => {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const text = (value) => (Array.isArray(value) ? value.join(' ') : String(value ?? ''));
const normalize = (value) => text(value)
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[「」『』“”"'：:，,。．.、；;！？!?（）()［］\[\]{}<>《》]/g, ' ')
  .replace(/\s+/g, '')
  .trim();
const coreQuestionKey = (question) => {
  const value = text(question);
  const quoted = value.match(/[「『]([^」』]+)[」』]/)?.[1];
  return normalize((quoted ?? value)
    .replace(/^(請用一句話整理|若考題詢問|依教材重點|考前複習|關於|請說明)/, ''));
};

const dangerPattern = /治療|治癒|根治|孕婦|妊娠|兒童|幼兒|嬰|疾病|病史|用藥|藥物|禁忌|轉介|濃度|稀釋|比例|光敏|光毒|法規|IFA|醫療|診斷|安全濃度|高血壓|癲癇|氣喘|肝腎/iu;
const allowedAiCategories = new Set(['解剖生理', '精油化學', '精油基礎', '精油個論', '芳療應用', '其他']);
const nonAiSourceTypes = new Set(['high_priority_review', 'extracted_material']);
const allowedTypes = new Set(['multipleChoice', 'multiSelect', 'shortAnswer']);

const questionText = (question) => [
  question.question,
  question.answer,
  question.referenceAnswer,
  question.options,
  question.category,
].map(text).join(' ');

const hasUsableAnswer = (question) => {
  if (question.type === 'multipleChoice') {
    return Array.isArray(question.options)
      && question.options.length >= 3
      && typeof question.answer === 'string'
      && question.options.includes(question.answer)
      && new Set(question.options.map(normalize)).size === question.options.length;
  }
  if (question.type === 'multiSelect') {
    return Array.isArray(question.options)
      && question.options.length >= 3
      && Array.isArray(question.answer)
      && question.answer.length >= 2
      && question.answer.every((answer) => question.options.includes(answer))
      && new Set(question.options.map(normalize)).size === question.options.length;
  }
  return text(question.referenceAnswer ?? question.answerGuide ?? question.answer).trim().length >= 8;
};

const isSafeCandidate = (question, { aiOnly = false } = {}) => {
  if (!question || !allowedTypes.has(question.type)) return false;
  if (question.isActive === false || question.excludeFromPractice === true) return false;
  if (question.qualityStatus === 'unsafe_candidate' || question.qualityStatus === 'duplicate_candidate') return false;
  if (question.reviewStatus === 'mock_only' || question.sourceType === 'mock') return false;
  if (question.sourceType === 'verified-practice') return false;
  if (question.riskLevel === 'safety_review') return false;
  if (aiOnly && question.sourceType !== 'ai_generated_from_material') return false;
  if (!aiOnly && !nonAiSourceTypes.has(question.sourceType)) return false;
  if (aiOnly && !allowedAiCategories.has(question.category)) return false;
  if (!text(question.question).trim() || !text(question.sourceLabel).trim() || !text(question.sourceFile).trim()) return false;
  if (!hasUsableAnswer(question)) return false;
  if (!text(question.explanation ?? question.answerGuide ?? question.teacherExplanation).trim()) return false;
  if (dangerPattern.test(questionText(question))) return false;
  if (/private|\\pdf|\\docx|\/pdf|\/docx|新建文件夾/i.test(text(question.sourceFile))) return false;
  return true;
};

const practice = await readJson(practicePath);
const week1 = await readJson(week1Path);
const week2 = await readJson(week2Path);
const existingFormal = [...week1, ...week2];
const existingIds = new Set(existingFormal.map((question) => String(question.id)));
const selectedQuestionKeys = new Set(existingFormal.map((question) => normalize(question.question)));
const selectedCoreCounts = new Map();
const selected = [];

const pick = (question) => {
  const id = String(question.id);
  const key = coreQuestionKey(question.question);
  const questionKey = normalize(question.question);
  if (existingIds.has(id) || selected.some((item) => String(item.id) === id)) return false;
  if (!key || !questionKey || selectedQuestionKeys.has(questionKey)) return false;
  if ((selectedCoreCounts.get(key) ?? 0) >= 3) return false;
  selected.push(question);
  selectedQuestionKeys.add(questionKey);
  selectedCoreCounts.set(key, (selectedCoreCounts.get(key) ?? 0) + 1);
  return true;
};

const nonAiCandidates = practice
  .filter((question) => isSafeCandidate(question))
  .sort((a, b) => Number(a.id) - Number(b.id));
nonAiCandidates.forEach(pick);

const needed = targetFormalCount - existingFormal.length;
if (selected.length > needed) {
  selected.length = needed;
}

if (selected.length < needed) {
  const aiCandidates = practice
    .filter((question) => isSafeCandidate(question, { aiOnly: true }))
    .sort((a, b) => {
      const categoryOrder = String(a.category).localeCompare(String(b.category), 'zh-Hant');
      return categoryOrder || Number(a.id) - Number(b.id);
    });
  for (const candidate of aiCandidates) {
    if (selected.length >= needed) break;
    pick(candidate);
  }
}

if (selected.length !== needed) {
  throw new Error(`Sprint 34 保守升格條件不足：需要 ${needed} 題，實際只有 ${selected.length} 題。`);
}

const promotionStartId = 60001;
const promotedPracticeIds = [];
const extraQuestions = selected.map((sourceQuestion, index) => {
  const newId = promotionStartId + index;
  const originalId = sourceQuestion.id;
  promotedPracticeIds.push({ originalId, verifiedId: newId });
  const originalExplanation = text(sourceQuestion.explanation ?? sourceQuestion.answerGuide ?? sourceQuestion.teacherExplanation);
  const formalExplanation = originalExplanation.replace(/本題尚未納入正式成績。?/g, '本題已納入 Sprint 34 正式題庫，仍需人工補來源頁碼與品質覆核。');
  const teacherExplanation = text(sourceQuestion.teacherExplanation ?? formalExplanation).replace(/本題尚未納入正式成績。?/g, '本題已納入 Sprint 34 正式題庫，仍需人工補來源頁碼與品質覆核。');
  const sourcePage = text(sourceQuestion.sourcePage).trim() || '待補';
  return {
    ...sourceQuestion,
    id: newId,
    weekId: sourceQuestion.weekTag || 'verified-extra',
    sourceLabel: '教材核對正式題（Sprint 34，非歷屆試題）',
    sourcePage,
    reviewStatus: 'verified',
    verifiedBy: 'sprint34',
    verifiedAt: runAt,
    promotionReview: 'sprint34_conservative_screen',
    originalPracticeId: originalId,
    originalSourceLabel: sourceQuestion.sourceLabel,
    explanation: `${formalExplanation}（Sprint 34 已完成來源、答案與選項唯一性核對；頁碼待補。）`,
    referenceAnswer: sourceQuestion.referenceAnswer ?? sourceQuestion.answer,
    answerGuide: sourceQuestion.answerGuide ?? sourceQuestion.referenceAnswer ?? sourceQuestion.answer,
    teacherExplanation,
    practiceOnly: false,
    formalScoreEligible: true,
    isActive: true,
    excludeFromPractice: false,
  };
});

for (const { originalId, verifiedId } of promotedPracticeIds) {
  const original = practice.find((question) => String(question.id) === String(originalId));
  if (!original) throw new Error(`找不到待標記的 examPractice 題目：${originalId}`);
  original.qualityStatus = 'promoted_to_verified';
  original.relatedVerifiedId = verifiedId;
  original.excludeFromPractice = true;
  original.isActive = false;
}

await writeJson(extraPath, extraQuestions);
await writeJson(practicePath, practice);

const typeCounts = Object.groupBy(extraQuestions, (question) => question.type);
const sourceCounts = Object.groupBy(extraQuestions, (question) => question.sourceType);
const aiCount = extraQuestions.filter((question) => question.sourceType === 'ai_generated_from_material').length;
const materialCount = extraQuestions.length - aiCount;
const rows = extraQuestions.map((question) => {
  const original = question.originalPracticeId;
  return `| ${question.id} | ${original} | ${question.type} | ${question.category} | ${question.sourceType} | ${question.sourcePage} |`;
}).join('\n');
const report = `# Sprint 34 verified 第一批升格清單

> 產生時間：${runAt}
>
> 本清單是 Sprint 34 的保守第一批正式題庫準備結果，不代表歷屆試題或官方題目。所有題目仍可接受後續人工覆核；本批未納入 safety_review、mock、unsafe、duplicate、法規不明、醫療／禁忌／濃度等高風險內容。

## 結果

- 既有 verified：${existingFormal.length} 題
- 本次新增：${extraQuestions.length} 題
- 新 verified 總數：${existingFormal.length + extraQuestions.length} 題
- 教材／整理資料來源：${materialCount} 題
- AI 教材萃取後通過保守條件：${aiCount} 題
- 新題 ID：${promotionStartId}～${promotionStartId + extraQuestions.length - 1}
- 原 examPractice 題已標記 promoted_to_verified 並排除練習抽題：${promotedPracticeIds.length} 題

## 題型分布

${Object.entries(typeCounts).map(([type, questions]) => `- ${type}：${questions.length} 題`).join('\n')}

## 來源分布

${Object.entries(sourceCounts).map(([source, questions]) => `- ${source}：${questions.length} 題`).join('\n')}

## 題目清單

| 新 verified ID | 原 examPractice ID | 題型 | 分類 | 原來源類型 | 頁碼 |
|---:|---:|---|---|---|---|
${rows}

## 後續人工確認

請在後續人工覆核時確認：答案與教材原文一致、來源頁碼補齊、選項沒有其他同樣合理答案，並確認不應將本批題目描述為歷屆試題。高風險安全、禁忌、配方、法規與轉介題仍留在 examPractice，未由本 Sprint 自動升格。
`;
await fs.writeFile(reportPath, report, 'utf8');

console.log(JSON.stringify({
  existingFormal: existingFormal.length,
  promoted: extraQuestions.length,
  newFormal: existingFormal.length + extraQuestions.length,
  aiGenerated: aiCount,
  materialDerived: materialCount,
  typeCounts: Object.fromEntries(Object.entries(typeCounts).map(([key, value]) => [key, value.length])),
  sourceCounts: Object.fromEntries(Object.entries(sourceCounts).map(([key, value]) => [key, value.length])),
  practiceExcluded: promotedPracticeIds.length,
  reportPath: path.relative(root, reportPath),
}, null, 2));
