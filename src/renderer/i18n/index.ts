import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './locales/en-US.json';
import zhCN from './locales/zh-CN.json';

const resources = {
  'en-US': { translation: enUS },
  'zh-CN': { translation: zhCN }
};

// Detect language from localStorage or system
const savedLanguage = localStorage.getItem('language');
const systemLanguage = navigator.language;
const defaultLanguage = savedLanguage || (systemLanguage.startsWith('zh') ? 'zh-CN' : 'en-US');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
