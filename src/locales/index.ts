import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './en-US.json';
import zhCN from './zh-CN.json';
const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
};

i18n.use(initReactI18next).init({
  resources: {
    [LANGUAGES.ZH_CN]: {
      translation: zhCN,
    },
    [LANGUAGES.EN_US]: {
      translation: enUS,
    },
  },
  lng: LANGUAGES.ZH_CN,
  debug: true,
});

export default i18n;
