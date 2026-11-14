import { GAME_CATALOG, GAME_CATEGORIES, COLLECTIBLE_ALBUM } from './data/content.js';
import { t, pickText, getRankTitle, randomPraise, playSfx, stopSpeaking } from './i18n.js';
import {
  renderMasterBoSvg,
  MASTER_BO_QUIPS,
  spawnConfettiBurst,
  renderBrainRadarSvg,
  resetComboStreak
} from './ui-fx.js';
import {
  loadState,
  saveState,
  recordGameCompletion,
  getFamilyPhotos,
  addFamilyPhoto,
  deleteFamilyPhoto,
  resizeImageFileToDataUrl
} from './storage.js';
import {
  mountNewsGame,
  mountMemoryGame,
  mountMathGame,
  mountHistoryGame,
  mountWordsGame,
  mountEagleGame
} from './games/engine.js';
import {
  mountSudokuGame,
  mountTenpaiGame,
  mountShisenGame,
  mountMake24Game,
  mountWordSearchGame,
  mountBlocksGame,
  mountStroopGame,
  mountMelodyGame,
  mountVocabGame
} from './games/extra-games.js';
import {
  isFirebaseConfigured,
  initFirebaseIfConfigured,
  getCurrentAuthUser,
  onUserChanged,
  signInWithGoogle,
  signOutCloud,
  syncScoreToCloud,
  fetchGlobalLeaderboard,
  fetchCircleLeaderboard
} from './firebase-service.js';
import { saveFirebaseConfigOverride } from './firebase-config.js';

const state = loadState();
let currentTab = 'home'; // home | games | leaderboard | album | playing
let activeGameId = null;
let inDailySequence = false;
let boardSubTab = 'total'; // total | today | circle
let selectedGameCategory = 'all';
let boQuipIdx = 0;
let rouletteBusy = false;

const mainEl = document.getElementById('mainContent');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const inviteBannerEl = document.getElementById('inviteBanner');

function showToast(msg) {
  const wrap = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function openModal(html, wireFn) {
  modalCard.innerHTML = html;
  modalBackdrop.classList.remove('hidden');
  if (wireFn) wireFn(modalCard);
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalCard.innerHTML = '';
}

modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});

/* Dual Clocks: Hong Kong & Vancouver */
function updateClocks() {
  const now = new Date();
  const fmt = tz =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
  const hkEl = document.getElementById('hkClock');
  const yvrEl = document.getElementById('yvrClock');
  if (hkEl) hkEl.textContent = fmt('Asia/Hong_Kong');
  if (yvrEl) yvrEl.textContent = fmt('America/Vancouver');
}

/* URL Invite Detection (?invite=TEA-XXXX&from=Name) */
function checkUrlInvite() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('invite') || params.get('circle') || '').trim().toUpperCase();
  const fromName = (params.get('from') || '').trim();
  if (!code) return;

  const alreadyJoined =
    state.profile.myCircleCode === code || (state.profile.joinedCircles || []).includes(code);

  if (!alreadyJoined) {
    state.profile.joinedCircles = Array.from(new Set([...(state.profile.joinedCircles || []), code]));
    if (fromName) state.profile.invitedBy = fromName;
  }

  let gotBonus = false;
  if (!state.inviteBonusClaimedCodes.includes(code) && state.profile.myCircleCode !== code) {
    state.inviteBonusClaimedCodes.push(code);
    state.stats.totalPoints += 50;
    state.stats.todayPoints += 50;
    gotBonus = true;
  }
  saveState(state);

  // Clean URL query gracefully without reloading
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);

  inviteBannerEl.classList.remove('hidden');
  const senderLabel = fromName || (state.lang === 'zh' ? '親友' : 'A friend');
  inviteBannerEl.innerHTML = `
    <div>
      <strong>🎉 ${
        state.lang === 'zh'
          ? `${senderLabel} 邀請你加入親友圈「${code}」！${gotBonus ? '（已送你 +50 迎新積分！）' : ''}`
          : `${senderLabel} invited you to Circle "${code}"! ${gotBonus ? '(+50 Welcome Bonus pts!)' : ''}`
      }</strong>
      <div style="font-size:0.86rem;color:var(--ink-muted);">
        ${
          state.lang === 'zh'
            ? '你可以即刻免費開局玩，或者撳右邊用 Google 登入同親友比拼分數！'
            : 'Start playing right away, or sign in with Google to appear on your shared scoreboard!'
        }
      </div>
    </div>
    <button type="button" class="btn btn-jade btn-sm" id="bannerLeaderboardBtn">
      ${state.lang === 'zh' ? '查看親友龍虎榜 →' : 'Open Scoreboard →'}
    </button>
  `;
  inviteBannerEl.querySelector('#bannerLeaderboardBtn').addEventListener('click', () => {
    inviteBannerEl.classList.add('hidden');
    boardSubTab = 'circle';
    switchTab('leaderboard');
  });
}

/* Sync Top Controls & Chrome */
function syncChrome() {
  const lang = state.lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  document.documentElement.dataset.font = state.fontSize;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(lang, key);
  });

  document.getElementById('langLabel').textContent = lang === 'zh' ? 'EN' : '粵語';
  const fontMap = { md: '字 A', lg: '字 A+', xl: '字 A++' };
  document.getElementById('fontLabel').textContent = fontMap[state.fontSize] || '字 A';
  document.getElementById('soundIcon').textContent = state.sound ? '🔔' : '🔕';

  const authUser = getCurrentAuthUser();
  document.getElementById('headerAvatar').textContent = state.profile.avatar || '🫖';
  document.getElementById('headerUserLabel').textContent =
    state.profile.displayName || (authUser ? authUser.displayName : t(lang, 'guestLabel'));

  // Region buttons
  document.getElementById('regBothBtn').textContent = lang === 'zh' ? '港×溫' : 'HK×YVR';
  document.getElementById('regHkBtn').textContent = lang === 'zh' ? '🇭🇰 香港' : '🇭🇰 HK';
  document.getElementById('regYvrBtn').textContent = lang === 'zh' ? '🇨🇦 溫哥華' : '🇨🇦 YVR';
  document.querySelectorAll('.region-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === state.region);
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === currentTab);
  });
}

function switchTab(tab) {
  stopSpeaking();
  currentTab = tab;
  activeGameId = null;
  syncChrome();
  renderMain();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Build Shareable Invite Link (Any user can invite others!) */
export function getInviteShareLink() {
  const base = window.location.origin + window.location.pathname;
  const code = encodeURIComponent(state.profile.myCircleCode);
  const from = encodeURIComponent(state.profile.displayName || '茶友');
  return `${base}?invite=${code}&from=${from}`;
}

async function shareInviteWithFriends() {
  const link = getInviteShareLink();
  const msg =
    state.lang === 'zh'
      ? `🫖 邀請你一齊玩《每日腦點心 Daily MindSum》！\n每日 4 分鐘睇港溫新聞、打麻雀配對、飲茶心算同懷舊問答，入嚟我嘅親友圈（代碼：${state.profile.myCircleCode}）一齊比拼啦：\n${link}`
      : `🫖 Come play Daily MindSum (每日腦點心) with me!\nFun 4-minute HK × Vancouver brain puzzles & trivia. Tap to join my Circle (${state.profile.myCircleCode}):\n${link}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: '每日腦點心 · Daily MindSum', text: msg, url: link });
      return;
    } catch {
      // user cancelled or fallback
    }
  }
  try {
    await navigator.clipboard.writeText(msg);
    showToast(state.lang === 'zh' ? '✅ 已複製邀請連結！可貼上 WhatsApp / WeChat 傳送' : '✅ Invite message copied! Paste into WhatsApp / WeChat / iMessage');
  } catch {
    showToast(link);
  }
}

async function shareDailyStampCard() {
  const lang = state.lang;
  const lines = state.daily.dishes.map(dId => {
    const meta = GAME_CATALOG.find(g => g.id === dId);
    const st = state.daily.stamps[dId];
    const stars = st ? '⭐'.repeat(st.stars) : '⚪⚪⚪';
    return `${meta.icon} ${pickText(meta.shortName, lang)}：${stars}`;
  });
  const doneCount = Object.keys(state.daily.stamps).length;
  const link = getInviteShareLink();

  const text =
    lang === 'zh'
      ? `🫖 每日腦點心 Daily MindSum\n🔥 連續第 ${ Math.max(1, state.stats.streak) } 日 · 今日積分 ${state.stats.todayPoints} 分\n${lines.join('\n')}\n${
          doneCount === 4 ? '🔴 今日集齊四道「頂點」印仔！' : `📋 今日已蓋 ${doneCount}/4 個印仔！`
        }\n一齊入嚟動下腦筋啦：${link}`
      : `🫖 Daily MindSum · Day ${Math.max(1, state.stats.streak)} 🔥 (${state.stats.todayPoints} pts)\n${lines.join('\n')}\n${
          doneCount === 4 ? '🔴 Full 4-Dish Stamp Card complete!' : `📋 ${doneCount}/4 Dishes stamped today!`
        }\nPlay & join my scoreboard: ${link}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: '每日腦點心戰績', text });
      return;
    } catch {
      // fallback to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(lang === 'zh' ? '✅ 已複製今日點心紙戰績！快啲貼去家庭群組晒命啦！' : '✅ Copied today’s Stamp Card! Share it in your family chat!');
  } catch {
    showToast(text);
  }
}

/* =========================================================================
   HOME VIEW (今日早茶 · NINTENDO BRAIN CLUBHOUSE)
   ========================================================================= */
function renderHomeView() {
  const lang = state.lang;
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? 'morningGreet' : hour < 18 ? 'afternoonGreet' : 'eveningGreet';
  const rank = getRankTitle(state.stats.totalPoints, lang);

  const dishes = state.daily.dishes;
  const nextUnstamped = dishes.find(d => !state.daily.stamps[d]);
  const doneCount = dishes.filter(d => Boolean(state.daily.stamps[d])).length;

  const ctaLabel = !nextUnstamped
    ? t(lang, 'bonusSteamerBtn')
    : doneCount === 0
    ? t(lang, 'startDailyBtn')
    : t(lang, 'continueDailyBtn');

  const quipPool = MASTER_BO_QUIPS[lang] || MASTER_BO_QUIPS.zh;
  const curQuip = quipPool[boQuipIdx % quipPool.length];

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <section class="card hero-card">
      <div class="greeting-row">
        <div>
          <h1 class="greeting-title">${state.profile.avatar} ${t(lang, greetKey)}</h1>
          <p class="greeting-sub">
            ${state.profile.homeBadge} <strong>${state.profile.displayName}</strong> · ${rank}
          </p>
        </div>
        <div class="streak-badges">
          <span class="stat-pill fire">🔥 ${state.stats.streak} ${t(lang, 'streakUnit')}</span>
          <span class="stat-pill teapot" title="Missed a day? Warm Teapot protects your streak!">🫖 ${state.stats.teapotShields} ${t(lang, 'teapotShield')}</span>
          <span class="stat-pill points">⭐ ${state.stats.totalPoints} ${t(lang, 'pointsUnit')}</span>
        </div>
      </div>

      <!-- Interactive Host: Tea Master Bo (茶博士阿波) -->
      <div class="bo-mascot-row" id="boInteractiveRow">
        <button type="button" class="bo-avatar-btn" id="boAvatarBtn" aria-label="Tea Master Bo">
          ${renderMasterBoSvg(doneCount === 4 ? 'cheer' : curQuip.mood)}
        </button>
        <div class="bo-speech-bubble" id="boBubbleBtn">
          <div>
            <span class="bo-name-tag">🫖 ${lang === 'zh' ? '茶博士阿波' : 'Master Bo'}</span>
            <span class="bo-tap-hint">${lang === 'zh' ? '💬 撳我傾偈換貼士' : '💬 Tap for brain tips!'}</span>
          </div>
          <div id="boSpeechText" style="font-weight:800;font-size:0.94rem;color:var(--ink);">
            ${curQuip.text}
          </div>
        </div>
      </div>

      <!-- 4-Dish Stamp Slip + Big Brain Academy 5-Axis Vitality Radar -->
      <div class="home-dash-grid">
        <div class="stamp-slip">
          <div class="stamp-slip-header">
            <span>${t(lang, 'slipTitle')}</span>
            <span>${t(lang, 'slipDoneCount')} ${doneCount} / ${dishes.length}</span>
          </div>
          <div class="stamp-grid" id="dailyStampGrid"></div>
        </div>
        <div class="radar-panel">
          <div class="radar-title">🧠 ${lang === 'zh' ? '腦力五維活力圖' : 'Brain Vitality Radar'}</div>
          ${renderBrainRadarSvg(state.stats.perGamePlays, lang)}
          <div style="font-size:0.75rem;color:var(--ink-muted);font-weight:700;">
            ${lang === 'zh' ? `已完成 ${state.stats.gamesCompleted} 局健腦練習` : `${state.stats.gamesCompleted} Brain Rounds Played`}
          </div>
        </div>
      </div>

      <button type="button" class="btn ${!nextUnstamped ? 'btn-gold' : 'btn-primary'} btn-full" id="heroStartBtn" style="font-size:1.14rem;min-height:62px;">
        ${ctaLabel}
      </button>

      <div class="action-row" style="margin-top:0.75rem;">
        <button type="button" class="btn btn-plum btn-sm" id="surpriseHomeBtn">
          🎲 ${lang === 'zh' ? '隨機抽一籠點心！' : 'Surprise Me!'}
        </button>
        <button type="button" class="btn btn-jade btn-sm" id="shareCardBtn">${t(lang, 'shareFamilyBtn')}</button>
        <button type="button" class="btn btn-outline btn-sm" id="inviteHomeBtn">${t(lang, 'inviteBtn')}</button>
      </div>
    </section>

    <div class="cat-toolbar">
      <div class="cat-filter-bar" id="homeCatBar"></div>
    </div>
    <div class="games-grid" id="homeGamesGrid"></div>
  `;

  // Wire Master Bo interactive chatter
  const cycleBoQuip = () => {
    playSfx('switch', state.sound);
    boQuipIdx = (boQuipIdx + 1) % quipPool.length;
    const nextQ = quipPool[boQuipIdx];
    wrap.querySelector('#boAvatarBtn').innerHTML = renderMasterBoSvg(nextQ.mood);
    wrap.querySelector('#boSpeechText').textContent = nextQ.text;
  };
  wrap.querySelector('#boAvatarBtn').addEventListener('click', cycleBoQuip);
  wrap.querySelector('#boBubbleBtn').addEventListener('click', cycleBoQuip);

  const stampGrid = wrap.querySelector('#dailyStampGrid');
  dishes.forEach((dId, idx) => {
    const meta = GAME_CATALOG.find(g => g.id === dId);
    const stamped = state.daily.stamps[dId];
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `stamp-slot ${stamped ? 'done' : ''}`;
    slot.innerHTML = `
      <span class="stamp-slot-icon">${meta.icon}</span>
      <span class="stamp-slot-name">${idx + 1}. ${pickText(meta.shortName, lang)}</span>
      <span style="font-size:0.78rem;color:var(--ink-muted);">
        ${stamped ? '⭐'.repeat(stamped.stars) : lang === 'zh' ? '撳此開局' : 'Tap to play'}
      </span>
      ${stamped ? `<span class="red-chop">${t(lang, 'stampChop')}</span>` : ''}
    `;
    slot.addEventListener('click', () => {
      playSfx('switch', state.sound);
      inDailySequence = true;
      launchGame(dId);
    });
    stampGrid.appendChild(slot);
  });

  wrap.querySelector('#heroStartBtn').addEventListener('click', () => {
    playSfx('switch', state.sound);
    inDailySequence = true;
    if (nextUnstamped) {
      launchGame(nextUnstamped);
    } else {
      const randomMeta = GAME_CATALOG[Math.floor(Math.random() * GAME_CATALOG.length)];
      launchGame(randomMeta.id);
    }
  });

  const gGrid = wrap.querySelector('#homeGamesGrid');
  const catBar = wrap.querySelector('#homeCatBar');
  renderCategoryBarInto(catBar, gGrid);
  renderGameCardsInto(gGrid, selectedGameCategory);

  wrap.querySelector('#surpriseHomeBtn').addEventListener('click', () => {
    spinSurpriseRoulette(gGrid);
  });
  wrap.querySelector('#shareCardBtn').addEventListener('click', shareDailyStampCard);
  wrap.querySelector('#inviteHomeBtn').addEventListener('click', shareInviteWithFriends);

  mainEl.innerHTML = '';
  mainEl.appendChild(wrap);
}

function renderCategoryBarInto(barEl, targetGridEl) {
  const lang = state.lang;
  barEl.innerHTML = '';
  GAME_CATEGORIES.forEach(cat => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `cat-pill ${selectedGameCategory === cat.id ? 'active' : ''}`;
    pill.textContent = `${cat.icon} ${cat[lang]}`;
    pill.addEventListener('click', () => {
      playSfx('switch', state.sound);
      selectedGameCategory = cat.id;
      renderCategoryBarInto(barEl, targetGridEl);
      renderGameCardsInto(targetGridEl, selectedGameCategory);
    });
    barEl.appendChild(pill);
  });
}

function spinSurpriseRoulette(gridEl) {
  if (rouletteBusy) return;
  const cards = Array.from(gridEl.querySelectorAll('.game-card'));
  if (!cards.length) {
    const pick = GAME_CATALOG[Math.floor(Math.random() * GAME_CATALOG.length)];
    launchGame(pick.id);
    return;
  }
  rouletteBusy = true;
  const totalTicks = 10;
  const winnerIdx = Math.floor(Math.random() * cards.length);
  let step = 0;

  const tick = () => {
    cards.forEach(c => c.classList.remove('roulette-highlight'));
    const idx = step < totalTicks ? step % cards.length : winnerIdx;
    const targetCard = cards[idx];
    targetCard.classList.add('roulette-highlight');
    playSfx('roulette', state.sound);

    if (step === totalTicks) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        rouletteBusy = false;
        inDailySequence = false;
        launchGame(targetCard.dataset.gameId);
      }, 420);
      return;
    }
    step += 1;
    setTimeout(tick, 65 + step * 18);
  };
  tick();
}

function renderGameCardsInto(gridEl, catFilter) {
  const lang = state.lang;
  const filter = catFilter || 'all';
  const lvlNames = [t(lang, 'lvlEasy'), t(lang, 'lvlMed'), t(lang, 'lvlHard')];
  gridEl.innerHTML = '';

  const list = filter === 'all' ? GAME_CATALOG : GAME_CATALOG.filter(g => g.cat === filter);

  list.forEach(g => {
    const lvl = typeof state.stats.perGameLevel[g.id] === 'number' ? state.stats.perGameLevel[g.id] : 1;
    const plays = (state.stats.perGamePlays && state.stats.perGamePlays[g.id]) || 0;
    const medalLabel =
      plays >= 5
        ? `👑 ×${plays}`
        : plays > 0
        ? `⭐ ×${plays}`
        : lang === 'zh'
        ? '✨ 試玩'
        : '✨ Try!';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.gameId = g.id;
    btn.className = `game-card theme-${g.theme || 'jade'}`;
    btn.innerHTML = `
      <div class="game-icon-box">${g.icon}</div>
      <div class="game-card-body">
        <h3 class="game-card-title">${pickText(g.title, lang)}</h3>
        <p class="game-card-desc">${pickText(g.desc, lang)}</p>
        <div class="cartridge-meta-row">
          <span class="level-tag" style="margin-top:0;">${pickText(g.pillar, lang)} · ${lvlNames[lvl]}</span>
          <span class="play-medal">${medalLabel}</span>
        </div>
      </div>
    `;
    btn.addEventListener('click', () => {
      playSfx('switch', state.sound);
      inDailySequence = false;
      launchGame(g.id);
    });
    gridEl.appendChild(btn);
  });
}

/* =========================================================================
   ALL GAMES VIEW (自選點心 · CARTRIDGE SHELF)
   ========================================================================= */
function renderGamesTabView() {
  const lang = state.lang;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
        <div>
          <h1 style="margin:0;font-size:1.3rem;">🀄 ${t(lang, 'quickPickTitle')}</h1>
          <p style="margin:0.25rem 0 0;color:var(--ink-muted);">${t(lang, 'freePlaySub')}</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-plum btn-sm" id="surpriseAllBtn">
            🎲 ${lang === 'zh' ? '隨機抽一籠！' : 'Surprise Me!'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="managePhotosBtn">
            📸 ${lang === 'zh' ? '管理屋企相片卡' : 'Family Photo Cards'}
          </button>
        </div>
      </div>
      <div class="cat-filter-bar" id="allGamesCatBar" style="margin-top:0.9rem;"></div>
    </div>
    <div class="games-grid" id="allGamesGrid"></div>
  `;
  const gridEl = wrap.querySelector('#allGamesGrid');
  const catBar = wrap.querySelector('#allGamesCatBar');
  renderCategoryBarInto(catBar, gridEl);
  renderGameCardsInto(gridEl, selectedGameCategory);

  wrap.querySelector('#surpriseAllBtn').addEventListener('click', () => spinSurpriseRoulette(gridEl));
  wrap.querySelector('#managePhotosBtn').addEventListener('click', openFamilyPhotosModal);

  mainEl.innerHTML = '';
  mainEl.appendChild(wrap);
}

/* =========================================================================
   LAUNCH & COMPLETE GAMES
   ========================================================================= */
function launchGame(gameId) {
  stopSpeaking();
  resetComboStreak();
  activeGameId = gameId;
  currentTab = 'playing';
  syncChrome();
  mainEl.innerHTML = '';

  const ctx = {
    container: mainEl,
    state,
    onBack: () => switchTab('home'),
    onLevelChange: newLvl => {
      state.stats.perGameLevel[gameId] = newLvl;
      saveState(state);
      launchGame(gameId);
    },
    onOpenPhotoModal: () => openFamilyPhotosModal(() => launchGame('memory')),
    onComplete: ({ score, stars }) => handleDishCompleted(gameId, score, stars)
  };

  if (gameId === 'news') mountNewsGame(ctx);
  else if (gameId === 'memory') mountMemoryGame(ctx);
  else if (gameId === 'math') mountMathGame(ctx);
  else if (gameId === 'history') mountHistoryGame(ctx);
  else if (gameId === 'words') mountWordsGame(ctx);
  else if (gameId === 'eagle') mountEagleGame(ctx);
  else if (gameId === 'sudoku') mountSudokuGame(ctx);
  else if (gameId === 'tenpai') mountTenpaiGame(ctx);
  else if (gameId === 'shisen') mountShisenGame(ctx);
  else if (gameId === 'make24') mountMake24Game(ctx);
  else if (gameId === 'wordsearch') mountWordSearchGame(ctx);
  else if (gameId === 'blocks') mountBlocksGame(ctx);
  else if (gameId === 'stroop') mountStroopGame(ctx);
  else if (gameId === 'melody') mountMelodyGame(ctx);
  else if (gameId === 'vocab') mountVocabGame(ctx);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDishCompleted(gameId, score, stars) {
  playSfx('fanfare', state.sound);
  spawnConfettiBurst(42);

  const allAlbumIds = COLLECTIBLE_ALBUM.map(x => x.id);
  const { newlyCompletedAllFour, newlyUnlockedId } = recordGameCompletion(
    state,
    gameId,
    score,
    stars,
    allAlbumIds
  );
  syncChrome();

  // Sync to Firebase Leaderboard automatically if signed in!
  if (getCurrentAuthUser()) {
    syncScoreToCloud(state).catch(e => console.warn('Cloud sync warning:', e));
  }

  const lang = state.lang;
  const gameMeta = GAME_CATALOG.find(g => g.id === gameId);
  const nextDailyDish = state.daily.dishes.find(d => !state.daily.stamps[d]);
  const unlockedItem = newlyUnlockedId ? COLLECTIBLE_ALBUM.find(x => x.id === newlyUnlockedId) : null;

  let starsHtml = '';
  for (let i = 0; i < stars; i++) {
    starsHtml += `<span class="victory-star" style="animation-delay:${i * 0.14}s;">⭐</span>`;
  }

  mainEl.innerHTML = `
    <div class="card hero-card victory-stage">
      <div class="victory-sunburst"></div>
      <div style="display:flex;justify-content:center;align-items:center;gap:0.75rem;position:relative;margin-bottom:0.55rem;">
        <div style="width:74px;height:74px;">${renderMasterBoSvg('cheer')}</div>
        <span style="font-size:3.5rem;">${gameMeta.icon}</span>
        <span class="red-chop" style="position:static;width:3.1rem;height:3.1rem;font-size:0.86rem;">
          ${t(lang, 'stampChop')}
        </span>
      </div>
      <div style="margin:0.2rem 0;">${starsHtml}</div>
      <h2 style="margin:0.25rem 0;font-size:1.5rem;">${randomPraise(lang)}</h2>
      <p style="font-size:1.25rem;font-weight:900;color:var(--red-chop-dark);margin:0.4rem 0;">
        +<span id="winScoreTicker">0</span> ${t(lang, 'pointsUnit')}
        ${newlyCompletedAllFour ? (lang === 'zh' ? '（另加齊印獎賞 +50 分！🎊）' : ' (+50 Full Card Bonus! 🎊)') : ''}
      </p>

      ${
        unlockedItem
          ? `
        <div style="margin:1rem auto;max-width:360px;padding:0.9rem;background:#FFFDF6;border:2.5px solid var(--gold);border-radius:18px;box-shadow:0 4px 0 rgba(200,129,26,0.25);">
          <div style="font-size:0.82rem;font-weight:900;color:var(--gold-dark);">
            🎁 ${lang === 'zh' ? '恭喜解鎖新珍藏圖鑑！' : 'New Collectible Unlocked!'}
          </div>
          <div style="font-size:2.4rem;margin:0.2rem 0;">${unlockedItem.display || unlockedItem.emoji}</div>
          <strong>${unlockedItem[lang]}</strong>
          <p style="margin:0.25rem 0 0;font-size:0.86rem;color:var(--ink-muted);">${pickText(unlockedItem.blurb, lang)}</p>
        </div>`
          : ''
      }

      <div class="action-row" style="margin-top:1.25rem;">
        ${
          inDailySequence && nextDailyDish
            ? `<button type="button" class="btn btn-primary" id="nextDishAfterWinBtn">${t(lang, 'continueDailyBtn')}</button>`
            : `<button type="button" class="btn btn-primary" id="replayDishBtn">${t(lang, 'playAgain')}</button>`
        }
        <button type="button" class="btn btn-jade" id="shareAfterWinBtn">${t(lang, 'shareFamilyBtn')}</button>
        <button type="button" class="btn btn-outline" id="homeAfterWinBtn">${t(lang, 'backHome')}</button>
      </div>
    </div>
  `;

  // Smooth Nintendo score ticker count-up!
  const tickerEl = mainEl.querySelector('#winScoreTicker');
  if (tickerEl) {
    let cur = 0;
    const stepVal = Math.max(3, Math.ceil(score / 18));
    const iv = setInterval(() => {
      cur = Math.min(score, cur + stepVal);
      tickerEl.textContent = String(cur);
      if (cur >= score) clearInterval(iv);
    }, 28);
  }

  const nextBtn = mainEl.querySelector('#nextDishAfterWinBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => launchGame(nextDailyDish));

  const replayBtn = mainEl.querySelector('#replayDishBtn');
  if (replayBtn) replayBtn.addEventListener('click', () => launchGame(gameId));

  mainEl.querySelector('#shareAfterWinBtn').addEventListener('click', shareDailyStampCard);
  mainEl.querySelector('#homeAfterWinBtn').addEventListener('click', () => switchTab('home'));
}

/* =========================================================================
   LEADERBOARD & INVITES VIEW (龍虎榜 · 全球與親友圈)
   ========================================================================= */
async function renderLeaderboardView() {
  const lang = state.lang;
  const configured = isFirebaseConfigured();
  const authUser = getCurrentAuthUser();

  mainEl.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;">
        <div>
          <h1 style="margin:0;font-size:1.32rem;">🏆 ${lang === 'zh' ? '茶樓龍虎榜（全球與親友圈）' : 'Global & Family Leaderboard'}</h1>
          <p style="margin:0.25rem 0 0;color:var(--ink-muted);font-size:0.92rem;">
            ${
              lang === 'zh'
                ? '無須登入即可本地遊玩；用 Google 登入即可將分數同步上全球榜，並邀請香港及溫哥華親友同場較量！'
                : 'Play locally anytime — or sign in with Google to join the global scoreboard and invite friends & family!'
            }
          </p>
        </div>
        <button type="button" class="btn btn-gold btn-sm" id="boardInviteBtn">${t(lang, 'inviteBtn')}</button>
      </div>

      <div id="authCtaBanner" style="margin-top:0.9rem;"></div>

      <div style="display:flex;gap:0.45rem;margin-top:1rem;flex-wrap:wrap;">
        <button type="button" class="chip-btn" data-btab="total" style="${boardSubTab === 'total' ? 'background:var(--red-chop);color:#fff;border-color:var(--red-chop);' : ''}">
          🌍 ${lang === 'zh' ? '全球總分榜' : 'Global All-Time'}
        </button>
        <button type="button" class="chip-btn" data-btab="today" style="${boardSubTab === 'today' ? 'background:var(--red-chop);color:#fff;border-color:var(--red-chop);' : ''}">
          ☀️ ${lang === 'zh' ? '今日醒神榜' : "Today's Top"}
        </button>
        <button type="button" class="chip-btn" data-btab="circle" style="${boardSubTab === 'circle' ? 'background:var(--red-chop);color:#fff;border-color:var(--red-chop);' : ''}">
          👨‍👩‍👧‍👦 ${lang === 'zh' ? '我嘅親友圈' : 'My Circle'}
        </button>
      </div>

      <div id="circleControlsArea" style="margin-top:0.85rem;"></div>
      <div id="boardRowsArea" style="margin-top:0.9rem;">
        <p style="color:var(--ink-muted);">${lang === 'zh' ? '正在讀取龍虎榜…' : 'Loading scoreboard…'}</p>
      </div>
    </div>
  `;

  mainEl.querySelector('#boardInviteBtn').addEventListener('click', shareInviteWithFriends);
  mainEl.querySelectorAll('[data-btab]').forEach(btn => {
    btn.addEventListener('click', () => {
      boardSubTab = btn.dataset.btab;
      renderLeaderboardView();
    });
  });

  const authArea = mainEl.querySelector('#authCtaBanner');
  if (!configured) {
    authArea.innerHTML = `
      <div style="padding:0.9rem 1rem;background:var(--gold-soft);border:2px solid var(--gold);border-radius:14px;display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
        <div>
          <strong>☁️ ${lang === 'zh' ? '全球雲端榜待連接 Firebase（免費 Spark 計劃）' : 'Connect Free Firebase Spark for Live Global Sync'}</strong>
          <div style="font-size:0.86rem;color:var(--ink-muted);">
            ${lang === 'zh' ? '目前顯示你嘅本地成績；連接 Firebase 後即可啟用 Google 登入與全球即時排名！' : 'Showing your local score right now. Connect your free Firebase config to turn on Google OAuth & global rankings!'}
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="setupFirebaseBtn">
          ⚙️ ${lang === 'zh' ? '連接雲端設定' : 'Cloud Setup'}
        </button>
      </div>
    `;
    authArea.querySelector('#setupFirebaseBtn').addEventListener('click', openFirebaseSetupModal);
  } else if (!authUser) {
    authArea.innerHTML = `
      <button type="button" class="btn btn-jade btn-full" id="boardGoogleSignInBtn">
        ${t(lang, 'signInGoogle')}
      </button>
    `;
    authArea.querySelector('#boardGoogleSignInBtn').addEventListener('click', handleGoogleLoginClick);
  } else {
    authArea.innerHTML = `
      <div style="padding:0.7rem 0.95rem;background:var(--jade-soft);border:2px solid var(--jade);border-radius:14px;display:flex;justify-content:space-between;align-items:center;gap:0.6rem;flex-wrap:wrap;">
        <span>✅ ${lang === 'zh' ? `已登入雲端：${authUser.email || state.profile.displayName}` : `Cloud Synced: ${authUser.email || state.profile.displayName}`}</span>
        <div style="display:flex;gap:0.4rem;">
          <button type="button" class="chip-btn" id="editProfileBtn">✏️ ${lang === 'zh' ? '改名／頭像' : 'Edit Profile'}</button>
          <button type="button" class="chip-btn" id="syncNowBtn">🔄 ${lang === 'zh' ? '同步分數' : 'Sync'}</button>
        </div>
      </div>
    `;
    authArea.querySelector('#editProfileBtn').addEventListener('click', openProfileModal);
    authArea.querySelector('#syncNowBtn').addEventListener('click', async () => {
      await syncScoreToCloud(state);
      showToast(lang === 'zh' ? '✅ 分數已同步上龍虎榜！' : '✅ Score synced to cloud!');
      renderLeaderboardView();
    });
  }

  // Circle controls when on 'circle' sub-tab
  const circleArea = mainEl.querySelector('#circleControlsArea');
  const allCircles = Array.from(new Set([state.profile.myCircleCode, ...(state.profile.joinedCircles || [])]));
  let selectedCircle = allCircles[0];

  if (boardSubTab === 'circle') {
    circleArea.innerHTML = `
      <div style="padding:0.85rem;background:var(--bg-paper);border-radius:14px;border:1.5px solid var(--border-strong);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <span>
            <strong>${lang === 'zh' ? '我嘅專屬邀請碼：' : 'Your Invite Code:'}</strong>
            <code style="font-size:1.05rem;padding:0.15rem 0.5rem;background:#fff;border-radius:6px;border:1px solid var(--border-strong);">${state.profile.myCircleCode}</code>
          </span>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            ${allCircles
              .map(
                c => `<span class="news-tag" style="margin:0;">🏷️ ${c}</span>`
              )
              .join('')}
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.65rem;flex-wrap:wrap;">
          <input type="text" id="joinCircleInput" class="input-field" style="flex:1;margin:0;min-height:44px;" placeholder="${
            lang === 'zh' ? '輸入親友代碼（例如 TEA-8888）' : 'Enter friend circle code (e.g. TEA-8888)'
          }" />
          <button type="button" class="btn btn-jade btn-sm" id="joinCircleBtn">${lang === 'zh' ? '加入親友圈' : 'Join Circle'}</button>
        </div>
      </div>
    `;
    circleArea.querySelector('#joinCircleBtn').addEventListener('click', async () => {
      const val = circleArea.querySelector('#joinCircleInput').value.trim().toUpperCase();
      if (!val) return;
      state.profile.joinedCircles = Array.from(new Set([...(state.profile.joinedCircles || []), val]));
      saveState(state);
      if (getCurrentAuthUser()) await syncScoreToCloud(state);
      showToast(lang === 'zh' ? `✅ 已加入親友圈 ${val}！` : `✅ Joined Circle ${val}!`);
      renderLeaderboardView();
    });
  }

  // Fetch & render rows
  const rowsArea = mainEl.querySelector('#boardRowsArea');
  let rows = [];
  if (configured) {
    try {
      if (boardSubTab === 'circle') {
        const targetCode = (state.profile.joinedCircles && state.profile.joinedCircles[0]) || state.profile.myCircleCode;
        rows = await fetchCircleLeaderboard(targetCode);
      } else {
        rows = await fetchGlobalLeaderboard(boardSubTab);
      }
    } catch (e) {
      console.warn('Leaderboard fetch note:', e);
    }
  }

  // Always ensure current local player is visible in preview if not yet synced
  const myUid = authUser ? authUser.uid : 'local_me';
  if (!rows.some(r => r.uid === myUid)) {
    rows.push({
      uid: myUid,
      displayName: state.profile.displayName,
      avatar: state.profile.avatar,
      homeBadge: state.profile.homeBadge,
      totalPoints: state.stats.totalPoints,
      todayPoints: state.stats.todayPoints,
      streak: state.stats.streak,
      isLocalPreview: !authUser
    });
    rows.sort((a, b) =>
      boardSubTab === 'today' ? (b.todayPoints || 0) - (a.todayPoints || 0) : (b.totalPoints || 0) - (a.totalPoints || 0)
    );
  }

  rowsArea.innerHTML = rows
    .map((r, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
      const pts = boardSubTab === 'today' ? r.todayPoints || 0 : r.totalPoints || 0;
      const isMe = r.uid === myUid;
      return `
        <div class="board-row ${isMe ? 'me' : ''}">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <span class="rank-num">${medal}</span>
            <span style="font-size:1.5rem;">${r.avatar || '🫖'}</span>
            <div>
              <strong>${r.homeBadge || ''} ${escapeHtml(r.displayName || '茶客')}</strong>
              ${r.isLocalPreview ? `<span style="font-size:0.75rem;color:var(--ink-muted);"> (${lang === 'zh' ? '本地' : 'Local'})</span>` : ''}
              <div style="font-size:0.78rem;color:var(--ink-muted);">🔥 ${r.streak || 0} ${t(lang, 'streakUnit')}</div>
            </div>
          </div>
          <strong style="font-size:1.1rem;color:var(--red-chop-dark);">${pts} ${t(lang, 'pointsUnit')}</strong>
        </div>
      `;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

async function handleGoogleLoginClick() {
  try {
    const user = await signInWithGoogle();
    if (user) {
      if (state.profile.displayName === '醒神茶客' && user.displayName) {
        state.profile.displayName = user.displayName.slice(0, 18);
        saveState(state);
      }
      await syncScoreToCloud(state);
      syncChrome();
      showToast(state.lang === 'zh' ? '🎉 登入成功！已同步分數上全球龍虎榜！' : '🎉 Signed in & synced to Global Leaderboard!');
      if (currentTab === 'leaderboard') renderLeaderboardView();
    }
  } catch (err) {
    showToast((state.lang === 'zh' ? '登入提示：' : 'Sign-in note: ') + (err.message || err));
  }
}

/* =========================================================================
   COLLECTIBLE ALBUM VIEW (港溫珍藏圖鑑)
   ========================================================================= */
function renderAlbumView() {
  const lang = state.lang;
  const unlockedSet = new Set(state.unlockedAlbumIds);
  const categories = [
    { key: 'dimsum', zh: '🥟 經典點心系列', en: '🥟 Classic Dim Sum' },
    { key: 'tea', zh: '🫖 名茶雅集系列', en: '🫖 Famous Chinese Teas' },
    { key: 'place', zh: '🌉 港溫情懷地標', en: '🌉 HK × Vancouver Icons' }
  ];

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <h1 style="margin:0;font-size:1.32rem;">🎁 ${lang === 'zh' ? '港溫早茶珍藏圖鑑' : 'HK × Vancouver Keepsake Album'}</h1>
      <p style="margin:0.3rem 0 0;color:var(--ink-muted);">
        ${
          lang === 'zh'
            ? `已收集 ${unlockedSet.size} / ${COLLECTIBLE_ALBUM.length} 款珍藏！（每累積 160 分或集齊每日四道印仔即自動解鎖新卡）`
            : `Collected ${unlockedSet.size} / ${COLLECTIBLE_ALBUM.length} keepsakes! (Earn 160 pts or complete a Daily 4-Dish Card to unlock more)`
        }
      </p>
    </div>
  `;

  categories.forEach(cat => {
    const sec = document.createElement('div');
    sec.innerHTML = `<div class="section-heading"><h2>${cat[lang]}</h2></div><div class="album-grid"></div>`;
    const grid = sec.querySelector('.album-grid');
    COLLECTIBLE_ALBUM.filter(x => x.cat === cat.key).forEach(item => {
      const isOpen = unlockedSet.has(item.id);
      const card = document.createElement('div');
      card.className = `album-card ${isOpen ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="album-emoji">${isOpen ? item.display || item.emoji : '🔒'}</div>
        <strong style="display:block;font-size:0.98rem;">${isOpen ? item[lang] : lang === 'zh' ? '待解鎖珍藏' : 'Locked Keepsake'}</strong>
        <p style="margin:0.3rem 0 0;font-size:0.8rem;color:var(--ink-muted);">
          ${isOpen ? pickText(item.blurb, lang) : lang === 'zh' ? '繼續玩腦點心即可獲得！' : 'Play more rounds to unlock!'}
        </p>
      `;
      grid.appendChild(card);
    });
    wrap.appendChild(sec);
  });

  mainEl.innerHTML = '';
  mainEl.appendChild(wrap);
}

/* =========================================================================
   MODALS: PROFILE/AUTH, FAMILY PHOTOS, FIREBASE CLOUD CONFIG
   ========================================================================= */
function openProfileModal() {
  const lang = state.lang;
  const authUser = getCurrentAuthUser();
  const avatars = ['🫖', '🥟', '🀄', '🌺', '🦁', '🍁', '⛴️', '🐼'];
  const badges = [
    { val: '🇭🇰', label: '🇭🇰 香港 HK' },
    { val: '🇨🇦', label: '🇨🇦 溫哥華 YVR' },
    { val: '🌏', label: '🌏 港×溫 Both' }
  ];

  openModal(
    `
    <h2 style="margin-top:0;">${lang === 'zh' ? '👤 茶客個人檔案與登入' : '👤 Player Profile & Cloud Login'}</h2>
    <label style="font-weight:800;display:block;margin-top:0.6rem;">
      ${lang === 'zh' ? '顯示名稱（龍虎榜暱稱）：' : 'Display Name:'}
      <input type="text" id="profNameInput" class="input-field" maxlength="20" value="${escapeHtml(state.profile.displayName)}" />
    </label>

    <div style="margin-top:0.85rem;">
      <strong style="display:block;margin-bottom:0.35rem;">${lang === 'zh' ? '揀個頭像：' : 'Choose Avatar:'}</strong>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;" id="avatarPicker">
        ${avatars
          .map(
            av =>
              `<button type="button" class="chip-btn av-opt" data-av="${av}" style="font-size:1.3rem;${
                state.profile.avatar === av ? 'border-color:var(--red-chop);background:var(--red-chop-soft);' : ''
              }">${av}</button>`
          )
          .join('')}
      </div>
    </div>

    <div style="margin-top:0.85rem;">
      <strong style="display:block;margin-bottom:0.35rem;">${lang === 'zh' ? '地區徽章：' : 'Home City Badge:'}</strong>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;" id="badgePicker">
        ${badges
          .map(
            b =>
              `<button type="button" class="chip-btn badge-opt" data-bg="${b.val}" style="${
                state.profile.homeBadge === b.val ? 'border-color:var(--red-chop);background:var(--red-chop-soft);' : ''
              }">${b.label}</button>`
          )
          .join('')}
      </div>
    </div>

    <div style="margin-top:1rem;padding-top:0.9rem;border-top:1px solid var(--border);">
      ${
        !isFirebaseConfigured()
          ? `<button type="button" class="btn btn-outline btn-full btn-sm" id="profOpenFbBtn">⚙️ ${
              lang === 'zh' ? '設定 Firebase 雲端龍虎榜' : 'Configure Firebase Cloud Sync'
            }</button>`
          : authUser
          ? `<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
               <span style="font-size:0.88rem;color:var(--jade-dark);font-weight:700;">✅ ${authUser.email}</span>
               <button type="button" class="chip-btn" id="profSignOutBtn">${t(lang, 'signOut')}</button>
             </div>`
          : `<button type="button" class="btn btn-jade btn-full btn-sm" id="profSignInBtn">${t(lang, 'signInGoogle')}</button>`
      }
    </div>

    <div class="action-row" style="margin-top:1.1rem;">
      <button type="button" class="btn btn-outline btn-sm" id="profCancelBtn">${lang === 'zh' ? '關閉' : 'Close'}</button>
      <button type="button" class="btn btn-primary btn-sm" id="profSaveBtn">${lang === 'zh' ? '儲存設定 ✅' : 'Save Profile ✅'}</button>
    </div>
  `,
    card => {
      let pickedAv = state.profile.avatar;
      let pickedBg = state.profile.homeBadge;

      card.querySelectorAll('.av-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          pickedAv = btn.dataset.av;
          card.querySelectorAll('.av-opt').forEach(b => (b.style.background = ''));
          btn.style.background = 'var(--red-chop-soft)';
        });
      });

      card.querySelectorAll('.badge-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          pickedBg = btn.dataset.bg;
          card.querySelectorAll('.badge-opt').forEach(b => (b.style.background = ''));
          btn.style.background = 'var(--red-chop-soft)';
        });
      });

      const fbBtn = card.querySelector('#profOpenFbBtn');
      if (fbBtn) fbBtn.addEventListener('click', openFirebaseSetupModal);

      const inBtn = card.querySelector('#profSignInBtn');
      if (inBtn) {
        inBtn.addEventListener('click', async () => {
          closeModal();
          await handleGoogleLoginClick();
        });
      }

      const outBtn = card.querySelector('#profSignOutBtn');
      if (outBtn) {
        outBtn.addEventListener('click', async () => {
          await signOutCloud();
          closeModal();
          syncChrome();
          renderMain();
        });
      }

      card.querySelector('#profCancelBtn').addEventListener('click', closeModal);
      card.querySelector('#profSaveBtn').addEventListener('click', async () => {
        const val = card.querySelector('#profNameInput').value.trim();
        if (val) state.profile.displayName = val;
        state.profile.avatar = pickedAv;
        state.profile.homeBadge = pickedBg;
        saveState(state);
        if (getCurrentAuthUser()) {
          syncScoreToCloud(state).catch(() => {});
        }
        closeModal();
        syncChrome();
        renderMain();
        showToast(lang === 'zh' ? '✅ 已儲存個人設定！' : '✅ Profile saved!');
      });
    }
  );
}

async function openFamilyPhotosModal(onAfterClose) {
  const lang = state.lang;
  const photos = await getFamilyPhotos();

  openModal(
    `
    <h2 style="margin-top:0;">📸 ${lang === 'zh' ? '屋企人相片配對卡' : 'Family Photo Memory Cards'}</h2>
    <p style="color:var(--ink-muted);font-size:0.9rem;margin-top:0;">
      ${
        lang === 'zh'
          ? '揀幾張孫仔孫女、寵物或者旅行靚相（只會安全儲存喺你部 iPad／手機入面，唔會上傳上網），玩翻牌配對時就會自動出場！'
          : 'Add photos of grandkids, pets, or trips! Photos stay 100% private on this device and appear in Memory Match.'
      }
    </p>

    <div style="padding:0.85rem;background:var(--bg-paper);border-radius:14px;border:1.5px solid var(--border-strong);">
      <input type="text" id="photoLabelInput" class="input-field" style="margin-top:0;margin-bottom:0.55rem;" placeholder="${
        lang === 'zh' ? '相片稱呼（例如：乖孫仔、溫哥華花園）' : 'Label (e.g. Grandson Leo, Stanley Park)'
      }" />
      <input type="file" id="photoFileInput" accept="image/*" style="width:100%;" />
    </div>

    <div class="item-grid" id="savedPhotosGrid" style="margin-top:0.9rem;">
      ${photos
        .map(
          p => `
        <div class="item-chip" style="cursor:default;padding:0.45rem;">
          <img src="${p.dataUrl}" alt="${escapeHtml(p.label)}" style="width:100%;height:74px;object-fit:cover;border-radius:8px;" />
          <span style="font-size:0.8rem;">${escapeHtml(p.label)}</span>
          <button type="button" class="chip-btn del-photo-btn" data-id="${p.id}" style="min-height:32px;font-size:0.75rem;padding:0.15rem 0.5rem;">🗑️</button>
        </div>`
        )
        .join('')}
    </div>

    <button type="button" class="btn btn-primary btn-full btn-sm" id="closePhotoModalBtn" style="margin-top:0.9rem;">
      ${lang === 'zh' ? '完成 ✅' : 'Done ✅'}
    </button>
  `,
    card => {
      card.querySelector('#photoFileInput').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const lbl = card.querySelector('#photoLabelInput').value.trim() || (lang === 'zh' ? '溫馨合照' : 'Family');
        const dataUrl = await resizeImageFileToDataUrl(file, 360);
        await addFamilyPhoto(lbl, dataUrl);
        showToast(lang === 'zh' ? '📸 已加入相片！' : '📸 Photo added!');
        openFamilyPhotosModal(onAfterClose);
      });

      card.querySelectorAll('.del-photo-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await deleteFamilyPhoto(btn.dataset.id);
          openFamilyPhotosModal(onAfterClose);
        });
      });

      card.querySelector('#closePhotoModalBtn').addEventListener('click', () => {
        closeModal();
        if (onAfterClose) onAfterClose();
      });
    }
  );
}

function openFirebaseSetupModal() {
  const lang = state.lang;
  openModal(
    `
    <h2 style="margin-top:0;">☁️ ${lang === 'zh' ? '連接免費 Firebase Spark 雲端榜' : 'Connect Free Firebase Spark'}</h2>
    <p style="font-size:0.88rem;color:var(--ink-muted);">
      ${
        lang === 'zh'
          ? '貼上 Firebase Web App 設定（apiKey, authDomain, projectId, appId）即可即時啟用 Google 登入與全球排行榜（正式發佈時亦可寫入 js/firebase-config.js）：'
          : 'Paste your Firebase Web App config JSON (or object) below to activate Google Sign-In & Global Leaderboard right away:'
      }
    </p>
    <textarea id="fbJsonInput" class="input-field" rows="6" style="font-family:monospace;font-size:0.82rem;" placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."}'></textarea>
    <div class="action-row" style="margin-top:0.9rem;">
      <button type="button" class="btn btn-outline btn-sm" id="fbCancelBtn">${lang === 'zh' ? '取消' : 'Cancel'}</button>
      <button type="button" class="btn btn-jade btn-sm" id="fbSaveBtn">${lang === 'zh' ? '連接並啟用 🚀' : 'Connect 🚀'}</button>
    </div>
  `,
    card => {
      card.querySelector('#fbCancelBtn').addEventListener('click', closeModal);
      card.querySelector('#fbSaveBtn').addEventListener('click', async () => {
        const raw = card.querySelector('#fbJsonInput').value.trim();
        try {
          // Support pasting either strict JSON or JS object snippet from Firebase Console!
          const grab = key => {
            const m = raw.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
            return m ? m[1] : '';
          };
          let cfg = null;
          if (raw.startsWith('{') && raw.includes('"apiKey"')) {
            cfg = JSON.parse(raw);
          } else {
            cfg = {
              apiKey: grab('apiKey'),
              authDomain: grab('authDomain'),
              projectId: grab('projectId'),
              storageBucket: grab('storageBucket'),
              messagingSenderId: grab('messagingSenderId'),
              appId: grab('appId')
            };
          }
          if (!cfg || !cfg.apiKey || !cfg.projectId) {
            throw new Error('Missing apiKey or projectId');
          }
          saveFirebaseConfigOverride(cfg);
          await initFirebaseIfConfigured();
          closeModal();
          showToast(lang === 'zh' ? '🎉 已成功連接 Firebase！而家可以用 Google 登入喇！' : '🎉 Connected to Firebase! Google Sign-In is ready!');
          renderMain();
        } catch (err) {
          showToast('Config format error: ' + err.message);
        }
      });
    }
  );
}

/* =========================================================================
   MAIN ROUTER & EVENT WIRING
   ========================================================================= */
function renderMain() {
  if (currentTab === 'home') renderHomeView();
  else if (currentTab === 'games') renderGamesTabView();
  else if (currentTab === 'leaderboard') renderLeaderboardView();
  else if (currentTab === 'album') renderAlbumView();
}

document.getElementById('brandHomeBtn').addEventListener('click', () => switchTab('home'));

document.getElementById('langToggleBtn').addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  saveState(state);
  syncChrome();
  if (currentTab === 'playing' && activeGameId) launchGame(activeGameId);
  else renderMain();
});

document.getElementById('fontCycleBtn').addEventListener('click', () => {
  const order = ['md', 'lg', 'xl'];
  const next = order[(order.indexOf(state.fontSize) + 1) % order.length];
  state.fontSize = next;
  saveState(state);
  syncChrome();
});

document.getElementById('soundToggleBtn').addEventListener('click', () => {
  state.sound = !state.sound;
  saveState(state);
  syncChrome();
  if (state.sound) playSfx('tap', true);
});

document.getElementById('profileHeaderBtn').addEventListener('click', openProfileModal);

document.querySelectorAll('.region-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    state.region = btn.dataset.region;
    saveState(state);
    syncChrome();
    if (currentTab === 'playing' && activeGameId) launchGame(activeGameId);
    else renderMain();
  });
});

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    playSfx('switch', state.sound);
    switchTab(tab.dataset.tab);
  });
});

// Service Worker registration for offline PWA support on iPad / iPhone
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Initialize
updateClocks();
setInterval(updateClocks, 20000);
checkUrlInvite();
syncChrome();
renderMain();

initFirebaseIfConfigured().then(() => {
  onUserChanged(user => {
    syncChrome();
    if (user) {
      syncScoreToCloud(state).catch(() => {});
    }
    if (currentTab === 'leaderboard') renderLeaderboardView();
  });
});
