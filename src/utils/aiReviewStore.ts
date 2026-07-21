import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
import { getProfileStorageKey } from './learnerProfile';

export const aiReviewStorageKey = 'ifa-ai-reviews-v1';
export type AiReviewStatus = 'mastered' | 'mostly_mastered' | 'partial' | 'not_mastered' | 'needs_human_review';
export type AiReviewConfidence = 'low' | 'medium' | 'high';
export type AiGradingMethod = 'local_rubric' | 'remote_ai' | 'legacy';

export interface AiReviewRecord {
  questionId: number;
  sessionId: string;
  examType: string;
  aiReviewStatus: AiReviewStatus;
  aiReviewLabel: string;
  aiScoreSuggestion: 0 | 1 | 2 | 3 | null;
  aiScoreMax: 3;
  aiScoreDisplay: string;
  matchedKeyPoints: string[];
  missingKeyPoints: string[];
  riskFlags: string[];
  feedback: string;
  sourceBasis: string[];
  confidence: AiReviewConfidence;
  gradingMethod?: AiGradingMethod;
  gradingMethodLabel?: string;
  reviewedAt: string;
}

const load = (): AiReviewRecord[] => {
  const parsed = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(aiReviewStorageKey)));
  return Array.isArray(parsed) ? parsed.filter((record): record is AiReviewRecord => Boolean(record)
    && typeof record === 'object'
    && typeof (record as AiReviewRecord).questionId === 'number'
    && typeof (record as AiReviewRecord).sessionId === 'string'
    && typeof (record as AiReviewRecord).aiReviewStatus === 'string').map((record) => ({
      ...record,
      gradingMethod: record.gradingMethod ?? 'legacy',
      gradingMethodLabel: record.gradingMethodLabel ?? '既有評分紀錄',
    })) : [];
};

const save = (records: AiReviewRecord[]) => {
  try { setStorageItem(getProfileStorageKey(aiReviewStorageKey), JSON.stringify(records.slice(-500))); } catch { /* AI 輔助評分不可用時不影響作答 */ }
};

export const recordAiReview = (record: AiReviewRecord) => {
  const records = load().filter((item) => !(item.questionId === record.questionId && item.sessionId === record.sessionId));
  records.push(record);
  save(records);
};

export const getAiReview = (questionId: number, sessionId: string) => load().find((record) => record.questionId === questionId && record.sessionId === sessionId) ?? null;
export const getAiReviewsForSession = (sessionId: string) => load().filter((record) => record.sessionId === sessionId);
