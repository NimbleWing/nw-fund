const COMMAND = {
  SHOW_WINDOW: 'show_window',
};
/**
 * 显示窗口
 */

import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { WindowLabel } from '@tauri-apps/api/window';

import { LISTEN_KEY } from '@/constants';

export const showWindow = (label?: WindowLabel) => {
  console.log('show window', label);
  if (label) {
    emit(LISTEN_KEY.SHOW_WINDOW, label);
  } else {
    invoke(COMMAND.SHOW_WINDOW);
  }
};
