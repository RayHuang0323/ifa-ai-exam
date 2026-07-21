import { useState } from 'react';
import type { AiGradeInput } from '../services/aiGrading';
import { gradeWithLocalRubric } from '../utils/localRubricGrading';
import type { AiReviewRecord } from '../utils/aiReviewStore';

type HealthStatus = 'untested' | 'checking' | 'available' | 'disabled' | 'unavailable';

const healthCheckInput: AiGradeInput = {
  questionId: 33001,
  sessionId: 'coach-test-ai-health-check',
  examType: 'coach-test',
  type: 'shortAnswer',
  question: '請簡述芳療諮詢時為何需要確認禁忌症。',
  userAnswer: '因為有些身體狀況、用藥或族群不適合使用特定精油，需要先評估安全性，必要時轉介醫療專業。',
  referenceAnswer: '芳療諮詢需確認禁忌症、用藥、疾病史、孕婦兒童等族群狀態，以避免不適合的精油、濃度或使用方式，並在需要時轉介醫療專業。',
  sampleAnswer: '先確認禁忌症、用藥與疾病史，再評估孕婦、兒童等特殊族群，避免不適合的精油、濃度或用法；若超出芳療安全範圍，應停止建議並轉介醫療專業。',
  keyPoints: ['確認禁忌症', '確認用藥與疾病史', '評估特殊族群', '避免不安全用油', '必要時轉介醫療專業'],
  rubric: [
    { score: 3, label: '掌握', requirement: '涵蓋主要安全評估與轉介界線，且沒有危險建議。' },
    { score: 2, label: '大致掌握', requirement: '涵蓋多數核心重點，但有小幅缺漏。' },
    { score: 1, label: '部分掌握', requirement: '提到部分安全概念，但漏掉主要評估或轉介重點。' },
    { score: 0, label: '未掌握', requirement: '空白、偏題、出現明顯錯誤或危險建議。' },
  ],
  category: '諮詢流程／個案評估',
  sourceLabel: 'Sprint 33 固定健康檢查題（非正式題）',
  sourceFile: 'Sprint 33 測試資料',
  sourcePage: '待補',
  riskLevel: 'safety_review',
  practiceOnly: true,
  formalScoreEligible: false,
};

const statusLabel: Record<HealthStatus, string> = {
  untested: '尚未測試',
  checking: '測試中',
  available: '可用',
  disabled: '尚未啟用',
  unavailable: '暫時不可用',
};

const confidenceLabel = (confidence: AiReviewRecord['confidence']) => confidence === 'high' ? '高' : confidence === 'medium' ? '中' : '低';

export default function AiGradingHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('untested');
  const [message, setMessage] = useState('');
  const [review, setReview] = useState<AiReviewRecord | null>(null);

  const runCheck = async () => {
    setStatus('checking');
    setMessage('');
    setReview(null);
    const result = gradeWithLocalRubric(healthCheckInput);
    setStatus('available');
    setReview(result);
  };

  return (
    <section data-testid="ai-grading-health-check" className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-indigo-950">規準輔助評分檢查</h2>
          <p className="mt-1 text-sm text-indigo-900">只在 Coach 測試模式使用固定安全題，直接在瀏覽器執行，不會寫入正式成績或題庫。</p>
        </div>
        <span data-testid="ai-grading-health-status" className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-900">{statusLabel[status]}</span>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-white/70 px-4 py-3 text-sm text-indigo-950"><p><strong>本機規準評分：</strong>可用</p><p><strong>遠端 AI：</strong>未啟用（未來選配）</p></div>
      <button data-testid="ai-grading-health-button" onClick={() => void runCheck()} disabled={status === 'checking'} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
        {status === 'checking' ? '規準評分中' : '執行規準評分檢查'}
      </button>
      {message && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{message}</p>}
      {review && <div data-testid="ai-grading-health-result" className="rounded-xl border border-indigo-200 bg-white p-4 space-y-2 text-sm text-slate-700">
        <p><strong>掌握程度：</strong>{review.aiReviewLabel}</p>
        <p><strong>建議分數：</strong>{review.aiScoreDisplay}</p>
        <p><strong>命中的重點：</strong>{review.matchedKeyPoints.length ? review.matchedKeyPoints.join('、') : '無'}</p>
        <p><strong>漏掉的重點：</strong>{review.missingKeyPoints.length ? review.missingKeyPoints.join('、') : '無'}</p>
        <p><strong>風險提醒：</strong>{review.riskFlags.length ? review.riskFlags.join('、') : '無'}</p>
        <p><strong>補強建議：</strong>{review.feedback}</p>
        <p><strong>參考依據：</strong>{review.sourceBasis.join('、')}</p>
        <p><strong>評分方式：</strong>{review.gradingMethodLabel}</p>
        <p><strong>信心程度：</strong>{confidenceLabel(review.confidence)}</p>
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-950">此分數由參考答案與評分重點進行規則比對，僅供學習參考，無法完整理解所有同義表達。</p>
      </div>}
    </section>
  );
}
