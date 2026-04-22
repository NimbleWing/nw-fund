import { getName, getVersion } from '@tauri-apps/api/app';
import { create } from 'zustand';
interface BaseState {
  appName: string;
  appVersion: string;
  init: () => Promise<void>;
}

export const useBaseStore = create<BaseState>((set) => ({
  appName: '',
  appVersion: '',
  init: async () => {
    const appName = await getName();
    const appVersion = await getVersion();
    set({ appName, appVersion });
  },
}));
