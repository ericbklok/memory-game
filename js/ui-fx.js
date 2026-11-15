/* Nintendo-inspired Visual Juice: Lucky Cat Mochi 3D Mascot, Particle Bursts, Floating Score Pops, Combo HUD & Brain Radar */
import { notifyStageBaoBo } from './mascot-3d.js';

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
    { mood: 'greet', text: '早晨喵～！我係三色招財茶貓阿喵 🐾 每日嘆四籠腦點心，記性同心算都越玩越精靈！' },
    { mood: 'happy', text: '貓貓貼士：慢慢玩唔使急，最緊要開心動腦筋！撳錯咗都唔緊要㗎 😊' },
    { mood: 'cheer', text: '試下「🎲 扭蛋抽關」，等阿喵搖隻招財肉球幫你抽款新點心玩下啦！' },
    { mood: 'proud', text: '無論喺香港定溫哥華，叫埋屋企人入「親友圈」一齊蓋印仔最熱鬧喵！' },
    { mood: 'think', text: '想練英文同靚成語？試下「📖 雅言詞匯館」，仲有真人發音朗讀添！' }
  ],
  en: [
    { mood: 'greet', text: "Meow~! I'm Mochi the Calico Lucky Cat 🐾 Enjoy 4 Brain Dim Sum dishes a day to stay sharp!" },
    { mood: 'happy', text: 'Cat tip: Take your time — zero timers, zero pressure, pure brain-tingling fun! 😊' },
    { mood: 'cheer', text: 'Feeling adventurous? Tap "🎲 Gacha Spin" and let my lucky paw pick a random game!' },
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
    notifyStageBaoBo('correct', lang, liveComboCount);
    return liveComboCount;
  }
  if (type === 'gentle') {
    liveComboCount = 0;
    updateStageComboHud(0, 'think');
    notifyStageBaoBo('gentle', lang, 0);
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
  const eyes =
    m === 'happy' || m === 'cheer' || m === 'proud'
      ? `
        <path d="M44 57 Q50 50 56 57" stroke="#241B15" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <path d="M72 57 Q78 50 84 57" stroke="#241B15" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      `
      : `
        <ellipse cx="50" cy="56" rx="5.5" ry="6.5" fill="#1B9E75" stroke="#241B15" stroke-width="2"/>
        <ellipse cx="50" cy="56" rx="3" ry="4.8" fill="#241B15"/>
        <circle cx="52" cy="53.8" r="1.6" fill="#FFFFFF"/>
        <ellipse cx="78" cy="56" rx="5.5" ry="6.5" fill="#1B9E75" stroke="#241B15" stroke-width="2"/>
        <ellipse cx="78" cy="56" rx="3" ry="4.8" fill="#241B15"/>
        <circle cx="80" cy="53.8" r="1.6" fill="#FFFFFF"/>
      `;

  return `
    <svg viewBox="0 0 128 128" class="master-bo-svg mood-${m}" aria-hidden="true">
      <circle cx="64" cy="64" r="58" fill="#FFD984" stroke="#2B2118" stroke-width="4"/>
      <!-- Tri-Color Calico Cat Body & Collar -->
      <path d="M32 114 Q38 84 64 84 Q90 84 96 114" fill="#FFFDF7" stroke="#2B2118" stroke-width="3.8"/>
      <ellipse cx="46" cy="103" rx="9" ry="7" fill="#33241F"/>
      <ellipse cx="81" cy="100" rx="10" ry="7.5" fill="#FA9832"/>
      <rect x="44" y="83" width="40" height="7" rx="3.5" fill="#DC2B2B" stroke="#2B2118" stroke-width="2.4"/>
      <circle cx="64" cy="90" r="6" fill="#FFD034" stroke="#2B2118" stroke-width="2.4"/>
      <!-- Asymmetric Calico Cat Ears (Left Espresso, Right Ginger) -->
      <polygon points="36,46 28,18 52,32" fill="#33241F" stroke="#2B2118" stroke-width="3.6" stroke-linejoin="round"/>
      <polygon points="38,42 33,25 48,34" fill="#FF94A8"/>
      <polygon points="92,46 100,18 76,32" fill="#FA9832" stroke="#2B2118" stroke-width="3.6" stroke-linejoin="round"/>
      <polygon points="90,42 95,25 80,34" fill="#FF94A8"/>
      <!-- Snow-Cream Calico Head & Brow Patches -->
      <defs><clipPath id="calicoHeadClip"><ellipse cx="64" cy="58" rx="34" ry="28"/></clipPath></defs>
      <ellipse cx="64" cy="58" rx="34" ry="28" fill="#FFFDF7"/>
      <g clip-path="url(#calicoHeadClip)">
        <ellipse cx="41" cy="36" rx="19" ry="13" fill="#33241F"/>
        <ellipse cx="87" cy="36" rx="19" ry="13" fill="#FA9832"/>
      </g>
      <ellipse cx="64" cy="58" rx="34" ry="28" fill="none" stroke="#2B2118" stroke-width="3.8"/>
      <!-- Whiskers -->
      <line x1="22" y1="58" x2="36" y2="60" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="22" y1="65" x2="36" y2="64" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="106" y1="58" x2="92" y2="60" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="106" y1="65" x2="92" y2="64" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Blush + White Muzzle + Pink Nose -->
      <ellipse cx="41" cy="65" rx="5.5" ry="3.5" fill="#FF8FA0" opacity="0.78"/>
      <ellipse cx="87" cy="65" rx="5.5" ry="3.5" fill="#FF8FA0" opacity="0.78"/>
      <circle cx="58" cy="67" r="6.8" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>
      <circle cx="70" cy="67" r="6.8" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>
      <ellipse cx="64" cy="62" rx="4.5" ry="3.2" fill="#FA6B84" stroke="#2B2118" stroke-width="2"/>
      ${eyes}
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
