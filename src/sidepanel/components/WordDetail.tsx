// src/sidepanel/components/WordDetail.tsx

import { useState, useEffect, useRef } from 'react';
import type { WordData, PracticeQuestion } from '@/types';
import { MemoryLevel } from '@/types';
import { deleteWord, saveWord, getPracticeQuestionsForWord } from '@/lib/storage';
import { MEMORY_COLORS } from '@/lib/constants';
import { calculateNextReview } from '@/lib/memory-algorithm';
import { useWordStore } from '@/sidepanel/hooks/useWordStore';

interface WordDetailProps {
  word: WordData;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function WordDetail({ word, onBack, onDeleted, onUpdated }: WordDetailProps) {
  const { sendMessageWithTabId } = useWordStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [showPracticePanel, setShowPracticePanel] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  // 编辑状态
  const [editData, setEditData] = useState<WordData>(word);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const levelColor = MEMORY_COLORS[word.memoryState.level];

  const levelNames = {
    [MemoryLevel.NEW]: '新词',
    [MemoryLevel.FAMILIAR]: '有印象',
    [MemoryLevel.LEARNING]: '学习中',
    [MemoryLevel.MASTERED]: '已掌握',
    [MemoryLevel.ARCHIVED]: '已归档',
  };

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

  // 加载练习题缓存
  useEffect(() => {
    getPracticeQuestionsForWord(word.word).then(setPracticeQuestions);
  }, [word.word]);

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

  // 状态变更时重新计算复习时间
  const handleLevelChange = async (newLevel: MemoryLevel) => {
    const updatedWord = { ...word };
    updatedWord.memoryState.level = newLevel;
    updatedWord.memoryState.nextReviewDate = calculateNextReview(newLevel, true);
    updatedWord.memoryState.lastReviewDate = new Date();
    updatedWord.updatedDate = new Date();

    await saveWord(updatedWord);
    setShowLevelDropdown(false);
    onUpdated();
    sendMessageWithTabId({ type: 'VOCABULARY_UPDATED' });
  };

  // 保存编辑
  const handleSave = async () => {
    setIsSaving(true);
    try {
      editData.updatedDate = new Date();
      await saveWord(editData);
      setIsEditing(false);
      onUpdated();
    } catch (error) {
      alert('保存失败：' + error);
    } finally {
      setIsSaving(false);
    }
  };

  // 添加释义
  const addDefinition = () => {
    setEditData({
      ...editData,
      definitions: [...editData.definitions, { pos: '', meaning: '' }],
    });
  };

  // 删除释义
  const removeDefinition = (index: number) => {
    setEditData({
      ...editData,
      definitions: editData.definitions.filter((_, i) => i !== index),
    });
  };

  // 更新释义
  const updateDefinition = (index: number, field: 'pos' | 'meaning', value: string) => {
    const newDefs = [...editData.definitions];
    newDefs[index] = { ...newDefs[index], [field]: value };
    setEditData({ ...editData, definitions: newDefs });
  };

  // 添加例句
  const addExample = () => {
    setEditData({
      ...editData,
      examples: [...editData.examples, { en: '', zh: '' }],
    });
  };

  // 删除例句
  const removeExample = (index: number) => {
    setEditData({
      ...editData,
      examples: editData.examples.filter((_, i) => i !== index),
    });
  };

  // 更新例句
  const updateExample = (index: number, field: 'en' | 'zh', value: string) => {
    const newExamples = [...editData.examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setEditData({ ...editData, examples: newExamples });
  };

  // 格式化时间显示
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染时间显示组件 - 使用 CSS group hover
  const TimeDisplay = ({ date }: { date: Date }) => {
    return (
      <div className="relative inline-block group cursor-help">
        <span className="font-semibold text-gray-800 border-b border-dashed border-gray-400">
          {new Date(date).toLocaleDateString()}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          {formatDateTime(date)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  };

  // 状态选择下拉菜单
  const LevelDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowLevelDropdown(!showLevelDropdown)}
        className="badge cursor-pointer hover:shadow-md transition-all duration-200"
        style={{
          backgroundColor: levelColor + '15',
          color: levelColor,
          border: `1px solid ${levelColor}30`,
        }}
      >
        {levelNames[word.memoryState.level]}
        <svg className="w-3 h-3 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showLevelDropdown && (
        <div className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-32">
          {Object.entries(levelNames).map(([key, value]) => {
            const levelNum = Number(key) as MemoryLevel;
            const itemColor = MEMORY_COLORS[levelNum];
            return (
              <button
                key={key}
                onClick={() => handleLevelChange(levelNum as MemoryLevel)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
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
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
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

  // 练习题浏览面板
  const PracticePanel = () => (
    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">练习题库</h3>
        <button
          onClick={() => setShowPracticePanel(false)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {practiceQuestions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          暂无练习题，点击下方按钮生成
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-auto">
          {practiceQuestions.map((q) => (
            <div key={q.id} className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 mb-2">{q.question}</p>
              {q.type === 'choice' && q.options && (
                <div className="text-xs text-gray-500">
                  选项: {q.options.join(' | ')}
                </div>
              )}
              <div className="text-xs text-green-600 mt-1">答案: {q.correctAnswer}</div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={async () => {
          const result = await sendMessageWithTabId({
            type: 'GENERATE_PRACTICE_QUESTION',
            payload: {
              word: word.word,
              wordData: {
                definitions: word.definitions,
                examples: word.examples,
              },
              type: 'choice',
            },
          }) as { question?: PracticeQuestion; error?: string };
          if (result.question) {
            setPracticeQuestions((prev) => [...prev, result.question!]);
          } else if (result.error) {
            alert(result.error);
          }
        }}
        className="btn-secondary w-full mt-4"
      >
        生成新题目
      </button>
    </div>
  );

  // 编辑模式
  if (isEditing) {
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
          <div className="flex items-center gap-2 float-right">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="flex-1 overflow-auto p-5">
          <div className="space-y-6">
            {/* 单词信息 */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg border-l-4" style={{ borderColor: levelColor }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单词</label>
                  <input
                    type="text"
                    value={editData.word}
                    onChange={(e) => setEditData({ ...editData, word: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">音标</label>
                  <input
                    type="text"
                    value={editData.phonetic}
                    onChange={(e) => setEditData({ ...editData, phonetic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* 释义编辑 */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg border-l-4" style={{ borderColor: levelColor }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">释义</h3>
                <button onClick={addDefinition} className="text-sm text-primary-600 hover:text-primary-700">
                  + 添加
                </button>
              </div>
              <div className="space-y-3">
                {editData.definitions.map((def, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="词性 (n./v./adj./adv.)"
                      value={def.pos}
                      onChange={(e) => updateDefinition(i, 'pos', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="中文释义"
                      value={def.meaning}
                      onChange={(e) => updateDefinition(i, 'meaning', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeDefinition(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 例句编辑 */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg border-l-4" style={{ borderColor: levelColor }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">例句</h3>
                <button onClick={addExample} className="text-sm text-primary-600 hover:text-primary-700">
                  + 添加
                </button>
              </div>
              <div className="space-y-3">
                {editData.examples.map((ex, i) => (
                  <div key={i} className="space-y-2 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="text"
                      placeholder="英文例句"
                      value={ex.en}
                      onChange={(e) => updateExample(i, 'en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="中文翻译"
                      value={ex.zh}
                      onChange={(e) => updateExample(i, 'zh', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeExample(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 词根编辑 */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg border-l-4" style={{ borderColor: levelColor }}>
              <h3 className="font-bold text-gray-800 mb-4">词根词缀</h3>
              <textarea
                value={editData.etymology}
                onChange={(e) => setEditData({ ...editData, etymology: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="词根词缀解释..."
              />
            </div>

            {/* 备注编辑 */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg border-l-4" style={{ borderColor: levelColor }}>
              <h3 className="font-bold text-gray-800 mb-4">个人备注</h3>
              <textarea
                value={editData.remarks}
                onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="添加个人备注..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 查看模式
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      {/* 返回按钮 */}
      <div className="glass border-b border-gray-200/80 px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="icon-btn"
              title="编辑"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowPracticePanel(!showPracticePanel)}
              className={`icon-btn ${showPracticePanel ? 'bg-primary-100' : ''}`}
              title="练习题"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="icon-btn hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              title="删除"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
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
              {/* 状态按钮 - 可点击带下拉菜单 */}
              <LevelDropdown />
              {/* 播放读音 */}
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

          {/* Remarks */}
          {word.remarks && (
            <div className="mb-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">备注</h2>
                  <p className="text-sm text-gray-700 leading-relaxed p-3 bg-amber-50 rounded-xl">{word.remarks}</p>
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
                <TimeDisplay date={word.addedDate} />
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">下次复习</p>
                <TimeDisplay date={word.memoryState.nextReviewDate} />
              </div>
            </div>
          </div>

          {/* Practice Panel */}
          {showPracticePanel && <PracticePanel />}
        </div>
      </div>
    </div>
  );
}
