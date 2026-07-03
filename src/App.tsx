import React, { useState } from 'react';
import Home from './components/Home';
import Exam from './components/Exam';
import Result from './components/Result';

// 靜態載入 JSON 題庫
import week1Data from './data/week1.json';

type Page = 'home' | 'exam' | 'result';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const handleStartExam = (week: number) => {
    if (week === 1) {
      setQuestions(week1Data);
      setCurrentPage('exam');
    } else {
      alert(`Week ${week} 題庫尚未建置，MVP 階段請先測試 Week 1。`);
    }
  };

  const handleFinishExam = (answers: Record<string, string>) => {
    setUserAnswers(answers);
    setCurrentPage('result');
  };

  const handleReturnHome = () => {
    setCurrentPage('home');
    setUserAnswers({});
    setQuestions([]);
  };

  return (
    <div className="font-sans">
      {currentPage === 'home' && (
        <Home onStartExam={handleStartExam} />
      )}
      {currentPage === 'exam' && (
        <Exam questions={questions} onFinish={handleFinishExam} />
      )}
      {currentPage === 'result' && (
        <Result questions={questions} answers={userAnswers} onReturnHome={handleReturnHome} />
      )}
    </div>
  );
}

export default App;