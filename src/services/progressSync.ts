import { getStorageItem, safeJsonParse, setStorageItem } from '../utils/storageHealth';
import { getLearnerProfile, getProfileStorageKey, type LearnerProfile } from '../utils/learnerProfile';

export const pendingSyncKey = 'ifa-progress-sync-queue-v1';
const queueLimit = 100;
let hasWarnedDisabled = false;
const sentEventIds = new Set<string>();
export type ExamEventType = 'exam_started' | 'exam_progress' | 'exam_completed';
export type AnswerStatus = 'correct' | 'wrong' | 'unanswered' | 'pending_self_review';
export interface AnswerRecord { questionId: number | string; selectedAnswer: unknown; correctAnswer: unknown; isCorrect: boolean | null; status?: AnswerStatus; }
interface Base extends LearnerProfile { schemaVersion: 1; eventId: string; eventType: ExamEventType; sessionId: string; examId: string; examTitle: string; examType: string; startedAt: string; updatedAt: string; clientTimestamp: string; }
export interface ExamStartedPayload extends Base { eventType: 'exam_started'; questionCount: number; }
export interface ExamProgressPayload extends Base { eventType: 'exam_progress'; answeredCount: number; questionCount: number; progressPercent: number; }
export interface ExamCompletedPayload extends Base { eventType: 'exam_completed'; questionCount: number; answeredCount: number; correctCount: number; wrongCount: number; unansweredCount: number; score: number | null; durationSeconds: number; completedAt: string; answers: AnswerRecord[]; }
export type ProgressEvent = ExamStartedPayload | ExamProgressPayload | ExamCompletedPayload;
export type SyncStatus = 'disabled' | 'synced' | 'pending';
const config = () => ({ apiUrl: (import.meta.env.VITE_PROGRESS_API_URL as string | undefined)?.trim() ?? '', writeKey: (import.meta.env.VITE_PROGRESS_WRITE_KEY as string | undefined)?.trim() ?? '' });
const readQueue = (): ProgressEvent[] => { const value = safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(pendingSyncKey))); return Array.isArray(value) ? value.filter((item): item is ProgressEvent => Boolean(item) && typeof item === 'object' && typeof (item as ProgressEvent).eventId === 'string') : []; };
const writeQueue = (events: ProgressEvent[]) => setStorageItem(getProfileStorageKey(pendingSyncKey), JSON.stringify(events.slice(-queueLimit)));
const queue = (event: ProgressEvent) => { const events = readQueue().filter((item) => item.eventId !== event.eventId); events.push(event); writeQueue(events); };
const request = async (event: ProgressEvent, queueOnFailure = true): Promise<SyncStatus> => { const profile = getLearnerProfile(); const { apiUrl, writeKey } = config(); if (profile.isTest || event.isTest) return 'disabled'; if (sentEventIds.has(event.eventId)) return 'synced'; if (!apiUrl) { if (import.meta.env.DEV && !hasWarnedDisabled) { console.warn('Progress sync is disabled: VITE_PROGRESS_API_URL is not set.'); hasWarnedDisabled = true; } return 'disabled'; } try { const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...event, writeKey: writeKey || undefined }) }); const result = await response.json() as { success?: boolean }; if (!response.ok || result.success !== true) throw new Error('Sync rejected'); sentEventIds.add(event.eventId); return 'synced'; } catch { if (queueOnFailure) queue(event); return 'pending'; } };
type Started = Pick<Base, 'sessionId' | 'examId' | 'examTitle' | 'examType' | 'startedAt'> & { questionCount: number };
type Progress = Pick<Base, 'sessionId' | 'examId' | 'examTitle' | 'examType' | 'startedAt'> & { answeredCount: number; questionCount: number; progressPercent: number };
type Completed = Pick<Base, 'sessionId' | 'examId' | 'examTitle' | 'examType' | 'startedAt'> & { questionCount: number; answeredCount: number; correctCount: number; wrongCount: number; unansweredCount: number; score: number | null; durationSeconds: number; answers: AnswerRecord[]; };
export const syncExamStarted = (payload: Started) => { const now = new Date().toISOString(); return request({ ...payload, ...getLearnerProfile(), schemaVersion: 1, eventId: `${payload.sessionId}:started`, eventType: 'exam_started', updatedAt: now, clientTimestamp: now }); };
export const syncExamProgress = (payload: Progress) => { const now = new Date().toISOString(); return request({ ...payload, ...getLearnerProfile(), schemaVersion: 1, eventId: `${payload.sessionId}:progress:${payload.answeredCount}`, eventType: 'exam_progress', updatedAt: now, clientTimestamp: now }); };
export const syncExamCompleted = (payload: Completed) => { const now = new Date().toISOString(); return request({ ...payload, ...getLearnerProfile(), schemaVersion: 1, eventId: `${payload.sessionId}:completed`, eventType: 'exam_completed', updatedAt: now, clientTimestamp: now, completedAt: now }); };
export const retryPendingSync = async () => { const events = readQueue(); const remaining: ProgressEvent[] = []; for (const event of events) if (await request(event, false) !== 'synced') remaining.push(event); writeQueue(remaining); return remaining.length === 0 ? 'synced' : config().apiUrl ? 'pending' : 'disabled'; };
export const getSyncStatus = (): SyncStatus => !config().apiUrl ? 'disabled' : readQueue().length > 0 ? 'pending' : 'synced';
