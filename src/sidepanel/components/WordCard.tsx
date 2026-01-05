// src/sidepanel/components/WordCard.tsx

import { useState, useEffect, useRef } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { handleRemembered, handleNotRemembered } from '@/lib/memory-algorithm';
import { deleteWord } from '@/lib/storage';
import { MEMORY_COLORS } from '@/lib/constants';

interface WordCardProps {
  word: WordData;
  highlighted?: boolean;
  focused?: boolean; // 是否聚焦(展开)
  onDeleted?: () => void;
  onFocus?: () => void; // 聚焦回调
  onCollapse?: () => void; // 折叠回调
}

export default function WordCard({
  word,
  highlighted = false,
  focused = false,
  onDeleted,
  onFocus,
  onCollapse,
}: WordCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 当高亮时滚动到视图中（收缩状态）
  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [highlighted]);

  // 当聚焦时，展开后确保完全可见
  useEffect(() => {
    if (focused && cardRef.current) {
      // 等待展开动画完成后再滚动
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest', // 使用 nearest 避免不必要的滚动
          });
        }
      }, 300); // 等待 CSS transition 完成
    }
  }, [focused]);

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
      onDeleted?.();
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

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不处理卡片点击
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // 移除整个卡片的点击处理逻辑
    // 现在只有折叠标志可以触发展开/折叠
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡

    // 如果已经聚焦(展开)，则折叠
    if (focused) {
      onCollapse?.();
    } else {
      // 否则展开
      onFocus?.();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        word-card
        word-card-level-${word.memoryState.level}
        ${highlighted ? 'ring-4 ring-blue-500 animate-pulse' : ''}
        ${focused ? 'ring-2 ring-blue-400' : ''}
        ${isDeleting ? 'opacity-50' : ''}
        mb-3 transition-all duration-300
      `}
      style={{ borderColor: levelColor }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* 折叠/展开标志 - 可点击区域 */}
          <span
            onClick={handleToggleClick}
            className="text-gray-400 select-none cursor-pointer hover:text-gray-600 transition-colors p-1 -m-1"
            title={focused ? '折叠' : '展开'}
          >
            {focused ? '▼' : '▶'}
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{word.word}</h3>
            <p className="text-sm text-gray-500">{word.phonetic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span
            className="px-2 py-1 text-xs rounded"
            style={{ backgroundColor: levelColor + '20', color: levelColor }}
          >
            {levelNames[word.memoryState.level]}
          </span>
          <button
            onClick={pronounce}
            className="p-1 hover:bg-gray-100 rounded"
            title="朗读"
          >
            🔊
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-100 rounded text-red-500"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Definitions */}
      <div
        className={`mb-2 text-sm text-gray-800 ${
          !focused ? 'line-clamp-2' : ''
        }`}
      >
        {word.definitions.map((def, i) => (
          <span key={i} className={!focused ? 'inline' : 'block mb-1'}>
            <span className="font-semibold text-gray-600">{def.pos}</span>{' '}
            <span>{def.meaning}</span>
            {!focused && i < word.definitions.length - 1 && <span className="mx-1">•</span>}
          </span>
        ))}
      </div>

      {/* Examples (聚焦时显示) */}
      {focused && word.examples.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">例句：</p>
          {word.examples.map((ex, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm italic text-gray-700">{ex.en}</p>
              <p className="text-xs text-gray-500">{ex.zh}</p>
            </div>
          ))}
        </div>
      )}

      {/* Etymology (聚焦时显示) */}
      {focused && word.etymology && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs">
            <span className="font-semibold text-gray-600">词根：</span>
            <span className="text-gray-600">{word.etymology}</span>
          </p>
        </div>
      )}

      {/* Memory Feedback (聚焦时显示) */}
      {focused && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">❓ 是否记住了这个单词？</p>
          <div className="flex gap-2">
            <button
              onClick={handleRememberClick}
              className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              记住了 ✓
            </button>
            <button
              onClick={handleNotRememberClick}
              className="flex-1 px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
            >
              还不熟 ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
