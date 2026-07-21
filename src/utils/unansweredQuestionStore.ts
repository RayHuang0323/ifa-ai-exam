import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
import { getProfileStorageKey } from './learnerProfile';

export const unansweredQuestionStorageKey = 'ifa-unanswered-questions-v1';

export interface UnansweredQuestionRecord {
  questionId: number;
  weekId: string;
  sourceMode: string;
  firstUnansweredAt: string;
  lastUnansweredAt: string;
}

const loadRecords = (): UnansweredQuestionRecord[] => {
  const parsed = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(unansweredQuestionStorageKey)));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((record): record is UnansweredQuestionRecord => Boolean(record)
    && typeof record === 'object'
    && typeof (record as UnansweredQuestionRecord).questionId === 'number'
    && typeof (record as UnansweredQuestionRecord).weekId === 'string'
    && typeof (record as UnansweredQuestionRecord).sourceMode === 'string'
    && typeof (record as UnansweredQuestionRecord).firstUnansweredAt === 'string'
    && typeof (record as UnansweredQuestionRecord).lastUnansweredAt === 'string');
};

const saveRecords = (records: UnansweredQuestionRecord[]) => {
  try { setStorageItem(getProfileStorageKey(unansweredQuestionStorageKey), JSON.stringify(records)); } catch { /* 題庫仍可在本機繼續使用 */ }
};

export const recordUnansweredQuestions = (records: Omit<UnansweredQuestionRecord, 'firstUnansweredAt' | 'lastUnansweredAt'>[]) => {
  const now = new Date().toISOString();
  const existing = new Map(loadRecords().map((record) => [record.questionId, record]));
  records.forEach((record) => {
    const previous = existing.get(record.questionId);
    existing.set(record.questionId, {
      ...record,
      firstUnansweredAt: previous?.firstUnansweredAt ?? now,
      lastUnansweredAt: now,
    });
  });
  saveRecords([...existing.values()]);
};

export const resolveUnansweredQuestions = (questionIds: number[]) => {
  if (questionIds.length === 0) return;
  const resolved = new Set(questionIds);
  saveRecords(loadRecords().filter((record) => !resolved.has(record.questionId)));
};

export const getReviewableUnansweredQuestionIds = () => loadRecords().map((record) => record.questionId);
export const getUnansweredQuestionRecords = () => loadRecords();
export const getUnansweredQuestionCount = () => loadRecords().length;
