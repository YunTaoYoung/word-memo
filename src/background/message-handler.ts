// src/background/message-handler.ts

import type { Message } from '@/types/messages';
import { generatePracticeQuestion } from './llm-client';
import { selectWordsForPractice } from '@/lib/memory-algorithm';
import { getVocabulary, savePracticeQuestion, getPracticeQuestionsForWord } from '@/lib/storage';

/**
 * 消息处理路由
 */
export function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  console.log('[Word Memo] Message received type: %s , source: %s , target: %s , payload:', 
    message.type, message.sourceTabId, message.targetTabId, message.payload);

  switch (message.type) {
    case 'GET_CURRENT_TAB':
      // 返回当前发送消息的标签页ID
      if (sender.tab?.id) {
        sendResponse({ tabId: sender.tab.id });
      }
      return true; // 异步响应

    case 'VOCABULARY_UPDATED':
      // 广播给所有Content Script和Side Panel，添加来源tabId
      const broadcastMessage = {
        ...message,
        sourceTabId: sender.tab?.id,
        targetTabId: sender.tab?.id,
      };
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, broadcastMessage).catch(() => {
              // Ignore errors for tabs that don't have content script
            });
          }
        });
      });
      break;

    case 'OPEN_SIDEPANEL':
      // 打开侧边栏并通知滚动到指定卡片
      if (sender.tab?.windowId) {
        chrome.sidePanel
          .open({ windowId: sender.tab.windowId })
          .then(() => {
            // 侧边栏打开后，发送滚动到卡片的消息
            chrome.runtime.sendMessage({
              type: 'SCROLL_TO_CARD',
              payload: message.payload,
            });
          })
          .catch((error) => {
            console.error('[Word Memo] Failed to open side panel:', error);
          });
      }
      break;

    case 'GENERATE_PRACTICE_QUESTION':
      // 生成练习题目并保存到缓存
      handleGeneratePracticeQuestion(message.payload)
        .then(async (question) => {
          // 保存到缓存
          await savePracticeQuestion(question.word, question);
          sendResponse({ question });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true; // 异步响应

    case 'SELECT_PRACTICE_WORDS':
      // 选词
      handleSelectPracticeWords()
        .then((words) => {
          sendResponse({ words });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true; // 异步响应

    case 'GET_PRACTICE_CACHE':
      // 获取单词的练习题缓存
      handleGetPracticeCache(message.payload.word)
        .then((questions) => {
          sendResponse({ questions });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true; // 异步响应

    default:
      // console.warn('[Word Memo] Unknown message type:', message.type);
  }

  return false; // 同步响应
}

/**
 * 处理生成练习题目请求
 */
async function handleGeneratePracticeQuestion(payload: {
  word: string;
  wordData: {
    definitions: { pos: string; meaning: string }[];
    examples: { en: string; zh: string }[];
  };
  type: 'choice' | 'fill';
}) {
  const { word, wordData, type } = payload;
  const question = await generatePracticeQuestion(word, wordData, type);
  return question;
}

/**
 * 处理选词请求
 */
async function handleSelectPracticeWords() {
  const vocabulary = await getVocabulary();
  const wordsArray = Array.from(vocabulary.values());
  const words = selectWordsForPractice(wordsArray);
  return words;
}

/**
 * 获取单词的练习题缓存
 */
async function handleGetPracticeCache(word: string) {
  return await getPracticeQuestionsForWord(word);
}
