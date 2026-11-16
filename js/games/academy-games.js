import { GAME_CATALOG } from '../data/content.js';
import { drawFreshItems, hasSeenSignature, markSeenSignature } from '../data/seed-tracker.js';
import { renderStageHeader } from './engine.js';
import { t, pickText, randomPraise, playSfx, speakText, stopSpeaking } from '../i18n.js';
import { notifyStageBaoBo } from '../mascot-3d.js';

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

function getGameMeta(gameId, fallbackIcon, zhTitle, enTitle) {
  const found = GAME_CATALOG.find(function (g) {
    return g.id === gameId;
  });
  if (found) return found;
  return {
    id: gameId,
    icon: fallbackIcon,
    title: { zh: zhTitle, en: enTitle }
  };
}

function getSavedLevel(state, gameId) {
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

/* =========================================================================
   1. TRAIL GAME (🧭 港溫梅花間竹連線 · Alternating Stepping Stones)
   ========================================================================= */

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'];
const LATIN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function generateTrailBoard(state, stoneCount) {
  const W = 340;
  const H = 250;
  const padX = 34;
  const padY = 34;
  const minDist = 57;

  let chosenPoints = null;
  let chosenSig = '';

  for (let boardTry = 0; boardTry < 40; boardTry++) {
    let pts = null;

    // Pure dart-throwing pass first
    for (let dartPass = 0; dartPass < 50; dartPass++) {
      const cand = [];
      let guard = 0;
      while (cand.length < stoneCount && guard < 360) {
        guard += 1;
        const x = Math.round(padX + Math.random() * (W - padX * 2));
        const y = Math.round(padY + Math.random() * (H - padY * 2));
        let ok = true;
        for (let k = 0; k < cand.length; k++) {
          if (Math.hypot(x - cand[k].x, y - cand[k].y) < minDist) {
            ok = false;
            break;
          }
        }
        if (ok) cand.push({ x: x, y: y });
      }
      if (cand.length === stoneCount) {
        pts = cand;
        break;
      }
    }

    // Fallback jittered lattice if 12-stone dart pass got crowded
    if (!pts) {
      const lattice = [];
      const cols = [40, 100, 160, 220, 285];
      const rows = [42, 104, 166, 214];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length; c++) {
          const shiftX = r % 2 === 1 ? 14 : -6;
          const jx = Math.max(32, Math.min(308, cols[c] + shiftX + Math.round((Math.random() - 0.5) * 8)));
          const jy = Math.max(32, Math.min(218, rows[r] + Math.round((Math.random() - 0.5) * 6)));
          lattice.push({ x: jx, y: jy });
        }
      }
      const picked = [];
      const pool = shuffleList(lattice);
      for (let i = 0; i < pool.length && picked.length < stoneCount; i++) {
        let valid = true;
        for (let m = 0; m < picked.length; m++) {
          if (Math.hypot(pool[i].x - picked[m].x, pool[i].y - picked[m].y) < 56) {
            valid = false;
            break;
          }
        }
        if (valid) picked.push(pool[i]);
      }
      pts = picked;
    }

    const sig =
      stoneCount +
      ':' +
      pts
        .map(function (p) {
          return Math.round(p.x / 18) + '_' + Math.round(p.y / 18);
        })
        .join('-');

    chosenPoints = pts;
    chosenSig = sig;
    if (!hasSeenSignature(state, 'trail_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'trail_sigs', chosenSig, 400);
  return chosenPoints;
}

export function mountTrailGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getSavedLevel(state, 'trail');
  const gameMeta = getGameMeta('trail', '🧭', '港溫梅花間竹連線', 'Alternating Stepping Stones');

  const totalSteps = 2;
  const stoneCount = level === 0 ? 8 : level === 1 ? 10 : 12;
  const boards = [
    generateTrailBoard(state, stoneCount),
    generateTrailBoard(state, stoneCount)
  ];

  let boardIdx = 0;
  let visitedCount = 0;
  let useStemsInZh = true;
  let hintIdx = -1;
  let wrongFlashIdx = -1;
  let wrongTimer = null;
  let totalMisses = 0;
  let totalHints = 0;

  function getStoneLabel(idx) {
    const pairNum = Math.floor(idx / 2);
    if (idx % 2 === 0) {
      return String(pairNum + 1);
    }
    if (zh && useStemsInZh) {
      return HEAVENLY_STEMS[pairNum];
    }
    return LATIN_LETTERS[pairNum];
  }

  function buildSequenceBannerHtml() {
    const parts = [];
    for (let i = 0; i < stoneCount; i++) {
      const done = i < visitedCount;
      const isNext = i === visitedCount;
      const bg = done ? '#1d7a5f' : isNext ? '#fff3cd' : '#f5efe6';
      const fg = done ? '#ffffff' : isNext ? '#8a5300' : '#5e5044';
      const bdr = done ? '#145a46' : isNext ? '#e09f24' : '#d8cbb8';
      parts.push(
        '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 6px;border-radius:999px;font-weight:800;font-size:0.86rem;background:' +
          bg +
          ';color:' +
          fg +
          ';border:1.5px solid ' +
          bdr +
          ';">' +
          escHtml(getStoneLabel(i)) +
        '</span>'
      );
      if (i < stoneCount - 1) {
        parts.push('<span style="color:#9a8875;font-size:0.8rem;margin:0 1px;">→</span>');
      }
    }
    return parts.join('');
  }

  function buildCourtyardSvgInner() {
    const pts = boards[boardIdx];
    const svg = [];

    // Courtyard background: warm tea-garden moss, bamboo border & koi corner
    svg.push(
      '<defs>' +
        '<linearGradient id="trailGardenBg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#eef5eb" />' +
          '<stop offset="55%" stop-color="#e5efe2" />' +
          '<stop offset="100%" stop-color="#dceada" />' +
        '</linearGradient>' +
        '<radialGradient id="trailPondGrad" cx="88%" cy="15%" r="32%">' +
          '<stop offset="0%" stop-color="#bfe5e8" stop-opacity="0.85" />' +
          '<stop offset="75%" stop-color="#d2ecea" stop-opacity="0.45" />' +
          '<stop offset="100%" stop-color="#dceada" stop-opacity="0" />' +
        '</radialGradient>' +
      '</defs>' +
      '<rect x="0" y="0" width="340" height="250" rx="16" fill="url(#trailGardenBg)" />' +
      '<rect x="5" y="5" width="330" height="240" rx="13" fill="none" stroke="#b9cfb3" stroke-width="2" stroke-dasharray="6 5" />' +
      '<ellipse cx="298" cy="36" rx="52" ry="34" fill="url(#trailPondGrad)" />' +
      '<circle cx="18" cy="22" r="10" fill="#89b882" opacity="0.35" />' +
      '<circle cx="32" cy="15" r="7" fill="#6ca368" opacity="0.3" />' +
      '<circle cx="318" cy="232" r="11" fill="#89b882" opacity="0.35" />' +
      '<circle cx="302" cy="238" r="7" fill="#6ca368" opacity="0.3" />'
    );

    // Subtle garden pebbles
    const pebbles = [
      [48, 228], [122, 20], [210, 234], [268, 22], [24, 132], [322, 118]
    ];
    for (let p = 0; p < pebbles.length; p++) {
      svg.push(
        '<circle cx="' + pebbles[p][0] + '" cy="' + pebbles[p][1] + '" r="3.2" fill="#b7c6b1" opacity="0.65" />'
      );
    }

    // Connected jade path segments for visited stones
    for (let i = 1; i < visitedCount; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      svg.push(
        '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#a3e4cb" stroke-width="10" stroke-linecap="round" opacity="0.65" />' +
        '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#1d7a5f" stroke-width="4.5" stroke-linecap="round" />'
      );
    }

    // Stepping stones
    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      const isDone = i < visitedCount;
      const isHint = hintIdx === i && !isDone;
      const isWrong = wrongFlashIdx === i && !isDone;
      const isTrackTwo = i % 2 === 1;
      const lbl = getStoneLabel(i);

      let fill = isTrackTwo ? '#fffaf0' : '#ffffff';
      let stroke = isTrackTwo ? '#b97a3d' : '#4a6b5d';
      let textFill = isTrackTwo ? '#7c4615' : '#1f3b30';

      if (isDone) {
        fill = '#1d7a5f';
        stroke = '#0f4d3a';
        textFill = '#ffffff';
      } else if (isWrong) {
        fill = '#ffe8cc';
        stroke = '#d96b1f';
        textFill = '#9a3c00';
      } else if (isHint) {
        fill = '#fff6cc';
        stroke = '#e09b00';
        textFill = '#6e4700';
      }

      svg.push('<g class="trail-stone-node" data-idx="' + i + '" style="cursor:pointer;">');
      // Transparent generous touch target
      svg.push('<circle cx="' + pt.x + '" cy="' + pt.y + '" r="27" fill="transparent" />');

      if (isHint) {
        svg.push(
          '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="26" fill="none" stroke="#f5b400" stroke-width="3.2" stroke-dasharray="5 3" />' +
          '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="29.5" fill="none" stroke="#ffd54f" stroke-width="2" opacity="0.75" />'
        );
      }
      if (isWrong) {
        svg.push(
          '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="25.5" fill="none" stroke="#e67e22" stroke-width="3" />'
        );
      }

      // Drop shadow + stone body + inner bevel
      svg.push(
        '<circle cx="' + pt.x + '" cy="' + (pt.y + 2.5) + '" r="21" fill="rgba(30,45,35,0.16)" />' +
        '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="21" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2.8" />' +
        '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="17" fill="none" stroke="' + (isDone ? 'rgba(255,255,255,0.32)' : 'rgba(120,110,95,0.18)') + '" stroke-width="1.2" />' +
        '<text x="' + pt.x + '" y="' + (pt.y + 6) + '" text-anchor="middle" font-size="16.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="' + textFill + '">' +
          escHtml(lbl) +
        '</text>'
      );

      if (isDone && i === visitedCount - 1) {
        svg.push(
          '<text x="' + (pt.x + 14) + '" y="' + (pt.y - 12) + '" text-anchor="middle" font-size="12">🐾</text>'
        );
      }

      svg.push('</g>');
    }

    return svg.join('');
  }

  function wireStoneEvents() {
    const svgEl = container.querySelector('#trailGardenSvg');
    if (!svgEl) return;
    const nodes = svgEl.querySelectorAll('.trail-stone-node');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener('click', function (ev) {
        ev.stopPropagation();
        const idx = Number(this.getAttribute('data-idx'));
        handleStoneTap(idx);
      });
    }
  }

  function refreshDynamicTrailUi() {
    const seqEl = container.querySelector('#trailSeqBanner');
    if (seqEl) seqEl.innerHTML = buildSequenceBannerHtml();

    const progEl = container.querySelector('#trailProgressPill');
    if (progEl) {
      progEl.textContent = zh
        ? '已連 ' + visitedCount + ' / ' + stoneCount + ' 步'
        : 'Stepped ' + visitedCount + ' / ' + stoneCount;
    }

    const svgEl = container.querySelector('#trailGardenSvg');
    if (svgEl) {
      svgEl.innerHTML = buildCourtyardSvgInner();
      wireStoneEvents();
    }

    const doneArea = container.querySelector('#trailDoneArea');
    if (doneArea) {
      if (visitedCount >= stoneCount) {
        const isLast = boardIdx >= totalSteps - 1;
        doneArea.innerHTML =
          '<div class="feedback-banner" style="margin-top:0.85rem;">' +
            '<div style="font-weight:800;font-size:1.05rem;">' +
              escHtml(randomPraise(lang)) +
              ' ' +
              (zh
                ? '梅花間竹一步唔差行完茶園石徑！'
                : 'You connected every alternating stepping stone cleanly!') +
            '</div>' +
            '<div style="margin-top:0.65rem;">' +
              '<button type="button" class="btn btn-jade btn-full" id="trailNextBoardBtn">' +
                (isLast
                  ? t(lang, 'finishDish')
                  : zh
                  ? '前往下一座茶園（第 2 / 2 局）→'
                  : 'Next Tea Courtyard (2 of 2) →') +
              '</button>' +
            '</div>' +
          '</div>';

        const nextBtn = doneArea.querySelector('#trailNextBoardBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            stopSpeaking();
            if (wrongTimer) clearTimeout(wrongTimer);
            if (isLast) {
              const stars =
                totalMisses <= 2 && totalHints <= 1
                  ? 3
                  : totalMisses <= 6 && totalHints <= 3
                  ? 2
                  : 1;
              const score = 95 + level * 15 + stars * 10;
              onComplete({ score: score, stars: stars });
            } else {
              playSfx('switch', state.sound);
              boardIdx += 1;
              visitedCount = 0;
              hintIdx = -1;
              wrongFlashIdx = -1;
              renderBoard();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          });
        }
      } else {
        doneArea.innerHTML = '';
      }
    }
  }

  function handleStoneTap(idx) {
    if (visitedCount >= stoneCount) return;

    if (idx < visitedCount) {
      playSfx('tap', state.sound);
      const nextLbl = getStoneLabel(visitedCount);
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '🐾 呢塊石頭已經踩穩喇～下一步請搵「' + nextLbl + '」喵！'
          : '🐾 Already stepped there~ Look for "' + nextLbl + '" next, meow!'
      );
      return;
    }

    if (idx === visitedCount) {
      visitedCount += 1;
      if (hintIdx === idx) hintIdx = -1;
      wrongFlashIdx = -1;

      if (visitedCount >= stoneCount) {
        playSfx('correct', state.sound);
        notifyStageBaoBo(
          'correct',
          lang,
          2,
          zh
            ? '🎉 喵嗚～全條梅花間竹翡翠石徑連通晒！阿喵跟住你過埋對岸嘆靚茶！'
            : '🎉 Purr-fect! Every alternating stone is linked in jade — Mochi hopped right across with you!'
        );
      } else {
        playSfx('tap', state.sound);
        const nextLbl = getStoneLabel(visitedCount);
        if (visitedCount === 1 || visitedCount % 3 === 0) {
          notifyStageBaoBo(
            'correct',
            lang,
            1,
            zh
              ? '✨ 踩得穩！跟住輪到「' + nextLbl + '」喵～'
              : '✨ Smooth step! Next up is "' + nextLbl + '", meow~'
          );
        }
      }
      refreshDynamicTrailUi();
      return;
    }

    // Wrong future stone tapped
    totalMisses += 1;
    wrongFlashIdx = idx;
    playSfx('gentle', state.sound);
    const expectedLbl = getStoneLabel(visitedCount);
    notifyStageBaoBo(
      'gentle',
      lang,
      0,
      zh
        ? '🐾 慢著喵～梅花間竹要一數一字交替，而家先搵「' + expectedLbl + '」啦！'
        : '🐾 Hold on, meow~ Alternate number & letter — tap "' + expectedLbl + '" next!'
    );
    refreshDynamicTrailUi();

    if (wrongTimer) clearTimeout(wrongTimer);
    wrongTimer = setTimeout(function () {
      wrongFlashIdx = -1;
      refreshDynamicTrailUi();
    }, 560);
  }

  function triggerHint() {
    if (visitedCount >= stoneCount) return;
    if (hintIdx !== visitedCount) {
      totalHints += 1;
    }
    hintIdx = visitedCount;
    playSfx('switch', state.sound);
    const expectedLbl = getStoneLabel(visitedCount);
    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '💡 阿喵肉球指路：金圈閃緊嗰塊「' + expectedLbl + '」就係下一步喵！'
        : '💡 Mochi Paw Tip: The golden ring around "' + expectedLbl + '" is your next stone!'
    );
    refreshDynamicTrailUi();
  }

  function renderBoard() {
    container.innerHTML = '';

    const topRightHtml =
      '<button type="button" class="chip-btn" id="trailTopHintBtn">' +
        t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (lv) {
        if (wrongTimer) clearTimeout(wrongTimer);
        onLevelChange(lv);
      },
      onBack: function () {
        if (wrongTimer) clearTimeout(wrongTimer);
        onBack();
      },
      stepIndex: boardIdx,
      totalSteps: totalSteps,
      extraRightHtml: topRightHtml
    });

    const topHintBtn = container.querySelector('#trailTopHintBtn');
    if (topHintBtn) {
      topHintBtn.addEventListener('click', triggerHint);
    }

    const modeBtnHtml = zh
      ? '<button type="button" class="chip-btn" id="trailToggleStemBtn">' +
          (useStemsInZh ? '🔤 轉用 1-A-2-B' : '🀄 轉用 1-甲-2-乙') +
        '</button>'
      : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.65rem;">' +
        '<div>' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (boardIdx + 1) + ' / ' + totalSteps + ' 座茶園' : 'Courtyard ' + (boardIdx + 1) + ' of ' + totalSteps) +
          '</span>' +
          '<div class="prompt-title" style="margin-top:0.25rem;">' +
            (zh ? '🧭 按「一數、一干支／字母」交替順序輕撳踏腳石' : '🧭 Tap the stepping stones in alternating Number → Letter order') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">' +
          '<span id="trailProgressPill" style="font-weight:800;font-size:0.88rem;color:#1d7a5f;background:#e6f6ef;padding:0.28rem 0.65rem;border-radius:999px;">' +
            (zh ? '已連 ' + visitedCount + ' / ' + stoneCount + ' 步' : 'Stepped ' + visitedCount + ' / ' + stoneCount) +
          '</span>' +
          modeBtnHtml +
          '<button type="button" class="chip-btn" id="trailCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="prompt-box" style="padding:0.6rem 0.75rem;margin-bottom:0.75rem;">' +
        '<div style="font-size:0.84rem;font-weight:700;color:#6b5b4b;margin-bottom:0.35rem;">' +
          (zh ? '📋 梅花間竹連線次序（黃圈代表下一步）：' : '📋 Alternating Trail Order (highlighted badge is next):') +
        '</div>' +
        '<div id="trailSeqBanner" style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;">' +
          buildSequenceBannerHtml() +
        '</div>' +
      '</div>' +
      '<div style="width:100%;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(32,54,42,0.1);border:2px solid #c5d9bf;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" id="trailGardenSvg" style="display:block;width:100%;height:auto;touch-action:manipulation;user-select:none;">' +
          buildCourtyardSvgInner() +
        '</svg>' +
      '</div>' +
      '<div id="trailDoneArea"></div>';

    container.appendChild(card);

    const cardHintBtn = card.querySelector('#trailCardHintBtn');
    if (cardHintBtn) cardHintBtn.addEventListener('click', triggerHint);

    const stemBtn = card.querySelector('#trailToggleStemBtn');
    if (stemBtn) {
      stemBtn.addEventListener('click', function () {
        useStemsInZh = !useStemsInZh;
        playSfx('switch', state.sound);
        stemBtn.textContent = useStemsInZh ? '🔤 轉用 1-A-2-B' : '🀄 轉用 1-甲-2-乙';
        refreshDynamicTrailUi();
      });
    }

    wireStoneEvents();

    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '🐾 阿喵帶路行茶園！由「1」開始，跟住「1 → ' + getStoneLabel(1) + ' → 2 → ' + getStoneLabel(3) + '…」梅花間竹踩過去喵～'
        : '🐾 Follow Mochi across the tea garden! Tap 1 → A → 2 → B in alternating order, meow~'
    );
  }

  renderBoard();
}

/* =========================================================================
   2. TANGRAM / SHAPE SHIFT GAME (🧩 七巧板拼影坊 · Rotated Silhouette Fit)
   ========================================================================= */

// 28 mathematically verified 4x4 connected polyomino shapes:
// Every shape has 4 distinct rotations AND a strictly distinct chiral mirror!
const TANGRAM_SHAPES = [
  // 5-cell chiral shapes (5)
  { id: 'tg01', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]], nameZh: '茶壺嘴塊', nameEn: 'Teapot Spout' },
  { id: 'tg02', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1]], nameZh: '長柄竹杓', nameEn: 'Bamboo Ladle' },
  { id: 'tg03', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]], nameZh: '小帆船桅', nameEn: 'Junk Mast' },
  { id: 'tg04', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]], nameZh: '閃電曲尺', nameEn: 'Step Zigzag' },
  { id: 'tg05', cells: [[0, 0], [1, 0], [1, 1], [2, 1], [1, 2]], nameZh: '風車葉片', nameEn: 'Pinwheel Fin' },
  // 6-cell chiral shapes (14)
  { id: 'tg06', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1]], nameZh: '點心木托', nameEn: 'Dim Sum Tray' },
  { id: 'tg07', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [1, 2]], nameZh: '獅子繡球', nameEn: 'Lion Crest' },
  { id: 'tg08', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2]], nameZh: '雕花轉角', nameEn: 'Carved Corner' },
  { id: 'tg09', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2]], nameZh: '茶几拱門', nameEn: 'Tea Arch' },
  { id: 'tg10', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1]], nameZh: '雙齒木梳', nameEn: 'Wooden Comb' },
  { id: 'tg11', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [3, 1]], nameZh: '海鷗展翼', nameEn: 'Harbour Gull' },
  { id: 'tg12', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [2, 2]], nameZh: '雲梯石階', nameEn: 'Terrace Step' },
  { id: 'tg13', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [1, 2]], nameZh: '船錨木栓', nameEn: 'Ferry Anchor' },
  { id: 'tg14', cells: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [2, 2]], nameZh: '如意玉鈎', nameEn: 'Jade Ruyi' },
  { id: 'tg15', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [2, 2]], nameZh: '飛燕剪影', nameEn: 'Swallow Tail' },
  { id: 'tg16', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [3, 2]], nameZh: '曲橋折廊', nameEn: 'Bridge Bend' },
  { id: 'tg17', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2]], nameZh: '龍舟翹尾', nameEn: 'Dragon Stern' },
  { id: 'tg18', cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]], nameZh: '招財貓爪', nameEn: 'Lucky Paw' },
  { id: 'tg19', cells: [[0, 0], [1, 0], [1, 1], [2, 1], [1, 2], [1, 3]], nameZh: '蘭花枝幹', nameEn: 'Orchid Stem' },
  // 7-cell chiral shapes (9)
  { id: 'tg20', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [0, 2]], nameZh: '博古書架', nameEn: 'Curio Ledge' },
  { id: 'tg21', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2]], nameZh: '厚切西多', nameEn: 'Toast Corner' },
  { id: 'tg22', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]], nameZh: '渡輪甲板', nameEn: 'Ferry Deck' },
  { id: 'tg23', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [1, 2]], nameZh: '茶樓旗幌', nameEn: 'Banner Pennant' },
  { id: 'tg24', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [3, 1]], nameZh: '屏風底座', nameEn: 'Screen Base' },
  { id: 'tg25', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [1, 2], [2, 2]], nameZh: '祥雲階梯', nameEn: 'Cloud Stairs' },
  { id: 'tg26', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [1, 2], [1, 3]], nameZh: '古琴鳳額', nameEn: 'Zither Head' },
  { id: 'tg27', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1], [0, 2]], nameZh: '窗花格柵', nameEn: 'Lattice Frame' },
  { id: 'tg28', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [1, 2]], nameZh: '月門迴廊', nameEn: 'Moon Gate' }
];

function normPolyCells(cells) {
  let minX = Infinity;
  let minY = Infinity;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i][0] < minX) minX = cells[i][0];
    if (cells[i][1] < minY) minY = cells[i][1];
  }
  const shifted = cells.map(function (c) {
    return [c[0] - minX, c[1] - minY];
  });
  shifted.sort(function (a, b) {
    return a[1] - b[1] || a[0] - b[0];
  });
  return shifted;
}

function polyKey(cells) {
  return normPolyCells(cells)
    .map(function (c) {
      return c[0] + ',' + c[1];
    })
    .join('|');
}

function rotPoly90(cells) {
  return normPolyCells(
    cells.map(function (c) {
      return [-c[1], c[0]];
    })
  );
}

function rotPolyK(cells, k) {
  let cur = normPolyCells(cells);
  const turns = ((k % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) {
    cur = rotPoly90(cur);
  }
  return cur;
}

function mirrorPolyX(cells) {
  return normPolyCells(
    cells.map(function (c) {
      return [-c[0], c[1]];
    })
  );
}

function getRotationSetKeys(cells) {
  const keys = [];
  for (let k = 0; k < 4; k++) {
    keys.push(polyKey(rotPolyK(cells, k)));
  }
  return keys;
}

function sameUnder2DRotation(cellsA, cellsB) {
  const target = polyKey(cellsA);
  const rotsB = getRotationSetKeys(cellsB);
  return rotsB.indexOf(target) !== -1;
}

function renderPolyominoSvg(cells, mode, sizePx) {
  const norm = normPolyCells(cells);
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < norm.length; i++) {
    if (norm[i][0] > maxX) maxX = norm[i][0];
    if (norm[i][1] > maxY) maxY = norm[i][1];
  }
  const cols = maxX + 1;
  const rows = maxY + 1;
  const gridN = 4;
  const cellSz = 26;
  const pad = 14;
  const boxW = gridN * cellSz + pad * 2;
  const boxH = gridN * cellSz + pad * 2;

  const offsetX = pad + ((gridN - cols) * cellSz) / 2;
  const offsetY = pad + ((gridN - rows) * cellSz) / 2;

  const parts = [];
  if (mode === 'tray' || mode === 'traySolved') {
    parts.push(
      '<rect x="0" y="0" width="' + boxW + '" height="' + boxH + '" rx="14" fill="#3b2314" stroke="#8a5a36" stroke-width="3" />' +
      '<rect x="6" y="6" width="' + (boxW - 12) + '" height="' + (boxH - 12) + '" rx="10" fill="none" stroke="#603b22" stroke-width="1.2" stroke-dasharray="4 3" />'
    );
    // Subtle reference grid lines
    for (let g = 0; g <= gridN; g++) {
      const gx = pad + g * cellSz;
      const gy = pad + g * cellSz;
      parts.push(
        '<line x1="' + gx + '" y1="' + pad + '" x2="' + gx + '" y2="' + (pad + gridN * cellSz) + '" stroke="rgba(255,220,175,0.09)" stroke-width="1" />' +
        '<line x1="' + pad + '" y1="' + gy + '" x2="' + (pad + gridN * cellSz) + '" y2="' + gy + '" stroke="rgba(255,220,175,0.09)" stroke-width="1" />'
      );
    }
    for (let i = 0; i < norm.length; i++) {
      const cx = offsetX + norm[i][0] * cellSz;
      const cy = offsetY + norm[i][1] * cellSz;
      if (mode === 'traySolved') {
        parts.push(
          '<rect x="' + (cx + 1) + '" y="' + (cy + 1) + '" width="' + (cellSz - 2) + '" height="' + (cellSz - 2) + '" rx="4" fill="#229672" stroke="#b6f5dc" stroke-width="1.8" />' +
          '<rect x="' + (cx + 4) + '" y="' + (cy + 4) + '" width="' + (cellSz - 8) + '" height="' + (cellSz - 8) + '" rx="2" fill="rgba(255,255,255,0.22)" />'
        );
      } else {
        parts.push(
          '<rect x="' + (cx + 0.8) + '" y="' + (cy + 0.8) + '" width="' + (cellSz - 1.6) + '" height="' + (cellSz - 1.6) + '" rx="3.5" fill="#170c06" stroke="#d49b57" stroke-width="1.5" />' +
          '<rect x="' + (cx + 3.5) + '" y="' + (cy + 3.5) + '" width="' + (cellSz - 7) + '" height="' + (cellSz - 7) + '" rx="2" fill="#23130a" opacity="0.7" />'
        );
      }
    }
  } else {
    // Candidate wood-jade tile card
    parts.push(
      '<rect x="0" y="0" width="' + boxW + '" height="' + boxH + '" rx="12" fill="#faf4ea" stroke="#dfd2be" stroke-width="1.5" />'
    );
    for (let g = 0; g <= gridN; g++) {
      const gx = pad + g * cellSz;
      const gy = pad + g * cellSz;
      parts.push(
        '<line x1="' + gx + '" y1="' + pad + '" x2="' + gx + '" y2="' + (pad + gridN * cellSz) + '" stroke="rgba(140,115,85,0.12)" stroke-width="1" />' +
        '<line x1="' + pad + '" y1="' + gy + '" x2="' + (pad + gridN * cellSz) + '" y2="' + gy + '" stroke="rgba(140,115,85,0.12)" stroke-width="1" />'
      );
    }
    for (let i = 0; i < norm.length; i++) {
      const cx = offsetX + norm[i][0] * cellSz;
      const cy = offsetY + norm[i][1] * cellSz;
      const fill = mode === 'correctCard' ? '#1d7a5f' : '#c9823b';
      const inner = mode === 'correctCard' ? '#36a584' : '#dfa05b';
      const bdr = mode === 'correctCard' ? '#0e4c3a' : '#7c4819';
      parts.push(
        '<rect x="' + (cx + 1) + '" y="' + (cy + 2.2) + '" width="' + (cellSz - 2) + '" height="' + (cellSz - 2) + '" rx="4" fill="rgba(50,30,10,0.16)" />' +
        '<rect x="' + (cx + 1) + '" y="' + (cy + 1) + '" width="' + (cellSz - 2) + '" height="' + (cellSz - 2) + '" rx="4" fill="' + fill + '" stroke="' + bdr + '" stroke-width="1.7" />' +
        '<rect x="' + (cx + 4) + '" y="' + (cy + 4) + '" width="' + (cellSz - 8) + '" height="' + (cellSz - 8) + '" rx="2" fill="' + inner + '" opacity="0.55" />'
      );
    }
  }

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    boxW +
    ' ' +
    boxH +
    '" style="width:' +
    sizePx +
    'px;height:' +
    sizePx +
    'px;display:block;margin:0 auto;">' +
    parts.join('') +
    '</svg>'
  );
}

function buildTangramRounds(state, level, count) {
  const preferredPool = TANGRAM_SHAPES.filter(function (s) {
    if (level === 0) return s.cells.length <= 6;
    if (level === 2) return s.cells.length >= 6;
    return true;
  });

  const rounds = [];
  const usedIds = {};

  for (let r = 0; r < count; r++) {
    let chosenRound = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const avail = preferredPool.filter(function (s) {
        return !usedIds[s.id];
      });
      const basePool = avail.length > 0 ? avail : TANGRAM_SHAPES;
      const shape = basePool[Math.floor(Math.random() * basePool.length)];
      const targetRot = 1 + Math.floor(Math.random() * 3); // 1 (90°), 2 (180°), or 3 (270°)
      const sig = shape.id + '_r' + targetRot;

      const correctCells = rotPolyK(shape.cells, 0);
      const silhouetteCells = rotPolyK(shape.cells, targetRot);

      // Decoy 1: Chiral mirror image (rotated on medium/hard to make flipping trap genuinely engaging!)
      const mirrorRot = level === 0 ? 0 : Math.floor(Math.random() * 4);
      const mirrorCells = rotPolyK(mirrorPolyX(shape.cells), mirrorRot);

      // Decoys 2 & 3: Same cell-count shapes verified NOT equal to shape under ANY 2D rotation
      const sameSizePeers = shuffleList(
        TANGRAM_SHAPES.filter(function (other) {
          return (
            other.id !== shape.id &&
            other.cells.length === shape.cells.length &&
            !sameUnder2DRotation(other.cells, shape.cells) &&
            !sameUnder2DRotation(other.cells, mirrorCells)
          );
        })
      );

      if (sameSizePeers.length < 2) continue;

      const d2Rot = Math.floor(Math.random() * 4);
      const d3Rot = Math.floor(Math.random() * 4);
      const decoy2 = rotPolyK(sameSizePeers[0].cells, d2Rot);
      const decoy3 = rotPolyK(sameSizePeers[1].cells, d3Rot);

      // Double-check programmatically that NONE of the 3 decoys equals S under any 2D rotation!
      if (
        sameUnder2DRotation(mirrorCells, correctCells) ||
        sameUnder2DRotation(decoy2, correctCells) ||
        sameUnder2DRotation(decoy3, correctCells)
      ) {
        continue;
      }

      const options = shuffleList([
        { kind: 'correct', cells: correctCells, isMirror: false },
        { kind: 'mirror', cells: mirrorCells, isMirror: true },
        { kind: 'decoyA', cells: decoy2, isMirror: false },
        { kind: 'decoyB', cells: decoy3, isMirror: false }
      ]);

      chosenRound = {
        sig: sig,
        shape: shape,
        targetRot: targetRot,
        silhouetteCells: silhouetteCells,
        options: options
      };

      if (!hasSeenSignature(state, 'tangram_sigs', sig)) {
        break;
      }
    }

    if (chosenRound) {
      usedIds[chosenRound.shape.id] = true;
      markSeenSignature(state, 'tangram_sigs', chosenRound.sig, 400);
      rounds.push(chosenRound);
    }
  }
  return rounds;
}

export function mountTangramGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getSavedLevel(state, 'tangram');
  const gameMeta = getGameMeta('tangram', '🧩', '七巧板拼影坊', 'Rotated Silhouette Fit');

  const totalSteps = 3;
  const rounds = buildTangramRounds(state, level, totalSteps);

  let stepIdx = 0;
  let solved = false;
  let eliminatedMap = {};
  let wrongMap = {};
  let totalMisses = 0;
  let totalHints = 0;

  function getAngleLabel(rot) {
    const deg = rot * 90;
    if (rot === 1) return zh ? '順時針轉 90°' : '90° clockwise';
    if (rot === 2) return zh ? '旋轉 180°（上下倒轉）' : '180° half-turn';
    return zh ? '逆時針轉 90°（順時針 270°）' : '90° counter-clockwise (270°)';
  }

  function triggerHint() {
    if (solved) return;
    const round = rounds[stepIdx];
    // Prefer eliminating the mirror trap or another uneliminated decoy
    let targetIdx = -1;
    for (let i = 0; i < round.options.length; i++) {
      if (round.options[i].isMirror && !eliminatedMap[i] && !wrongMap[i]) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) {
      for (let i = 0; i < round.options.length; i++) {
        if (round.options[i].kind !== 'correct' && !eliminatedMap[i] && !wrongMap[i]) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx !== -1) {
      eliminatedMap[targetIdx] = true;
      totalHints += 1;
    }
    playSfx('switch', state.sound);
    const rotDesc = getAngleLabel(round.targetRot);
    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '💡 阿喵撥走咗一塊陷阱板！試下喺腦入面將木塊「' + rotDesc + '」對準凹槽喵～'
        : '💡 Mochi swept away a tricky decoy! Try rotating the right tile ' + rotDesc + ' in your head~'
    );
    renderRound();
  }

  function renderRound() {
    container.innerHTML = '';
    const round = rounds[stepIdx];
    const letters = ['A', 'B', 'C', 'D'];

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: onLevelChange,
      onBack: onBack,
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml:
        '<button type="button" class="chip-btn" id="tangramTopHintBtn">' +
        t(lang, 'hintBtn') +
        '</button>'
    });

    const topHint = container.querySelector('#tangramTopHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    let cardsHtml = '';
    for (let i = 0; i < round.options.length; i++) {
      const opt = round.options[i];
      const isElim = Boolean(eliminatedMap[i]);
      const isWrong = Boolean(wrongMap[i]);
      const isCorrectDone = solved && opt.kind === 'correct';
      const disabledAttr = solved || isElim || isWrong ? 'disabled' : '';

      let borderCol = '#d8cbb8';
      let bgCol = '#fffdf9';
      let opacity = '1';
      let statusBadge = '';

      if (isCorrectDone) {
        borderCol = '#1d7a5f';
        bgCol = '#eafaf3';
        statusBadge = '<span style="color:#1d7a5f;font-weight:800;font-size:0.82rem;">✓ ' + (zh ? '完美契合' : 'Exact Fit!') + '</span>';
      } else if (isElim) {
        opacity = '0.38';
        statusBadge = '<span style="color:#8b7b6b;font-size:0.78rem;">🐾 ' + (zh ? '已排除' : 'Eliminated') + '</span>';
      } else if (isWrong) {
        opacity = '0.48';
        borderCol = '#d9822b';
        statusBadge =
          '<span style="color:#b35608;font-size:0.78rem;">' +
          (opt.isMirror
            ? zh ? '↔ 左右翻轉咗' : '↔ Flipped mirror'
            : zh ? '✕ 形狀唔同' : '✕ Wrong shape') +
          '</span>';
      }

      cardsHtml +=
        '<button type="button" class="tangram-opt-card" data-idx="' +
        i +
        '" ' +
        disabledAttr +
        ' style="display:flex;flex-direction:column;align-items:center;padding:0.65rem;border-radius:14px;border:2.5px solid ' +
        borderCol +
        ';background:' +
        bgCol +
        ';opacity:' +
        opacity +
        ';cursor:' +
        (disabledAttr ? 'default' : 'pointer') +
        ';transition:transform 0.16s ease,border-color 0.16s ease;">' +
          '<div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:#efe6d8;color:#4e3b29;font-weight:800;font-size:0.82rem;">' +
              letters[i] +
            '</span>' +
            statusBadge +
          '</div>' +
          renderPolyominoSvg(opt.cells, isCorrectDone ? 'correctCard' : 'card', 112) +
        '</button>';
    }

    const isLast = stepIdx >= totalSteps - 1;
    const doneHtml = solved
      ? '<div class="feedback-banner" style="margin-top:0.9rem;">' +
          '<div style="font-weight:800;font-size:1.04rem;">' +
            escHtml(randomPraise(lang)) +
            ' ' +
            (zh
              ? '「' + escHtml(round.shape.nameZh) + '」' + getAngleLabel(round.targetRot) + '後完美嵌入茶盤！'
              : '"' + escHtml(round.shape.nameEn) + '" rotated ' + getAngleLabel(round.targetRot) + ' fits right into the tea tray!') +
          '</div>' +
          '<div style="margin-top:0.65rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="tangramNextBtn">' +
              (isLast
                ? t(lang, 'finishDish')
                : zh
                ? '下一塊七巧木板（第 ' + (stepIdx + 2) + ' / ' + totalSteps + ' 題）→'
                : 'Next Silhouette (' + (stepIdx + 2) + ' of ' + totalSteps + ') →') +
            '</button>' +
          '</div>' +
        '</div>'
      : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">' +
        '<div>' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 題 · ' + escHtml(round.shape.nameZh) : 'Round ' + (stepIdx + 1) + ' of ' + totalSteps + ' · ' + escHtml(round.shape.nameEn)) +
          '</span>' +
          '<div class="prompt-title" style="margin-top:0.25rem;">' +
            (zh ? '🧩 邊一塊木板只靠平面旋轉，就可以嵌入下面嘅紅木茶盤凹槽？' : '🧩 Which wooden tile fits into the dark tea-tray cutout when rotated?') +
          '</div>' +
        '</div>' +
        '<button type="button" class="chip-btn" id="tangramCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
      '</div>' +
      '<div class="prompt-box" style="display:flex;flex-direction:column;align-items:center;padding:0.85rem;margin-bottom:0.85rem;background:linear-gradient(180deg,#f9f3e8,#f2e8d7);">' +
        '<div style="font-size:0.86rem;font-weight:800;color:#7c4716;margin-bottom:0.5rem;text-align:center;">' +
          (zh ? '🔄 順／逆時針平面旋轉 · 🚫 不可左右翻轉！' : '🔄 Rotate in your mind — 🚫 No flipping allowed!') +
        '</div>' +
        renderPolyominoSvg(round.silhouetteCells, solved ? 'traySolved' : 'tray', 146) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.7rem;">' +
        cardsHtml +
      '</div>' +
      doneHtml;

    container.appendChild(card);

    const cardHint = card.querySelector('#tangramCardHintBtn');
    if (cardHint) cardHint.addEventListener('click', triggerHint);

    const optBtns = card.querySelectorAll('.tangram-opt-card');
    for (let i = 0; i < optBtns.length; i++) {
      optBtns[i].addEventListener('click', function () {
        if (solved) return;
        const idx = Number(this.getAttribute('data-idx'));
        const picked = round.options[idx];
        if (!picked || eliminatedMap[idx] || wrongMap[idx]) return;

        if (picked.kind === 'correct') {
          solved = true;
          playSfx('correct', state.sound);
          notifyStageBaoBo(
            'correct',
            lang,
            stepIdx + 1,
            zh
              ? '🎉 咔嗒一聲啱啱好！阿喵用貓爪一轉就將「' + round.shape.nameZh + '」嵌穩入紅木盤喇喵！'
              : '🎉 Click! Mochi spun "' + round.shape.nameEn + '" with her paws and slotted it right in!'
          );
          renderRound();
        } else {
          totalMisses += 1;
          wrongMap[idx] = true;
          playSfx('gentle', state.sound);
          notifyStageBaoBo(
            'gentle',
            lang,
            0,
            picked.isMirror
              ? zh
                ? '🐾 呢塊係左右鏡像翻轉咗嘅陷阱板嚟㗎！唔反轉係嵌唔入㗎，再望下其餘木塊喵～'
                : '🐾 Tricky mirror-flipped piece! It cannot fit without flipping — check the remaining tiles~'
              : zh
              ? '🐾 數真啲格仔嘅彎位方向，試下另一塊木板啦喵～'
              : '🐾 Check the corner hook direction closely and try another tile, meow~'
          );
          renderRound();
        }
      });
    }

    const nextBtn = card.querySelector('#tangramNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopSpeaking();
        if (isLast) {
          const stars =
            totalMisses <= 1 && totalHints <= 1
              ? 3
              : totalMisses <= 4 && totalHints <= 2
              ? 2
              : 1;
          const score = 95 + level * 15 + stars * 10;
          onComplete({ score: score, stars: stars });
        } else {
          playSfx('switch', state.sound);
          stepIdx += 1;
          solved = false;
          eliminatedMap = {};
          wrongMap = {};
          renderRound();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  renderRound();
  notifyStageBaoBo(
    'intro',
    lang,
    0,
    zh
      ? '🐾 阿喵擺好紅木七巧盤喇！喺腦入面轉下下面四塊木板，揀出唔使反轉就嵌得入凹槽嗰塊喵～'
      : '🐾 Mochi set out the rosewood tray! Mentally rotate the 4 wood tiles to find the one that fits without flipping~'
  );
}

/* =========================================================================
   3. SPOTLIGHT GAME (🔦 夜探霓虹剪影 · Mochi's Flashlight Peek)
   ========================================================================= */

// 68 distinct recognizable items across 6 themed categories
const SPOTLIGHT_BANK = [
  // Transport & Landmarks (12)
  { id: 'sp01', icon: '🚕', zh: '紅色的士', en: 'HK Red Taxi', cat: 'transport', bgHue: 355 },
  { id: 'sp02', icon: '⛴️', zh: '天星小輪', en: 'Star Ferry', cat: 'transport', bgHue: 162 },
  { id: 'sp03', icon: '🚋', zh: '雙層叮叮電車', en: 'Ding-Ding Tram', cat: 'transport', bgHue: 145 },
  { id: 'sp04', icon: '🐉', zh: '端午龍舟', en: 'Dragon Boat', cat: 'transport', bgHue: 18 },
  { id: 'sp05', icon: '⛵', zh: '維港帆船', en: 'Harbour Sailboat', cat: 'transport', bgHue: 205 },
  { id: 'sp06', icon: '🚝', zh: '溫哥華架空列車', en: 'Vancouver SkyTrain', cat: 'transport', bgHue: 215 },
  { id: 'sp07', icon: '🚠', zh: '昂坪纜車', en: 'Cable Car Gondola', cat: 'transport', bgHue: 192 },
  { id: 'sp08', icon: '🚲', zh: '海濱單車', en: 'Seawall Bicycle', cat: 'transport', bgHue: 130 },
  { id: 'sp09', icon: '🗼', zh: '海岸燈塔', en: 'Coastal Lighthouse', cat: 'transport', bgHue: 12 },
  { id: 'sp10', icon: '🎈', zh: '彩色熱氣球', en: 'Hot Air Balloon', cat: 'transport', bgHue: 332 },
  { id: 'sp11', icon: '✈️', zh: '跨洋客機', en: 'Passenger Airplane', cat: 'transport', bgHue: 210 },
  { id: 'sp12', icon: '🚂', zh: '復古蒸汽火車', en: 'Steam Locomotive', cat: 'transport', bgHue: 28 },

  // Dim Sum & Tea Treats (12)
  { id: 'sp13', icon: '🍍', zh: '金黃菠蘿包', en: 'Pineapple Bun', cat: 'dimsum', bgHue: 38 },
  { id: 'sp14', icon: '🥧', zh: '酥皮蛋撻', en: 'Fresh Egg Tart', cat: 'dimsum', bgHue: 44 },
  { id: 'sp15', icon: '🫖', zh: '紫砂茶壺', en: 'Clay Teapot', cat: 'dimsum', bgHue: 22 },
  { id: 'sp16', icon: '🥟', zh: '晶瑩蝦餃', en: 'Shrimp Har Gow', cat: 'dimsum', bgHue: 34 },
  { id: 'sp17', icon: '🥮', zh: '蓮蓉月餅', en: 'Lotus Mooncake', cat: 'dimsum', bgHue: 30 },
  { id: 'sp18', icon: '🍜', zh: '鮮蝦雲吞麵', en: 'Wonton Noodles', cat: 'dimsum', bgHue: 48 },
  { id: 'sp19', icon: '🧋', zh: '港式絲襪奶茶', en: 'HK Milk Tea', cat: 'dimsum', bgHue: 26 },
  { id: 'sp20', icon: '🧇', zh: '街頭格仔餅', en: 'Crispy Waffle', cat: 'dimsum', bgHue: 36 },
  { id: 'sp21', icon: '🍮', zh: '香滑芒果布甸', en: 'Mango Pudding', cat: 'dimsum', bgHue: 46 },
  { id: 'sp22', icon: '🍗', zh: '蜜汁燒鵝髀', en: 'Roast Drumstick', cat: 'dimsum', bgHue: 16 },
  { id: 'sp23', icon: '🍧', zh: '紅豆刨冰', en: 'Shaved Ice Bowl', cat: 'dimsum', bgHue: 342 },
  { id: 'sp24', icon: '🍊', zh: '賀年大桔', en: 'Sweet Mandarin', cat: 'dimsum', bgHue: 29 },

  // Cultural & Cozy Objects (11)
  { id: 'sp25', icon: '🐱', zh: '招財茶貓', en: 'Lucky Tea Cat', cat: 'culture', bgHue: 40 },
  { id: 'sp26', icon: '🀄', zh: '紅中麻雀牌', en: 'Red Dragon Tile', cat: 'culture', bgHue: 352 },
  { id: 'sp27', icon: '🦁', zh: '醒獅獅頭', en: 'Lion Dance Head', cat: 'culture', bgHue: 8 },
  { id: 'sp28', icon: '🏮', zh: '大紅喜慶燈籠', en: 'Red Paper Lantern', cat: 'culture', bgHue: 4 },
  { id: 'sp29', icon: '🪭', zh: '絲綢摺扇', en: 'Silk Folding Fan', cat: 'culture', bgHue: 325 },
  { id: 'sp30', icon: '🧮', zh: '木製算盤', en: 'Wooden Abacus', cat: 'culture', bgHue: 32 },
  { id: 'sp31', icon: '📷', zh: '懷舊菲林相機', en: 'Retro Camera', cat: 'culture', bgHue: 200 },
  { id: 'sp32', icon: '☂️', zh: '江南油紙傘', en: 'Blossom Umbrella', cat: 'culture', bgHue: 282 },
  { id: 'sp33', icon: '🎐', zh: '玻璃風鈴', en: 'Glass Wind Chime', cat: 'culture', bgHue: 188 },
  { id: 'sp34', icon: '🧭', zh: '航海指南針', en: 'Brass Compass', cat: 'culture', bgHue: 42 },
  { id: 'sp35', icon: '🧧', zh: '燙金紅封包', en: 'Red Lai See Packet', cat: 'culture', bgHue: 356 },

  // Nature & Botanicals (11)
  { id: 'sp36', icon: '🌺', zh: '艷麗扶桑花', en: 'Hibiscus Blossom', cat: 'nature', bgHue: 338 },
  { id: 'sp37', icon: '🍁', zh: '加拿大紅楓葉', en: 'Canadian Maple Leaf', cat: 'nature', bgHue: 10 },
  { id: 'sp38', icon: '🪷', zh: '清雅荷花', en: 'Pink Lotus Flower', cat: 'nature', bgHue: 320 },
  { id: 'sp39', icon: '🎋', zh: '翠綠修竹', en: 'Green Bamboo', cat: 'nature', bgHue: 135 },
  { id: 'sp40', icon: '🪴', zh: '迎客松盆景', en: 'Potted Bonsai', cat: 'nature', bgHue: 118 },
  { id: 'sp41', icon: '🌻', zh: '向日葵花朵', en: 'Bright Sunflower', cat: 'nature', bgHue: 50 },
  { id: 'sp42', icon: '🌸', zh: '粉紅櫻花', en: 'Cherry Blossom', cat: 'nature', bgHue: 334 },
  { id: 'sp43', icon: '🍄', zh: '森林紅蘑菇', en: 'Spotted Mushroom', cat: 'nature', bgHue: 6 },
  { id: 'sp44', icon: '🌙', zh: '彎彎新月', en: 'Crescent Moon', cat: 'nature', bgHue: 235 },
  { id: 'sp45', icon: '🌈', zh: '雨後彩虹', en: 'Vivid Rainbow', cat: 'nature', bgHue: 198 },
  { id: 'sp46', icon: '🌴', zh: '海灘椰子樹', en: 'Coastal Palm Tree', cat: 'nature', bgHue: 152 },

  // Beloved Animals (11)
  { id: 'sp47', icon: '🐼', zh: '國寶大熊貓', en: 'Giant Panda', cat: 'animals', bgHue: 140 },
  { id: 'sp48', icon: '🦉', zh: '森林貓頭鷹', en: 'Wise Forest Owl', cat: 'animals', bgHue: 28 },
  { id: 'sp49', icon: '🦀', zh: '避風塘大紅蟹', en: 'Harbour Red Crab', cat: 'animals', bgHue: 12 },
  { id: 'sp50', icon: '🦋', zh: '彩翼蝴蝶', en: 'Monarch Butterfly', cat: 'animals', bgHue: 268 },
  { id: 'sp51', icon: '🐠', zh: '錦鯉游魚', en: 'Tropical Reef Fish', cat: 'animals', bgHue: 190 },
  { id: 'sp52', icon: '🦚', zh: '開屏孔雀', en: 'Emerald Peacock', cat: 'animals', bgHue: 172 },
  { id: 'sp53', icon: '🐢', zh: '長壽海龜', en: 'Green Sea Turtle', cat: 'animals', bgHue: 150 },
  { id: 'sp54', icon: '🦢', zh: '優雅白天鵝', en: 'Graceful White Swan', cat: 'animals', bgHue: 206 },
  { id: 'sp55', icon: '🐸', zh: '荷葉小青蛙', en: 'Lilypad Tree Frog', cat: 'animals', bgHue: 112 },
  { id: 'sp56', icon: '🐇', zh: '中秋玉兔', en: 'Fluffy Jade Rabbit', cat: 'animals', bgHue: 315 },
  { id: 'sp57', icon: '🐬', zh: '中華白海豚', en: 'Jumping Dolphin', cat: 'animals', bgHue: 198 },

  // Music & Leisure Arts (11)
  { id: 'sp58', icon: '🎸', zh: '木結他', en: 'Acoustic Guitar', cat: 'music', bgHue: 25 },
  { id: 'sp59', icon: '🎻', zh: '古典小提琴', en: 'Classical Violin', cat: 'music', bgHue: 18 },
  { id: 'sp60', icon: '🎹', zh: '黑白鋼琴鍵', en: 'Grand Piano Keys', cat: 'music', bgHue: 225 },
  { id: 'sp61', icon: '🎺', zh: '金銅小號', en: 'Brass Trumpet', cat: 'music', bgHue: 45 },
  { id: 'sp62', icon: '🥁', zh: '喜慶大鼓', en: 'Festive Drum', cat: 'music', bgHue: 5 },
  { id: 'sp63', icon: '🎷', zh: '爵士色士風', en: 'Golden Saxophone', cat: 'music', bgHue: 42 },
  { id: 'sp64', icon: '🎨', zh: '畫家調色盤', en: 'Artist Paint Palette', cat: 'music', bgHue: 292 },
  { id: 'sp65', icon: '⏳', zh: '流沙計時器', en: 'Wooden Hourglass', cat: 'music', bgHue: 36 },
  { id: 'sp66', icon: '🔭', zh: '觀星望遠鏡', en: 'Stargazer Telescope', cat: 'music', bgHue: 230 },
  { id: 'sp67', icon: '🏆', zh: '冠軍金獎盃', en: 'Golden Trophy Cup', cat: 'music', bgHue: 48 },
  { id: 'sp68', icon: '👑', zh: '寶石皇冠', en: 'Jewelled Crown', cat: 'music', bgHue: 44 }
];

function buildHiddenSceneArtwork(item, offsetX, offsetY) {
  const h = item.bgHue;
  const h2 = (h + 38) % 360;
  const cx = 160 + offsetX;
  const cy = 102 + offsetY;

  let catDecor = '';
  if (item.cat === 'transport') {
    catDecor =
      '<path d="M0 156 Q80 144 160 156 T320 156 L320 200 L0 200 Z" fill="hsl(' + h + ',58%,36%)" opacity="0.5" />' +
      '<path d="M0 172 Q80 162 160 172 T320 172" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.45" />' +
      '<rect x="26" y="42" width="24" height="114" rx="3" fill="hsl(' + h2 + ',40%,30%)" opacity="0.28" />' +
      '<rect x="60" y="64" width="28" height="92" rx="3" fill="hsl(' + h + ',40%,32%)" opacity="0.24" />' +
      '<rect x="242" y="50" width="30" height="106" rx="3" fill="hsl(' + h2 + ',40%,30%)" opacity="0.28" />';
  } else if (item.cat === 'dimsum') {
    catDecor =
      '<circle cx="' + cx + '" cy="' + cy + '" r="76" fill="none" stroke="hsl(' + h + ',65%,42%)" stroke-width="5" stroke-dasharray="10 6" opacity="0.45" />' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="62" fill="#fffaf0" opacity="0.72" />' +
      '<path d="M36 32 L284 32 M36 170 L284 170" stroke="hsl(' + h + ',55%,45%)" stroke-width="2" opacity="0.35" />';
  } else if (item.cat === 'nature' || item.cat === 'animals') {
    catDecor =
      '<ellipse cx="70" cy="182" rx="95" ry="36" fill="hsl(132,45%,42%)" opacity="0.38" />' +
      '<ellipse cx="255" cy="184" rx="105" ry="38" fill="hsl(145,48%,36%)" opacity="0.38" />' +
      '<circle cx="56" cy="44" r="18" fill="#fff3b0" opacity="0.55" />';
  } else {
    catDecor =
      '<polygon points="160,12 195,190 125,190" fill="#ffffff" opacity="0.18" />' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="68" fill="none" stroke="hsl(' + h2 + ',70%,50%)" stroke-width="3" opacity="0.4" />';
  }

  return (
    '<rect x="0" y="0" width="320" height="200" fill="hsl(' + h + ',72%,88%)" />' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="88" fill="hsl(' + h2 + ',82%,94%)" opacity="0.85" />' +
    catDecor +
    // Crisp multi-ring medallion + giant vector-clear emblem
    '<circle cx="' + cx + '" cy="' + cy + '" r="54" fill="#ffffff" stroke="hsl(' + h + ',65%,48%)" stroke-width="3.5" />' +
    '<text x="' + cx + '" y="' + (cy + 31) + '" text-anchor="middle" font-size="86" style="user-select:none;">' +
      item.icon +
    '</text>' +
    // Helpful edge silhouettes around periphery so moving beam catches clues early
    '<text x="' + Math.max(38, cx - 88) + '" y="' + Math.max(46, cy - 38) + '" text-anchor="middle" font-size="28" opacity="0.38">' +
      item.icon +
    '</text>' +
    '<text x="' + Math.min(282, cx + 88) + '" y="' + Math.min(174, cy + 52) + '" text-anchor="middle" font-size="28" opacity="0.38">' +
      item.icon +
    '</text>'
  );
}

export function mountSpotlightGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getSavedLevel(state, 'spotlight');
  const gameMeta = getGameMeta('spotlight', '🔦', '夜探霓虹剪影', "Mochi's Flashlight Peek");

  const totalSteps = 3;
  const sessionItems = drawFreshItems(state, 'spotlight_items', SPOTLIGHT_BANK, totalSteps, function (x) {
    return x.id;
  });

  const baseRadius = level === 0 ? 40 : level === 1 ? 33 : 27;

  let stepIdx = 0;
  let wideBeam = false;
  let revealed = false;
  let wrongIds = {};
  let totalMisses = 0;
  let totalHints = 0;
  let rafId = null;
  let beamX = 160;
  let beamY = 100;
  let manualUntil = 0;
  let isDragging = false;

  // Build fixed per-round offsets & option lists once per session
  const roundConfigs = sessionItems.map(function (item) {
    const sameCat = shuffleList(
      SPOTLIGHT_BANK.filter(function (peer) {
        return peer.cat === item.cat && peer.id !== item.id;
      })
    ).slice(0, 3);
    const options = shuffleList([item].concat(sameCat));
    const offsetX = Math.round((Math.random() - 0.5) * 44);
    const offsetY = Math.round((Math.random() - 0.5) * 26);
    const phaseX = Math.random() * Math.PI * 2;
    const phaseY = Math.random() * Math.PI * 2;
    return {
      item: item,
      options: options,
      offsetX: offsetX,
      offsetY: offsetY,
      phaseX: phaseX,
      phaseY: phaseY
    };
  });

  function stopBeamLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function getActiveRadius() {
    if (revealed) return 420;
    return wideBeam ? baseRadius + 18 : baseRadius;
  }

  function applyBeamDom() {
    const clipCircle = container.querySelector('#spotBeamClipCircle');
    const glowRing = container.querySelector('#spotBeamGlowRing');
    const r = getActiveRadius();
    if (clipCircle) {
      clipCircle.setAttribute('cx', beamX.toFixed(1));
      clipCircle.setAttribute('cy', beamY.toFixed(1));
      clipCircle.setAttribute('r', String(r));
    }
    if (glowRing) {
      if (revealed) {
        glowRing.setAttribute('opacity', '0');
      } else {
        glowRing.setAttribute('opacity', '1');
        glowRing.setAttribute('cx', beamX.toFixed(1));
        glowRing.setAttribute('cy', beamY.toFixed(1));
        glowRing.setAttribute('r', String(r));
      }
    }
  }

  function startBeamLoop() {
    stopBeamLoop();
    const cfg = roundConfigs[stepIdx];
    const startTs = performance.now();

    function tick(now) {
      const svgEl = container.querySelector('#spotlightStageSvg');
      if (!svgEl || !container.isConnected) {
        stopBeamLoop();
        return;
      }
      if (!revealed && now > manualUntil && !isDragging) {
        const tSec = (now - startTs) * 0.001;
        const targetX = 160 + 96 * Math.sin(tSec * 1.12 + cfg.phaseX);
        const targetY = 100 + 54 * Math.sin(tSec * 1.58 + cfg.phaseY);
        beamX += (targetX - beamX) * 0.09;
        beamY += (targetY - beamY) * 0.09;
      }
      applyBeamDom();
      if (!revealed) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function moveBeamFromEvent(ev, svgEl) {
    if (revealed) return;
    const rect = svgEl.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    let clientX = ev.clientX;
    let clientY = ev.clientY;
    if (typeof clientX !== 'number' && ev.touches && ev.touches[0]) {
      clientX = ev.touches[0].clientX;
      clientY = ev.touches[0].clientY;
    }
    if (typeof clientX !== 'number') return;
    beamX = Math.max(24, Math.min(296, ((clientX - rect.left) / rect.width) * 320));
    beamY = Math.max(24, Math.min(176, ((clientY - rect.top) / rect.height) * 200));
    manualUntil = performance.now() + 2600;
    applyBeamDom();
  }

  function triggerWideBeam() {
    if (revealed) return;
    if (!wideBeam) {
      wideBeam = true;
      totalHints += 1;
      playSfx('meow', state.sound);
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '🐾 喵嗚～阿喵開大咗貓眼夜視電筒（光圈擴闊 +18）！手指亦可以直接拖動光束慢慢照～'
          : '🐾 Meow~! Mochi switched on Cat-Eye Wide Beam (+18 radius)! Drag anywhere on the stage to aim~'
      );
      applyBeamDom();
      const wideBtn = container.querySelector('#spotWideBeamBtn');
      if (wideBtn) {
        wideBtn.disabled = true;
        wideBtn.textContent = zh ? '🐾 貓眼擴光已開啟' : '🐾 Wide Beam Active';
      }
    } else {
      playSfx('tap', state.sound);
    }
  }

  function renderRound() {
    stopBeamLoop();
    container.innerHTML = '';
    const cfg = roundConfigs[stepIdx];
    const item = cfg.item;
    const clipId = 'spotBeamClip_' + stepIdx;

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (lv) {
        stopBeamLoop();
        onLevelChange(lv);
      },
      onBack: function () {
        stopBeamLoop();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml:
        '<button type="button" class="chip-btn" id="spotTopHintBtn">' +
        (zh ? '🐾 貓眼擴光' : '🐾 Wide Beam') +
        '</button>'
    });

    const topBtn = container.querySelector('#spotTopHintBtn');
    if (topBtn) topBtn.addEventListener('click', triggerWideBeam);

    let choicesHtml = '';
    for (let i = 0; i < cfg.options.length; i++) {
      const opt = cfg.options[i];
      const isWrong = Boolean(wrongIds[opt.id]);
      const isSolvedRight = revealed && opt.id === item.id;
      const dis = revealed || isWrong ? 'disabled' : '';
      const extraStyle = isSolvedRight
        ? 'border-color:#1d7a5f;background:#e8f8f1;font-weight:800;'
        : isWrong
        ? 'opacity:0.45;'
        : '';

      choicesHtml +=
        '<button type="button" class="choice-btn spot-choice-btn" data-id="' +
        escHtml(opt.id) +
        '" ' +
        dis +
        ' style="' +
        extraStyle +
        '">' +
          '<span>' +
            (revealed ? opt.icon + ' ' : '🔍 ') +
            escHtml(zh ? opt.zh : opt.en) +
          '</span>' +
        '</button>';
    }

    const isLast = stepIdx >= totalSteps - 1;
    const doneBannerHtml = revealed
      ? '<div class="feedback-banner" style="margin-top:0.85rem;">' +
          '<div style="font-weight:800;font-size:1.05rem;">' +
            escHtml(randomPraise(lang)) +
            ' ' +
            item.icon +
            ' ' +
            escHtml(zh ? '舞台開燈！正係「' + item.zh + '」！' : 'Curtain up! It is "' + item.en + '"!') +
          '</div>' +
          '<div style="margin-top:0.65rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="spotNextRoundBtn">' +
              (isLast
                ? t(lang, 'finishDish')
                : zh
                ? '下一幕夜探舞台（第 ' + (stepIdx + 2) + ' / ' + totalSteps + ' 題）→'
                : 'Next Spotlight Stage (' + (stepIdx + 2) + ' of ' + totalSteps + ') →') +
            '</button>' +
          '</div>' +
        '</div>'
      : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.6rem;">' +
        '<div>' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 幕' : 'Stage ' + (stepIdx + 1) + ' of ' + totalSteps) +
          '</span>' +
          '<div class="prompt-title" style="margin-top:0.25rem;">' +
            (zh ? '🔦 透過阿喵嘅移動電筒光束，估下黑幕後面藏住咩物件？' : "🔦 Peek through Mochi's moving flashlight beam — what is hiding on stage?") +
          '</div>' +
        '</div>' +
        '<button type="button" class="chip-btn" id="spotWideBeamBtn" ' + (wideBeam ? 'disabled' : '') + '>' +
          (wideBeam
            ? zh ? '🐾 貓眼擴光已開啟' : '🐾 Wide Beam Active'
            : zh ? '🐾 貓眼擴光（💡 貼士）' : '🐾 Cat-Eye Wide Beam (💡)') +
        '</button>' +
      '</div>' +
      '<p style="font-size:0.85rem;color:#6c5c4c;margin:0 0 0.55rem 0;">' +
        (zh
          ? '👆 小貼士：直接輕撳或喺黑幕上拖動手指，就可以親自控制阿喵電筒照向任何角落！'
          : '👆 Tip: Tap or drag anywhere on the dark stage to steer Mochi’s flashlight beam yourself!') +
      '</p>' +
      '<div style="width:100%;max-width:540px;margin:0 auto 0.85rem auto;border-radius:16px;overflow:hidden;border:2.5px solid #24344d;box-shadow:0 8px 22px rgba(11,19,32,0.26);">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" id="spotlightStageSvg" style="display:block;width:100%;height:auto;touch-action:none;cursor:crosshair;user-select:none;">' +
          '<defs>' +
            '<clipPath id="' + clipId + '">' +
              '<circle id="spotBeamClipCircle" cx="' + beamX.toFixed(1) + '" cy="' + beamY.toFixed(1) + '" r="' + getActiveRadius() + '" />' +
            '</clipPath>' +
          '</defs>' +
          // Dark night stage background
          '<rect x="0" y="0" width="320" height="200" fill="#0d1626" />' +
          '<circle cx="38" cy="28" r="1.4" fill="#8ab4f8" opacity="0.55" />' +
          '<circle cx="114" cy="20" r="1.2" fill="#fde293" opacity="0.5" />' +
          '<circle cx="246" cy="30" r="1.5" fill="#8ab4f8" opacity="0.55" />' +
          '<circle cx="290" cy="64" r="1.2" fill="#fde293" opacity="0.45" />' +
          '<text x="160" y="188" text-anchor="middle" font-size="11" fill="rgba(210,225,255,0.34)">' +
            (zh ? '🐾 輕撳或拖動移動貓眼電筒' : '🐾 Tap or drag to aim flashlight') +
          '</text>' +
          // Masked bright scene
          '<g clip-path="url(#' + clipId + ')">' +
            buildHiddenSceneArtwork(item, cfg.offsetX, cfg.offsetY) +
          '</g>' +
          // Warm golden flashlight rim
          '<circle id="spotBeamGlowRing" cx="' + beamX.toFixed(1) + '" cy="' + beamY.toFixed(1) + '" r="' + getActiveRadius() + '" fill="none" stroke="#ffd54f" stroke-width="3.2" opacity="' + (revealed ? '0' : '1') + '" />' +
        '</svg>' +
      '</div>' +
      '<div class="choices-list" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.6rem;">' +
        choicesHtml +
      '</div>' +
      doneBannerHtml;

    container.appendChild(card);

    const wideBtn = card.querySelector('#spotWideBeamBtn');
    if (wideBtn) wideBtn.addEventListener('click', triggerWideBeam);

    const stageSvg = card.querySelector('#spotlightStageSvg');
    if (stageSvg) {
      stageSvg.addEventListener('pointerdown', function (ev) {
        isDragging = true;
        moveBeamFromEvent(ev, stageSvg);
      });
      stageSvg.addEventListener('pointermove', function (ev) {
        if (isDragging) {
          moveBeamFromEvent(ev, stageSvg);
        }
      });
      stageSvg.addEventListener('pointerup', function () {
        isDragging = false;
      });
      stageSvg.addEventListener('pointercancel', function () {
        isDragging = false;
      });
      stageSvg.addEventListener('click', function (ev) {
        moveBeamFromEvent(ev, stageSvg);
      });
    }

    const choiceBtns = card.querySelectorAll('.spot-choice-btn');
    for (let i = 0; i < choiceBtns.length; i++) {
      choiceBtns[i].addEventListener('click', function () {
        if (revealed) return;
        const pickedId = this.getAttribute('data-id');
        if (pickedId === item.id) {
          revealed = true;
          stopBeamLoop();
          playSfx('correct', state.sound);
          notifyStageBaoBo(
            'correct',
            lang,
            stepIdx + 1,
            zh
              ? '🎉 啪！全場開燈～阿喵隻電筒照出嚟嘅果然係「' + item.zh + '」喵！'
              : '🎉 Lights on! Mochi’s flashlight revealed "' + item.en + '"!'
          );
          renderRound();
        } else {
          totalMisses += 1;
          wrongIds[pickedId] = true;
          playSfx('gentle', state.sound);
          notifyStageBaoBo(
            'gentle',
            lang,
            0,
            zh
              ? '🐾 唔係呢樣喎～用手指拖隻電筒去中間望真啲輪廓同顏色喵！'
              : '🐾 Not quite that one~ Drag the flashlight across the center to inspect its colors & edges!'
          );
          renderRound();
        }
      });
    }

    const nextBtn = card.querySelector('#spotNextRoundBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopSpeaking();
        stopBeamLoop();
        if (isLast) {
          const stars =
            totalMisses <= 1 && totalHints <= 1
              ? 3
              : totalMisses <= 4 && totalHints <= 2
              ? 2
              : 1;
          const score = 95 + level * 15 + stars * 10;
          onComplete({ score: score, stars: stars });
        } else {
          playSfx('switch', state.sound);
          stepIdx += 1;
          wideBeam = false;
          revealed = false;
          wrongIds = {};
          beamX = 160;
          beamY = 100;
          manualUntil = 0;
          renderRound();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (!revealed) {
      startBeamLoop();
    }
  }

  renderRound();
  notifyStageBaoBo(
    'intro',
    lang,
    0,
    zh
      ? '🔦 阿喵舉起貓眼小電筒巡夜舞台喇！睇住光圈掃過嘅細節，或者親手拖動光束搵答案喵～'
      : "🔦 Mochi's cat-eye flashlight is sweeping the dark stage! Watch the beam or drag it yourself to spot the hidden item~"
  );
}

/* =========================================================================
   4. RADICALS & WORD FORGE (🀄 拆字拼詞館 · Radical & Word Forge)
   ========================================================================= */

// 86 curated authentic Traditional Chinese compound characters
const RADICALS_ZH_BANK = [
  { id: 'hz01', radical: '氵', part: '青', char: '清', wordZh: '清茶 · 心清眼亮', clueZh: '同水有關，形容茶水澄澈明淨' },
  { id: 'hz02', radical: '氵', part: '巷', char: '港', wordZh: '香港 · 維多利亞港', clueZh: '同水路有關，船隻停泊嘅海灣城市' },
  { id: 'hz03', radical: '氵', part: '每', char: '海', wordZh: '大海 · 海闊天空', clueZh: '百川匯聚嘅廣闊水域' },
  { id: 'hz04', radical: '氵', part: '胡', char: '湖', wordZh: '翠湖 · 平湖秋月', clueZh: '陸地上四面環山嘅大片靜水' },
  { id: 'hz05', radical: '氵', part: '可', char: '河', wordZh: '山河 · 小河流水', clueZh: '蜿蜒流向大海嘅天然水道' },
  { id: 'hz06', radical: '氵', part: '皮', char: '波', wordZh: '碧波 · 水波不興', clueZh: '微風吹過水面泛起嘅漣漪' },
  { id: 'hz07', radical: '氵', part: '舌', char: '活', wordZh: '生活 · 靈活醒神', clueZh: '充滿生氣、腦筋轉得快' },
  { id: 'hz08', radical: '氵', part: '羊', char: '洋', wordZh: '海洋 · 喜氣洋洋', clueZh: '比海更廣闊嘅大水，亦形容充滿喜悅' },
  { id: 'hz09', radical: '氵', part: '良', char: '浪', wordZh: '海浪 · 乘風破浪', clueZh: '海面上翻騰起伏嘅水花' },
  { id: 'hz10', radical: '氵', part: '朝', char: '潮', wordZh: '早潮 · 潮州工夫茶', clueZh: '隨住日月定時漲退嘅海水' },
  { id: 'hz11', radical: '氵', part: '彎', char: '灣', wordZh: '海灣 · 銅鑼灣', clueZh: '海岸線向陸地凹入嘅平靜水域' },
  { id: 'hz12', radical: '氵', part: '炎', char: '淡', wordZh: '清淡 · 淡泊明志', clueZh: '味道唔濃膩，清雅怡人' },
  { id: 'hz13', radical: '木', part: '公', char: '松', wordZh: '蒼松 · 松柏長青', clueZh: '四季常綠、象徵長壽堅毅嘅樹木' },
  { id: 'hz14', radical: '木', part: '白', char: '柏', wordZh: '翠柏 · 松柏延年', clueZh: '木質堅實清香嘅常綠喬木' },
  { id: 'hz15', radical: '木', part: '每', char: '梅', wordZh: '臘梅 · 梅花間竹', clueZh: '寒冬傲雪盛開嘅清香花木' },
  { id: 'hz16', radical: '木', part: '兆', char: '桃', wordZh: '蟠桃 · 壽桃賀壽', clueZh: '春天開粉紅花、果實甜美寓意長壽' },
  { id: 'hz17', radical: '木', part: '支', char: '枝', wordZh: '花枝 · 枝繁葉茂', clueZh: '由樹幹伸展出去生滿綠葉嘅部分' },
  { id: 'hz18', radical: '木', part: '風', char: '楓', wordZh: '紅楓 · 溫哥華楓葉', clueZh: '秋天葉片轉紅、加拿大最具代表性嘅樹' },
  { id: 'hz19', radical: '木', part: '喬', char: '橋', wordZh: '石橋 · 小橋流水', clueZh: '架喺河面連接兩岸嘅建築' },
  { id: 'hz20', radical: '木', part: '寸', char: '村', wordZh: '鄉村 · 杏花村', clueZh: '綠樹環繞、鄰里聚居嘅寧靜地方' },
  { id: 'hz21', radical: '木', part: '反', char: '板', wordZh: '木板 · 七巧板', clueZh: '平整光滑嘅木片，可拼出千變萬化圖案' },
  { id: 'hz22', radical: '木', part: '不', char: '杯', wordZh: '茶杯 · 舉杯品茗', clueZh: '盛載熱茶或美酒嘅器皿' },
  { id: 'hz23', radical: '木', part: '甬', char: '桶', wordZh: '木桶 · 山水豆腐花桶', clueZh: '用木條箍成、裝水或盛載豆腐花嘅器具' },
  { id: 'hz24', radical: '木', part: '圭', char: '桂', wordZh: '丹桂 · 桂花烏龍', clueZh: '八月飄香、常用嚟窨茶同做糕點嘅花木' },
  { id: 'hz25', radical: '日', part: '青', char: '晴', wordZh: '天晴 · 風和日麗', clueZh: '雲開見日、陽光普照嘅好天氣' },
  { id: 'hz26', radical: '日', part: '寺', char: '時', wordZh: '良時 · 四時如意', clueZh: '光陰歲月與節氣更替' },
  { id: 'hz27', radical: '日', part: '月', char: '明', wordZh: '光明 · 耳聰目明', clueZh: '日月同輝，形容光亮通透、頭腦清晰' },
  { id: 'hz28', radical: '日', part: '免', char: '晚', wordZh: '傍晚 · 晚霞滿天', clueZh: '太陽西下、華燈初上嘅柔和時分' },
  { id: 'hz29', radical: '日', part: '生', char: '星', wordZh: '繁星 · 吉星高照', clueZh: '夜空中閃爍發光嘅天體' },
  { id: 'hz30', radical: '日', part: '央', char: '映', wordZh: '倒映 · 花木掩映', clueZh: '陽光照耀反照出美麗光影' },
  { id: 'hz31', radical: '日', part: '爰', char: '暖', wordZh: '溫暖 · 春暖花開', clueZh: '陽光柔和舒適、令人心頭暖洋洋' },
  { id: 'hz32', radical: '日', part: '京', char: '景', wordZh: '風景 · 良辰美景', clueZh: '陽光照耀下迷人嘅山水風光' },
  { id: 'hz33', radical: '口', part: '未', char: '味', wordZh: '茶味 · 津津有味', clueZh: '舌尖品嚐到嘅甘香鮮美' },
  { id: 'hz34', radical: '口', part: '昌', char: '唱', wordZh: '歡唱 · 粵曲清唱', clueZh: '開聲吟詠動聽嘅旋律' },
  { id: 'hz35', radical: '口', part: '欠', char: '吹', wordZh: '吹風 · 春風吹拂', clueZh: '輕輕吐氣或微風拂面' },
  { id: 'hz36', radical: '口', part: '乎', char: '呼', wordZh: '招呼 · 歡呼喝采', clueZh: '熱情叫喚親友一齊嘆茶' },
  { id: 'hz37', radical: '口', part: '及', char: '吸', wordZh: '呼吸 · 深呼吸', clueZh: '將清新空氣慢慢引進胸懷' },
  { id: 'hz38', radical: '口', part: '合', char: '哈', wordZh: '笑哈哈 · 哈哈大笑', clueZh: '開懷暢笑嘅愉快聲音' },
  { id: 'hz39', radical: '口', part: '乞', char: '吃', wordZh: '小吃 · 地道美點', clueZh: '品嚐各式美味佳餚' },
  { id: 'hz40', radical: '口', part: '禾', char: '和', wordZh: '祥和 · 家和萬事興', clueZh: '融洽溫馨、平順安寧' },
  { id: 'hz41', radical: '口', part: '古', char: '咕', wordZh: '咕嚕肉 · 酸甜開胃', clueZh: '茶樓經典酸甜名菜嘅象聲字' },
  { id: 'hz42', radical: '口', part: '冬', char: '咚', wordZh: '叮咚 · 泉水叮咚', clueZh: '清脆悅耳嘅玉石與流水聲' },
  { id: 'hz43', radical: '言', part: '青', char: '請', wordZh: '請茶 · 敬請入座', clueZh: '有禮貌咁誠意相邀' },
  { id: 'hz44', radical: '言', part: '吾', char: '語', wordZh: '粵語 · 鳥語花香', clueZh: '日常傾偈交流嘅親切話語' },
  { id: 'hz45', radical: '言', part: '舌', char: '話', wordZh: '茶話 · 笑話連篇', clueZh: '說出口嘅心聲與故事' },
  { id: 'hz46', radical: '言', part: '寺', char: '詩', wordZh: '唐詩 · 詩情畫意', clueZh: '講究節奏韻律嘅優美文學' },
  { id: 'hz47', radical: '言', part: '己', char: '記', wordZh: '記性 · 博聞強記', clueZh: '將美好事物牢牢留喺腦海' },
  { id: 'hz48', radical: '言', part: '成', char: '誠', wordZh: '真誠 · 心誠則靈', clueZh: '待人懇切實在、毫無虛假' },
  { id: 'hz49', radical: '言', part: '射', char: '謝', wordZh: '多謝 · 感恩致謝', clueZh: '用言語表達心入面嘅感激' },
  { id: 'hz50', radical: '言', part: '忍', char: '認', wordZh: '認得 · 一眼認出', clueZh: '眼力好、清楚辨別出熟人或事物' },
  { id: 'hz51', radical: '忄', part: '青', char: '情', wordZh: '人情 · 濃情厚意', clueZh: '親友之間真摯溫暖嘅心意' },
  { id: 'hz52', radical: '忄', part: '夬', char: '快', wordZh: '快樂 · 眼明手快', clueZh: '心情舒暢歡喜、動作敏捷' },
  { id: 'hz53', radical: '忄', part: '俞', char: '愉', wordZh: '愉快 · 身心愉快', clueZh: '輕鬆喜悅、無憂無慮' },
  { id: 'hz54', radical: '忄', part: '吾', char: '悟', wordZh: '領悟 · 恍然大悟', clueZh: '心領神會、一下子想通道理' },
  { id: 'hz55', radical: '忄', part: '意', char: '憶', wordZh: '回憶 · 美好記憶', clueZh: '回想往昔溫馨難忘嘅時光' },
  { id: 'hz56', radical: '忄', part: '生', char: '性', wordZh: '記性 · 心性平和', clueZh: '天生嘅品格與頭腦記憶力' },
  { id: 'hz57', radical: '心', part: '相', char: '想', wordZh: '夢想 · 奇思妙想', clueZh: '開動腦筋思考與懷念' },
  { id: 'hz58', radical: '心', part: '因', char: '恩', wordZh: '感恩 · 恩情深重', clueZh: '銘記別人嘅好處與關懷' },
  { id: 'hz59', radical: '釒', part: '令', char: '鈴', wordZh: '金鈴 · 招財貓頸鈴', clueZh: '阿喵頸上搖動時清脆作響嘅小金球' },
  { id: 'hz60', radical: '釒', part: '同', char: '銅', wordZh: '青銅 · 銅鑼灣', clueZh: '色澤溫潤古雅嘅金屬' },
  { id: 'hz61', radical: '釒', part: '艮', char: '銀', wordZh: '白銀 · 銀龍迎春', clueZh: '潔白閃亮嘅珍貴金屬' },
  { id: 'hz62', radical: '釒', part: '帛', char: '錦', wordZh: '錦繡 · 前程錦繡', clueZh: '色彩華麗精緻嘅織錦與美好景象' },
  { id: 'hz63', radical: '釒', part: '竟', char: '鏡', wordZh: '明鏡 · 明鏡高懸', clueZh: '照見容貌與萬物嘅光滑器物' },
  { id: 'hz64', radical: '釒', part: '童', char: '鐘', wordZh: '茶鐘 · 晨鐘暮鼓', clueZh: '報時或敲響清音嘅器物' },
  { id: 'hz65', radical: '火', part: '登', char: '燈', wordZh: '花燈 · 萬家燈火', clueZh: '夜晚照亮街道同屋企嘅溫暖光源' },
  { id: 'hz66', radical: '火', part: '共', char: '烘', wordZh: '烘焙 · 炭焙烏龍', clueZh: '用微火慢慢溫暖焙乾茶葉' },
  { id: 'hz67', radical: '火', part: '考', char: '烤', wordZh: '鮮烤 · 香烤蛋撻', clueZh: '用爐火烘出金黃香脆美食' },
  { id: 'hz68', radical: '火', part: '堯', char: '燒', wordZh: '叉燒 · 蜜汁叉燒', clueZh: '茶樓最受歡迎嘅廣東燒味烹調法' },
  { id: 'hz69', radical: '火', part: '因', char: '煙', wordZh: '炊煙 · 雲煙繚繞', clueZh: '熱茶與爐灶升起嘅輕柔霧氣' },
  { id: 'hz70', radical: '艹', part: '化', char: '花', wordZh: '鮮花 · 鳥語花香', clueZh: '萬紫千紅、芬芳迷人嘅植物花朵' },
  { id: 'hz71', radical: '艹', part: '方', char: '芳', wordZh: '芬芳 · 芳名遠播', clueZh: '花草與好茶散發嘅清雅香氣' },
  { id: 'hz72', radical: '艹', part: '早', char: '草', wordZh: '芳草 · 綠草如茵', clueZh: '充滿生機嘅翠綠草本植物' },
  { id: 'hz73', radical: '艹', part: '田', char: '苗', wordZh: '禾苗 · 新苗茁壯', clueZh: '破土而出、充滿希望嘅嫩芽' },
  { id: 'hz74', radical: '艹', part: '何', char: '荷', wordZh: '荷花 · 出水芙蓉', clueZh: '夏日池塘盛開嘅清雅蓮花' },
  { id: 'hz75', radical: '艹', part: '洛', char: '落', wordZh: '落霞 · 水落石出', clueZh: '花瓣或夕陽輕輕降下' },
  { id: 'hz76', radical: '⺮', part: '夭', char: '笑', wordZh: '歡笑 · 眉開眼笑', clueZh: '開心喜悅時露出嘅燦爛神情' },
  { id: 'hz77', radical: '⺮', part: '毛', char: '筆', wordZh: '毛筆 · 揮毫書法', clueZh: '書寫漢字與繪畫嘅文房四寶' },
  { id: 'hz78', radical: '⺮', part: '由', char: '笛', wordZh: '竹笛 · 牧童橫笛', clueZh: '用翠竹製成、吹奏清亮樂音嘅樂器' },
  { id: 'hz79', radical: '⺮', part: '相', char: '箱', wordZh: '竹箱 · 百寶箱', clueZh: '整齊收納珍貴物件嘅器具' },
  { id: 'hz80', radical: '女', part: '子', char: '好', wordZh: '美好 · 花好月圓', clueZh: '稱心如意、美滿吉祥' },
  { id: 'hz81', radical: '女', part: '生', char: '姓', wordZh: '百家姓 · 貴姓大名', clueZh: '代表家族源流嘅稱號' },
  { id: 'hz82', radical: '王', part: '朱', char: '珠', wordZh: '明珠 · 東方之珠', clueZh: '圓潤閃耀嘅珍寶，亦係香港美譽' },
  { id: 'hz83', radical: '王', part: '里', char: '理', wordZh: '道理 · 慢條斯理', clueZh: '玉石紋理清晰，形容有條有理' },
  { id: 'hz84', radical: '王', part: '求', char: '球', wordZh: '繡球 · 彩球迎賓', clueZh: '圓滾滾嘅吉祥球體' },
  { id: 'hz85', radical: '禾', part: '火', char: '秋', wordZh: '金秋 · 平湖秋月', clueZh: '天高氣爽、果實豐收嘅季節' },
  { id: 'hz86', radical: '魚', part: '羊', char: '鮮', wordZh: '海鮮 · 鮮甜美味', clueZh: '魚同羊合起來最鮮美嘅滋味' }
];

// 86 curated 5-to-6-letter everyday cozy English words
const RADICALS_EN_BANK = [
  { id: 'ew01', word: 'TEAPOT', clueEn: 'A warm spouted vessel for brewing jasmine or oolong tea' },
  { id: 'ew02', word: 'GARDEN', clueEn: 'A peaceful outdoor space filled with flowers, trees, and paths' },
  { id: 'ew03', word: 'BAMBOO', clueEn: 'Tall hollow green stalks used to weave dim sum steamers' },
  { id: 'ew04', word: 'BREEZE', clueEn: 'A gentle, refreshing wind blowing across the harbour' },
  { id: 'ew05', word: 'NOODLE', clueEn: 'Long savory strands served hot in wonton soup' },
  { id: 'ew06', word: 'MARKET', clueEn: 'A lively neighborhood place to buy fresh fruit and greens' },
  { id: 'ew07', word: 'BRIDGE', clueEn: 'A structure spanning across water to connect two shores' },
  { id: 'ew08', word: 'ISLAND', clueEn: 'A piece of land completely surrounded by ocean or lake water' },
  { id: 'ew09', word: 'MEMORY', clueEn: 'A cherished moment kept clear and warm in the mind' },
  { id: 'ew10', word: 'WISDOM', clueEn: 'Deep knowledge and good judgment gained from life experience' },
  { id: 'ew11', word: 'SUNSET', clueEn: 'The golden evening hour when the sun dips below the horizon' },
  { id: 'ew12', word: 'SPRING', clueEn: 'The blooming season after winter when buds and flowers awaken' },
  { id: 'ew13', word: 'SILVER', clueEn: 'A bright, lustrous precious grey-white metal' },
  { id: 'ew14', word: 'GOLDEN', clueEn: 'Shining with the warm rich color of baked egg tarts' },
  { id: 'ew15', word: 'HARBOR', clueEn: 'A sheltered coastal port where ferries and sailboats dock' },
  { id: 'ew16', word: 'FERRY', clueEn: 'A passenger boat that shuttles across Victoria Harbour or False Creek' },
  { id: 'ew17', word: 'STEAM', clueEn: 'Warm misty vapor rising from a fresh basket of dim sum' },
  { id: 'ew18', word: 'PEARL', clueEn: 'A smooth, luminous gem formed inside an oyster shell' },
  { id: 'ew19', word: 'MAPLE', clueEn: 'The iconic Canadian tree known for crimson autumn leaves and syrup' },
  { id: 'ew20', word: 'LOTUS', clueEn: 'A graceful pink water flower whose seeds sweeten mooncakes' },
  { id: 'ew21', word: 'PANDA', clueEn: 'A beloved black-and-white bear that munches bamboo shoots' },
  { id: 'ew22', word: 'GINGER', clueEn: 'A fragrant warming root used in sweet soup and tea' },
  { id: 'ew23', word: 'LYCHEE', clueEn: 'A sweet translucent summer fruit with a bumpy red shell' },
  { id: 'ew24', word: 'MANGO', clueEn: 'A juicy tropical yellow fruit popular in chilled HK pudding' },
  { id: 'ew25', word: 'SESAME', clueEn: 'Tiny nutty seeds toasted on buns or ground into sweet paste' },
  { id: 'ew26', word: 'SHRIMP', clueEn: 'Plump seafood tucked inside crystal har gow dumplings' },
  { id: 'ew27', word: 'PASTRY', clueEn: 'Flaky baked dough used for egg tarts and pineapple buns' },
  { id: 'ew28', word: 'KETTLE', clueEn: 'A kitchen pot used to boil water for morning tea' },
  { id: 'ew29', word: 'SAUCER', clueEn: 'A small dish placed neatly beneath a teacup' },
  { id: 'ew30', word: 'BASKET', clueEn: 'A woven container for carrying fruit, bread, or steamers' },
  { id: 'ew31', word: 'DRAGON', clueEn: 'A mythical auspicious creature celebrated in boat races' },
  { id: 'ew32', word: 'TEMPLE', clueEn: 'A quiet heritage hall of incense, carvings, and blessings' },
  { id: 'ew33', word: 'ABACUS', clueEn: 'A classic wooden frame with sliding beads for quick math' },
  { id: 'ew34', word: 'SCROLL', clueEn: 'A rolled sheet of calligraphy or traditional landscape art' },
  { id: 'ew35', word: 'CHIME', clueEn: 'A clear, melodic ringing sound from bells in the wind' },
  { id: 'ew36', word: 'MELODY', clueEn: 'A pleasant sequence of musical notes easy to hum along to' },
  { id: 'ew37', word: 'VIOLIN', clueEn: 'A four-stringed wooden instrument played with a horsehair bow' },
  { id: 'ew38', word: 'PIANO', clueEn: 'A musical instrument with 88 black and white keys' },
  { id: 'ew39', word: 'GUITAR', clueEn: 'A six-stringed acoustic instrument strummed with fingers' },
  { id: 'ew40', word: 'CAMERA', clueEn: 'A device used to capture family photos and travel memories' },
  { id: 'ew41', word: 'ALBUM', clueEn: 'A special book for keeping treasured photographs together' },
  { id: 'ew42', word: 'LETTER', clueEn: 'A handwritten message mailed in an envelope to a friend' },
  { id: 'ew43', word: 'FAMILY', clueEn: 'Loved ones who gather around the round table for yum cha' },
  { id: 'ew44', word: 'FRIEND', clueEn: 'A trusted companion you enjoy chatting and sipping tea with' },
  { id: 'ew45', word: 'SMILE', clueEn: 'A warm, happy expression that brightens everyone’s morning' },
  { id: 'ew46', word: 'LAUGH', clueEn: 'The cheerful sound of joy shared over a funny story' },
  { id: 'ew47', word: 'GENTLE', clueEn: 'Kind, calm, and soft in manner or touch' },
  { id: 'ew48', word: 'LIVELY', clueEn: 'Full of cheerful energy, spirit, and alertness' },
  { id: 'ew49', word: 'BRIGHT', clueEn: 'Shining with plenty of light, or quick-witted and clever' },
  { id: 'ew50', word: 'SERENE', clueEn: 'Calm, peaceful, and untroubled like a still morning lake' },
  { id: 'ew51', word: 'FOREST', clueEn: 'A lush woodland tall with evergreens and cedar trees' },
  { id: 'ew52', word: 'VALLEY', clueEn: 'Lowland nestled peacefully between two mountain ranges' },
  { id: 'ew53', word: 'MEADOW', clueEn: 'An open sunlit field of grass and wildflowers' },
  { id: 'ew54', word: 'STREAM', clueEn: 'A clear, narrow brook babbling gently over smooth stones' },
  { id: 'ew55', word: 'OCEAN', clueEn: 'The vast body of salt water linking Hong Kong and Vancouver' },
  { id: 'ew56', word: 'BEACH', clueEn: 'A sandy or pebbled shore beside the sea' },
  { id: 'ew57', word: 'CLOUD', clueEn: 'A fluffy white shape drifting high across a blue sky' },
  { id: 'ew58', word: 'AUTUMN', clueEn: 'The crisp harvest season of mid-autumn mooncakes and red leaves' },
  { id: 'ew59', word: 'WINTER', clueEn: 'The cozy cool season for hot pot and roasted chestnuts' },
  { id: 'ew60', word: 'SUMMER', clueEn: 'The sunny warm season of dragon boats and cold desserts' },
  { id: 'ew61', word: 'ORCHID', clueEn: 'An elegant, delicate indoor blossom prized at Lunar New Year' },
  { id: 'ew62', word: 'BONSAI', clueEn: 'An artistically trimmed miniature tree grown in a shallow pot' },
  { id: 'ew63', word: 'PEONY', clueEn: 'A lush, layered flower symbolizing prosperity and honor' },
  { id: 'ew64', word: 'WILLOW', clueEn: 'A graceful waterside tree with long, trailing green branches' },
  { id: 'ew65', word: 'CEDAR', clueEn: 'A fragrant Pacific Northwest evergreen tree' },
  { id: 'ew66', word: 'SALMON', clueEn: 'A prized Pacific fish famous in British Columbia waters' },
  { id: 'ew67', word: 'ROBIN', clueEn: 'A cheerful songbird with a warm orange-red breast' },
  { id: 'ew68', word: 'TURTLE', clueEn: 'A slow, steady reptile with a protective shell symbolizing longevity' },
  { id: 'ew69', word: 'RABBIT', clueEn: 'A long-eared hopper linked in legend with the Mid-Autumn Moon' },
  { id: 'ew70', word: 'KITTEN', clueEn: 'A playful little cat with soft paws just like Mochi' },
  { id: 'ew71', word: 'CANDLE', clueEn: 'A wax light with a warm flickering flame' },
  { id: 'ew72', word: 'PILLOW', clueEn: 'A soft cushion for resting your head comfortably at night' },
  { id: 'ew73', word: 'WINDOW', clueEn: 'An opening in a wall that lets in sunshine and fresh air' },
  { id: 'ew74', word: 'MIRROR', clueEn: 'Polished glass that reflects your smiling face clearly' },
  { id: 'ew75', word: 'CLOCK', clueEn: 'A timepiece on the wall with hands marking hours and minutes' },
  { id: 'ew76', word: 'POCKET', clueEn: 'A small pouch sewn into a jacket or apron' },
  { id: 'ew77', word: 'RIBBON', clueEn: 'A decorative silk band tied into a neat bow on gifts' },
  { id: 'ew78', word: 'BUTTON', clueEn: 'A small round fastener on a cardigan or coat' },
  { id: 'ew79', word: 'CANOPY', clueEn: 'A shaded overhead cover over a market stall or walkway' },
  { id: 'ew80', word: 'BAKERY', clueEn: 'A fragrant shop selling warm pineapple buns and egg tarts' },
  { id: 'ew81', word: 'BISTRO', clueEn: 'A cozy neighborhood cafe serving warm meals and drinks' },
  { id: 'ew82', word: 'PICNIC', clueEn: 'An outdoor meal enjoyed on a blanket in the park' },
  { id: 'ew83', word: 'PUZZLE', clueEn: 'A fun brain teaser that keeps the mind nimble and sharp' },
  { id: 'ew84', word: 'TROPHY', clueEn: 'A gleaming cup awarded to celebrate a great achievement' },
  { id: 'ew85', word: 'VOYAGE', clueEn: 'A scenic journey across the sea by ship or ferry' },
  { id: 'ew86', word: 'BEACON', clueEn: 'A guiding light shining from a tower along the coast' }
];

function scrambleLetters(word) {
  const chars = word.split('');
  let out = chars.slice();
  for (let attempt = 0; attempt < 25; attempt++) {
    out = shuffleList(chars);
    if (out.join('') !== word) break;
  }
  if (out.join('') === word && out.length >= 2) {
    const tmp = out[0];
    out[0] = out[1];
    out[1] = tmp;
  }
  return out.map(function (ch, idx) {
    return { tileIdx: idx, ch: ch };
  });
}

export function mountRadicalsGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getSavedLevel(state, 'radicals');
  const gameMeta = getGameMeta('radicals', '🀄', '拆字拼詞館', 'Radical & Word Forge');

  const totalSteps = 3;
  let stepIdx = 0;
  let totalMisses = 0;
  let totalHints = 0;

  // Separate authentic modes for ZH vs EN
  const zhItems = zh
    ? drawFreshItems(state, 'radicals_zh', RADICALS_ZH_BANK, totalSteps, function (x) {
        return x.id;
      })
    : [];
  const enItems = !zh
    ? drawFreshItems(state, 'radicals_en', RADICALS_EN_BANK, totalSteps, function (x) {
        return x.id;
      })
    : [];

  // Build ZH options per round (part + 3 authentic distinct decoys that don't share the same radical+part pair)
  const zhRounds = zhItems.map(function (item) {
    const forbiddenParts = {};
    forbiddenParts[item.part] = true;
    for (let i = 0; i < RADICALS_ZH_BANK.length; i++) {
      if (RADICALS_ZH_BANK[i].radical === item.radical) {
        forbiddenParts[RADICALS_ZH_BANK[i].part] = true;
      }
    }
    const candidateParts = [];
    const seenP = {};
    for (let i = 0; i < RADICALS_ZH_BANK.length; i++) {
      const p = RADICALS_ZH_BANK[i].part;
      if (!forbiddenParts[p] && !seenP[p]) {
        seenP[p] = true;
        candidateParts.push(p);
      }
    }
    const decoys = shuffleList(candidateParts).slice(0, 3);
    return {
      item: item,
      options: shuffleList([item.part].concat(decoys))
    };
  });

  const enRounds = enItems.map(function (item) {
    return {
      item: item,
      tiles: scrambleLetters(item.word)
    };
  });

  // Per-round interactive state
  let solved = false;
  let zhEliminated = {};
  let zhWrong = {};

  // EN slot state: array of tileIdx or null, plus lockedHintPositions
  let enSlots = [];
  let enLockedSlots = {};
  let enJustWrongWord = false;

  function initRoundState() {
    solved = false;
    zhEliminated = {};
    zhWrong = {};
    enLockedSlots = {};
    enJustWrongWord = false;
    if (!zh) {
      const wLen = enRounds[stepIdx].item.word.length;
      enSlots = [];
      for (let i = 0; i < wLen; i++) enSlots.push(null);
    }
  }

  initRoundState();

  function finishOrAdvance() {
    stopSpeaking();
    const isLast = stepIdx >= totalSteps - 1;
    if (isLast) {
      const stars =
        totalMisses <= 1 && totalHints <= 1
          ? 3
          : totalMisses <= 4 && totalHints <= 2
          ? 2
          : 1;
      const score = 95 + level * 15 + stars * 10;
      onComplete({ score: score, stars: stars });
    } else {
      playSfx('switch', state.sound);
      stepIdx += 1;
      initRoundState();
      renderCurrent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function triggerHint() {
    if (solved) return;
    if (zh) {
      const rd = zhRounds[stepIdx];
      let targetPart = null;
      for (let i = 0; i < rd.options.length; i++) {
        const p = rd.options[i];
        if (p !== rd.item.part && !zhEliminated[p] && !zhWrong[p]) {
          targetPart = p;
          break;
        }
      }
      if (targetPart) {
        zhEliminated[targetPart] = true;
        totalHints += 1;
      }
      playSfx('switch', state.sound);
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        '💡 阿喵貼士：已幫你撥開「' +
          (targetPart || '') +
          '」！諗下邊個部件配「' +
          rd.item.radical +
          '」可以拼出「' +
          rd.item.clueZh +
          '」嘅字喵～'
      );
      renderCurrent();
    } else {
      const rd = enRounds[stepIdx];
      const word = rd.item.word;
      let targetPos = -1;
      for (let pos = 0; pos < word.length; pos++) {
        const curTileIdx = enSlots[pos];
        const curChar = curTileIdx !== null ? rd.tiles[curTileIdx].ch : '';
        if (curChar !== word.charAt(pos)) {
          targetPos = pos;
          break;
        }
      }
      if (targetPos === -1) return;

      const neededChar = word.charAt(targetPos);
      // Find an unused tile matching neededChar; if all matching tiles are in wrong later slots, free one!
      let chosenTileIdx = -1;
      for (let tIdx = 0; tIdx < rd.tiles.length; tIdx++) {
        if (rd.tiles[tIdx].ch === neededChar && enSlots.indexOf(tIdx) === -1) {
          chosenTileIdx = tIdx;
          break;
        }
      }
      if (chosenTileIdx === -1) {
        for (let pos = 0; pos < enSlots.length; pos++) {
          const tIdx = enSlots[pos];
          if (pos !== targetPos && !enLockedSlots[pos] && tIdx !== null && rd.tiles[tIdx].ch === neededChar) {
            enSlots[pos] = null;
            chosenTileIdx = tIdx;
            break;
          }
        }
      }
      if (chosenTileIdx !== -1) {
        enSlots[targetPos] = chosenTileIdx;
        enLockedSlots[targetPos] = true;
        enJustWrongWord = false;
        totalHints += 1;
        playSfx('switch', state.sound);
        checkEnCompletion();
        if (!solved) {
          notifyStageBaoBo(
            'intro',
            lang,
            0,
            '💡 Mochi forged letter #' + (targetPos + 1) + ' ("' + neededChar + '") into place for you, meow!'
          );
          renderCurrent();
        }
      }
    }
  }

  function checkEnCompletion() {
    const rd = enRounds[stepIdx];
    for (let i = 0; i < enSlots.length; i++) {
      if (enSlots[i] === null) return;
    }
    const built = enSlots
      .map(function (tIdx) {
        return rd.tiles[tIdx].ch;
      })
      .join('');

    if (built === rd.item.word) {
      solved = true;
      enJustWrongWord = false;
      playSfx('correct', state.sound);
      notifyStageBaoBo(
        'correct',
        lang,
        stepIdx + 1,
        '🎉 Meow~! You forged "' + rd.item.word + '" right on the mark!'
      );
      renderCurrent();
    } else {
      totalMisses += 1;
      enJustWrongWord = true;
      playSfx('gentle', state.sound);
      notifyStageBaoBo(
        'gentle',
        lang,
        0,
        '🐾 Almost! A couple of letters are swapped — tap any slot or ↩ Undo to rearrange them~'
      );
      renderCurrent();
    }
  }

  function renderCurrent() {
    container.innerHTML = '';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: onLevelChange,
      onBack: onBack,
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml:
        '<button type="button" class="chip-btn" id="radTopHintBtn">' +
        t(lang, 'hintBtn') +
        '</button>'
    });

    const topHint = container.querySelector('#radTopHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    const isLast = stepIdx >= totalSteps - 1;
    const card = document.createElement('div');
    card.className = 'card';

    if (zh) {
      const rd = zhRounds[stepIdx];
      const item = rd.item;

      let partBtnsHtml = '';
      for (let i = 0; i < rd.options.length; i++) {
        const p = rd.options[i];
        const isElim = Boolean(zhEliminated[p]);
        const isWrong = Boolean(zhWrong[p]);
        const isRight = solved && p === item.part;
        const dis = solved || isElim || isWrong ? 'disabled' : '';

        const bg = isRight ? '#e6f7f0' : '#fffdf8';
        const bdr = isRight ? '#1d7a5f' : isWrong ? '#d9822b' : '#d6c7b2';
        const op = isElim ? '0.35' : isWrong ? '0.45' : '1';

        partBtnsHtml +=
          '<button type="button" class="rad-zh-opt" data-part="' +
          escHtml(p) +
          '" ' +
          dis +
          ' style="height:78px;border-radius:14px;border:2.5px solid ' +
          bdr +
          ';background:' +
          bg +
          ';opacity:' +
          op +
          ';font-size:2rem;font-weight:900;color:#2e2218;cursor:' +
          (dis ? 'default' : 'pointer') +
          ';display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
            '<span>' + escHtml(p) + '</span>' +
          '</button>';
      }

      const doneHtml = solved
        ? '<div class="feedback-banner" style="margin-top:0.9rem;">' +
            '<div style="display:flex;align-items:center;gap:0.85rem;flex-wrap:wrap;">' +
              '<div style="width:68px;height:68px;border-radius:14px;background:#1d7a5f;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:2.4rem;font-weight:900;box-shadow:0 4px 12px rgba(29,122,95,0.28);">' +
                escHtml(item.char) +
              '</div>' +
              '<div style="flex:1;min-width:180px;">' +
                '<div style="font-weight:900;font-size:1.12rem;color:#165240;">' +
                  escHtml(item.radical + ' + ' + item.part + ' ＝ ' + item.char + '（' + item.wordZh + '）') +
                '</div>' +
                '<div style="font-size:0.9rem;color:#465a52;margin-top:0.2rem;">' + escHtml(randomPraise(lang)) + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="margin-top:0.7rem;">' +
              '<button type="button" class="btn btn-jade btn-full" id="radNextBtn">' +
                (isLast ? t(lang, 'finishDish') : '鍛造下一個漢字（第 ' + (stepIdx + 2) + ' / ' + totalSteps + ' 題）→') +
              '</button>' +
            '</div>' +
          '</div>'
        : '';

      card.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">' +
          '<div>' +
            '<span class="news-tag">漢字部首合字坊 · 第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 題</span>' +
            '<div class="prompt-title" style="margin-top:0.25rem;">🀄 揀選正確部件，同部首合成目標漢字</div>' +
          '</div>' +
          '<div style="display:flex;gap:0.45rem;flex-wrap:wrap;">' +
            '<button type="button" class="chip-btn" id="radSpeakBtn">' + t(lang, 'listenCantonese') + '</button>' +
            '<button type="button" class="chip-btn" id="radCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="prompt-box" style="margin-bottom:0.85rem;">' +
          '<div style="font-size:0.96rem;font-weight:800;color:#5c3d1e;margin-bottom:0.65rem;">💡 字義線索：' +
            escHtml(item.clueZh) +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:0.65rem;padding:0.4rem 0;">' +
            '<div style="width:74px;height:74px;border-radius:14px;background:#fff5e1;border:2.5px solid #d4943a;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
              '<span style="font-size:0.7rem;color:#8c5814;font-weight:700;">部首</span>' +
              '<span style="font-size:2rem;font-weight:900;color:#5a3408;line-height:1.1;">' + escHtml(item.radical) + '</span>' +
            '</div>' +
            '<span style="font-size:1.5rem;font-weight:900;color:#9b8670;">＋</span>' +
            '<div style="width:74px;height:74px;border-radius:14px;background:' + (solved ? '#e6f7f0' : '#faf6ef') + ';border:2.5px dashed ' + (solved ? '#1d7a5f' : '#b8a894') + ';display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
              '<span style="font-size:0.7rem;color:#7a6b5a;font-weight:700;">部件</span>' +
              '<span style="font-size:2rem;font-weight:900;color:#1d7a5f;line-height:1.1;">' + (solved ? escHtml(item.part) : '？') + '</span>' +
            '</div>' +
            '<span style="font-size:1.5rem;font-weight:900;color:#9b8670;">＝</span>' +
            '<div style="width:78px;height:78px;border-radius:14px;background:' + (solved ? '#1d7a5f' : '#f2ece1') + ';border:2.5px solid ' + (solved ? '#125440' : '#cfc1ae') + ';display:flex;align-items:center;justify-content:center;font-size:2.25rem;font-weight:900;color:' + (solved ? '#ffffff' : '#9c8c7a') + ';">' +
              (solved ? escHtml(item.char) : '？') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0.6rem;">' +
          partBtnsHtml +
        '</div>' +
        doneHtml;

      container.appendChild(card);

      const speakBtn = card.querySelector('#radSpeakBtn');
      if (speakBtn) {
        speakBtn.addEventListener('click', function () {
          const textToRead = solved
            ? item.char + '，' + item.wordZh + '。' + item.clueZh
            : '部首係 ' + item.radical + '。線索：' + item.clueZh;
          speakText(textToRead, 'zh');
        });
      }

      const cardHint = card.querySelector('#radCardHintBtn');
      if (cardHint) cardHint.addEventListener('click', triggerHint);

      const optBtns = card.querySelectorAll('.rad-zh-opt');
      for (let i = 0; i < optBtns.length; i++) {
        optBtns[i].addEventListener('click', function () {
          if (solved) return;
          const picked = this.getAttribute('data-part');
          if (picked === item.part) {
            solved = true;
            playSfx('correct', state.sound);
            notifyStageBaoBo(
              'correct',
              lang,
              stepIdx + 1,
              '🎉 噹噹！阿喵揮毫合字成功：「' + item.radical + '」加「' + item.part + '」就係「' + item.char + '」（' + item.wordZh + '）喵！'
            );
            renderCurrent();
          } else {
            totalMisses += 1;
            zhWrong[picked] = true;
            playSfx('gentle', state.sound);
            notifyStageBaoBo(
              'gentle',
              lang,
              0,
              '🐾 「' + item.radical + '」配「' + picked + '」唔係呢個意思喎，再睇真啲線索揀過喵～'
            );
            renderCurrent();
          }
        });
      }
    } else {
      // English Cozy Word Forge
      const rd = enRounds[stepIdx];
      const item = rd.item;

      let slotsHtml = '';
      for (let s = 0; s < enSlots.length; s++) {
        const tIdx = enSlots[s];
        const ch = tIdx !== null ? rd.tiles[tIdx].ch : '';
        const locked = Boolean(enLockedSlots[s]);
        const border = solved
          ? '#1d7a5f'
          : enJustWrongWord
          ? '#d97324'
          : locked
          ? '#d4942a'
          : tIdx !== null
          ? '#3b6b5c'
          : '#c5b7a3';
        const bg = solved
          ? '#1d7a5f'
          : locked
          ? '#fff6dc'
          : tIdx !== null
          ? '#ffffff'
          : '#f5efe6';
        const fg = solved ? '#ffffff' : '#2a2118';

        slotsHtml +=
          '<button type="button" class="rad-en-slot" data-slot="' +
          s +
          '" ' +
          (solved || locked || tIdx === null ? 'disabled' : '') +
          ' style="width:46px;height:54px;border-radius:11px;border:2.5px solid ' +
          border +
          ';background:' +
          bg +
          ';color:' +
          fg +
          ';font-size:1.45rem;font-weight:900;cursor:' +
          (solved || locked || tIdx === null ? 'default' : 'pointer') +
          ';display:inline-flex;align-items:center;justify-content:center;">' +
            escHtml(ch) +
          '</button>';
      }

      let trayHtml = '';
      for (let tIdx = 0; tIdx < rd.tiles.length; tIdx++) {
        const used = enSlots.indexOf(tIdx) !== -1;
        trayHtml +=
          '<button type="button" class="rad-en-tile" data-tile="' +
          tIdx +
          '" ' +
          (used || solved ? 'disabled' : '') +
          ' style="width:50px;height:54px;border-radius:12px;border:2px solid #b99362;background:' +
          (used ? '#efe8dc' : '#fff8eb') +
          ';opacity:' +
          (used ? '0.28' : '1') +
          ';font-size:1.45rem;font-weight:900;color:#4e3214;box-shadow:' +
          (used ? 'none' : '0 3px 0 #c9a77a') +
          ';cursor:' +
          (used || solved ? 'default' : 'pointer') +
          ';">' +
            escHtml(rd.tiles[tIdx].ch) +
          '</button>';
      }

      const doneHtml = solved
        ? '<div class="feedback-banner" style="margin-top:0.9rem;">' +
            '<div style="font-weight:800;font-size:1.06rem;">' +
              escHtml(randomPraise(lang)) +
              ' Forged "' +
              escHtml(item.word) +
              '"!' +
            '</div>' +
            '<div style="margin-top:0.65rem;">' +
              '<button type="button" class="btn btn-jade btn-full" id="radNextBtn">' +
                (isLast ? t(lang, 'finishDish') : 'Forge Next Word (' + (stepIdx + 2) + ' of ' + totalSteps + ') →') +
              '</button>' +
            '</div>' +
          '</div>'
        : '';

      card.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">' +
          '<div>' +
            '<span class="news-tag">Cozy Word Forge · Round ' + (stepIdx + 1) + ' of ' + totalSteps + '</span>' +
            '<div class="prompt-title" style="margin-top:0.25rem;">🀄 Tap the letter tiles in order to forge the word</div>' +
          '</div>' +
          '<div style="display:flex;gap:0.45rem;flex-wrap:wrap;">' +
            '<button type="button" class="chip-btn" id="radSpeakEnBtn">' + t(lang, 'listenCantonese') + '</button>' +
            '<button type="button" class="chip-btn" id="radUndoEnBtn" ' + (solved ? 'disabled' : '') + '>↩ Undo</button>' +
            '<button type="button" class="chip-btn" id="radCardHintBtn">' + t(lang, 'hintBtn') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="prompt-box" style="margin-bottom:0.85rem;text-align:center;">' +
          '<div style="font-size:0.98rem;font-weight:700;color:#543d26;margin-bottom:0.75rem;">💡 Clue: ' +
            escHtml(item.clueEn) +
          '</div>' +
          '<div style="display:flex;justify-content:center;gap:0.45rem;flex-wrap:wrap;">' +
            slotsHtml +
          '</div>' +
          (enJustWrongWord
            ? '<div class="gentle-retry" style="margin-top:0.55rem;font-size:0.86rem;color:#a85511;">Almost! Tap any letter slot above or press ↩ Undo to swap letters.</div>'
            : '') +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap;padding:0.35rem 0;">' +
          trayHtml +
        '</div>' +
        doneHtml;

      container.appendChild(card);

      const speakEnBtn = card.querySelector('#radSpeakEnBtn');
      if (speakEnBtn) {
        speakEnBtn.addEventListener('click', function () {
          speakText(solved ? item.word + '. ' + item.clueEn : item.clueEn, 'en');
        });
      }

      const undoBtn = card.querySelector('#radUndoEnBtn');
      if (undoBtn) {
        undoBtn.addEventListener('click', function () {
          if (solved) return;
          for (let s = enSlots.length - 1; s >= 0; s--) {
            if (enSlots[s] !== null && !enLockedSlots[s]) {
              enSlots[s] = null;
              enJustWrongWord = false;
              playSfx('tap', state.sound);
              renderCurrent();
              return;
            }
          }
        });
      }

      const cardHint = card.querySelector('#radCardHintBtn');
      if (cardHint) cardHint.addEventListener('click', triggerHint);

      const slotBtns = card.querySelectorAll('.rad-en-slot');
      for (let i = 0; i < slotBtns.length; i++) {
        slotBtns[i].addEventListener('click', function () {
          if (solved) return;
          const pos = Number(this.getAttribute('data-slot'));
          if (enLockedSlots[pos] || enSlots[pos] === null) return;
          enSlots[pos] = null;
          enJustWrongWord = false;
          playSfx('tap', state.sound);
          renderCurrent();
        });
      }

      const tileBtns = card.querySelectorAll('.rad-en-tile');
      for (let i = 0; i < tileBtns.length; i++) {
        tileBtns[i].addEventListener('click', function () {
          if (solved) return;
          const tIdx = Number(this.getAttribute('data-tile'));
          if (enSlots.indexOf(tIdx) !== -1) return;
          for (let s = 0; s < enSlots.length; s++) {
            if (enSlots[s] === null) {
              enSlots[s] = tIdx;
              enJustWrongWord = false;
              playSfx('tap', state.sound);
              checkEnCompletion();
              if (!solved && !enJustWrongWord) {
                renderCurrent();
              }
              return;
            }
          }
        });
      }
    }

    const nextBtn = card.querySelector('#radNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', finishOrAdvance);
    }
  }

  renderCurrent();
  notifyStageBaoBo(
    'intro',
    lang,
    0,
    zh
      ? '🐾 歡迎嚟到拆字拼詞館！睇住部首同字義線索，幫阿喵揀啱另一半部件合成靚字喵～'
      : '🐾 Welcome to Mochi’s Cozy Word Forge! Read the clue and tap the scrambled tiles to build each word~'
  );
}

/* =========================================================================
   5. CUP SHUFFLE GAME (🧺 蒸籠轉盤猜猜看 · Mochi's Steamer Shuffle)
   ========================================================================= */

function generateSteamerRoundPlan(state, cupCount, bunCount, swapCount) {
  let chosen = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const indices = [];
    for (let i = 0; i < cupCount; i++) indices.push(i);
    const bunCups = shuffleList(indices).slice(0, bunCount).sort(function (a, b) {
      return a - b;
    });

    const swaps = [];
    let prevKey = '';
    for (let s = 0; s < swapCount; s++) {
      let a = 0;
      let b = 1;
      for (let pickTry = 0; pickTry < 20; pickTry++) {
        a = Math.floor(Math.random() * cupCount);
        b = Math.floor(Math.random() * cupCount);
        if (a === b) continue;
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const k = lo + '-' + hi;
        if (k !== prevKey) {
          a = lo;
          b = hi;
          prevKey = k;
          break;
        }
      }
      if (a === b) b = (a + 1) % cupCount;
      swaps.push([a, b]);
    }

    const sig =
      cupCount +
      'c_' +
      bunCups.join('') +
      '_' +
      swaps
        .map(function (p) {
          return p[0] + '' + p[1];
        })
        .join('-');

    chosen = { bunCups: bunCups, swaps: swaps, sig: sig };
    if (!hasSeenSignature(state, 'cupshuffle_sigs', sig)) {
      break;
    }
  }

  markSeenSignature(state, 'cupshuffle_sigs', chosen.sig, 400);
  return chosen;
}

function renderSteamerInteriorSvg(hasBun, isOpenedEmpty) {
  if (hasBun) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" style="width:100%;height:auto;display:block;">' +
        // Bamboo rim base
        '<ellipse cx="45" cy="54" rx="37" ry="23" fill="#d4a36a" stroke="#8f5d2c" stroke-width="2.5" />' +
        '<ellipse cx="45" cy="50" rx="33" ry="19" fill="#5e3a19" />' +
        // Steamer paper + glowing Golden Custard Bun
        '<ellipse cx="45" cy="52" rx="22" ry="13" fill="#fffdf7" opacity="0.9" />' +
        '<ellipse cx="45" cy="46" rx="19" ry="15" fill="#ffca3a" stroke="#d48806" stroke-width="2" />' +
        '<ellipse cx="40" cy="41" rx="7" ry="4.5" fill="#fff3b0" opacity="0.8" />' +
        // Mochi golden bell stamp on top of bun
        '<circle cx="45" cy="45" r="3.2" fill="#d9480f" opacity="0.75" />' +
        '<text x="45" y="22" text-anchor="middle" font-size="14">✨</text>' +
      '</svg>'
    );
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" style="width:100%;height:auto;display:block;">' +
      '<ellipse cx="45" cy="54" rx="37" ry="23" fill="#d4a36a" stroke="#8f5d2c" stroke-width="2.5" />' +
      '<ellipse cx="45" cy="50" rx="33" ry="19" fill="#4a2e14" />' +
      (isOpenedEmpty
        ? '<text x="45" y="54" text-anchor="middle" font-size="16" fill="#e9dac4">💨</text>'
        : '') +
    '</svg>'
  );
}

function renderSteamerLidSvg() {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" style="width:100%;height:auto;display:block;">' +
      // Woven bamboo dome lid
      '<ellipse cx="45" cy="54" rx="38" ry="24" fill="#c79052" stroke="#7c4c1e" stroke-width="2.5" />' +
      '<ellipse cx="45" cy="46" rx="35" ry="21" fill="#e0ae70" stroke="#8f5d2c" stroke-width="2" />' +
      '<path d="M18 44 L72 44 M24 36 L66 36 M24 52 L66 52" stroke="#b57d40" stroke-width="1.6" opacity="0.65" />' +
      '<ellipse cx="45" cy="44" rx="26" ry="14" fill="none" stroke="#8f5d2c" stroke-width="1.8" stroke-dasharray="4 3" />' +
      // Woven handle knot
      '<circle cx="45" cy="42" r="6.5" fill="#9c632b" stroke="#5e3711" stroke-width="1.8" />' +
      '<circle cx="43.5" cy="40.5" r="2" fill="#e9c496" />' +
    '</svg>'
  );
}

export function mountCupShuffleGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level = getSavedLevel(state, 'cupshuffle');
  const gameMeta = getGameMeta('cupshuffle', '🧺', '蒸籠轉盤猜猜看', "Mochi's Steamer Shuffle");

  const totalSteps = 3;
  const cupCount = level === 0 ? 3 : level === 1 ? 4 : 5;
  const bunCount = level === 2 ? 2 : 1;
  const swapCount = level === 0 ? 5 : level === 1 ? 6 : 8;

  const plans = [
    generateSteamerRoundPlan(state, cupCount, bunCount, swapCount),
    generateSteamerRoundPlan(state, cupCount, bunCount, swapCount),
    generateSteamerRoundPlan(state, cupCount, bunCount, swapCount)
  ];

  let stepIdx = 0;
  let phase = 'reveal'; // 'reveal' | 'shuffling' | 'guess' | 'done'
  // slotOfCup[cupId] = current horizontal slot index (0..cupCount-1)
  let slotOfCup = [];
  let arcOffsetCup = {};
  let openedCups = {};
  let foundBunCups = [];
  let swapProgressText = '';
  let activeTimers = [];
  let totalMisses = 0;
  let totalHints = 0;

  function clearAllTimers() {
    for (let i = 0; i < activeTimers.length; i++) {
      clearTimeout(activeTimers[i]);
    }
    activeTimers = [];
  }

  function scheduleTimer(fn, ms) {
    const id = setTimeout(fn, ms);
    activeTimers.push(id);
    return id;
  }

  function initRound() {
    clearAllTimers();
    phase = 'reveal';
    slotOfCup = [];
    for (let c = 0; c < cupCount; c++) {
      slotOfCup.push(c);
    }
    arcOffsetCup = {};
    openedCups = {};
    foundBunCups = [];
    const plan = plans[stepIdx];
    for (let i = 0; i < plan.bunCups.length; i++) {
      openedCups[plan.bunCups[i]] = true;
    }
    swapProgressText = '';
  }

  initRound();

  function cupHasBun(cupId) {
    return plans[stepIdx].bunCups.indexOf(cupId) !== -1;
  }

  function updateSteamerTransformsInDom() {
    for (let c = 0; c < cupCount; c++) {
      const wrap = container.querySelector('#steamerCupWrap_' + c);
      if (wrap) {
        const slot = slotOfCup[c];
        const yArc = arcOffsetCup[c] || 0;
        wrap.style.transform = 'translateX(' + (slot * 100) + '%) translateY(' + yArc + 'px)';
        wrap.style.zIndex = yArc < 0 ? '6' : yArc > 0 ? '4' : '2';
      }
      const lid = container.querySelector('#steamerLid_' + c);
      if (lid) {
        const isOpen = Boolean(openedCups[c]);
        lid.style.transform = isOpen ? 'translateY(-44px) rotate(-10deg)' : 'translateY(0px) rotate(0deg)';
        lid.style.opacity = isOpen ? '0.22' : '1';
      }
    }
    const statusPill = container.querySelector('#cupShuffleStatusPill');
    if (statusPill) {
      statusPill.textContent = swapProgressText;
    }
  }

  function startShufflingSequence() {
    if (phase !== 'reveal') return;
    phase = 'shuffling';
    openedCups = {};
    swapProgressText = zh ? '🐾 落蓋準備中…' : '🐾 Closing bamboo lids…';
    playSfx('tap', state.sound);
    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '🐾 睇實我隻貓爪推邊籠喵～！千祈唔好眨眼呀！'
        : '🐾 Watch closely where my paws slide each steamer, meow~!'
    );

    // Update controls & close lids smoothly before first swap
    renderStageCardOnly();

    const swaps = plans[stepIdx].swaps;
    const stepMs = 485;

    for (let s = 0; s < swaps.length; s++) {
      (function (swapIndex) {
        scheduleTimer(function () {
          if (!container.isConnected) return;
          const pair = swaps[swapIndex];
          const slotA = pair[0];
          const slotB = pair[1];

          // Find which cupIds are currently sitting in slotA and slotB
          let cupA = -1;
          let cupB = -1;
          for (let c = 0; c < cupCount; c++) {
            if (slotOfCup[c] === slotA) cupA = c;
            else if (slotOfCup[c] === slotB) cupB = c;
          }

          if (cupA !== -1 && cupB !== -1) {
            slotOfCup[cupA] = slotB;
            slotOfCup[cupB] = slotA;
            arcOffsetCup = {};
            arcOffsetCup[cupA] = -10;
            arcOffsetCup[cupB] = 10;
          }

          swapProgressText = zh
            ? '🐾 阿喵洗籠中（' + (swapIndex + 1) + ' / ' + swaps.length + '）'
            : '🐾 Shuffling (' + (swapIndex + 1) + ' / ' + swaps.length + ')';
          playSfx('flip', state.sound);
          updateSteamerTransformsInDom();

          scheduleTimer(function () {
            arcOffsetCup = {};
            updateSteamerTransformsInDom();
          }, 290);
        }, 430 + swapIndex * stepMs);
      })(s);
    }

    scheduleTimer(function () {
      if (!container.isConnected) return;
      phase = 'guess';
      arcOffsetCup = {};
      swapProgressText =
        bunCount === 2
          ? zh
            ? '👆 請揀出藏住金鈴奶皇包嘅 2 籠（已搵 ' + foundBunCups.length + '/2）'
            : '👆 Tap the 2 steamers hiding the Golden Buns (' + foundBunCups.length + '/2)'
          : zh
          ? '👆 請輕撳藏住金鈴奶皇包嗰一籠！'
          : '👆 Tap the steamer hiding the Golden Custard Bun!';
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '✨ 停手喵！金鈴奶皇包而家跟住竹籠去咗邊度呢？揀一籠開蓋啦！'
          : '✨ Paws off, meow! Which bamboo steamer has the Golden Custard Bun now?'
      );
      renderStageCardOnly();
    }, 520 + swaps.length * stepMs);
  }

  function triggerHint() {
    if (phase !== 'guess') {
      playSfx('tap', state.sound);
      notifyStageBaoBo(
        'intro',
        lang,
        0,
        zh
          ? '🐾 等阿喵洗完籠停定之後，就可以撳「💡 貼士」幫你揭開一籠空蒸籠喵！'
          : '🐾 Wait until Mochi finishes shuffling — then 💡 Hint can lift an empty steamer lid for you!'
      );
      return;
    }

    const emptyClosed = [];
    for (let c = 0; c < cupCount; c++) {
      if (!cupHasBun(c) && !openedCups[c]) {
        emptyClosed.push(c);
      }
    }
    if (emptyClosed.length === 0) return;

    const pick = emptyClosed[Math.floor(Math.random() * emptyClosed.length)];
    openedCups[pick] = true;
    totalHints += 1;
    playSfx('switch', state.sound);
    notifyStageBaoBo(
      'intro',
      lang,
      0,
      zh
        ? '💡 阿喵偷偷揭開咗一籠「💨 空籠」！範圍即刻細咗喵～'
        : '💡 Mochi peeked and lifted an empty steamer lid (💨) to narrow it down!'
    );
    renderStageCardOnly();
  }

  function handleCupTap(cupId) {
    if (phase !== 'guess') return;
    if (openedCups[cupId]) return;

    openedCups[cupId] = true;
    if (cupHasBun(cupId)) {
      foundBunCups.push(cupId);
      if (foundBunCups.length >= bunCount) {
        phase = 'done';
        playSfx('correct', state.sound);
        notifyStageBaoBo(
          'correct',
          lang,
          stepIdx + 1,
          zh
            ? '🎉 喵嗚～好眼力！熱辣辣香噴噴嘅金鈴奶皇包一開即中！'
            : '🎉 Purr-fect tracking! Steaming hot Golden Custard Bun(s) found right away!'
        );
      } else {
        playSfx('tap', state.sound);
        swapProgressText = zh
          ? '✨ 搵到第 1 籠奶皇包！仲有 1 籠匿埋緊喵！'
          : '✨ Found 1 Golden Bun — 1 more steamer to go!';
        notifyStageBaoBo(
          'correct',
          lang,
          1,
          zh
            ? '✨ 中咗第一籠金鈴奶皇包！仲有一籠喺邊度呢喵？'
            : '✨ That is 1 Golden Custard Bun! Where did the second one go, meow?'
        );
      }
      renderStageCardOnly();
    } else {
      totalMisses += 1;
      playSfx('gentle', state.sound);
      notifyStageBaoBo(
        'gentle',
        lang,
        0,
        zh
          ? '💨 哎呀，呢籠得陣白煙係空籠嚟㗎！再揀隔離未開嗰籠試下喵～'
          : '💨 Puff of steam — empty basket! Try one of the remaining closed steamers, meow~'
      );
      renderStageCardOnly();
    }
  }

  function renderStageCardOnly() {
    const host = container.querySelector('#cupShuffleCardHost');
    if (!host) return;

    const widthPct = (100 / cupCount).toFixed(4);
    let steamersHtml = '';
    for (let c = 0; c < cupCount; c++) {
      const slot = slotOfCup[c];
      const yArc = arcOffsetCup[c] || 0;
      const isOpen = Boolean(openedCups[c]);
      const hasBun = cupHasBun(c);
      const clickable = phase === 'guess' && !isOpen;

      steamersHtml +=
        '<div id="steamerCupWrap_' +
        c +
        '" class="steamer-cup-unit" data-cup="' +
        c +
        '" role="button" tabindex="' +
        (clickable ? '0' : '-1') +
        '" style="position:absolute;top:28px;left:0%;width:' +
        widthPct +
        '%;padding:0 4px;box-sizing:border-box;transform:translateX(' +
        slot * 100 +
        '%) translateY(' +
        yArc +
        'px);transition:transform 0.44s cubic-bezier(0.34, 1.25, 0.64, 1);cursor:' +
        (clickable ? 'pointer' : 'default') +
        ';user-select:none;">' +
          '<div style="position:relative;max-width:96px;margin:0 auto;">' +
            renderSteamerInteriorSvg(hasBun && isOpen, !hasBun && isOpen) +
            '<div id="steamerLid_' +
              c +
              '" style="position:absolute;inset:0;pointer-events:none;transform:' +
              (isOpen ? 'translateY(-44px) rotate(-10deg)' : 'translateY(0px) rotate(0deg)') +
              ';opacity:' +
              (isOpen ? '0.22' : '1') +
              ';transition:transform 0.34s ease,opacity 0.3s ease;">' +
              renderSteamerLidSvg() +
            '</div>' +
            '<div style="text-align:center;font-size:0.78rem;font-weight:800;margin-top:2px;color:' +
              (isOpen && hasBun ? '#b36b00' : isOpen ? '#8c7d6e' : '#5a3d22') +
              ';">' +
              (isOpen
                ? hasBun
                  ? zh ? '🌟 奶皇包' : '🌟 Golden Bun'
                  : zh ? '💨 空籠' : '💨 Empty'
                : clickable
                ? zh ? '👆 開蓋' : '👆 Open'
                : '🧺') +
            '</div>' +
          '</div>' +
        '</div>';
    }

    const isLast = stepIdx >= totalSteps - 1;
    let bottomActionHtml = '';
    if (phase === 'reveal') {
      bottomActionHtml =
        '<button type="button" class="btn btn-primary btn-full" id="cupStartShuffleBtn">' +
          (zh ? '睇實喇！阿喵開始洗籠 →' : 'Ready! Shuffle Steamers →') +
        '</button>';
    } else if (phase === 'done') {
      bottomActionHtml =
        '<div class="feedback-banner" style="margin-top:0.5rem;">' +
          '<div style="font-weight:800;font-size:1.05rem;">' +
            escHtml(randomPraise(lang)) +
            ' ' +
            (zh ? '金鈴奶皇包熱騰騰出爐！' : 'You tracked Mochi’s steamer shuffle cleanly!') +
          '</div>' +
          '<div style="margin-top:0.65rem;">' +
            '<button type="button" class="btn btn-jade btn-full" id="cupNextRoundBtn">' +
              (isLast
                ? t(lang, 'finishDish')
                : zh
                ? '下一輪蒸籠轉盤（第 ' + (stepIdx + 2) + ' / ' + totalSteps + ' 局）→'
                : 'Next Steamer Round (' + (stepIdx + 2) + ' of ' + totalSteps + ') →') +
            '</button>' +
          '</div>' +
        '</div>';
    }

    const bannerLine =
      phase === 'reveal'
        ? bunCount === 2
          ? zh
            ? '👀 先認住呢 2 籠閃閃發光嘅「🌟 金鈴奶皇包」位置！'
            : '👀 Memorize which 2 steamers hold the 🌟 Golden Custard Buns!'
          : zh
          ? '👀 先認住呢籠閃閃發光嘅「🌟 金鈴奶皇包」位置！'
          : "👀 Memorize where Mochi's 🌟 Golden Custard Bun starts!"
        : swapProgressText;

    host.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">' +
        '<div>' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (stepIdx + 1) + ' / ' + totalSteps + ' 局 · 阿喵坐莊' : 'Round ' + (stepIdx + 1) + ' of ' + totalSteps + ' · Dealer Mochi') +
          '</span>' +
          '<div class="prompt-title" style="margin-top:0.25rem;">' +
            (zh ? '🧺 睇實阿喵雙爪推竹籠，追蹤金鈴奶皇包去向！' : "🧺 Follow Dealer Mochi's paws and spot the Golden Custard Bun!") +
          '</div>' +
        '</div>' +
        '<button type="button" class="chip-btn" id="cupCardHintBtn" ' + (phase !== 'guess' ? 'disabled' : '') + '>' +
          t(lang, 'hintBtn') +
        '</button>' +
      '</div>' +
      '<div class="prompt-box" style="text-align:center;padding:0.55rem 0.75rem;margin-bottom:0.75rem;">' +
        '<span id="cupShuffleStatusPill" style="font-weight:800;font-size:0.95rem;color:#6e3f14;">' +
          escHtml(bannerLine) +
        '</span>' +
      '</div>' +
      '<div style="position:relative;width:100%;height:172px;border-radius:16px;background:linear-gradient(180deg,#f7ecda 0%,#ead5b7 68%,#cfa878 100%);border:2.5px solid #bfa07a;box-shadow:inset 0 4px 12px rgba(90,55,20,0.1);overflow:hidden;margin-bottom:0.85rem;">' +
        // Rosewood dim sum table runner line
        '<div style="position:absolute;left:12px;right:12px;bottom:22px;height:8px;border-radius:999px;background:rgba(124,72,25,0.18);"></div>' +
        steamersHtml +
      '</div>' +
      bottomActionHtml;

    const cardHint = host.querySelector('#cupCardHintBtn');
    if (cardHint) cardHint.addEventListener('click', triggerHint);

    const startBtn = host.querySelector('#cupStartShuffleBtn');
    if (startBtn) startBtn.addEventListener('click', startShufflingSequence);

    const units = host.querySelectorAll('.steamer-cup-unit');
    for (let i = 0; i < units.length; i++) {
      units[i].addEventListener('click', function () {
        const cId = Number(this.getAttribute('data-cup'));
        handleCupTap(cId);
      });
    }

    const nextBtn = host.querySelector('#cupNextRoundBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopSpeaking();
        clearAllTimers();
        if (isLast) {
          const stars =
            totalMisses <= 1 && totalHints <= 1
              ? 3
              : totalMisses <= 3 && totalHints <= 2
              ? 2
              : 1;
          const score = 95 + level * 15 + stars * 10;
          onComplete({ score: score, stars: stars });
        } else {
          playSfx('switch', state.sound);
          stepIdx += 1;
          initRound();
          renderFullShell();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  function renderFullShell() {
    container.innerHTML = '';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: function (lv) {
        clearAllTimers();
        onLevelChange(lv);
      },
      onBack: function () {
        clearAllTimers();
        onBack();
      },
      stepIndex: stepIdx,
      totalSteps: totalSteps,
      extraRightHtml:
        '<button type="button" class="chip-btn" id="cupTopHintBtn">' +
        t(lang, 'hintBtn') +
        '</button>'
    });

    const topHint = container.querySelector('#cupTopHintBtn');
    if (topHint) topHint.addEventListener('click', triggerHint);

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'cupShuffleCardHost';
    container.appendChild(card);

    renderStageCardOnly();
  }

  renderFullShell();
  notifyStageBaoBo(
    'intro',
    lang,
    0,
    zh
      ? '🐾 蒸籠轉盤開局喇！阿喵今日親自做莊推竹籠～先認住金鈴奶皇包喺邊籠，準備好就撳掣洗籠喵！'
      : '🐾 Dealer Mochi is at the dim sum table! Spot the Golden Custard Bun(s) first, then tap Ready to watch me shuffle~'
  );
}
