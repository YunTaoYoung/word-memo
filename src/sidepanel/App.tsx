// src/sidepanel/App.tsx

import { useState, useEffect } from 'react';
import Settings from './components/Settings';
import WordList from './components/WordList';
import VocabularyManagement from './components/VocabularyManagement';
import WordDetail from './components/WordDetail';
import PracticeMode from './components/PracticeMode';
import { useWordStore } from './hooks/useWordStore';
import { useSettings } from './hooks/useSettings';
import { getReviewQueue } from '@/lib/storage';

type Tab = 'current-page' | 'vocabulary';
type View = 'list' | 'detail' | 'practice';

export default function App() {
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

  // 开始练习
  const handlePracticeClick = () => {
    setCurrentView('practice');
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
    <div className="h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex flex-col">
      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <header className="glass border-b border-gray-200/80 flex-shrink-0 backdrop-blur-lg">
        {/* Title and Actions */}
        <div className="h-16 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">Word Memo</h1>
          </div>
          <div className="flex items-center gap-2">
            {!hasApiKey && (
              <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full border border-red-200">
                未配置API
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="icon-btn"
              title="设置"
              aria-label="打开设置"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-200/80">
            <button
              onClick={() => {
                setActiveTab('current-page');
                setCurrentView('list');
              }}
              className={`tab-btn ${activeTab === 'current-page' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              当前页生词
            </button>
            <button
              onClick={() => {
                setActiveTab('vocabulary');
                setCurrentView('list');
              }}
              className={`tab-btn ${activeTab === 'vocabulary' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              词库管理
            </button>
          </div>
      </header>

      <>
          {/* Review Reminder */}
          {reviewQueue.length > 0 && settings?.display.showReviewReminder && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/80 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-amber-900">
                    有 <span className="font-bold">{reviewQueue.length}</span> 个单词待复习
                  </span>
                </div>
                <button
                  onClick={checkReviewQueue}
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 px-3 py-1.5 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  刷新
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-sm font-medium">加载中...</p>
              </div>
            ) : !hasApiKey ? (
              <div className="flex flex-col items-center justify-center h-full px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mb-6 shadow-soft-lg">
                  <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">欢迎使用 Word Memo</h2>
                <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
                  开始之前，请先配置 LLM API Key
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-primary"
                >
                  前往设置
                </button>
                <div className="mt-10 w-full max-w-md section-card">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    快速开始
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>配置 LLM API Key</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>浏览英文网页时选中生词</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>右键选择"添加到词库"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>在侧边栏查看释义并标记记忆状态</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                {/* 当前页生词 Tab */}
                {activeTab === 'current-page' && (
                  <div className="p-5">
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
                      <VocabularyManagement
                        words={words}
                        onWordClick={handleWordClick}
                        onPracticeClick={handlePracticeClick}
                        onReload={reload}
                      />
                    )}
                    {currentView === 'detail' && selectedWordData && (
                      <WordDetail
                        word={selectedWordData}
                        onBack={handleBackToList}
                        onDeleted={handleWordDeleted}
                        onUpdated={reload}
                      />
                    )}
                    {currentView === 'practice' && (
                      <div className="p-5">
                        <PracticeMode />
                        <button
                          onClick={() => {
                            setCurrentView('list');
                            reload();
                          }}
                          className="btn-secondary mt-4 w-full"
                        >
                          返回词库
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>

          {/* Footer Stats - 只在当前页Tab显示 */}
          {!loading && activeTab === 'current-page' && displayWords.length > 0 && (
            <footer className="glass border-t border-gray-200/80 px-5 py-3 flex-shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">
                  显示 <span className="font-semibold text-gray-800">{displayWords.length}</span> /
                  词库 <span className="font-semibold text-gray-800">{words.length}</span>
                </span>
                <button
                  onClick={reload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  刷新
                </button>
              </div>
            </footer>
          )}
        </>
    </div>
  );
}
