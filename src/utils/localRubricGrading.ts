import type { AiGradeInput } from '../services/aiGrading';
import type { AiReviewRecord, AiReviewStatus } from './aiReviewStore';
import type { RubricMetadata } from './questionQualityGovernance';

const scoreLabels: Record<Exclude<AiReviewStatus, 'needs_human_review'>, string> = {
  mastered: '掌握',
  mostly_mastered: '大致掌握',
  partial: '部分掌握',
  not_mastered: '未掌握',
};

const synonymGroups = [
  ['禁忌症', '禁忌', '不適用', '不適合', '不宜', '避免使用'],
  ['轉介', '尋求醫療', '就醫', '醫療專業', '轉診'],
  ['稀釋', '濃度', '比例', '用量'],
  ['光敏性', '光毒', '光敏'],
  ['刺激', '致敏', '過敏反應', '皮膚反應'],
  ['病史', '疾病史', '健康狀況', '既往史'],
  ['用藥', '藥物', '服藥'],
  ['孕婦', '妊娠', '懷孕'],
  ['嬰幼兒', '兒童', '幼兒', '小孩'],
  ['高齡者', '老人', '長者'],
  ['知情同意', '同意', '告知同意'],
  ['保密', '隱私', '個資'],
  ['紀錄保存', '個案紀錄', '紀錄', '記錄'],
  ['特殊族群', '族群', '特殊對象'],
  ['評估', '評量', '確認', '詢問'],
  ['安全', '安全性', '風險', '保守'],
  ['追蹤', '後續觀察', '回訪', '調整'],
];

const dangerousRules: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /不需要.{0,5}(稀釋|濃度|比例)/, flag: '否定稀釋／濃度安全要求' },
  { pattern: /不必(詢問|確認).{0,8}(病史|禁忌|用藥|健康)/, flag: '否定必要的個案安全詢問' },
  { pattern: /(可以|能夠|可).{0,6}(治療|治癒|根治|取代醫療)/, flag: '出現治療或取代醫療宣稱' },
  { pattern: /孕婦.{0,6}(都可以|一律可以|完全可以|隨意使用)/, flag: '對孕婦使用作過度概括的肯定' },
  { pattern: /(濃度|劑量).{0,5}越高.{0,5}(越好|越有效)/, flag: '鼓勵提高濃度或劑量' },
  { pattern: /不需要.{0,5}轉介/, flag: '否定必要的專業轉介' },
  { pattern: /直接使用原液|原液直接塗抹|口服精油/, flag: '出現高風險使用方式' },
  { pattern: /自行(停藥|調藥|改藥)/, flag: '涉及自行改變藥物' },
];

const normalizeNumbers = (value: string) => value.replace(/[零〇一二兩三四五六七八九]/g, (digit) => ({ 零: '0', 〇: '0', 一: '1', 二: '2', 兩: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' })[digit] ?? digit);
const compact = (value: unknown) => normalizeNumbers(String(value ?? '').normalize('NFKC').toLocaleLowerCase('zh-TW')).replace(/[\s\u3000，。！？、；：：「」『』（）()［］〈〉《》【】,.!?;:/\\|·…—_+-]/g, '').replaceAll('[', '').replaceAll(']', '');
const answerText = (answer: string | string[] | undefined) => Array.isArray(answer) ? answer.join('、') : String(answer ?? '');
const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(compact(term)));
const isGenericPoint = (point: string) => /回答需涵蓋|題目要求的核心|必要關係|教材中的關鍵名詞|核心概念/.test(point);

const pointCoverage = (point: string, answer: string) => {
  const normalizedPoint = compact(point.replace(/^核心內容[：:]?/, ''));
  const groups = synonymGroups.filter((group) => group.some((term) => normalizedPoint.includes(compact(term))));
  if (groups.length) {
    const hitCount = groups.filter((group) => hasAny(answer, group)).length;
    return { ratio: hitCount / groups.length, partial: hitCount > 0 && hitCount < groups.length };
  }
  if (!normalizedPoint) return { ratio: 0, partial: false };
  if (answer.includes(normalizedPoint) || normalizedPoint.includes(answer) && answer.length >= 4) return { ratio: 1, partial: false };
  const ngrams = Array.from({ length: Math.max(0, normalizedPoint.length - 2) }, (_, index) => normalizedPoint.slice(index, index + 3)).filter((gram) => gram.length === 3);
  const hits = ngrams.filter((gram) => answer.includes(gram)).length;
  return { ratio: ngrams.length && hits / ngrams.length >= 0.35 ? 0.5 : 0, partial: hits > 0 };
};

const isEssay = (type: string) => ['essay', '申論', 'writing'].includes(type);
const isCase = (type: string) => ['case', 'case-study', 'case_study'].includes(type);
const isFormula = (input: AiGradeInput) => /配方|稀釋|濃度|比例|用量/.test(`${input.category ?? ''} ${input.question}`);
const hasFormulaNumber = (answer: string) => /\d+(?:\.\d+)?\s*%|百分之|(?:稀釋|濃度|比例|用量).{0,8}\d|每\d+滴/.test(answer);
const isHighRisk = (input: AiGradeInput) => input.riskLevel === 'safety_review';
const isRubricMetadata = (value: AiGradeInput['rubric']): value is RubricMetadata => Boolean(value) && !Array.isArray(value) && typeof value === 'object' && Array.isArray((value as RubricMetadata).requiredConcepts);
const minimumLengthFor = (input: AiGradeInput, metadata?: RubricMetadata) => metadata?.minimumAnswerLength ?? (isEssay(input.type) ? 24 : isCase(input.type) ? 20 : 6);
const isNoiseAnswer = (raw: string, compactAnswer: string, metadata?: RubricMetadata) => {
  const forbidden = metadata?.forbiddenPatterns ?? ['不知道', '不清楚', 'test', 'testtest', 'abc', '無關內容'];
  return forbidden.some((pattern) => compactAnswer === compact(pattern))
    || /^(?:test|abc|none|null|n\/a)+$/i.test(raw.replace(/\s+/g, ''))
    || /^(.)\1{4,}$/u.test(raw.replace(/[\s\u3000]/g, ''));
};

const sourceBasis = (input: AiGradeInput) => Array.from(new Set([
  input.sourceLabel || '題目來源待補',
  input.sourceFile || '檔案待補',
  input.sourcePage === undefined || input.sourcePage === '' ? '頁碼：待補' : `頁碼：${input.sourcePage}`,
  `章節：${input.sourceChapter || '待補'}`,
  `教材版本：${input.sourceVersion || '待補'}`,
  input.answerBasis || '答案依據：待補',
  input.evidenceExcerpt || '教材摘錄：待補',
]));

const buildRecord = (input: AiGradeInput, status: AiReviewStatus, score: 0 | 1 | 2 | 3 | null, matched: string[], missing: string[], riskFlags: string[], feedback: string, confidence: AiReviewRecord['confidence']): AiReviewRecord => ({
  questionId: input.questionId,
  sessionId: input.sessionId,
  examType: input.examType,
  aiReviewStatus: status,
  aiReviewLabel: status === 'needs_human_review' ? '需人工確認' : scoreLabels[status],
  aiScoreSuggestion: score,
  aiScoreMax: 3,
  aiScoreDisplay: score === null ? '需人工確認，不建議規準給分' : `${score} / 3 分`,
  matchedKeyPoints: matched,
  missingKeyPoints: missing,
  riskFlags,
  feedback,
  sourceBasis: sourceBasis(input),
  confidence,
  gradingMethod: 'local_rubric',
  gradingMethodLabel: '規準輔助評分',
  reviewedAt: new Date().toISOString(),
});

export const gradeWithLocalRubric = (input: AiGradeInput): AiReviewRecord => {
  const rawAnswer = answerText(input.userAnswer).trim();
  const answer = compact(rawAnswer);
  const question = compact(input.question);
  const rubricMetadata = isRubricMetadata(input.rubric) ? input.rubric : undefined;
  const keyPoints = (rubricMetadata?.requiredConcepts ?? input.keyPoints ?? []).map(String).filter((point) => point.trim() && !isGenericPoint(point));
  const rubricUsable = Boolean(rubricMetadata?.requiredConcepts.length) || Array.isArray(input.rubric) && input.rubric.some((item) => item && typeof item === 'object' && [0, 1, 2, 3].includes(Number((item as { score?: unknown }).score)));
  const highRisk = isHighRisk(input);
  const caseQuestion = isCase(input.type);
  const formulaQuestion = isFormula(input);
  const riskFlags = highRisk ? ['安全／禁忌題，規準只能提供學習參考，仍需人工核對教材。'] : [];

  if (!rawAnswer) return buildRecord(input, 'not_mastered', 0, [], keyPoints, riskFlags, '目前沒有作答內容，請先完成回答，再依參考答案與評分重點補強。', 'high');
  if (!keyPoints.length || !rubricUsable) return buildRecord(input, 'needs_human_review', null, [], keyPoints.length ? keyPoints : ['評分重點待補'], [...riskFlags, '評分重點或規準不足，無法可靠判定。'], '目前資料不足以進行可靠的規準評分，請人工核對參考答案、老師解析與教材。', 'low');

  if (isNoiseAnswer(rawAnswer, answer, rubricMetadata)) return buildRecord(input, 'not_mastered', 0, [], keyPoints, [...riskFlags, '回答疑似測試文字、空泛文字或重複灌水。'], '回答內容疑似測試文字或重複灌水，無法確認實際掌握程度。', 'high');
  if (answer.length < minimumLengthFor(input, rubricMetadata)) return buildRecord(input, 'not_mastered', 0, [], keyPoints, [...riskFlags, `回答少於非選擇題最低有效長度（${minimumLengthFor(input, rubricMetadata)} 字）。`], '回答過短，尚未達到可進行可靠規準評分的最低長度。', 'high');

  const copiedQuestion = answer === question || answer.length >= 8 && question.includes(answer) && answer.length / Math.max(question.length, 1) > 0.72;
  const repeated = /(\S{2,})\1{2,}/.test(answer) || /^(.)\1{4,}$/u.test(answer) || new Set(answer.split('')).size / Math.max(answer.length, 1) < 0.22 && answer.length > 12;
  if (copiedQuestion) return buildRecord(input, 'not_mastered', 0, [], keyPoints, [...riskFlags, '回答主要複製題目文字，未形成可評量的答題內容。'], '目前回答主要重複題目文字，請改用自己的話整理參考答案與評分重點。', 'high');
  if (repeated) return buildRecord(input, 'not_mastered', 0, [], keyPoints, [...riskFlags, '回答有大量重複文字。'], '回答內容重複度過高，無法確認實際掌握程度。', 'high');

  const matched: string[] = [];
  const missing: string[] = [];
  let totalRatio = 0;
  for (const point of keyPoints) {
    const coverage = pointCoverage(point, answer);
    totalRatio += coverage.ratio;
    if (coverage.ratio >= 0.5) matched.push(point);
    else missing.push(point);
  }
  const ratio = totalRatio / keyPoints.length;
  const forbidden = rubricMetadata?.forbiddenPatterns.filter((pattern) => pattern.trim() && answer.includes(compact(pattern))) ?? [];
  const dangerous = dangerousRules.filter((rule) => rule.pattern.test(rawAnswer)).map((rule) => rule.flag);
  if (forbidden.length) return buildRecord(input, 'not_mastered', 0, matched, missing, [...riskFlags, '回答命中規準禁止文字或無效回答樣式。'], '回答命中規準禁止樣式，請改以完整、可核對的內容作答。', 'high');
  if (dangerous.length) return buildRecord(input, 'not_mastered', 0, matched, missing, [...riskFlags, ...dangerous], '回答包含需要立即修正的安全或專業界線，請停止採用該建議並回看教材；必要時尋求醫療專業。', 'high');

  const answerLength = answer.length;
  let score: 0 | 1 | 2 | 3 = ratio >= 0.75 ? 3 : ratio >= 0.45 ? 2 : ratio > 0 ? 1 : 0;
  const feedbackParts: string[] = [];
  if (missing.length) feedbackParts.push(`優先補強：${missing.slice(0, 3).join('、')}`);
  if (isEssay(input.type) && answerLength < 24 && score === 3) { score = 2; feedbackParts.push('申論回答偏短，請補上理由、條件或安全界線。'); }
  if (caseQuestion) {
    const caseSafety = hasAny(answer, ['評估', '安全', '禁忌', '風險']);
    const caseReferral = hasAny(answer, ['轉介', '就醫', '醫療專業', '尋求醫療']);
    if (!caseSafety) { score = Math.min(score, 2) as 0 | 1 | 2 | 3; feedbackParts.push('案例題需先交代個案評估與安全／禁忌判斷。'); missing.push('案例安全評估'); }
    if (highRisk && !caseReferral) { score = Math.min(score, 2) as 0 | 1 | 2 | 3; feedbackParts.push('涉及安全風險時，請補上必要的專業轉介界線。'); missing.push('必要時轉介醫療專業'); }
  }
  if (formulaQuestion && highRisk && hasFormulaNumber(answerText(input.userAnswer))) return buildRecord(input, 'needs_human_review', null, matched, missing, [...riskFlags, '回答包含精確濃度或用量，規則不代替人工核對安全數值。'], '本機規準不可靠地判斷精確濃度或用量；請以教材版本與人工審核為準。', 'low');
  if (input.category?.includes('法規') && input.sourcePage === '待補') return buildRecord(input, 'needs_human_review', null, matched, missing, [...riskFlags, '法規／IFA 來源頁碼待補。'], '法規或 IFA 規範來源尚未補齊頁碼，本機規準不替代版本核對。', 'low');
  if (score === 3) feedbackParts.unshift('主要評分重點已命中，請仍回看教材來源確認用語與安全界線。');
  if (score === 2) feedbackParts.unshift('大致掌握核心方向，請依漏答重點補齊條件與限制。');
  if (score === 1) feedbackParts.unshift('目前只掌握部分概念，建議重新整理參考答案的核心名詞與關係。');
  if (score === 0) feedbackParts.unshift('尚未命中可確認的核心評分重點，請先回看參考答案與老師解析。');
  const status = score === 3 ? 'mastered' : score === 2 ? 'mostly_mastered' : score === 1 ? 'partial' : 'not_mastered';
  const confidence = highRisk ? 'medium' : score === 3 ? 'high' : score === 2 ? 'medium' : 'low';
  return buildRecord(input, status, score, matched, Array.from(new Set(missing)), riskFlags, feedbackParts.join(' '), confidence);
};
