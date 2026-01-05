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
