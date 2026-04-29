import { Button, Link, Modal, Spinner, toast } from '@heroui/react';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useCreation, useReactive } from 'ahooks';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';

import { LISTEN_KEY } from '@/constants';
import { useTauriListen } from '@/hooks/useTauriListen';
import { dayjs, formatDate } from '@/utils/dayjs';

interface State {
  open: boolean;
  loading?: boolean;
  update?: Update;
  total?: number;
  download: number;
}
export const UpdateApp = () => {
  const { t } = useTranslation();
  let checkingId: string;
  const state = useReactive<State>({ open: false, download: 0 });
  // 监听更新时间
  useTauriListen<boolean>(LISTEN_KEY.UPDATE_APP, () => {
    checkUpdate(true);
    checkingId = toast.info(t('component.app_update.hints.checking_update'), {
      timeout: 0,
      isLoading: true,
    });
  });
  // 确认按钮的文本
  const okText = useCreation(() => {
    const { loading, total, download } = state;
    if (loading) {
      if (!total) return '0%';
      const percent = (download / total) * 100;
      return `${percent.toFixed(2)}%`;
    }
    return t('component.app_update.button.confirm_update');
  }, [state.loading, state.total, state.download]);
  // 检测更新
  const checkUpdate = async (showMessage = false) => {
    try {
      const update = await check();

      if (update) {
        const { version, currentVersion, body = '', date } = update;
        Object.assign(update, {
          body: replaceBody(body),
          currentVersion: `v${currentVersion}`,
          date: formatDate(dayjs.utc(date?.split('.')[0]).local()),
          version: `v${version}`,
        });
        Object.assign(state, { open: true, update });
      } else if (showMessage) {
        toast.info(t('component.app_update.hints.latest_version'));
      }
    } catch (error) {
      console.log(error);

      toast.danger(String(error));
    } finally {
      toast.close(checkingId);
    }
  };
  // 替换更新日志里的内容
  const replaceBody = (body: string) => {
    return body
      .replace(/&nbsp;/g, '')
      .split('\n')
      .map((line) => line.replace(/\s*-\s+by\s+@.*/, ''))
      .join('\n');
  };
  const handleOk = async () => {
    state.loading = true;
    try {
      await state.update?.downloadAndInstall((progress) => {
        switch (progress.event) {
          case 'Started':
            state.total = progress.data.contentLength;
            break;
          case 'Progress':
            state.download += progress.data.chunkLength;
            break;
        }
      });
      await relaunch();
    } catch (error) {
      toast(String(error));
    }
    state.loading = false;
  };
  const handleOpenChange = (isOpen: boolean) => {
    state.open = isOpen;
  };
  return (
    <Modal.Backdrop isOpen={state.open} onOpenChange={handleOpenChange} isDismissable={false}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger></Modal.CloseTrigger>
          <Modal.Header>
            <Modal.Heading>{t('component.app_update.label.new_version_title')}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {t('component.app_update.label.release_version')}：
            <span>
              {state.update?.currentVersion} 👉 {state.update?.version}
            </span>
            <div>
              {t('component.app_update.label.release_time')}：<span>{state.update?.date}</span>
            </div>
            {t('component.app_update.label.release_notes')}：
            <Markdown
              components={{
                a: ({ href, children }) => <Link href={href}>{children}</Link>,
              }}
            >
              {state.update?.body}
            </Markdown>
          </Modal.Body>
          <Modal.Footer>
            <Button
              slot="close"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              isDisabled={state.loading}
            >
              {t('component.app_update.button.cancel_update')}
            </Button>
            <Button onClick={() => handleOk()} isPending={state.loading}>
              {state.loading ? (
                <>
                  <Spinner color="current" size="sm" /> {okText}
                </>
              ) : (
                okText
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
