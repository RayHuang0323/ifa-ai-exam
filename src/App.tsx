import { useEffect, useRef, useState } from 'react';
import Home from './views/Home';
import Exam from './components/Exam';
import Result from './components/Result';
import WrongBook from './views/WrongBook';
import PracticeCenter from './views/PracticeCenter';
import CoachDashboard from './views/CoachDashboard';

import week1Knowledge from './data/knowledge/week1-knowledge.json';
import examConfig from './data/config/exam-config.json';
import type { WritingPracticeSample } from './data/questions/writingPracticeSamples';
import { getLocalDateString, loadStudyProgress, recordStudySession } from './utils/studyProgress';
import { clearExamDraft, loadExamDraft, type ExamDraft } from './utils/examDraft';
import { getReviewableWrongAnswers, recordWrongAnswerReview, recordWrongAnswers } from './utils/wrongAnswerStore';
import { getReviewableUnansweredQuestionIds, recordUnansweredQuestions, resolveUnansweredQuestions } from './utils/unansweredQuestionStore';
import { getDailyQuestionPool, getFormalQuestionPool, getPracticeQuestionPool, getQuestionById, getWritingPracticeQuestions, type RuntimeQuestion } from './utils/questionEngine';
import { prepareQuestionSequence } from './utils/questionQualityAudit';
import { calculateTimeLimitInMinutes } from './utils/examTime';
import type { StudyMode } from './types/study';
import { retryPendingSync, syncExamCompleted, syncExamProgress, syncExamStarted, type AnswerStatus } from './services/progressSync';
import { fetchAnsweredQuestionHistory, getCompletedQuestionIds, recordAnsweredQuestionHistory, retryAnsweredQuestionHistorySync, type AnsweredHistoryTaskType } from './services/answeredQuestionHistory';
import { applyProfileQuery, type LearnerProfile } from './utils/learnerProfile';
import { applyDailyTaskV2QuestionSelection, completeDailyTaskV2Questions, dailyMaximum, dailyTarget, dailyTaskV2DraftStorageKey, getDailyTaskV2Plan } from './utils/dailyTaskV2';
import { resetDailyTask, resetLocalProgress } from './utils/localLearningReset';
import { protectQuestionIds } from './utils/answeredQuestionLock';
import { recordQuestionMastery, recordQuestionsAnswered, recordQuestionsCompleted, recordQuestionsShown, seedSchedulerFromHistoricalSessions, selectDailyQuestionIds, selectMockQuestionIds, selectWeeklyQuestionIds, type SchedulerCandidate, type SchedulerMode } from './utils/questionScheduler';

type Page = 'home' | 'instructions' | 'exam' | 'result' | 'wrongBook' | 'practiceCenter' | 'coachDashboard';
type ExamEntry = 'new-exam' | 'today-task' | 'weekly-review' | 'wrong-review' | 'writing-practice';
type AppQuestion = RuntimeQuestion | WritingPracticeSample;
type GradingQuestion = { id: number; type: string; answer: string | string[]; weekId?: string; formalScoreEligible?: boolean; practiceOnly?: boolean };
const getQuestionWeekId = (question: AppQuestion) => 'weekId' in question ? question.weekId : undefined;
const isPracticeOnlyQuestion = (question: AppQuestion) => 'practiceOnly' in question && question.practiceOnly === true;
const isFullMockEligibleQuestion = (question: RuntimeQuestion) => question.practiceOnly !== true && question.formalScoreEligible !== false && question.answerConfidence !== 'C' && question.questionConfidence !== 'C';

const toSchedulerCandidate = (question: RuntimeQuestion, formal = false): SchedulerCandidate => ({
  id: question.id,
  formal: formal && isFullMockEligibleQuestion(question),
  priority: question.priority,
  sourceConfidence: question.sourceConfidence,
  isImportant: formal && (question.reviewStatus === 'verified' || question.sourceConfidence === 'high' || (question.priority ?? 0) >= 8 || ['解剖生理', '精油基礎', '精油化學', '安全禁忌'].includes(question.category)),
  isActive: question.isActive,
  excludeFromPractice: question.excludeFromPractice,
  deprecated: question.deprecated,
  practiceOnly: question.practiceOnly,
  questionConfidence: question.questionConfidence,
  answerConfidence: question.answerConfidence,
  qualityStatus: question.qualityStatus,
});

const getSchedulerMode = (mode: StudyMode): SchedulerMode => mode === 'daily' ? 'daily' : mode === 'weeklyReview' || mode === 'weeklyCatchUp' ? 'weekly' : mode === 'formal-exam' ? 'mock' : mode === 'reviewWrong' ? 'wrongReview' : 'practice';

const isAnswerProvided = (answer: unknown) =>
  Array.isArray(answer) ? answer.length > 0 : typeof answer === 'string' ? answer.trim().length > 0 : Boolean(answer);

const normalizeText = (answer: string) => answer.trim().replace(/\s+/g, ' ');
const isSelfCheckQuestion = (question: { type: string }) => ['short-answer', 'short_answer', 'shortAnswer', 'writing', 'memorization', 'essay', 'case-study', 'case_study', 'case'].includes(question.type);

const isCorrectAnswer = (question: { answer: string | string[] }, answer: unknown) => {
  if (!isAnswerProvided(answer)) return false;

  if (Array.isArray(question.answer)) {
    return Array.isArray(answer)
      && question.answer.length === answer.length
      && question.answer.every((option) => answer.includes(option));
  }

  return typeof answer === 'string' && normalizeText(answer) === normalizeText(question.answer);
};

const getReferenceAnswer = (question: AppQuestion) => 'referenceAnswer' in question && question.referenceAnswer !== undefined ? question.referenceAnswer : question.answer;

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [questions, setQuestions] = useState<AppQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [selfCheckResults, setSelfCheckResults] = useState<Record<string, boolean>>({});
  const [timeLimit, setTimeLimit] = useState<number>(examConfig.timeLimit);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [profile] = useState<LearnerProfile>(() => applyProfileQuery());
  const [examDraft, setExamDraft] = useState<ExamDraft | null>(() => loadExamDraft());
  const [showDraftChoice, setShowDraftChoice] = useState(false);
  const [examEntry, setExamEntry] = useState<ExamEntry>('new-exam');
  const [todaySuggestedQuestions, setTodaySuggestedQuestions] = useState(0);
  const [todayCarryoverCount, setTodayCarryoverCount] = useState(0);
  const [sessionMode, setSessionMode] = useState<StudyMode>('formal-exam');
  const [persistDraft, setPersistDraft] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [resetRevision, setResetRevision] = useState(0);
  const [notice, setNotice] = useState<string>();
  const hasFinishedRef = useRef(false);

  useEffect(() => { void retryPendingSync(); void retryAnsweredQuestionHistorySync(); void fetchAnsweredQuestionHistory(); const retry = () => { void retryPendingSync(); void retryAnsweredQuestionHistorySync(); void fetchAnsweredQuestionHistory(); }; window.addEventListener('online', retry); return () => window.removeEventListener('online', retry); }, []);
  useEffect(() => {
    const historicalSessions = loadStudyProgress().sessions.map((session) => ({
      id: session.id,
      mode: session.mode,
      questionIds: session.questionIds ?? [],
      answeredQuestionIds: (session.questionIds ?? []).filter((id) => !(session.skippedQuestionIds ?? []).includes(id)),
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    }));
    seedSchedulerFromHistoricalSessions(historicalSessions);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let nextNotice = '';
    if (params.get('resetDailyTask') === '1') { resetDailyTask(); params.delete('resetDailyTask'); nextNotice = '本瀏覽器今日任務已重置。'; }
    if (params.get('resetLocalProgress') === '1') { resetLocalProgress(); params.delete('resetLocalProgress'); nextNotice = '本瀏覽器測試資料已重置，不影響 learner 紀錄。'; }
    // Reset flags are URL-driven external commands; update the view after applying them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nextNotice) { window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`); setNotice(nextNotice); setExamDraft(loadExamDraft()); setResetRevision((value) => value + 1); }
  }, []);

  const prepareNewExam = (entry: ExamEntry, suggestedQuestions = 0) => {
    clearExamDraft();
    setExamDraft(null);
    const formalPool = getFormalQuestionPool().filter(isFullMockEligibleQuestion);
    const selectedIds = selectMockQuestionIds(formalPool.map((question) => toSchedulerCandidate(question, !isPracticeOnlyQuestion(question))), formalPool.length);
    const selectedSet = new Set(selectedIds);
    const formalQuestions = selectedIds.map((id) => getQuestionById(id)).filter((question): question is RuntimeQuestion => question !== null && selectedSet.has(question.id));
    setQuestions(prepareQuestionSequence(formalQuestions));
    setTimeLimit(calculateTimeLimitInMinutes('formal-exam', formalQuestions));
    setExamEntry(entry);
    setTodaySuggestedQuestions(suggestedQuestions);
    setTodayCarryoverCount(0);
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

  const handleStartTodayTask = async (requestedQuestions = dailyTarget) => {
    // 舊版 extendDailyTaskV2Plan 仍保留在 dailyTaskV2，供既有狀態與 Sprint 34 驗證向下相容；本流程改由 Question Scheduler 選擇新增題。
    setExamDraft(null);
    const availableQuestions = getDailyQuestionPool();
    const availableIds = availableQuestions.map((question) => question.id);
    await fetchAnsweredQuestionHistory();
    const permanentCompletedIds = getCompletedQuestionIds();
    const completedHistory = [...new Set([...permanentCompletedIds, ...loadStudyProgress().sessions.flatMap((session) => session.questionIds ?? [])])];
    const requestedCount = Math.min(dailyMaximum, Math.max(dailyTarget, requestedQuestions));
    const currentPlan = getDailyTaskV2Plan(availableIds, completedHistory);
    const completedIds = currentPlan.state.completedQuestionIds;
    const activeIds = currentPlan.activeQuestionIds;
    const desiredNewCount = requestedCount > dailyTarget ? Math.max(0, requestedCount - completedIds.length) : activeIds.length;
    const carryoverIds = currentPlan.state.carryoverQuestionIds.filter((id) => activeIds.includes(id));
    const scheduledIds = selectDailyQuestionIds(availableQuestions.map((question) => toSchedulerCandidate(question, !isPracticeOnlyQuestion(question))), desiredNewCount, carryoverIds, permanentCompletedIds);
    const selectedIds = [...new Set([...completedIds, ...scheduledIds])].slice(0, requestedCount);
    const taskPlan = applyDailyTaskV2QuestionSelection(selectedIds, availableIds);
    const taskQuestions = taskPlan.activeQuestionIds.map((id) => getQuestionById(id)).filter((question): question is AppQuestion => question !== null);
    if (taskQuestions.length === 0) return;
    setQuestions(prepareQuestionSequence(taskQuestions));
    setTimeLimit(calculateTimeLimitInMinutes('daily', taskQuestions));
    setExamEntry('today-task');
    setTodaySuggestedQuestions(taskQuestions.length);
    setTodayCarryoverCount(taskPlan.carryoverCount);
    setSessionMode('daily');
    setPersistDraft(true);
    setCurrentPage('instructions');
  };

  const handleStartWrongReview = (questionIds?: number[]) => {
    const reviewRecords = getReviewableWrongAnswers().filter((record) => !questionIds || questionIds.includes(record.questionId)).slice(0, 10);
    const reviewQuestions = reviewRecords.map((record) => getQuestionById(record.questionId)).filter((question) => question !== null);
    if (reviewQuestions.length === 0) return;
    setQuestions(prepareQuestionSequence(reviewQuestions)); setTimeLimit(calculateTimeLimitInMinutes('reviewWrong', reviewQuestions)); setExamEntry('wrong-review'); setTodaySuggestedQuestions(reviewQuestions.length); setSessionMode('reviewWrong'); setPersistDraft(false); setCurrentPage('instructions');
  };

  const handleStartWritingPractice = () => {
    const writingQuestions = getWritingPracticeQuestions();
    if (writingQuestions.length === 0) return;
    setExamDraft(loadExamDraft());
    setQuestions(prepareQuestionSequence(writingQuestions));
    setTimeLimit(calculateTimeLimitInMinutes('recovery', writingQuestions));
    setExamEntry('writing-practice');
    setTodaySuggestedQuestions(writingQuestions.length);
    setSessionMode('writingPractice');
    setPersistDraft(false);
    setCurrentPage('instructions');
  };

  const handleStartWeeklyReview = async () => {
    await fetchAnsweredQuestionHistory();
    const permanentCompletedIds = getCompletedQuestionIds();
    const formalQuestions = getFormalQuestionPool();
    const practiceQuestions = getPracticeQuestionPool();
    const availableReviewQuestions = [...formalQuestions, ...practiceQuestions];
    const unansweredIds = getReviewableUnansweredQuestionIds();
    const wrongIds = getReviewableWrongAnswers().map((record) => record.questionId);
    const wrongIdSet = new Set(wrongIds);
    const reviewCandidates = availableReviewQuestions.map((question) => {
      const candidate = toSchedulerCandidate(question, !isPracticeOnlyQuestion(question));
      return { ...candidate, isImportant: candidate.isImportant || wrongIdSet.has(question.id) };
    });
    // 錯題提高排序，但只有未完成保留題可例外穿越近期 Daily 排除線。
    const reviewIds = selectWeeklyQuestionIds(reviewCandidates, Math.min(40, availableReviewQuestions.length), unansweredIds, permanentCompletedIds);
    const questionById = new Map(availableReviewQuestions.map((question) => [question.id, question]));
    const reviewQuestions = reviewIds.map((id) => questionById.get(id)).filter((question): question is NonNullable<typeof question> => question !== undefined);
    if (reviewQuestions.length === 0) return;
    setExamDraft(null); setQuestions(prepareQuestionSequence(reviewQuestions)); setTimeLimit(calculateTimeLimitInMinutes('weeklyReview', reviewQuestions)); setExamEntry('weekly-review'); setTodaySuggestedQuestions(reviewQuestions.length); setSessionMode('weeklyReview'); setPersistDraft(false); setCurrentPage('instructions');
  };

  const handleResumeExam = () => {
    const draft = loadExamDraft() ?? loadExamDraft(dailyTaskV2DraftStorageKey);
    if (!draft) {
      setExamDraft(null);
      return;
    }
    setExamDraft(draft);
    const resumedDailyQuestions = draft.entry === 'today-task'
      ? draft.questionIds.map((id) => getQuestionById(id)).filter((question) => question !== null)
      : getFormalQuestionPool().filter(isFullMockEligibleQuestion);
    setQuestions(prepareQuestionSequence(resumedDailyQuestions));
    setTimeLimit(calculateTimeLimitInMinutes(draft.entry === 'today-task' ? 'daily' : 'formal-exam', resumedDailyQuestions));
    setExamEntry(draft.entry === 'today-task' ? 'today-task' : 'new-exam');
    setSessionMode(draft.entry === 'today-task' ? 'daily' : 'formal-exam');
    setPersistDraft(true);
    setSessionId(draft.sessionId ?? crypto.randomUUID());
    setStartedAt(draft.createdAt);
    setCurrentPage('exam');
  };

  const handleConfirmStart = () => {
    hasFinishedRef.current = false;
    // 題目一旦進入已開始的測驗，就視為歷史資產候選；後續題庫工廠不得改寫其核心欄位。
    if (!profile.isTest) protectQuestionIds(questions.map((question) => question.id));
    setUserAnswers({});
    setSelfCheckResults({});
    setTimeSpent(0);
    const nextStartedAt = new Date().toISOString();
    const nextSessionId = crypto.randomUUID();
    setStartedAt(nextStartedAt); setSessionId(nextSessionId);
    recordQuestionsShown(questions.map((question) => question.id), getSchedulerMode(sessionMode), nextSessionId);
    if (!profile.isTest) void syncExamStarted({ sessionId: nextSessionId, examId: examEntry, examTitle: examEntry === 'weekly-review' ? '每週測驗' : examEntry === 'wrong-review' ? '錯題複習' : examEntry === 'writing-practice' ? '簡答／默寫練習' : examEntry === 'today-task' ? '今日任務' : `Week ${examConfig.week} ${examConfig.title}`, examType: sessionMode, startedAt: nextStartedAt, questionCount: questions.length });
    setCurrentPage('exam');
  };

  const handleFinishExam = (answers: Record<string, string | string[]>, timeLeft: number, selfChecks: Record<string, boolean> = {}) => {
    if (hasFinishedRef.current) return;

    hasFinishedRef.current = true;
    setExamDraft(null);
    setUserAnswers(answers);
    setSelfCheckResults(selfChecks);
    const durationSeconds = timeLimit * 60 - Math.max(0, timeLeft);
    const completedAt = new Date().toISOString();
    setTimeSpent(durationSeconds);

    const isAutoGradedQuestion = (question: GradingQuestion) => !isSelfCheckQuestion(question) && question.formalScoreEligible !== false;
    const isPracticeAutoGradedQuestion = (question: GradingQuestion) => Boolean(question.practiceOnly) && !isSelfCheckQuestion(question);
    const wasCorrect = (question: GradingQuestion) => isAutoGradedQuestion(question) && isCorrectAnswer(question, answers[question.id]);
    const wasWrong = (question: GradingQuestion) => isAutoGradedQuestion(question) && isAnswerProvided(answers[question.id]) && !isCorrectAnswer(question, answers[question.id]);
    const wasPracticeWrong = (question: GradingQuestion) => isPracticeAutoGradedQuestion(question) && isAnswerProvided(answers[question.id]) && !isCorrectAnswer(question, answers[question.id]);
    const wasAnswered = (question: GradingQuestion) => isAnswerProvided(answers[question.id]);
    const answeredCount = questions.filter(wasAnswered).length;
    const correctCount = questions.filter(wasCorrect).length;
    const autoGradedCount = questions.filter(isAutoGradedQuestion).length;
    const unansweredCount = questions.length - answeredCount;
    const correctQuestionIds = questions.filter(wasCorrect).map((question) => question.id);
    const wrongQuestions = questions.filter(wasWrong);
    const practiceWrongQuestions = questions.filter(wasPracticeWrong);
    const wrongQuestionIds = [...wrongQuestions, ...practiceWrongQuestions].map((question) => question.id);
    const skippedQuestionIds = questions.filter((question) => !wasAnswered(question)).map((question) => question.id);
    const wrongAnswerRecords = [...wrongQuestions, ...practiceWrongQuestions]
      .map((question) => ({ questionId: question.id, weekId: getQuestionWeekId(question) ?? 'week-1', lastSelectedAnswer: answers[question.id] ?? null, correctAnswer: question.answer, questionType: question.type, source: getQuestionWeekId(question) ?? 'week-1' }));
    const unansweredQuestions = questions.filter((question) => !wasAnswered(question));
    const answeredQuestionIds = questions.filter(wasAnswered).map((question) => question.id);
    if (!profile.isTest) {
      recordQuestionsAnswered(answeredQuestionIds);
      recordQuestionsCompleted(answeredQuestionIds);
      questions.filter((question) => isAutoGradedQuestion(question) && wasAnswered(question)).forEach((question) => recordQuestionMastery(question.id, wasCorrect(question) ? 'mastered' : 'not_mastered'));
      questions.filter((question) => isSelfCheckQuestion(question) && wasAnswered(question)).forEach((question) => recordQuestionMastery(question.id, selfChecks[question.id] === true ? 'mastered' : 'partial'));
      recordUnansweredQuestions(unansweredQuestions.map((question) => ({ questionId: question.id, weekId: getQuestionWeekId(question) ?? 'week-1', sourceMode: sessionMode })));
      resolveUnansweredQuestions(answeredQuestionIds);
    }
    const getAnswerStatus = (question: AppQuestion): AnswerStatus => {
      if (!wasAnswered(question)) return 'unanswered';
      if (isSelfCheckQuestion(question)) return 'pending_self_review';
      return isCorrectAnswer(question, answers[question.id]) ? 'correct' : 'wrong';
    };
    const syncAnswers = questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: answers[question.id] ?? null,
      correctAnswer: getReferenceAnswer(question),
      isCorrect: isSelfCheckQuestion(question) ? null : isPracticeOnlyQuestion(question) ? null : isCorrectAnswer(question, answers[question.id]),
      status: getAnswerStatus(question),
    }));

    if (!profile.isTest && sessionId) {
      const taskType: AnsweredHistoryTaskType = sessionMode === 'daily' ? 'daily' : sessionMode === 'weeklyReview' || sessionMode === 'weeklyCatchUp' ? 'weekly' : 'mock';
      void recordAnsweredQuestionHistory(questions.filter(wasAnswered).map((question) => {
        const result = getAnswerStatus(question);
        return {
          sessionId,
          questionId: question.id,
          date: completedAt,
          taskType,
          questionType: question.type,
          category: 'category' in question ? question.category : getQuestionWeekId(question) ?? '未分類',
          result: result === 'unanswered' ? 'pending_self_review' : result,
          score: result === 'correct' ? 1 : result === 'wrong' ? 0 : null,
        };
      }));
    }

    if (!profile.isTest && examEntry === 'today-task') completeDailyTaskV2Questions(questions.filter(wasAnswered).map((question) => question.id), getDailyQuestionPool().map((question) => question.id));

    if (!profile.isTest) {
      try {
        localStorage.setItem('ifa_exam_state', JSON.stringify({
          week: examConfig.week,
          completedAt,
          score: correctCount,
          accuracy: autoGradedCount === 0 ? 0 : Math.round((correctCount / autoGradedCount) * 100),
          correctCount,
          wrongCount: wrongQuestions.length,
          unansweredCount,
          timeSpent: durationSeconds,
        }));
      } catch (error) {
        console.error('Failed to save the latest exam result:', error);
      }

      recordStudySession({
        id: `formal-pool-${completedAt}`,
        date: getLocalDateString(new Date()),
        weekId: 'all-weeks',
        mode: sessionMode,
        answeredCount,
        correctCount,
        wrongCount: wrongQuestions.length,
        durationSeconds,
        completedAt,
        startedAt: startedAt ?? completedAt,
        questionIds: questions.map((question) => question.id),
        correctQuestionIds,
        wrongQuestionIds,
        skippedQuestionIds,
      });
      if (sessionMode === 'reviewWrong') questions.filter((question) => isAutoGradedQuestion(question) || isPracticeAutoGradedQuestion(question)).forEach((question) => recordWrongAnswerReview(question.id, correctQuestionIds.includes(question.id)));
      else recordWrongAnswers(wrongAnswerRecords);
    }

    setCurrentPage('result');
    if (!profile.isTest && sessionId) void syncExamCompleted({ sessionId, examId: examEntry, examTitle: examEntry === 'weekly-review' ? '每週測驗' : examEntry === 'wrong-review' ? '錯題複習' : examEntry === 'writing-practice' ? '簡答／默寫練習' : examEntry === 'today-task' ? '今日任務' : '正式題庫完整模擬考', examType: sessionMode, startedAt: startedAt ?? completedAt, questionCount: questions.length, answeredCount, correctCount, wrongCount: wrongQuestions.length, unansweredCount, score: autoGradedCount === 0 ? null : Math.round((correctCount / autoGradedCount) * 100), durationSeconds, answers: syncAnswers });
  };

  const handleReturnHome = () => {
    setCurrentPage('home');
    setUserAnswers({});
    setSelfCheckResults({});
    setQuestions([]);
    setTimeSpent(0);
    setTodayCarryoverCount(0);
  };

  const handleAbortExam = () => {
    hasFinishedRef.current = false;
    setUserAnswers({});
    setSelfCheckResults({});
    setQuestions([]);
    setTimeSpent(0);
    setTodayCarryoverCount(0);
    setExamDraft(loadExamDraft());
    setCurrentPage('home');
  };

  const handleRetry = () => {
    clearExamDraft();
    const formalPool = getFormalQuestionPool().filter(isFullMockEligibleQuestion);
    const selectedIds = selectMockQuestionIds(formalPool.map((question) => toSchedulerCandidate(question, !isPracticeOnlyQuestion(question))), formalPool.length);
    const formalQuestions = selectedIds.map((id) => getQuestionById(id)).filter((question): question is RuntimeQuestion => question !== null);
    setQuestions(prepareQuestionSequence(formalQuestions));
    setTimeLimit(calculateTimeLimitInMinutes('formal-exam', formalQuestions));
    setUserAnswers({});
    setSelfCheckResults({});
    setTimeSpent(0);
    setTodayCarryoverCount(0);
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
          hasExamDraft={Boolean(loadExamDraft() ?? loadExamDraft(dailyTaskV2DraftStorageKey))}
          onResumeExam={handleResumeExam}
          onStartTodayTask={handleStartTodayTask}
          onOpenWrongBook={() => setCurrentPage('wrongBook')}
          onOpenPracticeCenter={() => setCurrentPage('practiceCenter')}
          onOpenCoachDashboard={() => setCurrentPage('coachDashboard')}
          onResetDailyTask={() => { resetDailyTask(); setExamDraft(loadExamDraft()); setNotice('本瀏覽器今日任務已重置。'); setResetRevision((value) => value + 1); }}
          onResetLocalProgress={() => { resetLocalProgress(); setExamDraft(loadExamDraft()); setNotice('本瀏覽器測試資料已重置，不影響 learner 紀錄。'); setResetRevision((value) => value + 1); }}
          profile={profile}
          resetRevision={resetRevision}
          notice={notice}
        />
      )}
      {currentPage === 'wrongBook' && <WrongBook onReturnHome={handleReturnHome} onStartReview={handleStartWrongReview} />}
      {currentPage === 'practiceCenter' && <PracticeCenter onReturnHome={handleReturnHome} onStartTodayTask={handleStartTodayTask} onStartWrongReview={() => handleStartWrongReview()} onOpenWrongBook={() => setCurrentPage('wrongBook')} onStartNewExam={handleStartNewExam} onStartWeeklyReview={handleStartWeeklyReview} onStartWritingPractice={handleStartWritingPractice} />}
      {currentPage === 'coachDashboard' && profile.isTest && <CoachDashboard onReturnHome={handleReturnHome} />}
      {currentPage === 'instructions' && (
        <main className="exam-instructions w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow flex items-center">
          <section className="exam-instructions-card w-full bg-[#0b0d14] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-400">測驗說明</span>
              <h1 className="text-2xl font-bold text-white">{examEntry === 'weekly-review' ? '每週測驗' : examEntry === 'wrong-review' ? '錯題複習' : examEntry === 'writing-practice' ? '簡答／默寫練習' : examEntry === 'new-exam' ? `正式模擬考：${questions.length} 題` : `Week ${examConfig.week}：${examConfig.title}`}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{examEntry === 'weekly-review' ? `本次週測 ${questions.length} 題；會優先納入未完成保留題與錯題，再安排其他題目複習。` : examEntry === 'wrong-review' ? `本次複習 ${questions.length} 題。答對不會立即刪除錯題，連續答對後會標示為已熟練。` : examEntry === 'writing-practice' ? `本次練習 ${questions.length} 題。輸入答案後請依參考答案與檢核點自行選擇答對或需要複習。` : examEntry === 'today-task' && todaySuggestedQuestions > 0 ? todayCarryoverCount > 0 ? `本次為今日任務，共 ${todaySuggestedQuestions} 題，優先安排 ${todayCarryoverCount} 題未完成保留題。` : `本次為今日任務，共 ${todaySuggestedQuestions} 題；未作答題會保留至下一次每日任務。` : examEntry === 'new-exam' ? `本次使用正式 verified 題與教材證據題，共 ${questions.length} 題；一般考前練習題不列入正式模擬考。` : '確認開始後才會啟動倒數。請在作答期間隨時確認題目狀態與標記。'}</p>
              {examEntry === 'today-task' && todayCarryoverCount > 0 && <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100"><p>上次未完成題目：{todayCarryoverCount} 題</p><p>本次優先安排未作答題：{todayCarryoverCount} 題</p><p>未作答題將保留至下一次每日任務</p></div>}
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
          persistDraft={persistDraft}
          draftEntry={examEntry}
          draftStorageKey={examEntry === 'today-task' ? dailyTaskV2DraftStorageKey : undefined}
          sessionId={sessionId}
          onProgressCheckpoint={(answeredCount) => {
            if (profile.isTest || !sessionId) return;
            void syncExamProgress({ sessionId, examId: examEntry, examTitle: examEntry, examType: sessionMode, startedAt: startedAt ?? new Date().toISOString(), answeredCount, questionCount: questions.length, progressPercent: Math.round((answeredCount / questions.length) * 100) });
          }} />
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
          sessionId={sessionId}
          selfCheckResults={selfCheckResults}
          onReturnHome={handleReturnHome}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

export default App;
