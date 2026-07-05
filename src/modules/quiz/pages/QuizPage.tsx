import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { quizApi } from '../api/quiz.api';
import type { QuizQuestion } from '../api/quiz.api';
import { Loader2, Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const QuizPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const [searchParams] = useSearchParams();
  const careerId = searchParams.get('careerId');
  const stepId = searchParams.get('stepId');
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  // Timer setup (e.g., 15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  // const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isPassed: boolean; score: number; totalQuestions: number; percentageScore: number } | null>(null);

  useEffect(() => {
    if (!skillId) return;
    const fetchQuestions = async () => {
      try {
        const response = await quizApi.getQuizzes(skillId);
        setQuestions(response.data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [skillId]);

  useEffect(() => {
    if (loading || result) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, result]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!skillId || !careerId || !stepId) {
      setError('Missing required parameters for submission.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await quizApi.submitQuiz({
        careerId,
        stepId,
        skillId,
        answers
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="text-destructive font-bold text-xl">Lỗi tải dữ liệu</div>
        <div className="text-muted-foreground">{error}</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-primary-foreground rounded">Quay lại</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 border-2 border-foreground bg-background rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          {result.isPassed ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-3xl font-bold font-mono uppercase">
            {result.isPassed ? 'Chúc mừng!' : 'Chưa đạt yêu cầu'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {result.isPassed 
              ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra.' 
              : 'Bạn cần đạt ít nhất 80% để qua bài. Hãy ôn tập và thử lại nhé.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border-2 border-foreground rounded text-center">
            <div className="text-sm font-bold uppercase mb-1">Tổng điểm</div>
            <div className="text-2xl font-mono">{result.percentageScore.toFixed(0)}%</div>
          </div>
          <div className="p-4 border-2 border-foreground rounded text-center">
            <div className="text-sm font-bold uppercase mb-1">Số câu đúng</div>
            <div className="text-2xl font-mono">{result.score} / {result.totalQuestions}</div>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/roadmap/${careerId}`)} 
          className="w-full py-3 font-mono font-bold text-sm uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Quay lại lộ trình học
        </button>
      </div>
    );
  }

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-mono uppercase">Bài Kiểm Tra</h1>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 border-2 border-foreground rounded ${timeLeft < 60 ? 'text-red-500 border-red-500' : ''}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold font-mono mb-2">
          <span>Tiến độ</span>
          <span>{answeredCount} / {questions.length} câu</span>
        </div>
        <div className="w-full h-3 border-2 border-foreground rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="p-8 border-2 border-foreground bg-background rounded-[8px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 min-h-[300px]">
        <div className="flex gap-2 items-center mb-6">
          <span className="px-3 py-1 bg-primary/10 text-primary font-bold font-mono text-sm border-2 border-primary rounded">Câu {currentIndex + 1}</span>
          <span className={`px-3 py-1 text-xs font-bold font-mono border-2 rounded ${
            currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-700 border-green-700' :
            currentQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-700' :
            'bg-red-100 text-red-700 border-red-700'
          }`}>
            {currentQuestion.difficulty}
          </span>
        </div>

        <h3 className="text-xl font-medium mb-8 leading-relaxed">
          {currentQuestion.questionText}
        </h3>

        <div className="flex flex-col gap-4">
          {currentQuestion.options.map((opt, i) => (
            <label 
              key={i} 
              className={`flex items-center p-4 border-2 cursor-pointer transition-all rounded-[4px] ${
                answers[currentQuestion.id] === i 
                  ? 'border-primary bg-primary/5 shadow-[2px_2px_0px_0px_var(--theme-primary)] translate-x-[-2px] translate-y-[-2px]' 
                  : 'border-muted-foreground/30 hover:border-foreground hover:bg-muted'
              }`}
            >
              <input 
                type="radio" 
                name={`question-${currentQuestion.id}`} 
                className="hidden" 
                checked={answers[currentQuestion.id] === i}
                onChange={() => handleSelectOption(currentQuestion.id, i)}
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${answers[currentQuestion.id] === i ? 'border-primary bg-primary' : 'border-muted-foreground/50'}`}>
                {answers[currentQuestion.id] === i && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
              </div>
              <span className="text-base">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {currentIndex === questions.length - 1 ? (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount < questions.length}
            className="flex items-center gap-2 px-8 py-3 font-mono font-bold text-sm uppercase tracking-wider border-2 border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Nộp bài
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-muted transition-all"
          >
            Tiếp theo <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
