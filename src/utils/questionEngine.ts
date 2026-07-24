import week1Questions from '../data/questions/week1.json';
import week2Questions from '../data/questions/week2.json';
import verifiedExtraQuestions from '../data/questions/verified-extra.json';
import sourceVerifiedQuestions from '../data/questions/source-verified.json';
import sourceVerifiedSprint36Questions from '../data/questions/source-verified-sprint36.json';
import sourceVerifiedSprint37Questions from '../data/questions/source-verified-sprint37.json';
import pastExamVerifiedQuestions from '../data/questions/past-exam-verified.json';
import examPracticeQuestions from '../data/questions/exam-practice.json';
import { writingPracticeSamples } from '../data/questions/writingPracticeSamples';
import type { QuestionCoverage, QuestionStats, EngineQuestion, QuestionType } from '../types/question';
import type { StudyProgress } from '../types/study';
import type { WrongAnswerRecord } from '../types/task';
import { applyQuestionQualityGovernance, type RubricMetadata } from './questionQualityGovernance';
import { evaluateBQuestion, getMetadataMissingFields, prepareQuestionSequence, resolveAnswerConfidence, resolveMetadataCompleteness, resolveQuestionConfidence, type AnswerConfidence, type BQualityReview, type MetadataCompleteness, type OptionQualityMetadata, type QuestionConfidence, type QuestionLanguageAudit, type QuestionNaturalnessAudit, type QuestionQualityMetadata, type SourceReviewMetadata } from './questionQualityAudit';
import { refineFormalQuestion } from './formalQuestionRefinement';
import type { FormalQuestionRefinement } from './questionQualityAudit';
import { applyQuestionPoolMetadata, buildQuestionPoolMetadata, type DuplicateRisk, type QuestionSourceType } from '../data/questions/questionPoolMetadata';

export interface RuntimeQuestion {
  id: number;
  weekId: string;
  knowledgeId?: string;
  type: string;
  chapter: string;
  category: string;
  difficulty: number;
  question: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
  reference?: string;
  sourceType: string;
  sourceLabel: string;
  reviewStatus: 'verified' | 'source_verified' | 'needs_review' | 'practice_ready' | 'mock_only';
  referenceAnswer?: string | string[];
  answerGuide?: string;
  sourceCandidateId?: string;
  sourceFile?: string;
  sourcePage?: string | number;
  sourceChapter?: string;
  sourceVersion?: string;
  formalScoreEligible?: boolean;
  practiceOnly?: boolean;
  priority?: number;
  qualityStatus?: string;
  isActive?: boolean;
  excludeFromPractice?: boolean;
  duplicateOf?: number;
  relatedVerifiedId?: number;
  verifiedBy?: string;
  verifiedAt?: string;
  originalPracticeId?: number;
  promotionReview?: string;
  originalSourceLabel?: string;
  verificationType?: 'source_verified' | string;
  sourceEvidenceIds?: string[];
  evidenceExcerpt?: string;
  answerBasis?: string;
  sourceConfidence?: 'high' | 'medium' | 'low' | string;
  sourceLocation?: string;
  metadataStatus?: 'complete' | 'metadata_missing';
  sourceQualityLevel?: 'A' | 'B' | 'C';
  questionConfidence?: QuestionConfidence;
  answerConfidence?: AnswerConfidence;
  bQualityReview?: BQualityReview;
  metadataCompleteness?: MetadataCompleteness;
  metadataMissingFields?: string[];
  displayQuestion?: string;
  questionLanguageAudit?: QuestionLanguageAudit;
  formalQuestionRefinement?: FormalQuestionRefinement;
  displayOptions?: string[];
  displayAnswer?: string | string[];
  displayReferenceAnswer?: string | string[];
  displayEvidenceExcerpt?: string;
  displayAnswerBasis?: string;
  displaySourceFile?: string;
  displaySourceLabel?: string;
  displaySourceLocation?: string;
  displaySourceChapter?: string;
  displaySourceVersion?: string;
  displaySourcePage?: string | number;
  displayTextbookLocation?: string;
  displayExplanation?: string;
  sampleAnswer?: string;
  keyPoints?: string[];
  rubric?: Array<{ score: number; label: string; description: string }> | RubricMetadata;
  highScoreGuidance?: string[];
  questionQuality?: QuestionQualityMetadata;
  questionNaturalnessAudit?: QuestionNaturalnessAudit;
  optionQuality?: OptionQualityMetadata;
  sourceReview?: SourceReviewMetadata;
  imageRequired?: boolean;
  imageSource?: string;
  imageAlt?: string;
  imageReference?: { source: string; alt: string; verified: boolean } | null;
  imageMissing?: boolean;
  riskFlags?: string[];
  generatedBy?: string;
  generatedAt?: string;
  questionSourceType?: QuestionSourceType;
  duplicateGroupId?: string;
  duplicateRisk?: DuplicateRisk;
  deprecated?: boolean;
  deprecatedReason?: string;
  supersededBy?: number;
}

type RawQuestion = typeof week1Questions[number];
const withSourcePriority = (question: RuntimeQuestion): RuntimeQuestion => {
  const sourceType = String(question.sourceType ?? '').toLowerCase();
  const minimumPriority = sourceType === 'past_exam' || sourceType === 'official_exam'
    ? 20
    : ['textbook', 'extracted_material', 'source_verified'].includes(sourceType)
      ? 10
      : 0;
  return { ...question, priority: Math.max(question.priority ?? 0, minimumPriority) };
};
const week1Pool: RuntimeQuestion[] = week1Questions.map((question) => applyQuestionQualityGovernance({ ...question, weekId: 'week-1', category: question.chapter, sourceType: 'past_exam', sourceLabel: question.reference, reviewStatus: 'verified' }));
const week2Pool: RuntimeQuestion[] = week2Questions.filter((question) => question.reviewStatus === 'verified').map((question) => applyQuestionQualityGovernance({ ...question, weekId: 'week-2', reviewStatus: 'verified' as const }));
const verifiedExtraPool: RuntimeQuestion[] = (verifiedExtraQuestions as unknown as RuntimeQuestion[]).filter((question) => question.reviewStatus === 'verified').map((question) => ({
  ...question,
  weekId: question.weekId || 'verified-extra',
  chapter: question.chapter || question.category || 'general',
  category: question.category || question.chapter || 'general',
  sourceType: question.sourceType || 'extracted_material',
  sourceLabel: question.sourceLabel || '教材核對正式題（Sprint 34，非歷屆試題）',
  reviewStatus: 'verified' as const,
})).map(applyQuestionQualityGovernance);
const sourceVerifiedQuestionBatches = [
  ...(sourceVerifiedQuestions as unknown as RuntimeQuestion[]),
  ...(sourceVerifiedSprint36Questions as unknown as RuntimeQuestion[]),
  ...(sourceVerifiedSprint37Questions as unknown as RuntimeQuestion[]),
];
const sourceVerifiedAllQuestions: RuntimeQuestion[] = sourceVerifiedQuestionBatches.map((question) => ({
  ...question,
  weekId: question.weekId || 'source-verified',
  chapter: question.chapter || question.category || 'general',
  category: question.category || question.chapter || 'general',
  sourceType: question.sourceType || 'extracted_material',
  sourceLabel: question.sourceLabel || '教材證據正式題（source_verified，非官方歷屆題）',
  reviewStatus: question.reviewStatus === 'source_verified' ? 'source_verified' as const : question.reviewStatus,
})).map(applyQuestionQualityGovernance);
const sourceVerifiedPool = sourceVerifiedAllQuestions.filter((question) => question.reviewStatus === 'source_verified'
  && question.verificationType === 'source_verified'
  && (question as { deprecated?: boolean }).deprecated !== true
  && question.isActive !== false
  && ((question.formalScoreEligible === true && question.practiceOnly !== true)
     || question.sourceReview?.disposition === 'DOWNGRADE'));
const pastExamPool: RuntimeQuestion[] = (pastExamVerifiedQuestions as unknown as RuntimeQuestion[])
  .filter((question) => question.reviewStatus === 'verified' && question.verificationType === 'past_exam' && question.formalScoreEligible === true && question.practiceOnly !== true)
  .map((question) => ({
    ...question,
    weekId: 'past-exam',
    chapter: question.chapter || '解剖與生理',
    category: question.category || question.chapter || '解剖生理',
    sourceType: 'past_exam',
    sourceLabel: question.sourceLabel || '官方歷屆／期末試題（Sprint 58 verified）',
    reviewStatus: 'verified' as const,
  }))
  .map(applyQuestionQualityGovernance);
const hasTraceValue = (value: unknown) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 && !['待補', 'metadata_missing'].includes(value.trim()) : value !== undefined && value !== null;
const withSourceTraceability = (question: RuntimeQuestion): RuntimeQuestion => {
  const sourceFile = hasTraceValue(question.sourceFile) ? question.sourceFile : 'metadata_missing';
  const sourceChapter = hasTraceValue(question.sourceChapter) ? question.sourceChapter : hasTraceValue(question.chapter) ? question.chapter : 'metadata_missing';
  const sourceVersion = hasTraceValue(question.sourceVersion) ? question.sourceVersion : 'metadata_missing';
  const sourcePage = hasTraceValue(question.sourcePage) ? question.sourcePage : 'metadata_missing';
  const sourceEvidenceIds: string[] = hasTraceValue(question.sourceEvidenceIds) ? question.sourceEvidenceIds ?? [] : [];
  const evidenceExcerpt = hasTraceValue(question.evidenceExcerpt) ? question.evidenceExcerpt : 'metadata_missing';
  const answerBasis = hasTraceValue(question.answerBasis) ? question.answerBasis : 'metadata_missing';
  const hasEvidence = sourceEvidenceIds.length > 0 && hasTraceValue(evidenceExcerpt) && hasTraceValue(answerBasis);
  const sourceQualityLevel: RuntimeQuestion['sourceQualityLevel'] = hasTraceValue(sourceFile) && hasTraceValue(sourceVersion) && hasTraceValue(sourceChapter) && hasTraceValue(sourcePage) && hasEvidence
    ? 'A' : hasTraceValue(sourceFile) && hasTraceValue(sourceChapter) && hasEvidence ? 'B' : 'C';
  const metadataStatus: RuntimeQuestion['metadataStatus'] = sourceQualityLevel === 'A' ? 'complete' : 'metadata_missing';
  return { ...question, sourceFile, sourceChapter, sourceVersion, sourcePage, sourceEvidenceIds, evidenceExcerpt, answerBasis, sourceQualityLevel, metadataCompleteness: resolveMetadataCompleteness({ sourceFile, sourceChapter, sourceVersion, sourcePage, sourceEvidenceIds, evidenceExcerpt, answerBasis }), metadataMissingFields: getMetadataMissingFields(question), metadataStatus };
};
const withQuestionConfidence = (question: RuntimeQuestion): RuntimeQuestion => {
  const initialAnswerConfidence = resolveAnswerConfidence(question);
  const bQualityReview = evaluateBQuestion({ ...question, answerConfidence: initialAnswerConfidence, displayQuestion: question.displayQuestion ?? question.question });
  const answerConfidence = bQualityReview?.disposition === 'upgrade_to_A' ? 'A' : bQualityReview?.disposition === 'downgrade_to_practice' ? 'C' : initialAnswerConfidence;
  return { ...question, answerConfidence, bQualityReview, questionConfidence: resolveQuestionConfidence({ ...question, answerConfidence }) };
};
const formalQuestionPoolBase: RuntimeQuestion[] = prepareQuestionSequence([...week1Pool, ...week2Pool, ...verifiedExtraPool, ...sourceVerifiedPool, ...pastExamPool].map(withSourcePriority).map(withSourceTraceability)).map(refineFormalQuestion).map(withQuestionConfidence);
const isPracticeQuestionEligible = (question: typeof examPracticeQuestions[number]) => (
  question.isActive !== false
  && question.excludeFromPractice !== true
  && (question as { deprecated?: boolean }).deprecated !== true
  && !['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus ?? '')
);
const practiceQuestionPoolBase: RuntimeQuestion[] = prepareQuestionSequence(examPracticeQuestions.filter(isPracticeQuestionEligible).map((question) => applyQuestionQualityGovernance({ ...question, reviewStatus: question.reviewStatus as RuntimeQuestion['reviewStatus'], sourceType: question.sourceType, weekId: 'exam-practice' })).map(withSourcePriority)).map(withQuestionConfidence);
const questionPoolMetadata = buildQuestionPoolMetadata([...formalQuestionPoolBase, ...practiceQuestionPoolBase]);
const applyRuntimePoolMetadata = (question: RuntimeQuestion) => applyQuestionPoolMetadata(question, questionPoolMetadata.get(question.id) ?? {
  questionSourceType: 'unknown',
  duplicateRisk: 'none',
});
const formalQuestionPool: RuntimeQuestion[] = formalQuestionPoolBase.map(applyRuntimePoolMetadata);
const practiceQuestionPool: RuntimeQuestion[] = practiceQuestionPoolBase.map(applyRuntimePoolMetadata);

export const normalizeQuestion = (rawQuestion: RawQuestion, weekId: string, index: number): EngineQuestion => ({
  id: typeof rawQuestion.id === 'number' ? rawQuestion.id : index + 1,
  weekId,
  type: rawQuestion.type as QuestionType,
  topicId: rawQuestion.chapter || 'general',
  knowledgePointIds: rawQuestion.knowledgeId ? [rawQuestion.knowledgeId] : [],
  difficulty: rawQuestion.difficulty,
  sourceRefs: ['source-pending-review'],
  sourceType: 'pending-review',
  isPastPaper: false,
  isAiGenerated: false,
  needsReview: true,
  correctAnswer: rawQuestion.answer,
  explanation: rawQuestion.explanation,
});

export const getAvailableWeeks = () => ['week-1', 'week-2'] as const;
export const getQuestionsByWeek = (weekId: string): RuntimeQuestion[] => weekId === 'week-1' ? week1Pool : weekId === 'week-2' ? week2Pool : weekId === 'verified-extra' ? verifiedExtraPool : weekId === 'source-verified' ? sourceVerifiedPool : weekId === 'past-exam' ? pastExamPool : [];
export const getFormalQuestionPool = () => formalQuestionPool;
export const getVerifiedExtraQuestionPool = () => verifiedExtraPool;
export const getSourceVerifiedQuestionPool = () => sourceVerifiedPool;
export const getPracticeQuestionPool = () => practiceQuestionPool;
export const getDailyQuestionPool = () => prepareQuestionSequence([...formalQuestionPool, ...practiceQuestionPool]);
export const getQuestionById = (questionId: number) => [...formalQuestionPool, ...sourceVerifiedAllQuestions, ...practiceQuestionPool].find((question) => question.id === questionId) ?? writingPracticeSamples.find((question) => question.id === questionId) ?? null;
export const getQuestionCountByWeek = (weekId: string) => getQuestionsByWeek(weekId).length;
export const getQuestionIdsByWeek = (weekId: string) => getQuestionsByWeek(weekId).map((question) => question.id);
export const getWritingPracticeQuestions = () => writingPracticeSamples;

export const getCoverageByWeek = (weekId: string, studyProgress: StudyProgress, wrongAnswers: WrongAnswerRecord[]): QuestionCoverage => {
  const validQuestionIds = new Set(getQuestionIdsByWeek(weekId));
  const practiced = new Set<number>();
  let missingSessionQuestionIdsCount = 0;

  studyProgress.sessions.filter((session) => session.weekId === weekId || session.questionIds?.some((questionId) => validQuestionIds.has(questionId))).forEach((session) => {
    if (!session.questionIds) {
      missingSessionQuestionIdsCount += 1;
      return;
    }
    session.questionIds.forEach((questionId) => {
      if (validQuestionIds.has(questionId)) practiced.add(questionId);
    });
  });
  wrongAnswers.filter((record) => record.weekId === weekId).forEach((record) => practiced.add(record.questionId));

  const totalQuestions = validQuestionIds.size;
  const practicedCount = practiced.size;
  return {
    totalQuestions,
    practicedQuestionIds: [...practiced].sort((a, b) => a - b),
    practicedCount,
    unpracticedCount: Math.max(0, totalQuestions - practicedCount),
    coveragePercentage: totalQuestions === 0 ? 0 : Math.round((practicedCount / totalQuestions) * 100),
    isEstimated: missingSessionQuestionIdsCount > 0,
    missingSessionQuestionIdsCount,
  };
};

export const getQuestionStats = (questionId: number, studyProgress: StudyProgress, wrongAnswers: WrongAnswerRecord[]): QuestionStats => {
  const sessions = studyProgress.sessions.filter((session) => session.questionIds?.includes(questionId));
  return {
    questionId,
    practiceCount: sessions.length,
    correctCount: sessions.filter((session) => session.correctQuestionIds?.includes(questionId)).length,
    wrongCount: sessions.filter((session) => session.wrongQuestionIds?.includes(questionId)).length,
    skippedCount: sessions.filter((session) => session.skippedQuestionIds?.includes(questionId)).length,
    wrongRecordCount: wrongAnswers.find((record) => record.questionId === questionId)?.wrongCount ?? 0,
  };
};
