import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Section } from '../../../components/ui/Section';

export const CoachSection: React.FC = () => {
  return (
    <Section title="AI Master Coach / 今日提示">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 border-none p-5 relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
          <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-white/10 text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-300">考官臨床策略提醒</h3>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300/90 leading-relaxed">
            <p><strong className="text-white">今日提醒：</strong> 不要使用笼统死記的安全牌配方，面對考核，考官更期待你展現解決具體病理的能力 [cite: 35, 71, 112]。</p>
            <p><strong className="text-white">AI 建議：</strong> 在小腿前方（脛骨區）切勿使用擰壓（Wringing）技巧，這是極骨感的區域 [cite: 17, 52, 93]。</p>
            <p><strong className="text-white">重點提示：</strong> 腹部已取消旋轉拳頭技巧。只允許輕撫、揉捏、手交替拉動與順時針摩擦 [cite: 27, 29, 64, 105]。</p>
          </div>
        </div>
      </Card>
    </Section>
  );
};