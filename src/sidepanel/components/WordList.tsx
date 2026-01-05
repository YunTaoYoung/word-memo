// src/sidepanel/components/WordList.tsx

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
          onDeleted={onWordDeleted}
        />
      ))}
    </div>
  );
}
