// src/types/index.ts

/**
 * 记忆等级枚举
 */
export enum MemoryLevel {
  NEW = 0,        // 新词（完全陌生）
  FAMILIAR = 1,   // 有印象（见过1-2次）
  LEARNING = 2,   // 学习中（见过3-5次）
  MASTERED = 3,   // 已掌握（见过6+次）
  ARCHIVED = 4    // 已归档（长期掌握，不再显示）
}

/**
 * 词性+释义
 */
export interface Definition {
  pos: string;        // 词性（n./v./adj./adv.等）
  meaning: string;    // 中文释义
}

/**
 * 例句
 */
export interface Example {
  en: string;         // 英文例句
  zh: string;         // 中文翻译
}

/**
 * 记忆状态
 */
export interface WordMemoryState {
  level: MemoryLevel;           // 当前记忆等级
  reviewCount: number;          // 总复习次数
  correctCount: number;         // 点击"记住"的次数
  lastReviewDate: Date;         // 上次复习时间
  nextReviewDate: Date;         // 下次复习时间（基于遗忘曲线）
  lastSeenDate: Date;           // 最后一次在页面中出现的时间
}

/**
 * 单词完整数据结构
 */
export interface WordData {
  // 基础信息
  word: string;                  // 单词原文（小写）
  phonetic: string;              // 音标

  // 释义
  definitions: Definition[];     // 词性和释义
  examples: Example[];           // 例句
  etymology: string;             // 词根词缀
  remarks: string;               // 个人备注

  // 记忆状态
  memoryState: WordMemoryState;

  // 元数据
  addedDate: Date;               // 添加时间
  updatedDate: Date;             // 最后编辑时间
  source?: string;               // 来源页面URL（可选）
}

/**
 * LLM配置
 */
export interface LLMConfig {
  apiEndpoint: string;    // API端点
  apiKey: string;         // API密钥
  model: string;          // 模型名称
  temperature: number;    // 温度参数
  timeout: number;        // 超时时间（ms）
}

/**
 * 用户设置
 */
export interface UserSettings {
  llm: LLMConfig;
  display: {
    enableHighlight: boolean;      // 是否高亮页面单词
    ignoreCodeBlocks: boolean;     // 是否忽略代码块
    showReviewReminder: boolean;   // 是否显示待复习提醒
    autoPlayPronunciation: boolean; // 是否自动播放发音
  };
  sidebar: {
    width: number;                 // 侧边栏宽度（300-600px）
    collapsed: boolean;            // 是否折叠
  };
}

/**
 * 文本匹配结果
 */
export interface MatchResult {
  word: string;           // 原始单词
  normalizedWord: string; // 标准化后的单词（小写 + 词形还原）
  element: Node;          // 所在文本节点
  offset: number;         // 在文本节点中的偏移量
  length: number;         // 单词长度
}

// ==================== 练习功能类型 ====================

/**
 * 题目类型
 */
export type QuestionType = 'choice' | 'fill';

/**
 * 练习题目
 */
export interface PracticeQuestion {
  id: string;
  word: string;
  type: QuestionType;
  question: string;       // 题干
  options?: string[];     // 选择题选项（4选1）
  correctAnswer: string;  // 正确答案
  explanation: string;    // 解析
}

/**
 * 练习会话
 */
export interface PracticeSession {
  id: string;
  questions: PracticeQuestion[];
  currentIndex: number;
  correctCount: number;
  startedAt: Date;
}

/**
 * 练习记录（用于统计）
 */
export interface PracticeRecord {
  sessionId: string;
  word: string;
  type: QuestionType;
  isCorrect: boolean;
  answeredAt: Date;
}
