// src/sidepanel/components/WordDetail.tsx

import { useState } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { deleteWord } from '@/lib/storage';
import { MEMORY_COLORS } from '@/lib/constants';

interface WordDetailProps {
  word: WordData;
  onBack: () => void;
  onDeleted: () => void;
}

export default function WordDetail({ word, onBack, onDeleted }: WordDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const levelColor = MEMORY_COLORS[word.memoryState.level];

  const levelNames = {
    [MemoryLevel.NEW]: '新词',
    [MemoryLevel.FAMILIAR]: '有印象',
    [MemoryLevel.LEARNING]: '学习中',
    [MemoryLevel.MASTERED]: '已掌握',
    [MemoryLevel.ARCHIVED]: '已归档',
  };

  const handleDelete = async () => {
    if (!confirm(`确定删除单词 "${word.word}"？\n该操作不可撤销。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWord(word.word);
      onDeleted();
    } catch (error) {
      alert('删除失败：' + error);
    } finally {
      setIsDeleting(false);
    }
  };

  const pronounce = () => {
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      {/* 返回按钮 */}
      <div className="glass border-b border-gray-200/80 px-5 py-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:text-primary-600
                     hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>返回</span>
        </button>
      </div>

      {/* 单词详情卡片 */}
      <div className="flex-1 overflow-auto p-5">
        <div
          className={`
            bg-white rounded-3xl p-6 shadow-soft-lg border-l-4
            ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
          `}
          style={{ borderColor: levelColor }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{word.word}</h1>
              <p className="text-base text-gray-500">{word.phonetic}</p>
            </div>
            <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
              {/* 状态标记 - 上一行 */}
              <span
                className="badge"
                style={{
                  backgroundColor: levelColor + '15',
                  color: levelColor,
                  border: `1px solid ${levelColor}30`
                }}
              >
                {levelNames[word.memoryState.level]}
              </span>
              {/* 播放读音和删除按钮 - 下一行，右对齐 */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={pronounce}
                  className="icon-btn"
                  title="朗读"
                  aria-label="朗读单词"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="icon-btn hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="删除"
                  aria-label="删除单词"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Definitions */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">释义</h2>
            </div>
            <div className="space-y-3">
              {word.definitions.map((def, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-primary-600 flex-shrink-0">{def.pos}</span>
                  <span className="text-gray-800 leading-relaxed">{def.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <div className="mb-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">例句</h2>
              </div>
              <div className="space-y-4">
                {word.examples.map((ex, i) => (
                  <div key={i} className="pl-6 border-l-2 border-primary-200 hover:border-primary-400 transition-colors">
                    <p className="text-sm italic text-gray-700 leading-relaxed mb-2">{ex.en}</p>
                    <p className="text-xs text-gray-500">{ex.zh}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etymology */}
          {word.etymology && (
            <div className="mb-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">词根</h2>
                  <p className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-xl">{word.etymology}</p>
                </div>
              </div>
            </div>
          )}

          {/* Memory Stats */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">学习统计</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">复习次数</p>
                <p className="text-2xl font-bold text-primary-600">{word.memoryState.reviewCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">正确次数</p>
                <p className="text-2xl font-bold text-green-600">{word.memoryState.correctCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">添加时间</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(word.addedDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">下次复习</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(word.memoryState.nextReviewDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
