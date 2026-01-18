// src/background/service-worker.ts

import { handleContextMenu } from './context-menu';
import { handleAlarm } from './alarm-handler';
import { handleMessage } from './message-handler';
import { CONTEXT_MENU_ID, ALARM_NAME } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/storage';

/**
 * Background Service Worker入口
 */

// 插件安装/更新时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Word Memo] Installed:', details.reason);

  // 注册右键菜单
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: '📚 添加到词库',
    contexts: ['selection'],
  });

  // 注册定时任务（每30分钟检查遗忘曲线）
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 30,
  });

  // 初始化默认设置
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) {
    await chrome.storage.local.set({
      settings: getDefaultSettings(),
    });
    console.log('[Word Memo] Default settings initialized');
  }
});

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener(handleContextMenu);

// 定时任务处理
chrome.alarms.onAlarm.addListener(handleAlarm);

// 消息处理（来自Content Script或Side Panel）
chrome.runtime.onMessage.addListener(handleMessage);

console.log('[Word Memo] Service Worker started');
