// src/sidepanel/components/WordList.tsx

import { useState, useEffect } from 'react';
import WordCard from './WordCard';
import type { WordData } from '@/types';

interface WordListProps {
  words: WordData[];
  highlightedWord?: string | null;
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
      // 步骤 1: 先收缩所有卡片
      setFocusedWord(null);

      // 步骤 2: 等待收缩动画完成后再展开目标卡片
      setTimeout(() => {
        setFocusedWord(highlightedWord);
      }, 150); // 给收缩动画一些时间
    }
  }, [highlightedWord]);

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
          highlighted={word.word === highlightedWord}
          focused={word.word === focusedWord}
          onDeleted={onWordDeleted}
          onFocus={() => setFocusedWord(word.word)}
        />
      ))}
    </div>
  );
}
