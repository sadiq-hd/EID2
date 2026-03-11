/* ============================================================
   عيد الفطر المبارك — Research and Innovation Complex
   script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* 1 ── HIJRI DATE ──────────────────────────────────────── */
  try {
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    const el = document.getElementById('hijriDate');
    if (el) el.textContent = hijri + ' هـ';
  } catch(e) { /* fallback text stays */ }

  /* 2 ── FLOATING PARTICLES ─────────────────────────────── */
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = [
    'rgba(158,212,74,0.65)',
    'rgba(92,200,160,0.65)',
    'rgba(58,191,184,0.65)',
    'rgba(91,174,232,0.65)',
    'rgba(255,255,255,0.75)',
  ];

  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size  = Math.random() * 5 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      left:               ${Math.random() * 100}%;
      bottom:             ${Math.random() * 30}%;
      width:              ${size}px;
      height:             ${size}px;
      background:         ${color};
      box-shadow:         0 0 ${size * 2.5}px ${color};
      animation-duration: ${Math.random() * 14 + 8}s;
      animation-delay:    ${Math.random() * 12}s;
      opacity: 0;
    `;
    container.appendChild(p);
  }
});