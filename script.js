/* ── READ POPUP STYLES (injected) ───────────────────────── */
(function () {
  const s = document.createElement('style');
  s.textContent = `
    .read-popup {
      position: fixed;
      background: #fffdf0;
      border: 2px solid rgba(200,146,10,.35);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,.22);
      overflow: hidden;
      opacity: 0;
      transform: scale(0.75);
      transition: opacity .22s ease, transform .22s ease;
      z-index: 9000;
      cursor: default;
    }
    .read-popup.open {
      opacity: 1;
      transform: scale(1);
    }
    .read-popup img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .read-popup-close {
      position: absolute;
      top: 6px; right: 8px;
      background: rgba(0,0,0,.45);
      color: #fff;
      border-radius: 50%;
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      cursor: pointer;
      line-height: 1;
    }
    .read-popup-close:hover { background: rgba(0,0,0,.7); }
  `;
  document.head.appendChild(s);
})();

/* ════════════════════════════════════════════════════════════
   Eid Al-Fitr Mubarak — Research and Innovation Complex
   script.js  —  v3: wall colours, dead zones, multi-modal
════════════════════════════════════════════════════════════ */

/* ── HIJRI DATE ─────────────────────────────────────────── */
(function () {
  try {
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    const el = document.getElementById('hijriDate');
    if (el) el.textContent = hijri + ' هـ';
  } catch (e) {}
})();

/* ── FLOATING SHAPES: hexagons + crescents + stars ──────── */
(function () {
  const fc = document.getElementById('floatCanvas');
  const fCtx = fc.getContext('2d');

  const palette = [
    'rgba(0,154,68,',
    'rgba(92,200,160,',
    'rgba(58,191,184,',
    'rgba(91,174,232,',
    'rgba(200,146,10,',
  ];
  // Gold-only palette for crescents/stars
  const goldPalette = [
    'rgba(200,146,10,',
    'rgba(220,170,20,',
    'rgba(180,130,5,',
  ];

  let floaters = [];

  /* ── shape helpers ── */
  function hexPoints(cx, cy, r, angle) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = angle + Math.PI / 180 * (60 * i - 30);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  function drawCrescent(ctx, cx, cy, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    const outerR = r;
    const innerR = r * 0.82;
    const offset = r * 0.52;

    // Step 1: clip to outer circle boundary
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.clip();

    // Step 2: fill outer circle
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fillStyle = color + alpha.toFixed(2) + ')';
    ctx.fill();

    // Step 3: punch out inner circle → true crescent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(offset, 0, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end clip + restore compositing to source-over

    // Step 4: outer rim stroke
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = color + Math.min(1, alpha * 1.8).toFixed(2) + ')';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.restore();
  }

  function drawStar(ctx, cx, cy, r, points, rot, color, alpha) {
    const inner = r * 0.42;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = rot + (Math.PI / points) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : inner;
      i === 0
        ? ctx.moveTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a))
        : ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = color + alpha.toFixed(2) + ')';
    ctx.fill();
    ctx.strokeStyle = color + Math.min(1, alpha * 1.5).toFixed(2) + ')';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  /* ── spawn ── */
  function spawn() {
    // 50% hex, 25% crescent, 25% star
    const roll = Math.random();
    const type = roll < 0.50 ? 'hex'
               : roll < 0.75 ? 'crescent'
               : 'star';

    const isGold = type !== 'hex';
    const pal    = isGold ? goldPalette : palette;
    const r      = type === 'hex'      ? Math.random() * 12 + 6
                 : type === 'crescent' ? Math.random() * 10 + 7
                 :                       Math.random() * 7  + 4;

    return {
      type,
      x: Math.random() * fc.width,
      y: fc.height + r * 2,
      r,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.45 + 0.15),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * (type === 'crescent' ? 0.006 : 0.013),
      alpha: 0,
      maxAlpha: isGold
        ? Math.random() * 0.22 + 0.08   // gold slightly brighter
        : Math.random() * 0.18 + 0.06,
      fadeState: 'in',
      color: pal[Math.floor(Math.random() * pal.length)],
      starPoints: type === 'star' ? (Math.random() < 0.5 ? 5 : 6) : 0,
    };
  }

  function resizeFloat() {
    fc.width = innerWidth; fc.height = innerHeight;
    floaters = Array.from({ length: 38 }, () => {
      const f = spawn();
      f.y = Math.random() * fc.height;
      f.alpha = Math.random() * f.maxAlpha;
      return f;
    });
  }

  function drawFloat() {
    fCtx.clearRect(0, 0, fc.width, fc.height);
    floaters.forEach((f, i) => {
      f.x += f.vx; f.y += f.vy; f.rot += f.rotSpeed;

      // Fade in/hold/fade out
      if (f.fadeState === 'in') {
        f.alpha += 0.003;
        if (f.alpha >= f.maxAlpha) f.fadeState = 'hold';
      } else if (f.fadeState === 'hold') {
        if (f.y < fc.height * 0.15) f.fadeState = 'out';
      } else {
        f.alpha -= 0.004;
        if (f.alpha <= 0) { floaters[i] = spawn(); return; }
      }

      if (f.type === 'hex') {
        const pts = hexPoints(f.x, f.y, f.r, f.rot);
        fCtx.beginPath();
        fCtx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(p => fCtx.lineTo(p[0], p[1]));
        fCtx.closePath();
        fCtx.strokeStyle = f.color + (f.alpha * 1.4).toFixed(2) + ')';
        fCtx.lineWidth = 1.2; fCtx.stroke();
        fCtx.fillStyle = f.color + f.alpha.toFixed(2) + ')';
        fCtx.fill();
      } else if (f.type === 'crescent') {
        drawCrescent(fCtx, f.x, f.y, f.r, f.rot, f.color, f.alpha);
      } else {
        drawStar(fCtx, f.x, f.y, f.r, f.starPoints, f.rot, f.color, f.alpha);
      }
    });
    requestAnimationFrame(drawFloat);
  }

  resizeFloat(); drawFloat();
  window.addEventListener('resize', resizeFloat);
})();

/* ── PERSISTENCE ─────────────────────────────────────────── */
let greetings = {};
try { const s = localStorage.getItem('eid_greetings_v3'); if (s) greetings = JSON.parse(s); } catch (e) {}
function saveData() {
  try { localStorage.setItem('eid_greetings_v3', JSON.stringify(greetings)); } catch (e) {}
}

/* ── HEX GRID ────────────────────────────────────────────── */
const hexCanvas = document.getElementById('hexCanvas');
const hCtx = hexCanvas.getContext('2d');
let hexes = [], hexR = 0, hoveredId = null;

/*  Screen layout (from photo):
    Total: ~1916 × 1056  →  3 rows, 4 cols of panels
    Row height ≈ 352px   →  each row ≈ 33.3% of screen height
    Dead zones:
      - Top row    (zone 1-4): y < 35% of screen  → no interaction
      - Bottom row (zone 9-12): y > 78% of screen → no interaction
    Interactive rows 5-8: 35%–78%
*/
const DEAD_TOP_PCT    = 0.33;   // top 33% = row 1
const DEAD_BOTTOM_PCT = 0.76;   // below 76% = row 3 (approx)

/* Real wall hex colours – grey shades only, matching the physical wall */
const leftColors = [
  ['#A9D17D', '#DAEBC7'],
  ['#84BD00', '#DAEBC7'],
  ['#DAEBC7', '#B2DAC5'],
];
[['#CFEFA8','#9ED44A'],['#A6E0A0','#6FC06E'],['#9ED7CC','#5CC8A0']];
const rightColors = [
  ['#A9D17D', '#DAEBC7'],
  ['#84BD00', '#DAEBC7'],
  ['#DAEBC7', '#B2DAC5'],
];
const writtenFill = [['#FFF3C8','#ffe656'],['#FFEAC0','#ffe656']];

function buildGrid() {
  const W = hexCanvas.width, H = hexCanvas.height;

  hexR = Math.max(18, Math.min(38, W * 0.018));
  const hw = hexR * Math.sqrt(3);
  const vGap = hexR * 2 * 0.75;

  hexes = [];

  const nRows = Math.ceil(H / vGap) + 2;
  const nCols = Math.ceil(W / hw) + 2;

  for (let row = -1; row < nRows; row++) {
    for (let col = -1; col < nCols; col++) {

      const off = (row % 2 !== 0) ? hw * 0.5 : 0;
      const cx = col * hw + off;
      const cy = row * vGap;

      const mid = W / 2;
      const side = cx < mid ? 'left' : 'right';

      /* Side zones only (30%) */
      const inSideZone = side === 'left'
        ? cx < W * 0.30
        : cx > W * 0.62;

      if (!inSideZone) continue;

      /* Inaccessible rows */
      const inDeadTop = cy < H * DEAD_TOP_PCT;
      const inDeadBottom = cy > H * DEAD_BOTTOM_PCT;

      if (inDeadTop || inDeadBottom) continue;

      hexes.push({
        id: `${row}_${col}`,
        cx,
        cy,
        row,
        col,
        side
      });

    }
  }
}

function hexPath(cx, cy, r) {
  hCtx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    i === 0 ? hCtx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
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
  {
    const pal = h.side === 'left' ? leftColors : rightColors;
    colors = pal[(Math.abs(h.row + h.col)) % pal.length];
  }

  const grad = hCtx.createLinearGradient(h.cx, h.cy - r, h.cx, h.cy + r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  hCtx.fillStyle = grad;

  // Dead hexes slightly dimmer, no hover highlight
  const alpha = h.dead ? 0.45 : (hl ? 1 : (g ? 0.88 : 0.62));
  hCtx.globalAlpha = alpha;
  if (hl && !h.dead) { hCtx.shadowColor = colors[1]; hCtx.shadowBlur = 22; }
  hCtx.fill();
  hCtx.shadowBlur = 0; hCtx.globalAlpha = 1;

  hCtx.strokeStyle = 'rgba(80,60,20,.25)';
  hCtx.stroke();

  if (g) {
    try {
      const img = new Image();
      img.src = g.img;
      const iw = hexR * 1.7, ih = hexR * 1.7;
      hCtx.save();
      hexPath(h.cx, h.cy, r - gap / 2 - 2);
      hCtx.clip();
      hCtx.globalAlpha = 1;
      hCtx.drawImage(img, h.cx - iw / 2, h.cy - ih / 2, iw, ih);
      hCtx.restore();
    } catch (e) {}
  } else if (hl && !h.dead) {
    hCtx.save();
    hCtx.fillStyle = 'rgba(0,80,30,.75)';
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
  const h = hexAt(ex, ey);
  const id = h && !h.dead ? h.id : null;
  if (id !== hoveredId) {
    hoveredId = id;
    hexCanvas.style.cursor = h && !h.dead ? 'pointer' : 'default';
    drawAll(hoveredId);
  }
}
hexCanvas.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
hexCanvas.addEventListener('touchmove', e => {
  e.preventDefault();
  // For hover, use first touch
  onMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

/* ── MULTI-TOUCH TAP ─────────────────────────────────────── */
/*  Each touch point that hits a hex will open its own modal
    (or read-modal if already has a greeting).
    We track active modals by hexId.                         */

hexCanvas.addEventListener('touchend', e => {
  Array.from(e.changedTouches).forEach(t => {
    onTap(t.clientX, t.clientY);
  });
}, { passive: true });

hexCanvas.addEventListener('click', e => onTap(e.clientX, e.clientY));

function onTap(ex, ey) {
  const h = hexAt(ex, ey);
  if (!h || h.dead) return;
  if (greetings[h.id]) { showRead(h.id); }
  else { openDrawModal(h, ex, ey); }
}

function updateCounter() {
  document.getElementById('countNum').textContent = Object.keys(greetings).length;
  document.getElementById('countTotal').textContent = hexes.filter(h => !h.dead).length;
}

/* ════════════════════════════════════════════════════════════
   MULTI-INSTANCE DRAW MODALS
════════════════════════════════════════════════════════════ */
const modalsContainer = document.getElementById('modalsContainer');
const activeModals = {}; // hexId → modal DOM element

function openDrawModal(hex, tapX, tapY) {
  if (activeModals[hex.id]) return; // already open

  const modal = document.createElement('div');
  modal.className = 'draw-modal';

  /* Position: prefer left/right side near the hex, but keep in-screen */
  const W = innerWidth, H = innerHeight;
  const mW = Math.min(380, W * 0.3, 380);
  const mH = 320;
  let left, top;

  if (hex.side === 'left') {
    left = Math.max(8, hex.cx + hexR * 1.5);
  } else {
    left = Math.min(W - mW - 8, hex.cx - hexR * 1.5 - mW);
  }
  top = Math.max(8, Math.min(H - mH - 8, hex.cy - mH / 2));

  modal.style.cssText = `left:${left}px; top:${top}px; width:${mW}px;`;

  modal.innerHTML = `
    <div class="modal-header"><h2>✦ Write Your Greeting</h2></div>
    <div class="draw-wrap">
      <canvas class="dc"></canvas>
      <div class="draw-toolbar">
        <div class="toolbar-left">
          <span class="tool-label">Color:</span>
          <div class="swatch active" data-color="#006630" style="background:#006630"></div>
          <div class="swatch" data-color="#1C6840" style="background:#1C6840"></div>
          <div class="swatch" data-color="#C8920A" style="background:#C8920A"></div>
          <div class="swatch" data-color="#8B1A1A" style="background:#8B1A1A"></div>
          <div class="swatch" data-color="#4A1A7A" style="background:#4A1A7A"></div>
        </div>
        <div class="toolbar-right">
          <span class="tool-label">Size:</span>
          <button class="size-btn" data-size="3" style="width:24px;height:24px;"><span style="width:4px;height:4px;"></span></button>
          <button class="size-btn active" data-size="6" style="width:28px;height:28px;"><span style="width:8px;height:8px;"></span></button>
          <button class="size-btn" data-size="11" style="width:32px;height:32px;"><span style="width:13px;height:13px;"></span></button>
          <button class="btn-clear">Clear ↺</button>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary submit-btn">Submit ✦</button>
      <button class="btn btn-secondary cancel-btn">Cancel</button>
    </div>
  `;

  modalsContainer.appendChild(modal);
  activeModals[hex.id] = modal;

  // Init canvas
  const dc = modal.querySelector('.dc');
  let penColor = '#006630', penSize = 6;

  function initDc() {
    const dpr = window.devicePixelRatio || 1;
    dc.width  = dc.offsetWidth  * dpr;
    dc.height = dc.offsetHeight * dpr;
    // Keep canvas transparent (no white fill) so drawing looks like a sticker
    dc.style.background = '#FFF9C4';
    const ctx = dc.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }

  function clearDc() {
    const ctx = dc.getContext('2d');
    ctx.clearRect(0, 0, dc.width, dc.height);
  }

  setTimeout(() => { initDc(); modal.classList.add('open'); }, 30);

  // Drawing logic
  let drawing = false, lx = 0, ly = 0;

  function getPos(e) {
    const rect = dc.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function startD(e) {
    e.preventDefault(); drawing = true;
    const p = getPos(e); lx = p.x; ly = p.y;
  }
  function moveD(e) {
    if (!drawing) return; e.preventDefault();
    const p = getPos(e);
    const ctx = dc.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = penColor; ctx.lineWidth = penSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
    lx = p.x; ly = p.y;
  }
  function endD() { drawing = false; }

  dc.addEventListener('mousedown', startD);
  dc.addEventListener('mousemove', moveD);
  dc.addEventListener('mouseup', endD);
  dc.addEventListener('mouseleave', endD);
  dc.addEventListener('touchstart', startD, { passive: false });
  dc.addEventListener('touchmove', moveD, { passive: false });
  dc.addEventListener('touchend', endD);

  modal.querySelector('.btn-clear').addEventListener('click', clearDc);

  modal.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      modal.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      penColor = s.dataset.color;
    });
    s.addEventListener('touchend', e => { e.stopPropagation(); s.click(); });
  });

  modal.querySelectorAll('.size-btn').forEach(b => {
    b.addEventListener('click', () => {
      modal.querySelectorAll('.size-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      penSize = parseInt(b.dataset.size);
    });
    b.addEventListener('touchend', e => { e.stopPropagation(); b.click(); });
  });

  function closeModal() {
    modal.classList.remove('open');
    setTimeout(() => { modal.remove(); delete activeModals[hex.id]; }, 300);
  }

  modal.querySelector('.cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('.submit-btn').addEventListener('click', () => {
    const ctx = dc.getContext('2d');
    const data = ctx.getImageData(0, 0, dc.width, dc.height).data;
    let hasContent = false;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 20) { hasContent = true; break; }
    }
    if (!hasContent) {
      dc.style.outline = '2px solid rgba(200,50,50,.6)';
      setTimeout(() => dc.style.outline = '', 1200);
      return;
    }
    greetings[hex.id] = { img: dc.toDataURL('image/png', 0.8) };
    saveData(); closeModal(); drawAll(); updateCounter(); showToast();
  });

  // Stop touch events from bubbling to hexCanvas
  modal.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchmove',  e => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchend',   e => e.stopPropagation(), { passive: true });
  modal.addEventListener('mousedown',  e => e.stopPropagation());
  modal.addEventListener('click',      e => e.stopPropagation());
}

/* ── READ POPUP — same card style & position as draw-modal ── */
const activeReadPopups = {};

function showRead(hexId) {
  const g = greetings[hexId]; if (!g) return;

  // Toggle off if already open
  if (activeReadPopups[hexId]) { closeReadPopup(hexId); return; }

  const hex = hexes.find(x => x.id === hexId); if (!hex) return;

  const W = innerWidth, H = innerHeight;
  const mW = Math.min(380, W * 0.3, 380);
  const mH = 320;
  let left, top;

  // Exact same positioning logic as openDrawModal
  if (hex.side === 'left') {
    left = Math.max(8, hex.cx + hexR * 1.5);
  } else {
    left = Math.min(W - mW - 8, hex.cx - hexR * 1.5 - mW);
  }
  top = Math.max(8, Math.min(H - mH - 8, hex.cy - mH / 2));

  const popup = document.createElement('div');
  popup.className = 'draw-modal'; // reuse exact same card styles
  popup.style.cssText = `left:${left}px; top:${top}px; width:${mW}px;`;

  popup.innerHTML = `
    <div class="modal-header"><h2>✦ Greeting</h2></div>
    <div class="read-img-wrap" style="border-radius:12px;overflow:hidden;border:1.5px solid rgba(0,154,68,.25);">
      <img src="${g.img}" alt="greeting" style="width:100%;height:${mH - 90}px;object-fit:contain;display:block;background:#FFF9C4;">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary read-close-btn">Close ✕</button>
    </div>
  `;

  modalsContainer.appendChild(popup);
  activeReadPopups[hexId] = popup;

  // Animate in — same timing as draw-modal
  setTimeout(() => popup.classList.add('open'), 30);

  popup.querySelector('.read-close-btn').addEventListener('click', e => {
    e.stopPropagation(); closeReadPopup(hexId);
  });

  // Block events from reaching hexCanvas
  popup.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  popup.addEventListener('touchmove',  e => e.stopPropagation(), { passive: true });
  popup.addEventListener('touchend',   e => e.stopPropagation(), { passive: true });
  popup.addEventListener('mousedown',  e => e.stopPropagation());
  popup.addEventListener('click',      e => e.stopPropagation());
}

function closeReadPopup(hexId) {
  const p = activeReadPopups[hexId]; if (!p) return;
  p.classList.remove('open');
  setTimeout(() => { p.remove(); delete activeReadPopups[hexId]; }, 300);
}

/* ── TOAST ───────────────────────────────────────────────── */
function showToast() {
  const t = document.getElementById('toast'); t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}