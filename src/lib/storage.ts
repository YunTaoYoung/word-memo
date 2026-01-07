// src/lib/storage.ts

import type { WordData, UserSettings, PracticeQuestion } from '@/types';
import type { VocabularyStorage, PracticeCacheStorage } from '@/types/storage';
import { STORAGE_KEYS } from './constants';
import {
  exportToYAML,
  importFromYAML,
  downloadYAMLFile,
  selectAndReadYAMLFile,
  fromExportableWord,
  type ExportableWord,
} from './yaml-import-export';

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

// ==================== YAML 导入导出 ====================

/**
 * 导入冲突处理策略
 */
export type ImportConflictStrategy = 'skip' | 'overwrite' | 'merge';

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * 导出词库为 YAML 文件并下载
 */
export async function exportVocabularyToYAML(): Promise<void> {
  const vocabulary = await getVocabulary();
  const yamlContent = await exportToYAML(vocabulary);

  const wordCount = vocabulary.size;
  const filename = `word-memo-export-${wordCount}words-${new Date().toISOString().split('T')[0]}.yaml`;

  downloadYAMLFile(yamlContent, filename);
}

/**
 * 从 YAML 文件导入词库
 */
export async function importVocabularyFromYAML(
  strategy: ImportConflictStrategy = 'skip'
): Promise<ImportResult> {
  try {
    const yamlContent = await selectAndReadYAMLFile();
    const { words, errors } = importFromYAML(yamlContent);

    if (errors.length > 0 && words.length === 0) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors,
      };
    }

    const vocabulary = await getVocabulary();
    let importedCount = 0;
    let skippedCount = 0;

    for (const wordData of words) {
      const wordKey = wordData.word.toLowerCase();

      if (vocabulary.has(wordKey)) {
        // 单词已存在
        if (strategy === 'skip') {
          skippedCount++;
          continue;
        } else if (strategy === 'overwrite') {
          // 覆盖：保留新的释义，但保留已有的记忆状态
          const existing = vocabulary.get(wordKey)!;
          const newWord = fromExportableWord(wordData, {
            level: existing.memoryState.level,
          });
          // 合并源信息
          newWord.source = existing.source;
          vocabulary.set(wordKey, newWord);
          importedCount++;
        } else if (strategy === 'merge') {
          // 合并：取两者的并集
          const existing = vocabulary.get(wordKey)!;
          const merged = mergeWords(existing, wordData);
          vocabulary.set(wordKey, merged);
          importedCount++;
        }
      } else {
        // 新单词
        const newWord = fromExportableWord(wordData);
        vocabulary.set(wordKey, newWord);
        importedCount++;
      }
    }

    // 保存到存储
    const serialized: VocabularyStorage = {};
    for (const [key, value] of vocabulary.entries()) {
      serialized[key] = serializeWordData(value);
    }
    await chrome.storage.local.set({
      [STORAGE_KEYS.VOCABULARY]: serialized,
    });

    return {
      success: true,
      importedCount,
      skippedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * 合并两个单词数据
 */
function mergeWords(existing: WordData, imported: ExportableWord): WordData {
  // 创建新单词，保留现有的记忆状态
  const merged = fromExportableWord(imported, {
    level: existing.memoryState.level,
  });

  // 保留已有的记忆状态
  merged.memoryState = { ...existing.memoryState };

  // 合并释义（去重）
  const existingDefs = new Set(existing.definitions.map(d => `${d.pos}:${d.meaning}`));
  for (const def of imported.definitions) {
    const key = `${def.pos}:${def.meaning}`;
    if (!existingDefs.has(key)) {
      merged.definitions.push(def);
    }
  }

  // 合并例句（去重）
  const existingExamples = new Set(existing.examples.map(e => `${e.en}:${e.zh}`));
  for (const ex of imported.examples) {
    const key = `${ex.en}:${ex.zh}`;
    if (!existingExamples.has(key)) {
      merged.examples.push(ex);
    }
  }

  // 保留较早的添加时间
  merged.addedDate = existing.addedDate;

  // 更新源信息
  merged.source = `${existing.source}, imported ${new Date().toISOString()}`;

  return merged;
}
