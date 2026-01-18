// src/sidepanel/components/WordList.tsx

import { useState, useEffect } from 'react';
import WordCard from './WordCard';
import type { WordData } from '@/types';

interface WordListProps {
  words: WordData[];
  highlightedWord?: { word: string; timestamp: number } | null;
  onWordDeleted: () => void;
}

export default function WordList({
  words,
  highlightedWord,
  onWordDeleted,
}: WordListProps) {
  const [focusedWord, setFocusedWord] = useState<string | null>(null);

  // 当有高亮的单词时，分步处理聚焦动画
  useEffect(() => {
    if (highlightedWord) {
      const word = highlightedWord.word;

      // 使用函数式更新来获取最新的 focusedWord，避免依赖循环
      setFocusedWord((currentFocusedWord) => {
        // 如果点击的是当前已聚焦的单词，则折叠它
        if (currentFocusedWord === word) {
          return null;
        } else if (currentFocusedWord === null) {
          // 如果当前没有聚焦的卡片，直接展开（无延迟）
          return word;
        } else {
          // 如果正在切换到另一个卡片，先收缩当前卡片
          setTimeout(() => {
            setFocusedWord(word);
          }, 150);
          return null; // 立即折叠当前卡片
        }
      });
    }
  }, [highlightedWord]); // 只依赖 highlightedWord

  if (words.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg mb-2">还没有添加单词</p>
        <p className="text-sm">
          在浏览网页时选中单词，右键选择"📚 添加到词库"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {words.map((word) => (
        <WordCard
          key={word.word}
          word={word}
          highlighted={word.word === highlightedWord?.word}
          focused={word.word === focusedWord}
          onDeleted={onWordDeleted}
          onFocus={() => setFocusedWord(word.word)}
          onCollapse={() => setFocusedWord(null)}
        />
      ))}
    </div>
  );
}
