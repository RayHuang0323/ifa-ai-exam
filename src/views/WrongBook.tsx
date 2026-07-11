import { useMemo, useState } from 'react';
import type { WrongAnswerRecord } from '../types/task';
import { getQuestionById } from '../utils/questionEngine';
import { getWrongAnswerSummary, isReviewableToday, loadWrongAnswers } from '../utils/wrongAnswerStore';

type WrongBookFilter = 'all' | 'reviewable' | 'highRisk' | 'improving' | 'mastered';

interface WrongBookProps {
  onReturnHome: () => void;
  onStartReview: (questionIds: number[]) => void;
}

const filterLabels: Record<WrongBookFilter, string> = {
  all: '全部',
  reviewable: '待複習',
  highRisk: '高風險',
  improving: '改善中',
  mastered: '已熟練',
};

const statusLabels: Record<WrongAnswerRecord['status'], string> = {
  newWrong: '新錯題',
  reviewing: '複習中',
  highRisk: '高風險',
  improving: '改善中',
  mastered: '已熟練',
};

const formatDate = (value: string | null) => {
  if (!value) return '尚無紀錄';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '日期待確認' : date.toLocaleDateString('zh-TW');
};

export default function WrongBook({ onReturnHome, onStartReview }: WrongBookProps) {
  const [filter, setFilter] = useState<WrongBookFilter>('all');
  const records = useMemo(() => loadWrongAnswers(), []);
  const summary = useMemo(() => getWrongAnswerSummary(), [records]);
  const entries = useMemo(() => records.map((record) => ({ record, question: getQuestionById(record.questionId) })), [records]);
  const filteredEntries = useMemo(() => entries.filter(({ record }) => {
    if (filter === 'all') return true;
    if (filter === 'reviewable') return isReviewableToday(record);
    if (filter === 'highRisk') return record.status === 'highRisk';
    if (filter === 'improving') return record.status === 'improving';
    return record.status === 'mastered';
  }), [entries, filter]);
  const reviewableQuestionIds = filteredEntries
    .filter(({ record, question }) => question !== null && isReviewableToday(record))
    .map(({ record }) => record.questionId)
    .slice(0, 10);

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow" data-testid="wrong-book-page">
      <section className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-lg">
        <header className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-400">學習紀錄</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">錯題本</h1>
          <p className="text-sm leading-relaxed text-slate-400">系統會保留答錯題目，答對一次不會立即移除，連續答對後才會標示為已熟練。</p>
        </header>

        {records.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center space-y-3" data-testid="wrong-book-empty">
            <h2 className="text-lg font-bold text-slate-100">目前還沒有錯題。</h2>
            <p className="text-sm text-slate-400">完成每日任務或模擬考後，答錯題目會自動整理到這裡。</p>
            <button onClick={onReturnHome} className="h-10 px-4 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm font-bold">返回首頁</button>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-5 gap-3" aria-label="錯題本統計">
              {[
                ['錯題總數', summary.totalWrong],
                ['待複習', summary.reviewableCount],
                ['高風險', summary.highRiskCount],
                ['改善中', summary.improvingCount],
                ['已熟練', summary.masteredCount],
              ].map(([label, count]) => (
                <article key={label as string} className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <strong className="mt-1 block text-2xl font-bold text-slate-100 font-mono">{count}</strong>
                </article>
              ))}
            </section>

            <section className="flex flex-wrap gap-2" aria-label="錯題狀態篩選">
              {(Object.keys(filterLabels) as WrongBookFilter[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`h-9 px-3 rounded-lg text-sm font-bold border ${filter === option ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                  {filterLabels[option]}
                </button>
              ))}
            </section>

            {reviewableQuestionIds.length > 0 && (
              <button data-testid="wrong-book-review-filter-button" onClick={() => onStartReview(reviewableQuestionIds)} className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">
                開始複習目前篩選題目
              </button>
            )}

            {filteredEntries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-400">此篩選目前沒有錯題。</p>
            ) : (
              <section className="space-y-4" data-testid="wrong-book-list">
                {filteredEntries.map(({ record, question }) => (
                  <article key={`${record.weekId}-${record.questionId}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-mono">題目 ID：{record.questionId}</p>
                        <h2 className="text-base font-bold leading-relaxed text-slate-100">{question?.question ?? '題目資料待確認'}</h2>
                      </div>
                      <span className="w-fit rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-200">{statusLabels[record.status]}</span>
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div><dt className="text-slate-500">答錯次數</dt><dd className="mt-1 font-bold text-slate-200">{record.wrongCount}</dd></div>
                      <div><dt className="text-slate-500">複習答對次數</dt><dd className="mt-1 font-bold text-slate-200">{record.correctReviewCount}</dd></div>
                      <div><dt className="text-slate-500">連續答對次數</dt><dd className="mt-1 font-bold text-slate-200">{record.consecutiveCorrect}</dd></div>
                      <div><dt className="text-slate-500">最後答錯日期</dt><dd className="mt-1 font-bold text-slate-200">{formatDate(record.lastWrongAt)}</dd></div>
                      <div><dt className="text-slate-500">最後複習日期</dt><dd className="mt-1 font-bold text-slate-200">{formatDate(record.lastReviewedAt)}</dd></div>
                    </dl>
                  </article>
                ))}
              </section>
            )}

            <button onClick={onReturnHome} className="h-10 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold">返回首頁</button>
          </>
        )}
      </section>
    </main>
  );
}
