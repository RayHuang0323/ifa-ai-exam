/**
 * Sprint 46 review-only metadata.
 *
 * This schema is intentionally separate from the canonical question record.
 * It must never replace question.answer, question.explanation, or source data.
 */

export const questionReviewSchemaVersion = 'sprint46-v1' as const;

export type AiDifficultyEstimate = 1 | 2 | 3 | 4 | 5 | null;
export type DuplicateRisk = 'unknown' | 'none' | 'low' | 'medium' | 'high';
export type ReviewAnswerConfidence = 'unknown' | 'A+' | 'A' | 'B' | 'C';
export type ReviewSourceConfidence = 'unknown' | 'high' | 'medium' | 'low';
export type ReviewStatus =
  | 'pending'
  | 'ai_reviewed'
  | 'needs_human_review'
  | 'approved'
  | 'rejected'
  | 'downgrade_to_practice'
  | 'duplicate_candidate';

export interface QuestionReviewMetadata {
  schemaVersion: typeof questionReviewSchemaVersion;
  questionId: number;
  sourceFile: string;
  aiDifficultyEstimate: AiDifficultyEstimate;
  duplicateRisk: DuplicateRisk;
  answerConfidence: ReviewAnswerConfidence;
  sourceConfidence: ReviewSourceConfidence;
  reviewStatus: ReviewStatus;
  evidenceIds?: string[];
  reasonCodes?: string[];
  notes?: string[];
  model?: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

const difficultyValues = new Set<AiDifficultyEstimate>([null, 1, 2, 3, 4, 5]);
const duplicateRiskValues = new Set<DuplicateRisk>(['unknown', 'none', 'low', 'medium', 'high']);
const answerConfidenceValues = new Set<ReviewAnswerConfidence>(['unknown', 'A+', 'A', 'B', 'C']);
const sourceConfidenceValues = new Set<ReviewSourceConfidence>(['unknown', 'high', 'medium', 'low']);
const reviewStatusValues = new Set<ReviewStatus>([
  'pending',
  'ai_reviewed',
  'needs_human_review',
  'approved',
  'rejected',
  'downgrade_to_practice',
  'duplicate_candidate',
]);

export const isQuestionReviewMetadata = (value: unknown): value is QuestionReviewMetadata => {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Partial<QuestionReviewMetadata>;
  return metadata.schemaVersion === questionReviewSchemaVersion
    && typeof metadata.questionId === 'number'
    && Number.isFinite(metadata.questionId)
    && typeof metadata.sourceFile === 'string'
    && metadata.sourceFile.trim().length > 0
    && difficultyValues.has(metadata.aiDifficultyEstimate ?? null)
    && duplicateRiskValues.has(metadata.duplicateRisk as DuplicateRisk)
    && answerConfidenceValues.has(metadata.answerConfidence as ReviewAnswerConfidence)
    && sourceConfidenceValues.has(metadata.sourceConfidence as ReviewSourceConfidence)
    && reviewStatusValues.has(metadata.reviewStatus as ReviewStatus)
    && (metadata.evidenceIds === undefined || Array.isArray(metadata.evidenceIds))
    && (metadata.reasonCodes === undefined || Array.isArray(metadata.reasonCodes))
    && (metadata.notes === undefined || Array.isArray(metadata.notes));
};
