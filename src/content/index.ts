// src/content/index.ts

import { getVocabulary } from '@/lib/storage';
import { normalizeWord } from '@/lib/word-normalizer';
import type { Message } from '@/types/messages';
import type { WordData } from '@/types';
import { showToast, updateToast } from './toast';

/**
 * Content Script 入口
 *
 * 主要功能：
 * 1. 扫描页面中的词库单词
 * 2. 高亮显示单词
 * 3. 监听用户交互
 * 4. 检测视口可见性
 * 5. 监听页面导航和滚动
 * 6. 显示添加单词的 Toast 通知
 * 7. 监听标签页切换刷新可见单词
 */

let vocabulary: Map<string, WordData> = new Map();
let visibleWords: Set<string> = new Set();
let visibleWordCounters: Map<string, number> = new Map(); // 单词可见性计数器
let highlightedElements: HTMLElement[] = [];
let intersectionObserver: IntersectionObserver | null = null;
let currentUrl = window.location.href;
let currentTabId: number | null = null;

// 获取当前标签页ID（通过消息从background获取）
async function getCurrentTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response) => {
      if (response?.tabId) {
        resolve(response.tabId);
      } else {
        resolve(null);
      }
    });
  });
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 初始化
async function init() {
  console.log('[Word Memo] Content script initialized');

  // 获取当前标签页ID
  currentTabId = await getCurrentTabId();
  console.log('[Word Memo] Current tab ID:', currentTabId);

  // 加载词库
  await loadVocabulary();

  // 监听来自Background的消息
  chrome.runtime.onMessage.addListener(handleMessage);

  // 执行首次扫描
  scanPage();

  // 监听滚动事件 (防抖300ms)
  const debouncedUpdateVisibleWords = debounce(updateVisibleWords, 300);
  window.addEventListener('scroll', debouncedUpdateVisibleWords, { passive: true });

  // 监听窗口大小变化
  window.addEventListener('resize', debouncedUpdateVisibleWords, { passive: true });

  // 监听URL变化 (SPA导航)
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      console.log('[Word Memo] URL changed, rescanning page');
      currentUrl = window.location.href;
      clearHighlights();
      scanPage();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 监听 popstate 事件 (浏览器前进/后退)
  window.addEventListener('popstate', () => {
    console.log('[Word Memo] Navigation detected, rescanning page');
    currentUrl = window.location.href;
    clearHighlights();
    scanPage();
  });

  // 监听页面可见性变化 (标签页切换)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('[Word Memo] Tab became visible, updating visible words');
      // 页面重新可见时，更新可见单词列表
      updateVisibleWords();
    }
  });
}

// 加载词库
async function loadVocabulary() {
  vocabulary = await getVocabulary();
  console.log(`[Word Memo] Loaded ${vocabulary.size} words`);
}

// 扫描页面
function scanPage() {
  console.log('[Word Memo] Scanning page...');

  // 清除旧的高亮
  clearHighlights();

  const textNodes = getTextNodes(document.body);
  const matches: Array<{
    word: string;
    node: Text;
    offset: number;
    length: number;
  }> = [];

  // 匹配词库中的单词
  textNodes.forEach((node) => {
    const text = node.textContent || '';
    const wordRegex = /\b[a-zA-Z]+(?:-[a-zA-Z]+)*\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const originalWord = match[0];
      const normalizedWord = normalizeWord(originalWord);

      if (vocabulary.has(normalizedWord)) {
        matches.push({
          word: normalizedWord,
          node: node as Text,
          offset: match.index,
          length: originalWord.length,
        });
      }
    }
  });

  console.log(`[Word Memo] Found ${matches.length} vocabulary words in page`);

  // 高亮匹配的单词
  highlightWords(matches);

  // 初始化可见性检测
  updateVisibleWords();
}

// 清除所有高亮
function clearHighlights() {
  highlightedElements.forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      const textNode = document.createTextNode(el.textContent || '');
      parent.replaceChild(textNode, el);
    }
  });
  highlightedElements = [];
  visibleWords.clear();
  visibleWordCounters.clear(); // 清理计数器

  // 清理 IntersectionObserver
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

// 获取文本节点
function getTextNodes(root: Node): Node[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // 忽略script、style、code、pre标签
      if (
        ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) ||
        parent.closest('code, pre')
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Node[] = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    nodes.push(currentNode);
  }
  return nodes;
}

// 高亮单词
function highlightWords(
  matches: Array<{
    word: string;
    node: Text;
    offset: number;
    length: number;
  }>
) {
  // 按文本节点分组
  const grouped = new Map<Text, typeof matches>();

  matches.forEach((match) => {
    if (!grouped.has(match.node)) {
      grouped.set(match.node, []);
    }
    grouped.get(match.node)!.push(match);
  });

  // 处理每个文本节点
  grouped.forEach((nodeMatches, textNode) => {
    // 按偏移量从小到大排序（从前往后处理）
    nodeMatches.sort((a, b) => a.offset - b.offset);

    const text = textNode.textContent || '';
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    nodeMatches.forEach((match) => {
      // 添加匹配前的文本
      if (match.offset > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.offset)));
      }

      // 创建高亮元素
      const span = document.createElement('span');
      span.className = 'word-memo-highlight';
      span.dataset.word = match.word;
      span.textContent = text.substring(match.offset, match.offset + match.length);
      span.style.cursor = 'pointer';

      // 根据单词的记忆等级动态添加颜色类
      const wordData = vocabulary.get(match.word);
      if (wordData) {
        span.classList.add(`word-memo-level-${wordData.memoryState.level}`);
      }

      // 保存到数组
      highlightedElements.push(span);

      // 点击事件 - 不阻止事件传播，允许父元素处理
      span.addEventListener('click', () => {
        // 请求打开侧边栏并滚动到对应卡片
        chrome.runtime.sendMessage({
          type: 'OPEN_SIDEPANEL',
          payload: { word: match.word },
          sourceTabId: currentTabId ?? undefined,
          targetTabId: currentTabId ?? undefined,
        });
      });

      fragment.appendChild(span);

      // 更新索引
      lastIndex = match.offset + match.length;
    });

    // 添加剩余的文本
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // 一次性替换整个文本节点
    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  // 设置 IntersectionObserver 监听可见性
  setupIntersectionObserver();
}

// 设置视口可见性检测
/**
 * 设置 IntersectionObserver 来跟踪高亮单词元素的可见性
 * 使用计数器机制：每个单词进入视口时计数+1，离开时-1
 * 只要计数>0就认为单词在视口中可见
 * 当可见单词集合发生变化时通知侧边栏
 * @param {IntersectionObserver} [intersectionObserver] - 可选的现有观察器实例，如果存在会被先断开
 * @returns {void}
 */
function setupIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      let changed = false;
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const word = element.dataset.word;
        if (!word) return;

        if (entry.isIntersecting) {
          // 进入视口：计数器+1
          const currentCount = visibleWordCounters.get(word) || 0;
          visibleWordCounters.set(word, currentCount + 1);

          // 如果之前不可见，现在变为可见
          if (!visibleWords.has(word)) {
            visibleWords.add(word);
            changed = true;
          }
        } else {
          // 离开视口：计数器-1
          const currentCount = visibleWordCounters.get(word) || 0;
          const newCount = Math.max(0, currentCount - 1);

          if (newCount === 0) {
            // 计数归零，从可见集合中移除
            visibleWordCounters.delete(word);
            if (visibleWords.has(word)) {
              visibleWords.delete(word);
              changed = true;
            }
          } else {
            // 计数未归零，更新计数器但保持在可见集合中
            visibleWordCounters.set(word, newCount);
          }
        }
      });

      // 如果可见单词集合发生变化,通知侧边栏
      if (changed) {
        notifyVisibleWordsUpdate();
      }
    },
    {
      root: null,
      rootMargin: '50px', // 提前50px触发
      threshold: 0.1, // 至少10%可见
    }
  );

  // 监听所有高亮元素
  highlightedElements.forEach((el) => {
    intersectionObserver!.observe(el);
  });
}

// 更新可见单词列表
function updateVisibleWords() {
  // 重新检查所有元素的可见性并重建计数器
  visibleWords.clear();
  visibleWordCounters.clear();

  highlightedElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const isVisible =
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0;

    if (isVisible && el.dataset.word) {
      const word = el.dataset.word;
      // 更新计数器
      const currentCount = visibleWordCounters.get(word) || 0;
      visibleWordCounters.set(word, currentCount + 1);
      // 添加到可见集合
      visibleWords.add(word);
    }
  });

  notifyVisibleWordsUpdate();
}

// 通知侧边栏可见单词更新
function notifyVisibleWordsUpdate() {
  const visibleWordsList = Array.from(visibleWords);
  console.log(`[Word Memo] Visible words: ${visibleWordsList.length}`, visibleWordsList);

  chrome.runtime.sendMessage({
    type: 'VISIBLE_WORDS_UPDATED',
    payload: { words: visibleWordsList },
    sourceTabId: currentTabId ?? undefined,
    targetTabId: currentTabId ?? undefined,
  });
}

// 处理消息
function handleMessage(message: Message, _sender: chrome.runtime.MessageSender) {
  console.log('[Word Memo] Message received type: %s , source: %s , target: %s', 
    message.type, message.sourceTabId, message.targetTabId);

  // 检查 tabId 是否匹配（对于包含 tabId 的消息）
  if (message.targetTabId !== undefined && message.targetTabId !== currentTabId) {
    console.log('[Word Memo] Ignoring message from different tab:', message.targetTabId, 'current:', currentTabId);
    return;
  }

  switch (message.type) {
    case 'WORD_ADDING':
      console.log('[Word Memo] Adding word:', message.payload?.word);
      if (message.payload?.word) {
        showToast({
          word: message.payload.word,
          status: 'loading',
        });
      }
      break;

    case 'WORD_ADDED':
      console.log('[Word Memo] Word added:', message.payload?.word);
      if (message.payload?.word) {
        updateToast({
          word: message.payload.word,
          status: 'success',
        });
      }
      // 重新加载词库并扫描
      loadVocabulary().then(() => scanPage());
      break;

    case 'WORD_ALREADY_EXISTS':
      console.log('[Word Memo] Word already exists:', message.payload?.word);
      if (message.payload?.word) {
        showToast({
          word: message.payload.word,
          status: 'warning',
        });
      }
      break;

    case 'WORD_ADD_FAILED':
      console.error('[Word Memo] Failed to add word:', message.payload);
      if (message.payload?.word) {
        updateToast({
          word: message.payload.word,
          status: 'error',
          message: message.payload.error
            ? `添加 "${message.payload.word}" 失败: ${message.payload.error}`
            : undefined,
        });
      }
      break;

    case 'VOCABULARY_UPDATED':
      console.log('[Word Memo] Vocabulary updated');
      loadVocabulary().then(() => scanPage());
      break;
  }
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
