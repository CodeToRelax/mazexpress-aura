import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/utilities/localization';

/**
 * Hook for locale management
 * Provides current language, direction, and toggle function
 */
export function useLocale() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language as 'en' | 'ar';
  const isRTL = currentLanguage === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';
  
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };
  
  const setLanguage = (lang: 'en' | 'ar') => {
    changeLanguage(lang);
  };
  
  return {
    currentLanguage,
    isRTL,
    direction,
    toggleLanguage,
    setLanguage,
  };
}
