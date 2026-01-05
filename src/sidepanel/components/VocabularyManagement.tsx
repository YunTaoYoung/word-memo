// src/sidepanel/components/VocabularyManagement.tsx

import { useState, useMemo } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { MEMORY_COLORS } from '@/lib/constants';

interface VocabularyManagementProps {
  words: WordData[];
  onWordClick: (word: string) => void;
}

type SortOption = 'alpha-asc' | 'alpha-desc' | 'level-asc' | 'level-desc';
type POSFilter = 'all' | 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.' | 'pron.';

export default function VocabularyManagement({ words, onWordClick }: VocabularyManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('alpha-asc');
  const [posFilter, setPOSFilter] = useState<POSFilter>('all');

  const levelNames = {
    [MemoryLevel.NEW]: '新词',
    [MemoryLevel.FAMILIAR]: '有印象',
    [MemoryLevel.LEARNING]: '学习中',
    [MemoryLevel.MASTERED]: '已掌握',
    [MemoryLevel.ARCHIVED]: '已归档',
  };

  // 过滤和排序单词
  const filteredAndSortedWords = useMemo(() => {
    let result = [...words];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (word) =>
          word.word.toLowerCase().includes(query) ||
          word.definitions.some((def) => def.meaning.toLowerCase().includes(query))
      );
    }

    // 词性过滤
    if (posFilter !== 'all') {
      result = result.filter((word) => word.definitions.some((def) => def.pos === posFilter));
    }

    // 排序
    result.sort((a, b) => {
      switch (sortOption) {
        case 'alpha-asc':
          return a.word.localeCompare(b.word);
        case 'alpha-desc':
          return b.word.localeCompare(a.word);
        case 'level-asc':
          return a.memoryState.level - b.memoryState.level;
        case 'level-desc':
          return b.memoryState.level - a.memoryState.level;
        default:
          return 0;
      }
    });

    return result;
  }, [words, searchQuery, sortOption, posFilter]);

  return (
    <div className="h-full flex flex-col">
      {/* 搜索和过滤栏 */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3">
        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索单词或释义..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* 排序和过滤 */}
        <div className="flex gap-2">
          {/* 排序选择 */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="alpha-asc">字母顺序 A-Z</option>
            <option value="alpha-desc">字母顺序 Z-A</option>
            <option value="level-asc">掌握程度 低→高</option>
            <option value="level-desc">掌握程度 高→低</option>
          </select>

          {/* 词性过滤 */}
          <select
            value={posFilter}
            onChange={(e) => setPOSFilter(e.target.value as POSFilter)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">全部词性</option>
            <option value="n.">名词 (n.)</option>
            <option value="v.">动词 (v.)</option>
            <option value="adj.">形容词 (adj.)</option>
            <option value="adv.">副词 (adv.)</option>
            <option value="prep.">介词 (prep.)</option>
            <option value="conj.">连词 (conj.)</option>
            <option value="pron.">代词 (pron.)</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div className="text-xs text-gray-500">
          显示 {filteredAndSortedWords.length} / 总计 {words.length} 个单词
        </div>
      </div>

      {/* 单词列表 */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedWords.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">没有找到符合条件的单词</p>
            <p className="text-sm">尝试调整搜索或过滤条件</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedWords.map((word) => (
              <div
                key={word.word}
                onClick={() => onWordClick(word.word)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  {/* 单词和音标 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{word.word}</h3>
                    <p className="text-sm text-gray-500">{word.phonetic}</p>
                  </div>

                  {/* 掌握程度标签 */}
                  <span
                    className="px-2 py-1 text-xs rounded flex-shrink-0"
                    style={{
                      backgroundColor: MEMORY_COLORS[word.memoryState.level] + '20',
                      color: MEMORY_COLORS[word.memoryState.level],
                    }}
                  >
                    {levelNames[word.memoryState.level]}
                  </span>
                </div>

                {/* 释义预览（只显示前2个）*/}
                <div className="space-y-1">
                  {word.definitions.slice(0, 2).map((def, i) => (
                    <div key={i} className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-600">{def.pos}</span>{' '}
                      <span>{def.meaning}</span>
                    </div>
                  ))}
                  {word.definitions.length > 2 && (
                    <p className="text-xs text-gray-500">+{word.definitions.length - 2} 个释义</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
