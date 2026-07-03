import { useState, useEffect } from 'react';

interface HomeProps {
  onStartExam: (week: number) => void;
}

export default function Home({ onStartExam }: HomeProps) {
  // 1. 設定 IFA 正式大考日期（系統設定，用以動態計算賸餘天數）
  const [examDate] = useState<string>('2026-10-12'); 
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // 2. 本週週次與主题狀態（動態對應課綱）
  const [currentWeek] = useState<number>(1);
  const [weekSubject] = useState<string>('人體解剖學與生理學 (Anatomy and Physiology)');

  // 3. 今日任務清單與切換狀態
  const [tasks, setTasks] = useState([
    { id: 1, text: '精讀本週考點：心血管循環與淋巴回流途徑', done: false },
    { id: 2, text: '完成一組 Week 1 官方標準模擬考（限時 90 分鐘）', done: false },
    { id: 3, text: '對照考官建議，檢討術科用油理由與病理對應', done: false }
  ]);

  // 動態計算倒數天數
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

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* 頂端狀態橫幅 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">IFA Master Coach</h1>
          
          {/* 第一區：顯示距離考試剩餘天數（動態計算） */}
          <div className="flex items-center space-x-3 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">距離大考剩餘</span>
            <div className="h-4 w-px bg-indigo-200"></div>
            <span className="text-lg font-black text-indigo-900 font-mono">{daysRemaining} 天</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {/* 進度與任務區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 第二區 & 第三區：顯示本週 Week 與本週主題 */}
          <section className="md:col-span-1 bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <span className="inline-block bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">
                當前進度
              </span>
              <h2 className="text-3xl font-black font-mono tracking-tight">Week {currentWeek}</h2>
              <div className="h-px bg-slate-800 my-3"></div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                {weekSubject}
              </p>
            </div>
            
            {/* 第五區：顯示題數、時間、難度 */}
            <div className="mt-8 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">題數</p>
                <p className="text-sm font-bold text-white">25 題</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">時間</p>
                <p className="text-sm font-bold text-white">90 分</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">難度</p>
                <p className="text-sm font-bold text-amber-400">中高</p>
              </div>
            </div>
          </section>

          {/* 第五區：今日任務 */}
          <section className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>📋</span> <span>今日任務</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {tasks.filter(t => t.done).length} / {tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      task.done
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded-md border text-[10px] transition-colors ${
                      task.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {task.done && '✓'}
                    </div>
                    <span className="text-xs leading-normal font-medium">{task.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI 今日提醒 */}
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-2">
              <span className="text-sm">💡</span>
              <div className="text-xs leading-relaxed text-amber-900">
                <strong className="font-bold text-amber-950">AI 今日提醒：</strong>
                今天建議優先閱讀心血管循環，完成後再開始模擬考。
              </div>
            </div>
          </section>
        </div>

        {/* 第四區：動態重點整理（自動彙整自 Knowledge、講義與考古題精華） */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-base">🔥</span>
            <h3 className="text-sm font-bold text-slate-900">本週必考重點觀念與講義來源</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="py-3 first:pt-0 last:pb-0 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">★★★★★ 心血管循環系統途徑</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  解剖學期末考核(一)解答 / 試卷二[cite: 5, 6]
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                大考必背：缺氧血由上下腔靜脈入右心房，經三尖瓣入右心室，通過肺動脈瓣至肺臟進行氣體交換；充氧血經肺靜脈注入左心房，過二尖瓣至左心室，受心肌擠壓經主動脈瓣運行全身[cite: 5, 8]。
              </p>
            </div>

            <div className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">★★★★★ 淋巴系統循環機制</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  解剖學期末考核(一)解答 / 試卷四解答[cite: 5, 8]
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                淋巴液流經微淋巴管、經淋巴管與淋巴結匯集到淋巴幹，最後由胸管或右淋巴管進入「鎖骨下靜脈」重新流回血液[cite: 5]。注意考綱中淋巴液單向不回流的四個生理因素[cite: 10]。
              </p>
            </div>

            <div className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">★★★★★ 尿液形成流經步驟排序</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  解剖學期末考核(一)解答 / 試卷三[cite: 5, 7]
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                排序題經典核心：腎臟 $\rightarrow$ 乳突狀管道 $\rightarrow$ 腎小盞 $\rightarrow$ 腎大盞 $\rightarrow$ 腎盂 $\rightarrow$ 輸尿管 $\rightarrow$ 膀胱 $\rightarrow$ 尿道口 $\rightarrow$ 外部環境[cite: 5]。
              </p>
            </div>

            <div className="py-3 last:pb-0 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">★★★★★ 第一型與第二型糖尿病之臨床鑑別</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  解剖學期末試卷(三) / 試卷四解答[cite: 7, 8]
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                第一型（胰島素依賴型）好發於青少年，因先天缺陷無法分泌胰島素[cite: 8]；第二型多發於成人，主因為細胞產生胰島素阻抗或分泌不足[cite: 5, 8]。大考極常要求與 Case Study 理療目標進行連動評估[cite: 1]。
              </p>
            </div>
          </div>
        </section>

        {/* 第六區：操作入口（三個按鈕） */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onStartExam(currentWeek)}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-200 shadow-sm"
          >
            <span className="text-xl mb-1">📝</span>
            <span className="block font-bold text-sm">開始模擬考</span>
          </button>

          <button
            onClick={() => alert('章節練習模式：即將為您加載 Week 1 解剖生理學獨立考點題庫。')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-200 shadow-sm"
          >
            <span className="text-xl mb-1">🎯</span>
            <span className="block font-bold text-sm">開始章節練習</span>
          </button>

          <button
            onClick={() => alert('重點整理：已為您分析並動態導出最新講義規範。請特別注意試卷一與試卷四的心血管途徑，以及術科考官對靜脈曲張禁用深層手法的口試對策[cite: 1, 8]。')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-200 shadow-sm"
          >
            <span className="text-xl mb-1">📚</span>
            <span className="block font-bold text-sm">查看本週重點整理</span>
          </button>
        </section>

      </main>
    </div>
  );
}