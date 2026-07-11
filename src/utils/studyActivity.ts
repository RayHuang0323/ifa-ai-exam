import type { StudyMode, StudySession } from '../types/study';
import { loadStudyProgress } from './studyProgress';

export const getRecentStudySessions = (limit = 3) => loadStudyProgress().sessions
  .slice()
  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  .slice(0, limit);

export const formatStudyMode = (mode: StudyMode | string | undefined) => ({
  daily: '今日任務',
  'formal-exam': '完整模擬考',
  reviewWrong: '錯題複習',
  weeklyCatchUp: '每週補強',
  recovery: '進度補強',
}[mode ?? ''] ?? '學習紀錄');

export const formatStudyDate = (value: string | undefined) => {
  if (!value) return '未記錄';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日期待確認';
  return `${date.getFullYear()}/${`${date.getMonth() + 1}`.padStart(2, '0')}/${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
};

export const formatDuration = (seconds: number | undefined) => {
  if (typeof seconds !== 'number' || seconds < 0) return '未記錄';
  if (seconds < 60) return '未滿 1 分鐘';
  return `${Math.floor(seconds / 60)} 分鐘`;
};

export const calculateAccuracy = (session: Partial<StudySession>) => {
  if (typeof session.answeredCount !== 'number' || session.answeredCount <= 0 || typeof session.correctCount !== 'number') return 0;
  return Math.round((session.correctCount / session.answeredCount) * 100);
};
