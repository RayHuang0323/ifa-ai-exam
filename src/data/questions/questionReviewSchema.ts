/**
 * Sprint 49 formal-question AI review schema.
 *
 * Review records are sidecar metadata only. They must not replace or mutate
 * the canonical question, answer, explanation, source, or runtime eligibility.
 */
export const questionReviewSchemaVersion = 'sprint49-v1' as const;

export type QuestionReviewStatus = 'pending' | 'ai_reviewed' | 'needs_human_review' | 'approved' | 'rejected';
export type ReviewPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type AnswerConfidence = 'unknown' | 'low' | 'medium' | 'high';
export type SourceConfidence = 'unknown' | 'low' | 'medium' | 'high';
export type ExplanationQuality = 'unknown' | 'poor' | 'fair' | 'good';
export type DifficultyReview = 'unknown' | 'aligned' | 'questionable' | 'needs_human_review';
export type DuplicateRisk = 'unknown' | 'none' | 'low' | 'medium' | 'high';

export interface QuestionReviewMetadata {
  schemaVersion: typeof questionReviewSchemaVersion;
  questionId: number;
  inputFile: string;
  reviewStatus: QuestionReviewStatus;
  priority: ReviewPriority;
  answerConfidence: AnswerConfidence;
  sourceConfidence: SourceConfidence;
  explanationQuality: ExplanationQuality;
  difficultyReview: DifficultyReview;
  duplicateRisk: DuplicateRisk;
  reasonCodes: string[];
  aiNotes: string[];
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

const values = {
  reviewStatus: new Set<QuestionReviewStatus>(['pending', 'ai_reviewed', 'needs_human_review', 'approved', 'rejected']),
  priority: new Set<ReviewPriority>(['HIGH', 'MEDIUM', 'LOW']),
  answerConfidence: new Set<AnswerConfidence>(['unknown', 'low', 'medium', 'high']),
  sourceConfidence: new Set<SourceConfidence>(['unknown', 'low', 'medium', 'high']),
  explanationQuality: new Set<ExplanationQuality>(['unknown', 'poor', 'fair', 'good']),
  difficultyReview: new Set<DifficultyReview>(['unknown', 'aligned', 'questionable', 'needs_human_review']),
  duplicateRisk: new Set<DuplicateRisk>(['unknown', 'none', 'low', 'medium', 'high']),
};

export const isQuestionReviewMetadata = (value: unknown): value is QuestionReviewMetadata => {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Partial<QuestionReviewMetadata>;
  return metadata.schemaVersion === questionReviewSchemaVersion
    && typeof metadata.questionId === 'number'
    && Number.isFinite(metadata.questionId)
    && typeof metadata.inputFile === 'string'
    && metadata.inputFile.trim().length > 0
    && values.reviewStatus.has(metadata.reviewStatus as QuestionReviewStatus)
    && values.priority.has(metadata.priority as ReviewPriority)
    && values.answerConfidence.has(metadata.answerConfidence as AnswerConfidence)
    && values.sourceConfidence.has(metadata.sourceConfidence as SourceConfidence)
    && values.explanationQuality.has(metadata.explanationQuality as ExplanationQuality)
    && values.difficultyReview.has(metadata.difficultyReview as DifficultyReview)
    && values.duplicateRisk.has(metadata.duplicateRisk as DuplicateRisk)
    && Array.isArray(metadata.reasonCodes)
    && metadata.reasonCodes.every((code) => typeof code === 'string')
    && Array.isArray(metadata.aiNotes)
    && metadata.aiNotes.every((note) => typeof note === 'string');
};
