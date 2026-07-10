import React from 'react';
import { Section } from '../../../components/ui/Section';
import { StatusChip } from '../../../components/ui/StatusChip';

export const RoadmapSection: React.FC = () => {
  const weeks = [
    { id: 1, title: 'Week 1', label: '解剖與生理學 I', active: true },
    { id: 2, title: 'Week 2', label: '精油與植物學', active: false },
    { id: 3, title: 'Week 3', label: '精油化學', active: false },
    { id: 4, title: 'Week 4', label: '基底油與純露', active: false },
    { id: 5, title: 'Week 5', label: '病理學與禁忌症', active: false },
    { id: 6, title: 'Week 6', label: '臨床個案綜合分析', active: false },
    { id: 7, title: 'Week 7', label: '考前衝刺綜合複習', active: false },
    { id: 8, title: 'Week 8', label: '正式規格全真模擬', active: false },
  ];

  return (
    <Section title="Learning Roadmap / 8 週考綱地圖">
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
        {weeks.map((w) => (
          <div
            key={w.id}
            className={`p-4 rounded-xl border bg-white flex flex-col justify-between h-28 transition-all duration-200 ${
              w.active
                ? 'border-slate-300 shadow-sm cursor-pointer hover:border-slate-400'
                : 'border-slate-100 opacity-40 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-black ${w.active ? 'text-slate-950' : 'text-slate-400'}`}>
                  {w.title}
                </span>
                <StatusChip label={w.active ? 'Available' : 'Locked'} isActive={w.active} />
              </div>
              <p className={`text-xs font-medium mt-2 line-clamp-2 ${w.active ? 'text-slate-700' : 'text-slate-400'}`}>
                {w.label}
              </p>
            </div>
            {w.active && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-auto">
                點擊進入模組 →
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
};