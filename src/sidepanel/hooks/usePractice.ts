// src/sidepanel/hooks/usePractice.ts

import { useState, useCallback } from 'react';
import type { PracticeSession, PracticeQuestion } from '@/types';
import { selectWordsForPractice, updateWordAfterPractice } from '@/lib/memory-algorithm';
import { getVocabulary } from '@/lib/storage';
import { generatePracticeQuestion } from '@/background/llm-client';

/**
 * 练习状态管理 Hook
 */
export function usePractice() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    selectedAnswer?: string;
    correctAnswer: string;
    explanation: string;
  } | null>(null);

  // 开始练习
  const startPractice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 加载词库
      const vocabulary = await getVocabulary();
      const wordsArray = Array.from(vocabulary.values());

      // 选词
      const selectedWords = selectWordsForPractice(wordsArray);

      if (selectedWords.length === 0) {
        setError('没有可练习的单词');
        setLoading(false);
        return;
      }

      // 生成选择题
      const questions: PracticeQuestion[] = await Promise.all(
        selectedWords.map(async (word) => {
          return await generatePracticeQuestion(word.word, {
            definitions: word.definitions,
            examples: word.examples,
          }, 'choice');
        })
      );

      // 创建会话
      const newSession: PracticeSession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        questions,
        currentIndex: 0,
        correctCount: 0,
        startedAt: new Date(),
      };

      setSession(newSession);
      setAnswerResult(null);
    } catch (err: any) {
      setError(err.message || '启动练习失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 提交答案
  const submitAnswer = useCallback(async (selectedAnswer: string) => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentIndex];
    const isCorrect = checkAnswer(selectedAnswer, currentQuestion.correctAnswer);

    // 显示结果
    setAnswerResult({
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
    });

    // 更新单词状态
    const vocabulary = await getVocabulary();
    const word = vocabulary.get(currentQuestion.word);
    if (word) {
      await updateWordAfterPractice(word, isCorrect);
    }

    // 更新会话计数
    if (isCorrect) {
      setSession({
        ...session,
        correctCount: session.correctCount + 1,
      });
    }
  }, [session]);

  // 下一题
  const nextQuestion = useCallback(() => {
    if (!session) return;

    if (session.currentIndex >= session.questions.length - 1) {
      // 练习完成
      setSession(null);
      setAnswerResult(null);
    } else {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
      });
      setAnswerResult(null);
    }
  }, [session]);

  // 退出练习
  const exitPractice = useCallback(() => {
    setSession(null);
    setAnswerResult(null);
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    answerResult,
    hasSession: !!session,
    startPractice,
    submitAnswer,
    nextQuestion,
    exitPractice,
  };
}

/**
 * 检查答案是否正确（忽略大小写和首尾空格）
 */
function checkAnswer(selected: string, correct: string): boolean {
  return selected.trim().toLowerCase() === correct.trim().toLowerCase();
}
