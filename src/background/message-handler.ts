// src/background/message-handler.ts

import type { Message } from '@/types/messages';

/**
 * 消息处理路由
 */
export function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
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

    default:
      console.warn('[Word Memo] Unknown message type:', message.type);
  }

  return false; // 同步响应
}
