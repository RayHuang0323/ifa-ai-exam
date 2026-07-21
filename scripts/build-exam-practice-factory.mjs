import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const root = process.cwd();
const questionDir = join(root, 'src', 'data', 'questions');
const externalCandidateFile = 'D:\\OneDrive\\桌面\\IFA\\IFA_教材資料庫\\05_題庫候選\\10_待驗證題目.json';

const readJson = async (filePath) => JSON.parse((await readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const answerText = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean).join('、') : clean(value);
const safeSourceFile = (value) => {
  const normalized = clean(value).replaceAll('\\', '/');
  return /\.(pdf|docx)$/i.test(normalized) || /private/i.test(normalized)
    ? 'IFA_教材資料庫/05_題庫候選/10_待驗證題目.json'
    : normalized || 'IFA_教材資料庫/05_題庫候選/10_待驗證題目.json';
};
const safeSourceLabel = (question) => {
  if (question.sourceType === 'mock') return '模擬題（非歷屆試題）';
  if (question.sourceType === 'extracted_material') return '教材萃取練習題';
  if (question.sourceType === 'high_priority_review') return '高機率考點練習題（待人工核對）';
  return question.sourceLabel;
};

const topicCategory = (question) => {
  const text = `${question.category ?? ''} ${question.subCategory ?? ''} ${(question.tags ?? []).join(' ')} ${question.question ?? ''}`;
  if (/解剖|生理|神經|骨骼|肌肉|心血管|內分泌|泌尿|淋巴|人體/.test(text)) return '解剖生理';
  if (/化學|成分|分子|萜烯|酯|醇|醛|酮/.test(text)) return '精油化學';
  if (/精油|芳香療法|芳療|個論/.test(text)) return '精油基礎';
  if (/植物油|基底油|油脂/.test(text)) return '植物油 / 基底油';
  if (/安全|禁忌|稀釋|濃度|孕|兒童|癲癇|過敏|按摩安全/.test(text)) return '安全禁忌';
  if (/配方|調油|比例|稀釋配方/.test(text)) return '配方設計';
  if (/個案|案例|情境/.test(text)) return '案例題';
  if (/法規|IFA|考試規範|倫理/.test(text)) return '法規 / IFA 考試規範';
  if (/模擬/.test(text)) return '案例題';
  return '其他';
};

const practiceWeek = (category, sourceType) => {
  if (sourceType === 'verified-practice') return 'week-1';
  if (sourceType === 'mock') return 'week-8';
  if (category === '精油化學' || category === '植物油 / 基底油') return 'week-3';
  if (category === '安全禁忌') return 'week-4';
  if (category === '配方設計') return 'week-5';
  if (category === '案例題') return 'week-6';
  if (category === '解剖生理' || category === '精油基礎') return 'week-2';
  return 'week-7';
};

const normalizeType = (type) => {
  const value = clean(type).toLowerCase();
  if (value.includes('case')) return 'case_study';
  if (value.includes('essay') || value.includes('formula')) return 'essay';
  if (value.includes('short') || value.includes('fill')) return 'shortAnswer';
  if (value.includes('multi')) return 'multiSelect';
  if (value.includes('choice') || value === 'single' || value === 'multiple') return 'multipleChoice';
  return 'shortAnswer';
};

const buildBase = ({ id, candidateId, question, answer, type, category, sourceType, sourceLabel, reviewStatus, difficulty, tags, sourcePage }) => ({
  id,
  sourceCandidateId: candidateId,
  weekId: 'exam-practice',
  practiceWeek: practiceWeek(category, sourceType),
  topicCategory: category,
  type,
  chapter: category,
  category,
  difficulty: Number.isFinite(difficulty) ? difficulty : 3,
  question,
  options: undefined,
  answer,
  referenceAnswer: answer,
  explanation: '答案保留自題庫候選資料，尚待人工來源與答案核對。',
  answerGuide: answer,
  sourceType,
  sourceLabel,
  sourceFile: 'IFA_教材資料庫/05_題庫候選/10_待驗證題目.json',
  sourcePage: sourcePage ?? undefined,
  reviewStatus,
  formalScoreEligible: false,
  practiceOnly: true,
  priority: sourceType === 'mock' ? 2 : sourceType === 'extracted_material' ? 4 : 5,
  tags: [...new Set(tags ?? [])],
});

const [existing, candidates] = await Promise.all([
  readJson(join(questionDir, 'exam-practice.json')),
  readJson(externalCandidateFile),
]);

const output = [...existing];
const seenQuestions = new Set(existing.map((question) => normalize(question.question)));
let nextId = Math.max(...existing.map((question) => Number(question.id) || 0), 40000) + 1;
let directAdded = 0;
let variantAdded = 0;
let blockedExcluded = 0;
let duplicateExcluded = 0;
const highPriorityCandidates = [];

for (const candidate of candidates) {
  const question = clean(candidate.question);
  const answer = answerText(candidate.answer ?? candidate.referenceAnswer);
  const isMock = candidate.sourceType === 'mock' || candidate.sourceType === 'mock-exam';
  if (!question || !answer || candidate.verification === 'missing_answer') {
    blockedExcluded += 1;
    continue;
  }
  const normalizedQuestion = normalize(question);
  if (seenQuestions.has(normalizedQuestion)) {
    duplicateExcluded += 1;
  } else {
    const category = topicCategory(candidate);
    output.push(buildBase({
      id: nextId++, candidateId: String(candidate.id), question, answer, category,
      type: normalizeType(candidate.type), sourceType: isMock ? 'mock' : 'high_priority_review',
      sourceLabel: isMock ? '模擬題（非歷屆試題）' : '高機率考點練習題（待人工核對）',
      reviewStatus: isMock ? 'mock_only' : 'needs_review', difficulty: candidate.difficulty,
      tags: candidate.tags, sourcePage: candidate.sourcePage,
    }));
    seenQuestions.add(normalizedQuestion);
    directAdded += 1;
  }
  if (!isMock) highPriorityCandidates.push({ candidate, question, answer });
}

for (const { candidate, question, answer } of highPriorityCandidates) {
  const category = topicCategory(candidate);
  const variants = [
    { suffix: 'answer-focus', type: 'shortAnswer', text: `請用一句話整理「${question}」的核心答案。` },
    { suffix: 'exam-points', type: 'essay', text: `若考題詢問「${question}」，作答時應寫出哪些重點？` },
    { suffix: 'keyword-recall', type: 'shortAnswer', text: `「${question}」的答題關鍵詞有哪些？` },
  ];
  for (const variant of variants) {
    if (seenQuestions.has(normalize(variant.text))) {
      duplicateExcluded += 1;
      continue;
    }
    output.push(buildBase({
      id: nextId++, candidateId: `${candidate.id}:${variant.suffix}`, question: variant.text, answer,
      category, type: variant.type, sourceType: 'extracted_material', sourceLabel: '教材萃取練習題',
      reviewStatus: 'needs_review', difficulty: candidate.difficulty, tags: [...(candidate.tags ?? []), 'factory-v1-variant'], sourcePage: candidate.sourcePage,
    }));
    seenQuestions.add(normalize(variant.text));
    variantAdded += 1;
  }
}

const sanitizedOutput = output.map((question) => {
  const category = question.topicCategory ?? topicCategory(question);
  return { ...question, topicCategory: category, practiceWeek: question.practiceWeek ?? practiceWeek(category, question.sourceType), sourceFile: safeSourceFile(question.sourceFile), sourceLabel: safeSourceLabel(question) };
});
await writeFile(join(questionDir, 'exam-practice.json'), `${JSON.stringify(sanitizedOutput, null, 2)}\n`, 'utf8');
const countBy = (key) => Object.fromEntries([...new Set(sanitizedOutput.map((question) => question[key] ?? '未分類'))].sort().map((value) => [value, sanitizedOutput.filter((question) => (question[key] ?? '未分類') === value).length]));
console.log(JSON.stringify({ file: 'src/data/questions/exam-practice.json', before: existing.length, after: sanitizedOutput.length, directAdded, variantAdded, blockedExcluded, duplicateExcluded, types: countBy('type'), topicCategories: countBy('topicCategory'), practiceWeeks: countBy('practiceWeek'), sourceTypes: countBy('sourceType'), reviewStatuses: countBy('reviewStatus') }, null, 2));
