import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
import { getProfileStorageKey } from './learnerProfile';

/**
 * 已被看到、作答、複習或可能同步到 AnswerRecords 的題目保護清單。
 * 遠端 Google Sheet 無法由前端直接完整讀取時，仍以本機紀錄與已部署題目保守保護。
 */
export const answeredQuestionLockStorageKey = 'ifa-answered-question-lock-v1';

const sourceKeys = [
  'ifa-study-progress-v1',
  'ifa-wrong-answers-v1',
  'ifa-unanswered-questions-v1',
  'ifa-ai-reviews-v1',
  'ifa_exam_state',
  'ifa-week1-exam-draft-v1',
  'ifa-daily-task-v2-state',
  'ifa-daily-task-v2-draft',
  'ifa-progress-sync-queue-v1',
] as const;

const idKeys = new Set(['questionId', 'questionIds', 'assignedQuestionIds', 'completedQuestionIds', 'carryoverQuestionIds', 'correctQuestionIds', 'wrongQuestionIds', 'skippedQuestionIds', 'sessions']);

const addNumber = (target: Set<number>, value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) target.add(value);
};

const collectIds = (value: unknown, target: Set<number>, key = '') => {
  if (Array.isArray(value)) {
    if (idKeys.has(key)) value.forEach((item) => addNumber(target, item));
    value.forEach((item) => collectIds(item, target, key));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
    if (childKey === 'questionId') addNumber(target, childValue);
    if (childKey === 'answers' && childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
      Object.keys(childValue).forEach((id) => addNumber(target, Number(id)));
    }
    if (idKeys.has(childKey) || childKey === 'answers' || childKey === 'payload' || childKey === 'events' || childKey === 'records' || childKey === 'data') collectIds(childValue, target, childKey);
  });
};

const loadExplicitIds = () => {
  const parsed = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(answeredQuestionLockStorageKey)));
  const ids = new Set<number>();
  if (Array.isArray(parsed)) parsed.forEach((id) => addNumber(ids, id));
  else collectIds(parsed, ids);
  return ids;
};

export const getKnownAnsweredQuestionIds = () => {
  const ids = loadExplicitIds();
  sourceKeys.forEach((key) => collectIds(safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(key))), ids));
  return [...ids].sort((a, b) => a - b);
};

export const protectQuestionIds = (questionIds: number[]) => {
  const ids = new Set(getKnownAnsweredQuestionIds());
  questionIds.forEach((id) => addNumber(ids, id));
  try { setStorageItem(getProfileStorageKey(answeredQuestionLockStorageKey), JSON.stringify([...ids].sort((a, b) => a - b))); } catch { /* 保護清單不可用時不阻塞作答 */ }
  return [...ids].sort((a, b) => a - b);
};

export const markQuestionIdsAsProtected = protectQuestionIds;
export const isQuestionProtected = (questionId: number) => getKnownAnsweredQuestionIds().includes(questionId);
export const canMutateQuestionCore = (questionId: number) => !isQuestionProtected(questionId);
