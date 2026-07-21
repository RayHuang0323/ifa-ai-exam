import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dataDir = join(root, 'src', 'data');
const questionDir = join(dataDir, 'questions');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const evidenceIndex = await readJson(join(dataDir, 'sourceEvidenceIndex.json'));
const [week1, week2, verifiedExtra, sourceVerified, practice, staging] = await Promise.all([
  readJson(join(questionDir, 'week1.json')),
  readJson(join(questionDir, 'week2.json')),
  readJson(join(questionDir, 'verified-extra.json')),
  readJson(join(questionDir, 'source-verified.json')),
  readJson(join(questionDir, 'exam-practice.json')),
  readJson(join(questionDir, 'week2.staging.json')),
]);

const generatedBy = 'sprint36_source_verified_expansion';
const generatedAt = '2026-07-16T00:00:00.000Z';
const sourceLabel = '教材證據正式題（source_verified 第二批，非官方歷屆題）';
const allowedCategories = ['解剖生理', '精油基礎', '精油化學', '植物油／基底油'];
const blockedText = /孕|懷|婴|嬰|兒|疾病|病理|癌|高血壓|高血压|癲癇|癫痫|氣喘|气喘|藥|药|藥物|药物|治療|治疗|改善|功效|療效|疗效|診斷|诊断|疼|痛|焦慮|焦虑|抑郁|失眠|過敏|过敏|濃度|浓度|配方|更年期|月經|经期|妊|尿|腎|肾|肝|血壓|血压|血脂|膽固醇|胆固醇|免疫|心血管|中風|中风|潰瘍|溃疡|感染|傷口|伤口|燒傷|烧伤|荷爾蒙|荷尔蒙|胎兒|胎儿|急症|醫療|医疗/;
const blockedSource = /疾病|病理|商业|商業|个案咨询|個案研究|高風險|高风险/;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalized = (value) => clean(value).toLowerCase().replace(/[\s，。！？、；：:,.!?;()（）「」『』"'“”]/g, '');

const allQuestions = [...week1, ...week2, ...verifiedExtra, ...sourceVerified, ...practice, ...staging];
const usedIds = new Set(allQuestions.map((question) => Number(question.id)).filter(Number.isFinite));
const usedQuestionKeys = new Set(allQuestions.map((question) => `${normalized(question.question)}|${normalized(question.answer ?? question.referenceAnswer)}`));
let nextId = Math.max(71000, ...usedIds) + 1;

const candidates = evidenceIndex.evidence
  .filter((item) => allowedCategories.includes(item.category))
  .filter((item) => item.confidence !== 'low' && item.riskLevel !== 'safety_review')
  .filter((item) => clean(item.excerpt).length >= 18 && clean(item.excerpt).length <= 420)
  .filter((item) => !blockedText.test(clean(item.excerpt)))
  .filter((item) => !blockedSource.test(`${item.sourceFile} ${item.sourceLabel}`))
  .filter((item) => !/<w:|rsid|rPr|rFonts|paraId/i.test(item.excerpt))
  .map((item) => ({ ...item, excerpt: clean(item.excerpt) }));

const uniqueCandidates = [];
const seenEvidence = new Set();
for (const item of candidates) {
  const key = normalized(item.excerpt);
  if (!key || seenEvidence.has(key)) continue;
  seenEvidence.add(key);
  uniqueCandidates.push(item);
}

const byCategory = (category) => uniqueCandidates.filter((item) => item.category === category);
const takeRoundRobin = (counts, offset = 0) => {
  const pools = Object.fromEntries(Object.keys(counts).map((category) => [category, byCategory(category)]));
  const cursors = Object.fromEntries(Object.keys(counts).map((category) => [category, offset % Math.max(1, pools[category].length)]));
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const [category, count] of Object.entries(counts)) {
      if (result.filter((item) => item.category === category).length >= count) continue;
      const pool = pools[category];
      while (cursors[category] < pool.length && result.some((item) => item.evidenceId === pool[cursors[category]].evidenceId)) cursors[category] += 1;
      if (cursors[category] < pool.length) {
        result.push(pool[cursors[category]]);
        cursors[category] += 1;
        added = true;
      }
    }
  }
  return result;
};

const extractTopic = (excerpt) => {
  const value = clean(excerpt).replace(/^[-\d.、\s]+/, '');
  const firstPart = value.split(/[：:。；;]/)[0].trim();
  if (firstPart.length >= 2 && firstPart.length <= 28) return firstPart;
  const match = value.match(/^(.{2,24}?)(?:是|為|为|指|包括|含有|由|分為|分为)/);
  if (match?.[1]) return match[1].trim();
  return value.slice(0, 18);
};

const splitKeyPoints = (excerpt, topic) => {
  const parts = excerpt.split(/[，,。；;：:、]/).map(clean).filter((part) => part.length >= 3);
  const unique = [...new Set(parts)].filter((part) => part !== topic);
  return (unique.length ? unique : [`掌握「${topic}」與教材摘錄的對應內容`]).slice(0, 5);
};

const rubric = [
  { score: 3, label: '掌握', description: '涵蓋主要教材重點，答案方向正確且沒有超出證據的推論。' },
  { score: 2, label: '大致掌握', description: '涵蓋多數教材重點，只有小幅缺漏。' },
  { score: 1, label: '部分掌握', description: '只涵蓋少數重點，仍可看出部分理解。' },
  { score: 0, label: '未掌握', description: '空白、偏題、與證據不符，或加入未獲來源支持的高風險說法。' },
];

const baseFields = (id, type, item, question, answer, keyPoints, extra = {}) => ({
  id,
  weekId: 'source-verified-sprint36',
  type,
  chapter: item.category,
  category: item.category,
  difficulty: type === 'case_study' ? 3 : type === 'essay' ? 3 : 2,
  question,
  options: [],
  answer,
  referenceAnswer: answer,
  sampleAnswer: extra.sampleAnswer ?? `高分示範答案：${answer}`,
  explanation: `答案依據教材證據 ${item.evidenceId}${extra.explanation ? `：${extra.explanation}` : `：${item.excerpt}`}`,
  answerGuide: '請依教材證據、參考答案與評分重點作答；本題不延伸醫療診斷、治療或精確配方建議。',
  keyPoints,
  rubric,
  sourceType: 'extracted_material',
  sourceLabel,
  sourceFile: item.sourceFile,
  sourcePage: '待補',
  sourceLocation: item.sourceLocation || item.section || '教材證據索引',
  reviewStatus: 'source_verified',
  verificationType: 'source_verified',
  sourceEvidenceIds: extra.sourceEvidenceIds ?? [item.evidenceId],
  evidenceExcerpt: extra.evidenceExcerpt ?? item.excerpt,
  answerBasis: extra.answerBasis ?? `答案僅由教材證據 ${item.evidenceId} 的摘錄支持，不延伸推論。`,
  sourceConfidence: item.confidence,
  formalScoreEligible: true,
  practiceOnly: false,
  generatedBy,
  generatedAt,
  priority: type === 'case_study' ? 3 : 4,
  riskLevel: 'standard_review',
  isActive: true,
  ...extra.omitFields ? {} : {},
});

const shortItems = takeRoundRobin({ '解剖生理': 12, '精油基礎': 10, '精油化學': 8, '植物油／基底油': 10 }, 3);
const essayItems = takeRoundRobin({ '解剖生理': 4, '精油基礎': 4, '精油化學': 3, '植物油／基底油': 4 }, 37);
const caseIds = ['mat-0063', 'mat-0081', 'mat-0082', 'mat-0083', 'mat-0102'];
const caseItems = caseIds.map((id) => uniqueCandidates.find((item) => item.evidenceId === id)).filter(Boolean);

if (shortItems.length < 40 || essayItems.length < 15 || caseItems.length < 5) {
  throw new Error(`教材證據不足，未硬湊題數：shortAnswer=${shortItems.length}、essay=${essayItems.length}、case=${caseItems.length}`);
}

const generated = [];
const addQuestion = (question) => {
  const key = `${normalized(question.question)}|${normalized(question.answer ?? question.referenceAnswer)}`;
  if (usedIds.has(question.id) || usedQuestionKeys.has(key)) throw new Error(`新題 ID 或題目重複：${question.id}`);
  usedIds.add(question.id);
  usedQuestionKeys.add(key);
  generated.push(question);
};

for (const item of shortItems) {
  const topic = extractTopic(item.excerpt);
  const points = splitKeyPoints(item.excerpt, topic);
  const answer = item.excerpt;
  addQuestion(baseFields(nextId++, 'shortAnswer', item, `請依教材證據，說明「${topic}」的定義、結構或學習重點。`, answer, points));
}

for (const item of essayItems) {
  const topic = extractTopic(item.excerpt);
  const answer = `一、先界定「${topic}」的教材內容。\n二、依教材摘錄完整說明：${item.excerpt}\n三、作答時不把這段教材延伸成醫療診斷、治療或精確配方建議。`;
  const points = splitKeyPoints(item.excerpt, topic).slice(0, 6);
  addQuestion(baseFields(nextId++, 'essay', item, `請依教材證據，以有結構的段落完整說明「${topic}」的核心概念、教材重點與學習上的注意界線。`, answer, points, {
    sourceEvidenceIds: [item.evidenceId],
    evidenceExcerpt: item.excerpt,
    answerBasis: `答案由教材證據 ${item.evidenceId} 支持；題目只要求整理該摘錄，不延伸醫療或配方推論。`,
    sampleAnswer: `高分示範答案：\n${answer}`,
    explanation: `本題要求以段落整理 ${item.evidenceId} 的教材重點，重視概念完整、結構清楚與安全界線。`,
  }));
}

const casePrompts = [
  '個案想直接把單方精油塗在皮膚上',
  '個案想比較不同脂肪酸分類的教材重點',
  '個案詢問單元不飽和與多元不飽和脂肪酸的差異',
  '個案希望依教材整理脂肪酸的分類方式',
  '個案帶來一瓶已開封的植物油，想先確認教材記載的保存資訊',
];
for (let index = 0; index < caseItems.length; index += 1) {
  const item = caseItems[index];
  const topic = extractTopic(item.excerpt);
  const answer = `先回到教材所載的「${topic}」重點，向個案清楚說明：${item.excerpt}。本題只要求整理教材與確認使用界線，不把芳療建議延伸為診斷或治療。`;
  addQuestion(baseFields(nextId++, 'case_study', item, `低風險諮詢案例：${casePrompts[index]}。請依教材證據說明你會如何回應、需要先確認什麼，以及哪些內容不應自行延伸。`, answer, [item.excerpt, '先確認教材依據與使用界線', '避免診斷、治療承諾與未有證據支持的配方建議'], {
    sourceEvidenceIds: [item.evidenceId],
    evidenceExcerpt: item.excerpt,
    answerBasis: `案例答案僅以教材證據 ${item.evidenceId} 的一般概念為依據，並採保守安全的回應框架。`,
    sampleAnswer: `高分示範答案：\n${answer}`,
    explanation: `本題以 ${item.evidenceId} 的教材摘錄設計低風險案例，評估重點是能否引用來源、說明界線並避免過度推論。`,
  }));
}

await writeFile(join(questionDir, 'source-verified-sprint36.json'), `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  generatedBy,
  count: generated.length,
  typeCounts: generated.reduce((counts, question) => { counts[question.type] = (counts[question.type] ?? 0) + 1; return counts; }, {}),
  categoryCounts: generated.reduce((counts, question) => { counts[question.category] = (counts[question.category] ?? 0) + 1; return counts; }, {}),
  sourceEvidenceCount: new Set(generated.flatMap((question) => question.sourceEvidenceIds)).size,
  firstId: generated[0]?.id,
  lastId: generated.at(-1)?.id,
}, null, 2));
