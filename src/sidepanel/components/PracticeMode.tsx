// src/sidepanel/components/PracticeMode.tsx

import type { PracticeQuestion } from '@/types';
import { usePractice } from '../hooks/usePractice';

export default function PracticeMode() {
  const {
    session,
    loading,
    error,
    answerResult,
    startPractice,
    submitAnswer,
    nextQuestion,
    exitPractice,
  } = usePractice();

  // 加载中状态
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600">正在准备练习...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={exitPractice} className="btn-secondary">
          返回词库
        </button>
      </div>
    );
  }

  // 无练习会话时显示开始按钮
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-primary-500 mb-4">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">单词练习</h2>
        <p className="text-gray-500 text-center mb-6 max-w-xs">
          通过练习巩固记忆，每次最多 5 道选择题
        </p>
        <button onClick={startPractice} className="btn-primary">
          开始练习
        </button>
        <button onClick={exitPractice} className="btn-secondary mt-3">
          取消
        </button>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentIndex];
  const isLastQuestion = session.currentIndex >= session.questions.length - 1;

  return (
    <div className="py-4">
      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>练习 ({session.currentIndex + 1}/{session.questions.length})</span>
          <span>正确: {session.correctCount}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((session.currentIndex + 1) / session.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <ChoiceQuestionDisplay
          question={currentQuestion}
          answerResult={answerResult}
          onSubmit={submitAnswer}
        />
      </div>

      {/* 操作按钮 */}
      {answerResult && (
        <div className="mt-4 flex justify-end">
          <button onClick={nextQuestion} className="btn-primary">
            {isLastQuestion ? '查看结果' : '下一题'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 选择题展示组件
 */
function ChoiceQuestionDisplay({
  question,
  answerResult,
  onSubmit,
}: {
  question: PracticeQuestion;
  answerResult: {
    isCorrect: boolean;
    selectedAnswer?: string;
    correctAnswer: string;
    explanation: string;
  } | null;
  onSubmit: (answer: string) => void;
}) {
  const handleChoiceClick = (option: string) => {
    if (answerResult) return;
    onSubmit(option);
  };

  return (
    <div>
      {/* 题干 */}
      <div className="mb-6">
        <p className="text-lg text-gray-900 leading-relaxed">{question.question}</p>
      </div>

      {/* 选择题选项 */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = answerResult?.selectedAnswer === option;
          const isCorrect = option === answerResult?.correctAnswer;
          const showResult = answerResult !== null;

          let optionClass = 'option-btn';
          if (showResult) {
            if (isCorrect) {
              optionClass = 'option-btn correct';
            } else if (isSelected && !isCorrect) {
              optionClass = 'option-btn wrong';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleChoiceClick(option)}
              disabled={showResult}
              className={optionClass}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium mr-3">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
              {showResult && isCorrect && (
                <svg className="w-5 h-5 ml-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {showResult && isSelected && !isCorrect && (
                <svg className="w-5 h-5 ml-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* 答题结果 */}
      {answerResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          answerResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              answerResult.isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {answerResult.isCorrect ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-medium ${answerResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {answerResult.isCorrect ? '正确！' : '错误'}
              </p>
              {!answerResult.isCorrect && (
                <p className="text-red-700 mt-1">
                  正确答案: <strong>{answerResult.correctAnswer}</strong>
                </p>
              )}
              <p className="text-gray-600 mt-2 text-sm">{answerResult.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
