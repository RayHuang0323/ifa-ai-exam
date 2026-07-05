import { useState, useEffect } from 'react';

interface HomeProps {
  onStartExam: (week: number) => void;
}

export default function Home({ onStartExam }: HomeProps) {
  const [examDate] = useState<string>('2026-10-12'); 
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateDays = () => {
      const today = new Date();
      const target = new Date(examDate);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    };
    calculateDays();
  }, [examDate]);

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              +
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              IFA <span className="text-blue-600 font-light">Master Coach</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-blue-50/80 px-4 py-2 rounded-full border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-semibold text-blue-800 tracking-wide">距離大考剩餘</span>
            <span className="text-lg font-black text-blue-600 font-mono">{daysRemaining} 天</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Top Section: Progress & Week 1 Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Week 1 Course Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-blue-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative z-10">
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-md font-bold tracking-wider mb-4 inline-block">
                本週學習進度 WEEK 1
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">人體解剖學與生理學</h2>
              <p className="text-slate-500 text-sm mb-8">Anatomy and Physiology - 涵蓋心血管、淋巴、神經等四大系統核心觀念。</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400 mb-1">總題數</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">20</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400 mb-1">預估時間</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">90<span className="text-sm font-normal text-slate-500 ml-1">min</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400 mb-1">完成率</p>
                  <p className="text-xl font-bold text-blue-600 font-mono">0%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400 mb-1">難度</p>
                  <p className="text-lg font-bold text-amber-500 tracking-widest">★★★</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onStartExam(1)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-200 transition-all text-sm"
                >
                  開始模擬考
                </button>
                <button className="flex-1 bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 font-semibold py-3.5 rounded-xl transition-all text-sm">
                  開始章節練習
                </button>
                <button className="flex-1 bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 font-semibold py-3.5 rounded-xl transition-all text-sm">
                  查看重點整理
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Advice & Recent Exam */}
          <div className="flex flex-col gap-6">
            
            {/* AI Coach Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-6 shadow-md text-white relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-sm tracking-wide">AI Coach 今日建議</h3>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-sm text-blue-50 leading-relaxed">
                  今天建議：先閱讀 <span className="font-mono bg-blue-800 px-1.5 py-0.5 rounded text-blue-200">CV001</span> 心血管循環途徑，確保理解充氧血與缺氧血流向。完成後再開始本週模擬考。
                </p>
              </div>
            </div>

            {/* Recent Progress */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1">
              <h3 className="font-bold text-sm text-slate-900 mb-4">最近一次測驗紀錄</h3>
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-sm text-slate-400 font-medium">尚無測驗紀錄</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}