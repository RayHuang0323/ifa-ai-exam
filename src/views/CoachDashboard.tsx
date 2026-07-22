import { useEffect, useState } from 'react';
import { coachReadKeyStorageKey, getCoachLearningAnalysis, getCoachSummary, getRecentSessions, getSessionDetails, type CoachAnswer, type CoachLearningAnalysis, type CoachSession, type CoachSummary } from '../services/coachApi';
import { questionBankStats, questionBankVersionLabel } from '../config/questionBankVersion';
import { getDailyQuestionPool, getFormalQuestionPool, getPracticeQuestionPool } from '../utils/questionEngine';
import { getFirstRoundStats, getRecentRepeatRate } from '../utils/questionScheduler';

const rememberedKey = 'ifa-coach-read-key-remembered-v1';
const getStoredKey = () => { try { return localStorage.getItem(rememberedKey) ?? sessionStorage.getItem(coachReadKeyStorageKey) ?? ''; } catch { return ''; } };
const format = (value: string | null | undefined) => value ? new Date(value).toLocaleString('zh-TW') : '—';
const sessionStatus = (status: string) => status === 'completed' ? '已完成' : '進行中／未完成';
const hasAnswer = (value: unknown) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
const answerStatus = (value: boolean | null | undefined, selectedAnswer: unknown) => !hasAnswer(selectedAnswer) ? '未作答' : value === true ? '答對' : value === false ? '答錯' : '尚未執行規準輔助評分';
const cardClass = 'min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg';

export default function CoachDashboard({ onReturnHome }: { onReturnHome: () => void }) {
  const [key, setKey] = useState(getStoredKey);
  const [input, setInput] = useState('');
  const [remember, setRemember] = useState(false);
  const [summary, setSummary] = useState<CoachSummary | null>(null);
  const [analysis, setAnalysis] = useState<CoachLearningAnalysis | null>(null);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [detail, setDetail] = useState<{ session: CoachSession; answers: CoachAnswer[] } | null>(null);
  const [error, setError] = useState('');
  const formalFirstRound = getFirstRoundStats(getFormalQuestionPool().map((question) => question.id));
  const practiceFirstRound = getFirstRoundStats(getPracticeQuestionPool().map((question) => question.id));

  const load = async (nextKey = key, saveRemember = false) => {
    if (!nextKey) return;
    setError('');
    try {
      const [nextSummary, nextSessions, nextAnalysis] = await Promise.all([
        getCoachSummary(nextKey),
        getRecentSessions(nextKey),
        getCoachLearningAnalysis(nextKey, getDailyQuestionPool().length),
      ]);
      sessionStorage.setItem(coachReadKeyStorageKey, nextKey);
      if (saveRemember) localStorage.setItem(rememberedKey, nextKey);
      setKey(nextKey);
      setSummary(nextSummary);
      setSessions(nextSessions);
      setAnalysis(nextAnalysis);
    } catch {
      setError('查看碼不正確或資料暫時無法讀取');
      setSummary(null);
      setAnalysis(null);
    }
  };
  const clear = () => {
    try { sessionStorage.removeItem(coachReadKeyStorageKey); localStorage.removeItem(rememberedKey); } catch { /* storage may be unavailable */ }
    setKey(''); setInput(''); setSummary(null); setAnalysis(null); setSessions([]); setDetail(null); setError('');
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (key) void load(key); }, []);

  if (!key || !summary) return (
    <main className="min-h-screen w-full bg-[#050508] text-slate-100"><div className="max-w-3xl mx-auto px-4 py-8">
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Coach 學習追蹤</h1>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Coach 查看碼" className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-400" />
        <label className="flex gap-2 text-sm text-slate-200"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />記住此裝置</label>
        <div className="flex flex-wrap gap-2"><button onClick={() => void load(input, remember)} className="rounded-xl bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-400">查看學習紀錄</button><button onClick={onReturnHome} className="rounded-xl border border-slate-500 px-4 py-2 font-bold text-slate-100 hover:bg-slate-800">返回首頁</button></div>
        {error && <p className="text-sm font-medium text-rose-300">{error}</p>}
      </section>
    </div></main>
  );

  const historyCards: Array<[string, string | number]> = analysis ? [
    ['已完成題數', analysis.completedQuestionCount],
    ['未完成題數', analysis.incompleteQuestionCount],
    ['題庫完成率', `${Math.round(analysis.completedQuestionCount / Math.max(1, analysis.completedQuestionCount + analysis.incompleteQuestionCount) * 100)}%`],
    ['最近完成時間', format(analysis.lastCompletedAt)],
    ['最弱分類', analysis.weakestCategory ?? '—'],
  ] : [];

  return (
    <main className="min-h-screen w-full bg-[#050508] text-slate-100"><div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap gap-3 justify-between"><div><h1 className="text-2xl font-bold text-white">Coach 學習追蹤</h1><p className="text-sm text-slate-300">查看對象：Bella · 資料更新：{format(summary.generatedAt)}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void load()} className="rounded-xl border border-slate-500 px-3 py-2 font-bold text-slate-100 hover:bg-slate-800">重新整理</button><button onClick={clear} className="rounded-xl border border-slate-500 px-3 py-2 font-bold text-slate-100 hover:bg-slate-800">清除查看碼</button><button onClick={onReturnHome} className="rounded-xl border border-slate-500 px-3 py-2 font-bold text-slate-100 hover:bg-slate-800">返回首頁</button></div></header>
      <section data-testid="question-bank-version" className="rounded-xl border border-indigo-800/70 bg-indigo-950/20 p-4 text-sm text-indigo-100"><p className="font-bold">題庫版本：{questionBankVersionLabel}</p><p className="mt-1">正式模擬題庫：{questionBankStats.fullMockEligibleCount} 題（verified {questionBankStats.verifiedCount} + 教材證據題 {questionBankStats.sourceVerifiedCount}）</p><p className="mt-1">Daily／Weekly 題池：{questionBankStats.dailyWeeklyPoolCount} 題 · 更新：{questionBankStats.updatedAt}</p><p className="mt-1">正式題第一輪：{formalFirstRound.appearedCount} / {formalFirstRound.totalCount} 題 · 練習題第一輪：{practiceFirstRound.appearedCount} / {practiceFirstRound.totalCount} 題</p><p className="mt-1">近 7 日重複率：Daily {getRecentRepeatRate('daily')}% · Weekly {getRecentRepeatRate('weekly')}% · 模擬考 {getRecentRepeatRate('mock')}%</p><p className="mt-1 text-xs text-indigo-200">目前可用題池：{getDailyQuestionPool().length} 題</p></section>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['累積完成題數', summary.totalAnsweredCount], ['累積正確率', summary.overallAccuracy === null ? '—' : `${summary.overallAccuracy}%`], ['完成測驗', summary.completedSessionCount], ['最後活動', format(summary.lastActivityAt)]].map(([label, value]) => <article key={String(label)} className={cardClass}><p className="text-xs font-semibold text-slate-300">{label}</p><strong className="mt-2 block break-words text-lg text-white">{value}</strong></article>)}</section>
      {analysis && <section data-testid="coach-learning-analysis" className="space-y-3"><h2 className="text-xl font-bold text-white">作答歷史分析（唯讀）</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{historyCards.map(([label, value]) => <article key={label} className={cardClass}><p className="text-xs font-semibold text-slate-300">{label}</p><strong className="mt-2 block break-words text-lg text-white">{value}</strong></article>)}</div><p className={`${cardClass} text-sm text-slate-200`}>錯題分類：{analysis.wrongByCategory.length ? analysis.wrongByCategory.map((item) => `${item.category} ${item.count} 題`).join('、') : '目前無錯題紀錄'}</p></section>}
      <section className="space-y-3"><h2 className="text-xl font-bold text-white">最近測驗紀錄</h2>{sessions.length === 0 ? <p className={cardClass}>目前尚無 Bella 的正式測驗紀錄。</p> : sessions.map((item) => <button key={item.sessionId} disabled={item.status !== 'completed'} onClick={() => void getSessionDetails(key, item.sessionId).then(setDetail).catch(() => setError('資料暫時無法讀取'))} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-left text-slate-100 shadow-lg hover:border-indigo-400 disabled:cursor-default disabled:opacity-80"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="break-words text-white">{item.examTitle}</strong><span className={item.status === 'completed' ? 'rounded-full bg-emerald-900/70 px-2 py-1 text-xs font-bold text-emerald-200' : 'rounded-full bg-amber-900/70 px-2 py-1 text-xs font-bold text-amber-100'}>{sessionStatus(item.status)}</span></div><p className="mt-2 text-sm text-slate-200">{format(item.completedAt ?? item.updatedAt)} · 已答 {item.answeredCount}/{item.questionCount} · 分數 {item.status === 'completed' && item.score !== null ? item.score : '—'}</p></button>)}</section>
      {error && <p className="text-sm font-medium text-rose-300">{error}</p>}
      {detail && <section className="space-y-2"><h2 className="text-xl font-bold text-white">測驗詳細</h2>{detail.answers.length ? detail.answers.map((answer) => <article key={answer.questionId} className={`${cardClass} text-sm text-slate-100 break-words`}><p><span className="font-semibold text-slate-300">題目：</span>{answer.questionId}</p><p><span className="font-semibold text-slate-300">作答：</span>{hasAnswer(answer.selectedAnswer) ? String(answer.selectedAnswer) : '未作答'}</p><p><span className="font-semibold text-slate-300">參考答案：</span>{String(answer.correctAnswer ?? '—')}</p><p><span className="font-semibold text-slate-300">判定：</span>{answerStatus(answer.isCorrect, answer.selectedAnswer)}</p><p className="text-xs text-slate-400">{format(answer.answeredAt ?? answer.syncedAt)}</p></article>) : <p className={cardClass}>此測驗尚無逐題紀錄</p>}</section>}
    </div></main>
  );
}
