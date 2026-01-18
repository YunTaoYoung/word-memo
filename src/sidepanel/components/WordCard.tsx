// src/sidepanel/components/WordCard.tsx

import { useState, useEffect, useRef } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { deleteWord, saveWord } from '@/lib/storage';
import { MEMORY_COLORS } from '@/lib/constants';
import { calculateNextReview } from '@/lib/memory-algorithm';
import { useWordStore } from '@/sidepanel/hooks/useWordStore';

interface WordCardProps {
  word: WordData;
  highlighted?: boolean;
  focused?: boolean; // 是否聚焦(展开)
  onDeleted?: () => void;
  onUpdated?: () => void; // 更新回调
  onFocus?: () => void; // 聚焦回调
  onCollapse?: () => void; // 折叠回调
}

export default function WordCard({
  word,
  highlighted = false,
  focused = false,
  onDeleted,
  onUpdated,
  onFocus,
  onCollapse,
}: WordCardProps) {
  const { sendMessageWithTabId } = useWordStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLevelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // 状态变更时重新计算复习时间
  const handleLevelChange = async (newLevel: MemoryLevel) => {
    const updatedWord = { ...word };
    updatedWord.memoryState.level = newLevel;
    updatedWord.memoryState.nextReviewDate = calculateNextReview(newLevel, true);
    updatedWord.memoryState.lastReviewDate = new Date();
    updatedWord.updatedDate = new Date();

    await saveWord(updatedWord);
    setShowLevelDropdown(false);
    onUpdated?.();
    sendMessageWithTabId({ type: 'VOCABULARY_UPDATED' });
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

  // 状态选择下拉菜单
  const LevelDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowLevelDropdown(!showLevelDropdown);
        }}
        className="badge cursor-pointer hover:shadow-md transition-all duration-200"
        style={{
          backgroundColor: levelColor + '15',
          color: levelColor,
          border: `1px solid ${levelColor}30`,
        }}
      >
        {levelNames[word.memoryState.level]}
        <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showLevelDropdown && (
        <div className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-28">
          {Object.entries(levelNames).map(([key, value]) => {
            const levelNum = Number(key) as MemoryLevel;
            const itemColor = MEMORY_COLORS[levelNum];
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLevelChange(levelNum as MemoryLevel);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                  levelNum === word.memoryState.level ? 'bg-primary-50' : ''
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: itemColor }}
                />
                <span style={{ color: levelNum === word.memoryState.level ? itemColor : undefined }}>
                  {value}
                </span>
                {levelNum === word.memoryState.level && (
                  <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`
        word-card
        word-card-level-${word.memoryState.level}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        transition-smooth
      `}
      style={{
        borderColor: levelColor,
        ...(highlighted && {
          outline: `4px solid ${levelColor}`,
          outlineOffset: '-4px',
          boxShadow: `0 0 0 4px ${levelColor}33, 0 0 20px ${levelColor}66, 0 10px 40px ${levelColor}44`,
          transform: 'scale(1.02)',
        }),
        ...(focused && !highlighted && {
          outline: `2px solid ${levelColor}`,
          outlineOffset: '-2px',
          boxShadow: `0 0 0 2px ${levelColor}33, 0 0 15px ${levelColor}55`,
        }),
      }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 折叠/展开标志 */}
          <button
            onClick={handleToggleClick}
            className="flex-shrink-0 self-stretch px-1.5 flex items-center justify-center
                       text-gray-400 hover:text-primary-600 hover:bg-primary-50
                       rounded-lg transition-all duration-200"
            title={focused ? '折叠' : '展开'}
            aria-label={focused ? '折叠' : '展开'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${focused ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{word.word}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{word.phonetic}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
          {/* 状态按钮 - 可点击带下拉菜单 */}
          <LevelDropdown />
          {/* 播放读音和删除按钮 - 下一行，右对齐 */}
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={pronounce}
              className="icon-btn"
              title="朗读"
              aria-label="朗读单词"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Definitions */}
      <div className={`text-sm leading-relaxed ${!focused ? 'line-clamp-2' : 'space-y-2'}`}>
        {word.definitions.map((def, i) => (
          <div key={i} className={!focused ? 'inline' : 'flex gap-2'}>
            <span className="font-semibold text-gray-700 flex-shrink-0">{def.pos}</span>
            <span className="text-gray-800">{def.meaning}</span>
            {!focused && i < word.definitions.length - 1 && <span className="mx-1.5 text-gray-400">•</span>}
          </div>
        ))}
      </div>

      {/* Examples (聚焦时显示) */}
      {focused && word.examples.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">例句</span>
          </div>
          <div className="space-y-3">
            {word.examples.map((ex, i) => (
              <div key={i} className="pl-6 border-l-2 border-gray-200 hover:border-primary-300 transition-colors">
                <p className="text-sm italic text-gray-700 leading-relaxed">{ex.en}</p>
                <p className="text-xs text-gray-500 mt-1">{ex.zh}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Etymology (聚焦时显示) */}
      {focused && word.etymology && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">词根</span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{word.etymology}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
