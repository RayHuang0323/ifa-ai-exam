import React from 'react';
import { calculateAccuracy, formatDuration, formatStudyDate, formatStudyMode, getRecentStudySessions } from '../../utils/studyActivity';
import type { StudySession } from '../../types/study';

interface RecentActivitySectionProps { sessions?: StudySession[]; sourceLabel?: string; }

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ sessions: providedSessions, sourceLabel }) => {
  const sessions = providedSessions ?? getRecentStudySessions();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4"><h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">最近學習紀錄</h2>{sourceLabel && <span className="text-[11px] text-slate-500">{sourceLabel}</span>}</div>
      {sessions.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50" data-testid="recent-activity-empty"><span className="text-slate-500 text-xs font-semibold">目前還沒有學習紀錄。</span><span className="text-slate-400 text-[11px] mt-1">完成今日任務、模擬考或錯題複習後，紀錄會顯示在這裡。</span></div> : <div className="space-y-3" data-testid="recent-activity-list">{sessions.map((session) => <article key={session.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-slate-800">{formatStudyMode(session.mode)}</strong><span className="text-xs text-slate-500">{formatStudyDate(session.completedAt)}</span></div><p className="mt-2 text-slate-600">題數 {session.answeredCount ?? 0} 題・答對 {session.correctCount ?? 0} 題・答錯 {session.wrongCount ?? 0} 題・正確率 {calculateAccuracy(session)}%・花費時間 {formatDuration(session.durationSeconds)}</p></article>)}</div>}
    </div>
  );
};
