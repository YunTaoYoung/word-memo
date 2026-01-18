// src/lib/yaml-import-export.ts

import yaml from 'js-yaml';
import type { WordData, Definition, Example } from '@/types';
import { MemoryLevel } from '@/types';

/**
 * YAML 导入导出模块
 * 支持将词库数据导出为 YAML 格式，以及从 YAML 导入
 */

// ==================== 类型定义 ====================

/**
 * 导出格式的单词数据（简化版，去除内部状态）
 */
export interface ExportableWord {
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
  remarks: string;
}

/**
 * 导出的词库文件头信息
 */
export interface ExportHeader {
  version: string;
  exportedAt: string;
  wordCount: number;
}

/**
 * 完整的导出格式
 */
export interface ExportData {
  header: ExportHeader;
  words: ExportableWord[];
}

// 当前导出格式版本
const EXPORT_VERSION = '1.0';

/**
 * 将 WordData 转换为可导出的格式
 */
export function toExportableWord(word: WordData): ExportableWord {
  return {
    word: word.word,
    phonetic: word.phonetic,
    definitions: word.definitions.map(d => ({
      pos: d.pos,
      meaning: d.meaning,
    })),
    examples: word.examples.map(e => ({
      en: e.en,
      zh: e.zh,
    })),
    etymology: word.etymology,
    remarks: word.remarks,
  };
}

/**
 * 将可导出的格式转换为 WordData
 */
export function fromExportableWord(
  data: ExportableWord,
  options?: {
    level?: MemoryLevel;
    keepSource?: boolean;
  }
): WordData {
  const now = new Date();
  const level = options?.level ?? MemoryLevel.NEW;

  // 根据等级计算复习间隔
  const reviewIntervals: Record<number, { yes: number; no: number }> = {
    0: { yes: 1, no: 0.5 },
    1: { yes: 3, no: 1 },
    2: { yes: 7, no: 3 },
    3: { yes: 30, no: 7 },
    4: { yes: 90, no: 30 },
  };

  const interval = reviewIntervals[level] ?? reviewIntervals[0];
  const nextReviewDate = new Date(now.getTime() + interval.yes * 24 * 60 * 60 * 1000);

  return {
    word: data.word,
    phonetic: data.phonetic,
    definitions: data.definitions as Definition[],
    examples: data.examples as Example[],
    etymology: data.etymology,
    remarks: data.remarks,
    memoryState: {
      level,
      reviewCount: 0,
      correctCount: 0,
      lastReviewDate: now,
      nextReviewDate,
      lastSeenDate: now,
    },
    addedDate: now,
    updatedDate: now,
    source: options?.keepSource ? undefined : 'imported',
  };
}

/**
 * 导出词库为 YAML 格式
 */
export async function exportToYAML(
  vocabulary: Map<string, WordData>
): Promise<string> {
  const words = Array.from(vocabulary.values()).map(toExportableWord);

  const exportData: ExportData = {
    header: {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      wordCount: words.length,
    },
    words,
  };

  // 使用 yaml 库导出
  return yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1, // 不换行
    forceQuotes: false,
  });
}

/**
 * 从 YAML 字符串导入词库
 */
export function importFromYAML(yamlContent: string): {
  words: ExportableWord[];
  header: ExportHeader | null;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // 解析 YAML
    const parsed = yaml.load(yamlContent) as ExportData | ExportableWord[];

    if (!parsed) {
      errors.push('文件内容为空');
      return { words: [], header: null, errors };
    }

    // 兼容旧格式（直接是单词数组）
    let words: ExportableWord[] = [];
    let header: ExportHeader | null = null;

    if (Array.isArray(parsed)) {
      // 旧格式：直接是单词数组
      words = parsed;
      header = null;
    } else if ('header' in parsed && 'words' in parsed) {
      // 新格式：包含 header
      words = parsed.words;
      header = parsed.header;
    } else {
      errors.push('未知的文件格式');
      return { words: [], header: null, errors };
    }

    // 验证和清理数据
    const validWords = words.filter((word, index) => {
      if (!word || typeof word !== 'object') {
        errors.push(`第 ${index + 1} 行：数据格式无效`);
        return false;
      }

      if (!word.word || typeof word.word !== 'string') {
        errors.push(`第 ${index + 1} 行：缺少单词`);
        return false;
      }

      // 标准化单词（小写，去除空格）
      word.word = word.word.toLowerCase().trim();

      // 确保定义数组存在
      if (!Array.isArray(word.definitions)) {
        word.definitions = [];
      }

      // 确保例句数组存在
      if (!Array.isArray(word.examples)) {
        word.examples = [];
      }

      return true;
    });

    return {
      words: validWords,
      header,
      errors,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === 'YAMLException' || (error as any).message?.includes('YAML')) {
      errors.push(`YAML 解析错误：${err.message}`);
    } else {
      errors.push(`解析错误：${err.message}`);
    }
    return { words: [], header: null, errors };
  }
}

/**
 * 下载 YAML 文件
 */
export function downloadYAMLFile(content: string, filename?: string): void {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `word-memo-export-${Date.now()}.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成文件选择器并读取文件
 */
export function selectAndReadYAMLFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml,.txt,.json';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }

      try {
        const text = await file.text();
        resolve(text);
      } catch (error) {
        reject(new Error(`读取文件失败：${String(error)}`));
      }
    };

    input.onerror = () => {
      reject(new Error('文件选择失败'));
    };

    input.click();
  });
}

/**
 * 生成 YAML 预览（只显示前 N 个单词）
 */
export function generateYAMLPreview(
  vocabulary: Map<string, WordData>,
  maxWords: number = 5
): string {
  const previewWords = Array.from(vocabulary.values())
    .slice(0, maxWords)
    .map(toExportableWord);

  const previewData: ExportData = {
    header: {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      wordCount: vocabulary.size,
    },
    words: previewWords,
  };

  const preview = yaml.dump(previewData, {
    indent: 2,
    lineWidth: -1,
  });

  if (vocabulary.size > maxWords) {
    return preview + `\n# ... 共 ${vocabulary.size} 个单词（完整导出后可见）`;
  }

  return preview;
}
