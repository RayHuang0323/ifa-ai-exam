import { useState, useEffect } from 'react';

interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[] | Record<string, string>;
  analysis: string;
}

interface ExamProps {
  questions: Question[];
  timeLimitInMinutes: number; // 從 App.tsx 傳進來的限制時間
  onFinish: (answers: Record<string, string>) => void;
}

export default function Exam({ questions, timeLimitInMinutes, onFinish }: ExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // 將分鐘數轉換為秒數作為倒數計時狀態
  const [timeLeft, setTimeLeft] = useState(timeLimitInMinutes * 60);

  // 倒數計時效果
  useEffect(() => {
    if (timeLeft <= 0) {
      alert('⏰ 測驗時間到！系統已自動幫您交卷。');
      onFinish(answers);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answers, onFinish]);

  // 格式化秒數為 MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: option,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (window.confirm('確定要交卷嗎？')) {
      onFinish(answers);
    }
  };

  // 計算目前剩餘時間是否少於 2 分鐘，若是則文字變紅警告
  const isTimeCritical = timeLeft < 120;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 頂端計時器與進度條固定面板 */}
      <div className="sticky top-0 bg-white bg-opacity-95 backdrop-blur shadow-sm p-4 rounded-xl mb-6 border border-gray-100 flex items-center justify-between z-10">
        <div>
          <span className="text-sm font-medium text-gray-500">
            題目進度：{currentIndex + 1} / {questions.length}
          </span>
          <div className="w-48 bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* 計時器 UI */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-mono font-bold text-lg ${
          isTimeCritical 
            ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* 題目內文區塊 */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="mb-4">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide">
            {currentQuestion.type === 'single' ? '單度選擇題' : currentQuestion.type}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* 選項清單 */}
        {currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部導覽按鈕 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          上一題
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm font-medium transition-colors"
          >
            下一題
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md font-bold tracking-wide transition-all duration-200 transform hover:-translate-y-0.5"
          >
            確認交卷
          </button>
        )}
      </div>
    </div>
  );
}