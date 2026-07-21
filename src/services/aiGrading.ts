import type { AiReviewConfidence, AiReviewRecord, AiReviewStatus } from '../utils/aiReviewStore';
import type { RubricMetadata } from '../utils/questionQualityGovernance';

export interface AiGradeInput {
  questionId: number;
  sessionId: string;
  examType: string;
  question: string;
  type: string;
  userAnswer: string | string[];
  referenceAnswer: string | string[];
  sampleAnswer: string;
  keyPoints: string[];
  rubric: unknown[] | RubricMetadata;
  category?: string;
  sourceLabel?: string;
  sourceFile?: string;
  sourcePage?: string | number;
  sourceChapter?: string;
  sourceVersion?: string;
  answerBasis?: string;
  evidenceExcerpt?: string;
  sourceEvidenceIds?: string[];
  explanation?: string;
  riskLevel?: string;
  practiceOnly?: boolean;
  formalScoreEligible?: boolean;
}

export type AiGradeResponse =
  | { status: 'graded'; review: AiReviewRecord }
  | { status: 'disabled'; message: string }
  | { status: 'unavailable'; message: string };

const config = () => ({
  apiUrl: (import.meta.env.VITE_PROGRESS_API_URL as string | undefined)?.trim() ?? '',
  writeKey: (import.meta.env.VITE_PROGRESS_WRITE_KEY as string | undefined)?.trim() ?? '',
});

const statusSet = new Set<AiReviewStatus>(['mastered', 'mostly_mastered', 'partial', 'not_mastered', 'needs_human_review']);
const confidenceSet = new Set<AiReviewConfidence>(['low', 'medium', 'high']);
const reviewLabels: Record<AiReviewStatus, string> = {
  mastered: '掌握',
  mostly_mastered: '大致掌握',
  partial: '部分掌握',
  not_mastered: '未掌握',
  needs_human_review: '需人工確認',
};

const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const hasReviewShape = (input: unknown): input is Partial<AiReviewRecord> => {
  if (!input || typeof input !== 'object') return false;
  const data = input as Record<string, unknown>;
  return ['aiReviewStatus', 'aiScoreSuggestion', 'matchedKeyPoints', 'missingKeyPoints', 'riskFlags', 'feedback', 'sourceBasis', 'confidence'].every((key) => Object.prototype.hasOwnProperty.call(data, key));
};
const normalizeReview = (input: unknown, payload: AiGradeInput): AiReviewRecord | null => {
  if (!hasReviewShape(input)) return null;
  const data = input;
  const status = statusSet.has(data.aiReviewStatus as AiReviewStatus) ? data.aiReviewStatus as AiReviewStatus : 'needs_human_review';
  const rawScore = typeof data.aiScoreSuggestion === 'number' ? data.aiScoreSuggestion : null;
  const score = status === 'needs_human_review' || rawScore === null || ![0, 1, 2, 3].includes(rawScore) ? null : rawScore as 0 | 1 | 2 | 3;
  const confidence = confidenceSet.has(data.confidence as AiReviewConfidence) ? data.confidence as AiReviewConfidence : 'low';
  return {
    questionId: payload.questionId,
    sessionId: payload.sessionId,
    examType: payload.examType,
    aiReviewStatus: status,
    aiReviewLabel: typeof data.aiReviewLabel === 'string' ? data.aiReviewLabel : reviewLabels[status],
    aiScoreSuggestion: score,
    aiScoreMax: 3,
    aiScoreDisplay: score === null ? '需人工確認，不建議 AI 給分' : `${score} / 3 分`,
    matchedKeyPoints: list(data.matchedKeyPoints),
    missingKeyPoints: list(data.missingKeyPoints),
    riskFlags: list(data.riskFlags),
    feedback: typeof data.feedback === 'string' ? data.feedback : '請依參考答案與評分重點補強。',
    sourceBasis: list(data.sourceBasis).length ? list(data.sourceBasis) : [payload.sourceLabel ?? '題目教材來源'],
    confidence,
    gradingMethod: 'remote_ai',
    gradingMethodLabel: '遠端 AI（選配）',
    reviewedAt: new Date().toISOString(),
  };
};

export const requestAiGradeAnswer = async (payload: AiGradeInput): Promise<AiGradeResponse> => {
  const { apiUrl, writeKey } = config();
  if (!apiUrl) return { status: 'disabled', message: 'AI 輔助評分尚未啟用。' };
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'aiGradeAnswer', schemaVersion: 1, eventId: `${payload.sessionId}:ai:${payload.questionId}:${Date.now()}`, ...payload, writeKey: writeKey || undefined }),
    });
    const body = await response.json() as { success?: boolean; status?: string; message?: string; data?: unknown };
    if (body.status === 'disabled') return { status: 'disabled', message: 'AI 輔助評分尚未啟用。' };
    if (!response.ok || body.success !== true) return { status: 'unavailable', message: 'AI 輔助評分暫時不可用。' };
    const review = normalizeReview(body.data, payload);
    return review ? { status: 'graded', review } : { status: 'unavailable', message: 'AI 回應格式無法確認，請改以參考答案自評。' };
  } catch {
    return { status: 'unavailable', message: 'AI 輔助評分暫時不可用。' };
  }
};
