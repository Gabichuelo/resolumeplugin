/**
 * AETHER-VJ: Logo inteligente
 * - Acepta PNG, JPG, WEBP y SVG (se rasteriza a alta resolución).
 * - Quita el fondo blanco / negro / de color uniforme con borde suave y sin halo (descontaminación de color).
 * - Recorta automáticamente el espacio vacío alrededor y limita a 1024 px para que la GPU vaya fluida.
 */

const MAX_SIDE = 1024;
const MIN_SVG_SIDE = 1024;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen del logo.'));
    img.src = src;
  });
}

function isSvgDataUrl(dataUrl) {
  return /^data:image\/svg\+xml/i.test(dataUrl);
}

/**
 * Analiza el borde de la imagen: devuelve si ya es transparente y el color medio del fondo si es uniforme.
 */
function analyzeBorder(data, w, h) {
  let count = 0;
  let transparent = 0;
  let sr = 0, sg = 0, sb = 0;
  const samples = [];
  const step = Math.max(1, Math.floor((w + h) / 400));
  const visit = (x, y) => {
    const i = (y * w + x) * 4;
    count++;
    if (data[i + 3] < 200) {
      transparent++;
      return;
    }
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
    samples.push(i);
  };
  for (let x = 0; x < w; x += step) { visit(x, 0); visit(x, h - 1); }
  for (let y = 0; y < h; y += step) { visit(0, y); visit(w - 1, y); }

  const opaque = samples.length;
  const transparentRatio = count > 0 ? transparent / count : 0;
  if (opaque === 0) return { transparentRatio, uniform: false, bg: null };

  const bg = [sr / opaque, sg / opaque, sb / opaque];
  let close = 0;
  for (const i of samples) {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    if (Math.sqrt(dr * dr + dg * dg + db * db) < 40) close++;
  }
  return { transparentRatio, uniform: close / opaque > 0.85, bg };
}

function keyOutBackground(data, bg, tolLow = 22, tolHigh = 70) {
  const [br, bgc, bb] = bg;
  for (let i = 0; i < data.length; i += 4) {
    const a0 = data[i + 3];
    if (a0 === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dr = r - br, dg = g - bgc, db = b - bb;
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    if (d <= tolLow) {
      data[i + 3] = 0;
      continue;
    }
    if (d >= tolHigh) continue;
    // Borde antialias: alfa suave + recuperar el color real del logo sin el halo del fondo
    let t = (d - tolLow) / (tolHigh - tolLow);
    t = t * t * (3 - 2 * t);
    const a = Math.max(0.02, t);
    data[i] = Math.max(0, Math.min(255, (r - br * (1 - a)) / a));
    data[i + 1] = Math.max(0, Math.min(255, (g - bgc * (1 - a)) / a));
    data[i + 2] = Math.max(0, Math.min(255, (b - bb * (1 - a)) / a));
    data[i + 3] = Math.round(a0 * a);
  }
}

function findOpaqueBounds(data, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

/**
 * @param {string} dataUrl  Imagen original (PNG/JPG/WEBP/SVG en dataURL)
 * @param {'auto'|'white'|'black'|'none'} mode
 * @returns {Promise<{dataUrl: string, aspect: number, removed: boolean}>}
 */
export async function processLogoDataUrl(dataUrl, mode = 'auto') {
  const img = await loadImage(dataUrl);
  let srcW = img.naturalWidth || img.width;
  let srcH = img.naturalHeight || img.height;
  const svg = isSvgDataUrl(dataUrl);
  if (!srcW || !srcH) {
    // SVG sin tamaño declarado
    srcW = 1024;
    srcH = 512;
  }

  let scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
  if (svg) scale = MIN_SVG_SIDE / Math.max(srcW, srcH); // Vectorial: siempre nítido a 1024 px
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  let removed = false;

  if (mode !== 'none') {
    const info = analyzeBorder(data, w, h);
    let bg = null;
    if (mode === 'white') bg = [255, 255, 255];
    else if (mode === 'black') bg = [0, 0, 0];
    else if (info.transparentRatio < 0.5 && info.uniform) bg = info.bg; // auto: solo si el fondo es liso
    if (bg) {
      keyOutBackground(data, bg);
      removed = true;
    }
  }

  // Recorte automático del espacio vacío (con un pequeño margen para los halos/neón)
  const bounds = findOpaqueBounds(data, w, h);
  ctx.putImageData(imgData, 0, 0);
  if (!bounds) {
    return { dataUrl: canvas.toDataURL('image/png'), aspect: w / h, removed };
  }
  const bw = bounds.maxX - bounds.minX + 1;
  const bh = bounds.maxY - bounds.minY + 1;
  const pad = Math.round(Math.max(bw, bh) * 0.04);
  const cx = Math.max(0, bounds.minX - pad);
  const cy = Math.max(0, bounds.minY - pad);
  const cw = Math.min(w - cx, bw + pad * 2);
  const ch = Math.min(h - cy, bh + pad * 2);

  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  return { dataUrl: out.toDataURL('image/png'), aspect: cw / ch, removed };
}
