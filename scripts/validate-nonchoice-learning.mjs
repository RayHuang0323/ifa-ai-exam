import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const read = async (name) => JSON.parse(await readFile(join(root, 'src', 'data', 'questions', name), 'utf8'));
const [week1, week2, practice] = await Promise.all([read('week1.json'), read('week2.json'), read('exam-practice.json')]);
const all = [...week1, ...week2, ...practice];
const nonChoice = all.filter((question) => ['shortAnswer', 'essay', 'case', 'case_study'].includes(question.type));
const errors = [];
for (const question of nonChoice) {
  for (const field of ['referenceAnswer', 'sampleAnswer', 'answerGuide', 'keyPoints', 'rubric', 'commonOmissions', 'teacherExplanation', 'sourceLabel', 'sourceFile', 'sourcePage', 'riskLevel']) {
    const value = question[field];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) errors.push(`${question.id} 缺少 ${field}`);
  }
  if (!Array.isArray(question.keyPoints)) errors.push(`${question.id} keyPoints 必須為陣列`);
  if (!Array.isArray(question.rubric)) errors.push(`${question.id} rubric 必須為陣列`);
  if (!Array.isArray(question.commonOmissions)) errors.push(`${question.id} commonOmissions 必須為陣列`);
  if (question.type === 'case_study' && question.riskLevel !== 'safety_review') errors.push(`${question.id} case_study 必須為 safety_review`);
  if (question.sourcePage !== '待補' && !/^[0-9]+(?:[-–][0-9]+)?$/.test(String(question.sourcePage))) errors.push(`${question.id} sourcePage 格式不明：${question.sourcePage}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`非選擇題內容驗證通過：${nonChoice.length} 題；shortAnswer／essay／case_study 均具備參考答案、示範答案、評分重點、解析與來源欄位。`);
