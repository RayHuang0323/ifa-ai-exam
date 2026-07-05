import { useMemo } from 'react';

interface ResultProps {
  questions: any[];
  knowledge: any[];
  answers: Record<string, any>;
  timeSpent: number;
  onReturnHome: () => void;
}

export default function Result({ questions, knowledge, answers, timeSpent, onReturnHome }: ResultProps) {
  
  const stats = useMemo(() => {
    let objectiveTotal = 0;
    let correctCount = 0;
    const wrongKnowledgeIds = new Set<string>();
    const chapterStats: Record<string, { total: number; correct: number }> = {};

    questions.forEach(q => {
      // Initialize chapter stats
      if (!chapterStats[q.chapter]) chapterStats[q.chapter] = { total: 0, correct: 0 };
      
      // We only strictly grade objective questions for the percentage score
      if (q.type === 'single' || q.type === 'multiple') {
        objectiveTotal++;
        chapterStats[q.chapter].total++;
        
        let isCorrect = false;
        const userAns = answers[q.id];
        
        if (q.type === 'single') {
          isCorrect = userAns === q.answer;
        } else if (q.type === 'multiple') {
          const ansArray = Array.isArray(q.answer) ? q.answer : [];
          const userArray = Array.isArray(userAns) ? userAns : [];
          isCorrect = ansArray.length === userArray.length && ansArray.every((v: string) => userArray.includes(v));
        }

        if (isCorrect) {
          correctCount++;
          chapterStats[q.chapter].correct++;
        } else {
          wrongKnowledgeIds.add(q.knowledgeId);
        }
      }
    });

    const percentage = objectiveTotal === 0 ? 0 : Math.round((correctCount / objectiveTotal) * 100);
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    return { objectiveTotal, correctCount, percentage, grade, wrongKnowledgeIds, chapterStats };
  }, [questions, answers]);

  const weakPoints = knowledge.filter(k => stats.wrongKnowledgeIds.has(k.id));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">測驗分析報告</h1>
        <p className="text-slate-500">IFA Master Coach - Week 1 模擬考</p>
      </div>

      {/* Main Score Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-sm text-slate-500 font-semibold mb-2 relative z-10">綜合正確率</p>
          <div className="text-6xl font-black text-blue-600 font-mono mb-2 relative z-10">{stats.percentage}<span className="text-3xl text-blue-400">%</span></div>
          <div className="text-xs text-slate-400 font-mono relative z-10">得分: {stats.correctCount} / {stats.objectiveTotal} (僅計客觀題)</div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">評估等級</p>
            <p className="text-4xl font-black text-slate-800">{stats.grade}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">完成時間</p>
            <p className="text-2xl font-bold text-slate-800 font-mono">{formatTime(timeSpent)}</p>
          </div>
          <div className="col-span-2 bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-6 text-white shadow-md">
            <div className="flex gap-3">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-xs text-blue-200 font-bold tracking-wider mb-1">AI COACH 弱點建議</p>
                <p className="text-sm leading-relaxed">
                  {weakPoints.length > 0 
                    ? `根據答錯題型，建議您下一步優先精讀：${weakPoints.slice(0,2).map(k => k.id).join(', ')}。請返回首頁查看重點整理。`
                    : '表現完美！您已徹底掌握本週所有核心知識點，請繼續保持。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Stats */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">各章節正確率 (客觀題)</h3>
        <div className="space-y-4">
          {Object.entries(stats.chapterStats).map(([chapter, data]) => {
            if (data.total === 0) return null;
            const percent = Math.round((data.correct / data.total) * 100);
            return (
              <div key={chapter}>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                  <span className="text-slate-700">{chapter}</span>
                  <span className="text-slate-500">{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Knowledge Points */}
      {weakPoints.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-red-50 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>🎯</span> 待加強 Knowledge Point
          </h3>
          <div className="space-y-3">
            {weakPoints.map(k => (
              <div key={k.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded font-mono font-bold mt-0.5">{k.id}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{k.topic}</p>
                  <p className="text-xs text-slate-500">來源：{k.references.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button 
          onClick={onReturnHome}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md transition-colors text-sm"
        >
          返回學習主頁
        </button>
      </div>
    </div>
  );
}