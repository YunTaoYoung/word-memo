// src/sidepanel/hooks/useWordStore.ts

import { useEffect, useState } from 'react';
import type { WordData } from '@/types';
import { getVocabulary } from '@/lib/storage';

/**
 * 词库状态管理 Hook
 */
export function useWordStore() {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

  // 加载词库
  const loadVocabulary = async () => {
    setLoading(true);
    try {
      const vocabulary = await getVocabulary();
      const wordsArray = Array.from(vocabulary.values());

      // 按记忆等级排序（等级低的在前）
      wordsArray.sort((a, b) => {
        if (a.memoryState.level !== b.memoryState.level) {
          return a.memoryState.level - b.memoryState.level;
        }
        // 相同等级按添加时间倒序
        return b.addedDate.getTime() - a.addedDate.getTime();
      });

      setWords(wordsArray);
    } catch (error) {
      console.error('[Word Memo] Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听词库更新消息
  useEffect(() => {
    loadVocabulary();

    const handleMessage = (message: any) => {
      if (message.type === 'VOCABULARY_UPDATED') {
        console.log('[Side Panel] Vocabulary updated, reloading...');
        loadVocabulary();
      } else if (message.type === 'SCROLL_TO_CARD') {
        const word = message.payload?.word;
        if (word) {
          setHighlightedWord(word);
          // 3秒后取消高亮
          setTimeout(() => setHighlightedWord(null), 3000);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return {
    words,
    loading,
    highlightedWord,
    reload: loadVocabulary,
  };
}
