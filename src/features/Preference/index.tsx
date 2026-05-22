import { Tabs } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useCreation, useMount } from 'ahooks';
import { InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LISTEN_KEY } from '@/constants';
import type { MarketStatus as MarketStatusType } from '@/constants/market';
import { useTauriListen } from '@/hooks/useTauriListen';
import { useTray } from '@/hooks/useTray';
import { useBaseStore } from '@/stores';

import { About } from './components/About';
import { UpdateApp } from './components/About/components/UpdateApp';

export const Preference = () => {
  const { t } = useTranslation();
  const { createTray, updateTrayMenu } = useTray();
  const marketStatus = useBaseStore((state) => state.marketStatus);

  useTauriListen<MarketStatusType>(LISTEN_KEY.MARKET_STATUS_CHANGED, (event) => {
    useBaseStore.getState().setMarketStatus(event.payload);
  });

  useMount(async () => {
    try {
      const status = await invoke<MarketStatusType>('get_market_status');
      useBaseStore.getState().setMarketStatus(status);
      await createTray(status);
    } catch (error) {
      console.error('Failed to get market status:', error);
      await createTray(marketStatus);
    }
  });

  useEffect(() => {
    updateTrayMenu(marketStatus);
  }, [marketStatus, updateTrayMenu]);

  const menuItems = useCreation(() => {
    return [
      {
        content: <About />,
        icon: <InfoIcon />,
        key: 'about',
        label: t('preference.menu.title.about'),
      },
    ];
  }, []);
  return (
    <>
      <Tabs orientation="vertical" className="w-full h-screen flex gap-6">
        <Tabs.ListContainer>
          <Tabs.List className="h-screen gap-2 rounded-sm">
            {menuItems.map((item) => {
              const { key, label, icon } = item;
              return (
                <Tabs.Tab id={key} key={key} className="justify-start text-left ">
                  {icon}
                  <span className="ml-2">{label}</span>
                  <Tabs.Indicator className="rounded-sm" />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
        {menuItems.map((item) => {
          const { key, content } = item;
          return (
            <Tabs.Panel id={key} key={key} className="h-full flex-1">
              {content}
            </Tabs.Panel>
          );
        })}
      </Tabs>

      <UpdateApp />
    </>
  );
};
