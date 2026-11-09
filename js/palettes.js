/**
 * AETHER-VJ: Curated Cosine Gradient Palettes (Inigo Quilez Mathematical Model)
 * Formula: color(t) = a + b * cos(6.28318 * (c * t + d))
 * Designed for high-contrast LED walls, laser projection, and Resolume luma/alpha keying.
 */

export const PALETTES = [
  {
    id: 0,
    name: 'CYBERPUNK',
    code: 'CYB-01',
    a: [0.42, 0.28, 0.62],
    b: [0.45, 0.38, 0.38],
    c: [0.85, 0.75, 0.85],
    d: [0.00, 0.22, 0.45],
    preview: ['#ff007f', '#7900ff', '#00f0ff']
  },
  {
    id: 1,
    name: 'TECHNO MONOCHROME',
    code: 'MNO-02',
    a: [0.52, 0.52, 0.55],
    b: [0.48, 0.48, 0.48],
    c: [1.00, 1.00, 1.00],
    d: [0.00, 0.00, 0.02],
    preview: ['#1a1a1f', '#8e9299', '#ffffff']
  },
  {
    id: 2,
    name: 'ACID GREEN',
    code: 'ACD-03',
    a: [0.35, 0.65, 0.20],
    b: [0.45, 0.45, 0.30],
    c: [1.00, 1.00, 0.50],
    d: [0.25, 0.00, 0.60],
    preview: ['#0c2e00', '#39ff14', '#d4ff00']
  },
  {
    id: 3,
    name: 'SUNSET IBIZA',
    code: 'IBZ-04',
    a: [0.60, 0.35, 0.45],
    b: [0.45, 0.40, 0.40],
    c: [1.00, 1.00, 1.00],
    d: [0.00, 0.18, 0.42],
    preview: ['#ff2a54', '#ff9900', '#601878']
  },
  {
    id: 4,
    name: 'ICE BLUE',
    code: 'ICE-05',
    a: [0.30, 0.55, 0.72],
    b: [0.35, 0.42, 0.35],
    c: [1.00, 1.00, 1.00],
    d: [0.52, 0.58, 0.65],
    preview: ['#051c38', '#00bfff', '#e0ffff']
  },
  {
    id: 5,
    name: 'INFERNO',
    code: 'INF-06',
    a: [0.58, 0.25, 0.08],
    b: [0.48, 0.38, 0.22],
    c: [1.00, 0.85, 0.60],
    d: [0.00, 0.12, 0.28],
    preview: ['#4a0000', '#ff3c00', '#ffcc00']
  },
  {
    id: 6,
    name: 'GOLD LUXURY',
    code: 'GLD-07',
    a: [0.58, 0.46, 0.24],
    b: [0.42, 0.38, 0.24],
    c: [1.00, 1.00, 0.80],
    d: [0.02, 0.08, 0.20],
    preview: ['#2b1d03', '#d4af37', '#fff1b5']
  },
  {
    id: 7,
    name: 'ULTRAVIOLET',
    code: 'UVX-08',
    a: [0.45, 0.22, 0.68],
    b: [0.45, 0.32, 0.42],
    c: [1.00, 1.00, 1.00],
    d: [0.75, 0.90, 0.55],
    preview: ['#20004d', '#9d00ff', '#ff00c8']
  },
  {
    id: 8,
    name: 'MATRIX',
    code: 'MTX-09',
    a: [0.15, 0.58, 0.28],
    b: [0.22, 0.45, 0.25],
    c: [0.80, 1.00, 0.80],
    d: [0.35, 0.00, 0.30],
    preview: ['#001a06', '#00ff41', '#88ffaa']
  },
  {
    id: 9,
    name: 'INDUSTRIAL RED',
    code: 'IND-10',
    a: [0.55, 0.10, 0.12],
    b: [0.48, 0.16, 0.16],
    c: [1.00, 0.70, 0.70],
    d: [0.00, 0.05, 0.08],
    preview: ['#1a0002', '#e60012', '#ff5533']
  }
];

/**
 * Linearly interpolates between two palette coefficient sets (for smooth palette morphing)
 * Writes directly into pre-allocated Float32Arrays to avoid GC pressure during 8h sessions.
 */
export function interpolatePalette(palA, palB, mix, outA, outB, outC, outD) {
  const inv = 1.0 - mix;
  for (let i = 0; i < 3; i++) {
    outA[i] = palA.a[i] * inv + palB.a[i] * mix;
    outB[i] = palA.b[i] * inv + palB.b[i] * mix;
    outC[i] = palA.c[i] * inv + palB.c[i] * mix;
    outD[i] = palA.d[i] * inv + palB.d[i] * mix;
  }
}

/**
 * Evaluates a palette in JS for UI swatch/LED color feedback
 */
export function samplePaletteHex(paletteIndex, t) {
  const p = PALETTES[paletteIndex] || PALETTES[0];
  const TAU = 6.28318530718;
  const r = Math.min(255, Math.max(0, Math.round((p.a[0] + p.b[0] * Math.cos(TAU * (p.c[0] * t + p.d[0]))) * 255)));
  const g = Math.min(255, Math.max(0, Math.round((p.a[1] + p.b[1] * Math.cos(TAU * (p.c[1] * t + p.d[1]))) * 255)));
  const b = Math.min(255, Math.max(0, Math.round((p.a[2] + p.b[2] * Math.cos(TAU * (p.c[2] * t + p.d[2]))) * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}
