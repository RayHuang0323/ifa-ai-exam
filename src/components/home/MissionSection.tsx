import React from 'react';
import type { TodayTask } from '../../types/task';
import type { StudyMode } from '../../types/study';

interface MissionSectionProps {
  task: TodayTask;
  wrongAnswerCount: number;
  guidance: string;
  onStartTask: (suggestedQuestions: number, mode: StudyMode) => void;
}

export const MissionSection: React.FC<MissionSectionProps> = ({ task, wrongAnswerCount, guidance, onStartTask }) => {
  return (
    <article className="study-card mission-section">
      <span className="study-eyebrow">今日任務</span>
      <div className="mission-task-card">
        <div>
          <span className="mission-task-title">{task.mode === 'reviewPreview' ? task.title : '每日任務'}</span>
          <strong className="mission-question-count">{task.totalQuestions ?? task.suggestedQuestions} 題</strong>
          <p>約 {task.estimatedMinutes} 分鐘</p>
          <p className="mission-task-reason">今日基本任務：{task.basicQuestions ?? 30} 題</p>
          <p className="mission-task-reason">今日可加做：最多 {task.maximumQuestions ?? 90} 題</p>
          {task.totalQuestions !== undefined && <p className="mission-task-reason">今日進度：{task.completedQuestions ?? 0} / {task.totalQuestions} 題</p>}
          {(task.carryoverQuestions ?? 0) > 0 && <p className="mission-task-reason">未完成保留題：{task.carryoverQuestions} 題</p>}
          {task.isInsufficient && <p className="mission-task-reason text-amber-700">目前可用題數不足，已提供 {task.totalQuestions} 題。</p>}
          <p className="mission-task-reason">原因：{task.reason}</p>
          <p className="mission-task-reason" data-testid="study-guidance">學習提醒：{guidance}</p>
          <p className="mission-task-note">今日完成後，剩餘題目將於後續每日任務、每週複習與正式模擬考中安排。</p>
          {wrongAnswerCount > 0 && <p>目前錯題數：{wrongAnswerCount} 題</p>}
        </div>
        {task.mode === 'reviewPreview' ? <span className="study-preview-note">完整錯題複習將在後續 Sprint 提供。</span> : <div className="flex flex-col items-end gap-2"><button data-testid="primary-today-task" onClick={() => onStartTask(task.suggestedQuestions, task.mode as StudyMode)} disabled={task.suggestedQuestions === 0} className="study-task-button disabled:opacity-50">{task.ctaLabel}</button>{(task.canAddQuestions ?? 0) > 0 && <button data-testid="add-today-task" onClick={() => onStartTask(task.maximumQuestions ?? 90, task.mode as StudyMode)} className="h-10 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">今日加做題目</button>}</div>}
      </div>
    </article>
  );
};
