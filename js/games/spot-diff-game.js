import { GAME_CATALOG } from '../data/content.js';
import { SPOT_DIFF_PUZZLES, getSpotWorldMeta, renderSpotSceneSvg } from '../data/spot-diff-art.js';
import { drawFreshItems } from '../data/seed-tracker.js';
import { renderStageHeader } from './engine.js';
import { t, pickText, randomPraise, playSfx, speakText, stopSpeaking } from '../i18n.js';

function escHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function selectFreshSpotPuzzles(state, count) {
  const seenList =
    state && state.seen && Array.isArray(state.seen.spotdiff_scenes)
      ? state.seen.spotdiff_scenes
      : [];
  const seenSet = new Set(seenList);

  let preferredPool = SPOT_DIFF_PUZZLES;
  if (state.region === 'hk') {
    preferredPool = SPOT_DIFF_PUZZLES.filter(function (p) {
      return p.region === 'hk' || p.region === 'both';
    });
  } else if (state.region === 'yvr') {
    preferredPool = SPOT_DIFF_PUZZLES.filter(function (p) {
      return p.region === 'yvr' || p.region === 'both';
    });
  }

  const unseenPreferred = preferredPool.filter(function (p) {
    return !seenSet.has(p.id);
  });

  // If regional subset still has enough unseen puzzles, draw from it; otherwise draw from full 300-puzzle bank before rolling over!
  const activePool = unseenPreferred.length >= count ? preferredPool : SPOT_DIFF_PUZZLES;
  return drawFreshItems(state, 'spotdiff_scenes', activePool, count, function (p) {
    return p.id;
  });
}

export function mountSpotDiffGame(ctx) {
  const container = ctx.container;
  const state = ctx.state;
  const onBack = ctx.onBack;
  const onComplete = ctx.onComplete;
  const onLevelChange = ctx.onLevelChange;

  const lang = state.lang;
  const zh = lang !== 'en';
  const level =
    typeof state.stats.perGameLevel.spotdiff === 'number'
      ? state.stats.perGameLevel.spotdiff
      : 1;
  const gameMeta = GAME_CATALOG.find(function (g) {
    return g.id === 'spotdiff';
  });

  const totalScenes = 2;
  const diffCount = level === 0 ? 3 : level === 1 ? 4 : 5;
  const sessionPuzzles = selectFreshSpotPuzzles(state, totalScenes);

  let sceneIdx = 0;
  let totalMisses = 0;
  let totalHints = 0;
  let foundSlots = [];
  let activeHintSlot = null;
  let missRipple = null; // { panel: 'a'|'b', x: number, y: number }
  let missTimer = null;

  function setMochiLine(text) {
    const lineEl = container.querySelector('#stageBaoBoSpeechText');
    if (lineEl) {
      lineEl.textContent = text;
    }
  }

  function buildOverlayInnerSvg(worldMeta, panelKey) {
    const parts = [];

    // Pulsing golden hint halo if active and not yet found
    if (activeHintSlot !== null && foundSlots.indexOf(activeHintSlot) === -1) {
      const hSpot = worldMeta.hotspots[activeHintSlot];
      if (hSpot) {
        const hr = (hSpot.r || 28) + 6;
        parts.push(
          '<g class="spot-hint-group">' +
            '<circle cx="' + hSpot.x + '" cy="' + hSpot.y + '" r="' + hr + '" class="spot-hint-ring-outer" />' +
            '<circle cx="' + hSpot.x + '" cy="' + hSpot.y + '" r="' + (hr - 5) + '" class="spot-hint-ring-inner" />' +
          '</g>'
        );
      }
    }

    // Found difference rings + numbered badges on BOTH panels
    for (let i = 0; i < foundSlots.length; i++) {
      const slotIdx = foundSlots[i];
      const hs = worldMeta.hotspots[slotIdx];
      if (!hs) continue;
      const rr = hs.r || 28;
      const bx = Math.min(344, Math.max(16, hs.x + rr * 0.68));
      const by = Math.max(16, Math.min(214, hs.y - rr * 0.68));
      parts.push(
        '<g class="spot-found-group">' +
          '<circle cx="' + hs.x + '" cy="' + hs.y + '" r="' + rr + '" class="spot-found-ring-halo" />' +
          '<circle cx="' + hs.x + '" cy="' + hs.y + '" r="' + rr + '" class="spot-found-ring" />' +
          '<circle cx="' + bx + '" cy="' + by + '" r="10.5" fill="#16805D" stroke="#FFFFFF" stroke-width="2.2" />' +
          '<text x="' + bx + '" y="' + (by + 3.8) + '" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="900">' +
            (i + 1) +
          '</text>' +
        '</g>'
      );
    }

    // Gentle fleeting amber ripple on miss (only on the tapped panel)
    if (missRipple && missRipple.panel === panelKey) {
      parts.push(
        '<circle cx="' +
          missRipple.x.toFixed(1) +
          '" cy="' +
          missRipple.y.toFixed(1) +
          '" r="16" class="spot-miss-ripple" />'
      );
    }

    return parts.join('');
  }

  function buildChipsHtml(worldMeta) {
    const chips = [];
    for (let i = 0; i < diffCount; i++) {
      if (i < foundSlots.length) {
        const hs = worldMeta.hotspots[foundSlots[i]];
        const label = hs ? pickText(hs, lang) : '#' + (i + 1);
        chips.push(
          '<span class="spot-chip found">✅ ' + escHtml(label) + '</span>'
        );
      } else {
        chips.push(
          '<span class="spot-chip pending">🔍 ' +
            (zh ? '第 ' + (i + 1) + ' 處' : 'Spot ' + (i + 1)) +
          '</span>'
        );
      }
    }
    return chips.join('');
  }

  function refreshSceneDynamicUi(puzzle, worldMeta) {
    const ovA = container.querySelector('#spotOverlayA');
    const ovB = container.querySelector('#spotOverlayB');
    if (ovA) ovA.innerHTML = buildOverlayInnerSvg(worldMeta, 'a');
    if (ovB) ovB.innerHTML = buildOverlayInnerSvg(worldMeta, 'b');

    const countEl = container.querySelector('#spotProgressPill');
    if (countEl) {
      countEl.textContent = zh
        ? '已搵出 ' + foundSlots.length + ' / ' + diffCount + ' 處'
        : 'Found ' + foundSlots.length + ' / ' + diffCount;
    }

    const chipsWrap = container.querySelector('#spotChipsRow');
    if (chipsWrap) {
      chipsWrap.innerHTML = buildChipsHtml(worldMeta);
    }

    const doneArea = container.querySelector('#spotDoneBannerArea');
    if (doneArea) {
      if (foundSlots.length >= diffCount) {
        const isLastScene = sceneIdx >= sessionPuzzles.length - 1;
        doneArea.innerHTML =
          '<div class="feedback-banner spot-complete-banner">' +
            '<div style="font-size:1.08rem;font-weight:900;">🎉 ' +
              escHtml(randomPraise(lang)) +
              ' ' +
              (zh
                ? '搵齊晒呢幅畫嘅 ' + diffCount + ' 處唔同！'
                : 'You spotted all ' + diffCount + ' differences in this scene!') +
            '</div>' +
            '<div style="margin-top:0.75rem;">' +
              '<button type="button" class="btn btn-jade btn-full" id="spotNextSceneBtn">' +
                (isLastScene
                  ? t(lang, 'finishDish')
                  : zh
                  ? '下一幅插畫（第 2 / 2 幅）→'
                  : 'Next Scene (2 of 2) →') +
              '</button>' +
            '</div>' +
          '</div>';

        const nextBtn = doneArea.querySelector('#spotNextSceneBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            stopSpeaking();
            if (isLastScene) {
              const stars =
                totalMisses <= 2 && totalHints <= 1
                  ? 3
                  : totalMisses <= 6 && totalHints <= 3
                  ? 2
                  : 1;
              const pts = 95 + level * 15 + stars * 10;
              onComplete({ score: pts, stars: stars });
            } else {
              playSfx('switch', state.sound);
              sceneIdx += 1;
              foundSlots = [];
              activeHintSlot = null;
              missRipple = null;
              renderScene();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          });
        }
      } else {
        doneArea.innerHTML = '';
      }
    }
  }

  function triggerHint(puzzle, worldMeta) {
    if (foundSlots.length >= diffCount) return;
    const activeDiffs = puzzle.diffs.slice(0, diffCount);
    let targetSlot = null;
    for (let i = 0; i < activeDiffs.length; i++) {
      const sl = activeDiffs[i].slot;
      if (foundSlots.indexOf(sl) === -1) {
        targetSlot = sl;
        break;
      }
    }
    if (targetSlot === null) return;

    if (activeHintSlot !== targetSlot) {
      totalHints += 1;
    }
    activeHintSlot = targetSlot;
    playSfx('switch', state.sound);

    const hs = worldMeta.hotspots[targetSlot];
    const propName = hs ? pickText(hs, lang) : '';
    const msg = zh
      ? '💡 阿喵貼士：望真啲「' + propName + '」附近有咩唔同喵～！'
      : '💡 Mochi Hint: Look closely around the "' + propName + '"!';
    setMochiLine(msg);
    refreshSceneDynamicUi(puzzle, worldMeta);
  }

  function handleCanvasTap(ev, panelKey, wrapEl, puzzle, worldMeta) {
    if (foundSlots.length >= diffCount) return;
    const rect = wrapEl.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const svgX = ((ev.clientX - rect.left) / rect.width) * 360;
    const svgY = ((ev.clientY - rect.top) / rect.height) * 230;

    const activeDiffs = puzzle.diffs.slice(0, diffCount);
    let bestSlot = null;
    let bestDist = Infinity;

    for (let i = 0; i < activeDiffs.length; i++) {
      const slot = activeDiffs[i].slot;
      const hs = worldMeta.hotspots[slot];
      if (!hs) continue;
      const dist = Math.hypot(svgX - hs.x, svgY - hs.y);
      const hitRadius = (hs.r || 28) + 10;
      if (dist <= hitRadius && dist < bestDist) {
        bestDist = dist;
        bestSlot = slot;
      }
    }

    if (bestSlot !== null) {
      const hs = worldMeta.hotspots[bestSlot];
      const propName = hs ? pickText(hs, lang) : '';

      if (foundSlots.indexOf(bestSlot) !== -1) {
        playSfx('tap', state.sound);
        setMochiLine(
          zh
            ? '😊 「' + propName + '」頭先已經圈起咗喇，再搵下其他位置啦！'
            : '😊 You already spotted "' + propName + '" — check another spot!'
        );
        return;
      }

      foundSlots.push(bestSlot);
      if (activeHintSlot === bestSlot) {
        activeHintSlot = null;
      }
      missRipple = null;
      playSfx('correct', state.sound);

      const remain = diffCount - foundSlots.length;
      if (remain > 0) {
        setMochiLine(
          zh
            ? '✨ 好眼力！搵到「' + propName + '」唔同咗，仲差 ' + remain + ' 處喵！'
            : '✨ Sharp eyes! Spotted "' + propName + '" — ' + remain + ' more to go!'
        );
      } else {
        setMochiLine(
          zh
            ? '🎉 勁呀！成幅畫 ' + diffCount + ' 處唔同全部搵齊晒喵！'
            : '🎉 Purr-fect! All ' + diffCount + ' differences found!'
        );
      }

      refreshSceneDynamicUi(puzzle, worldMeta);
      if (remain === 0) {
        const doneEl = container.querySelector('#spotDoneBannerArea');
        if (doneEl && typeof doneEl.scrollIntoView === 'function') {
          setTimeout(function () {
            doneEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 120);
        }
      }
    } else {
      totalMisses += 1;
      playSfx('gentle', state.sound);
      missRipple = { panel: panelKey, x: svgX, y: svgY };
      if (missTimer) clearTimeout(missTimer);
      setMochiLine(
        zh
          ? '👀 呢度兩幅一樣㗎～慢慢對比下顏色、數目或者裝飾，隨時可撳「💡 貼士」！'
          : '👀 Both match there! Compare colors, counts & details — or tap 💡 Hint anytime!'
      );
      refreshSceneDynamicUi(puzzle, worldMeta);
      missTimer = setTimeout(function () {
        missRipple = null;
        const ov = container.querySelector(panelKey === 'a' ? '#spotOverlayA' : '#spotOverlayB');
        if (ov) ov.innerHTML = buildOverlayInnerSvg(worldMeta, panelKey);
      }, 650);
    }
  }

  function renderScene() {
    container.innerHTML = '';
    const puzzle = sessionPuzzles[sceneIdx];
    const worldMeta = getSpotWorldMeta(puzzle.worldId);

    const headerToolsHtml =
      '<button type="button" class="chip-btn spot-hint-top-btn" id="spotHeaderHintBtn">' +
        t(lang, 'hintBtn') +
      '</button>';

    renderStageHeader({
      container: container,
      gameMeta: gameMeta,
      lang: lang,
      level: level,
      onChangeLevel: onLevelChange,
      onBack: onBack,
      stepIndex: sceneIdx,
      totalSteps: sessionPuzzles.length,
      extraRightHtml: headerToolsHtml
    });

    const topHintBtn = container.querySelector('#spotHeaderHintBtn');
    if (topHintBtn) {
      topHintBtn.addEventListener('click', function () {
        triggerHint(puzzle, worldMeta);
      });
    }

    const svgOriginal = renderSpotSceneSvg(puzzle, false, diffCount, puzzle.id + '_s' + sceneIdx);
    const svgModified = renderSpotSceneSvg(puzzle, true, diffCount, puzzle.id + '_s' + sceneIdx);
    const sceneTitle = pickText(worldMeta.title, lang);
    const editionName = pickText(puzzle.editionLabel, lang);

    const card = document.createElement('div');
    card.className = 'card spot-stage-card';
    card.innerHTML =
      '<div class="spot-scene-topbar">' +
        '<div class="spot-scene-title-group">' +
          '<span class="news-tag">' +
            (zh ? '第 ' + (sceneIdx + 1) + '/' + sessionPuzzles.length + ' 幅' : 'Scene ' + (sceneIdx + 1) + '/' + sessionPuzzles.length) +
            ' · ' +
            escHtml(editionName) +
          '</span>' +
          '<h3 class="spot-scene-heading">' + escHtml(sceneTitle) + '</h3>' +
        '</div>' +
        '<div class="spot-scene-actions">' +
          '<span class="spot-progress-pill" id="spotProgressPill">' +
            (zh
              ? '已搵出 ' + foundSlots.length + ' / ' + diffCount + ' 處'
              : 'Found ' + foundSlots.length + ' / ' + diffCount) +
          '</span>' +
          '<button type="button" class="chip-btn" id="spotCardHintBtn">' +
            t(lang, 'hintBtn') +
          '</button>' +
        '</div>' +
      '</div>' +
      '<p class="spot-instruction-line">' +
        (zh
          ? '👆 輕撳「原圖」或「找不同」任何一幅圖入面唔同嘅地方（唔限時間，輕鬆慢慢搵）：'
          : '👆 Tap the differences directly on EITHER picture below (untimed — take your time!):') +
      '</p>' +
      '<div class="spot-diff-grid">' +
        '<div class="spot-panel">' +
          '<div class="spot-panel-label">' +
            '<span>🖼️ ' + (zh ? '原圖對照' : 'Original Scene') + '</span>' +
            '<span class="spot-code-tag">#' + escHtml(puzzle.id) + '</span>' +
          '</div>' +
          '<div class="spot-canvas-wrap" id="spotWrapA" role="button" tabindex="0" aria-label="' +
            (zh ? '原圖插畫，輕撳搵出唔同位置' : 'Original scene — tap differences here') +
          '">' +
            svgOriginal +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" class="spot-overlay-svg" id="spotOverlayA" aria-hidden="true">' +
              buildOverlayInnerSvg(worldMeta, 'a') +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<div class="spot-panel spot-panel-changed">' +
          '<div class="spot-panel-label">' +
            '<span>🔍 ' + (zh ? '找不同（共 ' + diffCount + ' 處）' : 'Spot ' + diffCount + ' Changes') + '</span>' +
            '<span class="spot-tap-tag">' + (zh ? '兩幅都撳得' : 'Tap Either!') + '</span>' +
          '</div>' +
          '<div class="spot-canvas-wrap" id="spotWrapB" role="button" tabindex="0" aria-label="' +
            (zh ? '找不同插畫，輕撳搵出唔同位置' : 'Modified scene — tap differences here') +
          '">' +
            svgModified +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" class="spot-overlay-svg" id="spotOverlayB" aria-hidden="true">' +
              buildOverlayInnerSvg(worldMeta, 'b') +
            '</svg>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="spot-chips-row" id="spotChipsRow">' +
        buildChipsHtml(worldMeta) +
      '</div>' +
      '<div id="spotDoneBannerArea"></div>';

    const cardHintBtn = card.querySelector('#spotCardHintBtn');
    if (cardHintBtn) {
      cardHintBtn.addEventListener('click', function () {
        triggerHint(puzzle, worldMeta);
      });
    }

    const wrapA = card.querySelector('#spotWrapA');
    const wrapB = card.querySelector('#spotWrapB');
    if (wrapA) {
      wrapA.addEventListener('click', function (e) {
        handleCanvasTap(e, 'a', wrapA, puzzle, worldMeta);
      });
    }
    if (wrapB) {
      wrapB.addEventListener('click', function (e) {
        handleCanvasTap(e, 'b', wrapB, puzzle, worldMeta);
      });
    }

    container.appendChild(card);
  }

  renderScene();
}
