import { listen } from '@tauri-apps/api/event';
import { useMount, useUnmount } from 'ahooks';
import { useRef } from 'react';

export const useTauriListen = <T>(...arg: Parameters<typeof listen<T>>) => {
  const unlistenRef = useRef(() => {});
  useMount(async () => {
    unlistenRef.current = await listen<T>(...arg);
  });
  useUnmount(unlistenRef.current);
};
