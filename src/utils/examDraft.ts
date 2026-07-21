import { getQuestionById } from './questionEngine';
import { getProfileStorageKey } from './learnerProfile';
import { getStorageItem, removeStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
export interface ExamDraft {
  weekId: 'week-1';
  mode: 'mockExam';
  currentIndex: number;
  answers: Record<string, string | string[]>;
  markedQuestionIds: number[];
  timeLeft: number;
  questionIds: number[];
  createdAt: string;
  updatedAt: string;
  /** Sprint 24A: optional so pre-existing drafts remain valid. */
  sessionId?: string;
  /** Sprint 24C-1: optional daily-task context; old full-exam drafts stay valid. */
  entry?: string;
}

const storageKey = 'ifa-week1-exam-draft-v1';

const isValidDraft = (value: unknown): value is ExamDraft => {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<ExamDraft>;
  return draft.weekId === 'week-1' && draft.mode === 'mockExam'
    && typeof draft.currentIndex === 'number'
    && draft.currentIndex >= 0
    && typeof draft.answers === 'object'
    && draft.answers !== null
    && Array.isArray(draft.markedQuestionIds)
    && draft.markedQuestionIds.every((id) => typeof id === 'number')
    && typeof draft.timeLeft === 'number'
    && draft.timeLeft > 0
    && Array.isArray(draft.questionIds)
    && typeof draft.createdAt === 'string'
    && typeof draft.updatedAt === 'string'
    && (draft.sessionId === undefined || typeof draft.sessionId === 'string')
    && (draft.entry === undefined || typeof draft.entry === 'string');
};

export const loadExamDraft = (key = storageKey): ExamDraft | null => {
  const scopedKey = getProfileStorageKey(key);
  try {
    const raw = getStorageItem(scopedKey);
    if (!raw) return null;
    const draft = safeJsonParse<unknown>(raw);
    if (isValidDraft(draft) && draft.questionIds.length > 0 && draft.questionIds.every((id) => getQuestionById(id) !== null)) return draft;
    removeStorageItem(scopedKey); return null;
  } catch {
    return null;
  }
};

export const saveExamDraft = (draft: ExamDraft, key = storageKey) => {
  const scopedKey = getProfileStorageKey(key);
  try {
    setStorageItem(scopedKey, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save exam draft:', error);
  }
};

export const clearExamDraft = (key = storageKey) => {
  const scopedKey = getProfileStorageKey(key);
  try {
    removeStorageItem(scopedKey);
  } catch (error) {
    console.error('Failed to clear exam draft:', error);
  }
};
