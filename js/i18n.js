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
    quickPickTitle: '自選六大健腦點心',
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
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'tap' || type === 'flip') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'flip' ? 420 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  } else if (type === 'correct') {
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.16, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  } else if (type === 'gentle') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.16);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  } else if (type === 'stamp') {
    // Crisp wooden tea-house chop thud + celebratory chime!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.13);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    [587.33, 783.99, 1046.5].forEach((freq, idx) => {
      const bell = ctx.createOscillator();
      const bGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, now + 0.12 + idx * 0.08);
      bGain.gain.setValueAtTime(0.16, now + 0.12 + idx * 0.08);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + idx * 0.08 + 0.35);
      bell.connect(bGain).connect(ctx.destination);
      bell.start(now + 0.12 + idx * 0.08);
      bell.stop(now + 0.12 + idx * 0.08 + 0.36);
    });
  }
}

/* Native Cantonese (zh-HK) & English Read-Aloud */
export function speakText(text, lang) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices() || [];

  if (lang === 'zh') {
    utter.lang = 'zh-HK';
    const hkVoice =
      voices.find(v => /zh[-_]?HK|yue|cantonese/i.test(v.lang + ' ' + v.name)) ||
      voices.find(v => /zh[-_]?TW|zh/i.test(v.lang));
    if (hkVoice) utter.voice = hkVoice;
    utter.rate = 0.92;
  } else {
    utter.lang = 'en-US';
    const enVoice = voices.find(v => /^en[-_](CA|GB|US)/i.test(v.lang));
    if (enVoice) utter.voice = enVoice;
    utter.rate = 0.94;
  }

  window.speechSynthesis.speak(utter);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
