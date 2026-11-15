// Paste your Firebase Spark (Free) Web App config here once created in console.firebase.google.com!
// Note: Firebase Web API keys are public-by-design client identifiers; security is enforced
// server-side by `firestore.rules` + Firebase Auth Authorized Domains (ericbklok.github.io).

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBk8E9x9rF_HwM8dPBhfYL8m6yLc81ZFYA',
  authDomain: 'memory-game-f80b6.firebaseapp.com',
  projectId: 'memory-game-f80b6',
  storageBucket: 'memory-game-f80b6.firebasestorage.app',
  messagingSenderId: '544582646298',
  appId: '1:544582646298:web:7aa8d28e4d8aa7e392efa3'
};

const LOCAL_OVERRIDE_KEY = 'daily_mindsum_firebase_config_override';

export function getActiveFirebaseConfig() {
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId) {
    return DEFAULT_FIREBASE_CONFIG;
  }
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveFirebaseConfigOverride(cfg) {
  localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(cfg));
}
