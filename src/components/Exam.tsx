import { useState, useEffect } from 'react';

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
  onFinish: (answers: Record<string, any>, timeLeft: number) => void;
}

export default function Exam({ questions, timeLimitInMinutes, onFinish }: ExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitInMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert('⏰ 測驗時間到！系統已自動幫您交卷。');
      onFinish(answers, 0);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, answers, onFinish]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isTimeCritical = timeLeft < 300;

  const handleSelectOption = (option: string) => {
    if (currentQuestion.type === 'multiple') {
      const currentAns = (answers[currentQuestion.id] as string[]) || [];
      if (currentAns.includes(option)) {
        setAnswers({ ...answers, [currentQuestion.id]: currentAns.filter(a => a !== option) });
      } else {
        setAnswers({ ...answers, [currentQuestion.id]: [...currentAns, option] });
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: option });
    }
  };

  const handleTextAnswer = (text: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: text });
  };

  const handleSubmit = () => {
    if (window.confirm('確定要交卷嗎？')) {
      onFinish(answers, timeLeft);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '單選題';
      case 'multiple': return '多選題';
      case 'short_answer': return '簡答題';
      case 'essay': return '申論題';
      case 'case_study': return '個案分析';
      default: return '問答題';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 min-h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-4 bg-white/90 backdrop-blur-md shadow-sm p-4 rounded-2xl mb-8 border border-slate-100 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800 font-mono">
              Q{currentIndex + 1} <span className="text-slate-400 font-normal">/ {questions.length}</span>
            </span>
            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded font-bold tracking-widest">
              {getQuestionTypeLabel(currentQuestion.type)}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            isTimeCritical ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span>⏱</span> {formatTime(timeLeft)}
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Question Body */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 mb-6 border border-slate-100 flex-grow">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{currentQuestion.chapter}</span>
          <span className="text-amber-400 text-sm tracking-widest">{'★'.repeat(currentQuestion.difficulty)}</span>
        </div>
        
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h2>

        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const currentAns = answers[currentQuestion.id];
              const isSelected = currentQuestion.type === 'multiple' 
                ? Array.isArray(currentAns) && currentAns.includes(option)
                : currentAns === option;

              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 text-sm md:text-base ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-[0_0_0_2px_rgba(37,99,235,0.1)]'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            className="w-full h-48 p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm text-slate-700"
            placeholder="請在此輸入您的解答..."
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleTextAnswer(e.target.value)}
          ></textarea>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => setCurrentIndex(prev => prev - 1)}
          disabled={currentIndex === 0}
          className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm font-semibold"
        >
          上一題
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex-1 max-w-xs px-6 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold transition-colors text-sm"
          >
            下一題
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 max-w-xs px-6 py-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md font-bold transition-all text-sm"
          >
            送出考卷
          </button>
        )}
      </div>
    </div>
  );
}