// src/lib/search.ts

import Fuse from 'fuse.js';
import type { WordData } from '@/types';
import type { IFuseOptions } from 'fuse.js';

/**
 * 模糊搜索实现（使用Fuse.js）
 */

const fuseOptions: IFuseOptions<WordData> = {
  keys: [
    { name: 'word', weight: 2 }, // 单词原文（权重高）
    { name: 'definitions.meaning', weight: 1 }, // 中文释义
  ],
  threshold: 0.3, // 模糊度（0=精确匹配，1=全匹配）
  includeScore: true,
};

/**
 * 搜索词库
 */
export function searchVocabulary(
  words: WordData[],
  query: string
): WordData[] {
  if (!query.trim()) return words;

  const fuse = new Fuse(words, fuseOptions);
  const results = fuse.search(query);

  return results.map((r) => r.item);
}
