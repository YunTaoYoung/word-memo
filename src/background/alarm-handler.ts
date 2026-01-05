// src/background/alarm-handler.ts

import { getVocabulary, saveWord } from '@/lib/storage';
import { shouldDowngrade, downgradeLevel, calculateNextReview } from '@/lib/memory-algorithm';
import { ALARM_NAME } from '@/lib/constants';

/**
 * 定时任务处理（遗忘曲线检查）
 */
export async function handleAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name !== ALARM_NAME) return;

  console.log('[Word Memo] Checking memory decay...');

  const vocabulary = await getVocabulary();
  const updatedWords: string[] = [];

  for (const [word, data] of vocabulary.entries()) {
    if (shouldDowngrade(data.memoryState)) {
      data.memoryState.level = downgradeLevel(data.memoryState.level);
      data.memoryState.nextReviewDate = calculateNextReview(
        data.memoryState.level,
        false
      );
      data.updatedDate = new Date();

      await saveWord(data);
      updatedWords.push(word);
    }
  }

  if (updatedWords.length > 0) {
    console.log(`[Word Memo] Downgraded ${updatedWords.length} words:`, updatedWords);

    // 通知Side Panel更新UI
    chrome.runtime.sendMessage({
      type: 'VOCABULARY_UPDATED',
      payload: { updatedWords },
    });
  }
}
