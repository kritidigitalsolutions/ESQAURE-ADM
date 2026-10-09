import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

/**
 * Firebase Client Configuration
 * Pulls from environment variables with defaults for E² Stories OTT project
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDsSRQMUbzE2X4LNSfg8GRuIWUONELUYNM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'e2-stories.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'e2-stories',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'e2-stories.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1028194039722',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1028194039722:web:1dc613003a521b81165dd3'
};

// Singleton Firebase App and Auth instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Helper to check whether Firebase configuration values are present
 */
export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

/**
 * Translates Firebase error codes into friendly, clear admin UI messages
 */
export const getFirebaseErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format.';
    case 'auth/user-disabled':
      return 'This administrator account has been disabled. Please contact the platform owner.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. For security reasons, please wait a few minutes before trying again or reset your password.';
    case 'auth/network-request-failed':
      return 'Network connection error: Unable to reach Firebase. Please check your internet connection.';
    case 'auth/weak-password':
      return 'The new password is too weak. Please use at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires a recent login. Please sign out and sign back in before trying again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Firebase Email/Password Authentication is not yet enabled in Firebase Console. Please activate it in console.firebase.google.com -> Authentication -> Sign-in method.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase API Key is invalid. Please verify VITE_FIREBASE_API_KEY in your admin/.env configuration.';
    default:
      if (message.includes('CONFIGURATION_NOT_FOUND')) {
        return 'Firebase Authentication is not yet activated in Firebase Console for this project. Please enable Email/Password in console.firebase.google.com.';
      }
      return message.replace(/^Firebase:\s*/i, '') || 'Authentication failed. Please try again.';
  }
};

/**
 * Log in admin via Firebase Email & Password
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
};

/**
 * Send password reset email via Firebase Auth
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export const sendResetPasswordEmail = async (email) => {
  await sendPasswordResetEmail(auth, email.trim());
  return true;
};

/**
 * Log out current Firebase admin user
 */
export const logoutAdmin = async () => {
  await signOut(auth);
};

/**
 * Update authenticated admin password in Firebase
 * Re-authenticates if currentPassword is provided
 *
 * @param {string} newPassword
 * @param {string} [currentPassword]
 * @returns {Promise<boolean>}
 */
export const updateAdminPassword = async (newPassword, currentPassword = '') => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No active administrator session found. Please log in again.');
  }

  // If current password provided, re-authenticate first to prevent requires-recent-login errors
  if (currentPassword && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  await updatePassword(user, newPassword);
  return true;
};

/**
 * Update authenticated admin profile details in Firebase
 *
 * @param {string} displayName
 * @returns {Promise<void>}
 */
export const updateAdminProfile = async (displayName) => {
  const user = auth.currentUser;
  if (!user) return;
  await updateProfile(user, { displayName: displayName.trim() });
};

/**
 * Listen for Firebase auth state changes
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get currently authenticated admin user or null
 */
export const getCurrentAdmin = () => {
  return auth.currentUser;
};

export default {
  auth,
  isFirebaseConfigured,
  getFirebaseErrorMessage,
  loginWithEmail,
  sendResetPasswordEmail,
  logoutAdmin,
  updateAdminPassword,
  updateAdminProfile,
  subscribeToAuthChanges,
  getCurrentAdmin
};
