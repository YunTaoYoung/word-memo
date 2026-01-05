// src/content/index.ts

import { getVocabulary } from '@/lib/storage';
import { normalizeWord } from '@/lib/word-normalizer';
import type { Message } from '@/types/messages';

/**
 * Content Script 入口
 *
 * 主要功能：
 * 1. 扫描页面中的词库单词
 * 2. 高亮显示单词
 * 3. 监听用户交互
 */

let vocabulary: Set<string> = new Set();

// 初始化
async function init() {
  console.log('[Word Memo] Content script initialized');

  // 加载词库
  await loadVocabulary();

  // 监听来自Background的消息
  chrome.runtime.onMessage.addListener(handleMessage);

  // 执行首次扫描
  scanPage();
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
}

// 处理消息
function handleMessage(message: Message) {
  console.log('[Word Memo] Message received:', message.type);

  switch (message.type) {
    case 'WORD_ADDING':
      console.log('[Word Memo] Adding word:', message.payload?.word);
      // TODO: 显示loading提示
      break;

    case 'WORD_ADDED':
      console.log('[Word Memo] Word added:', message.payload?.word);
      // 重新加载词库并扫描
      loadVocabulary().then(() => scanPage());
      break;

    case 'WORD_ALREADY_EXISTS':
      console.log('[Word Memo] Word already exists:', message.payload?.word);
      // TODO: 显示提示
      break;

    case 'WORD_ADD_FAILED':
      console.error('[Word Memo] Failed to add word:', message.payload);
      // TODO: 显示错误提示
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
