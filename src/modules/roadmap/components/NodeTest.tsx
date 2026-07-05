import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NodeTestProps {
  careerId: string;
  stepId: string;
  onCompleteSuccess: () => void;
}

export const NodeTest: React.FC<NodeTestProps> = ({ careerId, stepId }) => {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    // Navigate to QuizPage, passing stepId as skillId to match backend expectation,
    // and passing careerId and stepId as query params.
    navigate(`/quiz/${stepId}?careerId=${careerId}&stepId=${stepId}`);
  };

  return (
    <div className="mt-6 p-5 border border-foreground bg-background rounded-[4px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <h4 className="font-mono font-bold uppercase text-sm mb-4 border-b border-dashed border-foreground pb-2">
        Bài Kiểm Tra Đánh Giá Năng Lực
      </h4>
      
      <p className="font-sans text-sm mb-6 text-muted-foreground">
        Để hoàn thành bài học này, bạn cần thực hiện một bài kiểm tra ngắn. 
        Bài kiểm tra gồm 10 câu hỏi ngẫu nhiên bám sát nội dung chuyên môn. 
        Bạn cần đạt tối thiểu <strong>80%</strong> để vượt qua.
      </p>

      <button
        onClick={handleStartQuiz}
        className="w-full py-3 font-mono font-bold text-sm uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Bắt đầu làm bài kiểm tra
      </button>
    </div>
  );
};
