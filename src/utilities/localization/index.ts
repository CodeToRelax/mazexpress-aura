import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { appConfig } from '@/app.config';

import enCommon from './en/common.json';
import arCommon from './ar/common.json';
import enACL from './en/acl.json';
import arACL from './ar/acl.json';

/**
 * Initialize i18next with language detection and resources
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        acl: enACL.acl,
      },
      ar: {
        common: arCommon,
        acl: arACL.acl,
      },
    },
    fallbackLng: appConfig.localization.fallbackLocale,
    defaultNS: 'common',
    ns: ['common', 'acl'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: true,
    },
  });

/**
 * Change language and update document direction
 */
export function changeLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export default i18n;
