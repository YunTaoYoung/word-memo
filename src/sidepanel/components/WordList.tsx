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

  // 当有高亮的单词时,自动聚焦该单词
  useEffect(() => {
    if (highlightedWord) {
      setFocusedWord(highlightedWord);
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
