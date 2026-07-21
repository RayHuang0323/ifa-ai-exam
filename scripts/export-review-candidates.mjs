import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const questionDir = join(root, 'src', 'data', 'questions');
const externalRoot = join(root, '..', 'IFA_教材資料庫');
const docsDir = join(root, 'docs');

const readJson = async (filePath, fallback = []) => {
  try {
    const text = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
    return Array.isArray(parsed) ? parsed : parsed.questions ?? parsed.items ?? fallback;
  } catch {
    return fallback;
  }
};

const oneLine = (value) => String(value ?? '').replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim();
const shortText = (value, length = 90) => {
  const text = oneLine(value);
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};
const normalize = (value) => oneLine(value).toLowerCase().replace(/[\s、，。！？：；（）()「」『』"'“”‘’]/g, '');
const sourcePath = (value) => oneLine(value).replaceAll('\\', '/');

const classify = (question) => {
  if (question.sourceType === 'mock-exam' || question.sourceType === 'mock') return 'mock';
  if (question.verification === 'missing_answer' || !oneLine(question.answer)) return 'blocked';
  return 'high_priority_review';
};

const answerStatus = (question, tier) => {
  if (tier === 'mock') return oneLine(question.answer) ? 'answer_needs_review' : 'answer_missing';
  if (!oneLine(question.answer)) return 'answer_missing';
  if (question.conflictNote || String(question.verification ?? '').includes('conflict')) return 'answer_conflict';
  return 'answer_needs_review';
};

const riskReason = (question, tier) => {
  const text = `${question.category ?? ''} ${question.subCategory ?? ''} ${(question.tags ?? []).join(' ')} ${question.question ?? ''}`;
  if (/禁忌|安全|醫療|孕|藥物|疾病|毒性|皮膚刺激|過敏/.test(text)) return '高風險：醫療／禁忌／安全內容需人工核對';
  if (question.conflictNote) return `答案或來源衝突：${shortText(question.conflictNote, 80)}`;
  if (tier === 'mock') return '模擬題不得當作正式題；需保留非歷屆試題標示';
  if (question.sourcePage == null) return '來源頁碼尚未確認';
  return '來源與答案仍需人工核對';
};

const recommend = (tier, question) => {
  if (tier === 'mock') return 'mock_only';
  if (tier === 'blocked') return 'blocked';
  if (!oneLine(question.answer)) return 'blocked';
  return '可人工核對後升格';
};

const verifiedQuestions = [
  ...(await readJson(join(questionDir, 'week1.json'))),
  ...(await readJson(join(questionDir, 'week2.json'))),
];
const verifiedByQuestion = new Map(verifiedQuestions.map((question) => [normalize(question.question), question.id]));

const externalCandidates = await readJson(join(externalRoot, '05_題庫候選', '10_待驗證題目.json'));
const staging = await readJson(join(questionDir, 'week2.staging.json'));
const pending = await readJson(join(questionDir, 'pending-review.json'));
const candidates = externalCandidates.length
  ? externalCandidates.map((question) => ({ ...question, sourceFile: question.sourceFile ?? question.source }))
  : [...new Map([...staging, ...pending].map((question) => [question.id, question])).values()];

const reviewRows = candidates.map((question) => {
  const tier = classify(question);
  const exactVerifiedId = verifiedByQuestion.get(normalize(question.question));
  const nearExisting = (question.tags ?? []).find((tag) => String(tag).startsWith('near-existing:'));
  const duplicate = exactVerifiedId
    ? `是：${exactVerifiedId}`
    : question.duplicateOf
      ? `是：${question.duplicateOf}`
      : nearExisting
        ? `可能近似：${nearExisting.replace('near-existing:', '')}`
        : '否';
  return {
    ...question,
    tier,
    summary: shortText(question.question),
    sourceFile: sourcePath(question.sourceFile ?? question.source),
    sourcePage: question.sourcePage ?? '待確認',
    answerStatus: answerStatus(question, tier),
    riskReason: riskReason(question, tier),
    recommendation: recommend(tier, question),
    duplicate,
  };
});

const checklist = [
  '# Sprint 26A 候選題人工核對清單',
  '',
  `產生時間：${new Date().toISOString()}`,
  '',
  '本表由 `npm.cmd run export:review-candidates` 產生。它只列候選 metadata 與短摘要，不複製 private PDF/DOCX 全文。任何題目都不能僅因列入本表而進入 verified 題庫。',
  '',
  `候選總數：${reviewRows.length}；high_priority_review：${reviewRows.filter((row) => row.tier === 'high_priority_review').length}；mock：${reviewRows.filter((row) => row.tier === 'mock').length}；blocked：${reviewRows.filter((row) => row.tier === 'blocked').length}。`,
  '',
  '## 人工核對欄位定義',
  '',
  '- `reviewer`：核對人員。',
  '- `decision`：`verified`、`keep_needs_review`、`mock_only`、`blocked`、`duplicate_candidate`。',
  '- `verifiedAnswer`：只有核對完成且決定升格時填寫。',
  '- `notes`：來源頁、版本、答案依據與風險說明。',
  '',
  '## 候選清單',
  '',
  '| ID | 題型 | 題目摘要 | 目前分類 | 建議處理 | 來源檔案 | 頁碼 | 答案狀態 | 風險原因 | 與 verified 重複 | reviewer | decision | verifiedAnswer | notes |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...reviewRows.map((row) => `| ${oneLine(row.id)} | ${oneLine(row.type)} | ${row.summary} | ${row.tier} | ${row.recommendation} | ${row.sourceFile || '待確認'} | ${oneLine(row.sourcePage)} | ${row.answerStatus} | ${row.riskReason} | ${row.duplicate} |  |  |  |  |`),
  '',
  '### 升格前必要檢查',
  '',
  '- 來源檔案與頁碼可回溯，且不是只靠檔名推定。',
  '- 題幹、選項、答案與解釋一致；答案衝突時不得升格。',
  '- 醫療、禁忌、安全、毒性與個案風險題需更嚴格人工核對。',
  '- non-choice 題即使升格，也仍依現有規則列入待自評，不假裝精準自動判分。',
].join('\n');

const stagingById = new Map(staging.map((question) => [question.id, question]));
const pendingById = new Map(pending.map((question) => [question.id, question]));
const ids = [...new Set([...stagingById.keys(), ...pendingById.keys()])];
const duplicateGroups = ids.filter((id) => stagingById.has(id) && pendingById.has(id));
const duplicateReport = [
  '# Sprint 26A 候選題去重報告',
  '',
  `產生時間：${new Date().toISOString()}`,
  '',
  '本報告只標記候選資料的重複關係，不刪除、不覆蓋 `week2.staging.json` 或 `pending-review.json`。同一題的 staging 與 pending 版本保留作為審核歷程。',
  '',
  `重複候選組數：${duplicateGroups.length}。`,
  '',
  '| duplicate group | candidate ID | 題目摘要 | staging 來源 | pending 來源 | canonical candidate 建議 | 排除 duplicate 建議 | 與 verified 題關係 | 排除原因 |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...duplicateGroups.map((id, index) => {
    const s = stagingById.get(id);
    const p = pendingById.get(id);
    const verifiedId = verifiedByQuestion.get(normalize(s.question));
    const nearExisting = (s.tags ?? []).find((tag) => String(tag).startsWith('near-existing:'));
    const verifiedRelation = verifiedId ? `exact：${verifiedId}` : nearExisting ? `可能近似：${nearExisting.replace('near-existing:', '')}` : '未發現 exact match';
    return `| D${String(index + 1).padStart(2, '0')} | ${id} | ${shortText(s.question)} | ${sourcePath(s.source)} | ${sourcePath(p.source)} | 保留 staging 版本作為 canonical candidate，待人工核對 | pending 版本標記 duplicate_candidate，不刪除原始資料 | ${verifiedRelation} | staging/pending 為同一 candidate ID；pending 版本仍保留來源審計軌跡 |`;
  }),
  '',
  '## 建議執行順序',
  '',
  '1. 先逐組確認題幹、答案與來源頁是否真的相同。',
  '2. 確認後以 staging 版本作為工作 canonical，pending 版本只保留審計記錄。',
  '3. 若與既有 verified 題只是近似概念，不直接合併；由人工決定保留獨立題或標記 duplicate_candidate。',
  '4. 去重完成且答案、來源核對完成後，才可依 `docs/26A_verified匯入欄位規格.md` 建立匯入 patch。',
].join('\n');

await writeFile(join(docsDir, '26A_候選題人工核對清單.md'), `${checklist}\n`, 'utf8');
await writeFile(join(docsDir, '26A_候選題去重報告.md'), `${duplicateReport}\n`, 'utf8');
console.log(JSON.stringify({ generated: ['docs/26A_候選題人工核對清單.md', 'docs/26A_候選題去重報告.md'], candidateCount: reviewRows.length, tiers: Object.fromEntries(['high_priority_review', 'mock', 'blocked'].map((tier) => [tier, reviewRows.filter((row) => row.tier === tier).length])), duplicateGroups: duplicateGroups.length }, null, 2));
