import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/utilities/localization';
import { PageLoader } from '@/components/feedback/PageLoader';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
}
