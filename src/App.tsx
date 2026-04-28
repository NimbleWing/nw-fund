import { ToastProvider } from '@heroui/react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useBoolean, useMount } from 'ahooks';
import { RouterProvider } from 'react-router';

import { useTauriListen } from '@/hooks/useTauriListen';

import { LISTEN_KEY } from './constants';
import { showWindow } from './plugins/window';
import { router } from './router';
import { useBaseStore } from './stores';

function App() {
  const [ready, { setTrue }] = useBoolean();

  useMount(async () => {
    await useBaseStore.getState().init();
    setTrue();
  });
  // 监听显示窗口的时间
  useTauriListen(LISTEN_KEY.SHOW_WINDOW, ({ payload }) => {
    const appWindow = getCurrentWebviewWindow();
    if (appWindow.label !== payload) return;
    showWindow();
  });

  return (
    <>
      {ready && <RouterProvider router={router} />}
      <ToastProvider placement="top" />
    </>
  );
}

export default App;
