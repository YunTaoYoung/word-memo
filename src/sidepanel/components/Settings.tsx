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
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">⚙️ 设置</h1>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* LLM配置 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">🤖 LLM配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-3.5-turbo-0125">
                  gpt-3.5-turbo-0125 （推荐）
                </option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="gpt-4">gpt-4</option>
                <option value="gpt-4-turbo-preview">gpt-4-turbo-preview</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                💡 支持任何 OpenAI 兼容 API（OpenAI、Azure、国内大模型）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {settings.llm.temperature}
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
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>更精确</span>
                <span>更随机</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={testing || !settings.llm.apiKey}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              {testResult && (
                <div
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    testResult.success
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 显示设置 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">🎨 显示设置</h2>

          <div className="space-y-3">
            <label className="flex items-center">
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
                className="mr-2"
              />
              <span className="text-sm">高亮页面中的词库单词</span>
            </label>

            <label className="flex items-center">
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
                className="mr-2"
              />
              <span className="text-sm">忽略代码块中的单词</span>
            </label>

            <label className="flex items-center">
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
                className="mr-2"
              />
              <span className="text-sm">显示待复习提醒</span>
            </label>

            <label className="flex items-center">
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
                className="mr-2"
              />
              <span className="text-sm">自动播放单词发音</span>
            </label>
          </div>
        </section>

        {/* 关于 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">ℹ️ 关于</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Word Memo</strong> v1.0.0
            </p>
            <p>非侵入式英文阅读辅助与AI驱动的词汇记忆管理工具</p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://github.com/your-repo/word-memo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                GitHub
              </a>
              <a
                href="https://github.com/your-repo/word-memo/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                问题反馈
              </a>
            </div>
          </div>
        </section>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-gray-50 py-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
