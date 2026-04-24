import { emit } from '@tauri-apps/api/event';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import { exit } from '@tauri-apps/plugin-process';
import { useTranslation } from 'react-i18next';

import { useBaseStore } from '@/stores';

const TRAY_ID = 'app-tray';
const LISTEN_KEY = {
  UPDATE_APP: 'update-app',
};
export const useTray = () => {
  const { t } = useTranslation();
  // 通过 id 获取托盘图标
  const getTrayById = () => {
    return TrayIcon.getById(TRAY_ID);
  };
  // 创建托盘
  const createTray = async () => {
    const appName = useBaseStore.getState().appName;
    const appVersion = useBaseStore.getState().appVersion;
    const tray = await getTrayById();
    if (tray) return;
    const menu = await getTrayMenu(appName, appVersion);
    const iconPath = 'icons/icon.ico';
    const icon = await resolveResource(iconPath);
    const options: TrayIconOptions = {
      icon,
      iconAsTemplate: true,
      id: TRAY_ID,
      menu,
      menuOnLeftClick: true,
      tooltip: `${appName} v${appVersion}`,
    };
    return TrayIcon.new(options);
  };
  // 获取托盘菜单
  const getTrayMenu = async (appName: string, appVersion: string) => {
    const items = await Promise.all([
      MenuItem.new({
        action: () => {
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
  };
};
