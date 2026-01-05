// src/lib/word-normalizer.ts

import nlp from 'compromise';

/**
 * 单词标准化（小写 + 词形还原）
 */
export function normalizeWord(word: string): string {
  const lowercased = word.toLowerCase();

  try {
    // 使用compromise.js进行词形还原
    const doc = nlp(lowercased);

    // 尝试还原动词
    const verb = doc.verbs().toInfinitive().text();
    if (verb) return verb;

    // 尝试还原名词
    const noun = doc.nouns().toSingular().text();
    if (noun) return noun;

    // 无法还原，返回小写
    return lowercased;
  } catch (error) {
    console.error('Word normalization failed:', error);
    return lowercased;
  }
}

/**
 * 批量标准化单词
 */
export function normalizeWords(words: string[]): string[] {
  return words.map(normalizeWord);
}
