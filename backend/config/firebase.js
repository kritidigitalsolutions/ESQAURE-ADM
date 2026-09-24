import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging as adminGetMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK singleton.
 * Supports:
 *  1. Path to JSON file (config/serviceAccountKey.json or env variable)
 *  2. Inline JSON string in process.env.FIREBASE_SERVICE_ACCOUNT_JSON
 */
export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  try {
    // 1. Check for inline JSON string (helpful for cloud deployments like Render/Heroku/AWS)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('✅ [Firebase] Initialized with inline credentials.');
      return firebaseApp;
    }

    // 2. Check for local file path
    const resolvedPath = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(__dirname, '..', env.FIREBASE_SERVICE_ACCOUNT_PATH);

    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log(`✅ [Firebase] Initialized successfully with key: ${path.basename(resolvedPath)} (Project: ${serviceAccount.project_id})`);
      return firebaseApp;
    }

    console.warn('⚠️  [Firebase] Key file not found at:', resolvedPath);
    console.warn('⚠️  [Firebase] FCM push notifications will run in disabled/dry-run mode.');
  } catch (error) {
    console.error('❌ [Firebase] Initialization failed:', error.message);
  }

  return firebaseApp;
};

/**
 * Returns the Firebase Messaging instance if initialized, else null.
 */
export const getMessaging = () => {
  const app = firebaseApp || initializeFirebase();
  if (!app) return null;
  try {
    return adminGetMessaging(app);
  } catch (err) {
    console.error('❌ [Firebase] Failed to get messaging instance:', err.message);
    return null;
  }
};

export default { initializeFirebase, getMessaging };
