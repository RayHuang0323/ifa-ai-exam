import React from 'react';
import { Section } from '../../../components/ui/Section';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InfoCard } from '../../../components/ui/InfoCard';

interface RecentActivitySectionProps {
  hasHistory: boolean;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ hasHistory }) => {
  return (
    <Section title="Recent Activity / 歷史考核表現">
      {!hasHistory ? (
        <EmptyState
          title="暫無考核活動紀錄"
          description="你完成的任何模擬卷或測驗，其正確率、平均得分與強弱項數據分析都將顯示於此。"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard label="最近測驗正確率" value="--" description="暫無數據" />
          <InfoCard label="歷史平均成績" value="--" description="及格標準 65 分" />
          <InfoCard label="最高考核得分" value="--" description="滿分 100 分" />
          <InfoCard label="最近一次測驗" value="尚未進行" />
        </div>
      )}
    </Section>
  );
};