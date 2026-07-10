import React from 'react';
import type { TodayTask } from '../../types/task';
import type { StudyMode } from '../../types/study';

interface MissionSectionProps {
  task: TodayTask;
  wrongAnswerCount: number;
  onStartTask: (suggestedQuestions: number, mode: StudyMode) => void;
}

export const MissionSection: React.FC<MissionSectionProps> = ({ task, wrongAnswerCount, onStartTask }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">今日任務</h2>
      <div className="mission-task-card">
        <div>
          <span className="mission-task-title">{task.title}</span>
          <p>{task.description}</p>
          <p className="mission-task-reason">原因：{task.reason}</p>
          <p>目前錯題數：{wrongAnswerCount > 0 ? `${wrongAnswerCount} 題` : '完成測驗後會建立錯題複習清單。'}</p>
        </div>
        {task.mode === 'reviewPreview' ? <span className="study-preview-note">完整錯題複習將在後續 Sprint 提供。</span> : <button onClick={() => onStartTask(task.suggestedQuestions, task.mode as StudyMode)} className="study-task-button">{task.ctaLabel}</button>}
      </div>
    </div>
  );
};
