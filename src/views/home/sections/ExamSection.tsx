import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Section } from '../../../components/ui/Section';

interface ExamSectionProps {
  onStartExam: () => void;
}

export const ExamSection: React.FC<ExamSectionProps> = ({ onStartExam }) => {
  return (
    <Section title="Exam Center / 考核模擬中心">
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">IFA 階段性學科實踐複核卷</h3>
            <Badge variant="info">學綱標準題型</Badge>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            比照 IFA 官方 Assessment 要求：涵蓋單選、多選、配對、簡答、Case Study。全面驗證對「解剖生理學」與「精油混摻毒性」的掌握度。
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 pt-1">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"/> 40 題</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"/> 45 分鐘</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"/> 難度：中高</span>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row sm:flex-col gap-2 min-w-[140px]">
          <Button onClick={onStartExam} variant="primary" className="w-full">
            開始測驗
          </Button>
          {/* Reserved: 未來擴充更多模式 */}
          <Button variant="outline" className="w-full opacity-40 cursor-not-allowed text-xs py-1.5" disabled>
            Practice 練習模式
          </Button>
        </div>
      </Card>
    </Section>
  );
};