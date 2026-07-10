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
    && typeof draft.updatedAt === 'string';
};

export const loadExamDraft = (): ExamDraft | null => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const draft = JSON.parse(raw) as unknown;
    return isValidDraft(draft) ? draft : null;
  } catch {
    return null;
  }
};

export const saveExamDraft = (draft: ExamDraft) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save exam draft:', error);
  }
};

export const clearExamDraft = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear exam draft:', error);
  }
};
