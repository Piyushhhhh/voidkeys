/* ═══════════════════════════════════════════════════════════════
   VOIDKEYS — landing page
   ═══════════════════════════════════════════════════════════════ */

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const TAU = Math.PI * 2;
let mx = 0.5, my = 0.5;

window.addEventListener('mousemove', e => {
  mx = e.clientX / innerWidth;
  my = e.clientY / innerHeight;
});

const lerp = (a, b, t) => a + (b - a) * t;
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/* ═══════════════════════════════════════════
   SCROLL OBSERVER — reveal on enter
   ═══════════════════════════════════════════ */
const visibleSections = new Set();

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      visibleSections.add(e.target.id);
      e.target.classList.add('visible');
    } else {
      visibleSections.delete(e.target.id);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.s').forEach(s => observer.observe(s));

/* ═══════════════════════════════════════════
   PARALLAX — subtle image shift on mouse
   ═══════════════════════════════════════════ */
function updateParallax() {
  const dx = (mx - .5) * 16;
  const dy = (my - .5) * 10;
  document.querySelectorAll('.s-img img').forEach(img => {
    const section = img.closest('.s');
    if (visibleSections.has(section.id)) {
      img.style.transform = `scale(1.04) translate(${dx}px, ${dy}px)`;
    }
  });
}

/* ═══════════════════════════════════════════
   FINAL SECTION — fading tracking dots
   ═══════════════════════════════════════════ */
let finalCtx, finalW, finalH;
const dots = Array.from({ length: 35 }, () => ({
  x: rand(.1, .9), y: rand(.1, .9),
  r: rand(1, 3), spd: rand(.3, 1),
  phase: rand(0, TAU),
}));

function finalInit() {
  const c = document.getElementById('c-final');
  if (!c) return;
  const rect = c.parentElement.getBoundingClientRect();
  c.width = rect.width * DPR;
  c.height = rect.height * DPR;
  c.style.width = rect.width + 'px';
  c.style.height = rect.height + 'px';
  finalCtx = c.getContext('2d');
  finalCtx.scale(DPR, DPR);
  finalW = rect.width;
  finalH = rect.height;
}

function finalDraw(t) {
  if (!finalCtx) return;
  finalCtx.clearRect(0, 0, finalW, finalH);
  dots.forEach(d => {
    const alpha = .12 + Math.sin(t * d.spd + d.phase) * .08;
    if (alpha <= 0) return;
    finalCtx.fillStyle = `rgba(138,154,108,${alpha})`;
    finalCtx.beginPath();
    finalCtx.arc(
      d.x * finalW + Math.sin(t + d.phase) * 5,
      d.y * finalH + Math.cos(t * .8 + d.phase) * 4,
      d.r, 0, TAU
    );
    finalCtx.fill();
  });

  // faint connection lines between nearby dots
  finalCtx.strokeStyle = 'rgba(138,154,108,.03)';
  finalCtx.lineWidth = .5;
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const ax = dots[i].x * finalW, ay = dots[i].y * finalH;
      const bx = dots[j].x * finalW, by = dots[j].y * finalH;
      const dist = Math.hypot(ax - bx, ay - by);
      if (dist < 120) {
        finalCtx.beginPath();
        finalCtx.moveTo(
          ax + Math.sin(t + dots[i].phase) * 5,
          ay + Math.cos(t * .8 + dots[i].phase) * 4
        );
        finalCtx.lineTo(
          bx + Math.sin(t + dots[j].phase) * 5,
          by + Math.cos(t * .8 + dots[j].phase) * 4
        );
        finalCtx.stroke();
      }
    }
  }
}

/* ═══════════════════════════════════════════
   MAIN LOOP
   ═══════════════════════════════════════════ */
function loop(now) {
  const t = now * .001;
  updateParallax();
  if (visibleSections.has('final')) finalDraw(t);
  requestAnimationFrame(loop);
}

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */
function init() {
  finalInit();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', finalInit);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
