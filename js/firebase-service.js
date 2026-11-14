import { getActiveFirebaseConfig } from './firebase-config.js';
import { getTodayDateStr } from './storage.js';

const FB_VERSION = '10.14.1';

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let sdkModules = null;
let currentAuthUser = null;
const authListeners = new Set();

export function isFirebaseConfigured() {
  return Boolean(getActiveFirebaseConfig());
}

export function getCurrentAuthUser() {
  return currentAuthUser;
}

export function onUserChanged(cb) {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

export async function initFirebaseIfConfigured() {
  const cfg = getActiveFirebaseConfig();
  if (!cfg) return { ready: false, reason: 'unconfigured' };
  if (fbApp && fbAuth && fbDb) return { ready: true };

  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`)
    ]);
    sdkModules = { appMod, authMod, fsMod };
    fbApp = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
    fbAuth = authMod.getAuth(fbApp);
    fbDb = fsMod.getFirestore(fbApp);

    // Handle redirect result cleanly on mobile / PWA
    authMod.getRedirectResult(fbAuth).catch(err => {
      console.warn('Redirect sign-in note:', err);
    });

    authMod.onAuthStateChanged(fbAuth, user => {
      currentAuthUser = user || null;
      authListeners.forEach(fn => fn(currentAuthUser));
    });

    return { ready: true };
  } catch (err) {
    console.warn('Firebase SDK load error:', err);
    return { ready: false, reason: err.message || 'load_failed' };
  }
}

export async function signInWithGoogle() {
  const initRes = await initFirebaseIfConfigured();
  if (!initRes.ready) throw new Error('Firebase not configured yet');
  const { authMod } = sdkModules;
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await authMod.signInWithPopup(fbAuth, provider);
    return cred.user;
  } catch (err) {
    // Fallback to redirect on strict mobile/PWA webviews where popups are blocked
    if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) {
      await authMod.signInWithRedirect(fbAuth, provider);
      return null;
    }
    throw err;
  }
}

export async function signOutCloud() {
  if (!fbAuth || !sdkModules) return;
  await sdkModules.authMod.signOut(fbAuth);
}

export async function syncScoreToCloud(state) {
  if (!fbDb || !currentAuthUser || !sdkModules) return false;
  const { fsMod } = sdkModules;
  const uid = currentAuthUser.uid;
  const docRef = fsMod.doc(fbDb, 'leaderboard', uid);

  const circles = Array.from(
    new Set([state.profile.myCircleCode, ...(state.profile.joinedCircles || [])].filter(Boolean))
  ).slice(0, 10);

  const payload = {
    uid,
    displayName: String(state.profile.displayName || currentAuthUser.displayName || '茶客').slice(0, 24),
    avatar: String(state.profile.avatar || '🫖').slice(0, 8),
    homeBadge: String(state.profile.homeBadge || '🇭🇰').slice(0, 8),
    totalPoints: Math.max(0, Math.min(2000000, Math.round(state.stats.totalPoints || 0))),
    todayPoints: Math.max(0, Math.min(50000, Math.round(state.stats.todayPoints || 0))),
    todayDate: getTodayDateStr(),
    streak: Math.max(0, Math.min(3650, Math.round(state.stats.streak || 0))),
    circles,
    updatedAt: fsMod.serverTimestamp()
  };

  await fsMod.setDoc(docRef, payload, { merge: true });
  return true;
}

export async function fetchGlobalLeaderboard(mode = 'total') {
  const initRes = await initFirebaseIfConfigured();
  if (!initRes.ready || !fbDb) return [];
  const { fsMod } = sdkModules;
  const col = fsMod.collection(fbDb, 'leaderboard');

  if (mode === 'today') {
    const q = fsMod.query(col, fsMod.where('todayDate', '==', getTodayDateStr()), fsMod.limit(100));
    const snap = await fsMod.getDocs(q);
    const rows = [];
    snap.forEach(d => rows.push(d.data()));
    rows.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0));
    return rows.slice(0, 30);
  }

  const q = fsMod.query(col, fsMod.orderBy('totalPoints', 'desc'), fsMod.limit(30));
  const snap = await fsMod.getDocs(q);
  const rows = [];
  snap.forEach(d => rows.push(d.data()));
  return rows;
}

export async function fetchCircleLeaderboard(circleCode) {
  const initRes = await initFirebaseIfConfigured();
  if (!initRes.ready || !fbDb || !circleCode) return [];
  const { fsMod } = sdkModules;
  const col = fsMod.collection(fbDb, 'leaderboard');
  const q = fsMod.query(col, fsMod.where('circles', 'array-contains', circleCode.toUpperCase()), fsMod.limit(50));
  const snap = await fsMod.getDocs(q);
  const rows = [];
  snap.forEach(d => rows.push(d.data()));
  rows.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  return rows;
}
