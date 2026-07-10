import React from 'react';
import { Section } from '../../../components/ui/Section';
import { ProgressCard } from '../../../components/ui/ProgressCard';

export const ProgressSection: React.FC = () => {
  // TODO Sprint07: 連接 localStorage 中的學習歷史與各 Week 進度
  // const examHistory = localStorage.getItem('ifa_exam_history');
  
  return (
    <Section title="目前學習進度">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProgressCard
          title="Week 1"
          subtitle="Module A"
          percentage={25}
          remainingText="尚有：人體神經叢、解剖學期末考核題目等內容"
        />
        <ProgressCard
          title="臨床配方思維"
          subtitle="Syllabus"
          percentage={0}
          remainingText="尚未解鎖：面對嚴格考官的高階避險與理療配置調油"
        />
      </div>
    </Section>
  );
};