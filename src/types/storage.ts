// src/types/storage.ts

/**
 * 存储键定义
 */
export enum StorageKey {
  VOCABULARY = 'vocabulary',
  SETTINGS = 'settings',
  SIDEBAR_WIDTH = 'sidebarWidth',
}

/**
 * 词库存储格式（序列化后）
 */
export interface VocabularyStorage {
  [word: string]: WordDataSerialized;
}

/**
 * 序列化的WordData（日期转为字符串）
 */
export interface WordDataSerialized {
  word: string;
  phonetic: string;
  definitions: Array<{ pos: string; meaning: string }>;
  examples: Array<{ en: string; zh: string }>;
  etymology: string;
  memoryState: {
    level: number;
    reviewCount: number;
    correctCount: number;
    lastReviewDate: string;
    nextReviewDate: string;
    lastSeenDate: string;
  };
  addedDate: string;
  updatedDate: string;
  source?: string;
}
