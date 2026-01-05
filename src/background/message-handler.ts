// src/background/message-handler.ts

import type { Message } from '@/types/messages';

/**
 * 消息处理路由
 */
export function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  _sendResponse: (response?: any) => void
): boolean {
  console.log('[Word Memo] Message received:', message.type, message.payload);

  switch (message.type) {
    case 'VOCABULARY_UPDATED':
      // 广播给所有Content Script和Side Panel
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
              // Ignore errors for tabs that don't have content script
            });
          }
        });
      });
      break;

    default:
      console.warn('[Word Memo] Unknown message type:', message.type);
  }

  return false; // 同步响应
}
