import { triggerComboJuice } from './ui-fx.js';

export const UI_STRINGS = {
  zh: {
    appTitle: '每日腦點心',
    appSubtitle: 'Daily MindSum · 港×溫早茶',
    navHome: '今日早茶',
    navGames: '自選點心',
    navBoard: '龍虎榜',
    navAlbum: '珍藏圖鑑',
    morningGreet: '早晨！飲啖靚茶，動下腦筋啦！',
    afternoonGreet: '午安！嚟幾籠腦點心醒下神啦！',
    eveningGreet: '晚安！輕鬆玩兩局，腦筋更靈活！',
    streakUnit: '日連續',
    teapotShield: '保溫壺',
    pointsUnit: '分',
    slipTitle: '📋 今日四道腦點心紙',
    slipDoneCount: '已蓋印',
    stampChop: '頂點',
    startDailyBtn: '🥢 上菜！開始今日四道腦點心',
    continueDailyBtn: '🥢 繼續上菜（下一道腦點心）',
    bonusSteamerBtn: '✨ 今日集齊印仔！再來一籠加餸',
    shareFamilyBtn: '📲 分享今日點心紙畀屋企人',
    inviteBtn: '📨 邀請親友一齊玩',
    quickPickTitle: '自選廿六款健腦點心',
    freePlaySub: '隨時揀一款最啱心水嘅遊戲練習，唔限次數！',
    lvlEasy: '輕鬆',
    lvlMed: '標準',
    lvlHard: '挑戰',
    backHome: '← 返回茶樓',
    listenCantonese: '🔊 廣東話朗讀',
    stopListening: '⏹ 停止朗讀',
    hintBtn: '💡 貼士',
    nextQuestion: '下一題 →',
    finishDish: '蓋印收碟！🎉',
    playAgain: '再來一籠 🔄',
    praiseList: [
      '好嘢！眼明手快！👏',
      '犀利呀！腦筋超靈活！🌟',
      '答得好準！果然見多識廣！🫖',
      '勁呀！心算同記性都一流！🀄',
      '精靈醒目！頂點表現！🎉'
    ],
    gentleRetry: '差少少咋！睇清楚啲，再試多一次啦 😊',
    guestLabel: '本地茶客',
    signInGoogle: '🔐 用 Google 帳號登入（同步全球龍虎榜）',
    signOut: '登出雲端帳號',
    rankTitles: [
      { min: 0, zh: '新晉茶客', en: 'Tea Novice' },
      { min: 300, zh: '醒神茶友', en: 'Sharp Sipper' },
      { min: 800, zh: '品茗達人', en: 'Tea Connoisseur' },
      { min: 1600, zh: '點心狀元', en: 'Dim Sum Scholar' },
      { min: 3000, zh: '港溫茶王', en: 'HK-YVR Grandmaster' }
    ]
  },
  en: {
    appTitle: 'Daily MindSum',
    appSubtitle: '每日腦點心 · HK × Vancouver',
    navHome: 'Morning Tea',
    navGames: 'All Games',
    navBoard: 'Leaderboard',
    navAlbum: 'Tea Album',
    morningGreet: 'Good morning! Time for tea & brain dim sum!',
    afternoonGreet: 'Good afternoon! Ready for a quick mental refresh?',
    eveningGreet: 'Good evening! Unwind with a relaxing puzzle round!',
    streakUnit: 'Day Streak',
    teapotShield: 'Shields',
    pointsUnit: 'pts',
    slipTitle: "📋 Today's 4-Dish Stamp Card",
    slipDoneCount: 'Stamped',
    stampChop: 'TOP',
    startDailyBtn: "🥢 Serve Today's 4 Brain Dishes",
    continueDailyBtn: '🥢 Continue Next Daily Dish',
    bonusSteamerBtn: '✨ All 4 Stamped! Play a Bonus Steamer',
    shareFamilyBtn: "📲 Share Today's Card with Family",
    inviteBtn: '📨 Invite Friends & Family',
    quickPickTitle: 'Choose Any Brain Exercise',
    freePlaySub: 'Practice your favorites anytime — unlimited rounds, zero stress!',
    lvlEasy: 'Relaxed',
    lvlMed: 'Standard',
    lvlHard: 'Challenge',
    backHome: '← Back Home',
    listenCantonese: '🔊 Read Aloud',
    stopListening: '⏹ Stop Audio',
    hintBtn: '💡 Hint',
    nextQuestion: 'Next →',
    finishDish: 'Stamp My Card! 🎉',
    playAgain: 'One More Round 🔄',
    praiseList: [
      'Wonderful! Sharp eyes & sharp mind! 👏',
      'Fantastic work! Right on the mark! 🌟',
      'Spot on! Impressive recall! 🫖',
      'Brilliant! Smooth & steady! 🀄',
      'Top-tier MindSum master! 🎉'
    ],
    gentleRetry: 'Almost! Take another look — you have got this 😊',
    guestLabel: 'Local Player',
    signInGoogle: '🔐 Sign in with Google (Join Global Leaderboard)',
    signOut: 'Sign Out',
    rankTitles: [
      { min: 0, zh: '新晉茶客', en: 'Tea Novice' },
      { min: 300, zh: '醒神茶友', en: 'Sharp Sipper' },
      { min: 800, zh: '品茗達人', en: 'Tea Connoisseur' },
      { min: 1600, zh: '點心狀元', en: 'Dim Sum Scholar' },
      { min: 3000, zh: '港溫茶王', en: 'HK-YVR Grandmaster' }
    ]
  }
};

export function t(lang, key) {
  return (UI_STRINGS[lang] && UI_STRINGS[lang][key]) || UI_STRINGS.zh[key] || key;
}

export function pickText(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.zh || obj.en || '';
}

export function getRankTitle(points, lang) {
  const list = UI_STRINGS[lang].rankTitles;
  let current = list[0];
  for (const r of list) {
    if (points >= r.min) current = r;
  }
  return current[lang];
}

export function randomPraise(lang) {
  const arr = UI_STRINGS[lang].praiseList;
  return arr[Math.floor(Math.random() * arr.length)];
}

/* Synthesized Tactile Audio (Zero external MP3 dependency!) */
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSfx(type, soundEnabled = true) {
  const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  const combo = triggerComboJuice(type, isEn ? 'en' : 'zh');

  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'switch' || type === 'roulette') {
    // Crisp Nintendo Switch Joy-Con click-clack!
    const f1 = type === 'roulette' ? 880 : 1040;
    const f2 = type === 'roulette' ? 1180 : 1560;
    [f1, f2].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.028);
      gain.gain.setValueAtTime(0.14, now + idx * 0.028);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.028 + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.028);
      osc.stop(now + idx * 0.028 + 0.05);
    });
  } else if (type === 'tap' || type === 'flip') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'flip' ? 440 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.055);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.068);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.072);
  } else if (type === 'correct') {
    // Rising-pitch Nintendo combo chime (shifts up 1 semitone per combo up to +6!)
    const semitoneBoost = Math.pow(2, Math.min(6, Math.max(0, combo - 1)) / 12);
    [523.25, 659.25, 783.99, 1046.5].slice(0, combo >= 2 ? 4 : 3).forEach((baseFreq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq * semitoneBoost, now + idx * 0.062);
      gain.gain.setValueAtTime(0.17, now + idx * 0.062);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.062 + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.062);
      osc.stop(now + idx * 0.062 + 0.25);
    });
  } else if (type === 'gentle') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(265, now + 0.15);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'stamp' || type === 'fanfare') {
    // Crisp wooden tea-house chop thud + Nintendo Big Brain Academy stage-clear fanfare!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.13);
    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    const fanfare = [
      { f: 523.25, t: 0.10, d: 0.14 },
      { f: 659.25, t: 0.19, d: 0.14 },
      { f: 783.99, t: 0.28, d: 0.14 },
      { f: 1046.5, t: 0.39, d: 0.45 }
    ];
    fanfare.forEach(note => {
      const bell = ctx.createOscillator();
      const bGain = ctx.createGain();
      bell.type = 'triangle';
      bell.frequency.setValueAtTime(note.f, now + note.t);
      bGain.gain.setValueAtTime(0.18, now + note.t);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      bell.connect(bGain).connect(ctx.destination);
      bell.start(now + note.t);
      bell.stop(now + note.t + note.d + 0.02);
    });
  } else if (type === 'meow') {
    // Melodic Nintendo Lucky Cat "Mee-ow~" chirp + golden Suzu collar bell tinkle!
    const meowOsc = ctx.createOscillator();
    const meowGain = ctx.createGain();
    meowOsc.type = 'triangle';
    meowOsc.frequency.setValueAtTime(560, now);
    meowOsc.frequency.exponentialRampToValueAtTime(880, now + 0.085);
    meowOsc.frequency.exponentialRampToValueAtTime(630, now + 0.24);
    meowGain.gain.setValueAtTime(0.01, now);
    meowGain.gain.linearRampToValueAtTime(0.16, now + 0.03);
    meowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    meowOsc.connect(meowGain).connect(ctx.destination);
    meowOsc.start(now);
    meowOsc.stop(now + 0.28);

    [2349.3, 2793.8].forEach((bf, bIdx) => {
      const suzu = ctx.createOscillator();
      const sGain = ctx.createGain();
      suzu.type = 'sine';
      suzu.frequency.setValueAtTime(bf, now + 0.02 + bIdx * 0.045);
      sGain.gain.setValueAtTime(0.06, now + 0.02 + bIdx * 0.045);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11 + bIdx * 0.045);
      suzu.connect(sGain).connect(ctx.destination);
      suzu.start(now + 0.02 + bIdx * 0.045);
      suzu.stop(now + 0.12 + bIdx * 0.045);
    });
  }
}

export function playPentatonicNote(noteIdx, soundEnabled = true) {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  // C5, D5, E5, G5, A5, C6 (Traditional Chinese Pentatonic 宮 商 角 徵 羽 宮')
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const freq = scale[noteIdx % scale.length];
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.44);
}

/* Native Cantonese (zh-HK) & English Read-Aloud (honors user speechRate preference) */
export function speakText(text, lang, rateOverride) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices() || [];

  const prefMode =
    rateOverride ||
    (typeof document !== 'undefined' && document.documentElement.dataset.speechRate) ||
    'normal';
  const speedNum = prefMode === 'slow' ? 0.76 : prefMode === 'fast' ? 1.06 : 0.92;

  if (lang === 'zh') {
    utter.lang = 'zh-HK';
    const hkVoice =
      voices.find(v => /zh[-_]?HK|yue|cantonese/i.test(v.lang + ' ' + v.name)) ||
      voices.find(v => /zh[-_]?TW|zh/i.test(v.lang));
    if (hkVoice) utter.voice = hkVoice;
    utter.rate = speedNum;
  } else {
    utter.lang = 'en-US';
    const enVoice = voices.find(v => /^en[-_](CA|GB|US)/i.test(v.lang));
    if (enVoice) utter.voice = enVoice;
    utter.rate = speedNum + 0.02;
  }

  window.speechSynthesis.speak(utter);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
