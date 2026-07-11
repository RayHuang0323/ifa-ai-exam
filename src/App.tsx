import { useRef, useState } from 'react';
import Home from './views/Home';
import Exam from './components/Exam';
import Result from './components/Result';
import WrongBook from './views/WrongBook';

// 引入正式資料路徑
import week1Questions from './data/questions/week1.json';
import week1Knowledge from './data/knowledge/week1-knowledge.json';
import examConfig from './data/config/exam-config.json';
import { getLocalDateString, recordStudySession } from './utils/studyProgress';
import { clearExamDraft, loadExamDraft, type ExamDraft } from './utils/examDraft';
import { getReviewableWrongAnswers, recordWrongAnswerReview, recordWrongAnswers } from './utils/wrongAnswerStore';
import { getQuestionById, getQuestionsByWeek, getWritingPracticeQuestions } from './utils/questionEngine';
import { calculateTimeLimitInMinutes } from './utils/examTime';
import type { StudyMode } from './types/study';

type Page = 'home' | 'instructions' | 'exam' | 'result' | 'wrongBook';
type ExamEntry = 'new-exam' | 'today-task' | 'wrong-review' | 'writing-practice';

const isAnswerProvided = (answer: unknown) =>
  Array.isArray(answer) ? answer.length > 0 : typeof answer === 'string' ? answer.trim().length > 0 : Boolean(answer);

const normalizeText = (answer: string) => answer.trim().replace(/\s+/g, ' ');
const isSelfCheckQuestion = (question: { type: string }) => ['short-answer', 'writing', 'memorization', 'essay'].includes(question.type);

const isCorrectAnswer = (question: typeof week1Questions[number], answer: unknown) => {
  if (!isAnswerProvided(answer)) return false;

  if (Array.isArray(question.answer)) {
    return Array.isArray(answer)
      && question.answer.length === answer.length
      && question.answer.every((option) => answer.includes(option));
  }

  return typeof answer === 'string' && normalizeText(answer) === normalizeText(question.answer);
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [selfCheckResults, setSelfCheckResults] = useState<Record<string, boolean>>({});
  const [timeLimit, setTimeLimit] = useState<number>(examConfig.timeLimit);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [examDraft, setExamDraft] = useState<ExamDraft | null>(() => loadExamDraft());
  const [showDraftChoice, setShowDraftChoice] = useState(false);
  const [examEntry, setExamEntry] = useState<ExamEntry>('new-exam');
  const [todaySuggestedQuestions, setTodaySuggestedQuestions] = useState(0);
  const [sessionMode, setSessionMode] = useState<StudyMode>('formal-exam');
  const [persistDraft, setPersistDraft] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const hasFinishedRef = useRef(false);

  const prepareNewExam = (entry: ExamEntry, suggestedQuestions = 0) => {
    clearExamDraft();
    setExamDraft(null);
    setQuestions(week1Questions);
    setTimeLimit(calculateTimeLimitInMinutes('formal-exam', week1Questions));
    setExamEntry(entry);
    setTodaySuggestedQuestions(suggestedQuestions);
    setSessionMode('formal-exam');
    setPersistDraft(true);
    setCurrentPage('instructions');
  };

  const handleStartNewExam = () => {
    const draft = loadExamDraft();
    setExamDraft(draft);
    if (draft) {
      setShowDraftChoice(true);
      return;
    }
    prepareNewExam('new-exam');
  };

  const handleStartTodayTask = (suggestedQuestions: number, mode: StudyMode) => {
    setExamDraft(loadExamDraft());
    const availableQuestions = getQuestionsByWeek('week-1');
    const targetQuestionCount = Math.min(suggestedQuestions, availableQuestions.length);
    const reviewQuestionTarget = Math.round(targetQuestionCount * 0.3);
    const reviewQuestions = getReviewableWrongAnswers()
      .map((record) => getQuestionById(record.questionId))
      .filter((question): question is typeof week1Questions[number] => question !== null)
      .filter((question, index, all) => all.findIndex((item) => item.id === question.id) === index)
      .slice(0, reviewQuestionTarget);
    const reviewQuestionIds = new Set(reviewQuestions.map((question) => question.id));
    const regularQuestions = availableQuestions.filter((question) => !reviewQuestionIds.has(question.id));
    const taskQuestions = [...reviewQuestions, ...regularQuestions].slice(0, targetQuestionCount);
    setQuestions(taskQuestions);
    setTimeLimit(calculateTimeLimitInMinutes(mode, taskQuestions));
    setExamEntry('today-task');
    setTodaySuggestedQuestions(taskQuestions.length);
    setSessionMode(mode);
    setPersistDraft(false);
    setCurrentPage('instructions');
  };

  const handleStartWrongReview = (questionIds?: number[]) => {
    const reviewRecords = getReviewableWrongAnswers().filter((record) => !questionIds || questionIds.includes(record.questionId)).slice(0, 10);
    const reviewQuestions = reviewRecords.map((record) => getQuestionById(record.questionId)).filter((question): question is typeof week1Questions[number] => question !== null);
    if (reviewQuestions.length === 0) return;
    setQuestions(reviewQuestions); setTimeLimit(calculateTimeLimitInMinutes('reviewWrong', reviewQuestions)); setExamEntry('wrong-review'); setTodaySuggestedQuestions(reviewQuestions.length); setSessionMode('reviewWrong'); setPersistDraft(false); setCurrentPage('instructions');
  };

  const handleStartWritingPractice = () => {
    const writingQuestions = getWritingPracticeQuestions();
    if (writingQuestions.length === 0) return;
    setExamDraft(loadExamDraft());
    setQuestions(writingQuestions);
    setTimeLimit(calculateTimeLimitInMinutes('recovery', writingQuestions));
    setExamEntry('writing-practice');
    setTodaySuggestedQuestions(writingQuestions.length);
    setSessionMode('writingPractice');
    setPersistDraft(false);
    setCurrentPage('instructions');
  };

  const handleResumeExam = () => {
    const draft = loadExamDraft();
    if (!draft) {
      setExamDraft(null);
      return;
    }
    setExamDraft(draft);
    setQuestions(week1Questions);
    setTimeLimit(calculateTimeLimitInMinutes('formal-exam', week1Questions));
    setCurrentPage('exam');
  };

  const handleConfirmStart = () => {
    hasFinishedRef.current = false;
    setUserAnswers({});
    setSelfCheckResults({});
    setTimeSpent(0);
    setStartedAt(new Date().toISOString());
    setCurrentPage('exam');
  };

  const handleFinishExam = (answers: Record<string, any>, timeLeft: number, selfChecks: Record<string, boolean> = {}) => {
    if (hasFinishedRef.current) return;

    hasFinishedRef.current = true;
    setExamDraft(null);
    setUserAnswers(answers);
    setSelfCheckResults(selfChecks);
    const durationSeconds = timeLimit * 60 - Math.max(0, timeLeft);
    const completedAt = new Date().toISOString();
    setTimeSpent(durationSeconds);

    const wasCorrect = (question: typeof week1Questions[number]) => isSelfCheckQuestion(question) ? selfChecks[question.id] === true : isCorrectAnswer(question, answers[question.id]);
    const wasWrong = (question: typeof week1Questions[number]) => isSelfCheckQuestion(question) ? selfChecks[question.id] === false : isAnswerProvided(answers[question.id]) && !isCorrectAnswer(question, answers[question.id]);
    const wasAnswered = (question: typeof week1Questions[number]) => isSelfCheckQuestion(question) ? selfChecks[question.id] !== undefined : isAnswerProvided(answers[question.id]);
    const answeredCount = questions.filter(wasAnswered).length;
    const correctCount = questions.filter(wasCorrect).length;
    const unansweredCount = questions.length - answeredCount;
    const correctQuestionIds = questions.filter(wasCorrect).map((question) => question.id);
    const wrongQuestions = questions.filter(wasWrong);
    const wrongQuestionIds = wrongQuestions.map((question) => question.id);
    const skippedQuestionIds = questions.filter((question) => !wasAnswered(question)).map((question) => question.id);
    const wrongAnswerRecords = wrongQuestions
      .map((question) => ({ questionId: question.id, weekId: 'week-1' as const, lastSelectedAnswer: answers[question.id] ?? null, correctAnswer: question.answer, questionType: question.type, source: 'week-1' as const }));

    try {
      localStorage.setItem('ifa_exam_state', JSON.stringify({
        week: examConfig.week,
        completedAt,
        score: correctCount,
        accuracy: questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100),
        correctCount,
        wrongCount: answeredCount - correctCount,
        unansweredCount,
        timeSpent: durationSeconds,
      }));
    } catch (error) {
      console.error('Failed to save the latest exam result:', error);
    }

    recordStudySession({
      id: `week-1-${completedAt}`,
      date: getLocalDateString(new Date()),
      weekId: 'week-1',
      mode: sessionMode,
      answeredCount,
      correctCount,
      wrongCount: answeredCount - correctCount,
      durationSeconds,
      completedAt,
      startedAt: startedAt ?? completedAt,
      questionIds: questions.map((question) => question.id),
      correctQuestionIds,
      wrongQuestionIds,
      skippedQuestionIds,
    });
    if (sessionMode === 'reviewWrong') questions.forEach((question) => recordWrongAnswerReview(question.id, correctQuestionIds.includes(question.id)));
    else recordWrongAnswers(wrongAnswerRecords);

    setCurrentPage('result');
  };

  const handleReturnHome = () => {
    setCurrentPage('home');
    setUserAnswers({});
    setSelfCheckResults({});
    setQuestions([]);
    setTimeSpent(0);
  };

  const handleAbortExam = () => {
    hasFinishedRef.current = false;
    setUserAnswers({});
    setSelfCheckResults({});
    setQuestions([]);
    setTimeSpent(0);
    setExamDraft(loadExamDraft());
    setCurrentPage('home');
  };

  const handleRetry = () => {
    clearExamDraft();
    setQuestions(week1Questions);
    setTimeLimit(calculateTimeLimitInMinutes('formal-exam', week1Questions));
    setUserAnswers({});
    setSelfCheckResults({});
    setTimeSpent(0);
    hasFinishedRef.current = false;
    setExamEntry('new-exam');
    setSessionMode('formal-exam');
    setPersistDraft(true);
    setCurrentPage('instructions');
  };

  return (
    <div className="font-sans min-h-screen bg-[#090a0f] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white flex flex-col">
      {currentPage === 'home' && (
        <Home
          hasExamDraft={Boolean(examDraft)}
          onResumeExam={handleResumeExam}
          onStartTodayTask={handleStartTodayTask}
          onStartNewExam={handleStartNewExam}
          onStartWrongReview={() => handleStartWrongReview()}
          onOpenWrongBook={() => setCurrentPage('wrongBook')}
          onStartWritingPractice={handleStartWritingPractice}
        />
      )}
      {currentPage === 'wrongBook' && <WrongBook onReturnHome={handleReturnHome} onStartReview={handleStartWrongReview} />}
      {currentPage === 'instructions' && (
        <main className="exam-instructions w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow flex items-center">
          <section className="exam-instructions-card w-full bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-400">測驗說明</span>
              <h1 className="text-2xl font-bold text-white">{examEntry === 'wrong-review' ? '錯題複習' : examEntry === 'writing-practice' ? '簡答／默寫練習' : `Week ${examConfig.week}：${examConfig.title}`}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{examEntry === 'wrong-review' ? `本次複習 ${questions.length} 題。答對不會立即刪除錯題，連續答對後會標示為已熟練。` : examEntry === 'writing-practice' ? `本次練習 ${questions.length} 題。輸入答案後請依參考答案與檢核點自行選擇答對或需要複習。` : examEntry === 'today-task' && todaySuggestedQuestions > 0 ? `本次為 Week1 今日練習，共 ${todaySuggestedQuestions} 題；完成後其餘題目會在後續每日任務、每週複習與正式模擬考中安排。` : '確認開始後才會啟動倒數。請在作答期間隨時確認題目狀態與標記。'}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <dt className="text-xs text-slate-500">題目數</dt>
                <dd className="mt-1 text-lg font-bold text-slate-100">{questions.length} 題</dd>
              </div>
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <dt className="text-xs text-slate-500">考試時間</dt>
                <dd className="mt-1 text-lg font-bold text-slate-100">{timeLimit} 分鐘</dd>
              </div>
            </dl>
            <ul className="space-y-3 text-sm text-slate-300 leading-relaxed list-disc pl-5">
              <li>交卷後可查看本次結果、錯題與題目解析。</li>
              <li>時間結束時系統會自動交卷。</li>
              <li>未作答題目會列為未作答，並不計入答對題數。</li>
            </ul>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button onClick={handleReturnHome} className="h-11 px-5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm">返回首頁</button>
              <button onClick={handleConfirmStart} className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">{examEntry === 'wrong-review' ? '確認開始複習' : examEntry === 'writing-practice' ? '確認開始練習' : '確認開始測驗'}</button>
            </div>
          </section>
        </main>
      )}
      {currentPage === 'exam' && (
        <Exam 
          questions={questions} 
          timeLimitInMinutes={timeLimit} 
          onFinish={handleFinishExam}
          onAbort={handleAbortExam}
          initialDraft={persistDraft ? examDraft : null}
          persistDraft={persistDraft} />
      )}
      {showDraftChoice && (
        <div className="app-draft-modal" role="dialog" aria-modal="true" aria-labelledby="draft-choice-title">
          <section className="app-draft-modal-card">
            <h2 id="draft-choice-title">偵測到未完成測驗</h2>
            <p>開始新測驗會放棄目前的題號、答案、標記與剩餘時間。</p>
            <div className="app-draft-modal-actions">
              <button onClick={() => { setShowDraftChoice(false); handleResumeExam(); }}>繼續未完成測驗</button>
              <button onClick={() => { setShowDraftChoice(false); prepareNewExam(examEntry, todaySuggestedQuestions); }}>放棄舊進度並重新開始</button>
              <button onClick={() => setShowDraftChoice(false)}>取消</button>
            </div>
          </section>
        </div>
      )}
      {currentPage === 'result' && (
        <Result 
          questions={questions} 
          knowledge={week1Knowledge} 
          answers={userAnswers} 
          timeSpent={timeSpent}
          mode={sessionMode}
          selfCheckResults={selfCheckResults}
          onReturnHome={handleReturnHome}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

export default App;
