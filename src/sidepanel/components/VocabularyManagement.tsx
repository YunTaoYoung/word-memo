// src/sidepanel/components/VocabularyManagement.tsx

import { useState, useMemo, useRef, useEffect } from 'react';
import type { WordData } from '@/types';
import { MemoryLevel } from '@/types';
import { MEMORY_COLORS } from '@/lib/constants';
import { isWordExpired, calculateNextReview } from '@/lib/memory-algorithm';
import { saveWord, exportVocabularyToYAML, importVocabularyFromYAML, type ImportConflictStrategy } from '@/lib/storage';

interface VocabularyManagementProps {
  words: WordData[];
  onWordClick: (word: string) => void;
  onPracticeClick: () => void;
  onReload: () => void;
}

type SortOption = 'alpha-asc' | 'alpha-desc' | 'level-asc' | 'level-desc';
type POSFilter = 'all' | 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.' | 'pron.';

export default function VocabularyManagement({ words, onWordClick, onPracticeClick, onReload }: VocabularyManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('alpha-asc');
  const [posFilter, setPOSFilter] = useState<POSFilter>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 计算可练习的单词数量
  const practiceableCount = useMemo(() => {
    return words.filter(w => w.memoryState.level < MemoryLevel.ARCHIVED && isWordExpired(w)).length;
  }, [words]);

  const levelNames = {
    [MemoryLevel.NEW]: '新词',
    [MemoryLevel.FAMILIAR]: '有印象',
    [MemoryLevel.LEARNING]: '学习中',
    [MemoryLevel.MASTERED]: '已掌握',
    [MemoryLevel.ARCHIVED]: '已归档',
  };

  // 状态变更时重新计算复习时间
  const handleLevelChange = async (word: WordData, newLevel: MemoryLevel, onClose: () => void) => {
    console.log('Changing level for', word.word, 'to', newLevel);
    const updatedWord = { ...word };
    updatedWord.memoryState.level = newLevel;
    updatedWord.memoryState.nextReviewDate = calculateNextReview(newLevel, true);
    updatedWord.memoryState.lastReviewDate = new Date();
    updatedWord.updatedDate = new Date();

    await saveWord(updatedWord);
    onClose();
  };

  // 状态选择下拉菜单组件
  const LevelDropdown = ({ word }: { word: WordData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const levelColor = MEMORY_COLORS[word.memoryState.level];

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="badge cursor-pointer hover:shadow-md transition-all duration-200"
          style={{
            backgroundColor: levelColor + '15',
            color: levelColor,
            border: `1px solid ${levelColor}30`
          }}
        >
          {levelNames[word.memoryState.level]}
          <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-28">
            {Object.entries(levelNames).map(([key, value]) => {
              const levelNum = Number(key) as MemoryLevel;
              const itemColor = MEMORY_COLORS[levelNum];
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLevelChange(word, levelNum as MemoryLevel, () => setIsOpen(false));
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

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 导出词库
  const handleExport = async () => {
    try {
      await exportVocabularyToYAML();
      setToast({ type: 'success', message: `已导出 ${words.length} 个单词` });
    } catch (error) {
      setToast({ type: 'error', message: `导出失败：${String(error)}` });
    }
  };

  // 导入词库
  const handleImport = async (strategy: ImportConflictStrategy) => {
    setImporting(true);
    try {
      const result = await importVocabularyFromYAML(strategy);
      if (result.success) {
        setToast({
          type: 'success',
          message: `成功导入 ${result.importedCount} 个单词${result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 个` : ''}`,
        });
        onReload(); // 刷新列表
      } else {
        setToast({ type: 'error', message: `导入失败：${result.errors.join('; ')}` });
      }
    } catch (error) {
      setToast({ type: 'error', message: `导入失败：${String(error)}` });
    } finally {
      setImporting(false);
      setShowImportModal(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Toast 通知 */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* 搜索和过滤栏 */}
      <div className="p-5 glass border-b border-gray-200/80 space-y-3 flex-shrink-0">
        {/* 第一行：搜索框 + 按钮组 */}
        <div className="flex gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索单词或释义..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all duration-200 shadow-inner-soft"
            />
          </div>

          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            disabled={words.length === 0}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            title="导出为 YAML 文件"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出
          </button>

          {/* 导入按钮 */}
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            title="从 YAML 文件导入"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导入
          </button>

          {/* 练习按钮 */}
          <button
            onClick={onPracticeClick}
            disabled={words.length === 0}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            练习
            {practiceableCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {practiceableCount}
              </span>
            )}
          </button>
        </div>

        {/* 第二行：排序和过滤 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 排序选择 */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="input-field text-sm"
          >
            <option value="alpha-asc">字母 A-Z</option>
            <option value="alpha-desc">字母 Z-A</option>
            <option value="level-asc">掌握 低→高</option>
            <option value="level-desc">掌握 高→低</option>
          </select>

          {/* 词性过滤 */}
          <select
            value={posFilter}
            onChange={(e) => setPOSFilter(e.target.value as POSFilter)}
            className="input-field text-sm"
          >
            <option value="all">全部词性</option>
            <option value="n.">名词</option>
            <option value="v.">动词</option>
            <option value="adj.">形容词</option>
            <option value="adv.">副词</option>
            <option value="prep.">介词</option>
            <option value="conj.">连词</option>
            <option value="pron.">代词</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>
            显示 <span className="font-semibold text-gray-800">{filteredAndSortedWords.length}</span> /
            总计 <span className="font-semibold text-gray-800">{words.length}</span>
          </span>
        </div>
      </div>

      {/* 单词列表 */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">没有找到符合条件的单词</p>
            <p className="text-sm text-gray-500">尝试调整搜索或过滤条件</p>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {filteredAndSortedWords.map((word) => (
              <div
                key={word.word}
                onClick={() => onWordClick(word.word)}
                className="section-card cursor-pointer hover:shadow-soft-lg
                           hover:scale-[1.01] transition-all duration-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  {/* 单词和音标 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{word.word}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{word.phonetic}</p>
                  </div>

                  {/* 掌握程度下拉菜单 */}
                  <LevelDropdown word={word} />
                </div>

                {/* 释义预览 */}
                <div className="space-y-1.5">
                  {word.definitions.slice(0, 2).map((def, i) => (
                    <div key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="font-semibold text-gray-600 flex-shrink-0">{def.pos}</span>
                      <span className="line-clamp-1">{def.meaning}</span>
                    </div>
                  ))}
                  {word.definitions.length > 2 && (
                    <p className="text-xs text-gray-500 italic">
                      +{word.definitions.length - 2} 个释义
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">导入词库</h3>

            <p className="text-sm text-gray-600 mb-4">
              选择导入时遇到重复单词的处理方式：
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleImport('skip')}
                disabled={importing}
                className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">跳过</div>
                <div className="text-sm text-gray-500">保留已有的单词，不导入重复项</div>
              </button>

              <button
                onClick={() => handleImport('overwrite')}
                disabled={importing}
                className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">覆盖</div>
                <div className="text-sm text-gray-500">用导入的数据替换已有的单词，但保留记忆状态</div>
              </button>

              <button
                onClick={() => handleImport('merge')}
                disabled={importing}
                className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">合并</div>
                <div className="text-sm text-gray-500">取两者的并集，保留已有的释义和例句</div>
              </button>
            </div>

            <button
              onClick={() => setShowImportModal(false)}
              disabled={importing}
              className="w-full mt-4 btn-secondary"
            >
              取消
            </button>

            {importing && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                <span className="text-sm">正在导入...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
