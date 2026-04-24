import { Avatar, Button } from '@heroui/react';
import { emit } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';

import { ProList } from '@/components/ProList';
import ProListItem from '@/components/ProListItem';
import { useBaseStore } from '@/stores';

export const About = () => {
  const { t } = useTranslation();
  const appName = useBaseStore((state) => state.appName);
  const appVersion = useBaseStore((state) => state.appVersion);
  return (
    <ProList header={t('preference.about.about_software.title')}>
      <ProListItem
        avatar={
          <Avatar>
            <Avatar.Image src="/logo.png" />
          </Avatar>
        }
        description={`${t('preference.about.about_software.label.version')}v${appVersion}`}
        title={appName}
        showDivider
      >
        <Button
          className="rounded-sm"
          onClick={() => {
            emit('update-app', true);
          }}
        >
          {t('preference.about.about_software.button.check_update')}
        </Button>
      </ProListItem>
    </ProList>
  );
};
