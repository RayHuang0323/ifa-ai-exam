import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const read = async (name) => JSON.parse(await readFile(join(root, 'src', 'data', 'questions', name), 'utf8'));
const [week1, week2, verifiedExtra, practice] = await Promise.all([read('week1.json'), read('week2.json'), read('verified-extra.json'), read('exam-practice.json')]);
const errors = [];
const formalIds = new Set([...week1, ...week2, ...verifiedExtra].map((question) => question.id));
const ids = new Set();
const allowedTypes = new Set(['multipleChoice', 'multiSelect', 'shortAnswer', 'essay', 'case', 'case_study']);
const allowedQualityStatuses = new Set(['needs_review', 'needs_fix', 'duplicate_candidate', 'unsafe_candidate', 'near_duplicate_review', 'verified_candidate', 'promoted_to_verified']);
for (const question of practice) {
  if (ids.has(question.id)) errors.push(`examPractice ID 重複：${question.id}`);
  ids.add(question.id);
  if (formalIds.has(question.id)) errors.push(`examPractice 不得占用正式題 ID：${question.id}`);
  for (const field of ['id', 'type', 'question', 'sourceType', 'sourceLabel', 'reviewStatus', 'topicCategory', 'practiceWeek']) if (question[field] === undefined || question[field] === null || question[field] === '') errors.push(`題目 ${question.id} 缺少 ${field}`);
  if (!allowedTypes.has(question.type)) errors.push(`題目 ${question.id} 題型未標準化：${question.type}`);
  if (question.answer === undefined && question.referenceAnswer === undefined) errors.push(`題目 ${question.id} 缺少 answer/referenceAnswer`);
  if (question.practiceOnly !== true || question.formalScoreEligible !== false) errors.push(`題目 ${question.id} practiceOnly/formalScoreEligible 標記錯誤`);
  if (question.qualityStatus !== undefined && !allowedQualityStatuses.has(question.qualityStatus)) errors.push(`題目 ${question.id} qualityStatus 不允許：${question.qualityStatus}`);
  if (question.isActive !== undefined && typeof question.isActive !== 'boolean') errors.push(`題目 ${question.id} isActive 必須是 boolean`);
  if (question.excludeFromPractice !== undefined && typeof question.excludeFromPractice !== 'boolean') errors.push(`題目 ${question.id} excludeFromPractice 必須是 boolean`);
  if (question.duplicateOf !== undefined && (!Number.isInteger(question.duplicateOf) || question.duplicateOf === question.id)) errors.push(`題目 ${question.id} duplicateOf 不合法`);
  if (question.relatedVerifiedId !== undefined && (!Number.isInteger(question.relatedVerifiedId) || !formalIds.has(question.relatedVerifiedId))) errors.push(`題目 ${question.id} relatedVerifiedId 不在 verified 題庫`);
  if (question.excludeFromPractice === true && question.isActive !== false) errors.push(`題目 ${question.id} 排除練習時 isActive 必須為 false`);
  if (question.sourceType === 'blocked' || question.reviewStatus === 'blocked') errors.push(`blocked 題不得進 examPractice：${question.id}`);
  if (question.sourceType === 'mock' && question.sourceLabel !== '模擬題（非歷屆試題）') errors.push(`mock 題標籤錯誤：${question.id}`);
  if (question.sourceType === 'ai_generated_from_material') {
    const safetyText = `${question.category ?? ''} ${question.topicCategory ?? ''} ${question.question ?? ''}`;
    const safetyQuestion = ['安全禁忌', '案例題', '諮詢流程 / 個案評估', '職業倫理與轉介'].some((category) => safetyText.includes(category)) || question.type === 'case_study' || /安全|禁忌|稀釋|濃度|孕|兒童|老人|癲癇|氣喘|肝腎|光敏|刺激|致敏|轉介|毒性|血栓|靜脈曲張|PROM|評估|風險/.test(safetyText);
    if (question.sourceLabel !== '教材 AI 萃取練習題（非歷屆試題）' || question.reviewStatus !== 'needs_review') errors.push(`AI 題標籤或狀態錯誤：${question.id}`);
    if (safetyQuestion && question.riskLevel !== 'safety_review') errors.push(`安全題缺少 safety_review：${question.id}`);
    if (!safetyQuestion && !['standard_review', 'safety_review'].includes(question.riskLevel)) errors.push(`一般 AI 題 riskLevel 錯誤：${question.id}`);
    if (/治癒|治好|可治療|能治療|宣稱治療|平衡荷爾蒙/.test(String(question.answer ?? ''))) errors.push(`AI 題含未允許醫療宣稱：${question.id}`);
  }
}
if (practice.length < 1000 || practice.length > 1050) errors.push(`examPractice Sprint30 題數須介於 1000～1050：${practice.length}`);
if (errors.length) { console.error('examPractice 驗證失敗：'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
for (const question of practice) {
  for (const field of ['topicCategory', 'practiceWeek']) if (!question[field]) errors.push(`examPractice metadata missing: ${question.id} ${field}`);
  const sourceFile = String(question.sourceFile ?? '');
  if (/\.(pdf|docx)$/i.test(sourceFile) || /private/i.test(sourceFile)) errors.push(`private source file leaked into examPractice: ${question.id}`);
  if (question.sourceType === 'mock' && (!String(question.sourceLabel).includes('模擬題') || !String(question.sourceLabel).includes('非歷屆試題'))) errors.push(`mock label missing: ${question.id}`);
  if (question.sourceType === 'extracted_material' && !String(question.sourceLabel).includes('教材萃取練習題')) errors.push(`extracted source label missing: ${question.id}`);
  if (question.sourceType === 'high_priority_review' && !String(question.sourceLabel).includes('高機率考點')) errors.push(`high-priority source label missing: ${question.id}`);
}
if (practice.length < 1000) errors.push(`examPractice Sprint30 target not met: ${practice.length}`);
const aiQuestions = practice.filter((question) => question.sourceType === 'ai_generated_from_material');
const aiCounts = Object.fromEntries([...new Set(aiQuestions.map((question) => question.type))].map((type) => [type, aiQuestions.filter((question) => question.type === type).length]));
if (aiQuestions.length < 250) errors.push(`AI generated 題數不足 250：${aiQuestions.length}`);
for (const [type, minimum] of Object.entries({ multipleChoice: 80, multiSelect: 30, shortAnswer: 40, case_study: 20, essay: 10 })) if ((aiCounts[type] ?? 0) < minimum) errors.push(`AI ${type} 題數不足 ${minimum}：${aiCounts[type] ?? 0}`);
const sprint30Questions = practice.filter((question) => String(question.sourceCandidateId ?? '').startsWith('ai-sprint30:'));
const sprint30Counts = Object.fromEntries([...new Set(sprint30Questions.map((question) => question.type))].map((type) => [type, sprint30Questions.filter((question) => question.type === type).length]));
if (sprint30Questions.length < 280) errors.push(`Sprint30 新增題數不足 280：${sprint30Questions.length}`);
for (const [type, minimum] of Object.entries({ multipleChoice: 100, multiSelect: 60, shortAnswer: 40, case_study: 60, essay: 20 })) if ((sprint30Counts[type] ?? 0) < minimum) errors.push(`Sprint30 ${type} 題數不足 ${minimum}：${sprint30Counts[type] ?? 0}`);
if (sprint30Questions.filter((question) => question.practiceWeek === 'week-5').length < 70) errors.push(`Sprint30 Week5 配方題不足 70：${sprint30Questions.filter((question) => question.practiceWeek === 'week-5').length}`);
if (sprint30Questions.filter((question) => question.practiceWeek === 'week-8').length < 70) errors.push(`Sprint30 Week8 綜合題不足 70：${sprint30Questions.filter((question) => question.practiceWeek === 'week-8').length}`);
if (errors.length) { console.error('examPractice validation failed'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
const countBy = (key) => Object.fromEntries([...new Set(practice.map((question) => question[key]))].map((value) => [value, practice.filter((question) => question[key] === value).length]));
console.log(`examPractice 驗證通過：${practice.length} 題；題型 ${JSON.stringify(countBy('type'))}；來源 ${JSON.stringify(countBy('sourceType'))}`);
