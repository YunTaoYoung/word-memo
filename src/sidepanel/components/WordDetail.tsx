// src/sidepanel/components/WordDetail.tsx

import { useState } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { handleRemembered, handleNotRemembered } from '@/lib/memory-algorithm';
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

  const handleRememberClick = async () => {
    await handleRemembered(word);
  };

  const handleNotRememberClick = async () => {
    await handleNotRemembered(word);
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
    <div className="h-full overflow-auto bg-gray-50">
      {/* 返回按钮 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>←</span>
          <span>返回</span>
        </button>
      </div>

      {/* 单词详情卡片 */}
      <div className="p-4">
        <div
          className={`
            bg-white rounded-lg p-6 shadow-sm border-l-4
            ${isDeleting ? 'opacity-50' : ''}
          `}
          style={{ borderColor: levelColor }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{word.word}</h1>
              <p className="text-base text-gray-500">{word.phonetic}</p>
            </div>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 text-sm rounded"
                style={{ backgroundColor: levelColor + '20', color: levelColor }}
              >
                {levelNames[word.memoryState.level]}
              </span>
              <button
                onClick={pronounce}
                className="p-2 hover:bg-gray-100 rounded"
                title="朗读"
              >
                🔊
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 rounded text-red-500"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Definitions */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">释义：</h2>
            {word.definitions.map((def, i) => (
              <div key={i} className="mb-2">
                <span className="font-semibold text-gray-700">{def.pos}</span>{' '}
                <span className="text-gray-800">{def.meaning}</span>
              </div>
            ))}
          </div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-600 mb-3">例句：</h2>
              {word.examples.map((ex, i) => (
                <div key={i} className="mb-3">
                  <p className="text-sm italic text-gray-700 mb-1">{ex.en}</p>
                  <p className="text-xs text-gray-500">{ex.zh}</p>
                </div>
              ))}
            </div>
          )}

          {/* Etymology */}
          {word.etymology && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">词根：</h2>
              <p className="text-sm text-gray-700">{word.etymology}</p>
            </div>
          )}

          {/* Memory Stats */}
          <div className="pt-4 border-t border-gray-200 mb-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">学习统计：</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">复习次数：</span>
                <span className="font-medium text-gray-800">{word.memoryState.reviewCount}</span>
              </div>
              <div>
                <span className="text-gray-600">正确次数：</span>
                <span className="font-medium text-gray-800">{word.memoryState.correctCount}</span>
              </div>
              <div>
                <span className="text-gray-600">添加时间：</span>
                <span className="font-medium text-gray-800">
                  {new Date(word.addedDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">下次复习：</span>
                <span className="font-medium text-gray-800">
                  {new Date(word.memoryState.nextReviewDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Memory Feedback */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">❓ 是否记住了这个单词？</p>
            <div className="flex gap-3">
              <button
                onClick={handleRememberClick}
                className="flex-1 px-4 py-3 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                记住了 ✓
              </button>
              <button
                onClick={handleNotRememberClick}
                className="flex-1 px-4 py-3 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
              >
                还不熟 ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
