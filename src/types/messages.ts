// src/types/messages.ts

/**
 * Background <-> Content Script 消息类型
 */
export type MessageType =
  | 'WORD_ADDING'
  | 'WORD_ADDED'
  | 'WORD_ADD_FAILED'
  | 'WORD_ALREADY_EXISTS'
  | 'WORD_DELETED'
  | 'VOCABULARY_UPDATED'
  | 'SCROLL_TO_CARD'
  | 'VISIBLE_WORDS_UPDATED'
  | 'UPDATE_WORD_STYLE'
  | 'OPEN_SIDEPANEL'
  | 'GENERATE_PRACTICE_QUESTION'
  | 'SELECT_PRACTICE_WORDS'
  | 'GET_PRACTICE_CACHE'
  | 'SAVE_PRACTICE_QUESTION'
  | 'UPDATE_WORD_DATA'
  | 'GET_WORD_DATA'
  | 'GET_CURRENT_TAB';

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  /** 消息目标标签页ID */
  targetTabId?: number;  
  /** 消息来源标签页ID */
  sourceTabId?: number;
}

/**
 * LLM API响应
 */
export interface LLMResponse {
  word: string;
  phonetic: string;
  definitions: Array<{
    pos: string;
    meaning: string;
  }>;
  examples: Array<{
    en: string;
    zh: string;
  }>;
  etymology: string;
}

/**
 * 错误类型
 */
export enum LLMErrorType {
  NETWORK_ERROR = '网络连接失败',
  API_KEY_INVALID = 'API Key无效',
  RATE_LIMIT = '请求频率超限',
  TIMEOUT = '请求超时（30s）',
  PARSE_ERROR = '响应解析失败',
}
