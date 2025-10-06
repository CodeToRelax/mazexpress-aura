/**
 * Environment variable access layer
 * All environment variables should be accessed through this module
 * Never access import.meta.env directly in components
 */

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  
  if (!value && requiredEnvVars.includes(key as any)) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }
  
  return value || '';
}

export const env = {
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  app: {
    defaultLocale: getEnvVar('VITE_DEFAULT_LOCALE') || 'en',
    supportedLocales: (getEnvVar('VITE_SUPPORTED_LOCALES') || 'en,ar').split(','),
    apiUrl: getEnvVar('VITE_API_BASE_URL') || 'http://localhost:3000',
  },
} as const;
