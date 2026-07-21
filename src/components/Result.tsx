import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Target } from 'lucide-react';
import type { StudyMode } from '../types/study';
import { getWrongAnswerSummary } from '../utils/wrongAnswerStore';
import type { AiGradeInput } from '../services/aiGrading';
import { gradeWithLocalRubric } from '../utils/localRubricGrading';
import { getAiReviewsForSession, recordAiReview, type AiReviewRecord } from '../utils/aiReviewStore';
import type { RubricMetadata } from '../utils/questionQualityGovernance';
import { displaySourceValue } from '../utils/questionQualityAudit';

interface Question {
  id: number;
  knowledgeId?: string;
  type: string;
  chapter: string;
  question: string;
  displayQuestion?: string;
  answer: string | string[];
  explanation?: string;
  referenceAnswer?: string | string[];
  answerGuide?: string;
  sampleAnswer?: string;
  keyPoints?: string[];
  rubric?: unknown[] | RubricMetadata;
  highScoreGuidance?: string[];
  commonOmissions?: string[];
  teacherExplanation?: string;
  category?: string;
  sourceLabel?: string;
  sourceFile?: string;
  sourcePage?: string | number;
  sourceChapter?: string;
  sourceVersion?: string;
  sourceLocation?: string;
  displaySourceFile?: string;
  displaySourceLabel?: string;
  displaySourceLocation?: string;
  displaySourceChapter?: string;
  displaySourceVersion?: string;
  displaySourcePage?: string | number;
  displayTextbookLocation?: string;
  displayExplanation?: string;
  sourceEvidenceIds?: string[];
  evidenceExcerpt?: string;
  displayEvidenceExcerpt?: string;
  practiceOnly?: boolean;
  formalScoreEligible?: boolean;
  sourceType?: string;
  verificationType?: string;
  answerBasis?: string;
  displayAnswerBasis?: string;
  displayAnswer?: string | string[];
  displayReferenceAnswer?: string | string[];
  riskLevel?: string;
  imageRequired?: boolean;
  imageSource?: string;
  imageAlt?: string;
  imageMissing?: boolean;
}

interface ResultProps {
  questions: Question[];
  knowledge: { id: string; topic: string }[];
  answers: Record<string, string | string[]>;
  timeSpent: number;
  mode: StudyMode;
  sessionId?: string;
  selfCheckResults?: Record<string, boolean>;
  onReturnHome: () => void;
  onRetry: () => void;
}

const isAnswered = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
const isSelfCheckQuestion = (question: Question) => ['short-answer', 'short_answer', 'shortAnswer', 'writing', 'memorization', 'essay', 'case-study', 'case_study', 'case'].includes(question.type);
const isFormalAutoGradedQuestion = (question: Question) => !isSelfCheckQuestion(question) && question.practiceOnly !== true && question.formalScoreEligible !== false;
const isPracticeAutoGradedQuestion = (question: Question) => !isSelfCheckQuestion(question) && question.practiceOnly === true;
const isNonChoiceQuestion = (question: Question) => isSelfCheckQuestion(question);

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
const sourceValue = (value: string | number | undefined) => displaySourceValue(value, '來源資料待補');
const textbookValue = (value: string | number | undefined) => displaySourceValue(value, '教材資訊待補');
const isMissingTextbookValue = (value: string | number | undefined) => {
  const display = displaySourceValue(value, '');
  return !display || /待補|metadata_missing/u.test(display);
};

const getQuestionStatus = (question: Question, answer: string | string[] | undefined) => {
  if (!isAnswered(answer)) return 'unanswered' as const;
  if (isSelfCheckQuestion(question)) return 'pending_self_review' as const;
  return isCorrect(question, answer) ? 'correct' as const : 'wrong' as const;
};

const buildGradePayload = (question: Question, answer: string | string[], sessionId: string, mode: StudyMode): AiGradeInput => ({
  questionId: question.id,
  sessionId: sessionId || 'local-session',
  examType: mode,
  question: question.displayQuestion ?? question.question,
  type: question.type,
  userAnswer: answer,
  referenceAnswer: question.referenceAnswer ?? question.answer,
  sampleAnswer: question.sampleAnswer ?? '待補',
  keyPoints: question.keyPoints ?? [],
  rubric: question.rubric ?? [],
  category: question.category,
  sourceLabel: question.sourceLabel,
  sourceFile: question.sourceFile,
  sourcePage: question.sourcePage ?? '待補',
  sourceChapter: question.sourceChapter,
  sourceVersion: question.sourceVersion,
  answerBasis: question.answerBasis,
  evidenceExcerpt: question.evidenceExcerpt,
  sourceEvidenceIds: question.sourceEvidenceIds,
  explanation: question.displayExplanation ?? question.teacherExplanation ?? question.explanation,
  riskLevel: question.riskLevel,
  practiceOnly: question.practiceOnly,
  formalScoreEligible: question.formalScoreEligible,
});

// This pure helper is exported for the verification harness as well as the component.
// eslint-disable-next-line react-refresh/only-export-components
export const getResultStats = (questions: Question[], answers: Record<string, string | string[]>) => {
  const autoGradedQuestions = questions.filter(isFormalAutoGradedQuestion);
  const practiceAutoGradedQuestions = questions.filter(isPracticeAutoGradedQuestion);
  const wasAnswered = (question: Question) => isAnswered(answers[question.id]);
  const wasCorrect = (question: Question) => isCorrect(question, answers[question.id]);
  const reviewItems = questions;
  const unansweredCount = questions.filter((question) => !wasAnswered(question)).length;
  const correctCount = autoGradedQuestions.filter(wasCorrect).length;
  const wrongCount = autoGradedQuestions.filter((question) => wasAnswered(question) && !wasCorrect(question)).length;
  const practiceCorrectCount = practiceAutoGradedQuestions.filter(wasCorrect).length;
  const practiceWrongCount = practiceAutoGradedQuestions.filter((question) => wasAnswered(question) && !wasCorrect(question)).length;
  const autoGradedCount = autoGradedQuestions.length;
  const pendingSelfCheckCount = questions.filter((question) => isSelfCheckQuestion(question) && wasAnswered(question)).length;

  return {
    correctCount,
    wrongCount,
    unansweredCount,
    autoGradedCount,
    pendingSelfCheckCount,
    practiceAutoGradedCount: practiceAutoGradedQuestions.length,
    practiceCorrectCount,
    practiceWrongCount,
    completedCount: questions.length - unansweredCount,
    reviewItems,
    accuracy: autoGradedCount === 0 ? null : Math.round((correctCount / autoGradedCount) * 100),
  };
};

export default function Result({ questions, knowledge, answers, timeSpent, mode, sessionId, onReturnHome, onRetry }: ResultProps) {
  const [showReview, setShowReview] = useState(false);
  const [aiReviews, setAiReviews] = useState<Record<string, AiReviewRecord>>(() => Object.fromEntries(getAiReviewsForSession(sessionId ?? '').map((review) => [String(review.questionId), review])));
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const stats = useMemo(() => getResultStats(questions, answers), [answers, questions]);
  const aiQuestions = questions.filter(isNonChoiceQuestion);
  const answeredAiQuestions = aiQuestions.filter((question) => isAnswered(answers[question.id]));
  const scoredAiReviews = Object.values(aiReviews).filter((review) => review.aiScoreSuggestion !== null);
  const aiScoreTotal = scoredAiReviews.reduce((total, review) => total + (review.aiScoreSuggestion ?? 0), 0);
  const aiScoreMax = scoredAiReviews.length * 3;
  const aiNeedsHumanCount = Object.values(aiReviews).filter((review) => review.aiReviewStatus === 'needs_human_review').length;

  useEffect(() => {
    let cancelled = false;
    let changed = false;
    const nextReviews = { ...aiReviews };
    questions.filter(isNonChoiceQuestion).forEach((question) => {
      const answer = answers[question.id];
      const key = String(question.id);
      if (!isAnswered(answer) || nextReviews[key]?.gradingMethod === 'local_rubric' || nextReviews[key]?.gradingMethod === 'remote_ai') return;
      const review = gradeWithLocalRubric(buildGradePayload(question, answer, sessionId ?? '', mode));
      recordAiReview(review);
      nextReviews[key] = review;
      changed = true;
    });
    const timer = changed ? window.setTimeout(() => { if (!cancelled) setAiReviews(nextReviews); }, 0) : undefined;
    return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [aiReviews, answers, mode, questions, sessionId]);

  const handleAiGrade = async (question: Question) => {
    const answer = answers[question.id];
    if (!isNonChoiceQuestion(question) || !isAnswered(answer)) return;
    const key = String(question.id);
    setAiLoading((current) => ({ ...current, [key]: true }));
    setAiMessages((current) => ({ ...current, [key]: '' }));
    const payload = buildGradePayload(question, answer, sessionId ?? '', mode);
    const review = gradeWithLocalRubric(payload);
    recordAiReview(review);
    setAiReviews((current) => ({ ...current, [key]: review }));
    setAiLoading((current) => ({ ...current, [key]: false }));
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{mode === 'reviewWrong' ? '錯題複習完成' : mode === 'writingPractice' ? '簡答／默寫練習完成' : mode === 'formal-exam' ? '正式題庫測驗結果' : '今日任務結果'}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        {mode === 'reviewWrong' && <section className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 text-sm text-slate-300"><strong>本次錯題複習 {questions.length} 題</strong><p>本次答對 {stats.correctCount} 題・本次仍需加強 {stats.wrongCount} 題・目前已熟練 {wrongSummary?.masteredCount ?? 0} 題</p></section>}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">正確率</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-6xl font-black font-mono tracking-tighter text-indigo-300">{stats.accuracy ?? '—'}</span>
              <span className="text-2xl text-slate-500 font-bold">%</span>
            </div>
            <span className="text-xs text-slate-400">自動得分 {stats.correctCount} / {stats.autoGradedCount}</span>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">總題數</span><p className="mt-2 text-2xl font-bold text-slate-200 font-mono">{questions.length}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">答對</span><p className="mt-2 text-2xl font-bold text-emerald-300 font-mono">{stats.correctCount}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">答錯</span><p className="mt-2 text-2xl font-bold text-red-300 font-mono">{stats.wrongCount}</p></div>
            <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">未作答</span><p className="mt-2 text-2xl font-bold text-amber-300 font-mono">{stats.unansweredCount}</p></div>
            <div className="col-span-2 sm:col-span-4 bg-[#0b0d14] border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">實際花費時間</span><p className="text-xl font-bold text-slate-200 font-mono">{formatTime(timeSpent)}</p></div>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="判分統計">
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">自動判分題數</p><strong className="text-xl font-mono">{stats.autoGradedCount}</strong></div>
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">自動判分正確率</p><strong className="text-xl font-mono">{stats.accuracy === null ? '—' : `${stats.accuracy}%`}</strong></div>
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">非選擇題已作答</p><strong className="text-xl font-mono">{answeredAiQuestions.length}</strong></div>
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">總完成題數</p><strong className="text-xl font-mono">{stats.completedCount}</strong></div>
        </section>

        {aiQuestions.length > 0 && <p className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 px-4 py-3 text-sm text-indigo-100">非選擇題交卷後會自動進行規準輔助評分；此分數僅供學習參考，不列入正式 verified 成績，無法完整理解所有同義表達。</p>}
        {(stats.practiceAutoGradedCount > 0 || questions.some((question) => question.practiceOnly)) && <p className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 px-4 py-3 text-sm text-indigo-100">本次包含考前練習題；練習題可作答檢核，但不列入正式 verified 成績。</p>}
        {mode === 'daily' && stats.unansweredCount > 0 && <p className="rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">本次有 {stats.unansweredCount} 題未作答，已列入未完成保留題；下一次每日任務會優先安排。</p>}
        {mode === 'weeklyReview' && stats.unansweredCount > 0 && <p className="rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">本次未作答題已加入後續複習候選。</p>}

        {aiQuestions.length > 0 && <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="規準輔助評分摘要">
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">規準評分題</p><strong className="text-xl font-mono">{answeredAiQuestions.length}</strong><p className="mt-1 text-xs text-slate-500">已作答非選擇題</p></div>
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">規準建議分數</p><strong className="text-xl font-mono">{aiScoreMax > 0 ? `${aiScoreTotal} / ${aiScoreMax}` : '—'}</strong><p className="mt-1 text-xs text-slate-500">不列入正式 verified 正確率</p></div>
          <div className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-500">需人工確認</p><strong className="text-xl font-mono">{aiNeedsHumanCount}</strong><p className="mt-1 text-xs text-slate-500">規準不足或風險較高</p></div>
        </section>}

        <section className="bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-slate-400" /><h2 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-300">題目與解析</h2></div>
            <button onClick={() => setShowReview((visible) => !visible)} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">{showReview ? '收起解析' : '查看本次題目與解析'}</button>
          </div>

          {showReview && (stats.reviewItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-400">本次沒有可顯示的題目解析。</div>
          ) : (
            <div className="space-y-5">
              {stats.reviewItems.map((question, index) => {
                const knowledgeItem = question.knowledgeId ? knowledge.find((item) => item.id === question.knowledgeId) : undefined;
                const status = getQuestionStatus(question, answers[question.id]);
                const selfCheck = isSelfCheckQuestion(question);
                const unanswered = status === 'unanswered';
                const expectedAnswer = selfCheck ? question.referenceAnswer ?? question.answer : question.answer;
                const explanation = question.displayExplanation ?? question.teacherExplanation ?? question.explanation ?? question.answerGuide ?? '來源資料待補';
                const aiReview = aiReviews[String(question.id)];
                const statusLabel = unanswered ? '未作答' : selfCheck ? aiReview ? aiReview.gradingMethod === 'legacy' ? '尚未執行規準輔助評分' : `規準輔助評分：${aiReview.aiScoreSuggestion === null ? '需人工確認' : `${aiReview.aiScoreSuggestion} / 3 分`}（${aiReview.aiReviewLabel}）` : '待規準輔助評分' : status === 'correct' ? '答對' : '答錯';
                const statusClass = unanswered ? 'text-amber-300' : selfCheck ? aiReview?.aiReviewStatus === 'needs_human_review' ? 'text-amber-300' : 'text-indigo-300' : status === 'correct' ? 'text-emerald-300' : 'text-red-300';
                const aiMessage = aiMessages[String(question.id)];
                const loading = aiLoading[String(question.id)] === true;
                const textbookName = textbookValue(question.displaySourceLabel ?? question.sourceLabel);
                const textbookChapter = textbookValue(question.displaySourceChapter ?? question.sourceChapter);
                const textbookPage = textbookValue(question.displaySourcePage ?? question.sourcePage);
                const textbookVersion = textbookValue(question.displaySourceVersion ?? question.sourceVersion);
                const missingTextbookInfo = [
                  question.displaySourceLabel ?? question.sourceLabel,
                  question.displaySourceChapter ?? question.sourceChapter,
                  question.displaySourcePage ?? question.sourcePage,
                  question.displaySourceVersion ?? question.sourceVersion,
                ].some(isMissingTextbookValue);
                return (
                  <article key={question.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-slate-800 px-2 py-1 font-mono text-slate-300">第 {index + 1} 題</span>
                      <span className="text-slate-400">{question.chapter}</span>
                      <span className={statusClass}>{statusLabel}</span>
                      {question.practiceOnly && <span className="rounded bg-indigo-950/70 px-2 py-1 text-indigo-200">考前練習題，非正式題</span>}
                      {question.riskLevel === 'safety_review' && <span className="rounded bg-amber-950/70 px-2 py-1 text-amber-200">安全／禁忌題，請以教材與人工核對為準</span>}
                    </div>
                    <h3 className="text-base font-medium text-white leading-relaxed">{question.displayQuestion ?? question.question}</h3>
                    {question.imageRequired && question.imageSource ? <figure className="rounded-xl border border-slate-700 bg-white/95 p-3"><img src={question.imageSource} alt={question.imageAlt || '題目圖片'} className="mx-auto max-h-[420px] max-w-full object-contain" /><figcaption className="mt-2 text-center text-xs text-slate-600">{question.imageAlt || '題目圖片'}</figcaption></figure> : question.imageRequired && question.imageMissing ? <p className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-sm text-amber-100">原題需要圖片，但目前沒有可驗證的原始圖片來源；本次顯示的是文字化題幹，圖片資料待補。</p> : null}
                    <div className="grid gap-3 text-sm leading-relaxed">
                      <p><span className="text-slate-500">你的答案：</span><span className={status === 'unanswered' ? 'text-amber-200' : status === 'wrong' ? 'text-red-200' : 'text-slate-200'}>{formatAnswer(answers[question.id])}</span></p>
                      <p><span className="text-slate-500">【答案重點】</span><span className="text-emerald-200 whitespace-pre-line">{formatAnswer(selfCheck ? question.displayReferenceAnswer ?? expectedAnswer : question.displayAnswer ?? expectedAnswer)}</span></p>
                      {selfCheck && unanswered && <p className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-amber-100">此題已列入未完成保留題，下一次任務會優先安排。</p>}
                      {selfCheck && <>
                        <div className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-2">高分回答應包含</span>{question.highScoreGuidance?.length ? <ul className="list-decimal pl-5 space-y-1">{question.highScoreGuidance.map((item) => <li key={item}>{item}</li>)}</ul> : <p>先回應題目要求，再補充主要概念、條件與安全界線。</p>}<p className="mt-2 text-xs text-slate-500">這是答題方向提示，不代表系統完全理解語意，也不取代教材核對。</p></div>
                        <p className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-1">高分示範答案</span><span className="whitespace-pre-line">{question.sampleAnswer ?? '來源資料待補'}</span></p>
                        <div className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-2">評分重點</span><ul className="list-disc pl-5 space-y-1">{(question.keyPoints?.length ? question.keyPoints : ['待補']).map((point) => <li key={point}>{point}</li>)}</ul></div>
                        <div className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-2">常見漏答提醒</span><ul className="list-disc pl-5 space-y-1">{(question.commonOmissions?.length ? question.commonOmissions : ['待補']).map((item) => <li key={item}>{item}</li>)}</ul></div>
                      </>}
                      <p className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-1">【解析】</span>{explanation}</p>
                      <div className="rounded-lg bg-slate-900/70 p-4 text-slate-300"><span className="block text-xs font-bold text-indigo-300 mb-1">【來源】</span><p>教材名稱：{textbookName}</p><p>章節：{textbookChapter}</p><p>教材位置：{textbookChapter}</p><p>頁碼：{textbookPage}</p><p>版本：{textbookVersion}</p>{missingTextbookInfo && <p>缺少：教材資訊待補。</p>}<p>答案依據：{sourceValue(question.displayAnswerBasis ?? question.answerBasis)}</p><p className="mt-2 whitespace-pre-line">教材摘錄：{sourceValue(question.displayEvidenceExcerpt ?? question.evidenceExcerpt)}</p></div>
                      {selfCheck && <section className="rounded-xl border border-indigo-800/70 bg-indigo-950/20 p-4 space-y-3" aria-label="規準輔助評分">
                        <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-bold text-indigo-100">規準輔助評分</h4>{unanswered ? <span className="text-xs text-amber-200">未作答，請先參考答案與解析</span> : <button onClick={() => void handleAiGrade(question)} disabled={loading} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">{loading ? '規準評分中' : aiReview ? '重新進行規準輔助評分' : '重新進行規準輔助評分'}</button>}</div>
                        {aiMessage && <p className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-sm text-amber-100">{aiMessage}</p>}
                        {aiReview && <div className="space-y-3 text-sm text-slate-200">
                          <p><span className="text-slate-400">掌握程度：</span>{aiReview.aiReviewLabel}</p>
                          <p><span className="text-slate-400">建議分數：</span><strong className="text-indigo-200">{aiReview.aiScoreDisplay}</strong></p>
                          <p><span className="text-slate-400">命中的評分重點：</span>{aiReview.matchedKeyPoints.length ? aiReview.matchedKeyPoints.join('、') : '無'}</p>
                          <p><span className="text-slate-400">漏掉的評分重點：</span>{aiReview.missingKeyPoints.length ? aiReview.missingKeyPoints.join('、') : '無'}</p>
                          <p><span className="text-slate-400">風險提醒：</span>{aiReview.riskFlags.length ? aiReview.riskFlags.join('、') : '無'}</p>
                          <p className="rounded-lg bg-slate-900/70 p-3"><span className="block text-xs font-bold text-indigo-200 mb-1">補強建議</span>{aiReview.feedback}</p>
                          <p><span className="text-slate-400">參考依據：</span>{aiReview.sourceBasis.join('、')}</p>
                          <p><span className="text-slate-400">評分方式：</span>{aiReview.gradingMethodLabel ?? '規準輔助評分'}</p>
                          <p><span className="text-slate-400">信心程度：</span>{aiReview.confidence === 'high' ? '高' : aiReview.confidence === 'medium' ? '中' : '低'}</p>
                          <p className="rounded-lg border border-indigo-900/70 bg-indigo-950/30 p-3 text-xs text-indigo-100">此分數由參考答案與評分重點進行規則比對，僅供學習參考，無法完整理解所有同義表達。</p>
                        </div>}
                      </section>}
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
