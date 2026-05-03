import { create } from 'zustand';
import { AppSettings } from '../types';
import { settingsApi } from '../api/settingsApi';

interface SettingsStore {
  settings: AppSettings;
  loading: boolean;
  updateTheme: (theme: 'light' | 'dark') => void;
  updateSortBy: (sortBy: 'dueDate' | 'priority' | 'createdAt') => void;
  toggleShowCompleted: () => void;
  loadSettings: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: {
    theme: 'light',
    sortBy: 'dueDate',
    showCompleted: true,
  },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    const result = await settingsApi.get();
    if (result.success && result.data) {
      const settings = result.data;
      set({ settings, loading: false });
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }
    } else {
      // 后端不可用时，尝试从 localStorage 恢复
      const localRaw = localStorage.getItem('settings-storage');
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (parsed.state?.settings) {
            set({ settings: parsed.state.settings, loading: false });
            return;
          }
        } catch { /* ignore */ }
      }
      set({ loading: false });
    }
  },

  loadSettings: async () => {
    await get().fetchSettings();
  },

  updateTheme: (theme) => {
    const updatedSettings = { ...get().settings, theme };
    set({ settings: updatedSettings });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    // 持久化到 localStorage，确保跨页面导航时能正确恢复
    try {
      const raw = localStorage.getItem('settings-storage');
      let existing = {};
      if (raw) {
        try { existing = JSON.parse(raw); } catch { /* ignore */ }
      }
      localStorage.setItem('settings-storage', JSON.stringify({
        ...existing,
        state: { settings: updatedSettings },
      }));
    } catch { /* ignore */ }
    settingsApi.update({ theme });
  },

  updateSortBy: (sortBy) => {
    const updatedSettings = { ...get().settings, sortBy };
    set({ settings: updatedSettings });
    settingsApi.update({ sortBy });
  },

  toggleShowCompleted: () => {
    const updatedSettings = { ...get().settings, showCompleted: !get().settings.showCompleted };
    set({ settings: updatedSettings });
    settingsApi.update({ showCompleted: updatedSettings.showCompleted });
  },
}));
