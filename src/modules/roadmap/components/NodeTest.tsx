import React, { useState } from 'react';
import { progressApi } from '../api/progress.api';

// Giả lập câu hỏi mẫu. Thực tế sau này có thể lấy từ API của backend
const MOCK_QUESTIONS = [
  {
    id: 1,
    content: "Khái niệm cốt lõi nào quan trọng nhất khi bắt đầu học chủ đề này?",
    options: ["Syntax", "Architecture", "Best Practices", "Design Patterns"],
    correctAnswerIndex: 0
  },
  {
    id: 2,
    content: "Lợi ích chính của việc áp dụng kiến thức này vào thực tế là gì?",
    options: ["Giảm thời gian code", "Tăng tính bảo mật", "Tối ưu hóa hiệu suất", "Tất cả các ý trên"],
    correctAnswerIndex: 3
  }
];

interface NodeTestProps {
  careerId: string;
  stepId: string;
  onCompleteSuccess: () => void;
}

export const NodeTest: React.FC<NodeTestProps> = ({ careerId, stepId, onCompleteSuccess }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [testResult, setTestResult] = useState<{ score: number; isPassed: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    // Reset kết quả nếu người dùng thay đổi câu trả lời
    if (testResult) setTestResult(null);
  };

  const calculateScoreLocally = () => {
    let correctCount = 0;
    MOCK_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleSubmitTest = async () => {
    const score = calculateScoreLocally();
    const totalQuestions = MOCK_QUESTIONS.length;
    
    // Validate số lượng câu trả lời
    if (Object.keys(selectedAnswers).length < totalQuestions) {
      setErrorMsg('Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // FE check trước (như yêu cầu TXWCSTL-66)
      const percentage = (score / totalQuestions) * 100;
      const passed = percentage >= 80;
      
      setTestResult({ score, isPassed: passed });

      if (!passed) {
        setIsSubmitting(false);
        return; // Không gọi API nếu chưa đủ điểm
      }

      // Gọi API nộp bài (áp dụng cho Task TXWCSTL-64)
      const response = await progressApi.submitTest({
        careerId,
        stepId,
        score,
        totalQuestions,
        answers: selectedAnswers
      });

      const result = response.data;

      if (result.success && result.data.isPassed) {
        onCompleteSuccess(); // Báo cho component cha cập nhật UI
      } else {
        setErrorMsg(result.message || 'Có lỗi xảy ra khi cập nhật kết quả.');
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 p-5 border border-foreground bg-background rounded-[4px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <h4 className="font-mono font-bold uppercase text-sm mb-4 border-b border-dashed border-foreground pb-2">
        Bài Kiểm Tra: Điều kiện hoàn thành
      </h4>
      
      {errorMsg && (
        <div className="mb-4 text-xs font-mono bg-destructive/10 text-destructive border border-destructive p-2 rounded-[2px]">
          {errorMsg}
        </div>
      )}

      {MOCK_QUESTIONS.map((q, index) => (
        <div key={q.id} className="mb-5">
          <p className="font-sans text-sm font-semibold mb-2 text-foreground">Câu {index + 1}: {q.content}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <label 
                key={i} 
                onClick={() => handleSelectOption(q.id, i)}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-[2px] border transition-colors ${
                  selectedAnswers[q.id] === i 
                    ? 'border-primary bg-primary/5 text-primary font-medium' 
                    : 'border-transparent hover:bg-muted text-muted-foreground'
                }`}
              >
                <div className={`w-3 h-3 rounded-full border border-foreground flex items-center justify-center ${selectedAnswers[q.id] === i ? 'bg-primary border-primary' : ''}`} />
                <span className="text-xs">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {testResult && (
        <div className={`p-3 rounded-[2px] mb-4 text-xs font-mono font-bold border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
          testResult.isPassed 
            ? 'bg-green-100 border-green-800 text-green-900' 
            : 'bg-red-100 border-red-800 text-red-900'
        }`}>
          <div>Điểm của bạn: {testResult.score}/{MOCK_QUESTIONS.length}</div>
          <div className="mt-1 font-sans font-normal text-[11px]">
            {testResult.isPassed 
              ? 'Tuyệt vời! Bạn đã đủ điều kiện để hoàn thành.' 
              : 'Bạn cần đạt tối thiểu 80% để qua bài. Vui lòng làm lại.'}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmitTest}
        disabled={isSubmitting || Object.keys(selectedAnswers).length < MOCK_QUESTIONS.length}
        className={`w-full py-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
          testResult?.isPassed ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
        }`}
      >
        {isSubmitting ? 'Đang chấm điểm...' : (testResult?.isPassed ? 'Xác nhận hoàn thành' : 'Nộp bài & Chấm điểm')}
      </button>
    </div>
  );
};
