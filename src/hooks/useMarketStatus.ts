import { invoke } from '@tauri-apps/api/core';
import { useAsyncEffect } from 'ahooks';
import { useEffect, useRef } from 'react';

import { useBaseStore } from '@/stores';
import { type Holiday, isMarketOpen } from '@/utils/market';

const REFRESH_INTERVAL = 60 * 1000;

export function useMarketStatus() {
  const holidaysRef = useRef<Holiday[]>([]);
  const setMarketStatus = useBaseStore((state) => state.setMarketStatus);
  const marketStatus = useBaseStore((state) => state.marketStatus);
  const fetchedRef = useRef(false);

  useAsyncEffect(async () => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      const currentYear = new Date().getFullYear().toString();
      try {
        const result = await invoke<Holiday[]>('holiday_list_by_year', { year: currentYear });
        holidaysRef.current = result;
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    }
  }, []);

  useEffect(() => {
    const updateStatus = () => {
      setMarketStatus(isMarketOpen(holidaysRef.current, new Date()));
    };

    updateStatus();
    const interval = setInterval(updateStatus, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [setMarketStatus]);

  return { marketStatus, holidays: holidaysRef.current };
}
