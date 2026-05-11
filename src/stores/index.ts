import { getName, getVersion } from '@tauri-apps/api/app';
import { create } from 'zustand';

import { MarketStatus, type MarketStatus as MarketStatusType } from '@/constants/market';

interface BaseState {
  appName: string;
  appVersion: string;
  marketStatus: MarketStatusType;
  setMarketStatus: (status: MarketStatusType) => void;
  init: () => Promise<void>;
}

export const useBaseStore = create<BaseState>((set) => ({
  appName: '',
  appVersion: '',
  marketStatus: MarketStatus.CLOSED,
  setMarketStatus: (status) => set({ marketStatus: status }),
  init: async () => {
    const appName = await getName();
    const appVersion = await getVersion();
    set({ appName, appVersion });
  },
}));
