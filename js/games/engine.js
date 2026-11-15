import {
  GAME_CATALOG,
  MAHJONG_AND_DIMSUM_TILES,
  WET_MARKET_ITEMS,
  MARKET_CHATS,
  YUM_CHA_MENU,
  EXACT_CHANGE_SCENARIOS,
  TARGET_PAIR_PUZZLES,
  HISTORY_QUESTIONS,
  TIMELINE_SETS,
  IDIOM_QUESTIONS,
  CATEGORY_BOARDS,
  EAGLE_PAIRS
} from '../data/content.js';
import { drawFreshItems, hasSeenSignature, markSeenSignature } from '../data/seed-tracker.js';
import { t, pickText, randomPraise, playSfx, speakText, stopSpeaking } from '../i18n.js';
import { getFamilyPhotos } from '../storage.js';
import { getLiveComboCount } from '../ui-fx.js';
import { mountBaoBo3D, setCurrentStageGameId, getCoachIntroForGame } from '../mascot-3d.js';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let cachedNewsData = null;
export async function fetchDailyNews() {
  if (cachedNewsData) return cachedNewsData;
  try {
    const res = await fetch(`./data/daily-news.json?v=${Date.now().toString().slice(0, 7)}`);
    if (res.ok) {
      cachedNewsData = await res.json();
      return cachedNewsData;
    }
  } catch (e) {
    console.warn('Using fallback news stories:', e);
  }
  cachedNewsData = { updatedAt: '', stories: [] };
  return cachedNewsData;
}

export function renderStageHeader({ container, gameMeta, lang, level, onChangeLevel, onBack, stepIndex, totalSteps, extraRightHtml = '' }) {
  const zh = lang !== 'en';
  const lvlLabels = [t(lang, 'lvlEasy'), t(lang, 'lvlMed'), t(lang, 'lvlHard')];
  let dotsHtml = '';
  for (let i = 0; i < totalSteps; i++) {
    const cls = i < stepIndex ? 'done' : i === stepIndex ? 'active' : '';
    dotsHtml += `<span class="p-dot ${cls}"></span>`;
  }

  const curCombo = getLiveComboCount();
  const comboHidden = curCombo >= 2 ? '' : 'hidden';
  const comboTxt = lang === 'en' ? `🔥 Combo ×${curCombo}` : `🔥 連中 ×${curCombo}`;
  setCurrentStageGameId(gameMeta.id);
  const introLine = getCoachIntroForGame(gameMeta.id, lang);

  const header = document.createElement('div');
  header.className = 'console-stage-hud-wrap';
  header.innerHTML = `
    <div class="nintendo-hud-bar">
      <div class="hud-left-cluster">
        <button type="button" class="hud-exit-btn" id="stageBackBtn" aria-label="${t(lang, 'backHome')}">
          <span>◀</span>
          <span>${zh ? '退出' : 'Exit'}</span>
        </button>
        <div class="hud-game-title-pill">
          <span class="hud-game-icon">${gameMeta.icon}</span>
          <span class="hud-game-title-text">${pickText(gameMeta.title, lang)}</span>
        </div>
        <span class="combo-pill ${comboHidden}" id="liveComboBadge">${comboTxt}</span>
      </div>

      <div class="hud-right-cluster">
        <div class="progress-dots" aria-label="Progress">${dotsHtml}</div>
        <div class="level-selector" role="group" aria-label="Difficulty">
          ${lvlLabels
            .map(
              (lbl, idx) =>
                `<button type="button" class="lvl-btn ${level === idx ? 'active' : ''}" data-lvl="${idx}">${lbl}</button>`
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="baobo-stage-companion" id="stageBaoBoCompanion">
      <div class="baobo-stage-3d-slot" id="stageBaoBo3DSlot"></div>
      <div class="baobo-stage-dialogue">
        <div class="baobo-stage-toprow">
          <span class="bo-name-tag">🫖 ${zh ? '阿波領航' : 'Master Bo'}</span>
          <button type="button" class="baobo-voice-chip" id="stageBoSpeakBtn">🔊 ${zh ? '聽講解' : 'Voice'}</button>
        </div>
        <div class="baobo-stage-line" id="stageBaoBoSpeechText">${introLine}</div>
      </div>
      ${extraRightHtml ? `<div class="baobo-stage-tools">${extraRightHtml}</div>` : ''}
    </div>
  `;

  header.querySelector('#stageBackBtn').addEventListener('click', () => {
    stopSpeaking();
    onBack();
  });
  header.querySelectorAll('.lvl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      stopSpeaking();
      onChangeLevel(Number(btn.dataset.lvl));
    });
  });

  const slot3d = header.querySelector('#stageBaoBo3DSlot');
  const boCtrl = mountBaoBo3D(slot3d, {
    size: 84,
    role: 'stage',
    mood: curCombo >= 2 ? 'cheer' : 'wave',
    onTap: function () {
      playSfx('tap', true);
      const txtEl = header.querySelector('#stageBaoBoSpeechText');
      if (txtEl) {
        boCtrl.setTalking(true);
        speakText(txtEl.textContent, lang);
        setTimeout(function () {
          boCtrl.setTalking(false);
        }, 2600);
      }
    }
  });

  const spkBtn = header.querySelector('#stageBoSpeakBtn');
  if (spkBtn) {
    spkBtn.addEventListener('click', () => {
      const txtEl = header.querySelector('#stageBaoBoSpeechText');
      if (txtEl) {
        boCtrl.poke();
        boCtrl.setTalking(true);
        speakText(txtEl.textContent, lang);
        setTimeout(function () {
          boCtrl.setTalking(false);
        }, 2600);
      }
    });
  }

  container.appendChild(header);
}

/* =========================================================================
   1. DAILY NEWS RECALL (時事醒目仔)
   ========================================================================= */
export async function mountNewsGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.news === "number" ? state.stats.perGameLevel.news : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'news');

  const newsData = await fetchDailyNews();
  let pool = newsData.stories || [];
  if (state.region === 'hk') {
    const hkFirst = pool.filter(s => s.region === 'hk' || s.region === 'world');
    if (hkFirst.length >= 2) pool = hkFirst;
  } else if (state.region === 'yvr') {
    const yvrFirst = pool.filter(s => s.region === 'yvr' || s.region === 'world');
    if (yvrFirst.length >= 2) pool = yvrFirst;
  }

  const count = level === 0 ? 2 : 3;
  const stories = drawFreshItems(state, 'news_stories', pool, Math.min(count, pool.length), s => s.id);
  let phase = 'read'; // 'read' | 'quiz'
  let qIdx = 0;
  let mistakes = 0;
  let peekShown = false;

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: phase === 'read' ? 0 : qIdx + 1,
      totalSteps: stories.length + 1
    });

    const body = document.createElement('div');
    body.className = 'card';

    if (phase === 'read') {
      const intro =
        lang === 'zh'
          ? `請輕鬆閱讀（或撳喇叭聽）以下 ${stories.length} 則港溫及生活新聞，讀完撳下面掣考考記性：`
          : `Read (or tap Listen on) these ${stories.length} short HK, Vancouver & wellness stories, then test your recall:`;

      body.innerHTML = `
        <p style="margin-top:0;font-weight:700;color:var(--ink-muted);">${intro}</p>
        <div id="newsCardsWrap"></div>
        <button type="button" class="btn btn-primary btn-full" id="startNewsQuizBtn">
          ${lang === 'zh' ? '讀完喇！開始時事問答 →' : 'Ready! Start Recall Quiz →'}
        </button>
      `;

      const wrap = body.querySelector('#newsCardsWrap');
      stories.forEach((st, idx) => {
        const card = document.createElement('div');
        card.className = 'news-card';
        const hl = pickText(st.headline, lang);
        const sum = pickText(st.summary, lang);
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span class="news-tag">${pickText(st.tag, lang)}</span>
            <button type="button" class="tts-btn" data-idx="${idx}">${t(lang, 'listenCantonese')}</button>
          </div>
          <h3 style="margin:0.35rem 0 0.4rem;font-size:1.12rem;">${hl}</h3>
          <p style="margin:0;">${sum}</p>
        `;
        card.querySelector('.tts-btn').addEventListener('click', () => {
          speakText(`${hl}。${sum}`, lang);
        });
        wrap.appendChild(card);
      });

      body.querySelector('#startNewsQuizBtn').addEventListener('click', () => {
        stopSpeaking();
        playSfx('tap', state.sound);
        phase = 'quiz';
        render();
      });
    } else {
      const st = stories[qIdx];
      const qText = pickText(st.question, lang);
      const indexedChoices = shuffle(st.choices.map((c, idx) => ({ text: pickText(c, lang), isCorrect: idx === st.answerIndex })));

      body.innerHTML = `
        <div class="prompt-box">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap;">
            <span class="news-tag">${pickText(st.tag, lang)} · Q${qIdx + 1}/${stories.length}</span>
            <div style="display:flex;gap:0.4rem;">
              <button type="button" class="tts-btn" id="qSpeakBtn">${t(lang, 'listenCantonese')}</button>
              <button type="button" class="chip-btn" id="peekStoryBtn">${t(lang, 'hintBtn')}</button>
            </div>
          </div>
          <p class="prompt-title" style="margin-bottom:0;">${qText}</p>
          <div id="peekBox" class="${peekShown ? '' : 'hidden'}" style="margin-top:0.7rem;padding:0.7rem;background:#FFFDF6;border-radius:10px;border:1.5px dashed var(--gold);font-size:0.92rem;">
            ${pickText(st.summary, lang)}
          </div>
        </div>
        <div class="choices-list" id="choicesWrap"></div>
        <div id="feedbackArea"></div>
      `;

      body.querySelector('#qSpeakBtn').addEventListener('click', () => speakText(qText, lang));
      body.querySelector('#peekStoryBtn').addEventListener('click', () => {
        peekShown = !peekShown;
        body.querySelector('#peekBox').classList.toggle('hidden', !peekShown);
      });

      const choicesWrap = body.querySelector('#choicesWrap');
      const feedbackArea = body.querySelector('#feedbackArea');
      let answered = false;

      indexedChoices.forEach(ch => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.innerHTML = `<span>${ch.text}</span><span>○</span>`;
        btn.addEventListener('click', () => {
          if (answered) return;
          if (ch.isCorrect) {
            answered = true;
            playSfx('correct', state.sound);
            btn.classList.add('correct');
            btn.querySelector('span:last-child').textContent = '✅';
            const isLast = qIdx === stories.length - 1;
            feedbackArea.innerHTML = `
              <div class="feedback-banner">
                <strong>${randomPraise(lang)}</strong>
                <div style="margin-top:0.75rem;">
                  <button type="button" class="btn btn-jade btn-full" id="nextQBtn">
                    ${isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')}
                  </button>
                </div>
              </div>
            `;
            feedbackArea.querySelector('#nextQBtn').addEventListener('click', () => {
              stopSpeaking();
              if (isLast) {
                const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
                const pts = 85 + level * 15 + stars * 10;
                onComplete({ score: pts, stars });
              } else {
                qIdx += 1;
                peekShown = false;
                render();
              }
            });
          } else {
            mistakes += 1;
            playSfx('gentle', state.sound);
            btn.classList.add('wrong');
            btn.disabled = true;
            btn.querySelector('span:last-child').textContent = '↻';
            feedbackArea.innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
          }
        });
        choicesWrap.appendChild(btn);
      });
    }

    container.appendChild(body);
  }

  render();
}

/* =========================================================================
   2. MEMORY: MAHJONG/FAMILY PHOTO PAIRS + WET MARKET RECALL (麻雀與買餸記憶)
   ========================================================================= */
export async function mountMemoryGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange, onOpenPhotoModal } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.memory === "number" ? state.stats.perGameLevel.memory : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'memory');
  const familyPhotos = await getFamilyPhotos();

  // Default submode alternates gently, or player can switch tabs right at the top!
  let subMode = (state.stats.perGamePlays.memory || 0) % 2 === 1 ? 'market' : 'pairs';

  function startSubMode(mode) {
    subMode = mode;
    if (subMode === 'pairs') {
      runPairsMode();
    } else {
      runMarketRecallMode();
    }
  }

  function modeSwitcherHtml() {
    const pLabel = lang === 'zh' ? '🀄 麻雀／相片配對' : '🀄 Tile & Photo Pairs';
    const mLabel = lang === 'zh' ? '🥬 街市買餸記憶' : '🥬 Market List Recall';
    return `
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
        <button type="button" class="chip-btn ${subMode === 'pairs' ? 'active-chip' : ''}" id="switchPairsBtn" style="${subMode === 'pairs' ? 'background:var(--red-chop);color:#fff;border-color:var(--red-chop);' : ''}">${pLabel}</button>
        <button type="button" class="chip-btn" id="switchMarketBtn" style="${subMode === 'market' ? 'background:var(--red-chop);color:#fff;border-color:var(--red-chop);' : ''}">${mLabel}</button>
      </div>
    `;
  }

  function wireSwitcher() {
    const pBtn = container.querySelector('#switchPairsBtn');
    const mBtn = container.querySelector('#switchMarketBtn');
    if (pBtn) pBtn.addEventListener('click', () => startSubMode('pairs'));
    if (mBtn) mBtn.addEventListener('click', () => startSubMode('market'));
  }

  function runPairsMode() {
    const pairCount = level === 0 ? 3 : level === 1 ? 4 : 6;
    let sourcePool = [];
    if (familyPhotos.length >= 2) {
      sourcePool = familyPhotos.map(p => ({
        id: p.id,
        isPhoto: true,
        dataUrl: p.dataUrl,
        label: { zh: p.label, en: p.label }
      }));
    }
    const neededRemaining = Math.max(0, pairCount - sourcePool.length);
    let tilePicks = drawFreshItems(state, 'mem_tiles', MAHJONG_AND_DIMSUM_TILES, neededRemaining, tl => tl.id);
    let chosenPairs = shuffle([...sourcePool.slice(0, pairCount), ...tilePicks]).slice(0, pairCount);
    let comboSig = chosenPairs.map(p => p.id).sort().join('|');
    if (hasSeenSignature(state, 'mem_pair_combos', comboSig) && neededRemaining > 0) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const altTiles = shuffle(MAHJONG_AND_DIMSUM_TILES).slice(0, neededRemaining);
        const altChosen = shuffle([...sourcePool.slice(0, pairCount), ...altTiles]).slice(0, pairCount);
        const altSig = altChosen.map(p => p.id).sort().join('|');
        if (!hasSeenSignature(state, 'mem_pair_combos', altSig)) {
          chosenPairs = altChosen;
          comboSig = altSig;
          break;
        }
      }
    }
    markSeenSignature(state, 'mem_pair_combos', comboSig, 500);

    const deck = shuffle(
      chosenPairs.flatMap((item, idx) => [
        { uid: `${idx}_a`, pairId: item.id, item, matched: false, revealed: true },
        { uid: `${idx}_b`, pairId: item.id, item, matched: false, revealed: true }
      ])
    );

    let previewing = true;
    let lockBoard = true;
    let firstPick = null;
    let moves = 0;
    let matchedPairs = 0;

    setTimeout(() => {
      deck.forEach(c => (c.revealed = false));
      previewing = false;
      lockBoard = false;
      renderPairs();
    }, level === 0 ? 2600 : 2100);

    function renderPairs() {
      container.innerHTML = '';
      renderStageHeader({
        container,
        gameMeta,
        lang,
        level,
        onChangeLevel: onLevelChange,
        onBack,
        stepIndex: matchedPairs,
        totalSteps: pairCount,
        extraRightHtml: modeSwitcherHtml()
      });
      wireSwitcher();

      const card = document.createElement('div');
      card.className = 'card';
      const colsClass = pairCount <= 3 ? 'cols-3' : 'cols-4';
      const statusMsg = previewing
        ? lang === 'zh'
          ? '👀 先望一望牌面位置，準備翻牌配對…'
          : '👀 Take a quick peek before tiles flip over…'
        : lang === 'zh'
        ? `已配對 ${matchedPairs} / ${pairCount} 對 · 步數：${moves}`
        : `Matched ${matchedPairs} / ${pairCount} pairs · Moves: ${moves}`;

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <span style="font-weight:800;color:var(--jade-dark);">${statusMsg}</span>
          <button type="button" class="chip-btn" id="familyPhotoBtn">
            📸 ${lang === 'zh' ? `屋企人相片 (${familyPhotos.length})` : `Family Photos (${familyPhotos.length})`}
          </button>
        </div>
        <div class="memory-grid ${colsClass}" id="memGrid"></div>
      `;

      card.querySelector('#familyPhotoBtn').addEventListener('click', () => {
        if (onOpenPhotoModal) onOpenPhotoModal();
      });

      const grid = card.querySelector('#memGrid');
      deck.forEach(tile => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mem-tile ${tile.revealed ? 'revealed' : ''} ${tile.matched ? 'matched' : ''}`;
        if (tile.revealed || tile.matched) {
          if (tile.item.isPhoto) {
            btn.innerHTML = `<img src="${tile.item.dataUrl}" alt="${pickText(tile.item.label, lang)}" class="mem-tile-photo" />`;
          } else {
            const sym = tile.item.display || tile.item.symbol;
            btn.innerHTML = `
              <span class="mem-tile-symbol" style="color:${tile.item.color || 'var(--ink)'}">${sym}</span>
              <span class="mem-tile-label">${pickText(tile.item.label, lang)}</span>
            `;
          }
        } else {
          btn.innerHTML = `<span class="mem-tile-back">🀄</span>`;
        }

        btn.addEventListener('click', () => {
          if (lockBoard || tile.revealed || tile.matched) return;
          playSfx('flip', state.sound);
          tile.revealed = true;
          if (!firstPick) {
            firstPick = tile;
            renderPairs();
            return;
          }
          moves += 1;
          if (firstPick.pairId === tile.pairId) {
            firstPick.matched = true;
            tile.matched = true;
            firstPick = null;
            matchedPairs += 1;
            playSfx('correct', state.sound);
            renderPairs();
            if (matchedPairs === pairCount) {
              setTimeout(() => {
                const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount * 2 ? 2 : 1;
                const pts = 90 + level * 15 + stars * 10;
                onComplete({ score: pts, stars });
              }, 450);
            }
          } else {
            lockBoard = true;
            renderPairs();
            setTimeout(() => {
              firstPick.revealed = false;
              tile.revealed = false;
              firstPick = null;
              lockBoard = false;
              renderPairs();
            }, 850);
          }
        });
        grid.appendChild(btn);
      });

      container.appendChild(card);
    }

    renderPairs();
  }

  function runMarketRecallMode() {
    const targetCount = level === 0 ? 3 : level === 1 ? 4 : 5;
    let targets = drawFreshItems(state, 'market_targets', WET_MARKET_ITEMS, targetCount, it => it.id);
    let mktSig = targets.map(x => x.id).sort().join('|');
    if (hasSeenSignature(state, 'market_list_combos', mktSig)) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const alt = shuffle(WET_MARKET_ITEMS).slice(0, targetCount);
        const altSig = alt.map(x => x.id).sort().join('|');
        if (!hasSeenSignature(state, 'market_list_combos', altSig)) {
          targets = alt;
          mktSig = altSig;
          break;
        }
      }
    }
    markSeenSignature(state, 'market_list_combos', mktSig, 500);
    const targetIds = new Set(targets.map(x => x.id));
    const decoys = shuffle(WET_MARKET_ITEMS.filter(x => !targetIds.has(x.id))).slice(0, Math.max(4, 9 - targetCount));
    const stallItems = shuffle([...targets, ...decoys]);

    let step = 'study'; // 'study' | 'distract' | 'recall'
    const selectedIds = new Set();
    let tries = 0;

    // Non-repeating pleasant neighbor-chat arithmetic scenario from 115-scenario bank
    const chat = drawFreshItems(state, 'market_chats', MARKET_CHATS, 1, c => c.id)[0];
    const distractAns = chat.ans;
    const distractChoices = shuffle(chat.choices);

    function renderMarket() {
      container.innerHTML = '';
      renderStageHeader({
        container,
        gameMeta,
        lang,
        level,
        onChangeLevel: onLevelChange,
        onBack,
        stepIndex: step === 'study' ? 0 : step === 'distract' ? 1 : 2,
        totalSteps: 3,
        extraRightHtml: modeSwitcherHtml()
      });
      wireSwitcher();

      const card = document.createElement('div');
      card.className = 'card';

      if (step === 'study') {
        card.innerHTML = `
          <div class="prompt-box">
            <p class="prompt-title">
              ${lang === 'zh' ? `🛒 今日去街市要買呢 ${targetCount} 樣餸，請記住佢哋：` : `🛒 Memorize these ${targetCount} items on today's shopping list:`}
            </p>
            <div class="item-grid">
              ${targets
                .map(
                  it => `
                <div class="item-chip selected" style="cursor:default;">
                  <span style="font-size:1.85rem;">${it.emoji}</span>
                  <span>${it[lang]}</span>
                </div>`
                )
                .join('')}
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-full" id="goMarketBtn">
            ${lang === 'zh' ? '記實喇！出發去街市 →' : 'Got It! Head to the Market →'}
          </button>
        `;
        card.querySelector('#goMarketBtn').addEventListener('click', () => {
          playSfx('tap', state.sound);
          step = 'distract';
          renderMarket();
        });
      } else if (step === 'distract') {
        card.innerHTML = `
          <div class="prompt-box">
            <span class="news-tag">${lang === 'zh' ? '👋 途中撞見街坊傾兩句' : '👋 Quick Neighbor Chat'}</span>
            <p class="prompt-title" style="margin-top:0.4rem;">
              ${chat[lang]}
            </p>
          </div>
          <div class="choices-list">
            ${distractChoices
              .map(
                val =>
                  `<button type="button" class="choice-btn distract-opt" data-val="${val}"><span>$${val}</span><span>○</span></button>`
              )
              .join('')}
          </div>
        `;
        card.querySelectorAll('.distract-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            if (Number(btn.dataset.val) === distractAns) {
              playSfx('correct', state.sound);
              step = 'recall';
              renderMarket();
            } else {
              playSfx('gentle', state.sound);
              btn.classList.add('wrong');
            }
          });
        });
      } else {
        card.innerHTML = `
          <p style="margin-top:0;font-weight:800;font-size:1.08rem;">
            ${lang === 'zh' ? `嚟到菜檔喇！請撳返頭先要買嘅 ${targetCount} 樣餸（已揀 ${selectedIds.size}/${targetCount}）：` : `At the market stall! Tap the ${targetCount} items from your list (${selectedIds.size}/${targetCount}):`}
          </p>
          <div class="item-grid" id="stallGrid"></div>
          <div id="marketFeedback"></div>
          <button type="button" class="btn btn-jade btn-full" id="checkBasketBtn" ${selectedIds.size === targetCount ? '' : 'disabled'} style="opacity:${selectedIds.size === targetCount ? '1' : '0.55'};">
            ${lang === 'zh' ? '放入餸籃核對！✅' : 'Check My Basket! ✅'}
          </button>
        `;

        const stallGrid = card.querySelector('#stallGrid');
        stallItems.forEach(it => {
          const chip = document.createElement('button');
          chip.type = 'button';
          const isSel = selectedIds.has(it.id);
          chip.className = `item-chip ${isSel ? 'selected' : ''}`;
          chip.innerHTML = `<span style="font-size:1.7rem;">${it.emoji}</span><span>${it[lang]}</span>`;
          chip.addEventListener('click', () => {
            playSfx('tap', state.sound);
            if (selectedIds.has(it.id)) {
              selectedIds.delete(it.id);
            } else if (selectedIds.size < targetCount) {
              selectedIds.add(it.id);
            }
            renderMarket();
          });
          stallGrid.appendChild(chip);
        });

        card.querySelector('#checkBasketBtn').addEventListener('click', () => {
          let correctCount = 0;
          selectedIds.forEach(id => {
            if (targetIds.has(id)) correctCount += 1;
          });
          if (correctCount === targetCount) {
            playSfx('correct', state.sound);
            const stars = tries === 0 ? 3 : tries === 1 ? 2 : 1;
            onComplete({ score: 95 + level * 15 + stars * 10, stars });
          } else {
            tries += 1;
            playSfx('gentle', state.sound);
            // Keep correct selections, clear wrong ones to guide gently!
            for (const id of Array.from(selectedIds)) {
              if (!targetIds.has(id)) selectedIds.delete(id);
            }
            renderMarket();
            const fb = container.querySelector('#marketFeedback');
            if (fb) {
              fb.innerHTML = `<div class="feedback-banner gentle-retry" style="margin-bottom:0.8rem;">
                ${lang === 'zh' ? `搵啱咗 ${correctCount} 樣！已經幫你留低啱嗰啲，再揀埋淨低嗰 ${targetCount - correctCount} 樣啦 😊` : `You got ${correctCount} right! Kept your correct picks — pick the remaining ${targetCount - correctCount} 😊`}
              </div>`;
            }
          }
        });
      }

      container.appendChild(card);
    }

    renderMarket();
  }

  startSubMode(subMode);
}

/* =========================================================================
   3. PRACTICAL MATH: YUM CHA BILL & EXACT CHANGE (飲茶埋單心算)
   ========================================================================= */
export function mountMathGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.math === "number" ? state.stats.perGameLevel.math : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'math');

  const totalRounds = 3;
  let roundIdx = 0;
  let mistakes = 0;

  // Draw all 3 non-repeating math scenarios upfront for this session
  const itemCount = level === 0 ? 2 : level === 1 ? 3 : 4;
  let sessionBillPicks = drawFreshItems(state, 'yum_cha_dishes', YUM_CHA_MENU, itemCount, d => d.id);
  let billSig = sessionBillPicks.map(p => p.id).sort().join('|');
  if (hasSeenSignature(state, 'yum_cha_bills', billSig)) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const alt = shuffle(YUM_CHA_MENU).slice(0, itemCount);
      const altSig = alt.map(p => p.id).sort().join('|');
      if (!hasSeenSignature(state, 'yum_cha_bills', altSig)) {
        sessionBillPicks = alt;
        billSig = altSig;
        break;
      }
    }
  }
  markSeenSignature(state, 'yum_cha_bills', billSig, 500);

  const scPool = EXACT_CHANGE_SCENARIOS.filter(s => s.minLvl === level);
  const sessionChangeSc = drawFreshItems(
    state,
    'math_change_' + level,
    scPool.length ? scPool : EXACT_CHANGE_SCENARIOS,
    1,
    s => s.id
  )[0];

  const tpPool = TARGET_PAIR_PUZZLES.filter(p => p.minLvl === level);
  const sessionTargetPz = drawFreshItems(
    state,
    'math_target_' + level,
    tpPool.length ? tpPool : TARGET_PAIR_PUZZLES,
    1,
    p => p.id
  )[0];

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: roundIdx,
      totalSteps: totalRounds
    });

    if (roundIdx === 0) {
      renderYumChaBill();
    } else if (roundIdx === 1) {
      renderMakeChange();
    } else {
      renderTargetSteamer();
    }
  }

  function advanceOrFinish() {
    if (roundIdx + 1 >= totalRounds) {
      const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
      onComplete({ score: 90 + level * 15 + stars * 10, stars });
    } else {
      roundIdx += 1;
      render();
    }
  }

  function renderYumChaBill() {
    const picks = sessionBillPicks;
    const total = picks.reduce((sum, x) => sum + x.price, 0);
    const distractorSet = new Set([total]);
    [total + 10, Math.max(14, total - 6), total + 4, total + 8].forEach(v => {
      if (distractorSet.size < 3 && v > 0) distractorSet.add(v);
    });
    const finalOpts = shuffle(Array.from(distractorSet));

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <span class="news-tag">${lang === 'zh' ? '🫖 第一關：酒樓點心埋單' : '🫖 Round 1: Yum Cha Bill'}</span>
        <p class="prompt-title" style="margin-top:0.4rem;">
          ${lang === 'zh' ? '今日嘆咗以下點心，請計下埋單一共幾多錢：' : 'Here is our dim sum order — what is the total bill?'}
        </p>
        <div style="background:#fff;border:1.5px dashed var(--border-strong);border-radius:12px;padding:0.8rem;">
          ${picks
            .map(
              p => `
            <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-weight:800;border-bottom:1px solid #F1EAE0;">
              <span>${p.emoji} ${p[lang]}</span>
              <span>$${p.price}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>
      <div class="choices-list" id="billOpts"></div>
      <div id="mathFb"></div>
    `;

    const optsEl = card.querySelector('#billOpts');
    finalOpts.forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>$${val}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (val === total) {
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          setTimeout(advanceOrFinish, 450);
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#mathFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      optsEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  function renderMakeChange() {
    const sc = sessionChangeSc;
    const cost = sc.cost;
    const paid = sc.paid;
    const targetChange = paid - cost;
    const denoms = targetChange >= 100 ? [100, 50, 20, 10, 5, 2, 1] : [50, 20, 10, 5, 2, 1];
    const tappedBills = [];

    function drawChangeCard() {
      container.querySelectorAll('.change-card').forEach(el => el.remove());
      const currentSum = tappedBills.reduce((a, b) => a + b, 0);

      const card = document.createElement('div');
      card.className = 'card change-card';
      card.innerHTML = `
        <div class="prompt-box">
          <span class="news-tag">${lang === 'zh' ? '💵 第二關：街市找續篤銀紙' : '💵 Round 2: Exact Change'}</span>
          <p class="prompt-title" style="margin-top:0.4rem;">
            ${
              lang === 'zh'
                ? `${sc.zhItem}一共 <strong>$${cost}</strong>，付現金 <strong>$${paid}</strong>。<br/>請撳下面銀紙／硬幣湊夠找續金額：`
                : `Buying ${sc.enItem} costs <strong>$${cost}</strong>, paid with <strong>$${paid}</strong>.<br/>Tap bills & coins below to make exact change:`
            }
          </p>
          <div style="font-size:1.25rem;font-weight:900;color:var(--jade-dark);padding:0.55rem 0.8rem;background:#fff;border-radius:10px;border:2px solid var(--jade);">
            ${lang === 'zh' ? '已揀找續：' : 'Selected Change: '} $${currentSum}
            ${tappedBills.length ? `<span style="font-size:0.88rem;color:var(--ink-muted);"> (${tappedBills.map(v => '$' + v).join(' + ')})</span>` : ''}
          </div>
        </div>
        <div class="bills-row">
          ${denoms
            .map(
              denom =>
                `<button type="button" class="bill-btn ${denom <= 5 ? 'coin' : ''}" data-denom="${denom}">+$${denom}</button>`
            )
            .join('')}
        </div>
        <div class="action-row">
          <button type="button" class="btn btn-outline" id="clearBillsBtn">${lang === 'zh' ? '重設清零 ↺' : 'Clear ↺'}</button>
          <button type="button" class="btn btn-jade" id="confirmChangeBtn">${lang === 'zh' ? '確認找續 ✅' : 'Confirm Change ✅'}</button>
        </div>
        <div id="changeFb"></div>
      `;

      card.querySelectorAll('.bill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          playSfx('tap', state.sound);
          tappedBills.push(Number(btn.dataset.denom));
          drawChangeCard();
        });
      });

      card.querySelector('#clearBillsBtn').addEventListener('click', () => {
        tappedBills.length = 0;
        drawChangeCard();
      });

      card.querySelector('#confirmChangeBtn').addEventListener('click', () => {
        if (currentSum === targetChange) {
          playSfx('correct', state.sound);
          setTimeout(advanceOrFinish, 350);
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          const hint =
            lang === 'zh'
              ? `提示：$${paid} - $${cost} = $${targetChange}，而家揀咗 $${currentSum}，再調整下啦 😊`
              : `Hint: $${paid} - $${cost} = $${targetChange} (you currently have $${currentSum}) 😊`;
          card.querySelector('#changeFb').innerHTML = `<div class="feedback-banner gentle-retry">${hint}</div>`;
        }
      });

      container.appendChild(card);
    }

    drawChangeCard();
  }

  function renderTargetSteamer() {
    const tp = sessionTargetPz;
    const target = tp.target;
    const displayNums = shuffle(tp.nums);
    let pickedIndices = [];

    function drawTarget() {
      container.querySelectorAll('.target-card').forEach(el => el.remove());
      const card = document.createElement('div');
      card.className = 'card target-card';
      card.innerHTML = `
        <div class="prompt-box">
          <span class="news-tag">${lang === 'zh' ? '🥟 第三關：湊夠目標數' : '🥟 Round 3: Target Pair'}</span>
          <p class="prompt-title" style="margin-top:0.4rem;">
            ${lang === 'zh' ? `請喺下面撳 <strong>2 個數字</strong>，令佢哋加埋剛好等於 <strong style="color:var(--red-chop);font-size:1.35rem;">${target}</strong>：` : `Tap <strong>2 numbers</strong> below that add up to <strong style="color:var(--red-chop);font-size:1.35rem;">${target}</strong>:`}
          </p>
        </div>
        <div class="item-grid" id="numGrid"></div>
        <div id="targetFb"></div>
      `;

      const grid = card.querySelector('#numGrid');
      displayNums.forEach((n, idx) => {
        const isSel = pickedIndices.includes(idx);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `item-chip ${isSel ? 'selected' : ''}`;
        btn.style.fontSize = '1.3rem';
        btn.textContent = String(n);
        btn.addEventListener('click', () => {
          playSfx('tap', state.sound);
          if (pickedIndices.includes(idx)) {
            pickedIndices = pickedIndices.filter(i => i !== idx);
            drawTarget();
            return;
          }
          pickedIndices.push(idx);
          if (pickedIndices.length === 2) {
            const sum = displayNums[pickedIndices[0]] + displayNums[pickedIndices[1]];
            if (sum === target) {
              playSfx('correct', state.sound);
              advanceOrFinish();
            } else {
              mistakes += 1;
              playSfx('gentle', state.sound);
              pickedIndices = [];
              drawTarget();
              const fb = container.querySelector('#targetFb');
              if (fb) {
                fb.innerHTML = `<div class="feedback-banner gentle-retry">${
                  lang === 'zh' ? `頭先兩個加埋係 ${sum}，再搵下邊一對加埋等於 ${target} 啦 😊` : `Those added up to ${sum} — try another pair for ${target}!`
                }</div>`;
              }
            }
          } else {
            drawTarget();
          }
        });
        grid.appendChild(btn);
      });

      container.appendChild(card);
    }

    drawTarget();
  }

  render();
}

/* =========================================================================
   4. HISTORY & REMINISCENCE + TIMELINE (當年今日博學堂)
   ========================================================================= */
export function mountHistoryGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.history === "number" ? state.stats.perGameLevel.history : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'history');

  let pool = HISTORY_QUESTIONS;
  if (state.region === 'hk') {
    pool = HISTORY_QUESTIONS.filter(q => q.region === 'hk' || q.region === 'both');
  } else if (state.region === 'yvr') {
    pool = HISTORY_QUESTIONS.filter(q => q.region === 'yvr' || q.region === 'both');
  }
  const chosenTrivia = drawFreshItems(state, 'history_q', pool, 2, q => q.id);
  const chosenTimeline = drawFreshItems(state, 'history_tl', TIMELINE_SETS, 1, tl => tl.id)[0];

  let step = 0; // 0, 1 = trivia, 2 = timeline ordering
  let mistakes = 0;

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: step,
      totalSteps: 3
    });

    if (step < 2) {
      renderTriviaQuestion(chosenTrivia[step]);
    } else {
      renderTimelineStep(chosenTimeline);
    }
  }

  function renderTriviaQuestion(item) {
    const qText = pickText(item.q, lang);
    const opts = shuffle(item.choices.map((c, idx) => ({ text: pickText(c, lang), isCorrect: idx === item.answer })));
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;">
          <span class="news-tag">${lang === 'zh' ? '🏛️ 懷舊與歷史常識' : '🏛️ History & Nostalgia'}</span>
          <button type="button" class="tts-btn" id="histSpeakBtn">${t(lang, 'listenCantonese')}</button>
        </div>
        <p class="prompt-title" style="margin-bottom:0;">${qText}</p>
      </div>
      <div class="choices-list" id="histChoices"></div>
      <div id="histFb"></div>
    `;

    card.querySelector('#histSpeakBtn').addEventListener('click', () => speakText(qText, lang));
    const listEl = card.querySelector('#histChoices');
    let solved = false;

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${opt.text}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (opt.isCorrect) {
          solved = true;
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          btn.querySelector('span:last-child').textContent = '✅';
          card.querySelector('#histFb').innerHTML = `
            <div class="feedback-banner">
              <strong>${randomPraise(lang)}</strong>
              <p style="margin:0.45rem 0 0.8rem;">${pickText(item.fact, lang)}</p>
              <button type="button" class="btn btn-jade btn-full" id="histNextBtn">${t(lang, 'nextQuestion')}</button>
            </div>
          `;
          card.querySelector('#histNextBtn').addEventListener('click', () => {
            stopSpeaking();
            step += 1;
            render();
          });
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#histFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      listEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  function renderTimelineStep(tl) {
    const orderedYears = [...tl.events].sort((a, b) => a.year - b.year);
    const shuffledEvents = shuffle(tl.events);
    const lockedIds = [];

    function drawTimeline() {
      container.querySelectorAll('.tl-card').forEach(e => e.remove());
      const card = document.createElement('div');
      card.className = 'card tl-card';
      card.innerHTML = `
        <div class="prompt-box">
          <span class="news-tag">${lang === 'zh' ? '⏳ 壓軸題：邊樣早啲發生？' : '⏳ Final Round: Which Came First?'}</span>
          <p class="prompt-title" style="margin:0.4rem 0 0;">${pickText(tl.title, lang)}</p>
        </div>
        <div class="choices-list" id="tlList"></div>
        <div id="tlFb"></div>
      `;

      const listEl = card.querySelector('#tlList');
      shuffledEvents.forEach(ev => {
        const doneIdx = lockedIds.indexOf(ev.year);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `choice-btn ${doneIdx !== -1 ? 'correct' : ''}`;
        btn.disabled = doneIdx !== -1;
        btn.innerHTML = `
          <span>${ev[lang]}</span>
          <span>${doneIdx !== -1 ? `#${doneIdx + 1} (${ev.year})` : '👆'}</span>
        `;
        btn.addEventListener('click', () => {
          const expected = orderedYears[lockedIds.length];
          if (ev.year === expected.year) {
            lockedIds.push(ev.year);
            playSfx('correct', state.sound);
            drawTimeline();
            if (lockedIds.length === orderedYears.length) {
              const fb = container.querySelector('#tlFb');
              if (fb) {
                fb.innerHTML = `
                  <div class="feedback-banner">
                    <strong>${randomPraise(lang)}</strong>
                    <div style="margin-top:0.7rem;">
                      <button type="button" class="btn btn-jade btn-full" id="finishHistBtn">${t(lang, 'finishDish')}</button>
                    </div>
                  </div>
                `;
                fb.querySelector('#finishHistBtn').addEventListener('click', () => {
                  const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
                  onComplete({ score: 95 + level * 15 + stars * 10, stars });
                });
              }
            }
          } else {
            mistakes += 1;
            playSfx('gentle', state.sound);
            card.querySelector('#tlFb').innerHTML = `<div class="feedback-banner gentle-retry">${
              lang === 'zh' ? '呢件發生得遲啲喎！試下搵最早發生嗰件先 😊' : 'That one happened later — tap the earliest remaining milestone first 😊'
            }</div>`;
          }
        });
        listEl.appendChild(btn);
      });

      container.appendChild(card);
    }

    drawTimeline();
  }

  render();
}

/* =========================================================================
   5. IDIOMS & CATEGORY SORT (成語俗語與分類)
   ========================================================================= */
export function mountWordsGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.words === "number" ? state.stats.perGameLevel.words : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'words');

  const idioms = drawFreshItems(state, 'idiom_q', IDIOM_QUESTIONS, 2, q => q.id);
  const board = drawFreshItems(state, 'cat_boards', CATEGORY_BOARDS, 1, b => b.id)[0];
  let step = 0; // 0, 1 = idioms, 2 = category sort
  let mistakes = 0;

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: step,
      totalSteps: 3
    });

    if (step < 2) {
      renderIdiom(idioms[step]);
    } else {
      renderCategorySort(board);
    }
  }

  function renderIdiom(item) {
    const pText = pickText(item.prompt, lang);
    const opts = shuffle(item.choices.map((c, idx) => ({ text: pickText(c, lang), isCorrect: idx === item.answer })));
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;">
          <span class="news-tag">${lang === 'zh' ? '🗣️ 成語與廣東話俗語' : '🗣️ Idioms & Proverbs'}</span>
          <button type="button" class="tts-btn" id="idiomSpeakBtn">${t(lang, 'listenCantonese')}</button>
        </div>
        <p class="prompt-title" style="margin-bottom:0;">${pText}</p>
      </div>
      <div class="choices-list" id="idiomOpts"></div>
      <div id="idiomFb"></div>
    `;

    card.querySelector('#idiomSpeakBtn').addEventListener('click', () => speakText(pText, lang));
    const listEl = card.querySelector('#idiomOpts');
    let solved = false;

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${opt.text}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (opt.isCorrect) {
          solved = true;
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          btn.querySelector('span:last-child').textContent = '✅';
          card.querySelector('#idiomFb').innerHTML = `
            <div class="feedback-banner">
              <strong>${randomPraise(lang)}</strong>
              <p style="margin:0.45rem 0 0.8rem;">${pickText(item.note, lang)}</p>
              <button type="button" class="btn btn-jade btn-full" id="idiomNextBtn">${t(lang, 'nextQuestion')}</button>
            </div>
          `;
          card.querySelector('#idiomNextBtn').addEventListener('click', () => {
            stopSpeaking();
            step += 1;
            render();
          });
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#idiomFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      listEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  function renderCategorySort(catBoard) {
    const tiles = shuffle(
      catBoard.groups.flatMap((g, gIdx) =>
        g.items.map((it, iIdx) => ({
          id: `${gIdx}_${iIdx}`,
          groupIdx: gIdx,
          groupName: g.name,
          label: it,
          solved: false
        }))
      )
    );
    let selected = [];
    const solvedGroups = [];

    function drawBoard() {
      container.querySelectorAll('.cat-card').forEach(e => e.remove());
      const card = document.createElement('div');
      card.className = 'card cat-card';
      card.innerHTML = `
        <div class="prompt-box">
          <span class="news-tag">${lang === 'zh' ? '🧩 分類高手（每 3 個同類詞語一組）' : '🧩 Category Sort (Group 3 matching items)'}</span>
          <p class="prompt-title" style="margin:0.4rem 0 0;">
            ${lang === 'zh' ? '請每次撳 3 個屬於同一類別嘅詞語：' : 'Tap any 3 items that belong to the same category:'}
          </p>
        </div>
        <div>
          ${solvedGroups
            .map(
              sg => `
            <div style="padding:0.65rem 0.9rem;border-radius:12px;margin-bottom:0.5rem;font-weight:800;" class="item-chip locked-group-${sg.groupIdx}">
              ${pickText(sg.name, lang)}：${sg.items.map(x => pickText(x, lang)).join(' · ')} ✅
            </div>`
            )
            .join('')}
        </div>
        <div class="item-grid" id="catGrid"></div>
        <div id="catFb"></div>
      `;

      const grid = card.querySelector('#catGrid');
      tiles
        .filter(tItem => !tItem.solved)
        .forEach(tItem => {
          const isSel = selected.includes(tItem.id);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `item-chip ${isSel ? 'selected' : ''}`;
          btn.textContent = pickText(tItem.label, lang);
          btn.addEventListener('click', () => {
            playSfx('tap', state.sound);
            if (selected.includes(tItem.id)) {
              selected = selected.filter(id => id !== tItem.id);
              drawBoard();
              return;
            }
            selected.push(tItem.id);
            if (selected.length === 3) {
              const pickedObjs = selected.map(id => tiles.find(x => x.id === id));
              const sameGroup = pickedObjs.every(x => x.groupIdx === pickedObjs[0].groupIdx);
              if (sameGroup) {
                playSfx('correct', state.sound);
                pickedObjs.forEach(x => (x.solved = true));
                const gIdx = pickedObjs[0].groupIdx;
                solvedGroups.push(catBoard.groups[gIdx]);
                selected = [];
                drawBoard();
                if (solvedGroups.length === catBoard.groups.length) {
                  setTimeout(() => {
                    const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
                    onComplete({ score: 95 + level * 15 + stars * 10, stars });
                  }, 450);
                }
              } else {
                mistakes += 1;
                playSfx('gentle', state.sound);
                selected = [];
                drawBoard();
                const fb = container.querySelector('#catFb');
                if (fb) {
                  const remainingThemes = catBoard.groups
                    .filter(g => !solvedGroups.includes(g))
                    .map(g => `「${pickText(g.name, lang)}」`)
                    .join('、');
                  fb.innerHTML = `<div class="feedback-banner gentle-retry">${
                    lang === 'zh'
                      ? `呢三個未算同一類喎，試下搵三個同屬 ${remainingThemes} 嘅詞語 😊`
                      : `Those 3 belong to different categories — try grouping 3 from ${remainingThemes} 😊`
                  }</div>`;
                }
              }
            } else {
              drawBoard();
            }
          });
          grid.appendChild(btn);
        });

      container.appendChild(card);
    }

    drawBoard();
  }

  render();
}

/* =========================================================================
   6. EAGLE EYE VISUAL SCAN (眼明手快尋寶)
   ========================================================================= */
export function mountEagleGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = (typeof state.stats.perGameLevel.eagle === "number" ? state.stats.perGameLevel.eagle : 1);
  const gameMeta = GAME_CATALOG.find(g => g.id === 'eagle');

  const totalRounds = 4;
  const pairs = drawFreshItems(state, 'eagle_pairs', EAGLE_PAIRS, totalRounds, p => p.id);
  let roundIdx = 0;
  let mistakes = 0;
  let showHint = false;

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: roundIdx,
      totalSteps: totalRounds
    });

    const cols = level === 0 ? 3 : 4;
    const rows = roundIdx < 2 ? 3 : level === 2 ? 5 : 4;
    const cellCount = cols * rows;
    const oddIdx = Math.floor(Math.random() * cellCount);
    const pair = pairs[roundIdx];

    function drawGrid() {
      container.querySelectorAll('.eagle-card').forEach(e => e.remove());
      const card = document.createElement('div');
      card.className = 'card eagle-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <p style="margin:0;font-weight:800;font-size:1.08rem;">
            ${lang === 'zh' ? `第 ${roundIdx + 1}/${totalRounds} 關：請搵出唯一唔同嗰一格！` : `Round ${roundIdx + 1}/${totalRounds}: Tap the 1 odd tile out!`}
          </p>
          <button type="button" class="chip-btn" id="eagleHintBtn">${t(lang, 'hintBtn')}</button>
        </div>
        ${
          showHint
            ? `<p style="margin:0.5rem 0 0;color:var(--gold-dark);font-weight:700;">💡 ${pickText(pair.tip, lang)}</p>`
            : ''
        }
        <div class="eagle-grid" style="grid-template-columns: repeat(${cols}, 1fr);" id="eGrid"></div>
        <div id="eagleFb"></div>
      `;

      card.querySelector('#eagleHintBtn').addEventListener('click', () => {
        showHint = true;
        drawGrid();
      });

      const grid = card.querySelector('#eGrid');
      for (let i = 0; i < cellCount; i++) {
        const isOdd = i === oddIdx;
        const inHintRow = showHint && Math.floor(i / cols) === Math.floor(oddIdx / cols);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `eagle-cell ${inHintRow ? 'hint-glow' : ''}`;
        btn.textContent = isOdd ? pair.odd : pair.majority;
        btn.addEventListener('click', () => {
          if (isOdd) {
            playSfx('correct', state.sound);
            if (roundIdx + 1 >= totalRounds) {
              const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
              onComplete({ score: 85 + level * 15 + stars * 10, stars });
            } else {
              roundIdx += 1;
              showHint = false;
              render();
            }
          } else {
            mistakes += 1;
            playSfx('gentle', state.sound);
            btn.style.opacity = '0.38';
          }
        });
        grid.appendChild(btn);
      }

      container.appendChild(card);
    }

    drawGrid();
  }

  render();
}
