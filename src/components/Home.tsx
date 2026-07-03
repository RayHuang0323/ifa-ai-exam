// src/components/Home.tsx
import React from 'react';

interface HomeProps {
  onStartExam: (week: number) => void;
}

const Home: React.FC<HomeProps> = ({ onStartExam }) => {
  const weeklyModules = [
    { week: 1, title: '人體解剖、生理基礎與細胞', total: 3, time: '10 mins' },
    { week: 2, title: '芳療歷史五大先驅與植物學', total: 25, time: '40 mins' },
    { week: 3, title: '精油化學與物化特性', total: 35, time: '50 mins' },
    { week: 4, title: '基底油脂肪酸與純露學', total: 20, time: '30 mins' },
    { week: 5, title: '臨床病理與精油安全禁忌症', total: 40, time: '60 mins' },
    { week: 6, title: '臨床個案分析專題', total: 15, time: '90 mins' },
    { week: 7, title: '跨系統病理連動與弱點複習', total: 30, time: '50 mins' },
    { week: 8, title: 'IFA 全真正式模擬考', total: 60, time: '120 mins' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center md:text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">IFA 模擬考系統</h1>
          <p className="text-gray-500 mt-2">請選擇本週進度，直接開始測驗。(MVP 請點選 Week 1)</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyModules.map((mod) => (
            <div 
              key={mod.week} 
              className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  Week {mod.week}
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-3">{mod.title}</h3>
                <div className="flex gap-3 mt-2 mb-6">
                  <span className="text-sm text-gray-500">📝 題數: {mod.total}</span>
                  <span className="text-sm text-gray-500">⏳ {mod.time}</span>
                </div>
              </div>
              <button 
                onClick={() => onStartExam(mod.week)}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors"
              >
                開始測驗
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Home;