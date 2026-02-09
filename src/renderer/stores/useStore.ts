import { create } from 'zustand';
import { SystemConfig, UserConfig, Platform, PlatformPreset, Rule, Skill, SkillRepo } from '../../shared/types';
import { IpcChannels } from '../../shared/ipc-channels';

interface AppState {
  systemConfig: SystemConfig | null;
  userConfig: UserConfig | null;
  platforms: Platform[];
  skills: Skill[]; // Added
  rules: Rule[];
  presets: PlatformPreset[];
  gitInstalled: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeApp: () => Promise<void>;
  
  // System Config
  fetchSystemConfig: () => Promise<void>;
  updateSystemConfig: (config: Partial<SystemConfig>) => Promise<void>;
  
  // User Config
  fetchUserConfig: () => Promise<void>;
  updateUserConfig: (config: Partial<UserConfig>) => Promise<void>;

  // Platform
  fetchPlatforms: () => Promise<void>;
  createPlatform: (platform: Omit<Platform, 'id'>) => Promise<void>;
  updatePlatform: (platform: Platform) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;

  // Skills
  fetchSkills: () => Promise<void>;
  addRepo: (url: string, localPath?: string) => Promise<void>;
  deleteRepo: (id: string) => Promise<void>;
  checkRepoUpdate: (id: string) => Promise<void>;
  linkSkill: (skillId: string, platformId: string) => Promise<void>;
  unlinkSkill: (skillId: string, platformId: string) => Promise<void>;

  // Rules
  fetchRules: () => Promise<void>;
  
  checkGit: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  systemConfig: null,
  userConfig: null,
  platforms: [],
  skills: [],
  rules: [],
  presets: [],
  gitInstalled: false,
  isLoading: false,
  error: null,

  initializeApp: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().checkGit();
      await get().fetchSystemConfig();
      
      const systemConfig = get().systemConfig;
      if (systemConfig?.baseDir) {
        await get().fetchUserConfig();
      }

      await Promise.all([
        get().fetchPlatforms(),
        get().fetchSkills(), // Added
        get().fetchRules()
      ]);
      
      const presets = await window.api[IpcChannels.GetPresets]();
      set({ presets });

    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSystemConfig: async () => {
    try {
      const config = await window.api[IpcChannels.GetSystemConfig]();
      set({ systemConfig: config });
    } catch (error) {
      console.error('Failed to fetch system config', error);
    }
  },

  updateSystemConfig: async (config) => {
    try {
      await window.api[IpcChannels.SetSystemConfig](config);
      await get().fetchSystemConfig();
      
      if (config.baseDir) {
        await get().fetchUserConfig();
        await Promise.all([
           get().fetchPlatforms(),
           get().fetchSkills(), // Added refresh
           get().fetchRules()
        ]);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchUserConfig: async () => {
    try {
      const config = await window.api[IpcChannels.GetUserConfig]();
      set({ userConfig: config });
    } catch (error) {
      console.error('Failed to fetch user config', error);
    }
  },

  updateUserConfig: async (config) => {
    try {
      await window.api[IpcChannels.SetUserConfig](config);
      await get().fetchUserConfig();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchPlatforms: async () => {
    try {
      const platforms = await window.api[IpcChannels.ListPlatforms]();
      set({ platforms });
    } catch (error) {
      console.error('Failed to fetch platforms', error);
    }
  },

  createPlatform: async (platformData) => {
    try {
      await window.api[IpcChannels.CreatePlatform](platformData);
      await get().fetchPlatforms();
    } catch (error) {
       set({ error: (error as Error).message });
       throw error;
    }
  },

  updatePlatform: async (platform) => {
    try {
      await window.api[IpcChannels.UpdatePlatform](platform);
      await get().fetchPlatforms();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deletePlatform: async (id) => {
    try {
      await window.api[IpcChannels.DeletePlatform](id);
      await get().fetchPlatforms();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchSkills: async () => {
    try {
        const skills = await window.api[IpcChannels.ListSkills]();
        set({ skills });
    } catch (error) {
        console.error('Failed to fetch skills', error);
    }
  },

  addRepo: async (url, localPath) => {
    try {
        set({ isLoading: true });
        await window.api[IpcChannels.CloneRepo](url, localPath);
        await get().fetchUserConfig(); // Refresh repos list
        await get().fetchSkills();     // Refresh skills list
    } catch (error) {
        set({ error: (error as Error).message });
        throw error;
    } finally {
        set({ isLoading: false });
    }
  },

  deleteRepo: async (id) => {
    try {
        set({ isLoading: true });
        await window.api[IpcChannels.DeleteRepo](id);
        await get().fetchUserConfig();
        await get().fetchSkills();
    } catch (error) {
        set({ error: (error as Error).message });
    } finally {
        set({ isLoading: false });
    }
  },

  checkRepoUpdate: async (id) => {
    try {
        const result = await window.api[IpcChannels.CheckUpdates](id);
        // Update the repo status in the store
        // We might need to update the UserConfig or a separate status map
        // For now, let's assume we refresh the config to get updated status if it was saved
        // But CheckUpdates returns a result, we should probably store it.
        // The current design suggests the repo object has 'updateStatus', let's stick to that if possible.
        // However, CheckUpdates is usually on-demand.
        // Let's just log it for now or assume the backend updates the config if needed?
        // Actually, the backend GitService.checkUpdates doesn't seem to save to config automatically in previous designs.
        // Let's assume we need to update the local state.
        const userConfig = get().userConfig;
        if (userConfig) {
            const updatedRepos = userConfig.skills.map(repo => {
                if (repo.id === id) {
                    return {
                        ...repo,
                        updateStatus: result.hasUpdates ? 'behind' : 'up-to-date',
                        behindCount: result.behindCount
                    } as SkillRepo;
                }
                return repo;
            });
            set({ userConfig: { ...userConfig, skills: updatedRepos } });
        }
    } catch (error) {
        console.error('Failed to check repo updates', error);
    }
  },

  linkSkill: async (skillId, platformId) => {
    try {
        await window.api[IpcChannels.LinkSkill](skillId, platformId);
        await get().fetchSkills(); // Refresh to update linked status
        await get().fetchPlatforms(); // Refresh platforms to see linked skills
    } catch (error) {
        set({ error: (error as Error).message });
    }
  },

  unlinkSkill: async (skillId, platformId) => {
    try {
        await window.api[IpcChannels.UnlinkSkill](skillId, platformId);
        await get().fetchSkills();
        await get().fetchPlatforms();
    } catch (error) {
        set({ error: (error as Error).message });
    }
  },

  fetchRules: async () => {
    try {
      const rules = await window.api[IpcChannels.ListRules]();
      set({ rules });
    } catch (error) {
      console.error('Failed to fetch rules', error);
    }
  },

  checkGit: async () => {
    try {
      const installed = await window.api[IpcChannels.CheckGitInstalled]();
      set({ gitInstalled: installed });
    } catch (error) {
      console.error('Failed to check git', error);
      set({ gitInstalled: false });
    }
  }
}));
