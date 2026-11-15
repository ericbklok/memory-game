import { GAME_CATALOG, GAME_CATEGORIES, COLLECTIBLE_ALBUM } from './data/content.js';
import { t, pickText, getRankTitle, randomPraise, playSfx, speakText, stopSpeaking } from './i18n.js';
import {
  renderMasterBoSvg,
  MASTER_BO_QUIPS,
  spawnConfettiBurst,
  renderBrainRadarSvg,
  resetComboStreak,
  evaluateAgePerformance,
  renderAgeComparisonCard
} from './ui-fx.js';
import { mountBaoBo3D } from './mascot-3d.js';
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
import { mountSpotDiffGame } from './games/spot-diff-game.js';
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
const startScreenEl = document.getElementById('startScreenOverlay');

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
  const rawCode = (params.get('invite') || params.get('circle') || '').trim().toUpperCase();
  const fromName = (params.get('from') || '').replace(/[<>&"']/g, '').trim().slice(0, 24);
  if (!rawCode) return;

  // Clean URL query gracefully without reloading
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);

  // Strict allowlist format for invite/circle codes (blocks reflected XSS & malformed circles)
  if (!/^[A-Z0-9-]{3,16}$/.test(rawCode)) return;
  const code = rawCode;

  const alreadyJoined =
    state.profile.myCircleCode === code || (state.profile.joinedCircles || []).includes(code);

  if (!alreadyJoined) {
    state.profile.joinedCircles = Array.from(new Set([...(state.profile.joinedCircles || []), code])).slice(0, 9);
    if (fromName) state.profile.invitedBy = fromName;
  }

  let gotBonus = false;
  if (!state.inviteBonusClaimedCodes.includes(code) && state.profile.myCircleCode !== code) {
    state.inviteBonusClaimedCodes = state.inviteBonusClaimedCodes.slice(-49).concat([code]);
    state.stats.totalPoints += 50;
    state.stats.todayPoints += 50;
    gotBonus = true;
  }
  saveState(state);

  inviteBannerEl.classList.remove('hidden');
  const senderLabel = escapeHtml(fromName || (state.lang === 'zh' ? '親友' : 'A friend'));
  const safeCode = escapeHtml(code);
  inviteBannerEl.innerHTML = `
    <div>
      <strong>🎉 ${
        state.lang === 'zh'
          ? `${senderLabel} 邀請你加入親友圈「${safeCode}」！${gotBonus ? '（已送你 +50 迎新積分！）' : ''}`
          : `${senderLabel} invited you to Circle "${safeCode}"! ${gotBonus ? '(+50 Welcome Bonus pts!)' : ''}`
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
  const prefs = state.prefs || {};
  document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  document.documentElement.dataset.font = state.fontSize;
  document.documentElement.dataset.speechRate = prefs.speechRate || 'normal';
  document.documentElement.dataset.motion = prefs.reducedMotion ? 'calm' : 'full';
  document.body.classList.toggle('mode-playing', currentTab === 'playing');

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
   HOME VIEW (今日早茶 · FOCUSED NINTENDO TEA PLAZA WITH 3D BAOBO)
   ========================================================================= */
function openGachaRouletteModal() {
  if (rouletteBusy) return;
  const lang = state.lang;
  const zh = lang === 'zh';
  rouletteBusy = true;

  openModal(
    `
    <div style="text-align:center;padding:0.4rem 0.2rem;">
      <div class="start-ribbon" style="margin-bottom:0.55rem;">
        🎲 ${zh ? '招財貓扭蛋選關機' : 'Lucky Cat Gacha Roulette'}
      </div>
      <div id="gachaBoSlot" style="width:120px;height:120px;margin:0 auto;"></div>
      <div id="gachaCapsuleStage" class="gacha-capsule-box">
        <div id="gachaIcon" style="font-size:3.2rem;line-height:1.1;">🥟</div>
        <div id="gachaTitle" style="font-weight:900;font-size:1.22rem;margin-top:0.3rem;">${zh ? '轉動緊點心籠…' : 'Spinning Steamer…'}</div>
        <div id="gachaSub" style="font-size:0.84rem;color:var(--ink-muted);font-weight:700;margin-top:0.15rem;">${zh ? '預備上菜！' : 'Get ready!'}</div>
      </div>
    </div>
  `,
    card => {
      const boCtrl = mountBaoBo3D(card.querySelector('#gachaBoSlot'), {
        size: 120,
        role: 'modal',
        mood: 'cheer'
      });
      const iconEl = card.querySelector('#gachaIcon');
      const titleEl = card.querySelector('#gachaTitle');
      const subEl = card.querySelector('#gachaSub');
      const boxEl = card.querySelector('#gachaCapsuleStage');

      const totalTicks = 12;
      const winner = GAME_CATALOG[Math.floor(Math.random() * GAME_CATALOG.length)];
      let step = 0;

      const spinStep = () => {
        const cur = step < totalTicks ? GAME_CATALOG[step % GAME_CATALOG.length] : winner;
        if (iconEl) iconEl.textContent = cur.icon;
        if (titleEl) titleEl.textContent = pickText(cur.title, lang);
        if (subEl) subEl.textContent = pickText(cur.pillar, lang);
        playSfx(step === totalTicks ? 'correct' : 'roulette', state.sound);

        if (step === totalTicks) {
          boCtrl.poke();
          if (boxEl) boxEl.classList.add('winner-glow');
          setTimeout(() => {
            rouletteBusy = false;
            closeModal();
            inDailySequence = false;
            launchGame(winner.id);
          }, 620);
          return;
        }
        step += 1;
        setTimeout(spinStep, 60 + step * 18);
      };
      spinStep();
    }
  );
}

function renderHomeView() {
  const lang = state.lang;
  const zh = lang === 'zh';
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
  const shownName = state.profile.displayName || (zh ? '醒神茶客' : 'Tea Guest');
  const overallEval =
    state.stats.gamesCompleted > 0
      ? evaluateAgePerformance({
          age: state.profile.age,
          recentRounds: state.stats.recentRounds,
          lang
        })
      : null;

  const wrap = document.createElement('div');
  wrap.className = 'plaza-stage-shell';
  wrap.innerHTML = `
    <section class="nintendo-plaza-board">
      <!-- Left Spotlight: 3D Character Guide Stage -->
      <div class="plaza-character-wing">
        <div class="plaza-player-banner">
          <div class="plaza-player-id">
            <span class="plaza-avatar-badge">${escapeHtml(state.profile.avatar || '🫖')}</span>
            <div>
              <div class="plaza-player-name">${escapeHtml(state.profile.homeBadge || '🇭🇰')} ${escapeHtml(shownName)}${
                state.profile.age ? ` <small>(${Number(state.profile.age) || ''}${zh ? '歲' : 'y'})</small>` : ''
              }</div>
              <div class="plaza-player-rank">${rank} · ${t(lang, greetKey)}</div>
            </div>
          </div>
        </div>

        <div class="plaza-3d-pedestal-wrap" id="plazaBoStageWrap">
          <div class="plaza-spotlight-ring"></div>
          <div id="plazaBo3DMount" class="plaza-bo-3d-mount"></div>
          <span class="plaza-poke-pill">👆 ${zh ? '輕撳阿喵摸摸頭' : 'Pet 3D Mochi!'}</span>
        </div>

        <div class="plaza-comic-bubble" id="boBubbleBtn">
          <div class="plaza-bubble-head">
            <span class="bo-name-tag">🐾 ${zh ? '三色招財貓阿喵 3D' : '3D Calico Cat Mochi'}</span>
            <div style="display:flex;gap:0.3rem;">
              <button type="button" class="baobo-voice-chip" id="plazaBoSpeakBtn">🔊 ${zh ? '朗讀' : 'Listen'}</button>
              <button type="button" class="baobo-voice-chip" id="plazaBoNextTipBtn">💬 ${zh ? '換貼士' : 'Next Tip'}</button>
            </div>
          </div>
          <div id="boSpeechText" class="plaza-bubble-body">${curQuip.text}</div>
        </div>

        <div class="plaza-stat-strip">
          <span class="stat-pill fire">🔥 ${state.stats.streak} ${t(lang, 'streakUnit')}</span>
          <span class="stat-pill teapot" title="Warm Teapot protects your streak!">🫖 ${state.stats.teapotShields} ${t(lang, 'teapotShield')}</span>
          <span class="stat-pill points">⭐ ${state.stats.totalPoints} ${t(lang, 'pointsUnit')}</span>
          ${
            overallEval
              ? `<button type="button" class="stat-pill vitality-jump" id="jumpVitalityBtn">
                   🧠 ${zh ? `同齡前 ${overallEval.topPct}%` : `Top ${overallEval.topPct}%`}${
                     overallEval.showVitalityAge ? ` · ${zh ? `活力 ${overallEval.vitalityAge}歲` : `Vitality ${overallEval.vitalityAge}`}` : ''
                   } →
                 </button>`
              : ''
          }
        </div>
      </div>

      <!-- Right Spotlight: Today's Focused 4-Dish Quest Stage -->
      <div class="plaza-quest-wing">
        <div class="stamp-slip focused-quest-slip">
          <div class="stamp-slip-header">
            <span>${t(lang, 'slipTitle')}</span>
            <span class="quest-progress-badge">${doneCount} / ${dishes.length} ${zh ? '完成' : 'Clear'}</span>
          </div>
          <div class="stamp-grid quest-2x2-grid" id="dailyStampGrid"></div>
        </div>

        <button type="button" class="btn-play-mega plaza-mega-cta" id="heroStartBtn">
          <span>▶</span>
          <span>${ctaLabel}</span>
        </button>

        <div class="plaza-quick-dock">
          <button type="button" class="btn btn-plum btn-sm" id="surpriseHomeBtn">
            🎲 ${zh ? '扭蛋抽關' : 'Gacha Spin'}
          </button>
          <button type="button" class="btn btn-gold btn-sm" id="browseAllGamesBtn">
            🕹️ ${zh ? '全部 16 款卡帶' : 'All 16 Games'}
          </button>
          <button type="button" class="btn btn-jade btn-sm" id="shareCardBtn">
            📲 ${zh ? '晒點心紙' : 'Share Card'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="inviteHomeBtn">
            📨 ${zh ? '邀親友' : 'Invite'}
          </button>
        </div>
      </div>
    </section>
  `;

  // Mount 3D Lucky Cat Mochi on the Plaza Pedestal!
  const boMountEl = wrap.querySelector('#plazaBo3DMount');
  const plazaBo = mountBaoBo3D(boMountEl, {
    size: 184,
    role: 'plaza',
    mood: doneCount === 4 ? 'cheer' : curQuip.mood,
    onTap: function () {
      cycleBoQuip(true);
    }
  });

  const cycleBoQuip = isPetTap => {
    playSfx(isPetTap ? 'meow' : 'switch', state.sound);
    boQuipIdx = (boQuipIdx + 1) % quipPool.length;
    const nextQ = quipPool[boQuipIdx];
    plazaBo.setMood(nextQ.mood);
    wrap.querySelector('#boSpeechText').textContent = nextQ.text;
  };

  wrap.querySelector('#plazaBoNextTipBtn').addEventListener('click', e => {
    e.stopPropagation();
    cycleBoQuip();
  });

  wrap.querySelector('#plazaBoSpeakBtn').addEventListener('click', e => {
    e.stopPropagation();
    const txt = wrap.querySelector('#boSpeechText').textContent;
    plazaBo.poke();
    plazaBo.setTalking(true);
    speakText(txt, lang);
    setTimeout(() => plazaBo.setTalking(false), 3200);
  });

  const jumpVitBtn = wrap.querySelector('#jumpVitalityBtn');
  if (jumpVitBtn) {
    jumpVitBtn.addEventListener('click', () => {
      playSfx('switch', state.sound);
      switchTab('leaderboard');
    });
  }

  const stampGrid = wrap.querySelector('#dailyStampGrid');
  dishes.forEach((dId, idx) => {
    const meta = GAME_CATALOG.find(g => g.id === dId);
    const stamped = state.daily.stamps[dId];
    const isNext = dId === nextUnstamped;
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `stamp-slot ${stamped ? 'done' : ''} ${isNext ? 'next-up-slot' : ''}`;
    slot.innerHTML = `
      <span class="quest-num-badge">#${idx + 1}</span>
      <span class="stamp-slot-icon">${meta.icon}</span>
      <span class="stamp-slot-name">${pickText(meta.shortName, lang)}</span>
      <span class="stamp-slot-sub">
        ${stamped ? '⭐'.repeat(stamped.stars) : isNext ? (zh ? '▶ 下一籠' : '▶ Up Next') : zh ? '撳此開局' : 'Play'}
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
      openGachaRouletteModal();
    }
  });

  wrap.querySelector('#surpriseHomeBtn').addEventListener('click', openGachaRouletteModal);
  wrap.querySelector('#browseAllGamesBtn').addEventListener('click', () => {
    playSfx('switch', state.sound);
    switchTab('games');
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
    openGachaRouletteModal();
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
    const fallbackLvl = g.id === 'make24' ? 0 : 1;
    const lvl = typeof state.stats.perGameLevel[g.id] === 'number' ? state.stats.perGameLevel[g.id] : fallbackLvl;
    const plays = (state.stats.perGamePlays && state.stats.perGamePlays[g.id]) || 0;
    const medalLabel =
      plays >= 5
        ? `👑 ×${plays}`
        : plays > 0
        ? `⭐ ×${plays}`
        : lang === 'zh'
        ? '✨ 新卡帶'
        : '✨ New!';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.gameId = g.id;
    btn.className = `game-card cartridge-tile theme-${g.theme || 'jade'}`;
    btn.innerHTML = `
      <div class="cartridge-top-notch"></div>
      <div class="cartridge-header-row">
        <div class="game-icon-box">${g.icon}</div>
        <span class="play-medal">${medalLabel}</span>
      </div>
      <h3 class="game-card-title">${pickText(g.title, lang)}</h3>
      <div class="cartridge-meta-row">
        <span class="level-tag" style="margin-top:0;">${pickText(g.pillar, lang)} · ${lvlNames[lvl]}</span>
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
   ALL GAMES VIEW (自選點心 · NINTENDO SWITCH CARTRIDGE SHELF)
   ========================================================================= */
function renderGamesTabView() {
  const lang = state.lang;
  const zh = lang === 'zh';
  const wrap = document.createElement('div');
  wrap.className = 'shelf-stage-shell';
  wrap.innerHTML = `
    <div class="card cartridge-shelf-banner">
      <div class="shelf-host-row">
        <div id="shelfBo3DSlot" style="width:78px;height:78px;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <h1 style="margin:0;font-size:1.24rem;font-weight:900;">🕹️ ${t(lang, 'quickPickTitle')}</h1>
          <p style="margin:0.15rem 0 0;color:var(--ink-muted);font-size:0.88rem;font-weight:700;">
            ${zh ? '16 款無計時健腦卡帶 · 連續 3 個月以上零重複題庫！' : '16 untimed brain cartridges · 100+ days of non-repeating puzzles!'}
          </p>
        </div>
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-plum btn-sm" id="surpriseAllBtn">
            🎲 ${zh ? '扭蛋隨機抽' : 'Surprise Spin'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="managePhotosBtn">
            📸 ${zh ? '相片卡' : 'Photo Cards'}
          </button>
        </div>
      </div>
      <div class="cat-filter-bar" id="allGamesCatBar" style="margin-top:0.75rem;"></div>
    </div>
    <div class="games-grid cartridge-shelf-grid" id="allGamesGrid"></div>
  `;
  mountBaoBo3D(wrap.querySelector('#shelfBo3DSlot'), {
    size: 78,
    role: 'shelf',
    mood: 'happy'
  });

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
  else if (gameId === 'spotdiff') mountSpotDiffGame(ctx);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDishCompleted(gameId, score, stars) {
  playSfx('fanfare', state.sound);
  spawnConfettiBurst(42);

  const usedLevel =
    typeof state.stats.perGameLevel[gameId] === 'number'
      ? state.stats.perGameLevel[gameId]
      : gameId === 'make24'
      ? 0
      : 1;

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

  const ageEval = evaluateAgePerformance({
    age: state.profile.age,
    score,
    stars,
    level: usedLevel,
    lang
  });

  let starsHtml = '';
  for (let i = 0; i < stars; i++) {
    starsHtml += `<span class="victory-star" style="animation-delay:${i * 0.14}s;">⭐</span>`;
  }

  mainEl.innerHTML = `
    <div class="card hero-card victory-stage">
      <div class="victory-sunburst"></div>
      <div style="display:flex;justify-content:center;align-items:center;gap:0.85rem;position:relative;margin-bottom:0.35rem;">
        <div id="victoryBo3DSlot" style="width:148px;height:148px;"></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;">
          <span style="font-size:3.2rem;line-height:1;">${gameMeta.icon}</span>
          <span class="red-chop" style="position:static;width:3.1rem;height:3.1rem;font-size:0.86rem;">
            ${t(lang, 'stampChop')}
          </span>
        </div>
      </div>
      <div style="margin:0.2rem 0;">${starsHtml}</div>
      <h2 style="margin:0.25rem 0;font-size:1.5rem;">${randomPraise(lang)}</h2>
      <p style="font-size:1.25rem;font-weight:900;color:var(--red-chop-dark);margin:0.4rem 0;">
        +<span id="winScoreTicker">0</span> ${t(lang, 'pointsUnit')}
        ${newlyCompletedAllFour ? (lang === 'zh' ? '（另加齊印獎賞 +50 分！🎊）' : ' (+50 Full Card Bonus! 🎊)') : ''}
      </p>

      ${renderAgeComparisonCard(ageEval, lang)}

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

  mountBaoBo3D(mainEl.querySelector('#victoryBo3DSlot'), {
    size: 148,
    role: 'victory',
    mood: 'cheer'
  });

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
   BRAIN CHECKUP & LEADERBOARD VIEW (腦力五維評估 · 全球與親友龍虎榜)
   ========================================================================= */
async function renderLeaderboardView() {
  const lang = state.lang;
  const zh = lang === 'zh';
  const configured = isFirebaseConfigured();
  const authUser = getCurrentAuthUser();
  const checkupEval = evaluateAgePerformance({
    age: state.profile.age,
    recentRounds: state.stats.recentRounds,
    lang
  });

  mainEl.innerHTML = `
    <div class="card checkup-spotlight-card">
      <div class="checkup-grid">
        <div class="radar-panel" style="margin:0;">
          <div class="radar-title">🧠 ${zh ? '腦力五維活力圖' : '5-Axis Brain Vitality'}</div>
          ${renderBrainRadarSvg(state.stats.perGamePlays, lang)}
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:0.55rem;">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div id="boardBo3DSlot" style="width:84px;height:84px;flex-shrink:0;"></div>
            <div>
              <div style="font-weight:900;font-size:1.1rem;">${zh ? '阿喵腦力體檢報告' : "Mochi's Brain Checkup"}</div>
              <div style="font-size:0.84rem;color:var(--ink-muted);font-weight:700;">
                ${zh ? `已完成 ${state.stats.gamesCompleted} 局健腦點心` : `${state.stats.gamesCompleted} brain dishes completed`}
              </div>
            </div>
          </div>
          ${renderAgeComparisonCard(checkupEval, lang)}
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;">
        <div>
          <h1 style="margin:0;font-size:1.28rem;">🏆 ${zh ? '茶樓龍虎榜（全球與親友圈）' : 'Global & Family Leaderboard'}</h1>
          <p style="margin:0.2rem 0 0;color:var(--ink-muted);font-size:0.88rem;font-weight:700;">
            ${
              zh
                ? '本地即玩免登入；連接 Google 即可同步全球排名並與親友比拼！'
                : 'Play locally anytime — or sign in with Google to compare scores with family!'
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

  mountBaoBo3D(mainEl.querySelector('#boardBo3DSlot'), {
    size: 84,
    role: 'board',
    mood: 'proud'
  });

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
        <span>✅ ${lang === 'zh' ? `已登入雲端：${escapeHtml(authUser.email || state.profile.displayName)}` : `Cloud Synced: ${escapeHtml(authUser.email || state.profile.displayName)}`}</span>
        <div style="display:flex;gap:0.4rem;">
          <button type="button" class="chip-btn" id="editProfileBtn">✏️ ${lang === 'zh' ? '改名／頭像' : 'Edit Profile'}</button>
          <button type="button" class="chip-btn" id="syncNowBtn">🔄 ${lang === 'zh' ? '同步分數' : 'Sync'}</button>
        </div>
      </div>
    `;
    authArea.querySelector('#editProfileBtn').addEventListener('click', openProfileModal);
    authArea.querySelector('#syncNowBtn').addEventListener('click', async () => {
      await syncScoreToCloud(state, true);
      showToast(lang === 'zh' ? '✅ 分數已同步上龍虎榜！' : '✅ Score synced to cloud!');
      renderLeaderboardView();
    });
  }

  // Circle controls when on 'circle' sub-tab
  const circleArea = mainEl.querySelector('#circleControlsArea');
  const allCircles = Array.from(new Set([state.profile.myCircleCode, ...(state.profile.joinedCircles || [])])).filter(c =>
    /^[A-Z0-9-]{3,16}$/.test(String(c || ''))
  );
  let selectedCircle = allCircles[0];

  if (boardSubTab === 'circle') {
    circleArea.innerHTML = `
      <div style="padding:0.85rem;background:var(--bg-paper);border-radius:14px;border:1.5px solid var(--border-strong);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <span>
            <strong>${lang === 'zh' ? '我嘅專屬邀請碼：' : 'Your Invite Code:'}</strong>
            <code style="font-size:1.05rem;padding:0.15rem 0.5rem;background:#fff;border-radius:6px;border:1px solid var(--border-strong);">${escapeHtml(state.profile.myCircleCode)}</code>
          </span>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            ${allCircles
              .map(
                c => `<span class="news-tag" style="margin:0;">🏷️ ${escapeHtml(c)}</span>`
              )
              .join('')}
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.65rem;flex-wrap:wrap;">
          <input type="text" id="joinCircleInput" class="input-field" maxlength="16" style="flex:1;margin:0;min-height:44px;" placeholder="${
            lang === 'zh' ? '輸入親友代碼（例如 TEA-8888）' : 'Enter friend circle code (e.g. TEA-8888)'
          }" />
          <button type="button" class="btn btn-jade btn-sm" id="joinCircleBtn">${lang === 'zh' ? '加入親友圈' : 'Join Circle'}</button>
        </div>
      </div>
    `;
    circleArea.querySelector('#joinCircleBtn').addEventListener('click', async () => {
      const val = circleArea.querySelector('#joinCircleInput').value.trim().toUpperCase();
      if (!/^[A-Z0-9-]{3,16}$/.test(val)) {
        showToast(lang === 'zh' ? '⚠️ 請輸入有效邀請碼（3–16 位英文字母、數字或連字號）' : '⚠️ Enter a valid 3–16 character invite code (A–Z, 0–9, -)');
        return;
      }
      state.profile.joinedCircles = Array.from(new Set([...(state.profile.joinedCircles || []), val])).slice(0, 9);
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
      const pts = Math.max(0, Number(boardSubTab === 'today' ? r.todayPoints || 0 : r.totalPoints || 0) || 0);
      const safeStreak = Math.max(0, Number(r.streak || 0) || 0);
      const isMe = r.uid === myUid;
      return `
        <div class="board-row ${isMe ? 'me' : ''}">
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <span class="rank-num">${medal}</span>
            <span style="font-size:1.5rem;">${escapeHtml(r.avatar || '🫖')}</span>
            <div>
              <strong>${escapeHtml(r.homeBadge || '')} ${escapeHtml(r.displayName || '茶客')}</strong>
              ${r.isLocalPreview ? `<span style="font-size:0.75rem;color:var(--ink-muted);"> (${lang === 'zh' ? '本地' : 'Local'})</span>` : ''}
              <div style="font-size:0.78rem;color:var(--ink-muted);">🔥 ${safeStreak} ${t(lang, 'streakUnit')}</div>
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
      if ((!state.profile.displayName || state.profile.displayName === '醒神茶客') && user.displayName) {
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
    <div class="card cartridge-shelf-banner">
      <div class="shelf-host-row">
        <div id="albumBo3DSlot" style="width:76px;height:76px;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <h1 style="margin:0;font-size:1.26rem;font-weight:900;">🎁 ${lang === 'zh' ? '港溫早茶珍藏圖鑑' : 'HK × Vancouver Keepsake Album'}</h1>
          <p style="margin:0.2rem 0 0;color:var(--ink-muted);font-size:0.88rem;font-weight:700;">
            ${
              lang === 'zh'
                ? `已收集 ${unlockedSet.size} / ${COLLECTIBLE_ALBUM.length} 款珍藏！（每累積 160 分或集齊每日四道印仔即自動解鎖新卡）`
                : `Collected ${unlockedSet.size} / ${COLLECTIBLE_ALBUM.length} keepsakes! (Earn 160 pts or complete a Daily 4-Dish Card to unlock more)`
            }
          </p>
        </div>
      </div>
    </div>
  `;
  mountBaoBo3D(wrap.querySelector('#albumBo3DSlot'), {
    size: 76,
    role: 'album',
    mood: 'happy'
  });

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
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:0.65rem;margin-top:0.6rem;">
      <label style="font-weight:800;display:block;">
        ${lang === 'zh' ? '顯示名稱：' : 'User Name:'}
        <input type="text" id="profNameInput" class="input-field" maxlength="20" value="${escapeHtml(state.profile.displayName || '')}" placeholder="${lang === 'zh' ? '例如：陳太' : 'e.g. Auntie May'}" />
      </label>
      <label style="font-weight:800;display:block;">
        ${lang === 'zh' ? '年齡（計算同齡表現）：' : 'Age (Peer Scoring):'}
        <input type="number" id="profAgeInput" class="input-field" min="8" max="108" value="${state.profile.age || ''}" placeholder="68" />
      </label>
    </div>
    <div style="font-size:0.78rem;color:var(--ink-muted);margin-top:0.25rem;">
      🔒 ${lang === 'zh' ? '年齡只會儲存喺你部機用嚟評估同齡腦力表現，絕不會公開上龍虎榜。' : 'Your age stays 100% private on this device for age-relative scoring and is never shown publicly.'}
    </div>

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
               <span style="font-size:0.88rem;color:var(--jade-dark);font-weight:700;">✅ ${escapeHtml(authUser.email || '')}</span>
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
        const ageVal = parseInt(card.querySelector('#profAgeInput').value, 10);
        if (val) state.profile.displayName = val;
        if (ageVal >= 8 && ageVal <= 108) state.profile.age = ageVal;
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
        .filter(p => /^data:image\/(jpeg|png|webp|gif);base64,/i.test(String(p.dataUrl || '')))
        .map(
          p => `
        <div class="item-chip" style="cursor:default;padding:0.45rem;">
          <img src="${escapeHtml(p.dataUrl)}" alt="${escapeHtml(p.label)}" style="width:100%;height:74px;object-fit:cover;border-radius:8px;" />
          <span style="font-size:0.8rem;">${escapeHtml(p.label)}</span>
          <button type="button" class="chip-btn del-photo-btn" data-id="${escapeHtml(p.id)}" style="min-height:32px;font-size:0.75rem;padding:0.15rem 0.5rem;">🗑️</button>
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
   NINTENDO STARTING SCREEN, NEWCOMER WELCOME TOUR & USER PREFERENCES
   ========================================================================= */
function showStartScreen(forceEditProfile) {
  if (!startScreenEl) return;
  stopSpeaking();
  const lang = state.lang;
  const zh = lang === 'zh';
  const hasSavedProfile = Boolean(
    state.profile.displayName &&
      state.profile.age &&
      !(state.profile.displayName === '醒神茶客' && !state.profile.age)
  );
  const showForm = !hasSavedProfile || Boolean(forceEditProfile);
  const prefillName =
    state.profile.displayName && !(state.profile.displayName === '醒神茶客' && !state.profile.age)
      ? state.profile.displayName
      : '';
  const prefillAge = state.profile.age ? String(state.profile.age) : '';
  const rank = getRankTitle(state.stats.totalPoints, lang);

  startScreenEl.classList.remove('hidden');
  startScreenEl.innerHTML = `
    <div class="start-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;flex-wrap:wrap;">
        <span class="start-ribbon" style="margin-bottom:0;">
          🌏 ${zh ? '港 × 溫 雙語健腦樂園' : 'HK × Vancouver Brain Clubhouse'}
        </span>
        <button type="button" class="chip-btn" id="startLangSwapBtn" style="min-height:34px;padding:0.15rem 0.65rem;font-size:0.78rem;">
          🌐 ${zh ? 'English' : '粵語 中文'}
        </button>
      </div>

      <h1 class="start-title-zh">每日腦點心</h1>
      <div class="start-title-en">DAILY MINDSUM · 16 BRAIN GAMES</div>

      <div class="start-mascot-stage" style="margin:0.35rem auto 0.55rem;">
        <span class="start-float-icon">🥟</span>
        <span class="start-float-icon delay-1">🀄</span>
        <div id="startBo3DSlot" class="start-3d-bo-slot"></div>
        <span class="start-float-icon delay-2">🫖</span>
        <span class="start-float-icon delay-1">🍁</span>
      </div>

      ${
        !showForm
          ? `<div class="start-entry-box" style="text-align:center;">
               <div style="font-size:0.82rem;font-weight:900;color:var(--jade-dark);margin-bottom:0.35rem;">
                 ✅ ${zh ? '已自動記住你嘅玩家檔案（無須重填！）' : 'Saved Player Profile Remembered'}
               </div>
               <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6rem;padding:0.6rem 0.85rem;border-radius:14px;background:var(--surface);border:2px solid var(--border-strong);flex-wrap:wrap;">
                 <div style="text-align:left;">
                   <div style="font-size:1.08rem;font-weight:900;color:var(--ink);">
                     ${escapeHtml(state.profile.avatar || '🫖')} ${escapeHtml(state.profile.displayName)} <span style="font-size:0.88rem;color:var(--ink-muted);">(${Number(state.profile.age) || ''} ${zh ? '歲' : 'yrs'})</span>
                   </div>
                   <div style="font-size:0.78rem;font-weight:800;color:var(--jade-dark);margin-top:0.1rem;">
                     ${rank} · 🔥 ${state.stats.streak} ${t(lang, 'streakUnit')} · ⭐ ${state.stats.totalPoints} ${t(lang, 'pointsUnit')}
                   </div>
                 </div>
                 <button type="button" class="chip-btn" id="startSwitchPlayerBtn" style="min-height:36px;font-size:0.8rem;">
                   ✏️ ${zh ? '更改／轉人' : 'Edit / Switch'}
                 </button>
               </div>
             </div>`
          : `<div class="start-entry-box">
               <div style="font-size:0.84rem;font-weight:800;color:var(--jade-dark);margin-bottom:0.55rem;">
                 ✨ ${
                   zh
                     ? '只需首次輸入稱呼同年齡，之後會自動記住無須重填！'
                     : 'Enter your Name & Age once — saved automatically for every visit!'
                 }
               </div>

               <div class="start-entry-grid">
                 <div>
                   <label class="start-field-label" for="startNameInput">
                     👤 ${zh ? '玩家稱呼 User Name' : 'User Name'}
                   </label>
                   <input
                     id="startNameInput"
                     class="input-field start-input"
                     type="text"
                     maxlength="18"
                     autocomplete="nickname"
                     placeholder="${zh ? '例如：陳太 / Uncle Chan' : 'e.g. Grandma Lee / Sam'}"
                     value="${escapeHtml(prefillName)}"
                   />
                 </div>

                 <div>
                   <label class="start-field-label" for="startAgeInput">
                     🎂 ${zh ? '年齡 Age（8–108 歲）' : 'Age (8–108)'}
                   </label>
                   <div class="age-stepper-wrap">
                     <button type="button" class="age-step-btn" id="ageMinusBtn" aria-label="Decrease age">−</button>
                     <input
                       id="startAgeInput"
                       class="input-field start-input"
                       type="number"
                       inputmode="numeric"
                       min="8"
                       max="108"
                       placeholder="${zh ? '例如 68' : 'e.g. 68'}"
                       value="${escapeHtml(prefillAge)}"
                       style="text-align:center;font-weight:900;padding-left:0.4rem;padding-right:0.4rem;"
                     />
                     <button type="button" class="age-step-btn" id="agePlusBtn" aria-label="Increase age">＋</button>
                   </div>
                 </div>
               </div>

               <div id="startErrorMsg" style="display:none;margin-top:0.55rem;font-size:0.84rem;font-weight:800;color:var(--red-chop-dark);"></div>
               <div style="margin-top:0.45rem;font-size:0.75rem;color:var(--ink-muted);">
                 🔒 ${zh ? '資料只會私密儲存喺你部機入面，下次打開自動載入，絕唔公開年齡。' : 'Saved privately on your device for automatic sign-in next time; age is never public.'}
               </div>
             </div>`
      }

      <button type="button" class="btn-play-mega" id="startMegaPlayBtn">
        <span>▶</span>
        <span>${
          !showForm
            ? zh
              ? `繼續開枱飲茶！（${escapeHtml(state.profile.displayName)}）`
              : `CONTINUE AS ${escapeHtml(state.profile.displayName).toUpperCase()}!`
            : zh
            ? !state.onboardingDone
              ? '開枱飲茶！（新手導賞）'
              : '開枱飲茶！開始遊戲'
            : !state.onboardingDone
            ? 'PLAY! (Welcome Tour)'
            : 'PRESS PLAY!'
        }</span>
      </button>

      <div class="action-row" style="margin-top:0.8rem;">
        <button type="button" class="btn btn-outline btn-sm" id="startTourBtn">
          📖 ${zh ? '玩法導賞' : 'Welcome Tour'}
        </button>
        <button type="button" class="btn btn-outline btn-sm" id="startSettingsBtn">
          ⚙️ ${zh ? '偏好設定' : 'Settings'}
        </button>
      </div>
    </div>
  `;

  const startBo = mountBaoBo3D(startScreenEl.querySelector('#startBo3DSlot'), {
    size: 148,
    role: 'start',
    mood: !showForm ? 'happy' : 'wave',
    onTap: function () {
      playSfx('meow', state.sound);
      startBo.setMood('cheer');
    }
  });

  const nameInput = startScreenEl.querySelector('#startNameInput');
  const ageInput = startScreenEl.querySelector('#startAgeInput');
  const errEl = startScreenEl.querySelector('#startErrorMsg');
  const switchBtn = startScreenEl.querySelector('#startSwitchPlayerBtn');

  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      playSfx('switch', state.sound);
      showStartScreen(true);
    });
  }

  startScreenEl.querySelector('#startLangSwapBtn').addEventListener('click', () => {
    if (nameInput && ageInput) {
      const draftName = nameInput.value.trim();
      const draftAge = parseInt(ageInput.value, 10);
      if (draftName) state.profile.displayName = draftName.slice(0, 18);
      if (!isNaN(draftAge) && draftAge >= 8 && draftAge <= 108) state.profile.age = draftAge;
    }
    playSfx('switch', state.sound);
    state.lang = zh ? 'en' : 'zh';
    saveState(state);
    syncChrome();
    renderMain();
    showStartScreen(forceEditProfile);
  });

  if (showForm && nameInput && ageInput) {
    const stepAge = delta => {
      playSfx('tap', state.sound);
      startBo.poke();
      const cur = parseInt(ageInput.value, 10);
      const base = isNaN(cur) ? 65 : cur;
      const next = Math.max(8, Math.min(108, base + delta));
      ageInput.value = String(next);
      ageInput.classList.remove('input-error');
      errEl.style.display = 'none';
    };

    startScreenEl.querySelector('#ageMinusBtn').addEventListener('click', () => stepAge(-1));
    startScreenEl.querySelector('#agePlusBtn').addEventListener('click', () => stepAge(1));

    nameInput.addEventListener('input', () => {
      nameInput.classList.remove('input-error');
      errEl.style.display = 'none';
      startBo.setMood('happy');
    });
    ageInput.addEventListener('input', () => {
      ageInput.classList.remove('input-error');
      errEl.style.display = 'none';
      startBo.setMood('proud');
    });

    [nameInput, ageInput].forEach(inp => {
      inp.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          validateAndProceed(false);
        }
      });
    });
  }

  function validateAndProceed(forceTour) {
    if (!showForm) {
      playSfx('fanfare', state.sound);
      startScreenEl.classList.add('hidden');
      if (forceTour || !state.onboardingDone) {
        openWelcomeTourModal(0);
      }
      return;
    }

    const cleanName = nameInput.value.trim().slice(0, 18);
    const cleanAge = parseInt(ageInput.value, 10);
    const validName = cleanName.length > 0;
    const validAge = !isNaN(cleanAge) && cleanAge >= 8 && cleanAge <= 108;

    nameInput.classList.toggle('input-error', !validName);
    ageInput.classList.toggle('input-error', !validAge);

    if (!validName || !validAge) {
      playSfx('gentle', state.sound);
      errEl.style.display = 'block';
      if (!validName && !validAge) {
        errEl.textContent = zh
          ? '⚠️ 請先輸入你嘅「稱呼」同「年齡（8–108 歲）」再開始啦 😊'
          : '⚠️ Please enter both your User Name and Age (8–108) to start!';
        nameInput.focus();
      } else if (!validName) {
        errEl.textContent = zh ? '⚠️ 請輸入你嘅玩家稱呼（例如：陳太）😊' : '⚠️ Please enter your User Name!';
        nameInput.focus();
      } else {
        errEl.textContent = zh
          ? '⚠️ 請輸入有效年齡（8 至 108 歲），以便計算同齡腦力表現！'
          : '⚠️ Please enter a valid Age between 8 and 108!';
        ageInput.focus();
      }
      return;
    }

    state.profile.displayName = cleanName;
    state.profile.age = cleanAge;
    saveState(state);
    syncChrome();
    renderMain();

    playSfx('fanfare', state.sound);
    startScreenEl.classList.add('hidden');
    if (forceTour || !state.onboardingDone) {
      openWelcomeTourModal(0);
    }
  }

  startScreenEl.querySelector('#startMegaPlayBtn').addEventListener('click', () => {
    validateAndProceed(false);
  });

  startScreenEl.querySelector('#startTourBtn').addEventListener('click', () => {
    validateAndProceed(true);
  });

  startScreenEl.querySelector('#startSettingsBtn').addEventListener('click', () => {
    playSfx('switch', state.sound);
    openSettingsModal();
  });
}

function openWelcomeTourModal(initialStep) {
  let step = typeof initialStep === 'number' ? initialStep : 0;

  function renderSlide() {
    const lang = state.lang;
    const zh = lang === 'zh';
    const userName = state.profile.displayName || (zh ? '茶友' : 'Friend');
    const userAge = state.profile.age || 65;
    const sampleEval = evaluateAgePerformance({
      age: userAge,
      score: 130,
      stars: 3,
      level: 1,
      lang: lang
    });

    const slides = [
      {
        mood: 'happy',
        title: zh ? `歡迎光臨，${escapeHtml(userName)}！每日四籠腦點心` : `Welcome, ${escapeHtml(userName)}! Today's 4 Brain Dishes`,
        voice: zh
          ? `歡迎光臨，${userName}！喵～我係招財茶貓阿喵。每日我哋會為你精選四道健腦點心，每完成一道就蓋一個頂點紅印仔，集齊四個仲有額外五十分同保溫壺護盾！`
          : `Welcome, ${userName}! Meow~ I am Mochi the Lucky Tea Cat. Each day features 4 balanced Brain Dishes. Finish a dish to earn a red TOP chop, bonus points, and Warm Teapot Streak Shields!`,
        bodyHtml: `
          <div class="tour-showcase-box">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:0.65rem;">
              <div style="padding:0.55rem;border-radius:12px;border:2px solid #E3958F;background:#FFF9F7;position:relative;text-align:center;">
                <div style="font-size:1.4rem;">📰</div>
                <strong style="font-size:0.84rem;">1. ${zh ? '時事醒目仔' : 'Daily News'}</strong>
                <span class="red-chop" style="width:2rem;height:2rem;font-size:0.64rem;">${zh ? '頂點' : 'TOP'}</span>
              </div>
              <div style="padding:0.55rem;border-radius:12px;border:2px solid #E3958F;background:#FFF9F7;position:relative;text-align:center;">
                <div style="font-size:1.4rem;">🔢</div>
                <strong style="font-size:0.84rem;">2. ${zh ? '茶樓數獨' : 'Sudoku'}</strong>
                <span class="red-chop" style="width:2rem;height:2rem;font-size:0.64rem;">${zh ? '頂點' : 'TOP'}</span>
              </div>
            </div>
            <p style="margin:0;font-size:0.9rem;line-height:1.55;">
              • <strong>🔴 ${zh ? '每日四籠' : '4 Daily Dishes'}：</strong>${zh ? '只需約 4 至 6 分鐘，全面鍛鍊記憶、邏輯、心算、語言同眼力！' : 'Takes just 4–6 relaxing minutes across Memory, Logic, Math, Verbal & Focus!'}<br/>
              • <strong>🫖 ${zh ? '保溫壺護盾' : 'Teapot Streak Shield'}：</strong>${zh ? '忙緊漏玩一日？保溫壺會自動幫你保住連續日數，零壓力！' : 'Miss a busy day? Your Warm Teapot automatically protects your streak!'}
            </p>
          </div>
        `
      },
      {
        mood: 'proud',
        title: zh ? '📊 專屬同齡腦力表現評估' : '📊 Age-Relative Performance Scoring',
        voice: zh
          ? `每次過關之後，系統會根據你嘅年齡組別，估算你喺同齡茶友之中嘅表現百分比，同埋你嘅腦力活力年齡！你嘅年齡只會私密留喺本機。`
          : `After every dish, we estimate how your score compares with peers in your ${sampleEval.cohortLabel} group — plus your Brain Vitality Age! Your age stays completely private on your device.`,
        bodyHtml: `
          <div class="tour-showcase-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.35rem;">
              <span class="age-cohort-tag">👥 ${sampleEval.cohortLabel}</span>
              <span class="age-grade-tag">${sampleEval.badge}</span>
            </div>
            <div style="font-size:0.95rem;font-weight:800;margin-bottom:0.4rem;">
              ${zh ? '過關示範：超越約 <strong>92%</strong> 同齡茶友！' : 'Example Clear: Outperforming ~<strong>92%</strong> of peers your age!'}
            </div>
            <div class="age-meter-track" style="margin-bottom:0.55rem;">
              <div class="age-meter-fill" style="width:92%;"></div>
            </div>
            <p style="margin:0;font-size:0.88rem;line-height:1.55;color:var(--ink-muted);">
              • <strong>🧠 ${zh ? '腦力活力年齡' : 'Brain Vitality Age'}：</strong>${zh ? '首頁雷達圖同過關畫面都會即時顯示你嘅同齡表現指標！' : 'Tracked live on both stage-clear screens and your Home Brain Radar!'}<br/>
              • <strong>🔒 ${zh ? '私隱保障' : 'Privacy First'}：</strong>${zh ? '全球龍虎榜只會顯示稱呼同總分，絕唔會公開年齡。' : 'Leaderboards only show your nickname and points — never your age.'}
            </p>
          </div>
        `
      },
      {
        mood: 'cheer',
        title: zh ? '🕹️ 零計時壓力 · 語音貼士與設定' : '🕹️ Stress-Free Play, Voice & Settings',
        voice: zh
          ? '全部十六款遊戲都唔限時間，輕輕一撳就玩得。隨時撳喇叭聽廣東話或英文朗讀，或者撳右上角齒輪調整字體大細、語速同地區！即刻開波嘆早茶啦！'
          : 'All 16 games are untimed and single-tap. Tap Read Aloud anytime to listen, use Hints freely, or tap the top-right Gear icon to customize text size, voice speed, and city focus!',
        bodyHtml: `
          <div class="tour-showcase-box">
            <p style="margin:0;font-size:0.9rem;line-height:1.6;">
              • <strong>👆 ${zh ? '一指輕撳即玩' : 'Simple Single-Tap'}：</strong>${zh ? '無須拖拉、無倒數催促，答錯都會溫馨提示再試！' : 'No dragging, no countdown clocks — gentle encouragement on every try!'}<br/>
              • <strong>🔊 ${zh ? '真人語音朗讀 & 💡 貼士' : 'Read Aloud & 💡 Smart Hints'}：</strong>${zh ? '支援廣東話及英文發音，卡關隨時撳燈膽！' : 'Cantonese & English voice support plus helpful hints anytime!'}<br/>
              • <strong>⚙️ ${zh ? '右上角偏好設定' : 'Top-Right ⚙️ Settings'}：</strong>${zh ? '隨時更改特大字體 (A++)、朗讀語速、港／溫地區或親友圈！' : 'Adjust Extra-Large text (A++), voice speed, HK/YVR focus, or Family Circles anytime!'}
            </p>
          </div>
        `
      }
    ];

    const s = slides[step];
    let dots = '';
    for (let i = 0; i < slides.length; i++) {
      dots += `<span class="tour-dot ${i === step ? 'active' : ''}"></span>`;
    }

    openModal(
      `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
        <span style="font-size:0.8rem;font-weight:900;color:var(--jade-dark);">
          🐾 ${zh ? `阿喵導賞 (${step + 1} / ${slides.length})` : `Mochi's Tour (${step + 1} / ${slides.length})`}
        </span>
        <div style="display:flex;gap:0.35rem;">
          <button type="button" class="chip-btn" id="tourSpeakBtn" style="min-height:36px;padding:0.2rem 0.65rem;font-size:0.78rem;">
            🔊 ${zh ? '朗讀' : 'Listen'}
          </button>
          <button type="button" class="chip-btn" id="tourSkipBtn" style="min-height:36px;padding:0.2rem 0.65rem;font-size:0.78rem;">
            ${zh ? '跳過 ✕' : 'Skip ✕'}
          </button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:0.8rem;margin-top:0.65rem;">
        <div id="tourBo3DSlot" style="width:96px;height:96px;flex-shrink:0;"></div>
        <h2 style="margin:0;font-size:1.2rem;line-height:1.28;">${s.title}</h2>
      </div>

      <div class="tour-step-dots">${dots}</div>

      ${s.bodyHtml}

      <div class="action-row" style="margin-top:0.95rem;">
        ${
          step > 0
            ? `<button type="button" class="btn btn-outline btn-sm" id="tourPrevBtn">← ${zh ? '上一步' : 'Back'}</button>`
            : ''
        }
        ${
          step < slides.length - 1
            ? `<button type="button" class="btn btn-primary btn-sm" id="tourNextBtn">${zh ? '下一步 →' : 'Next →'}</button>`
            : `<button type="button" class="btn btn-primary btn-sm" id="tourFinishBtn">🎉 ${zh ? '開始嘆早茶！' : "Let's Play!"}</button>`
        }
      </div>
    `,
      card => {
        const tourBo = mountBaoBo3D(card.querySelector('#tourBo3DSlot'), {
          size: 96,
          role: 'tour',
          mood: s.mood
        });

        card.querySelector('#tourSpeakBtn').addEventListener('click', () => {
          tourBo.poke();
          tourBo.setTalking(true);
          speakText(s.voice, state.lang);
          setTimeout(() => tourBo.setTalking(false), 3600);
        });

        card.querySelector('#tourSkipBtn').addEventListener('click', () => {
          stopSpeaking();
          state.onboardingDone = true;
          saveState(state);
          closeModal();
          renderMain();
        });

        const prevB = card.querySelector('#tourPrevBtn');
        if (prevB) {
          prevB.addEventListener('click', () => {
            stopSpeaking();
            playSfx('switch', state.sound);
            step -= 1;
            renderSlide();
          });
        }

        const nextB = card.querySelector('#tourNextBtn');
        if (nextB) {
          nextB.addEventListener('click', () => {
            stopSpeaking();
            playSfx('switch', state.sound);
            step += 1;
            renderSlide();
          });
        }

        const finB = card.querySelector('#tourFinishBtn');
        if (finB) {
          finB.addEventListener('click', () => {
            stopSpeaking();
            state.onboardingDone = true;
            saveState(state);
            closeModal();
            playSfx('fanfare', state.sound);
            spawnConfettiBurst(36);
            renderMain();
            showToast(state.lang === 'zh' ? '🎉 導賞完成！祝你玩得開心醒神！' : '🎉 Tour complete! Have fun playing!');
          });
        }
      }
    );
  }

  renderSlide();
}

function openSettingsModal() {
  stopSpeaking();
  if (!state.prefs) {
    state.prefs = {
      speechRate: 'normal',
      defaultDifficulty: 1,
      autoLevelUp: true,
      sudokuDimSumIcons: false,
      reducedMotion: false,
      skipTitleScreen: false
    };
  }

  function renderPrefs() {
    const lang = state.lang;
    const zh = lang === 'zh';
    const p = state.prefs;

    openModal(
      `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.65rem;">
        <h2 style="margin:0;font-size:1.28rem;">⚙️ ${zh ? '茶客偏好設定' : 'User Preferences & Settings'}</h2>
        <button type="button" class="chip-btn" id="closeSettingsTopBtn" style="min-height:36px;padding:0.2rem 0.65rem;">✕</button>
      </div>

      <!-- 1. Language & Region -->
      <div class="pref-section">
        <div class="pref-section-title">🌐 ${zh ? '語言與地區內容' : 'Language & Region'}</div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '介面語言' : 'App Language'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${zh ? 'active' : ''}" data-plang="zh">粵語 / 繁體</button>
            <button type="button" class="pref-seg-btn ${!zh ? 'active' : ''}" data-plang="en">English</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '新聞與歷史地區' : 'Story Region'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${state.region === 'both' ? 'active' : ''}" data-preg="both">${zh ? '港×溫' : 'HK×YVR'}</button>
            <button type="button" class="pref-seg-btn ${state.region === 'hk' ? 'active' : ''}" data-preg="hk">🇭🇰 HK</button>
            <button type="button" class="pref-seg-btn ${state.region === 'yvr' ? 'active' : ''}" data-preg="yvr">🇨🇦 YVR</button>
          </div>
        </div>
      </div>

      <!-- 2. Display & Visual Comfort -->
      <div class="pref-section">
        <div class="pref-section-title">🔠 ${zh ? '字體大小與視覺舒適度' : 'Text Size & Motion'}</div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '字體大小' : 'Font Size'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${state.fontSize === 'md' ? 'active' : ''}" data-pfont="md">${zh ? '標準 A' : 'Normal A'}</button>
            <button type="button" class="pref-seg-btn ${state.fontSize === 'lg' ? 'active' : ''}" data-pfont="lg">${zh ? '大字 A+' : 'Large A+'}</button>
            <button type="button" class="pref-seg-btn ${state.fontSize === 'xl' ? 'active' : ''}" data-pfont="xl">${zh ? '特大 A++' : 'Extra A++'}</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '動畫效果' : 'Animations'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${!p.reducedMotion ? 'active' : ''}" data-pmotion="full">✨ ${zh ? '活潑動畫' : 'Lively'}</button>
            <button type="button" class="pref-seg-btn ${p.reducedMotion ? 'active' : ''}" data-pmotion="calm">🌿 ${zh ? '柔和減少動態' : 'Calm'}</button>
          </div>
        </div>
      </div>

      <!-- 3. Audio & Read-Aloud Speed -->
      <div class="pref-section">
        <div class="pref-section-title">🔊 ${zh ? '音效與語音朗讀' : 'Sound & Voice Read-Aloud'}</div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '遊戲按鍵音效' : 'Game Sound Effects'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${state.sound ? 'active' : ''}" data-psound="on">🔔 ${zh ? '開啟' : 'On'}</button>
            <button type="button" class="pref-seg-btn ${!state.sound ? 'active' : ''}" data-psound="off">🔕 ${zh ? '靜音' : 'Mute'}</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '朗讀語速' : 'Voice Speed'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${p.speechRate === 'slow' ? 'active' : ''}" data-prate="slow">🐢 ${zh ? '慢速清晰' : 'Slow'}</button>
            <button type="button" class="pref-seg-btn ${p.speechRate === 'normal' ? 'active' : ''}" data-prate="normal">🫖 ${zh ? '適中' : 'Normal'}</button>
            <button type="button" class="pref-seg-btn ${p.speechRate === 'fast' ? 'active' : ''}" data-prate="fast">🐇 ${zh ? '輕快' : 'Brisk'}</button>
            <button type="button" class="chip-btn" id="testVoicePrefBtn" style="min-height:38px;padding:0.2rem 0.65rem;font-size:0.8rem;">
              🔊 ${zh ? '試聽' : 'Test'}
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Gameplay & Comfort Rules -->
      <div class="pref-section">
        <div class="pref-section-title">🀄 ${zh ? '遊戲難度與玩法習慣' : 'Gameplay & Difficulty'}</div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '一鍵設定全部難度' : 'Set All Games Difficulty'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${p.defaultDifficulty === 0 ? 'active' : ''}" data-pdiff="0">${t(lang, 'lvlEasy')}</button>
            <button type="button" class="pref-seg-btn ${p.defaultDifficulty === 1 ? 'active' : ''}" data-pdiff="1">${t(lang, 'lvlMed')}</button>
            <button type="button" class="pref-seg-btn ${p.defaultDifficulty === 2 ? 'active' : ''}" data-pdiff="2">${t(lang, 'lvlHard')}</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '連贏自動進階難度' : 'Auto-Advance Difficulty'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${p.autoLevelUp !== false ? 'active' : ''}" data-pauto="on">${zh ? '開啟' : 'On'}</button>
            <button type="button" class="pref-seg-btn ${p.autoLevelUp === false ? 'active' : ''}" data-pauto="off">${zh ? '固定難度' : 'Lock Level'}</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '數獨預設圖案' : 'Sudoku Default Symbols'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${!p.sudokuDimSumIcons ? 'active' : ''}" data-psudoku="num">🔢 ${zh ? '數字' : 'Numbers'}</button>
            <button type="button" class="pref-seg-btn ${p.sudokuDimSumIcons ? 'active' : ''}" data-psudoku="icon">🥟 ${zh ? '點心圖案' : 'Dim Sum'}</button>
          </div>
        </div>
        <div class="pref-row">
          <span class="pref-label">${zh ? '每次打開顯示開始畫面' : 'Show Start Screen on Launch'}</span>
          <div class="pref-seg-group">
            <button type="button" class="pref-seg-btn ${!p.skipTitleScreen ? 'active' : ''}" data-ptitle="show">${zh ? '顯示' : 'Show'}</button>
            <button type="button" class="pref-seg-btn ${p.skipTitleScreen ? 'active' : ''}" data-ptitle="skip">${zh ? '直接入茶樓' : 'Skip'}</button>
          </div>
        </div>
      </div>

      <!-- Quick Actions: Tour, Profile, Start Screen -->
      <div class="action-row" style="margin-top:0.85rem;">
        <button type="button" class="btn btn-outline btn-sm" id="prefReplayTourBtn">
          📖 ${zh ? '重溫新手導賞' : 'Welcome Tour'}
        </button>
        <button type="button" class="btn btn-outline btn-sm" id="prefOpenProfileBtn">
          👤 ${zh ? '個人檔案／登入' : 'Profile & Cloud'}
        </button>
        <button type="button" class="btn btn-outline btn-sm" id="prefShowStartBtn">
          🏠 ${zh ? '返回開始畫面' : 'Title Screen'}
        </button>
      </div>

      <button type="button" class="btn btn-primary btn-full btn-sm" id="saveCloseSettingsBtn" style="margin-top:0.8rem;">
        ✅ ${zh ? '完成並返回遊戲' : 'Save & Done'}
      </button>
    `,
      card => {
        const refreshAll = () => {
          saveState(state);
          syncChrome();
          if (currentTab === 'playing' && activeGameId) launchGame(activeGameId);
          else renderMain();
          if (startScreenEl && !startScreenEl.classList.contains('hidden')) {
            showStartScreen();
          }
          renderPrefs();
        };

        card.querySelector('#closeSettingsTopBtn').addEventListener('click', closeModal);
        card.querySelector('#saveCloseSettingsBtn').addEventListener('click', () => {
          playSfx('switch', state.sound);
          closeModal();
        });

        card.querySelectorAll('[data-plang]').forEach(b => {
          b.addEventListener('click', () => {
            state.lang = b.dataset.plang;
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-preg]').forEach(b => {
          b.addEventListener('click', () => {
            state.region = b.dataset.preg;
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-pfont]').forEach(b => {
          b.addEventListener('click', () => {
            state.fontSize = b.dataset.pfont;
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-pmotion]').forEach(b => {
          b.addEventListener('click', () => {
            state.prefs.reducedMotion = b.dataset.pmotion === 'calm';
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-psound]').forEach(b => {
          b.addEventListener('click', () => {
            state.sound = b.dataset.psound === 'on';
            if (state.sound) playSfx('switch', true);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-prate]').forEach(b => {
          b.addEventListener('click', () => {
            state.prefs.speechRate = b.dataset.prate;
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelector('#testVoicePrefBtn').addEventListener('click', () => {
          const sample =
            state.lang === 'zh'
              ? '早晨！飲啖靚茶，動下腦筋，祝你今日精靈醒目！'
              : 'Good morning! Enjoy a cup of tea and a relaxing brain workout!';
          speakText(sample, state.lang, state.prefs.speechRate);
        });

        card.querySelectorAll('[data-pdiff]').forEach(b => {
          b.addEventListener('click', () => {
            const lvl = Number(b.dataset.pdiff);
            state.prefs.defaultDifficulty = lvl;
            GAME_CATALOG.forEach(g => {
              state.stats.perGameLevel[g.id] = lvl;
            });
            playSfx('switch', state.sound);
            showToast(
              state.lang === 'zh'
                ? '✅ 已將全部 16 款點心設為所選難度！'
                : '✅ Updated difficulty across all 16 games!'
            );
            refreshAll();
          });
        });

        card.querySelectorAll('[data-pauto]').forEach(b => {
          b.addEventListener('click', () => {
            state.prefs.autoLevelUp = b.dataset.pauto === 'on';
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-psudoku]').forEach(b => {
          b.addEventListener('click', () => {
            state.prefs.sudokuDimSumIcons = b.dataset.psudoku === 'icon';
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelectorAll('[data-ptitle]').forEach(b => {
          b.addEventListener('click', () => {
            state.prefs.skipTitleScreen = b.dataset.ptitle === 'skip';
            playSfx('switch', state.sound);
            refreshAll();
          });
        });

        card.querySelector('#prefReplayTourBtn').addEventListener('click', () => {
          playSfx('switch', state.sound);
          if (startScreenEl) startScreenEl.classList.add('hidden');
          openWelcomeTourModal(0);
        });

        card.querySelector('#prefOpenProfileBtn').addEventListener('click', () => {
          playSfx('switch', state.sound);
          openProfileModal();
        });

        card.querySelector('#prefShowStartBtn').addEventListener('click', () => {
          playSfx('switch', state.sound);
          closeModal();
          showStartScreen();
        });
      }
    );
  }

  renderPrefs();
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

document.getElementById('settingsHeaderBtn').addEventListener('click', () => {
  playSfx('switch', state.sound);
  openSettingsModal();
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

// Service Worker registration with immediate update check & seamless reload on upgrade
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (hadController && !swRefreshing) {
      swRefreshing = true;
      window.location.reload();
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

// Initialize
updateClocks();
setInterval(updateClocks, 20000);
checkUrlInvite();
syncChrome();
renderMain();
const needsStartEntry = !state.profile.displayName || !state.profile.age;
if (needsStartEntry || !state.prefs || !state.prefs.skipTitleScreen) {
  showStartScreen();
}

initFirebaseIfConfigured().then(() => {
  onUserChanged(user => {
    syncChrome();
    if (user) {
      syncScoreToCloud(state).catch(() => {});
    }
    if (currentTab === 'leaderboard') renderLeaderboardView();
  });
});
