import type { WrongAnswerRecord } from '../types/task';
import { getProfileStorageKey } from './learnerProfile';
import { getLocalDateString } from './studyProgress';
import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';

const storageKey = 'ifa-wrong-answers-v1';
const statuses: WrongAnswerRecord['status'][] = ['newWrong', 'reviewing', 'highRisk', 'improving', 'mastered'];
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export const normalizeWrongAnswerRecord = (value: unknown): WrongAnswerRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<WrongAnswerRecord>;
  if (typeof record.questionId !== 'number' || !Number.isFinite(record.questionId)) return null;
  const wrongCount = count(record.wrongCount);
  return {
    questionId: record.questionId, weekId: typeof record.weekId === 'string' ? record.weekId : 'week-1', wrongCount,
    correctReviewCount: count(record.correctReviewCount), consecutiveCorrect: count(record.consecutiveCorrect),
    lastWrongAt: typeof record.lastWrongAt === 'string' ? record.lastWrongAt : '',
    lastReviewedAt: typeof record.lastReviewedAt === 'string' ? record.lastReviewedAt : null,
    masteredAt: typeof record.masteredAt === 'string' ? record.masteredAt : null,
    status: statuses.includes(record.status as WrongAnswerRecord['status']) ? record.status as WrongAnswerRecord['status'] : (wrongCount > 1 ? 'reviewing' : 'newWrong'),
    lastSelectedAnswer: typeof record.lastSelectedAnswer === 'string' || Array.isArray(record.lastSelectedAnswer) ? record.lastSelectedAnswer : null,
    correctAnswer: typeof record.correctAnswer === 'string' || Array.isArray(record.correctAnswer) ? record.correctAnswer : '',
    questionType: typeof record.questionType === 'string' ? record.questionType : 'unknown', source: typeof record.source === 'string' ? record.source : 'week-1',
  };
};

export const loadWrongAnswers = (): WrongAnswerRecord[] => {
  const parsed = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(storageKey)));
  return Array.isArray(parsed) ? parsed.map(normalizeWrongAnswerRecord).filter((record): record is WrongAnswerRecord => record !== null) : [];
};
export const saveWrongAnswers = (records: WrongAnswerRecord[]) => { setStorageItem(getProfileStorageKey(storageKey), JSON.stringify(records)); };

export const recordWrongAnswers = (records: Omit<WrongAnswerRecord, 'wrongCount' | 'lastWrongAt' | 'correctReviewCount' | 'consecutiveCorrect' | 'lastReviewedAt' | 'masteredAt' | 'status'>[]) => {
  const existing = loadWrongAnswers(); const now = new Date().toISOString(); const next = [...existing];
  for (const record of records) { const index = next.findIndex((item) => item.questionId === record.questionId && item.weekId === record.weekId); if (index >= 0) next[index] = { ...next[index], wrongCount: next[index].wrongCount + 1, consecutiveCorrect: 0, status: 'highRisk', lastWrongAt: now, lastReviewedAt: now, masteredAt: null, lastSelectedAnswer: record.lastSelectedAnswer }; else next.push({ ...record, wrongCount: 1, correctReviewCount: 0, consecutiveCorrect: 0, lastReviewedAt: now, masteredAt: null, status: 'newWrong', lastWrongAt: now }); }
  saveWrongAnswers(next); return next;
};

export const isReviewableToday = (record: WrongAnswerRecord) => {
  if (record.status === 'mastered') return false;
  if (record.status !== 'improving') return true;
  const reviewedAt = record.lastReviewedAt ? new Date(record.lastReviewedAt) : null;
  return !reviewedAt || Number.isNaN(reviewedAt.getTime()) || getLocalDateString(reviewedAt) !== getLocalDateString(new Date());
};
const reviewPriority: Record<WrongAnswerRecord['status'], number> = { highRisk: 0, newWrong: 1, reviewing: 2, improving: 3, mastered: 4 };
export const getReviewableWrongAnswers = () => loadWrongAnswers().filter(isReviewableToday).sort((a, b) => reviewPriority[a.status] - reviewPriority[b.status]);
export const getWrongAnswerSummary = () => { const records = loadWrongAnswers(); return { totalWrong: records.length, reviewableCount: records.filter(isReviewableToday).length, highRiskCount: records.filter((record) => record.status === 'highRisk').length, improvingCount: records.filter((record) => record.status === 'improving').length, masteredCount: records.filter((record) => record.status === 'mastered').length }; };
export const recordWrongAnswerReview = (questionId: number, correct: boolean) => { const records = loadWrongAnswers(); const index = records.findIndex((record) => record.questionId === questionId); if (index < 0) return records; const now = new Date().toISOString(); const current = records[index]; if (correct) { const consecutiveCorrect = current.consecutiveCorrect + 1; records[index] = { ...current, correctReviewCount: current.correctReviewCount + 1, consecutiveCorrect, lastReviewedAt: now, status: consecutiveCorrect >= 2 ? 'mastered' : 'improving', masteredAt: consecutiveCorrect >= 2 ? now : null }; } else records[index] = { ...current, wrongCount: current.wrongCount + 1, consecutiveCorrect: 0, status: 'highRisk', lastWrongAt: now, lastReviewedAt: now, masteredAt: null }; saveWrongAnswers(records); return records; };
