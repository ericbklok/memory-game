/* =========================================================================
   BAOBO 3D (茶博士阿波 3D) — Zero-Dependency WebGL Cel-Shaded Toy Character
   Nintendo Amiibo / Big Brain Academy Dr. Lobe-inspired 3D Guide Engine
   ========================================================================= */

export const GAME_COACH_LINES = {
  news: {
    zh: '先慢慢讀幾段港溫暖心小新聞，再答問題考記性！隨時撳「🔊 朗讀」聽我讀畀你聽～',
    en: 'Read the short HK & Vancouver stories at your own pace, then answer the recall questions! Tap 🔊 anytime.'
  },
  memory: {
    zh: '翻開兩張麻雀或點心牌配對！記住佢哋嘅位置，唔限時間慢慢搵～',
    en: 'Flip two tiles at a time to find matching pairs! Take your time remembering each spot.'
  },
  math: {
    zh: '茶樓埋單同找續心算！慢慢加埋點心價錢，計啱數就蓋印仔！',
    en: 'Tea-house bill & change math! Add up the dim sum or tap bills to make exact change.'
  },
  history: {
    zh: '重溫香港同溫哥華嘅經典歲月！揀啱答案，再將大事按年份由早到晚排好～',
    en: 'Explore classic HK & Vancouver milestones, then tap events from earliest to latest!'
  },
  words: {
    zh: '廣東話抵死俗語同四字成語！揀最貼切嘅下句，再玩埋詞語分類～',
    en: 'Complete classic Cantonese proverbs & idioms, then group related words together!'
  },
  eagle: {
    zh: '考眼力時間！喺一眾相似字或圖案入面，搵出唯一唔同嗰一個！',
    en: 'Sharp eyes ready! Spot the single odd character or icon hiding in the grid.'
  },
  sudoku: {
    zh: '先揀空格再撳下面數字（或點心圖案），令每行、每列、每宮都唔重複！卡關可撳「💡 提示」～',
    en: 'Tap an empty cell, then pick a number or dim sum icon so every row, column & box has no repeats!'
  },
  tenpai: {
    zh: '望實呢副十張牌（三組順子／刻子加一對眼），揀出摸入即刻食糊嗰張牌！',
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
    zh: '先揀下面一款木塊，再撳 6×6 棋盤擺放；填滿整橫行或整直列就會爽快消除！',
    en: 'Select a wood piece below, then tap the 6×6 board to place it — fill any row or column to clear!'
  },
  stroop: {
    zh: '睇清上面口令問「墨水顏色」定「文字意思」，千祈唔好俾顏色呃到呀！',
    en: 'Check the rule banner carefully: tap either the INK COLOR or the WORD MEANING!'
  },
  melody: {
    zh: '豎起耳仔聽住瓷杯響起嘅次序，然後跟住相同次序撳返對應茶杯！可以隨時重聽～',
    en: 'Listen to the porcelain teacup chimes, then tap the cups in the exact same order!'
  },
  vocab: {
    zh: '三關雅言之旅：先玩語境選成語、再學實用英文詞、最後配對中英近義詞！',
    en: '3-stage word journey: context idioms, practical everyday English, and bilingual synonym match!'
  }
};

const COACH_CHEERS = {
  zh: [
    '好嘢！眼明手快，答得好準呀！✨',
    '犀利呀！腦筋轉得超快！🌟',
    '正呀！就係呢個節奏，繼續保持！🫖',
    '勁呀！茶博士阿波畀個大拇指你！👏',
    '太精靈喇！越玩越醒神！🎉'
  ],
  en: [
    'Spot on! Sharp eyes and nimble thinking! ✨',
    'Brilliant move! You nailed that one! 🌟',
    'Wonderful! Keep that smooth rhythm going! 🫖',
    'Fantastic! Master Bo gives you two thumbs up! 👏',
    'Super sharp! Your brain is firing on all cylinders! 🎉'
  ]
};

const COACH_ENCOURAGE = {
  zh: [
    '唔緊要㗎！深呼吸睇真啲，再試多一次～ 😊',
    '差少少咋！慢慢諗，完全唔計時㗎！🍵',
    '試下換個角度望下？需要時可以撳「💡 貼士」幫手！💡',
    '氣定神閒最醒神，再揀過就得㗎喇！✨'
  ],
  en: [
    'No rush at all! Take another look and try again 😊',
    'Very close! Zero timer pressure — take your time 🍵',
    'Try another angle, or tap 💡 Hint if you want a nudge!',
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
  '  float toon = smoothstep(0.32, 0.42, ndl) * 0.28 + smoothstep(0.66, 0.78, ndl) * 0.17 + 0.66;',
  '  vec3 warmSky = mix(vec3(0.95, 0.85, 0.78), vec3(1.04, 1.01, 0.96), clamp(N.y * 0.5 + 0.5, 0.0, 1.0));',
  '  float spec = pow(max(dot(N, H), 0.0), mix(44.0, 10.0, uRough)) * (1.0 - uRough * 0.72);',
  '  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.24;',
  '  vec3 col = uColor * toon * warmSky + vec3(1.0, 0.98, 0.92) * spec * 0.42 + vec3(1.0, 0.92, 0.75) * rim;',
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
    torus: uploadMesh(gl, createTorusMesh(0.20, 0.028, 24, 12)),
    cyl: uploadMesh(gl, createCylinderMesh(1.0, 1.0, 1.0, 28)),
    cup: uploadMesh(gl, createCylinderMesh(1.0, 0.72, 1.0, 22))
  };

  return { gl: gl, prog: prog, locs: locs, meshes: meshes };
}

/* =========================================================================
   RENDER ONE FRAME OF 3D BAOBO
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

  // Smooth spring physics for poke/jump/mood transitions
  inst.squashVel += (0 - inst.squash) * 0.22;
  inst.squashVel *= 0.74;
  inst.squash += inst.squashVel;

  const targetYaw = Math.max(-0.42, Math.min(0.42, globalPtrX * 0.36));
  const targetPitch = Math.max(-0.24, Math.min(0.24, globalPtrY * 0.22));
  inst.yaw += (targetYaw - inst.yaw) * 0.09;
  inst.pitch += (targetPitch - inst.pitch) * 0.09;

  const mood = inst.mood || 'greet';
  let jumpY = Math.sin(t * 2.7 + inst.seed) * 0.045 * animScale;
  let spinY = Math.sin(t * 0.9 + inst.seed) * 0.08 * animScale;
  let headTiltZ = 0;

  if (mood === 'cheer' || mood === 'celebrate') {
    jumpY = Math.abs(Math.sin(t * 6.2)) * 0.22 * animScale;
    spinY = Math.sin(t * 3.1) * 0.34 * animScale;
  } else if (mood === 'happy' || mood === 'proud') {
    jumpY = Math.abs(Math.sin(t * 4.4)) * 0.11 * animScale;
    headTiltZ = Math.sin(t * 3.2) * 0.07 * animScale;
  } else if (mood === 'think') {
    headTiltZ = 0.19;
  }

  const proj = mat4Perspective(0.62, canvas.width / canvas.height, 0.5, 20.0);
  gl.uniformMatrix4fv(locs.uProj, false, proj);

  function drawPart(mesh, modelMat, rgb, outlineWidth, rough, alpha) {
    const rVal = typeof rough === 'number' ? rough : 0.35;
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

  // Camera base transform
  let world = mat4Translate(mat4Identity(), 0, -0.06, -4.15);
  world = mat4RotateX(world, 0.07);

  // 1. Jade & Gold Turntable Pedestal
  let pedGold = mat4Translate(world, 0, -1.07, 0);
  pedGold = mat4Scale(pedGold, 0.96, 0.11, 0.96);
  drawPart(meshes.cyl, pedGold, [0.92, 0.67, 0.20], 0.026, 0.25, 1.0);

  let pedTop = mat4Translate(world, 0, -1.0, 0);
  pedTop = mat4Scale(pedTop, 0.86, 0.07, 0.86);
  drawPart(meshes.cyl, pedTop, [0.15, 0.54, 0.42], 0.02, 0.35, 1.0);

  // Root Character Transform (squash & stretch + jump + subtle spin)
  const sqY = 1.0 + inst.squash;
  const sqXZ = 1.0 - inst.squash * 0.52;
  let root = mat4Translate(world, 0, jumpY, 0);
  root = mat4RotateY(root, spinY + inst.yaw * 0.45);
  root = mat4Scale(root, sqXZ, sqY, sqXZ);

  // 2. Cute Espresso Shoes
  const footSwing = mood === 'cheer' ? Math.sin(t * 8) * 0.18 * animScale : 0;
  [-1, 1].forEach(function (side) {
    let shoe = mat4Translate(root, side * 0.27, -0.90 + (side * footSwing * 0.25), 0.10);
    shoe = mat4Scale(shoe, 0.19, 0.12, 0.26);
    drawPart(meshes.lowSphere, shoe, [0.26, 0.16, 0.12], 0.024, 0.5, 1.0);
  });

  // 3. Plump Jade Tea-Master Vest Torso
  let torso = mat4Translate(root, 0, -0.52, 0);
  torso = mat4Scale(torso, 0.56, 0.46, 0.49);
  drawPart(meshes.sphere, torso, [0.13, 0.50, 0.39], 0.028, 0.38, 1.0);

  // White inner silk collar & golden frog buttons
  let shirt = mat4Translate(root, 0, -0.37, 0.36);
  shirt = mat4Scale(shirt, 0.23, 0.22, 0.18);
  drawPart(meshes.lowSphere, shirt, [1.0, 0.98, 0.94], 0.0, 0.4, 1.0);

  [-0.46, -0.63].forEach(function (by) {
    let btn = mat4Translate(root, 0, by, 0.48);
    btn = mat4Scale(btn, 0.055, 0.055, 0.045);
    drawPart(meshes.lowSphere, btn, [0.96, 0.72, 0.20], 0.015, 0.2, 1.0);
  });

  // 4. Left Arm (Waves hello / pumps air / touches chin)
  let lArm = mat4Translate(root, -0.54, -0.36, 0.06);
  if (mood === 'cheer' || mood === 'celebrate') {
    lArm = mat4RotateZ(lArm, -2.25 + Math.sin(t * 9.0) * 0.25 * animScale);
  } else if (mood === 'greet' || mood === 'wave' || inst.talking) {
    lArm = mat4RotateZ(lArm, -1.95 + Math.sin(t * 6.5) * 0.34 * animScale);
  } else if (mood === 'think') {
    lArm = mat4Translate(root, -0.38, -0.22, 0.36);
    lArm = mat4RotateZ(lArm, -1.25);
    lArm = mat4RotateX(lArm, -0.55);
  } else {
    lArm = mat4RotateZ(lArm, -0.62 + Math.sin(t * 2.5) * 0.08 * animScale);
  }
  let lSleeve = mat4Translate(lArm, -0.14, 0, 0);
  lSleeve = mat4Scale(lSleeve, 0.20, 0.13, 0.13);
  drawPart(meshes.lowSphere, lSleeve, [0.15, 0.53, 0.41], 0.024, 0.38, 1.0);

  let lHand = mat4Translate(lArm, -0.30, 0, 0);
  lHand = mat4Scale(lHand, 0.125, 0.125, 0.125);
  drawPart(meshes.lowSphere, lHand, [1.0, 0.89, 0.77], 0.022, 0.32, 1.0);

  // 5. Right Arm Holding Steaming Porcelain Teacup
  let rArm = mat4Translate(root, 0.54, -0.40, 0.16);
  rArm = mat4RotateZ(rArm, 0.42 - Math.sin(t * 2.7) * 0.06 * animScale);
  rArm = mat4RotateY(rArm, -0.38);

  let rSleeve = mat4Translate(rArm, 0.13, 0, 0);
  rSleeve = mat4Scale(rSleeve, 0.19, 0.13, 0.13);
  drawPart(meshes.lowSphere, rSleeve, [0.15, 0.53, 0.41], 0.024, 0.38, 1.0);

  let rHand = mat4Translate(rArm, 0.28, 0.02, 0.08);
  rHand = mat4Scale(rHand, 0.12, 0.12, 0.12);
  drawPart(meshes.lowSphere, rHand, [1.0, 0.89, 0.77], 0.022, 0.32, 1.0);

  // Porcelain Teacup + Amber Tea + Rising 3D Steam Puffs
  let cupBase = mat4Translate(rArm, 0.30, 0.16, 0.14);
  let cupMeshMat = mat4Scale(cupBase, 0.15, 0.19, 0.15);
  drawPart(meshes.cup, cupMeshMat, [0.99, 0.98, 0.95], 0.022, 0.16, 1.0);

  let teaSurface = mat4Translate(cupBase, 0, 0.08, 0);
  teaSurface = mat4Scale(teaSurface, 0.13, 0.02, 0.13);
  drawPart(meshes.cyl, teaSurface, [0.76, 0.43, 0.12], 0.0, 0.12, 1.0);

  if (!calm) {
    for (let sp = 0; sp < 3; sp++) {
      const cycle = ((t * 0.75 + sp * 0.33) % 1.0);
      const puffY = 0.20 + cycle * 0.46;
      const puffX = Math.sin(t * 3.0 + sp * 2.1) * 0.045;
      const puffR = (1.0 - cycle) * 0.068 + 0.018;
      let puffMat = mat4Translate(cupBase, puffX, puffY, 0);
      puffMat = mat4Scale(puffMat, puffR, puffR, puffR);
      drawPart(meshes.lowSphere, puffMat, [1.0, 1.0, 1.0], 0.0, 0.8, (1.0 - cycle) * 0.65);
    }
  }

  // 6. Big Squishy Bao Head (tracks pointer in 3D!)
  let head = mat4Translate(root, 0, 0.22, 0.03);
  head = mat4RotateY(head, inst.yaw * 0.65);
  head = mat4RotateX(head, inst.pitch * 0.55);
  head = mat4RotateZ(head, headTiltZ);

  let cranium = mat4Scale(head, 0.72, 0.65, 0.66);
  drawPart(meshes.sphere, cranium, [1.0, 0.90, 0.79], 0.030, 0.34, 1.0);

  // Cute Round Ears
  [-1, 1].forEach(function (side) {
    let ear = mat4Translate(head, side * 0.69, -0.02, -0.02);
    ear = mat4Scale(ear, 0.13, 0.15, 0.11);
    drawPart(meshes.lowSphere, ear, [0.99, 0.85, 0.72], 0.024, 0.38, 1.0);
  });

  // 7. Signature Crimson Dim Sum Master Beret Cap + Gold Band + Bouncy Pom-Pom
  let hatGroup = mat4Translate(head, 0, 0.44, -0.03);
  hatGroup = mat4RotateX(hatGroup, -0.10);

  let hatBand = mat4Translate(hatGroup, 0, -0.04, 0);
  hatBand = mat4Scale(hatBand, 0.58, 0.10, 0.56);
  drawPart(meshes.cyl, hatBand, [0.95, 0.70, 0.20], 0.024, 0.28, 1.0);

  let hatDome = mat4Translate(hatGroup, 0, 0.11, 0);
  hatDome = mat4Scale(hatDome, 0.62, 0.28, 0.59);
  drawPart(meshes.sphere, hatDome, [0.84, 0.21, 0.18], 0.028, 0.32, 1.0);

  const pomLag = Math.sin(t * 5.4 + inst.seed) * 0.035 * animScale;
  let pom = mat4Translate(hatGroup, pomLag, 0.39 + Math.abs(jumpY) * 0.18, 0);
  pom = mat4Scale(pom, 0.13, 0.13, 0.13);
  drawPart(meshes.lowSphere, pom, [0.99, 0.78, 0.24], 0.024, 0.25, 1.0);

  // 8. Rosy 3D Blush Cheeks
  [-1, 1].forEach(function (side) {
    let cheek = mat4Translate(head, side * 0.42, -0.11, 0.53);
    cheek = mat4RotateY(cheek, side * 0.48);
    cheek = mat4Scale(cheek, 0.13, 0.082, 0.05);
    drawPart(meshes.lowSphere, cheek, [1.0, 0.53, 0.50], 0.0, 0.55, 0.92);
  });

  // 9. Gold-Rim Round Spectacles
  [-1, 1].forEach(function (side) {
    let rim = mat4Translate(head, side * 0.25, 0.04, 0.63);
    rim = mat4RotateY(rim, side * 0.15);
    drawPart(meshes.torus, rim, [0.80, 0.53, 0.12], 0.012, 0.18, 1.0);
  });
  let bridge = mat4Translate(head, 0, 0.05, 0.66);
  bridge = mat4RotateZ(bridge, Math.PI / 2);
  bridge = mat4Scale(bridge, 0.022, 0.11, 0.022);
  drawPart(meshes.cyl, bridge, [0.80, 0.53, 0.12], 0.01, 0.18, 1.0);

  // 10. Glossy 3D Eyes + Catchlights (blink + happy crescent squash)
  const blinkCycle = (t * 0.26 + inst.seed) % 1.0;
  const isBlinking = !calm && blinkCycle > 0.955;
  const happySquint = mood === 'happy' || mood === 'cheer' || mood === 'proud';
  const eyeScaleY = isBlinking ? 0.018 : happySquint ? 0.036 : 0.095;
  const eyeScaleX = happySquint ? 0.105 : 0.082;
  const lookX = Math.max(-0.045, Math.min(0.045, inst.yaw * 0.11));
  const lookY = Math.max(-0.035, Math.min(0.035, -inst.pitch * 0.09));

  [-1, 1].forEach(function (side) {
    let eye = mat4Translate(head, side * 0.25 + lookX, 0.04 + lookY, 0.62);
    eye = mat4Scale(eye, eyeScaleX, eyeScaleY, 0.05);
    drawPart(meshes.lowSphere, eye, [0.13, 0.08, 0.06], 0.0, 0.08, 1.0);

    if (!isBlinking && !happySquint) {
      let specDot = mat4Translate(head, side * 0.25 + lookX + 0.026, 0.068 + lookY, 0.665);
      specDot = mat4Scale(specDot, 0.026, 0.026, 0.02);
      drawPart(meshes.lowSphere, specDot, [1.0, 1.0, 1.0], 0.0, 0.0, 1.0);
    }
  });

  // 11. Fluffy Snow-White Eyebrows
  [-1, 1].forEach(function (side) {
    const browLift = mood === 'cheer' ? 0.04 : mood === 'think' && side === 1 ? 0.045 : 0;
    const browTilt = mood === 'think' ? side * 0.22 : side * -0.12;
    let brow = mat4Translate(head, side * 0.26, 0.27 + browLift, 0.60);
    brow = mat4RotateZ(brow, browTilt);
    brow = mat4Scale(brow, 0.13, 0.042, 0.048);
    drawPart(meshes.lowSphere, brow, [1.0, 0.99, 0.97], 0.016, 0.45, 1.0);
  });

  // 12. Cute Button Nose & Expressive 3D Mouth
  let nose = mat4Translate(head, 0, -0.03, 0.67);
  nose = mat4Scale(nose, 0.052, 0.042, 0.048);
  drawPart(meshes.lowSphere, nose, [0.98, 0.72, 0.58], 0.012, 0.35, 1.0);

  const talkOpen = inst.talking ? Math.abs(Math.sin(t * 14.0)) * 0.065 : 0;
  let mouth = mat4Translate(head, 0, -0.17, 0.63);
  if (mood === 'cheer' || mood === 'celebrate' || inst.talking) {
    mouth = mat4Scale(mouth, 0.125, 0.065 + talkOpen, 0.05);
    drawPart(meshes.lowSphere, mouth, [0.80, 0.20, 0.18], 0.015, 0.35, 1.0);
  } else if (mood === 'think') {
    mouth = mat4Translate(head, 0.04, -0.18, 0.63);
    mouth = mat4Scale(mouth, 0.055, 0.055, 0.045);
    drawPart(meshes.lowSphere, mouth, [0.78, 0.22, 0.20], 0.012, 0.35, 1.0);
  } else {
    mouth = mat4Scale(mouth, 0.12, 0.036, 0.04);
    drawPart(meshes.lowSphere, mouth, [0.76, 0.22, 0.19], 0.012, 0.35, 1.0);
  }

  // 13. Orbiting 3D Golden Star Gems during Cheer / Victory!
  if ((mood === 'cheer' || mood === 'celebrate') && !calm) {
    for (let k = 0; k < 3; k++) {
      const ang = t * 2.8 + (k * Math.PI * 2) / 3;
      const sx = Math.cos(ang) * 0.95;
      const sz = Math.sin(ang) * 0.55;
      const sy = 0.55 + Math.sin(t * 4.2 + k) * 0.14;
      let star = mat4Translate(root, sx, sy, sz);
      star = mat4RotateY(star, t * 4.0);
      star = mat4RotateZ(star, 0.78);
      star = mat4Scale(star, 0.10, 0.10, 0.06);
      drawPart(meshes.lowSphere, star, [1.0, 0.80, 0.18], 0.02, 0.15, 1.0);
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
  const bob = Math.sin(t * 3) * 3;

  ctx.save();
  ctx.translate(80, 88 + bob);
  // 3D shaded head sphere
  const g = ctx.createRadialGradient(-14, -18, 6, 0, 0, 44);
  g.addColorStop(0, '#FFF5E8');
  g.addColorStop(0.7, '#FFE0BE');
  g.addColorStop(1, '#E2B486');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2B1D14';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -6, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Red cap
  ctx.fillStyle = '#D6342A';
  ctx.beginPath();
  ctx.arc(0, -28, 34, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pom-pom
  ctx.fillStyle = '#FFCA3A';
  ctx.beginPath();
  ctx.arc(0, -64, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes & smile
  ctx.fillStyle = '#241811';
  ctx.beginPath();
  ctx.arc(-14, -6, 4.5, 0, Math.PI * 2);
  ctx.arc(14, -6, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 8, 9, 0.1 * Math.PI, 0.9 * Math.PI);
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
   PUBLIC API: MOUNT 3D BAOBO & LIVE IN-GAME GUIDANCE
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
    canvas.setAttribute('aria-label', '3D Tea Master Bo');
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
    id: options.id || 'bo_' + Math.random().toString(36).slice(2, 8),
    role: options.role || 'plaza',
    canvas: canvas,
    size: size,
    glCtx: glCtx,
    ctx2d: ctx2d,
    mood: options.mood || 'greet',
    talking: Boolean(options.talking),
    squash: -0.18,
    squashVel: 0,
    yaw: 0,
    pitch: 0,
    seed: Math.random() * 6.28,
    mountedAt: Date.now()
  };

  if (typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('click', function (ev) {
      ev.stopPropagation();
      inst.squash = -0.26;
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
    },
    setTalking: function (flag) {
      inst.talking = Boolean(flag);
    },
    poke: function () {
      inst.squash = -0.28;
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
      ? 'Take your time and enjoy every brain puzzle — tap 💡 anytime for help!'
      : '慢慢嘆茶動下腦筋，唔限時間㗎！隨時可以撳提示幫手～';
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

  // Update all mounted stage/plaza 3D BaoBo instances
  for (let i = 0; i < activeInstances.length; i++) {
    const inst = activeInstances[i];
    if (inst.role === 'stage' || inst.role === 'plaza') {
      inst.mood = mood;
      inst.squash = eventType === 'correct' ? 0.22 : -0.15;
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
