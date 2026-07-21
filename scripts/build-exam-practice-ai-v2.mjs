import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sprint = process.env.EXAM_PRACTICE_SPRINT ?? '29';
const sprintTag = `sprint${sprint}`;
const questionDir = join(root, 'src', 'data', 'questions');
const externalCandidateFile = 'D:\\OneDrive\\桌面\\IFA\\IFA_教材資料庫\\05_題庫候選\\10_待驗證題目.json';
const manualFactFile = join(root, 'scripts', 'sprint29-material-facts.json');
const sprint29CandidateFiles = [
  '03_精油個論候選.json',
  '04_禁忌與安全候選.json',
  '05_配方設計候選.json',
  '06_個案研究候選.json',
  '07_解剖生理候選.json',
  '08_精油化學候選.json',
  '09_申論與簡答候選.json',
].map((name) => `D:\\OneDrive\\桌面\\IFA\\IFA_教材資料庫\\05_題庫候選\\${name}`);
const readJson = async (filePath) => JSON.parse((await readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const asAnswer = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean).join('、') : clean(value);
const safeSourceFile = (value, fallback) => {
  const source = clean(value).replaceAll('\\', '/');
  return /\.(pdf|docx)$/i.test(source) || /private/i.test(source) ? fallback : source || fallback;
};

const categoryOf = (record) => {
  const text = `${record.category ?? ''} ${record.subCategory ?? ''} ${record.system ?? ''} ${(record.tags ?? []).join(' ')} ${record.topic ?? ''} ${record.question ?? ''}`;
  if (/考前綜合|綜合題|跨章節|總複習/.test(text)) return '考前綜合題';
  if (/植物油|基底油|固定油|油脂|脂肪酸|荷荷巴|葡萄籽油|甜杏仁油/.test(text)) return '植物油 / 基底油';
  if (/配方設計|配方|調油|調配|濃度計算|用量計算/.test(text)) return '配方設計';
  if (/諮詢流程|個案諮詢|個案評估|諮詢|初談|追蹤|生活型態/.test(text)) return '諮詢流程 / 個案評估';
  if (/職業倫理|知情同意|保密|紀錄保存|專業界線|轉介/.test(text)) return '職業倫理與轉介';
  if (/法規|考試規範|IFA規範|醫療宣稱/.test(text)) return '法規 / IFA 考試規範';
  if (/個案研究|案例題|案例|情境|個案/.test(text)) return '案例題';
  if (/精油個論|拉丁文|拉丁名|化學型|香氣特徵/.test(text)) return '精油個論';
  if (/解剖|生理|神經|骨骼|肌肉|心血管|內分泌|泌尿|淋巴|人體/.test(text)) return '解剖生理';
  if (/化學|成分|分子|萜烯|酯|醇|醛|酮/.test(text)) return '精油化學';
  if (/精油|芳香療法|芳療|個論/.test(text)) return '精油基礎';
  if (/安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|PROM/.test(text)) return '安全禁忌';
  if (/倫理|職業/.test(text)) return '職業倫理與轉介';
  if (/按摩|研究|工作室|轉介/.test(text)) return '芳療應用';
  return '其他';
};

const isSafety = (record) => categoryOf(record) === '安全禁忌' || /安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|PROM/.test(`${record.question ?? ''} ${record.topic ?? ''} ${record.answer ?? ''} ${(record.tags ?? []).join(' ')}`);
const practiceWeek = (category, type, safety) => {
  if (category === '考前綜合題') return 'week-8';
  if (type === 'case_study' || category === '案例題' || category === '諮詢流程 / 個案評估') return 'week-6';
  if (category === '配方設計' || category === '芳療應用') return 'week-5';
  if (category === '精油化學' || category === '植物油 / 基底油') return 'week-3';
  if (safety || category === '安全禁忌') return 'week-4';
  if (category === '法規 / IFA 考試規範' || category === '職業倫理與轉介') return 'week-7';
  if (type === 'essay') return 'week-7';
  return 'week-2';
};

const typeOf = (type) => {
  const value = clean(type).toLowerCase();
  if (value.includes('case')) return 'case_study';
  if (value.includes('essay')) return 'essay';
  if (value.includes('short')) return 'shortAnswer';
  if (value.includes('multi')) return 'multiSelect';
  return 'multipleChoice';
};

const [existing, week1, week2, knowledge, staging, pending, external, sprint29Candidates, manualFacts] = await Promise.all([
  readJson(join(questionDir, 'exam-practice.json')),
  readJson(join(questionDir, 'week1.json')),
  readJson(join(questionDir, 'week2.json')),
  readJson(join(root, 'src', 'data', 'knowledge', 'week1-knowledge.json')),
  readJson(join(questionDir, 'week2.staging.json')),
  readJson(join(questionDir, 'pending-review.json')),
  readJson(externalCandidateFile),
  Promise.all(sprint29CandidateFiles.map(readJson)),
  readJson(manualFactFile),
]);

const sourceFacts = [];
const addFact = (record, sourceFile, id, answer = record.answer ?? record.referenceAnswer ?? record.topic) => {
  const question = clean(record.question ?? record.topic);
  const normalizedAnswer = asAnswer(answer);
  const recordText = `${record.category ?? ''} ${record.subCategory ?? ''} ${record.question ?? ''} ${record.answer ?? ''} ${(record.tags ?? []).join(' ')}`;
  if (!question || !normalizedAnswer || /blocked_candidate|答案衝突|missing_answer|不可使用/.test(recordText)) return;
  if (record.sourceType === 'mock-exam' || record.category === '模擬題') return;
  sourceFacts.push({ id, question, answer: normalizedAnswer, category: categoryOf(record), type: typeOf(record.type), safety: isSafety(record), priority: Number(record.priority ?? record.difficulty ?? 3), sourceFile: safeSourceFile(sourceFile, 'src/data/knowledge/week1-knowledge.json'), sourcePage: record.sourcePage ?? undefined, tags: record.tags ?? [] });
};

week1.forEach((question) => addFact(question, 'src/data/questions/week1.json', `week1:${question.id}`));
week2.filter((question) => question.reviewStatus === 'verified').forEach((question) => addFact(question, 'src/data/questions/week2.json', `week2:${question.id}`));
knowledge.forEach((item) => addFact(item, 'src/data/knowledge/week1-knowledge.json', `knowledge:${item.id}`, item.topic));
for (const question of [...staging, ...pending, ...external]) {
  if (question.answer && question.verification !== 'missing_answer' && question.candidateVerification !== 'missing_answer') addFact(question, 'src/data/questions/pending-review.json', `candidate:${question.id}`);
}
sprint29Candidates.flat().forEach((question) => addFact(question, 'src/data/questions/pending-review.json', `sprint29-candidate:${question.id}`));
manualFacts.forEach((fact) => addFact(fact, fact.sourceFile, `sprint29-material:${fact.id}`));

const facts = [...new Map(sourceFacts.map((fact) => [`${normalize(fact.question)}|${normalize(fact.answer)}`, fact])).values()];
const answerFacts = facts.filter((fact) => fact.answer.length > 1);
const knowledgeFacts = facts.filter((fact) => fact.id.startsWith('knowledge:'));
const unsafeClaimPattern = /治癒|治好|可治療|能治療|宣稱治療|平衡荷爾蒙/;
const safeAnswerFacts = answerFacts.filter((fact) => !unsafeClaimPattern.test(fact.answer));
const safetyFacts = facts.filter((fact) => fact.safety && !unsafeClaimPattern.test(fact.answer));
const desiredTotal = sprint === '30' ? 1032 : 720;
const safeExisting = existing
  .filter((question) => !(question.sourceType === 'ai_generated_from_material' && unsafeClaimPattern.test(`${question.answer ?? ''} ${question.referenceAnswer ?? ''} ${question.answerGuide ?? ''}`)))
  .map((question) => {
    if (sprint !== '30' || !String(question.sourceCandidateId ?? '').startsWith('ai-sprint30:')) return question;
    const next = question.category === '配方設計' ? { ...question, practiceWeek: 'week-5', weekTag: 'week-5' } : question;
    const safetyText = `${next.category ?? ''} ${next.topicCategory ?? ''} ${next.question ?? ''}`;
    return /安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|PROM|評估|風險/.test(safetyText) || next.type === 'case_study'
      ? { ...next, riskLevel: 'safety_review' }
      : next;
  });
const stableCandidates = sprint === '30'
  ? (() => {
    const sprint30Questions = safeExisting.filter((question) => String(question.sourceCandidateId ?? '').startsWith('ai-sprint30:'));
    const protectedQuestions = sprint30Questions.filter((question) => question.practiceWeek === 'week-8');
    const formulaQuestions = sprint30Questions.filter((question) => question.category === '配方設計' && question.practiceWeek !== 'week-8').slice(0, 90);
    const otherSprint30 = sprint30Questions.filter((question) => !protectedQuestions.includes(question) && !formulaQuestions.includes(question) && question.category !== '配方設計');
    const kept = [];
    const typeCaps = { multipleChoice: 112, multiSelect: 60, shortAnswer: 40, case_study: 60, essay: 40 };
    const typeCounts = Object.fromEntries(Object.keys(typeCaps).map((type) => [type, 0]));
    const addKept = (question) => {
      if ((typeCounts[question.type] ?? 0) >= (typeCaps[question.type] ?? 0)) return;
      kept.push(question);
      typeCounts[question.type] = (typeCounts[question.type] ?? 0) + 1;
    };
    [...protectedQuestions, ...formulaQuestions, ...otherSprint30].forEach(addKept);
    return [...safeExisting.filter((question) => !String(question.sourceCandidateId ?? '').startsWith('ai-sprint30:')), ...kept];
  })()
  : safeExisting;
const stableExisting = [...stableCandidates];
const existingQuestions = new Set(stableExisting.map((question) => normalize(question.question)));
const output = [...stableExisting];
let nextId = Math.max(...existing.map((question) => Number(question.id) || 0), 50000) + 1;
let skipped = 0;
const generated = [];

const addQuestion = (fact, type, question, answer, options, variant) => {
  const normalized = normalize(question);
  if (!question || existingQuestions.has(normalized)) {
    skipped += 1;
    return false;
  }
  const safety = fact.safety || type === 'case_study' || ['案例題', '諮詢流程 / 個案評估', '職業倫理與轉介'].includes(fact.category) || /安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|PROM|評估|風險/.test(question);
  const category = fact.category;
  const sourceFile = safeSourceFile(fact.sourceFile, 'src/data/knowledge/week1-knowledge.json');
  const explanation = safety
    ? '本題由教材整理的安全重點生成，僅供考試複習；不構成診斷或治療建議，實務遇到高風險情況應依規範評估並轉介合適專業人士。'
    : '本題由正式教材、知識 mapping 或已整理候選資料生成，保留來源重點但尚待人工核對來源頁與措辭。';
  output.push({
    id: nextId++, sourceCandidateId: `ai-${sprintTag}:${fact.id}:${variant}`, weekId: 'exam-practice', practiceWeek: practiceWeek(category, type, safety), weekTag: practiceWeek(category, type, safety), topicCategory: category,
    type, chapter: category, category, difficulty: Math.min(5, Math.max(1, fact.priority)), question, options: options?.length ? [...new Set(options)] : undefined,
    answer, referenceAnswer: answer, explanation, answerGuide: fact.answer, sourceType: 'ai_generated_from_material', sourceLabel: '教材 AI 萃取練習題（非歷屆試題）',
    sourceFile, sourcePage: fact.sourcePage, reviewStatus: 'needs_review', practiceOnly: true, formalScoreEligible: false, priority: fact.priority, riskLevel: safety ? 'safety_review' : 'standard_review', tags: [...new Set([...(fact.tags ?? []), 'ai-factory-v2', sprintTag])],
  });
  existingQuestions.add(normalized);
  generated.push(output.at(-1));
  return true;
};

const distractorsFor = (fact, count, pool = safeAnswerFacts) => [...new Set(pool.filter((item) => item !== fact && item.answer !== fact.answer).map((item) => item.answer))].slice(0, count);
const focusByCategory = {
  '植物油 / 基底油': ['拉丁名與來源', '脂肪酸類型', '膚質與質地', '保存與氧化', '調和比例', '過敏與使用限制', '配方選擇'],
  '配方設計': ['目的與個案需求', '濃度與用量', '基底油選擇', '安全限制', '局部與全身使用', '香氣層次', '紀錄與追蹤'],
  '案例題': ['主訴澄清', '禁忌詢問', '保守建議', '停止操作條件', '轉介判斷', '紀錄與追蹤', '專業界線'],
  '法規 / IFA 考試規範': ['倫理界線', '知情同意', '保密與紀錄', '醫療宣稱', '來源標示', '正式與練習區分', '專業責任'],
  '諮詢流程 / 個案評估': ['初談順序', '生活型態', '過敏與用藥', '禁忌排查', '目標設定', '追蹤調整', '轉介'],
  '職業倫理與轉介': ['安全界線', '知情同意', '資料保密', '轉介時機', '紀錄責任', '溝通方式', '不作醫療宣稱'],
  '精油個論': ['拉丁名', '植物部位與萃取', '主要成分', '香氣與應用', '化學型', '禁忌與注意', '保存'],
  '考前綜合題': ['安全與禁忌', '配方與濃度', '案例與轉介', '精油個論', '植物油保存', '諮詢與紀錄', '法規與倫理'],
};
const sprint29Blueprints = [
  { category: '植物油 / 基底油', types: { multipleChoice: 20, multiSelect: 8, shortAnswer: 8, case_study: 3, essay: 1 } },
  { category: '配方設計', types: { multipleChoice: 25, multiSelect: 9, shortAnswer: 7, case_study: 6, essay: 3 } },
  { category: '案例題', types: { multipleChoice: 12, multiSelect: 6, shortAnswer: 5, case_study: 40, essay: 1 } },
  { category: '法規 / IFA 考試規範', types: { multipleChoice: 12, multiSelect: 6, shortAnswer: 3, case_study: 2, essay: 2 } },
  { category: '諮詢流程 / 個案評估', types: { multipleChoice: 15, multiSelect: 8, shortAnswer: 6, case_study: 9, essay: 2 } },
  { category: '職業倫理與轉介', types: { multipleChoice: 7, multiSelect: 4, shortAnswer: 3, case_study: 3, essay: 2 } },
  { category: '精油個論', types: { multipleChoice: 25, multiSelect: 10, shortAnswer: 8, case_study: 5, essay: 2 } },
];
const sprint30Blueprints = [
  { category: '配方設計', types: { multipleChoice: 30, multiSelect: 15, shortAnswer: 10, case_study: 45, essay: 13 } },
  { category: '考前綜合題', types: { multipleChoice: 30, multiSelect: 15, shortAnswer: 5, case_study: 20, essay: 10 } },
  { category: '案例題', types: { multipleChoice: 15, multiSelect: 10, shortAnswer: 8, case_study: 50, essay: 5 } },
  { category: '法規 / IFA 考試規範', types: { multipleChoice: 20, multiSelect: 10, shortAnswer: 5, case_study: 5, essay: 5 } },
  { category: '職業倫理與轉介', types: { multipleChoice: 18, multiSelect: 10, shortAnswer: 5, case_study: 9, essay: 5 } },
  { category: '諮詢流程 / 個案評估', types: { multipleChoice: 25, multiSelect: 15, shortAnswer: 10, case_study: 35, essay: 10 } },
  { category: '植物油 / 基底油', types: { multipleChoice: 20, multiSelect: 12, shortAnswer: 8, case_study: 18, essay: 7 } },
  { category: '精油個論', types: { multipleChoice: 25, multiSelect: 12, shortAnswer: 8, case_study: 30, essay: 10 } },
];
const targetBlueprints = sprint === '30' ? sprint30Blueprints : sprint29Blueprints;
const safeFactsByCategory = new Map(targetBlueprints.map(({ category }) => [category, safeAnswerFacts.filter((fact) => fact.category === category)]));
const templateFor = (category, type, fact, index) => {
  const focus = (focusByCategory[category] ?? ['教材重點'])[index % (focusByCategory[category]?.length ?? 1)];
  if (type === 'multipleChoice') return `【${category}｜${focus}】依教材「${fact.question}」，下列哪一項最符合來源重點？`;
  if (type === 'multiSelect') return `【${category}｜${focus}】可複選：下列哪些敘述與「${fact.question}」的教材重點相符？`;
  if (type === 'shortAnswer') return `【${category}｜${focus}】請用短答整理「${fact.question}」的參考答案。`;
  if (type === 'essay') return `【${category}｜${focus}】請以條理化方式說明「${fact.question}」，並交代安全或實務界線。`;
  return `【${category}｜${focus}】案例題：在不作疾病診斷或治療承諾的前提下，若遇到「${fact.question}」，應如何評估、紀錄與必要轉介？`;
};

if (sprint !== '30') for (const blueprint of targetBlueprints) {
  const pool = safeFactsByCategory.get(blueprint.category) ?? [];
  if (!pool.length) {
    console.warn(`Sprint${sprint} 缺少可用來源：${blueprint.category}`);
    continue;
  }
  for (const [type, target] of Object.entries(blueprint.types)) {
    for (let index = 0; index < target && output.length < desiredTotal; index += 1) {
      const fact = pool[index % pool.length];
      const question = templateFor(blueprint.category, type, fact, index);
      if (type === 'multipleChoice') addQuestion(fact, type, question, fact.answer, [fact.answer, ...distractorsFor(fact, 3, pool.length > 3 ? pool : safeAnswerFacts)], `${sprintTag}-${blueprint.category}-mc-${index}`);
      else if (type === 'multiSelect') {
        const second = pool[(index + 1) % pool.length] ?? fact;
        const answers = [...new Set([fact.answer, second.answer])];
        addQuestion(fact, type, question, answers, [...answers, ...distractorsFor(fact, 2, pool.length > 3 ? pool : safeAnswerFacts)], `${sprintTag}-${blueprint.category}-multi-${index}`);
      } else if (type === 'case_study') addQuestion(fact, type, question, `教材參考重點：${fact.answer}；實務需依規範評估，必要時停止操作或轉介，不自行診斷或治療。`, undefined, `${sprintTag}-${blueprint.category}-case-${index}`);
      else addQuestion(fact, type, question, fact.answer, undefined, `${sprintTag}-${blueprint.category}-${type}-${index}`);
    }
  }
}

if (sprint === '30') {
  const typeTargets = { multipleChoice: 112, multiSelect: 60, shortAnswer: 40, case_study: 60, essay: 40 };
  const typeCount = (type) => output.filter((question) => question.sourceType === 'ai_generated_from_material' && String(question.sourceCandidateId ?? '').startsWith('ai-sprint30:') && question.type === type).length;
  const balancePlan = [
    { category: '案例題', types: { multipleChoice: 25, multiSelect: 8, shortAnswer: 8 } },
    { category: '諮詢流程 / 個案評估', types: { multipleChoice: 10, multiSelect: 4, shortAnswer: 4 } },
    { category: '法規 / IFA 考試規範', types: { multipleChoice: 5, multiSelect: 2, shortAnswer: 2 } },
    { category: '植物油 / 基底油', types: { multipleChoice: 5, shortAnswer: 2 } },
  ];
  for (const plan of balancePlan) {
    const pool = safeFactsByCategory.get(plan.category) ?? [];
    for (const [type, requested] of Object.entries(plan.types)) {
      for (let index = 0; index < requested && typeCount(type) < typeTargets[type] && output.length < desiredTotal; index += 1) {
        const fact = pool[index % Math.max(1, pool.length)];
        if (!fact) continue;
        const question = `【Sprint30 收斂｜${plan.category}】${templateFor(plan.category, type, fact, index)}`;
        if (type === 'multipleChoice') addQuestion(fact, type, question, fact.answer, [fact.answer, ...distractorsFor(fact, 3, pool.length > 3 ? pool : safeAnswerFacts)], `sprint30-balance-${plan.category}-mc-${index}`);
        else if (type === 'multiSelect') {
          const second = pool[(index + 1) % pool.length] ?? fact;
          const answers = [...new Set([fact.answer, second.answer])];
          addQuestion(fact, type, question, answers, [...answers, ...distractorsFor(fact, 2, pool.length > 3 ? pool : safeAnswerFacts)], `sprint30-balance-${plan.category}-multi-${index}`);
        } else addQuestion(fact, type, question, fact.answer, undefined, `sprint30-balance-${plan.category}-${type}-${index}`);
      }
    }
  }
}

await writeFile(join(questionDir, 'exam-practice.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
const countBy = (key) => Object.fromEntries([...new Set(generated.map((question) => question[key] ?? '未分類'))].sort().map((value) => [value, generated.filter((question) => (question[key] ?? '未分類') === value).length]));
console.log(JSON.stringify({ file: 'src/data/questions/exam-practice.json', before: existing.length, after: output.length, generated: generated.length, skipped, generatedTypes: countBy('type'), generatedCategories: countBy('topicCategory'), generatedWeeks: countBy('practiceWeek'), generatedRiskLevels: countBy('riskLevel'), sourceType: 'ai_generated_from_material', reviewStatus: 'needs_review' }, null, 2));
