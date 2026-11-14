// Paste your Firebase Spark (Free) Web App config here once created in console.firebase.google.com!
// Note: Firebase Web API keys are public-by-design client identifiers; security is enforced
// server-side by `firestore.rules` + Firebase Auth Authorized Domains (ericbklok.github.io).

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
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
