/* ════════════════════════════════════════════════════════════
   floatCanvas.js — Floating Shapes: hexagons + crescents + stars
════════════════════════════════════════════════════════════ */

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
  const goldPalette = [
    'rgba(200,146,10,',
    'rgba(220,170,20,',
    'rgba(180,130,5,',
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

  function drawCrescent(ctx, cx, cy, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const outerR = r;
    const innerR = r * 0.82;
    const offset = r * 0.52;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fillStyle = color + alpha.toFixed(2) + ')';
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(offset, 0, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  function spawn() {
    const roll = Math.random();
    const type = roll < 0.50 ? 'hex' : roll < 0.75 ? 'crescent' : 'star';
    const isGold = type !== 'hex';
    const pal = isGold ? goldPalette : palette;
    const r = type === 'hex' ? Math.random() * 12 + 6
            : type === 'crescent' ? Math.random() * 10 + 7
            : Math.random() * 7 + 4;
    return {
      type, x: Math.random() * fc.width, y: fc.height + r * 2,
      r, vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.45 + 0.15),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * (type === 'crescent' ? 0.006 : 0.013),
      alpha: 0,
      maxAlpha: isGold ? Math.random() * 0.22 + 0.08 : Math.random() * 0.18 + 0.06,
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