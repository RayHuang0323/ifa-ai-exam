import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Section } from '../../../components/ui/Section';

export const MissionSection: React.FC = () => {
  // Reserved: 用於儲存任務打勾狀態的 state 與 localStorage 綁定
  
  return (
    <Section title="Today's Mission / 今日任務">
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <input type="checkbox" className="mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 w-4 h-4" defaultChecked />
            <div>
              <span className="block text-sm font-medium text-slate-800 line-through opacity-60">精讀精油與解剖基礎</span>
              <span className="block text-xs text-slate-400 mt-0.5">Week 1 學綱與考古題範圍</span>
            </div>
          </label>
          
          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <input type="checkbox" className="mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 w-4 h-4" />
            <div>
              <span className="block text-sm font-medium text-slate-800">完成第一階段模擬考</span>
              <span className="block text-xs text-slate-400 mt-0.5">40 題・計時 45 分鐘</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <input type="checkbox" className="mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 w-4 h-4" />
            <div>
              <span className="block text-sm font-medium text-slate-800">高頻錯題本交叉複習</span>
              <span className="block text-xs text-slate-400 mt-0.5">強化對「突觸、離子傳導」辨析</span>
            </div>
          </label>
        </div>
      </Card>
    </Section>
  );
};