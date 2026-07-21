import { isQuestionProtected } from './answeredQuestionLock';

export type QuestionClarity = 'clear' | 'needs_review';
export type ExamStyle = 'formal' | 'needs_revision';
export type LeakageRisk = 'low' | 'medium' | 'high';
export type QuestionConfidence = 'A' | 'B' | 'C';
export type AnswerConfidence = 'A+' | 'A' | 'B' | 'C';
export type MetadataCompleteness = 'complete' | 'partial' | 'missing';
export type BQualityDisposition = 'upgrade_to_A' | 'keep_B' | 'downgrade_to_practice';
export type SourceReviewDisposition = 'KEEP' | 'REVISE' | 'DOWNGRADE';

export interface QuestionQualityMetadata {
  clarity: QuestionClarity;
  examStyle: ExamStyle;
  requiresRevision: boolean;
  revisionReason: string;
}

export interface OptionQualityMetadata {
  answerPosition: number | number[] | null;
  optionSimilarity: number;
  leakageRisk: LeakageRisk;
  leakageReason: string;
}

export interface SourceReviewMetadata {
  disposition: SourceReviewDisposition;
  reasons: string[];
}

export interface QuestionNaturalnessAudit {
  natural: boolean;
  issues: string[];
  displayQuestion: string;
}

export interface QuestionLanguageAudit extends QuestionNaturalnessAudit {
  isNonChoice: boolean;
  originalQuestion: string;
  requiredDirections: string[];
  hasAnswer: boolean;
  hasExplanation: boolean;
  hasAnswerBasis: boolean;
  needsImprovement: boolean;
}

export type FormalQuestionRefinementStatus = 'improved' | 'kept' | 'manual_review';
export interface FormalQuestionRefinement {
  status: FormalQuestionRefinementStatus;
  changed: boolean;
  displayQuestion: string;
  issues: string[];
  manualReviewReasons: string[];
}

export interface BQualityReview {
  disposition: BQualityDisposition;
  reasons: string[];
  checks: {
    naturalness: 'pass' | 'review';
    answerSupport: 'pass' | 'review';
    optionFairness: 'pass' | 'review';
    formalFit: 'pass' | 'review';
  };
}

export interface ConfidenceQuestion {
  practiceOnly?: boolean;
  formalScoreEligible?: boolean;
  qualityStatus?: string;
  sourceQualityLevel?: 'A' | 'B' | 'C';
  questionQuality?: QuestionQualityMetadata;
  optionQuality?: OptionQualityMetadata;
  sourceReview?: SourceReviewMetadata;
  imageMissing?: boolean;
  sourceType?: string;
  reviewStatus?: string;
  answerConfidence?: AnswerConfidence;
  bQualityReview?: BQualityReview;
}

type OptionQuestion = {
  id: number;
  type: string;
  question: string;
  options?: string[];
  displayOptions?: string[];
  answer: string | string[];
  optionQuality?: OptionQualityMetadata;
};

const aiResiduePattern = /依(?:照)?教材(?:\s*(?:證據|证据|evidence))?|根據教材(?:內容)?(?:指出|說明)?|请根据教材|請說明教材中的|教材如何(?:說明|描述)|教材(?:證據|证据)|教材(?:中)?(?:列出|指出|記載|顯示|提到)|(?:AI|人工智慧|模型)生成|提示詞|提示词/i;
const imageDependencyPattern = /如圖|下圖|圖中|依圖片|依圖|請判讀|请判读|請看圖|圖示/;
const choiceTypes = new Set(['multipleChoice', 'multiSelect', 'single', 'multiple']);
export const nonChoiceQuestionTypes = new Set(['shortAnswer', 'short_answer', 'essay', 'case_study', 'case', 'case-study', 'writing']);

const compact = (value: string) => value.normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/[\s\u3000\p{P}\p{S}]/gu, '');
const normalizedSet = (values: string[]) => new Set(values.map(compact).filter(Boolean));
const optionSetSimilarity = (left: string[] = [], right: string[] = []) => {
  const leftSet = normalizedSet(left);
  const rightSet = normalizedSet(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (!union.size) return 0;
  const intersection = [...leftSet].filter((value) => rightSet.has(value)).length;
  return Math.round((intersection / union.size) * 100) / 100;
};
const answerList = (answer: string | string[]) => Array.isArray(answer) ? answer : [answer];
const answerPositions = (options: string[], answer: string | string[]) => answerList(answer).map((value) => options.indexOf(value)).filter((index) => index >= 0).sort((a, b) => a - b);
const positionSignature = (positions: number[]) => positions.join(',');
const rotate = <T,>(values: T[], amount: number) => {
  if (!values.length) return values;
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
};

export const hasAiGeneratedWording = (question: string) => aiResiduePattern.test(question);
export const hasImageDependency = (question: string) => imageDependencyPattern.test(question);

export const normalizeExamQuestion = (question: string, type: string) => {
  let next = question
    .replace(/^教材如何(?:說明|描述)/, '請說明')
    .replace(/請說明教材中的/g, '請說明')
    .replace(/^教材(?:中)?列出/g, '請列出')
    .replace(/^教材(?:中)?(?:指出|記載|顯示|提到)/g, '請說明')
    .replace(/教材(?:中)?(?:列出|指出|記載|顯示|提到)的?/g, '')
    .replace(/請?依(?:照)?教材(?:\s*(?:證據|证据|evidence))?/gi, '')
    .replace(/根據教材(?:內容)?(?:指出|說明)?[，、,:：\s]*/g, '')
    .replace(/请根据教材(?:内容)?(?:指出|说明)?[，、,:：\s]*/g, '')
    .replace(/只依(?:照)?教材/gi, '')
    .replace(/教材(?:證據|证据)/gi, '')
    .replace(/教材中的關鍵概念/g, '相關關鍵概念')
    .replace(/^\s*[，、,:：\s]+/, '')
    .replace(/\s+[，、,:：]/g, '，')
    .trim();
  if (type === 'shortAnswer' || type === 'short_answer') {
    next = next.replace(/^「(.+)」是什麼？$/, '請說明「$1」的定義、主要特性、應用與注意事項。');
    next = next.replace(/^請說明「(.+)」的重點。$/, '請說明「$1」的主要特性、應用與注意事項。');
    next = next.replace(/^請說明「(.+)」的重要點。$/, '請說明「$1」的主要特性、應用與注意事項。');
    next = next.replace(/^請說明「(.+)」的定義、結構或學習重點。$/, '請說明「$1」的定義、主要特徵與功能。');
    next = next.replace(/^說明「(.+)」的定義、結構或學習重點。$/, '請說明「$1」的定義、主要特徵與功能。');
  }
  if (type === 'essay' && next.startsWith('以有結構的段落完整說明')) next = next.replace(/^以有結構的段落完整說明/, '請以有結構的段落說明');
  return next;
};

type LanguageContext = { category?: string; chapter?: string; topic?: string };
const genericContext = new Set(['考古題', 'general', '未分類', '待補', 'metadata_missing']);
const hasTextValue = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && !['待補', 'metadata_missing', '來源資料待補'].includes(value.trim());
const questionTopic = (context: LanguageContext) => [context.topic, context.category, context.chapter]
  .map((value) => value?.trim())
  .find((value) => Boolean(value) && !genericContext.has(value as string));
const removeTrailingPunctuation = (value: string) => value.trim().replace(/[。！？?]+$/u, '');
const appendDirection = (value: string, direction: string) => `${removeTrailingPunctuation(value)}。${direction}`;
const typeDirections = {
  shortAnswer: ['定義', '主要特性', '用途', '安全注意事項'],
  essay: ['比較', '分析', '評估', '相關條件與限制'],
  case: ['個案背景', '使用需求', '安全限制', '評估與處理順序'],
};

const directionPattern = /定義|特性|功能|作用|用途|應用|注意事項|注意界線|差異|原因|順序|列舉|列出|說明|解釋|比較|評估|處理|回應|情境|背景|限制/;

/**
 * Build a learner-facing stem without replacing the canonical question.
 * This layer only adds context and answer direction; it never invents answer facts.
 */
export const enhanceDisplayQuestion = (question: string, type: string, context: LanguageContext = {}) => {
  let next = normalizeExamQuestion(question, type);
  const topic = questionTopic(context);
  const isShort = type === 'shortAnswer' || type === 'short_answer';
  const isEssayType = type === 'essay' || type === 'writing';
  const isCaseType = type === 'case' || type === 'case-study' || type === 'case_study';

  if (isShort) {
    const whatIs = next.match(/^(?:何謂|什麼是|什么是)「?([^」？?]+)」?[？?]?$/u);
    if (whatIs) next = `請說明「${whatIs[1].trim()}」的定義、主要特性、功能或作用，以及適用的注意事項。`;
    else if (!directionPattern.test(next)) next = appendDirection(next, '請以簡答方式回應主要概念，並補充相關特性、功能或適用的注意事項。');
  }
  if (isEssayType && !directionPattern.test(next)) next = appendDirection(next, '請先界定主題，再依序說明原因、相關條件與安全／實務限制。');
  if (isEssayType && directionPattern.test(next) && !/界定|原因|條件|限制|評估|分析/.test(next)) next = appendDirection(next, '作答時請交代主題界定、相關條件與限制。');
  if (isCaseType) {
    if (!/^案例情境：/u.test(next)) next = `案例情境：${next}`;
    if (!/作答方向：/u.test(next)) next = appendDirection(next, '作答方向：先交代個案背景與問題，再說明評估、處理順序及安全界線。');
  }

  if (topic && !next.startsWith(`【${topic}】`)) next = `【${topic}】${next}`;
  return next.trim();
};

export const auditQuestionLanguage = (question: {
  id?: number;
  type: string;
  question: string;
  answer?: string | string[];
  explanation?: string;
  answerBasis?: string;
  category?: string;
  chapter?: string;
  topic?: string;
  displayQuestion?: string;
}) : QuestionLanguageAudit => {
  const isNonChoice = nonChoiceQuestionTypes.has(question.type);
  const displayQuestion = question.displayQuestion?.trim() || enhanceDisplayQuestion(question.question, question.type, question);
  const isShort = question.type === 'shortAnswer' || question.type === 'short_answer';
  const isEssayType = question.type === 'essay' || question.type === 'writing';
  const isCaseType = question.type === 'case' || question.type === 'case-study' || question.type === 'case_study';
  const displayWithoutContext = displayQuestion.replace(/^【[^】]+】/u, '');
  const normalizedOriginal = normalizeExamQuestion(question.question, question.type);
  const issues: string[] = [];
  if (hasAiGeneratedWording(question.question) || hasAiGeneratedWording(displayQuestion)) issues.push('含 AI／教材提示語');
  if (normalizedOriginal.trim() !== displayWithoutContext.trim()) issues.push('需要顯示題幹自然化');
  const minimumStemLength = question.type === 'essay' || question.type === 'case_study' || question.type === 'case' ? 24 : isNonChoice ? 12 : 6;
  if (question.question.trim().length < minimumStemLength) issues.push('原始題幹過短');
  if (!/[？?。]$/.test(displayQuestion)) issues.push('缺少完整作答指示');
  if (isNonChoice && !directionPattern.test(displayQuestion)) issues.push('缺少明確回答方向');
  const hasAnswer = Array.isArray(question.answer) ? question.answer.length > 0 : hasTextValue(question.answer);
  const hasExplanation = hasTextValue(question.explanation);
  const hasAnswerBasis = hasTextValue(question.answerBasis);
  if (!hasAnswer) issues.push('缺答案');
  if (!hasExplanation) issues.push('缺解析');
  if (!hasAnswerBasis) issues.push('缺答案依據');
  const requiredDirections = isCaseType ? typeDirections.case : isEssayType ? typeDirections.essay : isShort ? typeDirections.shortAnswer : [];
  const natural = !issues.some((issue) => /AI|過短|缺少完整|缺少明確/.test(issue));
  return {
    natural,
    issues,
    displayQuestion,
    isNonChoice,
    originalQuestion: question.question,
    requiredDirections,
    hasAnswer,
    hasExplanation,
    hasAnswerBasis,
    needsImprovement: issues.length > 0,
  };
};

const technicalSourcePattern = /(?:^|[\\/])word[\\/]document\.xml|document\.xml|段落\s*\d+|paragraph\s*\d+/i;
export const isTechnicalSourceValue = (value: unknown) => typeof value === 'string' && technicalSourcePattern.test(value);
export const displaySourceValue = (value: unknown, fallback: string) => {
  if (!hasTextValue(value) || isTechnicalSourceValue(value)) return fallback;
  return String(value).trim();
};
export const formatTextbookLocation = (sourceChapter?: string, sourceLocation?: string) => {
  const chapter = displaySourceValue(sourceChapter, '');
  const location = displaySourceValue(sourceLocation, '');
  if (!chapter && !location) return '教材章節待補';
  if (chapter && location && chapter !== location) return `${chapter} / ${location}`;
  return chapter || location;
};

export const assessQuestionQuality = (originalQuestion: string, displayQuestion: string): QuestionQualityMetadata => {
  const reasons: string[] = [];
  if (hasAiGeneratedWording(originalQuestion)) reasons.push('原題含教材／AI 生成式提示語');
  if (displayQuestion.trim().length < 6) reasons.push('題幹過短，回答方向不明');
  if (!/[？?。]$/.test(displayQuestion.trim())) reasons.push('題幹缺少完整問句或作答指示');
  if (/重要點|學習重點|回答下列|請說明重點/.test(displayQuestion)) reasons.push('問題範圍或作答方向過於空泛');
  if (/[A-Za-z]{18,}|Whereverpossible|[（(][^）)]{0,8}$/.test(displayQuestion)) reasons.push('題幹疑似含截斷或抽取殘片');
  const requiresRevision = reasons.length > 0;
  return {
    clarity: requiresRevision ? 'needs_review' : 'clear',
    examStyle: requiresRevision ? 'needs_revision' : 'formal',
    requiresRevision,
    revisionReason: reasons.join('；'),
  };
};

/** Sprint 40C: keep the canonical wording intact and audit a display-safe revision separately. */
export const questionNaturalnessAudit = (question: string, type: string): QuestionNaturalnessAudit => {
  const displayQuestion = normalizeExamQuestion(question, type);
  const quality = assessQuestionQuality(question, displayQuestion);
  const issues = quality.revisionReason ? quality.revisionReason.split('；').filter(Boolean) : [];
  return { natural: issues.length === 0, issues, displayQuestion };
};

export const assessSourceVerified = (question: { questionQuality: QuestionQualityMetadata; sourceEvidenceIds?: string[]; evidenceExcerpt?: string; answerBasis?: string }): SourceReviewMetadata => {
  const reasons: string[] = [];
  const evidenceComplete = Boolean(question.sourceEvidenceIds?.length && question.evidenceExcerpt && !['待補', 'metadata_missing'].includes(question.evidenceExcerpt) && question.answerBasis && !['待補', 'metadata_missing'].includes(question.answerBasis));
  if (!evidenceComplete) reasons.push('教材證據或答案依據不足');
  if (/抽取殘片|題幹過短/.test(question.questionQuality.revisionReason)) reasons.push('題幹疑似截斷，暫不適合作為正式題');
  if (!evidenceComplete || reasons.some((reason) => reason.includes('截斷'))) return { disposition: 'DOWNGRADE', reasons };
  if (question.questionQuality.requiresRevision) return { disposition: 'REVISE', reasons: [question.questionQuality.revisionReason] };
  return { disposition: 'KEEP', reasons: [] };
};

const hasMetadataValue = (value: unknown) => typeof value === 'string'
  ? value.trim().length > 0 && !['待補', 'metadata_missing'].includes(value.trim())
  : value !== undefined && value !== null;

export const resolveMetadataCompleteness = (question: { sourceFile?: string; sourceChapter?: string; sourceVersion?: string; sourcePage?: string | number; sourceEvidenceIds?: string[]; evidenceExcerpt?: string; answerBasis?: string }): MetadataCompleteness => {
  const evidence = Boolean(question.sourceEvidenceIds?.length && hasMetadataValue(question.evidenceExcerpt) && hasMetadataValue(question.answerBasis));
  const sourceIdentity = hasMetadataValue(question.sourceFile) && hasMetadataValue(question.sourceChapter);
  if (sourceIdentity && hasMetadataValue(question.sourceVersion) && hasMetadataValue(question.sourcePage) && evidence) return 'complete';
  if (sourceIdentity && evidence) return 'partial';
  return 'missing';
};

export const getMetadataMissingFields = (question: { sourceFile?: string; sourceChapter?: string; sourceVersion?: string; sourcePage?: string | number; sourceEvidenceIds?: string[]; evidenceExcerpt?: string; answerBasis?: string }) => {
  const missing: string[] = [];
  if (!hasMetadataValue(question.sourceFile)) missing.push('sourceFile');
  if (!hasMetadataValue(question.sourceChapter)) missing.push('sourceChapter');
  if (!hasMetadataValue(question.sourceVersion)) missing.push('sourceVersion');
  if (!hasMetadataValue(question.sourcePage)) missing.push('sourcePage');
  if (!question.sourceEvidenceIds?.length) missing.push('sourceEvidenceIds');
  if (!hasMetadataValue(question.evidenceExcerpt)) missing.push('evidenceExcerpt');
  if (!hasMetadataValue(question.answerBasis)) missing.push('answerBasis');
  return missing;
};

export const resolveAnswerConfidence = (question: ConfidenceQuestion): AnswerConfidence => {
  const blocked = question.practiceOnly === true
    || question.formalScoreEligible === false
    || question.sourceReview?.disposition === 'DOWNGRADE'
    || ['unsafe_candidate', 'duplicate_candidate', 'needs_fix'].includes(question.qualityStatus ?? '');
  if (blocked) return 'C';
  const natural = question.questionQuality?.requiresRevision !== true;
  const fair = !question.optionQuality || question.optionQuality.leakageRisk === 'low';
  if (question.sourceType === 'past_exam' && natural && fair) return 'A+';
  if (question.sourceReview?.disposition === 'KEEP' && natural && fair) return 'A';
  return 'B';
};

export const evaluateBQuestion = (question: ConfidenceQuestion & { displayQuestion?: string; sourceEvidenceIds?: string[]; evidenceExcerpt?: string; answerBasis?: string; bQualityReview?: BQualityReview }): BQualityReview | undefined => {
  if (question.answerConfidence !== 'B') return undefined;
  const answerSupport = Boolean(question.sourceReview?.disposition === 'KEEP' || question.sourceReview?.disposition === 'REVISE')
    && Boolean(question.sourceEvidenceIds?.length && question.evidenceExcerpt && question.answerBasis);
  const answerNeedsHumanReview = question.sourceType === 'lecture';
  const naturalness = Boolean(question.displayQuestion && !hasAiGeneratedWording(question.displayQuestion) && !assessQuestionQuality(question.displayQuestion, question.displayQuestion).requiresRevision);
  const optionFairness = !question.optionQuality || question.optionQuality.leakageRisk === 'low';
  const formalFit = question.qualityStatus !== 'unsafe_candidate' && question.qualityStatus !== 'duplicate_candidate';
  if ((!answerSupport && !answerNeedsHumanReview) || !formalFit) return {
    disposition: 'downgrade_to_practice',
    reasons: [!answerSupport ? '答案缺少足夠教材直接證據' : '存在正式使用風險'],
    checks: { naturalness: naturalness ? 'pass' : 'review', answerSupport: answerSupport ? 'pass' : 'review', optionFairness: optionFairness ? 'pass' : 'review', formalFit: formalFit ? 'pass' : 'review' },
  };
  if (answerSupport && naturalness && optionFairness) return {
    disposition: 'upgrade_to_A',
    reasons: ['證據與答案依據可追溯', 'display 題幹已自然化', '選項公平且無圖片缺口'],
    checks: { naturalness: 'pass', answerSupport: 'pass', optionFairness: 'pass', formalFit: 'pass' },
  };
  const reasons = [];
  if (answerNeedsHumanReview && !answerSupport) reasons.push('課程整理答案需人工對照教材');
  if (!naturalness) reasons.push('題幹仍需人工確認正式考試語氣');
  if (!optionFairness) reasons.push('選項仍有中度相似或公平性風險');
  return {
    disposition: 'keep_B',
    reasons,
    checks: { naturalness: naturalness ? 'pass' : 'review', answerSupport: 'pass', optionFairness: optionFairness ? 'pass' : 'review', formalFit: 'pass' },
  };
};

/**
 * Confidence is a runtime quality boundary. It never rewrites canonical question data.
 * A requires complete traceability; B is usable for Daily/Weekly with follow-up work;
 * C is practice-only material or a question that is not safe for formal scoring.
 */
export const resolveQuestionConfidence = (question: ConfidenceQuestion): QuestionConfidence => {
  return resolveAnswerConfidence(question) === 'C' ? 'C' : resolveAnswerConfidence(question) === 'B' ? 'B' : 'A';
};

export const prepareQuestionSequence = <T extends OptionQuestion>(questions: T[]): T[] => {
  let previousOptions: string[] = [];
  let previousSignature = '';
  let samePositionRun = 0;
  return questions.map((question) => {
    if (!choiceTypes.has(question.type) || !question.options?.length) return question;
    const protectedQuestion = isQuestionProtected(question.id);
    const answers = answerList(question.answer);
    const allOptionsCorrect = answers.length === question.options.length;
    const candidates = protectedQuestion ? [question.options] : question.options.map((_, index) => rotate(question.options ?? [], index));
    const similarity = optionSetSimilarity(previousOptions, question.options);
    const targetPosition = question.id % question.options.length;
    const scored = candidates.map((options) => {
      const positions = answerPositions(options, question.answer);
      const signature = positionSignature(positions);
      const sameAsPrevious = Boolean(previousSignature && signature === previousSignature && !allOptionsCorrect);
      const preferredDistance = positions.length === 1 ? Math.abs(positions[0] - targetPosition) : 0;
      return { options, positions, signature, score: (similarity >= 0.75 && sameAsPrevious ? 100 : 0) + (sameAsPrevious ? 10 : 0) + preferredDistance };
    }).sort((left, right) => left.score - right.score);
    const selected = scored[0];
    const sameAsPrevious = Boolean(previousSignature && selected.signature === previousSignature && !allOptionsCorrect);
    samePositionRun = sameAsPrevious ? samePositionRun + 1 : 1;
    const leakageRisk: LeakageRisk = similarity >= 0.75 && sameAsPrevious || samePositionRun >= 3 ? 'high' : similarity >= 0.5 || sameAsPrevious ? 'medium' : 'low';
    const optionQuality: OptionQualityMetadata = {
      answerPosition: selected.positions.length === 0 ? null : selected.positions.length === 1 ? selected.positions[0] + 1 : selected.positions.map((position) => position + 1),
      optionSimilarity: similarity,
      leakageRisk,
      leakageReason: leakageRisk === 'high' ? '相鄰題選項高度相似且答案位置相同' : leakageRisk === 'medium' ? '相鄰題選項有相似情形，已調整答案位置' : '',
    };
    previousOptions = selected.options;
    previousSignature = selected.signature;
    return { ...question, options: selected.options, displayOptions: protectedQuestion ? question.displayOptions ?? selected.options : selected.options, optionQuality };
  });
};
