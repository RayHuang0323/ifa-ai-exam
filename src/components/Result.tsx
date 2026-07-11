import { useMemo, useState } from 'react';
import { RotateCcw, Target } from 'lucide-react';
import type { StudyMode } from '../types/study';
import { getWrongAnswerSummary } from '../utils/wrongAnswerStore';

interface Question {
  id: number;
  knowledgeId?: string;
  type: string;
  chapter: string;
  question: string;
  answer: string | string[];
  explanation: string;
}

interface ResultProps {
  questions: Question[];
  knowledge: { id: string; topic: string }[];
  answers: Record<string, string | string[]>;
  timeSpent: number;
  mode: StudyMode;
  selfCheckResults?: Record<string, boolean>;
  onReturnHome: () => void;
  onRetry: () => void;
}

const isAnswered = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
const isSelfCheckQuestion = (question: Question) => ['short-answer', 'writing', 'memorization', 'essay'].includes(question.type);

const normalizeText = (answer: string) => answer.trim().replace(/\s+/g, ' ');

const isCorrect = (question: Question, answer: string | string[] | undefined) => {
  if (!isAnswered(answer)) return false;

  if (Array.isArray(question.answer)) {
    return Array.isArray(answer)
      && question.answer.length === answer.length
      && question.answer.every((option) => answer.includes(option));
  }

  return typeof answer === 'string' && normalizeText(answer) === normalizeText(question.answer);
};

const formatAnswer = (answer: string | string[] | undefined) => {
  if (!isAnswered(answer)) return '未作答';
  return Array.isArray(answer) ? answer.join('、') : answer;
};

export default function Result({ questions, knowledge, answers, timeSpent, mode, selfCheckResults = {}, onReturnHome, onRetry }: ResultProps) {
  const [showReview, setShowReview] = useState(false);
  const stats = useMemo(() => {
    const wasAnswered = (question: Question) => isSelfCheckQuestion(question) ? selfCheckResults[question.id] !== undefined : isAnswered(answers[question.id]);
    const wasCorrect = (question: Question) => isSelfCheckQuestion(question) ? selfCheckResults[question.id] === true : isCorrect(question, answers[question.id]);
    const reviewItems = questions.filter((question) => !wasCorrect(question));
    const unansweredCount = questions.filter((question) => !wasAnswered(question)).length;
    const correctCount = questions.filter(wasCorrect).length;
    const wrongCount = questions.filter((question) => wasAnswered(question) && !wasCorrect(question)).length;

    return {
      correctCount,
      wrongCount,
      unansweredCount,
      reviewItems,
      accuracy: questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100),
    };
  }, [answers, questions, selfCheckResults]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} 分 ${remainingSeconds} 秒`;
  };
  const wrongSummary = mode === 'reviewWrong' ? getWrongAnswerSummary() : null;

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans pb-20">
      <header className="border-b border-slate-800/80 bg-[#090a0f] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-400">測驗結果</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{mode === 'reviewWrong' ? '錯題複習完成' : mode === 'writingPractice' ? '簡答／默寫練習完成' : 'Week 1 測驗結果'}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        {mode === 'reviewWrong' && <section className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 text-sm text-slate-300"><strong>本次錯題複習 {questions.length} 題</strong><p>本次答對 {stats.correctCount} 題・本次仍需加強 {stats.wrongCount} 題・目前已熟練 {wrongSummary?.masteredCount ?? 0} 題</p></section>}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">正確率</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-6xl font-black font-mono tracking-tighter text-indigo-300">{stats.accuracy}</span>
              <span className="text-2xl text-slate-500 font-bold">%</span>
            </div>
            <span className="text-xs text-slate-400">得分 {stats.correctCount} / {questions.length}</span>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">總題數</span><p className="mt-2 text-2xl font-bold text-slate-200 font-mono">{questions.length}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">答對</span><p className="mt-2 text-2xl font-bold text-emerald-300 font-mono">{stats.correctCount}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">答錯</span><p className="mt-2 text-2xl font-bold text-red-300 font-mono">{stats.wrongCount}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">未作答</span><p className="mt-2 text-2xl font-bold text-amber-300 font-mono">{stats.unansweredCount}</p></div>
            <div className="col-span-2 sm:col-span-4 bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">實際花費時間</span><p className="text-xl font-bold text-slate-200 font-mono">{formatTime(timeSpent)}</p></div>
          </div>
        </section>

        <section className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-slate-400" /><h2 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-300">錯題與解析</h2></div>
            <button onClick={() => setShowReview((visible) => !visible)} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">{showReview ? '收起解析' : '查看錯題與解析'}</button>
          </div>

          {showReview && (stats.reviewItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-400">本次沒有錯題。</div>
          ) : (
            <div className="space-y-5">
              {stats.reviewItems.map((question, index) => {
                const knowledgeItem = question.knowledgeId ? knowledge.find((item) => item.id === question.knowledgeId) : undefined;
                const unanswered = !isAnswered(answers[question.id]);
                return (
                  <article key={question.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-slate-800 px-2 py-1 font-mono text-slate-300">第 {index + 1} 題</span>
                      <span className="text-slate-400">{question.chapter}</span>
                      <span className={unanswered ? 'text-amber-300' : 'text-red-300'}>{unanswered ? '未作答' : '答錯'}</span>
                    </div>
                    <h3 className="text-base font-medium text-white leading-relaxed">{question.question}</h3>
                    <div className="grid gap-3 text-sm leading-relaxed">
                      <p><span className="text-slate-500">你的答案：</span><span className={unanswered ? 'text-amber-200' : 'text-red-200'}>{formatAnswer(answers[question.id])}</span></p>
                      <p><span className="text-slate-500">正確答案：</span><span className="text-emerald-200 whitespace-pre-line">{formatAnswer(question.answer)}</span></p>
                      <p className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-1">解析</span>{question.explanation}</p>
                      {question.knowledgeId && <p className="text-xs text-slate-500">知識點：{question.knowledgeId}{knowledgeItem ? `・${knowledgeItem.topic}` : ''}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </section>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button onClick={onRetry} className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 text-sm"><RotateCcw className="w-4 h-4" />重新測驗</button>
          <button onClick={onReturnHome} className="h-12 px-6 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-sm">返回首頁</button>
        </div>
      </main>
    </div>
  );
}
