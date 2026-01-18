// src/sidepanel/components/Settings.tsx

import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import { testLLMConnection } from '@/background/llm-client';
import type { UserSettings } from '@/types';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const current = await getSettings();
    setSettings(current);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await saveSettings(settings);
      alert('设置已保存！');
      onClose();
    } catch (error) {
      alert('保存失败：' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // 临时保存当前设置用于测试
      if (settings) {
        await saveSettings(settings);
      }

      const result = await testLLMConnection();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: '测试失败：' + error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-soft-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="glass border-b border-gray-200/80 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">设置</h1>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="关闭设置"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* LLM配置 */}
          <section className="section-card">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">LLM 配置</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API端点
                </label>
                <input
                  type="text"
                  value={settings.llm.apiEndpoint}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: { ...settings.llm, apiEndpoint: e.target.value },
                    })
                  }
                  className="input-field"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.llm.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: { ...settings.llm, apiKey: e.target.value },
                    })
                  }
                  className="input-field"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  模型
                </label>
                <select
                  value={settings.llm.model}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: { ...settings.llm, model: e.target.value },
                    })
                  }
                  className="input-field"
                >
                  <option value="gpt-3.5-turbo-0125">
                    gpt-3.5-turbo-0125 （推荐）
                  </option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="gpt-4">gpt-4</option>
                  <option value="gpt-4-turbo-preview">gpt-4-turbo-preview</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  支持任何 OpenAI 兼容 API
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Temperature: <span className="font-mono text-primary-600">{settings.llm.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.llm.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: {
                        ...settings.llm,
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>更精确</span>
                  <span>更随机</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleTest}
                  disabled={testing || !settings.llm.apiKey}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? '测试中...' : '测试连接'}
                </button>
                {testResult && (
                  <div
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="truncate">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 显示设置 */}
          <section className="section-card">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">显示设置</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.enableHighlight}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: {
                        ...settings.display,
                        enableHighlight: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">高亮页面中的词库单词</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.ignoreCodeBlocks}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: {
                        ...settings.display,
                        ignoreCodeBlocks: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">忽略代码块中的单词</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.showReviewReminder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: {
                        ...settings.display,
                        showReviewReminder: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">显示待复习提醒</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.autoPlayPronunciation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: {
                        ...settings.display,
                        autoPlayPronunciation: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">自动播放单词发音</span>
              </label>
            </div>
          </section>

          {/* 关于 */}
          <section className="section-card">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">关于</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-3">
              <div>
                <p className="font-bold text-gray-800 text-base">Word Memo</p>
                <p className="text-xs text-gray-500 mt-0.5">v1.0.0</p>
              </div>
              <p className="leading-relaxed">非侵入式英文阅读辅助与 AI 驱动的词汇记忆管理工具</p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://github.com/your-repo/word-memo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://github.com/your-repo/word-memo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  问题反馈
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="glass border-t border-gray-200/80 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
