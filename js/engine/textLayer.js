/**
 * AETHER-VJ: Generador de textura de texto
 * Dibuja el texto (1-3 líneas) en blanco sobre transparente; el shader le aplica color, halo, glitch, ticker, onda, 3D...
 */

import { TEXT_FONTS } from '../state.js';

const BASE_FONT_PX = 170;
const MAX_CANVAS_W = 4096;

export function renderTextCanvas(canvas, content, fontIndex) {
  const fontDef = TEXT_FONTS[fontIndex] || TEXT_FONTS[0];
  const lines = String(content || '')
    .slice(0, 140)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 3);
  if (lines.length === 0) lines.push(' ');

  const ctx = canvas.getContext('2d');
  let fontPx = BASE_FONT_PX;
  const fontFor = (px) => fontDef.css.replace('{px}', String(px));

  ctx.font = fontFor(fontPx);
  let maxW = 1;
  for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);

  let pad = Math.round(fontPx * 0.28);
  if (maxW + pad * 2 > MAX_CANVAS_W) {
    fontPx = Math.max(40, Math.floor(fontPx * (MAX_CANVAS_W - pad * 2) / maxW));
    ctx.font = fontFor(fontPx);
    maxW = 1;
    for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
    pad = Math.round(fontPx * 0.28);
  }

  const lineH = Math.round(fontPx * 1.12);
  const w = Math.min(MAX_CANVAS_W, Math.ceil(maxW + pad * 2));
  const h = Math.ceil(lineH * lines.length + pad * 2);
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.font = fontFor(fontPx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.lineJoin = 'round';
  for (let i = 0; i < lines.length; i++) {
    const y = pad + lineH * (i + 0.5);
    ctx.fillText(lines[i], w / 2, y);
  }
  return w / h;
}
