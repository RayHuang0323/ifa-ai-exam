import { useState, useEffect } from 'react';

interface HomeProps {
  onStartExam: (week: number) => void;
}

export default function Home({ onStartExam }: HomeProps) {
  // 1. 系統考試日期設定（可由考生自行調整，此處預設為 2026 年 10 月 12 日）
  const [examDate] = useState<string>('2026-10-12');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // 2. 當前週次與主題（未來可由系統狀態或日期動態偵測切換，此處依據教材進度綁定 Week 1）
  const [currentWeek] = useState<number>(1);
  const [weekSubject] = useState<string>('人體解剖學與生理學 (Anatomy and Physiology)');

  // 自動計算距離考試賸餘天數
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

  // 3. 本週必考重點（動態提取自：黛田講義、解剖學期末試卷、考古題核心病理考點）
  const [mustStudyPoints] = useState([
    {
      stars: 5,
      title: '心血管循環系統與途徑',
      source: '【解剖學期末考核(一)解答 / 試卷二 / 試卷四解答】',
      detail: '必須熟記缺氧血由上下腔靜脈入右心房，經三尖瓣入右心室，再經肺動脈瓣至肺臟進行交換，充氧血經肺靜脈注入左心房，過二尖瓣至左心室，最後經主動脈運行全身的完整途徑。'
    },
    {
      stars: 5,
      title: '淋巴液進入血液循環的過程與機制',
      source: '【解剖學期末考核(一)解答 / 試卷四解答】',
      detail: '組織間流體 $\\rightarrow$ 微淋巴管末梢 $\rightarrow$ 淋巴管 $\rightarrow$ 淋巴結 $\rightarrow$ 淋巴幹 $\rightarrow$ 胸管或右淋巴管 $\rightarrow$ 最終匯入「鎖骨下靜脈」流回血液循環。'
    },
    {
      stars: 5,
      title: '尿液在腎臟形成的流經步驟排序',
      source: '【解剖學期末考核(一)解答 / 試卷三】',
      detail: '排序題必考：腎臟 $\rightarrow$ 乳突狀管道 $\rightarrow$ 腎小盞 $\rightarrow$ 腎大盞 $\rightarrow$ 腎盂 $\rightarrow$ 輸尿管 $\rightarrow$ 膀胱 $\rightarrow$ 尿道口 $\rightarrow$ 外部環境。'
    },
    {
      stars: 5,
      title: '第一型與第二型糖尿病之病因與控制鑑別',
      source: '【解剖學期末試卷(三) / 試卷四解答】',
      detail: '第一型好發於青少年，因先天缺陷無法分泌胰島素，屬胰島素依賴型；第二型多發於成人，主因為細胞阻抗排斥或產生不足，通常服用藥物或調整生活控制。'
    },
    {
      stars: 4,
      title: '臨床病症名詞解釋與輔助醫療資格考點',
      source: '【解剖學期末考核(一)解答 / 術科實踐考核考官建議】',
      detail: '包括應激性腸道綜合症(IBS)成因、纖維炎、帶狀疱疹、腕管綜合症、痛風、帕金森氏症與更年期症狀。注意考官極度重視選油理由與治療效果的化學成分對應，禁止使用笼統回答。'
    }
  ]);

  // 4. 今日任務狀態
  const [tasks, setTasks] = useState([
    { id: 1, text: '精讀本週重點：心血管循環與淋巴回流途徑', done: false, type: 'read' },
    { id: 2, text: '完成一組 Week 1 生理解剖官方標準模擬考', done: false, type: 'practice' },
    { id: 3, text: '檢討錯題解析，確認是否死記千篇一律的安全牌配方', done: false, type: 'review' }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 頂端全局狀態 Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">IFA Master Coach</h1>
              <p className="text-xs text-slate-500 font-mono">科學化精準備考系統</p>
            </div>
          </div>
          {/* 第一區：考試倒數日期與天數 */}
          <div className="flex items-center space-x-4 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full shadow-inner">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 font-mono">大考倒數</span>
            <div className="h-4 w-px bg-indigo-200"></div>
            <span className="text-lg font-black text-indigo-900 font-mono">{daysRemaining} 天</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* 頂部雙欄區塊：進度主軸 & 今日任務 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 左欄：第二區 & 第三區（本週進度面板） */}
          <section className="md:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 text-9xl text-indigo-800 opacity-20 font-mono font-bold select-none transition-transform group-hover:scale-110 duration-500">
              W{currentWeek}
            </div>
            <div className="space-y-2 relative z-10">
              <span className="inline-block bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                本週進度
              </span>
              <h2 className="text-3xl font-black font-mono tracking-tight">Week {currentWeek}</h2>
              <div className="h-px bg-indigo-500/20 my-3"></div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                {weekSubject}
              </p>
            </div>
            
            {/* 第五區：考試卷靜態規格規格顯示 */}
            <div className="mt-8 pt-4 border-t border-indigo-500/20 grid grid-cols-3 gap-2 text-center relative z-10 font-mono">
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">題數</p>
                <p className="text-sm font-bold text-white">25 題</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">時間</p>
                <p className="text-sm font-bold text-white">90 分</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">難度</p>
                <p className="text-sm font-bold text-amber-400">中高</p>
              </div>
            </div>
          </section>

          {/* 右欄：今日任務區塊 */}
          <section className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-900 flex items-center space-x-2">
                  <span>📅</span> <span>今日備考任務</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {tasks.filter(t => t.done).length} / {tasks.length}已完成
                </span>
              </div>
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      task.done
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded-md border text-xs transition-colors ${
                      task.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {task.done && '✓'}
                    </div>
                    <span className="text-sm leading-normal font-medium">{task.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Coach 建議區塊 */}
            <div className="mt-4 p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl flex items-start space-x-3">
              <span className="text-base mt-0.5">💡</span>
              <div className="text-xs leading-relaxed text-amber-900">
                <strong className="font-semibold block text-amber-950 mb-0.5">AI 今日提醒：</strong>
                面對歐美專業考官，調油策略切忌打死記唯一的安全牌，必須針對諮詢結果給出直接解決病理問題的化學成分與臨床理由。
              </div>
            </div>
          </section>
        </div>

        {/* 第四區：本週必考重點整理（動態提取與標註教材來源） */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔥</span>
            <h3 className="text-md font-bold text-slate-900">本週大考核心焦點觀念與講義來源</h3>
          </div>
          <div className="divide-y divide-slate-100 font-sans">
            {mustStudyPoints.map((point, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-amber-500 tracking-tighter">
                      {'★'.repeat(point.stars)}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{point.title}</h4>
                  </div>
                  <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                    {point.source}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 pl-0">
                  {point.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 第六區：操作入口導覽（全按鈕設計，無文字輸入） */}
        <footer className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>⚡</span> <span>快捷行動入口</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              onClick={() => onStartExam(currentWeek)}
              className="group flex flex-col justify-between items-center text-center p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-300 shadow-sm transform hover:-translate-y-0.5"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</span>
              <div>
                <span className="block font-bold text-sm">開始全真模擬考</span>
                <span className="block text-[11px] text-slate-500 group-hover:text-indigo-200 mt-0.5 font-mono">限時 90 分鐘 / 25 題</span>
              </div>
            </button>

            <button
              onClick={() => alert('章節练习模式將依據本週四大系統（心血管、淋巴、泌尿、內分泌）考點出題，正在為您載入獨立題庫...')}
              className="group flex flex-col justify-between items-center text-center p-5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-300 shadow-sm transform hover:-translate-y-0.5"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🎯</span>
              <div>
                <span className="block font-bold text-sm">開始章節練習</span>
                <span className="block text-[11px] text-slate-400 group-hover:text-indigo-200 mt-0.5 font-mono">分專題：解剖生理學</span>
              </div>
            </button>

            <button
              onClick={() => alert('已動態彙整講義核心觀念！建議優先複習：\n1. 試卷一與試卷四：心血管循環與半月瓣音\n2. 講義建議：靜脈曲張個案局部按摩禁忌口試對策')}
              className="group flex flex-col justify-between items-center text-center p-5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white transition-all duration-300 shadow-sm transform hover:-translate-y-0.5"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📚</span>
              <div>
                <span className="block font-bold text-sm">查看本週重點整理</span>
                <span className="block text-[11px] text-slate-400 group-hover:text-indigo-200 mt-0.5 font-mono">動態分析講義觀念</span>
              </div>
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
}