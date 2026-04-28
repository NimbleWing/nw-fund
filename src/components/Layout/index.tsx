import { useState } from 'react';
import { Outlet } from 'react-router';

import { Sidebar } from './Sidebar';
import { WindowControls } from './WindowControls';

export const Layout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部标题栏 */}
      <div
        data-tauri-drag-region
        className="flex items-center pointer-events-auto h-10 bg-default-50/25 backdrop-blur-lg backdrop-saturate-125"
      >
        <WindowControls />
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />

        <main className="flex-1 p-6 overflow-auto">
          {/* 内容区 */} <Outlet />
        </main>
      </div>
    </div>
  );
};
