import { useState, useEffect } from 'react';

// 動態資料層讀取
import examConfig from '../data/config/exam-config.json';
import questionsData from '../data/questions/week1.json';
import knowledgeData from '../data/knowledge/week1-knowledge.json';

interface HomeProps {
  onStartExam: (week: number) => void;
}

// 建立明確的 TypeScript 資料型別以取代 any
interface KnowledgeItem {
  id: string;
  system: string;
  topic: string;
  priority: number;
  references: string[];
  recommendedQuestionTypes: string[];
}

export default function Home({ onStartExam }: HomeProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // 解析來自 config 的結構
  const { examDate, week, title, subtitle, timeLimit, difficulty, aiCoachAdvice } = examConfig;
  const totalQuestions = questionsData.length;

  // 動態過濾與排序：僅篩選出 Priority 最高的前 5 個核心知識點卡片
  const topKnowledgePoints = [...knowledgeData]
    .sort((a: KnowledgeItem, b: KnowledgeItem) => b.priority - a.priority)
    .slice(0, 5);

  // 動態計算大考倒數天數
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
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased text-slate-900 pb-24">
      {/* SaaS Navigation Header */}
      <nav className="w-full h-16 bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">IFA Master Coach</span>
          </div>
          
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider font-mono">T-Minus</span>
            <span className="text-xs font-black text-indigo-900 font-mono">{daysRemaining}d</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        
        {/* 1. Hero Section - SaaS Layout */}
        <section className="max-w-3xl space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 font-mono">
              International Federation of Aromatherapists
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              AI Learning Platform
            </h1>
          </div>
          <p className="text-lg text-slate-500 font-medium font-serif italic tracking-wide leading-relaxed border-l-2 border-slate-200 pl-4 py-1">
            Learn Smarter. Practice Better. Pass IFA.
          </p>
        </section>

        {/* 2. Main Module & AI Coach Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Main Area: Current Week Card (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Current Week Card */}
            <section className="bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 font-mono">
                    Active Curriculum • Week {week}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{subtitle}</p>
                </div>
              </div>

              {/* Data-Driven Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">總題數</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">{totalQuestions}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">時限</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">{timeLimit}m</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">精準難度</span>
                  <span className="text-xs font-bold text-amber-500 tracking-widest mt-1 block">{'★'.repeat(difficulty)}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">完成進度</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">0%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 w-0"></div>
                  </div>
                </div>
              </div>

              {/* CTA Platform Button */}
              <div className="pt-2">
                <button
                  onClick={() => onStartExam(week)}
                  className="w-full sm:w-auto min-w-[200px] h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>進入全真模擬考</span>
                  <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </section>

            {/* 3. Knowledge Summary Section */}
            <section className="space-y-4">
              <div className="flex flex-col space-y-1 px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Objectives</h3>
                <h4 className="text-sm font-bold text-slate-900">核心知識點摘要整理</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topKnowledgePoints.map((item: KnowledgeItem) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)] rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                        <span className="text-[10px] font-semibold font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.system}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {item.topic}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono font-medium">
                      <span>重要性: {'★'.repeat(item.priority)}</span>
                      <span>參考文獻: {item.references.length} 篇</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Area: Sidebar Widgets (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 4. AI Coach Section */}
            <section className="bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-xl p-5 relative overflow-hidden">
              <div className="w-1 h-full bg-indigo-600 absolute left-0 top-0"></div>
              <div className="space-y-3 pl-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Coach Diagnostic</h3>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  建議今日先針對焦點指標 <span className="font-mono font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-2">{aiCoachAdvice.targetKnowledgeId}</span> 進行深化複習：詳精讀講義中有關{aiCoachAdvice.message}
                </p>
              </div>
            </section>

            {/* 5. Recent Exam Section with Clean Empty State */}
            <section className="bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics Tracker</h3>
              
              <div className="py-8 px-4 rounded-lg bg-slate-50/50 border border-slate-100 border-dashed text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-700">尚無作答數據</p>
                <p className="text-[11px] text-slate-400 mt-0.5">完成模擬考後，此處將自動產生交叉分析面板。</p>
              </div>
            </section>
          </div>
        </div>

        {/* 6. Footer CTA Actions */}
        <section className="pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 rounded-xl p-6 text-white">
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight">準備好接受階段性檢定模組了嗎？</h3>
              <p className="text-xs text-slate-400">系統將調用 20 題標準考古與簡答申論題進行測驗。</p>
            </div>
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => onStartExam(week)}
                className="flex-1 sm:flex-initial h-9 px-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
              >
                開始模擬考
              </button>
              <button 
                onClick={() => alert('章節弱點練習模式建置中')}
                className="flex-1 sm:flex-initial h-9 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
              >
                章節練習
              </button>
              <button 
                onClick={() => alert('重點觀念整理包生成中')}
                className="flex-1 sm:flex-initial h-9 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
              >
                查看重點整理
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}