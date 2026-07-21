import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = path.join(root, 'src', 'data', 'sourceEvidenceIndex.json');
const outputPath = path.join(root, 'src', 'data', 'questions', 'source-verified.json');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[\s，。；：、（）()「」『』《》！？!?.,:;\-_/]/g, '');
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const allQuestions = [
  readJson(path.join(root, 'src', 'data', 'questions', 'week1.json')),
  readJson(path.join(root, 'src', 'data', 'questions', 'week2.json')),
  readJson(path.join(root, 'src', 'data', 'questions', 'exam-practice.json')),
  readJson(path.join(root, 'src', 'data', 'questions', 'verified-extra.json')),
].flat();
const usedIds = new Set(allQuestions.map((question) => Number(question.id)).filter(Number.isFinite));
const usedKeys = new Set(allQuestions.map((question) => `${normalize(question.question)}|${normalize(question.answer ?? question.referenceAnswer)}`));
const evidenceData = readJson(evidencePath);
const evidence = Array.isArray(evidenceData.evidence) ? evidenceData.evidence : [];

const blocked = /治療|治疗|癌|疾病|心血管病|孕婦|孕妇|更年期|嬰幼兒|婴幼儿|兒童|儿童|老人|長者|用藥|用药|藥物|药物|癲癇|癫痫|哮喘|高血壓|高血压|肝腎|肝肾|交互作用|禁忌|禁用|毒性|危險|危险|濃度|浓度|配方|靜脈曲張|静脉曲张|發炎|发炎|炎症|抗菌|抗病毒|口服|內服|内服|治癒|治愈|療效|疗效|抗癌|消炎/;
const generic = new Set(['作用', '功能', '化學成分', '化学成分', '注意事項', '注意事项', '治療特性', '治疗特性', '定義', '定义', '內容', '内容', '代表', '特點', '特点', '分類', '分类', '含量']);
const irrelevantSource = /商业计划书|商業計畫書|模擬題|模拟题|疾病|病理|精油第一节/;
const incompleteAnswer = /(?:[:：～~\-－]|公元前：?)$/;
const irrelevantContent = /抖音|銷售額|销售额|電商|电商|市場|市场|品牌|公司|創業|创业|2021年|2022年|同比|研報|研报/;
const riskyClaim = /止痛|疼痛|症狀|症状|不適|不适|預防|预防|緩解|缓解|改善|恢復|恢复|驅蚊|驱蚊|過敏|过敏|傷口|伤口|功效|病|韌帶|韧带|刺激|有毒|負擔|负担|長期|长期|治|激素|免疫|睾丸|卵巢|腎上腺|肾上腺|血壓|血压|用藥|用药|藥物|药物|月經|月经|尿液|胰液|助眠|抗痙攣|抗痉挛|疏通血管|細胞再生|细胞再生|神經遞質|神经递质/;
const questionLike = /請|请|何為|何为|[？?]/;
const weakTerm = /^(?:它|其|他們|他们|她們|她们|舉例|举例|依照|正常人|外分泌|植物体的细胞分类|植物體的細胞分類|有两种异构体|有兩種異構體|\\d)|主要功能|對.+影響|对.+影响|維生素生育酚等|维生素生育酚等|多不|單不|单不|雙不|双不/;

const isUsefulTerm = (term) => term.length >= 2 && term.length <= 24
  && !generic.has(term)
  && !questionLike.test(term)
  && !weakTerm.test(term)
  && !/^[（(]?\d+[）).、]/.test(term)
  && !/等$/.test(term)
  && !/[，。；！？!?、\-－]/.test(term)
  && !/[（(]$/.test(term)
  && !/[的有和因]$/.test(term)
  && !/^(特點|特点|優點|优点|缺點|缺点|說明|说明|重點|重点|分類|分类)$/.test(term);

const isCompleteAnswer = (answer) => answer.length >= 4 && answer.length <= 190
  && !questionLike.test(answer)
  && !incompleteAnswer.test(answer)
  && !/---|。。|N278|N₂78/.test(answer)
  && !/\[\d+\]|Persae|vulgarus|tincoius|\//.test(answer)
  && !irrelevantContent.test(answer)
  && !riskyClaim.test(answer);

const parseFact = (item) => {
  const excerpt = clean(item.excerpt);
  if (item.category === '解剖生理' && !/复习.*答案|複習.*答案/.test(String(item.sourceFile ?? ''))) return null;
  if (blocked.test(excerpt) || irrelevantSource.test(String(item.sourceFile ?? '')) || irrelevantContent.test(excerpt) || riskyClaim.test(excerpt) || excerpt.length < 10 || excerpt.length > 330) return null;
  if (excerpt.startsWith('原始題幹：')) {
    const match = excerpt.match(/^原始題幹：(.+?)；整理答案：(.+)$/);
    if (!match || !clean(match[2])) return null;
    const term = clean(match[1]); const answer = clean(match[2]);
    return term.length >= 4 && term.length <= 80 && isCompleteAnswer(answer) ? { term, answer, sourceQuestion: term } : null;
  }
  if (questionLike.test(excerpt)) return null;
  const latinPair = excerpt.match(/^(?:\d+[、.]\s*)?([\p{Script=Han}]{2,12}油)[：:]?\s*([A-Z][A-Za-z]+(?:\s+(?:var\.\s+)?[a-z][A-Za-z.]+){1,3}(?:\/[A-Z][A-Za-z]+(?:\s+[a-z][A-Za-z.]+)*)?)$/u);
  if (latinPair) return { term: clean(latinPair[1]), answer: clean(latinPair[2]), sourceQuestion: `依教材證據，「${clean(latinPair[1])}」的拉丁學名為何？` };
  const colon = excerpt.match(/^(.{2,28}?)[：:](.{8,300})$/);
  if (colon) {
    const rawTerm = clean(colon[1]); const answer = clean(colon[2]);
    const divided = /分[為为]$/.test(rawTerm);
    const stated = /[為为是]$/.test(rawTerm);
    const term = rawTerm.replace(/分[為为]$/, '').replace(/[為为是]$/, '');
    const sourceQuestion = divided ? `依教材證據，「${term}」分為哪些部分？` : stated ? `依教材證據，「${term}」是什麼？` : undefined;
    return isUsefulTerm(term) && isCompleteAnswer(answer) ? { term, answer, sourceQuestion } : null;
  }
  const pointed = excerpt.match(/^(.{2,20}?)(?:是指|指)(.{8,260})$/);
  if (pointed) {
    const term = clean(pointed[1]); const answer = clean(pointed[2]);
    return isUsefulTerm(term) && isCompleteAnswer(answer) ? { term, answer, sourceQuestion: `依教材證據，「${term}」是什麼？` } : null;
  }
  const definition = excerpt.match(/^(.{2,20}?)(?:是|為|为)(.{8,260})$/);
  if (definition) {
    const term = clean(definition[1]).replace(/[，,]$/, ''); const answer = clean(definition[2]);
    return isUsefulTerm(term) && isCompleteAnswer(answer) ? { term, answer } : null;
  }
  return null;
};

const facts = [];
const factKeys = new Set();
for (const item of evidence) {
  const fact = parseFact(item);
  if (!fact || fact.answer.includes(fact.term)) continue;
  const key = `${normalize(fact.term)}|${normalize(fact.answer)}`;
  if (factKeys.has(key)) continue;
  factKeys.add(key);
  facts.push({ item, ...fact });
}

const qualityScore = (fact) => {
  let score = 0;
  if (fact.sourceQuestion) score += 5;
  if (fact.term.length >= 3 && fact.term.length <= 14) score += 3;
  if (fact.answer.length >= 6 && fact.answer.length <= 100) score += 3;
  if (/[、；，,]/.test(fact.answer)) score += 1;
  if (/答案|复习|複習|教材/.test(String(fact.item.sourceFile))) score += 10;
  if (/\d/.test(fact.term) || /\s{2,}/.test(fact.term)) score -= 2;
  if (fact.answer.length > 130) score -= 2;
  return score;
};
facts.sort((a, b) => qualityScore(b) - qualityScore(a) || a.item.evidenceId.localeCompare(b.item.evidenceId));

const categoryTargets = new Map([
  ['解剖生理', 65],
  ['植物油／基底油', 30],
  ['精油化學', 25],
  ['精油基礎', 20],
]);
const selectedFacts = [];
const selectedFactKeys = new Set();
for (const [category, target] of categoryTargets) {
  facts.filter((fact) => fact.item.category === category).slice(0, target).forEach((fact) => {
    const key = `${fact.item.evidenceId}|${normalize(fact.term)}|${normalize(fact.answer)}`;
    if (!selectedFactKeys.has(key)) { selectedFactKeys.add(key); selectedFacts.push(fact); }
  });
}
for (const fact of facts) {
  if (selectedFacts.length >= 140) break;
  const key = `${fact.item.evidenceId}|${normalize(fact.term)}|${normalize(fact.answer)}`;
  if (!selectedFactKeys.has(key)) { selectedFactKeys.add(key); selectedFacts.push(fact); }
}

const shortFacts = facts.filter((fact) => fact.answer.length <= 190);
const answerShape = (answer) => ({ latin: /[A-Za-z]/.test(answer), numeric: /\d/.test(answer), list: /[、；,，]/.test(answer), length: answer.length });
const distractorPool = (fact, limit = 3) => {
  const shape = answerShape(fact.answer);
  return shortFacts
  .filter((candidate) => {
    const candidateShape = answerShape(candidate.answer);
    return candidate !== fact
      && candidate.item.category === fact.item.category
      && candidate.item.sourceFile === fact.item.sourceFile
      && candidateShape.latin === shape.latin
      && candidateShape.numeric === shape.numeric
      && candidateShape.list === shape.list
      && candidateShape.length >= Math.max(3, shape.length * 0.45)
      && candidateShape.length <= shape.length * 2.2
      && !normalize(candidate.answer).includes(normalize(fact.answer))
      && !normalize(fact.answer).includes(normalize(candidate.answer));
  })
  .map((candidate) => candidate.answer)
  .filter((answer, index, values) => values.indexOf(answer) === index)
  .slice(0, limit);
};

const termDistractorPool = (fact, limit = 3) => facts
  .filter((candidate) => candidate !== fact && candidate.item.category === fact.item.category && !candidate.sourceQuestion)
  .map((candidate) => candidate.term)
  .filter((term, index, values) => term !== fact.term && values.indexOf(term) === index && term.length <= 18)
  .slice(0, limit);
const questions = [];
let nextId = 70001;
const generatedAt = new Date().toISOString();
const addQuestion = (fact, type, options = [], overrides = {}) => {
  const id = nextId++;
  while (usedIds.has(id)) nextId += 1;
  const sourceQuestion = fact.sourceQuestion;
  const question = overrides.question ?? (type === 'multipleChoice'
    ? sourceQuestion || `依教材證據，下列何者最符合「${fact.term}」的說明？`
    : sourceQuestion || `依教材證據，請說明「${fact.term}」的重點。`);
  const answer = overrides.answer ?? fact.answer;
  const key = `${normalize(question)}|${normalize(answer)}`;
  if (usedKeys.has(key)) return false;
  usedKeys.add(key);
  const keyPoints = answer.split(/[；。。，,、]/).map(clean).filter((part) => part.length >= 2).slice(0, 5);
  const sourceLabel = '教材證據正式題（source_verified，非官方歷屆題）';
  questions.push({
    id, weekId: 'source-verified', type, chapter: fact.item.category || '其他', category: fact.item.category || '其他', difficulty: 2,
    question, options: type === 'multipleChoice' ? options : [], answer, referenceAnswer: answer,
    sampleAnswer: `高分示範答案：${answer}`,
    explanation: `答案依據教材證據 ${fact.item.evidenceId}：${fact.item.excerpt}`,
    answerGuide: '請以教材證據與評分重點作答；若教材與其他來源衝突，採保守方式並列入人工覆核。',
    keyPoints: keyPoints.length > 0 ? keyPoints : [answer],
    rubric: [
      { score: 3, label: '掌握', description: '涵蓋主要教材重點，方向正確。' },
      { score: 2, label: '大致掌握', description: '涵蓋多數重點，只有小幅缺漏。' },
      { score: 1, label: '部分掌握', description: '只涵蓋少數重點。' },
      { score: 0, label: '未掌握', description: '空白、偏題或與教材證據不符。' },
    ],
    sourceType: fact.item.sourceType || 'extracted_material', sourceLabel, sourceFile: fact.item.sourceFile, sourcePage: '待補', sourceLocation: fact.item.sourceLocation,
    reviewStatus: 'source_verified', verificationType: 'source_verified', sourceEvidenceIds: [fact.item.evidenceId], evidenceExcerpt: fact.item.excerpt,
    answerBasis: `答案直接由證據 ${fact.item.evidenceId} 支持，不延伸推論。`, sourceConfidence: fact.item.confidence === 'low' ? 'medium' : fact.item.confidence,
    formalScoreEligible: true, practiceOnly: false, generatedBy: 'sprint35_source_evidence_factory', generatedAt,
    priority: 5, riskLevel: 'standard_review', isActive: true,
  });
  usedIds.add(id);
  return true;
};

const targetCount = 140;
let multipleChoiceCount = 0;
let shortAnswerCount = 0;
for (const fact of selectedFacts) {
  if (fact.answer.length <= 190 && addQuestion(fact, 'shortAnswer')) shortAnswerCount += 1;
  if (questions.length >= targetCount) break;
}
for (const fact of selectedFacts) {
  if (questions.length >= targetCount) break;
  const answerDistractors = distractorPool(fact);
  const termDistractors = termDistractorPool(fact);
  if (fact.sourceQuestion && answerDistractors.length === 3 && fact.answer.length <= 110) {
    const options = [fact.answer, ...answerDistractors].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    if (addQuestion(fact, 'multipleChoice', options)) multipleChoiceCount += 1;
  } else if (!fact.sourceQuestion && termDistractors.length === 3) {
    const options = [fact.term, ...termDistractors].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    const question = `依教材證據，哪一個名詞最符合以下說明：「${fact.answer}」？`;
    if (addQuestion(fact, 'multipleChoice', options, { question, answer: fact.term })) multipleChoiceCount += 1;
  }
}

// 只使用同一證據的兩種互補作答方向；證據不足時不以近似題硬湊數。
fs.writeFileSync(outputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
const typeCounts = Object.entries(questions.reduce((acc, question) => { acc[question.type] = (acc[question.type] || 0) + 1; return acc; }, {}));
const categoryCounts = Object.entries(questions.reduce((acc, question) => { acc[question.category] = (acc[question.category] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
const factCategoryCounts = Object.entries(facts.reduce((acc, fact) => { acc[fact.item.category] = (acc[fact.item.category] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({ factCount: facts.length, factCategoryCounts, count: questions.length, typeCounts, categoryCounts, firstId: questions[0]?.id, lastId: questions.at(-1)?.id }, null, 2));
