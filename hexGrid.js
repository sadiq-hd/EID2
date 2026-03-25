/* ════════════════════════════════════════════════════════════
   hexGrid.js — Hex Grid + Keyboard + Persistence + Modals + Toast
════════════════════════════════════════════════════════════ */

/* ── PERSISTENCE ─────────────────────────────────────────── */
let greetings = {};
try {
  const s = localStorage.getItem('eid_greetings_v4');
  if (s) {
    const parsed = JSON.parse(s);
    /* تنظيف البيانات القديمة — نحتفظ فقط بالإدخالات اللي فيها text */
    Object.keys(parsed).forEach(k => {
      if (parsed[k] && typeof parsed[k].text === 'string') {
        greetings[k] = parsed[k];
      }
    });
  }
} catch (e) { }

function saveData() {
  try { localStorage.setItem('eid_greetings_v4', JSON.stringify(greetings)); } catch (e) { }
}

/* ── HEX GRID ────────────────────────────────────────────── */
const hexCanvas = document.getElementById('hexCanvas');
const hCtx = hexCanvas.getContext('2d');
let hexes = [], hexR = 0, hoveredId = null;
let dpr = window.devicePixelRatio || 1;

const DEAD_TOP_PCT = 0.33;
const DEAD_BOTTOM_PCT = 0.70;

const leftColors = [
  ['#A9D17D', '#DAEBC7'],
  ['#84BD00', '#DAEBC7'],
  ['#DAEBC7', '#B2DAC5'],
];
const rightColors = [
  ['#A9D17D', '#DAEBC7'],
  ['#84BD00', '#DAEBC7'],
  ['#DAEBC7', '#B2DAC5'],
];

/* ── IMAGE CACHE ─────────────────────────────────────────── */
const imgCache = {};
function getCachedImage(src) {
  if (imgCache[src]) return imgCache[src];
  const img = new Image();
  img.src = src;
  img.onload = () => drawAll(hoveredId);
  imgCache[src] = img;
  return img;
}

/* ── BUILD GRID ──────────────────────────────────────────── */
function buildGrid() {
  const W = hexCanvas.clientWidth;
  const H = hexCanvas.clientHeight;

  /* ── حجم الهيكساغون — رفع القيمة يكبرها والعكس ── */
  hexR = Math.max(22, Math.min(76, W * 0.022));

  const hw = hexR * Math.sqrt(3) * 1.08;
  const vGap = hexR * 2 * 0.77;

  hexes = [];
  const MAX_HEXES = 600;
  const nRows = Math.ceil(H / vGap) + 2;
  const nCols = Math.ceil(W / hw) + 2;

  outer:
  for (let row = -1; row < nRows; row++) {
    for (let col = -1; col < nCols; col++) {
      const off = (row % 2 !== 0) ? hw * 0.5 : 0;
      const cx = col * hw + off;
      const cy = row * vGap;
      const mid = W / 3;
      const side = cx < mid ? 'left' : 'right';

      /* ── حدود المنطقة يمين ويسار — رفع القيمة يوسع المنطقة ── */
      /* اليسار:  cx < W * 0.24  ← كل ما رفعت الرقم زادت الهيكساغونات ناحية المنتصف */
      /* اليمين:  cx > W * 0.68  ← كل ما خفضت الرقم زادت الهيكساغونات ناحية المنتصف */
      const inSideZone = side === 'left' ? cx < W * 0.29 : cx > W * 0.70;
      if (!inSideZone) continue;

      const inDeadTop = cy < H * DEAD_TOP_PCT;
      const inDeadBottom = cy > H * DEAD_BOTTOM_PCT;
      if (inDeadTop || inDeadBottom) continue;

      hexes.push({ id: `${row}_${col}`, cx, cy, row, col, side });
      if (hexes.length >= MAX_HEXES) break outer;
    }
  }
}

/* ── DRAW HEX ────────────────────────────────────────────── */
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

  const pal = h.side === 'left' ? leftColors : rightColors;
  const colors = pal[(Math.abs(h.row + h.col)) % pal.length];

  const grad = hCtx.createLinearGradient(h.cx, h.cy - r, h.cx, h.cy + r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  hCtx.fillStyle = grad;

  const alpha = hl ? 1 : (g ? 0.88 : 0.62);
  hCtx.globalAlpha = alpha;
  if (hl) { hCtx.shadowColor = colors[1]; hCtx.shadowBlur = 22 * dpr; }
  hCtx.fill();
  hCtx.shadowBlur = 0; hCtx.globalAlpha = 1;

  hCtx.strokeStyle = 'rgba(80,60,20,.25)';
  hCtx.lineWidth = 1;
  hCtx.stroke();

  if (g && typeof g.text === 'string' && g.text.length > 0) {
    /* رسم النص داخل الهيكساغون */
    hCtx.save();
    hexPath(h.cx, h.cy, r - gap / 2 - 2);
    hCtx.clip();

    const fs = Math.max(9, hexR * 0.28);
    const isAr = /[\u0600-\u06FF]/.test(g.text);
    hCtx.font = `bold ${fs}px ${isAr ? 'Amiri, serif' : 'Tajawal, sans-serif'}`;
    hCtx.fillStyle = 'rgba(0,60,20,0.85)';
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';

    /* تقسيم النص لأسطر */
    const maxW = hexR * 1.5;
    const words = g.text.split(' ');
    const lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (hCtx.measureText(test).width > maxW) {
        if (line) lines.push(line);
        line = w;
      } else { line = test; }
    });
    if (line) lines.push(line);

    const lh = fs * 1.3;
    const startY = h.cy - ((lines.length - 1) * lh) / 2;
    lines.slice(0, 3).forEach((l, i) => hCtx.fillText(l, h.cx, startY + i * lh));
    hCtx.restore();

  } else if (hl) {
    hCtx.save();
    hCtx.fillStyle = 'rgba(0,80,30,.75)';
    hCtx.font = `bold ${Math.max(14, hexR * 0.45)}px sans-serif`;
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillText('✎', h.cx, h.cy);
    hCtx.restore();
  }
}

function drawAll(hlId) {
  hCtx.clearRect(0, 0, hexCanvas.clientWidth, hexCanvas.clientHeight);
  hexes.forEach(h => { if (h.id !== hlId) drawOneHex(h, false); });
  if (hlId) { const h = hexes.find(x => x.id === hlId); if (h) drawOneHex(h, true); }
}

/* ── RESIZE ──────────────────────────────────────────────── */
function resize() {
  dpr = window.devicePixelRatio || 1;
  const W = innerWidth, H = innerHeight;
  hexCanvas.width = W * dpr;
  hexCanvas.height = H * dpr;
  hexCanvas.style.width = W + 'px';
  hexCanvas.style.height = H + 'px';
  hCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildGrid();
  drawAll();
  updateCounter();
}
window.addEventListener('resize', resize);
resize();

/* ── HIT TEST ────────────────────────────────────────────── */
function hexAt(px, py) {
  let best = null, bd = Infinity;
  hexes.forEach(h => {
    const d = Math.hypot(px - h.cx, py - h.cy);
    if (d < hexR * 1.05 && d < bd) { bd = d; best = h; }
  });
  return best;
}

/* ── HOVER ───────────────────────────────────────────────── */
function onMove(ex, ey) {
  const h = hexAt(ex, ey);
  const id = h ? h.id : null;
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

/* ── TAP ─────────────────────────────────────────────────── */
hexCanvas.addEventListener('touchend', e => {
  Array.from(e.changedTouches).forEach(t => onTap(t.clientX, t.clientY));
}, { passive: true });
hexCanvas.addEventListener('click', e => onTap(e.clientX, e.clientY));

function onTap(ex, ey) {
  const h = hexAt(ex, ey);
  if (!h) return;
  if (greetings[h.id]) showRead(h.id);
  else openKeyboardModal(h);
}

/* ── COUNTER ─────────────────────────────────────────────── */
function updateCounter() {
  document.getElementById('countNum').textContent = Object.keys(greetings).length;
  document.getElementById('countTotal').textContent = hexes.length;
}

/* ════════════════════════════════════════════════════════════
   KEYBOARD LAYOUTS
════════════════════════════════════════════════════════════ */
const KB_LAYOUTS = {
  en: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
    ['123', 'space', '.', ',', '!', '?']
  ],
  ar: [
    ['ذ', 'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['⌫', 'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'د'],
    ['123', 'space', '،', '.', '-', '؟']
  ],
  num: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '@', '"', '#', '%'],
    ['*', '+', '=', '_', '!', '?', '$', '&', '؟', '⌫'],
    ['EN', 'AR', 'space', '.', ',']
  ]
};

/* ════════════════════════════════════════════════════════════
   KEYBOARD MODAL
════════════════════════════════════════════════════════════ */
const modalsContainer = document.getElementById('modalsContainer');
const activeModals = {};

function openKeyboardModal(hex) {
  if (activeModals[hex.id]) return;

  const W = innerWidth, H = innerHeight;
  const mW = Math.min(360, W * 0.32, 360);
  const mH = 430;
  let left, top;

  if (hex.side === 'left') {
    left = Math.max(8, hex.cx + hexR * 1.5);
  } else {
    left = Math.min(W - mW - 8, hex.cx - hexR * 1.5 - mW);
  }
  top = Math.max(8, Math.min(H - mH - 8, hex.cy - mH / 2));

  const modal = document.createElement('div');
  modal.className = 'draw-modal';
  modal.style.cssText = `left:${left}px; top:${top}px; width:${mW}px;`;

  modal.innerHTML = `
    <div class="modal-header"><h2>✦ Write Your Greeting</h2></div>
    <div class="kb-display" id="kbDisplay_${hex.id}">
      <span class="kb-display-text en" id="kbText_${hex.id}"></span>
      <span class="kb-cursor"></span>
      <span class="kb-count"><span id="kbCount_${hex.id}">0</span>/80</span>
    </div>
    <div class="kb-lang-bar">
      <button class="kb-lang-btn active" data-lang="en">English</button>
      <button class="kb-lang-btn" data-lang="ar">عربي</button>
      <button class="kb-lang-btn" data-lang="num">123</button>
    </div>
    <div class="kb-keys" id="kbKeys_${hex.id}"></div>
    <div class="modal-actions">
      <button class="btn btn-primary kb-submit-btn">Submit ✦</button>
      <button class="btn btn-secondary kb-cancel-btn">Cancel</button>
    </div>
  `;

  modalsContainer.appendChild(modal);
  activeModals[hex.id] = modal;
  setTimeout(() => modal.classList.add('open'), 30);

  /* ── حالة الكيبورد ── */
  let text = '';
  let lang = 'en';
  let shift = false;
  const MAX_CHARS = 80;

  const displayText = modal.querySelector(`#kbText_${hex.id}`);
  const charCount = modal.querySelector(`#kbCount_${hex.id}`);
  const keysWrap = modal.querySelector(`#kbKeys_${hex.id}`);

  function updateDisplay() {
    displayText.textContent = text;
    displayText.className = 'kb-display-text ' + (lang === 'ar' ? 'ar' : 'en');
    charCount.textContent = text.length;
  }

  function addChar(c) {
    if (text.length >= MAX_CHARS) return;
    text += c;
    updateDisplay();
  }

  function deleteLast() {
    text = text.slice(0, -1);
    updateDisplay();
  }

  function setLang(l) {
    lang = l; shift = false;
    modal.querySelectorAll('.kb-lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === l);
    });
    buildKeys();
    updateDisplay();
  }

  function buildKeys() {
    keysWrap.innerHTML = '';
    const rows = KB_LAYOUTS[lang];

    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      row.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'kb-key';

        if (k === '⌫') {
          btn.classList.add('kb-del');
          btn.textContent = '⌫';
          btn.addEventListener('pointerdown', e => { e.preventDefault(); deleteLast(); });

        } else if (k === '⇧') {
          btn.classList.add('kb-wide', shift ? 'kb-shift-on' : 'kb-shift');
          btn.textContent = '⇧';
          btn.addEventListener('pointerdown', e => {
            e.preventDefault(); shift = !shift; buildKeys();
          });

        } else if (k === '123') {
          btn.classList.add('kb-wide', 'kb-num-tog');
          btn.textContent = '123';
          btn.addEventListener('pointerdown', e => { e.preventDefault(); setLang('num'); });

        } else if (k === 'EN') {
          btn.classList.add('kb-wide', 'kb-num-tog');
          btn.textContent = 'EN';
          btn.addEventListener('pointerdown', e => { e.preventDefault(); setLang('en'); });

        } else if (k === 'AR') {
          btn.classList.add('kb-wide', 'kb-num-tog');
          btn.textContent = 'ع';
          btn.addEventListener('pointerdown', e => { e.preventDefault(); setLang('ar'); });

        } else if (k === 'space') {
          btn.classList.add('kb-space');
          btn.textContent = lang === 'ar' ? 'مسافة' : 'space';
          btn.addEventListener('pointerdown', e => { e.preventDefault(); addChar(' '); });

        } else {
          if (lang === 'ar') btn.classList.add('kb-ar-font');
          const disp = (shift && lang === 'en') ? k.toUpperCase() : k;
          btn.textContent = disp;
          if (['.', ',', '!', '?', '؟', '-', '/'].includes(k)) btn.style.flex = '0.7';
          btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            addChar((shift && lang === 'en') ? k.toUpperCase() : k);
            if (shift && lang === 'en') { shift = false; buildKeys(); }
          });
        }

        rowEl.appendChild(btn);
      });

      keysWrap.appendChild(rowEl);
    });
  }

  buildKeys();

  modal.querySelectorAll('.kb-lang-btn').forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); setLang(b.dataset.lang); });
  });

  function closeModal() {
    modal.classList.remove('open');
    setTimeout(() => { modal.remove(); delete activeModals[hex.id]; }, 300);
  }

  modal.querySelector('.kb-cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('.kb-submit-btn').addEventListener('click', () => {
    if (!text.trim()) {
      displayText.style.outline = '2px solid rgba(200,50,50,.5)';
      setTimeout(() => displayText.style.outline = '', 1200);
      return;
    }
    greetings[hex.id] = { text: text.trim() };
    saveData(); closeModal(); drawAll(); updateCounter(); showToast();
  });

  modal.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchend', e => e.stopPropagation(), { passive: true });
  modal.addEventListener('mousedown', e => e.stopPropagation());
  modal.addEventListener('click', e => e.stopPropagation());
}

/* ════════════════════════════════════════════════════════════
   READ POPUP
════════════════════════════════════════════════════════════ */
const activeReadPopups = {};

function showRead(hexId) {
  const g = greetings[hexId]; if (!g) return;
  if (activeReadPopups[hexId]) { closeReadPopup(hexId); return; }

  const hex = hexes.find(x => x.id === hexId); if (!hex) return;

  const W = innerWidth, H = innerHeight;
  const mW = Math.min(300, W * 0.26, 300);
  const mH = 180;
  let left, top;

  if (hex.side === 'left') {
    left = Math.max(8, hex.cx + hexR * 1.5);
  } else {
    left = Math.min(W - mW - 8, hex.cx - hexR * 1.5 - mW);
  }
  top = Math.max(8, Math.min(H - mH - 8, hex.cy - mH / 2));

  const popup = document.createElement('div');
  popup.className = 'draw-modal';
  popup.style.cssText = `left:${left}px; top:${top}px; width:${mW}px;`;

  const isAr = /[\u0600-\u06FF]/.test(g.text || '');

  popup.innerHTML = `
    <div class="modal-header"><h2>✦ Greeting</h2></div>
    <div style="
      font-family: ${isAr ? "'Amiri', serif" : "'Tajawal', sans-serif"};
      direction: ${isAr ? 'rtl' : 'ltr'};
      text-align: ${isAr ? 'right' : 'left'};
      font-size: clamp(15px,1.5vw,20px);
      color: #003820;
      padding: 14px 16px;
      background: linear-gradient(135deg,#f0fdf4,#e8f5e9);
      border-radius: 12px;
      border: 1.5px solid rgba(0,154,68,0.2);
      line-height: 1.65;
    ">${g.text || ''}</div>
    <div class="modal-actions">
      <button class="btn btn-secondary read-close-btn">Close ✕</button>
    </div>
  `;

  modalsContainer.appendChild(popup);
  activeReadPopups[hexId] = popup;
  setTimeout(() => popup.classList.add('open'), 30);

  popup.querySelector('.read-close-btn').addEventListener('click', e => {
    e.stopPropagation(); closeReadPopup(hexId);
  });

  popup.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  popup.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
  popup.addEventListener('touchend', e => e.stopPropagation(), { passive: true });
  popup.addEventListener('mousedown', e => e.stopPropagation());
  popup.addEventListener('click', e => e.stopPropagation());
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