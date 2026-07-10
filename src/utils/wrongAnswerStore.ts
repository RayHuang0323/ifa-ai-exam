import type { WrongAnswerRecord } from '../types/task';

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
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch { return []; }
};

export const recordWrongAnswers = (records: Omit<WrongAnswerRecord, 'wrongCount' | 'lastWrongAt'>[]) => {
  const existing = loadWrongAnswers();
  const now = new Date().toISOString();
  const next = [...existing];
  for (const record of records) {
    const index = next.findIndex((item) => item.questionId === record.questionId && item.weekId === record.weekId);
    if (index >= 0) next[index] = { ...next[index], wrongCount: next[index].wrongCount + 1, lastWrongAt: now, lastSelectedAnswer: record.lastSelectedAnswer };
    else next.push({ ...record, wrongCount: 1, lastWrongAt: now });
  }
  try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch (error) { console.error('Failed to save wrong answers:', error); }
  return next;
};
