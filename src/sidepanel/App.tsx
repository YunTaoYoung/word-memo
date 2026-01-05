// src/sidepanel/App.tsx

import { useState, useEffect } from 'react';
import Settings from './components/Settings';
import WordList from './components/WordList';
import VocabularyManagement from './components/VocabularyManagement';
import WordDetail from './components/WordDetail';
import { useWordStore } from './hooks/useWordStore';
import { useSettings } from './hooks/useSettings';
import { getReviewQueue } from '@/lib/storage';

type Tab = 'current-page' | 'vocabulary';
type View = 'list' | 'detail';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('current-page');
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const { words, visibleWords, hasReceivedVisibleWords, loading, highlightedWord, reload } = useWordStore();
  const { settings } = useSettings();

  // 检查待复习单词
  const checkReviewQueue = async () => {
    const queue = await getReviewQueue();
    setReviewQueue(queue);
  };

  // 初始加载时检查
  useEffect(() => {
    checkReviewQueue();
  }, []);

  // 检查是否已配置API Key
  const hasApiKey = settings?.llm.apiKey && settings.llm.apiKey.length > 0;

  // 过滤可见单词
  // 只有在接收到可见单词数据后才进行过滤,否则显示全部词库
  // 这样可以避免在滚动时短暂显示全部或空列表
  const displayWords = hasReceivedVisibleWords
    ? words.filter((word) => visibleWords.includes(word.word))
    : words;

  // 处理词汇点击
  const handleWordClick = (wordText: string) => {
    setSelectedWord(wordText);
    setCurrentView('detail');
  };

  // 返回列表
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedWord(null);
    reload(); // 刷新数据以获取最新状态
  };

  // 删除词汇后返回列表
  const handleWordDeleted = () => {
    reload();
    if (currentView === 'detail') {
      handleBackToList();
    }
  };

  // 获取当前选中的词汇数据
  const selectedWordData = selectedWord ? words.find((w) => w.word === selectedWord) : null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        {/* Title and Actions */}
        <div className="h-16 flex items-center justify-between px-4">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📚 Word Memo
          </h1>
          <div className="flex items-center gap-2">
            {!hasApiKey && (
              <span className="text-xs text-red-500 mr-2">⚠️ 未配置API</span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded"
              title="设置"
            >
              ⚙️
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded"
              title={collapsed ? '展开' : '折叠'}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {!collapsed && (
          <div className="flex border-t border-gray-200">
            <button
              onClick={() => {
                setActiveTab('current-page');
                setCurrentView('list');
              }}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === 'current-page'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              当前页生词
            </button>
            <button
              onClick={() => {
                setActiveTab('vocabulary');
                setCurrentView('list');
              }}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === 'vocabulary'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              词库管理
            </button>
          </div>
        )}
      </header>

      {!collapsed && (
        <>
          {/* Review Reminder */}
          {reviewQueue.length > 0 && settings?.display.showReviewReminder && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-yellow-800">
                📌 有 {reviewQueue.length} 个单词待复习
              </span>
              <button
                onClick={checkReviewQueue}
                className="text-xs text-yellow-700 hover:underline"
              >
                刷新
              </button>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                <p>加载中...</p>
              </div>
            ) : !hasApiKey ? (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-xl mb-2">欢迎使用 Word Memo</p>
                <p className="text-sm mb-4">
                  请先配置 LLM API Key 才能开始使用
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  前往设置
                </button>
                <div className="mt-8 text-left max-w-md mx-auto bg-white p-6 rounded-lg shadow">
                  <h2 className="font-bold mb-4">快速开始：</h2>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>点击上方设置按钮 ⚙️</li>
                    <li>配置 LLM API Key</li>
                    <li>浏览英文网页时选中生词</li>
                    <li>右键选择"📚 添加到词库"</li>
                    <li>在侧边栏查看单词释义</li>
                    <li>标记是否记住，系统自动管理复习</li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                {/* 当前页生词 Tab */}
                {activeTab === 'current-page' && (
                  <div className="p-4">
                    <WordList
                      words={displayWords}
                      highlightedWord={highlightedWord}
                      onWordDeleted={handleWordDeleted}
                    />
                  </div>
                )}

                {/* 词库管理 Tab */}
                {activeTab === 'vocabulary' && (
                  <>
                    {currentView === 'list' && (
                      <VocabularyManagement words={words} onWordClick={handleWordClick} />
                    )}
                    {currentView === 'detail' && selectedWordData && (
                      <WordDetail
                        word={selectedWordData}
                        onBack={handleBackToList}
                        onDeleted={handleWordDeleted}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </main>

          {/* Footer Stats - 只在当前页Tab显示 */}
          {!loading && activeTab === 'current-page' && displayWords.length > 0 && (
            <footer className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  显示: {displayWords.length} / 词库: {words.length}
                </span>
                <button
                  onClick={reload}
                  className="hover:text-blue-500 hover:underline"
                >
                  刷新
                </button>
              </div>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
