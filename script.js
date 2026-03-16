/* ════════════════════════════════════════════════════════════
   عيد الفطر المبارك — Research and Innovation Complex
   script.js
════════════════════════════════════════════════════════════ */

/* ── HIJRI DATE (DYNAMIC) ───────────────────────────────── */
(function () {
  try {
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    const el = document.getElementById('hijriDate');
    if (el) el.textContent = hijri + ' هـ';
  } catch (e) {}
})();

/* ── FLOATING MINI HEXAGONS ─────────────────────────────── */
(function () {
  const fc = document.getElementById('floatCanvas');
  const fCtx = fc.getContext('2d');

  const palette = [
    'rgba(158,212,74,',   // lime
    'rgba(92,200,160,',   // mint
    'rgba(58,191,184,',   // teal
    'rgba(91,174,232,',   // sky
    'rgba(200,146,10,',   // gold
  ];

  let floaters = [];

  function hexPoints(cx, cy, r, angle) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = angle + Math.PI / 180 * (60 * i - 30);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  function spawn() {
    const r = Math.random() * 12 + 6;
    return {
      x: Math.random() * fc.width,
      y: fc.height + r * 2,
      r,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.2),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.012,
      alpha: 0,
      maxAlpha: Math.random() * 0.18 + 0.06,
      fadeState: 'in',
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  }

  function resizeFloat() {
    fc.width = innerWidth; fc.height = innerHeight;
    floaters = Array.from({ length: 28 }, () => {
      const f = spawn();
      f.y = Math.random() * fc.height;  // scatter on init
      f.alpha = Math.random() * f.maxAlpha;
      return f;
    });
  }

  function drawFloat() {
    fCtx.clearRect(0, 0, fc.width, fc.height);

    floaters.forEach((f, i) => {
      // movement
      f.x += f.vx; f.y += f.vy; f.rot += f.rotSpeed;

      // fade in/out
      if (f.fadeState === 'in') {
        f.alpha += 0.003;
        if (f.alpha >= f.maxAlpha) f.fadeState = 'hold';
      } else if (f.fadeState === 'hold') {
        if (f.y < fc.height * 0.15) f.fadeState = 'out';
      } else {
        f.alpha -= 0.004;
        if (f.alpha <= 0) { floaters[i] = spawn(); return; }
      }

      // draw
      const pts = hexPoints(f.x, f.y, f.r, f.rot);
      fCtx.beginPath();
      fCtx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => fCtx.lineTo(p[0], p[1]));
      fCtx.closePath();
      fCtx.strokeStyle = f.color + (f.alpha * 1.4).toFixed(2) + ')';
      fCtx.lineWidth = 1.2;
      fCtx.stroke();
      fCtx.fillStyle = f.color + f.alpha.toFixed(2) + ')';
      fCtx.fill();
    });

    requestAnimationFrame(drawFloat);
  }

  resizeFloat();
  drawFloat();
  window.addEventListener('resize', resizeFloat);
})();


let greetings = {};
try {
  const s = localStorage.getItem('eid_greetings_v2');
  if (s) greetings = JSON.parse(s);
} catch (e) {}

function saveData() {
  try { localStorage.setItem('eid_greetings_v2', JSON.stringify(greetings)); } catch (e) {}
}

/* ── HEX GRID ────────────────────────────────────────────── */
const hexCanvas = document.getElementById('hexCanvas');
const hCtx = hexCanvas.getContext('2d');
let hexes = [], hexR = 0, hoveredId = null, activeHex = null;

const leftColors  = [['#CFEFA8','#9ED44A'],['#A6E0A0','#6FC06E'],['#9ED7CC','#5CC8A0']];
const rightColors = [['#B6D7F2','#8ED0F0'],['#8ED0F0','#5BAEE8'],['#5BAEE8','#3A72C0']];
const writtenFill = [['#FFF3C8','#E8C060'],['#FFEAC0','#D4A040']];

function buildGrid() {
  const W = hexCanvas.width, H = hexCanvas.height;
  hexR = Math.max(28, Math.min(62, W * 0.032));
  const hw = hexR * Math.sqrt(3);
  const vGap = hexR * 2 * 0.75;
  hexes = [];
  const nRows = Math.ceil(H / vGap) + 2;
  const nCols = Math.ceil(W / hw) + 2;
  for (let row = -1; row < nRows; row++) {
    for (let col = -1; col < nCols; col++) {
      const off = (row % 2 !== 0) ? hw * 0.5 : 0;
      const cx = col * hw + off, cy = row * vGap;
      const mid = W / 2;
      const side = cx < mid ? 'left' : 'right';
      // Only allow hexes in the outer 30% on each side
      const inSideZone = side === 'left' ? cx < W * 0.30 : cx > W * 0.70;
      if (!inSideZone) continue;
      hexes.push({ id: `${row}_${col}`, cx, cy, row, col, side });
    }
  }
}

function hexPath(cx, cy, r) {
  hCtx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    i === 0
      ? hCtx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      : hCtx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  hCtx.closePath();
}

function drawOneHex(h, hl) {
  const r = hl ? hexR * 1.06 : hexR;
  const gap = 3.5;
  const g = greetings[h.id];
  hexPath(h.cx, h.cy, r - gap / 2);

  let colors;
  if (g) {
    colors = writtenFill[(Math.abs(h.row + h.col)) % writtenFill.length];
  } else {
    const pal = h.side === 'left' ? leftColors : rightColors;
    colors = pal[(Math.abs(h.row + h.col)) % pal.length];
  }

  const grad = hCtx.createLinearGradient(h.cx, h.cy - r, h.cx, h.cy + r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  hCtx.fillStyle = grad;
  hCtx.globalAlpha = hl ? 1 : (g ? 0.88 : 0.62);
  if (hl) { hCtx.shadowColor = colors[1]; hCtx.shadowBlur = 22; }
  hCtx.fill();
  hCtx.shadowBlur = 0; hCtx.globalAlpha = 1;

  hCtx.strokeStyle = hl ? 'rgba(58,191,184,.9)' : 'rgba(255,255,255,.55)';
  hCtx.lineWidth = hl ? 2.2 : 1.4;
  hCtx.stroke();

  if (g) {
    try {
      const img = new Image();
      img.src = g.img;
      const iw = hexR * 1.1, ih = hexR * 0.9;
      hCtx.save();
      hexPath(h.cx, h.cy, r - gap / 2 - 2);
      hCtx.clip();
      hCtx.globalAlpha = 0.82;
      hCtx.drawImage(img, h.cx - iw / 2, h.cy - ih / 2 - (g.name ? hexR * 0.12 : 0), iw, ih);
      hCtx.restore();
      if (g.name) {
        hCtx.save();
        hCtx.fillStyle = 'rgba(28,58,28,.75)';
        hCtx.font = `bold ${Math.max(8, hexR * 0.2)}px Tajawal, sans-serif`;
        hCtx.textAlign = 'center'; hCtx.textBaseline = 'middle';
        const nm = g.name.length > 8 ? g.name.slice(0, 7) + '…' : g.name;
        hCtx.fillText(nm, h.cx, h.cy + hexR * 0.6);
        hCtx.restore();
      }
    } catch (e) {}
  } else if (hl) {
    hCtx.save();
    hCtx.fillStyle = 'rgba(28,108,88,.8)';
    hCtx.font = `bold ${Math.max(14, hexR * 0.45)}px sans-serif`;
    hCtx.textAlign = 'center'; hCtx.textBaseline = 'middle';
    hCtx.fillText('✎', h.cx, h.cy);
    hCtx.restore();
  }
}

function drawAll(hlId) {
  hCtx.clearRect(0, 0, hexCanvas.width, hexCanvas.height);
  hexes.forEach(h => { if (h.id !== hlId) drawOneHex(h, false); });
  if (hlId) { const h = hexes.find(x => x.id === hlId); if (h) drawOneHex(h, true); }
}

function resize() {
  hexCanvas.width = innerWidth; hexCanvas.height = innerHeight;
  buildGrid(); drawAll(); updateCounter();
}
window.addEventListener('resize', resize);
resize();

function hexAt(px, py) {
  let best = null, bd = Infinity;
  hexes.forEach(h => {
    const d = Math.hypot(px - h.cx, py - h.cy);
    if (d < hexR * 1.05 && d < bd) { bd = d; best = h; }
  });
  return best;
}

/* ── HOVER ──────────────────────────────────────────────── */
function onMove(ex, ey) {
  const h = hexAt(ex, ey), id = h ? h.id : null;
  if (id !== hoveredId) {
    hoveredId = id;
    hexCanvas.style.cursor = h ? 'pointer' : 'default';
    drawAll(hoveredId);
  }
}
hexCanvas.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
hexCanvas.addEventListener('touchmove', e => {
  e.preventDefault();
  onMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

/* ── CLICK / TAP ─────────────────────────────────────────── */
function onTap(ex, ey) {
  const h = hexAt(ex, ey); if (!h) return;
  activeHex = h;
  greetings[h.id] ? showRead(h.id) : showModal();
}
hexCanvas.addEventListener('click', e => onTap(e.clientX, e.clientY));
hexCanvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0]; onTap(t.clientX, t.clientY);
}, { passive: true });

function updateCounter() {
  document.getElementById('countNum').textContent = Object.keys(greetings).length;
  document.getElementById('countTotal').textContent = hexes.length;
}

/* ── DRAWING CANVAS ─────────────────────────────────────── */
const drawCanvas = document.getElementById('drawCanvas');
const dCtx = drawCanvas.getContext('2d');
let drawing = false, lastX = 0, lastY = 0;
let penColor = '#1c5870', penSize = 6;

function initDrawCanvas() {
  drawCanvas.width  = drawCanvas.offsetWidth  * (window.devicePixelRatio || 1);
  drawCanvas.height = drawCanvas.offsetHeight * (window.devicePixelRatio || 1);
  dCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  dCtx.fillStyle = '#FAFFFE';
  dCtx.fillRect(0, 0, drawCanvas.offsetWidth, drawCanvas.offsetHeight);
  dCtx.lineCap = 'round'; dCtx.lineJoin = 'round';
}

function clearDraw() {
  dCtx.clearRect(0, 0, drawCanvas.offsetWidth, drawCanvas.offsetHeight);
  dCtx.fillStyle = '#FAFFFE';
  dCtx.fillRect(0, 0, drawCanvas.offsetWidth, drawCanvas.offsetHeight);
}

function getPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}

function startDraw(e) {
  e.preventDefault(); drawing = true;
  const p = getPos(e); lastX = p.x; lastY = p.y;
}
function moveDraw(e) {
  if (!drawing) return; e.preventDefault();
  const p = getPos(e);
  dCtx.beginPath();
  dCtx.moveTo(lastX, lastY); dCtx.lineTo(p.x, p.y);
  dCtx.strokeStyle = penColor; dCtx.lineWidth = penSize;
  dCtx.lineCap = 'round'; dCtx.lineJoin = 'round';
  dCtx.stroke();
  lastX = p.x; lastY = p.y;
}
function endDraw() { drawing = false; }

drawCanvas.addEventListener('mousedown',  startDraw);
drawCanvas.addEventListener('mousemove',  moveDraw);
drawCanvas.addEventListener('mouseup',    endDraw);
drawCanvas.addEventListener('mouseleave', endDraw);
drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
drawCanvas.addEventListener('touchmove',  moveDraw,  { passive: false });
drawCanvas.addEventListener('touchend',   endDraw);

document.getElementById('clearBtn').addEventListener('click', clearDraw);

/* Color swatches */
document.querySelectorAll('.swatch').forEach(s => {
  s.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    penColor = s.dataset.color;
  });
  s.addEventListener('touchend', e => { e.preventDefault(); s.click(); });
});

/* Size buttons */
document.querySelectorAll('.size-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    penSize = parseInt(b.dataset.size);
  });
  b.addEventListener('touchend', e => { e.preventDefault(); b.click(); });
});

/* ── WRITE MODAL ─────────────────────────────────────────── */
const modalOverlay = document.getElementById('modalOverlay');

function showModal() {
  clearDraw();
  document.getElementById('nameInput').value = '';
  modalOverlay.classList.add('open');
  setTimeout(initDrawCanvas, 50);
}
function hideModal() { modalOverlay.classList.remove('open'); activeHex = null; }

document.getElementById('cancelBtn').addEventListener('click', hideModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) hideModal(); });

document.getElementById('submitBtn').addEventListener('click', () => {
  if (!activeHex) return;
  const imgData = dCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
  let hasContent = false;
  for (let i = 0; i < imgData.length; i += 16) {
    if (imgData[i] < 240 || imgData[i + 1] < 240 || imgData[i + 2] < 240) { hasContent = true; break; }
  }
  if (!hasContent) {
    drawCanvas.style.border = '1.5px solid rgba(200,50,50,.6)';
    setTimeout(() => drawCanvas.style.border = '', 1200);
    return;
  }
  const img = drawCanvas.toDataURL('image/png', 0.8);
  greetings[activeHex.id] = {
    name: document.getElementById('nameInput').value.trim(),
    img
  };
  saveData(); hideModal(); drawAll(); updateCounter(); showToast();
});

/* ── READ MODAL ──────────────────────────────────────────── */
const readOverlay = document.getElementById('readOverlay');

function showRead(id) {
  const g = greetings[id]; if (!g) return;
  document.getElementById('readName').textContent = g.name ? `— ${g.name}` : '';
  document.getElementById('readImg').src = g.img;
  readOverlay.classList.add('open');
}

document.getElementById('readClose').addEventListener('click', () => {
  readOverlay.classList.remove('open'); activeHex = null;
});
readOverlay.addEventListener('click', e => {
  if (e.target === readOverlay) { readOverlay.classList.remove('open'); activeHex = null; }
});

/* ── TOAST ───────────────────────────────────────────────── */
function showToast() {
  const t = document.getElementById('toast'); t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}