// src/lib/storage.ts

import type { WordData, UserSettings, PracticeQuestion } from '@/types';
import type { VocabularyStorage, PracticeCacheStorage } from '@/types/storage';
import { STORAGE_KEYS } from './constants';

/**
 * 存储抽象层 - 封装chrome.storage操作
 */

/**
 * 序列化WordData（日期转字符串）
 */
function serializeWordData(word: WordData): any {
  return {
    ...word,
    memoryState: {
      ...word.memoryState,
      lastReviewDate: word.memoryState.lastReviewDate.toISOString(),
      nextReviewDate: word.memoryState.nextReviewDate.toISOString(),
      lastSeenDate: word.memoryState.lastSeenDate.toISOString(),
    },
    addedDate: word.addedDate.toISOString(),
    updatedDate: word.updatedDate.toISOString(),
  };
}

/**
 * 反序列化WordData（字符串转日期）
 */
function deserializeWordData(data: any): WordData {
  return {
    ...data,
    memoryState: {
      ...data.memoryState,
      lastReviewDate: new Date(data.memoryState.lastReviewDate),
      nextReviewDate: new Date(data.memoryState.nextReviewDate),
      lastSeenDate: new Date(data.memoryState.lastSeenDate),
    },
    addedDate: new Date(data.addedDate),
    updatedDate: new Date(data.updatedDate),
  };
}

/**
 * 获取词库
 */
export async function getVocabulary(): Promise<Map<string, WordData>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.VOCABULARY);
  const data: VocabularyStorage = result[STORAGE_KEYS.VOCABULARY] || {};

  const vocabulary = new Map<string, WordData>();
  for (const [word, serialized] of Object.entries(data)) {
    vocabulary.set(word, deserializeWordData(serialized));
  }

  return vocabulary;
}

/**
 * 保存单词
 */
export async function saveWord(word: WordData): Promise<void> {
  const vocabulary = await getVocabulary();
  vocabulary.set(word.word, word);

  const serialized: VocabularyStorage = {};
  for (const [key, value] of vocabulary.entries()) {
    serialized[key] = serializeWordData(value);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.VOCABULARY]: serialized,
  });
}

/**
 * 删除单词
 */
export async function deleteWord(word: string): Promise<void> {
  const vocabulary = await getVocabulary();
  vocabulary.delete(word);

  const serialized: VocabularyStorage = {};
  for (const [key, value] of vocabulary.entries()) {
    serialized[key] = serializeWordData(value);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.VOCABULARY]: serialized,
  });
}

/**
 * 获取单个单词
 */
export async function getWordFromVocabulary(
  word: string
): Promise<WordData | null> {
  const vocabulary = await getVocabulary();
  return vocabulary.get(word) || null;
}

/**
 * 获取设置
 */
export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || getDefaultSettings();
}

/**
 * 保存设置
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

/**
 * 默认设置
 */
export function getDefaultSettings(): UserSettings {
  return {
    llm: {
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      model: 'gpt-3.5-turbo-0125',
      temperature: 0.3,
      timeout: 30000,
    },
    display: {
      enableHighlight: true,
      ignoreCodeBlocks: true,
      showReviewReminder: true,
      autoPlayPronunciation: false,
    },
    sidebar: {
      width: 400,
      collapsed: false,
    },
  };
}

/**
 * 获取待复习单词列表
 */
export async function getReviewQueue(): Promise<string[]> {
  const vocabulary = await getVocabulary();
  const now = Date.now();

  const dueWords = Array.from(vocabulary.values())
    .filter((word) => word.memoryState.nextReviewDate.getTime() <= now)
    .map((word) => word.word);

  return dueWords;
}

// ==================== 练习题缓存 ====================

/**
 * 获取练习题缓存
 */
export async function getPracticeCache(): Promise<Map<string, PracticeQuestion[]>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PRACTICE_CACHE);
  const data: PracticeCacheStorage = result[STORAGE_KEYS.PRACTICE_CACHE] || {};

  const cache = new Map<string, PracticeQuestion[]>();
  for (const [word, questions] of Object.entries(data)) {
    cache.set(word, questions);
  }

  return cache;
}

/**
 * 保存练习题缓存
 */
export async function savePracticeQuestion(
  word: string,
  question: PracticeQuestion
): Promise<void> {
  const cache = await getPracticeCache();
  const existing = cache.get(word) || [];

  // 避免重复添加相同题目
  if (!existing.some((q) => q.id === question.id)) {
    existing.push(question);
    // 每个单词最多保留10道题目
    if (existing.length > 10) {
      existing.shift();
    }
    cache.set(word, existing);
  }

  const serialized: PracticeCacheStorage = {};
  for (const [w, qs] of cache.entries()) {
    serialized[w] = qs;
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.PRACTICE_CACHE]: serialized,
  });
}

/**
 * 获取单词的练习题缓存
 */
export async function getPracticeQuestionsForWord(
  word: string
): Promise<PracticeQuestion[]> {
  const cache = await getPracticeCache();
  return cache.get(word) || [];
}

/**
 * 清除练习题缓存
 */
export async function clearPracticeCache(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.PRACTICE_CACHE);
}
