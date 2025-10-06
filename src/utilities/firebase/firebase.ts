import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { appConfig } from '@/app.config';

let app: FirebaseApp;
let auth: Auth;

/**
 * Initialize Firebase
 * Uses singleton pattern to prevent multiple initializations
 */
export function initializeFirebase(): { app: FirebaseApp; auth: Auth } {
  if (!getApps().length) {
    app = initializeApp(appConfig.firebase.config);
    auth = getAuth(app);
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }
  
  return { app, auth };
}

/**
 * Get Firebase auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const initialized = initializeFirebase();
    return initialized.auth;
  }
  return auth;
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const initialized = initializeFirebase();
    return initialized.app;
  }
  return app;
}
