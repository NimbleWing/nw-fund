import { Avatar, Button, Tooltip } from '@heroui/react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MinusIcon, XIcon, ChevronsDownUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useBaseStore } from '@/stores';
export const WindowControls = () => {
  const currentWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);
  const appName = useBaseStore((state) => state.appName);
  useEffect(() => {
    const unlisten = currentWindow.onResized(() => {
      currentWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [currentWindow]);
  return (
    <>
      <Avatar className="rounded-lg bg-transparent w-[24px] h-[24px] ml-2">
        <Avatar.Image src="/logo.png" alt="App Logo" />
      </Avatar>
      <div className="ml-2">{appName}</div>
      <div className="ml-auto"></div>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            isIconOnly
            className="min-w-12 rounded-none"
            onPress={() => currentWindow.minimize()}
          >
            <MinusIcon />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>最小化</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            className="min-w-12 rounded-none"
            onPress={() => currentWindow.toggleMaximize()}
          >
            {isMaximized ? (
              <ChevronsDownUpIcon className="rotate-45" />
            ) : (
              <ChevronsUpDownIcon className="rotate-45" />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>{isMaximized ? '还原' : '最大化'}</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            isIconOnly
            className="min-w-12 rounded-none hover:bg-danger hover:text-white"
            onPress={() => currentWindow.close()}
          >
            <XIcon />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>关闭</Tooltip.Content>
      </Tooltip>
    </>
  );
};
