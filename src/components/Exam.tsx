// src/components/Exam.tsx
import React, { useState } from 'react';

interface ExamProps {
  questions: any[];
  onFinish: (answers: Record<string, string>) => void;
}

const Exam: React.FC<ExamProps> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!questions || questions.length === 0) return <div>載入中...</div>;

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleOptionSelect = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handlePrev = () => { if (!isFirstQuestion) setCurrentIndex((prev) => prev - 1); };
  const handleNext = () => { if (!isLastQuestion) setCurrentIndex((prev) => prev + 1); };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      const confirmSubmit = window.confirm('您還有題目未作答，確定要交卷嗎？');
      if (!confirmSubmit) return;
    }
    onFinish(answers);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-800">IFA 模擬考進行中</h2>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
          {currentIndex + 1} / {questions.length}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
            {currentQuestion.text}
          </h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option: string, idx: number) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-gray-200 bg-white hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  <span className="font-medium text-lg">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={isFirstQuestion}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isFirstQuestion ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            上一題
          </button>
          {!isLastQuestion ? (
            <button onClick={handleNext} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800">下一題</button>
          ) : (
            <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700">交卷</button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Exam;