import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const questionDir = join(root, 'src', 'data', 'questions');
const files = ['week1.json', 'week2.json', 'exam-practice.json'];
const nonChoiceTypes = new Set(['shortAnswer', 'essay', 'case', 'case_study']);

const readQuestions = async (file) => JSON.parse(await readFile(join(questionDir, file), 'utf8'));
const writeQuestions = async (file, questions) => writeFile(join(questionDir, file), `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
const text = (value) => Array.isArray(value) ? value.join('、') : String(value ?? '').trim();
const unique = (items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

const isSafetyQuestion = (question) => {
  const haystack = `${question.category ?? ''} ${question.topicCategory ?? ''} ${question.chapter ?? ''} ${question.question ?? ''} ${question.answer ?? ''}`;
  return question.type === 'case_study' || /安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|藥物|疾病|醫療|治療/.test(haystack);
};

const splitAnswer = (answer) => unique(text(answer)
  .replace(/^\s*[「『"]|[」』"]\s*$/g, '')
  .split(/\n+|[。！？；;]+/)
  .flatMap((part) => part.length > 36 ? part.split(/[、，,]/) : [part])
  .map((part) => part.replace(/^\s*\d+[.、)]\s*/, '').trim()))
  .filter((part) => part.length >= 2);

const makeKeyPoints = (question, answer) => {
  const segments = splitAnswer(answer);
  const safety = isSafetyQuestion(question);
  const common = safety
    ? ['先確認個案狀況、禁忌與適用範圍', '不確定或有警訊時採保守處理並考慮轉介', '不得作疾病診斷、治療承諾或取代醫療專業']
    : ['回答需涵蓋題目要求的核心概念'];
  const points = question.type === 'shortAnswer'
    ? [...segments.map((segment) => `核心內容：${segment}`), ...common]
    : question.type === 'essay'
      ? ['先界定題目核心與範圍', ...segments.map((segment) => `論述重點：${segment}`), ...(safety ? common : ['說明各重點之間的關係或流程', '最後交代適用條件或限制'])]
      : ['先完成個案評估與需求確認', ...segments.map((segment) => `答題方向：${segment}`), ...common];
  const minimum = question.type === 'shortAnswer' ? 3 : question.type === 'essay' ? 5 : 5;
  while (unique(points).length < minimum) points.push(question.type === 'essay' ? '以清楚、有順序的方式說明，避免跳過關鍵條件' : '使用教材中的關鍵名詞，並交代必要限制');
  return unique(points).slice(0, question.type === 'shortAnswer' ? 5 : question.type === 'essay' ? 8 : 8);
};

const makeSampleAnswer = (question, answer) => {
  const base = text(answer) || '待補';
  const safetyNote = isSafetyQuestion(question) ? '本題涉及安全或專業界線，示範內容僅供教材學習，不能作為診斷、治療或個別處方。' : '';
  if (question.type === 'shortAnswer') return `高分示範答案：${base}${safetyNote ? `\n${safetyNote}` : ''}`;
  if (question.type === 'essay') return `高分示範答案：先界定題目核心，再依序說明主要重點、關係與限制。\n${base}${safetyNote ? `\n${safetyNote}` : ''}`;
  return `高分示範答案：先完成個案評估與安全／禁忌確認，再依教材方向提出保守建議。\n${base}\n必要時停止操作並轉介醫療專業；不得宣稱治療疾病。`;
};

const makeOmissions = (question) => {
  const omissions = question.type === 'shortAnswer'
    ? ['漏寫題目要求的關鍵名詞或範圍', '只寫結論，未交代必要關係或條件']
    : question.type === 'essay'
      ? ['缺少清楚的答題架構', '只列名詞，未說明因果、流程、差異或限制', '忽略題目要求的安全或實務界線']
      : ['未先完成個案評估或禁忌排查', '未說明何時停止操作或轉介', '把芳療建議寫成疾病診斷或治療承諾'];
  return unique(omissions);
};

const rubric = [
  { score: 3, label: '掌握', description: '涵蓋主要評分重點，方向正確、表達完整且沒有危險說法。' },
  { score: 2, label: '大致掌握', description: '涵蓋多數核心重點，只有小幅缺漏且沒有重大錯誤或危險建議。' },
  { score: 1, label: '部分掌握', description: '碰到部分概念，但漏掉主要重點或回答不完整。' },
  { score: 0, label: '未掌握', description: '空白、偏題、明顯錯誤或出現危險建議。' },
];

const enrich = (question) => {
  if (!nonChoiceTypes.has(question.type)) return question;
  const referenceAnswer = question.referenceAnswer ?? question.answer ?? question.answerGuide ?? '';
  const sourceLabel = question.sourceLabel ?? question.reference ?? question.source ?? (question.practiceOnly ? '教材來源待補的考前練習題' : '正式題庫來源待補');
  const safety = isSafetyQuestion(question);
  return {
    ...question,
    referenceAnswer,
    sampleAnswer: question.sampleAnswer ?? makeSampleAnswer(question, referenceAnswer),
    answerGuide: question.answerGuide ?? '請依參考答案、評分重點與常見漏答提醒逐項檢核；不確定時回看教材並採保守作答。',
    keyPoints: Array.isArray(question.keyPoints) && question.keyPoints.length ? question.keyPoints : makeKeyPoints(question, referenceAnswer),
    rubric: Array.isArray(question.rubric) && question.rubric.length ? question.rubric : rubric,
    commonOmissions: Array.isArray(question.commonOmissions) && question.commonOmissions.length ? question.commonOmissions : makeOmissions(question),
    teacherExplanation: question.teacherExplanation ?? question.explanation ?? question.answerGuide ?? '請依參考答案與評分重點核對；本題內容仍應回看教材來源。',
    sourceLabel,
    sourceFile: question.sourceFile ?? '待補',
    sourcePage: question.sourcePage ?? '待補',
    riskLevel: question.riskLevel ?? (safety ? 'safety_review' : 'standard_review'),
  };
};

const summaries = [];
for (const file of files) {
  const questions = await readQuestions(file);
  const selected = questions.filter((question) => nonChoiceTypes.has(question.type));
  const enriched = questions.map(enrich);
  await writeQuestions(file, enriched);
  summaries.push({ file, total: selected.length, addedReference: selected.filter((question) => question.referenceAnswer === undefined).length, addedSample: selected.filter((question) => question.sampleAnswer === undefined).length, addedKeyPoints: selected.filter((question) => question.keyPoints === undefined).length });
}
console.log(JSON.stringify({ summaries }, null, 2));
