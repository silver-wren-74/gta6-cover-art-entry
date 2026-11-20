// Neon Coast Studio — cover rendering engine.
// Pure canvas 2D: panel geometry, per-photo cover-fit framing, colour grades,
// poster lettering, grain and vignette. No libraries, no network.

// ---------- output sizes ----------
export const POST_SIZES = [
  { id: 'square', label: 'Square post · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait post · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide post · 1920 × 1080', w: 1920, h: 1080 },
  { id: 'story', label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
];

// ---------- layouts ----------
// Each layout is a list of panels. A panel is a polygon in normalised
// canvas coordinates (0..1), so one layout works at every post size.
// `tilt` rotates a snapshot-style panel around its own centre.
function rect(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function quad(x0, y0, x1, y1, slant) {
  // A parallelogram-ish panel: top edge shifted by `slant` against the bottom.
  return [[x0 + slant, y0], [x1, y0], [x1 - slant, y1], [x0, y1]];
}

export const LAYOUTS = [
  {
    id: 'hero', name: 'Hero — one big moment',
    panels: () => [rect(0, 0, 1, 1)],
  },
  {
    id: 'duo', name: 'Duo — angled split',
    panels: () => [quad(0, 0, 0.58, 1, 0.06), quad(0.42, 0, 1, 1, 0.06)],
  },
  {
    id: 'trio', name: 'Trio — hero + two beats',
    panels: (ar) => ar >= 1
      ? [rect(0, 0, 0.62, 1), rect(0.62, 0, 0.38, 0.5), rect(0.62, 0.5, 0.38, 0.5)]
      : [rect(0, 0, 1, 0.58), rect(0, 0.58, 0.5, 0.42), rect(0.5, 0.58, 0.5, 0.42)],
  },
  {
    id: 'grid4', name: 'Grid — four panels',
    panels: () => [rect(0, 0, 0.5, 0.5), rect(0.5, 0, 0.5, 0.5), rect(0, 0.5, 0.5, 0.5), rect(0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'cover6', name: 'Cover grid — six panels, title block',
    titleBlock: true,
    panels: () => [
      rect(0, 0.22, 0.34, 0.39), rect(0.34, 0.22, 0.33, 0.39), rect(0.67, 0.22, 0.33, 0.39),
      rect(0, 0.61, 0.34, 0.39), rect(0.34, 0.61, 0.33, 0.39), rect(0.67, 0.61, 0.33, 0.39),
    ],
  },
  {
    id: 'snapshots', name: 'Snapshots — tilted prints',
    panels: () => [
      { poly: rect(0.04, 0.06, 0.52, 0.52), tilt: -0.06 },
      { poly: rect(0.46, 0.30, 0.50, 0.52), tilt: 0.05 },
      { poly: rect(0.10, 0.58, 0.46, 0.36), tilt: 0.03 },
    ],
  },
];

// ---------- colour grades ----------
// `filter` is a CSS filter string applied while the photo is drawn;
// `wash` is a translucent gradient laid over it; `sky` tints the backdrop.
export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.04) hue-rotate(-6deg)',
    wash: ['rgba(255,94,58,0.20)', 'rgba(255,176,66,0.06)', 'rgba(64,16,96,0.28)'],
    sky: ['#2b0f4a', '#7a1e5e', '#e8487a', '#ffb347'],
  },
  {
    id: 'neon', name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.98)',
    wash: ['rgba(0,229,255,0.14)', 'rgba(0,0,0,0)', 'rgba(255,43,214,0.22)'],
    sky: ['#070722', '#131350', '#5e1160', '#0e4d5c'],
  },
  {
    id: 'golden', name: 'Golden Hour',
    filter: 'saturate(1.2) contrast(1.06) brightness(1.1) sepia(0.28)',
    wash: ['rgba(255,190,80,0.22)', 'rgba(255,140,60,0.05)', 'rgba(90,40,10,0.20)'],
    sky: ['#3a1c08', '#8a4a12', '#e88a2e', '#ffd97a'],
  },
  {
    id: 'midnight', name: 'Midnight Teal',
    filter: 'saturate(1.1) contrast(1.22) brightness(0.92) hue-rotate(12deg)',
    wash: ['rgba(0,90,110,0.20)', 'rgba(0,0,0,0.05)', 'rgba(0,20,40,0.34)'],
    sky: ['#02141c', '#06384a', '#0b6e7e', '#37c8b4'],
  },
  {
    id: 'clean', name: 'Clean — photo as shot',
    filter: 'saturate(1.05) contrast(1.03)',
    wash: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.12)'],
    sky: ['#101018', '#23232e', '#3a3a48', '#55555f'],
  },
];

export const TITLE_STYLES = [
  { id: 'sunset-fill', name: 'Sunset gradient' },
  { id: 'white', name: 'Poster white' },
  { id: 'neon-pink', name: 'Neon pink' },
  { id: 'gold', name: 'Gold foil' },
];

const TITLE_FILLS = {
  'sunset-fill': ['#ffe259', '#ffa751', '#ff5e8a'],
  white: ['#ffffff', '#f4f4f4', '#d9d9e2'],
  'neon-pink': ['#ff9de2', '#ff2bd6', '#b026ff'],
  gold: ['#fff3b0', '#ffd23e', '#c98a12'],
};

// ---------- geometry helpers ----------
export function panelBounds(poly) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function tracePath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * W, y * H) : ctx.lineTo(x * W, y * H)));
  ctx.closePath();
}

// Draw `img` into the panel's bounding box with cover-fit framing:
// `frame.zoom` scales past the cover size, `frame.x/y` pan in -1..1.
function drawPhotoInPanel(ctx, img, bounds, W, H, frame, filter) {
  const bw = bounds.w * W, bh = bounds.h * H;
  const cover = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
  const scale = cover * (frame?.zoom ?? 1);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  const cx = bounds.x * W + bw / 2 + (frame?.x ?? 0) * Math.max(0, (dw - bw) / 2);
  const cy = bounds.y * H + bh / 2 + (frame?.y ?? 0) * Math.max(0, (dh - bh) / 2);
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

// ---------- lettering ----------
const HEADLINE_FONT = (px) => `italic 900 ${px}px "Arial Narrow", "Helvetica Neue Condensed", Impact, "Arial Black", sans-serif`;
const SUB_FONT = (px) => `italic 600 ${px}px Georgia, "Times New Roman", serif`;

function fitFontPx(ctx, text, weight, maxWidth, startPx) {
  let px = startPx;
  while (px > 12) {
    ctx.font = HEADLINE_FONT(px);
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= Math.max(2, px * 0.04);
  }
  return px;
}

function drawTitle(ctx, state, W, H, inTitleBlock) {
  const title = (state.title || '').trim();
  const sub = (state.subtitle || '').trim();
  if (!title && !sub) return;
  const cx = W / 2;
  const baseY = inTitleBlock ? H * 0.155 : H * 0.90;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (title) {
    const startPx = Math.min(W * 0.16, H * (inTitleBlock ? 0.15 : 0.13));
    const px = fitFontPx(ctx, title.toUpperCase(), 900, W * 0.92, startPx);
    ctx.font = HEADLINE_FONT(px);
    const grad = ctx.createLinearGradient(0, baseY - px, 0, baseY + px * 0.15);
    const stops = TITLE_FILLS[state.titleStyle] ?? TITLE_FILLS['sunset-fill'];
    stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12041f';
    ctx.lineWidth = px * 0.16;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = px * 0.12;
    ctx.shadowOffsetY = px * 0.05;
    ctx.strokeText(title.toUpperCase(), cx, baseY);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = grad;
    ctx.fillText(title.toUpperCase(), cx, baseY);
  }
  if (sub) {
    const px = Math.min(W * 0.045, H * 0.042);
    ctx.font = SUB_FONT(px);
    const y = inTitleBlock ? baseY + px * 1.7 : baseY + px * 1.9;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,2,20,0.85)';
    ctx.lineWidth = px * 0.22;
    ctx.strokeText(sub, cx, y);
    ctx.fillStyle = '#ffe9f6';
    ctx.fillText(sub, cx, y);
  }
  ctx.restore();
}

// Small original badge: a sun disc + palm-free skyline strip, drawn shapes only.
function drawBadge(ctx, W, H, grade) {
  const r = Math.min(W, H) * 0.045;
  const x = W - r * 1.7, y = H - r * 1.7;
  ctx.save();
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, grade.sky[3]); g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(10,4,24,0.9)';
  for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * r * 0.34 - r * 0.1, y + r * 0.25, r * 0.2, r * 0.75);
  ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#12041f';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Deterministic grain so previews and exports match.
function drawGrain(ctx, W, H, amount) {
  if (!amount) return;
  const step = Math.max(3, Math.round(Math.min(W, H) / 220));
  ctx.save();
  ctx.globalAlpha = 0.05 * amount;
  ctx.fillStyle = '#ffffff';
  let seed = 42;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (rnd() > 0.6) ctx.fillRect(x, y, step * 0.7, step * 0.7);
  ctx.restore();
}

// ---------- the render ----------
// state: { layoutId, gradeId, title, subtitle, titleStyle, sizeId,
//          photos: [HTMLImageElement...], frames: [{x,y,zoom}...],
//          panelPhoto: [photoIndex per panel], grain: 0..2, frame: bool }
export function renderCover(canvas, state) {
  const size = POST_SIZES.find((s) => s.id === state.sizeId) ?? POST_SIZES[0];
  const W = size.w, H = size.h;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS.find((l) => l.id === state.layoutId) ?? LAYOUTS[4];
  const grade = GRADES.find((g) => g.id === state.gradeId) ?? GRADES[0];
  const panels = layout.panels(W / H).map((p) => (Array.isArray(p) ? { poly: p, tilt: 0 } : p));

  // Backdrop: graded sky gradient (shows through gaps and behind snapshots).
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Sun glow low on the horizon.
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.78, 10, W * 0.5, H * 0.78, W * 0.75);
  glow.addColorStop(0, 'rgba(255,190,90,0.5)'); glow.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const photos = state.photos ?? [];
  panels.forEach((panel, i) => {
    const bounds = panelBounds(panel.poly);
    ctx.save();
    if (panel.tilt) {
      const cxp = (bounds.x + bounds.w / 2) * W, cyp = (bounds.y + bounds.h / 2) * H;
      ctx.translate(cxp, cyp); ctx.rotate(panel.tilt); ctx.translate(-cxp, -cyp);
    }
    // White print border for snapshots, ink border otherwise.
    const border = Math.max(4, Math.min(W, H) * (panel.tilt ? 0.014 : 0.008));
    tracePath(ctx, panel.poly, W, H);
    ctx.fillStyle = panel.tilt ? '#fdfdf8' : '#0d0518';
    ctx.fill();
    const inner = panel.poly.map(([x, y]) => {
      const bx = bounds.x + bounds.w / 2, by = bounds.y + bounds.h / 2;
      const sx = (x - bx) * (1 - (border * 2) / (bounds.w * W)) + bx;
      const sy = (y - by) * (1 - (border * 2) / (bounds.h * H)) + by;
      return [sx, sy];
    });
    tracePath(ctx, inner, W, H);
    ctx.clip();
    const photoIdx = state.panelPhoto?.[i] ?? (photos.length ? i % photos.length : -1);
    const img = photoIdx >= 0 ? photos[photoIdx] : null;
    if (img) {
      drawPhotoInPanel(ctx, img, panelBounds(inner), W, H, state.frames?.[i], grade.filter);
      const wash = ctx.createLinearGradient(0, bounds.y * H, 0, (bounds.y + bounds.h) * H);
      wash.addColorStop(0, grade.wash[0]); wash.addColorStop(0.5, grade.wash[1]); wash.addColorStop(1, grade.wash[2]);
      ctx.fillStyle = wash;
      ctx.fillRect(bounds.x * W, bounds.y * H, bounds.w * W, bounds.h * H);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bounds.x * W, bounds.y * H, bounds.w * W, bounds.h * H);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `700 ${Math.round(Math.min(W, H) * 0.035)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', (bounds.x + bounds.w / 2) * W, (bounds.y + bounds.h / 2) * H);
    }
    ctx.restore();
    // Ink outline around the panel.
    ctx.save();
    if (panel.tilt) {
      const cxp = (bounds.x + bounds.w / 2) * W, cyp = (bounds.y + bounds.h / 2) * H;
      ctx.translate(cxp, cyp); ctx.rotate(panel.tilt); ctx.translate(-cxp, -cyp);
    }
    tracePath(ctx, panel.poly, W, H);
    ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
    ctx.strokeStyle = '#0d0518';
    ctx.stroke();
    ctx.restore();
  });

  drawTitle(ctx, state, W, H, !!layout.titleBlock);
  drawBadge(ctx, W, H, grade);
  drawGrain(ctx, W, H, state.grain ?? 1);

  // Vignette.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(5,0,15,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (state.frame !== false) {
    ctx.lineWidth = Math.max(6, Math.min(W, H) * 0.012);
    ctx.strokeStyle = '#0d0518';
    ctx.strokeRect(0, 0, W, H);
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.003);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeRect(ctx.lineWidth * 2, ctx.lineWidth * 2, W - ctx.lineWidth * 4, H - ctx.lineWidth * 4);
  }
  return canvas;
}

export function exportFileName(state) {
  const slug = (state.title || 'neon-coast').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'neon-coast';
  const size = POST_SIZES.find((s) => s.id === state.sizeId) ?? POST_SIZES[0];
  return `${slug}-${size.w}x${size.h}.png`;
}
