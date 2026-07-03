// src/components/Result.tsx
import React from 'react';

interface ResultProps {
  questions: any[];
  answers: Record<string, string>;
  onReturnHome: () => void;
}

const Result: React.FC<ResultProps> = ({ questions, answers, onReturnHome }) => {
  const totalQuestions = questions.length;
  let correctCount = 0;

  questions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) correctCount++;
  });

  const wrongCount = totalQuestions - correctCount;
  const score = Math.round((correctCount / totalQuestions) * 100) || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-600 mb-2">測驗完成</h2>
          <div className="text-6xl font-black text-indigo-600 mb-6">
            {score} <span className="text-2xl text-gray-400">分</span>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">正確題數</p>
              <p className="text-2xl font-bold text-green-500">{correctCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">錯誤題數</p>
              <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 ml-2">詳細解析</h3>
          {questions.map((q, index) => {
            const userAnswer = answers[q.id] || '未作答';
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <div key={q.id} className={`bg-white rounded-xl p-6 border-l-4 shadow-sm ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div className="flex gap-3 mb-4">
                  <span className={`font-bold mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{index + 1}.</span>
                  <p className="text-lg font-bold text-gray-800 leading-relaxed">{q.text}</p>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex flex-col md:flex-row md:gap-6 gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">您的答案</p>
                      <p className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer} {isCorrect ? '✓' : '✗'}
                      </p>
                    </div>
                    {!isCorrect && (
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-medium mb-1">正確答案</p>
                        <p className="font-bold text-green-600">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-800 font-bold mb-1">💡 考官解析</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="pt-6 pb-12">
          <button onClick={onReturnHome} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all">
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;