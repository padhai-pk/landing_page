// src/lib/shareCard.js
// Draws a professional, user-focused shareable card onto a <canvas>.
// Layout height is measured first (probe pass) so the final card is always
// exactly as tall as its content — no wasted whitespace, no cut-off text.

const THEMES = {
  dark: {
    bgFrom: '#0A121F',
    bgTo: '#101E30',
    glowA: 'rgba(52,211,153,0.16)',
    glowB: 'rgba(229,185,78,0.07)',
    textPrimary: '#F3F6F9',
    textSecondary: '#9FB0C3',
    textMuted: '#71839A',
    accent: '#34D399',
    accentStrong: '#5EEAB8',
    accentText: '#0B1F17',
    chipBg: 'rgba(52,211,153,0.13)',
    chipBorder: 'rgba(52,211,153,0.38)',
    chipText: '#CDF8E6',
    gold: '#E5B94E',
    goldSoft: 'rgba(229,185,78,0.15)',
    goldBorder: 'rgba(229,185,78,0.45)',
    goldText: '#FFF',
    panelBg: 'rgba(255,255,255,0.045)',
    panelBorder: 'rgba(255,255,255,0.10)',
    divider: 'rgba(255,255,255,0.10)',
    avatarRing: '#34D399',
    avatarBg: 'rgba(255,255,255,0.08)',
    cardOuter: 'rgba(0,0,0,0.35)',
    idChipBg: 'rgba(255,255,255,0.06)',
    idChipBorder: 'rgba(255,255,255,0.14)',
  },
  light: {
    bgFrom: '#FFFFFF',
    bgTo: '#EEF5F1',
    glowA: 'rgba(14,159,110,0.10)',
    glowB: 'rgba(184,134,11,0.08)',
    textPrimary: '#101B2A',
    textSecondary: '#4E5F72',
    textMuted: '#77879A',
    accent: '#0E9F6E',
    accentStrong: '#0B8058',
    accentText: '#FFFFFF',
    chipBg: 'rgba(14,159,110,0.09)',
    chipBorder: 'rgba(14,159,110,0.35)',
    chipText: '#0B6B49',
    gold: '#E5B94E',
    goldSoft: 'rgba(184,134,11,0.10)',
    goldBorder: 'rgba(184,134,11,0.35)',
    goldText: '#FFF',
     panelBg: 'rgba(16,27,42,0.035)',
    panelBorder: 'rgba(16,27,42,0.09)',
    divider: 'rgba(16,27,42,0.10)',
    avatarRing: '#0E9F6E',
    avatarBg: 'rgba(16,27,42,0.06)',
    cardOuter: 'rgba(16,27,42,0.12)',
    idChipBg: 'rgba(16,27,42,0.04)',
    idChipBorder: 'rgba(16,27,42,0.12)',
  },
};

const ROLE_VIP_LABEL = {
  student: 'VIP STUDENT',
  teacher: 'VIP TEACHER',
  badge: 'VERIFIED VIP TEACHER',
};

const ROLE_LINE = {
  student: 'Student · Padhai.pk',
  teacher: 'Teacher · Padhai.pk',
  badge: 'Verified Teacher · Padhai.pk',
};

const ROLE_SUBJECTS_LABEL = {
  student: 'LEARNING',
  teacher: 'TEACHING',
  badge: 'TEACHING',
};

// Perks for everyone who joins the waitlist (students & teachers alike).
const WAITLIST_PERKS = [
  'Access to all features before normal users',
  "Free 1-Month Boost worth thousands of Rupees",
  'Free Padhai learning & teaching credits for a month',
];

// Extra perks only for teachers who claimed a free Verified Badge.
const BADGE_PERKS = [
  'Featured teacher profile for 1 month',
  'Free Verified Badge worth Rs. 2,000',
  'First opportunity to teach Padhai.pk\u2019s very first students',
  "Reach more students early — before the platform gets crowded with teachers",
];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const logoCache = {};
function getLogo(theme) {
  const src = theme === 'light' ? '/logo_light.png' : '/logo_dark.png';
  if (!logoCache[src]) logoCache[src] = loadImage(src);
  return logoCache[src];
}
// Warm the cache immediately so the first draw doesn't wait on a cold fetch.
getLogo('dark');
getLogo('light');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dashedRoundRect(ctx, x, y, w, h, r, color, lineWidth, dash) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawImageContain(ctx, img, x, y, w, h, align = 'left') {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let dw, dh;
  if (imgRatio > boxRatio) {
    dw = w;
    dh = w / imgRatio;
  } else {
    dh = h;
    dw = h * imgRatio;
  }
  const dy = y + (h - dh) / 2;
  const dx = align === 'center' ? x + (w - dw) / 2 : x;
  ctx.drawImage(img, dx, dy, dw, dh);
  return dw;
}

// ---- Minimal line-style icon set (kept simple & consistent, no emoji) ----
function iconStrokeStyle(ctx, color, size) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function iconShieldCheck(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 2 * s);
  ctx.lineTo(x + 20 * s, y + 5 * s);
  ctx.lineTo(x + 20 * s, y + 11 * s);
  ctx.bezierCurveTo(x + 20 * s, y + 17 * s, x + 16 * s, y + 21 * s, x + 12 * s, y + 22 * s);
  ctx.bezierCurveTo(x + 8 * s, y + 21 * s, x + 4 * s, y + 17 * s, x + 4 * s, y + 11 * s);
  ctx.lineTo(x + 4 * s, y + 5 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8.3 * s, y + 12 * s);
  ctx.lineTo(x + 10.8 * s, y + 14.5 * s);
  ctx.lineTo(x + 15.7 * s, y + 8.8 * s);
  ctx.stroke();
}

function iconCheckCircle(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 12 * s, 9.5 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 7.7 * s, y + 12.3 * s);
  ctx.lineTo(x + 10.5 * s, y + 15 * s);
  ctx.lineTo(x + 16.3 * s, y + 8.8 * s);
  ctx.stroke();
}

function iconGift(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  roundRect(ctx, x + 3 * s, y + 10 * s, 18 * s, 11 * s, 1.4 * s);
  ctx.stroke();
  roundRect(ctx, x + 1.5 * s, y + 6.5 * s, 21 * s, 4 * s, 1 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 6.5 * s);
  ctx.lineTo(x + 12 * s, y + 21 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 6.5 * s);
  ctx.bezierCurveTo(x + 5.5 * s, y + 6.5 * s, x + 5.5 * s, y + 0.5 * s, x + 9.5 * s, y + 1.5 * s);
  ctx.bezierCurveTo(x + 11.5 * s, y + 2 * s, x + 12 * s, y + 4.5 * s, x + 12 * s, y + 6.5 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 6.5 * s);
  ctx.bezierCurveTo(x + 18.5 * s, y + 6.5 * s, x + 18.5 * s, y + 0.5 * s, x + 14.5 * s, y + 1.5 * s);
  ctx.bezierCurveTo(x + 12.5 * s, y + 2 * s, x + 12 * s, y + 4.5 * s, x + 12 * s, y + 6.5 * s);
  ctx.stroke();
}

function iconCamera(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  roundRect(ctx, x + 2 * s, y + 7 * s, 20 * s, 13 * s, 2.2 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8 * s, y + 7 * s);
  ctx.lineTo(x + 9.6 * s, y + 4.3 * s);
  ctx.lineTo(x + 14.4 * s, y + 4.3 * s);
  ctx.lineTo(x + 16 * s, y + 7 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 14 * s, 4.1 * s, 0, Math.PI * 2);
  ctx.stroke();
}

function iconPlusCircle(ctx, x, y, size, bg, fg) {
  const s = size / 24;
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 12 * s, 11 * s, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  iconStrokeStyle(ctx, fg, size);
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 7 * s);
  ctx.lineTo(x + 12 * s, y + 17 * s);
  ctx.moveTo(x + 7 * s, y + 12 * s);
  ctx.lineTo(x + 17 * s, y + 12 * s);
  ctx.stroke();
}

function iconAward(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 8 * s, 6.2 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 9.2 * s, y + 8.1 * s);
  ctx.lineTo(x + 11.2 * s, y + 10.1 * s);
  ctx.lineTo(x + 15.1 * s, y + 5.6 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8.7 * s, y + 13 * s);
  ctx.lineTo(x + 6.7 * s, y + 21.5 * s);
  ctx.lineTo(x + 12 * s, y + 18.3 * s);
  ctx.lineTo(x + 17.3 * s, y + 21.5 * s);
  ctx.lineTo(x + 15.3 * s, y + 13 * s);
  ctx.stroke();
}

function iconTag(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.moveTo(x + 3 * s, y + 12 * s);
  ctx.lineTo(x + 3 * s, y + 4 * s);
  ctx.lineTo(x + 11 * s, y + 4 * s);
  ctx.lineTo(x + 21 * s, y + 14 * s);
  ctx.lineTo(x + 13 * s, y + 22 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 7.5 * s, y + 8.5 * s, 1.3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function iconHash(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.moveTo(x + 5 * s, y + 9 * s);
  ctx.lineTo(x + 19 * s, y + 9 * s);
  ctx.moveTo(x + 4 * s, y + 15 * s);
  ctx.lineTo(x + 18 * s, y + 15 * s);
  ctx.moveTo(x + 10 * s, y + 4 * s);
  ctx.lineTo(x + 8 * s, y + 20 * s);
  ctx.moveTo(x + 16 * s, y + 4 * s);
  ctx.lineTo(x + 14 * s, y + 20 * s);
  ctx.stroke();
}

function iconArrowRight(ctx, x, y, size, color) {
  const s = size / 24;
  iconStrokeStyle(ctx, color, size);
  ctx.beginPath();
  ctx.moveTo(x + 4 * s, y + 12 * s);
  ctx.lineTo(x + 20 * s, y + 12 * s);
  ctx.moveTo(x + 14 * s, y + 6 * s);
  ctx.lineTo(x + 20 * s, y + 12 * s);
  ctx.lineTo(x + 14 * s, y + 18 * s);
  ctx.stroke();
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedCenter(ctx, text, cx, y, maxWidth, lineHeight) {
  const lines = wrapLines(ctx, text, maxWidth);
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
  ctx.textAlign = prevAlign;
  return lines.length;
}

// Wraps pill-shaped subject chips into centered rows. Returns the y just
// below the last row.
function drawChipsCentered(ctx, items, W, y, maxWidth, theme) {
  const chipH = 50;
  const gapX = 12;
  const gapY = 14;
  const paddingX = 22;
  ctx.font = '600 23px "Poppins", sans-serif';

  const rows = [];
  let row = [];
  let rowWidth = 0;
  items.forEach((text) => {
    const w = ctx.measureText(text).width + paddingX * 2;
    const extra = row.length ? gapX : 0;
    if (rowWidth + w + extra > maxWidth && row.length) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }
    row.push({ text, w });
    rowWidth += w + (row.length > 1 ? gapX : 0);
  });
  if (row.length) rows.push(row);

  let cursorY = y;
  rows.forEach((r) => {
    const totalW = r.reduce((s, c) => s + c.w, 0) + gapX * (r.length - 1);
    let x = (W - totalW) / 2;
    r.forEach((c) => {
      ctx.fillStyle = theme.chipBg;
      roundRect(ctx, x, cursorY, c.w, chipH, chipH / 2);
      ctx.fill();
      ctx.strokeStyle = theme.chipBorder;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, cursorY, c.w, chipH, chipH / 2);
      ctx.stroke();
      ctx.fillStyle = theme.chipText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.text, x + c.w / 2, cursorY + chipH / 2 + 1);
      x += c.w + gapX;
    });
    cursorY += chipH + gapY;
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return cursorY - gapY + chipH;
}

// Renders the whole card top-to-bottom and returns layout info — used both
// to measure (probe pass) and to draw (real pass).
function renderCard(ctx, W, H, opts) {
  const { name, role, waitlistId, subjects, badgeSubjects, avatarImage, cardTheme, logoImg, interactive = false } = opts;
  const theme = THEMES[cardTheme] || THEMES.dark;
  const safeRole = ROLE_VIP_LABEL[role] ? role : 'student';
  const M = 68;
  const CW = W - M * 2;

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, theme.bgFrom);
  grad.addColorStop(1, theme.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.88, H * 0.05, 0, W * 0.88, H * 0.05, W * 0.65);
  glow.addColorStop(0, theme.glowA);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.06, H * 0.97, 0, W * 0.06, H * 0.97, W * 0.55);
  glow2.addColorStop(0, theme.glowB);
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Header: real logo (left), VIP ribbon (right)
  const logoH = 44;
  if (logoImg) {
    drawImageContain(ctx, logoImg, M, 54, 200, logoH);
  } else {
    ctx.fillStyle = theme.textPrimary;
    ctx.font = '700 32px "Space Grotesk", sans-serif';
    ctx.fillText('Padhai.pk', M, 90);
  }

  const vipLabel = ROLE_VIP_LABEL[safeRole];
  ctx.font = '700 21px "Poppins", sans-serif';
  const vipTextWidth = ctx.measureText(vipLabel).width;
  const iconGap = 8;
  const vipIconSize = 24;
  const vipPillW = vipTextWidth + vipIconSize + iconGap + 44;
  const vipPillX = W - M - vipPillW;
  const vipGrad = ctx.createLinearGradient(vipPillX, 0, vipPillX + vipPillW, 0);
  vipGrad.addColorStop(0, theme.gold);
  vipGrad.addColorStop(1, cardTheme === 'light' ? '#fca311' : '#fca311');
  ctx.fillStyle = vipGrad;
  roundRect(ctx, vipPillX, 54, vipPillW, 48, 24);
  ctx.fill();
  iconShieldCheck(ctx, vipPillX + 20, 66, vipIconSize, theme.goldText);
  ctx.fillStyle = theme.goldText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(vipLabel, vipPillX + 20 + vipIconSize + iconGap, 54 + 25);
  ctx.textBaseline = 'alphabetic';

  let y = 196;

  // Avatar — interactive preview shows upload affordance; export shows initial only.
  const avatarR = 105;
  const cx = W / 2;
  const cy = y + avatarR;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
  ctx.closePath();
  if (avatarImage) {
    ctx.clip();
    drawImageCover(ctx, avatarImage, cx - avatarR, cy - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, avatarR + 5, 0, Math.PI * 2);
    ctx.strokeStyle = theme.avatarRing;
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (interactive) {
    ctx.fillStyle = theme.avatarBg;
    ctx.fill();
    ctx.restore();
    dashedRoundRect(ctx, cx - avatarR, cy - avatarR, avatarR * 2, avatarR * 2, avatarR, theme.avatarRing, 3, [10, 8]);
    iconCamera(ctx, cx - 22, cy - 28, 44, theme.textSecondary);
    ctx.font = '600 18px "Poppins", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add Photo', cx, cy + 28);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  } else {
    ctx.fillStyle = theme.avatarBg;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '700 66px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name || 'P').trim().charAt(0).toUpperCase(), cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, avatarR + 5, 0, Math.PI * 2);
    ctx.strokeStyle = theme.avatarRing;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const avatarBox = interactive && !avatarImage ? { cx, cy, r: avatarR } : null;

  y = cy + avatarR + 50;

  // Name + role line
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.textPrimary;
  ctx.font = '700 50px "Space Grotesk", sans-serif';
  ctx.fillText(name || 'A new member', cx, y);
  y += 42;

  ctx.font = '600 28px "Poppins", sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.fillText(ROLE_LINE[safeRole], cx, y);
  y += 40;
  ctx.textAlign = 'left';

  // Waitlist ID chip — kept visible so the person can quote it if needed;
  // the same id is the one saved server-side for admin review.
  if (waitlistId) {
    const idText = `WAITLIST ID · ${waitlistId}`;
    ctx.font = '600 20px "Space Mono", "Poppins", monospace';
    const idTextW = ctx.measureText(idText).width;
    const idIconSize = 18;
    const idPillW = idTextW + idIconSize + 34;
    const idPillX = cx - idPillW / 2;
    ctx.fillStyle = theme.idChipBg;
    roundRect(ctx, idPillX, y, idPillW, 40, 20);
    ctx.fill();
    ctx.strokeStyle = theme.idChipBorder;
    ctx.lineWidth = 1.2;
    roundRect(ctx, idPillX, y, idPillW, 40, 20);
    ctx.stroke();
    iconHash(ctx, idPillX + 12, y + 11, idIconSize, theme.textMuted);
    ctx.fillStyle = theme.textMuted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(idText, idPillX + 12 + idIconSize + 6, y + 21);
    ctx.textBaseline = 'alphabetic';
    y += 40 + 28;
  }

  // Free badge claimed banner
  if (badgeSubjects && badgeSubjects.length) {
    ctx.font = '600 24px "Poppins", sans-serif';
    const text = `Free Verified Badge claimed for ${badgeSubjects.join(', ')}`;
    const textMaxW = CW - 100;
    const lines = wrapLines(ctx, text, textMaxW);
    const bannerH = 34 + lines.length * 32;
    ctx.fillStyle = theme.goldSoft;
    roundRect(ctx, M, y, CW, bannerH, 18);
    ctx.fill();
    ctx.strokeStyle = theme.goldBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, M, y, CW, bannerH, 18);
    ctx.stroke();
    iconAward(ctx, M + 22, y + bannerH / 2 - 14, 28, theme.gold);
    ctx.fillStyle = theme.gold;
    drawWrappedCenter(ctx, text, cx + 16, y + 30, textMaxW - 40, 32);
    y += bannerH + 30;
  }

  // Subjects
  if (subjects && subjects.length) {
    ctx.font = '700 21px "Poppins", sans-serif';
    ctx.fillStyle = theme.textMuted;
    const label = ROLE_SUBJECTS_LABEL[safeRole];
    const labelW = ctx.measureText(label).width;
    iconTag(ctx, cx - labelW / 2 - 26, y - 16, 18, theme.textMuted);
    ctx.textAlign = 'center';
    ctx.fillText(label, cx + 8, y);
    ctx.textAlign = 'left';
    y += 34;
    const shown = subjects.slice(0, 6);
    const extra = subjects.length - shown.length;
    const chipItems = extra > 0 ? [...shown, `+${extra} more`] : shown;
    y = drawChipsCentered(ctx, chipItems, W, y, CW, theme);
    y += 34;
  } else {
    ctx.font = '500 22px "Poppins", sans-serif';
    ctx.fillStyle = theme.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('No subjects added yet', cx, y);
    ctx.textAlign = 'left';
    y += 40;
  }

  // Perks panel — different copy for badge teachers vs everyone else
  const perks = safeRole === 'badge' ? BADGE_PERKS : WAITLIST_PERKS;
  const perksHeading = safeRole === 'badge' ? 'Your free Verified Badge perks' : 'Free perks for joining early';
  const panelPad = 32;
  const headingH = 42;
  const lineH = 36;

  ctx.font = '500 24px "Poppins", sans-serif';
  const perkLineWidth = CW - panelPad * 2 - 40;
  let perkTotalLines = 0;
  const perkWraps = perks.map((b) => {
    const lines = wrapLines(ctx, b, perkLineWidth);
    perkTotalLines += lines.length;
    return lines;
  });

  const panelH = panelPad * 2 + headingH + perkTotalLines * lineH + (perks.length - 1) * 8;
  ctx.fillStyle = theme.panelBg;
  roundRect(ctx, M, y, CW, panelH, 20);
  ctx.fill();
  ctx.strokeStyle = theme.panelBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, M, y, CW, panelH, 20);
  ctx.stroke();

  ctx.fillStyle = theme.textPrimary;
  ctx.font = '700 26px "Space Grotesk", sans-serif';
  ctx.fillText(perksHeading, M + panelPad, y + panelPad + 22);

  let by = y + panelPad + headingH + 18;
  perkWraps.forEach((lines) => {
    iconCheckCircle(ctx, M + panelPad, by - 17, 22, theme.accent);
    ctx.font = '500 24px "Poppins", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    lines.forEach((l, i) => ctx.fillText(l, M + panelPad + 34, by + i * lineH));
    by += lines.length * lineH + 8;
  });
  y += panelH + 32;

  // Join CTA — turns viewers of the card into new waitlist signups
  ctx.font = '500 23px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  const joinText = 'Not on Padhai.pk yet? Join the waitlist to unlock these free features too.';
  ctx.fillStyle = theme.textSecondary;
  const jLines = wrapLines(ctx, joinText, CW - 20);
  jLines.forEach((l, i) => ctx.fillText(l, cx, y + i * 30));
  y += jLines.length * 30 + 10;
  ctx.font = '700 24px "Poppins", sans-serif';
  ctx.fillStyle = theme.accent;
  const ctaLabel = 'www.padhai.pk';
  const ctaW = ctx.measureText(ctaLabel).width;
  ctx.fillText(ctaLabel, cx + 14, y);
  ctx.textAlign = 'left';
  y += 44;

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '400 24px "Poppins", sans-serif';
  ctx.fillStyle = theme.textMuted;
  ctx.fillText('Padhna ho ya Padhana, sirf Padhai.pk pr aana.', cx, y);
  ctx.textAlign = 'left';

  y += 46;
  return { height: y, avatarBox };
}

export async function drawShareCard(canvas, {
  name,
  role,
  waitlistId = '',
  subjects = [],
  badgeSubjects = [],
  avatarImage = null,
  cardTheme = 'dark',
  interactive = false,
} = {}) {
  const W = 1080;
  const logoImg = await getLogo(cardTheme);
  const args = { name, role, waitlistId, subjects, badgeSubjects, avatarImage, cardTheme, logoImg, interactive };

  // Probe pass on an offscreen canvas to measure the real content height —
  // keeps the card exactly as tall as it needs to be, so it always fits
  // the viewport without scrolling.
  const probe = document.createElement('canvas');
  probe.width = W;
  probe.height = 2600;
  const measured = renderCard(probe.getContext('2d'), W, probe.height, args);

  const H = Math.ceil(measured.height);
  canvas.width = W;
  canvas.height = H;
  const result = renderCard(canvas.getContext('2d'), W, H, args);
  return { width: W, height: H, avatarBox: result.avatarBox };
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

/** Draw an export-ready card (initial letter, no upload affordance) and return PNG blob. */
export async function renderShareCardBlob(cardArgs) {
  const offscreen = document.createElement('canvas');
  await drawShareCard(offscreen, { ...cardArgs, interactive: false });
  return canvasToBlob(offscreen);
}
