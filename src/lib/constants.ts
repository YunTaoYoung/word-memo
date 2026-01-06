// src/lib/constants.ts

/**
 * 全局常量定义
 */

// 存储键
export const STORAGE_KEYS = {
  VOCABULARY: 'vocabulary',
  SETTINGS: 'settings',
  SIDEBAR_WIDTH: 'sidebarWidth',
  PRACTICE_CACHE: 'practiceCache',
} as const;

// 右键菜单ID
export const CONTEXT_MENU_ID = 'add-to-vocabulary';

// 定时任务名称
export const ALARM_NAME = 'checkMemoryDecay';

// 侧边栏尺寸
export const SIDEBAR = {
  MIN_WIDTH: 300,
  MAX_WIDTH: 600,
  DEFAULT_WIDTH: 400,
} as const;

// 记忆等级配色
export const MEMORY_COLORS = {
  0: '#EF4444', // NEW - 红色
  1: '#F59E0B', // FAMILIAR - 橙色
  2: '#EAB308', // LEARNING - 黄色
  3: '#22C55E', // MASTERED - 绿色
  4: '#9CA3AF', // ARCHIVED - 灰色
} as const;

// 遗忘曲线间隔（天）
export const REVIEW_INTERVALS = {
  0: { yes: 1, no: 0.5 },   // NEW
  1: { yes: 3, no: 1 },     // FAMILIAR
  2: { yes: 7, no: 3 },     // LEARNING
  3: { yes: 30, no: 7 },    // MASTERED
  4: { yes: 90, no: 30 },   // ARCHIVED
} as const;

// 遗忘降级阈值倍数
export const DOWNGRADE_THRESHOLD = 1.5;
