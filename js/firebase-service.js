import { getActiveFirebaseConfig } from './firebase-config.js';
import { getTodayDateStr } from './storage.js';

const FB_VERSION = '10.14.1';
const LAST_SYNC_SIG_KEY = 'daily_mindsum_last_cloud_sync_v1';
const ALLOWED_AVATARS = ['🫖', '🥟', '🀄', '🌺', '🦁', '🍁', '⛴️', '🐼'];
const ALLOWED_BADGES = ['🇭🇰', '🇨🇦', '🌏'];
const CIRCLE_CODE_RE = /^[A-Z0-9-]{3,16}$/;

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
  return function () {
    authListeners.delete(cb);
  };
}

export async function initFirebaseIfConfigured() {
  const cfg = getActiveFirebaseConfig();
  if (!cfg) return { ready: false, reason: 'unconfigured' };
  if (fbApp && fbAuth && fbDb) return { ready: true };

  try {
    const mods = await Promise.all([
      import('https://www.gstatic.com/firebasejs/' + FB_VERSION + '/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/' + FB_VERSION + '/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/' + FB_VERSION + '/firebase-firestore.js')
    ]);
    const appMod = mods[0];
    const authMod = mods[1];
    const fsMod = mods[2];
    sdkModules = { appMod: appMod, authMod: authMod, fsMod: fsMod };
    fbApp = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
    fbAuth = authMod.getAuth(fbApp);
    fbDb = fsMod.getFirestore(fbApp);

    // Handle redirect result cleanly on mobile / PWA
    authMod.getRedirectResult(fbAuth).catch(function (err) {
      console.warn('Redirect sign-in note:', err);
    });

    authMod.onAuthStateChanged(fbAuth, function (user) {
      currentAuthUser = user || null;
      authListeners.forEach(function (fn) {
        fn(currentAuthUser);
      });
    });

    return { ready: true };
  } catch (err) {
    console.warn('Firebase SDK load error:', err);
    return { ready: false, reason: (err && err.message) || 'load_failed' };
  }
}

export async function signInWithGoogle() {
  const initRes = await initFirebaseIfConfigured();
  if (!initRes.ready) throw new Error('Firebase not configured yet');
  const authMod = sdkModules.authMod;
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await authMod.signInWithPopup(fbAuth, provider);
    return cred.user;
  } catch (err) {
    if (
      err &&
      (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')
    ) {
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

function sanitizeDisplayName(raw) {
  const cleaned = String(raw || '')
    .replace(/[<>&"']/g, '')
    .trim()
    .slice(0, 24);
  return cleaned || '茶客';
}

export async function syncScoreToCloud(state, forceSync) {
  if (!fbDb || !currentAuthUser || !sdkModules) return false;
  const fsMod = sdkModules.fsMod;
  const uid = currentAuthUser.uid;
  const docRef = fsMod.doc(fbDb, 'leaderboard', uid);

  const rawCircles = [state.profile.myCircleCode].concat(state.profile.joinedCircles || []);
  const circles = Array.from(
    new Set(
      rawCircles
        .map(function (c) {
          return String(c || '').trim().toUpperCase();
        })
        .filter(function (c) {
          return CIRCLE_CODE_RE.test(c);
        })
    )
  ).slice(0, 10);

  const avatar = ALLOWED_AVATARS.indexOf(state.profile.avatar) !== -1 ? state.profile.avatar : '🫖';
  const homeBadge = ALLOWED_BADGES.indexOf(state.profile.homeBadge) !== -1 ? state.profile.homeBadge : '🇭🇰';
  const displayName = sanitizeDisplayName(state.profile.displayName || currentAuthUser.displayName || '茶客');
  const totalPoints = Math.max(0, Math.min(2000000, Math.round(state.stats.totalPoints || 0)));
  const todayPoints = Math.max(0, Math.min(5000, Math.round(state.stats.todayPoints || 0)));
  const todayDate = getTodayDateStr();
  const streak = Math.max(0, Math.min(3650, Math.round(state.stats.streak || 0)));

  // Skip redundant writes on page reloads if nothing has changed (protects Spark 20k/day free write quota!)
  const syncSig = [
    uid,
    displayName,
    avatar,
    homeBadge,
    totalPoints,
    todayPoints,
    todayDate,
    streak,
    circles.join(',')
  ].join('|');

  if (!forceSync) {
    try {
      if (localStorage.getItem(LAST_SYNC_SIG_KEY) === syncSig) {
        return true;
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  const payload = {
    uid: uid,
    displayName: displayName,
    avatar: avatar,
    homeBadge: homeBadge,
    totalPoints: totalPoints,
    todayPoints: todayPoints,
    todayDate: todayDate,
    streak: streak,
    circles: circles,
    updatedAt: fsMod.serverTimestamp()
  };

  await fsMod.setDoc(docRef, payload, { merge: true });
  try {
    localStorage.setItem(LAST_SYNC_SIG_KEY, syncSig);
  } catch (e) {
    // ignore
  }
  return true;
}

export async function fetchGlobalLeaderboard(mode) {
  const activeMode = mode || 'total';
  const initRes = await initFirebaseIfConfigured();
  if (!initRes.ready || !fbDb) return [];
  const fsMod = sdkModules.fsMod;
  const col = fsMod.collection(fbDb, 'leaderboard');

  if (activeMode === 'today') {
    const qToday = fsMod.query(col, fsMod.where('todayDate', '==', getTodayDateStr()), fsMod.limit(100));
    const snapToday = await fsMod.getDocs(qToday);
    const rowsToday = [];
    snapToday.forEach(function (d) {
      rowsToday.push(d.data());
    });
    rowsToday.sort(function (a, b) {
      return (b.todayPoints || 0) - (a.todayPoints || 0);
    });
    return rowsToday.slice(0, 30);
  }

  const qTotal = fsMod.query(col, fsMod.orderBy('totalPoints', 'desc'), fsMod.limit(30));
  const snapTotal = await fsMod.getDocs(qTotal);
  const rowsTotal = [];
  snapTotal.forEach(function (d) {
    rowsTotal.push(d.data());
  });
  return rowsTotal;
}

export async function fetchCircleLeaderboard(circleCode) {
  const initRes = await initFirebaseIfConfigured();
  const cleanCode = String(circleCode || '').trim().toUpperCase();
  if (!initRes.ready || !fbDb || !CIRCLE_CODE_RE.test(cleanCode)) return [];
  const fsMod = sdkModules.fsMod;
  const col = fsMod.collection(fbDb, 'leaderboard');
  const q = fsMod.query(col, fsMod.where('circles', 'array-contains', cleanCode), fsMod.limit(50));
  const snap = await fsMod.getDocs(q);
  const rows = [];
  snap.forEach(function (d) {
    rows.push(d.data());
  });
  rows.sort(function (a, b) {
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  });
  return rows;
}
