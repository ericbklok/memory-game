/* Nintendo-inspired Visual Juice: Master Bo Character, Particle Bursts, Floating Score Pops, Combo HUD & Brain Radar */

let lastPointerX = 180;
let lastPointerY = 240;
let liveComboCount = 0;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  lastPointerX = Math.round(window.innerWidth / 2);
  lastPointerY = Math.round(window.innerHeight * 0.42);
  document.addEventListener(
    'pointerdown',
    function (e) {
      if (typeof e.clientX === 'number' && e.clientX > 0) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      }
    },
    { passive: true }
  );
}

export const MASTER_BO_QUIPS = {
  zh: [
    { mood: 'greet', text: '早晨呀！我係茶博士阿波 🫖 每日嘆四籠腦點心，記性同心算都越玩越精靈！' },
    { mood: 'happy', text: '貼士：慢慢玩唔使急，最緊要開心動腦筋！撳錯咗都唔緊要㗎 😊' },
    { mood: 'cheer', text: '試下「🎲 隨機抽一籠」，好似扭蛋咁揀款新點心玩下啦！' },
    { mood: 'proud', text: '無論喺香港定溫哥華，叫埋屋企人入「親友圈」一齊蓋印仔最熱鬧！' },
    { mood: 'think', text: '想練英文同靚成語？試下「📖 雅言詞匯館」，仲有真人發音朗讀添！' }
  ],
  en: [
    { mood: 'greet', text: "Hello! I'm Tea Master Bo 🫖 Enjoy 4 relaxing Brain Dim Sum dishes a day to stay sharp!" },
    { mood: 'happy', text: 'Pro tip: Take your time — zero timers, zero pressure, pure brain-tingling fun! 😊' },
    { mood: 'cheer', text: 'Feeling adventurous? Tap "🎲 Surprise Me!" to spin up a random game cartridge!' },
    { mood: 'proud', text: 'From Hong Kong to Vancouver, invite family into your Circle to compare stamps!' },
    { mood: 'think', text: 'Want to brush up on idioms & expressive words? Try Vocabulary Builder with audio!' }
  ]
};

export function resetComboStreak() {
  liveComboCount = 0;
  updateStageComboHud(0, 'greet');
}

export function getLiveComboCount() {
  return liveComboCount;
}

export function triggerComboJuice(type, lang) {
  if (type === 'correct') {
    liveComboCount += 1;
    const labelsZh = ['✨ 好嘢！', '🔥 連中 ×2！', '🌟 犀利 ×3！', '👑 超神 ×' + liveComboCount + '！'];
    const labelsEn = ['✨ Nice!', '🔥 Combo ×2!', '🌟 Super ×3!', '👑 Amazing ×' + liveComboCount + '!'];
    const idx = Math.min(3, liveComboCount - 1);
    const msg = lang === 'en' ? labelsEn[idx] : labelsZh[idx];
    const colors = ['#1B8566', '#E07A16', '#D63629', '#7B2CBF'];
    spawnFloatingPop(lastPointerX - 36, lastPointerY - 18, msg, colors[idx]);
    updateStageComboHud(liveComboCount, liveComboCount >= 3 ? 'cheer' : 'happy');
    return liveComboCount;
  }
  if (type === 'gentle') {
    liveComboCount = 0;
    updateStageComboHud(0, 'think');
  }
  return liveComboCount;
}

export function updateStageComboHud(combo, mood) {
  if (typeof document === 'undefined') return;
  const badge = document.getElementById('liveComboBadge');
  const boSlot = document.getElementById('stageMiniBo');
  if (boSlot) {
    boSlot.innerHTML = renderMasterBoSvg(mood || 'greet');
    boSlot.classList.remove('bo-pop');
    void boSlot.offsetWidth;
    boSlot.classList.add('bo-pop');
  }
  if (badge) {
    if (combo >= 2) {
      const isEn = document.documentElement.lang === 'en';
      badge.textContent = isEn ? '🔥 Combo ×' + combo : '🔥 連中 ×' + combo;
      badge.classList.remove('hidden', 'combo-bounce');
      void badge.offsetWidth;
      badge.classList.add('combo-bounce');
    } else {
      badge.classList.add('hidden');
    }
  }
}

export function renderMasterBoSvg(mood) {
  const m = mood || 'greet';
  // moods: 'greet' | 'happy' | 'cheer' | 'think' | 'proud'
  const eyes =
    m === 'happy' || m === 'cheer' || m === 'proud'
      ? `
        <path d="M44 54 Q50 47 56 54" stroke="#241B15" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <path d="M72 54 Q78 47 84 54" stroke="#241B15" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      `
      : m === 'think'
      ? `
        <circle cx="50" cy="52" r="3.6" fill="#241B15"/>
        <path d="M72 53 Q78 49 84 53" stroke="#241B15" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      `
      : `
        <circle class="bo-eye" cx="50" cy="53" r="4" fill="#241B15"/>
        <circle cx="51.4" cy="51.6" r="1.3" fill="#FFFFFF"/>
        <circle class="bo-eye" cx="78" cy="53" r="4" fill="#241B15"/>
        <circle cx="79.4" cy="51.6" r="1.3" fill="#FFFFFF"/>
      `;

  const mouth =
    m === 'cheer'
      ? `<path d="M55 66 Q64 78 73 66 Z" fill="#C8372D" stroke="#241B15" stroke-width="2.4"/>`
      : m === 'think'
      ? `<circle cx="65" cy="68" r="3.2" fill="#C8372D"/>`
      : `<path d="M56 65 Q64 73 72 65" stroke="#241B15" stroke-width="3" stroke-linecap="round" fill="none"/>`;

  return `
    <svg viewBox="0 0 128 128" class="master-bo-svg mood-${m}" aria-hidden="true">
      <circle cx="64" cy="64" r="58" fill="#FFD984" stroke="#2B2118" stroke-width="4"/>
      <circle cx="64" cy="64" r="52" fill="none" stroke="#FFF9EA" stroke-width="2.5" stroke-dasharray="6 5"/>

      <!-- Jade Tea-Master Vest -->
      <path d="M28 114 Q34 84 64 84 Q94 84 100 114" fill="#1D7A5F" stroke="#2B2118" stroke-width="3.8"/>
      <path d="M52 85 L64 102 L76 85" fill="#FFFDF7" stroke="#2B2118" stroke-width="3"/>
      <circle cx="64" cy="106" r="3.5" fill="#F4A623" stroke="#2B2118" stroke-width="2"/>

      <!-- Head & Ears -->
      <circle cx="33" cy="56" r="8" fill="#FFE0BD" stroke="#2B2118" stroke-width="3.4"/>
      <circle cx="95" cy="56" r="8" fill="#FFE0BD" stroke="#2B2118" stroke-width="3.4"/>
      <rect x="35" y="26" width="58" height="54" rx="27" fill="#FFE3C2" stroke="#2B2118" stroke-width="3.8"/>

      <!-- Cozy Dim Sum Master Cap -->
      <path d="M34 45 Q38 18 64 18 Q90 18 94 45 Q80 35 64 35 Q48 35 34 45 Z" fill="#C8372D" stroke="#2B2118" stroke-width="3.6"/>
      <circle cx="64" cy="16" r="6" fill="#F6B93B" stroke="#2B2118" stroke-width="3"/>

      <!-- Friendly Silver Eyebrows -->
      <path d="M43 42 Q50 38 56 41" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M72 41 Q78 38 85 42" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none"/>

      <!-- Rosy Cheeks -->
      <ellipse cx="44" cy="62" rx="5.5" ry="3.5" fill="#FF9A8B" opacity="0.72"/>
      <ellipse cx="84" cy="62" rx="5.5" ry="3.5" fill="#FF9A8B" opacity="0.72"/>

      <!-- Round Gold-Rim Glasses -->
      <circle cx="50" cy="53" r="10.5" fill="rgba(255,255,255,0.35)" stroke="#8A5412" stroke-width="2.8"/>
      <circle cx="78" cy="53" r="10.5" fill="rgba(255,255,255,0.35)" stroke="#8A5412" stroke-width="2.8"/>
      <line x1="60.5" y1="53" x2="67.5" y2="53" stroke="#8A5412" stroke-width="2.8"/>

      ${eyes}
      ${mouth}

      <!-- Steaming Porcelain Teacup -->
      <g class="bo-cup">
        <path d="M90 88 L112 88 L109 104 Q101 109 93 104 Z" fill="#FFFDF9" stroke="#2B2118" stroke-width="3"/>
        <path d="M96 82 Q98 76 95 72" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M104 81 Q106 75 103 70" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>
    </svg>
  `;
}

export function spawnFloatingPop(x, y, text, color) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.motion === 'calm') return;
  const el = document.createElement('div');
  el.className = 'nintendo-pop-badge';
  el.textContent = text;
  const safeX = Math.max(16, Math.min((window.innerWidth || 360) - 130, x));
  const safeY = Math.max(16, y);
  el.style.left = safeX + 'px';
  el.style.top = safeY + 'px';
  el.style.background = color || '#D63629';
  document.body.appendChild(el);
  setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 920);
}

export function spawnConfettiBurst(count) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.motion === 'calm') return;
  const total = count || 38;
  const colors = ['#E63946', '#F4A261', '#2A9D8F', '#F6BD60', '#457B9D', '#9B5DE5'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti-layer';
  document.body.appendChild(wrap);

  for (let i = 0; i < total; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-bit';
    const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.35;
    const dist = 90 + Math.random() * 200;
    const dx = Math.round(Math.cos(angle) * dist);
    const dy = Math.round(Math.sin(angle) * dist - 65);
    const rot = Math.round((Math.random() - 0.5) * 540);
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.setProperty('--rot', rot + 'deg');
    wrap.appendChild(p);
  }

  setTimeout(function () {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }, 1350);
}

/* Big Brain Academy Style 5-Spoke Brain Vitality Pentagon */
export function renderBrainRadarSvg(perGamePlays, lang) {
  const p = perGamePlays || {};
  const axes = [
    {
      zh: '記憶',
      en: 'Memory',
      val: Math.min(1, 0.28 + ((p.memory || 0) + (p.melody || 0) + (p.news || 0)) * 0.12)
    },
    {
      zh: '邏輯',
      en: 'Logic',
      val: Math.min(1, 0.28 + ((p.sudoku || 0) + (p.tenpai || 0) + (p.blocks || 0) + (p.shisen || 0)) * 0.1)
    },
    {
      zh: '心算',
      en: 'Math',
      val: Math.min(1, 0.28 + ((p.math || 0) + (p.make24 || 0)) * 0.14)
    },
    {
      zh: '語言',
      en: 'Verbal',
      val: Math.min(1, 0.28 + ((p.vocab || 0) + (p.words || 0) + (p.history || 0)) * 0.11)
    },
    {
      zh: '專注',
      en: 'Focus',
      val: Math.min(1, 0.28 + ((p.eagle || 0) + (p.stroop || 0) + (p.wordsearch || 0)) * 0.12)
    }
  ];

  const cx = 110;
  const cy = 108;
  const maxR = 62;

  function pt(idx, ratio) {
    const ang = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
    return [cx + Math.cos(ang) * maxR * ratio, cy + Math.sin(ang) * maxR * ratio];
  }

  const rings = [0.35, 0.68, 1.0]
    .map(function (r) {
      const pts = [0, 1, 2, 3, 4]
        .map(function (i) {
          return pt(i, r).join(',');
        })
        .join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="#D8C29D" stroke-width="1.6"/>';
    })
    .join('');

  const spokes = [0, 1, 2, 3, 4]
    .map(function (i) {
      const pair = pt(i, 1);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + pair[0] + '" y2="' + pair[1] + '" stroke="#D8C29D" stroke-width="1.5"/>';
    })
    .join('');

  const dataPts = axes
    .map(function (a, i) {
      return pt(i, a.val).join(',');
    })
    .join(' ');

  const dots = axes
    .map(function (a, i) {
      const pair = pt(i, a.val);
      return '<circle cx="' + pair[0] + '" cy="' + pair[1] + '" r="4.8" fill="#D93B30" stroke="#FFFFFF" stroke-width="2"/>';
    })
    .join('');

  const labels = axes
    .map(function (a, i) {
      const pair = pt(i, 1.32);
      const txt = lang === 'zh' ? a.zh : a.en;
      return (
        '<text x="' +
        pair[0] +
        '" y="' +
        (pair[1] + 4) +
        '" text-anchor="middle" font-size="12" font-weight="900" fill="#2B2118">' +
        txt +
        '</text>'
      );
    })
    .join('');

  return (
    '<svg viewBox="0 0 220 212" style="width:100%;max-width:215px;height:auto;display:block;margin:0 auto;">' +
    rings +
    spokes +
    '<polygon points="' +
    dataPts +
    '" fill="rgba(27, 133, 102, 0.30)" stroke="#1B8566" stroke-width="3.2"/>' +
    dots +
    labels +
    '</svg>'
  );
}

/* =========================================================================
   AGE-RELATIVE PERFORMANCE ESTIMATOR (BRAIN AGE / PEER BENCHMARKING)
   ========================================================================= */
export function evaluateAgePerformance(opts) {
  const rawAge = Number(opts && opts.age);
  const cleanAge = rawAge && rawAge >= 8 && rawAge <= 110 ? Math.round(rawAge) : 68;
  const lang = (opts && opts.lang) || 'zh';
  const zh = lang === 'zh';

  // Determine cohort bracket label
  let cohortLabel = '';
  if (cleanAge < 40) {
    cohortLabel = zh ? '40 歲以下組別' : 'Under-40 Group';
  } else if (cleanAge >= 90) {
    cohortLabel = zh ? '90+ 歲長青組' : '90+ Evergreen Group';
  } else {
    const low = Math.floor(cleanAge / 5) * 5;
    const high = low + 4;
    cohortLabel = zh ? low + '–' + high + ' 歲同齡組' : 'Ages ' + low + '–' + high + ' Peers';
  }

  // Use either explicit round score or average of recent rounds
  let scoreVal = typeof (opts && opts.score) === 'number' ? opts.score : null;
  let starsVal = typeof (opts && opts.stars) === 'number' ? opts.stars : 3;
  let levelVal = typeof (opts && opts.level) === 'number' ? opts.level : 1;

  const recent = opts && Array.isArray(opts.recentRounds) ? opts.recentRounds : [];
  if (scoreVal === null) {
    if (recent.length > 0) {
      let sumS = 0;
      let sumSt = 0;
      let sumLv = 0;
      for (let i = 0; i < recent.length; i++) {
        sumS += recent[i].score || 100;
        sumSt += recent[i].stars || 2;
        sumLv += typeof recent[i].level === 'number' ? recent[i].level : 1;
      }
      scoreVal = sumS / recent.length;
      starsVal = sumSt / recent.length;
      levelVal = sumLv / recent.length;
    } else {
      scoreVal = 108;
      starsVal = 3;
      levelVal = 1;
    }
  }

  // Age-calibrated reference median (older cohorts earn higher relative standing for equal raw scores)
  const peerMedian = Math.max(70, 106 - Math.max(0, cleanAge - 45) * 0.54);
  const diffBonus = levelVal >= 1.6 ? 12 : levelVal >= 0.8 ? 4 : 0;
  const starBonus = starsVal >= 2.7 ? 10 : starsVal >= 1.8 ? 3 : -3;
  const delta = scoreVal + diffBonus + starBonus - peerMedian;

  const logistic = 2 / (1 + Math.exp(-delta / 18)) - 1;
  const percentile = Math.max(55, Math.min(99, Math.round(60 + 39 * logistic)));
  const topPct = Math.max(1, 100 - percentile);

  const showVitalityAge = cleanAge >= 35;
  const yearsYounger = showVitalityAge ? Math.max(1, Math.min(18, Math.round((percentile - 50) * 0.35))) : 0;
  const vitalityAge = showVitalityAge ? Math.max(22, cleanAge - yearsYounger) : cleanAge;

  let badge = '';
  let comment = '';
  if (percentile >= 90) {
    badge = zh ? '👑 同齡頂尖級' : '👑 Top-Tier for Age';
    comment = zh
      ? '反應、準繩度與腦筋靈活度遠超同齡平均水平！'
      : 'Accuracy and mental agility are way ahead of your age cohort!';
  } else if (percentile >= 78) {
    badge = zh ? '🌟 非常醒神' : '🌟 Well Above Peers';
    comment = zh
      ? '表現相當亮眼，思考清晰又穩陣！'
      : 'Sharp, steady, and noticeably above average for your age group!';
  } else if (percentile >= 65) {
    badge = zh ? '✨ 表現優秀' : '✨ Above Average';
    comment = zh
      ? '發揮好穩定，繼續每日嘆茶動腦會更精靈！'
      : 'Solid performance — daily brain dim sum keeps you right on track!';
  } else {
    badge = zh ? '🫖 穩健熱身' : '🫖 Steady & Active';
    comment = zh
      ? '輕鬆熱身完成，狀態穩健！'
      : 'Great warm-up round — steady and active!';
  }

  return {
    age: cleanAge,
    cohortLabel: cohortLabel,
    percentile: percentile,
    topPct: topPct,
    showVitalityAge: showVitalityAge,
    vitalityAge: vitalityAge,
    yearsYounger: yearsYounger,
    badge: badge,
    comment: comment
  };
}

export function renderAgeComparisonCard(evalData, lang) {
  const zh = lang === 'zh';
  const vitHtml = evalData.showVitalityAge
    ? '<div class="vitality-age-pill">' +
      '⚡ ' +
      (zh
        ? '腦力活力年齡：<strong>' + evalData.vitalityAge + ' 歲</strong>（比實際年齡年輕 ' + evalData.yearsYounger + ' 年！）'
        : 'Brain Vitality Age: <strong>' + evalData.vitalityAge + '</strong> (' + evalData.yearsYounger + ' yrs younger!)') +
      '</div>'
    : '<div class="vitality-age-pill">⚡ ' +
      (zh ? '黃金腦力敏捷狀態（同齡前 ' + evalData.topPct + '%）' : 'Peak Agility Zone (Top ' + evalData.topPct + '% of peers)') +
      '</div>';

  return (
    '<div class="age-bench-card">' +
    '<div class="age-bench-top">' +
    '<span class="age-cohort-tag">🎂 ' +
    evalData.cohortLabel +
    '</span>' +
    '<span class="age-grade-tag">' +
    evalData.badge +
    '</span>' +
    '</div>' +
    '<div class="age-pct-headline">' +
    (zh
      ? '超越約 <strong>' + evalData.percentile + '%</strong> 同齡茶友（位列前 ' + evalData.topPct + '%）'
      : 'Ahead of ~<strong>' + evalData.percentile + '%</strong> of peers your age (Top ' + evalData.topPct + '%)') +
    '</div>' +
    '<div class="age-meter-track" aria-hidden="true">' +
    '<div class="age-meter-fill" style="width:' +
    evalData.percentile +
    '%;"></div>' +
    '</div>' +
    '<div class="age-meter-scale">' +
    '<span>' +
    (zh ? '同齡基準' : 'Peer Avg') +
    '</span>' +
    '<span>' +
    (zh ? '你嘅表現 ▲' : 'You ▲') +
    '</span>' +
    '<span>' +
    (zh ? '同齡頂尖' : 'Top 1%') +
    '</span>' +
    '</div>' +
    vitHtml +
    '<div style="font-size:0.82rem;color:var(--ink-muted);margin-top:0.35rem;font-weight:700;">' +
    evalData.comment +
    '</div>' +
    '</div>'
  );
}
