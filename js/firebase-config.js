// Firebase Spark (Free) Web App client configuration.
// Firebase Web API keys are public client project identifiers; access control, schema validation,
// and quota bounds are enforced server-side by `firestore.rules` + Firebase Auth Authorized Domains.

export const DEFAULT_FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyBk8E9x9rF_HwM8dPBhfYL8m6yLc81ZFYA',
  authDomain: 'memory-game-f80b6.firebaseapp.com',
  projectId: 'memory-game-f80b6',
  storageBucket: 'memory-game-f80b6.firebasestorage.app',
  messagingSenderId: '544582646298',
  appId: '1:544582646298:web:7aa8d28e4d8aa7e392efa3'
});

export function getActiveFirebaseConfig() {
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId) {
    return DEFAULT_FIREBASE_CONFIG;
  }
  return null;
}

export function saveFirebaseConfigOverride() {
  // No-op in production: config is pinned to DEFAULT_FIREBASE_CONFIG to prevent localStorage endpoint hijacking.
}
