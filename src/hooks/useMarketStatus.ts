import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

import { LISTEN_KEY } from '@/constants';
import type { MarketStatus } from '@/constants/market';
import { useBaseStore } from '@/stores';

export function useMarketStatus() {
  const setMarketStatus = useBaseStore((state) => state.setMarketStatus);

  useEffect(() => {
    invoke<MarketStatus>('get_market_status').then(setMarketStatus).catch(console.error);
  }, [setMarketStatus]);

  useEffect(() => {
    const unlisten = listen<MarketStatus>(LISTEN_KEY.MARKET_STATUS_CHANGED, (event) => {
      setMarketStatus(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setMarketStatus]);
}
