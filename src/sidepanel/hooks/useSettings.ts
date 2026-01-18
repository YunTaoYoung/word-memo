// src/sidepanel/hooks/useSettings.ts

import { useState, useEffect } from 'react';
import type { UserSettings } from '@/types';
import { getSettings } from '@/lib/storage';

/**
 * 设置状态管理 Hook
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const current = await getSettings();
      setSettings(current);
    } catch (error) {
      console.error('[Word Memo] Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    reload: loadSettings,
  };
}
