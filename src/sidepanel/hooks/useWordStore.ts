// src/sidepanel/hooks/useWordStore.ts

import { useEffect, useState, useRef } from 'react';
import type { WordData } from '@/types';
import { getVocabulary } from '@/lib/storage';

// 获取当前标签页ID（通过消息从background获取）
// async function getCurrentTabId(): Promise<number | null> {
//   return new Promise((resolve) => {
//     chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response) => {
//       if (response?.tabId) {
//         resolve(response.tabId);
//       } else {
//         resolve(null);
//       }
//     });
//   });
// }

async function getCurrentTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.id ?? null;
}

/**
 * 词库状态管理 Hook
 */
export function useWordStore() {
  const [words, setWords] = useState<WordData[]>([]);
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [hasReceivedVisibleWords, setHasReceivedVisibleWords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedWord, setHighlightedWord] = useState<{ word: string; timestamp: number } | null>(null);
  // const currentTabIdRef = useRef<number | null>(null);

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
    console.log('[Side Panel] useEffect executed');

    // 初始化获取 tabId
    // getCurrentTabId().then((tabId) => {
    //   currentTabIdRef.current = tabId;
    //   console.log('[Side Panel] Current tab ID:', tabId);
    // }).catch((err) => {
    //   console.error('[Side Panel] Failed to get tabId:', err);
    // });

    loadVocabulary();

    const handleMessage = (message: any) => {
      console.log('[Word Memo] Message received type: %s , source: %s , target: %s , payload:',
        message.type, message.sourceTabId, message.targetTabId, message.payload);
      getCurrentTabId().then((currentTabId) => {
        console.log('[Side Panel] Current tab ID:', currentTabId);
        if (message.type === 'VOCABULARY_UPDATED') {
          // 检查 sourceTabId 是否匹配当前 side panel 关联的标签页
          const sourceTabId = message.sourceTabId;
          if (sourceTabId !== undefined && sourceTabId !== currentTabId) {
            console.log('[Side Panel] Ignoring VOCABULARY_UPDATED from different tab');
            return;
          }
          console.log('[Side Panel] Vocabulary updated, reloading...');
          loadVocabulary();
        } else if (message.type === 'SCROLL_TO_CARD') {
          const word = message.payload?.word;
          if (word) {
            setHighlightedWord({ word, timestamp: Date.now() });
            // 3秒后取消高亮
            setTimeout(() => setHighlightedWord(null), 3000);
          }
        } else if (message.type === 'VISIBLE_WORDS_UPDATED') {
          // 检查 sourceTabId 是否匹配
          const sourceTabId = message.sourceTabId;
          if (sourceTabId !== undefined && sourceTabId !== currentTabId) {
            return; // 忽略其他标签页的可见单词更新
          }
          const words = message.payload?.words || [];
          console.log('[Side Panel] Visible words updated:', words.length);
          setVisibleWords(words);
          setHasReceivedVisibleWords(true);
        }
      }).catch((err) => {
        console.error('[Side Panel] Failed to get tabId:', err);
      });
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // 发送带 tabId 的消息
  const sendMessageWithTabId = (message: any) => {
    return getCurrentTabId().then((currentTabId) => {
      return chrome.runtime.sendMessage({
          ...message,
          sourceTabId: currentTabId,
        });
    });
  };

  return {
    words,
    visibleWords,
    hasReceivedVisibleWords,
    loading,
    highlightedWord,
    reload: loadVocabulary,
    sendMessageWithTabId,
  };
}
