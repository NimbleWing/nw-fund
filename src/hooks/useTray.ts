import { emit } from '@tauri-apps/api/event';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import { BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { exit } from '@tauri-apps/plugin-process';
import { useTranslation } from 'react-i18next';

import { LISTEN_KEY } from '@/constants';
import { MarketStatus, type MarketStatus as MarketStatusType } from '@/constants/market';
import { showWindow } from '@/plugins/window';
import { useBaseStore } from '@/stores';

const TRAY_ID = 'app-tray';
const DEFAULT_ICON = 'icons/icon.ico';

const getTrayInfo = (marketStatus: MarketStatusType) => {
  const isOpen = marketStatus === MarketStatus.OPEN;
  return {
    iconPath: isOpen ? 'icons/icon-open.ico' : 'icons/icon-close.ico',
    tooltipStatus: isOpen ? '● 开市' : '○ 休市',
    menuStatusText: isOpen ? '🟢 开市' : '🟠 休市',
  };
};

const resolveIcon = async (iconPath: string): Promise<string> => {
  const iconExists = await exists(iconPath, { baseDir: BaseDirectory.Resource }).catch(() => false);
  if (!iconExists) {
    console.error(`[useTray] Icon not found: ${iconPath}, falling back to ${DEFAULT_ICON}`);
    const fallbackExists = await exists(DEFAULT_ICON, { baseDir: BaseDirectory.Resource }).catch(
      () => false
    );
    if (fallbackExists) {
      return await resolveResource(DEFAULT_ICON);
    }
    console.error(`[useTray] Fallback icon not found: ${DEFAULT_ICON}`);
    throw new Error(`Icon not found: ${iconPath}`);
  }
  return await resolveResource(iconPath);
};

export const useTray = () => {
  const { t } = useTranslation();
  const getTrayById = () => TrayIcon.getById(TRAY_ID);

  const createTray = async (marketStatus: MarketStatusType = MarketStatus.CLOSED) => {
    const { appName, appVersion } = useBaseStore.getState();
    const tray = await getTrayById();
    if (tray) return;

    const { iconPath, tooltipStatus } = getTrayInfo(marketStatus);
    const icon = await resolveIcon(iconPath);
    const menu = await getTrayMenu(appName, appVersion, marketStatus);

    console.log(`[useTray] Creating tray with icon: ${iconPath}, status: ${tooltipStatus}`);

    const options: TrayIconOptions = {
      action: (event) => {
        if (event.type === 'Click' && event.button === 'Left') {
          showWindow('main');
        }
      },
      icon,
      iconAsTemplate: true,
      id: TRAY_ID,
      menu,
      menuOnLeftClick: true,
      tooltip: `${appName} v${appVersion}\n${tooltipStatus}`,
    };
    await TrayIcon.new(options);
  };

  const updateTrayMenu = async (marketStatus: MarketStatusType) => {
    const { appName, appVersion } = useBaseStore.getState();
    const { iconPath, tooltipStatus } = getTrayInfo(marketStatus);
    const icon = await resolveIcon(iconPath);
    const menu = await getTrayMenu(appName, appVersion, marketStatus);
    const tray = await getTrayById();

    console.log(`[useTray] Updating tray icon: ${iconPath}, status: ${tooltipStatus}`);

    if (tray) {
      await tray.setMenu(menu);
      await tray.setTooltip(`${appName} v${appVersion}\n${tooltipStatus}`);
      await tray.setIcon(icon);
    }
  };

  const getTrayMenu = async (
    appName: string,
    appVersion: string,
    marketStatus: MarketStatusType = MarketStatus.CLOSED
  ) => {
    const { menuStatusText } = getTrayInfo(marketStatus);
    const items = await Promise.all([
      MenuItem.new({
        enabled: false,
        text: menuStatusText,
      }),
      MenuItem.new({
        action: () => {
          showWindow();
          emit(LISTEN_KEY.UPDATE_APP, true);
        },
        text: t('component.tray.label.check_update'),
      }),
      MenuItem.new({
        enabled: false,
        text: `${appName} v${appVersion}`,
      }),
      MenuItem.new({
        action: () => exit(0),
        text: t('component.tray.label.exit'),
      }),
    ]);
    return Menu.new({
      items,
    });
  };

  return {
    createTray,
    updateTrayMenu,
  };
};
