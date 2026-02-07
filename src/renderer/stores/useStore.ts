
import { create } from 'zustand';
import { GlobalConfig, Platform, PlatformPreset, Rule } from '../../shared/types';

interface AppState {
  config: GlobalConfig | null;
  platforms: Platform[];
  rules: Rule[];
  presets: PlatformPreset[];
  gitInstalled: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeApp: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<GlobalConfig>) => Promise<void>;
  
  fetchPlatforms: () => Promise<void>;
  createPlatform: (platform: Omit<Platform, 'id'>) => Promise<void>;
  updatePlatform: (platform: Platform) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;

  fetchRules: () => Promise<void>;
  // Rule actions can be added as needed

  checkGit: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  config: null,
  platforms: [],
  rules: [],
  presets: [],
  gitInstalled: false,
  isLoading: false,
  error: null,

  initializeApp: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().checkGit(),
        get().fetchConfig(),
        get().fetchPlatforms(),
        get().fetchRules()
      ]);
      
      // Load presets
      const presets = await window.api['config:get-presets']();
      set({ presets });

    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConfig: async () => {
    try {
      const config = await window.api['config:get-global']();
      set({ config });
    } catch (error) {
      console.error('Failed to fetch config', error);
    }
  },

  updateConfig: async (config) => {
    try {
      await window.api['config:set-global'](config);
      await get().fetchConfig();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchPlatforms: async () => {
    try {
      const platforms = await window.api['platform:list']();
      set({ platforms });
    } catch (error) {
      console.error('Failed to fetch platforms', error);
    }
  },

  createPlatform: async (platformData) => {
    try {
      await window.api['platform:create'](platformData);
      await get().fetchPlatforms();
    } catch (error) {
       set({ error: (error as Error).message });
       throw error;
    }
  },

  updatePlatform: async (platform) => {
    try {
      await window.api['platform:update'](platform);
      await get().fetchPlatforms();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deletePlatform: async (id) => {
    try {
      await window.api['platform:delete'](id);
      await get().fetchPlatforms();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchRules: async () => {
    try {
      const rules = await window.api['rule:list']();
      set({ rules });
    } catch (error) {
      console.error('Failed to fetch rules', error);
    }
  },

  checkGit: async () => {
    try {
      const installed = await window.api['git:check-installed']();
      set({ gitInstalled: installed });
    } catch (error) {
      console.error('Failed to check git', error);
      set({ gitInstalled: false });
    }
  }
}));
