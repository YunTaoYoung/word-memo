// src/content/index.ts

import { getVocabulary } from '@/lib/storage';
import { normalizeWord } from '@/lib/word-normalizer';
import type { Message } from '@/types/messages';
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
 */

let vocabulary: Set<string> = new Set();
let visibleWords: Set<string> = new Set();
let highlightedElements: HTMLElement[] = [];
let intersectionObserver: IntersectionObserver | null = null;
let currentUrl = window.location.href;

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
}

// 加载词库
async function loadVocabulary() {
  const vocab = await getVocabulary();
  vocabulary = new Set(vocab.keys());
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
    // 从后往前替换（避免偏移量变化）
    nodeMatches.sort((a, b) => b.offset - a.offset);

    nodeMatches.forEach((match) => {
      const text = textNode.textContent || '';
      const before = text.substring(0, match.offset);
      const matchText = text.substring(match.offset, match.offset + match.length);
      const after = text.substring(match.offset + match.length);

      // 创建高亮元素
      const span = document.createElement('span');
      span.className = 'word-memo-highlight';
      span.dataset.word = match.word;
      span.textContent = matchText;
      span.style.textDecoration = 'underline wavy #EF4444';
      span.style.textUnderlineOffset = '2px';
      span.style.cursor = 'pointer';

      // 保存到数组
      highlightedElements.push(span);

      // 点击事件
      span.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: 'SCROLL_TO_CARD',
          payload: { word: match.word },
        });
      });

      // 替换文本节点
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode(before));
      fragment.appendChild(span);

      const afterNode = document.createTextNode(after);
      fragment.appendChild(afterNode);

      textNode.parentNode?.replaceChild(fragment, textNode);
    });
  });

  // 设置 IntersectionObserver 监听可见性
  setupIntersectionObserver();
}

// 设置视口可见性检测
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
          if (!visibleWords.has(word)) {
            visibleWords.add(word);
            changed = true;
          }
        } else {
          if (visibleWords.has(word)) {
            visibleWords.delete(word);
            changed = true;
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
  // 重新检查所有元素的可见性
  visibleWords.clear();

  highlightedElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const isVisible =
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0;

    if (isVisible && el.dataset.word) {
      visibleWords.add(el.dataset.word);
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
  });
}

// 处理消息
function handleMessage(message: Message) {
  console.log('[Word Memo] Message received:', message.type);

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
