import { GAME_CATALOG, MAHJONG_AND_DIMSUM_TILES } from '../data/content.js';
import { t, pickText, randomPraise, playSfx, playPentatonicNote, speakText, stopSpeaking } from '../i18n.js';
import { renderStageHeader } from './engine.js';

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
  return typeof v === 'number' ? v : 1;
}

/* =========================================================================
   7. TEA-HOUSE SUDOKU (醒神茶樓數獨 — 4x4, 6x6, 9x9 + Icons + Notes + Hints)
   ========================================================================= */
const DIMSUM_ICONS = ['', '🥟', '🧆', '🥧', '🫖', '🥯', '🍤', '🥬', '🍊', '🍁'];

function buildSudokuSolution(size, boxR, boxC) {
  // Canonical valid pattern + randomized symbol, within-band row & within-stack col shuffles
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

  const solution = buildSudokuSolution(cfg.size, cfg.boxR, cfg.boxC);
  const puzzle = solution.map(r => r.slice());
  const given = solution.map(r => r.map(() => true));
  const notes = solution.map(r => r.map(() => new Set()));

  const coords = [];
  for (let r = 0; r < cfg.size; r++) {
    for (let c = 0; c < cfg.size; c++) coords.push([r, c]);
  }
  shuffle(coords)
    .slice(0, cfg.blanks)
    .forEach(([r, c]) => {
      puzzle[r][c] = 0;
      given[r][c] = false;
    });

  let sel = coords.find(([r, c]) => !given[r][c]) || [0, 0];
  let noteMode = false;
  let iconMode = false;
  let mistakes = 0;
  let hintMsg = '';

  function fmtSymbol(v) {
    if (!v) return '';
    return iconMode && cfg.size <= 6 ? DIMSUM_ICONS[v] : String(v);
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
        ${
          cfg.size <= 6
            ? `<button type="button" class="chip-btn" id="sdkIconBtn">${
                iconMode ? '🔢 數字' : '🥟 點心圖案'
              }</button>`
            : ''
        }
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
            ? `${cfg.size}×${cfg.size} 棋盤：每行、每列及每個粗框入面都唔可以重複`
            : `${cfg.size}×${cfg.size} Grid: Every row, column & bold box contains each symbol once`
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
   8. MAHJONG WINNING TILE QUIZ (叫糊大師 — 聽邊張牌？)
   ========================================================================= */
const TENPAI_HANDS = [
  {
    minLvl: 0,
    hand: ['一萬', '二萬', '三萬', '五筒', '五筒', '五筒', '紅中'],
    options: ['紅中', '九萬', '北風'],
    answer: '紅中',
    explain: {
      zh: '一二三萬（順子）＋ 五筒刻子 ＋ 單吊「紅中」做將眼即食糊！',
      en: '1-2-3 Characterschow + 5-Dots pung + pairing the Red Dragon ("紅中") completes the eye!'
    }
  },
  {
    minLvl: 0,
    hand: ['二索', '三索', '四索', '六萬', '七萬', '發財', '發財'],
    options: ['八萬', '一筒', '南風'],
    answer: '八萬',
    explain: {
      zh: '六萬、七萬兩面叫糊，摸「八萬」（或五萬）湊成順子，配發財做眼食糊！',
      en: '6-7 Characters forms a two-sided wait — drawing 8 Characters completes the run alongside the Green Dragon pair!'
    }
  },
  {
    minLvl: 0,
    hand: ['一筒', '二筒', '三筒', '四萬', '六萬', '白板', '白板'],
    options: ['五萬', '九筒', '西風'],
    answer: '五萬',
    explain: {
      zh: '四萬同六萬中間「卡窿」聽「五萬」，湊齊四五六萬順子即食糊！',
      en: '4 and 6 Characters form a middle ("kanchan") wait for 5 Characters!'
    }
  },
  {
    minLvl: 1,
    hand: ['一萬', '二萬', '三萬', '四筒', '五筒', '六筒', '二索', '二索', '東風', '東風'],
    options: ['東風', '七萬', '九索'],
    answer: '東風',
    explain: {
      zh: '二索與東風「對碰」叫糊！摸入「東風」變刻子、留二索做眼即食糊！',
      en: 'Dual-pair ("shanpon") wait on 2-Bamboo and East Wind — drawing East Wind completes the triplet!'
    }
  },
  {
    minLvl: 1,
    hand: ['二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '八筒', '紅中', '紅中'],
    options: ['八筒', '一萬', '南風'],
    answer: '八筒',
    explain: {
      zh: '八筒同紅中對碰！摸「八筒」湊成刻子，好靚嘅混一色牌型！',
      en: 'Half-flush hand waiting on 8-Dots (or Red Dragon) to complete the final triplet!'
    }
  },
  {
    minLvl: 2,
    hand: ['一萬', '一萬', '一萬', '二萬', '三萬', '四萬', '五萬', '六萬', '七萬', '八萬', '九萬', '九萬', '九萬'],
    options: ['五萬', '紅中', '一筒'],
    answer: '五萬',
    explain: {
      zh: '傳說中嘅「九子連環」（純正九蓮寶燈）！一至九萬任何一張萬子都食得糊！',
      en: 'The legendary Nine Gates ("九子連環") pure flush — wins on ANY Characters tile 1 through 9!'
    }
  },
  {
    minLvl: 2,
    hand: ['二索', '三索', '四索', '四索', '五索', '六索', '七索', '八索', '發財', '發財', '發財', '九筒', '九筒'],
    options: ['九索', '二萬', '白板'],
    answer: '九索',
    explain: {
      zh: '二三四索 ＋ 四五六索 ＋ 七八索聽「九索」（或六索），配發財刻子同九筒眼！',
      en: '2-3-4 + 4-5-6 + 7-8 Bamboo waiting cleanly on 9-Bamboo!'
    }
  }
];

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

  let eligible = TENPAI_HANDS.filter(h => h.minLvl <= level);
  if (eligible.length < 3) eligible = TENPAI_HANDS;
  const rounds = shuffle(eligible).slice(0, 3);
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
   9. MAHJONG PAIR CLEAR / SHISEN-SHO (麻雀連連看消消樂)
   ========================================================================= */
function canConnectTwoTurns(grid, rows, cols, r1, c1, r2, c2) {
  // Padded coordinate space: 0..rows+1, 0..cols+1
  const H = rows + 2;
  const W = cols + 2;
  const sr = r1 + 1, sc = c1 + 1;
  const tr = r2 + 1, tc = c2 + 1;

  function isFree(pr, pc) {
    if (pr === tr && pc === tc) return true;
    if (pr <= 0 || pr > rows || pc <= 0 || pc > cols) return true;
    return grid[pr - 1][pc - 1] === null;
  }

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  // visited[pr][pc][dir] = min turns
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

  const rows = level === 0 ? 4 : 4;
  const cols = level === 0 ? 4 : level === 1 ? 5 : 6;
  const totalPairs = (rows * cols) / 2;

  const symbols = shuffle(MAHJONG_AND_DIMSUM_TILES);
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
    for (let c = 0; c < cols; c++) row.push(shuffled[ptr++]);
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
    } while (!findAvailablePair() && tries < 20);
    picked = null;
    hintPair = null;
  }

  // Ensure initial board always has at least one legal move
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
            ? `尚餘 ${remaining} 對牌 · 兩隻相同牌只要連線轉彎唔超過 2 次（包括外圍邊界）即可消除！`
            : `${remaining} pairs left · Match identical tiles connected with at most 2 turns!`
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
   10. MAKE 24 / CARD ARITHMETIC (合廿四撲克心算)
   ========================================================================= */
const MAKE12_DEALS = [
  { nums: [2, 3, 6], target: 12, hint: { zh: '先計 2 × 3 = 6，再加 6 就等於 12！', en: 'First 2 × 3 = 6, then 6 + 6 = 12!' } },
  { nums: [2, 4, 8], target: 12, hint: { zh: '先計 8 × 2 = 16，再減 4 就等於 12！', en: 'First 8 × 2 = 16, then 16 − 4 = 12!' } },
  { nums: [3, 3, 6], target: 12, hint: { zh: '3 + 3 = 6，再加 6 = 12！', en: '3 + 3 = 6, then 6 + 6 = 12!' } },
  { nums: [3, 4, 5], target: 12, hint: { zh: '3 + 4 + 5 = 12！', en: '3 + 4 + 5 = 12!' } }
];

const MAKE24_DEALS = [
  { nums: [3, 4, 6, 8], target: 24, hint: { zh: '先計 8 − 6 = 2，再計 3 × 4 × 2 = 24！', en: 'Try 8 − 6 = 2, then 3 × 4 × 2 = 24!' } },
  { nums: [2, 3, 4, 6], target: 24, hint: { zh: '先計 3 − 2 = 1，再計 4 × 6 × 1 = 24！', en: 'Try 3 − 2 = 1, then 4 × 6 × 1 = 24!' } },
  { nums: [1, 2, 3, 4], target: 24, hint: { zh: '全部乘埋一齊：1 × 2 × 3 × 4 = 24！', en: 'Multiply all four: 1 × 2 × 3 × 4 = 24!' } },
  { nums: [2, 6, 6, 6], target: 24, hint: { zh: '先計 6 × 6 = 36 及 6 × 2 = 12，再計 36 − 12 = 24！', en: '6 × 6 = 36 and 6 × 2 = 12, then 36 − 12 = 24!' } },
  { nums: [3, 3, 6, 6], target: 24, hint: { zh: '先計 6 ÷ 3 = 2，加 6 變 8，再乘 3 = 24！', en: '6 ÷ 3 = 2, 2 + 6 = 8, then 8 × 3 = 24!' } },
  { nums: [2, 3, 6, 9], target: 24, hint: { zh: '先計 9 − 3 = 6，減 2 變 4，再乘 6 = 24！', en: '9 − 3 = 6, 6 − 2 = 4, then 4 × 6 = 24!' } },
  { nums: [3, 4, 4, 6], target: 24, hint: { zh: '先計 4 − 3 = 1，再計 4 × 6 × 1 = 24！', en: '4 − 3 = 1, then 4 × 6 × 1 = 24!' } }
];

export function mountMake24Game(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'make24');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'make24');

  const deals = shuffle(level === 0 ? MAKE12_DEALS : MAKE24_DEALS).slice(0, 2);
  let dIdx = 0;
  let cards = [];
  let selCardIdx = null;
  let selOp = null;
  let showHint = false;

  function loadDeal() {
    const suits = ['♠️', '♥️', '♣️', '♦️'];
    cards = deals[dIdx].nums.map((v, i) => ({ val: v, label: String(v), suit: suits[i % 4] }));
    selCardIdx = null;
    selOp = null;
    showHint = false;
  }

  loadDeal();

  function render() {
    container.innerHTML = '';
    const deal = deals[dIdx];
    const extraBtns = `
      <div style="display:flex;gap:0.4rem;">
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

    container.querySelector('#m24ResetBtn').addEventListener('click', () => {
      loadDeal();
      render();
    });
    container.querySelector('#m24HintBtn').addEventListener('click', () => {
      showHint = !showHint;
      render();
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="prompt-box" style="text-align:center;">
        <span class="news-tag">🃏 ${lang === 'zh' ? `第 ${dIdx + 1}/${deals.length} 局 · 目標數字：${deal.target}` : `Hand ${dIdx + 1}/${deals.length} · Target: ${deal.target}`}</span>
        <p style="margin:0.45rem 0 0;font-weight:800;">
          ${
            lang === 'zh'
              ? `請將「全部紙牌」用 ＋ − × ÷ 合併成最後一張 <strong style="color:var(--red-chop);font-size:1.3rem;">${deal.target}</strong>！（先撳一張牌 → 揀符號 → 再撳第二張牌）`
              : `Combine ALL cards step-by-step using + − × ÷ until one card of <strong style="color:var(--red-chop);font-size:1.3rem;">${deal.target}</strong> remains!`
          }
        </p>
        ${showHint ? `<p style="margin:0.5rem 0 0;color:var(--gold-dark);font-weight:700;">💡 ${pickText(deal.hint, lang)}</p>` : ''}
      </div>

      <div class="poker-row" id="pokerRow"></div>
      <div class="op-row" id="opRow">
        ${['+', '-', '×', '÷']
          .map(
            op => `<button type="button" class="op-btn ${selOp === op ? 'selected' : ''}" data-op="${op}">${op}</button>`
          )
          .join('')}
      </div>
      <div id="m24Fb"></div>
    `;

    const pRow = card.querySelector('#pokerRow');
    cards.forEach((cObj, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `poker-card ${selCardIdx === i ? 'selected' : ''}`;
      const isRed = cObj.suit === '♥️' || cObj.suit === '♦️';
      btn.style.color = isRed ? '#C8372D' : '#1C232B';
      btn.innerHTML = `<span style="font-size:0.9rem;position:absolute;top:6px;left:8px;">${cObj.suit}</span><span>${cObj.label}</span>`;
      btn.addEventListener('click', () => {
        playSfx('tap', state.sound);
        if (selCardIdx === null || !selOp) {
          selCardIdx = i;
          render();
          return;
        }
        if (selCardIdx === i) {
          selCardIdx = null;
          selOp = null;
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
          if (b === 0 || Math.abs((a / b) - Math.round(a / b)) > 0.0001 && cards.length === 2) {
            // still allow clean fractions during intermediate steps!
          }
          if (b === 0) return;
          res = a / b;
        }

        const nextCards = cards.filter((_, idx) => idx !== selCardIdx && idx !== i);
        const pretty = Math.abs(res - Math.round(res)) < 0.001 ? String(Math.round(res)) : res.toFixed(2);
        nextCards.push({ val: res, label: pretty, suit: '⭐' });
        cards = nextCards;
        selCardIdx = cards.length === 1 ? null : cards.length - 1;
        selOp = null;

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
                  ? `最後得出 ${pretty}（目標係 ${deal.target}），撳右上角「重設」再試另一個組合啦 😊`
                  : `That made ${pretty} (target is ${deal.target}) — tap Reset to try another combination 😊`
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
   11. TAP-TO-HIGHLIGHT WORD SEARCH (港溫尋字陣)
   ========================================================================= */
const ZH_WORD_BANK = ['天星小輪', '史丹利', '鐵觀音', '菠蘿油', '獅門橋', '龍馬精神', '蝦餃皇', '維多利亞'];
const EN_WORD_BANK = ['FERRY', 'MAPLE', 'TEAPOT', 'DIMSUM', 'SALMON', 'BRIDGE', 'GARDEN'];
const ZH_FILLERS = '春風得意茶香滿屋吉祥如意福壽康寧山水清音明月松間金玉滿堂喜氣洋洋';
const EN_FILLERS = 'ABCDEFGHJKLMNPQRSTVWXYZ';

export function mountWordSearchGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'wordsearch');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'wordsearch');

  const size = level === 0 ? 6 : 7;
  const targetCount = level === 0 ? 3 : level === 1 ? 4 : 5;
  const bank = shuffle(lang === 'zh' ? ZH_WORD_BANK : EN_WORD_BANK).filter(w => w.length <= size);

  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  const placed = []; // { word, cells: [[r,c],...] , found: false }

  for (const word of bank) {
    if (placed.length >= targetCount) break;
    const chars = Array.from(word);
    let ok = false;
    for (let attempt = 0; attempt < 60 && !ok; attempt++) {
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
   12. TEA-WOOD BLOCK FIT (茶木方塊消消樂 — 6x6 Woodoku Lite)
   ========================================================================= */
const BLOCK_SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0]]
];

export function mountBlocksGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'blocks');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'blocks');

  const size = 6;
  const goalLines = level === 0 ? 3 : level === 1 ? 4 : 6;
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  let clearedLines = 0;
  let tray = [];
  let selPieceIdx = 0;

  function refillTray() {
    tray = [0, 1, 2].map(() => ({
      cells: BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
      used: false
    }));
    selPieceIdx = 0;
  }

  refillTray();

  function canPlace(shape, r0, c0) {
    for (let i = 0; i < shape.length; i++) {
      const rr = r0 + shape[i][0];
      const cc = c0 + shape[i][1];
      if (rr < 0 || rr >= size || cc < 0 || cc >= size || board[rr][cc]) return false;
    }
    return true;
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
            ? `已消除 ${clearedLines} / ${goalLines} 行！先揀下面木塊，再撳棋盤格仔擺放（填滿整行或整列即消除）：`
            : `Lines Cleared: ${clearedLines} / ${goalLines} · Tap a wooden piece below, then tap the board to place it:`
        }
      </p>
      <div class="block-board" id="blkBoard"></div>
      <div class="piece-tray" id="blkTray"></div>
    `;

    const bEl = card.querySelector('#blkBoard');
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('button');
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

          // Check completed rows & cols
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
            const nextUnused = tray.findIndex(p => !p.used);
            if (nextUnused !== -1) selPieceIdx = nextUnused;
          }

          render();
          if (clearedLines >= goalLines) {
            setTimeout(() => onComplete({ score: 105 + level * 15 + 25, stars: 3 }), 350);
          }
        });
        bEl.appendChild(cell);
      }
    }

    const trayEl = card.querySelector('#blkTray');
    tray.forEach((p, idx) => {
      if (p.used) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `piece-btn ${selPieceIdx === idx ? 'selected' : ''}`;
      // Render mini 3x3 preview
      let mini = '<div style="display:grid;grid-template-columns:repeat(3,16px);gap:2px;">';
      for (let rr = 0; rr < 3; rr++) {
        for (let cc = 0; cc < 3; cc++) {
          const on = p.cells.some(([dr, dc]) => dr === rr && dc === cc);
          mini += `<span style="width:16px;height:16px;border-radius:3px;background:${
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
   13. STROOP COLOR-WORD SWITCH (心清眼亮辨色字)
   ========================================================================= */
const STROOP_COLORS = [
  { id: 'red', hex: '#C8372D', zh: '紅色', en: 'RED' },
  { id: 'green', hex: '#1B6E56', zh: '綠色', en: 'GREEN' },
  { id: 'blue', hex: '#1F578A', zh: '藍色', en: 'BLUE' },
  { id: 'gold', hex: '#C2780E', zh: '橙黃色', en: 'AMBER' }
];

export function mountStroopGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'stroop');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'stroop');

  const totalRounds = level === 0 ? 5 : 6;
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

    const askInk = roundIdx % 2 === 0;
    const shuffled = shuffle(STROOP_COLORS);
    const wordObj = shuffled[0];
    const inkObj = shuffled[1];
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
    STROOP_COLORS.forEach(col => {
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
   14. PORCELAIN TEACUP CHIME SEQUENCE (茗茶聽音記次序)
   ========================================================================= */
const TEACUPS = [
  { idx: 0, emoji: '🫖', zh: '普洱（宮）', en: 'Pu-erh (Do)' },
  { idx: 1, emoji: '🍵', zh: '鐵觀音（商）', en: 'Oolong (Re)' },
  { idx: 2, emoji: '🌼', zh: '香片（角）', en: 'Jasmine (Mi)' },
  { idx: 3, emoji: '🍃', zh: '龍井（徵）', en: 'Dragon Well (Sol)' },
  { idx: 4, emoji: '🌻', zh: '菊普（羽）', en: 'Chrysanthemum (La)' },
  { idx: 5, emoji: '🪵', zh: '水仙（清宮）', en: "Rock Tea (Do')" }
];

export function mountMelodyGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'melody');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'melody');

  const cupCount = level === 0 ? 4 : level === 1 ? 5 : 6;
  const cups = TEACUPS.slice(0, cupCount);
  const totalRounds = 3;
  let roundIdx = 0;
  let mistakes = 0;
  let sequence = [];
  let playerStep = 0;
  let playingDemo = false;

  function buildSequence() {
    const seqLen = (level === 0 ? 3 : 3) + roundIdx + (level === 2 ? 1 : 0);
    sequence = Array.from({ length: seqLen }, () => Math.floor(Math.random() * cupCount));
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
      stEl.textContent = lang === 'zh' ? '👂 請留心聽同望實茶杯發光次序…' : '👂 Watch & listen to the teacup chimes…';
    } else {
      stEl.textContent =
        lang === 'zh'
          ? `輪到你喇！請順序撳返 ${sequence.length} 隻茶杯（已撳 ${playerStep}/${sequence.length}）`
          : `Your turn! Tap the ${sequence.length} teacups in order (${playerStep}/${sequence.length})`;
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
   15. VOCABULARY BUILDER (雅言詞匯館 — 中文雅詞 · 生活英文 · 雙語近義對對碰)
   ========================================================================= */
const VOCAB_CONTEXT_ITEMS = [
  {
    tag: { zh: '📖 中文雅詞 · 語境選詞', en: '📖 Context Vocabulary' },
    sentence: {
      zh: '週末嘅格蘭湖島市集熱鬧非常，前來買新鮮生果嘅遊人「＿＿＿＿」，由朝到晚都咁旺場。',
      en: 'Granville Island Market was bustling all weekend, with a "________" stream of visitors browsing fresh fruit from morning till dusk.'
    },
    wordSpotlight: { zh: '絡繹不絕', en: 'Continuous / Steady stream' },
    choices: [
      { zh: '絡繹不絕（形容人流接連不斷）', en: 'Continuous / Unbroken (絡繹不絕)', ok: true },
      { zh: '鴉雀無聲（形容非常安靜）', en: 'Pin-drop silent (鴉雀無聲)', ok: false },
      { zh: '寥寥可數（形容人數極少）', en: 'Few and far between (寥寥可數)', ok: false }
    ],
    tip: {
      zh: '例句：每逢節日，維園花市嘅市民都絡繹不絕。（英文常用：a steady stream of visitors）',
      en: 'Usage: "A steady / continuous stream of visitors filled the flower market."'
    }
  },
  {
    tag: { zh: '📖 中文雅詞 · 人物神采', en: '📖 Expressive Adjectives' },
    sentence: {
      zh: '陳伯每日朝早去公園行山嘆早茶，雖然年過七十，依然面色紅潤、「＿＿＿＿」！',
      en: 'Uncle Chan hikes and enjoys morning tea every day; even past seventy, he looks vibrant and "________"!'
    },
    wordSpotlight: { zh: '神采奕奕', en: 'Radiant & full of vitality' },
    choices: [
      { zh: '神采奕奕（精神飽滿、容光煥發）', en: 'Radiant & vigorous (神采奕奕)', ok: true },
      { zh: '無精打采（疲倦乏力）', en: 'Listless & tired (無精打采)', ok: false },
      { zh: '心不在焉（思想唔集中）', en: 'Absent-minded (心不在焉)', ok: false }
    ],
    tip: {
      zh: '近義詞：容光煥發、精神抖擻。（英文常用：radiant / full of vitality）',
      en: 'Synonyms: vibrant, glowing, full of vitality (容光煥發).'
    }
  },
  {
    tag: { zh: '📖 中文雅詞 · 生活態度', en: '📖 Everyday Wisdom Words' },
    sentence: {
      zh: '溫哥華冬天落雨又落雪，我哋最好趁秋天「＿＿＿＿」，提早檢查好暖氣同雨具。',
      en: 'Before Vancouver’s rainy winter arrives, it is wise to be "________" and check our heating and rain gear early.'
    },
    wordSpotlight: { zh: '未雨綢繆', en: 'Proactive / Plan ahead' },
    choices: [
      { zh: '未雨綢繆（天未落雨先修補門窗，比喻事先準備）', en: 'Proactive — prepare ahead (未雨綢繆)', ok: true },
      { zh: '臨急抱佛腳（事到臨頭先匆忙應付）', en: 'Last-minute scramble (臨急抱佛腳)', ok: false },
      { zh: '得過且過（敷衍了事）', en: 'Just getting by (得過且過)', ok: false }
    ],
    tip: {
      zh: '「未雨綢繆」出自《詩經》，讚賞人有遠見！（英文常用：proactive / plan ahead for a rainy day）',
      en: 'Idiom note: Preparing before the rain falls — matching English "save/prepare for a rainy day"!'
    }
  },
  {
    tag: { zh: '📖 中文雅詞 · 整齊條理', en: '📖 Precision Words' },
    sentence: {
      zh: '媽媽將廚房嘅茶葉罐同調味樽擺放得「＿＿＿＿」，搵起嘢上嚟一目了然！',
      en: 'Mom arranged all the tea tins and spice jars in such a "________" order that everything is easy to find at a glance!'
    },
    wordSpotlight: { zh: '井井有條', en: 'Meticulous & orderly' },
    choices: [
      { zh: '井井有條（整齊而有秩序）', en: 'Neat & orderly (井井有條)', ok: true },
      { zh: '亂七八糟（毫無條理）', en: 'Cluttered & messy (亂七八糟)', ok: false },
      { zh: '模稜兩可（含糊不清）', en: 'Vague & ambiguous (模稜兩可)', ok: false }
    ],
    tip: {
      zh: '近義詞：有條不紊、整整齊齊。（英文常用：neat and orderly / well-organized）',
      en: 'Synonyms: methodical, tidy, well-organized (有條不紊).'
    }
  }
];

const PRACTICAL_ENGLISH_ITEMS = [
  {
    enWord: 'Complimentary',
    phonetic: 'kom-plih-MEN-tuh-ree',
    prompt: {
      zh: '喺酒店、渡輪或者西九茶座見到英文「Complimentary Tea」，請問「Complimentary」係咩意思？',
      en: 'When a hotel or tea house menu lists "Complimentary Tea", what does "Complimentary" mean?'
    },
    choices: [
      { zh: '免費招待／贈送（Free of charge）', en: 'Provided free of charge as a courtesy', ok: true },
      { zh: '必須額外加收雙倍服務費', en: 'Subject to a double surcharge', ok: false },
      { zh: '已經售罄暫停供應', en: 'Sold out for the day', ok: false }
    ],
    example: {
      zh: '實用句：Breakfast is complimentary for all guests.（所有住客均可享免費早餐。）',
      en: 'Example: "Complimentary warm jasmine tea is served upon arrival."'
    }
  },
  {
    enWord: 'Itinerary',
    phonetic: 'eye-TIN-uh-reh-ree',
    prompt: {
      zh: '去旅行搭飛機或者參加導賞團時，職員派發嘅「Itinerary」係指乜嘢？',
      en: 'When traveling between Hong Kong and Vancouver, what is a travel "Itinerary"?'
    },
    choices: [
      { zh: '詳細行程表／航班時間路線單', en: 'A planned route or schedule of travel times & stops', ok: true },
      { zh: '行李超重罰款單', en: 'An overweight baggage fine', ok: false },
      { zh: '免稅店化妝品優惠券', en: 'A duty-free cosmetics coupon', ok: false }
    ],
    example: {
      zh: '實用句：Let me check our flight itinerary.（等我睇睇我哋張航班行程表先。）',
      en: 'Example: "Our itinerary includes a morning ferry ride and afternoon dim sum."'
    }
  },
  {
    enWord: 'Postpone',
    phonetic: 'pohst-POHN',
    prompt: {
      zh: '社區中心通告寫住：「Due to heavy rain, the garden walk will be postponed.」請問「Postpone」係咩意思？',
      en: 'A community notice says: "Due to rain, the walk will be postponed." What does "Postpone" mean?'
    },
    choices: [
      { zh: '延期／改期遲啲再舉行（唔係永久取消）', en: 'Reschedule to a later date or time', ok: true },
      { zh: '提早兩個鐘頭開始', en: 'Start two hours earlier than planned', ok: false },
      { zh: '改為室內收費晚宴', en: 'Convert into a formal paid banquet', ok: false }
    ],
    example: {
      zh: '實用句：Let’s postpone our walk until tomorrow morning.（我哋將散步順延到聽日朝早啦。）',
      en: 'Example: "They decided to postpone the picnic until sunny Saturday."'
    }
  },
  {
    enWord: 'Scenic',
    phonetic: 'SEE-nik',
    prompt: {
      zh: '溫哥華海堤或者香港山頂常見路牌寫住「Scenic Route」，請問「Scenic」代表乜嘢？',
      en: 'Road signs near Stanley Park or Victoria Peak often point to a "Scenic Route". What does "Scenic" describe?'
    },
    choices: [
      { zh: '風景優美嘅、景色怡人嘅', en: 'Offering beautiful, picturesque natural views', ok: true },
      { zh: '禁止行人進入嘅施工路段', en: 'Closed off for heavy construction', ok: false },
      { zh: '只准貨車行駛嘅高速公路', en: 'Restricted to commercial trucks only', ok: false }
    ],
    example: {
      zh: '實用句：We took the scenic ferry ride across the harbour.（我哋搭渡輪欣賞沿途海港靚景。）',
      en: 'Example: "The Sea-to-Sky Highway is famous for its breathtaking scenic views."'
    }
  },
  {
    enWord: 'Nostalgic',
    phonetic: 'nah-STAL-jik',
    prompt: {
      zh: '聽到七、八十年代金曲或者見到舊啟德相片覺得好「Nostalgic」，呢個英文詞形容咩心情？',
      en: 'Hearing golden 1970s Cantopop songs or seeing vintage Kai Tak photos feels "Nostalgic" — what does that mean?'
    },
    choices: [
      { zh: '懷舊溫馨、勾起昔日美好回憶', en: 'Warmly sentimental & fond of happy past memories', ok: true },
      { zh: '緊張焦慮、擔心遲到', en: 'Anxious about running late', ok: false },
      { zh: '肚餓想食宵夜', en: 'Hungry for a midnight snack', ok: false }
    ],
    example: {
      zh: '實用句：Old tram photos make me feel nostalgic.（舊電車相片令我好懷念昔日時光。）',
      en: 'Example: "Classic bakery egg tarts always bring back nostalgic childhood memories."'
    }
  }
];

const VOCAB_MATCH_PAIRS = [
  { id: 'v1', left: '津津有味', rightZh: '興致勃勃（近義）', rightEn: 'Relish with gusto' },
  { id: 'v2', left: '和藹可親', rightZh: '親切溫和（近義）', rightEn: 'Warm & amiable' },
  { id: 'v3', left: '一絲不苟', rightZh: '認真仔細（近義）', rightEn: 'Meticulous & thorough' },
  { id: 'v4', left: '豁然開朗', rightZh: '頓時明白（近義）', rightEn: 'Sudden clarity' },
  { id: 'v5', left: '精益求精', rightZh: '力求完美（近義）', rightEn: 'Strive for excellence' },
  { id: 'v6', left: '琳瑯滿目', rightZh: '美物繁多（近義）', rightEn: 'Dazzling array' }
];

export function mountVocabGame(ctx) {
  const { container, state, onBack, onComplete, onLevelChange } = ctx;
  const lang = state.lang;
  const level = getLevel(state, 'vocab');
  const gameMeta = GAME_CATALOG.find(g => g.id === 'vocab');

  // 3 engaging steps per dish:
  // Step 0: Refined Chinese Context Word
  // Step 1: Practical HK x Vancouver Everyday English Word (with English & Cantonese audio!)
  // Step 2: Synonym & Bilingual Pair-Match Board!
  const ctxItem = shuffle(VOCAB_CONTEXT_ITEMS)[0];
  const engItem = shuffle(PRACTICAL_ENGLISH_ITEMS)[0];
  const pairCount = level === 0 ? 3 : 4;
  const chosenPairs = shuffle(VOCAB_MATCH_PAIRS).slice(0, pairCount);

  let step = 0;
  let mistakes = 0;
  let bilingualBridge = true; // Toggle between Chinese-English bridge vs Chinese-Synonym on Step 2

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
