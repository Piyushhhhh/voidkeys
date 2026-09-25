/* ═══════════════════════════════════════════════════════════════
   VOIDKEYS — landing page animations
   ═══════════════════════════════════════════════════════════════ */

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const TAU = Math.PI * 2;
let mx = 0.5, my = 0.5;
window.addEventListener('mousemove', e => {
  mx = e.clientX / innerWidth;
  my = e.clientY / innerHeight;
});

/* ── utilities ── */
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/* ── hand landmarks (normalized 0-1, origin top-left) ── */
const CONNS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17]
];
const TIPS = [4,8,12,16,20];

function makeHand(cx, cy, w, h, mirror) {
  const raw = [
    [.50,1],[.32,.86],[.18,.70],[.10,.54],[.06,.40],
    [.26,.42],[.24,.26],[.23,.14],[.22,.03],
    [.42,.38],[.41,.20],[.40,.08],[.39,.0],
    [.58,.42],[.59,.24],[.59,.12],[.59,.03],
    [.72,.50],[.74,.36],[.75,.26],[.76,.16],
  ];
  return raw.map(([x, y]) => {
    const fx = mirror ? 1 - x : x;
    return [cx + (fx - .5) * w, cy + (y - .5) * h];
  });
}

function drawHand(ctx, pts, opts = {}) {
  const { alpha = 1, glow = false, color = '#e8e4df' } = opts;
  ctx.save();
  ctx.lineWidth = .8;

  if (glow) {
    ctx.strokeStyle = `rgba(138,154,108,${.06 * alpha})`;
    ctx.lineWidth = 3;
    CONNS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    });
  }

  ctx.strokeStyle = `rgba(232,228,223,${.12 * alpha})`;
  ctx.lineWidth = .8;
  CONNS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(pts[a][0], pts[a][1]);
    ctx.lineTo(pts[b][0], pts[b][1]);
    ctx.stroke();
  });

  // chromatic aberration on connections
  [['rgba(255,80,60,.035)', -1], ['rgba(60,120,255,.035)', 1]].forEach(([c, dx]) => {
    ctx.strokeStyle = c;
    CONNS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a][0] + dx, pts[a][1]);
      ctx.lineTo(pts[b][0] + dx, pts[b][1]);
      ctx.stroke();
    });
  });

  pts.forEach(([x, y], i) => {
    const tip = TIPS.includes(i);
    const r = tip ? 3 : 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    if (tip) {
      ctx.fillStyle = `rgba(138,154,108,${.6 * alpha})`;
      ctx.shadowColor = `rgba(138,154,108,${.4 * alpha})`;
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = `rgba(232,228,223,${.3 * alpha})`;
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.restore();
}

function addIdleDrift(pts, t) {
  return pts.map(([x, y], i) => [
    x + Math.sin(t * 1.3 + i * .7) * 1.2,
    y + Math.cos(t * 1.1 + i * .5) * 1.0,
  ]);
}

/* ── canvas helpers ── */
function sizeCanvas(id) {
  const c = document.getElementById(id);
  const r = c.parentElement.getBoundingClientRect();
  c.width = r.width * DPR;
  c.height = r.height * DPR;
  c.style.width = r.width + 'px';
  c.style.height = r.height + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(DPR, DPR);
  return { c, ctx, w: r.width, h: r.height };
}

/* ── draw a small oscilloscope ── */
function drawScope(ctx, x, y, w, h, t, accent) {
  ctx.save();
  ctx.strokeStyle = `rgba(138,154,108,${accent || .25})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  for (let i = 0; i <= w; i++) {
    const v = Math.sin((i / w) * TAU * 2.5 + t * 3) * .35
            + Math.sin((i / w) * TAU * 5 + t * 7) * .15;
    const py = y + h / 2 + v * h * .4;
    i === 0 ? ctx.moveTo(x + i, py) : ctx.lineTo(x + i, py);
  }
  ctx.strokeStyle = `rgba(138,154,108,${(accent || .25) + .1})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // glow pass
  ctx.strokeStyle = `rgba(138,154,108,.06)`;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawGrid(ctx, w, h, spacing, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha || .02})`;
  ctx.lineWidth = .5;
  for (let x = 0; x < w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

function drawCoords(ctx, pts, indices, alpha) {
  ctx.save();
  ctx.font = `${9}px "SF Mono",Menlo,Consolas,monospace`;
  ctx.fillStyle = `rgba(232,228,223,${.15 * (alpha || 1)})`;
  indices.forEach(i => {
    const [x, y] = pts[i];
    ctx.fillText(`${(x / innerWidth).toFixed(2)},${(y / innerHeight).toFixed(2)}`, x + 8, y - 4);
  });
  ctx.restore();
}

/* ═══════════════════════════════════════════
   SECTION ANIMATORS
   ═══════════════════════════════════════════ */

/* ── HERO ── */
let heroCtx, heroW, heroH;
const heroRightBase = () => makeHand(heroW * .62, heroH * .46, heroW * .22, heroH * .48, false);
const heroLeftBase = () => makeHand(heroW * .35, heroH * .50, heroW * .20, heroH * .44, true);

function heroInit() {
  const s = sizeCanvas('c-hero');
  heroCtx = s.ctx; heroW = s.w; heroH = s.h;
}

function heroDraw(t) {
  if (!heroCtx) return;
  const ctx = heroCtx;
  ctx.clearRect(0, 0, heroW, heroH);

  // vignette
  const vg = ctx.createRadialGradient(heroW/2,heroH/2,heroW*.15,heroW/2,heroH/2,heroW*.7);
  vg.addColorStop(0,'rgba(18,18,16,.0)');
  vg.addColorStop(1,'rgba(0,0,0,.4)');
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,heroW,heroH);

  drawGrid(ctx, heroW, heroH, 60, .018);

  const px = (mx - .5) * 18;
  const py = (my - .5) * 12;
  ctx.save();
  ctx.translate(px, py);

  const rPts = addIdleDrift(heroRightBase(), t);
  const lPts = addIdleDrift(heroLeftBase(), t);
  drawHand(ctx, rPts, { glow: true });
  drawHand(ctx, lPts, { glow: true });
  drawCoords(ctx, rPts, [4, 8, 0], 1);
  drawCoords(ctx, lPts, [4, 8], 1);

  // staff lines near left hand
  const sy = heroH * .35;
  const sx = heroW * .22;
  ctx.save();
  ctx.strokeStyle = 'rgba(232,228,223,.06)';
  ctx.lineWidth = .5;
  for (let i = 0; i < 5; i++) {
    const ly = sy + i * 6;
    ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sx + 80, ly); ctx.stroke();
  }
  // note dot on staff
  ctx.fillStyle = 'rgba(232,228,223,.2)';
  ctx.beginPath(); ctx.arc(sx + 30, sy + 12, 3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 55, sy + 6, 3, 0, TAU); ctx.fill();
  ctx.restore();

  ctx.restore();

  // oscilloscope bottom-right
  drawScope(ctx, heroW - 180, heroH - 90, 140, 50, t, .2);
}

/* ── HAND (section 2) ── */
let handCtx, handW, handH;
function handInit() {
  const s = sizeCanvas('c-hand');
  handCtx = s.ctx; handW = s.w; handH = s.h;
}
function handDraw(t, progress) {
  if (!handCtx) return;
  const ctx = handCtx;
  ctx.clearRect(0, 0, handW, handH);

  const enterY = lerp(handH * .3, 0, Math.min(progress * 2, 1));
  const alpha = Math.min(progress * 2, 1);

  ctx.save();
  ctx.translate(0, enterY);
  ctx.globalAlpha = alpha;

  const pts = addIdleDrift(
    makeHand(handW * .5, handH * .55, handW * .25, handH * .5, false), t
  );

  // pinch: move thumb tip toward index tip
  const pinch = .5 + Math.sin(t * .8) * .3;
  pts[4][0] = lerp(pts[4][0], pts[8][0], pinch);
  pts[4][1] = lerp(pts[4][1], pts[8][1], pinch);
  pts[3][0] = lerp(pts[3][0], (pts[8][0] + pts[2][0]) / 2, pinch * .5);
  pts[3][1] = lerp(pts[3][1], (pts[8][1] + pts[2][1]) / 2, pinch * .5);

  drawHand(ctx, pts, { glow: true });
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── SPLIT HANDS (section 3) ── */
let leftCtx, leftW, leftH, rightCtx, rightW, rightH;
function splitInit() {
  { const s = sizeCanvas('c-left'); leftCtx = s.ctx; leftW = s.w; leftH = s.h; }
  { const s = sizeCanvas('c-right'); rightCtx = s.ctx; rightW = s.w; rightH = s.h; }
}
function splitDraw(t) {
  if (!leftCtx || !rightCtx) return;
  leftCtx.clearRect(0, 0, leftW, leftH);
  rightCtx.clearRect(0, 0, rightW, rightH);

  const lPts = addIdleDrift(makeHand(leftW * .5, leftH * .45, leftW * .4, leftH * .5, true), t);
  drawHand(leftCtx, lPts, { alpha: .7 });

  const rPts = addIdleDrift(makeHand(rightW * .5, rightH * .45, rightW * .4, rightH * .5, false), t);
  drawHand(rightCtx, rPts, { alpha: .7, glow: true });
}

/* ── TWIST (section 4) ── */
let twistCtx, twistW, twistH;
function twistInit() {
  const s = sizeCanvas('c-twist');
  twistCtx = s.ctx; twistW = s.w; twistH = s.h;
}
function twistDraw(t, progress) {
  if (!twistCtx) return;
  const ctx = twistCtx;
  ctx.clearRect(0, 0, twistW, twistH);

  const cx = twistW * .5;
  const cy = twistH * .5;
  const r = Math.min(twistW, twistH) * .28;
  const angle = lerp(-75, 75, (.5 + Math.sin(t * .6) * .5)) * Math.PI / 180;

  // arc track
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * .92, -Math.PI * .08);
  ctx.stroke();

  // active arc
  const start = -Math.PI / 2;
  ctx.strokeStyle = `rgba(138,154,108,.35)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + angle);
  ctx.stroke();

  // glow arc
  ctx.strokeStyle = `rgba(138,154,108,.08)`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + angle);
  ctx.stroke();

  // needle
  const nx = cx + Math.cos(start + angle) * r;
  const ny = cy + Math.sin(start + angle) * r;
  ctx.fillStyle = 'rgba(138,154,108,.6)';
  ctx.beginPath();
  ctx.arc(nx, ny, 4, 0, TAU);
  ctx.fill();

  // labels
  ctx.font = '9px "SF Mono",Menlo,monospace';
  ctx.fillStyle = 'rgba(232,228,223,.15)';
  ctx.textAlign = 'center';
  ctx.fillText('CLOSED', cx - r - 20, cy + 4);
  ctx.fillText('OPEN', cx + r + 20, cy + 4);
  ctx.fillText(`${((angle * 180 / Math.PI)|0)}°`, cx, cy + r + 24);
  ctx.restore();

  // waveform behind — morphs from filtered to open
  const filterAmount = .5 + Math.sin(t * .6) * .5;
  ctx.save();
  ctx.strokeStyle = `rgba(138,154,108,.12)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= twistW; i++) {
    const freq = 2 + filterAmount * 6;
    const v = Math.sin((i / twistW) * TAU * freq + t * 4) * (1 - filterAmount * .6);
    const py = twistH * .82 + v * 20;
    i === 0 ? ctx.moveTo(i, py) : ctx.lineTo(i, py);
  }
  ctx.stroke();
  ctx.restore();
}

/* ── SYNTH (section 5) ── */
let synthCtx, synthW, synthH;
function synthInit() {
  const s = sizeCanvas('c-synth');
  synthCtx = s.ctx; synthW = s.w; synthH = s.h;
}
function synthDraw(t) {
  if (!synthCtx) return;
  const ctx = synthCtx;
  ctx.clearRect(0, 0, synthW, synthH);

  drawScope(ctx, synthW * .08, synthH * .7, synthW * .84, synthH * .15, t, .08);

  // small waveforms scattered
  const waves = [
    { x: synthW * .1, y: synthH * .15, fn: Math.sin, label: '' },
    { x: synthW * .85, y: synthH * .2, fn: x => Math.sign(Math.sin(x)), label: '' },
    { x: synthW * .08, y: synthH * .45, fn: x => (x % TAU) / TAU * 2 - 1, label: '' },
  ];
  waves.forEach(({ x, y, fn }) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(138,154,108,.1)';
    ctx.lineWidth = .8;
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      const v = fn((i / 60) * TAU * 2 + t * 3) * 10;
      i === 0 ? ctx.moveTo(x + i, y + v) : ctx.lineTo(x + i, y + v);
    }
    ctx.stroke();
    ctx.restore();
  });
}

/* ── FINAL (section 7) ── */
let finalCtx, finalW, finalH;
const dots = Array.from({ length: 30 }, () => ({
  x: rand(.1, .9), y: rand(.1, .9),
  r: rand(1, 3), spd: rand(.3, 1),
  phase: rand(0, TAU),
}));
function finalInit() {
  const s = sizeCanvas('c-final');
  finalCtx = s.ctx; finalW = s.w; finalH = s.h;
}
function finalDraw(t, progress) {
  if (!finalCtx) return;
  const ctx = finalCtx;
  ctx.clearRect(0, 0, finalW, finalH);
  const fade = Math.max(0, 1 - progress * 1.5);
  dots.forEach(d => {
    const alpha = fade * (.15 + Math.sin(t * d.spd + d.phase) * .1);
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(138,154,108,${alpha})`;
    ctx.beginPath();
    ctx.arc(
      d.x * finalW + Math.sin(t + d.phase) * 4,
      d.y * finalH + Math.cos(t * .8 + d.phase) * 3,
      d.r, 0, TAU
    );
    ctx.fill();
  });
}

/* ═══════════════════════════════════════════
   SCROLL OBSERVER
   ═══════════════════════════════════════════ */
const visibleSections = new Set();
const sectionProgress = {};

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const id = e.target.id;
    if (e.isIntersecting) {
      visibleSections.add(id);
      e.target.classList.add('visible');
    } else {
      visibleSections.delete(id);
    }
  });
}, { threshold: .15 });

document.querySelectorAll('.s').forEach(s => observer.observe(s));

function updateProgress() {
  document.querySelectorAll('.s').forEach(s => {
    const r = s.getBoundingClientRect();
    const p = 1 - (r.top / innerHeight);
    sectionProgress[s.id] = Math.max(0, Math.min(p, 2));
  });
}

/* note row lighting (section 2) */
function updateNotes() {
  const p = sectionProgress.hand || 0;
  document.querySelectorAll('#note-row span').forEach((el, i) => {
    const threshold = .4 + i * .15;
    el.classList.toggle('lit', p > threshold);
  });
}

/* ═══════════════════════════════════════════
   MAIN LOOP
   ═══════════════════════════════════════════ */
let running = true;
function loop(now) {
  if (!running) return;
  const t = now * .001;
  updateProgress();
  updateNotes();

  if (visibleSections.has('hero')) heroDraw(t);
  if (visibleSections.has('hand')) handDraw(t, sectionProgress.hand || 0);
  if (visibleSections.has('split')) splitDraw(t);
  if (visibleSections.has('twist')) twistDraw(t, sectionProgress.twist || 0);
  if (visibleSections.has('synth')) synthDraw(t);
  if (visibleSections.has('final')) finalDraw(t, sectionProgress.final || 0);

  requestAnimationFrame(loop);
}

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */
function init() {
  heroInit();
  handInit();
  splitInit();
  twistInit();
  synthInit();
  finalInit();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  heroInit();
  handInit();
  splitInit();
  twistInit();
  synthInit();
  finalInit();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
