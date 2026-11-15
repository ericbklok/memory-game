const STORAGE_KEY = 'daily_mindsum_state_v1';

export function getTodayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getTwoDaysAgoDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function randomInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'TEA-';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const OTHER_DAILY_GAMES = [
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

function shuffleList(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function buildShuffledDailyDishes(excludeIds, keepAfterNews) {
  const excl = new Set(Array.isArray(excludeIds) ? excludeIds : []);
  const kept = [];
  if (Array.isArray(keepAfterNews)) {
    for (let i = 0; i < keepAfterNews.length; i++) {
      const id = keepAfterNews[i];
      if (id !== 'news' && OTHER_DAILY_GAMES.indexOf(id) !== -1 && kept.indexOf(id) === -1 && kept.length < 3) {
        kept.push(id);
      }
    }
  }
  const needed = Math.max(0, 3 - kept.length);
  const freshPreferred = shuffleList(
    OTHER_DAILY_GAMES.filter(function (id) {
      return kept.indexOf(id) === -1 && !excl.has(id);
    })
  );
  const picked = freshPreferred.slice(0, needed);
  if (picked.length < needed) {
    const fallback = shuffleList(
      OTHER_DAILY_GAMES.filter(function (id) {
        return kept.indexOf(id) === -1 && picked.indexOf(id) === -1;
      })
    );
    for (let k = 0; k < fallback.length && picked.length < needed; k++) {
      picked.push(fallback[k]);
    }
  }
  return ['news'].concat(kept, picked);
}

export function reshuffleDailyDishes(state) {
  if (!state || !state.daily) return [];
  const stamps = state.daily.stamps || {};
  const current = Array.isArray(state.daily.dishes) ? state.daily.dishes : [];
  const stampedNonNews = current.filter(function (id) {
    return id !== 'news' && Boolean(stamps[id]);
  });
  state.daily.dishes = buildShuffledDailyDishes(current.slice(1), stampedNonNews);
  state.daily.shuffledV2 = true;
  saveState(state);
  return state.daily.dishes;
}

export function createDefaultState() {
  return {
    lang: 'zh',
    fontSize: 'md', // md | lg | xl
    sound: true,
    region: 'both', // both | hk | yvr
    onboardingDone: false,
    prefs: {
      speechRate: 'normal', // slow | normal | fast
      defaultDifficulty: 1, // 0=Relaxed, 1=Standard, 2=Challenge
      autoLevelUp: true,
      sudokuDimSumIcons: false,
      reducedMotion: false,
      skipTitleScreen: false,
      make24GentleV2: true
    },
    profile: {
      displayName: '',
      age: null,
      avatar: '🫖',
      homeBadge: '🇭🇰',
      myCircleCode: randomInviteCode(),
      joinedCircles: [],
      invitedBy: null
    },
    stats: {
      totalPoints: 0,
      todayPoints: 0,
      todayDate: getTodayDateStr(),
      streak: 0,
      lastStreakDate: null,
      teapotShields: 1, // Start every parent with 1 Warm Teapot Streak Freeze!
      gamesCompleted: 0,
      dailySetsCompleted: 0,
      recentRounds: [],
      perGamePlays: {
        news: 0, memory: 0, math: 0, history: 0, words: 0, eagle: 0,
        sudoku: 0, tenpai: 0, shisen: 0, make24: 0, wordsearch: 0, blocks: 0, stroop: 0, melody: 0, vocab: 0, spotdiff: 0
      },
      perGameLevel: {
        news: 1, memory: 1, math: 1, history: 1, words: 1, eagle: 1,
        sudoku: 1, tenpai: 1, shisen: 1, make24: 0, wordsearch: 1, blocks: 1, stroop: 1, melody: 1, vocab: 1, spotdiff: 1
      }, // 0=Easy, 1=Standard, 2=Challenge (Make 24 defaults to 0 Relaxed!)
      perGameCleanStreak: {
        news: 0, memory: 0, math: 0, history: 0, words: 0, eagle: 0,
        sudoku: 0, tenpai: 0, shisen: 0, make24: 0, wordsearch: 0, blocks: 0, stroop: 0, melody: 0, vocab: 0, spotdiff: 0
      }
    },
    daily: {
      date: getTodayDateStr(),
      // 'news' is pinned as #1 daily; the remaining 3 dishes are shuffled!
      dishes: buildShuffledDailyDishes([], []),
      stamps: {}, // e.g. { news: { score: 90, stars: 3 } }
      shuffledV2: true
    },
    unlockedAlbumIds: ['har-gow', 'puer'], // Give 2 welcoming starter collectibles!
    inviteBonusClaimedCodes: [],
    seen: {} // Tracks seen question/shape/board IDs across 90+ days so nothing repeats!
  };
}

export function loadState() {
  let state = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        prefs: { ...state.prefs, ...(parsed.prefs || {}) },
        profile: { ...state.profile, ...(parsed.profile || {}) },
        stats: {
          ...state.stats,
          ...(parsed.stats || {}),
          perGamePlays: { ...state.stats.perGamePlays, ...((parsed.stats && parsed.stats.perGamePlays) || {}) },
          perGameLevel: { ...state.stats.perGameLevel, ...((parsed.stats && parsed.stats.perGameLevel) || {}) },
          perGameCleanStreak: { ...state.stats.perGameCleanStreak, ...((parsed.stats && parsed.stats.perGameCleanStreak) || {}) }
        },
        daily: {
          ...state.daily,
          ...(parsed.daily || {}),
          shuffledV2: Boolean(parsed.daily && parsed.daily.shuffledV2)
        },
        seen: { ...(parsed.seen || {}) }
      };
      // Migrate existing profiles so Make 24 starts at gentle Relaxed (0) by default
      if (!parsed.prefs || !parsed.prefs.make24GentleV2) {
        state.stats.perGameLevel.make24 = 0;
        state.prefs.make24GentleV2 = true;
      }
    }
  } catch (e) {
    console.warn('Could not read localStorage, using fresh state:', e);
  }

  const today = getTodayDateStr();
  // Keep 'news' pinned as #1 daily, and shuffle the remaining 3 dishes from all other 15 games!
  if (state.daily.date !== today) {
    const prevOthers = Array.isArray(state.daily.dishes) ? state.daily.dishes.slice(1) : [];
    state.daily = {
      date: today,
      dishes: buildShuffledDailyDishes(prevOthers, []),
      stamps: {},
      shuffledV2: true
    };
  } else if (
    !state.daily.shuffledV2 ||
    !Array.isArray(state.daily.dishes) ||
    state.daily.dishes.length !== 4 ||
    state.daily.dishes[0] !== 'news'
  ) {
    const curStamps = state.daily.stamps || {};
    const prevDishes = Array.isArray(state.daily.dishes) ? state.daily.dishes : [];
    const stampedOthers = prevDishes.filter(function (id) {
      return id !== 'news' && Boolean(curStamps[id]);
    });
    state.daily.dishes = buildShuffledDailyDishes(prevDishes.slice(1), stampedOthers);
    state.daily.shuffledV2 = true;
  }
  if (state.stats.todayDate !== today) {
    state.stats.todayDate = today;
    state.stats.todayPoints = 0;
  }

  saveState(state);
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('localStorage write warning:', e);
  }
}

export function recordGameCompletion(state, gameId, earnedPoints, stars, allAlbumIds) {
  const today = getTodayDateStr();
  if (state.stats.todayDate !== today) {
    state.stats.todayDate = today;
    state.stats.todayPoints = 0;
  }

  state.stats.totalPoints += earnedPoints;
  state.stats.todayPoints += earnedPoints;
  state.stats.gamesCompleted += 1;
  state.stats.perGamePlays[gameId] = (state.stats.perGamePlays[gameId] || 0) + 1;

  const defLvl = gameId === 'make24' ? 0 : 1;
  const curLvl = typeof state.stats.perGameLevel[gameId] === 'number' ? state.stats.perGameLevel[gameId] : defLvl;
  const prevRecent = Array.isArray(state.stats.recentRounds) ? state.stats.recentRounds : [];
  state.stats.recentRounds = prevRecent
    .concat([{ gameId, score: earnedPoints, stars, level: curLvl }])
    .slice(-12);

  // Gentle auto-adaptive level progression (if enabled in user preferences)
  const allowAutoLevel = !state.prefs || state.prefs.autoLevelUp !== false;
  if (allowAutoLevel) {
    if (stars === 3) {
      state.stats.perGameCleanStreak[gameId] = (state.stats.perGameCleanStreak[gameId] || 0) + 1;
      const neededStreak = gameId === 'make24' ? 3 : 2;
      if (state.stats.perGameCleanStreak[gameId] >= neededStreak && state.stats.perGameLevel[gameId] < 2) {
        state.stats.perGameLevel[gameId] += 1;
        state.stats.perGameCleanStreak[gameId] = 0;
      }
    } else if (stars === 1 && state.stats.perGameLevel[gameId] > 0) {
      state.stats.perGameCleanStreak[gameId] = 0;
    }
  }

  // Update Daily Streak on first game played today
  let usedShield = false;
  if (state.stats.lastStreakDate !== today) {
    const yesterday = getYesterdayDateStr();
    const twoDaysAgo = getTwoDaysAgoDateStr();
    if (state.stats.lastStreakDate === yesterday) {
      state.stats.streak += 1;
    } else if (state.stats.lastStreakDate === twoDaysAgo && state.stats.teapotShields > 0) {
      state.stats.teapotShields -= 1;
      state.stats.streak += 1;
      usedShield = true;
    } else {
      state.stats.streak = 1;
    }
    state.stats.lastStreakDate = today;
  }

  // Stamp daily slip if part of today's 4 dishes
  let newlyCompletedAllFour = false;
  if (state.daily.dishes.includes(gameId)) {
    const hadAllBefore = state.daily.dishes.every(d => Boolean(state.daily.stamps[d]));
    const prev = state.daily.stamps[gameId];
    if (!prev || earnedPoints > prev.score) {
      state.daily.stamps[gameId] = { score: earnedPoints, stars };
    }
    const hasAllNow = state.daily.dishes.every(d => Boolean(state.daily.stamps[d]));
    if (!hadAllBefore && hasAllNow) {
      newlyCompletedAllFour = true;
      state.stats.dailySetsCompleted += 1;
      state.stats.totalPoints += 50; // Full Stamp Card Bonus!
      state.stats.todayPoints += 50;
      if (state.stats.dailySetsCompleted % 3 === 0 && state.stats.teapotShields < 3) {
        state.stats.teapotShields += 1;
      }
    }
  }

  // Check Collectible Album Unlocks (1 new card per 160 total points or every completed daily set!)
  let newlyUnlockedId = null;
  const targetUnlocks = Math.min(
    allAlbumIds.length,
    2 + Math.floor(state.stats.totalPoints / 160) + state.stats.dailySetsCompleted
  );
  if (state.unlockedAlbumIds.length < targetUnlocks) {
    const nextLocked = allAlbumIds.find(id => !state.unlockedAlbumIds.includes(id));
    if (nextLocked) {
      state.unlockedAlbumIds.push(nextLocked);
      newlyUnlockedId = nextLocked;
    }
  }

  saveState(state);
  return { newlyCompletedAllFour, newlyUnlockedId, usedShield };
}

/* IndexedDB Family Photos Store for Custom Memory Match Cards! */
const PHOTO_DB_NAME = 'daily_mindsum_photos_db';
const PHOTO_STORE = 'family_photos';

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getFamilyPhotos() {
  try {
    const db = await openPhotoDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const req = tx.objectStore(PHOTO_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function addFamilyPhoto(label, dataUrl) {
  const db = await openPhotoDb();
  const item = {
    id: 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    label: label || '屋企人',
    dataUrl
  };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return item;
}

export async function deleteFamilyPhoto(id) {
  const db = await openPhotoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function resizeImageFileToDataUrl(file, maxEdge = 360) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
