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
    <article className="study-card mission-section">
      <span className="study-eyebrow">今日任務</span>
      <div className="mission-task-card">
        <div>
          <span className="mission-task-title">{task.mode === 'reviewPreview' ? task.title : 'Week1 今日練習'}</span>
          <strong className="mission-question-count">{task.suggestedQuestions} 題</strong>
          <p>約 {task.estimatedMinutes} 分鐘</p>
          <p className="mission-task-reason">原因：{task.reason}</p>
          <p className="mission-task-note">今日完成後，剩餘題目將於後續每日任務、每週複習與正式模擬考中安排。</p>
          {wrongAnswerCount > 0 && <p>目前錯題數：{wrongAnswerCount} 題</p>}
        </div>
        {task.mode === 'reviewPreview' ? <span className="study-preview-note">完整錯題複習將在後續 Sprint 提供。</span> : <button data-testid="primary-today-task" onClick={() => onStartTask(task.suggestedQuestions, task.mode as StudyMode)} className="study-task-button">{task.ctaLabel}</button>}
      </div>
    </article>
  );
};
