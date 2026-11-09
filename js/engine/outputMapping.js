/**
 * AETHER-VJ: Mapeo de salida avanzado
 * - Corner-pin (homografía de 4 esquinas) para encajar la imagen en cualquier superficie inclinada.
 * - Utilidades puras (sin DOM) para poder probarlas en Node.
 */

/**
 * Homografía que lleva el cuadrado unidad (0,0),(1,0),(1,1),(0,1) a las 4 esquinas dadas.
 * Devuelve la matriz 3x3 por filas [a,b,c,d,e,f,g,h,1].
 */
export function squareToQuad(corners) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = corners;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, h;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0; b = x2 - x1; c = x0;
    d = y1 - y0; e = y2 - y1; f = y0;
    g = 0; h = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) < 1e-12) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; c = x0;
    d = y1 - y0 + g * y1; e = y3 - y0 + h * y3; f = y0;
  }
  return [a, b, c, d, e, f, g, h, 1];
}

export function invert3x3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [
    A * inv, -(b * i - c * h) * inv, (b * f - c * e) * inv,
    B * inv, (a * i - c * g) * inv, -(a * f - c * d) * inv,
    C * inv, -(a * h - b * g) * inv, (a * e - b * d) * inv
  ];
}

export function applyHomography(m, x, y) {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w, w];
}

/**
 * Escribe en `out` (Float32Array(9), orden por columnas para uniformMatrix3fv) la matriz
 * pantalla → imagen para las esquinas dadas. Devuelve false si las esquinas son degeneradas.
 */
export function writeCornerPinMatrix(corners, out) {
  const fwd = Array.isArray(corners) && corners.length === 4 ? squareToQuad(corners) : null;
  const inv = fwd ? invert3x3(fwd) : null;
  if (!inv) {
    out.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    return false;
  }
  // Por filas -> por columnas
  out[0] = inv[0]; out[1] = inv[3]; out[2] = inv[6];
  out[3] = inv[1]; out[4] = inv[4]; out[5] = inv[7];
  out[6] = inv[2]; out[7] = inv[5]; out[8] = inv[8];
  return true;
}

export function cornersKey(corners) {
  if (!Array.isArray(corners)) return '';
  let s = '';
  for (const p of corners) s += (p && p[0]) + ',' + (p && p[1]) + ';';
  return s;
}
