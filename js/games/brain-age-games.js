import { GAME_CATALOG } from '../data/content.js';
import { drawFreshItems, hasSeenSignature, markSeenSignature } from '../data/seed-tracker.js';
import { renderStageHeader } from './engine.js';
import { t, pickText, randomPraise, playSfx, speakText, stopSpeaking } from '../i18n.js';
import { notifyStageBaoBo } from '../mascot-3d.js';

/* =========================================================================
   SHARED HELPERS (Strict ES2019, Zero Inline Event Handlers)
   ========================================================================= */

function escHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

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

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getGameLevel(state, gameId) {
  if (
    state &&
    state.stats &&
    state.stats.perGameLevel &&
    typeof state.stats.perGameLevel[gameId] === 'number'
  ) {
    return state.stats.perGameLevel[gameId];
  }
  return 1;
}

function findGameMeta(gameId, fallbackIcon, fallbackZh, fallbackEn) {
  if (Array.isArray(GAME_CATALOG)) {
    for (let i = 0; i < GAME_CATALOG.length; i++) {
      if (GAME_CATALOG[i] && GAME_CATALOG[i].id === gameId) {
        return GAME_CATALOG[i];
      }
    }
  }
  return {
    id: gameId,
    icon: fallbackIcon,
    title: { zh: fallbackZh, en: fallbackEn }
  };
}

function padTwo(n) {
  return n < 10 ? '0' + String(n) : String(n);
}

function formatClockTime(hour, minute) {
  const h = ((hour - 1 + 12) % 12) + 1;
  return String(h) + ':' + padTwo(minute);
}

/* =========================================================================
   1. TRAM & SKYTRAIN HEAD COUNT (🚋 叮叮天車數乘客 · gameId = 'headcount')
   Inspired by Brain Age's #1 hit "Head Count"
   ========================================================================= */

const PASSENGER_ICONS = ['👵', '👴', '🧑', '👧', '👦', '🐱'];

function generateHeadCountRound(state, level, roundIdx) {
  const waveCount = level === 0 ? 2 : level === 1 ? 3 : 4;
  let chosen = null;

  for (let attempt = 0; attempt < 90; attempt++) {
    const initialCount = randInt(2, 5);
    let running = initialCount;
    const waves = [];
    let valid = true;

    for (let w = 0; w < waveCount; w++) {
      let candidates = [];
      const maxIn = level === 0 ? 3 : level === 1 ? 3 : 4;
      const maxOut = level === 0 ? 2 : level === 1 ? 3 : 3;

      for (let bi = 0; bi <= maxIn; bi++) {
        for (let eo = 0; eo <= maxOut; eo++) {
          if (bi === 0 && eo === 0) continue;
          if (eo > running) continue;
          // On easy level, prefer either boarding OR exiting on most waves, with occasional gentle combo
          if (level === 0 && bi > 0 && eo > 0 && bi + eo > 3) continue;
          // On hard level, encourage simultaneous boarding and exiting
          if (level === 2 && bi === 0 && eo === 0) continue;
          const after = running + bi - eo;
          if (after >= 1 && after <= 12) {
            const weight = level >= 1 && bi > 0 && eo > 0 ? 3 : 1;
            for (let k = 0; k < weight; k++) {
              candidates.push({ inCount: bi, outCount: eo });
            }
          }
        }
      }

      if (candidates.length === 0) {
        valid = false;
        break;
      }

      const pick = candidates[randInt(0, candidates.length - 1)];
      const inFaces = [];
      const outFaces = [];
      for (let p = 0; p < pick.inCount; p++) {
        inFaces.push(PASSENGER_ICONS[(roundIdx * 3 + w * 2 + p) % PASSENGER_ICONS.length]);
      }
      for (let q = 0; q < pick.outCount; q++) {
        outFaces.push(PASSENGER_ICONS[(roundIdx * 5 + w + q + 1) % PASSENGER_ICONS.length]);
      }

      running = running + pick.inCount - pick.outCount;
      waves.push({
        inCount: pick.inCount,
        outCount: pick.outCount,
        inFaces: inFaces,
        outFaces: outFaces,
        afterCount: running
      });
    }

    if (!valid) continue;

    const sig =
      'hc_L' +
      level +
      '_i' +
      initialCount +
      '_' +
      waves
        .map(function (wv) {
          return '+' + wv.inCount + '-' + wv.outCount;
        })
        .join('_');

    chosen = {
      initialCount: initialCount,
      waves: waves,
      finalCount: running,
      sig: sig
    };

    if (!hasSeenSignature(state, 'headcount_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'headcount_sigs', chosen.sig, 400);

  // Pick initial passenger icons using drawFreshItems helper on rotated icon pool for variety
  const seatIcons = [];
  const shuffledIcons = shuffleList(PASSENGER_ICONS);
  for (let i = 0; i < chosen.initialCount; i++) {
    seatIcons.push(shuffledIcons[i % shuffledIcons.length]);
  }
  chosen.initialIcons = seatIcons;

  // Build 4 distinct plausible numeric options >= 0
  const optionNums = [chosen.finalCount];
  const deltas = shuffleList([-2, -1, 1, 2, -3, 3]);
  for (let d = 0; d < deltas.length && optionNums.length < 4; d++) {
    const cand = chosen.finalCount + deltas[d];
    if (cand >= 0 && cand <= 15 && optionNums.indexOf(cand) === -1) {
      optionNums.push(cand);
    }
  }
  let fallbackN = 0;
  while (optionNums.length < 4) {
    if (optionNums.indexOf(fallbackN) === -1) optionNums.push(fallbackN);
    fallbackN += 1;
  }
  chosen.options = shuffleList(optionNums);

  return chosen;
}

function renderTransitDioramaSvg(opts) {
  const isYvr = opts.theme === 'yvr';
  const zh = opts.zh;
  const curtainClosed = Boolean(opts.curtainClosed);
  const passengers = opts.passengers || [];
  const waveData = opts.activeWave || null;

  const skyGradId = 'hcSky_' + opts.uid;
  const bodyGradId = 'hcBody_' + opts.uid;

  const stationName = isYvr
    ? zh
      ? '🍁 溫哥華 Waterfront 天車站'
      : '🍁 Waterfront SkyTrain Station'
    : zh
    ? '🚋 香港中環叮叮電車站'
    : '🚋 HK Central Ding-Ding Stop';

  const mochiSign = zh ? '🐾 阿喵站長' : '🐾 Conductor Mochi';

  // Render passengers inside cabin windows (up to 12 in 2 neat rows or 6 big windows)
  let cabinContentSvg = '';
  if (!curtainClosed) {
    const count = passengers.length;
    for (let i = 0; i < count; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const wx = 84 + col * 32;
      const wy = count <= 6 ? 105 : row === 0 ? 95 : 117;
      cabinContentSvg +=
        '<g>' +
        '<rect x="' + (wx - 13) + '" y="' + (wy - 17) + '" width="26" height="24" rx="5" fill="#FFFBEB" stroke="#D97706" stroke-width="1.2" />' +
        '<text x="' + wx + '" y="' + (wy + 2) + '" text-anchor="middle" font-size="16">' +
        passengers[i] +
        '</text>' +
        '</g>';
    }
  } else {
    // Closed shutter / bamboo-slat curtain over cabin
    cabinContentSvg +=
      '<g>' +
      '<rect x="68" y="80" width="204" height="46" rx="7" fill="#FEF3C7" stroke="#B45309" stroke-width="2" />' +
      '<line x1="72" y1="91" x2="268" y2="91" stroke="#D97706" stroke-width="1.4" stroke-dasharray="6 3" />' +
      '<line x1="72" y1="103" x2="268" y2="103" stroke="#D97706" stroke-width="1.4" stroke-dasharray="6 3" />' +
      '<line x1="72" y1="115" x2="268" y2="115" stroke="#D97706" stroke-width="1.4" stroke-dasharray="6 3" />' +
      '<rect x="116" y="90" width="108" height="25" rx="12" fill="#92400E" />' +
      '<text x="170" y="107" text-anchor="middle" fill="#FFFBEB" font-size="11" font-weight="800">' +
      (zh ? '🔒 車簾已拉上 · 心算中' : '🔒 Curtain Closed') +
      '</text>' +
      '</g>';
  }

  // Animated wave arrows & walking passengers at Left Door (Board) and Right Door (Exit)
  let waveOverlaySvg = '';
  if (waveData) {
    if (waveData.inCount > 0) {
      const inIconsStr = waveData.inFaces.join('');
      waveOverlaySvg +=
        '<g>' +
        '<rect x="6" y="72" width="76" height="42" rx="9" fill="#065F46" stroke="#A7F3D0" stroke-width="2" />' +
        '<text x="44" y="88" text-anchor="middle" fill="#ECFDF5" font-size="10.5" font-weight="900">' +
        (zh ? '⬆️ 上車 +' + waveData.inCount : '⬆️ Board +' + waveData.inCount) +
        '</text>' +
        '<text x="44" y="106" text-anchor="middle" font-size="14">' +
        inIconsStr +
        '</text>' +
        '<path d="M 80 124 L 96 124 L 91 119 M 96 124 L 91 129" stroke="#10B981" stroke-width="2.8" fill="none" stroke-linecap="round" />' +
        '</g>';
    }
    if (waveData.outCount > 0) {
      const outIconsStr = waveData.outFaces.join('');
      waveOverlaySvg +=
        '<g>' +
        '<rect x="278" y="72" width="76" height="42" rx="9" fill="#9A3412" stroke="#FDBA74" stroke-width="2" />' +
        '<text x="316" y="88" text-anchor="middle" fill="#FFF7ED" font-size="10.5" font-weight="900">' +
        (zh ? '⬇️ 落車 -' + waveData.outCount : '⬇️ Exit -' + waveData.outCount) +
        '</text>' +
        '<text x="316" y="106" text-anchor="middle" font-size="14">' +
        outIconsStr +
        '</text>' +
        '<path d="M 264 124 L 282 124 L 277 119 M 282 124 L 277 129" stroke="#F97316" stroke-width="2.8" fill="none" stroke-linecap="round" />' +
        '</g>';
    }
  }

  const carPrimary = isYvr ? '#1D4ED8' : '#15803D';
  const carStripe = isYvr ? '#FACC15' : '#DC2626';
  const carRoof = isYvr ? '#E2E8F0' : '#BBF7D0';

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" style="width:100%;max-width:480px;height:auto;display:block;margin:0 auto;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.08);">' +
      '<defs>' +
        '<linearGradient id="' + skyGradId + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + (isYvr ? '#DBEAFE' : '#FEF3C7') + '" />' +
          '<stop offset="100%" stop-color="' + (isYvr ? '#EFF6FF' : '#FFFBEB') + '" />' +
        '</linearGradient>' +
        '<linearGradient id="' + bodyGradId + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + carPrimary + '" />' +
          '<stop offset="100%" stop-color="' + (isYvr ? '#1E3A8A' : '#166534') + '" />' +
        '</linearGradient>' +
      '</defs>' +
      // Sky & Station Canopy
      '<rect x="0" y="0" width="360" height="190" fill="url(#' + skyGradId + ')" />' +
      '<line x1="0" y1="36" x2="360" y2="36" stroke="#64748B" stroke-width="1.5" stroke-dasharray="8 4" />' +
      // Station Banner + Mochi Conductor Paw Sign
      '<rect x="12" y="8" width="206" height="22" rx="11" fill="#1E293B" />' +
      '<text x="115" y="23" text-anchor="middle" fill="#F8FAFC" font-size="10.5" font-weight="800">' +
        escHtml(stationName) +
      '</text>' +
      '<rect x="228" y="8" width="120" height="22" rx="11" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" />' +
      '<text x="288" y="23" text-anchor="middle" fill="#713F12" font-size="10.5" font-weight="900">' +
        escHtml(mochiSign) +
      '</text>' +
      // Pantograph / overhead connector
      '<path d="M 162 56 L 170 36 L 178 56" fill="none" stroke="#475569" stroke-width="2.2" />' +
      // Platform & Rails
      '<rect x="0" y="156" width="360" height="34" fill="#CBD5E1" />' +
      '<rect x="0" y="156" width="360" height="5" fill="#F59E0B" />' +
      '<line x1="0" y1="168" x2="360" y2="168" stroke="#475569" stroke-width="3" />' +
      // Wheels
      '<circle cx="92" cy="154" r="9" fill="#1E293B" stroke="#94A3B8" stroke-width="2.5" />' +
      '<circle cx="132" cy="154" r="9" fill="#1E293B" stroke="#94A3B8" stroke-width="2.5" />' +
      '<circle cx="208" cy="154" r="9" fill="#1E293B" stroke="#94A3B8" stroke-width="2.5" />' +
      '<circle cx="248" cy="154" r="9" fill="#1E293B" stroke="#94A3B8" stroke-width="2.5" />' +
      // Main Car Body
      '<rect x="44" y="56" width="252" height="94" rx="' + (isYvr ? '18' : '10') + '" fill="url(#' + bodyGradId + ')" stroke="#0F172A" stroke-width="2" />' +
      '<rect x="48" y="56" width="244" height="12" rx="6" fill="' + carRoof + '" />' +
      '<rect x="45" y="132" width="250" height="8" fill="' + carStripe + '" />' +
      // Left Boarding Door & Right Exit Door
      '<rect x="50" y="78" width="15" height="66" rx="3" fill="' + (curtainClosed ? '#E2E8F0' : '#DCFCE7') + '" stroke="#0F172A" stroke-width="1.2" />' +
      '<rect x="275" y="78" width="15" height="66" rx="3" fill="' + (curtainClosed ? '#E2E8F0' : '#FFEDD5') + '" stroke="#0F172A" stroke-width="1.2" />' +
      // Cabin Window Area (opacity 1 when open!)
      '<g style="opacity:1;">' +
        cabinContentSvg +
      '</g>' +
      // Wave Badges Overlay
      waveOverlaySvg +
    '</svg>'
  );
}

export function mountHeadCountGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getGameLevel(state, 'headcount');
  const gameMeta = findGameMeta(
    'headcount',
    '🚋',
    '叮叮天車數乘客',
    'Tram & SkyTrain Head Count'
  );

  const totalSteps = 2;
  const rounds = [
    generateHeadCountRound(state, level, 0),
    generateHeadCountRound(state, level, 1)
  ];

  let stepIdx = 0;
  let phase = 'study'; // 'study' | 'waves' | 'answer' | 'done'
  let activeWaveIdx = -1;
  let mistakes = 0;
  let hintsUsed = 0;
  let hintShownForRound = false;
  let eliminatedOption = null;
  let cleanedUp = false;
  const timers = [];

  function addTimer(fn, ms) {
    const id = setTimeout(function () {
      if (cleanedUp) return;
      fn();
    }, ms);
    timers.push(id);
    return id;
  }

  function clearAllTimers() {
    for (let i = 0; i < timers.length; i++) {
      clearTimeout(timers[i]);
    }
    timers.length = 0;
  }

  function safeBack() {
    cleanedUp = true;
    clearAllTimers();
    stopSpeaking();
    onBack();
  }

  function safeLevelChange(newLvl) {
    cleanedUp = true;
    clearAllTimers();
    stopSpeaking();
    onLevelChange(newLvl);
  }

  function getRoundTheme(rIdx) {
    if (state.region === 'yvr') return 'yvr';
    if (state.region === 'hk') return 'hk';
    return rIdx % 2 === 1 ? 'yvr' : 'hk';
  }

  function triggerHint() {
    const round = rounds[stepIdx];
    if (phase !== 'answer') {
      const tipWait = zh
        ? '🐾 阿喵站長提提你：而家先睇實上落車人數，去到答題時就可以撳「💡 貼士」翻查車務記錄喵！'
        : '🐾 Conductor Mochi: Watch the doors closely first — tap 💡 Hint during the question phase to review the boarding log!';
      notifyStageBaoBo('intro', lang, 0, tipWait);
      return;
    }

    if (!hintShownForRound) {
      hintsUsed += 1;
      hintShownForRound = true;
      for (let i = 0; i < round.options.length; i++) {
        if (round.options[i] !== round.finalCount) {
          eliminatedOption = round.options[i];
          break;
        }
      }
    }
    playSfx('switch', state.sound);
    const hintLine = zh
      ? '💡 阿喵站長翻開行車簿幫你記低咗每波上落，仲幫你剔除咗一個唔啱嘅選項喵！'
      : '💡 Conductor Mochi opened the station log to show every wave and crossed out one wrong count!';
    notifyStageBaoBo('intro', lang, 0, hintLine);
    render();
  }

  function startWavesSequence() {
    const round = rounds[stepIdx];
    phase = 'waves';
    activeWaveIdx = -1;
    playSfx('switch', state.sound);
    render();

    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '🔔 呠呠～拉上車簾開車喇！望實左門上車（＋）同右門落車（−）喵！'
        : '🔔 Doors closing & curtain down! Track who boards (+) on the left and exits (−) on the right!'
    );

    const waveDuration = 1350;
    for (let w = 0; w < round.waves.length; w++) {
      (function (wIndex) {
        addTimer(function () {
          activeWaveIdx = wIndex;
          playSfx('tap', state.sound);
          const wv = round.waves[wIndex];
          const msg = zh
            ? '🐾 第 ' +
              (wIndex + 1) +
              '/' +
              round.waves.length +
              ' 站：上車 +' +
              wv.inCount +
              ' 位，落車 -' +
              wv.outCount +
              ' 位！'
            : '🐾 Stop ' +
              (wIndex + 1) +
              '/' +
              round.waves.length +
              ': Board +' +
              wv.inCount +
              ', Exit -' +
              wv.outCount +
              '!';
          notifyStageBaoBo('intro', lang, 0, msg);
          render();
        }, 420 + wIndex * waveDuration);
      })(w);
    }

    addTimer(function () {
      phase = 'answer';
      activeWaveIdx = -1;
      playSfx('switch', state.sound);
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '🚋 到總站啦喵！你計到而家車廂入面仲有幾多位乘客嗎？'
          : '🚋 Arrived at the terminal, meow! How many passengers are inside the car now?'
      );
      render();
    }, 480 + round.waves.length * waveDuration);
  }

  function render() {
    if (cleanedUp) return;
    container.innerHTML = '';

    const round = rounds[stepIdx];
    const theme = getRoundTheme(stepIdx);

    const headerHintHtml =
      '<button type="button" class="chip-btn" id="hcHeaderHintBtn">' +
      t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: safeLevelChange,
      onBack: safeBack,
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml: headerHintHtml
    });

    const topHintBtn = container.querySelector('#hcHeaderHintBtn');
    if (topHintBtn) {
      topHintBtn.addEventListener('click', triggerHint);
    }

    if (phase === 'study') {
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '哔哔～🐾 阿喵站長吹哨子準備開車！先數清楚打開門嘅車廂入面有幾多位乘客，唔趕時間㗎！'
          : 'Tweet-tweet~ 🐾 Conductor Mochi blowing her whistle! Count the passengers in the open car at your own pace!'
      );
    }

    let shownPassengers = round.initialIcons;
    if (phase === 'done') {
      shownPassengers = [];
      for (let p = 0; p < round.finalCount; p++) {
        shownPassengers.push(PASSENGER_ICONS[(p + stepIdx) % PASSENGER_ICONS.length]);
      }
    }

    const activeWave =
      phase === 'waves' && activeWaveIdx >= 0 && activeWaveIdx < round.waves.length
        ? round.waves[activeWaveIdx]
        : null;

    const dioramaSvg = renderTransitDioramaSvg({
      theme: theme,
      zh: zh,
      uid: 'r' + stepIdx + '_' + phase + '_' + activeWaveIdx,
      curtainClosed: phase === 'waves' || phase === 'answer',
      passengers: shownPassengers,
      activeWave: activeWave
    });

    const card = document.createElement('div');
    card.className = 'card';

    let bodyHtml =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">' +
        '<span class="news-tag">' +
          (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 班車' : 'Train ' + (stepIdx + 1) + ' of ' + totalSteps) +
          ' · ' +
          (theme === 'yvr' ? (zh ? '溫哥華天車' : 'YVR SkyTrain') : zh ? '香港叮叮電車' : 'HK Ding-Ding Tram') +
        '</span>' +
        (phase === 'answer'
          ? '<button type="button" class="chip-btn" id="hcCardHintBtn">' + t(lang, 'hintBtn') + '</button>'
          : '') +
      '</div>' +
      '<div style="margin-bottom:0.85rem;">' +
        dioramaSvg +
      '</div>';

    if (phase === 'study') {
      bodyHtml +=
        '<div class="prompt-box" style="text-align:center;">' +
          '<p class="prompt-title" style="margin:0 0 0.35rem;">' +
            (zh
              ? '👀 請先數實車廂入面有幾多位乘客（唔限時間）'
              : '👀 Count the passengers seated inside the open cabin (untimed)') +
          '</p>' +
          '<p style="margin:0;font-size:0.92rem;color:var(--ink-muted);">' +
            (zh
              ? '撳下面掣之後，車簾會拉上，乘客會分 ' + round.waves.length + ' 波上落車！'
              : 'Once ready, the curtain closes and ' + round.waves.length + ' boarding/exiting waves will play!') +
          '</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-full" id="hcStartWavesBtn" style="margin-top:0.75rem;">' +
          (zh ? '記實人數！關門開車 →' : 'Got It! Start Boarding →') +
        '</button>';
    } else if (phase === 'waves') {
      let waveBadgesHtml = '';
      for (let w = 0; w < round.waves.length; w++) {
        const isCurrent = w === activeWaveIdx;
        const isDone = w < activeWaveIdx;
        waveBadgesHtml +=
          '<span style="display:inline-block;padding:0.28rem 0.65rem;border-radius:999px;font-weight:800;font-size:0.85rem;' +
            (isCurrent
              ? 'background:#F59E0B;color:#fff;transform:scale(1.06);transition:transform 0.2s ease;'
              : isDone
              ? 'background:#D1FAE5;color:#065F46;'
              : 'background:#F1F5F9;color:#64748B;') +
          '">' +
            (zh ? '第 ' + (w + 1) + ' 站' : 'Stop ' + (w + 1)) +
          '</span>';
      }

      let liveDeltaHtml = '';
      if (activeWave) {
        const parts = [];
        if (activeWave.inCount > 0) {
          parts.push(
            '<span style="display:inline-block;padding:0.4rem 0.85rem;border-radius:10px;background:#ECFDF5;border:2px solid #10B981;color:#065F46;font-weight:900;font-size:1.08rem;">' +
              '⬆️ ' + (zh ? '上車' : 'Board') + ': +' + activeWave.inCount + ' ' + activeWave.inFaces.join('') +
            '</span>'
          );
        }
        if (activeWave.outCount > 0) {
          parts.push(
            '<span style="display:inline-block;padding:0.4rem 0.85rem;border-radius:10px;background:#FFF7ED;border:2px solid #F97316;color:#9A3412;font-weight:900;font-size:1.08rem;">' +
              '⬇️ ' + (zh ? '落車' : 'Exit') + ': -' + activeWave.outCount + ' ' + activeWave.outFaces.join('') +
            '</span>'
          );
        }
        liveDeltaHtml =
          '<div style="display:flex;justify-content:center;gap:0.65rem;flex-wrap:wrap;margin-top:0.65rem;">' +
          parts.join('') +
          '</div>';
      } else {
        liveDeltaHtml =
          '<div style="margin-top:0.55rem;font-weight:800;color:#92400E;">' +
            (zh ? '🚪 正在拉上車簾準備埋站…' : '🚪 Closing cabin curtain...') +
          '</div>';
      }

      bodyHtml +=
        '<div class="prompt-box" style="text-align:center;">' +
          '<div style="display:flex;justify-content:center;gap:0.45rem;flex-wrap:wrap;">' +
            waveBadgesHtml +
          '</div>' +
          liveDeltaHtml +
        '</div>';
    } else {
      const qPrompt = zh ? '而家車廂入面仲有幾多位乘客？' : 'How many passengers are inside now?';
      let hintBannerHtml = '';
      if (hintShownForRound) {
        const waveStepsText = round.waves
          .map(function (wv, idx) {
            const segs = [];
            if (wv.inCount > 0) segs.push('+' + wv.inCount);
            if (wv.outCount > 0) segs.push('-' + wv.outCount);
            return (zh ? '第' + (idx + 1) + '站(' : 'S' + (idx + 1) + '(') + segs.join(', ') + ')';
          })
          .join(' → ');
        hintBannerHtml =
          '<div style="margin-top:0.65rem;padding:0.65rem 0.8rem;background:#FFFDF6;border-radius:10px;border:1.5px dashed #D97706;font-size:0.92rem;font-weight:700;color:#78350F;">' +
            '📋 ' +
            (zh
              ? '站長記錄：開車時 ' + round.initialCount + ' 位 → ' + waveStepsText
              : 'Conductor Log: Started with ' + round.initialCount + ' → ' + waveStepsText) +
          '</div>';
      }

      bodyHtml +=
        '<div class="prompt-box">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">' +
            '<p class="prompt-title" style="margin:0;">' + escHtml(qPrompt) + '</p>' +
            '<button type="button" class="chip-btn" id="hcSpeakPromptBtn">🔊 ' + (zh ? '朗讀' : 'Listen') + '</button>' +
          '</div>' +
          hintBannerHtml +
        '</div>' +
        '<div class="choices-list" id="hcChoicesWrap"></div>' +
        '<div id="hcFeedbackArea"></div>';
    }

    card.innerHTML = bodyHtml;
    container.appendChild(card);

    const startBtn = card.querySelector('#hcStartWavesBtn');
    if (startBtn) {
      startBtn.addEventListener('click', startWavesSequence);
    }

    const cardHintBtn = card.querySelector('#hcCardHintBtn');
    if (cardHintBtn) {
      cardHintBtn.addEventListener('click', triggerHint);
    }

    const spkBtn = card.querySelector('#hcSpeakPromptBtn');
    if (spkBtn) {
      spkBtn.addEventListener('click', function () {
        speakText(zh ? '而家車廂入面仲有幾多位乘客？' : 'How many passengers are inside now?', lang);
      });
    }

    const choicesWrap = card.querySelector('#hcChoicesWrap');
    const feedbackArea = card.querySelector('#hcFeedbackArea');

    if (choicesWrap) {
      for (let i = 0; i < round.options.length; i++) {
        (function (optVal) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-btn';
          const isEliminated = eliminatedOption === optVal;
          const labelTxt = zh ? optVal + ' 位乘客' : optVal + (optVal === 1 ? ' passenger' : ' passengers');

          if (phase === 'done') {
            btn.disabled = true;
            if (optVal === round.finalCount) {
              btn.classList.add('correct');
              btn.innerHTML = '<span>' + escHtml(labelTxt) + '</span><span>✅</span>';
            } else {
              btn.innerHTML = '<span>' + escHtml(labelTxt) + '</span><span>○</span>';
            }
          } else if (isEliminated) {
            btn.disabled = true;
            btn.style.opacity = '0.45';
            btn.innerHTML =
              '<span>' + escHtml(labelTxt) + '</span><span>' + (zh ? '已剔除' : 'Ruled out') + '</span>';
          } else {
            btn.innerHTML = '<span>' + escHtml(labelTxt) + '</span><span>○</span>';
            btn.addEventListener('click', function () {
              if (phase !== 'answer') return;
              if (optVal === round.finalCount) {
                phase = 'done';
                playSfx('correct', state.sound);
                notifyStageBaoBo(
                  'correct',
                  lang,
                  0,
                  zh
                    ? '🎉 哔哔～完全正確！拉開車簾一數，真係啱啱好 ' + round.finalCount + ' 位乘客喵！'
                    : '🎉 Tweet-tweet! Spot on! Opening the curtain reveals all ' + round.finalCount + ' passengers!'
                );
                render();
              } else {
                mistakes += 1;
                playSfx('gentle', state.sound);
                btn.classList.add('wrong');
                btn.disabled = true;
                const badgeSpan = btn.querySelector('span:last-child');
                if (badgeSpan) badgeSpan.textContent = '↻';
                notifyStageBaoBo(
                  'gentle',
                  lang,
                  0,
                  zh
                    ? '🐾 差少少咋！回想下開車時人數再加減每波上落，或者撳「💡 貼士」睇行車簿喵～'
                    : '🐾 Very close! Recount from the starting passengers, or tap 💡 Hint to see the conductor log!'
                );
                if (feedbackArea) {
                  feedbackArea.innerHTML =
                    '<div class="feedback-banner gentle-retry">' + t(lang, 'gentleRetry') + '</div>';
                }
              }
            });
          }

          choicesWrap.appendChild(btn);
        })(round.options[i]);
      }
    }

    if (phase === 'done' && feedbackArea) {
      const isLast = stepIdx >= totalSteps - 1;
      feedbackArea.innerHTML =
        '<div class="feedback-banner">' +
          '<strong>🎉 ' + escHtml(randomPraise(lang)) + '</strong>' +
          '<div style="margin-top:0.35rem;font-size:0.93rem;">' +
            (zh
              ? '車簾已打開：車廂入面確實坐緊 ' + round.finalCount + ' 位乘客！'
              : 'Curtain opened: Exactly ' + round.finalCount + ' passengers aboard!') +
          '</div>' +
          '<div style="margin-top:0.75rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="hcNextRoundBtn">' +
              (isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')) +
            '</button>' +
          '</div>' +
        '</div>';

      const nextBtn = feedbackArea.querySelector('#hcNextRoundBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stopSpeaking();
          if (isLast) {
            cleanedUp = true;
            clearAllTimers();
            const stars = mistakes === 0 && hintsUsed <= 1 ? 3 : mistakes <= 2 ? 2 : 1;
            const pts = 95 + level * 15 + stars * 10;
            onComplete({ score: pts, stars: stars });
          } else {
            playSfx('switch', state.sound);
            stepIdx += 1;
            phase = 'study';
            activeWaveIdx = -1;
            hintShownForRound = false;
            eliminatedOption = null;
            render();
          }
        });
      }
    }
  }

  render();
}

/* =========================================================================
   2. TEA-SCALE HEAVYWEIGHT (⚖️ 茶莊天秤邊個重 · gameId = 'balance')
   Inspired by Big Brain Academy's "Heavyweight" (300+ unique puzzles)
   ========================================================================= */

const TEA_SCALE_ITEMS = [
  { id: 'cat', icon: '🐱', zh: '招財金貓', en: 'Lucky Cat' },
  { id: 'pot', icon: '🫖', zh: '紫砂茶壺', en: 'Yixing Teapot' },
  { id: 'pine', icon: '🍍', zh: '金菠蘿', en: 'Pineapple' },
  { id: 'dim', icon: '🥟', zh: '蝦餃竹籠', en: 'Steamer' },
  { id: 'mango', icon: '🥭', zh: '香芒', en: 'Mango' },
  { id: 'cup', icon: '🍵', zh: '青瓷茶杯', en: 'Teacup' },
  { id: 'mand', icon: '🍊', zh: '大吉柑', en: 'Mandarin' },
  { id: 'moon', icon: '🥮', zh: '蓮蓉月餅', en: 'Mooncake' }
];

// Each template guarantees weights[0] > weights[1] > weights[2] (> weights[3]) AND is 100% logically deducible!
const BALANCE_TEMPLATES = {
  0: [
    {
      weights: [6, 4, 2],
      scales: [
        { a: [0], b: [1] },
        { a: [1], b: [2] }
      ]
    },
    {
      weights: [8, 4, 2],
      scales: [
        { a: [0], b: [1, 1] },
        { a: [1], b: [2] }
      ]
    },
    {
      weights: [7, 4, 2],
      scales: [
        { a: [0], b: [1] },
        { a: [1], b: [2, 2] }
      ]
    },
    {
      weights: [8, 4, 2],
      scales: [
        { a: [0], b: [1, 1] },
        { a: [1], b: [2, 2] }
      ]
    }
  ],
  1: [
    {
      weights: [9, 6, 3, 2],
      scales: [
        { a: [0], b: [1] },
        { a: [1], b: [2, 2] },
        { a: [2], b: [3] }
      ]
    },
    {
      weights: [12, 6, 4, 2],
      scales: [
        { a: [0], b: [1, 1] },
        { a: [1], b: [2] },
        { a: [2], b: [3, 3] }
      ]
    },
    {
      weights: [9, 6, 4, 2],
      scales: [
        { a: [0], b: [1] },
        { a: [1], b: [2] },
        { a: [2], b: [3, 3] }
      ]
    },
    {
      weights: [12, 4, 3, 2],
      scales: [
        { a: [0], b: [1, 1, 1] },
        { a: [1], b: [2] },
        { a: [2], b: [3] }
      ]
    }
  ],
  2: [
    {
      weights: [9, 6, 3, 2],
      scales: [
        { a: [0], b: [1, 2] },
        { a: [1], b: [2, 2] },
        { a: [2], b: [3] }
      ]
    },
    {
      weights: [12, 6, 4, 2],
      scales: [
        { a: [0], b: [1, 2] },
        { a: [1], b: [2] },
        { a: [2], b: [3, 3] }
      ]
    },
    {
      weights: [8, 6, 4, 2],
      scales: [
        { a: [0], b: [1, 3] },
        { a: [1], b: [2, 3] },
        { a: [2], b: [3] }
      ]
    },
    {
      weights: [12, 6, 4, 2],
      scales: [
        { a: [0], b: [1, 1] },
        { a: [1], b: [2, 3] },
        { a: [2], b: [3] }
      ]
    },
    {
      weights: [13, 5, 3, 2],
      scales: [
        { a: [0], b: [1, 1] },
        { a: [1], b: [2, 3] },
        { a: [2], b: [3] }
      ]
    }
  ]
};

function sumPanWeights(indices, weights) {
  let total = 0;
  for (let i = 0; i < indices.length; i++) {
    total += weights[indices[i]];
  }
  return total;
}

function generateBalancePuzzle(state, level) {
  const templates = BALANCE_TEMPLATES[level] || BALANCE_TEMPLATES[1];
  const itemCount = level === 0 ? 3 : 4;
  let chosen = null;

  for (let attempt = 0; attempt < 100; attempt++) {
    const tplIdx = randInt(0, templates.length - 1);
    const tpl = templates[tplIdx];
    const pickedItems = shuffleList(TEA_SCALE_ITEMS).slice(0, itemCount);

    const builtScales = [];
    const sideBits = [];
    for (let s = 0; s < tpl.scales.length; s++) {
      const raw = tpl.scales[s];
      const flip = Math.random() < 0.5;
      sideBits.push(flip ? 'R' : 'L');
      const leftIdxList = flip ? raw.b : raw.a;
      const rightIdxList = flip ? raw.a : raw.b;
      const leftW = sumPanWeights(leftIdxList, tpl.weights);
      const rightW = sumPanWeights(rightIdxList, tpl.weights);

      builtScales.push({
        leftItems: leftIdxList.map(function (idx) {
          return pickedItems[idx];
        }),
        rightItems: rightIdxList.map(function (idx) {
          return pickedItems[idx];
        }),
        tilt: leftW > rightW ? 'left' : rightW > leftW ? 'right' : 'equal'
      });
    }

    const shuffledScales = shuffleList(builtScales);
    const sig =
      'bal_L' +
      level +
      '_T' +
      tplIdx +
      '_' +
      pickedItems
        .map(function (it) {
          return it.id;
        })
        .join('-') +
      '_' +
      sideBits.join('');

    chosen = {
      sig: sig,
      heaviestItem: pickedItems[0],
      secondItem: pickedItems[1],
      lightestItem: pickedItems[pickedItems.length - 1],
      orderedItems: pickedItems,
      choiceItems: shuffleList(pickedItems),
      scales: shuffledScales
    };

    if (!hasSeenSignature(state, 'balance_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'balance_sigs', chosen.sig, 400);
  return chosen;
}

function renderBrassScaleSvg(scale, scaleNum, zh) {
  // Tilt degrees: -11 means left end moves DOWN (left heavier), +11 means right end moves DOWN (right heavier), 0 means balanced
  const deg = scale.tilt === 'left' ? -11 : scale.tilt === 'right' ? 11 : 0;
  const rad = (deg * Math.PI) / 180;
  const pivotX = 140;
  const pivotY = 44;
  const armR = 82;

  const leftTipX = (pivotX - armR * Math.cos(rad)).toFixed(1);
  const leftTipY = (pivotY - armR * Math.sin(rad)).toFixed(1);
  const rightTipX = (pivotX + armR * Math.cos(rad)).toFixed(1);
  const rightTipY = (pivotY + armR * Math.sin(rad)).toFixed(1);

  const leftPanY = (Number(leftTipY) + 46).toFixed(1);
  const rightPanY = (Number(rightTipY) + 46).toFixed(1);

  function renderPanIcons(items, cx, panY) {
    const n = items.length;
    const spacing = n === 1 ? 0 : n === 2 ? 24 : 20;
    const startX = cx - ((n - 1) * spacing) / 2;
    let out = '';
    for (let i = 0; i < n; i++) {
      const ix = (startX + i * spacing).toFixed(1);
      out +=
        '<text x="' +
        ix +
        '" y="' +
        (Number(panY) - 6).toFixed(1) +
        '" text-anchor="middle" font-size="' +
        (n >= 3 ? '20' : '24') +
        '">' +
        items[i].icon +
        '</text>';
    }
    return out;
  }

  const statusText =
    scale.tilt === 'left'
      ? zh
        ? '⬇ 左邊較重'
        : '⬇ Left Heavier'
      : scale.tilt === 'right'
      ? zh
        ? '右邊較重 ⬇'
        : 'Right Heavier ⬇'
      : zh
      ? '＝ 兩邊一樣重'
      : '＝ Balanced';

  const statusBg =
    scale.tilt === 'equal' ? '#FEF3C7' : '#ECFDF5';
  const statusStroke =
    scale.tilt === 'equal' ? '#D97706' : '#059669';
  const statusInk =
    scale.tilt === 'equal' ? '#92400E' : '#065F46';

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 156" style="width:100%;height:auto;display:block;background:linear-gradient(180deg,#FFFDF7 0%,#FEF7E6 100%);border:1.5px solid #E5D3B3;border-radius:12px;">' +
      // Scale Label
      '<rect x="8" y="7" width="58" height="19" rx="9" fill="#78350F" />' +
      '<text x="37" y="20" text-anchor="middle" fill="#FEF3C7" font-size="10" font-weight="800">' +
        (zh ? '天秤 #' + scaleNum : 'Scale #' + scaleNum) +
      '</text>' +
      // Status Pill
      '<rect x="166" y="7" width="106" height="19" rx="9" fill="' + statusBg + '" stroke="' + statusStroke + '" stroke-width="1.2" />' +
      '<text x="219" y="20" text-anchor="middle" fill="' + statusInk + '" font-size="9.5" font-weight="800">' +
        escHtml(statusText) +
      '</text>' +
      // Brass Pedestal & Pillar
      '<rect x="104" y="138" width="72" height="10" rx="5" fill="#92400E" />' +
      '<rect x="116" y="132" width="48" height="8" rx="4" fill="#B45309" />' +
      '<rect x="136" y="42" width="8" height="92" rx="3" fill="#D97706" stroke="#78350F" stroke-width="1" />' +
      // Tilted Brass Beam (explicit rotate(-11 ...), rotate(0 ...), or rotate(11 ...))
      '<g transform="rotate(' + deg + ' 140 44)">' +
        '<rect x="54" y="40.5" width="172" height="7" rx="3.5" fill="#F59E0B" stroke="#78350F" stroke-width="1.4" />' +
        '<circle cx="58" cy="44" r="4" fill="#B45309" />' +
        '<circle cx="222" cy="44" r="4" fill="#B45309" />' +
        '<polygon points="140,28 135,41 145,41" fill="#B45309" />' +
      '</g>' +
      '<circle cx="140" cy="44" r="6.5" fill="#FEF08A" stroke="#78350F" stroke-width="2" />' +
      // Left Hanging Chains & Brass Pan
      '<line x1="' + leftTipX + '" y1="' + leftTipY + '" x2="' + (Number(leftTipX) - 30).toFixed(1) + '" y2="' + leftPanY + '" stroke="#92400E" stroke-width="1.5" />' +
      '<line x1="' + leftTipX + '" y1="' + leftTipY + '" x2="' + (Number(leftTipX) + 30).toFixed(1) + '" y2="' + leftPanY + '" stroke="#92400E" stroke-width="1.5" />' +
      renderPanIcons(scale.leftItems, Number(leftTipX), leftPanY) +
      '<path d="M ' +
        (Number(leftTipX) - 36).toFixed(1) +
        ' ' +
        leftPanY +
        ' Q ' +
        leftTipX +
        ' ' +
        (Number(leftPanY) + 12).toFixed(1) +
        ' ' +
        (Number(leftTipX) + 36).toFixed(1) +
        ' ' +
        leftPanY +
        ' Z" fill="#F59E0B" stroke="#78350F" stroke-width="1.5" />' +
      // Right Hanging Chains & Brass Pan
      '<line x1="' + rightTipX + '" y1="' + rightTipY + '" x2="' + (Number(rightTipX) - 30).toFixed(1) + '" y2="' + rightPanY + '" stroke="#92400E" stroke-width="1.5" />' +
      '<line x1="' + rightTipX + '" y1="' + rightTipY + '" x2="' + (Number(rightTipX) + 30).toFixed(1) + '" y2="' + rightPanY + '" stroke="#92400E" stroke-width="1.5" />' +
      renderPanIcons(scale.rightItems, Number(rightTipX), rightPanY) +
      '<path d="M ' +
        (Number(rightTipX) - 36).toFixed(1) +
        ' ' +
        rightPanY +
        ' Q ' +
        rightTipX +
        ' ' +
        (Number(rightPanY) + 12).toFixed(1) +
        ' ' +
        (Number(rightTipX) + 36).toFixed(1) +
        ' ' +
        rightPanY +
        ' Z" fill="#F59E0B" stroke="#78350F" stroke-width="1.5" />' +
    '</svg>'
  );
}

export function mountBalanceGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getGameLevel(state, 'balance');
  const gameMeta = findGameMeta(
    'balance',
    '⚖️',
    '茶莊天秤邊個重',
    'Tea-Scale Heavyweight'
  );

  const totalSteps = 3;
  const puzzles = [];
  for (let i = 0; i < totalSteps; i++) {
    puzzles.push(generateBalancePuzzle(state, level));
  }

  let stepIdx = 0;
  let answered = false;
  let mistakes = 0;
  let hintsUsed = 0;
  let eliminatedIds = [];

  function triggerHint() {
    if (answered) return;
    const puz = puzzles[stepIdx];
    let targetElim = null;
    for (let i = puz.orderedItems.length - 1; i >= 1; i--) {
      const candidate = puz.orderedItems[i];
      if (eliminatedIds.indexOf(candidate.id) === -1) {
        targetElim = candidate;
        break;
      }
    }
    if (!targetElim) return;

    hintsUsed += 1;
    eliminatedIds.push(targetElim.id);
    playSfx('switch', state.sound);

    const elimName = zh ? targetElim.zh : targetElim.en;
    const heavierItem = puz.orderedItems[0];
    const heavierName = zh ? heavierItem.zh : heavierItem.en;

    const hintMsg = zh
      ? '💡 阿喵晃動招財金鈴幫你推理：從天秤比較可見「' +
        elimName +
        '」比其他茶物輕（例如輕過更重嘅茶寶），一定唔係最重，已幫你剔除喵！'
      : '💡 Mochi weighed her lucky golden bell against the scales: "' +
        elimName +
        '" is outweighed on the scales, so it cannot be heaviest — ruled out!';

    // Keep heavierName unspoiled in text; only explain why targetElim is lighter!
    void heavierName;
    notifyStageBaoBo('intro', lang, 0, hintMsg);
    render();
  }

  function render() {
    container.innerHTML = '';
    const puz = puzzles[stepIdx];

    const headerHintHtml =
      '<button type="button" class="chip-btn" id="balHeaderHintBtn">' +
      t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (nl) {
        stopSpeaking();
        onLevelChange(nl);
      },
      onBack: function () {
        stopSpeaking();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml: headerHintHtml
    });

    const topHint = container.querySelector('#balHeaderHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    if (!answered && eliminatedIds.length === 0) {
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '⚖️ 叮噹～阿喵除低頸上金鈴放埋上茶莊天秤！望清楚邊邊沉低（較重）、邊邊平手，搵出最重嗰一樣喵！'
          : '⚖️ Jingle~ Mochi polished the brass tea scales! Lower pan = heavier, level = equal weight. Which item is HEAVIEST?'
      );
    }

    let scalesGridHtml =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.75rem;margin-bottom:0.9rem;">';
    for (let s = 0; s < puz.scales.length; s++) {
      scalesGridHtml += '<div>' + renderBrassScaleSvg(puz.scales[s], s + 1, zh) + '</div>';
    }
    scalesGridHtml += '</div>';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">' +
        '<span class="news-tag">' +
          (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 題 · 茶莊天秤' : 'Scale Puzzle ' + (stepIdx + 1) + ' / ' + totalSteps) +
        '</span>' +
        '<button type="button" class="chip-btn" id="balCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
      '</div>' +
      scalesGridHtml +
      '<div class="prompt-box" style="margin-bottom:0.75rem;">' +
        '<p class="prompt-title" style="margin:0;">' +
          (zh ? '🧐 綜合以上天秤，邊一樣最重？' : '🧐 Based on the brass scales above, which item is the HEAVIEST?') +
        '</p>' +
      '</div>' +
      '<div id="balChoicesGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.65rem;"></div>' +
      '<div id="balFeedbackArea"></div>';

    container.appendChild(card);

    const cardHint = card.querySelector('#balCardHintBtn');
    if (cardHint) cardHint.addEventListener('click', triggerHint);

    const choicesGrid = card.querySelector('#balChoicesGrid');
    const feedbackArea = card.querySelector('#balFeedbackArea');

    for (let i = 0; i < puz.choiceItems.length; i++) {
      (function (item) {
        const isElim = eliminatedIds.indexOf(item.id) !== -1;
        const isCorrect = item.id === puz.heaviestItem.id;
        const itemLabel = zh ? item.zh : item.en;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.padding = '0.85rem 0.5rem';
        btn.style.textAlign = 'center';
        btn.style.gap = '0.3rem';

        if (answered) {
          btn.disabled = true;
          if (isCorrect) {
            btn.classList.add('correct');
          }
          btn.innerHTML =
            '<span style="font-size:2rem;line-height:1.1;">' + item.icon + '</span>' +
            '<span style="font-weight:800;">' + escHtml(itemLabel) + (isCorrect ? ' ✅' : '') + '</span>';
        } else if (isElim) {
          btn.disabled = true;
          btn.style.opacity = '0.42';
          btn.innerHTML =
            '<span style="font-size:1.85rem;line-height:1.1;">' + item.icon + '</span>' +
            '<span style="font-weight:700;text-decoration:line-through;">' + escHtml(itemLabel) + '</span>' +
            '<span style="font-size:0.76rem;color:#92400E;">' + (zh ? '較輕（已剔除）' : 'Lighter') + '</span>';
        } else {
          btn.innerHTML =
            '<span style="font-size:2rem;line-height:1.1;">' + item.icon + '</span>' +
            '<span style="font-weight:800;">' + escHtml(itemLabel) + '</span>';

          btn.addEventListener('click', function () {
            if (answered) return;
            if (isCorrect) {
              answered = true;
              playSfx('correct', state.sound);
              notifyStageBaoBo(
                'correct',
                lang,
                0,
                zh
                  ? '🎉 叮噹～好眼力！「' + item.zh + '」真係全場最重嘅重量級茶寶喵！'
                  : '🎉 Jingle-meow! Spot on! "' + item.en + '" is indeed the heaviest item!'
              );
              render();
            } else {
              mistakes += 1;
              eliminatedIds.push(item.id);
              playSfx('gentle', state.sound);
              notifyStageBaoBo(
                'gentle',
                lang,
                0,
                zh
                  ? '⚖️ 「' + item.zh + '」仲未係最重嗰件喎～再順住沉低嗰邊天秤推上去睇下喵！'
                  : '⚖️ "' + item.en + '" is outweighed by something heavier! Follow the lower pans!'
              );
              render();
              const fb = container.querySelector('#balFeedbackArea');
              if (fb) {
                fb.innerHTML =
                  '<div class="feedback-banner gentle-retry" style="margin-top:0.75rem;">' +
                  t(lang, 'gentleRetry') +
                  '</div>';
              }
            }
          });
        }

        choicesGrid.appendChild(btn);
      })(puz.choiceItems[i]);
    }

    if (answered && feedbackArea) {
      const isLast = stepIdx >= totalSteps - 1;
      const orderChain = puz.orderedItems
        .map(function (it) {
          return it.icon + (zh ? it.zh : it.en);
        })
        .join(' ＞ ');

      feedbackArea.innerHTML =
        '<div class="feedback-banner" style="margin-top:0.85rem;">' +
          '<strong>🎉 ' + escHtml(randomPraise(lang)) + '</strong>' +
          '<div style="margin-top:0.35rem;font-size:0.9rem;">' +
            (zh ? '重量排序：' : 'Weight order: ') + escHtml(orderChain) +
          '</div>' +
          '<div style="margin-top:0.75rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="balNextBtn">' +
              (isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')) +
            '</button>' +
          '</div>' +
        '</div>';

      const nextBtn = feedbackArea.querySelector('#balNextBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stopSpeaking();
          if (isLast) {
            const stars = mistakes === 0 && hintsUsed <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
            const pts = 95 + level * 15 + stars * 10;
            onComplete({ score: pts, stars: stars });
          } else {
            playSfx('switch', state.sound);
            stepIdx += 1;
            answered = false;
            eliminatedIds = [];
            render();
          }
        });
      }
    }
  }

  render();
}

/* =========================================================================
   3. NUMBERED STEAMER RECALL (🥟 蒸籠蓋印記位 · gameId = 'steamer')
   Inspired by Brain Age's "Low to High"
   ========================================================================= */

const DIMSUM_ICONS = ['🥟', '🍤', '🥮', '🍡', '🥠', '🍵', '🍊', '🍍'];

function generateSteamerRound(state, level) {
  const cellCount = level === 2 ? 12 : 9;
  const targetCount = level === 0 ? 4 : level === 1 ? 5 : 6;
  let chosen = null;

  for (let attempt = 0; attempt < 90; attempt++) {
    const allCells = [];
    for (let c = 0; c < cellCount; c++) allCells.push(c);
    const pickedCells = shuffleList(allCells).slice(0, targetCount);

    let numbers = [];
    if (level < 2) {
      for (let k = 1; k <= targetCount; k++) numbers.push(k);
    } else {
      // Ascending tea-table numbers (e.g. 2, 5, 8, 11, 15, 19)
      const pool = [];
      for (let n = 1; n <= 20; n++) pool.push(n);
      numbers = shuffleList(pool)
        .slice(0, targetCount)
        .sort(function (a, b) {
          return a - b;
        });
    }

    const sig =
      'stm_L' +
      level +
      '_' +
      pickedCells
        .map(function (cellIdx, idx) {
          return cellIdx + ':' + numbers[idx];
        })
        .join(',');

    const cellMap = {};
    const orderedTargets = [];
    for (let i = 0; i < targetCount; i++) {
      const entry = {
        cellIndex: pickedCells[i],
        num: numbers[i],
        orderIndex: i,
        icon: DIMSUM_ICONS[i % DIMSUM_ICONS.length]
      };
      cellMap[pickedCells[i]] = entry;
      orderedTargets.push(entry);
    }

    chosen = {
      sig: sig,
      cellCount: cellCount,
      cols: level === 2 ? 4 : 3,
      targetCount: targetCount,
      orderedTargets: orderedTargets,
      cellMap: cellMap
    };

    if (!hasSeenSignature(state, 'steamer_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'steamer_sigs', chosen.sig, 400);
  return chosen;
}

export function mountSteamerGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getGameLevel(state, 'steamer');
  const gameMeta = findGameMeta(
    'steamer',
    '🥟',
    '蒸籠蓋印記位',
    'Numbered Steamer Recall'
  );

  const totalSteps = 3;
  const rounds = [];
  for (let r = 0; r < totalSteps; r++) {
    rounds.push(generateSteamerRound(state, level));
  }

  let stepIdx = 0;
  let lidsClosed = false; // false during untimed Study phase; true once lowest number (#1) is tapped!
  let nextOrderIdx = 0;
  let wrongFlashCell = null;
  let peekCell = null;
  let mistakes = 0;
  let hintsUsed = 0;
  let cleanedUp = false;
  const timers = [];

  function addTimer(fn, ms) {
    const id = setTimeout(function () {
      if (cleanedUp) return;
      fn();
    }, ms);
    timers.push(id);
    return id;
  }

  function clearAllTimers() {
    for (let i = 0; i < timers.length; i++) {
      clearTimeout(timers[i]);
    }
    timers.length = 0;
  }

  function triggerHint() {
    const round = rounds[stepIdx];
    if (nextOrderIdx >= round.targetCount) return;

    const needed = round.orderedTargets[nextOrderIdx];
    if (!lidsClosed) {
      playSfx('switch', state.sound);
      peekCell = needed.cellIndex;
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '💡 阿喵揭開蒸籠提提你：先記住全部號碼位置，再撳最細嗰個「' + needed.num + '」號開始蓋籠喵！'
          : '💡 Mochi tip: Study all open steamers first, then tap the lowest number (' + needed.num + ') to close the lids!'
      );
      render();
      addTimer(function () {
        peekCell = null;
        render();
      }, 1200);
      return;
    }

    hintsUsed += 1;
    peekCell = needed.cellIndex;
    playSfx('switch', state.sound);
    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '💡 阿喵悄悄幫你揭開竹蓋偷睇 1.2 秒！下一個要搵「' + needed.num + '」號蒸籠喵～'
        : '💡 Mochi lifted the bamboo lid for 1.2s! Spot steamer #' + needed.num + '!'
    );
    render();
    addTimer(function () {
      peekCell = null;
      render();
    }, 1200);
  }

  function handleSteamerTap(entry) {
    const round = rounds[stepIdx];
    if (nextOrderIdx >= round.targetCount) return;
    if (entry.orderIndex < nextOrderIdx) return; // already found

    const expected = round.orderedTargets[nextOrderIdx];

    if (!lidsClosed) {
      // Must tap the lowest number (orderIndex === 0) to start and close the remaining lids!
      if (entry.orderIndex === 0) {
        lidsClosed = true;
        nextOrderIdx = 1;
        peekCell = null;
        wrongFlashCell = null;
        playSfx('tap', state.sound);
        const secondTarget = round.orderedTargets[1];
        notifyStageBaoBo(
          'correct',
          lang,
          0,
          zh
            ? '🧺 冚上竹蓋喇喵！憑記憶由細到大撳開蒸籠，下一個搵「' + secondTarget.num + '」號！'
            : '🧺 Bamboo lids closed! Now tap the steamers from low to high — next up is #' + secondTarget.num + '!'
        );
        render();
      } else {
        playSfx('gentle', state.sound);
        notifyStageBaoBo(
          'gentle',
          lang,
          0,
          zh
            ? '🐾 記好位置之後，請先由最細嗰個號碼「' + expected.num + '」開始撳起喵！'
            : '🐾 Study at your own pace, then start by tapping the LOWEST number (#' + expected.num + ')!'
        );
      }
      return;
    }

    // Recall phase: lids are closed on unfound steamers
    if (entry.orderIndex === nextOrderIdx) {
      nextOrderIdx += 1;
      peekCell = null;
      wrongFlashCell = null;
      playSfx('correct', state.sound);

      if (nextOrderIdx >= round.targetCount) {
        notifyStageBaoBo(
          'correct',
          lang,
          0,
          zh
            ? '🎉 好勁呀！整檯 ' + round.targetCount + ' 籠點心由細到大全部揭中晒喵！'
            : '🎉 Purr-fect memory! You uncovered all ' + round.targetCount + ' steamers in ascending order!'
        );
      } else {
        const nxt = round.orderedTargets[nextOrderIdx];
        notifyStageBaoBo(
          'correct',
          lang,
          0,
          zh
            ? '✨ 中咗「' + entry.num + '」號！下一個輪到「' + nxt.num + '」號蒸籠喵～'
            : '✨ Found #' + entry.num + '! Next in order is #' + nxt.num + '!'
        );
      }
      render();
    } else {
      // Gently flash which number was actually inside for 800ms without ending the round!
      mistakes += 1;
      wrongFlashCell = entry.cellIndex;
      playSfx('gentle', state.sound);
      notifyStageBaoBo(
        'gentle',
        lang,
        0,
        zh
          ? '👀 呢籠係「' +
            entry.num +
            '」號嚟㗎～記埋佢位置，我哋而家要搵「' +
            expected.num +
            '」號先喵！'
          : '👀 That lid hides #' +
            entry.num +
            '! Keep its spot in mind — right now we need #' +
            expected.num +
            '!'
      );
      render();
      addTimer(function () {
        if (wrongFlashCell === entry.cellIndex) {
          wrongFlashCell = null;
          render();
        }
      }, 800);
    }
  }

  function render() {
    if (cleanedUp) return;
    container.innerHTML = '';
    const round = rounds[stepIdx];
    const isRoundComplete = nextOrderIdx >= round.targetCount;

    const headerHintHtml =
      '<button type="button" class="chip-btn" id="stmHeaderHintBtn">' +
      t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (nl) {
        cleanedUp = true;
        clearAllTimers();
        stopSpeaking();
        onLevelChange(nl);
      },
      onBack: function () {
        cleanedUp = true;
        clearAllTimers();
        stopSpeaking();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml: headerHintHtml
    });

    const topHint = container.querySelector('#stmHeaderHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    if (!lidsClosed && nextOrderIdx === 0 && peekCell === null) {
      const firstNum = round.orderedTargets[0].num;
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '🥟 蒸籠打開咗喇（唔計時）！記實各個號碼嘅位置，準備好就撳最細嘅「' + firstNum + '」號蓋上竹蓋開始！'
          : '🥟 All steamers are open (untimed)! Memorize their spots, then tap the lowest number (#' + firstNum + ') to close the lids!'
      );
    }

    // Order sequence tracker chips
    let seqChipsHtml = '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;margin-top:0.45rem;">';
    seqChipsHtml +=
      '<span style="font-size:0.84rem;font-weight:800;color:var(--ink-muted);">' +
      (zh ? '由細到大次序：' : 'Ascending order:') +
      '</span>';
    for (let i = 0; i < round.orderedTargets.length; i++) {
      const tEntry = round.orderedTargets[i];
      const done = i < nextOrderIdx;
      const current = i === nextOrderIdx;
      seqChipsHtml +=
        '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:2rem;padding:0.18rem 0.5rem;border-radius:999px;font-weight:900;font-size:0.88rem;' +
        (done
          ? 'background:#10B981;color:#fff;'
          : current
          ? 'background:#F59E0B;color:#fff;box-shadow:0 0 0 2px #FDE68A;'
          : 'background:#F1F5F9;color:#475569;') +
        '">' +
        tEntry.num +
        (done ? '✓' : '') +
        '</span>';
    }
    seqChipsHtml += '</div>';

    const firstNum = round.orderedTargets[0].num;
    const curTarget =
      nextOrderIdx < round.targetCount ? round.orderedTargets[nextOrderIdx].num : null;

    const instructionText = !lidsClosed
      ? zh
        ? '📖 記憶階段（唔限時間）：記熟位置後，輕撳最細號碼「' + firstNum + '」蓋上其餘竹籠！'
        : '📖 Study Phase (Untimed): Memorize the positions, then tap lowest number (#' + firstNum + ') to close the lids!'
      : isRoundComplete
      ? zh
        ? '🎉 呢一檯蒸籠全部由細到大揭開晒喇！'
        : '🎉 All bamboo steamers uncovered in order!'
      : zh
      ? '🧺 請憑記憶搵出下一個號碼：【 ' + curTarget + ' 號 】蒸籠'
      : '🧺 Tap the closed bamboo steamer hiding number: [ #' + curTarget + ' ]';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.55rem;">' +
        '<span class="news-tag">' +
          (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 檯點心' : 'Dim Sum Table ' + (stepIdx + 1) + ' / ' + totalSteps) +
        '</span>' +
        '<button type="button" class="chip-btn" id="stmCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
      '</div>' +
      '<div class="prompt-box" style="margin-bottom:0.85rem;">' +
        '<p class="prompt-title" style="margin:0;">' + escHtml(instructionText) + '</p>' +
        seqChipsHtml +
      '</div>' +
      '<div id="stmGridWrap" style="display:grid;grid-template-columns:repeat(' +
        round.cols +
        ',minmax(0,1fr));gap:0.65rem;max-width:430px;margin:0 auto;"></div>' +
      '<div id="stmDoneArea"></div>';

    container.appendChild(card);

    const cardHint = card.querySelector('#stmCardHintBtn');
    if (cardHint) cardHint.addEventListener('click', triggerHint);

    const gridWrap = card.querySelector('#stmGridWrap');
    for (let c = 0; c < round.cellCount; c++) {
      const entry = round.cellMap[c] || null;
      if (!entry) {
        const emptySlot = document.createElement('div');
        emptySlot.style.cssText =
          'min-height:86px;border-radius:16px;background:rgba(217,119,6,0.06);border:1.5px dashed rgba(180,83,9,0.22);display:flex;align-items:center;justify-content:center;color:rgba(146,64,14,0.28);font-size:1.1rem;';
        emptySlot.textContent = '🍵';
        gridWrap.appendChild(emptySlot);
      } else {
        const isFound = entry.orderIndex < nextOrderIdx;
        const isWrongFlash = wrongFlashCell === c;
        const isPeeking = peekCell === c;
        const showOpen = !lidsClosed || isFound || isWrongFlash || isPeeking;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText =
          'min-height:86px;border-radius:16px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.35rem;transition:transform 0.15s ease,box-shadow 0.15s ease;position:relative;';

        if (showOpen) {
          if (isWrongFlash) {
            btn.style.background = '#FEF2F2';
            btn.style.border = '3px solid #EF4444';
          } else if (isFound) {
            btn.style.background = '#ECFDF5';
            btn.style.border = '3px solid #10B981';
          } else if (isPeeking) {
            btn.style.background = '#FEF9C3';
            btn.style.border = '3px solid #EAB308';
            btn.style.boxShadow = '0 0 0 4px rgba(234,179,8,0.3)';
          } else {
            btn.style.background = 'linear-gradient(180deg,#FFFBEB 0%,#FDE68A 100%)';
            btn.style.border = '3px solid #D97706';
          }

          btn.innerHTML =
            '<span style="font-size:1.55rem;font-weight:900;color:#78350F;line-height:1.05;">' +
              entry.num +
            '</span>' +
            '<span style="font-size:1.15rem;margin-top:0.12rem;">' +
              entry.icon +
              (isFound ? ' ✅' : '') +
            '</span>';
        } else {
          // Closed woven bamboo steamer lid!
          btn.style.background = 'radial-gradient(circle at 50% 42%,#F59E0B 0%,#B45309 92%)';
          btn.style.border = '3px solid #78350F';
          btn.style.boxShadow = '0 4px 10px rgba(120,53,15,0.22)';
          btn.innerHTML =
            '<span style="font-size:1.75rem;line-height:1.05;">🧺</span>' +
            '<span style="font-size:0.76rem;font-weight:800;color:#FFFBEB;margin-top:0.15rem;">' +
              (zh ? '竹籠蓋' : 'Steamer') +
            '</span>';
        }

        (function (boundEntry) {
          btn.addEventListener('click', function () {
            handleSteamerTap(boundEntry);
          });
        })(entry);

        gridWrap.appendChild(btn);
      }
    }

    if (isRoundComplete) {
      const doneArea = card.querySelector('#stmDoneArea');
      const isLast = stepIdx >= totalSteps - 1;
      if (doneArea) {
        doneArea.innerHTML =
          '<div class="feedback-banner" style="margin-top:0.9rem;">' +
            '<strong>🎉 ' + escHtml(randomPraise(lang)) + '</strong>' +
            '<div style="margin-top:0.75rem;">' +
              '<button type="button" class="btn btn-jade btn-full" id="stmNextBtn">' +
                (isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')) +
              '</button>' +
            '</div>' +
          '</div>';

        const nextBtn = doneArea.querySelector('#stmNextBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            stopSpeaking();
            if (isLast) {
              cleanedUp = true;
              clearAllTimers();
              const stars = mistakes <= 1 && hintsUsed <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
              const pts = 95 + level * 15 + stars * 10;
              onComplete({ score: pts, stars: stars });
            } else {
              playSfx('switch', state.sound);
              stepIdx += 1;
              lidsClosed = false;
              nextOrderIdx = 0;
              wrongFlashCell = null;
              peekCell = null;
              render();
            }
          });
        }
      }
    }
  }

  render();
}

/* =========================================================================
   4. QUICK SIGN & BIGGER PLATE (➕ 算盤快選符號 · gameId = 'quicksign')
   Steps 0-1: Missing Operator (Unique valid sign!)
   Steps 2-3: Bigger Plate (Plate A vs Plate B)
   ========================================================================= */

const SIGN_DEFS = [
  { sym: '＋', key: '+' },
  { sym: '−', key: '-' },
  { sym: '×', key: '*' },
  { sym: '÷', key: '/' }
];

function evalBinaryOp(a, opKey, b) {
  if (opKey === '+') return a + b;
  if (opKey === '-') return a - b;
  if (opKey === '*') return a * b;
  if (opKey === '/') {
    if (b === 0) return NaN;
    return a / b;
  }
  return NaN;
}

function findMatchingOps(leftVal, rightVal, targetResult) {
  const matches = [];
  for (let i = 0; i < SIGN_DEFS.length; i++) {
    const val = evalBinaryOp(leftVal, SIGN_DEFS[i].key, rightVal);
    if (!isNaN(val) && Math.abs(val - targetResult) < 1e-9) {
      matches.push(SIGN_DEFS[i]);
    }
  }
  return matches;
}

function generateMissingSignStep(state, level) {
  let chosen = null;

  for (let attempt = 0; attempt < 150; attempt++) {
    const opPick = SIGN_DEFS[randInt(0, 3)];
    let leftExpr = '';
    let leftVal = 0;
    let rightVal = 0;
    let resultVal = 0;

    if (level < 2) {
      if (opPick.key === '+') {
        leftVal = level === 0 ? randInt(4, 18) : randInt(12, 39);
        rightVal = level === 0 ? randInt(3, 14) : randInt(8, 29);
        resultVal = leftVal + rightVal;
      } else if (opPick.key === '-') {
        rightVal = level === 0 ? randInt(3, 12) : randInt(7, 25);
        resultVal = level === 0 ? randInt(3, 16) : randInt(6, 32);
        leftVal = resultVal + rightVal;
      } else if (opPick.key === '*') {
        leftVal = level === 0 ? randInt(3, 9) : randInt(4, 14);
        rightVal = level === 0 ? randInt(2, 8) : randInt(3, 9);
        resultVal = leftVal * rightVal;
      } else {
        rightVal = level === 0 ? randInt(2, 8) : randInt(3, 12);
        resultVal = level === 0 ? randInt(2, 9) : randInt(3, 12);
        leftVal = rightVal * resultVal;
      }
      leftExpr = String(leftVal);
    } else {
      // Level 2: 2-step expressions with clear parentheses, e.g. (15 − 3) [ ? ] 4 = 3 or (8 × 3) [ ? ] 5 = 19
      const subMode = randInt(0, 2);
      let pA = 0;
      let pB = 0;
      let pSym = '＋';

      if (opPick.key === '/') {
        rightVal = randInt(3, 9);
        resultVal = randInt(2, 9);
        leftVal = rightVal * resultVal;
        if (subMode === 0) {
          pB = randInt(3, 14);
          pA = leftVal + pB;
          pSym = '−';
        } else {
          pB = randInt(2, Math.max(2, leftVal - 3));
          pA = leftVal - pB;
          pSym = '＋';
        }
      } else if (opPick.key === '*') {
        leftVal = randInt(4, 14);
        rightVal = randInt(3, 7);
        resultVal = leftVal * rightVal;
        if (subMode === 0) {
          pB = randInt(3, 11);
          pA = leftVal + pB;
          pSym = '−';
        } else {
          pB = randInt(2, leftVal - 2);
          pA = leftVal - pB;
          pSym = '＋';
        }
      } else {
        // '+' or '-' after multiplication or division inside parentheses
        if (subMode === 2) {
          const divB = randInt(2, 6);
          leftVal = randInt(6, 18);
          pA = leftVal * divB;
          pB = divB;
          pSym = '÷';
        } else {
          pA = randInt(3, 9);
          pB = randInt(2, 7);
          leftVal = pA * pB;
          pSym = '×';
        }
        rightVal = opPick.key === '+' ? randInt(4, 19) : randInt(3, Math.max(3, leftVal - 2));
        resultVal = opPick.key === '+' ? leftVal + rightVal : leftVal - rightVal;
      }
      leftExpr = '(' + pA + ' ' + pSym + ' ' + pB + ')';
    }

    // Programmatically verify ONLY ONE of +, -, *, / makes the equation true!
    const validOps = findMatchingOps(leftVal, rightVal, resultVal);
    if (validOps.length !== 1) continue;

    const sig = 'qs_sign_L' + level + '_' + leftExpr + '_' + validOps[0].key + '_' + rightVal + '=' + resultVal;
    chosen = {
      kind: 'sign',
      sig: sig,
      leftExpr: leftExpr,
      leftVal: leftVal,
      rightVal: rightVal,
      resultVal: resultVal,
      answerSym: validOps[0].sym,
      answerKey: validOps[0].key
    };

    if (!hasSeenSignature(state, 'quicksign_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'quicksign_sigs', chosen.sig, 500);
  return chosen;
}

function makePlateExpression(level) {
  const mode = randInt(0, level === 2 ? 4 : 3);
  if (mode === 0) {
    const a = level === 0 ? randInt(6, 18) : randInt(12, 34);
    const b = level === 0 ? randInt(4, 12) : randInt(7, 22);
    return { expr: a + ' ＋ ' + b, val: a + b };
  }
  if (mode === 1) {
    const val = level === 0 ? randInt(10, 26) : randInt(15, 45);
    const b = level === 0 ? randInt(3, 11) : randInt(6, 19);
    return { expr: (val + b) + ' − ' + b, val: val };
  }
  if (mode === 2) {
    const a = level === 0 ? randInt(3, 7) : randInt(4, 9);
    const b = level === 0 ? randInt(3, 6) : randInt(4, 8);
    return { expr: a + ' × ' + b, val: a * b };
  }
  if (mode === 3 && level >= 1) {
    const b = randInt(2, 6);
    const val = randInt(14, 36);
    return { expr: (val * b) + ' ÷ ' + b, val: val };
  }
  // Level 2 compound expression
  const m1 = randInt(4, 8);
  const m2 = randInt(4, 7);
  const delta = randInt(3, 9);
  if (Math.random() < 0.5) {
    return { expr: '(' + m1 + ' × ' + m2 + ') ＋ ' + delta, val: m1 * m2 + delta };
  }
  return { expr: '(' + m1 + ' × ' + m2 + ') − ' + delta, val: m1 * m2 - delta };
}

function generateBiggerPlateStep(state, level) {
  let chosen = null;
  const maxGap = level === 0 ? 5 : level === 1 ? 4 : 3;

  for (let attempt = 0; attempt < 160; attempt++) {
    const plateA = makePlateExpression(level);
    const plateB = makePlateExpression(level);
    if (plateA.val === plateB.val) continue;
    if (plateA.expr === plateB.expr) continue;
    const diff = Math.abs(plateA.val - plateB.val);
    if (diff < 1 || diff > maxGap) continue;

    const sig = 'qs_plate_L' + level + '_' + plateA.expr + '_vs_' + plateB.expr;
    chosen = {
      kind: 'plate',
      sig: sig,
      plateA: plateA,
      plateB: plateB,
      answerSide: plateA.val > plateB.val ? 'A' : 'B'
    };

    if (!hasSeenSignature(state, 'quicksign_sigs', sig)) {
      break;
    }
  }

  // Safe fallback if tight gap loop missed
  if (!chosen) {
    chosen = {
      kind: 'plate',
      sig: 'qs_plate_fb_' + Date.now(),
      plateA: { expr: '17 ＋ 8', val: 25 },
      plateB: { expr: '6 × 4', val: 24 },
      answerSide: 'A'
    };
  }

  markSeenSignature(state, 'quicksign_sigs', chosen.sig, 500);
  return chosen;
}

export function mountQuickSignGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getGameLevel(state, 'quicksign');
  const gameMeta = findGameMeta(
    'quicksign',
    '➕',
    '算盤快選符號',
    'Quick Sign & Bigger Plate'
  );

  const totalSteps = 4;
  const steps = [
    generateMissingSignStep(state, level),
    generateMissingSignStep(state, level),
    generateBiggerPlateStep(state, level),
    generateBiggerPlateStep(state, level)
  ];

  let stepIdx = 0;
  let answered = false;
  let mistakes = 0;
  let hintsUsed = 0;
  let hintActive = false;
  let ruledOutOps = [];

  function triggerHint() {
    if (answered) return;
    const st = steps[stepIdx];
    if (!hintActive) {
      hintsUsed += 1;
      hintActive = true;

      if (st.kind === 'sign') {
        const wrongSyms = [];
        for (let i = 0; i < SIGN_DEFS.length; i++) {
          if (SIGN_DEFS[i].sym !== st.answerSym) {
            wrongSyms.push(SIGN_DEFS[i].sym);
          }
        }
        ruledOutOps = shuffleList(wrongSyms).slice(0, 2);
      }
    }

    playSfx('switch', state.sound);
    if (st.kind === 'sign') {
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '💡 噼啪～阿喵撥動算盤珠，幫你篩走咗兩個唔啱嘅運算符號喇喵！'
          : '💡 Click-clack~ Mochi flicked her abacus beads and ruled out two operators for you!'
      );
    } else {
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '💡 噼啪～阿喵用算盤幫你計好咗：A 碟等於 ' + st.plateA.val + '！再計埋 B 碟就知邊碟大啲喵！'
          : '💡 Click-clack~ Mochi computed Plate A on her abacus: Plate A = ' + st.plateA.val + '! Now compare with Plate B!'
      );
    }
    render();
  }

  function render() {
    container.innerHTML = '';
    const st = steps[stepIdx];

    const headerHintHtml =
      '<button type="button" class="chip-btn" id="qsHeaderHintBtn">' +
      t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (nl) {
        stopSpeaking();
        onLevelChange(nl);
      },
      onBack: function () {
        stopSpeaking();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml: headerHintHtml
    });

    const topHint = container.querySelector('#qsHeaderHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    if (!answered && !hintActive) {
      if (st.kind === 'sign') {
        notifyStageBaoBo(
          'intro',
          lang,
          0,
          zh
            ? '🧮 阿喵撥緊茶樓木算盤！望下條算式中間「？」應該填 ＋、−、× 定 ÷ 唯一正確符號喵？'
            : '🧮 Mochi is clicking her wooden tea abacus! Pick the ONE operator (＋, −, ×, ÷) that makes the equation true!'
        );
      } else {
        notifyStageBaoBo(
          'intro',
          lang,
          0,
          zh
            ? '🍽️ 上點心碟啦喵！心算對比 A 碟同 B 碟，輕撳數值【大啲】嗰一碟！'
            : '🍽️ Two dim-sum plates served! Mentally compute both and tap the plate with the LARGER total!'
        );
      }
    }

    const card = document.createElement('div');
    card.className = 'card';

    if (st.kind === 'sign') {
      const slotDisplay = answered ? st.answerSym : '？';
      const slotBg = answered ? '#10B981' : '#FEF3C7';
      const slotColor = answered ? '#FFFFFF' : '#B45309';

      card.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.65rem;">' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 題 · 填運算符號' : 'Step ' + (stepIdx + 1) + ' / ' + totalSteps + ' · Missing Sign') +
          '</span>' +
          '<button type="button" class="chip-btn" id="qsCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
        '</div>' +
        // Wooden Tea-Abacus Equation Card
        '<div style="background:linear-gradient(180deg,#FFFDF7 0%,#FEF3C7 100%);border:2.5px solid #B45309;border-radius:16px;padding:1.25rem 0.9rem;text-align:center;margin-bottom:0.95rem;box-shadow:inset 0 2px 6px rgba(180,83,9,0.1);">' +
          '<div style="font-size:0.82rem;font-weight:800;color:#92400E;margin-bottom:0.55rem;letter-spacing:0.04em;">' +
            '🧮 ' + (zh ? '茶莊算盤算式 · 揀出唯一正確符號' : 'TEA-HOUSE ABACUS · PICK THE MISSING SIGN') +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:0.55rem;flex-wrap:wrap;font-size:1.75rem;font-weight:900;color:#1E293B;">' +
            '<span>' + escHtml(st.leftExpr) + '</span>' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:52px;height:52px;padding:0 0.5rem;border-radius:12px;background:' +
              slotBg +
              ';border:2.5px dashed #D97706;color:' +
              slotColor +
              ';font-size:1.65rem;">' +
              escHtml(slotDisplay) +
            '</span>' +
            '<span>' + st.rightVal + '</span>' +
            '<span style="color:#92400E;">＝</span>' +
            '<span style="color:#065F46;">' + st.resultVal + '</span>' +
          '</div>' +
        '</div>' +
        '<div id="qsSignButtons" style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.65rem;"></div>' +
        '<div id="qsFeedbackArea"></div>';

      container.appendChild(card);

      const cardHint = card.querySelector('#qsCardHintBtn');
      if (cardHint) cardHint.addEventListener('click', triggerHint);

      const signWrap = card.querySelector('#qsSignButtons');
      for (let i = 0; i < SIGN_DEFS.length; i++) {
        (function (def) {
          const isRuledOut = ruledOutOps.indexOf(def.sym) !== -1;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-btn';
          btn.style.cssText =
            'justify-content:center;font-size:1.85rem;font-weight:900;padding:0.9rem 0.4rem;text-align:center;';

          if (answered) {
            btn.disabled = true;
            if (def.sym === st.answerSym) btn.classList.add('correct');
            btn.textContent = def.sym;
          } else if (isRuledOut) {
            btn.disabled = true;
            btn.style.opacity = '0.35';
            btn.textContent = def.sym;
          } else {
            btn.textContent = def.sym;
            btn.addEventListener('click', function () {
              if (answered) return;
              if (def.sym === st.answerSym) {
                answered = true;
                playSfx('correct', state.sound);
                notifyStageBaoBo(
                  'correct',
                  lang,
                  0,
                  zh
                    ? '🎉 算盤珠一撥即中！填入「' + def.sym + '」啱啱好等於 ' + st.resultVal + ' 喵！'
                    : '🎉 Click-clack, spot on! "' + def.sym + '" makes ' + st.resultVal + '!'
                );
                render();
              } else {
                mistakes += 1;
                ruledOutOps.push(def.sym);
                playSfx('gentle', state.sound);
                notifyStageBaoBo(
                  'gentle',
                  lang,
                  0,
                  zh
                    ? '🧮 試下另一個符號喵～計下變大定變細就會搵到答案㗎喇！'
                    : '🧮 Try another operator, meow~ Check whether the value grows or shrinks!'
                );
                render();
                const fb = container.querySelector('#qsFeedbackArea');
                if (fb) {
                  fb.innerHTML =
                    '<div class="feedback-banner gentle-retry" style="margin-top:0.75rem;">' +
                    t(lang, 'gentleRetry') +
                    '</div>';
                }
              }
            });
          }
          signWrap.appendChild(btn);
        })(SIGN_DEFS[i]);
      }
    } else {
      // Steps 2-3: Bigger Plate (A 碟 vs B 碟)
      card.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.65rem;">' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 題 · 邊碟數值大啲' : 'Step ' + (stepIdx + 1) + ' / ' + totalSteps + ' · Bigger Plate') +
          '</span>' +
          '<button type="button" class="chip-btn" id="qsCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
        '</div>' +
        '<div class="prompt-box" style="margin-bottom:0.85rem;">' +
          '<p class="prompt-title" style="margin:0;">' +
            (zh ? '🍽️ 心算以下兩碟點心算式，輕撳數值【大啲】嗰一碟：' : '🍽️ Tap the dim-sum plate with the LARGER total:') +
          '</p>' +
        '</div>' +
        '<div id="qsPlatesWrap" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.85rem;"></div>' +
        '<div id="qsFeedbackArea"></div>';

      container.appendChild(card);

      const cardHint = card.querySelector('#qsCardHintBtn');
      if (cardHint) cardHint.addEventListener('click', triggerHint);

      const platesWrap = card.querySelector('#qsPlatesWrap');
      const sides = [
        { side: 'A', labelZh: 'A 碟', labelEn: 'Plate A', data: st.plateA, icon: '🥟', rim: '#0EA5E9' },
        { side: 'B', labelZh: 'B 碟', labelEn: 'Plate B', data: st.plateB, icon: '🥮', rim: '#F59E0B' }
      ];

      for (let p = 0; p < sides.length; p++) {
        (function (plateInfo) {
          const isWinner = plateInfo.side === st.answerSide;
          const showComputedVal = answered || (hintActive && plateInfo.side === 'A');

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-btn';
          btn.style.cssText =
            'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.1rem 0.75rem;border-radius:18px;text-align:center;gap:0.45rem;';

          if (answered) {
            btn.disabled = true;
            if (isWinner) btn.classList.add('correct');
          }

          btn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 46" style="width:92px;height:auto;display:block;">' +
              '<ellipse cx="60" cy="25" rx="54" ry="17" fill="#FFFBEB" stroke="' + plateInfo.rim + '" stroke-width="3" />' +
              '<ellipse cx="60" cy="25" rx="42" ry="11" fill="none" stroke="' + plateInfo.rim + '" stroke-width="1.2" stroke-dasharray="4 3" />' +
              '<text x="60" y="31" text-anchor="middle" font-size="20">' + plateInfo.icon + '</text>' +
            '</svg>' +
            '<span style="display:inline-block;padding:0.16rem 0.65rem;border-radius:999px;background:#F1F5F9;font-size:0.84rem;font-weight:800;color:#334155;">' +
              (zh ? plateInfo.labelZh : plateInfo.labelEn) +
            '</span>' +
            '<span style="font-size:1.35rem;font-weight:900;color:#0F172A;">' +
              escHtml(plateInfo.data.expr) +
            '</span>' +
            (showComputedVal
              ? '<span style="font-size:0.95rem;font-weight:900;color:#065F46;background:#ECFDF5;padding:0.18rem 0.65rem;border-radius:999px;">＝ ' +
                plateInfo.data.val +
                (answered && isWinner ? ' 🏆' : '') +
                '</span>'
              : '<span style="font-size:0.82rem;color:var(--ink-muted);">' +
                (zh ? '輕撳揀呢碟' : 'Tap to pick') +
                '</span>');

          if (!answered) {
            btn.addEventListener('click', function () {
              if (answered) return;
              if (isWinner) {
                answered = true;
                playSfx('correct', state.sound);
                notifyStageBaoBo(
                  'correct',
                  lang,
                  0,
                  zh
                    ? '🎉 眼明心快！' +
                      plateInfo.labelZh +
                      '（' +
                      plateInfo.data.val +
                      '）真係大過另一碟喵！'
                    : '🎉 Sharp mental math! ' +
                      plateInfo.labelEn +
                      ' (' +
                      plateInfo.data.val +
                      ') has the bigger total!'
                );
                render();
              } else {
                mistakes += 1;
                playSfx('gentle', state.sound);
                btn.classList.add('wrong');
                btn.disabled = true;
                notifyStageBaoBo(
                  'gentle',
                  lang,
                  0,
                  zh
                    ? '🐾 呢碟數值細少少喎～再算真啲另一碟，或者撳「💡 貼士」喵！'
                    : '🐾 That plate is slightly smaller! Check the other plate!'
                );
                const fb = card.querySelector('#qsFeedbackArea');
                if (fb) {
                  fb.innerHTML =
                    '<div class="feedback-banner gentle-retry" style="margin-top:0.75rem;">' +
                    t(lang, 'gentleRetry') +
                    '</div>';
                }
              }
            });
          }

          platesWrap.appendChild(btn);
        })(sides[p]);
      }
    }

    const feedbackArea = card.querySelector('#qsFeedbackArea');
    if (answered && feedbackArea) {
      const isLast = stepIdx >= totalSteps - 1;
      const summaryLine =
        st.kind === 'sign'
          ? st.leftExpr + ' ' + st.answerSym + ' ' + st.rightVal + ' ＝ ' + st.resultVal
          : (zh ? 'A 碟 = ' : 'Plate A = ') +
            st.plateA.val +
            '  vs  ' +
            (zh ? 'B 碟 = ' : 'Plate B = ') +
            st.plateB.val;

      feedbackArea.innerHTML =
        '<div class="feedback-banner" style="margin-top:0.85rem;">' +
          '<strong>🎉 ' + escHtml(randomPraise(lang)) + '</strong>' +
          '<div style="margin-top:0.35rem;font-size:0.94rem;font-weight:800;">' +
            escHtml(summaryLine) +
          '</div>' +
          '<div style="margin-top:0.75rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="qsNextBtn">' +
              (isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')) +
            '</button>' +
          '</div>' +
        '</div>';

      const nextBtn = feedbackArea.querySelector('#qsNextBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stopSpeaking();
          if (isLast) {
            const stars = mistakes === 0 && hintsUsed <= 1 ? 3 : mistakes <= 2 ? 2 : 1;
            const pts = 95 + level * 15 + stars * 10;
            onComplete({ score: pts, stars: stars });
          } else {
            playSfx('switch', state.sound);
            stepIdx += 1;
            answered = false;
            hintActive = false;
            ruledOutOps = [];
            render();
          }
        });
      }
    }
  }

  render();
}

/* =========================================================================
   5. CLOCK TOWER & MIRROR TIME (🕰️ 鐘樓鏡影認時間 · gameId = 'clocktower')
   HK Tsim Sha Tsui Clock Tower & Vancouver Gastown Steam Clock
   ========================================================================= */

function renderAnalogClockSvg(hour, minute, opts) {
  const options = opts || {};
  const showNumbers = options.showNumbers !== false;
  const mirrored = Boolean(options.mirrored);
  const isSteam = options.landmark === 'yvr';

  const cx = 100;
  const cy = 106;
  const r = 74;

  // 12 hour ticks + 60 minute ticks
  let ticksSvg = '';
  for (let m = 0; m < 60; m++) {
    const deg = m * 6;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isHourTick = m % 5 === 0;
    const isCardinal = m % 15 === 0;
    const outerR = r - 5;
    const innerR = isHourTick ? (isCardinal ? r - 16 : r - 13) : r - 9;
    const x1 = (cx + outerR * Math.cos(rad)).toFixed(2);
    const y1 = (cy + outerR * Math.sin(rad)).toFixed(2);
    const x2 = (cx + innerR * Math.cos(rad)).toFixed(2);
    const y2 = (cy + innerR * Math.sin(rad)).toFixed(2);
    const strokeW = isCardinal ? '3' : isHourTick ? '2.2' : '0.9';
    const strokeCol = isHourTick ? '#1E293B' : '#94A3B8';

    ticksSvg +=
      '<line x1="' +
      x1 +
      '" y1="' +
      y1 +
      '" x2="' +
      x2 +
      '" y2="' +
      y2 +
      '" stroke="' +
      strokeCol +
      '" stroke-width="' +
      strokeW +
      '" stroke-linecap="round" />';
  }

  // Optional 1..12 numbers OR numberless cardinal brass studs + 12-top marker
  let numbersSvg = '';
  if (showNumbers) {
    for (let h = 1; h <= 12; h++) {
      const hRad = ((h * 30 - 90) * Math.PI) / 180;
      const nr = r - 25;
      const nx = (cx + nr * Math.cos(hRad)).toFixed(2);
      const ny = (cy + nr * Math.sin(hRad) + 4.5).toFixed(2);
      numbersSvg +=
        '<text x="' +
        nx +
        '" y="' +
        ny +
        '" text-anchor="middle" font-size="13.5" font-weight="900" fill="#1E293B">' +
        h +
        '</text>';
    }
  } else {
    // Distinct gold diamond at 12 o'clock so top orientation is crystal clear even without digits!
    numbersSvg +=
      '<polygon points="100,47 96,54 100,61 104,54" fill="#D97706" />' +
      '<circle cx="152" cy="106" r="3.2" fill="#B45309" />' +
      '<circle cx="100" cy="158" r="3.2" fill="#B45309" />' +
      '<circle cx="48" cy="106" r="3.2" fill="#B45309" />';
  }

  // Exact hand angles: hour hand at (hour % 12) * 30 + minute * 0.5 degrees, minute hand at minute * 6 degrees
  const hourDeg = ((hour % 12) * 30 + minute * 0.5).toFixed(2);
  const minDeg = (minute * 6).toFixed(2);

  const handsSvg =
    // Short thick hour hand
    '<g transform="rotate(' + hourDeg + ' ' + cx + ' ' + cy + ')">' +
      '<line x1="' + cx + '" y1="' + (cy + 8) + '" x2="' + cx + '" y2="' + (cy - 39) + '" stroke="#1E293B" stroke-width="6.5" stroke-linecap="round" />' +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 35) + '" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />' +
    '</g>' +
    // Long crimson minute hand
    '<g transform="rotate(' + minDeg + ' ' + cx + ' ' + cy + ')">' +
      '<line x1="' + cx + '" y1="' + (cy + 11) + '" x2="' + cx + '" y2="' + (cy - 57) + '" stroke="#DC2626" stroke-width="3.8" stroke-linecap="round" />' +
    '</g>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#D97706" stroke="#1E293B" stroke-width="2" />';

  // Architectural Crown: TST Red-Brick Clock Tower vs Gastown Brass Steam Clock
  const archSvg = isSteam
    ? '<g>' +
        '<rect x="64" y="14" width="72" height="18" rx="6" fill="#78350F" stroke="#F59E0B" stroke-width="1.6" />' +
        '<circle cx="76" cy="9" r="5" fill="#E2E8F0" opacity="0.85" />' +
        '<circle cx="100" cy="6" r="6" fill="#F1F5F9" opacity="0.9" />' +
        '<circle cx="124" cy="9" r="5" fill="#E2E8F0" opacity="0.85" />' +
        '<rect x="52" y="182" width="96" height="12" rx="4" fill="#78350F" />' +
      '</g>'
    : '<g>' +
        '<polygon points="74,28 100,6 126,28" fill="#B91C1C" stroke="#7F1D1D" stroke-width="1.5" />' +
        '<rect x="62" y="24" width="76" height="10" rx="3" fill="#FEF3C7" stroke="#991B1B" stroke-width="1.4" />' +
        '<rect x="48" y="182" width="104" height="12" rx="4" fill="#991B1B" />' +
      '</g>';

  const dialFaceGroup =
    '<g ' + (mirrored ? 'transform="translate(200,0) scale(-1,1)"' : '') + '>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 5) + '" fill="' + (isSteam ? '#92400E' : '#991B1B') + '" />' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#FFFDF7" stroke="#D97706" stroke-width="3" />' +
      ticksSvg +
      numbersSvg +
      handsSvg +
    '</g>';

  const mirrorGlintSvg = mirrored
    ? '<g pointer-events="none">' +
        '<rect x="6" y="4" width="188" height="192" rx="18" fill="none" stroke="#38BDF8" stroke-width="3" stroke-dasharray="8 4" />' +
        '<line x1="36" y1="48" x2="68" y2="26" stroke="#BAE6FD" stroke-width="3" stroke-linecap="round" opacity="0.75" />' +
        '<line x1="42" y1="58" x2="62" y2="44" stroke="#BAE6FD" stroke-width="2" stroke-linecap="round" opacity="0.65" />' +
      '</g>'
    : '';

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="width:205px;height:205px;display:block;margin:0 auto;">' +
      archSvg +
      dialFaceGroup +
      mirrorGlintSvg +
    '</svg>'
  );
}

function buildTimeOptions(correctHour, correctMinute, extraTrapTime) {
  const correctStr = formatClockTime(correctHour, correctMinute);
  const list = [correctStr];

  if (extraTrapTime && extraTrapTime !== correctStr) {
    list.push(extraTrapTime);
  }

  const candidateOffsets = shuffleList([
    { dh: 0, dm: 5 },
    { dh: 0, dm: -5 },
    { dh: 0, dm: 10 },
    { dh: 0, dm: -10 },
    { dh: 1, dm: 0 },
    { dh: -1, dm: 0 },
    { dh: 1, dm: -5 },
    { dh: -1, dm: 5 },
    { dh: 0, dm: 15 }
  ]);

  for (let i = 0; i < candidateOffsets.length && list.length < 4; i++) {
    const off = candidateOffsets[i];
    const totalMins = (((correctHour % 12) * 60 + correctMinute + off.dh * 60 + off.dm) % 720 + 720) % 720;
    const h = Math.floor(totalMins / 60) === 0 ? 12 : Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const formatted = formatClockTime(h, m);
    if (list.indexOf(formatted) === -1) {
      list.push(formatted);
    }
  }

  return shuffleList(list);
}

function generateClockSession(state, level) {
  const rounds = [];

  // Round 0: Numberless Clock Face (5-minute increments)
  for (let a = 0; a < 90; a++) {
    const h = randInt(1, 12);
    const mStep = level === 0 ? randInt(0, 11) : randInt(1, 11);
    const m = mStep * 5;
    const sig = 'clk_r0_L' + level + '_' + h + ':' + padTwo(m);
    const r0 = {
      roundType: 'numberless',
      sig: sig,
      hour: h,
      minute: m,
      answerStr: formatClockTime(h, m),
      options: buildTimeOptions(h, m, null)
    };
    rounds[0] = r0;
    if (!hasSeenSignature(state, 'clock_sigs', sig)) break;
  }
  markSeenSignature(state, 'clock_sigs', rounds[0].sig, 400);

  // Round 1: Mirrored Clock Face (avoid symmetric 12:00 / 6:00 / 12:30 / 6:30)
  for (let b = 0; b < 100; b++) {
    const h = randInt(1, 12);
    const m = randInt(1, 11) * 5;
    if (m === 30 && (h === 12 || h === 6 || h === 5 || h === 11)) continue;
    const sig = 'clk_r1_L' + level + '_' + h + ':' + padTwo(m);

    // Un-mirrored visual trap time (what the reflected hands appear to point near)
    const mirrorMin = (60 - m) % 60;
    const mirrorHrRaw = (12 - (h % 12) - (m > 0 ? 1 : 0) + 12) % 12;
    const mirrorHr = mirrorHrRaw === 0 ? 12 : mirrorHrRaw;
    const trapStr = formatClockTime(mirrorHr, mirrorMin);

    const r1 = {
      roundType: 'mirrored',
      sig: sig,
      hour: h,
      minute: m,
      answerStr: formatClockTime(h, m),
      options: buildTimeOptions(h, m, trapStr)
    };
    rounds[1] = r1;
    if (!hasSeenSignature(state, 'clock_sigs', sig)) break;
  }
  markSeenSignature(state, 'clock_sigs', rounds[1].sig, 400);

  // Round 2: Transit Elapsed Time (20..55 mins, crossing hour boundary on Level 1 & 2)
  for (let c = 0; c < 110; c++) {
    const elapsedSteps = [20, 25, 30, 35, 40, 45, 50, 55];
    const elapsedMins = elapsedSteps[randInt(0, elapsedSteps.length - 1)];
    const startH = randInt(1, 12);
    let startM = randInt(0, 11) * 5;

    if (level >= 1 && startM + elapsedMins < 60) {
      // Ensure crossing the hour boundary on Level 1 & 2!
      const minStartM = Math.max(5, 65 - elapsedMins);
      const minSlot = Math.ceil(minStartM / 5);
      startM = randInt(minSlot, 11) * 5;
    }

    const totalEnd = (startH % 12) * 60 + startM + elapsedMins;
    const endH0 = Math.floor((totalEnd % 720) / 60);
    const endH = endH0 === 0 ? 12 : endH0;
    const endM = totalEnd % 60;

    // Trap: forgetting to increment hour when crossing 60
    const forgotHourStr = formatClockTime(startH, endM);

    const sig = 'clk_r2_L' + level + '_' + startH + ':' + padTwo(startM) + '+' + elapsedMins;
    const r2 = {
      roundType: 'elapsed',
      sig: sig,
      hour: startH,
      minute: startM,
      elapsedMins: elapsedMins,
      endHour: endH,
      endMinute: endM,
      answerStr: formatClockTime(endH, endM),
      options: buildTimeOptions(endH, endM, forgotHourStr)
    };
    rounds[2] = r2;
    if (!hasSeenSignature(state, 'clock_sigs', sig)) break;
  }
  markSeenSignature(state, 'clock_sigs', rounds[2].sig, 400);

  return rounds;
}

export function mountClockTowerGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getGameLevel(state, 'clocktower');
  const gameMeta = findGameMeta(
    'clocktower',
    '🕰️',
    '鐘樓鏡影認時間',
    'Clock Tower & Mirror Time'
  );

  const totalSteps = 3;
  const rounds = generateClockSession(state, level);

  let stepIdx = 0;
  let answered = false;
  let mistakes = 0;
  let hintsUsed = 0;
  let hintText = '';
  let eliminatedOpt = null;

  function getLandmarkForStep(idx) {
    if (state.region === 'yvr') return 'yvr';
    if (state.region === 'hk') return 'hk';
    return idx === 1 ? 'yvr' : 'hk';
  }

  function triggerHint() {
    if (answered) return;
    const rd = rounds[stepIdx];
    if (!hintText) {
      hintsUsed += 1;
      for (let i = 0; i < rd.options.length; i++) {
        if (rd.options[i] !== rd.answerStr) {
          eliminatedOpt = rd.options[i];
          break;
        }
      }

      if (rd.roundType === 'numberless') {
        const nextHr = (rd.hour % 12) + 1;
        hintText =
          rd.minute === 0
            ? zh
              ? '💡 貼士：長針指正 12 點方向（:00），短針正正指住 ' + rd.hour + ' 點！'
              : '💡 Hint: The long hand is at :00 and the short hand points right at ' + rd.hour + '!'
            : zh
            ? '💡 貼士：短針行過咗 ' + rd.hour + ' 點（喺 ' + rd.hour + ' 點同 ' + nextHr + ' 點之間）喵！'
            : '💡 Hint: The short hour hand is between ' + rd.hour + ' and ' + nextHr + ' o\'clock!';
      } else if (rd.roundType === 'mirrored') {
        const nextHrM = (rd.hour % 12) + 1;
        hintText =
          rd.minute === 0
            ? zh
              ? '💡 鏡影貼士：將左右反轉返過嚟，真實短針正正指住 ' + rd.hour + ' 點方向喵！'
              : '💡 Mirror Hint: Flipping left-right back, the true short hand points at ' + rd.hour + ' o\'clock!'
            : zh
            ? '💡 鏡影貼士：真實短針位於 ' + rd.hour + ' 點同 ' + nextHrM + ' 點之間（唔好俾鏡面左右呃到呀）！'
            : '💡 Mirror Hint: The true short hand lies between ' + rd.hour + ' and ' + nextHrM + ' o\'clock!';
      } else {
        const depStr = formatClockTime(rd.hour, rd.minute);
        hintText = zh
          ? '💡 出發時間係 ' + depStr + '，再往後加 ' + rd.elapsedMins + ' 分鐘（過 60 分記得進 1 小時）喵！'
          : '💡 Departure time is ' + depStr + ' — add ' + rd.elapsedMins + ' minutes (remember to carry +1 hour past :60)!';
      }
    }

    playSfx('switch', state.sound);
    notifyStageBaoBo('intro', lang, 0, hintText);
    render();
  }

  function render() {
    container.innerHTML = '';
    const rd = rounds[stepIdx];
    const landmark = getLandmarkForStep(stepIdx);
    const isSteam = landmark === 'yvr';

    const headerHintHtml =
      '<button type="button" class="chip-btn" id="clkHeaderHintBtn">' +
      t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (nl) {
        stopSpeaking();
        onLevelChange(nl);
      },
      onBack: function () {
        stopSpeaking();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml: headerHintHtml
    });

    const topHint = container.querySelector('#clkHeaderHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    if (!answered && !hintText) {
      if (rd.roundType === 'numberless') {
        notifyStageBaoBo(
          'intro',
          lang,
          0,
          zh
            ? '🕰️ 噹～噹～阿喵豎起耳仔聽緊鐘樓報時！呢個鐘面冇寫數字，望實粗短時針同紅色長分針認時間喵！'
            : '🕰️ Dong~ Dong~ Mochi is listening to the Clock Tower chimes! Read the numberless dial from the short hour hand and red minute hand!'
        );
      } else if (rd.roundType === 'mirrored') {
        notifyStageBaoBo(
          'intro',
          lang,
          0,
          zh
            ? '🪞 呢幅係鐘樓喺維港／海傍玻璃窗嘅【鏡中左右倒影】！喺腦入面左右反轉返，揀出真實時間喵！'
            : '🪞 Shimmer~ You are looking at a horizontal MIRROR reflection of the Clock Tower! Flip left & right in your head to read the true time!'
        );
      } else {
        notifyStageBaoBo(
          'intro',
          lang,
          0,
          zh
            ? '⛴️ 鐘聲響起開船開車喇！先讀出鐘面出發時間，再心算行駛 ' + rd.elapsedMins + ' 分鐘後幾點到達喵！'
            : '⛴️ Chimes ring for departure! Read the departure clock and add ' + rd.elapsedMins + ' minutes to find the arrival time!'
        );
      }
    }

    const landmarkBadge = isSteam
      ? zh
        ? '🍁 溫哥華煤氣鎮蒸汽鐘'
        : '🍁 Gastown Steam Clock'
      : zh
      ? '🧱 尖沙咀紅磚鐘樓'
      : '🧱 HK Tsim Sha Tsui Clock Tower';

    let roundTypeLabel = '';
    let promptQuestion = '';
    if (rd.roundType === 'numberless') {
      roundTypeLabel = zh ? '無字鐘面' : 'Numberless Dial';
      promptQuestion = zh ? '請問上面無字鐘面顯示嘅時間係幾點？' : 'What time is shown on this numberless clock face?';
    } else if (rd.roundType === 'mirrored') {
      roundTypeLabel = zh ? '🪞 鏡中倒影' : '🪞 Mirror Reflection';
      promptQuestion = zh
        ? '上面係【左右鏡面反射】嘅鐘面倒影，請問真實時間係幾點？'
        : 'Above is a horizontal MIRROR reflection of the clock. What is the TRUE time?';
    } else {
      roundTypeLabel = zh ? '行車到站心算' : 'Transit Elapsed Time';
      promptQuestion = isSteam
        ? zh
          ? '天車喺鐘面時間開出，行駛 ' + rd.elapsedMins + ' 分鐘後幾點到達？'
          : 'Departing on the SkyTrain at the clock time shown, what time do you arrive after ' + rd.elapsedMins + ' minutes?'
        : zh
        ? '天星小輪喺鐘面時間開出，行駛 ' + rd.elapsedMins + ' 分鐘後幾點到達？'
        : 'Departing on the Star Ferry at the clock time shown, what time do you arrive after ' + rd.elapsedMins + ' minutes?';
    }

    const clockSvg = renderAnalogClockSvg(rd.hour, rd.minute, {
      showNumbers: rd.roundType === 'elapsed',
      mirrored: rd.roundType === 'mirrored',
      landmark: landmark
    });

    // When answered on mirrored round, also show a mini un-mirrored true clock confirmation badge!
    const frameStyle =
      rd.roundType === 'mirrored'
        ? 'background:linear-gradient(135deg,#E0F2FE 0%,#F8FAFC 50%,#E0F2FE 100%);border:2px solid #38BDF8;border-radius:18px;padding:0.75rem;margin-bottom:0.85rem;text-align:center;'
        : 'background:linear-gradient(180deg,#FFFDF7 0%,#FEF7E6 100%);border:1.5px solid #E5D3B3;border-radius:18px;padding:0.75rem;margin-bottom:0.85rem;text-align:center;';

    const mirrorHeaderBanner =
      rd.roundType === 'mirrored'
        ? '<div style="display:inline-block;margin-bottom:0.35rem;padding:0.2rem 0.75rem;border-radius:999px;background:#0284C7;color:#FFFFFF;font-size:0.82rem;font-weight:900;">' +
          '🪞 ' + (zh ? '鏡中倒影（左右反轉）' : 'Mirror Reflection (Flipped L↔R)') +
          '</div>'
        : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">' +
        '<span class="news-tag">' +
          escHtml(landmarkBadge) + ' · ' + escHtml(roundTypeLabel) +
        '</span>' +
        '<button type="button" class="chip-btn" id="clkCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
      '</div>' +
      '<div style="' + frameStyle + '">' +
        mirrorHeaderBanner +
        clockSvg +
      '</div>' +
      '<div class="prompt-box" style="margin-bottom:0.8rem;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">' +
          '<p class="prompt-title" style="margin:0;">' + escHtml(promptQuestion) + '</p>' +
          '<button type="button" class="chip-btn" id="clkSpeakBtn">🔊 ' + (zh ? '朗讀' : 'Listen') + '</button>' +
        '</div>' +
        (hintText
          ? '<div style="margin-top:0.6rem;padding:0.55rem 0.75rem;background:#FFFDF6;border:1.5px dashed #D97706;border-radius:10px;font-size:0.9rem;font-weight:700;color:#78350F;">' +
            escHtml(hintText) +
            '</div>'
          : '') +
      '</div>' +
      '<div class="choices-list" id="clkChoicesWrap" style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.65rem;"></div>' +
      '<div id="clkFeedbackArea"></div>';

    container.appendChild(card);

    const cardHint = card.querySelector('#clkCardHintBtn');
    if (cardHint) cardHint.addEventListener('click', triggerHint);

    const spkBtn = card.querySelector('#clkSpeakBtn');
    if (spkBtn) {
      spkBtn.addEventListener('click', function () {
        speakText(promptQuestion, lang);
      });
    }

    const choicesWrap = card.querySelector('#clkChoicesWrap');
    const feedbackArea = card.querySelector('#clkFeedbackArea');

    for (let i = 0; i < rd.options.length; i++) {
      (function (optStr) {
        const isCorrect = optStr === rd.answerStr;
        const isElim = eliminatedOpt === optStr;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.style.fontSize = '1.22rem';
        btn.style.fontWeight = '900';

        if (answered) {
          btn.disabled = true;
          if (isCorrect) btn.classList.add('correct');
          btn.innerHTML =
            '<span>🕒 ' + escHtml(optStr) + '</span><span>' + (isCorrect ? '✅' : '○') + '</span>';
        } else if (isElim) {
          btn.disabled = true;
          btn.style.opacity = '0.4';
          btn.innerHTML =
            '<span style="text-decoration:line-through;">🕒 ' + escHtml(optStr) + '</span><span>✕</span>';
        } else {
          btn.innerHTML = '<span>🕒 ' + escHtml(optStr) + '</span><span>○</span>';
          btn.addEventListener('click', function () {
            if (answered) return;
            if (isCorrect) {
              answered = true;
              playSfx('correct', state.sound);
              notifyStageBaoBo(
                'correct',
                lang,
                0,
                zh
                  ? '🎉 噹噹～時間分秒不差！正正就係 ' + rd.answerStr + ' 喵！'
                  : '🎉 Dong-dong! Right on time — ' + rd.answerStr + ' is exact!'
              );
              render();
            } else {
              mistakes += 1;
              playSfx('gentle', state.sound);
              btn.classList.add('wrong');
              btn.disabled = true;
              const lastSp = btn.querySelector('span:last-child');
              if (lastSp) lastSp.textContent = '↻';
              notifyStageBaoBo(
                'gentle',
                lang,
                0,
                zh
                  ? '🕰️ 差少少咋～睇清粗短針係時針、紅色長針係分針，隨時可撳「💡 貼士」喵！'
                  : '🕰️ Almost! Check the short thick hour hand vs long red minute hand — or tap 💡 Hint!'
              );
              if (feedbackArea) {
                feedbackArea.innerHTML =
                  '<div class="feedback-banner gentle-retry" style="margin-top:0.75rem;">' +
                  t(lang, 'gentleRetry') +
                  '</div>';
              }
            }
          });
        }

        choicesWrap.appendChild(btn);
      })(rd.options[i]);
    }

    if (answered && feedbackArea) {
      const isLast = stepIdx >= totalSteps - 1;
      const detailLine =
        rd.roundType === 'elapsed'
          ? (zh
              ? '出發 ' + formatClockTime(rd.hour, rd.minute) + ' ＋ ' + rd.elapsedMins + ' 分鐘 ＝ 到達 ' + rd.answerStr
              : 'Depart ' + formatClockTime(rd.hour, rd.minute) + ' + ' + rd.elapsedMins + ' mins = Arrive ' + rd.answerStr)
          : (zh ? '正確時間：' : 'True time: ') + rd.answerStr;

      feedbackArea.innerHTML =
        '<div class="feedback-banner" style="margin-top:0.85rem;">' +
          '<strong>🎉 ' + escHtml(randomPraise(lang)) + '</strong>' +
          '<div style="margin-top:0.35rem;font-size:0.94rem;font-weight:800;">' +
            escHtml(detailLine) +
          '</div>' +
          '<div style="margin-top:0.75rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="clkNextBtn">' +
              (isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')) +
            '</button>' +
          '</div>' +
        '</div>';

      const nextBtn = feedbackArea.querySelector('#clkNextBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stopSpeaking();
          if (isLast) {
            const stars = mistakes === 0 && hintsUsed <= 1 ? 3 : mistakes <= 2 ? 2 : 1;
            const pts = 95 + level * 15 + stars * 10;
            onComplete({ score: pts, stars: stars });
          } else {
            playSfx('switch', state.sound);
            stepIdx += 1;
            answered = false;
            hintText = '';
            eliminatedOpt = null;
            render();
          }
        });
      }
    }
  }

  render();
}
