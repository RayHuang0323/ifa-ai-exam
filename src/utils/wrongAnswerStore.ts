import type { WrongAnswerRecord } from '../types/task';
import { getLocalDateString } from './studyProgress';

const storageKey = 'ifa-wrong-answers-v1';

const isRecord = (value: unknown): value is WrongAnswerRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<WrongAnswerRecord>;
  return typeof record.questionId === 'number' && record.weekId === 'week-1' && typeof record.wrongCount === 'number' && typeof record.lastWrongAt === 'string' && typeof record.questionType === 'string';
};

export const loadWrongAnswers = (): WrongAnswerRecord[] => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isRecord).map((record) => ({ ...record, correctReviewCount: record.correctReviewCount ?? 0, consecutiveCorrect: record.consecutiveCorrect ?? 0, lastReviewedAt: record.lastReviewedAt ?? null, masteredAt: record.masteredAt ?? null, status: record.status ?? 'newWrong' })) : [];
  } catch { return []; }
};

export const saveWrongAnswers = (records: WrongAnswerRecord[]) => { try { window.localStorage.setItem(storageKey, JSON.stringify(records)); } catch {} };

export const recordWrongAnswers = (records: Omit<WrongAnswerRecord, 'wrongCount' | 'lastWrongAt' | 'correctReviewCount' | 'consecutiveCorrect' | 'lastReviewedAt' | 'masteredAt' | 'status'>[]) => {
  const existing = loadWrongAnswers();
  const now = new Date().toISOString();
  const next = [...existing];
  for (const record of records) {
    const index = next.findIndex((item) => item.questionId === record.questionId && item.weekId === record.weekId);
    if (index >= 0) next[index] = { ...next[index], wrongCount: next[index].wrongCount + 1, consecutiveCorrect: 0, status: 'highRisk', lastWrongAt: now, lastReviewedAt: now, masteredAt: null, lastSelectedAnswer: record.lastSelectedAnswer };
    else next.push({ ...record, wrongCount: 1, correctReviewCount: 0, consecutiveCorrect: 0, lastReviewedAt: now, masteredAt: null, status: 'newWrong', lastWrongAt: now });
  }
  saveWrongAnswers(next);
  return next;
};

export const isReviewableToday = (record: WrongAnswerRecord) => {
  if (record.status === 'mastered') return false;
  if (record.status !== 'improving') return true;
  return !record.lastReviewedAt || getLocalDateString(new Date(record.lastReviewedAt)) !== getLocalDateString(new Date());
};

const reviewPriority: Record<WrongAnswerRecord['status'], number> = { highRisk: 0, newWrong: 1, reviewing: 2, improving: 3, mastered: 4 };

export const getReviewableWrongAnswers = () => loadWrongAnswers().filter(isReviewableToday).sort((a, b) => reviewPriority[a.status] - reviewPriority[b.status]);
export const getWrongAnswerSummary = () => { const records = loadWrongAnswers(); return { totalWrong: records.length, reviewableCount: records.filter(isReviewableToday).length, highRiskCount: records.filter((record) => record.status === 'highRisk').length, improvingCount: records.filter((record) => record.status === 'improving').length, masteredCount: records.filter((record) => record.status === 'mastered').length }; };
export const recordWrongAnswerReview = (questionId: number, correct: boolean) => { const records = loadWrongAnswers(); const index = records.findIndex((record) => record.questionId === questionId); if (index < 0) return records; const now = new Date().toISOString(); const current = records[index]; if (correct) { const consecutiveCorrect = current.consecutiveCorrect + 1; records[index] = { ...current, correctReviewCount: current.correctReviewCount + 1, consecutiveCorrect, lastReviewedAt: now, status: consecutiveCorrect >= 2 ? 'mastered' : 'improving', masteredAt: consecutiveCorrect >= 2 ? now : null }; } else records[index] = { ...current, wrongCount: current.wrongCount + 1, consecutiveCorrect: 0, status: 'highRisk', lastWrongAt: now, lastReviewedAt: now, masteredAt: null }; saveWrongAnswers(records); return records; };
