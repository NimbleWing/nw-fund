import { Tabs } from '@heroui/react';
import { useMount } from 'ahooks';
import { useCreation } from 'ahooks';
import { InfoIcon } from 'lucide-react';
// import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTray } from '@/hooks/useTray';

import { About } from './components/About';
import { UpdateApp } from './components/About/components/UpdateApp';

export const Preference = () => {
  const { t } = useTranslation();
  const { createTray } = useTray();

  useMount(async () => {
    await createTray();
  });
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
