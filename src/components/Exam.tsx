import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Send, Star, Timer } from 'lucide-react';
import { clearExamDraft, saveExamDraft, type ExamDraft } from '../utils/examDraft';

interface Question {
  id: number;
  knowledgeId: string;
  type: string;
  chapter: string;
  difficulty: number;
  question: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
  reference: string;
}

interface ExamProps {
  questions: Question[];
  timeLimitInMinutes: number;
  onFinish: (answers: Record<string, string | string[]>, timeLeft: number) => void;
  onAbort: () => void;
  initialDraft: ExamDraft | null;
}

const isAnswered = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());

export default function Exam({ questions, timeLimitInMinutes, onFinish, onAbort, initialDraft }: ExamProps) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.min(initialDraft?.currentIndex ?? 0, Math.max(0, questions.length - 1)));
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => initialDraft?.answers ?? {});
  const [markedQuestionIds, setMarkedQuestionIds] = useState<Set<number>>(() => new Set(initialDraft?.markedQuestionIds ?? []));
  const [timeLeft, setTimeLeft] = useState(initialDraft?.timeLeft ?? timeLimitInMinutes * 60);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const answersRef = useRef(answers);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!hasSubmittedRef.current && timeLeft > 0) {
      saveExamDraft({
        weekId: 'week-1',
        currentIndex,
        answers,
        markedQuestionIds: [...markedQuestionIds],
        timeLeft,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [answers, currentIndex, markedQuestionIds, timeLeft]);

  const submitExam = (secondsLeft: number) => {
    if (hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;
    clearExamDraft();
    onFinish(answersRef.current, Math.max(0, secondsLeft));
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      submitExam(0);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const interceptBackNavigation = () => {
      window.history.pushState({ examInProgress: true }, '', window.location.href);
      setShowLeaveConfirmation(true);
    };

    window.history.pushState({ examInProgress: true }, '', window.location.href);
    window.addEventListener('popstate', interceptBackNavigation);

    return () => window.removeEventListener('popstate', interceptBackNavigation);
  }, []);

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => isAnswered(answers[question.id])).length,
    [answers, questions],
  );
  const unansweredCount = questions.length - answeredCount;
  const progressPercent = questions.length === 0 ? 0 : ((currentIndex + 1) / questions.length) * 100;
  const isCurrentMarked = markedQuestionIds.has(currentQuestion.id);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse';
    if (seconds <= 300) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (seconds <= 600) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-slate-300 bg-slate-900/80 border-slate-800';
  };

  const handleSelectOption = (option: string) => {
    if (currentQuestion.type === 'multiple') {
      const storedAnswer = answers[currentQuestion.id];
      const currentAnswer: string[] = Array.isArray(storedAnswer) ? storedAnswer : [];
      const nextAnswer = currentAnswer.includes(option)
        ? currentAnswer.filter((value) => value !== option)
        : [...currentAnswer, option];
      setAnswers({ ...answers, [currentQuestion.id]: nextAnswer });
      return;
    }

    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const toggleMarkedQuestion = () => {
    setMarkedQuestionIds((previous) => {
      const next = new Set(previous);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const leaveExam = () => {
    hasSubmittedRef.current = true;
    clearExamDraft();
    setAnswers({});
    setMarkedQuestionIds(new Set());
    setTimeLeft(0);
    onAbort();
  };

  if (!currentQuestion) return null;

  return (
    <div className="exam-shell min-h-screen bg-[#050508] text-slate-200 font-sans flex flex-col items-center">
      <header className="exam-header w-full sticky top-0 z-30 bg-[#050508]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="exam-header-content max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-slate-300">{currentIndex + 1}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">第 {currentIndex + 1} 題 / 共 {questions.length} 題</span>
              <span className="text-xs font-medium text-slate-300 truncate">已作答 {answeredCount} 題</span>
            </div>
          </div>
          <div className="exam-header-actions">
            <button onClick={() => setShowLeaveConfirmation(true)} className="exam-leave-button" type="button">離開測驗</button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${getTimerColor(timeLeft)}`}>
              <Timer className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900">
          <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <main className="exam-content w-full max-w-4xl flex-grow px-4 sm:px-6 py-6 md:py-10 space-y-6">
        <section className="exam-navigation-card rounded-2xl border border-slate-800 bg-[#0b0d14] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">已作答 {answeredCount} 題・未作答 {unansweredCount} 題・已標記 {markedQuestionIds.size} 題</p>
            <button onClick={() => setShowSubmitConfirmation(true)} className="shrink-0 text-xs font-bold text-indigo-300 hover:text-white">交卷</button>
          </div>
          <div className="exam-question-nav flex flex-wrap gap-2">
            {questions.map((question, index) => {
              const active = index === currentIndex;
              const marked = markedQuestionIds.has(question.id);
              const answered = isAnswered(answers[question.id]);
              const statusClass = active
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : marked
                  ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                  : answered
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500';
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-9 h-9 rounded-lg border text-xs font-bold transition-colors ${statusClass}`}
                  data-status={active ? 'current' : marked ? 'marked' : answered ? 'answered' : 'unanswered'}
                  aria-label={`前往第 ${index + 1} 題`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500">藍色：目前題目　綠色：已作答　深色：未作答　橘色：已標記</p>
        </section>

        <section className="exam-question-card rounded-2xl border border-slate-800 bg-[#0b0d14] p-6 sm:p-8 min-h-[430px] flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-6">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
              {currentQuestion.type.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMarkedQuestion}
                className={`flex items-center gap-1.5 text-xs font-medium ${isCurrentMarked ? 'text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Bookmark className={`w-4 h-4 ${isCurrentMarked ? 'fill-current' : ''}`} />
                {isCurrentMarked ? '已標記' : '標記此題'}
              </button>
              <div className="flex items-center gap-0.5 text-amber-500/80">
                {Array.from({ length: currentQuestion.difficulty }).map((_, index) => <Star key={index} className="w-3.5 h-3.5 fill-current" />)}
              </div>
            </div>
          </div>

          <h1 className="exam-question-title text-lg sm:text-xl font-medium text-slate-100 mb-8 leading-relaxed">{currentQuestion.question}</h1>

          <div className="flex-grow space-y-3">
            {currentQuestion.options && currentQuestion.options.length > 0 ? currentQuestion.options.map((option) => {
              const answer = answers[currentQuestion.id];
              const selected = currentQuestion.type === 'multiple' ? Array.isArray(answer) && answer.includes(option) : answer === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0b0d14] ${selected ? 'bg-indigo-600/10 border-indigo-500 text-white font-medium' : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700 text-slate-300'}`}
                  role={currentQuestion.type === 'multiple' ? 'checkbox' : 'radio'}
                  aria-checked={selected}
                >
                  {option}
                </button>
              );
            }) : (
              <textarea
                className="exam-answer-textarea"
                placeholder="請輸入您的論述或個案分析策略..."
                value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                onChange={(event) => setAnswers({ ...answers, [currentQuestion.id]: event.target.value })}
                aria-label="文字答案"
              />
            )}
          </div>
        </section>

        <div className="exam-pagination flex items-center justify-between gap-3">
          <button onClick={() => setCurrentIndex((index) => index - 1)} disabled={currentIndex === 0} data-variant="secondary" className="exam-action-button h-12 px-4 sm:px-6 flex items-center justify-center gap-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-xs uppercase font-bold">
            <ChevronLeft className="w-4 h-4" /><span>上一題</span>
          </button>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => setCurrentIndex((index) => index + 1)} data-variant="primary" className="exam-action-button h-12 px-5 sm:px-6 flex items-center justify-center gap-2 rounded-xl bg-slate-200 hover:bg-white text-slate-900 font-bold transition-all font-mono text-xs uppercase">
              <span>下一題</span><ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setShowSubmitConfirmation(true)} data-variant="submit" className="exam-action-button h-12 px-5 sm:px-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all font-mono text-xs uppercase">
              <span>交卷</span><Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>

      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b0d14] p-6 shadow-2xl space-y-5">
            <div>
              <h2 id="submit-title" className="text-lg font-bold text-white">確認交卷</h2>
              <p className="mt-2 text-sm text-slate-400">交卷後可查看本次成績、錯題與解析。</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-slate-900 p-3"><span className="block text-lg font-bold text-emerald-300">{answeredCount}</span><span className="text-xs text-slate-500">已作答</span></div>
              <div className="rounded-xl bg-slate-900 p-3"><span className="block text-lg font-bold text-slate-200">{unansweredCount}</span><span className="text-xs text-slate-500">未作答</span></div>
              <div className="rounded-xl bg-slate-900 p-3"><span className="block text-lg font-bold text-amber-300">{markedQuestionIds.size}</span><span className="text-xs text-slate-500">已標記</span></div>
            </div>
            {unansweredCount > 0 && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">仍有 {unansweredCount} 題未作答，交卷後將列為未作答。</p>}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={() => setShowSubmitConfirmation(false)} className="h-11 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium">返回檢查</button>
              <button onClick={() => submitExam(timeLeft)} className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">確認交卷</button>
            </div>
          </section>
        </div>
      )}

      {showLeaveConfirmation && (
        <div className="exam-modal fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <section className="exam-modal-card w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b0d14] p-6 shadow-2xl space-y-5">
            <div>
              <h2 id="leave-title" className="text-lg font-bold text-white">離開測驗</h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">離開後，本次未完成的測驗不會計入正式成績。</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={() => setShowLeaveConfirmation(false)} className="exam-modal-button h-11 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium">繼續作答</button>
              <button onClick={leaveExam} className="exam-modal-button h-11 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold">結束本次測驗並返回首頁</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
