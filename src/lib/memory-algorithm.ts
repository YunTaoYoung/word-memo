// src/lib/memory-algorithm.ts

import type { WordData, WordMemoryState } from '@/types';
import { MemoryLevel } from '@/types';
import { REVIEW_INTERVALS, DOWNGRADE_THRESHOLD } from './constants';
import { saveWord } from './storage';

/**
 * 遗忘曲线算法实现（基于SuperMemo SM-2简化版）
 */

/**
 * 计算下次复习时间
 */
export function calculateNextReview(
  level: MemoryLevel,
  isRemembered: boolean
): Date {
  const intervals = REVIEW_INTERVALS[level as keyof typeof REVIEW_INTERVALS];
  const days = isRemembered ? intervals.yes : intervals.no;

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * 升级记忆等级
 */
export function upgradeLevel(currentLevel: MemoryLevel): MemoryLevel {
  if (currentLevel >= MemoryLevel.ARCHIVED) return MemoryLevel.ARCHIVED;
  return currentLevel + 1;
}

/**
 * 降级记忆等级
 */
export function downgradeLevel(currentLevel: MemoryLevel): MemoryLevel {
  if (currentLevel <= MemoryLevel.NEW) return MemoryLevel.NEW;
  return currentLevel - 1;
}

/**
 * 检查是否需要降级（超过复习时间的1.5倍）
 */
export function shouldDowngrade(state: WordMemoryState): boolean {
  const now = Date.now();
  const nextReview = state.nextReviewDate.getTime();

  return now > nextReview * DOWNGRADE_THRESHOLD;
}

/**
 * 用户点击"记住了"
 */
export async function handleRemembered(word: WordData): Promise<void> {
  word.memoryState.correctCount++;
  word.memoryState.reviewCount++;
  word.memoryState.level = upgradeLevel(word.memoryState.level);
  word.memoryState.lastReviewDate = new Date();
  word.memoryState.nextReviewDate = calculateNextReview(
    word.memoryState.level,
    true
  );
  word.updatedDate = new Date();

  await saveWord(word);

  // 通知其他组件更新
  chrome.runtime.sendMessage({ type: 'VOCABULARY_UPDATED' });
}

/**
 * 用户点击"还不熟"
 */
export async function handleNotRemembered(word: WordData): Promise<void> {
  word.memoryState.reviewCount++;
  word.memoryState.lastReviewDate = new Date();
  word.memoryState.nextReviewDate = calculateNextReview(
    word.memoryState.level,
    false
  );
  word.updatedDate = new Date();

  await saveWord(word);

  chrome.runtime.sendMessage({ type: 'VOCABULARY_UPDATED' });
}

// ==================== 练习功能 ====================

const MAX_PRACTICE_WORDS = 5;
const EXPIRING_HOURS_THRESHOLD = 24;

/**
 * 为练习选择单词（最多5个）
 * 优先级：
 * 1. 已过期单词（优先最久没复习的）
 * 2. 24小时内即将过期单词
 * 3. 正常复习期内单词
 * 4. 新词优先
 */
export function selectWordsForPractice(vocabulary: WordData[]): WordData[] {
  const now = Date.now();

  const candidates = vocabulary
    .filter(w => w.memoryState.level < MemoryLevel.ARCHIVED)
    .map(w => {
      const nextReview = new Date(w.memoryState.nextReviewDate).getTime();
      const overdueHours = (now - nextReview) / (1000 * 60 * 60);

      let priority: number;
      if (overdueHours > 0) {
        priority = 0; // 已过期
      } else if (overdueHours > -EXPIRING_HOURS_THRESHOLD) {
        priority = 1; // 24小时内到期
      } else {
        priority = 2; // 正常复习期
      }

      // 新词（从未复习）在同组中优先
      if (w.memoryState.reviewCount === 0) {
        priority -= 0.5;
      }

      return { word: w.word, data: w, priority, overdueHours };
    });

  // 按优先级排序
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.overdueHours - b.overdueHours;
  });

  return candidates.slice(0, MAX_PRACTICE_WORDS).map(c => c.data);
}

/**
 * 检查单词是否已过期（可以升级）
 */
export function isWordExpired(word: WordData): boolean {
  const now = Date.now();
  const nextReview = new Date(word.memoryState.nextReviewDate).getTime();
  return now > nextReview;
}

/**
 * 练习答题后更新单词状态
 * - 答对 + 已过期：升级
 * - 答对 + 未过期：仅记录正确
 * - 答错：降级
 */
export async function updateWordAfterPractice(
  word: WordData,
  isCorrect: boolean
): Promise<void> {
  word.memoryState.reviewCount++;

  if (isCorrect) {
    word.memoryState.correctCount++;
    // 只有已过期才升级
    if (isWordExpired(word)) {
      word.memoryState.level = upgradeLevel(word.memoryState.level);
    }
  } else {
    // 答错降级
    word.memoryState.level = downgradeLevel(word.memoryState.level);
  }

  word.memoryState.lastReviewDate = new Date();
  word.memoryState.nextReviewDate = calculateNextReview(
    word.memoryState.level,
    isCorrect
  );
  word.updatedDate = new Date();

  await saveWord(word);
  chrome.runtime.sendMessage({ type: 'VOCABULARY_UPDATED' });
}
