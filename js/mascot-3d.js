/* =========================================================================
   MOCHI 3D (招財茶貓「阿喵」 3D) — Zero-Dependency WebGL Cel-Shaded Cat Engine
   Nintendo Super Mario 3D World / Animal Crossing Amiibo-Style 3D Cat Guide
   ========================================================================= */

export const GAME_COACH_LINES = {
  news: {
    zh: '喵～先慢慢讀幾段港溫暖心小新聞，再答問題考記性！隨時撳「🔊 朗讀」聽我讀畀你聽～',
    en: 'Meow~ Read the short HK & Vancouver stories at your own pace, then answer the recall questions! Tap 🔊 anytime.'
  },
  memory: {
    zh: '翻開兩張麻雀或點心牌配對！記住佢哋嘅位置，唔限時間慢慢搵喵～',
    en: 'Flip two tiles at a time to find matching pairs! Take your time remembering each spot.'
  },
  math: {
    zh: '茶樓埋單同找續心算！慢慢加埋點心價錢，計啱數就蓋印仔喵！',
    en: 'Tea-house bill & change math! Add up the dim sum or tap bills to make exact change.'
  },
  history: {
    zh: '重溫香港同溫哥華嘅經典歲月！揀啱答案，再將大事按年份由早到晚排好～',
    en: 'Explore classic HK & Vancouver milestones, then tap events from earliest to latest!'
  },
  words: {
    zh: '廣東話抵死俗語同四字成語！揀最貼切嘅下句，再玩埋詞語分類喵～',
    en: 'Complete classic Cantonese proverbs & idioms, then group related words together!'
  },
  eagle: {
    zh: '貓眼大考驗！喺一眾相似公仔、車仔或字入面，搵出唯一唔同嗰一個！',
    en: 'Cat-eye challenge! Spot the single odd illustration or character hiding in the grid.'
  },
  sudoku: {
    zh: '先揀空格再撳下面數字（或點心圖案），令每行、每列、每宮都唔重複！卡關可撳「💡 提示」～',
    en: 'Tap an empty cell, then pick a number or dim sum icon so every row, column & box has no repeats!'
  },
  tenpai: {
    zh: '望實呢副十張牌（三組順子／刻子加一對眼），揀出摸入即刻食糊嗰張牌喵！',
    en: 'Study the 10-tile hand and pick the exact winning tile that completes 3 melds + 1 pair!'
  },
  shisen: {
    zh: '揀兩隻相同嘅牌，只要連線轉彎唔超過兩次就可以消走！搵唔到可以撳提示或洗牌～',
    en: 'Match two identical tiles that connect with at most 2 turns! Use Hint or Shuffle anytime.'
  },
  make24: {
    zh: '先撳一張撲克牌 → 再揀 ＋ − × ÷ → 再撳第二張牌，將四張牌合併成目標數字！',
    en: 'Tap a card → pick + − × ÷ → tap a second card to merge all 4 cards into the target!'
  },
  wordsearch: {
    zh: '喺字陣入面搵出上面列出嘅詞語：先撳詞語「頭一格」，再撳「尾一格」就連到線㗎喇！',
    en: 'Find each listed word in the grid: tap its FIRST letter/character, then tap its LAST cell!'
  },
  blocks: {
    zh: '先揀下面一款木塊，再撳 6×6 棋盤擺放；填滿整橫行或整直列就會爽快消除喵！',
    en: 'Select a wood piece below, then tap the 6×6 board to place it — fill any row or column to clear!'
  },
  stroop: {
    zh: '睇清上面口令問「墨水顏色」定「文字意思」，千祈唔好俾顏色呃到呀！',
    en: 'Check the rule banner carefully: tap either the INK COLOR or the WORD MEANING!'
  },
  melody: {
    zh: '豎起貓耳仔聽住瓷杯響起嘅次序，然後跟住相同次序撳返對應茶杯！可以隨時重聽～',
    en: 'Perk up your ears and listen to the porcelain teacup chimes, then tap the cups in order!'
  },
  vocab: {
    zh: '三關雅言之旅：先玩語境選成語、再學實用英文詞、最後配對中英近義詞喵！',
    en: '3-stage word journey: context idioms, practical everyday English, and bilingual synonym match!'
  }
};

const COACH_CHEERS = {
  zh: [
    '喵嗚～好嘢！眼明手快，答得好準呀！✨',
    '犀利呀！腦筋轉得仲快過貓仔撲蝶！🌟',
    '正呀！就係呢個節奏，繼續保持喵！🐾',
    '勁呀！招財貓阿喵舉起肉球畀個大讚你！👏',
    '太精靈喇！越玩越醒神喵～！🎉'
  ],
  en: [
    'Meow~! Spot on! Sharp eyes and nimble thinking! ✨',
    'Purr-fect move! You nailed that one! 🌟',
    'Wonderful! Keep that smooth rhythm going! 🐾',
    'Fantastic! Mochi gives you two fluffy paws up! 👏',
    'Super sharp! Your brain is firing on all cylinders! 🎉'
  ]
};

const COACH_ENCOURAGE = {
  zh: [
    '唔緊要㗎喵～深呼吸睇真啲，再試多一次！😊',
    '差少少咋！慢慢諗，完全唔計時㗎！🍵',
    '試下換個角度望下？需要時可以撳「💡 貼士」幫手喵！💡',
    '氣定神閒最醒神，再揀過就得㗎喇！✨'
  ],
  en: [
    'No rush at all, meow~ Take another look and try again 😊',
    'Very close! Zero timer pressure — take your time 🍵',
    'Try another angle, or tap 💡 Hint if you want a friendly nudge!',
    'Steady and relaxed wins the day — give it another tap! ✨'
  ]
};

let globalPtrX = 0;
let globalPtrY = 0;
let activeInstances = [];
let rafRunning = false;
let currentStageGameId = null;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const onPtr = function (e) {
    const cx = typeof e.clientX === 'number' ? e.clientX : e.touches && e.touches[0] ? e.touches[0].clientX : null;
    const cy = typeof e.clientY === 'number' ? e.clientY : e.touches && e.touches[0] ? e.touches[0].clientY : null;
    if (cx !== null && cy !== null && window.innerWidth > 0 && window.innerHeight > 0) {
      globalPtrX = (cx / window.innerWidth) * 2 - 1;
      globalPtrY = (cy / window.innerHeight) * 2 - 1;
    }
  };
  window.addEventListener('pointermove', onPtr, { passive: true });
  window.addEventListener('pointerdown', onPtr, { passive: true });
}

/* =========================================================================
   MINIMAL 4x4 MATRIX & PROCEDURAL 3D MESH BUILDERS
   ========================================================================= */
function mat4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function mat4Perspective(fovRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4Translate(m, x, y, z) {
  const t = mat4Identity();
  t[12] = x;
  t[13] = y;
  t[14] = z;
  return mat4Multiply(m, t);
}

function mat4Scale(m, sx, sy, sz) {
  const s = mat4Identity();
  s[0] = sx;
  s[5] = sy;
  s[10] = sz;
  return mat4Multiply(m, s);
}

function mat4RotateX(m, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = mat4Identity();
  r[5] = c;
  r[6] = s;
  r[9] = -s;
  r[10] = c;
  return mat4Multiply(m, r);
}

function mat4RotateY(m, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = mat4Identity();
  r[0] = c;
  r[2] = -s;
  r[8] = s;
  r[10] = c;
  return mat4Multiply(m, r);
}

function mat4RotateZ(m, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = mat4Identity();
  r[0] = c;
  r[1] = s;
  r[4] = -s;
  r[5] = c;
  return mat4Multiply(m, r);
}

function createSphereMesh(latBands, lonBands) {
  const pos = [];
  const norm = [];
  const idx = [];
  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    for (let lon = 0; lon <= lonBands; lon++) {
      const phi = (lon * 2 * Math.PI) / lonBands;
      const x = Math.cos(phi) * sinT;
      const y = cosT;
      const z = Math.sin(phi) * sinT;
      pos.push(x, y, z);
      norm.push(x, y, z);
    }
  }
  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const first = lat * (lonBands + 1) + lon;
      const second = first + lonBands + 1;
      idx.push(first, first + 1, second);
      idx.push(second, first + 1, second + 1);
    }
  }
  return { pos: new Float32Array(pos), norm: new Float32Array(norm), idx: new Uint16Array(idx) };
}

function createTorusMesh(R, r, segsR, segsr) {
  const pos = [];
  const norm = [];
  const idx = [];
  for (let i = 0; i <= segsR; i++) {
    const u = (i / segsR) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    for (let j = 0; j <= segsr; j++) {
      const v = (j / segsr) * Math.PI * 2;
      const cv = Math.cos(v);
      const sv = Math.sin(v);
      const x = (R + r * cv) * cu;
      const y = (R + r * cv) * su;
      const z = r * sv;
      pos.push(x, y, z);
      norm.push(cv * cu, cv * su, sv);
    }
  }
  for (let i = 0; i < segsR; i++) {
    for (let j = 0; j < segsr; j++) {
      const a = i * (segsr + 1) + j;
      const b = a + segsr + 1;
      idx.push(a, b, a + 1);
      idx.push(b, b + 1, a + 1);
    }
  }
  return { pos: new Float32Array(pos), norm: new Float32Array(norm), idx: new Uint16Array(idx) };
}

function createCylinderMesh(radTop, radBot, height, segs) {
  const pos = [];
  const norm = [];
  const idx = [];
  const half = height / 2;
  const slope = (radBot - radTop) / height;

  // Side ring
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const ny = slope;
    const nl = Math.hypot(c, ny, s) || 1;
    pos.push(c * radTop, half, s * radTop);
    norm.push(c / nl, ny / nl, s / nl);
    pos.push(c * radBot, -half, s * radBot);
    norm.push(c / nl, ny / nl, s / nl);
  }
  for (let i = 0; i < segs; i++) {
    const p = i * 2;
    idx.push(p, p + 2, p + 1);
    idx.push(p + 1, p + 2, p + 3);
  }

  // Top cap
  const topCenter = pos.length / 3;
  pos.push(0, half, 0);
  norm.push(0, 1, 0);
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    pos.push(Math.cos(a) * radTop, half, Math.sin(a) * radTop);
    norm.push(0, 1, 0);
  }
  for (let i = 0; i < segs; i++) {
    idx.push(topCenter, topCenter + i + 2, topCenter + i + 1);
  }

  // Bottom cap
  const botCenter = pos.length / 3;
  pos.push(0, -half, 0);
  norm.push(0, -1, 0);
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    pos.push(Math.cos(a) * radBot, -half, Math.sin(a) * radBot);
    norm.push(0, -1, 0);
  }
  for (let i = 0; i < segs; i++) {
    idx.push(botCenter, botCenter + i + 1, botCenter + i + 2);
  }

  return { pos: new Float32Array(pos), norm: new Float32Array(norm), idx: new Uint16Array(idx) };
}

/* =========================================================================
   WEBGL TOON + GLOSSY VINYL SHADER PIPELINE
   ========================================================================= */
const VERT_SRC = [
  'attribute vec3 aPos;',
  'attribute vec3 aNorm;',
  'uniform mat4 uProj;',
  'uniform mat4 uModel;',
  'uniform float uOutline;',
  'varying vec3 vNorm;',
  'varying vec3 vWorldPos;',
  'void main() {',
  '  vec3 nWorld = normalize((uModel * vec4(aNorm, 0.0)).xyz);',
  '  vec4 wp = uModel * vec4(aPos, 1.0);',
  '  if (uOutline > 0.0) {',
  '    wp.xyz += nWorld * uOutline;',
  '  }',
  '  vNorm = nWorld;',
  '  vWorldPos = wp.xyz;',
  '  gl_Position = uProj * wp;',
  '}'
].join('\n');

const FRAG_SRC = [
  'precision mediump float;',
  'varying vec3 vNorm;',
  'varying vec3 vWorldPos;',
  'uniform vec3 uColor;',
  'uniform float uOutline;',
  'uniform float uRough;',
  'uniform float uAlpha;',
  'void main() {',
  '  if (uOutline > 0.0) {',
  '    gl_FragColor = vec4(0.16, 0.10, 0.07, uAlpha);',
  '    return;',
  '  }',
  '  vec3 N = normalize(vNorm);',
  '  vec3 L = normalize(vec3(0.48, 0.78, 0.65));',
  '  vec3 V = normalize(vec3(0.0, 0.12, 4.2) - vWorldPos);',
  '  vec3 H = normalize(L + V);',
  '  float ndl = dot(N, L) * 0.5 + 0.5;',
  '  float toon = smoothstep(0.30, 0.42, ndl) * 0.28 + smoothstep(0.66, 0.78, ndl) * 0.17 + 0.66;',
  '  vec3 warmSky = mix(vec3(0.95, 0.85, 0.78), vec3(1.04, 1.01, 0.96), clamp(N.y * 0.5 + 0.5, 0.0, 1.0));',
  '  float spec = pow(max(dot(N, H), 0.0), mix(46.0, 10.0, uRough)) * (1.0 - uRough * 0.72);',
  '  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.25;',
  '  vec3 col = uColor * toon * warmSky + vec3(1.0, 0.98, 0.92) * spec * 0.44 + vec3(1.0, 0.92, 0.75) * rim;',
  '  gl_FragColor = vec4(col, uAlpha);',
  '}'
].join('\n');

function compileGlProgram(gl) {
  function mkShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }
  const vs = mkShader(gl.VERTEX_SHADER, VERT_SRC);
  const fs = mkShader(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  return prog;
}

function uploadMesh(gl, data) {
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.pos, gl.STATIC_DRAW);

  const normBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.norm, gl.STATIC_DRAW);

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.idx, gl.STATIC_DRAW);

  return { posBuf: posBuf, normBuf: normBuf, idxBuf: idxBuf, count: data.idx.length };
}

function initWebGLScene(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  let gl = null;
  try {
    gl =
      canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
  } catch (e) {
    return null;
  }
  if (!gl) return null;

  const prog = compileGlProgram(gl);
  if (!prog) return null;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const locs = {
    aPos: gl.getAttribLocation(prog, 'aPos'),
    aNorm: gl.getAttribLocation(prog, 'aNorm'),
    uProj: gl.getUniformLocation(prog, 'uProj'),
    uModel: gl.getUniformLocation(prog, 'uModel'),
    uColor: gl.getUniformLocation(prog, 'uColor'),
    uOutline: gl.getUniformLocation(prog, 'uOutline'),
    uRough: gl.getUniformLocation(prog, 'uRough'),
    uAlpha: gl.getUniformLocation(prog, 'uAlpha')
  };

  const meshes = {
    sphere: uploadMesh(gl, createSphereMesh(22, 28)),
    lowSphere: uploadMesh(gl, createSphereMesh(12, 16)),
    earCone: uploadMesh(gl, createCylinderMesh(0.045, 1.0, 1.0, 22)),
    torus: uploadMesh(gl, createTorusMesh(0.20, 0.028, 24, 12)),
    cyl: uploadMesh(gl, createCylinderMesh(1.0, 1.0, 1.0, 28)),
    cup: uploadMesh(gl, createCylinderMesh(1.0, 0.72, 1.0, 22))
  };

  return { gl: gl, prog: prog, locs: locs, meshes: meshes };
}

/* =========================================================================
   RENDER ONE FRAME OF 3D LUCKY TEA CAT MOCHI (招財茶貓阿喵)
   ========================================================================= */
function renderBaoBoFrame(inst, nowMs) {
  const ctx3d = inst.glCtx;
  if (!ctx3d) return;
  const gl = ctx3d.gl;
  const locs = ctx3d.locs;
  const meshes = ctx3d.meshes;
  const canvas = inst.canvas;

  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const dispW = canvas.clientWidth || inst.size || 140;
  const dispH = canvas.clientHeight || inst.size || 140;
  const targetW = Math.max(64, Math.round(dispW * dpr));
  const targetH = Math.max(64, Math.round(dispH * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(ctx3d.prog);

  const t = nowMs * 0.001;
  const calm = typeof document !== 'undefined' && document.documentElement.dataset.motion === 'calm';
  const animScale = calm ? 0.12 : 1.0;

  // Smooth spring physics for poke/jump/ear-perk transitions
  inst.squashVel += (0 - inst.squash) * 0.22;
  inst.squashVel *= 0.74;
  inst.squash += inst.squashVel;
  inst.earPerk = (inst.earPerk || 0) * 0.88;

  const targetYaw = Math.max(-0.42, Math.min(0.42, globalPtrX * 0.36));
  const targetPitch = Math.max(-0.24, Math.min(0.24, globalPtrY * 0.22));
  inst.yaw += (targetYaw - inst.yaw) * 0.09;
  inst.pitch += (targetPitch - inst.pitch) * 0.09;

  const mood = inst.mood || 'greet';
  let jumpY = Math.sin(t * 2.8 + inst.seed) * 0.042 * animScale;
  let spinY = Math.sin(t * 0.95 + inst.seed) * 0.08 * animScale;
  let headTiltZ = Math.sin(t * 1.9 + inst.seed) * 0.03 * animScale;

  if (mood === 'cheer' || mood === 'celebrate') {
    jumpY = Math.abs(Math.sin(t * 6.4)) * 0.22 * animScale;
    spinY = Math.sin(t * 3.2) * 0.32 * animScale;
    headTiltZ = Math.sin(t * 6.4) * 0.08 * animScale;
  } else if (mood === 'happy' || mood === 'proud') {
    jumpY = Math.abs(Math.sin(t * 4.5)) * 0.11 * animScale;
    headTiltZ = Math.sin(t * 3.3) * 0.08 * animScale;
  } else if (mood === 'think') {
    headTiltZ = 0.20;
  }

  const proj = mat4Perspective(0.62, canvas.width / canvas.height, 0.5, 20.0);
  gl.uniformMatrix4fv(locs.uProj, false, proj);

  function drawPart(mesh, modelMat, rgb, outlineWidth, rough, alpha) {
    const rVal = typeof rough === 'number' ? rough : 0.34;
    const aVal = typeof alpha === 'number' ? alpha : 1.0;

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
    gl.enableVertexAttribArray(locs.aPos);
    gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuf);
    gl.enableVertexAttribArray(locs.aNorm);
    gl.vertexAttribPointer(locs.aNorm, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
    gl.uniformMatrix4fv(locs.uModel, false, modelMat);
    gl.uniform1f(locs.uRough, rVal);
    gl.uniform1f(locs.uAlpha, aVal);

    // Pass 1: Inverted-hull dark espresso toon outline
    if (outlineWidth > 0 && aVal >= 0.98) {
      gl.cullFace(gl.FRONT);
      gl.uniform1f(locs.uOutline, outlineWidth);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    // Pass 2: Shaded front faces
    gl.cullFace(gl.BACK);
    gl.uniform1f(locs.uOutline, 0.0);
    gl.uniform3f(locs.uColor, rgb[0], rgb[1], rgb[2]);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  // Palette constants for Ginger-Apricot & Snow-Cream Lucky Cat Mochi
  const FUR_GINGER = [0.99, 0.63, 0.25];
  const FUR_STRIPE = [0.73, 0.33, 0.10];
  const FUR_CREAM = [1.0, 0.98, 0.94];
  const PINK_SAKURA = [1.0, 0.58, 0.66];
  const PINK_NOSE = [0.98, 0.42, 0.52];
  const COLLAR_RED = [0.86, 0.17, 0.17];
  const BELL_GOLD = [1.0, 0.80, 0.18];

  // Camera base transform
  let world = mat4Translate(mat4Identity(), 0, -0.07, -4.22);
  world = mat4RotateX(world, 0.07);

  // 1. Amiibo Gold & Jade Cushion Turntable Pedestal
  let pedGold = mat4Translate(world, 0, -1.07, 0);
  pedGold = mat4Scale(pedGold, 0.96, 0.11, 0.96);
  drawPart(meshes.cyl, pedGold, [0.93, 0.68, 0.20], 0.026, 0.24, 1.0);

  let pedTop = mat4Translate(world, 0, -1.00, 0);
  pedTop = mat4Scale(pedTop, 0.86, 0.075, 0.86);
  drawPart(meshes.cyl, pedTop, [0.15, 0.54, 0.42], 0.02, 0.35, 1.0);

  // Root Cat Transform (squash & stretch + jump + subtle spin)
  const sqY = 1.0 + inst.squash;
  const sqXZ = 1.0 - inst.squash * 0.52;
  let root = mat4Translate(world, 0, jumpY, 0);
  root = mat4RotateY(root, spinY + inst.yaw * 0.42);
  root = mat4Scale(root, sqXZ, sqY, sqXZ);

  // 2. Articulated 6-Segment 3D Swishing Cat Tail (sweeping S-curve with white tip!)
  const wagSpeed = mood === 'cheer' || mood === 'celebrate' ? 8.2 : mood === 'happy' || mood === 'proud' ? 5.4 : 3.2;
  const wagAmp = (mood === 'cheer' || mood === 'celebrate' ? 0.16 : 0.085) * animScale;
  for (let seg = 0; seg < 6; seg++) {
    const u = seg / 5;
    const wave = Math.sin(t * wagSpeed - u * 2.4 + inst.seed) * wagAmp * (0.35 + u * 0.85);
    const tx = 0.34 + u * 0.52 + Math.sin(u * Math.PI) * 0.05;
    const ty = -0.78 + u * u * 0.68 + wave * 0.55;
    const tz = -0.22 + u * 0.12 + wave * 0.65;
    const rad = seg === 5 ? 0.118 : 0.110 - u * 0.010;
    const tailCol = seg >= 4 ? FUR_CREAM : seg === 2 ? FUR_STRIPE : FUR_GINGER;
    let tailSeg = mat4Translate(root, tx, ty, tz);
    tailSeg = mat4Scale(tailSeg, rad, rad, rad);
    drawPart(meshes.lowSphere, tailSeg, tailCol, 0.022, 0.36, 1.0);
  }

  // 3. Cute Snow-White Hind Cat Paws + Pink Toe-Bean Pads
  const footSwing = mood === 'cheer' || mood === 'celebrate' ? Math.sin(t * 8.0) * 0.16 * animScale : 0;
  [-1, 1].forEach(function (side) {
    const fy = -0.90 + side * footSwing * 0.22;
    let paw = mat4Translate(root, side * 0.27, fy, 0.16);
    paw = mat4Scale(paw, 0.175, 0.115, 0.22);
    drawPart(meshes.lowSphere, paw, FUR_CREAM, 0.024, 0.38, 1.0);

    let pad = mat4Translate(root, side * 0.27, fy + 0.01, 0.365);
    pad = mat4Scale(pad, 0.065, 0.044, 0.03);
    drawPart(meshes.lowSphere, pad, PINK_SAKURA, 0.0, 0.45, 1.0);
  });

  // 4. Plump Sitting Ginger Cat Body + Fluffy Snow-White Belly Bib
  let torso = mat4Translate(root, 0, -0.54, 0);
  torso = mat4Scale(torso, 0.54, 0.46, 0.48);
  drawPart(meshes.sphere, torso, FUR_GINGER, 0.028, 0.35, 1.0);

  [-1, 1].forEach(function (side) {
    let sideStripe = mat4Translate(root, side * 0.44, -0.50, 0.05);
    sideStripe = mat4Scale(sideStripe, 0.12, 0.046, 0.18);
    drawPart(meshes.lowSphere, sideStripe, FUR_STRIPE, 0.0, 0.4, 1.0);
  });

  let belly = mat4Translate(root, 0, -0.53, 0.24);
  belly = mat4Scale(belly, 0.38, 0.35, 0.28);
  drawPart(meshes.lowSphere, belly, FUR_CREAM, 0.0, 0.40, 1.0);

  // 5. Crimson Silk Lucky Collar + Jingling 3D Golden Suzu Bell
  let collar = mat4Translate(root, 0, -0.17, 0.02);
  collar = mat4Scale(collar, 0.44, 0.075, 0.42);
  drawPart(meshes.cyl, collar, COLLAR_RED, 0.022, 0.32, 1.0);

  const bellBounce = Math.abs(jumpY) * 0.15;
  let bell = mat4Translate(root, 0, -0.23 + bellBounce, 0.43);
  bell = mat4Scale(bell, 0.108, 0.108, 0.108);
  drawPart(meshes.lowSphere, bell, BELL_GOLD, 0.020, 0.12, 1.0);

  let bellSlit = mat4Translate(root, 0, -0.26 + bellBounce, 0.525);
  bellSlit = mat4Scale(bellSlit, 0.036, 0.022, 0.02);
  drawPart(meshes.lowSphere, bellSlit, [0.18, 0.10, 0.06], 0.0, 0.4, 1.0);

  // 6. Left Front Paw — Classic Maneki-Neko Lucky Cat Beckoning Wave + Pink Toe Beans!
  if (mood === 'think') {
    let lShoulder = mat4Translate(root, -0.38, -0.28, 0.28);
    lShoulder = mat4RotateZ(lShoulder, -0.65);
    drawPart(meshes.lowSphere, mat4Scale(lShoulder, 0.13, 0.18, 0.13), FUR_GINGER, 0.022, 0.35, 1.0);
    let chinPaw = mat4Translate(root, -0.24, -0.12, 0.44);
    drawPart(meshes.lowSphere, mat4Scale(chinPaw, 0.13, 0.13, 0.12), FUR_CREAM, 0.022, 0.35, 1.0);
  } else {
    const waveFreq = mood === 'cheer' || mood === 'celebrate' ? 9.2 : 5.4;
    const beckon = Math.sin(t * waveFreq + inst.seed) * 0.32 * animScale;

    let lUpper = mat4Translate(root, -0.49, -0.24, 0.16);
    lUpper = mat4RotateZ(lUpper, 0.42);
    drawPart(meshes.lowSphere, mat4Scale(lUpper, 0.135, 0.20, 0.135), FUR_GINGER, 0.022, 0.35, 1.0);

    let lPawPivot = mat4Translate(root, -0.56, -0.03 + Math.sin(t * waveFreq) * 0.03 * animScale, 0.27);
    lPawPivot = mat4RotateX(lPawPivot, 0.24 + beckon);
    lPawPivot = mat4RotateY(lPawPivot, 0.16);

    drawPart(meshes.lowSphere, mat4Scale(lPawPivot, 0.145, 0.155, 0.115), FUR_CREAM, 0.022, 0.34, 1.0);

    // Pink central palm pad + 3 tiny toe beans!
    let mainPad = mat4Translate(lPawPivot, 0, -0.022, 0.105);
    drawPart(meshes.lowSphere, mat4Scale(mainPad, 0.062, 0.050, 0.024), PINK_SAKURA, 0.0, 0.42, 1.0);
    [-1, 0, 1].forEach(function (bIdx) {
      let bean = mat4Translate(lPawPivot, bIdx * 0.046, bIdx === 0 ? 0.060 : 0.045, 0.103);
      drawPart(meshes.lowSphere, mat4Scale(bean, 0.024, 0.028, 0.020), PINK_SAKURA, 0.0, 0.42, 1.0);
    });
  }

  // 7. Right Front Paw Holding Steaming Porcelain Teacup
  let rArm = mat4Translate(root, 0.50, -0.39, 0.16);
  rArm = mat4RotateZ(rArm, 0.40 - Math.sin(t * 2.7) * 0.06 * animScale);
  rArm = mat4RotateY(rArm, -0.36);

  let rUpper = mat4Translate(rArm, 0.11, 0, 0);
  rUpper = mat4Scale(rUpper, 0.18, 0.13, 0.13);
  drawPart(meshes.lowSphere, rUpper, FUR_GINGER, 0.022, 0.36, 1.0);

  let rPaw = mat4Translate(rArm, 0.26, 0.02, 0.08);
  rPaw = mat4Scale(rPaw, 0.125, 0.125, 0.125);
  drawPart(meshes.lowSphere, rPaw, FUR_CREAM, 0.022, 0.34, 1.0);

  let cupBase = mat4Translate(rArm, 0.29, 0.16, 0.14);
  let cupMeshMat = mat4Scale(cupBase, 0.15, 0.19, 0.15);
  drawPart(meshes.cup, cupMeshMat, [0.99, 0.98, 0.95], 0.022, 0.16, 1.0);

  let teaSurface = mat4Translate(cupBase, 0, 0.08, 0);
  teaSurface = mat4Scale(teaSurface, 0.13, 0.02, 0.13);
  drawPart(meshes.cyl, teaSurface, [0.76, 0.43, 0.12], 0.0, 0.12, 1.0);

  if (!calm) {
    for (let sp = 0; sp < 3; sp++) {
      const cycle = (t * 0.75 + sp * 0.33) % 1.0;
      const puffY = 0.20 + cycle * 0.45;
      const puffX = Math.sin(t * 3.0 + sp * 2.1) * 0.045;
      const puffR = (1.0 - cycle) * 0.066 + 0.018;
      let puffMat = mat4Translate(cupBase, puffX, puffY, 0);
      puffMat = mat4Scale(puffMat, puffR, puffR, puffR);
      drawPart(meshes.lowSphere, puffMat, [1.0, 1.0, 1.0], 0.0, 0.8, (1.0 - cycle) * 0.64);
    }
  }

  // 8. Big Expressive 3D Cat Head (tracks pointer in 3D!)
  let head = mat4Translate(root, 0, 0.21, 0.04);
  head = mat4RotateY(head, inst.yaw * 0.65);
  head = mat4RotateX(head, inst.pitch * 0.55);
  head = mat4RotateZ(head, headTiltZ);

  let cranium = mat4Scale(head, 0.75, 0.61, 0.64);
  drawPart(meshes.sphere, cranium, FUR_GINGER, 0.030, 0.34, 1.0);

  // 9. Pointed 3D Cat Ears + Sakura-Pink Inner Cones + Ear-Flick Physics!
  [-1, 1].forEach(function (side) {
    const flickRaw = Math.sin(t * 2.3 + (side === -1 ? 0.0 : 2.1) + inst.seed);
    const earFlick = !calm && flickRaw > 0.86 ? ((flickRaw - 0.86) / 0.14) * 0.22 : 0;
    const perk = (inst.earPerk || 0) * 0.18;

    let earMat = mat4Translate(head, side * 0.46, 0.50, -0.02);
    earMat = mat4RotateZ(earMat, side * (-0.42 - earFlick + perk));
    earMat = mat4RotateX(earMat, 0.10);

    let outerEar = mat4Scale(earMat, 0.26, 0.45, 0.19);
    drawPart(meshes.earCone, outerEar, FUR_GINGER, 0.028, 0.36, 1.0);

    let innerEar = mat4Translate(earMat, 0, -0.04, 0.068);
    innerEar = mat4Scale(innerEar, 0.155, 0.31, 0.105);
    drawPart(meshes.earCone, innerEar, PINK_SAKURA, 0.0, 0.48, 1.0);
  });

  // 10. Three Caramel Forehead Tabby Stripes
  let midStripe = mat4Translate(head, 0, 0.42, 0.48);
  midStripe = mat4RotateX(midStripe, -0.56);
  midStripe = mat4Scale(midStripe, 0.046, 0.135, 0.038);
  drawPart(meshes.lowSphere, midStripe, FUR_STRIPE, 0.0, 0.4, 1.0);

  [-1, 1].forEach(function (side) {
    let sStripe = mat4Translate(head, side * 0.15, 0.39, 0.46);
    sStripe = mat4RotateZ(sStripe, side * -0.28);
    sStripe = mat4RotateX(sStripe, -0.54);
    sStripe = mat4Scale(sStripe, 0.040, 0.115, 0.036);
    drawPart(meshes.lowSphere, sStripe, FUR_STRIPE, 0.0, 0.4, 1.0);
  });

  // 11. Six Crisp 3D Cat Whiskers (3 per cheek sticking past silhouette!)
  [-1, 1].forEach(function (side) {
    [-1, 0, 1].forEach(function (wIdx) {
      const wWig = Math.sin(t * 6.5 + wIdx) * 0.035 * animScale;
      let wMat = mat4Translate(head, side * 0.66, -0.08 + wIdx * 0.072, 0.32);
      wMat = mat4RotateY(wMat, side * 0.22);
      wMat = mat4RotateZ(wMat, Math.PI / 2 + side * (wIdx * 0.16 + wWig));
      wMat = mat4Scale(wMat, 0.017, 0.21, 0.017);
      drawPart(meshes.cyl, wMat, FUR_CREAM, 0.011, 0.30, 1.0);
    });
  });

  // 12. Rosy Blush Cheeks + Plump Snow-White Muzzle Peanut Puffs + Berry Cat Nose
  [-1, 1].forEach(function (side) {
    let cheek = mat4Translate(head, side * 0.44, -0.09, 0.48);
    cheek = mat4RotateY(cheek, side * 0.48);
    cheek = mat4Scale(cheek, 0.125, 0.078, 0.045);
    drawPart(meshes.lowSphere, cheek, [1.0, 0.52, 0.54], 0.0, 0.55, 0.90);
  });

  let chinPuff = mat4Translate(head, 0, -0.17, 0.52);
  chinPuff = mat4Scale(chinPuff, 0.13, 0.085, 0.09);
  drawPart(meshes.lowSphere, chinPuff, FUR_CREAM, 0.0, 0.38, 1.0);

  [-1, 1].forEach(function (side) {
    let muzzle = mat4Translate(head, side * 0.115, -0.10, 0.56);
    muzzle = mat4Scale(muzzle, 0.155, 0.118, 0.115);
    drawPart(meshes.lowSphere, muzzle, FUR_CREAM, 0.014, 0.36, 1.0);
  });

  let nose = mat4Translate(head, 0, -0.025, 0.665);
  nose = mat4Scale(nose, 0.068, 0.046, 0.050);
  drawPart(meshes.lowSphere, nose, PINK_NOSE, 0.012, 0.18, 1.0);

  // Expressive Cat Mouth / Meow Tongue
  const talkOpen = inst.talking ? Math.abs(Math.sin(t * 14.0)) * 0.065 : 0;
  if (mood === 'cheer' || mood === 'celebrate' || inst.talking) {
    let mouth = mat4Translate(head, 0, -0.175, 0.595);
    mouth = mat4Scale(mouth, 0.105, 0.065 + talkOpen, 0.055);
    drawPart(meshes.lowSphere, mouth, [0.92, 0.33, 0.43], 0.015, 0.35, 1.0);
  } else if (mood === 'think') {
    let mouth = mat4Translate(head, 0.03, -0.18, 0.60);
    mouth = mat4Scale(mouth, 0.045, 0.045, 0.04);
    drawPart(meshes.lowSphere, mouth, [0.90, 0.34, 0.43], 0.012, 0.35, 1.0);
  } else {
    let mouth = mat4Translate(head, 0, -0.172, 0.60);
    mouth = mat4Scale(mouth, 0.062, 0.034, 0.04);
    drawPart(meshes.lowSphere, mouth, [0.94, 0.42, 0.50], 0.010, 0.35, 1.0);
  }

  // 13. Big Sparkling Emerald-Ringed Anime Cat Eyes + Catchlights!
  const blinkCycle = (t * 0.27 + inst.seed) % 1.0;
  const isBlinking = !calm && blinkCycle > 0.955;
  const happySquint = mood === 'happy' || mood === 'cheer' || mood === 'proud';
  const lookX = Math.max(-0.045, Math.min(0.045, inst.yaw * 0.11));
  const lookY = Math.max(-0.035, Math.min(0.035, -inst.pitch * 0.09));

  [-1, 1].forEach(function (side) {
    if (isBlinking || happySquint) {
      let arcEye = mat4Translate(head, side * 0.27 + lookX, 0.065 + lookY, 0.58);
      arcEye = mat4RotateZ(arcEye, side * -0.10);
      arcEye = mat4Scale(arcEye, 0.118, isBlinking ? 0.020 : 0.038, 0.05);
      drawPart(meshes.lowSphere, arcEye, [0.12, 0.07, 0.05], 0.0, 0.08, 1.0);
    } else {
      let iris = mat4Translate(head, side * 0.27 + lookX, 0.065 + lookY, 0.565);
      iris = mat4Scale(iris, 0.116, 0.132, 0.055);
      drawPart(meshes.lowSphere, iris, [0.11, 0.62, 0.46], 0.015, 0.08, 1.0);

      let pupil = mat4Translate(head, side * 0.27 + lookX * 1.15, 0.065 + lookY * 1.15, 0.588);
      pupil = mat4Scale(pupil, 0.068, 0.106, 0.046);
      drawPart(meshes.lowSphere, pupil, [0.09, 0.06, 0.05], 0.0, 0.04, 1.0);

      let specBig = mat4Translate(head, side * 0.27 + lookX + 0.036, 0.105 + lookY, 0.630);
      specBig = mat4Scale(specBig, 0.032, 0.032, 0.020);
      drawPart(meshes.lowSphere, specBig, [1.0, 1.0, 1.0], 0.0, 0.0, 1.0);

      let specTiny = mat4Translate(head, side * 0.27 + lookX - 0.028, 0.028 + lookY, 0.626);
      specTiny = mat4Scale(specTiny, 0.016, 0.016, 0.015);
      drawPart(meshes.lowSphere, specTiny, [1.0, 1.0, 1.0], 0.0, 0.0, 1.0);
    }
  });

  // 14. Orbiting 3D Golden Lucky Coins / Stars during Cheer / Victory!
  if ((mood === 'cheer' || mood === 'celebrate') && !calm) {
    for (let k = 0; k < 3; k++) {
      const ang = t * 2.9 + (k * Math.PI * 2) / 3;
      const sx = Math.cos(ang) * 0.95;
      const sz = Math.sin(ang) * 0.55;
      const sy = 0.58 + Math.sin(t * 4.2 + k) * 0.14;
      let star = mat4Translate(root, sx, sy, sz);
      star = mat4RotateY(star, t * 4.0);
      star = mat4RotateZ(star, 0.78);
      star = mat4Scale(star, 0.105, 0.105, 0.06);
      drawPart(meshes.lowSphere, star, BELL_GOLD, 0.02, 0.14, 1.0);
    }
  }
}

/* =========================================================================
   2D CANVAS SHADED FALLBACK (IF WEBGL IS DISABLED IN BROWSER FLAGS)
   ========================================================================= */
function renderBaoBo2DFallback(inst, nowMs) {
  const ctx = inst.ctx2d;
  if (!ctx) return;
  const c = inst.canvas;
  const w = 160;
  const h = 160;
  if (c.width !== w) {
    c.width = w;
    c.height = h;
  }
  ctx.clearRect(0, 0, w, h);
  const t = nowMs * 0.001;
  const bob = Math.sin(t * 3.0) * 3;
  const wag = Math.sin(t * 4.2) * 8;

  ctx.save();
  ctx.translate(80, 92 + bob);
  ctx.strokeStyle = '#2B1D14';
  ctx.lineWidth = 3.4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Swishing cat tail
  ctx.beginPath();
  ctx.moveTo(22, 24);
  ctx.bezierCurveTo(50, 22, 56 + wag * 0.5, -6, 46 + wag, -20);
  ctx.lineWidth = 11;
  ctx.strokeStyle = '#2B1D14';
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#FCA140';
  ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = '#2B1D14';

  // Plump body + white belly + crimson collar & gold bell
  ctx.fillStyle = '#FCA140';
  ctx.beginPath();
  ctx.ellipse(0, 24, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFDF7';
  ctx.beginPath();
  ctx.ellipse(0, 26, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cat ears
  [-1, 1].forEach(function (s) {
    ctx.fillStyle = '#FCA140';
    ctx.beginPath();
    ctx.moveTo(s * 14, -44);
    ctx.lineTo(s * 36, -64);
    ctx.lineTo(s * 38, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF94A8';
    ctx.beginPath();
    ctx.moveTo(s * 19, -42);
    ctx.lineTo(s * 32, -55);
    ctx.lineTo(s * 33, -31);
    ctx.closePath();
    ctx.fill();
  });

  // 3D shaded ginger cat head
  const g = ctx.createRadialGradient(-12, -26, 6, 0, -14, 44);
  g.addColorStop(0, '#FFBE73');
  g.addColorStop(0.7, '#FCA140');
  g.addColorStop(1, '#DF7A1C');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -16, 40, 33, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Emerald eyes + catchlights
  [-1, 1].forEach(function (s) {
    ctx.fillStyle = '#1C9E75';
    ctx.beginPath();
    ctx.ellipse(s * 15, -18, 6.2, 7.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E120D';
    ctx.beginPath();
    ctx.ellipse(s * 15, -18, 3.6, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s * 15 + 2, -21, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // White muzzle puffs + pink nose + whiskers
  ctx.fillStyle = '#FFFDF8';
  ctx.beginPath();
  ctx.arc(-6, -6, 7.5, 0, Math.PI * 2);
  ctx.arc(6, -6, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FA6B84';
  ctx.beginPath();
  ctx.ellipse(0, -10, 4.5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Collar + Gold Suzu Bell
  ctx.fillStyle = '#DC2B2B';
  ctx.fillRect(-20, 8, 40, 6);
  ctx.fillStyle = '#FFD034';
  ctx.beginPath();
  ctx.arc(0, 14, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function tickAllInstances(nowMs) {
  const curWall = Date.now();
  activeInstances = activeInstances.filter(function (inst) {
    if (!inst.canvas) return false;
    if (
      curWall - (inst.mountedAt || 0) > 600 &&
      typeof document !== 'undefined' &&
      document.body &&
      typeof document.body.contains === 'function' &&
      !document.body.contains(inst.canvas)
    ) {
      return false;
    }
    if (inst.glCtx) renderBaoBoFrame(inst, nowMs);
    else if (inst.ctx2d) renderBaoBo2DFallback(inst, nowMs);
    return true;
  });

  if (activeInstances.length > 0 && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(tickAllInstances);
  } else {
    rafRunning = false;
  }
}

/* =========================================================================
   PUBLIC API: MOUNT 3D LUCKY TEA CAT MOCHI & LIVE IN-GAME GUIDANCE
   ========================================================================= */
export function mountBaoBo3D(containerEl, opts) {
  if (!containerEl || typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return {
      setMood: function () {},
      poke: function () {},
      setTalking: function () {},
      destroy: function () {}
    };
  }

  const options = opts || {};
  const size = options.size || 136;
  const canvas = document.createElement('canvas');
  canvas.className = 'baobo-3d-canvas';
  if (canvas.style) {
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.style.display = 'block';
    canvas.style.cursor = 'pointer';
  }
  if (typeof canvas.setAttribute === 'function') {
    canvas.setAttribute('aria-label', '3D Lucky Tea Cat Mochi');
  }

  containerEl.innerHTML = '';
  if (typeof containerEl.appendChild === 'function') {
    containerEl.appendChild(canvas);
  }

  const glCtx = initWebGLScene(canvas);
  let ctx2d = null;
  if (!glCtx && typeof canvas.getContext === 'function') {
    try {
      ctx2d = canvas.getContext('2d');
    } catch (e) {
      ctx2d = null;
    }
  }

  const inst = {
    id: options.id || 'mochi_' + Math.random().toString(36).slice(2, 8),
    role: options.role || 'plaza',
    canvas: canvas,
    size: size,
    glCtx: glCtx,
    ctx2d: ctx2d,
    mood: options.mood || 'greet',
    talking: Boolean(options.talking),
    squash: -0.18,
    squashVel: 0,
    earPerk: 0.6,
    yaw: 0,
    pitch: 0,
    seed: Math.random() * 6.28,
    mountedAt: Date.now()
  };

  if (typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('click', function (ev) {
      ev.stopPropagation();
      inst.squash = -0.26;
      inst.earPerk = 1.0;
      if (typeof options.onTap === 'function') {
        options.onTap(inst);
      }
    });
  }

  activeInstances.push(inst);
  if (!rafRunning && typeof requestAnimationFrame === 'function') {
    rafRunning = true;
    requestAnimationFrame(tickAllInstances);
  }

  return {
    setMood: function (newMood) {
      inst.mood = newMood || 'greet';
      inst.squash = newMood === 'cheer' ? 0.22 : -0.16;
      inst.earPerk = 0.85;
    },
    setTalking: function (flag) {
      inst.talking = Boolean(flag);
    },
    poke: function () {
      inst.squash = -0.28;
      inst.earPerk = 1.0;
    },
    destroy: function () {
      activeInstances = activeInstances.filter(function (x) {
        return x !== inst;
      });
    }
  };
}

export function setCurrentStageGameId(gameId) {
  currentStageGameId = gameId || null;
}

export function getCoachIntroForGame(gameId, lang) {
  const entry = GAME_COACH_LINES[gameId];
  if (!entry) {
    return lang === 'en'
      ? 'Meow~ Take your time and enjoy every brain puzzle — tap 💡 anytime for help!'
      : '喵～慢慢嘆茶動下腦筋，唔限時間㗎！隨時可以撳提示幫手～';
  }
  return entry[lang === 'en' ? 'en' : 'zh'];
}

export function notifyStageBaoBo(eventType, lang, comboCount, customText) {
  const isEn = lang === 'en';
  let mood = 'greet';
  let line = customText || '';

  if (eventType === 'correct') {
    mood = comboCount >= 2 ? 'cheer' : 'happy';
    if (!line) {
      const pool = isEn ? COACH_CHEERS.en : COACH_CHEERS.zh;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      line = comboCount >= 2 ? (isEn ? '🔥 Combo ×' + comboCount + '! ' : '🔥 連中 ×' + comboCount + '！') + pick : pick;
    }
  } else if (eventType === 'gentle') {
    mood = 'think';
    if (!line) {
      const pool = isEn ? COACH_ENCOURAGE.en : COACH_ENCOURAGE.zh;
      line = pool[Math.floor(Math.random() * pool.length)];
    }
  } else if (eventType === 'intro' && currentStageGameId) {
    mood = 'wave';
    if (!line) line = getCoachIntroForGame(currentStageGameId, isEn ? 'en' : 'zh');
  }

  // Update all mounted stage/plaza 3D Mochi Cat instances
  for (let i = 0; i < activeInstances.length; i++) {
    const inst = activeInstances[i];
    if (inst.role === 'stage' || inst.role === 'plaza') {
      inst.mood = mood;
      inst.squash = eventType === 'correct' ? 0.22 : -0.15;
      inst.earPerk = 1.0;
    }
  }

  // Update the live in-game speech bubble text if mounted
  if (typeof document !== 'undefined' && line) {
    const bubbleEl = document.getElementById('stageBaoBoSpeechText');
    const cardEl = document.getElementById('stageBaoBoCompanion');
    if (bubbleEl) {
      bubbleEl.textContent = line;
    }
    if (cardEl && cardEl.classList) {
      if (cardEl.dataset) cardEl.dataset.mood = mood;
      cardEl.classList.remove('companion-cheer', 'companion-gentle', 'bo-react-pop');
      void cardEl.offsetWidth;
      if (eventType === 'correct') cardEl.classList.add('companion-cheer', 'bo-react-pop');
      else if (eventType === 'gentle') cardEl.classList.add('companion-gentle', 'bo-react-pop');
    }
  }
}
