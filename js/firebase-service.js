import { getActiveFirebaseConfig } from './firebase-config.js';
import { getTodayDateStr } from './storage.js';

const FB_VERSION = '10.14.1';
const LAST_SYNC_SIG_KEY = 'daily_mindsum_last_cloud_sync_v1';
const ALLOWED_AVATARS = ['🫖', '🥟', '🀄', '🌺', '🦁', '🍁', '⛴️', '🐼'];
const ALLOWED_BADGES = ['🇭🇰', '🇨🇦', '🌏'];
const ALLOWED_GAMES = [
  '',
  'news',
  'memory',
  'math',
  'history',
  'words',
  'eagle',
  'sudoku',
  'tenpai',
  'shisen',
  'make24',
  'wordsearch',
  'blocks',
  'stroop',
  'melody',
  'vocab',
  'spotdiff'
];
const CIRCLE_CODE_RE = /^[A-Z0-9-]{3,16}$/;

// 6-minute online presence window & strict write/read rate caps to stay 100% free on Spark tier!
export const ONLINE_WINDOW_MS = 6 * 60 * 1000;
const MIN_GAME_SWITCH_WRITE_MS = 45 * 1000;
const HEARTBEAT_WRITE_MS = 210 * 1000;

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let sdkModules = null;
let currentAuthUser = null;
let currentActiveGame = '';
let lastPresenceWriteMs = 0;
let lastUserInputMs = Date.now();
const authListeners = new Set();

if (typeof window !== 'undefined') {
  const markInput = function () {
    lastUserInputMs = Date.now();
  };
  window.addEventListener('pointerdown', markInput, { passive: true });
  window.addEventListener('keydown', markInput, { passive: true });
}

export function extractTimestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number' && isFinite(ts)) return ts;
  if (typeof ts.toMillis === 'function') {
    try {
      return ts.toMillis();
    } catch (e) {
      return 0;
    }
  }
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1000000);
  }
  return 0;
}

function normalizeRow(raw) {
  const data = raw || {};
  const lastActiveMs = extractTimestampMs(data.updatedAt) || Number(data.lastActiveMs || 0) || 0;
  const activeGame =
    typeof data.activeGame === 'string' && ALLOWED_GAMES.indexOf(data.activeGame) !== -1
      ? data.activeGame
      : '';
  return Object.assign({}, data, {
    lastActiveMs: lastActiveMs,
    activeGame: activeGame
  });
}

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

export async function syncScoreToCloud(state, forceSync, activeGameOverride) {
  if (!fbDb || !currentAuthUser || !sdkModules) return false;
  const fsMod = sdkModules.fsMod;
  const uid = currentAuthUser.uid;
  const docRef = fsMod.doc(fbDb, 'leaderboard', uid);

  if (typeof activeGameOverride === 'string') {
    currentActiveGame = ALLOWED_GAMES.indexOf(activeGameOverride) !== -1 ? activeGameOverride : '';
  }
  const cleanGame = ALLOWED_GAMES.indexOf(currentActiveGame) !== -1 ? currentActiveGame : '';

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

  // Skip redundant writes on rapid page reloads if score/game hasn't changed and presence was touched recently
  const syncSig = [
    uid,
    displayName,
    avatar,
    homeBadge,
    totalPoints,
    todayPoints,
    todayDate,
    streak,
    circles.join(','),
    cleanGame
  ].join('|');

  const now = Date.now();
  if (!forceSync && now - lastPresenceWriteMs < HEARTBEAT_WRITE_MS) {
    try {
      if (localStorage.getItem(LAST_SYNC_SIG_KEY) === syncSig && lastPresenceWriteMs > 0) {
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
    activeGame: cleanGame,
    updatedAt: fsMod.serverTimestamp()
  };

  await fsMod.setDoc(docRef, payload, { merge: true });
  lastPresenceWriteMs = Date.now();
  try {
    localStorage.setItem(LAST_SYNC_SIG_KEY, syncSig);
  } catch (e) {
    // ignore
  }
  return true;
}

/**
 * Quota-safe presence ping when launching a game or actively playing.
 * Strictly throttled (>= 45s on game change, >= 3.5m heartbeat only while visible & active)
 * to guarantee $0.00 Firebase Spark usage.
 */
export async function touchCloudPresence(state, gameId, isHeartbeat) {
  const nextGame = typeof gameId === 'string' && ALLOWED_GAMES.indexOf(gameId) !== -1 ? gameId : '';
  const gameChanged = nextGame !== currentActiveGame;
  currentActiveGame = nextGame;

  if (!fbDb || !currentAuthUser || !sdkModules) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;

  const now = Date.now();
  if (isHeartbeat) {
    // Only heartbeat if user actually interacted recently and >= 3.5 min passed since last write
    if (now - lastUserInputMs > 4 * 60 * 1000) return false;
    if (now - lastPresenceWriteMs < HEARTBEAT_WRITE_MS) return false;
    return syncScoreToCloud(state, true, currentActiveGame);
  }

  if (lastPresenceWriteMs === 0 || (gameChanged && now - lastPresenceWriteMs >= MIN_GAME_SWITCH_WRITE_MS)) {
    return syncScoreToCloud(state, true, currentActiveGame);
  }
  return false;
}

/**
 * Visibility-aware real-time subscription to the 12 most recently active players.
 * Pauses automatically when tab is hidden so idle tabs consume ZERO Firestore reads.
 */
export function subscribeActivePlayers(onUpdate) {
  let unsubSnap = null;
  let stopped = false;

  async function startListener() {
    if (stopped || unsubSnap) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const initRes = await initFirebaseIfConfigured();
    if (stopped || unsubSnap || !initRes.ready || !fbDb || !sdkModules) return;

    const fsMod = sdkModules.fsMod;
    const col = fsMod.collection(fbDb, 'leaderboard');
    const qRecent = fsMod.query(col, fsMod.orderBy('updatedAt', 'desc'), fsMod.limit(12));

    unsubSnap = fsMod.onSnapshot(
      qRecent,
      function (snap) {
        const rows = [];
        snap.forEach(function (d) {
          rows.push(normalizeRow(d.data()));
        });
        onUpdate(rows);
      },
      function (err) {
        console.warn('Presence listener note:', err);
      }
    );
  }

  function stopListener() {
    if (unsubSnap) {
      try {
        unsubSnap();
      } catch (e) {
        // ignore
      }
      unsubSnap = null;
    }
  }

  function handleVisibility() {
    if (stopped) return;
    if (document.visibilityState === 'hidden') {
      stopListener();
    } else {
      startListener();
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);
  }
  startListener();

  return function () {
    stopped = true;
    stopListener();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility);
    }
  };
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
      rowsToday.push(normalizeRow(d.data()));
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
    rowsTotal.push(normalizeRow(d.data()));
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
    rows.push(normalizeRow(d.data()));
  });
  rows.sort(function (a, b) {
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  });
  return rows;
}
