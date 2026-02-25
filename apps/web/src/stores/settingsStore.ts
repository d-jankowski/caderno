import { create } from 'zustand';
import { api, UserPreferences } from '../lib/api';

interface SettingsState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (language: UserPreferences['language']) => void;
  clearError: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  editorFontSize: 16,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const { preferences } = await api.getPreferences();
      set({ preferences: { ...preferences, theme: 'light' }, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch preferences',
        isLoading: false,
      });
    }
  },

  updatePreferences: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { preferences } = await api.updatePreferences({ ...data, theme: 'light' });
      set({ preferences: { ...preferences, theme: 'light' }, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update preferences',
        isLoading: false,
      });
      throw error;
    }
  },

  setTheme: (_theme) => {
    // Theme is always light — dark mode is not supported
    set((state) => ({
      preferences: { ...state.preferences, theme: 'light' },
    }));
  },

  setLanguage: (language) => {
    set((state) => ({
      preferences: { ...state.preferences, language },
    }));
  },

  clearError: () => set({ error: null }),
}));
