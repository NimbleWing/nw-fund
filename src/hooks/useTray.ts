import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import { exit } from '@tauri-apps/plugin-process';

const TRAY_ID = 'app-tray';
export const useTray = () => {
  // 通过 id 获取托盘图标
  const getTrayById = () => {
    return TrayIcon.getById(TRAY_ID);
  };
  // 创建托盘
  const createTray = async () => {
    const tray = await getTrayById();
    if (tray) return;
    const appName = '灵翼基金管理';
    const appVersion = '1.0.0';
    const menu = await getTrayMenu();
    const iconPath = 'icons/icon.ico';
    const icon = await resolveResource(iconPath);
    console.log(icon);
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
  const getTrayMenu = async () => {
    const appVersion = '1.0.0';
    const items = await Promise.all([
      MenuItem.new({
        enabled: false,
        text: `灵翼基金管理 v${appVersion}`,
      }),
      MenuItem.new({
        action: () => exit(0),
        text: '退出应用',
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
