import { useState } from 'react';
import Home from './components/Home';
import Exam from './components/Exam';
import Result from './components/Result';

// 正式資料層路徑導入
import week1Questions from './data/questions/week1.json';
import week1Knowledge from './data/knowledge/week1-knowledge.json';

type Page = 'home' | 'exam' | 'result';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLimit, setTimeLimit] = useState<number>(90);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  const handleStartExam = (week: number) => {
    if (week === 1) {
      setQuestions(week1Questions);
      setTimeLimit(90); 
      setCurrentPage('exam');
    } else {
      alert(`Week ${week} 題庫尚未建置，目前僅開放 Week 1 測試。`);
    }
  };

  const handleFinishExam = (answers: Record<string, any>, timeLeft: number) => {
    setUserAnswers(answers);
    setTimeSpent(timeLimit * 60 - timeLeft); // 記錄花費秒數
    setCurrentPage('result');
  };

  const handleReturnHome = () => {
    setCurrentPage('home');
    setUserAnswers({});
    setQuestions([]);
    setTimeSpent(0);
  };

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800 selection:bg-blue-600 selection:text-white">
      {currentPage === 'home' && (
        <Home onStartExam={handleStartExam} />
      )}
      {currentPage === 'exam' && (
        <Exam 
          questions={questions} 
          timeLimitInMinutes={timeLimit} 
          onFinish={handleFinishExam} 
        />
      )}
      {currentPage === 'result' && (
        <Result 
          questions={questions} 
          knowledge={week1Knowledge} 
          answers={userAnswers} 
          timeSpent={timeSpent}
          onReturnHome={handleReturnHome} 
        />
      )}
    </div>
  );
}

export default App;