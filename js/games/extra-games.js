import {
  GAME_CATALOG,
  MAHJONG_AND_DIMSUM_TILES,
  ZH_WORD_BANK,
  EN_WORD_BANK
} from '../data/content.js';
import {
  TENPAI_HANDS,
  MAKE12_DEALS,
  MAKE24_EASY_DEALS,
  MAKE24_DEALS,
  MAKE24_HARD_DEALS,
  BLOCK_SHAPES,
  BLOCK_STAGE_PATTERNS,
  SHISEN_LAYOUTS,
  SUDOKU_ICON_THEMES,
  MELODY_THEMES,
  MELODY_PHRASES,
  STROOP_COLOR_BANK
} from '../data/bank-puzzles.js';
import {
  VOCAB_CONTEXT_ITEMS,
  PRACTICAL_ENGLISH_ITEMS,
  VOCAB_MATCH_PAIRS
} from '../data/bank-vocab.js';
import { drawFreshItems, hasSeenSignature, markSeenSignature } from '../data/seed-tracker.js';
import { t, pickText, randomPraise, playSfx, playPentatonicNote, speakText, stopSpeaking } from '../i18n.js';
import { renderStageHeader } from './engine.js';
import { saveState } from '../storage.js';

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function getLevel(state, key) {
  const v = state.stats.perGameLevel[key];
  const fallback = key === 'make24' ? 0 : 1;
  return typeof v === 'number' ? v : fallback;
}

/* =========================================================================
   7. TEA-HOUSE SUDOKU (醒神茶樓數獨 — 4x4, 6x6, 9x9 + 12 Icon Themes + Notes + Hints)
   ========================================================================= */
function buildSudokuSolution(size, boxR, boxC) {
  const symbols = shuffle(Array.from({ length: size }, (_, i) => i + 1));
  const rowBands = shuffle(Array.from({ length: size / boxR }, (_, i) => i));
  const colStacks = shuffle(Array.from({ length: size / boxC }, (_, i) => i));

  const rows = [];
  rowBands.forEach(b => {
    const inner = shuffle(Array.from({ length: boxR }, (_, i) => b * boxR + i));
    inner.forEach(r => rows.push(r));
  });

  const cols = [];
  colStacks.forEach(s => {
    const inner = shuffle(Array.from({ length: boxC }, (_, i) => s * boxC + i));
    inner.forEach(c => cols.push(c));
  });

  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    const rr = rows[r];
    for (let c = 0; c < size; c++) {
      const cc = cols[c];
      const valIdx = (boxC * (rr % boxR) + Math.floor(rr / boxR) + cc) % size;
      row.push(symbols[valIdx]);
    }
    grid.push(row);
  }
  return grid;
}

export function mountSudokuGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'sudoku');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'sudoku');

  const cfg =
    level === 0
      ? { size: 4, boxR: 2, boxC: 2, blanks: 6 }
      : level === 1
      ? { size: 6, boxR: 2, boxC: 3, blanks: 14 }
      : { size: 9, boxR: 3, boxC: 3, blanks: 30 };

  const iconTheme = drawFreshItems(state, 'sudoku_themes', SUDOKU_ICON_THEMES, 1, th => th.id)[0];

  const coords = [];
  for (let r = 0; r < cfg.size; r++) {
    for (let c = 0; c < cfg.size; c++) coords.push([r, c]);
  }

  let solution = null;
  let puzzle = null;
  let given = null;
  let boardSig = '';
  for (let attempt = 0; attempt < 40; attempt++) {
    solution = buildSudokuSolution(cfg.size, cfg.boxR, cfg.boxC);
    puzzle = solution.map(r => r.slice());
    given = solution.map(r => r.map(() => true));
    shuffle(coords)
      .slice(0, cfg.blanks)
      .forEach(([r, c]) => {
        puzzle[r][c] = 0;
        given[r][c] = false;
      });
    boardSig = puzzle.map(r => r.join(',')).join('/');
    if (!hasSeenSignature(state, 'sudoku_boards_' + level, boardSig)) {
      break;
    }
  }
  markSeenSignature(state, 'sudoku_boards_' + level, boardSig, 500);

  const notes = solution.map(r => r.map(() => new Set()));

  let sel = coords.find(([r, c]) => !given[r][c]) || [0, 0];
  let noteMode = false;
  let iconMode = Boolean(state.prefs && state.prefs.sudokuDimSumIcons);
  let mistakes = 0;
  let hintMsg = '';

  function fmtSymbol(v) {
    if (!v) return '';
    return iconMode ? iconTheme.icons[v] : String(v);
  }

  function hasConflict(r, c, val) {
    if (!val) return false;
    for (let i = 0; i < cfg.size; i++) {
      if (i !== c && puzzle[r][i] === val) return true;
      if (i !== r && puzzle[i][c] === val) return true;
    }
    const br = Math.floor(r / cfg.boxR) * cfg.boxR;
    const bc = Math.floor(c / cfg.boxC) * cfg.boxC;
    for (let rr = br; rr < br + cfg.boxR; rr++) {
      for (let cc = bc; cc < bc + cfg.boxC; cc++) {
        if ((rr !== r || cc !== c) && puzzle[rr][cc] === val) return true;
      }
    }
    return false;
  }

  function isSolved() {
    for (let r = 0; r < cfg.size; r++) {
      for (let c = 0; c < cfg.size; c++) {
        if (puzzle[r][c] === 0 || hasConflict(r, c, puzzle[r][c])) return false;
      }
    }
    return true;
  }

  function giveSmartHint() {
    let bestCell = null;
    let bestCandidates = null;
    for (let r = 0; r < cfg.size; r++) {
      for (let c = 0; c < cfg.size; c++) {
        if (puzzle[r][c] !== 0 && puzzle[r][c] === solution[r][c]) continue;
        const cands = [];
        for (let v = 1; v <= cfg.size; v++) {
          if (!hasConflict(r, c, v)) cands.push(v);
        }
        if (!bestCandidates || cands.length < bestCandidates.length) {
          bestCandidates = cands;
          bestCell = [r, c];
        }
      }
    }
    if (!bestCell) return;
    const [hr, hc] = bestCell;
    const ans = solution[hr][hc];
    sel = [hr, hc];
    puzzle[hr][hc] = ans;
    notes[hr][hc].clear();
    playSfx('correct', state.sound);
    hintMsg =
      lang === 'zh'
        ? `💡 智能貼士：第 ${hr + 1} 行、第 ${hc + 1} 列根據同行同列排除法，必定係「${fmtSymbol(ans)}」！已幫你填入。`
        : `💡 Step Hint: Row ${hr + 1}, Col ${hc + 1} must be "${fmtSymbol(ans)}" by row/column/box elimination!`;
    render();
    if (isSolved()) {
      setTimeout(() => finishSudoku(), 400);
    }
  }

  function finishSudoku() {
    const stars = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
    onComplete({ score: 110 + level * 20 + stars * 10, stars });
  }

  function render() {
    container.innerHTML = '';
    const filledCount = puzzle.flat().filter(v => v !== 0).length;
    const totalCells = cfg.size * cfg.size;

    const topTools = `
      <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
        <button type="button" class="chip-btn" id="sdkIconBtn">${
          iconMode ? (lang === 'zh' ? '🔢 數字' : '🔢 Numbers') : `${iconTheme.icons[1]} ${pickText(iconTheme.name, lang)}`
        }</button>
        <button type="button" class="chip-btn" id="sdkNoteBtn" style="${
          noteMode ? 'background:var(--jade);color:#fff;border-color:var(--jade);' : ''
        }">✏️ ${lang === 'zh' ? '草稿' : 'Notes'}</button>
        <button type="button" class="chip-btn" id="sdkHintBtn">${t(lang, 'hintBtn')}</button>
      </div>
    `;

    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: Math.min(3, Math.floor((filledCount / totalCells) * 4)),
      totalSteps: 4,
      extraRightHtml: topTools
    });

    const iconBtn = container.querySelector('#sdkIconBtn');
    if (iconBtn) {
      iconBtn.addEventListener('click', () => {
        iconMode = !iconMode;
        render();
      });
    }
    container.querySelector('#sdkNoteBtn').addEventListener('click', () => {
      noteMode = !noteMode;
      render();
    });
    container.querySelector('#sdkHintBtn').addEventListener('click', giveSmartHint);

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p style="margin:0 0 0.4rem;font-size:0.9rem;color:var(--ink-muted);font-weight:700;text-align:center;">
        ${
          lang === 'zh'
            ? `${cfg.size}×${cfg.size} 棋盤（今日圖案主題：${pickText(iconTheme.name, lang)}）：每行、每列及每個粗框入面都唔可以重複`
            : `${cfg.size}×${cfg.size} Grid (${pickText(iconTheme.name, lang)} theme): Every row, column & bold box contains each symbol once`
        }
      </p>
      <div class="sudoku-board size-${cfg.size}" id="sdkBoard" style="grid-template-columns: repeat(${cfg.size}, 1fr);"></div>
      <div class="numpad-row" id="sdkPad"></div>
      ${hintMsg ? `<div class="feedback-banner" style="margin-top:0.8rem;">${hintMsg}</div>` : ''}
    `;

    const boardEl = card.querySelector('#sdkBoard');
    const [sr, sc] = sel;
    for (let r = 0; r < cfg.size; r++) {
      for (let c = 0; c < cfg.size; c++) {
        const val = puzzle[r][c];
        const isSel = r === sr && c === sc;
        const isPeer =
          r === sr ||
          c === sc ||
          (Math.floor(r / cfg.boxR) === Math.floor(sr / cfg.boxR) &&
            Math.floor(c / cfg.boxC) === Math.floor(sc / cfg.boxC));
        const conf = val !== 0 && hasConflict(r, c, val);
        const boxRight = (c + 1) % cfg.boxC === 0 && c < cfg.size - 1;
        const boxBottom = (r + 1) % cfg.boxR === 0 && r < cfg.size - 1;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = [
          'sudoku-cell',
          given[r][c] ? 'given' : 'user-val',
          isPeer ? 'peer' : '',
          isSel ? 'selected' : '',
          conf ? 'conflict' : '',
          boxRight ? 'box-right' : '',
          boxBottom ? 'box-bottom' : ''
        ]
          .filter(Boolean)
          .join(' ');

        if (val !== 0) {
          btn.textContent = fmtSymbol(val);
        } else if (notes[r][c].size > 0) {
          const nHtml = Array.from({ length: Math.min(9, cfg.size) }, (_, i) =>
            notes[r][c].has(i + 1) ? fmtSymbol(i + 1) : ''
          )
            .map(s => `<span>${s}</span>`)
            .join('');
          btn.innerHTML = `<div class="sudoku-notes">${nHtml}</div>`;
        }

        btn.addEventListener('click', () => {
          sel = [r, c];
          hintMsg = '';
          render();
        });
        boardEl.appendChild(btn);
      }
    }

    const padEl = card.querySelector('#sdkPad');
    for (let v = 1; v <= cfg.size; v++) {
      const pBtn = document.createElement('button');
      pBtn.type = 'button';
      pBtn.className = 'numpad-btn';
      pBtn.textContent = fmtSymbol(v);
      pBtn.addEventListener('click', () => {
        const [r, c] = sel;
        if (given[r][c]) return;
        hintMsg = '';
        if (noteMode) {
          playSfx('tap', state.sound);
          puzzle[r][c] = 0;
          if (notes[r][c].has(v)) notes[r][c].delete(v);
          else notes[r][c].add(v);
          render();
          return;
        }
        puzzle[r][c] = v;
        notes[r][c].clear();
        if (hasConflict(r, c, v)) {
          mistakes += 1;
          playSfx('gentle', state.sound);
        } else {
          playSfx('tap', state.sound);
        }
        render();
        if (isSolved()) {
          setTimeout(() => finishSudoku(), 350);
        }
      });
      padEl.appendChild(pBtn);
    }

    const eraseBtn = document.createElement('button');
    eraseBtn.type = 'button';
    eraseBtn.className = 'numpad-btn';
    eraseBtn.textContent = '⌫';
    eraseBtn.addEventListener('click', () => {
      const [r, c] = sel;
      if (given[r][c]) return;
      puzzle[r][c] = 0;
      notes[r][c].clear();
      render();
    });
    padEl.appendChild(eraseBtn);

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   8. MAHJONG WINNING TILE QUIZ (叫糊大師 — 900 Mathematically Verified Hands)
   ========================================================================= */
function styleMjTile(name) {
  let color = '#1C232B';
  if (name.indexOf('萬') !== -1 || name === '紅中') color = '#C8372D';
  else if (name.indexOf('索') !== -1 || name === '發財') color = '#1B6E56';
  else if (name.indexOf('筒') !== -1 || name === '白板') color = '#1F578A';
  const top = name.length === 2 ? name[0] : name;
  const sub = name.length === 2 ? name[1] : '';
  return { color, top, sub };
}

export function mountTenpaiGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'tenpai');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'tenpai');

  let eligible = TENPAI_HANDS.filter(h => h.minLvl === level);
  if (eligible.length < 3) eligible = TENPAI_HANDS;
  const rounds = drawFreshItems(state, 'tenpai_lvl_' + level, eligible, 3, h => h.id);
  let idx = 0;
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
      stepIndex: idx,
      totalSteps: rounds.length
    });

    const cur = rounds[idx];
    const opts = shuffle(cur.options);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <span class="news-tag">🀄 ${lang === 'zh' ? `第 ${idx + 1}/${rounds.length} 鋪：叫緊糊喇！` : `Hand ${idx + 1}/${rounds.length}: Ready Hand!`}</span>
        <p class="prompt-title" style="margin:0.4rem 0 0;">
          ${lang === 'zh' ? '望實下面副牌，請問摸入邊一張牌可以即刻「食糊」？' : 'Which tile below completes this winning Cantonese Mahjong hand?'}
        </p>
        <div class="mj-rack">
          ${cur.hand
            .map(tName => {
              const st = styleMjTile(tName);
              return `<div class="mj-hand-tile" style="color:${st.color}">
                <span class="t-top">${st.top}</span>
                <span class="t-sub">${st.sub}</span>
              </div>`;
            })
            .join('')}
        </div>
      </div>
      <div class="choices-list" id="tpChoices"></div>
      <div id="tpFb"></div>
    `;

    const listEl = card.querySelector('#tpChoices');
    let solved = false;
    opts.forEach(opt => {
      const st = styleMjTile(opt);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span style="color:${st.color};font-size:1.15rem;font-weight:900;">🀄 ${opt}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (opt === cur.answer) {
          solved = true;
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          btn.querySelector('span:last-child').textContent = '食糊！🎉';
          const isLast = idx + 1 >= rounds.length;
          card.querySelector('#tpFb').innerHTML = `
            <div class="feedback-banner">
              <strong>${randomPraise(lang)}</strong>
              <p style="margin:0.4rem 0 0.8rem;">${pickText(cur.explain, lang)}</p>
              <button type="button" class="btn btn-jade btn-full" id="tpNextBtn">
                ${isLast ? t(lang, 'finishDish') : t(lang, 'nextQuestion')}
              </button>
            </div>
          `;
          card.querySelector('#tpNextBtn').addEventListener('click', () => {
            if (isLast) {
              const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
              onComplete({ score: 100 + level * 15 + stars * 10, stars });
            } else {
              idx += 1;
              render();
            }
          });
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#tpFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      listEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   9. MAHJONG PAIR CLEAR / SHISEN-SHO (315 Sculpted Layouts + 126 Tiles)
   ========================================================================= */
function canConnectTwoTurns(grid, rows, cols, r1, c1, r2, c2) {
  const H = rows + 2;
  const W = cols + 2;
  const sr = r1 + 1;
  const sc = c1 + 1;
  const tr = r2 + 1;
  const tc = c2 + 1;

  function isFree(pr, pc) {
    if (pr === tr && pc === tc) return true;
    if (pr <= 0 || pr > rows || pc <= 0 || pc > cols) return true;
    return grid[pr - 1][pc - 1] === null;
  }

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const best = Array.from({ length: H }, () => Array.from({ length: W }, () => [9, 9, 9, 9]));
  const queue = [];

  for (let d = 0; d < 4; d++) {
    const nr = sr + dirs[d][0];
    const nc = sc + dirs[d][1];
    if (nr >= 0 && nr < H && nc >= 0 && nc < W && isFree(nr, nc)) {
      best[nr][nc][d] = 0;
      queue.push([nr, nc, d, 0]);
    }
  }

  while (queue.length > 0) {
    const [r, c, d, turns] = queue.shift();
    if (r === tr && c === tc) return true;
    for (let nd = 0; nd < 4; nd++) {
      const nt = d === nd ? turns : turns + 1;
      if (nt > 2) continue;
      const nr = r + dirs[nd][0];
      const nc = c + dirs[nd][1];
      if (nr < 0 || nr >= H || nc < 0 || nc >= W || !isFree(nr, nc)) continue;
      if (nt < best[nr][nc][nd]) {
        best[nr][nc][nd] = nt;
        queue.push([nr, nc, nd, nt]);
      }
    }
  }
  return false;
}

export function mountShisenGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'shisen');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'shisen');

  const lvlLayouts = SHISEN_LAYOUTS.filter(l => l.minLvl === level);
  const layout = drawFreshItems(
    state,
    'shisen_layouts_' + level,
    lvlLayouts.length ? lvlLayouts : SHISEN_LAYOUTS,
    1,
    l => l.id
  )[0];

  const rows = layout.rows;
  const cols = layout.cols;
  let activeCells = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (layout.mask[r][c] === 1) activeCells += 1;
    }
  }
  const totalPairs = Math.floor(activeCells / 2);

  const symbols = drawFreshItems(state, 'shisen_tiles', MAHJONG_AND_DIMSUM_TILES, totalPairs, tl => tl.id);
  const pairItems = [];
  for (let i = 0; i < totalPairs; i++) {
    const item = symbols[i % symbols.length];
    pairItems.push(item, item);
  }

  const shuffled = shuffle(pairItems);
  const grid = [];
  let ptr = 0;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      if (layout.mask[r][c] === 1 && ptr < shuffled.length) {
        row.push(shuffled[ptr++]);
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }

  let picked = null;
  let hintPair = null;
  let remaining = totalPairs;

  function findAvailablePair() {
    const open = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) open.push([r, c, grid[r][c]]);
      }
    }
    for (let i = 0; i < open.length; i++) {
      for (let j = i + 1; j < open.length; j++) {
        if (open[i][2].id === open[j][2].id) {
          if (canConnectTwoTurns(grid, rows, cols, open[i][0], open[i][1], open[j][0], open[j][1])) {
            return [[open[i][0], open[i][1]], [open[j][0], open[j][1]]];
          }
        }
      }
    }
    return null;
  }

  function shuffleRemaining() {
    const vals = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) vals.push(grid[r][c]);
      }
    }
    if (vals.length <= 2) return;
    let tries = 0;
    do {
      const mixed = shuffle(vals);
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c]) grid[r][c] = mixed[k++];
        }
      }
      tries += 1;
    } while (!findAvailablePair() && tries < 25);
    picked = null;
    hintPair = null;
  }

  if (!findAvailablePair()) shuffleRemaining();

  function render() {
    container.innerHTML = '';
    const extraBtns = `
      <div style="display:flex;gap:0.4rem;">
        <button type="button" class="chip-btn" id="shisenShuffleBtn">🔀 ${lang === 'zh' ? '洗牌' : 'Shuffle'}</button>
        <button type="button" class="chip-btn" id="shisenHintBtn">${t(lang, 'hintBtn')}</button>
      </div>
    `;
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: totalPairs - remaining,
      totalSteps: totalPairs,
      extraRightHtml: extraBtns
    });

    container.querySelector('#shisenShuffleBtn').addEventListener('click', () => {
      playSfx('tap', state.sound);
      shuffleRemaining();
      render();
    });
    container.querySelector('#shisenHintBtn').addEventListener('click', () => {
      hintPair = findAvailablePair();
      render();
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p style="margin:0;font-size:0.9rem;color:var(--ink-muted);font-weight:700;text-align:center;">
        ${
          lang === 'zh'
            ? `「${pickText(layout.name, lang)}」 · 尚餘 ${remaining} 對牌（連線轉彎唔超過 2 次即可消除）`
            : `${pickText(layout.name, lang)} · ${remaining} pairs left (match within 2 turns)`
        }
      </p>
      <div class="shisen-grid" id="shisenBoard" style="grid-template-columns: repeat(${cols}, 1fr);"></div>
    `;

    const boardEl = card.querySelector('#shisenBoard');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (!cell) {
          const emp = document.createElement('div');
          emp.className = 'shisen-empty';
          boardEl.appendChild(emp);
          continue;
        }
        const isSel = picked && picked[0] === r && picked[1] === c;
        const isHint =
          hintPair &&
          ((hintPair[0][0] === r && hintPair[0][1] === c) || (hintPair[1][0] === r && hintPair[1][1] === c));

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `shisen-tile ${isSel ? 'selected' : ''} ${isHint ? 'hinted' : ''}`;
        const sym = cell.display || cell.symbol;
        btn.innerHTML = `
          <span style="font-size:1.55rem;color:${cell.color || 'var(--ink)'}">${sym}</span>
          <span style="font-size:0.7rem;color:var(--ink-muted);">${pickText(cell.label, lang)}</span>
        `;
        btn.addEventListener('click', () => {
          hintPair = null;
          if (!picked) {
            playSfx('tap', state.sound);
            picked = [r, c];
            render();
            return;
          }
          if (picked[0] === r && picked[1] === c) {
            picked = null;
            render();
            return;
          }
          const firstTile = grid[picked[0]][picked[1]];
          if (
            firstTile.id === cell.id &&
            canConnectTwoTurns(grid, rows, cols, picked[0], picked[1], r, c)
          ) {
            playSfx('correct', state.sound);
            grid[picked[0]][picked[1]] = null;
            grid[r][c] = null;
            picked = null;
            remaining -= 1;
            if (remaining === 0) {
              render();
              setTimeout(() => onComplete({ score: 105 + level * 15 + 30, stars: 3 }), 350);
              return;
            }
            if (!findAvailablePair()) shuffleRemaining();
            render();
          } else {
            playSfx('gentle', state.sound);
            picked = [r, c];
            render();
          }
        });
        boardEl.appendChild(btn);
      }
    }

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   10. MAKE 24 / CARD ARITHMETIC (Gentle Addition-First Default + Smooth 3-Tier Scaling)
   ========================================================================= */
export function mountMake24Game(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'make24');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'make24');

  const bankForLevel =
    level === 0 ? MAKE24_EASY_DEALS : level === 1 ? MAKE24_DEALS : MAKE24_HARD_DEALS;
  const deals = drawFreshItems(
    state,
    'make24_lvl_' + level,
    bankForLevel,
    2,
    d => d.id
  );

  let dIdx = 0;
  let cards = [];
  let historyStack = [];
  let selCardIdx = null;
  let selOp = null;
  let showHint = false;

  function loadDeal() {
    const suits = ['♠️', '♥️', '♣️', '♦️'];
    cards = deals[dIdx].nums.map((v, i) => ({ val: v, label: String(v), suit: suits[i % 4] }));
    historyStack = [];
    selCardIdx = null;
    selOp = level === 0 ? '+' : null;
    showHint = false;
  }

  loadDeal();

  function getHintHighlightIndices(deal) {
    if (!showHint || historyStack.length > 0 || !deal.firstStep) {
      return { idxA: -1, idxB: -1, op: null };
    }
    const a = deal.firstStep.a;
    const b = deal.firstStep.b;
    let idxA = -1;
    let idxB = -1;
    for (let i = 0; i < cards.length; i++) {
      if (idxA === -1 && cards[i].val === a) {
        idxA = i;
      } else if (idxB === -1 && cards[i].val === b) {
        idxB = i;
      }
    }
    return { idxA: idxA, idxB: idxB, op: deal.firstStep.op };
  }

  function render() {
    container.innerHTML = '';
    const deal = deals[dIdx];
    const canUndo = historyStack.length > 0;
    const extraBtns = `
      <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
        <button type="button" class="chip-btn" id="m24UndoBtn" ${canUndo ? '' : 'disabled style="opacity:0.45;"'}>↩️ ${lang === 'zh' ? '復原' : 'Undo'}</button>
        <button type="button" class="chip-btn" id="m24ResetBtn">↺ ${lang === 'zh' ? '重設' : 'Reset'}</button>
        <button type="button" class="chip-btn" id="m24HintBtn">${t(lang, 'hintBtn')}</button>
      </div>
    `;
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: dIdx,
      totalSteps: deals.length,
      extraRightHtml: extraBtns
    });

    container.querySelector('#m24UndoBtn').addEventListener('click', () => {
      if (historyStack.length === 0) return;
      playSfx('tap', state.sound);
      cards = historyStack.pop();
      selCardIdx = null;
      selOp = level === 0 ? '+' : null;
      render();
    });
    container.querySelector('#m24ResetBtn').addEventListener('click', () => {
      playSfx('tap', state.sound);
      loadDeal();
      render();
    });
    container.querySelector('#m24HintBtn').addEventListener('click', () => {
      playSfx('tap', state.sound);
      showHint = !showHint;
      render();
    });

    const tierLabel =
      level === 0
        ? lang === 'zh'
          ? '🌱 輕鬆加法模式（無分數／無除法）'
          : '🌱 Relaxed Addition Mode (No Division)'
        : level === 1
        ? lang === 'zh'
          ? '⭐ 標準整數模式（無分數陷阱）'
          : '⭐ Standard Whole-Number Mode'
        : lang === 'zh'
        ? '🔥 經典挑戰模式'
        : '🔥 Classic Challenge Mode';

    const opsList = level === 0 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
    const hl = getHintHighlightIndices(deal);
    const activeCardText =
      selCardIdx !== null && cards[selCardIdx]
        ? `${cards[selCardIdx].label} ${selOp || '?'} …`
        : lang === 'zh'
        ? '先撳第一張紙牌 👇'
        : 'Tap any card to start 👇';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box" style="text-align:center;">
        <div style="display:flex;justify-content:center;gap:0.45rem;flex-wrap:wrap;margin-bottom:0.35rem;">
          <span class="news-tag" style="margin:0;">🃏 ${lang === 'zh' ? `第 ${dIdx + 1}/${deals.length} 局 · 目標：${deal.target}` : `Hand ${dIdx + 1}/${deals.length} · Target: ${deal.target}`}</span>
          <span class="news-tag" style="margin:0;background:var(--jade-soft);color:var(--jade-dark);">${tierLabel}</span>
        </div>
        <p style="margin:0.35rem 0 0;font-weight:800;">
          ${
            lang === 'zh'
              ? `將紙牌一步步合併成最後一張 <strong style="color:var(--red-chop);font-size:1.32rem;">${deal.target}</strong>！（撳牌 → 揀符號 → 撳第二張牌）`
              : `Combine all cards step-by-step into <strong style="color:var(--red-chop);font-size:1.32rem;">${deal.target}</strong>! (Tap card → operator → second card)`
          }
        </p>
        <div class="m24-step-pill">${activeCardText}</div>
        ${showHint ? `<p style="margin:0.5rem 0 0;color:var(--gold-dark);font-weight:800;">💡 ${pickText(deal.hint, lang)}</p>` : ''}
      </div>

      <div class="poker-row" id="pokerRow"></div>
      <div class="op-row" id="opRow">
        ${opsList
          .map(
            op =>
              `<button type="button" class="op-btn ${selOp === op ? 'selected' : ''} ${hl.op === op ? 'hint-glow' : ''}" data-op="${op}">${op}</button>`
          )
          .join('')}
      </div>
      <div id="m24Fb"></div>
    `;

    const pRow = card.querySelector('#pokerRow');
    cards.forEach((cObj, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isHintedCard = i === hl.idxA || i === hl.idxB;
      btn.className = `poker-card ${selCardIdx === i ? 'selected' : ''} ${isHintedCard ? 'hint-glow' : ''}`;
      const isRed = cObj.suit === '♥️' || cObj.suit === '♦️';
      btn.style.color = isRed ? '#C8372D' : '#1C232B';
      btn.innerHTML = `<span style="font-size:0.9rem;position:absolute;top:6px;left:8px;">${cObj.suit}</span><span>${cObj.label}</span>`;
      btn.addEventListener('click', () => {
        playSfx('tap', state.sound);
        if (selCardIdx === null) {
          selCardIdx = i;
          if (!selOp && level === 0) selOp = '+';
          render();
          return;
        }
        if (selCardIdx === i) {
          selCardIdx = null;
          render();
          return;
        }
        if (!selOp) {
          selCardIdx = i;
          render();
          return;
        }
        const a = cards[selCardIdx].val;
        const b = cObj.val;
        let res = 0;
        if (selOp === '+') res = a + b;
        else if (selOp === '-') res = a - b;
        else if (selOp === '×') res = a * b;
        else if (selOp === '÷') {
          if (b === 0) return;
          res = a / b;
        }

        historyStack.push(cards.map(c => ({ val: c.val, label: c.label, suit: c.suit })));
        const nextCards = cards.filter((_, idx) => idx !== selCardIdx && idx !== i);
        const pretty = Math.abs(res - Math.round(res)) < 0.001 ? String(Math.round(res)) : res.toFixed(2);
        nextCards.push({ val: res, label: pretty, suit: '⭐' });
        cards = nextCards;
        selCardIdx = cards.length === 1 ? null : cards.length - 1;
        selOp = level === 0 ? '+' : null;

        if (cards.length === 1) {
          if (Math.abs(cards[0].val - deal.target) < 0.001) {
            playSfx('correct', state.sound);
            render();
            setTimeout(() => {
              if (dIdx + 1 >= deals.length) {
                onComplete({ score: 110 + level * 15 + 25, stars: 3 });
              } else {
                dIdx += 1;
                loadDeal();
                render();
              }
            }, 450);
            return;
          } else {
            playSfx('gentle', state.sound);
            render();
            const fb = container.querySelector('#m24Fb');
            if (fb) {
              fb.innerHTML = `<div class="feedback-banner gentle-retry">${
                lang === 'zh'
                  ? `最後得出 ${pretty}（目標係 ${deal.target}），撳「↩️ 復原」退一步或「↺ 重設」再試啦 😊`
                  : `That made ${pretty} (target is ${deal.target}) — tap Undo or Reset to try another step 😊`
              }</div>`;
            }
            return;
          }
        }
        render();
      });
      pRow.appendChild(btn);
    });

    card.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selCardIdx === null && cards.length > 0) selCardIdx = 0;
        playSfx('tap', state.sound);
        selOp = btn.dataset.op;
        render();
      });
    });

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   11. TAP-TO-HIGHLIGHT WORD SEARCH (514 ZH + 550 EN Non-Repeating Word Banks)
   ========================================================================= */
const ZH_FILLERS = '春風得意茶香滿屋吉祥如意福壽康寧山水清音明月松間金玉滿堂喜氣洋洋花開富貴竹報平安';
const EN_FILLERS = 'ABCDEFGHJKLMNPQRSTVWXYZ';

export function mountWordSearchGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'wordsearch');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'wordsearch');

  const size = level === 0 ? 6 : 7;
  const targetCount = level === 0 ? 3 : level === 1 ? 4 : 5;
  const poolKey = lang === 'zh' ? 'ws_words_zh' : 'ws_words_en';
  const rawBank = (lang === 'zh' ? ZH_WORD_BANK : EN_WORD_BANK).filter(w => Array.from(w).length <= size);

  if (!state.seen || typeof state.seen !== 'object') state.seen = {};
  let seenList = Array.isArray(state.seen[poolKey]) ? state.seen[poolKey].slice() : [];
  const seenSet = new Set(seenList);
  let unseenWords = shuffle(rawBank.filter(w => !seenSet.has(w)));
  if (unseenWords.length < targetCount) {
    // Only after exhausting 500+ words (>100 days), cycle cleanly
    seenList = [];
    unseenWords = shuffle(rawBank);
  } else {
    // Append already-seen tail only as extreme grid-fit fallback
    unseenWords = unseenWords.concat(shuffle(rawBank.filter(w => seenSet.has(w))));
  }

  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  const placed = [];

  for (let wi = 0; wi < unseenWords.length; wi++) {
    if (placed.length >= targetCount) break;
    const word = unseenWords[wi];
    const chars = Array.from(word);
    let ok = false;
    for (let attempt = 0; attempt < 90 && !ok; attempt++) {
      const horiz = Math.random() < 0.55;
      const r = horiz ? Math.floor(Math.random() * size) : Math.floor(Math.random() * (size - chars.length + 1));
      const c = horiz ? Math.floor(Math.random() * (size - chars.length + 1)) : Math.floor(Math.random() * size);
      let canFit = true;
      const coords = [];
      for (let k = 0; k < chars.length; k++) {
        const rr = horiz ? r : r + k;
        const cc = horiz ? c + k : c;
        if (board[rr][cc] !== '' && board[rr][cc] !== chars[k]) {
          canFit = false;
          break;
        }
        coords.push([rr, cc]);
      }
      if (canFit) {
        coords.forEach(([rr, cc], k) => (board[rr][cc] = chars[k]));
        placed.push({ word, cells: coords, found: false });
        ok = true;
      }
    }
  }

  // Record ONLY the placed words so unplaced candidates stay fresh for tomorrow!
  placed.forEach(p => {
    if (seenList.indexOf(p.word) === -1) seenList.push(p.word);
  });
  state.seen[poolKey] = seenList;
  saveState(state);

  const fillers = lang === 'zh' ? ZH_FILLERS : EN_FILLERS;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) board[r][c] = fillers[Math.floor(Math.random() * fillers.length)];
    }
  }

  let startCell = null;
  let hintCell = null;

  function render() {
    container.innerHTML = '';
    const foundCount = placed.filter(p => p.found).length;
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: foundCount,
      totalSteps: placed.length,
      extraRightHtml: `<button type="button" class="chip-btn" id="wsHintBtn">${t(lang, 'hintBtn')}</button>`
    });

    container.querySelector('#wsHintBtn').addEventListener('click', () => {
      const nextUnfound = placed.find(p => !p.found);
      if (nextUnfound) {
        hintCell = nextUnfound.cells[0];
        render();
      }
    });

    const foundKeySet = new Set();
    placed.filter(p => p.found).forEach(p => p.cells.forEach(([r, c]) => foundKeySet.add(`${r}_${c}`)));

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p style="margin:0 0 0.5rem;font-weight:700;color:var(--ink-muted);font-size:0.9rem;text-align:center;">
        ${
          lang === 'zh'
            ? '無須拖拉：先撳詞語「第一個字」，再撳「最後一個字」即可連線！'
            : 'No dragging needed: Tap the FIRST letter of a word, then tap its LAST letter!'
        }
      </p>
      <div style="display:flex;gap:0.45rem;flex-wrap:wrap;justify-content:center;margin-bottom:0.65rem;">
        ${placed
          .map(
            p =>
              `<span class="stat-pill" style="${
                p.found ? 'background:var(--jade-soft);border-color:var(--jade);text-decoration:line-through;' : ''
              }">${p.word} ${p.found ? '✅' : ''}</span>`
          )
          .join('')}
      </div>
      <div class="ws-grid" id="wsBoard" style="grid-template-columns: repeat(${size}, 1fr);"></div>
    `;

    const gridEl = card.querySelector('#wsBoard');
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isStart = startCell && startCell[0] === r && startCell[1] === c;
        const isHint = hintCell && hintCell[0] === r && hintCell[1] === c;
        const isFound = foundKeySet.has(`${r}_${c}`);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `ws-cell ${isFound ? 'found' : ''} ${isStart ? 'start-pick' : ''}`;
        if (isHint && !isStart) btn.style.borderColor = 'var(--gold)';
        btn.textContent = board[r][c];
        btn.addEventListener('click', () => {
          hintCell = null;
          if (!startCell) {
            playSfx('tap', state.sound);
            startCell = [r, c];
            render();
            return;
          }
          const [sr, sc] = startCell;
          const match = placed.find(p => {
            if (p.found) return false;
            const first = p.cells[0];
            const last = p.cells[p.cells.length - 1];
            return (
              (first[0] === sr && first[1] === sc && last[0] === r && last[1] === c) ||
              (last[0] === sr && last[1] === sc && first[0] === r && first[1] === c)
            );
          });
          if (match) {
            match.found = true;
            startCell = null;
            playSfx('correct', state.sound);
            render();
            if (placed.every(p => p.found)) {
              setTimeout(() => onComplete({ score: 100 + level * 15 + 25, stars: 3 }), 380);
            }
          } else {
            playSfx('tap', state.sound);
            startCell = [r, c];
            render();
          }
        });
        gridEl.appendChild(btn);
      }
    }

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   12. TEA-WOOD BLOCK FIT (42 Polyomino Shapes + 110 Sculpted 6x6 Stages)
   ========================================================================= */
export function mountBlocksGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'blocks');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'blocks');

  const size = 6;
  const goalLines = level === 0 ? 3 : level === 1 ? 4 : 6;
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const stagePattern = drawFreshItems(state, 'block_stages', BLOCK_STAGE_PATTERNS, 1, p => p.id)[0];
  stagePattern.filled.forEach(([r, c]) => {
    if (r >= 0 && r < size && c >= 0 && c < size) board[r][c] = true;
  });

  const eligibleShapes = BLOCK_SHAPES.filter(s => s.minLvl <= level);
  let clearedLines = 0;
  let tray = [];
  let selPieceIdx = 0;

  function canPlace(shape, r0, c0) {
    for (let i = 0; i < shape.length; i++) {
      const rr = r0 + shape[i][0];
      const cc = c0 + shape[i][1];
      if (rr < 0 || rr >= size || cc < 0 || cc >= size || board[rr][cc]) return false;
    }
    return true;
  }

  function canPlaceAnywhere(shape) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (canPlace(shape, r, c)) return true;
      }
    }
    return false;
  }

  function ensurePlayableTray() {
    const unused = tray.filter(p => !p.used);
    if (unused.length === 0) return;
    if (unused.some(p => canPlaceAnywhere(p.cells))) return;
    // Guarantee at least one fitting piece so a player is never stuck!
    const fittingPool = eligibleShapes.filter(s => canPlaceAnywhere(s.cells));
    const rescue = fittingPool.length > 0 ? shuffle(fittingPool)[0] : BLOCK_SHAPES[0];
    const targetIdx = tray.findIndex(p => !p.used);
    if (targetIdx !== -1) {
      tray[targetIdx].cells = rescue.cells;
      selPieceIdx = targetIdx;
    }
  }

  function refillTray() {
    const drawn = drawFreshItems(state, 'block_shapes_' + level, eligibleShapes, 3, s => s.id);
    tray = drawn.map(s => ({
      cells: s.cells,
      used: false
    }));
    selPieceIdx = 0;
    ensurePlayableTray();
  }

  refillTray();

  function render() {
    container.innerHTML = '';
    renderStageHeader({
      container,
      gameMeta,
      lang,
      level,
      onChangeLevel: onLevelChange,
      onBack,
      stepIndex: Math.min(goalLines, clearedLines),
      totalSteps: goalLines,
      extraRightHtml: `<button type="button" class="chip-btn" id="blkRefreshBtn">🔄 ${lang === 'zh' ? '換木塊' : 'New Pieces'}</button>`
    });

    container.querySelector('#blkRefreshBtn').addEventListener('click', () => {
      playSfx('tap', state.sound);
      refillTray();
      render();
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p style="margin:0;font-weight:800;text-align:center;">
        ${
          lang === 'zh'
            ? `「${pickText(stagePattern.name, lang)}」 · 已消除 ${clearedLines} / ${goalLines} 行！先揀木塊再撳棋盤擺放：`
            : `${pickText(stagePattern.name, lang)} · Cleared ${clearedLines} / ${goalLines} lines · Tap a piece then tap the board:`
        }
      </p>
      <div class="block-board" id="blkBoard"></div>
      <div class="piece-tray" id="blkTray"></div>
    `;

    const bEl = card.querySelector('#blkBoard');
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('button');
        btnSetup(cell, r, c);
        bEl.appendChild(cell);
      }
    }

    function btnSetup(cell, r, c) {
      cell.type = 'button';
      cell.className = `block-cell ${board[r][c] ? 'filled' : ''}`;
      cell.addEventListener('click', () => {
        const piece = tray[selPieceIdx];
        if (!piece || piece.used) return;
        if (!canPlace(piece.cells, r, c)) {
          playSfx('gentle', state.sound);
          return;
        }
        piece.cells.forEach(([dr, dc]) => {
          board[r + dr][c + dc] = true;
        });
        piece.used = true;

        const fullRows = [];
        const fullCols = [];
        for (let rr = 0; rr < size; rr++) {
          if (board[rr].every(Boolean)) fullRows.push(rr);
        }
        for (let cc = 0; cc < size; cc++) {
          let all = true;
          for (let rr = 0; rr < size; rr++) if (!board[rr][cc]) all = false;
          if (all) fullCols.push(cc);
        }
        fullRows.forEach(rr => {
          for (let cc = 0; cc < size; cc++) board[rr][cc] = false;
        });
        fullCols.forEach(cc => {
          for (let rr = 0; rr < size; rr++) board[rr][cc] = false;
        });

        const gained = fullRows.length + fullCols.length;
        if (gained > 0) {
          clearedLines += gained;
          playSfx('correct', state.sound);
        } else {
          playSfx('tap', state.sound);
        }

        if (tray.every(p => p.used)) {
          refillTray();
        } else {
          ensurePlayableTray();
          const nextUnused = tray.findIndex(p => !p.used);
          if (nextUnused !== -1) selPieceIdx = nextUnused;
        }

        render();
        if (clearedLines >= goalLines) {
          setTimeout(() => onComplete({ score: 105 + level * 15 + 25, stars: 3 }), 350);
        }
      });
    }

    const trayEl = card.querySelector('#blkTray');
    tray.forEach((p, idx) => {
      if (p.used) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `piece-btn ${selPieceIdx === idx ? 'selected' : ''}`;
      let maxR = 2;
      let maxC = 2;
      p.cells.forEach(([dr, dc]) => {
        if (dr > maxR) maxR = dr;
        if (dc > maxC) maxC = dc;
      });
      const pRows = maxR + 1;
      const pCols = maxC + 1;
      let mini = `<div style="display:grid;grid-template-columns:repeat(${pCols},14px);gap:2px;">`;
      for (let rr = 0; rr < pRows; rr++) {
        for (let cc = 0; cc < pCols; cc++) {
          const on = p.cells.some(([dr, dc]) => dr === rr && dc === cc);
          mini += `<span style="width:14px;height:14px;border-radius:3px;background:${
            on ? '#B56B1B' : 'transparent'
          };"></span>`;
        }
      }
      mini += '</div>';
      btn.innerHTML = mini;
      btn.addEventListener('click', () => {
        selPieceIdx = idx;
        render();
      });
      trayEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  render();
}

/* =========================================================================
   13. STROOP COLOR-WORD SWITCH (8-Color Bank + Non-Repeating Switch Decks)
   ========================================================================= */
export function mountStroopGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'stroop');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'stroop');

  const totalRounds = level === 0 ? 5 : 6;
  const paletteSize = level === 0 ? 4 : level === 1 ? 5 : 6;

  let activeColors = [];
  let deck = [];
  let deckSig = '';
  for (let attempt = 0; attempt < 50; attempt++) {
    activeColors = shuffle(STROOP_COLOR_BANK).slice(0, paletteSize);
    const askFlags = [];
    for (let i = 0; i < totalRounds; i++) {
      askFlags.push(i < Math.ceil(totalRounds / 2));
    }
    const mixedFlags = shuffle(askFlags);
    deck = mixedFlags.map(askInk => {
      const pair = shuffle(activeColors);
      return { askInk, wordObj: pair[0], inkObj: pair[1] };
    });
    deckSig = deck.map(d => `${d.askInk ? 'I' : 'W'}:${d.wordObj.id}/${d.inkObj.id}`).join('|');
    if (!hasSeenSignature(state, 'stroop_decks', deckSig)) break;
  }
  markSeenSignature(state, 'stroop_decks', deckSig, 500);

  let roundIdx = 0;
  let mistakes = 0;

  function nextRound() {
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

    const cur = deck[roundIdx];
    const askInk = cur.askInk;
    const wordObj = cur.wordObj;
    const inkObj = cur.inkObj;
    const targetId = askInk ? inkObj.id : wordObj.id;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box" style="text-align:center;">
        <span class="news-tag" style="font-size:0.9rem;background:${askInk ? 'var(--red-chop-soft)' : 'var(--blue-soft)'};color:${askInk ? 'var(--red-chop-dark)' : 'var(--blue-ink)'};">
          ${
            askInk
              ? lang === 'zh'
                ? '🎨 請揀出「字嘅墨水顏色」（唔好理個字寫乜！）'
                : '🎨 Tap the INK COLOR (ignore what the word says!)'
              : lang === 'zh'
              ? '📖 請揀出「文字本身嘅意思」（唔好理墨水顏色！）'
              : '📖 Tap the WORD MEANING (ignore the ink color!)'
          }
        </span>
        <div style="font-size:3.1rem;font-weight:900;margin:1rem 0;color:${inkObj.hex};letter-spacing:0.06em;">
          ${wordObj[lang]}
        </div>
      </div>
      <div class="games-grid" id="stroopBtns"></div>
    `;

    const grid = card.querySelector('#stroopBtns');
    activeColors.forEach(col => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:0.55rem;">
          <span style="width:22px;height:22px;border-radius:50%;background:${col.hex};display:inline-block;"></span>
          <strong>${col[lang]}</strong>
        </span>
        <span>○</span>
      `;
      btn.addEventListener('click', () => {
        if (col.id === targetId) {
          playSfx('correct', state.sound);
          if (roundIdx + 1 >= totalRounds) {
            const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
            onComplete({ score: 95 + level * 15 + stars * 10, stars });
          } else {
            roundIdx += 1;
            nextRound();
          }
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
        }
      });
      grid.appendChild(btn);
    });

    container.appendChild(card);
  }

  nextRound();
}

/* =========================================================================
   14. PORCELAIN TEACUP CHIME SEQUENCE (4 Themes + 994 Pentatonic Phrases)
   ========================================================================= */
export function mountMelodyGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'melody');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'melody');

  const cupCount = level === 0 ? 4 : level === 1 ? 5 : 6;
  const theme = drawFreshItems(state, 'melody_themes', MELODY_THEMES, 1, th => th.id)[0];
  const cups = theme.cups.slice(0, cupCount);

  const totalRounds = 3;
  const phrasePool = MELODY_PHRASES.filter(p => p.maxCup === cupCount);
  const sessionPhrases = drawFreshItems(
    state,
    'melody_phrases_' + cupCount,
    phrasePool.length >= totalRounds ? phrasePool : MELODY_PHRASES,
    totalRounds,
    p => p.id
  ).sort((a, b) => a.seq.length - b.seq.length);

  let roundIdx = 0;
  let mistakes = 0;
  let sequence = [];
  let playerStep = 0;
  let playingDemo = false;

  function buildSequence() {
    sequence = sessionPhrases[roundIdx].seq.slice();
    playerStep = 0;
  }

  function playSequenceDemo() {
    playingDemo = true;
    playerStep = 0;
    updateStatus();
    sequence.forEach((cupIdx, i) => {
      setTimeout(() => {
        flashCup(cupIdx);
        if (i === sequence.length - 1) {
          setTimeout(() => {
            playingDemo = false;
            updateStatus();
          }, 450);
        }
      }, 420 + i * 620);
    });
  }

  function flashCup(cupIdx) {
    playPentatonicNote(cupIdx, true);
    const el = container.querySelector(`[data-cup="${cupIdx}"]`);
    if (el) {
      el.classList.add('lit');
      setTimeout(() => el.classList.remove('lit'), 380);
    }
  }

  function updateStatus() {
    const stEl = container.querySelector('#melodyStatus');
    if (!stEl) return;
    if (playingDemo) {
      stEl.textContent =
        lang === 'zh'
          ? `👂 「${pickText(theme.name, lang)}」奏樂中，請留心發光次序…`
          : `👂 Watch & listen to the ${pickText(theme.name, lang)}…`;
    } else {
      stEl.textContent =
        lang === 'zh'
          ? `輪到你喇！請順序撳返 ${sequence.length} 隻「${pickText(theme.name, lang)}」（已撳 ${playerStep}/${sequence.length}）`
          : `Your turn! Tap the ${sequence.length} chimes in order (${playerStep}/${sequence.length})`;
    }
  }

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
      totalSteps: totalRounds,
      extraRightHtml: `<button type="button" class="tts-btn" id="replayMelodyBtn">🔊 ${
        lang === 'zh' ? '重聽一次' : 'Replay Chimes'
      }</button>`
    });

    container.querySelector('#replayMelodyBtn').addEventListener('click', () => {
      if (!playingDemo) playSequenceDemo();
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p id="melodyStatus" style="margin:0;font-weight:800;font-size:1.05rem;text-align:center;color:var(--jade-dark);"></p>
      <div class="teacup-grid" id="cupGrid"></div>
    `;

    const grid = card.querySelector('#cupGrid');
    cups.forEach(cup => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'teacup-btn';
      btn.dataset.cup = String(cup.idx);
      btn.innerHTML = `<span style="font-size:2rem;">${cup.emoji}</span><span>${cup[lang]}</span>`;
      btn.addEventListener('click', () => {
        if (playingDemo) return;
        flashCup(cup.idx);
        if (cup.idx === sequence[playerStep]) {
          playerStep += 1;
          updateStatus();
          if (playerStep === sequence.length) {
            playingDemo = true;
            setTimeout(() => {
              if (roundIdx + 1 >= totalRounds) {
                const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
                onComplete({ score: 100 + level * 15 + stars * 10, stars });
              } else {
                roundIdx += 1;
                buildSequence();
                render();
                playSequenceDemo();
              }
            }, 520);
          }
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          playerStep = 0;
          setTimeout(() => playSequenceDemo(), 500);
        }
      });
      grid.appendChild(btn);
    });

    container.appendChild(card);
    updateStatus();
  }

  buildSequence();
  render();
  playSequenceDemo();
}

/* =========================================================================
   15. VOCABULARY BUILDER (雅言詞匯館 — 105+ Context + 105+ Practical EN + 390+ Pairs)
   ========================================================================= */
export function mountVocabGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'vocab');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'vocab');

  const ctxItem = drawFreshItems(state, 'vocab_ctx', VOCAB_CONTEXT_ITEMS, 1, x => x.id)[0];
  const engItem = drawFreshItems(state, 'vocab_en', PRACTICAL_ENGLISH_ITEMS, 1, x => x.id)[0];
  const pairCount = level === 0 ? 3 : 4;
  const chosenPairs = drawFreshItems(state, 'vocab_pairs', VOCAB_MATCH_PAIRS, pairCount, x => x.id);

  let step = 0;
  let mistakes = 0;
  let bilingualBridge = true;

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

    if (step === 0) renderContextStep();
    else if (step === 1) renderEnglishStep();
    else renderPairMatchStep();
  }

  function renderContextStep() {
    const sText = pickText(ctxItem.sentence, lang);
    const opts = shuffle(ctxItem.choices);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;flex-wrap:wrap;">
          <span class="news-tag">${pickText(ctxItem.tag, lang)} · 1/3</span>
          <button type="button" class="tts-btn" id="vocCtxSpeakBtn">${t(lang, 'listenCantonese')}</button>
        </div>
        <p class="prompt-title" style="margin-bottom:0;">${sText}</p>
      </div>
      <div class="choices-list" id="vocCtxOpts"></div>
      <div id="vocCtxFb"></div>
    `;

    card.querySelector('#vocCtxSpeakBtn').addEventListener('click', () => speakText(sText, lang));
    const listEl = card.querySelector('#vocCtxOpts');
    let solved = false;

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${pickText(opt, lang)}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (opt.ok) {
          solved = true;
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          btn.querySelector('span:last-child').textContent = '✅';
          card.querySelector('#vocCtxFb').innerHTML = `
            <div class="feedback-banner">
              <strong>${randomPraise(lang)} · 🌟 ${ctxItem.wordSpotlight.zh} (${ctxItem.wordSpotlight.en})</strong>
              <p style="margin:0.4rem 0 0.8rem;">${pickText(ctxItem.tip, lang)}</p>
              <button type="button" class="btn btn-jade btn-full" id="vocStep1NextBtn">${t(lang, 'nextQuestion')}</button>
            </div>
          `;
          card.querySelector('#vocStep1NextBtn').addEventListener('click', () => {
            stopSpeaking();
            step = 1;
            render();
          });
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#vocCtxFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      listEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  function renderEnglishStep() {
    const pText = pickText(engItem.prompt, lang);
    const opts = shuffle(engItem.choices);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.45rem;margin-bottom:0.5rem;flex-wrap:wrap;">
          <span class="news-tag">🔤 ${lang === 'zh' ? '生活實用英文詞匯 · 2/3' : 'Everyday Expressive Word · 2/3'}</span>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <button type="button" class="tts-btn" id="speakEnWordBtn">🔊 讀英文 "${engItem.enWord}"</button>
            <button type="button" class="chip-btn" id="speakPromptBtn">🔊 ${lang === 'zh' ? '讀題目' : 'Read Prompt'}</button>
          </div>
        </div>
        <div style="font-size:1.65rem;font-weight:900;color:var(--blue-ink);margin:0.2rem 0;">
          ${engItem.enWord}
          <span style="font-size:0.88rem;font-weight:600;color:var(--ink-muted);"> /${engItem.phonetic}/</span>
        </div>
        <p class="prompt-title" style="margin:0.35rem 0 0;font-size:1.08rem;">${pText}</p>
      </div>
      <div class="choices-list" id="vocEnOpts"></div>
      <div id="vocEnFb"></div>
    `;

    card.querySelector('#speakEnWordBtn').addEventListener('click', () => speakText(engItem.enWord, 'en'));
    card.querySelector('#speakPromptBtn').addEventListener('click', () => speakText(pText, lang));

    const listEl = card.querySelector('#vocEnOpts');
    let solved = false;
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${pickText(opt, lang)}</span><span>○</span>`;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (opt.ok) {
          solved = true;
          playSfx('correct', state.sound);
          btn.classList.add('correct');
          btn.querySelector('span:last-child').textContent = '✅';
          card.querySelector('#vocEnFb').innerHTML = `
            <div class="feedback-banner">
              <strong>${randomPraise(lang)}</strong>
              <p style="margin:0.4rem 0 0.8rem;">${pickText(engItem.example, lang)}</p>
              <button type="button" class="btn btn-jade btn-full" id="vocStep2NextBtn">${t(lang, 'nextQuestion')}</button>
            </div>
          `;
          card.querySelector('#vocStep2NextBtn').addEventListener('click', () => {
            stopSpeaking();
            step = 2;
            render();
          });
        } else {
          mistakes += 1;
          playSfx('gentle', state.sound);
          btn.classList.add('wrong');
          btn.disabled = true;
          card.querySelector('#vocEnFb').innerHTML = `<div class="feedback-banner gentle-retry">${t(lang, 'gentleRetry')}</div>`;
        }
      });
      listEl.appendChild(btn);
    });

    container.appendChild(card);
  }

  function renderPairMatchStep() {
    const leftList = shuffle(chosenPairs.map(p => ({ id: p.id, text: p.left, side: 'L' })));
    const rightList = shuffle(
      chosenPairs.map(p => ({
        id: p.id,
        text: bilingualBridge ? p.rightEn : p.rightZh,
        speakLang: bilingualBridge ? 'en' : 'zh',
        side: 'R'
      }))
    );
    const matchedIds = new Set();
    let pickedLeft = null;

    function drawPairs() {
      container.querySelectorAll('.voc-pair-card').forEach(e => e.remove());
      const card = document.createElement('div');
      card.className = 'card voc-pair-card';
      card.innerHTML = `
        <div class="prompt-box">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span class="news-tag">🔗 ${lang === 'zh' ? '壓軸題：詞義對對碰 · 3/3' : 'Final Round: Vocabulary Match · 3/3'}</span>
            <button type="button" class="chip-btn" id="toggleBridgeModeBtn">
              ${bilingualBridge ? '🌉 中↔英配對（切換中文近義詞）' : '📖 中文近義詞（切換中↔英配對）'}
            </button>
          </div>
          <p class="prompt-title" style="margin:0.4rem 0 0;font-size:1.06rem;">
            ${
              lang === 'zh'
                ? '先撳左邊四字雅詞，再撳右邊相應意思完成配對（撳詞語仲會自動發音！）：'
                : 'Tap a Chinese expression on the left, then tap its matching meaning on the right:'
            }
          </p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;" id="pairCols">
          <div style="display:grid;gap:0.55rem;" id="leftCol"></div>
          <div style="display:grid;gap:0.55rem;" id="rightCol"></div>
        </div>
        <div id="vocPairFb"></div>
      `;

      card.querySelector('#toggleBridgeModeBtn').addEventListener('click', () => {
        bilingualBridge = !bilingualBridge;
        renderPairMatchStep();
      });

      const lCol = card.querySelector('#leftCol');
      const rCol = card.querySelector('#rightCol');

      leftList.forEach(item => {
        const done = matchedIds.has(item.id);
        const isSel = pickedLeft === item.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = done;
        btn.className = `item-chip ${isSel ? 'selected' : ''} ${done ? 'locked-group-0' : ''}`;
        btn.innerHTML = `<strong>${item.text}</strong> ${done ? '✅' : ''}`;
        btn.addEventListener('click', () => {
          playSfx('tap', state.sound);
          speakText(item.text, 'zh');
          pickedLeft = item.id;
          drawPairs();
        });
        lCol.appendChild(btn);
      });

      rightList.forEach(item => {
        const done = matchedIds.has(item.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = done;
        btn.className = `item-chip ${done ? 'locked-group-0' : ''}`;
        btn.innerHTML = `<span>${item.text}</span> ${done ? '✅' : ''}`;
        btn.addEventListener('click', () => {
          speakText(item.text.replace(/（.*?）/, ''), item.speakLang);
          if (!pickedLeft) {
            playSfx('tap', state.sound);
            return;
          }
          if (pickedLeft === item.id) {
            matchedIds.add(item.id);
            pickedLeft = null;
            playSfx('correct', state.sound);
            drawPairs();
            if (matchedIds.size === chosenPairs.length) {
              setTimeout(() => {
                stopSpeaking();
                const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
                onComplete({ score: 105 + level * 15 + stars * 10, stars });
              }, 420);
            }
          } else {
            mistakes += 1;
            playSfx('gentle', state.sound);
            const fb = container.querySelector('#vocPairFb');
            if (fb) {
              fb.innerHTML = `<div class="feedback-banner gentle-retry">${
                lang === 'zh' ? '呢兩個詞義唔同喎，再揀另一個配對試下 😊' : 'Try another meaning match 😊'
              }</div>`;
            }
          }
        });
        rCol.appendChild(btn);
      });

      container.appendChild(card);
    }

    drawPairs();
  }

  render();
}
