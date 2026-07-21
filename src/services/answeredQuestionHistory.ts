import { getLearnerProfile, getProfileStorageKey } from '../utils/learnerProfile';
import { getStorageItem, safeJsonParse, setStorageItem } from '../utils/storageHealth';

export type AnsweredHistoryTaskType = 'daily' | 'weekly' | 'mock';
export type AnsweredHistoryResult = 'correct' | 'wrong' | 'pending_self_review';

export interface AnsweredQuestionHistoryEvent {
  schemaVersion: 1;
  eventId: string;
  sessionId: string;
  questionId: number;
  learnerId: string;
  date: string;
  taskType: AnsweredHistoryTaskType;
  questionType: string;
  category: string;
  result: AnsweredHistoryResult;
  score: number | null;
  completed: true;
  clientTimestamp: string;
}

export type AnsweredQuestionHistoryInput = Omit<AnsweredQuestionHistoryEvent, 'schemaVersion' | 'eventId' | 'learnerId' | 'completed' | 'clientTimestamp'>;
export type HistorySyncStatus = 'disabled' | 'synced' | 'pending';

export const answeredQuestionHistoryStorageKey = 'ifa-answered-question-history-v1';
export const answeredQuestionHistoryQueueKey = 'ifa-answered-question-history-sync-queue-v1';
const queueLimit = 2000;

const config = () => ({
  apiUrl: (import.meta.env.VITE_PROGRESS_API_URL as string | undefined)?.trim() ?? '',
  writeKey: (import.meta.env.VITE_PROGRESS_WRITE_KEY as string | undefined)?.trim() ?? '',
});

const normalize = (value: unknown): AnsweredQuestionHistoryEvent | null => {
  if (!value || typeof value !== 'object') return null;
  const event = value as Partial<AnsweredQuestionHistoryEvent>;
  if (typeof event.eventId !== 'string' || typeof event.sessionId !== 'string' || typeof event.questionId !== 'number' || !Number.isFinite(event.questionId) || typeof event.learnerId !== 'string' || typeof event.date !== 'string' || !['daily', 'weekly', 'mock'].includes(String(event.taskType)) || typeof event.questionType !== 'string' || !['correct', 'wrong', 'pending_self_review'].includes(String(event.result)) || event.completed !== true) return null;
  return { schemaVersion: 1, eventId: event.eventId, sessionId: event.sessionId, questionId: event.questionId, learnerId: event.learnerId, date: event.date, taskType: event.taskType as AnsweredHistoryTaskType, questionType: event.questionType, category: typeof event.category === 'string' ? event.category : '未分類', result: event.result as AnsweredHistoryResult, score: typeof event.score === 'number' && Number.isFinite(event.score) ? event.score : null, completed: true, clientTimestamp: typeof event.clientTimestamp === 'string' ? event.clientTimestamp : event.date };
};

const readList = (key: string) => {
  const parsed = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(key)));
  return Array.isArray(parsed) ? parsed.map(normalize).filter((event): event is AnsweredQuestionHistoryEvent => event !== null) : [];
};
const writeList = (key: string, events: AnsweredQuestionHistoryEvent[], limit?: number) => {
  const deduplicated = [...new Map(events.map((event) => [event.eventId, event])).values()];
  setStorageItem(getProfileStorageKey(key), JSON.stringify(limit ? deduplicated.slice(-limit) : deduplicated));
};

export const loadAnsweredQuestionHistory = () => readList(answeredQuestionHistoryStorageKey);
export const loadAnsweredQuestionHistoryQueue = () => readList(answeredQuestionHistoryQueueKey);
export const getCompletedQuestionIds = () => [...new Set(loadAnsweredQuestionHistory().filter((event) => event.completed).map((event) => event.questionId))];

export const buildAnsweredQuestionHistoryEvents = (inputs: AnsweredQuestionHistoryInput[]) => {
  const profile = getLearnerProfile();
  if (profile.isTest) return [];
  return inputs.map((input) => ({ ...input, schemaVersion: 1 as const, eventId: `${input.sessionId}:${input.questionId}:answered`, learnerId: profile.learnerId, completed: true as const, clientTimestamp: new Date().toISOString() }));
};

const saveLocallyAndQueue = (events: AnsweredQuestionHistoryEvent[]) => {
  if (!events.length) return;
  writeList(answeredQuestionHistoryStorageKey, [...loadAnsweredQuestionHistory(), ...events]);
  writeList(answeredQuestionHistoryQueueKey, [...loadAnsweredQuestionHistoryQueue(), ...events], queueLimit);
};

const postEvent = async (event: AnsweredQuestionHistoryEvent): Promise<boolean> => {
  const profile = getLearnerProfile();
  const { apiUrl, writeKey } = config();
  if (profile.isTest || !apiUrl) return false;
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveAnsweredQuestionHistory', ...event, sourceRole: profile.sourceRole, isTest: profile.isTest, writeKey: writeKey || undefined }) });
    const payload = await response.json() as { success?: boolean };
    return response.ok && payload.success === true;
  } catch { return false; }
};

export const retryAnsweredQuestionHistorySync = async (): Promise<HistorySyncStatus> => {
  const profile = getLearnerProfile();
  if (profile.isTest) return 'disabled';
  const pending = loadAnsweredQuestionHistoryQueue();
  if (!pending.length) return config().apiUrl ? 'synced' : 'disabled';
  if (!config().apiUrl) return 'pending';
  const remaining: AnsweredQuestionHistoryEvent[] = [];
  for (const event of pending) if (!await postEvent(event)) remaining.push(event);
  writeList(answeredQuestionHistoryQueueKey, remaining, queueLimit);
  return remaining.length ? 'pending' : 'synced';
};

export const recordAnsweredQuestionHistory = async (inputs: AnsweredQuestionHistoryInput[]): Promise<HistorySyncStatus> => {
  const events = buildAnsweredQuestionHistoryEvents(inputs);
  if (!events.length) return 'disabled';
  saveLocallyAndQueue(events);
  return retryAnsweredQuestionHistorySync();
};

export const fetchAnsweredQuestionHistory = async (): Promise<AnsweredQuestionHistoryEvent[]> => {
  const profile = getLearnerProfile();
  if (profile.isTest || !config().apiUrl) return loadAnsweredQuestionHistory();
  try {
    const url = new URL(config().apiUrl);
    url.searchParams.set('action', 'getAnsweredQuestionHistory');
    if (config().writeKey) url.searchParams.set('writeKey', config().writeKey);
    const response = await fetch(url.toString());
    const payload = await response.json() as { success?: boolean; data?: unknown[] };
    if (!response.ok || payload.success !== true || !Array.isArray(payload.data)) throw new Error('unavailable');
    const remote = payload.data.map(normalize).filter((event): event is AnsweredQuestionHistoryEvent => event !== null);
    writeList(answeredQuestionHistoryStorageKey, [...loadAnsweredQuestionHistory(), ...remote]);
  } catch { /* 雲端不可用時沿用本機永久歷史。 */ }
  return loadAnsweredQuestionHistory();
};
