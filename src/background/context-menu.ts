// src/background/context-menu.ts

import { MemoryLevel } from '@/types';
import { saveWord, getWordFromVocabulary } from '@/lib/storage';
import { generateWordExplanation } from './llm-client';

// 防重复：正在处理的单词集合
const pendingWords: Set<string> = new Set();

/**
 * 右键菜单点击处理
 */
export async function handleContextMenu(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (info.menuItemId !== 'add-to-vocabulary') return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText || !tab?.id) return;

  // 标准化单词（小写 + 去除特殊字符）
  const word = selectedText.toLowerCase().replace(/[^a-z-]/g, '');

  if (!word) {
    console.error('[Word Memo] Invalid word:', selectedText);
    return;
  }

  // 防重复：检查是否正在处理中
  if (pendingWords.has(word)) {
    console.log('[Word Memo] Word is already being added:', word);
    return;
  }

  try {
    // 检查是否已存在
    const existing = await getWordFromVocabulary(word);
    if (existing) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'WORD_ALREADY_EXISTS',
        payload: { word },
      });
      return;
    }

    // 标记为处理中
    pendingWords.add(word);

    // 通知Content Script显示loading
    chrome.tabs.sendMessage(tab.id, {
      type: 'WORD_ADDING',
      payload: { word },
    });

    // 调用LLM生成释义
    const explanation = await generateWordExplanation(word);

    // 保存到词库
    await saveWord({
      word,
      phonetic: explanation.phonetic,
      definitions: explanation.definitions,
      examples: explanation.examples,
      etymology: explanation.etymology,
      memoryState: {
        level: MemoryLevel.NEW,
        reviewCount: 0,
        correctCount: 0,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天后
        lastSeenDate: new Date(),
      },
      addedDate: new Date(),
      updatedDate: new Date(),
      source: tab.url,
    });

    // 通知Content Script和Side Panel更新
    chrome.tabs.sendMessage(tab.id, {
      type: 'WORD_ADDED',
      payload: { word },
    });

    chrome.runtime.sendMessage({
      type: 'VOCABULARY_UPDATED',
    });

    console.log('[Word Memo] Word added:', word);
  } catch (error: any) {
    console.error('[Word Memo] Failed to add word:', error);

    chrome.tabs.sendMessage(tab.id, {
      type: 'WORD_ADD_FAILED',
      payload: {
        word,
        error: error.message || '未知错误',
      },
    });
  } finally {
    // 无论成功或失败，都从处理集合中移除
    pendingWords.delete(word);
  }
}
