import { env } from './env';

/**
 * Application configuration
 * Sanitized config object that components should import from
 */

export const appConfig = {
  name: 'MazExpress Admin',
  version: '1.0.0',
  
  firebase: {
    config: env.firebase,
  },
  
  localization: {
    defaultLocale: env.app.defaultLocale as 'en' | 'ar',
    supportedLocales: env.app.supportedLocales as ('en' | 'ar')[],
    fallbackLocale: 'en' as const,
  },
  
  auth: {
    persistenceType: 'local' as const,
    redirectAfterLogin: '/',
    redirectAfterLogout: '/login',
  },
  
  ui: {
    toastDuration: 4000,
    animationDuration: 300,
  },
} as const;

export type AppConfig = typeof appConfig;
