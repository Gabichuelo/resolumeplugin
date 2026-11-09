/**
 * AETHER-VJ: Compiled Standalone Production Bundle (file:// & http:// compatible)
 * Generated from modular source files in /js
 */
(function() {
'use strict';

// ==================== MODULE: js/palettes.js ====================
/**
 * AETHER-VJ: Curated Cosine Gradient Palettes (Inigo Quilez Mathematical Model)
 * Formula: color(t) = a + b * cos(6.28318 * (c * t + d))
 * Designed for high-contrast LED walls, laser projection, and Resolume luma/alpha keying.
 */
const PALETTES = [
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
function interpolatePalette(palA, palB, mix, outA, outB, outC, outD) {
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
function samplePaletteHex(paletteIndex, t) {
  const p = PALETTES[paletteIndex] || PALETTES[0];
  const TAU = 6.28318530718;
  const r = Math.min(255, Math.max(0, Math.round((p.a[0] + p.b[0] * Math.cos(TAU * (p.c[0] * t + p.d[0]))) * 255)));
  const g = Math.min(255, Math.max(0, Math.round((p.a[1] + p.b[1] * Math.cos(TAU * (p.c[1] * t + p.d[1]))) * 255)));
  const b = Math.min(255, Math.max(0, Math.round((p.a[2] + p.b[2] * Math.cos(TAU * (p.c[2] * t + p.d[2]))) * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}


// ==================== MODULE: js/state.js ====================
/**
 * AETHER-VJ: Central Reactive State & Metadata Store (Edición Evento Elegante & Intuitiva)
 * Incluye 32 Generadores Algorítmicos GLSL divididos en 4 Familias claras:
 *   - BANCO C (16..23) [FLT]: Geometría Plana Pura (Sin Brillo / Sin Efectos, trazos y bloques limpios)
 *   - BANCO A (0..7)   [GEO]: Formas Geométricas 2D (Cuadrados, Triángulos, Polígonos)
 *   - BANCO B (8..15)  [KIN]: Líneas Dinámicas (Fino ⟷ Grueso) y Barridos Izq ➔ Der
 *   - BANCO D (24..31) [SPC]: Profundidad 3D, Portales y Horizontes
 */
const SHAPE_MODES = [
  { id: 0, code: 'AUTO', name: 'Automática', icon: '◈' },
  { id: 1, code: 'SQUARE', name: 'Cuadrados □', icon: '□' },
  { id: 2, code: 'TRIANGLE', name: 'Triángulos △', icon: '△' },
  { id: 3, code: 'HEXAGON', name: 'Hexágonos ⬡', icon: '⬡' },
  { id: 4, code: 'DIAMOND', name: 'Rombos ◇', icon: '◇' },
  { id: 5, code: 'LINES', name: 'Solo Líneas ≡', icon: '≡' }
];
const STYLE_MODES = [
  { id: 0, code: 'AUTO', name: '✨ Normal' },
  { id: 1, code: 'FLAT', name: '⏹ 100% Plano (Sin Brillo)' },
  { id: 2, code: 'OUTLINE', name: '📐 Solo Línea Fina' },
  { id: 3, code: 'SOLID', name: '🎨 Bloques Sólidos' }
];
const SWEEP_MODES = [
  { id: 0, code: 'OFF', name: 'Sin Barrido' },
  { id: 1, code: 'L2R', name: '➔ Izq a Der' },
  { id: 2, code: 'R2L', name: '⬅ Der a Izq' },
  { id: 3, code: 'PINGPONG', name: '↔ Vaivén Suave' },
  { id: 4, code: 'SPLIT', name: '◄► Desde el Centro' },
  { id: 5, code: 'CURTAIN', name: '▮ Cortina Limpia' }
];
const WEIGHT_MODES = [
  { id: 0, code: 'UNIFORM', name: 'Fijo (Manual)' },
  { id: 1, code: 'BREATHE', name: '〰 Respira (Fino ⟷ Grueso)' },
  { id: 2, code: 'WAVE_LR', name: '🌊 Ola Izq ➔ Der' },
  { id: 3, code: 'ALTERNATE', name: '◫ Alternar Fino/Grueso' }
];
const EFFECT_3D_MODES = [
  { id: 0, code: 'OFF', name: '⏹ 2D Plano (Normal)' },
  { id: 1, code: 'TILT', name: '📐 Plano Flotante 3D' },
  { id: 2, code: 'EXTRUDE', name: '🧊 Relieve / Extrusión 3D' },
  { id: 3, code: 'CYLINDER', name: '🏟 Curva / Cilindro 3D' }
];
const LOGO_FX_MODES = [
  { id: 0, code: 'CLEAN', name: '⏹ Fijo Limpio' },
  { id: 1, code: 'PULSE', name: '💓 Latido BPM + Halo' },
  { id: 2, code: '3D', name: '🧊 Logo 3D con Relieve' },
  { id: 3, code: 'NEON_GLITCH', name: '⚡ Neón + Glitch RGB' },
  { id: 4, code: 'STENCIL', name: '🎭 Silueta / Máscara' }
];
const LOGO_POS_MODES = [
  { id: 0, code: 'CENTER', name: '🎯 Centro' },
  { id: 1, code: 'TOP', name: '⬆️ Arriba Cabina' },
  { id: 2, code: 'CORNER', name: '↘️ Esquina (TV)' }
];

// ---- Textos en pantalla (nombre del DJ, mensajes, cuentas atrás) ----
const TEXT_FONTS = [
  { id: 0, name: 'Impacto', css: '900 {px}px "Arial Black", Impact, "Segoe UI Black", sans-serif' },
  { id: 1, name: 'Mono Tech', css: '800 {px}px "JetBrains Mono", Consolas, "Courier New", monospace' },
  { id: 2, name: 'Elegante', css: 'italic 700 {px}px Georgia, "Times New Roman", serif' },
  { id: 3, name: 'Redonda', css: '800 {px}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif' }
];
const TEXT_FX_MODES = [
  { id: 0, name: '⏹ Limpio' },
  { id: 1, name: '💓 Latido + Halo' },
  { id: 2, name: '⚡ Neón Glitch RGB' },
  { id: 3, name: '📜 Ticker (desplazamiento)' },
  { id: 4, name: '🌊 Onda' },
  { id: 5, name: '🎭 Silueta (visual dentro)' },
  { id: 6, name: '🧊 Relieve 3D' }
];
const TEXT_POS_MODES = [
  { id: 0, name: '🎯 Centro' },
  { id: 1, name: '⬆️ Arriba' },
  { id: 2, name: '⬇️ Abajo' }
];
const TEXT_COLOR_MODES = [
  { id: 0, name: '⚪ Blanco' },
  { id: 1, name: '🎨 Color de la paleta' },
  { id: 2, name: '🌈 Arcoíris animado' }
];

// ---- Capa de vídeo / GIF / cámara en directo ----
const MEDIA_BLEND_MODES = [
  { id: 0, name: '⬛ Encima (tapa)' },
  { id: 1, name: '✨ Pantalla (suma luz)' },
  { id: 2, name: '🎭 Máscara (visual dentro del vídeo)' },
  { id: 3, name: '🔀 Diferencia' },
  { id: 4, name: '🌗 Mitad y mitad' }
];
const MEDIA_FX_MODES = [
  { id: 0, name: '⏹ Normal' },
  { id: 1, name: '💠 Bordes Neón' },
  { id: 2, name: '🎨 Duotono Paleta' },
  { id: 3, name: '🔥 Térmica' },
  { id: 4, name: '🟨 Pop-Art' },
  { id: 5, name: '👻 Fantasma' },
  { id: 6, name: '▦ Pixel LED' }
];

// ---- Transiciones entre Looks guardados (en compases, sincronizadas al BPM) ----
const TRANSITION_BARS = [0, 1, 2, 4, 8, 16];

// ---- Edge blending de 2 proyectores ----
const EDGE_BLEND_MODES = [
  { id: 0, name: '⏹ Apagado' },
  { id: 1, name: '🖥🖥 2 proyectores en 1 ventana' },
  { id: 2, name: '◧ Este es el IZQUIERDO' },
  { id: 3, name: '◨ Este es el DERECHO' }
];
function defaultCorners() {
  return [[0, 0], [1, 0], [1, 1], [0, 1]];
}
function defaultMasks() {
  return [
    { enabled: false, x: 0.40, y: 0.60, w: 0.20, h: 0.30, feather: 0.01 },
    { enabled: false, x: 0.05, y: 0.05, w: 0.15, h: 0.15, feather: 0.01 },
    { enabled: false, x: 0.80, y: 0.05, w: 0.15, h: 0.15, feather: 0.01 },
    { enabled: false, x: 0.40, y: 0.05, w: 0.20, h: 0.15, feather: 0.01 }
  ];
}
const SLICE_MODES = [
  { id: 0, code: 'FULL', name: '🖥 1 Pantalla Completa' },
  { id: 1, code: 'TOTEMS', name: '▮▮▮ Tótems Verticales' },
  { id: 2, code: 'STAGE_DJ', name: '🎧 Cabina DJ + 2 Tótems' },
  { id: 3, code: 'BANDS', name: '☰ Bandas Horizontales' },
  { id: 4, code: 'GRID', name: '⊞ Matriz de Paneles LED' }
];
const GENERATORS = [
  // ================= BANK A (0..7) [GEO]: FORMAS GEOMÉTRICAS 2D =================
  {
    id: 0,
    bank: 'GEO',
    code: 'GEO-01',
    name: 'MARCOS CUADRADOS CONCÉNTRICOS',
    shortName: 'MARCOS CUADRADOS',
    category: 'FORMAS 2D / CUADRADOS',
    description: 'Grandes marcos cuadrados limpios sobre fondo negro con movimiento suave.'
  },
  {
    id: 1,
    bank: 'GEO',
    code: 'GEO-02',
    name: 'PRISMAS Y TRIÁNGULOS',
    shortName: 'TRIÁNGULOS LIMPIOS',
    category: 'FORMAS 2D / TRIÁNGULOS',
    description: 'Triángulos equiláteros monumentales con evolución serena de grosor y color.'
  },
  {
    id: 2,
    bank: 'GEO',
    code: 'GEO-03',
    name: 'LÍNEAS PARALELAS DE ESCENARIO',
    shortName: 'LÍNEAS PARALELAS',
    category: 'LÍNEAS RECTAS',
    description: 'Haces de líneas rectas verticales y horizontales bien espaciadas.'
  },
  {
    id: 3,
    bank: 'GEO',
    code: 'GEO-04',
    name: 'MOSAICO DE POLÍGONOS',
    shortName: 'MOSAICO POLIGONAL',
    category: 'CUADRÍCULA SUAVE',
    description: 'Cuadrados, triángulos y hexágonos que respiran en onda suave.'
  },
  {
    id: 4,
    bank: 'GEO',
    code: 'GEO-05',
    name: 'COMPOSICIÓN BAUHAUS',
    shortName: 'ESTILO BAUHAUS',
    category: 'DISEÑO GRÁFICO',
    description: 'Coreografía minimalista de un gran cuadrado, un triángulo y una diagonal.'
  },
  {
    id: 5,
    bank: 'GEO',
    code: 'GEO-06',
    name: 'CUBOS ISOMÉTRICOS 2.5D',
    shortName: 'CUBOS ISOMÉTRICOS',
    category: 'GEOMETRÍA 2.5D',
    description: 'Malla arquitectónica de cubos isométricos y rombos limpios.'
  },
  {
    id: 6,
    bank: 'GEO',
    code: 'GEO-07',
    name: 'CRUCES Y MIRAS TÉCNICAS',
    shortName: 'CRUCES TÉCNICAS',
    category: 'PRECISIÓN / MINIMAL',
    description: 'Cruces vectoriales (+), escuadras de esquina y marcos de precisión.'
  },
  {
    id: 7,
    bank: 'GEO',
    code: 'GEO-08',
    name: 'BLOQUES GEOMÉTRICOS DE CONTRASTE',
    shortName: 'BLOQUES CONTRASTE',
    category: 'ALTO IMPACTO',
    description: 'Figuras geométricas de alto contraste que alternan contorno y relleno.'
  },

  // ================= BANK B (8..15) [KIN]: GROSORES VARIABLES Y BARRIDOS IZQ➔DER =================
  {
    id: 8,
    bank: 'KIN',
    code: 'KIN-09',
    name: 'COLUMNAS FINO ⟷ GRUESO',
    shortName: 'LÍNEAS FINO⟷GRUESO',
    category: 'GROSOR DINÁMICO',
    description: 'Columnas verticales que pasan suavemente de un hilo fino a barras anchas.'
  },
  {
    id: 9,
    bank: 'KIN',
    code: 'KIN-10',
    name: 'ESCÁNER LÁSER IZQ ➔ DER',
    shortName: 'BARRIDO IZQ➔DER',
    category: 'BARRIDO LATERAL',
    description: 'Barrido horizontal de izquierda a derecha que ilumina formas a su paso.'
  },
  {
    id: 10,
    bank: 'KIN',
    code: 'KIN-11',
    name: 'PERSIANAS EN ACORDEÓN',
    shortName: 'ONDAS ACORDEÓN',
    category: 'COMPRESIÓN SUAVE',
    description: 'Líneas verticales que se juntan y separan suavemente como un acordeón.'
  },
  {
    id: 11,
    bank: 'KIN',
    code: 'KIN-12',
    name: 'PÉNDULO HORIZONTAL DE BARRAS',
    shortName: 'PÉNDULO DE BARRAS',
    category: 'VAIVÉN ARMÓNICO',
    description: 'Barras horizontales que oscilan de izquierda a derecha en armonía.'
  },
  {
    id: 12,
    bank: 'KIN',
    code: 'KIN-13',
    name: 'PUERTAS Y PANELES DESLIZANTES',
    shortName: 'PANELES MÓVILES',
    category: 'ARQUITECTÓNICO',
    description: 'Grandes marcos rectangulares que se deslizan horizontalmente con calma.'
  },
  {
    id: 13,
    bank: 'KIN',
    code: 'KIN-14',
    name: 'FLECHAS Y CHEVRONS (>>>)',
    shortName: 'FLECHAS IZQ➔DER',
    category: 'DIRECCIONAL',
    description: 'Bandas angulares en forma de flecha avanzando con grosor variable.'
  },
  {
    id: 14,
    bank: 'KIN',
    code: 'KIN-15',
    name: 'RADAR ORTOGONAL X/Y',
    shortName: 'ESCÁNER X/Y',
    category: 'LÍNEAS DE ESCANEO',
    description: 'Dos líneas maestras (vertical y horizontal) que cruzan la pantalla.'
  },
  {
    id: 15,
    bank: 'KIN',
    code: 'KIN-16',
    name: 'PISTAS HORIZONTALES MINIMAL',
    shortName: 'PISTAS DIGITALES',
    category: 'ESTILO IKEDA SUAVE',
    description: 'Bandas horizontales limpias que se deslizan en sentidos opuestos.'
  },

  // ================= BANK C (16..23) [FLT]: GEOMETRÍA PLANA PURA (SIN BRILLO / SIN EFECTOS) =================
  {
    id: 16,
    bank: 'FLT',
    code: 'FLT-17',
    name: 'MARCOS PLANOS MINIMALISTAS',
    shortName: 'MARCOS PLANOS',
    category: '100% PLANO / SIN EFECTOS',
    description: 'De 2 a 5 grandes marcos planos sobre negro puro que cambian suavemente de color y grosor.'
  },
  {
    id: 17,
    bank: 'FLT',
    code: 'FLT-18',
    name: 'PANELES PLANOS MONDRIAN',
    shortName: 'BLOQUES MONDRIAN',
    category: '100% PLANO / DISEÑO SUIZO',
    description: 'Grandes rectángulos planos y líneas divisorias que se mueven con total calma.'
  },
  {
    id: 18,
    bank: 'FLT',
    code: 'FLT-19',
    name: 'FIGURA CENTRAL: LÍNEA ⟷ SÓLIDO',
    shortName: 'LÍNEA ⟷ RELLENO',
    category: '100% PLANO / GROSOR',
    description: 'Una gran figura geométrica cuyo borde crece suavemente desde línea fina hasta rellenarse.'
  },
  {
    id: 19,
    bank: 'FLT',
    code: 'FLT-20',
    name: 'BANDAS DE COLOR PLANO',
    shortName: 'BANDAS PLANAS',
    category: '100% PLANO / BARRAS',
    description: 'Pocas barras anchas de color sólido separadas por amplio espacio negro.'
  },
  {
    id: 20,
    bank: 'FLT',
    code: 'FLT-21',
    name: 'CAPAS DE POLÍGONOS PLANOS',
    shortName: 'CAPAS PLANAS',
    category: '100% PLANO / CAPAS',
    description: 'Polígonos planos superpuestos con bordes definidos y giro muy suave.'
  },
  {
    id: 21,
    bank: 'FLT',
    code: 'FLT-22',
    name: 'CÁPSULAS PLANAS DESLIZANTES',
    shortName: 'CÁPSULAS PLANAS',
    category: '100% PLANO / MINIMAL',
    description: 'Barras redondeadas planas (huecas y sólidas) deslizándose con elegancia.'
  },
  {
    id: 22,
    bank: 'FLT',
    code: 'FLT-23',
    name: 'INTERSECCIÓN DE DOS FIGURAS',
    shortName: 'UNIÓN DE 2 FORMAS',
    category: '100% PLANO / BOOLEANO',
    description: 'Dos grandes figuras planas que se cruzan lentamente cambiando el color donde se tocan.'
  },
  {
    id: 23,
    bank: 'FLT',
    code: 'FLT-24',
    name: 'SÍMBOLOS PLANOS (+ □ △ ○)',
    shortName: 'SÍMBOLOS PLANOS',
    category: '100% PLANO / SÍMBOLOS',
    description: 'Símbolos geométricos grandes y espaciados que engordan y adelgazan suavemente.'
  },

  // ================= BANK D (24..31) [SPC]: OBJETOS Y ESCENARIOS 3D VOLUMÉTRICOS =================
  {
    id: 24,
    bank: 'SPC',
    code: 'SPC-25',
    name: 'CUBO E HIPERCUBO 3D',
    shortName: 'CUBO / HIPERCUBO 3D',
    category: 'OBJETO 3D / WIREFRAME',
    description: 'Cubo 3D e hipercubo interior (Tesseract) flotando en perspectiva real con caras sombreadas.'
  },
  {
    id: 25,
    bank: 'SPC',
    code: 'SPC-26',
    name: 'PIRÁMIDE Y OCTAEDRO 3D',
    shortName: 'OCTAEDRO 3D + ÓRBITAS',
    category: 'OBJETO 3D / CRISTAL',
    description: 'Diamante octaédrico 3D tallado con iluminación por cara y anillos orbitales en 3D.'
  },
  {
    id: 26,
    bank: 'SPC',
    code: 'SPC-27',
    name: 'ESFERA GEODÉSICA 3D',
    shortName: 'ESFERA / GLOBO 3D',
    category: 'OBJETO 3D / ESFERA',
    description: 'Globo 3D volumétrico con meridianos y paralelos visibles por delante y por detrás.'
  },
  {
    id: 27,
    bank: 'SPC',
    code: 'SPC-28',
    name: 'GIROSCOPIO DE ANILLOS 3D',
    shortName: 'GIROSCOPIO 3D',
    category: 'OBJETO 3D / ANILLOS',
    description: 'Anillos toroidales 3D entrelazados girando en los ejes X, Y y Z con núcleo suspendido.'
  },
  {
    id: 28,
    bank: 'SPC',
    code: 'SPC-29',
    name: 'ESTRUCTURA MONOLÍTICA 3D',
    shortName: 'ARQUITECTURA 3D',
    category: 'RAYMARCHING 3D',
    description: 'Cámara recorriendo una estructura arquitectónica 3D infinita con luces y sombras.'
  },
  {
    id: 29,
    bank: 'SPC',
    code: 'SPC-30',
    name: 'PASILLO DE PÓRTICOS 3D',
    shortName: 'PÓRTICOS 3D',
    category: 'PERSPECTIVA 3D',
    description: 'Pórticos geométricos 3D unidos por vigas de profundidad que avanzan hacia cámara.'
  },
  {
    id: 30,
    bank: 'SPC',
    code: 'SPC-31',
    name: 'TERRENO Y HORIZONTE 3D',
    shortName: 'TERRENO 3D LÁSER',
    category: 'PAISAJE 3D',
    description: 'Malla topográfica 3D en perspectiva con ondas de elevación y sol geométrico al fondo.'
  },
  {
    id: 31,
    bank: 'SPC',
    code: 'SPC-32',
    name: 'CAMPO DE CUBOS 3D (PISTONES)',
    shortName: 'PISTONES 3D',
    category: 'MATRIZ 3D EXTRUIDA',
    description: 'Matriz de columnas 3D con caras superior y laterales que suben y bajan suavemente.'
  },

  // ================= BANK E (32..39) [MIN]: MINIMALISMO CINEMÁTICO, ARCOS, ECLIPSES Y RELOJES =================
  {
    id: 32,
    bank: 'MIN',
    code: 'MIN-33',
    name: 'ARCOS Y ANILLOS PARTIDOS',
    shortName: 'ARCOS PARTIDOS',
    category: 'ANILLOS / RELOJ',
    description: 'Grandes arcos circulares rotos que giran en sentidos opuestos cambiando su longitud y grosor.'
  },
  {
    id: 33,
    bank: 'MIN',
    code: 'MIN-34',
    name: 'ECLIPSE SOLAR GEOMÉTRICO',
    shortName: 'ECLIPSE GEOMÉTRICO',
    category: 'CORONA / FASES',
    description: 'Una gran figura central eclipsada lentamente por un disco oscuro creando fases elegantes.'
  },
  {
    id: 34,
    bank: 'MIN',
    code: 'MIN-35',
    name: 'PÉNDULO Y METRÓNOMO ESCÉNICO',
    shortName: 'METRÓNOMO ESCENA',
    category: 'OSCILACIÓN SUAVE',
    description: 'Gran aguja minimalista oscilando con física suave sobre un arco graduado.'
  },
  {
    id: 35,
    bank: 'MIN',
    code: 'MIN-36',
    name: 'ESCALERA DIAGONAL BAUHAUS',
    shortName: 'ESCALERA BAUHAUS',
    category: 'PELDAÑOS / PLANO',
    description: 'Peldaños geométricos escalonados que ascienden con suavidad cambiando de grosor.'
  },
  {
    id: 36,
    bank: 'MIN',
    code: 'MIN-37',
    name: 'MATRIZ DE PUNTOS Y CÍRCULOS',
    shortName: 'ONDA DE CÍRCULOS',
    category: 'PUNTOS / HALFTONE',
    description: 'Cuadrícula espaciada de círculos planos que crecen y encogen en una ola armónica.'
  },
  {
    id: 37,
    bank: 'MIN',
    code: 'MIN-38',
    name: 'ARCOS Y PÓRTICOS MONUMENTALES',
    shortName: 'ARCOS MONUMENTALES',
    category: 'ARQUITECTURA / ARCO',
    description: 'Arcos de medio punto concéntricos estilo escenario monumental de festival.'
  },
  {
    id: 38,
    bank: 'MIN',
    code: 'MIN-39',
    name: 'ONDA SENOIDAL DE COLUMNAS',
    shortName: 'ONDA DE COLUMNAS',
    category: 'BARRAS VERTICALES',
    description: 'Fila limpia de columnas cuyas alturas dibujan una onda lenta con puntas flotantes.'
  },
  {
    id: 39,
    bank: 'MIN',
    code: 'MIN-40',
    name: 'RUEDA DE SECTORES ALTERNOS',
    shortName: 'ENGRANAJE MINIMAL',
    category: 'SECTORES / GIRO',
    description: 'Anillos divididos en sectores amplios que giran lentamente como un mecanismo de precisión.'
  },

  // ================= BANK F (40..47) [MOT]: COREOGRAFÍAS DE ESCENARIO LED, CORTINAS Y SIMETRÍA =================
  {
    id: 40,
    bank: 'MOT',
    code: 'MOT-41',
    name: 'APERTURA DE CORTINA CENTRAL',
    shortName: 'CORTINA DE ESCENA',
    category: 'APERTURA IZQ/DER',
    description: 'Dos paneles laterales de barras que se abren revelando una gran figura central.'
  },
  {
    id: 41,
    bank: 'MOT',
    code: 'MOT-42',
    name: 'MARCO DE 4 ESQUINAS (DJ FRAME)',
    shortName: 'MARCO 4 ESQUINAS',
    category: 'BORDE DE PANTALLA',
    description: 'Escuadras dinámicas en las 4 esquinas que dejan el centro libre para el DJ o logo.'
  },
  {
    id: 42,
    bank: 'MOT',
    code: 'MOT-43',
    name: 'CASCADA VERTICAL DE BLOQUES',
    shortName: 'CASCADA VERTICAL',
    category: 'CAÍDA SUAVE',
    description: 'Grandes losas horizontales espaciadas que descienden con calma de arriba a abajo.'
  },
  {
    id: 43,
    bank: 'MOT',
    code: 'MOT-44',
    name: 'DIAMANTE EXPANSIVO DE GROSOR',
    shortName: 'DIAMANTE EXPANSIVO',
    category: 'FINO ➔ GRUESO ➔ FINO',
    description: 'Rombos que nacen finos en el centro, engordan a mitad de pantalla y se afinan al salir.'
  },
  {
    id: 44,
    bank: 'MOT',
    code: 'MOT-45',
    name: 'HORIZONTE DE ESPEJO SIMÉTRICO',
    shortName: 'ESPEJO HORIZONTAL',
    category: 'SIMETRÍA CENTRAL',
    description: 'Barras geométricas que crecen simétricamente hacia arriba y hacia abajo desde el centro.'
  },
  {
    id: 45,
    bank: 'MOT',
    code: 'MOT-46',
    name: 'CARRUSEL DE PÓRTICOS 2D',
    shortName: 'CARRUSEL MARCOS',
    category: 'DESFILE L➔R',
    description: 'Grandes marcos con figuras interiores que desfilan suavemente de izquierda a derecha.'
  },
  {
    id: 46,
    bank: 'MOT',
    code: 'MOT-47',
    name: 'ABANICO LÁSER TECHO / SUELO',
    shortName: 'ABANICO DE LÍNEAS',
    category: 'PEINE LÁSER',
    description: 'Haces rectos de líneas que nacen desde arriba y abajo abriéndose suavemente en abanico.'
  },
  {
    id: 47,
    bank: 'MOT',
    code: 'MOT-48',
    name: 'TÓTEM MONOLITO CENTRAL',
    shortName: 'TÓTEM CENTRAL',
    category: 'COLUMNA LED',
    description: 'Columna central imponente de bloques simétricos respirantes con laterales negros puros.'
  }
];
const MACRO_DEFS = [
  {
    key: 'speed',
    index: 0,
    code: '1',
    name: 'VELOCIDAD',
    sub: 'Lento ⟷ Rápido',
    defaultVal: 0.22,
    defaultLfo: 'OFF',
    defaultDepth: 0.10,
    defaultRate: 0.12,
    audioBand: 'none',
    audioAmount: 0.0
  },
  {
    key: 'scale',
    index: 1,
    code: '2',
    name: 'CANTIDAD / ZOOM',
    sub: 'Pocas grandes ⟷ Más',
    defaultVal: 0.24,
    defaultLfo: 'OFF',
    defaultDepth: 0.15,
    defaultRate: 0.12,
    audioBand: 'none',
    audioAmount: 0.15
  },
  {
    key: 'complexity',
    index: 2,
    code: '3',
    name: 'CAPAS / DETALLE',
    sub: 'Simple ⟷ Complejo',
    defaultVal: 0.25,
    defaultLfo: 'OFF',
    defaultDepth: 0.15,
    defaultRate: 0.12,
    audioBand: 'none',
    audioAmount: 0.15
  },
  {
    key: 'thickness',
    index: 3,
    code: '4',
    name: 'GROSOR DE LÍNEA',
    sub: 'Fina ⟷ Rellena',
    defaultVal: 0.38,
    defaultLfo: 'SINE',
    defaultDepth: 0.26,
    defaultRate: 0.12,
    audioBand: 'bass',
    audioAmount: 0.30
  },
  {
    key: 'rotation',
    index: 4,
    code: '5',
    name: 'INCLINACIÓN / GIRO',
    sub: '0% = Totalmente Recto',
    defaultVal: 0.00,
    defaultLfo: 'OFF',
    defaultDepth: 0.12,
    defaultRate: 0.10,
    audioBand: 'none',
    audioAmount: 0.0
  },
  {
    key: 'chaos',
    index: 5,
    code: '6',
    name: 'MOVIMIENTO EXTRA',
    sub: 'Quieto ⟷ Desplazado',
    defaultVal: 0.08,
    defaultLfo: 'OFF',
    defaultDepth: 0.15,
    defaultRate: 0.12,
    audioBand: 'none',
    audioAmount: 0.15
  },
  {
    key: 'strobe',
    index: 6,
    code: '7',
    name: 'PARPADEO BPM',
    sub: '0% = Sin Parpadeo',
    defaultVal: 0.00,
    defaultLfo: 'OFF',
    defaultDepth: 0.10,
    defaultRate: 0.25,
    audioBand: 'none',
    audioAmount: 0.20
  },
  {
    key: 'colorShift',
    index: 7,
    code: '8',
    name: 'CAMBIO DE COLOR',
    sub: 'Velocidad de Paleta',
    defaultVal: 0.12,
    defaultLfo: 'OFF',
    defaultDepth: 0.10,
    defaultRate: 0.05,
    audioBand: 'none',
    audioAmount: 0.05
  }
];
const LFO_WAVES = ['OFF', 'SINE', 'TRI', 'PERLIN', 'STEP'];
const AUTOPILOT_MODES = {
  HYPNOTIC_SLOW: {
    id: 'HYPNOTIC_SLOW',
    name: '🌿 SUAVE / ELEGANTE (EVENTO)',
    desc: 'Movimiento lento, pocas figuras grandes sobre fondo negro, cero parpadeo y cero efectos (Ideal para pantallas de evento)',
    lfoSpeedMult: 0.25,
    lfoDepthMult: 0.55,
    crossfadeDurationSec: 6.5,
    fxProbability: 0.0,
    strobeCeiling: 0.0,
    chaosCeiling: 0.15
  },
  CLUB_DYNAMIC: {
    id: 'CLUB_DYNAMIC',
    name: '🎵 CLUB EQUILIBRADO',
    desc: 'Evolución constante y rítmica de formas geométricas, grosores y colores sin marear',
    lfoSpeedMult: 0.55,
    lfoDepthMult: 0.80,
    crossfadeDurationSec: 4.5,
    fxProbability: 0.0,
    strobeCeiling: 0.10,
    chaosCeiling: 0.30
  },
  FESTIVAL_PEAK: {
    id: 'FESTIVAL_PEAK',
    name: '⚡ ENERGÍA / DROP',
    desc: 'Cambios más rápidos y mayor contraste para momentos fuertes de la sesión',
    lfoSpeedMult: 1.00,
    lfoDepthMult: 1.05,
    crossfadeDurationSec: 2.2,
    fxProbability: 0.25,
    strobeCeiling: 0.45,
    chaosCeiling: 0.55
  },
  FULL_RANDOM_CHAOS: {
    id: 'FULL_RANDOM_CHAOS',
    name: '🔥 CAOS CREATIVO',
    desc: 'Variación intensa de formas, barridos y efectos para momentos puntuales',
    lfoSpeedMult: 1.35,
    lfoDepthMult: 1.25,
    crossfadeDurationSec: 1.2,
    fxProbability: 0.55,
    strobeCeiling: 0.70,
    chaosCeiling: 0.75
  }
};
const BAR_STEP_OPTIONS = [0, 1, 4, 8, 16];
const BAR_STEP_SEQUENCES = {
  speed:      [0.18, 0.46, 0.24, 0.62, 0.16, 0.36],
  scale:      [0.14, 0.58, 0.26, 0.80, 0.18, 0.44],
  complexity: [0.16, 0.54, 0.26, 0.72, 0.20, 0.42],
  thickness:  [0.18, 0.68, 0.32, 0.84, 0.24, 0.52],
  rotation:   [0.00, 0.25, 0.50, 0.75, 0.125, 0.875],
  chaos:      [0.04, 0.42, 0.15, 0.64, 0.08, 0.32],
  strobe:     [0.00, 0.00, 0.00, 0.30],
  colorShift: [0.08, 0.45, 0.20, 0.68]
};
function createInitialState() {
  const macros = {};
  for (const def of MACRO_DEFS) {
    macros[def.key] = {
      base: def.defaultVal,
      modulated: def.defaultVal,
      lfoWave: def.defaultLfo,
      lfoDepth: def.defaultDepth,
      lfoRate: def.defaultRate,
      lfoPhaseOffset: def.index * 0.713,
      audioBand: def.audioBand,
      audioAmount: def.audioAmount,
      barStepBars: 0,       // 0 = Fijo/Manual | 1, 4, 8, 16 = Salta de golpe cada X compases
      barStepIndex: 0       // Índice actual dentro de BAR_STEP_SEQUENCES[key]
    };
  }

  return {
    // Session & Engine Telemetry
    sessionStartTime: performance.now(),
    renderTime: 0,
    accumulatedPhase: 0,
    entropySeed: Math.random() * 1000,
    fps: 60,
    frameTimeMs: 16.6,
    resolutionScale: 1.0,
    bgMode: 'SOLID',          // 'SOLID' | 'ALPHA' | 'CHROMA'
    uiHidden: (typeof window !== 'undefined' && window.location && window.location.search.includes('kiosk=1')),
    simpleUiMode: true,       // Abre por defecto en MODO FÁCIL / INTUITIVO
    helpModalOpen: false,
    logoDataUrl: '',          // Imagen PNG transparente activa en Base64/DataURL
    logoSlots: [null, null, null, null], // 4 Memorias rápidas de Logos de DJs para la sesión
    presets: [null, null, null, null, null, null, null, null], // 8 Looks completos guardados (Apertura, Pico, Cierre...)
    autoQuality: true,        // Baja/sube la resolución interna sola si la GPU no llega a los FPS de la pantalla
    transition: { bars: 4 },  // Transición al cargar un Look: 0 = corte, 1/2/4/8/16 compases
    calmColor: true,          // 🐢 Color suave (anti-feria): los colores cambian muy despacio y sin saltos
    colorPhase: 0.0,          // Deriva de color acumulada (la calcula el Autopilot)
    colorOffset: 0.0,         // Desplazamiento de color del fader 8 con límite de velocidad
    cameras: [],              // Cámaras detectadas [{ deviceId, label }]
    text: {
      enabled: false,         // Mostrar texto encima de los visuales
      content: '',            // Texto (máx. 140 caracteres, '\n' = 2 líneas)
      font: 0,                // TEXT_FONTS
      fxMode: 1,              // TEXT_FX_MODES
      pos: 0,                 // TEXT_POS_MODES
      scale: 0.5,             // Tamaño (0.15 .. 1.0)
      opacity: 1.0,           // Opacidad (0.1 .. 1.0)
      colorMode: 0,           // TEXT_COLOR_MODES
      backdrop: 0.4,          // Sombra protectora detrás del texto
      scrollSpeed: 0.5,       // Velocidad del ticker
      version: 0              // Sube cuando cambia el texto o la fuente (regenera la textura)
    },
    media: {
      enabled: false,         // Mostrar la capa de vídeo / GIF / cámara
      source: 'none',         // 'none' | 'file' | 'camera'
      url: '',                // '/media/xxx.mp4' o 'blob:...'
      kind: 'video',          // 'video' | 'gif' | 'image'
      name: '',
      opacity: 1.0,
      blend: 0,               // MEDIA_BLEND_MODES
      fx: 0,                  // MEDIA_FX_MODES
      fit: 0,                 // 0: Llenar | 1: Encajar
      mirror: false,          // Espejo horizontal (cámara)
      beatZoom: 0.0,          // Golpe de zoom con el bombo
      speed: 1.0,             // Velocidad de reproducción
      cameraId: '',
      version: 0
    },
    midi: {
      supported: false,       // El navegador soporta Web MIDI
      enabled: false,         // El usuario ha activado la escucha de MIDI Clock
      receiving: false,       // Llegan pulsos de reloj ahora mismo
      deviceName: '',         // Nombre del dispositivo que envía el reloj
      clockBpm: 0             // BPM medido por el reloj MIDI
    },

    // Global Shape, Render Style, Kinetic Sweep & Line-Weight Modulators
    shapeMode: 0,             // 0: AUTO, 1: SQUARES, 2: TRIANGLES, 3: HEXAGONS, 4: DIAMONDS, 5: LINES
    styleMode: 1,             // Arranca en 1: 100% PLANO (SIN BRILLO) para que sea ultra limpio
    sweepMode: 0,             // 0: OFF, 1: L->R, 2: R->L, 3: PING-PONG, 4: SPLIT, 5: CURTAIN WIPE
    weightMode: 1,            // 1: Respira suavemente entre línea fina y gruesa
    pureFlatBypassFx: true,   // Bloquea cualquier efecto de distorsión por defecto
    activeBankTab: 'FLT',     // 'FLT' (16..23) | 'GEO' (0..7) | 'KIN' (8..15) | 'SPC' (24..31)
    autopilotBankPool: 'FLT', // Arranca rotando solo por el banco PLANO MINIMALISTA (FLT-17 a FLT-24)

    // Dual-Deck A/B Generator & Crossfade State
    deckA: 18,                // Arranca en FLT-19: FIGURA CENTRAL (LÍNEA ⟷ SÓLIDO), súper limpio y fácil de entender
    deckB: 16,                // Deck B en FLT-17: MARCOS PLANOS MINIMALISTAS
    crossfade: 0.0,
    autoCrossfading: false,
    crossfadeStartVal: 0.0,
    crossfadeTargetVal: 0.0,
    crossfadeElapsed: 0.0,
    crossfadeDuration: 6.5,

    // Palette State
    paletteActive: 0,
    paletteTarget: 0,
    paletteMix: 0.0,
    autoRotatePalette: true,

    // 8 Real-Time Macro Parameters
    macros,

    // 6-Stage Post-Processing FX Rack + Efecto 3D Global + Logo PNG DJ en Vivo
    fx: {
      effect3d: {
        mode: 0,                // 0: 2D Normal, 1: Plano Flotante 3D, 2: Relieve / Extrusión 3D, 3: Curva / Cilindro 3D
        amount: 0.55            // Profundidad / Inclinación 3D (0.10 .. 1.0)
      },
      logo: {
        enabled: false,         // Mostrar / Ocultar Logo PNG encima de los visuales
        fxMode: 1,              // 0: Fijo Limpio, 1: Latido BPM + Halo, 2: Logo 3D con Relieve, 3: Neón + Glitch RGB, 4: Silueta / Máscara
        scale: 0.44,            // Tamaño del Logo (0.15 .. 1.0)
        opacity: 0.96,          // Opacidad del Logo (0.10 .. 1.0)
        backdrop: 0.65,         // Sombra oscura protectora detrás del logo para que se lea siempre perfecto (0.0 .. 1.0)
        pos: 0,                 // 0: Centro, 1: Arriba Cabina, 2: Esquina Inferior Derecha
        tint: false,            // false: Color/Blanco original del PNG, true: Teñir con la paleta activa
        aspect: 2.4,            // Proporción ancho/alto del PNG (se auto-calcula al subir imagen)
        activeSlot: 0,          // Slot activo (0..3)
        version: 0              // Contador de sincronización cuando cambia la imagen
      },
      mapping: {
        offsetX: 0.0,           // Mover Pantalla Izquierda ⟷ Derecha (-0.80 .. +0.80)
        offsetY: 0.0,           // Mover Pantalla Abajo ⟷ Arriba (-0.80 .. +0.80)
        scaleX: 1.0,            // Ancho de Pantalla (0.15 .. 1.50)
        scaleY: 1.0,            // Alto de Pantalla (0.15 .. 1.50)
        keystoneX: 0.0,         // Corrección Trapezoidal Horizontal (-0.60 .. +0.60)
        keystoneY: 0.0,         // Corrección Trapezoidal Vertical (-0.60 .. +0.60)
        sliceMode: 0,           // 0: 1 Pantalla, 1: Tótems Verticales, 2: Cabina DJ + 2 Tótems, 3: Bandas Horizontales, 4: Matriz LED
        sliceCount: 3,          // Número de Tótems/Slices (2 a 6)
        sliceGap: 0.04,         // Hueco negro entre Slices (0.00 .. 0.18)
        sliceClone: true,       // true: Re-encuadrar visual en cada Slice | false: Cortar como máscara
        showTestGrid: false,    // Muestra Carta de Ajuste / Rejilla de Encuadre en pantalla
        cornerPin: false,       // Corner-pin: arrastrar las 4 esquinas para encajar en cualquier superficie
        corners: defaultCorners(),  // Proyector 1: TL, TR, BR, BL (x→derecha, y→abajo, 0..1)
        corners2: defaultCorners(), // Proyector 2 (solo edge blending "2 proyectores en 1 ventana")
        masks: defaultMasks(),  // 4 máscaras negras rectangulares (tapar cabina, columnas, puertas...)
        ledScalerEnabled: false,// Escalador por píxeles exactos X × Y para pantallas LED más pequeñas (modo enviadora NovaStar/Colorlight)
        ledWidthPx: 1024,       // Ancho en píxeles de la pantalla LED (X)
        ledHeightPx: 512,       // Alto en píxeles de la pantalla LED (Y)
        ledOffsetXPx: 0,        // Desplazamiento X en píxeles desde el borde izquierdo (0 por defecto en enviadoras LED)
        ledOffsetYPx: 0,        // Desplazamiento Y en píxeles desde el borde superior (0 por defecto en enviadoras LED)
        ledAnchor: 'top-left',  // 'top-left' (esquina superior izquierda 0,0) | 'center' (centrado en la pantalla)
        ledKeepAspect: true     // true = mantiene formas sin deformar | false = estira el 16:9 al tamaño X×Y
      },
      edgeBlend: {
        mode: 0,                // 0: Apagado, 1: 2 proyectores en 1 ventana, 2: Izquierdo, 3: Derecho
        overlap: 0.15,          // Zona de solape (fracción del ancho de cada proyector)
        gamma: 2.2,             // Gamma del proyector para que el solape no se vea más brillante
        curve: 2.0              // Suavidad de la rampa de fundido
      },
      output: {
        brightness: 1.0,        // Brillo general de salida (0.10 .. 1.00) — imprescindible en pantallas LED de salas pequeñas
        colorTemp: 0.0          // Temperatura de color (-1.0 = Frío/Azulado .. 0 = Neutro .. +1.0 = Cálido/Ámbar)
      },
      safeStrobe: true,         // Limita cualquier parpadeo/estrobo a un máximo de 3 destellos por segundo (seguridad fotosensible)
      kaleidoscope: {
        enabled: false,
        wet: 0.50,
        axes: 2
      },
      rgbShift: {
        enabled: false,
        wet: 0.16
      },
      feedback: {
        enabled: false,
        wet: 0.25
      },
      glitch: {
        enabled: false,
        wet: 0.40
      },
      pixelate: {
        enabled: false,
        wet: 0.35
      },
      flashMomentary: false,
      invertKill: false,
      bwMonochrome: false,
      blackout: false,
      strobeBurst: false
    },

    // Master BPM Clock & Rhythm Engine
    bpm: {
      value: 126.0,
      multiplier: 1.0,
      beatPhase: 0.0,
      barPhase: 0.0,
      totalBeats: 0,
      currentBeatInBar: 1,
      currentBar: 1,
      lastTapTimes: [],
      syncPulse: 0.0
    },

    // Web Audio API FFT Reactivity
    audio: {
      enabled: false,
      simMode: false,
      deviceId: 'default',
      gain: 1.25,
      reactivityAmount: 0.55,
      bass: 0.0,
      mid: 0.0,
      high: 0.0,
      subKickPulse: 0.0
    },

    // 8-Hour Autopilot Brain (Configurado por defecto en modo SUAVE / ELEGANTE)
    autopilot: {
      enabled: true,
      mode: 'HYPNOTIC_SLOW',
      lfoMasterEnabled: true,
      autoSceneEnabled: true,
      triggerUnit: 'BARS',
      triggerBars: 32,
      triggerSeconds: 45,
      barsElapsedInScene: 0,
      secondsElapsedInScene: 0,
      sceneProgress: 0.0,
      lastBarNumber: 1,
      scenesPlayed: 1,
      historyQueue: [18]
    },

    // Mutación Automática por Vuelta de Loops ("AUTO" individual en cada familia de efectos)
    autoMods: {
      changeEvery: 'LAP',      // 'LAP' = Cambia al completar 1 vuelta entera de loops | 'SCENE' = Cambia en cada loop
      lapsCompleted: 0,        // Vueltas completas de todos los loops de la familia activa
      loopsInCurrentLap: 1,    // Posición del loop actual dentro de la vuelta (ej. 1 / 8 o 1 / 48)
      lapTotalLoops: 8,        // Total de loops en la vuelta actual (8, 40 o 48)
      visitedInLap: [18],      // Loops ya mostrados en la vuelta actual (evita repetir hasta dar la vuelta entera)
      postFxStep: 0,           // Paso actual de combinación de Efectos Opcionales cuando postFx está en AUTO
      shape: false,            // 🤖 AUTO Figura Geométrica (Automática, Cuadrados, Triángulos, Hexágonos, Rombos, Líneas)
      style: false,            // 🤖 AUTO Acabado Visual (Normal, 100% Plano, Solo Línea Fina, Bloques Sólidos)
      weight: false,           // 🤖 AUTO Grosor de Línea (Fijo, Respira Fino↔Grueso, Ola Izq→Der, Alternar)
      sweep: false,            // 🤖 AUTO Barrido Lateral (Sin Barrido, Izq→Der, Der→Izq, Vaivén, Centro, Cortina)
      effect3d: false,         // 🤖 AUTO Modo 3D en Vivo (2D Plano, Plano Flotante 3D, Relieve 3D, Cilindro 3D)
      postFx: false,           // 🤖 AUTO Efectos Opcionales (Sin Efectos, Espejo 2X/4X, RGB, Estela Suave, Malla LED)
      logoFx: false,           // 🤖 AUTO Efecto Dinámico del Logo DJ (Fijo, Latido, 3D, Neón, Silueta)
      textFx: false,           // 🤖 AUTO Efecto del Texto (Limpio, Latido, Neón, Ticker, Onda, Silueta, 3D)
      mediaFx: false           // 🤖 AUTO Efecto de Vídeo/Cámara (Normal, Bordes Neón, Duotono, Térmica, Pop-Art...)
    }
  };
}


// ==================== MODULE: js/shaders/common.glsl.js ====================
/**
 * AETHER-VJ: Shared WebGL2 GLSL Mathematical Library (#version 300 es)
 * Includes:
 *   - Sub-pixel Anti-Aliased Flat Vector Primitives (fwidth SVG-grade crispness, Zero Glow)
 *   - Rigid Orthographic Non-Tunnel Coordinate Transform
 *   - Dynamic Line-Weight Engine (Morphing Thin 1px <-> Giant Monolith Bars)
 *   - Global Directional Sweep Engine (L->R, R->L, Ping-Pong, Center Split, Curtain Wipe)
 *   - Exact 2D Signed Distance Fields (Square, Triangle, Hexagon, Rhombus, Circle, Capsule)
 */
const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
const COMMON_GLSL_HEADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

// Core Engine Uniforms
uniform vec2 uResolution;
uniform float uTime;            // Continuous phase-accumulated time
uniform float uRawTime;         // Wall-clock wrapped time (safe for 8+ hours)
uniform float uEntropy;         // Long-period drift seed for 8-hour non-repetition
uniform int uShapeMode;         // 0: AUTO, 1: SQUARES, 2: TRIANGLES, 3: HEXAGONS, 4: DIAMONDS, 5: LINES
uniform int uStyleMode;         // 0: NATIVE, 1: 100% FLAT (NO GLOW), 2: CRISP WIREFRAME, 3: HARD COLOR BLOCKS
uniform int uSweepMode;         // 0: OFF, 1: L->R, 2: R->L, 3: PING-PONG, 4: SPLIT, 5: CURTAIN WIPE
uniform int uWeightMode;        // 0: UNIFORM, 1: PULSE THIN<->THICK, 2: WAVE L->R, 3: ALT THIN/GIANT

// 8 Real-Time Macro Uniforms (Normalized 0.0 -> 1.0)
uniform float uSpeed;           // M1: Speed
uniform float uScale;           // M2: Scale / Grid Density
uniform float uComplexity;      // M3: Subdivisions / Layers / Sides
uniform float uThickness;       // M4: Line Weight (Thin <-> Giant)
uniform float uRotation;        // M5: Rigid Orientation / Angle
uniform float uChaos;           // M6: Sweep / Displacement Offset
uniform float uStrobe;          // M7: Strobe / Pulse (BPM synced)
uniform float uColorShift;      // M8: Color Shift
uniform float uColorPhase;      // Fase de color suavizada (anti-feria)

// BPM & Audio Uniforms
uniform float uBeatPhase;       // 0.0 -> 1.0 beat sawtooth
uniform float uBarPhase;        // 0.0 -> 1.0 4-beat bar phase
uniform float uBeatPulse;       // Exponential kick envelope
uniform vec3 uAudioFFT;         // x: Bass, y: Mid, z: High (0.0 -> 1.0)
uniform float uBeatsPerSec;     // Effective beats per second (BPM x multiplier / 60)
uniform int uSafeStrobe;        // 1 = Limit flashes to 3 per second (photosensitive safety)
uniform int uCalmColor;         // 1 = Anti-feria: rango armónico suave y cambios de color muy lentos

// Cosine Palette Coefficients (Interpolated in real time)
uniform vec3 uPalA;
uniform vec3 uPalB;
uniform vec3 uPalC;
uniform vec3 uPalD;

#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rot2D(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 iqPalette(float t) {
  // uCalmColor = 1 (anti-feria): acota la variación interna de la escena a un rango armónico (±16% de la paleta)
  // y avanza muy despacio con uColorPhase, evitando arcos iris estridentes o saltos rápidos de color.
  float localT = (uCalmColor == 1) ? (0.16 * sin(t * TAU)) : (t * 0.55);
  float shifted = localT + uColorPhase;
  return clamp(uPalA + uPalB * cos(TAU * (uPalC * shifted + uPalD)), 0.0, 1.0);
}

// ============================================================================
// SUB-PIXEL ANTI-ALIASED FLAT VECTOR RENDERING (SVG / ILLUSTRATOR CRISPNESS)
// ============================================================================

/**
 * 100% Flat Matte Vector Fill (Zero Glow, 1px Hardware Derivative Anti-Aliasing)
 */
float flatFill(float sdfDist) {
  float aa = max(fwidth(sdfDist), 0.0015);
  return smoothstep(aa, -aa, sdfDist);
}

/**
 * 100% Flat Matte Vector Stroke of exact half-width w (Zero Glow, Crisp Edges)
 */
float flatStroke(float sdfDist, float halfWidth) {
  float d = abs(sdfDist) - halfWidth;
  float aa = max(fwidth(d), 0.0015);
  return smoothstep(aa, -aa, d);
}

/**
 * Hybrid Stroke helper that respects global uStyleMode:
 * - If uStyleMode == 1 (FLAT) or 2 (WIREFRAME): 100% flat crisp stroke with zero neon bloom!
 * - If uStyleMode == 3 (SOLID): fills the interior of the shape with solid flat color!
 * - If uStyleMode == 0 (NATIVE): crisp core + subtle neon aura
 */
float renderStrokeOrStyle(float signedDist, float width) {
  if (uStyleMode == 1 || uStyleMode == 2) {
    return flatStroke(signedDist, width);
  }
  if (uStyleMode == 3) {
    return flatFill(signedDist);
  }
  float d = abs(signedDist);
  return smoothstep(width * 1.2, 0.0, d) + (width * 0.45) / (d + 0.006);
}

// Exact 2D Signed Distance Fields (Inigo Quilez)
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox2D(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdSquare(vec2 p, float r) {
  vec2 d = abs(p) - vec2(r);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdEquilateralTriangle(vec2 p, float r) {
  const float k = 1.73205080757;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

float sdDiamond(vec2 p, float r) {
  vec2 q = abs(p);
  return (q.x + q.y - r * 1.35) * 0.70710678;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdShape(vec2 p, float r, int defaultShape) {
  int mode = (uShapeMode > 0) ? uShapeMode : defaultShape;
  if (mode == 1) return sdSquare(p, r);
  if (mode == 2) return sdEquilateralTriangle(p, r * 1.12);
  if (mode == 3) return sdHexagon(p, r);
  if (mode == 4) return sdDiamond(p, r);
  if (mode == 5) return abs(p.y) - r * 0.35;
  return sdSquare(p, r);
}

/**
 * DYNAMIC LINE WEIGHT ENGINE ("Líneas que se hacen grandes o finas suavemente")
 */
float computeDynamicWeight(vec2 p, float indexId, float minW, float maxW) {
  float baseT = uThickness;

  if (uWeightMode == 1) {
    // Smooth, hypnotic breathing between thin and thick (no rapid beat spasm)
    float breathe = 0.5 + 0.5 * sin(uTime * 0.75 + indexId * 0.65);
    baseT = clamp(uThickness * (0.20 + 1.35 * breathe) + uAudioFFT.x * 0.25, 0.02, 1.0);
  } else if (uWeightMode == 2) {
    // Smooth Left-to-Right thickness wave
    float waveLR = 0.5 + 0.5 * sin(p.x * 1.5 - uTime * 0.95 + indexId * 0.35);
    baseT = clamp(uThickness * (0.15 + 1.45 * waveLR), 0.015, 1.0);
  } else if (uWeightMode == 3) {
    // Smooth alternating odd/even thickness exchange
    float parity = mod(floor(abs(indexId)), 2.0);
    float altWave = 0.5 + 0.5 * sin(uTime * 0.65 + parity * PI);
    baseT = clamp(mix(0.08, 0.95, altWave) * (0.4 + uThickness * 0.9), 0.015, 1.0);
  }

  return mix(minW, maxW, baseT) * (1.0 + uAudioFFT.x * 0.35);
}

/**
 * GLOBAL DIRECTIONAL SWEEP ENGINE ("Barridos elegantes de L a R, R a L, Ping-Pong, Split")
 */
vec3 applyGlobalSweep(vec3 color) {
  if (uSweepMode == 0) return color;

  float x = vUv.x;
  float speed = 0.25 + uSpeed * 0.65;
  float cycle = fract(uTime * 0.28 * speed);

  float scanPos = cycle;
  float wakeDist = 0.0;

  if (uSweepMode == 1) {
    scanPos = cycle;
    wakeDist = fract(scanPos - x);
  } else if (uSweepMode == 2) {
    scanPos = 1.0 - cycle;
    wakeDist = fract(x - scanPos);
  } else if (uSweepMode == 3) {
    float ping = 0.5 + 0.5 * sin(uTime * 0.55 * speed);
    scanPos = ping;
    wakeDist = abs(x - scanPos) * 1.8;
  } else if (uSweepMode == 4) {
    float distCenter = abs(x - 0.5) * 2.0;
    scanPos = cycle;
    wakeDist = fract(scanPos - distCenter);
  } else if (uSweepMode == 5) {
    float wipeGate = smoothstep(cycle - 0.03, cycle + 0.03, x);
    float flatBar = flatStroke(x - cycle, 0.005 + uThickness * 0.015);
    vec3 edgeCol = iqPalette(0.35) * flatBar;
    return color * (1.0 - wipeGate * 0.82) + edgeCol;
  }

  float distToBeam = (uSweepMode == 4) ? abs(abs(x - 0.5) * 2.0 - scanPos) : abs(x - scanPos);
  float beamBar = (uStyleMode == 1)
    ? flatStroke(distToBeam, 0.004 + uThickness * 0.018)
    : (0.005 + uThickness * 0.018) / (distToBeam + 0.006);
  float trailEnvelope = smoothstep(0.75, 0.0, wakeDist);

  vec3 beamCol = iqPalette(0.35);
  return color * (0.25 + 0.95 * trailEnvelope) + beamCol * beamBar * 0.55;
}

// Ashima 2D Simplex Noise
vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

float snoise2D(vec2 v) {
  const vec4 C = vec4(0.2113248654, 0.3660254037, -0.5773502691, 0.0243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289_2(i);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.792842914 - 0.8537347209 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm2D(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    val += amp * snoise2D(p);
    p = rot * p * 2.03 + vec2(13.7, 7.3);
    amp *= 0.5;
  }
  return val;
}

vec2 transformOrthoCoords(vec2 uv) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= uResolution.x / max(uResolution.y, 1.0);
  float angle = uRotation * PI;
  p *= rot2D(angle);
  return p;
}

vec2 transformMacroCoords(vec2 uv, out float radialDist) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= uResolution.x / max(uResolution.y, 1.0);
  radialDist = length(p);
  float baseAngle = uRotation * PI;
  p *= rot2D(baseAngle);

  if (uChaos > 0.02) {
    float tChaos = uTime * 0.22 + uEntropy * 0.1;
    vec2 warp = vec2(
      snoise2D(p * (1.0 + uScale * 1.5) + vec2(tChaos, -tChaos * 0.7)),
      snoise2D(p * (1.0 + uScale * 1.5) + vec2(-tChaos * 0.8, tChaos + 19.3))
    );
    p += warp * (uChaos * 0.25);
  }
  return p;
}

float computeStrobeGain() {
  if (uStrobe <= 0.01) return 1.0;
  float freq = (uStrobe > 0.65) ? 4.0 : ((uStrobe > 0.35) ? 2.0 : 1.0);
  float depth = clamp(uStrobe * 1.15, 0.0, 1.0);
  if (uSafeStrobe == 1) {
    // Photosensitive safety: never exceed 3 hard flashes per second.
    // First halve the flashes per beat; if even 1 per beat is too fast, turn the flash into a soft pulse.
    if (freq * uBeatsPerSec > 3.0) freq = 2.0;
    if (freq * uBeatsPerSec > 3.0) freq = 1.0;
    if (freq * uBeatsPerSec > 3.0) depth *= 0.12;
  }
  float phase = fract(uBeatPhase * freq);
  float gate = smoothstep(0.65, 0.10, phase);
  return mix(1.0, gate * (1.0 + uBeatPulse * 0.65), depth);
}
`;


// ==================== MODULE: js/shaders/generators.glsl.js ====================
/**
 * AETHER-VJ: 32 Complete Production-Grade GLSL Fragment Shaders
 *   - BANK A (0..7)  [GEO]: Orthographic 2D Geometry, Squares, Triangles & Polygons
 *   - BANK B (8..15) [KIN]: Dynamic Line Weights (Thin <-> Giant), L-to-R Sweeps & Kinetic Arrays
 *   - BANK C (16..23)[FLT]: Pure Flat Vector Graphics (Zero Glow / Zero FX, Color & Stroke Morphing)
 *   - BANK D (24..31)[SPC]: Architectural Portals, Horizon Grids, Vector Topography, 3D SDF & Audio Geometry
 */

// ============================================================================
// BANK A (0..7) [GEO]: ORTHOGRAPHIC 2D GEOMETRY, SQUARES & TRIANGLES
// ============================================================================

const SHADER_KINETIC_SQUARES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  // De 2 a 6 grandes marcos cuadrados concéntricos con movimiento sereno
  int numFrames = 2 + int(uComplexity * 4.0);
  for (int i = 0; i < 6; i++) {
    if (i >= numFrames) break;
    float fi = float(i);
    float normI = (fi + 1.0) / float(numFrames);

    float frameGlow = computeDynamicWeight(p, fi, 0.004, 0.038);
    float rotStep = sin(uTime * 0.30 + fi * 0.5) * (uChaos * 0.45);
    vec2 offset = vec2(cos(uTime * 0.35 + fi * 0.8), sin(uTime * 0.35 + fi * 0.8)) * (uChaos * 0.14);

    vec2 qp = (p - offset) * rot2D(rotStep);
    float radius = mix(0.18, 0.88, normI) * (0.85 + uScale * 0.35);

    float dFrame = sdShape(qp, radius, 1);
    float frameLine = renderStrokeOrStyle(dFrame, frameGlow);

    vec2 cornerP = abs(qp) - vec2(radius);
    float cornerDot = flatFill(sdSquare(cornerP, 0.015 + frameGlow * 0.45));

    vec3 frameCol = iqPalette(normI * 0.65);
    color += frameCol * (frameLine * 0.72 + cornerDot * 0.65);
  }

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.28);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_TRIANGLE_DELTAS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  int count = 2 + int(uComplexity * 4.0); // 2 a 6 grandes triángulos monumentales
  for (int i = 0; i < 6; i++) {
    if (i >= count) break;
    float fi = float(i);
    float ratio = (fi + 1.0) / float(count);

    float triW = computeDynamicWeight(p, fi, 0.004, 0.042);
    float flipSign = (mod(fi, 2.0) < 0.5) ? 1.0 : -1.0;
    float rot = (uChaos * 0.35) * sin(uTime * 0.30 + fi * 0.5) * flipSign;
    vec2 slide = vec2(sin(uTime * 0.40 + fi * 0.7) * uChaos * 0.18, 0.0);

    vec2 qp = (p - slide) * rot2D(rot);
    qp.y *= flipSign;

    float size = mix(0.20, 0.92, ratio) * (0.80 + uScale * 0.40);
    float dTri = sdShape(qp, size, 2);

    float triStroke = renderStrokeOrStyle(dTri, triW);
    color += iqPalette(ratio * 0.6 + 0.15) * triStroke * 0.75;
  }

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.30);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_PARALLEL_LINES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float freq = floor(2.0 + uScale * 6.0); // 2 a 8 líneas limpias y espaciadas
  vec3 color = vec3(0.0);

  float xCoord = p.x * freq * 0.5;
  float barId1 = floor(xCoord);
  float barLocal1 = abs(fract(xCoord) - 0.5);

  float glow = computeDynamicWeight(p, barId1, 0.005, 0.18);

  float slideY = uTime * 0.35 * ((mod(barId1, 2.0) < 0.5) ? 1.0 : -1.0);
  float segMask1 = (uChaos > 0.15) ? step(0.22, fract(p.y * 0.5 + slideY)) : 1.0;

  float line1 = renderStrokeOrStyle(barLocal1, glow) * segMask1;
  color += iqPalette(barId1 * 0.12) * line1 * 0.80;

  if (uComplexity > 0.35) {
    vec2 p2 = p * rot2D(PI * 0.5);
    float yCoord = p2.x * floor(1.0 + uComplexity * 4.0) * 0.5 - uTime * 0.30;
    float barId2 = floor(yCoord);
    float barLocal2 = abs(fract(yCoord) - 0.5);
    float glow2 = computeDynamicWeight(p2, barId2, 0.005, 0.14);

    float line2 = renderStrokeOrStyle(barLocal2, glow2);
    vec3 col2 = iqPalette(barId2 * 0.15 + 0.45);
    color += col2 * line2 * 0.55;
  }

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.28);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_POLYGON_MATRIX = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float cols = floor(1.0 + uScale * 3.0); // 1x1 a 4x4 polígonos grandes
  vec2 grid = p * cols * 0.5;

  vec2 cellId = floor(grid + 0.5 * mod(cols, 2.0));
  vec2 cellUv = fract(grid + 0.5 * mod(cols, 2.0)) - 0.5;
  float cellHash = hash21(cellId);

  float wave = sin(dot(cellId, vec2(0.55, 0.45)) - uTime * 0.65);
  float normWave = 0.5 + 0.5 * wave;

  vec2 localP = cellUv * rot2D(uTime * 0.20 * uChaos);

  int autoShape = 1 + int(mod(abs(cellId.x + cellId.y * 2.0 + floor(uComplexity * 3.99)), 4.0));
  float polyRadius = 0.24 + 0.10 * normWave;

  float dPoly = sdShape(localP, polyRadius, autoShape);
  float glow = computeDynamicWeight(p, cellId.x + cellId.y, 0.006, 0.085);

  float strokeOuter = renderStrokeOrStyle(dPoly, glow);
  float solidCore = flatFill(dPoly + 0.12) * smoothstep(0.55, 0.85, normWave) * 0.45;

  vec3 col1 = iqPalette(cellHash * 0.35 + normWave * 0.25);
  vec3 col2 = iqPalette(normWave * 0.35 + 0.45);

  vec3 color = col1 * strokeOuter * 0.80 + col2 * solidCore;
  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.25);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_BAUHAUS_SHAPES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float glow = computeDynamicWeight(p, 0.0, 0.005, 0.045);

  vec2 q = p * mix(0.85, 1.5, uScale);

  float slideA = sin(uTime * 0.38) * 0.32;
  float slideB = cos(uTime * 0.32) * 0.28;

  vec2 pSquare = q - vec2(slideA, 0.0);
  float dSq = sdShape(pSquare, 0.40, 1);
  float sqOutline = renderStrokeOrStyle(dSq, glow);
  float sqFill = flatFill(dSq) * 0.25;

  vec2 pTri = (q - vec2(-slideA * 0.8, slideB)) * rot2D(-uTime * 0.15 * uChaos);
  float dTri = sdShape(pTri, 0.44, 2);
  float triOutline = renderStrokeOrStyle(dTri, glow);

  vec2 pDiag = q * rot2D(PI * 0.25);
  float dBar = abs(pDiag.y - slideB * 0.4) - (0.02 + uComplexity * 0.06);
  float diagBeam = renderStrokeOrStyle(dBar, glow * 0.8) * step(0.25, uComplexity);

  float overlap = flatFill(max(dSq, dTri));

  vec3 colSq = iqPalette(0.10);
  vec3 colTri = iqPalette(0.48);
  vec3 colBeam = iqPalette(0.78);

  vec3 color = colSq * (sqOutline * 0.85 + sqFill)
             + colTri * (triOutline * 0.85)
             + colBeam * diagBeam * 0.65
             + vec3(0.95) * overlap * 0.55;

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.25);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_ORTHO_ISOMETRIC = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float gridScale = mix(1.4, 4.0, uScale);
  p *= gridScale;

  const mat2 toIso = mat2(1.0, 0.0, 0.577350269, 1.154700538);
  vec2 isoP = toIso * p;

  vec2 baseId = floor(isoP);
  if (mod(baseId.y, 2.0) < 0.5) {
    isoP.x += sin(uTime * 0.35) * uChaos * 0.45;
  }

  vec2 f = fract(isoP) - 0.5;
  vec2 id = floor(isoP);
  float cellHash = hash21(id);

  float dOuter = min(0.5 - abs(f.x), 0.5 - abs(f.y));
  float dDiag = abs(f.x + f.y) * 0.7071;
  float cubeWire = min(dOuter, dDiag);

  float faceId = (f.x + f.y > 0.0) ? ((f.x > f.y) ? 0.0 : 1.0) : 2.0;
  float faceLuma = (faceId == 0.0) ? 0.65 : ((faceId == 1.0) ? 0.35 : 0.12);

  float pulseWave = 0.5 + 0.5 * sin(dot(id, vec2(0.5, 0.7)) - uTime * 0.55);
  float glow = computeDynamicWeight(p, id.x + id.y, 0.006, 0.09);

  float mainStroke = renderStrokeOrStyle(cubeWire, glow);

  vec3 colFace = iqPalette(cellHash * 0.25 + faceId * 0.15);
  vec3 colEdge = iqPalette(pulseWave * 0.3 + 0.5);

  vec3 color = colFace * faceLuma * (0.18 + 0.32 * pulseWave) * smoothstep(0.2, 0.7, uThickness)
             + colEdge * mainStroke * 0.80;

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.25);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_TECH_VECTORS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float density = floor(1.0 + uScale * 3.0); // 1x1 a 4x4 miras técnicas limpias
  vec2 grid = p * density * 0.5;
  vec2 cellId = floor(grid + 0.5 * mod(density, 2.0));
  vec2 f = fract(grid + 0.5 * mod(density, 2.0)) - 0.5;

  float cellHash = hash21(cellId);
  float glow = computeDynamicWeight(p, cellHash * 6.0, 0.005, 0.055);

  float armLen = 0.20 + 0.10 * sin(uTime * 0.55 + cellHash * TAU);
  float dCross = min(
    sdBox2D(f, vec2(armLen, glow * 0.6)),
    sdBox2D(f, vec2(glow * 0.6, armLen))
  );
  float crossShape = flatFill(dCross);

  vec2 absF = abs(f);
  float bracketBox = abs(max(absF.x, absF.y) - 0.40);
  float cornerMask = step(0.22, max(absF.x, absF.y)) * step(min(absF.x, absF.y), 0.18);
  float brackets = flatStroke(bracketBox, glow * 0.55) * (1.0 - cornerMask);

  float dTarget = sdShape(f, 0.24, 1);
  float targetStroke = renderStrokeOrStyle(dTarget, glow * 0.60) * step(0.35, uComplexity);

  vec3 colMain = iqPalette(cellHash * 0.35 + 0.15);
  vec3 colAccent = iqPalette(0.60);

  vec3 color = colMain * (crossShape * 0.85 + brackets * 0.65)
             + colAccent * (targetStroke * 0.70);

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_STROBE_BLOCKS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float baseGrid = floor(1.0 + uScale * 3.0);
  vec2 uvGrid = p * baseGrid * 0.5;

  vec2 cellId = floor(uvGrid + 0.5 * mod(baseGrid, 2.0));
  vec2 f = fract(uvGrid + 0.5 * mod(baseGrid, 2.0)) - 0.5;

  float masterHash = hash21(cellId);
  float slowWave = 0.5 + 0.5 * sin(uTime * 0.65 + masterHash * TAU);
  float stroke = computeDynamicWeight(p, masterHash * 6.0, 0.04, 0.34) * (0.4 + 0.6 * slowWave);

  int autoShape = 1 + int(mod(floor(masterHash * 4.0 + uComplexity * 3.0), 4.0));
  float d = sdShape(f, stroke, autoShape);
  float geom = (mod(cellId.x + cellId.y, 2.0) < 0.5) ? flatFill(d) : flatStroke(d, stroke * 0.22);

  vec3 blockCol = iqPalette(masterHash * 0.5);
  vec3 color = blockCol * geom * 0.85;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ============================================================================
// BANK B (8..15) [KIN]: DYNAMIC LINE WEIGHTS & L-TO-R SWEEPS (CALM & STAGE READY)
// ============================================================================

const SHADER_BREATHING_WEIGHTS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float numCols = floor(2.0 + uScale * 6.0);      // 2 a 8 columnas limpias
  float numRows = floor(1.0 + uComplexity * 2.0); // 1 a 3 filas

  vec2 grid = vec2(p.x * numCols * 0.5, p.y * numRows * 0.5);
  vec2 id = floor(grid);
  vec2 f = fract(grid) - 0.5;

  float rowDir = (mod(id.y, 2.0) < 0.5) ? 1.0 : -1.0;
  float driftX = p.x * numCols * 0.5 - uTime * (0.28 + uChaos * 0.45) * rowDir;
  float colId = floor(driftX);
  float localX = abs(fract(driftX) - 0.5);

  float colPhase = colId * 0.65 + id.y * 1.15 - uTime * 0.65;
  float breathe = 0.5 + 0.5 * sin(colPhase);
  float dynWidth = computeDynamicWeight(p, colId + id.y * 4.0, 0.005, 0.26) * (0.25 + 0.95 * breathe);
  dynWidth = clamp(dynWidth, 0.004, 0.28);

  float solidBar = flatFill(localX - dynWidth);
  float rowMargin = flatFill(abs(f.y) - 0.42);

  if (uShapeMode > 0 && uShapeMode < 5) {
    float dPoly = sdShape(vec2(fract(driftX) - 0.5, f.y), dynWidth * 0.95, uShapeMode);
    solidBar = flatFill(dPoly);
  }

  vec3 colBar = iqPalette(colId * 0.12 + id.y * 0.25);
  vec3 color = colBar * solidBar * rowMargin;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_LR_SCANNER = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  float lanes = floor(1.0 + uComplexity * 3.0); // 1 a 4 carriles amplios
  float laneY = p.y * lanes * 0.5 + 0.5 * lanes;
  float laneId = floor(laneY);
  float localY = fract(laneY) - 0.5;

  float dir = (mod(laneId, 2.0) < 0.5) ? 1.0 : -1.0;
  float laneSpeed = 0.22 + hash11(laneId * 13.7) * 0.18;
  float scanPhase = fract(uTime * laneSpeed + laneId * 0.25);

  float normX = (dir > 0.0) ? vUv.x : (1.0 - vUv.x);
  float trailDist = fract(scanPhase - normX);
  float headDist = abs(normX - scanPhase);

  float headWidth = computeDynamicWeight(p, laneId, 0.004, 0.065);
  float laserHead = renderStrokeOrStyle(headDist, headWidth);

  float gridCols = floor(3.0 + uScale * 6.0);
  vec2 cellUv = vec2(fract(p.x * gridCols * 0.5) - 0.5, localY);
  float wakeSize = clamp((1.0 - trailDist * 1.45), 0.0, 1.0) * 0.36;

  float dWakeShape = sdShape(cellUv, wakeSize, 1);
  float wakeGeom = renderStrokeOrStyle(dWakeShape, 0.018) * smoothstep(0.75, 0.0, trailDist);
  float laneBorder = flatFill(abs(localY) - 0.44);

  vec3 colHead = iqPalette(laneId * 0.22 + 0.5);
  vec3 colTrail = iqPalette(trailDist * 0.45 + laneId * 0.18);

  color = (colHead * laserHead * 0.85 + colTrail * wakeGeom * 0.75) * laneBorder;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_ACCORDION_SHUTTERS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float baseFreq = mix(2.5, 7.0, uScale);
  float modWave = sin(p.x * 1.4 - uTime * 0.55);

  float warpedX = p.x * baseFreq + modWave * (1.2 + uComplexity * 1.8);
  float lineId = floor(warpedX);
  float f = abs(fract(warpedX) - 0.5);

  float compression = 0.5 + 0.5 * cos(p.x * 1.4 - uTime * 0.55);
  float strokeW = computeDynamicWeight(p, lineId, 0.008, 0.24) * (0.25 + 0.95 * compression);
  strokeW = clamp(strokeW, 0.006, 0.28);

  float bar = flatFill(f - strokeW);
  float verticalMargin = flatFill(abs(p.y) - 0.82);

  vec3 col = iqPalette(compression * 0.45 + lineId * 0.08);
  vec3 color = col * bar * verticalMargin * 0.90;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_PENDULUM_MATRIX = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float numRows = floor(3.0 + uScale * 7.0); // 3 a 10 barras horizontales amplias
  float rowCoord = p.y * numRows * 0.5;
  float rowId = floor(rowCoord);
  float localY = fract(rowCoord) - 0.5;

  float harmonicFreq = 0.35 + abs(rowId) * (0.03 + uComplexity * 0.05);
  float sweepX = sin(uTime * harmonicFreq) * 0.78;
  float sweepX2 = -sweepX * 0.85;

  float barHalfW = computeDynamicWeight(p, rowId, 0.02, 0.28);

  float dShape1 = sdShape(vec2(p.x - sweepX, localY * 0.40), barHalfW, 1);
  float dShape2 = sdShape(vec2(p.x - sweepX2, localY * 0.40), barHalfW * 0.65, 2);

  float glow1 = flatFill(dShape1);
  float glow2 = flatStroke(dShape2, 0.025);
  float rowMask = flatFill(abs(localY) - 0.38);

  vec3 col1 = iqPalette(rowId * 0.10 + 0.1);
  vec3 col2 = iqPalette(rowId * 0.10 + 0.55);

  vec3 color = (col1 * glow1 * 0.88 + col2 * glow2 * 0.75) * rowMask;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_SLIDING_MONOLITHS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float panelsX = floor(1.0 + uScale * 3.0);
  float panelsY = floor(1.0 + uComplexity * 2.0);

  vec2 grid = vec2(p.x * panelsX * 0.5, p.y * panelsY * 0.5);
  vec2 panelId = floor(grid);
  vec2 localUv = fract(grid) - 0.5;

  float doorSlide = sin(uTime * 0.40 + hash21(panelId) * TAU) * 0.24;

  vec2 doorP = localUv - vec2(doorSlide, 0.0);
  float borderW = computeDynamicWeight(p, panelId.x + panelId.y * 3.0, 0.006, 0.12);
  float dDoor = sdShape(doorP, 0.36, 1);

  float doorFrame = flatStroke(dDoor, borderW);

  float slitPos = cos(uTime * 0.55 + panelId.x) * 0.22;
  float slitW = computeDynamicWeight(p, panelId.y + 5.0, 0.005, 0.08);
  float innerSlit = flatStroke(doorP.x - slitPos, slitW) * flatFill(dDoor);

  vec3 colFrame = iqPalette(hash21(panelId) * 0.5 + 0.1);
  vec3 colSlit = iqPalette(0.60);

  vec3 color = colFrame * doorFrame * 0.88 + colSlit * innerSlit * 0.85;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_CHEVRON_LANES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float numLanes = floor(1.0 + uComplexity * 2.5); // 1 a 3 carriles limpios
  float laneCoord = p.y * numLanes * 0.5;
  float laneId = floor(laneCoord);
  float localY = fract(laneCoord) - 0.5;

  float dir = (mod(laneId, 2.0) < 0.5) ? 1.0 : -1.0;
  float foldAngle = 0.65 + uChaos * 0.35;
  float chevFreq = floor(2.0 + uScale * 4.0); // 2 a 6 chevrons grandes y claros
  float chevX = (p.x * dir + abs(localY) * foldAngle) * chevFreq * 0.5 - uTime * 0.45;

  float chevId = floor(chevX);
  float f = abs(fract(chevX) - 0.5);

  float w = computeDynamicWeight(p, chevId + laneId * 4.0, 0.010, 0.22);
  float chevron = flatFill(f - w);
  float laneMask = flatFill(abs(localY) - 0.40);

  vec3 col = iqPalette(chevId * 0.14 + laneId * 0.25);
  vec3 color = col * chevron * laneMask * 0.88;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_METRIC_SCANNER = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  float scanX1 = sin(uTime * 0.38) * 1.15;
  float scanY1 = cos(uTime * 0.31) * 0.78;

  float w = computeDynamicWeight(p, 1.0, 0.004, 0.032);

  float beamX1 = renderStrokeOrStyle(p.x - scanX1, w);
  float beamY1 = renderStrokeOrStyle(p.y - scanY1, w);

  float gridScale = floor(2.0 + uScale * 3.0);
  vec2 grid = p * gridScale * 0.5;
  vec2 cellId = floor(grid);
  vec2 cellUv = fract(grid) - 0.5;
  float cellHash = hash21(cellId);

  int polyType = 1 + int(mod(abs(cellId.x + cellId.y), 3.0));
  float dPoly = sdShape(cellUv, 0.30, polyType);
  float polyStroke = renderStrokeOrStyle(dPoly, w * 0.9);

  float prox = exp(-min(abs(p.x - scanX1), abs(p.y - scanY1)) * 2.8);
  float baseVis = 0.18 + 0.82 * prox;

  vec3 colGrid = iqPalette(cellHash * 0.4 + prox * 0.25);
  vec3 colLaser = iqPalette(0.65);

  color = colGrid * polyStroke * baseVis * 0.80
        + colLaser * (beamX1 + beamY1) * 0.70;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const SHADER_DATAMATICS_STREAMS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float tracks = floor(2.0 + uComplexity * 5.0); // 2 a 7 pistas amplias y legibles
  float trackCoord = p.y * tracks * 0.5;
  float trackId = floor(trackCoord);
  float localY = fract(trackCoord) - 0.5;

  float trackRand = hash11(trackId * 19.7);
  float dir = (mod(trackId, 2.0) < 0.5) ? 1.0 : -1.0;
  float speed = (0.35 + trackRand * 0.65) * dir;

  float density = floor(2.0 + uScale * 6.0);
  float streamX = p.x * density * 0.5 - uTime * speed;
  float cellId = floor(streamX);
  float localX = abs(fract(streamX) - 0.5);

  float dataHash = hash21(vec2(cellId, trackId));
  float packetWidth = computeDynamicWeight(p, cellId + trackId, 0.015, 0.28) * (0.3 + 0.7 * dataHash);
  float bitOn = step(0.42, dataHash);
  float bar = flatFill(localX - packetWidth) * bitOn;

  float rowMask = flatFill(abs(localY) - 0.38);
  vec3 colData = iqPalette(trackRand * 0.5 + step(0.85, dataHash) * 0.35);

  vec3 color = colData * bar * rowMask * 0.88;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ============================================================================
// BANK C (16..23) [FLT]: PURE FLAT VECTOR GRAPHICS (ZERO GLOW / ZERO FX)
// Diseñados específicamente para pantallas LED de eventos: mucho espacio negro,
// pocas figuras grandes y elegantes, movimientos suaves y cero parpadeo.
// ============================================================================

/**
 * 17. FLT-17: MARCOS PLANOS CONCÉNTRICOS (Monumental Flat Frames)
 * De 2 a 5 grandes marcos geométricos planos sobre fondo negro puro que respiran
 * suavemente en grosor y evolucionan de color sin marear.
 */
const SHADER_FLAT_COLOR_BANDS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  int numRings = 2 + int(uScale * 4.0); // 2 a 6 marcos grandes y espaciados
  int defaultShape = 1 + int(mod(floor(uComplexity * 3.99), 4.0));

  for (int i = 0; i < 6; i++) {
    if (i >= numRings) break;
    float fi = float(i);
    float ratio = (fi + 1.0) / float(numRings);

    // Movimiento suave de respiración en escala y grosor
    float breathe = 0.5 + 0.5 * sin(uTime * 0.55 - fi * 0.85);
    float radius = ratio * 0.82 * (0.92 + 0.12 * breathe);

    vec2 shift = vec2(sin(uTime * 0.35 + fi), cos(uTime * 0.28 + fi)) * (uChaos * 0.12);
    float d = sdShape(p - shift, radius, defaultShape);

    // Grosor varía suavemente entre línea fina (0.006) y banda ancha (0.065), dejando siempre fondo negro limpio
    float halfWidth = mix(0.005, 0.065, clamp(uThickness * (0.35 + 0.95 * breathe) + uAudioFFT.x * 0.20, 0.02, 1.0));
    float frameMask = flatStroke(d, halfWidth);

    vec3 ringCol = iqPalette(fi * 0.18);
    color = mix(color, ringCol, frameMask);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 18. FLT-18: BLOQUES ARQUITECTÓNICOS MONDRIAN (Calm Architectural Grid)
 * Paneles rectangulares limpios que se deslizan con calma sobre fondo negro,
 * sin parpadeos bruscos.
 */
const SHADER_FLAT_MONDRIAN = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float cols = floor(1.0 + uScale * 3.0);      // 1 a 4 columnas grandes
  float rows = floor(1.0 + uComplexity * 2.5); // 1 a 3 filas grandes
  vec2 grid = vec2(p.x * cols * 0.5, p.y * rows * 0.5);

  vec2 macroId = floor(grid);
  vec2 macroUv = fract(grid);

  float cellSeed = hash21(macroId);
  // Deslizamiento lento y sedoso de las divisiones interiores
  float splitX = 0.5 + 0.28 * sin(uTime * 0.35 + cellSeed * TAU);
  float splitY = 0.5 + 0.28 * cos(uTime * 0.28 + cellSeed * TAU * 1.3);

  float subX = step(splitX, macroUv.x);
  float subY = step(splitY, macroUv.y);
  vec2 subId = vec2(subX, subY);

  float distBorderX = min(min(macroUv.x, 1.0 - macroUv.x), abs(macroUv.x - splitX));
  float distBorderY = min(min(macroUv.y, 1.0 - macroUv.y), abs(macroUv.y - splitY));
  float borderDist = min(distBorderX, distBorderY);

  // Grosor de las líneas divisorias
  float lineW = computeDynamicWeight(p, cellSeed * 6.0, 0.006, 0.065);
  float isBorderLine = flatStroke(borderDist, lineW * 0.5);

  // Solo 1 de cada 3 bloques tiene relleno suave; el resto es negro puro de escenario
  float subHash = hash21(macroId * 7.3 + subId * 19.1);
  float slowWave = 0.5 + 0.5 * sin(uTime * 0.4 + subHash * TAU);
  float isFilled = step(0.62, subHash) * flatFill(borderDist - lineW * 1.6);

  vec3 blockColor = iqPalette(subHash * 0.8) * (0.35 + 0.55 * slowWave);
  vec3 borderColor = iqPalette(0.5 + cellSeed * 0.25);

  vec3 color = blockColor * isFilled + borderColor * isBorderLine;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 19. FLT-19: DE LÍNEA FINA A BLOQUE SÓLIDO (Stroke-to-Solid Morpher)
 * 1 a 3 grandes figuras geométricas limpias cuyo borde se ensancha lentamente
 * hasta rellenar la figura y vuelve a adelgazar con total suavidad.
 */
const SHADER_FLAT_STROKE_MORPHER = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  // 1 gran figura central por defecto, o hasta 3x3 si se sube el Zoom/Tamaño
  float count = floor(1.0 + uScale * 2.5);
  vec2 grid = p * count * 0.5;
  vec2 cellId = floor(grid + 0.5 * mod(count, 2.0));
  vec2 localP = fract(grid + 0.5 * mod(count, 2.0)) - 0.5;

  float cellIndex = cellId.x + cellId.y * count;
  float phase = uTime * 0.55 + cellIndex * 0.85;

  int cellShape = 1 + int(mod(abs(cellIndex) + floor(uComplexity * 3.99), 4.0));
  vec2 q = localP * rot2D(sin(uTime * 0.25 + cellIndex) * uChaos * 0.5);

  float shapeRadius = 0.34;
  float d = sdShape(q, shapeRadius, cellShape);

  // Transición sedosa desde hilo fino (0.005) hasta figura 100% rellena (0.34)
  float morphWave = 0.5 + 0.5 * sin(phase);
  float w = mix(0.005, shapeRadius, clamp(uThickness * 0.55 + morphWave * 0.65 * (0.35 + uThickness), 0.01, 1.0));

  float shapeMask = flatFill(d) * (1.0 - flatFill(d + w));

  // Segundo contorno interior fino de contraste cuando el exterior es delgado
  float innerRadius = max(0.0, shapeRadius - w - 0.06);
  float dInner = sdShape(q, innerRadius * 0.7, cellShape);
  float innerMask = flatStroke(dInner, 0.006) * step(0.05, innerRadius);

  vec3 colOuter = iqPalette(cellIndex * 0.18);
  vec3 colInner = iqPalette(cellIndex * 0.18 + 0.45);

  vec3 color = colOuter * shapeMask + colInner * innerMask;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 20. FLT-20: BANDAS PLANAS MINIMALISTAS (Minimal Flat Stage Bars)
 * De 2 a 6 grandes barras paralelas sobre fondo negro con grosor respirante
 * y desplazamiento lento y elegante.
 */
const SHADER_FLAT_COLOR_STRIPES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float numBands = floor(2.0 + uScale * 5.0); // 2 a 7 bandas limpias (nunca saturado)
  float splitZones = (uComplexity > 0.55) ? 2.0 : 1.0;
  float zoneId = floor((p.y + 1.0) * 0.5 * splitZones);
  float zoneDir = (mod(zoneId, 2.0) < 0.5) ? 1.0 : -1.0;

  float coord = p.x * numBands * 0.5 - uTime * 0.35 * zoneDir;
  float stripeId = floor(coord);
  float localX = abs(fract(coord) - 0.5);

  // El grosor nunca supera 0.30 para dejar siempre al menos 40% de negro puro entre barras
  float wMod = 0.5 + 0.5 * sin(stripeId * 0.9 - uTime * 0.65);
  float barW = mix(0.008, 0.28, clamp(uThickness * (0.30 + 0.95 * wMod) + uAudioFFT.x * 0.18, 0.015, 1.0));

  float barMask = flatFill(localX - barW);
  float verticalMargin = flatFill(abs(p.y) - 0.82);

  vec3 stripeCol = iqPalette(stripeId * 0.16 + zoneId * 0.35);
  vec3 color = stripeCol * barMask * verticalMargin;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 21. FLT-21: CAPAS POLIGONALES SUPERPUESTAS (Minimal Layered Polygons)
 * 3 a 5 polígonos planos con rotación lenta e hipnótica y bordes limpios.
 */
const SHADER_FLAT_POLY_STACK = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  int layers = 2 + int(uComplexity * 4.0); // 2 a 6 capas limpias
  int defaultPoly = 1 + int(mod(floor(uScale * 3.99), 4.0));

  for (int i = 0; i < 6; i++) {
    if (i >= layers) break;
    float fi = float(i);
    float ratio = 1.0 - (fi / float(layers + 1));

    float stepAngle = sin(uTime * 0.30 - fi * 0.45) * (0.18 + uChaos * 0.55);
    vec2 qp = p * rot2D(stepAngle);

    float rad = ratio * (0.68 + uScale * 0.22);
    float d = sdShape(qp, rad, defaultPoly);

    float fillMask = flatFill(d);
    float borderW = mix(0.004, 0.035, uThickness) * (0.6 + 0.4 * ratio);
    float borderMask = flatStroke(d, borderW);

    vec3 layerFillCol = iqPalette(fi * 0.20) * 0.28;
    vec3 layerBorderCol = iqPalette(fi * 0.20 + 0.45);

    float fillOpacity = smoothstep(0.25, 0.75, uThickness);
    vec3 layerCol = mix(layerFillCol * fillOpacity, layerBorderCol, borderMask);

    color = mix(color, layerCol, max(fillMask * fillOpacity, borderMask));
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 22. FLT-22: CÁPSULAS Y BARRAS REDONDEADAS (Calm Kinetic Capsules)
 * De 2 a 5 filas espaciadas de cápsulas planas que se estiran y deslizan con calma.
 */
const SHADER_FLAT_CAPSULES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float rows = floor(2.0 + uScale * 4.0);      // 2 a 6 filas amplias
  float cols = floor(1.0 + uComplexity * 2.0); // 1 a 3 columnas
  vec2 grid = vec2(p.x * cols * 0.5, p.y * rows * 0.5);

  vec2 cellId = floor(grid);
  vec2 localP = fract(grid) - 0.5;
  float cellHash = hash21(cellId);

  float slideX = sin(uTime * (0.45 + cellHash * 0.4) + cellId.y * 0.9) * (0.14 + uChaos * 0.18);
  float capHalfLen = 0.14 + 0.20 * (0.5 + 0.5 * cos(uTime * 0.55 + cellHash * TAU));
  float capRadius = computeDynamicWeight(p, cellId.y + cellId.x * 2.0, 0.015, 0.22);

  float dCapsule = sdRoundedBox(localP - vec2(slideX, 0.0), vec2(capHalfLen, capRadius), min(capHalfLen, capRadius));

  // Alterna limpiamente entre cápsula hueca de línea fina y cápsula rellena según la fila
  float isHollow = mod(abs(cellId.y + cellId.x), 2.0);
  float strokeW = mix(0.006, 0.045, uThickness);
  float mask = mix(flatFill(dCapsule), flatStroke(dCapsule, strokeW), isHollow);

  vec3 col = iqPalette(cellId.y * 0.18 + cellHash * 0.25);
  vec3 color = col * mask;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 23. FLT-23: INTERSECCIÓN DE DOS FORMAS (Boolean Cutout Choreography)
 * Dos grandes figuras geométricas que se cruzan lentamente en el centro del escenario,
 * cambiando de color de forma limpia donde se solapan.
 */
const SHADER_FLAT_BOOLEAN_XOR = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float zoom = mix(0.85, 1.65, uScale);
  vec2 q = p * zoom;

  float t = uTime * 0.38;
  vec2 offsetA = vec2(sin(t) * 0.30, cos(t * 0.7) * 0.16);
  vec2 offsetB = vec2(-sin(t * 0.85) * 0.30, -cos(t * 0.7) * 0.16);

  float size = 0.46 + 0.06 * sin(t * 1.2);
  float dA = sdShape((q - offsetA) * rot2D(t * 0.20 * uChaos), size, 1);         // Cuadrado (o forma elegida)
  float dB = sdShape((q - offsetB) * rot2D(-t * 0.25 * uChaos), size * 1.02, 2); // Triángulo (o forma elegida)

  float inA = flatFill(dA);
  float inB = flatFill(dB);

  float w = computeDynamicWeight(p, 1.0, 0.005, 0.045);
  float strokeA = flatStroke(dA, w);
  float strokeB = flatStroke(dB, w);

  vec3 colA = iqPalette(0.10);
  vec3 colB = iqPalette(0.48);
  vec3 colOverlap = iqPalette(0.82);

  float both = inA * inB;
  float fillAlpha = smoothstep(0.15, 0.65, uThickness) * 0.65;

  vec3 fillCol = (colA * (inA - both) + colB * (inB - both)) * fillAlpha
               + colOverlap * both * 0.90;

  vec3 strokeCol = colA * strokeA + colB * strokeB;
  vec3 color = max(fillCol, strokeCol);

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 24. FLT-24: SÍMBOLOS GEOMÉTRICOS DE GROSOR VARIABLE (Minimal Stage Symbols)
 * Cuadrícula espaciada (2x2 a 4x4) de grandes símbolos (+, ×, □, △, ○) que cambian
 * suavemente de grosor sin parpadear.
 */
const SHADER_FLAT_SYMBOL_MATRIX = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float gridN = floor(1.0 + uScale * 3.0); // 1x1 a 4x4 símbolos grandes y claros
  vec2 grid = p * gridN * 0.5;
  vec2 cellId = floor(grid + 0.5 * mod(gridN, 2.0));
  vec2 f = fract(grid + 0.5 * mod(gridN, 2.0)) - 0.5;

  float cellHash = hash21(cellId);
  int symType = int(mod(abs(cellId.x + cellId.y * 2.0 + floor(uComplexity * 4.99)), 5.0));

  // Onda suave de grosor (de hilo fino a trazo grueso)
  float weightWave = 0.5 + 0.5 * sin(dot(cellId, vec2(0.7, 0.5)) - uTime * 0.70);
  float w = mix(0.006, 0.14, clamp(uThickness * (0.25 + 1.10 * weightWave) + uAudioFFT.x * 0.20, 0.01, 1.0));

  float dSym = 1.0;
  if (uShapeMode > 0) {
    dSym = abs(sdShape(f, 0.28, uShapeMode)) - w * 0.5;
  } else if (symType == 0) {
    dSym = min(sdBox2D(f, vec2(0.30, w)), sdBox2D(f, vec2(w, 0.30)));
  } else if (symType == 1) {
    vec2 rf = f * rot2D(PI * 0.25);
    dSym = min(sdBox2D(rf, vec2(0.32, w)), sdBox2D(rf, vec2(w, 0.32)));
  } else if (symType == 2) {
    dSym = abs(sdSquare(f, 0.26)) - w * 0.55;
  } else if (symType == 3) {
    dSym = abs(sdEquilateralTriangle(f, 0.28)) - w * 0.55;
  } else {
    dSym = abs(sdCircle(f, 0.26)) - w * 0.55;
  }

  float symMask = flatFill(dSym);
  vec3 symCol = iqPalette(cellHash * 0.45 + weightWave * 0.25);

  vec3 color = symCol * symMask;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ============================================================================
// BANK D (24..31) [SPC]: OBJETOS VOLUMÉTRICOS 3D, HIPERCUBOS, ESFERAS Y MUNDOS 3D
// ============================================================================

/**
 * 25. SPC-25: CUBO E HIPERCUBO 3D GIRATORIO (3D Wireframe Cube & Tesseract)
 * Proyección y Raymarching 3D real de un Cubo / Hipercubo (Tesseract) flotando y
 * rotando suavemente en los 3 ejes (X, Y, Z) con aristas de grosor variable y caras iluminadas.
 */
const SHADER_POLYGON_PORTALS = `${COMMON_GLSL_HEADER}
float sdWireBox3D(vec3 p, vec3 b, float e) {
  p = abs(p) - b;
  vec3 q = abs(p + e) - e;
  return min(min(
    length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
    length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
    length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0)
  );
}

float sdSolidBox3D(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

vec3 rotate3D(vec3 p, float rx, float ry, float rz) {
  p.yz *= rot2D(rx);
  p.xz *= rot2D(ry);
  p.xy *= rot2D(rz);
  return p;
}

void main() {
  vec2 p = transformOrthoCoords(vUv);

  vec3 ro = vec3(0.0, 0.0, -3.1 + uScale * 0.85);
  vec3 rd = normalize(vec3(p, 1.65));

  float rx = uTime * 0.38 + 0.45;
  float ry = uTime * 0.52 + 0.65;
  float rz = uTime * 0.24 * uChaos;

  float edgeThickness = mix(0.012, 0.075, uThickness);
  float outerSize = 0.82;
  float innerSize = 0.42 + 0.12 * sin(uTime * 0.65);

  float t = 0.0;
  float minWireDist = 100.0;
  float minInnerDist = 100.0;
  float hitSolidT = -1.0;

  for (int i = 0; i < 44; i++) {
    vec3 pos = ro + rd * t;
    vec3 qOuter = rotate3D(pos, rx, ry, rz);
    vec3 qInner = rotate3D(pos, -rx * 0.8, -ry * 1.1, rz);

    float dWireOuter = sdWireBox3D(qOuter, vec3(outerSize), edgeThickness);
    float dWireInner = (uComplexity > 0.25)
      ? sdWireBox3D(qInner, vec3(innerSize), edgeThickness * 0.75)
      : 100.0;

    minWireDist = min(minWireDist, dWireOuter);
    minInnerDist = min(minInnerDist, dWireInner);

    float dSolid = sdSolidBox3D(qOuter, vec3(outerSize * 0.98));
    if (dSolid < 0.004 && hitSolidT < 0.0) {
      hitSolidT = t;
    }

    float stepD = min(dWireOuter, dWireInner);
    if (stepD < 0.002 || t > 6.0) break;
    t += max(stepD * 0.85, 0.02);
  }

  float outerMask = (uStyleMode == 1)
    ? smoothstep(0.018, 0.002, minWireDist)
    : clamp(0.012 / (minWireDist + 0.004), 0.0, 1.0);
  float innerMask = (uStyleMode == 1)
    ? smoothstep(0.016, 0.002, minInnerDist)
    : clamp(0.010 / (minInnerDist + 0.004), 0.0, 1.0);

  vec3 colOuter = iqPalette(0.12);
  vec3 colInner = iqPalette(0.55);

  vec3 color = colOuter * outerMask * 0.95 + colInner * innerMask * 0.85;

  // Sombreado translúcido de las caras 3D cuando el grosor es alto
  if (hitSolidT > 0.0 && uThickness > 0.45) {
    vec3 hitPos = rotate3D(ro + rd * hitSolidT, rx, ry, rz);
    vec3 absP = abs(hitPos);
    float faceShade = (absP.x > absP.y && absP.x > absP.z) ? 0.85 : ((absP.y > absP.z) ? 0.55 : 0.30);
    color = mix(color, colOuter * faceShade * 0.45, smoothstep(0.45, 0.95, uThickness) * (1.0 - outerMask));
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 26. SPC-26: PIRÁMIDE Y OCTAEDRO HOLOGRÁFICO 3D (3D Faceted Octahedron & Orbit Rings)
 * Octaedro / Pirámide 3D flotando en el espacio con iluminación de caras 3D, aristas brillantes
 * y anillos orbitales 3D inclinados.
 */
const SHADER_HYPER_LINES = `${COMMON_GLSL_HEADER}
float sdOctahedron3D(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdRing3D(vec3 p, float radius, float thickness) {
  vec2 d = vec2(length(p.xz) - radius, p.y);
  return length(d) - thickness;
}

vec3 rot3(vec3 p, float ax, float ay) {
  p.yz *= rot2D(ax);
  p.xz *= rot2D(ay);
  return p;
}

void main() {
  vec2 p = transformOrthoCoords(vUv);

  vec3 ro = vec3(0.0, 0.0, -3.0 + uScale * 0.8);
  vec3 rd = normalize(vec3(p, 1.6));

  float ax = uTime * 0.32 + 0.35;
  float ay = uTime * 0.48;
  float octSize = 0.88;
  float ringW = mix(0.008, 0.048, uThickness);

  float t = 0.0;
  float hitOctT = -1.0;
  float minRingDist = 100.0;
  float minEdgeDist = 100.0;

  for (int i = 0; i < 48; i++) {
    vec3 pos = ro + rd * t;
    vec3 q = rot3(pos, ax, ay);

    float dOct = sdOctahedron3D(q, octSize);

    // Distancia a las 12 aristas del octaedro 3D
    vec3 aq = abs(q);
    float edge1 = abs(aq.x + aq.y - octSize) * 0.7071 + aq.z;
    float edge2 = abs(aq.y + aq.z - octSize) * 0.7071 + aq.x;
    float edge3 = abs(aq.x + aq.z - octSize) * 0.7071 + aq.y;
    float dWire = min(edge1, min(edge2, edge3));
    minEdgeDist = min(minEdgeDist, dWire);

    // Anillos orbitales 3D alrededor de la pirámide
    vec3 rPos1 = rot3(pos, 0.45 + sin(uTime * 0.3) * 0.3, uTime * 0.4);
    float dRing1 = sdRing3D(rPos1, 1.18, ringW);
    vec3 rPos2 = rot3(pos, -0.55, -uTime * 0.35);
    float dRing2 = (uComplexity > 0.25) ? sdRing3D(rPos2, 1.42, ringW * 0.8) : 100.0;
    minRingDist = min(minRingDist, min(dRing1, dRing2));

    if (dOct < 0.003 && hitOctT < 0.0) {
      hitOctT = t;
    }

    float stepD = min(abs(dOct), min(dRing1, dRing2));
    if (t > 6.0) break;
    t += max(stepD * 0.75, 0.025);
  }

  vec3 color = vec3(0.0);

  // Caras 3D iluminadas del octaedro
  if (hitOctT > 0.0) {
    vec3 hitP = rot3(ro + rd * hitOctT, ax, ay);
    vec3 normal = normalize(sign(hitP));
    vec3 lightDir = normalize(vec3(0.6, 0.8, -0.7));
    float diff = 0.25 + 0.75 * max(dot(normal, lightDir), 0.0);
    vec3 faceCol = iqPalette(0.15 + diff * 0.25);
    color += faceCol * diff * (0.25 + 0.55 * uThickness);
  }

  float edgeStroke = smoothstep(ringW * 1.4, ringW * 0.2, minEdgeDist);
  float ringStroke = smoothstep(ringW * 1.2, 0.002, minRingDist);

  color += iqPalette(0.55) * edgeStroke * 0.95;
  color += iqPalette(0.80) * ringStroke * 0.90;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 27. SPC-27: ESFERA GEODÉSICA / GLOBO 3D (3D Wireframe Globe & Lat/Lon Grid)
 * Esfera 3D real proyectada por intersección rayo-esfera mostrando meridianos y paralelos
 * tanto en el hemisferio frontal como en el hemisferio trasero en perspectiva.
 */
const SHADER_MOIRE_CIRCLES = `${COMMON_GLSL_HEADER}
vec3 rotSphere(vec3 p, float rx, float ry) {
  p.yz *= rot2D(rx);
  p.xz *= rot2D(ry);
  return p;
}

float evalSphereGrid(vec3 n, float latFreq, float lonFreq, float lineW) {
  float lat = asin(clamp(n.y, -1.0, 1.0));
  float lon = atan(n.z, n.x);

  float dLat = abs(fract(lat * latFreq / PI + 0.5) - 0.5) / latFreq * PI;
  float dLon = abs(fract(lon * lonFreq / TAU + 0.5) - 0.5) / lonFreq * TAU * cos(lat);

  float dGrid = min(dLat, dLon);
  return smoothstep(lineW, lineW * 0.15, dGrid);
}

void main() {
  vec2 p = transformOrthoCoords(vUv);

  vec3 ro = vec3(0.0, 0.0, -2.6);
  vec3 rd = normalize(vec3(p, 1.65));

  float radius = 0.78 + uScale * 0.35;
  float b = dot(ro, rd);
  float c = dot(ro, ro) - radius * radius;
  float h = b * b - c;

  vec3 color = vec3(0.0);
  float rx = 0.38 + sin(uTime * 0.25) * 0.25;
  float ry = uTime * 0.42;

  float latFreq = floor(4.0 + uComplexity * 6.0);
  float lonFreq = floor(6.0 + uComplexity * 10.0);
  float lineW = mix(0.008, 0.055, uThickness);

  if (h > 0.0) {
    float sqrtH = sqrt(h);
    float tFront = -b - sqrtH;
    float tBack = -b + sqrtH;

    // Hemisferio trasero (atenuado por profundidad 3D)
    vec3 nBack = rotSphere(normalize(ro + rd * tBack), rx, ry);
    float gridBack = evalSphereGrid(nBack, latFreq, lonFreq, lineW * 0.85);
    color += iqPalette(0.55 + nBack.y * 0.2) * gridBack * 0.28;

    // Hemisferio frontal (nítido y brillante con realce Fresnel en el borde 3D)
    vec3 worldFront = normalize(ro + rd * tFront);
    vec3 nFront = rotSphere(worldFront, rx, ry);
    float gridFront = evalSphereGrid(nFront, latFreq, lonFreq, lineW);
    float fresnel = pow(1.0 - abs(dot(worldFront, rd)), 2.5);

    vec3 colFront = iqPalette(0.12 + nFront.y * 0.25);
    color = mix(color, colFront, gridFront * 0.95);
    color += iqPalette(0.75) * fresnel * (0.25 + uThickness * 0.45);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 28. SPC-28: GIROSCOPIO DE ANILLOS 3D (3D Gimbal / Gyroscope Rings)
 * Anillos 3D concéntricos con volumen real que giran independientemente en los ejes X, Y, Z.
 */
const SHADER_CONTOUR_TOPOGRAPHY = `${COMMON_GLSL_HEADER}
float sdTorus3D(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xy) - t.x, p.z);
  return length(q) - t.y;
}

void main() {
  vec2 p = transformOrthoCoords(vUv);

  vec3 ro = vec3(0.0, 0.0, -2.85 + uScale * 0.65);
  vec3 rd = normalize(vec3(p, 1.65));

  int numRings = 3 + int(uComplexity * 3.0);
  float tubeR = mix(0.012, 0.055, uThickness);

  float t = 0.0;
  float hitRingId = -1.0;
  vec3 hitPos = vec3(0.0);

  for (int i = 0; i < 48; i++) {
    vec3 pos = ro + rd * t;
    float minD = 100.0;

    for (int r = 0; r < 6; r++) {
      if (r >= numRings) break;
      float fr = float(r);
      float ringRadius = 0.35 + fr * 0.20;

      vec3 q = pos;
      q.yz *= rot2D(uTime * (0.35 + fr * 0.08) + fr * 1.1);
      q.xz *= rot2D(uTime * (0.28 - fr * 0.06) + fr * 0.7);

      float d = sdTorus3D(q, vec2(ringRadius, tubeR));
      if (d < minD) {
        minD = d;
        if (d < 0.003) {
          hitRingId = fr;
          hitPos = pos;
        }
      }
    }

    if (minD < 0.003 || t > 5.5) break;
    t += minD * 0.85;
  }

  vec3 color = vec3(0.0);
  if (hitRingId >= 0.0) {
    float shade = 0.55 + 0.45 * clamp(1.0 - (t - 1.8) * 0.4, 0.0, 1.0);
    color = iqPalette(hitRingId * 0.18) * shade;
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 29. SPC-29: ARQUITECTURA FRACTAL 3D (Raymarched 3D Monolith)
 */
const SHADER_RAYMARCH_MONOLITH = `${COMMON_GLSL_HEADER}
float sdBox3(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdOct3(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}
float sdCross3(vec3 p, float w) {
  float da = max(abs(p.x), abs(p.y));
  float db = max(abs(p.y), abs(p.z));
  float dc = max(abs(p.z), abs(p.x));
  return min(da, min(db, dc)) - w;
}

vec2 mapFractal(vec3 pos) {
  float cellPeriod = mix(4.2, 2.2, uScale);
  vec3 cellId = floor(pos / cellPeriod);
  vec3 q = mod(pos, cellPeriod) - 0.5 * cellPeriod;

  float rotA = uTime * 0.25;
  q.xz *= rot2D(rotA);
  q.xy *= rot2D(rotA * 0.5);

  float baseBox = sdBox3(q, vec3(cellPeriod * 0.34));
  float baseOct = sdOct3(q, cellPeriod * 0.45);
  float d = (uShapeMode == 2 || uShapeMode == 4) ? baseOct : mix(baseBox, baseOct, uComplexity * 0.6);

  float s = 1.0;
  int iterCount = 2 + int(uComplexity * 2.0);
  for (int i = 0; i < 4; i++) {
    if (i >= iterCount) break;
    vec3 a = mod(q * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - 3.0 * abs(a));
    float c = sdCross3(r, 1.0) / s;
    d = max(d, -c);
  }

  float corridor = max(abs(pos.x), abs(pos.y)) - 0.55;
  d = max(d, -corridor);

  float matParam = length(q) + dot(cellId, vec3(0.17, 0.31, 0.23));
  return vec2(d, matParam);
}

void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 ro = vec3(0.0, 0.0, uTime * 1.4);
  vec3 rd = normalize(vec3(p, 1.45 - uScale * 0.3));

  float t = 0.0;
  float glowAccum = 0.0;
  for (int i = 0; i < 36; i++) {
    vec3 pos = ro + rd * t;
    vec2 res = mapFractal(pos);
    float d = res.x;
    glowAccum += (0.012 + uThickness * 0.035) / (0.018 + d * d * 16.0);
    if (d < 0.003 || t > 20.0) break;
    t += d * 0.85;
  }

  float glowBoost = (0.35 + uThickness * 1.15);
  vec3 color = iqPalette(glowAccum * 0.1 + t * 0.04) * glowAccum * glowBoost * 0.20;
  color = applyGlobalSweep(color);
  color = color / (1.0 + color * 0.35);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 30. SPC-30: PASILLO DE PÓRTICOS 3D CON VIGAS Z (3D Architectural Truss Tunnel)
 * Pórticos 3D avanzando en perspectiva unidos por vigas longitudinales en el eje Z.
 */
const SHADER_VORONOI_NETWORK = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);
  int portalCount = 5 + int(uComplexity * 7.0);
  int defaultPoly = 1 + int(mod(floor(uComplexity * 3.0), 3.0));

  float w = computeDynamicWeight(p, 1.0, 0.004, 0.035);

  // Vigas diagonales de esquina en perspectiva Z
  float diagBeam = min(abs(abs(p.x) - abs(p.y) * 1.35), abs(p.y));
  float strutMask = renderStrokeOrStyle(diagBeam, w * 0.55) * smoothstep(0.08, 0.45, length(p));
  color += iqPalette(0.55) * strutMask * 0.35;

  for (int i = 0; i < 12; i++) {
    if (i >= portalCount) break;
    float fi = float(i);
    float zFract = fract(fi / float(portalCount) - uTime * 0.22);
    float scaleZ = mix(0.06, 1.55, zFract * zFract);

    vec2 centerShift = vec2(sin(uTime * 0.45 + zFract * 3.0), cos(uTime * 0.35 + zFract * 3.0)) * (uChaos * 0.18 * (1.0 - zFract));
    vec2 qp = p - centerShift;
    float dPoly = sdShape(qp, scaleZ, defaultPoly);

    float fade = smoothstep(0.0, 0.18, zFract) * smoothstep(1.0, 0.78, zFract);
    float portalLine = renderStrokeOrStyle(dPoly, w * scaleZ) * fade;

    vec3 col = iqPalette(zFract * 0.7 + fi * 0.06);
    color += col * portalLine * 0.78;
  }

  color = applyGlobalSweep(color);
  if (uStyleMode == 0) color = color / (1.0 + color * 0.28);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 31. SPC-31: HORIZONTE Y TERRENO 3D EN PERSPECTIVA (3D Perspective Terrain Grid)
 */
const SHADER_AUDIO_GEOMETRY = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float zoom = mix(0.7, 2.5, uScale);
  p *= zoom;

  // Desplazamiento de elevación 3D suave sobre el horizonte
  float waveElev = sin(p.x * 2.2 + uTime * 0.65) * (0.04 + uComplexity * 0.14);
  float horizonDist = abs(p.y - waveElev) + 0.04;
  float fovZ = 1.15 / horizonDist;
  vec2 gridUv = vec2(p.x * fovZ * 0.65, fovZ + uTime * 1.2);

  float density = mix(1.2, 3.8, uScale);
  vec2 cell = fract(gridUv * density) - 0.5;
  vec2 cellId = floor(gridUv * density);

  float glowWidth = computeDynamicWeight(p, cellId.x, 0.006, 0.09);
  float lineX = renderStrokeOrStyle(cell.x, glowWidth);
  float lineY = renderStrokeOrStyle(cell.y, glowWidth);

  float depthFade = exp(-horizonDist * 0.30) * smoothstep(0.03, 0.22, horizonDist);
  float gridEnergy = max(lineX, lineY) * depthFade;

  float horizonLaser = renderStrokeOrStyle(p.y - waveElev, glowWidth * 0.45);

  vec3 colGrid = iqPalette(cellId.y * 0.05);
  vec3 colHorizon = iqPalette(0.60);

  vec3 color = colGrid * gridEnergy * 0.75 + colHorizon * horizonLaser * 0.80;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 32. SPC-32: CAMPO DE CUBOS / PISTONES 3D EN OLA (3D Extruded Piston Cube Matrix)
 * Matriz 3D de columnas prismáticas con caras Superior, Izquierda y Derecha iluminadas en 3D
 * que suben y bajan suavemente formando una ola tridimensional.
 */
const SHADER_VORTEX_SPIRAL = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  float gridScale = mix(2.2, 5.5, uScale);
  vec2 q = p * gridScale;

  // Proyección isométrica 3D con desplazamiento vertical (eje Z de altura del pistón)
  vec2 colId = floor(vec2(q.x, q.y * 0.85));
  vec2 local = fract(vec2(q.x, q.y * 0.85)) - 0.5;

  float waveH = 0.22 * sin(length(colId) * (0.55 + uComplexity * 0.4) - uTime * 0.85);
  vec2 shifted = local - vec2(0.0, waveH);

  // Tapa superior del prisma 3D (rombo isométrico) y paredes laterales extruidas hacia abajo
  float dTop = abs(shifted.x) * 0.85 + abs(shifted.y) * 1.45 - 0.34;
  float dPillar = max(abs(local.x) * 0.85 - 0.34, max(shifted.y, -local.y - 0.42));

  float topMask = flatFill(dTop);
  float sideMask = flatFill(dPillar) * (1.0 - topMask) * step(local.y, shifted.y);
  float sideShade = (local.x < 0.0) ? 0.62 : 0.32;

  float w = computeDynamicWeight(p, colId.x + colId.y, 0.008, 0.048);
  float edgeTop = flatStroke(dTop, w);
  float centerSplit = flatStroke(local.x, w * 0.7) * sideMask;

  vec3 baseCol = iqPalette(length(colId) * 0.12 + waveH);
  vec3 edgeCol = iqPalette(0.65);

  vec3 color = baseCol * (topMask * 0.92 + sideMask * sideShade)
             + edgeCol * max(edgeTop, centerSplit) * 0.90;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ============================================================================
// BANK E (32..39) [MIN]: MINIMALISMO CINEMÁTICO, ARCOS, ECLIPSES Y RELOJES
// ============================================================================

/**
 * 33. MIN-33: ARCOS Y ANILLOS PARTIDOS (Segmented Astronomical Arcs)
 * Grandes arcos circulares cortados que giran lentamente en sentidos opuestos
 * cambiando su apertura angular y su grosor (de línea fina a arco ancho).
 */
const SHADER_MIN_SEGMENTED_ARCS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  float r = length(p);
  float a = atan(p.y, p.x);

  int numArcs = 3 + int(uScale * 4.0); // 3 a 7 anillos de arco bien separados
  for (int i = 0; i < 7; i++) {
    if (i >= numArcs) break;
    float fi = float(i);
    float ringR = 0.18 + fi * (0.68 / float(numArcs));

    float dir = (mod(fi, 2.0) < 0.5) ? 1.0 : -1.0;
    float speed = (0.28 + fi * 0.06) * dir;
    float segCount = 1.0 + floor(mod(fi + uComplexity * 3.0, 3.0)); // 1, 2 o 3 arcos por anillo
    float anglePhase = fract((a + uTime * speed) / TAU * segCount);

    // Longitud del arco respira suavemente
    float arcLen = 0.35 + 0.35 * (0.5 + 0.5 * sin(uTime * 0.45 + fi * 1.1));
    float angularMask = smoothstep(arcLen + 0.02, arcLen - 0.02, anglePhase) * smoothstep(0.0, 0.02, anglePhase);

    float w = computeDynamicWeight(p, fi, 0.005, 0.048);
    float ringStroke = renderStrokeOrStyle(r - ringR, w) * angularMask;

    vec3 col = iqPalette(fi * 0.16);
    color = max(color, col * ringStroke);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 34. MIN-34: ECLIPSE GEOMÉTRICO (Solar / Polygon Eclipse)
 * Una gran figura central eclipsada por un disco oscuro que se desplaza lentamente,
 * creando fases geométricas de altísima elegancia para pantallas LED.
 */
const SHADER_MIN_ECLIPSE = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float mainRadius = 0.52 + uScale * 0.25;
  int polyMode = (uShapeMode > 0) ? uShapeMode : 0;

  float dSun = (polyMode == 0) ? sdCircle(p, mainRadius) : sdShape(p, mainRadius, polyMode);

  // El cuerpo eclipsante se mueve suavemente de izquierda a derecha
  vec2 moonOffset = vec2(sin(uTime * 0.32) * (0.28 + uChaos * 0.25), cos(uTime * 0.21) * 0.08);
  float moonRadius = mainRadius * (0.82 + 0.14 * cos(uTime * 0.4));
  float dMoon = (polyMode == 0) ? sdCircle(p - moonOffset, moonRadius) : sdShape(p - moonOffset, moonRadius, polyMode);

  float sunFill = flatFill(dSun);
  float moonFill = flatFill(dMoon);
  float crescentMask = clamp(sunFill - moonFill, 0.0, 1.0);

  // Corona / anillo exterior fino
  float w = computeDynamicWeight(p, 1.0, 0.004, 0.045);
  float outerRing = renderStrokeOrStyle(dSun - 0.08, w * 0.7);
  float moonRim = flatStroke(dMoon, w * 0.45) * sunFill;

  vec3 colCrescent = iqPalette(0.15);
  vec3 colRim = iqPalette(0.55);

  vec3 color = colCrescent * crescentMask * 0.90 + colRim * (outerRing + moonRim) * 0.85;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 35. MIN-35: PÉNDULO Y METRÓNOMO ESCÉNICO (Stage Metronome)
 * Gran aguja geométrica minimalista que balancea con calma sobre un arco graduado.
 */
const SHADER_MIN_METRONOME = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  vec2 pivot = vec2(0.0, -0.72);
  vec2 rel = p - pivot;

  float swingAngle = sin(uTime * 0.65) * (0.55 + uChaos * 0.25);
  vec2 dir = vec2(sin(swingAngle), cos(swingAngle));

  float armLen = 1.35;
  float dArm = sdSegment(p, pivot, pivot + dir * armLen);
  float w = computeDynamicWeight(p, 1.0, 0.005, 0.045);
  float armStroke = renderStrokeOrStyle(dArm, w);

  // Cabezal geométrico en el extremo del péndulo
  vec2 bobPos = pivot + dir * (0.85 + 0.25 * uScale);
  float dBob = sdShape((p - bobPos) * rot2D(-swingAngle), 0.14 + w * 1.5, 1);
  float bobMask = flatFill(dBob);

  // Arco graduado de referencia
  float rPivot = length(rel);
  float aPivot = atan(rel.x, rel.y);
  float inArcRange = step(abs(aPivot), 0.75);
  float dArc = abs(rPivot - (0.85 + 0.25 * uScale));
  float tickMask = step(0.4, fract(aPivot * (8.0 + uComplexity * 12.0) / PI));
  float arcTicks = flatStroke(dArc, 0.006) * inArcRange * tickMask;

  vec3 colMain = iqPalette(0.12);
  vec3 colBob = iqPalette(0.55);

  color = colMain * (armStroke + arcTicks * 0.65) + colBob * bobMask;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 36. MIN-36: ESCALERA ARQUITECTÓNICA BAUHAUS (Stepped Diagonal Stairs)
 * Peldaños geométricos escalonados que ascienden con suavidad cambiando de grosor.
 */
const SHADER_MIN_STAIRS = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float steps = floor(3.0 + uScale * 5.0); // 3 a 8 peldaños amplios
  vec2 q = p * steps * 0.5;
  float t = uTime * 0.40;

  // Coordenada escalonada: el eje X cuantizado desplaza al eje Y creando una escalera perfecta
  float stepX = floor(q.x + t);
  float stairY = q.y - stepX * 0.5 + t * 0.5;
  float bandId = floor(stairY);
  float localY = abs(fract(stairY) - 0.5);

  float w = computeDynamicWeight(p, bandId + stepX, 0.015, 0.28);
  float stairMask = flatFill(localY - w);

  // Borde vertical de cada peldaño
  float localX = abs(fract(q.x + t) - 0.5);
  float riserMask = flatFill(0.46 - localX);

  vec3 col = iqPalette(bandId * 0.18 + stepX * 0.06);
  vec3 color = col * stairMask * riserMask * 0.90;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 37. MIN-37: MATRIZ DE CÍRCULOS Y PUNTOS (Minimal Halftone Dot Wave)
 * Cuadrícula espaciada de círculos/formas que crecen y encogen en una onda suave.
 */
const SHADER_MIN_DOT_WAVE = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float cols = floor(3.0 + uScale * 6.0); // 3x3 a 9x9 puntos limpios
  vec2 grid = p * cols * 0.5;
  vec2 cellId = floor(grid + 0.5);
  vec2 f = fract(grid + 0.5) - 0.5;

  float wave = 0.5 + 0.5 * sin(length(cellId) * (0.55 + uComplexity * 0.4) - uTime * 0.85);
  float rad = mix(0.03, 0.38, clamp(uThickness * (0.25 + 0.95 * wave) + uAudioFFT.x * 0.2, 0.02, 0.42));

  float d = (uShapeMode > 0) ? sdShape(f, rad, uShapeMode) : sdCircle(f, rad);
  float isRing = step(0.6, uComplexity) * mod(abs(cellId.x + cellId.y), 2.0);
  float mask = mix(flatFill(d), flatStroke(d, 0.025), isRing);

  vec3 col = iqPalette(wave * 0.45 + length(cellId) * 0.06);
  vec3 color = col * mask;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 38. MIN-38: PÓRTICOS Y ARCOS ARQUITECTÓNICOS (Monumental Stage Arches)
 * Arcos de medio punto limpios concéntricos estilo arquitectura monumental de festival.
 */
const SHADER_MIN_ARCHES = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  int numArches = 2 + int(uScale * 4.0);
  for (int i = 0; i < 6; i++) {
    if (i >= numArches) break;
    float fi = float(i);
    float ratio = (fi + 1.0) / float(numArches);

    float breathe = 0.5 + 0.5 * sin(uTime * 0.50 - fi * 0.7);
    float wArch = ratio * 0.62 * (0.92 + 0.10 * breathe);
    float hArch = ratio * 0.78;

    // SDF de Arco de Medio Punto (rectángulo inferior + semicírculo superior)
    vec2 q = p - vec2(0.0, -0.12);
    float dArch;
    if (q.y > 0.15) {
      dArch = length(vec2(q.x, q.y - 0.15)) - wArch;
    } else {
      vec2 b = abs(vec2(q.x, q.y + hArch * 0.35)) - vec2(wArch, hArch * 0.5 + 0.15);
      dArch = max(b.x, b.y);
    }

    float strokeW = computeDynamicWeight(p, fi, 0.005, 0.042);
    float archLine = renderStrokeOrStyle(dArch, strokeW);

    vec3 col = iqPalette(fi * 0.18);
    color = max(color, col * archLine);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 39. MIN-39: ONDA SENOIDAL DE COLUMNAS (Harmonic Column Wave)
 * Fila limpia de columnas verticales cuyas alturas dibujan una onda lenta y elegante.
 */
const SHADER_MIN_COLUMN_WAVE = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float numBars = floor(5.0 + uScale * 14.0); // 5 a 19 columnas limpias
  float xCoord = p.x * numBars * 0.5;
  float barId = floor(xCoord + 0.5);
  float localX = abs(fract(xCoord + 0.5) - 0.5);

  float waveH = 0.18 + (0.45 + uComplexity * 0.25) * (0.5 + 0.5 * sin(barId * 0.45 - uTime * 0.85));
  float barHalfW = clamp(0.10 + uThickness * 0.26, 0.06, 0.38);

  float dBar = max(localX - barHalfW, abs(p.y) - waveH);
  float isOutline = step(0.55, uChaos);
  float mask = mix(flatFill(dBar), flatStroke(dBar, 0.025), isOutline);

  // Pequeño punto/cápsula flotante sobre cada columna
  float capY = waveH + 0.08 + 0.04 * sin(uTime * 1.1 + barId);
  float dCap = max(localX - barHalfW, abs(abs(p.y) - capY) - 0.018);
  float capMask = flatFill(dCap);

  vec3 colBar = iqPalette(barId * 0.06);
  vec3 colCap = iqPalette(barId * 0.06 + 0.45);

  vec3 color = colBar * mask * 0.90 + colCap * capMask;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 40. MIN-40: RUEDA DE SECTORES ALTERNOS (Minimal Gear Sectors)
 * Anillos concéntricos divididos en sectores amplios que giran lentamente como un mecanismo de precisión.
 */
const SHADER_MIN_SECTOR_WHEEL = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float r = length(p);
  float a = atan(p.y, p.x);

  float rings = floor(2.0 + uScale * 3.0);
  float ringCoord = r * rings;
  float ringId = floor(ringCoord);
  float localR = abs(fract(ringCoord) - 0.5);

  float inBounds = step(ringId, rings - 0.5) * step(0.25, ringCoord);
  float dir = (mod(ringId, 2.0) < 0.5) ? 1.0 : -1.0;
  float sectors = floor(3.0 + uComplexity * 5.0);

  float secPhase = fract((a + uTime * 0.25 * dir) / TAU * sectors);
  float secWidth = clamp(0.20 + uThickness * 0.45, 0.12, 0.68);
  float secMask = smoothstep(secWidth + 0.02, secWidth - 0.02, secPhase) * smoothstep(0.0, 0.02, secPhase);

  float ringW = clamp(0.12 + uThickness * 0.22, 0.08, 0.36);
  float radialMask = flatFill(localR - ringW);

  vec3 col = iqPalette(ringId * 0.22);
  vec3 color = col * secMask * radialMask * inBounds * 0.90;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ============================================================================
// BANK F (40..47) [MOT]: COREOGRAFÍAS DE ESCENARIO LED, CORTINAS Y SIMETRÍA
// ============================================================================

/**
 * 41. MOT-41: APERTURA DE CORTINA CENTRAL (Center Stage Curtain Reveal)
 * Dos paneles laterales de líneas que se abren hacia los lados revelando un emblema geométrico central.
 */
const SHADER_MOT_CURTAIN_REVEAL = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  // Apertura sinusoidal suave de la cortina (de 0.15 a 0.95)
  float openAmount = 0.20 + 0.72 * (0.5 + 0.5 * sin(uTime * 0.45));
  float distFromOpen = abs(p.x) - openAmount;

  // Cortinas laterales formadas por barras verticales limpias
  float barFreq = floor(4.0 + uScale * 8.0);
  float barLocal = abs(fract(p.x * barFreq * 0.5) - 0.5);
  float barW = computeDynamicWeight(p, floor(p.x * barFreq * 0.5), 0.04, 0.28);
  float curtainBars = flatFill(barLocal - barW) * flatFill(-distFromOpen);
  float edgeBorder = renderStrokeOrStyle(distFromOpen, 0.012 + uThickness * 0.02);

  // Figura geométrica central revelada cuando las cortinas se abren
  int centerShape = 1 + int(mod(floor(uComplexity * 3.99), 4.0));
  float dCenter = sdShape(p * rot2D(uTime * 0.20 * uChaos), 0.36, centerShape);
  float centerStroke = renderStrokeOrStyle(dCenter, 0.008 + uThickness * 0.035) * flatFill(distFromOpen);

  vec3 colCurtain = iqPalette(0.12);
  vec3 colEdge = iqPalette(0.50);
  vec3 colCenter = iqPalette(0.75);

  color = colCurtain * curtainBars * 0.75 + colEdge * edgeBorder * 0.90 + colCenter * centerStroke * 0.95;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 42. MOT-42: MARCO DE 4 ESQUINAS PARA DJ / LOGO (Four-Corner Stage Frame)
 * Escuadras geométricas dinámicas en las 4 esquinas que dejan el centro despejado.
 */
const SHADER_MOT_CORNER_FRAME = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec2 ap = abs(p);
  vec3 color = vec3(0.0);

  int layers = 2 + int(uScale * 3.0);
  for (int i = 0; i < 5; i++) {
    if (i >= layers) break;
    float fi = float(i);
    float inset = 0.08 + fi * 0.14;

    float cornerX = 1.45 - inset;
    float cornerY = 0.85 - inset * 0.7;

    float armLen = 0.25 + (0.25 + uComplexity * 0.25) * (0.5 + 0.5 * sin(uTime * 0.55 - fi * 0.6));
    float dBox = max(ap.x - cornerX, ap.y - cornerY);
    float inCornerZone = step(cornerX - armLen, ap.x) + step(cornerY - armLen, ap.y);

    float w = computeDynamicWeight(p, fi, 0.005, 0.035);
    float bracket = renderStrokeOrStyle(dBox, w) * clamp(inCornerZone, 0.0, 1.0) * flatFill(dBox - 0.02);

    vec3 col = iqPalette(fi * 0.20);
    color = max(color, col * bracket);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 43. MOT-43: CASCADA VERTICAL DE BLOQUES (Vertical Stage Waterfall)
 * Grandes barras horizontales espaciadas que descienden con suavidad de arriba a abajo.
 */
const SHADER_MOT_WATERFALL = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float cols = floor(1.0 + uComplexity * 3.0); // 1 a 4 columnas verticales
  float rows = floor(2.0 + uScale * 5.0);      // 2 a 7 losas por columna

  float colId = floor((p.x + 1.5) * cols * 0.5);
  float colLocalX = abs(fract((p.x + 1.5) * cols * 0.5) - 0.5);

  float speed = 0.35 + mod(abs(colId), 2.0) * 0.18;
  float yCoord = p.y * rows * 0.5 + uTime * speed + colId * 0.5;
  float rowId = floor(yCoord);
  float localY = abs(fract(yCoord) - 0.5);

  float wY = computeDynamicWeight(p, rowId + colId * 3.0, 0.015, 0.24);
  float slabY = flatFill(localY - wY);
  float slabX = flatFill(colLocalX - 0.40);

  vec3 col = iqPalette(rowId * 0.15 + colId * 0.25);
  vec3 color = col * slabY * slabX * 0.88;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 44. MOT-44: DIAMANTE EXPANSIVO DE GROSOR CAMBIANTE (Expanding Weight Diamond)
 * Rombos que nacen finos en el centro, engordan a mitad de pantalla y se afinan en los bordes.
 */
const SHADER_MOT_EXPANDING_DIAMOND = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  int count = 2 + int(uScale * 4.0);
  for (int i = 0; i < 6; i++) {
    if (i >= count) break;
    float fi = float(i);
    float progress = fract(fi / float(count) - uTime * 0.20);

    float rad = progress * 1.45;
    // El grosor es máximo en progress = 0.5 y fino al nacer (0.0) y al morir (1.0)
    float envelope = sin(progress * PI);
    float w = mix(0.003, 0.075, uThickness * envelope);

    float d = sdDiamond(p, rad);
    float ring = renderStrokeOrStyle(d, w) * envelope;

    vec3 col = iqPalette(progress * 0.65 + fi * 0.12);
    color = max(color, col * ring);
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 45. MOT-45: HORIZONTE DE ESPEJO SIMÉTRICO (Symmetric Horizon Equalizer)
 * Barras geométricas que crecen simétricamente hacia arriba y hacia abajo desde el centro.
 */
const SHADER_MOT_SYMMETRIC_HORIZON = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float numCols = floor(4.0 + uScale * 12.0);
  float xCoord = p.x * numCols * 0.5;
  float colId = floor(xCoord + 0.5);
  float localX = abs(fract(xCoord + 0.5) - 0.5);

  float n1 = 0.5 + 0.5 * sin(colId * 0.6 - uTime * 0.75);
  float n2 = 0.5 + 0.5 * cos(colId * 0.35 + uTime * 0.55);
  float height = (0.08 + 0.62 * n1 * n2) * (0.65 + uComplexity * 0.45);

  float halfW = clamp(0.08 + uThickness * 0.28, 0.05, 0.38);
  float dBar = max(localX - halfW, abs(p.y) - height);

  float fillMask = flatFill(dBar);
  float centerLine = flatStroke(p.y, 0.005 + uThickness * 0.012);

  vec3 colBar = iqPalette(abs(colId) * 0.08);
  vec3 colCenter = iqPalette(0.55);

  vec3 color = colBar * fillMask * 0.85 + colCenter * centerLine * 0.90;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 46. MOT-46: CARRUSEL HORIZONTAL DE PÓRTICOS (Horizontal Stage Carousel)
 * Grandes marcos con figuras interiores que desfilan suavemente de izquierda a derecha.
 */
const SHADER_MOT_STAGE_CAROUSEL = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float spacing = mix(1.1, 0.55, uScale);
  float xScroll = p.x / spacing - uTime * 0.35;
  float cardId = floor(xScroll + 0.5);
  vec2 localP = vec2((fract(xScroll + 0.5) - 0.5) * spacing, p.y);

  float w = computeDynamicWeight(p, cardId, 0.005, 0.042);
  float dOuter = sdBox2D(localP, vec2(spacing * 0.38, 0.62));
  float outerFrame = renderStrokeOrStyle(dOuter, w);

  int innerType = 1 + int(mod(abs(cardId), 4.0));
  float innerSize = 0.22 * spacing * (0.85 + 0.15 * sin(uTime * 0.6 + cardId));
  float dInner = sdShape(localP, innerSize, innerType);
  float innerGeom = (mod(abs(cardId), 2.0) < 0.5) ? flatFill(dInner) : renderStrokeOrStyle(dInner, w);

  vec3 colFrame = iqPalette(cardId * 0.18);
  vec3 colInner = iqPalette(cardId * 0.18 + 0.45);

  vec3 color = colFrame * outerFrame * 0.85 + colInner * innerGeom * 0.85;
  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 47. MOT-47: ABANICO LÁSER DE TECHO Y SUELO (Top/Bottom Laser Fan)
 * Haces de líneas rectas que nacen desde arriba y abajo abriéndose suavemente en abanico.
 */
const SHADER_MOT_LASER_FAN = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);
  vec3 color = vec3(0.0);

  vec2 originTop = vec2(sin(uTime * 0.35) * 0.35, 1.15);
  vec2 relTop = p - originTop;
  float aTop = atan(relTop.x, -relTop.y);

  float rays = floor(4.0 + uScale * 10.0);
  float rayCoord = aTop * rays / PI;
  float rayId = floor(rayCoord + 0.5);
  float rayDist = abs(fract(rayCoord + 0.5) - 0.5) * length(relTop) * (PI / rays);

  float w = computeDynamicWeight(p, rayId, 0.003, 0.032);
  float fanSpread = 0.45 + 0.35 * (0.5 + 0.5 * sin(uTime * 0.45));
  float inFan = smoothstep(fanSpread + 0.05, fanSpread, abs(aTop));
  float topBeams = renderStrokeOrStyle(rayDist, w) * inFan;

  vec3 colTop = iqPalette(rayId * 0.10);
  color += colTop * topBeams * 0.85;

  if (uComplexity > 0.30) {
    vec2 originBot = vec2(-sin(uTime * 0.35) * 0.35, -1.15);
    vec2 relBot = p - originBot;
    float aBot = atan(relBot.x, relBot.y);
    float botDist = abs(fract(aBot * rays / PI + 0.5) - 0.5) * length(relBot) * (PI / rays);
    float botBeams = renderStrokeOrStyle(botDist, w * 0.85) * smoothstep(fanSpread + 0.05, fanSpread, abs(aBot));
    color += iqPalette(0.55) * botBeams * 0.70;
  }

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * 48. MOT-48: TÓTEM MONOLITO VERTICAL (Central Stage Totem)
 * Columna central imponente de bloques simétricos respirantes con laterales negros puros.
 */
const SHADER_MOT_CENTRAL_TOTEM = `${COMMON_GLSL_HEADER}
void main() {
  vec2 p = transformOrthoCoords(vUv);

  float segments = floor(3.0 + uScale * 7.0);
  float yCoord = p.y * segments * 0.5 - uTime * 0.25;
  float segId = floor(yCoord);
  float localY = abs(fract(yCoord) - 0.5);

  float segWidth = 0.16 + (0.28 + uComplexity * 0.32) * (0.5 + 0.5 * sin(segId * 0.85 + uTime * 0.60));
  float segHeight = clamp(0.12 + uThickness * 0.26, 0.08, 0.40);

  float dTotem = max(abs(p.x) - segWidth, localY - segHeight);
  float isHollow = mod(abs(segId), 2.0);
  float strokeW = mix(0.006, 0.045, uThickness);
  float mask = mix(flatFill(dTotem), flatStroke(dTotem, strokeW), isHollow);

  vec3 col = iqPalette(segId * 0.14);
  vec3 color = col * mask * 0.92;

  color = applyGlobalSweep(color);
  color *= computeStrobeGain();
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
const GENERATOR_SHADERS = [
  // BANK A (0..7) [GEO]: Orthographic 2D Geometry, Squares, Triangles & Polygons
  SHADER_KINETIC_SQUARES,
  SHADER_TRIANGLE_DELTAS,
  SHADER_PARALLEL_LINES,
  SHADER_POLYGON_MATRIX,
  SHADER_BAUHAUS_SHAPES,
  SHADER_ORTHO_ISOMETRIC,
  SHADER_TECH_VECTORS,
  SHADER_STROBE_BLOCKS,

  // BANK B (8..15) [KIN]: Dynamic Line Weights (Thin <-> Giant), L-to-R Sweeps & Kinetic Arrays
  SHADER_BREATHING_WEIGHTS,
  SHADER_LR_SCANNER,
  SHADER_ACCORDION_SHUTTERS,
  SHADER_PENDULUM_MATRIX,
  SHADER_SLIDING_MONOLITHS,
  SHADER_CHEVRON_LANES,
  SHADER_METRIC_SCANNER,
  SHADER_DATAMATICS_STREAMS,

  // BANK C (16..23) [FLT]: Pure Flat Vector Graphics (Zero Glow / Zero FX, Color & Stroke Morphing)
  SHADER_FLAT_COLOR_BANDS,
  SHADER_FLAT_MONDRIAN,
  SHADER_FLAT_STROKE_MORPHER,
  SHADER_FLAT_COLOR_STRIPES,
  SHADER_FLAT_POLY_STACK,
  SHADER_FLAT_CAPSULES,
  SHADER_FLAT_BOOLEAN_XOR,
  SHADER_FLAT_SYMBOL_MATRIX,

  // BANK D (24..31) [SPC]: Architectural Portals, Horizon Grids, Topography & Audio Geometry
  SHADER_POLYGON_PORTALS,
  SHADER_HYPER_LINES,
  SHADER_MOIRE_CIRCLES,
  SHADER_CONTOUR_TOPOGRAPHY,
  SHADER_RAYMARCH_MONOLITH,
  SHADER_VORONOI_NETWORK,
  SHADER_AUDIO_GEOMETRY,
  SHADER_VORTEX_SPIRAL,

  // BANK E (32..39) [MIN]: Minimalismo Cinemático, Arcos, Eclipses y Relojes
  SHADER_MIN_SEGMENTED_ARCS,
  SHADER_MIN_ECLIPSE,
  SHADER_MIN_METRONOME,
  SHADER_MIN_STAIRS,
  SHADER_MIN_DOT_WAVE,
  SHADER_MIN_ARCHES,
  SHADER_MIN_COLUMN_WAVE,
  SHADER_MIN_SECTOR_WHEEL,

  // BANK F (40..47) [MOT]: Coreografías de Escenario LED, Cortinas y Simetría
  SHADER_MOT_CURTAIN_REVEAL,
  SHADER_MOT_CORNER_FRAME,
  SHADER_MOT_WATERFALL,
  SHADER_MOT_EXPANDING_DIAMOND,
  SHADER_MOT_SYMMETRIC_HORIZON,
  SHADER_MOT_STAGE_CAROUSEL,
  SHADER_MOT_LASER_FAN,
  SHADER_MOT_CENTRAL_TOTEM
];


// ==================== MODULE: js/shaders/postfx.glsl.js ====================
/**
 * AETHER-VJ: Master A/B Crossfade, Ping-Pong Feedback & 6-Stage Post-FX Rack Shader
 * Engineered for Resolume Arena Luma/Alpha keying and 60 FPS GPU execution.
 */
const FEEDBACK_COMPOSITE_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexDeckA;
uniform sampler2D uTexDeckB;
uniform sampler2D uTexPrevFeedback;

uniform float uCrossfade;        // 0.0 = Deck A, 1.0 = Deck B
uniform float uFeedbackWet;      // 0.0 = Off, >0.0 = Trail intensity
uniform float uTime;
uniform float uBeatPulse;

// Capa de Vídeo / GIF / Cámara en directo (se mezcla ANTES del rack de efectos: le afectan trails, kaleido, glitch, 3D...)
uniform sampler2D uTexMedia;
uniform float uMediaMix;         // 0.0 = oculto .. 1.0 = opacidad total (incluye fundido de entrada/salida)
uniform int uMediaBlend;         // 0 Encima, 1 Pantalla, 2 Máscara, 3 Diferencia, 4 Mitad y mitad
uniform int uMediaFx;            // 0 Normal, 1 Bordes Neón, 2 Duotono Paleta, 3 Térmica, 4 Pop-Art, 5 Fantasma, 6 Pixel LED
uniform vec2 uMediaUvScale;      // Encaje Llenar / Encajar según proporción del vídeo
uniform int uMediaMirror;        // 1 = espejo horizontal
uniform float uMediaZoom;        // >1.0 = golpe de zoom con el bombo
uniform vec2 uMediaTexel;        // 1 / tamaño del vídeo en píxeles
uniform float uMediaAspect;      // ancho / alto del vídeo
uniform vec3 uAudioFFT;
uniform vec3 uPalA;
uniform vec3 uPalB;
uniform vec3 uPalC;
uniform vec3 uPalD;

mat2 rot2D(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

vec3 cosPalette(float t) {
  return clamp(uPalA + uPalB * cos(6.28318530718 * (uPalC * t + uPalD)), 0.0, 1.0);
}

float lumaOf(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 sampleMediaRaw(vec2 muv) {
  // Vídeo/HTML subido sin voltear: la fila 0 del vídeo es la parte de arriba
  return texture(uTexMedia, vec2(muv.x, 1.0 - muv.y)).rgb;
}

vec3 heatRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(vec3(0.02, 0.0, 0.18), vec3(0.45, 0.0, 0.65), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.95, 0.10, 0.12), smoothstep(0.22, 0.5, t));
  c = mix(c, vec3(1.0, 0.75, 0.05), smoothstep(0.48, 0.78, t));
  c = mix(c, vec3(1.0, 1.0, 0.92), smoothstep(0.78, 1.0, t));
  return c;
}

// Devuelve rgb del vídeo con su efecto + alfa (0 fuera del encuadre en modo Encajar / zonas oscuras en Fantasma)
vec4 sampleMediaFx(vec2 uv) {
  vec2 muv = (uv - 0.5) * uMediaUvScale / max(uMediaZoom, 0.5) + 0.5;
  if (uMediaMirror == 1) muv.x = 1.0 - muv.x;
  if (muv.x < 0.0 || muv.x > 1.0 || muv.y < 0.0 || muv.y > 1.0) return vec4(0.0);

  if (uMediaFx == 6) {
    // PIXEL LED: rejilla de diodos redondos
    float cells = 64.0;
    vec2 grid = vec2(cells * uMediaAspect, cells);
    vec2 q = (floor(muv * grid) + 0.5) / grid;
    vec2 f = fract(muv * grid) - 0.5;
    float diode = smoothstep(0.5, 0.32, length(f));
    vec3 c = sampleMediaRaw(q) * 1.25;
    return vec4(c * diode, 1.0);
  }

  vec3 c = sampleMediaRaw(muv);
  float l = lumaOf(c);

  if (uMediaFx == 1) {
    // BORDES NEÓN (Sobel) con el color de la paleta
    vec2 t = uMediaTexel * 1.5;
    float tl = lumaOf(sampleMediaRaw(muv + vec2(-t.x, t.y)));
    float tc = lumaOf(sampleMediaRaw(muv + vec2(0.0, t.y)));
    float tr = lumaOf(sampleMediaRaw(muv + vec2(t.x, t.y)));
    float ml = lumaOf(sampleMediaRaw(muv + vec2(-t.x, 0.0)));
    float mr = lumaOf(sampleMediaRaw(muv + vec2(t.x, 0.0)));
    float bl = lumaOf(sampleMediaRaw(muv + vec2(-t.x, -t.y)));
    float bc = lumaOf(sampleMediaRaw(muv + vec2(0.0, -t.y)));
    float br = lumaOf(sampleMediaRaw(muv + vec2(t.x, -t.y)));
    float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float gy = -bl - 2.0 * bc - br + tl + 2.0 * tc + tr;
    float edge = smoothstep(0.08, 0.45, length(vec2(gx, gy)));
    vec3 neon = cosPalette(muv.y * 0.6 + uTime * 0.08) * (1.2 + uBeatPulse * 0.8);
    return vec4(neon * edge, edge);
  } else if (uMediaFx == 2) {
    // DUOTONO con la paleta activa
    vec3 dark = cosPalette(0.05 + uTime * 0.02) * 0.18;
    vec3 bright = cosPalette(0.55 + uTime * 0.02);
    return vec4(mix(dark, bright, smoothstep(0.06, 0.9, l)), 1.0);
  } else if (uMediaFx == 3) {
    // CÁMARA TÉRMICA
    return vec4(heatRamp(l * (1.05 + uAudioFFT.x * 0.25)), 1.0);
  } else if (uMediaFx == 4) {
    // POP-ART: posterizado + trama de puntos
    vec3 sat = mix(vec3(l), c, 1.8);
    vec3 post = floor(clamp(sat, 0.0, 1.0) * 4.0 + 0.5) / 4.0;
    vec2 dotGrid = fract(uv * vec2(90.0 * uMediaAspect, 90.0)) - 0.5;
    float dotMask = smoothstep(0.48, 0.30, length(dotGrid) / max(0.25, 1.15 - l));
    return vec4(mix(post * 0.55, post * 1.1, dotMask), 1.0);
  } else if (uMediaFx == 5) {
    // FANTASMA: solo lo iluminado, teñido con la paleta y semitransparente
    float key = smoothstep(0.18, 0.75, l);
    vec3 ghost = cosPalette(0.35 + l * 0.4 + uTime * 0.05) * (0.6 + l);
    return vec4(ghost * key, key * 0.85);
  }
  return vec4(c, 1.0);
}

void main() {
  // Smooth S-curve power-preserving crossfade between Deck A and Deck B
  float mixVal = smoothstep(0.0, 1.0, uCrossfade);

  vec3 colA = vec3(0.0);
  vec3 colB = vec3(0.0);

  if (mixVal < 0.999) {
    colA = texture(uTexDeckA, vUv).rgb;
  }
  if (mixVal > 0.001) {
    colB = texture(uTexDeckB, vUv).rgb;
  }

  // Constant-power crossfade boost at midpoint so brightness never dips during morphs
  float midBoost = 1.0 + 0.18 * sin(mixVal * 3.14159265);
  vec3 liveColor = mix(colA, colB, mixVal) * midBoost;

  // Capa de vídeo / GIF / cámara
  if (uMediaMix > 0.003) {
    vec4 m = sampleMediaFx(vUv);
    float a = clamp(uMediaMix * m.a, 0.0, 1.0);
    if (uMediaBlend == 1) {
      liveColor = mix(liveColor, 1.0 - (1.0 - clamp(liveColor, 0.0, 1.0)) * (1.0 - m.rgb), a);
    } else if (uMediaBlend == 2) {
      float maskL = smoothstep(0.08, 0.85, lumaOf(m.rgb));
      liveColor = mix(liveColor, liveColor * maskL * 1.7 + m.rgb * 0.08, a);
    } else if (uMediaBlend == 3) {
      liveColor = mix(liveColor, abs(liveColor - m.rgb), a);
    } else if (uMediaBlend == 4) {
      liveColor = mix(liveColor, max(liveColor, m.rgb) * 0.65 + min(liveColor, m.rgb) * 0.35, a);
    } else {
      liveColor = mix(liveColor, m.rgb, a);
    }
  }

  // Ping-Pong Feedback Delay / Trails with subtle zoom & vortex drift
  if (uFeedbackWet > 0.005) {
    vec2 centerUv = vUv - 0.5;
    float zoom = 0.988 - 0.006 * uBeatPulse;
    float spin = 0.004 * sin(uTime * 0.4);
    vec2 fbUv = (rot2D(spin) * centerUv) * zoom + 0.5;

    vec3 prevColor = texture(uTexPrevFeedback, clamp(fbUv, 0.001, 0.999)).rgb;
    // Slight chromatic decay on feedback trails
    prevColor *= vec3(0.96, 0.95, 0.98);

    float retention = clamp(uFeedbackWet * 0.92, 0.0, 0.93);
    liveColor = max(liveColor, prevColor * retention);
  }

  fragColor = vec4(clamp(liveColor, 0.0, 1.0), 1.0);
}
`;
const POSTFX_RACK_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexComposite;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBeatPhase;
uniform float uBeatPulse;
uniform vec3 uAudioFFT;

// FX Rack Uniforms
uniform float uKaleidoWet;       // 0.0 -> 1.0
uniform float uKaleidoAxes;      // 2.0, 4.0, or 8.0
uniform float uRgbShiftWet;      // 0.0 -> 1.0
uniform float uGlitchWet;        // 0.0 -> 1.0
uniform float uPixelateWet;      // 0.0 -> 1.0

// Global 3D Live Effect Uniforms (applies to ANY of the 48 generators)
uniform int uEffect3DMode;       // 0 = 2D Normal, 1 = 3D Floating Tilt Plane, 2 = 3D Solid Extrusion, 3 = 3D Curved Cylinder
uniform float uEffect3DAmount;   // 0.0 -> 1.0 (3D tilt / depth / extrusion thickness)

// Dynamic DJ / Brand PNG Logo Overlay Uniforms
uniform sampler2D uTexLogo;
uniform float uLogoEnabled;      // 0.0 -> 1.0 (Smooth fade in/out)
uniform int uLogoFxMode;         // 0 = Clean, 1 = Beat Pulse + Halo, 2 = 3D Extruded Logo, 3 = Neon + RGB Glitch, 4 = Stencil Mask
uniform float uLogoScale;        // 0.15 -> 1.0
uniform float uLogoOpacity;      // 0.0 -> 1.0
uniform float uLogoBackdrop;     // 0.0 -> 1.0 (Dark readability shadow behind logo)
uniform float uLogoAspect;       // Logo width / height ratio
uniform int uLogoPos;            // 0 = Center, 1 = Top Booth, 2 = Bottom-Right Corner
uniform int uLogoTint;           // 0 = Original PNG Colors, 1 = Tint with Active Palette
uniform vec3 uLogoAccentCol;     // Active palette accent color for neon halo / tint

// Stage Screen Mapping (X/Y, Size, Keystone) & Multi-Slice LED Processor Uniforms
uniform vec2 uMapOffset;         // (-0.80 .. +0.80) X/Y Screen Position Offset
uniform vec2 uMapScale;          // (0.15 .. 1.50) X/Y Screen Width/Height Scale
uniform vec2 uMapKeystone;       // (-0.60 .. +0.60) X/Y Keystone Perspective Correction
uniform int uSliceMode;          // 0 = Full, 1 = Vertical Totems, 2 = DJ Booth + 2 Totems, 3 = Horiz Bands, 4 = LED Matrix
uniform int uSliceCount;         // 2 .. 6 slices
uniform float uSliceGap;         // 0.0 .. 0.18 black gap between slices
uniform int uSliceClone;         // 1 = Re-center visual inside each slice, 0 = Cut mask over full screen
uniform int uMapTestGrid;        // 1 = Show Calibration Test Card / Slice Borders

// Output Master (LED walls / projectors) & Photosensitive Safety
uniform float uMasterBright;     // 0.10 .. 1.00 master output brightness
uniform float uColorTemp;        // -1.0 cold .. 0 neutral .. +1.0 warm
uniform int uSafeStrobe;         // 1 = Strobe button limited to 3 flashes per second

// Live Performance Kill / Momentary Uniforms
uniform float uFlash;            // 0.0 or 1.0
uniform float uInvert;           // 0.0 or 1.0
uniform float uMonochrome;       // 0.0 or 1.0
uniform float uBlackout;         // 0.0 or 1.0
uniform float uStrobeBurst;      // 0.0 or 1.0

// Output Background Mode: 0 = Solid Black, 1 = Alpha / Luma Key Ready
uniform int uBgMode;

// Corner-pin (homografía pantalla → imagen) para proyector 1 (izq.) y proyector 2 (der.)
uniform int uCornerOn;
uniform mat3 uCornerH0;
uniform mat3 uCornerH1;

// Edge blending de 2 proyectores
uniform int uEdgeMode;           // 0 Apagado, 1 Dos proyectores en una ventana, 2 Izquierdo, 3 Derecho
uniform float uEdgeOverlap;      // Fracción del ancho de cada proyector que se solapa
uniform float uEdgeGamma;        // Gamma del proyector
uniform float uEdgeCurve;        // Suavidad de la rampa

// 4 máscaras negras rectangulares en coordenadas de pantalla (x, y desde arriba-izquierda, ancho, alto)
uniform vec4 uMaskRect[4];
uniform float uMaskFeather[4];

// Texto en pantalla con efectos
uniform sampler2D uTexText;
uniform float uTextEnabled;      // 0..1 fundido
uniform int uTextFx;             // 0 Limpio, 1 Latido+Halo, 2 Neón Glitch, 3 Ticker, 4 Onda, 5 Silueta, 6 Relieve 3D
uniform float uTextScale;
uniform float uTextOpacity;
uniform float uTextBackdrop;
uniform float uTextAspect;       // ancho / alto de la textura de texto
uniform int uTextPos;            // 0 Centro, 1 Arriba, 2 Abajo
uniform int uTextColorMode;      // 0 Blanco, 1 Paleta, 2 Arcoíris
uniform float uTextScroll;       // desplazamiento acumulado del ticker

#define PI 3.14159265359
#define TAU 6.28318530718

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

mat3 rotX3D(float a) {
  float s = sin(a), c = cos(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotY3D(float a) {
  float s = sin(a), c = cos(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

vec3 sampleCompositeLayer(vec2 sampleUv, float totalChroma, float glitchColorTear) {
  if (sampleUv.x < 0.002 || sampleUv.x > 0.998 || sampleUv.y < 0.002 || sampleUv.y > 0.998) {
    return vec3(0.0);
  }
  if (totalChroma > 0.002) {
    vec2 dir = sampleUv - 0.5;
    float radialFactor = 0.4 + length(dir) * 1.4;
    vec2 offset = dir * totalChroma * 0.065 * radialFactor + vec2(glitchColorTear, 0.0);
    float r = texture(uTexComposite, clamp(sampleUv + offset, 0.002, 0.998)).r;
    float g = texture(uTexComposite, clamp(sampleUv, 0.002, 0.998)).g;
    float b = texture(uTexComposite, clamp(sampleUv - offset, 0.002, 0.998)).b;
    return vec3(r, g, b);
  }
  return texture(uTexComposite, sampleUv).rgb;
}

vec4 sampleLogoRGBA(vec2 luv) {
  if (luv.x < 0.002 || luv.x > 0.998 || luv.y < 0.002 || luv.y > 0.998) {
    return vec4(0.0);
  }
  // Flip Y so HTML Image top-left matches screen top-left
  vec4 raw = texture(uTexLogo, vec2(luv.x, 1.0 - luv.y));
  if (uLogoTint == 1) {
    float luma = dot(raw.rgb, vec3(0.299, 0.587, 0.114));
    raw.rgb = mix(uLogoAccentCol * 0.85, vec3(1.0), smoothstep(0.3, 0.95, luma));
  }
  return raw;
}

vec3 hueRainbow(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

vec4 sampleTextRGBA(vec2 tuv) {
  if (tuv.x < 0.0 || tuv.x > 1.0 || tuv.y < 0.0 || tuv.y > 1.0) {
    return vec4(0.0);
  }
  vec4 raw = texture(uTexText, vec2(tuv.x, 1.0 - tuv.y));
  vec3 col = vec3(1.0);
  if (uTextColorMode == 1) {
    col = mix(uLogoAccentCol, vec3(1.0), 0.15);
  } else if (uTextColorMode == 2) {
    col = mix(hueRainbow(tuv.x * 0.8 - uTime * 0.05), vec3(1.0), 0.12);
  }
  return vec4(col * raw.a, raw.a);
}

// Ticker: la textura se repite con un hueco del 35% para que el texto entre por la derecha sin saltos
vec4 sampleTickerRGBA(vec2 tuv) {
  const float GAP = 0.35;
  float x = fract(tuv.x / (1.0 + GAP)) * (1.0 + GAP);
  if (x > 1.0) return vec4(0.0);
  return sampleTextRGBA(vec2(x, tuv.y));
}

float edgeRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  float p = max(uEdgeCurve, 1.0);
  float f = (t < 0.5) ? 0.5 * pow(2.0 * t, p) : 1.0 - 0.5 * pow(2.0 * (1.0 - t), p);
  return pow(f, 1.0 / max(uEdgeGamma, 0.5));
}

vec2 cornerPinLocal(vec2 localUv, int projIdx, out bool valid) {
  // Coordenadas UI (y hacia abajo) para casar con el editor de esquinas
  vec3 q = (projIdx == 1 ? uCornerH1 : uCornerH0) * vec3(localUv.x, 1.0 - localUv.y, 1.0);
  valid = q.z > 0.0001;
  vec2 r = q.xy / max(q.z, 0.0001);
  return vec2(r.x, 1.0 - r.y);
}

void main() {
  if (uBlackout > 0.5) {
    fragColor = vec4(0.0, 0.0, 0.0, (uBgMode == 1) ? 0.0 : 1.0);
    return;
  }

  float aspect = uResolution.x / max(uResolution.y, 1.0);

  // -1. EDGE BLENDING (2 proyectores) + CORNER-PIN POR PROYECTOR
  vec2 localUv = vUv;
  int projIdx = 0;
  float projHalf = 0.0;
  if (uEdgeMode == 1) {
    projHalf = (vUv.x < 0.5) ? 0.0 : 1.0;
    projIdx = int(projHalf);
    localUv = vec2(fract(vUv.x * 2.0), vUv.y);
    if (vUv.x >= 0.999) localUv.x = 1.0;
    aspect *= 0.5;
  } else if (uEdgeMode == 3) {
    projIdx = 1;
  }

  bool pinValid = true;
  if (uCornerOn == 1) {
    localUv = cornerPinLocal(localUv, projIdx, pinValid);
    if (!pinValid || localUv.x < 0.0 || localUv.x > 1.0 || localUv.y < 0.0 || localUv.y > 1.0) {
      fragColor = vec4(0.0, 0.0, 0.0, (uBgMode == 1) ? 0.0 : 1.0);
      return;
    }
  }

  vec2 baseUv = localUv;
  float edgeGain = 1.0;
  if (uEdgeMode > 0) {
    float ov = clamp(uEdgeOverlap, 0.02, 0.45);
    float contentW = 1.0 / (2.0 - ov);   // ancho de cada proyector en coordenadas de la imagen total
    bool isRight = (uEdgeMode == 1) ? (projHalf > 0.5) : (uEdgeMode == 3);
    float startX = isRight ? (1.0 - ov) : 0.0;
    baseUv.x = (localUv.x + startX) * contentW;
    if (isRight) {
      if (localUv.x < ov) edgeGain = edgeRamp(localUv.x / ov);
    } else {
      if (localUv.x > 1.0 - ov) edgeGain = edgeRamp((1.0 - localUv.x) / ov);
    }
    // La imagen total es (2 - solape) veces más ancha que un proyector
    aspect = aspect * (2.0 - ov);
  }

  // 0. STAGE SCREEN MAPPING (POSITION X/Y, WIDTH/HEIGHT SCALE & KEYSTONE WARPING)
  vec2 mapP = (baseUv - 0.5) - uMapOffset;
  vec2 safeScale = max(uMapScale, vec2(0.10));
  mapP /= safeScale;

  // Keystone / Trapezoid projector correction
  float kx = 1.0 - mapP.y * uMapKeystone.x * 1.15;
  float ky = 1.0 - mapP.x * uMapKeystone.y * 1.15;
  mapP.x /= max(0.18, kx);
  mapP.y /= max(0.18, ky);

  vec2 canvasUv = mapP + 0.5;
  if (canvasUv.x < 0.0 || canvasUv.x > 1.0 || canvasUv.y < 0.0 || canvasUv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, (uBgMode == 1) ? 0.0 : 1.0);
    return;
  }

  // 0.5 MULTI-SLICE STAGE ENGINE (TOTEMS, DJ BOOTH + TOTEMS, BANDS, LED MATRIX)
  vec2 sliceBoxUv = canvasUv;
  vec2 sliceAspectScale = vec2(1.0, 1.0);
  bool insideSlice = true;
  bool sliceHasLogo = true;
  float sliceCountF = clamp(float(uSliceCount), 2.0, 6.0);
  float gap = clamp(uSliceGap, 0.0, 0.22);

  if (uSliceMode == 1) {
    // MODE 1: VERTICAL TOTEMS (N Vertical Columns with adjustable black gap)
    float cellX = canvasUv.x * sliceCountF;
    float colIdx = floor(cellX);
    float fX = fract(cellX);
    float halfGap = gap * sliceCountF * 0.35;
    if (fX < halfGap || fX > (1.0 - halfGap)) {
      insideSlice = false;
    } else {
      float localX = (fX - halfGap) / max(0.05, 1.0 - 2.0 * halfGap);
      sliceBoxUv = vec2(localX, canvasUv.y);
      sliceAspectScale = vec2(1.0 / sliceCountF, 1.0);
    }
  } else if (uSliceMode == 2) {
    // MODE 2: CLASSIC STAGE SETUP — 2 SIDE TOTEMS (LEFT/RIGHT) + 1 CENTER DJ BOOTH FRONT
    float totemW = 0.21;
    float boothLeft = totemW + max(0.02, gap * 0.8);
    float boothRight = 1.0 - boothLeft;
    if (canvasUv.x >= 0.02 && canvasUv.x <= totemW && canvasUv.y >= 0.05 && canvasUv.y <= 0.95) {
      // Left Vertical Totem
      sliceBoxUv = vec2((canvasUv.x - 0.02) / (totemW - 0.02), (canvasUv.y - 0.05) / 0.90);
      sliceAspectScale = vec2(0.28, 1.0);
      sliceHasLogo = false;
    } else if (canvasUv.x >= (1.0 - totemW) && canvasUv.x <= 0.98 && canvasUv.y >= 0.05 && canvasUv.y <= 0.95) {
      // Right Vertical Totem
      sliceBoxUv = vec2((canvasUv.x - (1.0 - totemW)) / (totemW - 0.02), (canvasUv.y - 0.05) / 0.90);
      sliceAspectScale = vec2(0.28, 1.0);
      sliceHasLogo = false;
    } else if (canvasUv.x >= boothLeft && canvasUv.x <= boothRight && canvasUv.y >= 0.05 && canvasUv.y <= 0.56) {
      // Center DJ Booth Front Screen
      sliceBoxUv = vec2((canvasUv.x - boothLeft) / max(0.05, boothRight - boothLeft), (canvasUv.y - 0.05) / 0.51);
      sliceAspectScale = vec2(1.0, 0.65);
      sliceHasLogo = true;
    } else {
      insideSlice = false;
    }
  } else if (uSliceMode == 3) {
    // MODE 3: HORIZONTAL STAGE BANDS / STRIPS
    float cellY = canvasUv.y * sliceCountF;
    float fY = fract(cellY);
    float halfGap = gap * sliceCountF * 0.35;
    if (fY < halfGap || fY > (1.0 - halfGap)) {
      insideSlice = false;
    } else {
      float localY = (fY - halfGap) / max(0.05, 1.0 - 2.0 * halfGap);
      sliceBoxUv = vec2(canvasUv.x, localY);
      sliceAspectScale = vec2(1.0, 1.0 / sliceCountF);
    }
  } else if (uSliceMode == 4) {
    // MODE 4: LED PANEL MATRIX (N x N Independent Panels)
    vec2 cell = canvasUv * sliceCountF;
    vec2 f = fract(cell);
    float halfGap = gap * sliceCountF * 0.35;
    if (f.x < halfGap || f.x > (1.0 - halfGap) || f.y < halfGap || f.y > (1.0 - halfGap)) {
      insideSlice = false;
    } else {
      sliceBoxUv = (f - halfGap) / max(0.05, 1.0 - 2.0 * halfGap);
    }
  }

  if (!insideSlice) {
    fragColor = vec4(0.0, 0.0, 0.0, (uBgMode == 1) ? 0.0 : 1.0);
    return;
  }

  vec2 uv = (uSliceClone == 1 && uSliceMode > 0)
    ? clamp((sliceBoxUv - 0.5) * sliceAspectScale + 0.5, 0.002, 0.998)
    : canvasUv;
  vec2 logoStageUv = (uSliceClone == 1 && uSliceMode > 0) ? sliceBoxUv : canvasUv;

  // 1. PIXELATE / LED WALL MATRIX COORD QUANTIZATION
  float ledMask = 1.0;
  if (uPixelateWet > 0.005) {
    float gridCountY = mix(240.0, 28.0, pow(uPixelateWet, 0.75));
    vec2 gridDim = vec2(gridCountY * aspect, gridCountY);
    vec2 cellUv = fract(uv * gridDim) - 0.5;
    vec2 quantUv = (floor(uv * gridDim) + 0.5) / gridDim;

    uv = mix(uv, quantUv, smoothstep(0.0, 0.25, uPixelateWet));

    // Physical SMD LED diode bezel mask
    float diodeDist = length(cellUv * 1.45);
    float diodeShape = smoothstep(0.68, 0.42, diodeDist);
    ledMask = mix(1.0, diodeShape, uPixelateWet * 0.88);
  }

  // 2. MIRROR / KALEIDOSCOPE MASTER (2, 4, or 8 Axes)
  if (uKaleidoWet > 0.005) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 kP = p;

    if (uKaleidoAxes < 2.5) {
      // 2-Axis Horizontal + Vertical Quad Mirror
      kP = abs(p);
      kP = mix(p, vec2(abs(p.x), abs(p.y)) * sign(vec2(0.5) - step(0.0, p)), 0.0);
      kP = abs(p) * vec2((p.x < 0.0) ? 1.0 : 1.0, 1.0);
      vec2 mirroredUv = abs(uv - 0.5) + 0.0;
      uv = mix(uv, 0.5 - abs(uv - 0.5), uKaleidoWet);
    } else {
      // 4 or 8 Polar Mirror Axes
      float folds = uKaleidoAxes * 2.0;
      float sector = TAU / folds;
      float r = length(p);
      float a = atan(p.y, p.x) + PI;
      a = mod(a, sector);
      a = abs(a - sector * 0.5);
      vec2 folded = vec2(cos(a), sin(a)) * r;
      vec2 foldedUv = folded / vec2(aspect, 1.0) + 0.5;
      uv = mix(uv, clamp(foldedUv, 0.001, 0.999), uKaleidoWet);
    }
  }

  // 3. GLITCH / DIGITAL SLICE DISPLACEMENT
  float glitchColorTear = 0.0;
  if (uGlitchWet > 0.005) {
    float timeSlot = floor(uTime * 18.0);
    float bandY = floor(uv.y * (12.0 + uGlitchWet * 28.0));
    float sliceRand = hash21(vec2(bandY, timeSlot));
    float trigger = step(1.0 - uGlitchWet * 0.55 - uBeatPulse * 0.25, sliceRand);

    float shiftX = (hash11(bandY + timeSlot * 3.7) - 0.5) * 0.16 * uGlitchWet * trigger;
    uv.x = fract(uv.x + shiftX);
    glitchColorTear = shiftX * 0.65;
  }

  // 4. GLOBAL 3D LIVE EFFECT + RGB SHIFT / CHROMATIC ABERRATION
  vec3 color = vec3(0.0);
  float totalChroma = uRgbShiftWet * (1.0 + uBeatPulse * 0.65 + uAudioFFT.x * 0.5) + abs(glitchColorTear);
  float amt3D = clamp(uEffect3DAmount, 0.0, 1.0);

  if (uEffect3DMode == 1 && amt3D > 0.01) {
    // MODE 1: 3D FLOATING PERSPECTIVE PLANE + MULTI-LAYER Z-PARALLAX HOLOGRAM
    vec2 pScreen = (uv - 0.5) * vec2(aspect, 1.0);
    float tiltX = (0.36 * sin(uTime * 0.42) + 0.24) * amt3D;
    float tiltY = (0.44 * cos(uTime * 0.34)) * amt3D;
    mat3 R = rotY3D(tiltY) * rotX3D(tiltX);

    vec3 ro = vec3(0.0, 0.0, -2.15);
    vec3 rd = normalize(vec3(pScreen, 1.55));

    // Transform ray into the tilted 3D plane coordinate space
    vec3 roLocal = R * ro;
    vec3 rdLocal = R * rd;

    // Sample 3 parallel 3D planes in Z depth (back echo, main stage plane, front ghost plane)
    for (int layer = 2; layer >= 0; layer--) {
      float fl = float(layer);
      float planeZ = (fl - 1.0) * 0.34 * amt3D;
      if (abs(rdLocal.z) > 0.001) {
        float tHit = (planeZ - roLocal.z) / rdLocal.z;
        if (tHit > 0.1) {
          vec3 hitPos = roLocal + rdLocal * tHit;
          vec2 planeUv = hitPos.xy / vec2(aspect * 0.88, 0.88) + 0.5;
          if (planeUv.x >= 0.0 && planeUv.x <= 1.0 && planeUv.y >= 0.0 && planeUv.y <= 1.0) {
            vec3 layerSample = sampleCompositeLayer(planeUv, totalChroma, glitchColorTear);
            // Subtle 3D bounding frame around the main floating plane so the 3D tilt is unmistakable
            vec2 borderDist = min(planeUv, 1.0 - planeUv);
            float minBorder = min(borderDist.x * aspect, borderDist.y);
            float frameEdge = smoothstep(0.008, 0.002, abs(minBorder - 0.006));

            if (layer == 1) {
              // Main 3D Plane
              float depthShade = clamp(1.25 - tHit * 0.12, 0.55, 1.15);
              color = max(color, layerSample * depthShade + vec3(0.22, 0.28, 0.35) * frameEdge * amt3D);
            } else {
              // Front & Back Z-Parallax Echo Planes
              float echoWeight = (layer == 0) ? (0.42 * amt3D) : (0.32 * amt3D);
              color = max(color, layerSample * echoWeight);
            }
          }
        }
      }
    }
  } else if (uEffect3DMode == 2 && amt3D > 0.01) {
    // MODE 2: 3D SOLID VOLUMETRIC EXTRUSION / RELIEF (Turns any 2D shape into a 3D extruded block)
    vec2 centerVec = uv - 0.5;
    // Dynamic 3D perspective camera tilt + radial extrusion vector
    vec2 tiltDir = vec2(cos(uTime * 0.45), sin(uTime * 0.38)) * 0.055 * amt3D;
    vec2 perspectiveUv = (uv - 0.5) * (1.0 + 0.18 * amt3D + dot(centerVec, tiltDir) * 2.2) + 0.5;
    vec2 extrudeSpan = (centerVec * 0.14 + tiltDir * 1.35) * amt3D;

    const int SLICES = 14;
    vec3 accum3D = vec3(0.0);
    // March from back slice (1.0) to front top face (0.0) for accurate 3D occlusion & shaded side walls
    for (int i = SLICES; i >= 0; i--) {
      float s = float(i) / float(SLICES); // 1.0 = deepest back slice, 0.0 = front cap
      vec2 sliceUv = perspectiveUv - extrudeSpan * s;
      vec3 sliceCol = sampleCompositeLayer(sliceUv, totalChroma, glitchColorTear);
      float sliceMask = smoothstep(0.03, 0.18, max(sliceCol.r, max(sliceCol.g, sliceCol.b)));

      if (i == 0) {
        // Front 3D Cap Face (full brightness + subtle 3D bevel highlight)
        vec3 bevelSample = sampleCompositeLayer(sliceUv + extrudeSpan * 0.08, 0.0, 0.0);
        float bevelEdge = clamp(sliceMask - smoothstep(0.03, 0.18, max(bevelSample.r, max(bevelSample.g, bevelSample.b))), 0.0, 1.0);
        vec3 topColor = sliceCol * 1.08 + vec3(0.28) * bevelEdge * amt3D;
        accum3D = mix(accum3D, topColor, sliceMask);
      } else {
        // 3D Extruded Side Walls (shaded darker toward the back for authentic 3D depth)
        float sideShade = mix(0.72, 0.22, s);
        vec3 sideWallCol = sliceCol * sideShade;
        accum3D = mix(accum3D, sideWallCol, sliceMask);
      }
    }
    color = accum3D;
  } else if (uEffect3DMode == 3 && amt3D > 0.01) {
    // MODE 3: 3D CURVED CYLINDER / STAGE DOME PROJECTION
    vec2 p = (uv - 0.5) * 2.0; // -1.0 .. 1.0
    float maxAngle = mix(0.15, 1.28, amt3D);
    float theta = p.x * maxAngle;

    // Cylindrical 3D surface normal & depth
    float cylZ = cos(theta);
    float cylX = sin(theta) / sin(maxAngle);
    float perspectiveScale = 1.0 + (1.0 - cylZ) * 0.85 * amt3D;
    float curvedY = p.y * perspectiveScale + 0.12 * amt3D * sin(uTime * 0.4) * (1.0 - cylZ);

    vec2 cylUv = vec2(
      fract((theta / maxAngle) * 0.5 + 0.5 + 0.06 * amt3D * sin(uTime * 0.32)),
      curvedY * 0.5 + 0.5
    );

    if (cylUv.y >= 0.002 && cylUv.y <= 0.998) {
      vec3 frontWall = sampleCompositeLayer(cylUv, totalChroma, glitchColorTear);
      // 3D cylindrical specular & edge shading
      float normalLight = 0.55 + 0.55 * cylZ;
      color = frontWall * normalLight;

      // Subtle back-wall inner cylinder transparency for 3D hollow tube feel
      vec2 backUv = vec2(fract(cylUv.x + 0.5), (p.y * (0.78 / perspectiveScale)) * 0.5 + 0.5);
      if (backUv.y >= 0.002 && backUv.y <= 0.998) {
        vec3 backWall = sampleCompositeLayer(backUv, 0.0, 0.0);
        color = max(color, backWall * 0.28 * amt3D * cylZ);
      }
    }
  } else {
    // MODE 0: Standard 2D Planar Output
    color = sampleCompositeLayer( clamp(uv, 0.001, 0.999), totalChroma, glitchColorTear );
  }

  // Apply LED Wall Matrix mask
  color *= ledMask;

  // 4.5 DYNAMIC DJ / BRAND PNG LOGO OVERLAY ENGINE (WITH REAL-TIME GPU EFFECTS)
  if (uLogoEnabled > 0.005 && uLogoOpacity > 0.005 && sliceHasLogo) {
    float logoFade = clamp(uLogoEnabled * uLogoOpacity, 0.0, 1.0);
    vec2 anchor = vec2(0.5, 0.5);
    float posScaleMult = 1.0;
    if (uLogoPos == 1) {
      anchor = vec2(0.5, 0.76); // Arriba Cabina
    } else if (uLogoPos == 2) {
      anchor = vec2(0.80, 0.18); // Esquina Inferior Derecha (TV / Watermark)
      posScaleMult = 0.55;
    }

    float baseSize = clamp(uLogoScale, 0.12, 1.15) * posScaleMult;
    float kickZoom = (uLogoFxMode == 1)
      ? (1.0 + 0.11 * uBeatPulse + 0.14 * uAudioFFT.x + 0.03 * sin(uTime * 2.5))
      : 1.0;
    float effSize = baseSize * kickZoom;

    // Aspect-corrected local coordinate (-0.5 .. +0.5 inside the logo box)
    float safeLogoAspect = clamp(uLogoAspect, 0.25, 4.5);
    vec2 rel = (logoStageUv - anchor) * vec2(aspect * sliceAspectScale.x, sliceAspectScale.y);
    vec2 boxHalf = vec2(effSize * 0.5 * safeLogoAspect, effSize * 0.5);

    // Soft dark readability halo behind the logo so bright stage lines never wash out the DJ name
    float radialDist = length(rel / max(boxHalf * 1.25, vec2(0.001)));
    float backdropMask = smoothstep(1.25, 0.35, radialDist) * uLogoBackdrop * logoFade;

    vec2 logoUv = (rel / max(boxHalf * 2.0, vec2(0.001))) + 0.5;

    if (uLogoFxMode == 2) {
      // MODE 2: 3D FLOATING & EXTRUDED DJ LOGO
      float tiltX = 0.28 * sin(uTime * 0.65);
      float tiltY = 0.36 * cos(uTime * 0.52);
      vec2 perspShift = vec2(tiltY, tiltX) * 0.12;
      float perspScale = 1.0 + dot(logoUv - 0.5, perspShift) * 1.65;
      vec2 baseUv3D = (logoUv - 0.5) * perspScale + 0.5;

      vec3 logo3DCol = vec3(0.0);
      float logo3DAlpha = 0.0;
      const int L_SLICES = 9;
      for (int i = L_SLICES; i >= 0; i--) {
        float s = float(i) / float(L_SLICES);
        vec2 sliceUv = baseUv3D - perspShift * s * 0.42;
        vec4 samp = sampleLogoRGBA(sliceUv);
        if (i == 0) {
          logo3DCol = mix(logo3DCol, samp.rgb * 1.08 + uLogoAccentCol * 0.18, samp.a);
          logo3DAlpha = max(logo3DAlpha, samp.a);
        } else {
          float sideShade = mix(0.68, 0.20, s);
          vec3 sideCol = mix(samp.rgb, uLogoAccentCol, 0.45) * sideShade;
          logo3DCol = mix(logo3DCol, sideCol, samp.a);
          logo3DAlpha = max(logo3DAlpha, samp.a * 0.92);
        }
      }
      color *= (1.0 - backdropMask * 0.82);
      color = mix(color, logo3DCol, clamp(logo3DAlpha * logoFade, 0.0, 1.0));
    } else if (uLogoFxMode == 3) {
      // MODE 3: NEON HALO + RHYTHMIC RGB GLITCH ON LOGO
      float slot = floor(uTime * 16.0);
      float band = floor(logoUv.y * 18.0);
      float tear = (hash11(band + slot * 2.3) - 0.5) * 0.055 * step(0.68 - 0.25 * uBeatPulse, hash21(vec2(band, slot)));
      vec2 gUv = vec2(logoUv.x + tear, logoUv.y);
      vec2 rgbShift = vec2(0.012 * (0.5 + uBeatPulse + uAudioFFT.x) + abs(tear) * 0.5, 0.0);

      vec4 sampC = sampleLogoRGBA(gUv);
      vec4 sampR = sampleLogoRGBA(gUv + rgbShift);
      vec4 sampB = sampleLogoRGBA(gUv - rgbShift);

      // Multi-tap neon outline detection
      vec2 texel = vec2(0.008, 0.008 * safeLogoAspect);
      float neighborAlpha = 0.0;
      neighborAlpha = max(neighborAlpha, sampleLogoRGBA(gUv + vec2(texel.x, 0.0)).a);
      neighborAlpha = max(neighborAlpha, sampleLogoRGBA(gUv - vec2(texel.x, 0.0)).a);
      neighborAlpha = max(neighborAlpha, sampleLogoRGBA(gUv + vec2(0.0, texel.y)).a);
      neighborAlpha = max(neighborAlpha, sampleLogoRGBA(gUv - vec2(0.0, texel.y)).a);
      float neonOutline = clamp(neighborAlpha - sampC.a, 0.0, 1.0);

      vec3 glitchLogoCol = vec3(sampR.r, sampC.g, sampB.b) + uLogoAccentCol * neonOutline * 1.5;
      float combinedAlpha = clamp(max(sampC.a, max(sampR.a, sampB.a) * 0.75) + neonOutline * 0.9, 0.0, 1.0);

      color *= (1.0 - backdropMask * 0.82);
      color = mix(color, glitchLogoCol, combinedAlpha * logoFade);
    } else if (uLogoFxMode == 4) {
      // MODE 4: STENCIL / SILHOUETTE WINDOW (Visuals shine inside the DJ logo + neon contour)
      vec4 samp = sampleLogoRGBA(logoUv);
      vec2 texel = vec2(0.007, 0.007 * safeLogoAspect);
      float dilateA = max(
        max(sampleLogoRGBA(logoUv + vec2(texel.x, 0.0)).a, sampleLogoRGBA(logoUv - vec2(texel.x, 0.0)).a),
        max(sampleLogoRGBA(logoUv + vec2(0.0, texel.y)).a, sampleLogoRGBA(logoUv - vec2(0.0, texel.y)).a)
      );
      float rim = clamp(dilateA - samp.a, 0.0, 1.0);
      // Outside the logo silhouette is dimmed; inside the logo silhouette the visual shines + subtle logo overlay
      color = mix(color * (1.0 - 0.68 * logoFade * uLogoBackdrop), color * 1.35 + samp.rgb * 0.25, samp.a * logoFade);
      color += uLogoAccentCol * rim * 1.25 * logoFade;
    } else {
      // MODE 0 (CLEAN) & MODE 1 (BEAT PULSE + SUBTLE NEON HALO)
      vec4 samp = sampleLogoRGBA(logoUv);
      float halo = 0.0;
      if (uLogoFxMode == 1) {
        vec2 texel = vec2(0.009, 0.009 * safeLogoAspect) * (1.0 + 0.5 * uBeatPulse);
        float dA = max(
          max(sampleLogoRGBA(logoUv + vec2(texel.x, 0.0)).a, sampleLogoRGBA(logoUv - vec2(texel.x, 0.0)).a),
          max(sampleLogoRGBA(logoUv + vec2(0.0, texel.y)).a, sampleLogoRGBA(logoUv - vec2(0.0, texel.y)).a)
        );
        halo = clamp(dA - samp.a, 0.0, 1.0) * (0.65 + 0.55 * uBeatPulse);
      }
      color *= (1.0 - backdropMask * 0.85);
      vec3 finalLogoCol = samp.rgb + uLogoAccentCol * halo * 1.25;
      float finalLogoAlpha = clamp(samp.a + halo * 0.85, 0.0, 1.0);
      color = mix(color, finalLogoCol, finalLogoAlpha * logoFade);
    }
  }

  // 4.7 TEXTO EN PANTALLA CON EFECTOS (nombre del DJ, mensajes, felicitaciones...)
  if (uTextEnabled > 0.005 && uTextOpacity > 0.005 && sliceHasLogo) {
    float textFade = clamp(uTextEnabled * uTextOpacity, 0.0, 1.0);
    vec2 tAnchor = vec2(0.5, 0.5);
    if (uTextPos == 1) tAnchor = vec2(0.5, 0.82);
    else if (uTextPos == 2) tAnchor = vec2(0.5, 0.17);

    float tSize = clamp(uTextScale, 0.08, 1.2) * 0.42;
    if (uTextFx == 1) tSize *= 1.0 + 0.10 * uBeatPulse + 0.10 * uAudioFFT.x;
    float tAspect = clamp(uTextAspect, 0.3, 40.0);
    float stageAspect = aspect * sliceAspectScale.x / max(sliceAspectScale.y, 0.001);
    vec2 rel = (logoStageUv - tAnchor) * vec2(aspect * sliceAspectScale.x, sliceAspectScale.y);

    vec2 tHalf = vec2(tSize * 0.5 * tAspect, tSize * 0.5);
    // Si el texto es más ancho que la pantalla se reduce para que quepa (excepto en modo ticker)
    float maxHalfW = stageAspect * 0.47;
    if (uTextFx != 3 && tHalf.x > maxHalfW) {
      tHalf *= maxHalfW / tHalf.x;
    }
    vec2 tuv = rel / max(tHalf * 2.0, vec2(0.0001)) + 0.5;

    float tBack = smoothstep(1.3, 0.35, length(rel / max(tHalf * vec2(1.08, 1.5), vec2(0.0001))));
    vec4 ts = vec4(0.0);
    vec3 accent = (uTextColorMode == 2) ? hueRainbow(uTime * 0.05) : uLogoAccentCol;

    if (uTextFx == 3) {
      // TICKER: banda a lo ancho con el texto desplazándose
      float bandMask = step(abs(tuv.y - 0.5), 0.5);
      tBack = bandMask * smoothstep(0.62, 0.45, abs(tuv.y - 0.5));
      float tx = (rel.x / (tHalf.y * 2.0 * tAspect)) + uTextScroll;
      ts = sampleTickerRGBA(vec2(tx, tuv.y));
    } else if (uTextFx == 4) {
      // ONDA: las letras ondulan como una bandera al ritmo
      vec2 wuv = tuv;
      wuv.y += sin(tuv.x * 9.0 - uTime * 3.2) * (0.07 + 0.06 * uBeatPulse);
      ts = sampleTextRGBA(wuv);
    } else if (uTextFx == 2) {
      // NEÓN + GLITCH RGB
      float slot = floor(uTime * 16.0);
      float band = floor(tuv.y * 14.0);
      float tear = (hash11(band + slot * 2.3) - 0.5) * 0.06 * step(0.7 - 0.25 * uBeatPulse, hash21(vec2(band, slot)));
      vec2 g = vec2(tuv.x + tear, tuv.y);
      vec2 sh = vec2(0.008 * (0.5 + uBeatPulse + uAudioFFT.x) + abs(tear) * 0.4, 0.0);
      vec4 c0 = sampleTextRGBA(g);
      vec4 cr = sampleTextRGBA(g + sh);
      vec4 cb = sampleTextRGBA(g - sh);
      vec2 tx2 = vec2(0.006, 0.006 * tAspect);
      float nb = max(max(sampleTextRGBA(g + vec2(tx2.x, 0.0)).a, sampleTextRGBA(g - vec2(tx2.x, 0.0)).a),
                     max(sampleTextRGBA(g + vec2(0.0, tx2.y)).a, sampleTextRGBA(g - vec2(0.0, tx2.y)).a));
      float rim = clamp(nb - c0.a, 0.0, 1.0);
      vec3 rgb = vec3(cr.r, c0.g, cb.b) + accent * rim * 1.6;
      ts = vec4(rgb, clamp(max(c0.a, max(cr.a, cb.a) * 0.75) + rim * 0.9, 0.0, 1.0));
    } else if (uTextFx == 6) {
      // RELIEVE 3D con caras laterales sombreadas
      vec2 dir = vec2(cos(uTime * 0.6), sin(uTime * 0.5)) * 0.035;
      vec3 acc = vec3(0.0);
      float aAcc = 0.0;
      for (int i = 8; i >= 0; i--) {
        float s = float(i) / 8.0;
        vec4 smp = sampleTextRGBA(tuv - dir * s);
        if (i == 0) {
          acc = mix(acc, smp.rgb * 1.05, smp.a);
        } else {
          acc = mix(acc, mix(smp.rgb, accent, 0.55) * mix(0.7, 0.18, s), smp.a);
        }
        aAcc = max(aAcc, smp.a);
      }
      ts = vec4(acc, aAcc);
    } else {
      ts = sampleTextRGBA(tuv);
      if (uTextFx == 1) {
        vec2 tx2 = vec2(0.008, 0.008 * tAspect) * (1.0 + 0.6 * uBeatPulse);
        float nb = max(max(sampleTextRGBA(tuv + vec2(tx2.x, 0.0)).a, sampleTextRGBA(tuv - vec2(tx2.x, 0.0)).a),
                       max(sampleTextRGBA(tuv + vec2(0.0, tx2.y)).a, sampleTextRGBA(tuv - vec2(0.0, tx2.y)).a));
        float halo = clamp(nb - ts.a, 0.0, 1.0) * (0.6 + 0.6 * uBeatPulse);
        ts = vec4(ts.rgb + accent * halo * 1.3, clamp(ts.a + halo * 0.85, 0.0, 1.0));
      }
    }

    if (uTextFx == 5) {
      // SILUETA: los visuales brillan dentro de las letras y se oscurece el resto
      color = mix(color * (1.0 - 0.7 * textFade * max(uTextBackdrop, 0.35)), color * 1.45 + accent * 0.12, ts.a * textFade);
    } else {
      color *= (1.0 - tBack * uTextBackdrop * textFade * 0.85);
      // ts.rgb ya viene multiplicado por alfa
      color = color * (1.0 - ts.a * textFade) + ts.rgb * textFade;
    }
  }

  // 5. LIVE PERFORMANCE MOMENTARY & KILL OVERRIDES
  // Strobe Burst: 18 Hz shutter in unrestricted mode, max 3 Hz when the photosensitive safety limiter is on
  if (uStrobeBurst > 0.5) {
    float burstHz = (uSafeStrobe == 1) ? 3.0 : 18.0;
    float burstGate = step(0.45, fract(uTime * burstHz));
    color = mix(color * 0.05, color * 1.6 + vec3(0.35), burstGate);
  }

  // Flash Button (Blinding festival white-out overdrive)
  if (uFlash > 0.01) {
    color = mix(color, vec3(1.0), uFlash * 0.88);
  }

  // B/W Monochrome Kill (High-contrast razor luminance)
  if (uMonochrome > 0.5) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    luma = smoothstep(0.05, 0.92, luma * 1.15);
    color = vec3(luma);
  }

  // Invert Kill
  if (uInvert > 0.5) {
    color = 1.0 - color;
  }

  // 5.5 STAGE MAPPING & SLICE CALIBRATION TEST CARD OVERLAY
  if (uMapTestGrid == 1) {
    vec2 bDist = min(sliceBoxUv, 1.0 - sliceBoxUv);
    float sliceBorder = smoothstep(0.012, 0.003, min(bDist.x, bDist.y));
    float centerCross = max(
      smoothstep(0.005, 0.001, abs(sliceBoxUv.x - 0.5)),
      smoothstep(0.005, 0.001, abs(sliceBoxUv.y - 0.5))
    );
    float diag = max(
      smoothstep(0.004, 0.001, abs(sliceBoxUv.x - sliceBoxUv.y)),
      smoothstep(0.004, 0.001, abs(sliceBoxUv.x - (1.0 - sliceBoxUv.y)))
    ) * 0.45;
    vec2 cRel = (sliceBoxUv - 0.5) * vec2(aspect * sliceAspectScale.x, sliceAspectScale.y);
    float ring = smoothstep(0.008, 0.002, abs(length(cRel) - 0.25));

    vec3 gridCol = vec3(0.0, 0.95, 1.0) * (sliceBorder + ring) + vec3(1.0, 0.72, 0.0) * (centerCross + diag);
    float gridMask = clamp(sliceBorder + centerCross * 0.85 + ring * 0.85 + diag, 0.0, 1.0);
    color = mix(color * 0.55, gridCol, gridMask);
  }

  // 5.8 OUTPUT MASTER: COLOR TEMPERATURE & BRIGHTNESS (applied last so it also dims logo, grid and flashes)
  float temp = clamp(uColorTemp, -1.0, 1.0);
  color *= vec3(1.0 + 0.10 * temp, 1.0 + 0.01 * temp, 1.0 - 0.16 * temp);
  color *= clamp(uMasterBright, 0.0, 1.0);

  // 5.9 EDGE BLENDING (fundido en la zona de solape) + MÁSCARAS NEGRAS EN COORDENADAS DE PANTALLA
  color *= edgeGain;
  vec2 screenUi = vec2(vUv.x, 1.0 - vUv.y);
  for (int i = 0; i < 4; i++) {
    vec4 r = uMaskRect[i];
    if (r.z > 0.0005 && r.w > 0.0005) {
      float fe = max(uMaskFeather[i], 0.0005);
      vec2 dLo = screenUi - r.xy;
      vec2 dHi = (r.xy + r.zw) - screenUi;
      float inside = smoothstep(0.0, fe, min(min(dLo.x, dLo.y), min(dHi.x, dHi.y)));
      color *= (1.0 - inside);
    }
  }

  // 6. BACKGROUND & ALPHA / LUMA / CHROMA KEY OUTPUT MODE FOR RESOLUME
  float outAlpha = 1.0;
  if (uBgMode == 1) {
    // True 32-bit Straight Alpha channel: 0.0 on black background, 1.0 on geometry
    float peakChannel = max(color.r, max(color.g, color.b));
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    outAlpha = clamp(smoothstep(0.012, 0.22, max(peakChannel, luma)), 0.0, 1.0);
    // Un-premultiply anti-aliased edge pixels so colors stay 100% vibrant over transparent background
    color = (outAlpha > 0.005) ? clamp(color / outAlpha, 0.0, 1.0) : vec3(0.0);
  } else if (uBgMode == 2) {
    // Broadcast Chroma Key Green (#00FF00) for HDMI / Capture Card workflows without RGBA
    float peakChannel = max(color.r, max(color.g, color.b));
    float shapeMask = clamp(smoothstep(0.015, 0.22, peakChannel), 0.0, 1.0);
    vec3 pureColor = (shapeMask > 0.005) ? clamp(color / shapeMask, 0.0, 1.0) : vec3(0.0);
    color = mix(vec3(0.0, 1.0, 0.0), pureColor, shapeMask);
    outAlpha = 1.0;
  }

  fragColor = vec4(clamp(color, 0.0, 1.0), outAlpha);
}
`;


// ==================== MODULE: js/engine/textLayer.js ====================
/**
 * AETHER-VJ: Generador de textura de texto
 * Dibuja el texto (1-3 líneas) en blanco sobre transparente; el shader le aplica color, halo, glitch, ticker, onda, 3D...
 */

const BASE_FONT_PX = 170;
const MAX_CANVAS_W = 4096;
function renderTextCanvas(canvas, content, fontIndex) {
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


// ==================== MODULE: js/engine/outputMapping.js ====================
/**
 * AETHER-VJ: Mapeo de salida avanzado
 * - Corner-pin (homografía de 4 esquinas) para encajar la imagen en cualquier superficie inclinada.
 * - Utilidades puras (sin DOM) para poder probarlas en Node.
 */

/**
 * Homografía que lleva el cuadrado unidad (0,0),(1,0),(1,1),(0,1) a las 4 esquinas dadas.
 * Devuelve la matriz 3x3 por filas [a,b,c,d,e,f,g,h,1].
 */
function squareToQuad(corners) {
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
function invert3x3(m) {
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
function applyHomography(m, x, y) {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w, w];
}

/**
 * Escribe en `out` (Float32Array(9), orden por columnas para uniformMatrix3fv) la matriz
 * pantalla → imagen para las esquinas dadas. Devuelve false si las esquinas son degeneradas.
 */
function writeCornerPinMatrix(corners, out) {
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
function cornersKey(corners) {
  if (!Array.isArray(corners)) return '';
  let s = '';
  for (const p of corners) s += (p && p[0]) + ',' + (p && p[1]) + ';';
  return s;
}


// ==================== MODULE: js/engine/webglRenderer.js ====================
/**
 * AETHER-VJ: Zero-Allocation WebGL2 Multi-Pass GPU Rendering Engine
 * Pipeline:
 *   Pass 1: Active Deck A Generator -> fboDeckA
 *   Pass 2: Active Deck B Generator -> fboDeckB (Executed ONLY when crossfade > 0.001)
 *   Pass 3: Crossfade A/B + Ping-Pong Feedback Trails -> fboFeedback[writeIdx]
 *   Pass 4: 6-Stage Post-FX Rack + Luma/Alpha Key -> Default Screen Framebuffer
 */
class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.width = 0;
    this.height = 0;

    // Pre-allocated Palette Uniform Float32Arrays (Zero GC in render loop)
    this.palA = new Float32Array(3);
    this.palB = new Float32Array(3);
    this.palC = new Float32Array(3);
    this.palD = new Float32Array(3);
    // Objetivo de paleta (los uniforms reales lo persiguen con suavidad)
    this._palTA = new Float32Array(3);
    this._palTB = new Float32Array(3);
    this._palTC = new Float32Array(3);
    this._palTD = new Float32Array(3);
    this._palInit = false;
    this._lastPalMs = 0;

    this.quadVao = null;
    this.quadBuffer = null;

    this.generatorPrograms = [];
    this.feedbackProgram = null;
    this.postFxProgram = null;

    this.fboDeckA = null;
    this.fboDeckB = null;
    this.fboFeedback = [null, null];
    this.feedbackReadIndex = 0;

    this.texLogo = null;
    this._lastLogoDataUrl = '';
    this._logoLoading = false;
    this._logoFadeVal = 0.0;

    // Capa de vídeo / GIF / cámara (MediaLayer asignada desde fuera)
    this.media = null;
    this.texMedia = null;
    this._mediaFade = 0.0;
    this._mediaW = 1;
    this._mediaH = 1;

    // Texto en pantalla
    this.texText = null;
    this._textCanvas = null;
    this._textKey = '';
    this._textAspect = 4.0;
    this._textFade = 0.0;
    this._textScroll = 0.0;
    this._lastRenderTime = 0.0;

    // Corner-pin y máscaras (buffers reutilizables, cero basura por fotograma)
    this._cornerMat0 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this._cornerMat1 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this._cornerCache0 = new Float64Array(8).fill(NaN);
    this._cornerCache1 = new Float64Array(8).fill(NaN);
    this._maskRects = new Float32Array(16);
    this._maskFeather = new Float32Array(4);
    this._genAspectFactor = 1.0;

    this.contextLost = false;
    this.autoReloadOnContextLoss = false;
    this._contextWatchdog = null;
    this._initContext();
  }

  _initContext() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('WebGL2 is required for AETHER-VJ GPU Engine.');
    }
    this.gl = gl;

    // Handle GPU context loss recovery for 8-hour reliability
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      console.warn('[AETHER-VJ] WebGL2 context lost. Awaiting driver recovery...');
      // Watchdog: in unattended kiosk/projector mode, reload the page if the driver doesn't give the GPU back
      if (this.autoReloadOnContextLoss) {
        if (this._contextWatchdog) clearTimeout(this._contextWatchdog);
        this._contextWatchdog = setTimeout(() => {
          if (this.contextLost) {
            console.warn('[AETHER-VJ] GPU not recovered after 5s. Reloading page...');
            window.location.reload();
          }
        }, 5000);
      }
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.info('[AETHER-VJ] WebGL2 context restored. Rebuilding GPU pipeline...');
      if (this._contextWatchdog) {
        clearTimeout(this._contextWatchdog);
        this._contextWatchdog = null;
      }
      this.contextLost = false;
      // Old GPU objects are invalid after a context loss: drop references so they are recreated
      this.texLogo = null;
      this._lastLogoDataUrl = '';
      this.texMedia = null;
      this.texText = null;
      this._textKey = '';
      if (this.media) this.media.dirty = true;
      this._buildResources();
    });

    this._buildResources();
  }

  _buildResources() {
    const gl = this.gl;

    // 1. Fullscreen Quad VAO
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0
    ]);

    this.quadVao = gl.createVertexArray();
    this.quadBuffer = gl.createBuffer();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // 2. Compile all 32 Generator Programs
    const genUniformNames = [
      'uResolution', 'uTime', 'uRawTime', 'uEntropy',
      'uShapeMode', 'uStyleMode', 'uSweepMode', 'uWeightMode',
      'uSpeed', 'uScale', 'uComplexity', 'uThickness',
      'uRotation', 'uChaos', 'uStrobe', 'uColorShift',
      'uBeatPhase', 'uBarPhase', 'uBeatPulse', 'uAudioFFT',
      'uBeatsPerSec', 'uSafeStrobe', 'uCalmColor', 'uColorPhase',
      'uPalA', 'uPalB', 'uPalC', 'uPalD'
    ];

    this.generatorPrograms = GENERATOR_SHADERS.map((fragSrc, idx) => {
      const prog = this._createProgram(VERTEX_SHADER_SRC, fragSrc, `Generator_${idx + 1}`);
      return {
        program: prog,
        uniforms: this._cacheUniforms(prog, genUniformNames)
      };
    });

    // 3. Compile Feedback Composite Program
    const fbUniformNames = [
      'uTexDeckA', 'uTexDeckB', 'uTexPrevFeedback',
      'uCrossfade', 'uFeedbackWet', 'uTime', 'uBeatPulse',
      'uTexMedia', 'uMediaMix', 'uMediaBlend', 'uMediaFx', 'uMediaUvScale', 'uMediaMirror',
      'uMediaZoom', 'uMediaTexel', 'uMediaAspect', 'uAudioFFT',
      'uPalA', 'uPalB', 'uPalC', 'uPalD'
    ];
    const fbProg = this._createProgram(VERTEX_SHADER_SRC, FEEDBACK_COMPOSITE_SHADER_SRC, 'FeedbackComposite');
    this.feedbackProgram = {
      program: fbProg,
      uniforms: this._cacheUniforms(fbProg, fbUniformNames)
    };

    // 4. Compile Post-FX Rack Program
    const postUniformNames = [
      'uTexComposite', 'uResolution', 'uTime', 'uBeatPhase', 'uBeatPulse', 'uAudioFFT',
      'uKaleidoWet', 'uKaleidoAxes', 'uRgbShiftWet', 'uGlitchWet', 'uPixelateWet',
      'uEffect3DMode', 'uEffect3DAmount',
      'uTexLogo', 'uLogoEnabled', 'uLogoFxMode', 'uLogoScale', 'uLogoOpacity',
      'uLogoBackdrop', 'uLogoAspect', 'uLogoPos', 'uLogoTint', 'uLogoAccentCol',
      'uMapOffset', 'uMapScale', 'uMapKeystone', 'uSliceMode', 'uSliceCount',
      'uSliceGap', 'uSliceClone', 'uMapTestGrid',
      'uMasterBright', 'uColorTemp', 'uSafeStrobe',
      'uFlash', 'uInvert', 'uMonochrome', 'uBlackout', 'uStrobeBurst', 'uBgMode',
      'uCornerOn', 'uCornerH0', 'uCornerH1',
      'uEdgeMode', 'uEdgeOverlap', 'uEdgeGamma', 'uEdgeCurve',
      'uMaskRect', 'uMaskFeather',
      'uTexText', 'uTextEnabled', 'uTextFx', 'uTextScale', 'uTextOpacity', 'uTextBackdrop',
      'uTextAspect', 'uTextPos', 'uTextColorMode', 'uTextScroll'
    ];
    const postProg = this._createProgram(VERTEX_SHADER_SRC, POSTFX_RACK_SHADER_SRC, 'PostFxRack');
    this.postFxProgram = {
      program: postProg,
      uniforms: this._cacheUniforms(postProg, postUniformNames)
    };

    // 5. Allocate Reusable FBO Targets & Default DJ Logo Texture
    this.width = Math.max(64, this.canvas.clientWidth || 1280);
    this.height = Math.max(64, this.canvas.clientHeight || 720);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.fboDeckA = this._createFBO(this.width, this.height);
    this.fboDeckB = this._createFBO(this.width, this.height);
    this.fboFeedback[0] = this._createFBO(this.width, this.height);
    this.fboFeedback[1] = this._createFBO(this.width, this.height);

    this._initDefaultLogoTexture();
    this._lastLogoDataUrl = '';

    this.texMedia = this._createBlankTexture();
    this.texText = this._createBlankTexture();
    this._textKey = '';
  }

  _createBlankTexture() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  /** Sube el fotograma nuevo del vídeo / GIF / cámara a la GPU (solo si hay uno nuevo). */
  _syncMediaTexture() {
    const media = this.media;
    if (!media || !this.texMedia) return;
    media.sync();
    const src = media.pollFrame(performance.now());
    if (!src) return;
    const gl = this.gl;
    try {
      gl.bindTexture(gl.TEXTURE_2D, this.texMedia);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this._mediaW = Math.max(1, media.width);
      this._mediaH = Math.max(1, media.height);
    } catch (err) {
      // Vídeo de otro origen sin CORS o fotograma no listo: se ignora este fotograma
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  /** Regenera la textura del texto cuando cambia el contenido o la fuente. */
  _syncTextTexture(state) {
    const t = state.text;
    if (!t || !this.texText) return;
    const key = `${t.version || 0}|${t.font || 0}|${t.content || ''}`;
    if (key === this._textKey) return;
    this._textKey = key;
    if (!this._textCanvas) this._textCanvas = document.createElement('canvas');
    this._textAspect = renderTextCanvas(this._textCanvas, t.content || '', t.font || 0);
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texText);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._textCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  _updateCornerMatrix(corners, cache, out) {
    if (!Array.isArray(corners) || corners.length !== 4) return;
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const p = corners[i] || [0, 0];
      const x = Number(p[0]), y = Number(p[1]);
      if (cache[i * 2] !== x || cache[i * 2 + 1] !== y) {
        cache[i * 2] = x;
        cache[i * 2 + 1] = y;
        changed = true;
      }
    }
    if (changed) writeCornerPinMatrix(corners, out);
  }

  /** Proporción extra de la imagen total cuando hay edge blending o Escalador LED por píxeles X × Y. */
  _computeGenAspectFactor(state) {
    let factor = 1.0;
    const eb = state.fx && state.fx.edgeBlend;
    if (eb && eb.mode) {
      const ov = Math.max(0.02, Math.min(0.45, Number(eb.overlap) || 0.15));
      factor = eb.mode === 1 ? (2.0 - ov) / 2.0 : (2.0 - ov);
    }
    const map = state.fx && state.fx.mapping;
    if (map && map.ledScalerEnabled && map.ledKeepAspect !== false) {
      const ledW = Math.max(32, Number(map.ledWidthPx) || 1024);
      const ledH = Math.max(32, Number(map.ledHeightPx) || 512);
      const canvasAspect = Math.max(0.1, this.width / Math.max(1, this.height));
      const ledAspect = ledW / ledH;
      factor *= ledAspect / canvasAspect;
    }
    return factor;
  }

  _initDefaultLogoTexture() {
    const gl = this.gl;
    if (!this.texLogo) {
      this.texLogo = gl.createTexture();
    }
    // Generate a crisp built-in transparent PNG emblem ("AETHER LIVE") so the user can test Logo FX immediately
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 320;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    // Outer geometric diamond + frame
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, c.width - 48, c.height - 48);

    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, c.width - 80, c.height - 80);

    // Emblem text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 78px "JetBrains Mono", "Segoe UI", sans-serif';
    ctx.fillText('AETHER // LIVE', c.width / 2, c.height / 2 - 16);

    ctx.font = '700 28px "JetBrains Mono", "Segoe UI", sans-serif';
    ctx.fillText('◈ AUTONOMOUS VISUAL ENGINE ◈', c.width / 2, c.height / 2 + 54);

    gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  _syncLogoTexture(state) {
    const dataUrl = state.logoDataUrl || '';
    if (dataUrl === this._lastLogoDataUrl || this._logoLoading) return;
    if (!dataUrl) {
      this._lastLogoDataUrl = '';
      this._initDefaultLogoTexture();
      if (state.fx && state.fx.logo) state.fx.logo.aspect = 2.4;
      return;
    }

    this._logoLoading = true;
    const targetUrl = dataUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this._logoLoading = false;
      this._lastLogoDataUrl = targetUrl;
      if (this.contextLost || !this.gl || !this.texLogo) return;
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (state.fx && state.fx.logo && img.width > 0 && img.height > 0) {
        state.fx.logo.aspect = Math.max(0.25, Math.min(4.5, img.width / img.height));
      }
    };
    img.onerror = () => {
      this._logoLoading = false;
      this._lastLogoDataUrl = targetUrl;
    };
    img.src = targetUrl;
  }

  _createShader(type, source, label) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`[AETHER-VJ Shader Compile Error - ${label}]:\n${log}`);
    }
    return shader;
  }

  _createProgram(vsSource, fsSource, label) {
    const gl = this.gl;
    const vs = this._createShader(gl.VERTEX_SHADER, vsSource, `${label}_VS`);
    const fs = this._createShader(gl.FRAGMENT_SHADER, fsSource, `${label}_FS`);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Shaders can be detached & flagged for deletion immediately after linking
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`[AETHER-VJ Program Link Error - ${label}]:\n${log}`);
    }
    return program;
  }

  _cacheUniforms(program, names) {
    const gl = this.gl;
    const map = {};
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      map[name] = gl.getUniformLocation(program, name);
    }
    return map;
  }

  _createFBO(w, h) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { fbo, texture, width: w, height: h };
  }

  _resizeFBOInPlace(target, w, h) {
    if (!target || (target.width === w && target.height === h)) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    target.width = w;
    target.height = h;
  }

  syncResolution(scaleFactor = 1.0) {
    if (this.contextLost) return;
    const dpr = Math.min(window.devicePixelRatio || 1.0, 2.0);
    const targetW = Math.max(64, Math.floor(this.canvas.clientWidth * dpr * scaleFactor));
    const targetH = Math.max(64, Math.floor(this.canvas.clientHeight * dpr * scaleFactor));

    if (targetW !== this.width || targetH !== this.height) {
      this.width = targetW;
      this.height = targetH;
      this.canvas.width = targetW;
      this.canvas.height = targetH;

      // Resize FBO textures in-place (Zero object allocation / Zero memory leaks)
      this._resizeFBOInPlace(this.fboDeckA, targetW, targetH);
      this._resizeFBOInPlace(this.fboDeckB, targetW, targetH);
      this._resizeFBOInPlace(this.fboFeedback[0], targetW, targetH);
      this._resizeFBOInPlace(this.fboFeedback[1], targetW, targetH);
    }
  }

  _renderGeneratorPass(genIndex, targetFbo, state) {
    const gl = this.gl;
    const genObj = this.generatorPrograms[genIndex] || this.generatorPrograms[0];
    const u = genObj.uniforms;
    const m = state.macros;

    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(genObj.program);

    // Wrap time variables within safe modular period so 8+ hour sessions keep float32 precision
    const safePhaseTime = state.accumulatedPhase % 18000.0;
    const safeRawTime = state.renderTime % 18000.0;

    // Con edge blending la imagen total es más ancha que la ventana: el generador dibuja con esa proporción
    gl.uniform2f(u.uResolution, this.width * this._genAspectFactor, this.height);
    gl.uniform1f(u.uTime, safePhaseTime);
    gl.uniform1f(u.uRawTime, safeRawTime);
    gl.uniform1f(u.uEntropy, state.entropySeed);
    gl.uniform1i(u.uShapeMode, state.shapeMode || 0);
    gl.uniform1i(u.uStyleMode, state.styleMode || 0);
    gl.uniform1i(u.uSweepMode, state.sweepMode || 0);
    gl.uniform1i(u.uWeightMode, state.weightMode || 0);

    // 8 Modulated Macro Uniforms
    gl.uniform1f(u.uSpeed, m.speed.modulated);
    gl.uniform1f(u.uScale, m.scale.modulated);
    gl.uniform1f(u.uComplexity, m.complexity.modulated);
    gl.uniform1f(u.uThickness, m.thickness.modulated);
    gl.uniform1f(u.uRotation, m.rotation.modulated);
    gl.uniform1f(u.uChaos, m.chaos.modulated);
    gl.uniform1f(u.uStrobe, m.strobe.modulated);
    gl.uniform1f(u.uColorShift, m.colorShift.modulated);

    // BPM & Audio FFT
    gl.uniform1f(u.uBeatPhase, state.bpm.beatPhase);
    gl.uniform1f(u.uBarPhase, state.bpm.barPhase);
    gl.uniform1f(u.uBeatPulse, state.bpm.syncPulse);
    gl.uniform3f(u.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);
    gl.uniform1f(u.uBeatsPerSec, (state.bpm.value * state.bpm.multiplier) / 60.0);
    gl.uniform1i(u.uSafeStrobe, state.fx.safeStrobe !== false ? 1 : 0);
    gl.uniform1i(u.uCalmColor, state.calmColor !== false ? 1 : 0);
    gl.uniform1f(u.uColorPhase, ((state.colorPhase || 0) + (state.colorOffset || 0)) % 10000.0);

    // Interpolated Cosine Palette Coefficients
    gl.uniform3fv(u.uPalA, this.palA);
    gl.uniform3fv(u.uPalB, this.palB);
    gl.uniform3fv(u.uPalC, this.palC);
    gl.uniform3fv(u.uPalD, this.palD);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  renderFrame(state) {
    if (this.contextLost) return;
    const gl = this.gl;

    this.syncResolution(state.resolutionScale);

    // Update interpolated palette vectors in-place
    const palActive = PALETTES[state.paletteActive] || PALETTES[0];
    const palTarget = PALETTES[state.paletteTarget] || palActive;
    interpolatePalette(
      palActive,
      palTarget,
      state.paletteMix,
      this._palTA,
      this._palTB,
      this._palTC,
      this._palTD
    );
    // Limitador de velocidad de color: los coeficientes reales persiguen al objetivo con suavidad,
    // así ningún cambio de paleta (manual, Autopilot o Look) puede dar un salto brusco de color
    const nowMs = performance.now();
    const dtPal = this._lastPalMs ? Math.min(0.1, (nowMs - this._lastPalMs) / 1000) : 0;
    this._lastPalMs = nowMs;
    const tau = state.calmColor !== false ? 2.5 : 0.25;
    const k = this._palInit ? 1 - Math.exp(-dtPal / tau) : 1;
    this._palInit = true;
    for (let i = 0; i < 3; i++) {
      this.palA[i] += (this._palTA[i] - this.palA[i]) * k;
      this.palB[i] += (this._palTB[i] - this.palB[i]) * k;
      this.palC[i] += (this._palTC[i] - this.palC[i]) * k;
      this.palD[i] += (this._palTD[i] - this.palD[i]) * k;
    }

    gl.bindVertexArray(this.quadVao);
    this._genAspectFactor = this._computeGenAspectFactor(state);

    // Frame delta (ticker del texto)
    const dtRender = Math.max(0, Math.min(0.1, state.renderTime - this._lastRenderTime));
    this._lastRenderTime = state.renderTime;

    // PASS 1: Render Deck A (only if crossfade < 0.999)
    if (state.crossfade < 0.999) {
      this._renderGeneratorPass(state.deckA, this.fboDeckA, state);
    }

    // PASS 2: Render Deck B (only if crossfade > 0.001)
    if (state.crossfade > 0.001) {
      this._renderGeneratorPass(state.deckB, this.fboDeckB, state);
    }

    // PASS 3: Crossfade A/B + Ping-Pong Feedback Delay / Trails
    const readIdx = this.feedbackReadIndex;
    const writeIdx = 1 - readIdx;
    const fbRead = this.fboFeedback[readIdx];
    const fbWrite = this.fboFeedback[writeIdx];
    const fbU = this.feedbackProgram.uniforms;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbWrite.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.feedbackProgram.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboDeckA.texture);
    gl.uniform1i(fbU.uTexDeckA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fboDeckB.texture);
    gl.uniform1i(fbU.uTexDeckB, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, fbRead.texture);
    gl.uniform1i(fbU.uTexPrevFeedback, 2);

    gl.uniform1f(fbU.uCrossfade, state.crossfade);
    gl.uniform1f(fbU.uFeedbackWet, state.fx.feedback.enabled ? state.fx.feedback.wet : 0.0);
    gl.uniform1f(fbU.uTime, state.renderTime % 18000.0);
    gl.uniform1f(fbU.uBeatPulse, state.bpm.syncPulse);

    // Capa de vídeo / GIF / cámara
    this._syncMediaTexture();
    const med = state.media;
    const mediaReady = Boolean(this.media && this.media.ready);
    const mediaTarget = (med && med.enabled && mediaReady) ? 1.0 : 0.0;
    this._mediaFade += (mediaTarget - this._mediaFade) * 0.12;
    if (Math.abs(mediaTarget - this._mediaFade) < 0.004) this._mediaFade = mediaTarget;

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.texMedia);
    gl.uniform1i(fbU.uTexMedia, 3);
    const mediaOpacity = med ? Math.max(0, Math.min(1, Number(med.opacity ?? 1))) : 0;
    gl.uniform1f(fbU.uMediaMix, this._mediaFade * mediaOpacity);
    if (this._mediaFade > 0.003 && med) {
      const contentAspect = (this.width * this._genAspectFactor) / Math.max(1, this.height);
      const mediaAspect = this._mediaW / this._mediaH;
      let sx = 1.0, sy = 1.0;
      if (med.fit === 1) {
        // Encajar: se ve el vídeo entero (bandas transparentes)
        if (mediaAspect > contentAspect) sy = mediaAspect / contentAspect;
        else sx = contentAspect / mediaAspect;
      } else {
        // Llenar: cubre toda la pantalla recortando
        if (mediaAspect > contentAspect) sx = contentAspect / mediaAspect;
        else sy = mediaAspect / contentAspect;
      }
      const bz = Math.max(0, Math.min(1, Number(med.beatZoom) || 0));
      gl.uniform1i(fbU.uMediaBlend, med.blend || 0);
      gl.uniform1i(fbU.uMediaFx, med.fx || 0);
      gl.uniform2f(fbU.uMediaUvScale, sx, sy);
      gl.uniform1i(fbU.uMediaMirror, med.mirror ? 1 : 0);
      gl.uniform1f(fbU.uMediaZoom, 1.0 + bz * (0.16 * state.bpm.syncPulse + 0.08 * state.audio.bass));
      gl.uniform2f(fbU.uMediaTexel, 1.0 / this._mediaW, 1.0 / this._mediaH);
      gl.uniform1f(fbU.uMediaAspect, mediaAspect);
      gl.uniform3f(fbU.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);
      gl.uniform3fv(fbU.uPalA, this.palA);
      gl.uniform3fv(fbU.uPalB, this.palB);
      gl.uniform3fv(fbU.uPalC, this.palC);
      gl.uniform3fv(fbU.uPalD, this.palD);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap Feedback Ping-Pong pointer
    this.feedbackReadIndex = writeIdx;

    // PASS 4: Final Post-Processing FX Rack to Screen Framebuffer
    this._syncLogoTexture(state);

    const postU = this.postFxProgram.uniforms;
    const fx = state.fx;
    const logo = fx.logo || {
      enabled: false,
      fxMode: 1,
      scale: 0.44,
      opacity: 0.96,
      backdrop: 0.65,
      pos: 0,
      tint: false,
      aspect: 2.4
    };

    const targetFade = logo.enabled ? 1.0 : 0.0;
    this._logoFadeVal += (targetFade - this._logoFadeVal) * 0.16;
    if (Math.abs(targetFade - this._logoFadeVal) < 0.004) {
      this._logoFadeVal = targetFade;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.0, 0.0, 0.0, state.bgMode === 'ALPHA' ? 0.0 : 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let outVpX = 0;
    let outVpY = 0;
    let outVpW = this.width;
    let outVpH = this.height;
    const mapCfg = fx.mapping;
    if (mapCfg && mapCfg.ledScalerEnabled) {
      const screenW = Math.max(64, this.canvas.clientWidth || 1920);
      const screenH = Math.max(64, this.canvas.clientHeight || 1080);
      const scaleToBufX = this.width / screenW;
      const scaleToBufY = this.height / screenH;
      const ledW = Math.max(32, Math.min(8192, Number(mapCfg.ledWidthPx) || 1024));
      const ledH = Math.max(32, Math.min(8192, Number(mapCfg.ledHeightPx) || 512));
      const offX = Number(mapCfg.ledOffsetXPx) || 0;
      const offY = Number(mapCfg.ledOffsetYPx) || 0;
      const isCenter = mapCfg.ledAnchor === 'center';
      const topLeftX = isCenter ? Math.round((screenW - ledW) * 0.5) + offX : offX;
      const topLeftY = isCenter ? Math.round((screenH - ledH) * 0.5) + offY : offY;

      outVpW = Math.max(16, Math.round(ledW * scaleToBufX));
      outVpH = Math.max(16, Math.round(ledH * scaleToBufY));
      outVpX = Math.round(topLeftX * scaleToBufX);
      // En WebGL Y=0 está abajo; convertimos desde la esquina superior izquierda (0,0) de la salida HDMI
      outVpY = Math.round(this.height - (topLeftY * scaleToBufY) - outVpH);
      gl.viewport(outVpX, outVpY, outVpW, outVpH);
    }

    gl.useProgram(this.postFxProgram.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbWrite.texture);
    gl.uniform1i(postU.uTexComposite, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
    gl.uniform1i(postU.uTexLogo, 1);

    gl.uniform2f(postU.uResolution, outVpW, outVpH);
    gl.uniform1f(postU.uTime, state.renderTime % 18000.0);
    gl.uniform1f(postU.uBeatPhase, state.bpm.beatPhase);
    gl.uniform1f(postU.uBeatPulse, state.bpm.syncPulse);
    gl.uniform3f(postU.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);

    gl.uniform1f(postU.uKaleidoWet, fx.kaleidoscope.enabled ? fx.kaleidoscope.wet : 0.0);
    gl.uniform1f(postU.uKaleidoAxes, fx.kaleidoscope.axes);
    gl.uniform1f(postU.uRgbShiftWet, fx.rgbShift.enabled ? fx.rgbShift.wet : 0.0);
    gl.uniform1f(postU.uGlitchWet, fx.glitch.enabled ? fx.glitch.wet : 0.0);
    gl.uniform1f(postU.uPixelateWet, fx.pixelate.enabled ? fx.pixelate.wet : 0.0);

    const eff3dMode = (fx.effect3d && typeof fx.effect3d.mode === 'number') ? fx.effect3d.mode : 0;
    const eff3dAmt = (fx.effect3d && typeof fx.effect3d.amount === 'number') ? fx.effect3d.amount : 0.55;
    gl.uniform1i(postU.uEffect3DMode, eff3dMode);
    gl.uniform1f(postU.uEffect3DAmount, eff3dAmt);

    // Dynamic DJ Logo Uniforms
    gl.uniform1f(postU.uLogoEnabled, this._logoFadeVal);
    gl.uniform1i(postU.uLogoFxMode, logo.fxMode || 0);
    gl.uniform1f(postU.uLogoScale, logo.scale ?? 0.44);
    gl.uniform1f(postU.uLogoOpacity, logo.opacity ?? 0.96);
    gl.uniform1f(postU.uLogoBackdrop, logo.backdrop ?? 0.65);
    gl.uniform1f(postU.uLogoAspect, logo.aspect || 2.4);
    gl.uniform1i(postU.uLogoPos, logo.pos || 0);
    gl.uniform1i(postU.uLogoTint, logo.tint ? 1 : 0);
    // Compute active palette bright accent color for Logo Neon Halo / Tint
    const acR = Math.min(1.0, Math.max(0.15, this.palA[0] + this.palB[0] * 0.85));
    const acG = Math.min(1.0, Math.max(0.15, this.palA[1] + this.palB[1] * 0.85));
    const acB = Math.min(1.0, Math.max(0.15, this.palA[2] + this.palB[2] * 0.85));
    gl.uniform3f(postU.uLogoAccentCol, acR, acG, acB);

    // Stage Screen Mapping & Multi-Slice Uniforms
    const map = fx.mapping || {
      offsetX: 0.0, offsetY: 0.0, scaleX: 1.0, scaleY: 1.0,
      keystoneX: 0.0, keystoneY: 0.0, sliceMode: 0, sliceCount: 3,
      sliceGap: 0.04, sliceClone: true, showTestGrid: false
    };
    gl.uniform2f(postU.uMapOffset, map.offsetX || 0.0, map.offsetY || 0.0);
    gl.uniform2f(postU.uMapScale, map.scaleX ?? 1.0, map.scaleY ?? 1.0);
    gl.uniform2f(postU.uMapKeystone, map.keystoneX || 0.0, map.keystoneY || 0.0);
    gl.uniform1i(postU.uSliceMode, map.sliceMode || 0);
    gl.uniform1i(postU.uSliceCount, map.sliceCount || 3);
    gl.uniform1f(postU.uSliceGap, map.sliceGap ?? 0.04);
    gl.uniform1i(postU.uSliceClone, map.sliceClone !== false ? 1 : 0);
    gl.uniform1i(postU.uMapTestGrid, map.showTestGrid ? 1 : 0);

    // Output Master & Photosensitive Safety
    const out = fx.output || { brightness: 1.0, colorTemp: 0.0 };
    gl.uniform1f(postU.uMasterBright, out.brightness ?? 1.0);
    gl.uniform1f(postU.uColorTemp, out.colorTemp || 0.0);
    gl.uniform1i(postU.uSafeStrobe, fx.safeStrobe !== false ? 1 : 0);

    gl.uniform1f(postU.uFlash, fx.flashMomentary ? 1.0 : 0.0);
    gl.uniform1f(postU.uInvert, fx.invertKill ? 1.0 : 0.0);
    gl.uniform1f(postU.uMonochrome, fx.bwMonochrome ? 1.0 : 0.0);
    gl.uniform1f(postU.uBlackout, fx.blackout ? 1.0 : 0.0);
    gl.uniform1f(postU.uStrobeBurst, fx.strobeBurst ? 1.0 : 0.0);
    const bgModeInt = state.bgMode === 'ALPHA' ? 1 : (state.bgMode === 'CHROMA' ? 2 : 0);
    gl.uniform1i(postU.uBgMode, bgModeInt);

    // Corner-pin por proyector
    const pinOn = Boolean(map.cornerPin);
    gl.uniform1i(postU.uCornerOn, pinOn ? 1 : 0);
    if (pinOn) {
      this._updateCornerMatrix(map.corners, this._cornerCache0, this._cornerMat0);
      this._updateCornerMatrix(map.corners2 || map.corners, this._cornerCache1, this._cornerMat1);
      gl.uniformMatrix3fv(postU.uCornerH0, false, this._cornerMat0);
      gl.uniformMatrix3fv(postU.uCornerH1, false, this._cornerMat1);
    }

    // Edge blending
    const eb = fx.edgeBlend || { mode: 0, overlap: 0.15, gamma: 2.2, curve: 2.0 };
    gl.uniform1i(postU.uEdgeMode, eb.mode || 0);
    gl.uniform1f(postU.uEdgeOverlap, eb.overlap ?? 0.15);
    gl.uniform1f(postU.uEdgeGamma, eb.gamma ?? 2.2);
    gl.uniform1f(postU.uEdgeCurve, eb.curve ?? 2.0);

    // Máscaras negras
    const masks = Array.isArray(map.masks) ? map.masks : [];
    for (let i = 0; i < 4; i++) {
      const mk = masks[i];
      const on = mk && mk.enabled;
      this._maskRects[i * 4] = on ? Number(mk.x) || 0 : 0;
      this._maskRects[i * 4 + 1] = on ? Number(mk.y) || 0 : 0;
      this._maskRects[i * 4 + 2] = on ? Math.max(0, Number(mk.w) || 0) : 0;
      this._maskRects[i * 4 + 3] = on ? Math.max(0, Number(mk.h) || 0) : 0;
      this._maskFeather[i] = on ? Math.max(0.0005, Number(mk.feather) || 0.01) : 0.001;
    }
    gl.uniform4fv(postU.uMaskRect, this._maskRects);
    gl.uniform1fv(postU.uMaskFeather, this._maskFeather);

    // Texto en pantalla
    const txt = state.text;
    this._syncTextTexture(state);
    const hasText = Boolean(txt && txt.enabled && String(txt.content || '').trim().length > 0);
    const textTarget = hasText ? 1.0 : 0.0;
    this._textFade += (textTarget - this._textFade) * 0.14;
    if (Math.abs(textTarget - this._textFade) < 0.004) this._textFade = textTarget;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.texText);
    gl.uniform1i(postU.uTexText, 2);
    gl.uniform1f(postU.uTextEnabled, this._textFade);
    if (txt && this._textFade > 0.004) {
      const tScale = Math.max(0.08, Math.min(1.2, Number(txt.scale) || 0.5));
      const textWidthUnits = Math.max(0.05, 0.42 * tScale * this._textAspect * 1.35);
      const viewW = (this.width * this._genAspectFactor) / Math.max(1, this.height);
      const screensPerSec = 0.04 + Math.max(0.05, Math.min(1, Number(txt.scrollSpeed) || 0.5)) * 0.36;
      this._textScroll = (this._textScroll + dtRender * screensPerSec * viewW / textWidthUnits) % 1000.0;
      gl.uniform1i(postU.uTextFx, txt.fxMode || 0);
      gl.uniform1f(postU.uTextScale, tScale);
      gl.uniform1f(postU.uTextOpacity, txt.opacity ?? 1.0);
      gl.uniform1f(postU.uTextBackdrop, txt.backdrop ?? 0.4);
      gl.uniform1f(postU.uTextAspect, this._textAspect);
      gl.uniform1i(postU.uTextPos, txt.pos || 0);
      gl.uniform1i(postU.uTextColorMode, txt.colorMode || 0);
      gl.uniform1f(postU.uTextScroll, this._textScroll);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }
}


// ==================== MODULE: js/engine/audioAnalyzer.js ====================
/**
 * AETHER-VJ: Web Audio API Real-Time FFT Analyzer & Techno Line-Check Simulator
 * Extracts normalized Bass (20-160Hz), Mid (160-2000Hz), and High (2000-16000Hz) envelopes.
 */
class AudioAnalyzer {
  constructor(state) {
    this.state = state;
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.fftData = null;
    this.isListening = false;
  }

  async enableMicrophone(deviceId = 'default') {
    try {
      this.stopMicrophone();

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : {})
        },
        video: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.72;

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;
      this.state.audio.enabled = true;
      this.state.audio.simMode = false;
      return true;
    } catch (err) {
      console.warn('[AETHER-VJ] Microphone / Line-In access denied or unavailable, switching to BPM Synth Sim:', err);
      // Fallback to Internal BPM Techno Envelope Simulator so audio reactivity still works
      this.enableSimMode();
      return false;
    }
  }

  enableSimMode() {
    this.stopMicrophone();
    this.state.audio.enabled = true;
    this.state.audio.simMode = true;
  }

  stopMicrophone() {
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.isListening = false;
    this.state.audio.enabled = false;
    this.state.audio.simMode = false;
    this.state.audio.bass = 0.0;
    this.state.audio.mid = 0.0;
    this.state.audio.high = 0.0;
  }

  async listAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch (_) {
      return [];
    }
  }

  update(dt) {
    const audio = this.state.audio;
    if (!audio.enabled) {
      audio.bass *= 0.85;
      audio.mid *= 0.85;
      audio.high *= 0.85;
      return;
    }

    const gain = audio.gain * audio.reactivityAmount;

    if (audio.simMode) {
      // Internal Festival Techno FFT Envelope Simulator synced to BPM
      const beatPhase = this.state.bpm.beatPhase;
      const barPhase = this.state.bpm.barPhase;
      const t = this.state.renderTime;

      // 4/4 Sub-Bass Kick on every beat
      const kickEnv = Math.pow(Math.max(0.0, 1.0 - beatPhase * 2.6), 2.2);
      // Off-beat 909 Open Hi-Hat (peaks at beatPhase = 0.5)
      const hatPhase = (beatPhase + 0.5) % 1.0;
      const hatEnv = Math.pow(Math.max(0.0, 1.0 - hatPhase * 3.5), 2.0) * 0.85;
      // 16th-note Acid Mid-Arpeggio
      const sixteenth = (beatPhase * 4.0) % 1.0;
      const midEnv = Math.pow(Math.max(0.0, 1.0 - sixteenth * 2.2), 1.8) * (0.45 + 0.45 * Math.sin(barPhase * 6.283 + t));

      audio.bass = Math.min(1.0, kickEnv * gain);
      audio.mid = Math.min(1.0, midEnv * gain);
      audio.high = Math.min(1.0, hatEnv * gain);
      return;
    }

    if (this.isListening && this.analyser && this.fftData) {
      this.analyser.getByteFrequencyData(this.fftData);

      // Assuming ~48kHz sample rate, 1024 FFT => ~46.8Hz per bin (512 bins)
      // Bass: bins 1..5 (~46Hz - 230Hz)
      let bassSum = 0;
      for (let i = 1; i <= 5; i++) bassSum += this.fftData[i];
      const rawBass = (bassSum / (5 * 255)) * gain;

      // Mid: bins 6..42 (~280Hz - 2000Hz)
      let midSum = 0;
      for (let i = 6; i <= 42; i++) midSum += this.fftData[i];
      const rawMid = (midSum / (37 * 255)) * gain * 1.25;

      // High: bins 43..180 (~2000Hz - 8500Hz)
      let highSum = 0;
      for (let i = 43; i <= 180; i++) highSum += this.fftData[i];
      const rawHigh = (highSum / (138 * 255)) * gain * 1.6;

      // Fast attack, smooth release envelope follower
      const attack = Math.min(1.0, dt * 28.0);
      const release = Math.min(1.0, dt * 8.5);

      audio.bass += (rawBass - audio.bass) * (rawBass > audio.bass ? attack : release);
      audio.mid += (rawMid - audio.mid) * (rawMid > audio.mid ? attack : release);
      audio.high += (rawHigh - audio.high) * (rawHigh > audio.high ? attack : release);

      audio.bass = Math.min(1.0, Math.max(0.0, audio.bass));
      audio.mid = Math.min(1.0, Math.max(0.0, audio.mid));
      audio.high = Math.min(1.0, Math.max(0.0, audio.high));
    }
  }
}


// ==================== MODULE: js/engine/autopilotBrain.js ====================
/**
 * AETHER-VJ: 8-Hour Autonomous State Machine ("THE AUTOPILOT BRAIN"),
 * Master BPM Rhythm Clock & 8-Channel Multi-Wave LFO Modulator.
 */


const MORPH_FX_KEYS = ['kaleidoscope', 'rgbShift', 'feedback', 'glitch', 'pixelate'];

function smooth01(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
class AutopilotBrain {
  constructor(state) {
    this.state = state;
    // Target macro base values for smooth organic drift during Autopilot transitions
    this.macroBaseTargets = {};
    for (const def of MACRO_DEFS) {
      this.macroBaseTargets[def.key] = state.macros[def.key].base;
    }
    // Transición de Look en curso (fundido de N compases) y la que espera al próximo beat
    this.pendingMorph = null;
    this.morph = null;
  }

  /**
   * Programa una transición completa hacia un Look guardado durante `bars` compases.
   * Empieza en el próximo beat para que caiga a ritmo.
   */
  queueLookMorph(preset, bars) {
    if (!preset) return;
    this.pendingMorph = { preset, bars: Math.max(1, Number(bars) || 4) };
  }

  _beginLookMorph(p, bars) {
    const st = this.state;
    const beatsPerSec = Math.max(0.5, (st.bpm.value * st.bpm.multiplier) / 60.0);
    const duration = Math.max(0.5, (bars * 4) / beatsPerSec);

    // 1. Valores de partida (antes de que el cambio de escena los aleatorice)
    const fromMacros = {};
    for (const def of MACRO_DEFS) fromMacros[def.key] = st.macros[def.key].base;
    const fromFx = {};
    for (const k of MORPH_FX_KEYS) {
      const f = st.fx[k];
      fromFx[k] = f && f.enabled ? f.wet : 0;
    }
    const from3d = st.fx.effect3d ? { ...st.fx.effect3d } : { mode: 0, amount: 0.55 };

    // 2. Comportamiento del Autopilot del Look
    if (p.autopilot) {
      st.autopilot.enabled = Boolean(p.autopilot.enabled);
      if (p.autopilot.mode) st.autopilot.mode = p.autopilot.mode;
      if (p.autopilot.pool) st.autopilotBankPool = p.autopilot.pool;
      if (p.autopilot.triggerUnit) st.autopilot.triggerUnit = p.autopilot.triggerUnit;
      if (p.autopilot.triggerBars) st.autopilot.triggerBars = p.autopilot.triggerBars;
      if (p.autopilot.triggerSeconds) st.autopilot.triggerSeconds = p.autopilot.triggerSeconds;
    }

    // 3. Fundido del visual (A/B) con la duración exacta de los compases
    if (typeof p.gen === 'number' && GENERATORS[p.gen]) {
      this.triggerNextScene(p.gen);
    }
    st.crossfadeDuration = duration;

    // 4. Paleta (avanza junto al crossfade)
    if (typeof p.palette === 'number' && PALETTES[p.palette]) {
      st.paletteActive = st.paletteTarget;
      st.paletteTarget = p.palette;
      st.paletteMix = 0.0;
    }
    if (typeof p.autoRotatePalette === 'boolean') st.autoRotatePalette = p.autoRotatePalette;

    // 5. Formas de onda de los LFO y rutas de audio cambian al momento; los valores se funden
    const toMacros = {};
    for (const def of MACRO_DEFS) {
      const src = p.macros ? p.macros[def.key] : null;
      const m = st.macros[def.key];
      toMacros[def.key] = src && typeof src.base === 'number' ? src.base : fromMacros[def.key];
      if (src) {
        if (src.lfoWave) m.lfoWave = src.lfoWave;
        if (typeof src.lfoDepth === 'number') m.lfoDepth = src.lfoDepth;
        if (typeof src.lfoRate === 'number') m.lfoRate = src.lfoRate;
        if (src.audioBand) m.audioBand = src.audioBand;
        if (typeof src.audioAmount === 'number') m.audioAmount = src.audioAmount;
      }
      // Deshace la aleatorización del cambio de escena: partimos del valor actual
      m.base = fromMacros[def.key];
    }

    // 6. Efectos: los que se encienden entran desde 0, los que se apagan se desvanecen
    const toFx = {};
    for (const k of MORPH_FX_KEYS) {
      const target = p.fx && p.fx[k] ? p.fx[k] : null;
      const f = st.fx[k];
      toFx[k] = target && target.enabled ? (target.wet ?? f.wet) : 0;
      if (target && typeof target.axes === 'number') f.axes = target.axes;
      f.enabled = fromFx[k] > 0.001 || toFx[k] > 0.001;
      f.wet = fromFx[k];
    }

    this.morph = {
      preset: p,
      elapsed: 0,
      duration,
      fromMacros,
      toMacros,
      fromFx,
      toFx,
      from3d,
      to3d: p.effect3d ? { mode: p.effect3d.mode || 0, amount: p.effect3d.amount ?? 0.55 } : from3d,
      discreteApplied: false
    };
  }

  _applyMorphDiscrete(p) {
    const st = this.state;
    if (typeof p.shapeMode === 'number') st.shapeMode = p.shapeMode;
    if (typeof p.styleMode === 'number') st.styleMode = p.styleMode;
    if (typeof p.weightMode === 'number') st.weightMode = p.weightMode;
    if (typeof p.sweepMode === 'number') st.sweepMode = p.sweepMode;
    if (typeof p.pureFlatBypassFx === 'boolean') st.pureFlatBypassFx = p.pureFlatBypassFx;
  }

  _updateLookMorph(dt) {
    const mo = this.morph;
    if (!mo) return;
    const st = this.state;
    mo.elapsed += dt;
    const raw = Math.min(1, mo.elapsed / mo.duration);
    const t = smooth01(raw);

    for (const def of MACRO_DEFS) {
      const k = def.key;
      const v = mo.fromMacros[k] + (mo.toMacros[k] - mo.fromMacros[k]) * t;
      st.macros[k].base = v;
      this.macroBaseTargets[k] = v;
    }
    for (const k of MORPH_FX_KEYS) {
      st.fx[k].wet = mo.fromFx[k] + (mo.toFx[k] - mo.fromFx[k]) * t;
    }

    // 3D: si cambia de modo, baja a plano en la primera mitad y sube el nuevo en la segunda
    if (!st.fx.effect3d) st.fx.effect3d = { mode: 0, amount: 0.55 };
    if (mo.from3d.mode === mo.to3d.mode) {
      st.fx.effect3d.amount = mo.from3d.amount + (mo.to3d.amount - mo.from3d.amount) * t;
    } else if (raw < 0.5) {
      st.fx.effect3d.mode = mo.from3d.mode;
      st.fx.effect3d.amount = Math.max(0.1, mo.from3d.amount * (1 - smooth01(raw * 2)));
    } else {
      st.fx.effect3d.mode = mo.to3d.mode;
      st.fx.effect3d.amount = Math.max(0.1, mo.to3d.amount * smooth01((raw - 0.5) * 2));
    }

    if (!mo.discreteApplied && raw >= 0.5) {
      mo.discreteApplied = true;
      this._applyMorphDiscrete(mo.preset);
    }

    if (raw >= 1) {
      const p = mo.preset;
      for (const def of MACRO_DEFS) {
        st.macros[def.key].base = mo.toMacros[def.key];
        this.macroBaseTargets[def.key] = mo.toMacros[def.key];
      }
      for (const k of MORPH_FX_KEYS) {
        const target = p.fx && p.fx[k] ? p.fx[k] : null;
        if (target) {
          st.fx[k].enabled = Boolean(target.enabled);
          if (typeof target.wet === 'number') st.fx[k].wet = target.wet;
        } else {
          st.fx[k].enabled = mo.toFx[k] > 0.001;
        }
      }
      st.fx.effect3d.mode = mo.to3d.mode;
      st.fx.effect3d.amount = mo.to3d.amount;
      this.morph = null;
    }
  }

  /**
   * Smooth 1D Perlin-like multi-sine procedural noise (non-repeating prime ratios)
   */
  _proceduralNoise1D(x) {
    return (
      Math.sin(x * 1.0) * 0.45 +
      Math.sin(x * 2.3183 + 1.7) * 0.30 +
      Math.sin(x * 4.7321 + 4.1) * 0.15 +
      Math.cos(x * 7.1937 + 2.8) * 0.10
    );
  }

  /**
   * Evaluates the selected LFO waveform in range [-1.0, +1.0]
   */
  _evaluateLfoWave(waveType, time, rate, phaseOffset, bpmState, speedMult) {
    if (waveType === 'OFF') return 0.0;

    const effectiveFreq = (0.04 + rate * 0.85) * speedMult;
    const phase = time * effectiveFreq + phaseOffset;

    switch (waveType) {
      case 'SINE':
        return Math.sin(phase * Math.PI * 2.0);

      case 'TRI': {
        const f = ((phase % 1.0) + 1.0) % 1.0;
        return f < 0.5 ? (f * 4.0 - 1.0) : (3.0 - f * 4.0);
      }

      case 'PERLIN':
        return this._proceduralNoise1D(phase * 2.2 + phaseOffset * 5.0);

      case 'STEP': {
        // Beat-synchronized stepped sequencer
        const stepDiv = rate > 0.65 ? 4.0 : (rate > 0.35 ? 2.0 : 1.0);
        const stepIndex = Math.floor((bpmState.totalBeats + bpmState.beatPhase) * stepDiv + phaseOffset * 8.0);
        const h = Math.sin(stepIndex * 127.1 + phaseOffset * 311.7) * 43758.5453;
        const norm = h - Math.floor(h);
        return norm * 2.0 - 1.0;
      }

      default:
        return 0.0;
    }
  }

  /**
   * Tap Tempo handler: averages last 4 taps
   */
  registerTapTempo() {
    const now = performance.now();
    const taps = this.state.bpm.lastTapTimes;

    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 5) taps.shift();

    if (taps.length >= 2) {
      let sumIntervals = 0;
      for (let i = 1; i < taps.length; i++) {
        sumIntervals += taps[i] - taps[i - 1];
      }
      const avgMs = sumIntervals / (taps.length - 1);
      const computedBpm = Math.round((60000 / avgMs) * 10) / 10;
      this.state.bpm.value = Math.min(220, Math.max(60, computedBpm));
    }
  }

  /**
   * Devuelve la lista de IDs de loops activos según la familia seleccionada en el Piloto Automático
   */
  _getAllowedGenerators() {
    const bankPool = this.state.autopilotBankPool || 'FLT';
    return GENERATORS.filter((g) => {
      if (bankPool === 'FLAT_GEO_KIN') return g.bank !== 'SPC'; // 40 Loops Planos, Minimal, Escenario, Formas y Barridos (Sin 3D)
      if (bankPool === 'FLT') return g.bank === 'FLT';
      if (bankPool === 'MIN') return g.bank === 'MIN';
      if (bankPool === 'MOT') return g.bank === 'MOT';
      if (bankPool === 'KIN') return g.bank === 'KIN';
      if (bankPool === 'GEO') return g.bank === 'GEO';
      if (bankPool === 'SPC') return g.bank === 'SPC';
      return true;
    }).map((g) => g.id);
  }

  /**
   * Comprueba si TODAS las opciones de modificadores están en modo 🤖 AUTO
   */
  areAllAutoModsActive() {
    const st = this.state;
    const am = st.autoMods;
    if (!am) return false;
    return Boolean(
      st.autopilot.enabled &&
      st.autoRotatePalette &&
      am.shape &&
      am.style &&
      am.weight &&
      am.sweep &&
      am.effect3d &&
      am.postFx &&
      am.logoFx &&
      am.textFx &&
      am.mediaFx
    );
  }

  /**
   * Activa o desactiva "🤖 PONER TODO EN AUTO" con un solo clic
   */
  setAllAutoMods(enable) {
    const st = this.state;
    const on = Boolean(enable);
    if (!st.autoMods) st.autoMods = {};
    const am = st.autoMods;
    if (on) {
      st.autopilot.enabled = true;
      st.autopilot.lfoMasterEnabled = true;
    }
    st.autoRotatePalette = on;
    am.shape = on;
    am.style = on;
    am.weight = on;
    am.sweep = on;
    am.effect3d = on;
    am.postFx = on;
    am.logoFx = on;
    am.textFx = on;
    am.mediaFx = on;
  }

  /**
   * Avanza al siguiente valor cada opción que tenga su botón "🤖 AUTO" activado.
   * Por defecto se ejecuta automáticamente cada vez que el Piloto Automático completa
   * una vuelta entera de todos los loops de la familia activa, haciendo que cada vuelta
   * sea totalmente única durante horas.
   */
  stepAutoModifiers(forceManual = false) {
    const st = this.state;
    const am = st.autoMods || {};

    // 1. Figura Geométrica (0..5)
    if (am.shape) {
      st.shapeMode = (st.shapeMode + 1) % SHAPE_MODES.length;
    }

    // 2. Acabado Visual (0..3)
    if (am.style) {
      st.styleMode = (st.styleMode + 1) % STYLE_MODES.length;
      if (st.styleMode === 1 && !am.postFx) {
        st.fx.kaleidoscope.enabled = false;
        st.fx.rgbShift.enabled = false;
        st.fx.feedback.enabled = false;
        st.fx.glitch.enabled = false;
        st.fx.pixelate.enabled = false;
      }
    }

    // 3. Grosor Dinámico de Línea (0..3)
    if (am.weight) {
      st.weightMode = (st.weightMode + 1) % WEIGHT_MODES.length;
    }

    // 4. Barrido de Escenario (0..5)
    if (am.sweep) {
      st.sweepMode = (st.sweepMode + 1) % SWEEP_MODES.length;
    }

    // 5. Efecto 3D en Vivo (0..3)
    if (am.effect3d) {
      if (!st.fx.effect3d) st.fx.effect3d = { mode: 0, amount: 0.55 };
      st.fx.effect3d.mode = (st.fx.effect3d.mode + 1) % EFFECT_3D_MODES.length;
      if (st.fx.effect3d.mode > 0) {
        st.fx.effect3d.amount = Math.round((0.40 + Math.random() * 0.35) * 100) / 100;
      }
    }

    // 6. Efectos Opcionales Post-FX (ciclo limpio de 7 combinaciones)
    if (am.postFx) {
      am.postFxStep = ((am.postFxStep || 0) + 1) % 7;
      const step = am.postFxStep;
      st.fx.kaleidoscope.enabled = false;
      st.fx.rgbShift.enabled = false;
      st.fx.feedback.enabled = false;
      st.fx.glitch.enabled = false;
      st.fx.pixelate.enabled = false;

      if (step === 0) {
        // 100% Limpio sin efectos
        st.pureFlatBypassFx = true;
      } else {
        st.pureFlatBypassFx = false;
        if (step === 1) {
          st.fx.kaleidoscope.enabled = true;
          st.fx.kaleidoscope.axes = 2;
          st.fx.kaleidoscope.wet = 0.55;
        } else if (step === 2) {
          st.fx.feedback.enabled = true;
          st.fx.feedback.wet = 0.28;
        } else if (step === 3) {
          st.fx.kaleidoscope.enabled = true;
          st.fx.kaleidoscope.axes = 4;
          st.fx.kaleidoscope.wet = 0.65;
        } else if (step === 4) {
          st.fx.rgbShift.enabled = true;
          st.fx.rgbShift.wet = 0.18;
        } else if (step === 5) {
          st.fx.kaleidoscope.enabled = true;
          st.fx.kaleidoscope.axes = 2;
          st.fx.kaleidoscope.wet = 0.45;
          st.fx.feedback.enabled = true;
          st.fx.feedback.wet = 0.24;
        } else if (step === 6) {
          st.fx.pixelate.enabled = true;
          st.fx.pixelate.wet = 0.24;
        }
      }
    }

    // 7. Efecto Dinámico del Logo DJ (0..4)
    if (am.logoFx && st.fx.logo) {
      st.fx.logo.fxMode = (st.fx.logo.fxMode + 1) % LOGO_FX_MODES.length;
    }

    // 8. Efecto del Texto (0..6)
    if (am.textFx && st.text) {
      st.text.fxMode = (st.text.fxMode + 1) % TEXT_FX_MODES.length;
    }

    // 9. Efecto de Vídeo / Cámara (0..6)
    if (am.mediaFx && st.media) {
      st.media.fx = (st.media.fx + 1) % MEDIA_FX_MODES.length;
    }

    // 10. Paleta de Color (si se pulsa manualmente "Girar opciones Auto ahora" o al completar vuelta)
    if (forceManual && st.autoRotatePalette) {
      st.paletteActive = st.paletteTarget;
      st.paletteTarget = (st.paletteActive + 1) % PALETTES.length;
      st.paletteMix = 0.0;
      this._lastPaletteChangeSec = st.renderTime || 0;
    }
  }

  /**
   * Triggers a smooth A/B GPU Crossfade to the specified generator (or chooses an intelligent next generator)
   */
  triggerNextScene(forcedGeneratorId = null) {
    const st = this.state;
    const modeCfg = AUTOPILOT_MODES[st.autopilot.mode] || AUTOPILOT_MODES.CLUB_DYNAMIC;
    if (!st.autoMods) {
      st.autoMods = {
        changeEvery: 'LAP',
        lapsCompleted: 0,
        loopsInCurrentLap: 1,
        lapTotalLoops: 8,
        visitedInLap: [],
        postFxStep: 0
      };
    }
    const am = st.autoMods;

    // Determine currently dominant deck (0 = Deck A, 1 = Deck B)
    const onDeckB = st.crossfade >= 0.5;
    const currentGen = onDeckB ? st.deckB : st.deckA;

    const allowedGens = this._getAllowedGenerators();
    am.lapTotalLoops = Math.max(1, allowedGens.length);
    if (!Array.isArray(am.visitedInLap)) am.visitedInLap = [];
    // Limpiar de visitedInLap los loops que no pertenezcan al banco activo actual
    am.visitedInLap = am.visitedInLap.filter((id) => allowedGens.includes(id));

    let nextGen = forcedGeneratorId;
    let lapCompletedNow = false;

    if (nextGen === null || nextGen === undefined) {
      // Buscar loops de la familia activa que aún NO hayan salido en esta vuelta
      const unvisited = allowedGens.filter(
        (id) => id !== currentGen && !am.visitedInLap.includes(id)
      );

      if (unvisited.length > 0) {
        const recentFiltered = unvisited.filter((id) => !st.autopilot.historyQueue.includes(id));
        const pool = recentFiltered.length > 0 ? recentFiltered : unvisited;
        nextGen = pool[Math.floor(Math.random() * pool.length)];
      } else {
        // ¡Se ha completado una vuelta entera de todos los loops de la familia activa!
        lapCompletedNow = true;
        am.lapsCompleted = (am.lapsCompleted || 0) + 1;
        am.visitedInLap = [];
        const freshPool = allowedGens.filter((id) => id !== currentGen);
        nextGen = freshPool.length > 0
          ? freshPool[Math.floor(Math.random() * freshPool.length)]
          : allowedGens[0];
      }
    }

    if (allowedGens.includes(nextGen) && !am.visitedInLap.includes(nextGen)) {
      am.visitedInLap.push(nextGen);
    }
    am.loopsInCurrentLap = Math.max(1, am.visitedInLap.length);

    // Si acabamos de completar la vuelta entera de loops (o si está configurado en cada cambio de loop),
    // rotamos todas las opciones que tengan su botón 🤖 AUTO activado:
    if (am.changeEvery === 'SCENE' || lapCompletedNow) {
      this.stepAutoModifiers(false);
    }

    // Track in anti-repetition history queue (keep last 4 scenes)
    st.autopilot.historyQueue.push(nextGen);
    if (st.autopilot.historyQueue.length > 5) {
      st.autopilot.historyQueue.shift();
    }

    // Assign new generator to the opposite deck and initiate crossfade
    if (onDeckB) {
      st.deckA = nextGen;
      st.crossfadeStartVal = st.crossfade;
      st.crossfadeTargetVal = 0.0;
    } else {
      st.deckB = nextGen;
      st.crossfadeStartVal = st.crossfade;
      st.crossfadeTargetVal = 1.0;
    }

    st.crossfadeElapsed = 0.0;
    st.crossfadeDuration = modeCfg.crossfadeDurationSec;
    st.autoCrossfading = true;

    // Rotate Palette if autoRotatePalette is active
    // Si changeEvery === 'LAP', puede rotar en cada vuelta o suavemente cada >=25s
    if (st.autoRotatePalette) {
      const calm = st.calmColor !== false;
      const nowSec = st.renderTime || 0;
      const sinceLastPal = nowSec - (this._lastPaletteChangeSec || -999);
      const stillBlending = st.paletteActive !== st.paletteTarget && st.paletteMix < 0.95;
      if (lapCompletedNow || !calm || (!stillBlending && sinceLastPal >= 25.0)) {
        st.paletteActive = st.paletteTarget;
        let nextPal = calm
          ? (st.paletteActive + 1) % PALETTES.length
          : (st.paletteActive + 1 + Math.floor(Math.random() * 3)) % PALETTES.length;
        if (nextPal === st.paletteActive) nextPal = (nextPal + 1) % PALETTES.length;
        st.paletteTarget = nextPal;
        st.paletteMix = 0.0;
        this._lastPaletteChangeSec = nowSec;
      }
    }

    // Reset scene timers
    st.autopilot.barsElapsedInScene = 0;
    st.autopilot.secondsElapsedInScene = 0;
    st.autopilot.sceneProgress = 0.0;
    st.autopilot.scenesPlayed += 1;

    // Evolve macro base targets & FX rack coherently if Autopilot is enabled
    if (st.autopilot.enabled) {
      this._mutateSceneParameters(modeCfg, nextGen);
    }
  }

  /**
   * Mutates Macro base targets & Post-FX Rack according to the active 8-hour Evolution Mode
   * En modos suaves/evento mantiene la pantalla 100% nivelada (rotation = 0), pocas figuras grandes y cero parpadeo.
   */
  _mutateSceneParameters(modeCfg, nextGen) {
    const st = this.state;
    const isCalm = st.autopilot.mode === 'HYPNOTIC_SLOW' || st.autopilot.mode === 'CLUB_DYNAMIC';

    if (isCalm) {
      this.macroBaseTargets.speed = 0.16 + Math.random() * 0.16;
      this.macroBaseTargets.scale = 0.14 + Math.random() * 0.26;      // Pocas figuras grandes
      this.macroBaseTargets.complexity = 0.15 + Math.random() * 0.28; // Capas limpias
      this.macroBaseTargets.thickness = 0.30 + Math.random() * 0.36;
      this.macroBaseTargets.rotation = 0.00;                          // Siempre recto (0°) para no marear
      this.macroBaseTargets.chaos = 0.04 + Math.random() * 0.12;
      this.macroBaseTargets.strobe = 0.00;                            // Cero parpadeo
      this.macroBaseTargets.colorShift = 0.06 + Math.random() * 0.12; // Deriva de color muy lenta
    } else {
      this.macroBaseTargets.speed = 0.25 + Math.random() * 0.38;
      this.macroBaseTargets.scale = 0.22 + Math.random() * 0.45;
      this.macroBaseTargets.complexity = 0.20 + Math.random() * 0.50;
      this.macroBaseTargets.thickness = 0.32 + Math.random() * 0.42;
      this.macroBaseTargets.rotation = st.autopilot.mode === 'FULL_RANDOM_CHAOS' ? (Math.random() * 0.5) : 0.0;
      this.macroBaseTargets.chaos = Math.min(modeCfg.chaosCeiling, 0.10 + Math.random() * 0.40);
      this.macroBaseTargets.strobe = Math.min(modeCfg.strobeCeiling, Math.random() * modeCfg.strobeCeiling * 0.5);
      this.macroBaseTargets.colorShift = st.calmColor !== false ? (0.08 + Math.random() * 0.16) : (0.20 + Math.random() * 0.45);
    }

    // Si los Efectos Opcionales tienen activado su propio modo 🤖 AUTO por vuelta, respetamos su ciclo
    if (st.autoMods && st.autoMods.postFx) {
      return;
    }

    // Si el bloqueo sin efectos está activo o estamos en el banco PLANO (16..23), mantener todos los FX apagados
    const isFlatGen = (nextGen >= 16 && nextGen <= 23) || st.pureFlatBypassFx || st.styleMode === 1 || isCalm;
    if (isFlatGen) {
      st.fx.kaleidoscope.enabled = false;
      st.fx.rgbShift.enabled = false;
      st.fx.feedback.enabled = false;
      st.fx.glitch.enabled = false;
      st.fx.pixelate.enabled = false;
      return;
    }

    const p = modeCfg.fxProbability;
    st.fx.kaleidoscope.enabled = false;
    st.fx.rgbShift.enabled = Math.random() < p * 0.5;
    st.fx.rgbShift.wet = 0.12 + Math.random() * 0.22;
    st.fx.feedback.enabled = Math.random() < p * 0.6;
    st.fx.feedback.wet = 0.18 + Math.random() * 0.25;
    st.fx.glitch.enabled = Math.random() < p * 0.35;
    st.fx.glitch.wet = 0.15 + Math.random() * 0.25;
    st.fx.pixelate.enabled = false;
  }

  /**
   * Botón "🆘 PÁNICO": vuelve al instante a un look seguro y limpio pase lo que pase.
   * Quita apagón, destello, estrobo, invertido, B/N, 3D y efectos, y aplica el preset de calma.
   * No toca el mapping ni el logo (la pantalla sigue calibrada y el logo del DJ sigue donde estaba).
   */
  applyPanic() {
    const st = this.state;
    this.morph = null;
    this.pendingMorph = null;
    st.fx.blackout = false;
    st.fx.flashMomentary = false;
    st.fx.strobeBurst = false;
    st.fx.invertKill = false;
    st.fx.bwMonochrome = false;
    st.fx.safeStrobe = true;
    st.shapeMode = 0;
    st.autopilot.enabled = true;
    st.autopilot.lfoMasterEnabled = true;
    this.applyCalmStagePreset();
    if (st.fx.mapping) st.fx.mapping.showTestGrid = false;
    this.triggerNextScene(18);
  }

  /**
   * Botón "🌿 MODO CALMA (EVENTO ELEGANTE)":
   * Calma inmediatamente la pantalla: quita giros, quita parpadeos, deja pocas figuras grandes sobre negro
   * y desactiva todos los efectos de distorsión.
   */
  applyCalmStagePreset() {
    const st = this.state;
    st.autopilot.mode = 'HYPNOTIC_SLOW';
    st.autopilot.triggerBars = 32;
    st.styleMode = 1; // 100% Plano (Sin Brillo)
    st.weightMode = 1; // Respira suave Fino <-> Grueso
    st.sweepMode = 0;  // Sin barrido extra
    st.pureFlatBypassFx = true;

    // Apagar todos los efectos post-procesado
    if (st.fx.effect3d) st.fx.effect3d.mode = 0;
    st.fx.kaleidoscope.enabled = false;
    st.fx.rgbShift.enabled = false;
    st.fx.feedback.enabled = false;
    st.fx.glitch.enabled = false;
    st.fx.pixelate.enabled = false;
    st.fx.flashMomentary = false;
    st.fx.invertKill = false;
    st.fx.bwMonochrome = false;
    st.fx.strobeBurst = false;

    const calmValues = {
      speed: { val: 0.20, lfo: 'OFF' },
      scale: { val: 0.20, lfo: 'OFF' },
      complexity: { val: 0.20, lfo: 'OFF' },
      thickness: { val: 0.36, lfo: 'SINE' },
      rotation: { val: 0.00, lfo: 'OFF' },
      chaos: { val: 0.05, lfo: 'OFF' },
      strobe: { val: 0.00, lfo: 'OFF' },
      colorShift: { val: 0.10, lfo: 'OFF' }
    };
    st.calmColor = true;

    for (const def of MACRO_DEFS) {
      const cfg = calmValues[def.key];
      if (cfg) {
        st.macros[def.key].base = cfg.val;
        st.macros[def.key].modulated = cfg.val;
        st.macros[def.key].lfoWave = cfg.lfo;
        st.macros[def.key].audioBand = def.key === 'thickness' ? 'bass' : 'none';
        this.macroBaseTargets[def.key] = cfg.val;
      }
    }
  }

  /**
   * Randomizes macro parameters immediately (for user "MUTATE / RANDOMIZE" action)
   */
  randomizeMacrosNow() {
    const modeCfg = AUTOPILOT_MODES[this.state.autopilot.mode] || AUTOPILOT_MODES.CLUB_DYNAMIC;
    const activeGen = this.state.crossfade >= 0.5 ? this.state.deckB : this.state.deckA;
    this._mutateSceneParameters(modeCfg, activeGen);
    for (const def of MACRO_DEFS) {
      const k = def.key;
      this.state.macros[k].base = Math.min(1.0, Math.max(0.0, this.macroBaseTargets[k]));
    }
  }

  /**
   * Main per-frame update for BPM clock, LFOs, Crossfade transitions, and 8-Hour Autopilot
   */
  update(dt) {
    const st = this.state;
    const modeCfg = AUTOPILOT_MODES[st.autopilot.mode] || AUTOPILOT_MODES.CLUB_DYNAMIC;

    // 1. Update Master BPM Clock & Phase
    const effectiveBpm = st.bpm.value * st.bpm.multiplier;
    const beatsPerSec = effectiveBpm / 60.0;
    const beatDelta = dt * beatsPerSec;

    const prevBeatFloor = Math.floor(st.bpm.totalBeats);
    st.bpm.totalBeats += beatDelta;
    const newBeatFloor = Math.floor(st.bpm.totalBeats);

    st.bpm.beatPhase = st.bpm.totalBeats % 1.0;
    st.bpm.barPhase = (st.bpm.totalBeats / 4.0) % 1.0;
    st.bpm.currentBeatInBar = (newBeatFloor % 4) + 1;
    st.bpm.currentBar = Math.floor(newBeatFloor / 4) + 1;

    // Trigger beat sync pulse on every beat boundary
    if (newBeatFloor > prevBeatFloor) {
      st.bpm.syncPulse = 1.0;

      // Una transición de Look programada arranca justo en el beat
      if (this.pendingMorph) {
        const pm = this.pendingMorph;
        this.pendingMorph = null;
        this._beginLookMorph(pm.preset, pm.bars);
      }

      // Track bar progression for Bar-synced Auto-Scene Morphing & Per-Macro Bar-Step Jumps
      if (st.bpm.currentBar > st.autopilot.lastBarNumber) {
        st.autopilot.lastBarNumber = st.bpm.currentBar;
        st.autopilot.barsElapsedInScene += 1;

        // Salto de golpe cada X compases (1, 4, 8 o 16 compases) en cualquiera de los 8 Faders Maestros
        const barZeroIdx = Math.max(0, st.bpm.currentBar - 1);
        for (const def of MACRO_DEFS) {
          const m = st.macros[def.key];
          const everyBars = Number(m.barStepBars) || 0;
          if (everyBars > 0 && barZeroIdx % everyBars === 0) {
            const seq = BAR_STEP_SEQUENCES[def.key] || [0.2, 0.6, 0.35, 0.75];
            m.barStepIndex = ((m.barStepIndex || 0) + 1) % seq.length;
            const nextVal = seq[m.barStepIndex];
            m.base = nextVal;
            m.modulated = nextVal;
            this.macroBaseTargets[def.key] = nextVal;
          }
        }
      }
    } else {
      st.bpm.syncPulse *= Math.pow(0.04, dt);
    }

    // 2. Advance Continuous Phase Integral based on Speed Macro
    const speedVal = st.macros.speed.modulated;
    const speedFactor = 0.12 + speedVal * speedVal * 2.8;
    st.accumulatedPhase += dt * speedFactor;

    // Slowly drift entropy seed over 8 hours so procedural coordinates never repeat
    st.entropySeed = (st.entropySeed + dt * 0.0037) % 10000.0;

    // 3. Smoothly glide Macro Base values toward Autopilot targets when Autopilot is active
    this._updateLookMorph(dt);
    if (st.autopilot.enabled && !this.morph) {
      const glideRate = Math.min(1.0, dt * 0.45 * modeCfg.lfoSpeedMult);
      for (const def of MACRO_DEFS) {
        const k = def.key;
        const m = st.macros[k];
        // Si este fader está en modo Salto por Compases (1, 4, 8, 16), mantener el salto de golpe limpio
        if ((Number(m.barStepBars) || 0) > 0) continue;
        const target = this.macroBaseTargets[k];
        if (target !== undefined) {
          m.base += (target - m.base) * glideRate;
        }
      }
    }

    // 4. Evaluate 8 Multi-Wave LFOs + Audio FFT Routing -> Macro Modulated Values
    for (const def of MACRO_DEFS) {
      const m = st.macros[def.key];
      let lfoDelta = 0.0;

      if (st.autopilot.lfoMasterEnabled && m.lfoWave !== 'OFF') {
        const waveVal = this._evaluateLfoWave(
          m.lfoWave,
          st.renderTime,
          m.lfoRate,
          m.lfoPhaseOffset,
          st.bpm,
          modeCfg.lfoSpeedMult
        );
        lfoDelta = waveVal * m.lfoDepth * 0.45 * modeCfg.lfoDepthMult;
      }

      let audioDelta = 0.0;
      if (st.audio.enabled && m.audioBand !== 'none') {
        const bandLevel = st.audio[m.audioBand] || 0.0;
        audioDelta = bandLevel * m.audioAmount * 0.55;
      }

      m.modulated = Math.min(1.0, Math.max(0.0, m.base + lfoDelta + audioDelta));
    }

    // 5. Update Active A/B Crossfade & Palette Interpolation
    if (st.autoCrossfading) {
      st.crossfadeElapsed += dt;
      const t = Math.min(1.0, st.crossfadeElapsed / Math.max(0.1, st.crossfadeDuration));
      st.crossfade = st.crossfadeStartVal + (st.crossfadeTargetVal - st.crossfadeStartVal) * t;

      if (t >= 1.0) {
        st.crossfade = st.crossfadeTargetVal;
        st.autoCrossfading = false;
      }
    }

    // 5.5 Color suave (anti-feria): la paleta funde como mínimo en 16 s y el tono deriva muy despacio
    const calm = st.calmColor !== false;
    if (st.paletteActive !== st.paletteTarget) {
      const minPalSec = calm ? 16.0 : 1.5;
      const palDur = Math.max(minPalSec, st.autoCrossfading ? st.crossfadeDuration : 2.0);
      st.paletteMix = Math.min(1.0, st.paletteMix + dt / palDur);
      if (st.paletteMix >= 1.0) {
        st.paletteActive = st.paletteTarget;
        st.paletteMix = 0.0;
      }
    }
    const cs = st.macros.colorShift.modulated;
    // Vueltas de color por segundo: en modo suave, una vuelta completa tarda entre ~65 s (fader al 100%) y ~14 min (fader al 0%)
    const driftRate = calm ? (0.0012 + cs * 0.014) : (0.03 + cs * 0.18);
    st.colorPhase = ((st.colorPhase || 0) + dt * driftRate) % 10000.0;
    // El fader 8 (y su LFO/audio) desplaza el tono con límite de velocidad para que nunca dé saltos
    const offTarget = cs * (calm ? 0.35 : 1.6);
    const maxStep = (calm ? 0.008 : 0.45) * dt;
    const off = st.colorOffset || 0;
    st.colorOffset = off + Math.max(-maxStep, Math.min(maxStep, offTarget - off));

    // 6. Auto-Scene Morphing Timer (Bars or Seconds)
    if (st.autopilot.enabled && st.autopilot.autoSceneEnabled && !st.autoCrossfading) {
      st.autopilot.secondsElapsedInScene += dt;

      if (st.autopilot.triggerUnit === 'BARS') {
        const totalBarsTarget = Math.max(1, st.autopilot.triggerBars);
        const exactBars = st.autopilot.barsElapsedInScene + st.bpm.barPhase;
        st.autopilot.sceneProgress = Math.min(1.0, exactBars / totalBarsTarget);

        if (st.autopilot.barsElapsedInScene >= totalBarsTarget) {
          this.triggerNextScene();
        }
      } else {
        const targetSec = Math.max(4, st.autopilot.triggerSeconds);
        st.autopilot.sceneProgress = Math.min(1.0, st.autopilot.secondsElapsedInScene / targetSec);

        if (st.autopilot.secondsElapsedInScene >= targetSec) {
          this.triggerNextScene();
        }
      }
    }
  }
}


// ==================== MODULE: js/engine/presetManager.js ====================
/**
 * AETHER-VJ: Preset Manager ("Looks" completos guardables)
 * Guarda y recupera en un solo toque: visual activo, paleta, los 8 faders con sus LFOs,
 * forma/acabado/grosor/barrido, efecto 3D, rack de efectos y comportamiento del piloto automático.
 * No guarda la imagen del logo ni el mapping (eso depende del DJ y del local, no del "look").
 */


const FX_KEYS = ['kaleidoscope', 'rgbShift', 'feedback', 'glitch', 'pixelate'];
function capturePreset(st) {
  const dominantGen = st.crossfade >= 0.5 ? st.deckB : st.deckA;
  const gen = GENERATORS[dominantGen] || GENERATORS[0];
  const pal = PALETTES[st.paletteTarget] || PALETTES[0];

  const macros = {};
  for (const def of MACRO_DEFS) {
    const m = st.macros[def.key];
    macros[def.key] = {
      base: m.base,
      lfoWave: m.lfoWave,
      lfoDepth: m.lfoDepth,
      lfoRate: m.lfoRate,
      audioBand: m.audioBand,
      audioAmount: m.audioAmount,
      barStepBars: m.barStepBars || 0
    };
  }

  const fx = {};
  for (const k of FX_KEYS) {
    fx[k] = { ...st.fx[k] };
  }

  return {
    name: `${gen.shortName} · ${pal.name}`,
    savedAt: Date.now(),
    gen: dominantGen,
    palette: st.paletteTarget,
    autoRotatePalette: st.autoRotatePalette,
    shapeMode: st.shapeMode,
    styleMode: st.styleMode,
    weightMode: st.weightMode,
    sweepMode: st.sweepMode,
    pureFlatBypassFx: st.pureFlatBypassFx,
    effect3d: { ...(st.fx.effect3d || { mode: 0, amount: 0.55 }) },
    macros,
    fx,
    autopilot: {
      enabled: st.autopilot.enabled,
      mode: st.autopilot.mode,
      pool: st.autopilotBankPool,
      triggerUnit: st.autopilot.triggerUnit,
      triggerBars: st.autopilot.triggerBars,
      triggerSeconds: st.autopilot.triggerSeconds
    }
  };
}
function applyPreset(st, autopilot, p) {
  if (!p) return;

  // Transición sincronizada al BPM: el Autopilot funde todo durante N compases empezando en el próximo beat
  const bars = st.transition ? Number(st.transition.bars) || 0 : 0;
  if (autopilot && bars > 0 && typeof autopilot.queueLookMorph === 'function') {
    autopilot.queueLookMorph(p, bars);
    return;
  }
  applyPresetImmediate(st, autopilot, p, true);
}

/**
 * Aplica el Look al instante (modo "Corte"). Si `cut` es true el cambio de visual es casi inmediato.
 */
function applyPresetImmediate(st, autopilot, p, cut = false) {
  if (!p) return;

  // 1. Autopilot behaviour first, so the scene change below respects it
  if (p.autopilot) {
    st.autopilot.enabled = Boolean(p.autopilot.enabled);
    if (p.autopilot.mode) st.autopilot.mode = p.autopilot.mode;
    if (p.autopilot.pool) st.autopilotBankPool = p.autopilot.pool;
    if (p.autopilot.triggerUnit) st.autopilot.triggerUnit = p.autopilot.triggerUnit;
    if (p.autopilot.triggerBars) st.autopilot.triggerBars = p.autopilot.triggerBars;
    if (p.autopilot.triggerSeconds) st.autopilot.triggerSeconds = p.autopilot.triggerSeconds;
  }

  // 2. Smooth crossfade to the stored generator (this may randomize targets; we override them right after)
  if (autopilot && typeof p.gen === 'number' && GENERATORS[p.gen]) {
    autopilot.triggerNextScene(p.gen);
    if (cut) st.crossfadeDuration = 0.25;
  }

  // 3. Palette (overrides any auto-rotation done by the scene change)
  if (typeof p.palette === 'number' && PALETTES[p.palette]) {
    st.paletteActive = st.paletteTarget;
    st.paletteTarget = p.palette;
    st.paletteMix = 0.0;
  }
  if (typeof p.autoRotatePalette === 'boolean') st.autoRotatePalette = p.autoRotatePalette;

  // 4. Shape / Style / Weight / Sweep
  if (typeof p.shapeMode === 'number') st.shapeMode = p.shapeMode;
  if (typeof p.styleMode === 'number') st.styleMode = p.styleMode;
  if (typeof p.weightMode === 'number') st.weightMode = p.weightMode;
  if (typeof p.sweepMode === 'number') st.sweepMode = p.sweepMode;
  if (typeof p.pureFlatBypassFx === 'boolean') st.pureFlatBypassFx = p.pureFlatBypassFx;

  // 5. 3D effect
  if (p.effect3d) {
    st.fx.effect3d = { mode: p.effect3d.mode || 0, amount: p.effect3d.amount ?? 0.55 };
  }

  // 6. FX rack
  if (p.fx) {
    for (const k of FX_KEYS) {
      if (p.fx[k]) st.fx[k] = { ...st.fx[k], ...p.fx[k] };
    }
  }

  // 7. Macros + LFOs (glide smoothly via autopilot targets)
  if (p.macros) {
    for (const def of MACRO_DEFS) {
      const src = p.macros[def.key];
      if (!src) continue;
      const m = st.macros[def.key];
      if (typeof src.base === 'number') {
        if (autopilot && autopilot.macroBaseTargets) {
          autopilot.macroBaseTargets[def.key] = src.base;
        }
        if (!st.autopilot.enabled) m.base = src.base;
      }
      if (src.lfoWave) m.lfoWave = src.lfoWave;
      if (typeof src.lfoDepth === 'number') m.lfoDepth = src.lfoDepth;
      if (typeof src.lfoRate === 'number') m.lfoRate = src.lfoRate;
      if (src.audioBand) m.audioBand = src.audioBand;
      if (typeof src.audioAmount === 'number') m.audioAmount = src.audioAmount;
      if (typeof src.barStepBars === 'number') m.barStepBars = src.barStepBars;
    }
  }
}


// ==================== MODULE: js/engine/persistence.js ====================
/**
 * AETHER-VJ: Persistencia de configuración
 * Guarda automáticamente Mapping, Slices, Brillo, Límite de Estrobo, Presets y Memorias de Logos
 * para que la caja (Mini-PC / Raspberry Pi) arranque exactamente igual tras un corte de luz.
 *
 *  - Con servidor (http://localhost:8080): se guarda en el disco en aether-config.json (sin límite práctico de tamaño).
 *  - Sin servidor (doble clic en index.html): se guarda en localStorage del navegador (los logos pueden no caber).
 */

const LS_CONFIG_KEY = 'aether_vj_config_v1';
const LS_LOGOS_KEY = 'aether_vj_logos_v1';
const SAVE_INTERVAL_SEC = 1.5;
class Persistence {
  constructor(state, syncBridge) {
    this.state = state;
    this.syncBridge = syncBridge;
    this.loaded = false;
    this.useServer = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
    this.lastSmallJson = '';
    this.lastLogoVersion = -1;
    this.saveAccum = 0;
    this.saving = false;
    this.lastSaveOk = true;
  }

  _buildSmallSnapshot() {
    const st = this.state;
    const logo = st.fx.logo;
    const macroBarSteps = {};
    const macroAudioBands = {};
    if (st.macros) {
      for (const k of Object.keys(st.macros)) {
        macroBarSteps[k] = Number(st.macros[k].barStepBars) || 0;
        macroAudioBands[k] = st.macros[k].audioBand || 'none';
      }
    }
    return {
      version: 1,
      mapping: st.fx.mapping,
      output: st.fx.output,
      safeStrobe: st.fx.safeStrobe !== false,
      calmColor: st.calmColor !== false,
      autoRotatePalette: Boolean(st.autoRotatePalette),
      autopilotBankPool: st.autopilotBankPool,
      macroBarSteps,
      macroAudioBands,
      autoMods: st.autoMods ? {
        changeEvery: st.autoMods.changeEvery || 'LAP',
        shape: Boolean(st.autoMods.shape),
        style: Boolean(st.autoMods.style),
        weight: Boolean(st.autoMods.weight),
        sweep: Boolean(st.autoMods.sweep),
        effect3d: Boolean(st.autoMods.effect3d),
        postFx: Boolean(st.autoMods.postFx),
        logoFx: Boolean(st.autoMods.logoFx),
        textFx: Boolean(st.autoMods.textFx),
        mediaFx: Boolean(st.autoMods.mediaFx)
      } : null,
      presets: st.presets,
      autoQuality: st.autoQuality,
      logoSettings: {
        enabled: logo.enabled,
        fxMode: logo.fxMode,
        pos: logo.pos,
        scale: logo.scale,
        opacity: logo.opacity,
        backdrop: logo.backdrop,
        tint: logo.tint,
        activeSlot: logo.activeSlot,
        aspect: logo.aspect
      },
      edgeBlend: st.fx.edgeBlend,
      transition: st.transition,
      text: st.text ? {
        enabled: st.text.enabled,
        content: st.text.content,
        font: st.text.font,
        fxMode: st.text.fxMode,
        pos: st.text.pos,
        scale: st.text.scale,
        opacity: st.text.opacity,
        colorMode: st.text.colorMode,
        backdrop: st.text.backdrop,
        scrollSpeed: st.text.scrollSpeed
      } : null,
      // Los vídeos locales (blob:) no sobreviven a un reinicio: solo se guardan los del servidor y la cámara
      media: st.media ? {
        enabled: st.media.enabled && st.media.source !== 'none' && !String(st.media.url || '').startsWith('blob:'),
        source: String(st.media.url || '').startsWith('blob:') ? 'none' : st.media.source,
        url: String(st.media.url || '').startsWith('blob:') ? '' : st.media.url,
        kind: st.media.kind,
        name: st.media.name,
        opacity: st.media.opacity,
        blend: st.media.blend,
        fx: st.media.fx,
        fit: st.media.fit,
        mirror: st.media.mirror,
        beatZoom: st.media.beatZoom,
        speed: st.media.speed,
        cameraId: st.media.cameraId
      } : null
    };
  }

  _buildLogoSnapshot() {
    return {
      logoDataUrl: this.state.logoDataUrl || '',
      logoSlots: this.state.logoSlots
    };
  }

  _applyConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    const st = this.state;

    if (cfg.mapping && typeof cfg.mapping === 'object') {
      st.fx.mapping = Object.assign(st.fx.mapping || {}, cfg.mapping);
      // Never boot with the calibration grid covering the show
      st.fx.mapping.showTestGrid = false;
    }
    if (cfg.output && typeof cfg.output === 'object') {
      st.fx.output = Object.assign(st.fx.output || {}, cfg.output);
    }
    if (cfg.edgeBlend && typeof cfg.edgeBlend === 'object') {
      st.fx.edgeBlend = Object.assign(st.fx.edgeBlend || {}, cfg.edgeBlend);
    }
    if (cfg.transition && typeof cfg.transition.bars === 'number') {
      st.transition.bars = cfg.transition.bars;
    }
    if (cfg.text && typeof cfg.text === 'object' && st.text) {
      Object.assign(st.text, cfg.text);
      st.text.version = (st.text.version || 0) + 1;
    }
    if (cfg.media && typeof cfg.media === 'object' && st.media) {
      const m = cfg.media;
      const okUrl = typeof m.url === 'string' && (m.url === '' || /^\/media\/[^/\\]+$/.test(m.url));
      Object.assign(st.media, m, { url: okUrl ? m.url : '' });
      if (st.media.source === 'file' && !st.media.url) st.media.source = 'none';
      if (st.media.source === 'none') st.media.enabled = false;
      st.media.version = (st.media.version || 0) + 1;
    }
    if (typeof cfg.safeStrobe === 'boolean') {
      st.fx.safeStrobe = cfg.safeStrobe;
    }
    if (typeof cfg.calmColor === 'boolean') {
      st.calmColor = cfg.calmColor;
    }
    if (typeof cfg.autoRotatePalette === 'boolean') {
      st.autoRotatePalette = cfg.autoRotatePalette;
    }
    if (typeof cfg.autopilotBankPool === 'string' && cfg.autopilotBankPool) {
      st.autopilotBankPool = cfg.autopilotBankPool;
    }
    if (cfg.macroBarSteps && typeof cfg.macroBarSteps === 'object' && st.macros) {
      for (const k of Object.keys(cfg.macroBarSteps)) {
        if (st.macros[k]) {
          const bars = Number(cfg.macroBarSteps[k]) || 0;
          st.macros[k].barStepBars = [0, 1, 4, 8, 16].includes(bars) ? bars : 0;
        }
      }
    }
    if (cfg.macroAudioBands && typeof cfg.macroAudioBands === 'object' && st.macros) {
      for (const k of Object.keys(cfg.macroAudioBands)) {
        if (st.macros[k] && ['none', 'bass', 'mid', 'high'].includes(cfg.macroAudioBands[k])) {
          st.macros[k].audioBand = cfg.macroAudioBands[k];
        }
      }
    }
    if (cfg.autoMods && typeof cfg.autoMods === 'object') {
      if (!st.autoMods) st.autoMods = {};
      if (cfg.autoMods.changeEvery === 'SCENE' || cfg.autoMods.changeEvery === 'LAP') {
        st.autoMods.changeEvery = cfg.autoMods.changeEvery;
      }
      for (const k of ['shape', 'style', 'weight', 'sweep', 'effect3d', 'postFx', 'logoFx', 'textFx', 'mediaFx']) {
        if (typeof cfg.autoMods[k] === 'boolean') {
          st.autoMods[k] = cfg.autoMods[k];
        }
      }
    }
    if (typeof cfg.autoQuality === 'boolean') {
      st.autoQuality = cfg.autoQuality;
    }
    if (Array.isArray(cfg.presets)) {
      for (let i = 0; i < st.presets.length; i++) {
        st.presets[i] = cfg.presets[i] || null;
      }
    }
    if (Array.isArray(cfg.logoSlots)) {
      for (let i = 0; i < st.logoSlots.length; i++) {
        st.logoSlots[i] = typeof cfg.logoSlots[i] === 'string' ? cfg.logoSlots[i] : null;
      }
    }

    const ls = cfg.logoSettings;
    if (ls && typeof ls === 'object') {
      const logo = st.fx.logo;
      for (const k of ['fxMode', 'pos', 'scale', 'opacity', 'backdrop', 'activeSlot', 'aspect']) {
        if (typeof ls[k] === 'number') logo[k] = ls[k];
      }
      if (typeof ls.tint === 'boolean') logo.tint = ls.tint;
    }

    if (typeof cfg.logoDataUrl === 'string' && cfg.logoDataUrl) {
      const wasEnabled = Boolean(ls && ls.enabled);
      this.syncBridge.setLogoDataUrl(cfg.logoDataUrl, null);
      st.fx.logo.enabled = wasEnabled;
    } else if (ls && typeof ls.enabled === 'boolean') {
      st.fx.logo.enabled = ls.enabled;
    }
  }

  async load() {
    let cfg = null;

    if (this.useServer) {
      try {
        const resp = await fetch('/api/config', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ok) cfg = data.config || {};
        }
      } catch (_) {
        cfg = null;
      }
      if (cfg === null) {
        // Page served by another static server without our API: fall back to the browser storage
        this.useServer = false;
      }
    }

    if (!this.useServer) {
      try {
        const small = localStorage.getItem(LS_CONFIG_KEY);
        const logos = localStorage.getItem(LS_LOGOS_KEY);
        cfg = Object.assign({}, small ? JSON.parse(small) : {}, logos ? JSON.parse(logos) : {});
      } catch (_) {
        cfg = {};
      }
    }

    this._applyConfig(cfg);

    this.lastSmallJson = JSON.stringify(this._buildSmallSnapshot());
    this.lastLogoVersion = this.state.fx.logo.version;
    this.loaded = true;
  }

  async _save(smallSnap, includeLogos) {
    this.saving = true;
    try {
      if (this.useServer) {
        const config = includeLogos ? { ...smallSnap, ...this._buildLogoSnapshot() } : smallSnap;
        const resp = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config })
        });
        this.lastSaveOk = resp.ok;
      } else {
        localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(smallSnap));
        if (includeLogos) {
          try {
            localStorage.setItem(LS_LOGOS_KEY, JSON.stringify(this._buildLogoSnapshot()));
          } catch (_) {
            // Logos too big for browser storage: keep at least the mapping/presets saved
            console.warn('[AETHER-VJ] Los logos no caben en el almacenamiento del navegador. Usa el servidor (INICIAR-SERVIDOR-WIFI.bat) para guardarlos.');
          }
        }
        this.lastSaveOk = true;
      }
    } catch (_) {
      this.lastSaveOk = false;
    }
    this.saving = false;
  }

  tick(dt) {
    if (!this.loaded || this.saving) return;
    this.saveAccum += dt;
    if (this.saveAccum < SAVE_INTERVAL_SEC) return;
    this.saveAccum = 0;

    const smallSnap = this._buildSmallSnapshot();
    const smallJson = JSON.stringify(smallSnap);
    const logoVersion = this.state.fx.logo.version;
    const logosChanged = logoVersion !== this.lastLogoVersion;

    if (smallJson === this.lastSmallJson && !logosChanged) return;

    this.lastSmallJson = smallJson;
    this.lastLogoVersion = logoVersion;
    this._save(smallSnap, logosChanged);
  }
}


// ==================== MODULE: js/engine/midiClock.js ====================
/**
 * AETHER-VJ: Sincronización por MIDI Clock (Web MIDI API)
 * Escucha el reloj MIDI que envían las mesas de DJ (Pioneer DJM, Allen & Heath Xone, Rane...),
 * controladoras, Ableton Live o Traktor, y ajusta solo el BPM y la fase del compás.
 *
 * Mensajes usados:
 *   0xF8 Timing Clock (24 pulsos por negra)   → cálculo del BPM
 *   0xFA Start / 0xFB Continue                → alinea el inicio del compás
 *   0xFC Stop                                 → deja de seguir el reloj (el BPM se queda fijo)
 *
 * Nota: Chrome solo permite Web MIDI en contexto seguro, por eso hay que abrir la consola
 * desde http://localhost:8080 (servidor) y no con doble clic en el archivo.
 */

const PPQN = 24;
const TICK_WINDOW = 96;           // 4 negras de historial para un BPM estable
const RECEIVE_TIMEOUT_MS = 1200;  // Sin pulsos durante este tiempo = reloj perdido
class MidiClock {
  constructor(state) {
    this.state = state;
    this.access = null;
    this.tickTimes = new Float64Array(TICK_WINDOW);
    this.tickCount = 0;
    this.tickWriteIdx = 0;
    this.ticksSinceStart = 0;
    this.lastTickTime = 0;
    this.pendingBarAlign = false;
    this.smoothedBpm = 0;
    this._onMessage = this._onMessage.bind(this);

    this.state.midi.supported = typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  }

  async enable() {
    const midi = this.state.midi;
    if (!midi.supported) {
      midi.enabled = false;
      return { ok: false, error: 'Este navegador no soporta MIDI. Usa Chrome o Chromium.' };
    }
    try {
      if (!this.access) {
        this.access = await navigator.requestMIDIAccess({ sysex: false });
        this.access.onstatechange = () => this._bindInputs();
      }
      this._bindInputs();
      midi.enabled = true;
      return { ok: true };
    } catch (err) {
      midi.enabled = false;
      return { ok: false, error: 'Permiso MIDI denegado o no disponible (abre la consola desde http://localhost:8080).' };
    }
  }

  disable() {
    const midi = this.state.midi;
    midi.enabled = false;
    midi.receiving = false;
    midi.clockBpm = 0;
    if (this.access) {
      this.access.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    }
    this._resetTicks();
  }

  _bindInputs() {
    if (!this.access) return;
    const names = [];
    this.access.inputs.forEach((input) => {
      input.onmidimessage = this._onMessage;
      names.push(input.name || 'MIDI');
    });
    if (!this.state.midi.receiving) {
      this.state.midi.deviceName = names.length ? names.join(', ') : '';
    }
  }

  _resetTicks() {
    this.tickCount = 0;
    this.tickWriteIdx = 0;
    this.smoothedBpm = 0;
  }

  _onMessage(event) {
    if (!this.state.midi.enabled) return;
    const data = event.data;
    if (!data || data.length === 0) return;
    const status = data[0];
    const now = event.timeStamp || performance.now();

    if (status === 0xF8) {
      this._handleTick(now, event.target ? event.target.name : '');
    } else if (status === 0xFA || status === 0xFB) {
      this.ticksSinceStart = 0;
      this.pendingBarAlign = status === 0xFA;
      this._resetTicks();
    } else if (status === 0xFC) {
      this.state.midi.receiving = false;
      this._resetTicks();
    }
  }

  _handleTick(now, deviceName) {
    const midi = this.state.midi;

    // A long gap means the clock restarted: drop old history so BPM doesn't average across the gap
    if (this.lastTickTime && now - this.lastTickTime > 500) {
      this._resetTicks();
    }
    this.lastTickTime = now;
    midi.receiving = true;
    if (deviceName) midi.deviceName = deviceName;

    this.tickTimes[this.tickWriteIdx] = now;
    this.tickWriteIdx = (this.tickWriteIdx + 1) % TICK_WINDOW;
    if (this.tickCount < TICK_WINDOW) this.tickCount += 1;

    // Need at least half a beat of ticks for a usable estimate
    if (this.tickCount >= PPQN / 2) {
      const newestIdx = (this.tickWriteIdx - 1 + TICK_WINDOW) % TICK_WINDOW;
      const oldestIdx = this.tickCount < TICK_WINDOW ? 0 : this.tickWriteIdx;
      const span = this.tickTimes[newestIdx] - this.tickTimes[oldestIdx];
      const intervals = this.tickCount - 1;
      if (span > 0 && intervals > 0) {
        const msPerTick = span / intervals;
        const rawBpm = 60000 / (msPerTick * PPQN);
        if (rawBpm >= 40 && rawBpm <= 240) {
          this.smoothedBpm = this.smoothedBpm ? this.smoothedBpm * 0.85 + rawBpm * 0.15 : rawBpm;
          const rounded = Math.round(this.smoothedBpm * 10) / 10;
          midi.clockBpm = rounded;
          this.state.bpm.value = Math.min(220, Math.max(60, rounded));
        }
      }
    }

    // Beat boundary: gently lock our beat phase to the incoming clock (only at x1, otherwise phase is meaningless)
    this.ticksSinceStart += 1;
    if (this.ticksSinceStart % PPQN === 0) {
      const bpm = this.state.bpm;
      if (this.pendingBarAlign) {
        // After a MIDI Start, snap to the next bar downbeat
        bpm.totalBeats = Math.ceil(bpm.totalBeats / 4) * 4;
        this.pendingBarAlign = false;
      } else if (bpm.multiplier === 1) {
        const frac = bpm.totalBeats - Math.floor(bpm.totalBeats);
        const correction = frac > 0.5 ? (1 - frac) : -frac;
        bpm.totalBeats += correction * 0.5;
      }
    }
  }

  update() {
    const midi = this.state.midi;
    if (midi.receiving && performance.now() - this.lastTickTime > RECEIVE_TIMEOUT_MS) {
      midi.receiving = false;
      this._resetTicks();
    }
  }
}


// ==================== MODULE: js/engine/mediaLayer.js ====================
/**
 * AETHER-VJ: Capa de Vídeo / GIF / Imagen / Cámara en directo
 * Carga el material que trae el DJ (MP4, WEBM, MOV, GIF animado, PNG/JPG) o una webcam USB
 * y entrega cada fotograma nuevo al renderizador WebGL para mezclarlo con los visuales y aplicarle efectos.
 */

const MAX_GIF_SIDE = 960;
function detectMediaKind(nameOrType = '') {
  const s = String(nameOrType).toLowerCase();
  if (s.includes('gif')) return 'gif';
  if (/(^image\/)|\.(png|jpe?g|webp|bmp|svg)(\?|$)/.test(s)) return 'image';
  return 'video';
}
class MediaLayer {
  constructor(state) {
    this.state = state;
    this.video = null;
    this.image = null;
    this.stream = null;

    // GIF animado (WebCodecs ImageDecoder, decodificación perezosa fotograma a fotograma)
    this.gifDecoder = null;
    this.gifFrameCount = 0;
    this.gifFrameIndex = 0;
    this.gifBitmap = null;
    this.gifNextAt = 0;
    this.gifDecoding = false;
    this.gifToken = 0;

    this.currentKey = '';
    this.width = 0;
    this.height = 0;
    this.dirty = false;
    this.ready = false;
    this.lastError = '';
    this._blobUrl = '';
    this._rvfcActive = false;
  }

  get isPlaying() {
    return this.ready && this.state.media && this.state.media.enabled;
  }

  _sourceKey() {
    const m = this.state.media;
    if (!m || m.source === 'none') return '';
    if (m.source === 'camera') return `camera|${m.cameraId || ''}|${m.version || 0}`;
    return `file|${m.url}|${m.version || 0}`;
  }

  /** Comprueba si el estado pide otro material y lo carga. Llamar una vez por fotograma. */
  sync() {
    const key = this._sourceKey();
    if (key !== this.currentKey) {
      this.currentKey = key;
      this._teardown();
      const m = this.state.media;
      if (key) {
        if (m.source === 'camera') {
          this._startCamera(m.cameraId);
        } else if (m.kind === 'gif') {
          this._loadGif(m.url);
        } else if (m.kind === 'image') {
          this._loadImage(m.url);
        } else {
          this._loadVideo(m.url);
        }
      }
    }

    // Velocidad de reproducción en vivo
    if (this.video && this.state.media.source === 'file') {
      const rate = Math.max(0.25, Math.min(2.0, Number(this.state.media.speed) || 1.0));
      if (Math.abs(this.video.playbackRate - rate) > 0.001) {
        this.video.playbackRate = rate;
      }
    }
  }

  /**
   * Devuelve la fuente a subir a la GPU si hay un fotograma nuevo (o null si no hace falta subir nada).
   */
  pollFrame(nowMs) {
    if (!this.ready) return null;

    if (this.video) {
      const v = this.video;
      if (v.readyState < 2 || v.videoWidth === 0) return null;
      if (v.paused && this.state.media.source === 'file') {
        v.play().catch(() => {});
      }
      this.width = v.videoWidth;
      this.height = v.videoHeight;
      if (this._rvfcActive) {
        if (!this.dirty) return null;
        this.dirty = false;
      }
      return v;
    }

    if (this.gifDecoder) {
      this._advanceGif(nowMs);
      if (this.dirty && this.gifBitmap) {
        this.dirty = false;
        return this.gifBitmap;
      }
      return null;
    }

    if (this.image && this.dirty) {
      this.dirty = false;
      return this.image;
    }
    return null;
  }

  async refreshCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Cámara ${i + 1}` }));
      this.state.cameras = cams;
      return cams;
    } catch (_) {
      return [];
    }
  }

  /** Carga un fichero local (consola de PC) sin pasar por el servidor. */
  loadBlob(file) {
    if (!file) return;
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch (_) {}
    }
    const url = URL.createObjectURL(file);
    this._blobUrl = url;
    const m = this.state.media;
    m.source = 'file';
    m.url = url;
    m.kind = detectMediaKind(file.type || file.name);
    m.name = file.name || 'vídeo local';
    m.enabled = true;
    m.version = (m.version || 0) + 1;
  }

  _teardown() {
    this.ready = false;
    this.dirty = false;
    this.lastError = '';
    this._rvfcActive = false;
    this.gifToken += 1;

    if (this.video) {
      try {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.srcObject = null;
        this.video.load();
      } catch (_) {}
      this.video = null;
    }
    if (this.stream) {
      try { this.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      this.stream = null;
    }
    if (this.gifDecoder) {
      try { this.gifDecoder.close(); } catch (_) {}
      this.gifDecoder = null;
    }
    if (this.gifBitmap) {
      try { this.gifBitmap.close(); } catch (_) {}
      this.gifBitmap = null;
    }
    this.gifDecoding = false;
    this.image = null;
  }

  _createVideoElement() {
    const v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    return v;
  }

  _watchVideoFrames(v) {
    if (typeof v.requestVideoFrameCallback !== 'function') return;
    this._rvfcActive = true;
    const onFrame = () => {
      if (this.video !== v) return;
      this.dirty = true;
      v.requestVideoFrameCallback(onFrame);
    };
    v.requestVideoFrameCallback(onFrame);
  }

  _loadVideo(url) {
    const v = this._createVideoElement();
    this.video = v;
    v.onloadeddata = () => {
      if (this.video !== v) return;
      this.width = v.videoWidth;
      this.height = v.videoHeight;
      this.ready = true;
      this.dirty = true;
      v.play().catch(() => {});
    };
    v.onerror = () => {
      if (this.video !== v) return;
      this.lastError = 'No se pudo reproducir el vídeo (formato no soportado o fichero dañado).';
      console.warn('[AETHER-VJ] Media error:', url);
    };
    this._watchVideoFrames(v);
    v.src = url;
    v.load();
  }

  async _startCamera(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.lastError = 'Este navegador no permite usar la cámara.';
      return;
    }
    const token = this.gifToken;
    try {
      const constraints = {
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      if (deviceId) constraints.video.deviceId = { exact: deviceId };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (token !== this.gifToken) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      const v = this._createVideoElement();
      v.loop = false;
      this.video = v;
      v.onloadeddata = () => {
        if (this.video !== v) return;
        this.width = v.videoWidth;
        this.height = v.videoHeight;
        this.ready = true;
        this.dirty = true;
        v.play().catch(() => {});
      };
      this._watchVideoFrames(v);
      v.srcObject = stream;
      // Con permiso ya concedido, los nombres de las cámaras son visibles
      this.refreshCameras();
    } catch (err) {
      this.lastError = 'No se pudo abrir la cámara: ' + (err && err.name ? err.name : 'error');
      console.warn('[AETHER-VJ] Camera error:', err);
    }
  }

  _loadImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.image !== img) return;
      this.width = img.naturalWidth;
      this.height = img.naturalHeight;
      this.ready = true;
      this.dirty = true;
    };
    img.onerror = () => {
      this.lastError = 'No se pudo cargar la imagen.';
    };
    this.image = img;
    img.src = url;
  }

  async _loadGif(url) {
    const token = this.gifToken;
    if (typeof window.ImageDecoder === 'undefined') {
      // Sin WebCodecs: se muestra el primer fotograma como imagen fija
      this._loadImage(url);
      return;
    }
    try {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      if (token !== this.gifToken) return;
      const decoder = new window.ImageDecoder({ data: buf, type: 'image/gif' });
      await decoder.tracks.ready;
      if (token !== this.gifToken) {
        decoder.close();
        return;
      }
      this.gifDecoder = decoder;
      this.gifFrameCount = Math.max(1, decoder.tracks.selectedTrack ? decoder.tracks.selectedTrack.frameCount : 1);
      this.gifFrameIndex = 0;
      this.gifNextAt = 0;
      this.ready = true;
      this._decodeGifFrame(0, token);
    } catch (err) {
      console.warn('[AETHER-VJ] GIF decode error, using static image:', err);
      if (token === this.gifToken) this._loadImage(url);
    }
  }

  async _decodeGifFrame(index, token) {
    if (!this.gifDecoder || this.gifDecoding) return;
    this.gifDecoding = true;
    try {
      const result = await this.gifDecoder.decode({ frameIndex: index });
      const frame = result.image;
      if (token !== this.gifToken) {
        frame.close();
        return;
      }
      const fw = frame.displayWidth || frame.codedWidth;
      const fh = frame.displayHeight || frame.codedHeight;
      const s = Math.min(1, MAX_GIF_SIDE / Math.max(fw, fh));
      const bmp = await createImageBitmap(frame, {
        resizeWidth: Math.max(1, Math.round(fw * s)),
        resizeHeight: Math.max(1, Math.round(fh * s))
      });
      // Duración del fotograma en µs (los GIF sin duración van a 10 fps)
      const durMs = frame.duration ? frame.duration / 1000 : 100;
      frame.close();
      if (token !== this.gifToken) {
        bmp.close();
        return;
      }
      if (this.gifBitmap) this.gifBitmap.close();
      this.gifBitmap = bmp;
      this.width = bmp.width;
      this.height = bmp.height;
      this.gifFrameIndex = index;
      const speed = Math.max(0.25, Math.min(2.0, Number(this.state.media.speed) || 1.0));
      this.gifNextAt = performance.now() + Math.max(20, durMs) / speed;
      this.dirty = true;
    } catch (err) {
      // Fin de pista o fotograma dañado: vuelve al principio
      this.gifFrameIndex = -1;
      this.gifNextAt = performance.now() + 100;
    } finally {
      this.gifDecoding = false;
    }
  }

  _advanceGif(nowMs) {
    if (!this.gifDecoder || this.gifDecoding || this.gifFrameCount <= 1) return;
    if (nowMs >= this.gifNextAt) {
      const next = (this.gifFrameIndex + 1) % this.gifFrameCount;
      this._decodeGifFrame(next, this.gifToken);
    }
  }
}


// ==================== MODULE: js/engine/logoProcessor.js ====================
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
async function processLogoDataUrl(dataUrl, mode = 'auto') {
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


// ==================== MODULE: js/engine/syncBridge.js ====================
/**
 * AETHER-VJ: High-Speed 60Hz Projector Synchronization Bridge
 * Synchronizes Master Console state with the Clean Output Projector Window
 * via BroadcastChannel and direct window reference for zero-latency Resolume / NDI / Spout capture.
 */




const TEXT_PROPS = new Set(['enabled', 'content', 'font', 'fxMode', 'pos', 'scale', 'opacity', 'colorMode', 'backdrop', 'scrollSpeed']);
const MEDIA_PROPS = new Set(['enabled', 'opacity', 'blend', 'fx', 'fit', 'mirror', 'beatZoom', 'speed']);
const MASK_PROPS = new Set(['enabled', 'x', 'y', 'w', 'h', 'feather']);
const EDGE_PROPS = new Set(['mode', 'overlap', 'gamma', 'curve']);

function clampNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}
class SyncBridge {
  constructor(state, role = 'master') {
    this.state = state;
    this.role = role; // 'master' | 'projector'
    this.channel = null;
    this.projectorWindow = null;
    this.isProjectorConnected = false;
    this.lastHeartbeat = 0;
    this.autopilot = null;
    this.onBankChanged = null;
    this._lastSyncedLogoVersion = -1;
    this.remoteConnected = false;
    this.media = null;              // MediaLayer (para cámaras y ficheros locales)
    this.edgeModeOverride = null;   // Ventana de proyector con ?blend=left|right
    this.logoProcessing = false;

    // Reusable compact payload object to avoid memory allocation per frame
    this.packet = {
      type: 'STATE_SYNC',
      renderTime: 0,
      accumulatedPhase: 0,
      entropySeed: 0,
      shapeMode: 0,
      styleMode: 0,
      sweepMode: 0,
      weightMode: 1,
      resolutionScale: 1.0,
      bgMode: 'SOLID',
      deckA: 0,
      deckB: 1,
      crossfade: 0,
      paletteActive: 0,
      paletteTarget: 0,
      paletteMix: 0,
      macros: {
        speed: 0,
        scale: 0,
        complexity: 0,
        thickness: 0,
        rotation: 0,
        chaos: 0,
        strobe: 0,
        colorShift: 0
      },
      bpm: {
        beatPhase: 0,
        barPhase: 0,
        syncPulse: 0
      },
      audio: {
        bass: 0,
        mid: 0,
        high: 0
      },
      fx: {
        effect3dMode: 0,
        effect3dAmount: 0.55,
        logoEnabled: false,
        logoFxMode: 1,
        logoScale: 0.44,
        logoOpacity: 0.96,
        logoBackdrop: 0.65,
        logoPos: 0,
        logoTint: false,
        logoAspect: 2.4,
        logoVersion: 0,
        kaleidoEnabled: false,
        kaleidoWet: 0,
        kaleidoAxes: 4,
        rgbShiftEnabled: false,
        rgbShiftWet: 0,
        feedbackEnabled: false,
        feedbackWet: 0,
        glitchEnabled: false,
        glitchWet: 0,
        pixelateEnabled: false,
        pixelateWet: 0,
        flashMomentary: false,
        invertKill: false,
        bwMonochrome: false,
        blackout: false,
        strobeBurst: false
      }
    };

    this._initChannel();
    this._initRemoteBridge();
  }

  attachControllers(autopilot, onBankChanged) {
    this.autopilot = autopilot;
    this.onBankChanged = onBankChanged;
  }

  attachMedia(mediaLayer) {
    this.media = mediaLayer;
  }

  /**
   * Logo inteligente: quita el fondo, recorta y normaliza antes de ponerlo en pantalla.
   */
  processAndSetLogo(dataUrl, slotIndex, mode = 'auto') {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return;
    const st = this.state;
    this.logoProcessing = true;
    processLogoDataUrl(dataUrl, mode)
      .then((res) => {
        this.setLogoDataUrl(res.dataUrl, slotIndex);
        st.fx.logo.aspect = Math.max(0.25, Math.min(4.5, res.aspect));
        st.fx.logo.enabled = true;
      })
      .catch((err) => {
        console.warn('[AETHER-VJ] Logo processing failed, using original:', err);
        this.setLogoDataUrl(dataUrl, slotIndex);
        st.fx.logo.enabled = true;
      })
      .finally(() => {
        this.logoProcessing = false;
        this._pushStatusToRemoteServer();
      });
  }

  setLogoDataUrl(dataUrl, slotIndex = null) {
    const st = this.state;
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < 4) {
      st.logoSlots[slotIndex] = dataUrl;
      st.fx.logo.activeSlot = slotIndex;
    }
    st.logoDataUrl = dataUrl || '';
    st.fx.logo.version = (st.fx.logo.version || 0) + 1;
    st.fx.logo.enabled = Boolean(dataUrl) || st.fx.logo.enabled;

    try {
      localStorage.setItem('aether_vj_logo_data', st.logoDataUrl);
    } catch (_) {}

    const logoMsg = {
      type: 'LOGO_DATA_SYNC',
      dataUrl: st.logoDataUrl,
      version: st.fx.logo.version
    };
    if (this.channel) {
      this.channel.postMessage(logoMsg);
    }
    if (this.projectorWindow && !this.projectorWindow.closed) {
      try {
        this.projectorWindow.postMessage(logoMsg, '*');
      } catch (_) {}
    }
  }

  _initChannel() {
    // Restore cached logo if present in localStorage
    try {
      const savedLogo = localStorage.getItem('aether_vj_logo_data');
      if (savedLogo) {
        this.state.logoDataUrl = savedLogo;
      }
    } catch (_) {}

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('aether_vj_sync_v1');
      this.channel.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        if (this.role === 'projector' && msg.type === 'STATE_SYNC') {
          this.applyPacketToState(msg);
        } else if (this.role === 'projector' && msg.type === 'LOGO_DATA_SYNC') {
          this.state.logoDataUrl = msg.dataUrl || '';
          this._lastSyncedLogoVersion = msg.version || 0;
        } else if (this.role === 'master' && msg.type === 'PROJECTOR_HEARTBEAT') {
          this.isProjectorConnected = true;
          this.lastHeartbeat = performance.now();
        } else if (this.role === 'master' && msg.type === 'REMOTE_COMMAND') {
          this._applyRemoteCommand(msg);
        }
      };
    }

    // Also allow direct same-origin callback and postMessage for file:// and http:// compatibility
    if (this.role === 'projector') {
      window.__aetherApplySyncPacket = (pkt) => this.applyPacketToState(pkt);
      window.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data.type === 'STATE_SYNC') {
          this.applyPacketToState(event.data);
        } else if (event.data.type === 'LOGO_DATA_SYNC') {
          this.state.logoDataUrl = event.data.dataUrl || '';
          this._lastSyncedLogoVersion = event.data.version || 0;
        }
      });
      if (this.channel) {
        this.channel.postMessage({ type: 'PROJECTOR_HEARTBEAT' });
        setInterval(() => {
          this.channel.postMessage({ type: 'PROJECTOR_HEARTBEAT' });
        }, 1000);
      }
    }
  }

  _initRemoteBridge() {
    if (this.role !== 'master') return;
    if (typeof window === 'undefined' || !window.location.protocol.startsWith('http')) return;
    if (typeof EventSource === 'undefined') return;

    try {
      // Canal maestro: solo la propia máquina puede abrirlo (el servidor rechaza al resto)
      const es = new EventSource('/api/events?role=master');
      es.onopen = () => {
        this.remoteConnected = true;
        this._pushStatusToRemoteServer();
      };
      es.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg && msg.type === 'REMOTE_COMMAND') {
            this._applyRemoteCommand(msg);
            this._pushStatusToRemoteServer();
          }
        } catch (_) {}
      };
      es.onerror = () => {
        this.remoteConnected = false;
      };

      setInterval(() => {
        if (this.remoteConnected) {
          this._pushStatusToRemoteServer();
        }
      }, 800);
    } catch (_) {}
  }

  _pushStatusToRemoteServer() {
    if (!this.remoteConnected) return;
    const st = this.state;
    const dominantGenIdx = st.crossfade >= 0.5 ? st.deckB : st.deckA;
    const macrosPayload = {};
    const macroBarSteps = {};
    const macroAudioBands = {};
    for (let i = 0; i < MACRO_DEFS.length; i++) {
      const k = MACRO_DEFS[i].key;
      if (st.macros[k]) {
        macrosPayload[k] = Math.round(st.macros[k].base * 100) / 100;
        macroBarSteps[k] = Number(st.macros[k].barStepBars) || 0;
        macroAudioBands[k] = st.macros[k].audioBand || 'none';
      }
    }
    const payload = {
      activeGen: dominantGenIdx,
      activeBankTab: st.activeBankTab,
      autopilotPool: st.autopilotBankPool,
      autopilotEnabled: st.autopilot.enabled,
      autopilotMode: st.autopilot.mode,
      lfoMasterEnabled: Boolean(st.autopilot.lfoMasterEnabled),
      autoRotatePalette: Boolean(st.autoRotatePalette),
      autopilotTriggerUnit: st.autopilot.triggerUnit || 'BARS',
      autopilotTriggerBars: st.autopilot.triggerBars || 32,
      autopilotTriggerSeconds: st.autopilot.triggerSeconds || 45,
      autopilotProgress: Math.round((st.autopilot.sceneProgress || 0) * 100),
      scenesPlayed: st.autopilot.scenesPlayed || 1,
      autoMods: Object.assign({}, st.autoMods || {}, {
        palette: Boolean(st.autoRotatePalette),
        allActive: Boolean(this.autopilot && this.autopilot.areAllAutoModsActive && this.autopilot.areAllAutoModsActive())
      }),
      macros: macrosPayload,
      macroBarSteps,
      macroAudioBands,
      currentBar: st.bpm.currentBar || 1,
      currentBeat: st.bpm.currentBeatInBar || 1,
      postFx: {
        bypass: Boolean(st.pureFlatBypassFx),
        kaleidoEnabled: Boolean(st.fx.kaleidoscope.enabled),
        kaleidoAxes: st.fx.kaleidoscope.axes || 2,
        kaleidoWet: st.fx.kaleidoscope.wet,
        rgbShiftEnabled: Boolean(st.fx.rgbShift.enabled),
        rgbShiftWet: st.fx.rgbShift.wet,
        feedbackEnabled: Boolean(st.fx.feedback.enabled),
        feedbackWet: st.fx.feedback.wet,
        glitchEnabled: Boolean(st.fx.glitch.enabled),
        pixelateEnabled: Boolean(st.fx.pixelate.enabled),
        kaleidoscope: st.fx.kaleidoscope,
        rgbShift: st.fx.rgbShift,
        feedback: st.fx.feedback,
        glitch: st.fx.glitch,
        pixelate: st.fx.pixelate
      },
      shapeMode: st.shapeMode,
      styleMode: st.styleMode,
      weightMode: st.weightMode,
      sweepMode: st.sweepMode,
      effect3dMode: st.fx.effect3d ? st.fx.effect3d.mode : 0,
      effect3dAmount: st.fx.effect3d ? st.fx.effect3d.amount : 0.55,
      paletteTarget: st.paletteTarget,
      bpm: Math.round(st.bpm.value * 10) / 10,
      bgMode: st.bgMode,
      fps: Math.round(st.fps),
      logo: {
        enabled: st.fx.logo.enabled,
        fxMode: st.fx.logo.fxMode,
        scale: st.fx.logo.scale,
        opacity: st.fx.logo.opacity,
        backdrop: st.fx.logo.backdrop,
        pos: st.fx.logo.pos,
        tint: st.fx.logo.tint,
        activeSlot: st.fx.logo.activeSlot,
        hasSlots: st.logoSlots.map((s) => Boolean(s))
      },
      mapping: st.fx.mapping,
      output: st.fx.output,
      safeStrobe: st.fx.safeStrobe !== false,
      calmColor: st.calmColor !== false,
      midi: {
        enabled: Boolean(st.midi && st.midi.enabled),
        receiving: Boolean(st.midi && st.midi.receiving)
      },
      presets: (st.presets || []).map((p) => (p ? { name: p.name } : null)),
      text: st.text,
      media: st.media && st.media.url && st.media.url.startsWith('blob:')
        ? Object.assign({}, st.media, { url: '' })
        : st.media,
      mediaPlaying: Boolean(this.media && this.media.isPlaying),
      mediaError: this.media ? this.media.lastError : '',
      transition: st.transition,
      edgeBlend: st.fx.edgeBlend,
      cameras: st.cameras || [],
      logoProcessing: this.logoProcessing
    };
    fetch('/api/master-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  _applyRemoteCommand(cmd) {
    const st = this.state;
    if (!cmd || !cmd.action) return;

    switch (cmd.action) {
      case 'CALM_PRESET':
        if (this.autopilot) this.autopilot.applyCalmStagePreset();
        break;
      case 'NEXT_SCENE':
        if (this.autopilot) this.autopilot.triggerNextScene(cmd.genId);
        break;
      case 'SELECT_BANK':
        if (cmd.bank) {
          st.activeBankTab = cmd.bank;
          if (this.onBankChanged) this.onBankChanged();
        }
        break;
      case 'SELECT_POOL':
        if (cmd.pool) {
          st.autopilotBankPool = cmd.pool;
          if (['FLT', 'MIN', 'MOT', 'GEO', 'KIN', 'SPC'].includes(cmd.pool)) {
            st.activeBankTab = cmd.pool;
            if (this.onBankChanged) this.onBankChanged();
          }
          if (st.autoMods && this.autopilot && typeof this.autopilot._getAllowedGenerators === 'function') {
            const allowed = this.autopilot._getAllowedGenerators();
            st.autoMods.lapTotalLoops = Math.max(1, allowed.length);
            st.autoMods.visitedInLap = (st.autoMods.visitedInLap || []).filter((id) => allowed.includes(id));
            st.autoMods.loopsInCurrentLap = Math.max(1, st.autoMods.visitedInLap.length);
          }
        }
        break;
      case 'SET_SHAPE':
        st.shapeMode = Number(cmd.value) || 0;
        break;
      case 'SET_STYLE':
        st.styleMode = Number(cmd.value) || 0;
        if (st.styleMode === 1 && !(st.autoMods && st.autoMods.postFx)) {
          st.fx.kaleidoscope.enabled = false;
          st.fx.rgbShift.enabled = false;
          st.fx.feedback.enabled = false;
          st.fx.glitch.enabled = false;
          st.fx.pixelate.enabled = false;
        }
        break;
      case 'SET_WEIGHT':
        st.weightMode = Number(cmd.value) || 0;
        break;
      case 'SET_SWEEP':
        st.sweepMode = Number(cmd.value) || 0;
        break;
      case 'SET_3D_MODE':
        st.fx.effect3d.mode = Number(cmd.value) || 0;
        break;
      case 'SET_3D_AMOUNT':
        st.fx.effect3d.amount = Math.max(0.1, Math.min(1.0, Number(cmd.value) || 0.55));
        break;
      case 'SET_PALETTE':
        st.paletteActive = st.paletteTarget;
        st.paletteTarget = Number(cmd.value) || 0;
        st.paletteMix = 0.0;
        break;
      case 'SET_BPM':
        st.bpm.value = Math.max(60, Math.min(200, Number(cmd.value) || 126));
        break;
      case 'TAP_TEMPO':
        if (this.autopilot) this.autopilot.registerTapTempo();
        break;
      case 'SET_AUTOPILOT':
        st.autopilot.enabled = Boolean(cmd.value);
        break;
      case 'SET_AUTOPILOT_MODE':
        if (cmd.value) st.autopilot.mode = cmd.value;
        break;
      case 'SET_LFO_MASTER':
        st.autopilot.lfoMasterEnabled = Boolean(cmd.value);
        break;
      case 'SET_AUTOPILOT_TRIGGER':
        if (cmd.unit === 'BARS' || cmd.unit === 'SECONDS') {
          st.autopilot.triggerUnit = cmd.unit;
        }
        if (typeof cmd.value === 'number' && Number.isFinite(cmd.value)) {
          if (st.autopilot.triggerUnit === 'BARS') {
            st.autopilot.triggerBars = Math.max(1, Math.min(256, Math.round(cmd.value)));
          } else {
            st.autopilot.triggerSeconds = Math.max(4, Math.min(600, Math.round(cmd.value)));
          }
        }
        break;
      case 'SET_AUTO_MOD':
        if (!st.autoMods) st.autoMods = {};
        if (cmd.key === 'palette') {
          st.autoRotatePalette = Boolean(cmd.value);
        } else if (['shape', 'style', 'weight', 'sweep', 'effect3d', 'postFx', 'logoFx', 'textFx', 'mediaFx'].includes(cmd.key)) {
          st.autoMods[cmd.key] = Boolean(cmd.value);
        }
        break;
      case 'SET_ALL_AUTO':
        if (this.autopilot && typeof this.autopilot.setAllAutoMods === 'function') {
          this.autopilot.setAllAutoMods(Boolean(cmd.value));
        }
        break;
      case 'SET_AUTO_CHANGE_EVERY':
        if (!st.autoMods) st.autoMods = {};
        st.autoMods.changeEvery = cmd.value === 'SCENE' ? 'SCENE' : 'LAP';
        break;
      case 'STEP_AUTO_MODS_NOW':
        if (this.autopilot && typeof this.autopilot.stepAutoModifiers === 'function') {
          this.autopilot.stepAutoModifiers(true);
        }
        break;
      case 'MUTATE_MACROS':
        if (this.autopilot && typeof this.autopilot.randomizeMacrosNow === 'function') {
          this.autopilot.randomizeMacrosNow();
        }
        break;
      case 'SET_POST_FX':
        if (cmd.key === 'bypass' || cmd.prop === 'bypass') {
          st.pureFlatBypassFx = Boolean(cmd.enabled !== undefined ? cmd.enabled : cmd.value);
          if (st.pureFlatBypassFx) {
            st.fx.kaleidoscope.enabled = false;
            st.fx.rgbShift.enabled = false;
            st.fx.feedback.enabled = false;
            st.fx.glitch.enabled = false;
            st.fx.pixelate.enabled = false;
          }
        } else if (cmd.prop) {
          const propMap = {
            kaleidoEnabled: ['kaleidoscope', 'enabled'],
            kaleidoAxes: ['kaleidoscope', 'axes'],
            kaleidoWet: ['kaleidoscope', 'wet'],
            rgbShiftEnabled: ['rgbShift', 'enabled'],
            rgbShiftWet: ['rgbShift', 'wet'],
            feedbackEnabled: ['feedback', 'enabled'],
            feedbackWet: ['feedback', 'wet'],
            glitchEnabled: ['glitch', 'enabled'],
            pixelateEnabled: ['pixelate', 'enabled']
          };
          const target = propMap[cmd.prop];
          if (target && st.fx[target[0]]) {
            const slot = st.fx[target[0]];
            const field = target[1];
            if (field === 'enabled') {
              slot.enabled = Boolean(cmd.value);
              if (slot.enabled) st.pureFlatBypassFx = false;
            } else if (field === 'axes') {
              slot.axes = [2, 4, 8].includes(Number(cmd.value)) ? Number(cmd.value) : 2;
              slot.enabled = true;
              st.pureFlatBypassFx = false;
            } else if (field === 'wet') {
              slot.wet = clampNum(cmd.value, 0, 1, slot.wet);
              if (slot.wet > 0.02) {
                slot.enabled = true;
                st.pureFlatBypassFx = false;
              }
            }
          }
        } else if (['kaleidoscope', 'rgbShift', 'feedback', 'glitch', 'pixelate'].includes(cmd.key)) {
          const fxSlot = st.fx[cmd.key];
          if (fxSlot) {
            if (typeof cmd.enabled === 'boolean') {
              fxSlot.enabled = cmd.enabled;
              if (cmd.enabled) st.pureFlatBypassFx = false;
            }
            if (typeof cmd.wet === 'number' && Number.isFinite(cmd.wet)) {
              fxSlot.wet = clampNum(cmd.wet, 0, 1, fxSlot.wet);
              if (fxSlot.wet > 0.02) {
                fxSlot.enabled = true;
                st.pureFlatBypassFx = false;
              }
            }
            if (cmd.key === 'kaleidoscope' && typeof cmd.axes === 'number') {
              fxSlot.axes = [2, 4, 8].includes(cmd.axes) ? cmd.axes : 2;
              fxSlot.enabled = true;
              st.pureFlatBypassFx = false;
            }
          }
        }
        break;
      case 'SET_MACRO':
        if (cmd.key && st.macros[cmd.key]) {
          const v = Math.max(0.0, Math.min(1.0, Number(cmd.value) || 0));
          st.macros[cmd.key].base = v;
          if (this.autopilot && this.autopilot.macroBaseTargets) {
            this.autopilot.macroBaseTargets[cmd.key] = v;
          }
        }
        break;
      case 'SET_MACRO_BAR_STEP':
        if (cmd.key && st.macros[cmd.key]) {
          const bars = Number(cmd.bars) || 0;
          st.macros[cmd.key].barStepBars = BAR_STEP_OPTIONS.includes(bars) ? bars : 0;
          if (st.macros[cmd.key].barStepBars > 0) {
            const seq = BAR_STEP_SEQUENCES[cmd.key];
            if (Array.isArray(seq) && seq.length > 0) {
              const nextIdx = ((st.macros[cmd.key].barStepIndex || 0) + 1) % seq.length;
              st.macros[cmd.key].barStepIndex = nextIdx;
              const nextVal = seq[nextIdx];
              st.macros[cmd.key].base = nextVal;
              if (this.autopilot && this.autopilot.macroBaseTargets) {
                this.autopilot.macroBaseTargets[cmd.key] = nextVal;
              }
            }
          }
        }
        break;
      case 'SET_MACRO_AUDIO_BAND':
        if (cmd.key && st.macros[cmd.key]) {
          const band = ['none', 'bass', 'mid', 'high'].includes(cmd.band) ? cmd.band : 'none';
          st.macros[cmd.key].audioBand = band;
          if (band !== 'none' && st.macros[cmd.key].audioAmount < 0.1) {
            st.macros[cmd.key].audioAmount = 0.35;
          }
        }
        break;
      case 'SET_AUTO_BAR_STEPS_PRESET': {
        const anyActive = Object.values(st.macros).some((m) => (Number(m.barStepBars) || 0) > 0);
        const turnOn = cmd.enabled !== undefined ? Boolean(cmd.enabled) : !anyActive;
        if (turnOn) {
          const preset = {
            speed: 0,
            scale: 4,
            complexity: 8,
            thickness: 0,
            rotation: 8,
            chaos: 16,
            strobe: 0,
            colorShift: 16
          };
          for (const k of Object.keys(st.macros)) {
            st.macros[k].barStepBars = preset[k] || 0;
          }
        } else {
          for (const k of Object.keys(st.macros)) {
            st.macros[k].barStepBars = 0;
          }
        }
        break;
      }
      case 'UPLOAD_LOGO':
        if (typeof cmd.dataUrl === 'string') {
          const slot = (typeof cmd.slot === 'number') ? cmd.slot : st.fx.logo.activeSlot;
          const mode = ['auto', 'white', 'black', 'none'].includes(cmd.bgRemove) ? cmd.bgRemove : 'auto';
          this.processAndSetLogo(cmd.dataUrl, slot, mode);
        }
        break;
      case 'PROCESS_LOGO':
        if (st.logoDataUrl) {
          const mode = ['auto', 'white', 'black'].includes(cmd.mode) ? cmd.mode : 'auto';
          this.processAndSetLogo(st.logoDataUrl, st.fx.logo.activeSlot, mode);
        }
        break;
      case 'SET_TEXT_PROP':
        if (cmd.prop && TEXT_PROPS.has(cmd.prop) && st.text) {
          const t = st.text;
          switch (cmd.prop) {
            case 'content':
              t.content = String(cmd.value ?? '').replace(/\r/g, '').slice(0, 140);
              t.version = (t.version || 0) + 1;
              if (t.content.trim()) t.enabled = true;
              break;
            case 'enabled':
              t.enabled = Boolean(cmd.value);
              break;
            case 'font':
              t.font = clampNum(cmd.value, 0, 3, 0) | 0;
              t.version = (t.version || 0) + 1;
              break;
            case 'fxMode':
              t.fxMode = clampNum(cmd.value, 0, 6, 1) | 0;
              break;
            case 'pos':
              t.pos = clampNum(cmd.value, 0, 2, 0) | 0;
              break;
            case 'colorMode':
              t.colorMode = clampNum(cmd.value, 0, 2, 0) | 0;
              break;
            case 'scale':
              t.scale = clampNum(cmd.value, 0.15, 1.0, 0.5);
              break;
            case 'opacity':
              t.opacity = clampNum(cmd.value, 0.1, 1.0, 1.0);
              break;
            case 'backdrop':
              t.backdrop = clampNum(cmd.value, 0, 1, 0.4);
              break;
            case 'scrollSpeed':
              t.scrollSpeed = clampNum(cmd.value, 0.05, 1.0, 0.5);
              break;
          }
        }
        break;
      case 'SET_MEDIA_PROP':
        if (cmd.prop && MEDIA_PROPS.has(cmd.prop) && st.media) {
          const m = st.media;
          switch (cmd.prop) {
            case 'enabled': m.enabled = Boolean(cmd.value); break;
            case 'mirror': m.mirror = Boolean(cmd.value); break;
            case 'opacity': m.opacity = clampNum(cmd.value, 0, 1, 1); break;
            case 'blend': m.blend = clampNum(cmd.value, 0, 4, 0) | 0; break;
            case 'fx': m.fx = clampNum(cmd.value, 0, 6, 0) | 0; break;
            case 'fit': m.fit = clampNum(cmd.value, 0, 1, 0) | 0; break;
            case 'beatZoom': m.beatZoom = clampNum(cmd.value, 0, 1, 0); break;
            case 'speed': m.speed = clampNum(cmd.value, 0.25, 2, 1); break;
          }
        }
        break;
      case 'LOAD_MEDIA':
        if (typeof cmd.url === 'string' && /^\/media\/[^/\\]+$/.test(cmd.url)) {
          const m = st.media;
          m.source = 'file';
          m.url = cmd.url;
          m.kind = ['video', 'gif', 'image'].includes(cmd.kind) ? cmd.kind : detectMediaKind(cmd.url);
          m.name = String(cmd.name || cmd.url.split('/').pop()).slice(0, 80);
          m.enabled = true;
          m.version = (m.version || 0) + 1;
        }
        break;
      case 'LOAD_MEDIA_BLOB':
        if (this.media && cmd.file) {
          this.media.loadBlob(cmd.file);
        }
        break;
      case 'CAMERA_ON': {
        const m = st.media;
        m.source = 'camera';
        m.cameraId = typeof cmd.deviceId === 'string' ? cmd.deviceId : (m.cameraId || '');
        m.kind = 'video';
        m.url = '';
        const cam = (st.cameras || []).find((c) => c.deviceId === m.cameraId);
        m.name = cam ? cam.label : 'Cámara en directo';
        m.enabled = true;
        m.version = (m.version || 0) + 1;
        break;
      }
      case 'MEDIA_STOP': {
        const m = st.media;
        m.enabled = false;
        m.source = 'none';
        m.url = '';
        m.name = '';
        m.version = (m.version || 0) + 1;
        break;
      }
      case 'REFRESH_CAMERAS':
        if (this.media) {
          this.media.refreshCameras().then(() => this._pushStatusToRemoteServer());
        }
        break;
      case 'SET_TRANSITION': {
        const bars = Number(cmd.bars);
        if (TRANSITION_BARS.includes(bars)) st.transition.bars = bars;
        break;
      }
      case 'SET_CORNER': {
        const map = st.fx.mapping;
        const key = Number(cmd.proj) === 1 ? 'corners2' : 'corners';
        const idx = Number(cmd.index);
        if (!Array.isArray(map[key])) map[key] = defaultCorners();
        if (idx >= 0 && idx < 4) {
          // Nuevo array para que la persistencia y la ventana de proyector detecten el cambio
          const next = map[key].map((p) => [p[0], p[1]]);
          next[idx] = [clampNum(cmd.x, -0.5, 1.5, next[idx][0]), clampNum(cmd.y, -0.5, 1.5, next[idx][1])];
          map[key] = next;
        }
        break;
      }
      case 'RESET_CORNERS': {
        const map = st.fx.mapping;
        if (cmd.proj === undefined || cmd.proj === null || Number(cmd.proj) === 0) map.corners = defaultCorners();
        if (cmd.proj === undefined || cmd.proj === null || Number(cmd.proj) === 1) map.corners2 = defaultCorners();
        break;
      }
      case 'SET_MASK': {
        const map = st.fx.mapping;
        const idx = Number(cmd.index);
        if (!Array.isArray(map.masks)) map.masks = defaultMasks();
        if (idx >= 0 && idx < 4 && MASK_PROPS.has(cmd.prop)) {
          const next = map.masks.map((mk) => ({ ...mk }));
          if (cmd.prop === 'enabled') next[idx].enabled = Boolean(cmd.value);
          else if (cmd.prop === 'feather') next[idx].feather = clampNum(cmd.value, 0.0005, 0.2, 0.01);
          else next[idx][cmd.prop] = clampNum(cmd.value, 0, 1, next[idx][cmd.prop]);
          map.masks = next;
        }
        break;
      }
      case 'SET_EDGE_PROP': {
        const eb = st.fx.edgeBlend;
        if (eb && EDGE_PROPS.has(cmd.prop)) {
          if (cmd.prop === 'mode') eb.mode = clampNum(cmd.value, 0, 3, 0) | 0;
          else if (cmd.prop === 'overlap') eb.overlap = clampNum(cmd.value, 0.02, 0.45, 0.15);
          else if (cmd.prop === 'gamma') eb.gamma = clampNum(cmd.value, 1.0, 3.0, 2.2);
          else if (cmd.prop === 'curve') eb.curve = clampNum(cmd.value, 1.0, 4.0, 2.0);
        }
        break;
      }
      case 'SELECT_LOGO_SLOT': {
        const slot = Number(cmd.slot) || 0;
        st.fx.logo.activeSlot = slot;
        if (st.logoSlots[slot]) {
          this.setLogoDataUrl(st.logoSlots[slot], slot);
          st.fx.logo.enabled = true;
        }
        break;
      }
      case 'SET_LOGO_PROP':
        if (cmd.prop && cmd.prop in st.fx.logo) {
          st.fx.logo[cmd.prop] = cmd.value;
        }
        break;
      case 'SET_MAP_PROP':
        if (cmd.prop && st.fx.mapping && cmd.prop in st.fx.mapping) {
          st.fx.mapping[cmd.prop] = cmd.value;
        }
        break;
      case 'SET_OUTPUT_PROP':
        if (cmd.prop && st.fx.output && cmd.prop in st.fx.output) {
          st.fx.output[cmd.prop] = Number(cmd.value);
        }
        break;
      case 'SET_SAFE_STROBE':
        st.fx.safeStrobe = Boolean(cmd.value);
        break;
      case 'SET_CALM_COLOR':
        st.calmColor = Boolean(cmd.value);
        break;
      case 'PANIC':
        if (this.autopilot) this.autopilot.applyPanic();
        break;
      case 'SAVE_PRESET': {
        const slot = Number(cmd.slot);
        if (slot >= 0 && slot < st.presets.length) {
          st.presets[slot] = capturePreset(st);
        }
        break;
      }
      case 'RECALL_PRESET': {
        const slot = Number(cmd.slot);
        if (slot >= 0 && slot < st.presets.length && st.presets[slot]) {
          applyPreset(st, this.autopilot, st.presets[slot]);
        }
        break;
      }
      case 'CLEAR_PRESET': {
        const slot = Number(cmd.slot);
        if (slot >= 0 && slot < st.presets.length) {
          st.presets[slot] = null;
        }
        break;
      }
      case 'RESET_MAPPING':
        st.fx.mapping = {
          offsetX: 0.0,
          offsetY: 0.0,
          scaleX: 1.0,
          scaleY: 1.0,
          keystoneX: 0.0,
          keystoneY: 0.0,
          sliceMode: 0,
          sliceCount: 3,
          sliceGap: 0.04,
          sliceClone: true,
          showTestGrid: false,
          cornerPin: false,
          corners: defaultCorners(),
          corners2: defaultCorners(),
          masks: defaultMasks(),
          ledScalerEnabled: false,
          ledWidthPx: 1024,
          ledHeightPx: 512,
          ledOffsetXPx: 0,
          ledOffsetYPx: 0,
          ledAnchor: 'top-left',
          ledKeepAspect: true
        };
        break;
      case 'RELOAD_ENGINE':
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 500);
        }
        break;
      case 'KILL_ACTION':
        if (cmd.key === 'flash') {
          st.fx.flashMomentary = Boolean(cmd.active);
        } else if (cmd.key === 'strobe') {
          st.fx.strobeBurst = Boolean(cmd.active);
        } else if (cmd.key === 'mono') {
          st.fx.bwMonochrome = !st.fx.bwMonochrome;
        } else if (cmd.key === 'invert') {
          st.fx.invertKill = !st.fx.invertKill;
        } else if (cmd.key === 'blackout') {
          st.fx.blackout = !st.fx.blackout;
        }
        break;
    }
  }

  openProjectorWindow() {
    if (this.projectorWindow && !this.projectorWindow.closed) {
      this.projectorWindow.focus();
      return this.projectorWindow;
    }

    const width = 1280;
    const height = 720;
    const features = [
      `width=${width}`,
      `height=${height}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes'
    ].join(',');

    this.projectorWindow = window.open('projector.html', 'AetherVJ_Projector_Output', features);
    if (this.projectorWindow) {
      this.isProjectorConnected = true;
      this.lastHeartbeat = performance.now();
    }
    return this.projectorWindow;
  }

  broadcastState() {
    if (this.role !== 'master') return;

    // Check if projector window closed
    if (this.projectorWindow && this.projectorWindow.closed) {
      this.projectorWindow = null;
      if (performance.now() - this.lastHeartbeat > 2500) {
        this.isProjectorConnected = false;
      }
    }

    const st = this.state;
    const p = this.packet;

    p.renderTime = st.renderTime;
    p.accumulatedPhase = st.accumulatedPhase;
    p.entropySeed = st.entropySeed;
    p.shapeMode = st.shapeMode;
    p.styleMode = st.styleMode;
    p.sweepMode = st.sweepMode;
    p.weightMode = st.weightMode;
    p.resolutionScale = st.resolutionScale;
    p.bgMode = st.bgMode;
    p.deckA = st.deckA;
    p.deckB = st.deckB;
    p.crossfade = st.crossfade;
    p.paletteActive = st.paletteActive;
    p.paletteTarget = st.paletteTarget;
    p.paletteMix = st.paletteMix;

    for (let i = 0; i < MACRO_DEFS.length; i++) {
      const k = MACRO_DEFS[i].key;
      p.macros[k] = st.macros[k].modulated;
    }

    p.bpm.beatPhase = st.bpm.beatPhase;
    p.bpm.barPhase = st.bpm.barPhase;
    p.bpm.syncPulse = st.bpm.syncPulse;
    p.bpm.value = st.bpm.value;
    p.bpm.multiplier = st.bpm.multiplier;

    p.audio.bass = st.audio.bass;
    p.audio.mid = st.audio.mid;
    p.audio.high = st.audio.high;

    p.fx.effect3dMode = st.fx.effect3d ? st.fx.effect3d.mode : 0;
    p.fx.effect3dAmount = st.fx.effect3d ? st.fx.effect3d.amount : 0.55;
    p.fx.logoEnabled = st.fx.logo.enabled;
    p.fx.logoFxMode = st.fx.logo.fxMode;
    p.fx.logoScale = st.fx.logo.scale;
    p.fx.logoOpacity = st.fx.logo.opacity;
    p.fx.logoBackdrop = st.fx.logo.backdrop;
    p.fx.logoPos = st.fx.logo.pos;
    p.fx.logoTint = st.fx.logo.tint;
    p.fx.logoAspect = st.fx.logo.aspect;
    p.fx.logoVersion = st.fx.logo.version;
    p.fx.mapping = st.fx.mapping;
    p.fx.output = st.fx.output;
    p.fx.safeStrobe = st.fx.safeStrobe !== false;
    p.fx.edgeBlend = st.fx.edgeBlend;
    p.calmColor = st.calmColor !== false;
    p.colorPhase = st.colorPhase || 0;
    p.colorOffset = st.colorOffset || 0;
    p.text = st.text;
    p.media = st.media;

    p.fx.kaleidoEnabled = st.fx.kaleidoscope.enabled;
    p.fx.kaleidoWet = st.fx.kaleidoscope.wet;
    p.fx.kaleidoAxes = st.fx.kaleidoscope.axes;
    p.fx.rgbShiftEnabled = st.fx.rgbShift.enabled;
    p.fx.rgbShiftWet = st.fx.rgbShift.wet;
    p.fx.feedbackEnabled = st.fx.feedback.enabled;
    p.fx.feedbackWet = st.fx.feedback.wet;
    p.fx.glitchEnabled = st.fx.glitch.enabled;
    p.fx.glitchWet = st.fx.glitch.wet;
    p.fx.pixelateEnabled = st.fx.pixelate.enabled;
    p.fx.pixelateWet = st.fx.pixelate.wet;
    p.fx.flashMomentary = st.fx.flashMomentary;
    p.fx.invertKill = st.fx.invertKill;
    p.fx.bwMonochrome = st.fx.bwMonochrome;
    p.fx.blackout = st.fx.blackout;
    p.fx.strobeBurst = st.fx.strobeBurst;

    // Fast path: direct window function call or postMessage if popup is open
    if (this.projectorWindow && !this.projectorWindow.closed) {
      try {
        if (typeof this.projectorWindow.__aetherApplySyncPacket === 'function') {
          this.projectorWindow.__aetherApplySyncPacket(p);
        } else {
          this.projectorWindow.postMessage(p, '*');
        }
      } catch (_) {
        this.projectorWindow.postMessage(p, '*');
      }
    }
    if (this.channel) {
      this.channel.postMessage(p);
    }
  }

  applyPacketToState(p) {
    this.lastMasterSyncTime = performance.now();
    const st = this.state;
    st.renderTime = p.renderTime;
    st.accumulatedPhase = p.accumulatedPhase;
    st.entropySeed = p.entropySeed;
    st.shapeMode = p.shapeMode || 0;
    st.styleMode = p.styleMode || 0;
    st.sweepMode = p.sweepMode || 0;
    st.weightMode = p.weightMode !== undefined ? p.weightMode : 1;
    st.resolutionScale = p.resolutionScale;
    st.bgMode = p.bgMode;
    st.deckA = p.deckA;
    st.deckB = p.deckB;
    st.crossfade = p.crossfade;
    st.paletteActive = p.paletteActive;
    st.paletteTarget = p.paletteTarget;
    st.paletteMix = p.paletteMix;

    for (let i = 0; i < MACRO_DEFS.length; i++) {
      const k = MACRO_DEFS[i].key;
      if (p.macros[k] !== undefined) {
        st.macros[k].modulated = p.macros[k];
      }
    }

    st.bpm.beatPhase = p.bpm.beatPhase;
    st.bpm.barPhase = p.bpm.barPhase;
    st.bpm.syncPulse = p.bpm.syncPulse;
    if (typeof p.bpm.value === 'number') st.bpm.value = p.bpm.value;
    if (typeof p.bpm.multiplier === 'number') st.bpm.multiplier = p.bpm.multiplier;

    st.audio.bass = p.audio.bass;
    st.audio.mid = p.audio.mid;
    st.audio.high = p.audio.high;

    if (!st.fx.effect3d) st.fx.effect3d = { mode: 0, amount: 0.55 };
    st.fx.effect3d.mode = p.fx.effect3dMode || 0;
    st.fx.effect3d.amount = p.fx.effect3dAmount !== undefined ? p.fx.effect3dAmount : 0.55;

    if (!st.fx.logo) st.fx.logo = {};
    st.fx.logo.enabled = Boolean(p.fx.logoEnabled);
    st.fx.logo.fxMode = p.fx.logoFxMode || 0;
    st.fx.logo.scale = p.fx.logoScale !== undefined ? p.fx.logoScale : 0.44;
    st.fx.logo.opacity = p.fx.logoOpacity !== undefined ? p.fx.logoOpacity : 0.96;
    st.fx.logo.backdrop = p.fx.logoBackdrop !== undefined ? p.fx.logoBackdrop : 0.65;
    st.fx.logo.pos = p.fx.logoPos || 0;
    st.fx.logo.tint = Boolean(p.fx.logoTint);
    st.fx.logo.aspect = p.fx.logoAspect || 2.4;
    if (p.fx.logoVersion !== undefined && p.fx.logoVersion !== this._lastSyncedLogoVersion) {
      this._lastSyncedLogoVersion = p.fx.logoVersion;
      try {
        const cached = localStorage.getItem('aether_vj_logo_data');
        if (cached !== null) st.logoDataUrl = cached;
      } catch (_) {}
    }

    if (p.fx.mapping) {
      st.fx.mapping = Object.assign(st.fx.mapping || {}, p.fx.mapping);
    }
    if (p.fx.output) {
      st.fx.output = Object.assign(st.fx.output || {}, p.fx.output);
    }
    st.fx.safeStrobe = p.fx.safeStrobe !== false;
    st.calmColor = p.calmColor !== false;
    if (typeof p.colorPhase === 'number') st.colorPhase = p.colorPhase;
    if (typeof p.colorOffset === 'number') st.colorOffset = p.colorOffset;
    if (p.fx.edgeBlend) {
      st.fx.edgeBlend = Object.assign(st.fx.edgeBlend || {}, p.fx.edgeBlend);
      // Esta ventana puede ser el proyector izquierdo/derecho aunque la consola diga otra cosa
      if (this.edgeModeOverride !== null) st.fx.edgeBlend.mode = this.edgeModeOverride;
    }
    if (p.text) {
      st.text = Object.assign(st.text || {}, p.text);
    }
    if (p.media) {
      st.media = Object.assign(st.media || {}, p.media);
    }

    st.fx.kaleidoscope.enabled = p.fx.kaleidoEnabled;
    st.fx.kaleidoscope.wet = p.fx.kaleidoWet;
    st.fx.kaleidoscope.axes = p.fx.kaleidoAxes;
    st.fx.rgbShift.enabled = p.fx.rgbShiftEnabled;
    st.fx.rgbShift.wet = p.fx.rgbShiftWet;
    st.fx.feedback.enabled = p.fx.feedbackEnabled;
    st.fx.feedback.wet = p.fx.feedbackWet;
    st.fx.glitch.enabled = p.fx.glitchEnabled;
    st.fx.glitch.wet = p.fx.glitchWet;
    st.fx.pixelate.enabled = p.fx.pixelateEnabled;
    st.fx.pixelate.wet = p.fx.pixelateWet;
    st.fx.flashMomentary = p.fx.flashMomentary;
    st.fx.invertKill = p.fx.invertKill;
    st.fx.bwMonochrome = p.fx.bwMonochrome;
    st.fx.blackout = p.fx.blackout;
    st.fx.strobeBurst = p.fx.strobeBurst;
  }
}


// ==================== MODULE: js/ui/consoleController.js ====================
/**
 * AETHER-VJ: Industrial Console UI Controller (grandMA / Resolume Arena Aesthetic)
 * Supports 32 Generators across 4 Banks (GEO, KIN, FLT, SPC),
 * Pure Flat Render Style (Zero Glow / Zero FX), SDF Primitive Override,
 * Dynamic Line-Weight Engine (Thin <-> Giant), and L->R Stage Sweeps.
 */
class ConsoleController {
  constructor(state, autopilot, audioAnalyzer, syncBridge) {
    this.state = state;
    this.autopilot = autopilot;
    this.audioAnalyzer = audioAnalyzer;
    this.syncBridge = syncBridge;

    this.dom = {};
    this.macroDom = {};
    this.shapeButtons = [];
    this.styleButtons = [];
    this.weightButtons = [];
    this.sweepButtons = [];
    this.effect3dButtons = [];
    this.logoFxButtons = [];
    this.logoPosButtons = [];
    this.sliceModeButtons = [];
    this.presetButtons = [];
    this.presetArmMode = null;     // null | 'save' | 'clear'
    this._presetSignature = '';
    this.midiClock = null;         // Assigned by main.js after construction
    this.genButtonsA = {};
    this.genButtonsB = {};
    this.directSceneBtns = {};
    this.paletteButtons = [];

    // v2: Texto, Vídeo/Cámara, Transiciones, Corner-pin, Máscaras y Edge Blending
    this.v2 = {
      textFontBtns: [], textFxBtns: [], textPosBtns: [], textColorBtns: [],
      mediaBlendBtns: [], mediaFxBtns: [], transitionBtns: [], edgeModeBtns: []
    };
    this._uiCache = Object.create(null);
    this.logoBgRemove = 'auto';
    try {
      const savedBg = localStorage.getItem('aether_vj_logo_bgremove');
      if (['auto', 'white', 'black', 'none'].includes(savedBg)) this.logoBgRemove = savedBg;
    } catch (_) {}
    this.cornerProj = 0;            // 0 = proyector 1 (corners) | 1 = proyector 2 (corners2)
    this.cornerSel = 0;             // esquina seleccionada 0..3 (TL, TR, BR, BL)
    this.maskSel = 0;               // máscara seleccionada 0..3
    this._cornerDrag = null;
    this._editorSig = '';
    this._mediaBusy = '';
    this._mediaLibItems = [];
    this._isHttp = typeof location !== 'undefined' && String(location.protocol).startsWith('http');

    this._buildShapeSelector();
    this._buildStyleSelector();
    this._buildWeightSelector();
    this._buildSweepSelector();
    this._buildEffect3DSelector();
    this._buildLogoSelectors();
    this._buildSliceSelectors();
    this._buildPresetPads();
    this._buildMacroStrips();
    this._buildGeneratorBanks();
    this._buildPaletteGrid();
    this._buildV2Selectors();
    this._cacheStaticDom();
    this._cacheV2Dom();
    this._bindEvents();
    this._bindV2Events();
    this._bindKeyboardShortcuts();
    if (this._isHttp) this._refreshMediaLibrary();
  }

  _buildShapeSelector() {
    const grid = document.getElementById('shape-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.shapeButtons = [];

    SHAPE_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-shape-mode ${this.state.shapeMode === mode.id ? 'active' : ''}`;
      btn.innerHTML = `<span class="shape-icon">${mode.icon}</span><span class="shape-name">${mode.name}</span>`;
      btn.title = `Force SDF Geometry to ${mode.name}`;
      btn.addEventListener('click', () => {
        this.state.shapeMode = mode.id;
      });
      grid.appendChild(btn);
      this.shapeButtons.push({ id: mode.id, el: btn });
    });
  }

  _buildStyleSelector() {
    const grid = document.getElementById('style-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.styleButtons = [];

    STYLE_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-style-mode ${this.state.styleMode === mode.id ? 'active' : ''}`;
      btn.textContent = mode.name;
      btn.title = `Render Style: ${mode.name} (Hotkey: P)`;
      btn.addEventListener('click', () => {
        this.state.styleMode = mode.id;
        if (mode.id === 1) {
          // 100% Flat mode also turns off Post-FX for pure graphic crispness
          this._disableAllPostFx();
        }
      });
      grid.appendChild(btn);
      this.styleButtons.push({ id: mode.id, el: btn });
    });
  }

  _disableAllPostFx() {
    const fx = this.state.fx;
    fx.kaleidoscope.enabled = false;
    fx.rgbShift.enabled = false;
    fx.feedback.enabled = false;
    fx.glitch.enabled = false;
    fx.pixelate.enabled = false;
  }

  _buildWeightSelector() {
    const grid = document.getElementById('weight-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.weightButtons = [];

    WEIGHT_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-weight-mode ${this.state.weightMode === mode.id ? 'active' : ''}`;
      btn.textContent = mode.name;
      btn.title = `Line Weight Mode: ${mode.name} (Hotkey: W)`;
      btn.addEventListener('click', () => {
        this.state.weightMode = mode.id;
      });
      grid.appendChild(btn);
      this.weightButtons.push({ id: mode.id, el: btn });
    });
  }

  _buildSweepSelector() {
    const grid = document.getElementById('sweep-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.sweepButtons = [];

    SWEEP_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-sweep-mode ${this.state.sweepMode === mode.id ? 'active' : ''}`;
      btn.textContent = mode.name;
      btn.title = `Directional Sweep Overlay: ${mode.name} (Hotkey: Q)`;
      btn.addEventListener('click', () => {
        this.state.sweepMode = mode.id;
      });
      grid.appendChild(btn);
      this.sweepButtons.push({ id: mode.id, el: btn });
    });
  }

  _buildEffect3DSelector() {
    const grid = document.getElementById('effect3d-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.effect3dButtons = [];
    if (!this.state.fx.effect3d) {
      this.state.fx.effect3d = { mode: 0, amount: 0.55 };
    }

    EFFECT_3D_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-style-mode ${this.state.fx.effect3d.mode === mode.id ? 'active' : ''}`;
      btn.textContent = mode.name;
      btn.title = `Efecto 3D en Vivo: ${mode.name} (Tecla: E)`;
      btn.addEventListener('click', () => {
        this.state.fx.effect3d.mode = mode.id;
      });
      grid.appendChild(btn);
      this.effect3dButtons.push({ id: mode.id, el: btn });
    });
  }

  _buildLogoSelectors() {
    const fxGrid = document.getElementById('logo-fx-grid');
    if (fxGrid) {
      fxGrid.innerHTML = '';
      this.logoFxButtons = [];
      LOGO_FX_MODES.forEach((mode) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn-weight-mode ${this.state.fx.logo.fxMode === mode.id ? 'active' : ''}`;
        btn.textContent = mode.name;
        btn.addEventListener('click', () => {
          this.state.fx.logo.fxMode = mode.id;
          this.state.fx.logo.enabled = true;
        });
        fxGrid.appendChild(btn);
        this.logoFxButtons.push({ id: mode.id, el: btn });
      });
    }

    const posGrid = document.getElementById('logo-pos-grid');
    if (posGrid) {
      posGrid.innerHTML = '';
      this.logoPosButtons = [];
      LOGO_POS_MODES.forEach((mode) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn-sweep-mode ${this.state.fx.logo.pos === mode.id ? 'active' : ''}`;
        btn.textContent = mode.name;
        btn.addEventListener('click', () => {
          this.state.fx.logo.pos = mode.id;
        });
        posGrid.appendChild(btn);
        this.logoPosButtons.push({ id: mode.id, el: btn });
      });
    }
  }

  _buildSliceSelectors() {
    const grid = document.getElementById('slice-mode-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.sliceModeButtons = [];
    if (!this.state.fx.mapping) {
      this.state.fx.mapping = {
        offsetX: 0.0, offsetY: 0.0, scaleX: 1.0, scaleY: 1.0,
        keystoneX: 0.0, keystoneY: 0.0, sliceMode: 0, sliceCount: 3,
        sliceGap: 0.04, sliceClone: true, showTestGrid: false
      };
    }

    SLICE_MODES.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-weight-mode ${this.state.fx.mapping.sliceMode === mode.id ? 'active' : ''}`;
      btn.textContent = mode.name;
      btn.addEventListener('click', () => {
        this.state.fx.mapping.sliceMode = mode.id;
      });
      grid.appendChild(btn);
      this.sliceModeButtons.push({ id: mode.id, el: btn });
    });
  }

  _buildPresetPads() {
    const grid = document.getElementById('preset-pad-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.presetButtons = [];

    for (let i = 0; i < this.state.presets.length; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-preset-pad';
      btn.addEventListener('click', () => this._onPresetPadClick(i));
      grid.appendChild(btn);
      this.presetButtons.push(btn);
    }
    this._presetSignature = '';
    this._refreshPresetPads();
  }

  _onPresetPadClick(slot) {
    const st = this.state;
    const btn = this.presetButtons[slot];
    if (this.presetArmMode === 'save') {
      st.presets[slot] = capturePreset(st);
      this.presetArmMode = null;
    } else if (this.presetArmMode === 'clear') {
      st.presets[slot] = null;
      this.presetArmMode = null;
    } else if (st.presets[slot]) {
      // Mismo camino que el móvil: RECALL_PRESET aplica la transición sincronizada (state.transition.bars)
      if (this.syncBridge && typeof this.syncBridge._applyRemoteCommand === 'function') {
        this._cmd({ action: 'RECALL_PRESET', slot });
      } else {
        applyPreset(st, this.autopilot, st.presets[slot]);
      }
      this._buildGeneratorBanks();
      this._populateTriggerOptions();
      this._syncMacroLfoButtons();
    } else {
      // Empty slot tapped without arming: save directly there (fastest workflow during a show)
      st.presets[slot] = capturePreset(st);
    }
    if (btn) {
      btn.classList.add('just-used');
      setTimeout(() => btn.classList.remove('just-used'), 450);
    }
    this._presetSignature = '';
  }

  _refreshPresetPads() {
    const st = this.state;
    const sig = st.presets.map((p) => (p ? p.name + p.savedAt : '-')).join('|') + '#' + this.presetArmMode;
    if (sig === this._presetSignature) return;
    this._presetSignature = sig;

    const grid = document.getElementById('preset-pad-grid');
    if (grid) {
      grid.classList.toggle('save-armed', this.presetArmMode === 'save');
      grid.classList.toggle('clear-armed', this.presetArmMode === 'clear');
    }
    for (let i = 0; i < this.presetButtons.length; i++) {
      const p = st.presets[i];
      const btn = this.presetButtons[i];
      btn.classList.toggle('filled', Boolean(p));
      btn.innerHTML = `<span class="preset-num">${i + 1}</span>${p ? this._escapeHtml(p.name) : 'VACÍO'}`;
      btn.title = p
        ? `Cargar look: ${p.name}`
        : 'Casilla vacía: tócala para guardar aquí el look actual';
    }
    const d = this.dom || {};
    if (d.presetModeTag) {
      d.presetModeTag.textContent = this.presetArmMode === 'save'
        ? 'ELIGE CASILLA PARA GUARDAR'
        : (this.presetArmMode === 'clear' ? 'ELIGE CASILLA PARA BORRAR' : 'TOCA PARA CARGAR');
    }
    d.btnPresetSaveArm?.classList.toggle('armed-save', this.presetArmMode === 'save');
    d.btnPresetClearArm?.classList.toggle('armed-clear', this.presetArmMode === 'clear');
  }

  _escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _syncMacroLfoButtons() {
    for (const def of MACRO_DEFS) {
      const m = this.state.macros[def.key];
      const mDom = this.macroDom[def.key];
      if (!mDom) continue;
      mDom.waveBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-wave') === m.lfoWave));
      if (mDom.depthEl) mDom.depthEl.value = m.lfoDepth;
      if (mDom.rateEl) mDom.rateEl.value = m.lfoRate;
      if (mDom.audioBandEl) mDom.audioBandEl.value = m.audioBand;
    }
  }

  _triggerPanic() {
    this.autopilot.applyPanic();
    this.presetArmMode = null;
    this._presetSignature = '';
    this.state.activeBankTab = 'FLT';
    this._buildGeneratorBanks();
    this._populateTriggerOptions();
    this._syncMacroLfoButtons();
  }

  _processUploadedLogoFile(file) {
    if (!file) return;
    const bgRemove = this.logoBgRemove || 'auto';
    const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
    const reader = new FileReader();

    const finish = (src, fixedW, fixedH) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let w = fixedW || img.naturalWidth || img.width || 512;
        let h = fixedH || img.naturalHeight || img.height || 512;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const c = document.createElement('canvas');
        c.width = Math.max(16, w);
        c.height = Math.max(16, h);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);

        // El recorte de fondo (auto / blanco / negro) lo hace el motor al recibir UPLOAD_LOGO,
        // así el móvil y la consola comparten exactamente el mismo algoritmo.
        let pngDataUrl = '';
        try {
          pngDataUrl = c.toDataURL('image/png');
        } catch (_) {
          return;
        }
        this.state.fx.logo.aspect = Math.max(0.25, Math.min(4.5, c.width / c.height));
        this.state.fx.logo.enabled = true;
        this._cmd({
          action: 'UPLOAD_LOGO',
          dataUrl: pngDataUrl,
          slot: this.state.fx.logo.activeSlot,
          bgRemove
        });
      };
      img.src = src;
    };

    if (isSvg) {
      reader.onload = (ev) => {
        const raster = this._prepareSvgForRaster(String(ev.target.result || ''), 1024);
        if (raster) finish(raster.src, raster.w, raster.h);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (ev) => finish(ev.target.result, 0, 0);
      reader.readAsDataURL(file);
    }
  }

  /**
   * Convierte el texto de un SVG en un data-URL con tamaño explícito (lado mayor = maxDim px)
   * para poder rasterizarlo nítido a PNG aunque el SVG no declare width/height.
   */
  _prepareSvgForRaster(svgText, maxDim) {
    try {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
        return null;
      }
      const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      const hasVb = vb.length === 4 && vb[2] > 0 && vb[3] > 0;
      const rawW = svg.getAttribute('width') || '';
      const rawH = svg.getAttribute('height') || '';
      const w = rawW.endsWith('%') ? 0 : parseFloat(rawW);
      const h = rawH.endsWith('%') ? 0 : parseFloat(rawH);
      let aspect = 1;
      if (hasVb) {
        aspect = vb[2] / vb[3];
      } else if (w > 0 && h > 0) {
        aspect = w / h;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      aspect = Math.max(0.05, Math.min(20, aspect));
      const outW = aspect >= 1 ? maxDim : Math.max(16, Math.round(maxDim * aspect));
      const outH = aspect >= 1 ? Math.max(16, Math.round(maxDim / aspect)) : maxDim;
      svg.setAttribute('width', String(outW));
      svg.setAttribute('height', String(outH));
      if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const str = new XMLSerializer().serializeToString(svg);
      return { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str), w: outW, h: outH };
    } catch (_) {
      return null;
    }
  }

  _buildMacroStrips() {
    const container = document.getElementById('macro-fader-bank');
    if (!container) return;
    container.innerHTML = '';

    for (const def of MACRO_DEFS) {
      const m = this.state.macros[def.key];
      const strip = document.createElement('div');
      strip.className = 'fader-strip';
      strip.innerHTML = `
        <div class="fader-header">
          <span class="fader-code">${def.code}</span>
          <span class="fader-val-readout" id="val-${def.key}">0.50</span>
        </div>
        <div class="fader-title" title="${def.sub}">${def.name}</div>
        <div class="fader-sub">${def.sub}</div>

        <div class="fader-track-wrap" id="track-wrap-${def.key}">
          <div class="fader-led-meter">
            <div class="fader-led-fill" id="led-fill-${def.key}"></div>
            <div class="fader-base-marker" id="base-marker-${def.key}"></div>
          </div>
          <input
            type="range"
            class="macro-range-input"
            id="input-${def.key}"
            min="0"
            max="1"
            step="0.001"
            value="${m.base}"
            aria-label="${def.name}"
          />
          <div class="fader-mod-cap" id="mod-cap-${def.key}"></div>
        </div>

        <div class="bar-step-mini-box">
          <div class="bar-step-label-row">
            <span>SALTO COMPÁS</span>
            <span id="bar-step-tag-${def.key}" style="color:var(--accent-amber)">${m.barStepBars > 0 ? m.barStepBars + 'C' : 'MANUAL'}</span>
          </div>
          <div class="bar-step-row" id="bar-steps-${def.key}" title="Cambia este control de golpe cada X compases (OFF = fijo/manual, 1C, 4C, 8C o 16C)">
            <button type="button" class="btn-bar-step ${(m.barStepBars || 0) === 0 ? 'active' : ''}" data-bars="0">OFF</button>
            <button type="button" class="btn-bar-step ${m.barStepBars === 1 ? 'active' : ''}" data-bars="1">1C</button>
            <button type="button" class="btn-bar-step ${m.barStepBars === 4 ? 'active' : ''}" data-bars="4">4C</button>
            <button type="button" class="btn-bar-step ${m.barStepBars === 8 ? 'active' : ''}" data-bars="8">8C</button>
            <button type="button" class="btn-bar-step ${m.barStepBars === 16 ? 'active' : ''}" data-bars="16">16C</button>
          </div>
          <div class="audio-route-row">
            <span class="route-label">AUDIO</span>
            <select class="audio-band-select" id="audio-band-${def.key}">
              <option value="none" ${m.audioBand === 'none' ? 'selected' : ''}>OFF</option>
              <option value="bass" ${m.audioBand === 'bass' ? 'selected' : ''}>BASS</option>
              <option value="mid" ${m.audioBand === 'mid' ? 'selected' : ''}>MID</option>
              <option value="high" ${m.audioBand === 'high' ? 'selected' : ''}>HIGH</option>
            </select>
          </div>
        </div>

        <div class="lfo-mini-box">
          <div class="lfo-wave-row" id="lfo-waves-${def.key}">
            ${LFO_WAVES.map((w) => `
              <button type="button" class="btn-lfo-wave ${m.lfoWave === w ? 'active' : ''}" data-wave="${w}">
                ${w === 'PERLIN' ? 'NOI' : w.slice(0, 3)}
              </button>
            `).join('')}
          </div>
          <div class="lfo-knobs-row">
            <label class="mini-param">
              <span>DEP</span>
              <input type="range" class="mini-slider" id="lfo-depth-${def.key}" min="0" max="1" step="0.01" value="${m.lfoDepth}" />
            </label>
            <label class="mini-param">
              <span>SPD</span>
              <input type="range" class="mini-slider" id="lfo-rate-${def.key}" min="0" max="1" step="0.01" value="${m.lfoRate}" />
            </label>
          </div>
        </div>
      `;

      container.appendChild(strip);

      const inputEl = strip.querySelector(`#input-${def.key}`);
      const valEl = strip.querySelector(`#val-${def.key}`);
      const ledFillEl = strip.querySelector(`#led-fill-${def.key}`);
      const baseMarkerEl = strip.querySelector(`#base-marker-${def.key}`);
      const modCapEl = strip.querySelector(`#mod-cap-${def.key}`);
      const barStepBtns = Array.from(strip.querySelectorAll('.btn-bar-step'));
      const barStepTagEl = strip.querySelector(`#bar-step-tag-${def.key}`);
      const waveBtns = Array.from(strip.querySelectorAll('.btn-lfo-wave'));
      const depthEl = strip.querySelector(`#lfo-depth-${def.key}`);
      const rateEl = strip.querySelector(`#lfo-rate-${def.key}`);
      const audioBandEl = strip.querySelector(`#audio-band-${def.key}`);

      this.macroDom[def.key] = {
        inputEl,
        valEl,
        ledFillEl,
        baseMarkerEl,
        modCapEl,
        barStepBtns,
        barStepTagEl,
        waveBtns,
        depthEl,
        rateEl,
        audioBandEl
      };

      inputEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.macros[def.key].base = val;
        this.autopilot.macroBaseTargets[def.key] = val;
      });

      inputEl.addEventListener('dblclick', () => {
        this.state.macros[def.key].base = def.defaultVal;
        this.state.macros[def.key].barStepBars = 0;
        this.autopilot.macroBaseTargets[def.key] = def.defaultVal;
        inputEl.value = def.defaultVal;
      });

      barStepBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const bars = parseInt(btn.getAttribute('data-bars'), 10) || 0;
          this._cmd({ action: 'SET_MACRO_BAR_STEP', key: def.key, bars });
        });
      });

      waveBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const wave = btn.getAttribute('data-wave');
          this.state.macros[def.key].lfoWave = wave;
          waveBtns.forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      depthEl.addEventListener('input', (e) => {
        this.state.macros[def.key].lfoDepth = parseFloat(e.target.value);
      });

      rateEl.addEventListener('input', (e) => {
        this.state.macros[def.key].lfoRate = parseFloat(e.target.value);
      });

      audioBandEl.addEventListener('change', (e) => {
        const band = e.target.value;
        this.state.macros[def.key].audioBand = band;
        if (band !== 'none' && this.state.macros[def.key].audioAmount < 0.1) {
          this.state.macros[def.key].audioAmount = 0.35;
        }
      });
    }
  }

  _buildGeneratorBanks() {
    const bankA = document.getElementById('deck-a-generators');
    const bankB = document.getElementById('deck-b-generators');
    const directMorphBank = document.getElementById('direct-scene-matrix');

    if (bankA) bankA.innerHTML = '';
    if (bankB) bankB.innerHTML = '';
    if (directMorphBank) directMorphBank.innerHTML = '';

    this.genButtonsA = {};
    this.genButtonsB = {};
    this.directSceneBtns = {};

    const activeBank = this.state.activeBankTab || 'FLT';
    const visibleGens = GENERATORS.filter((g) => g.bank === activeBank);

    visibleGens.forEach((gen, localIdx) => {
      if (bankA) {
        const btnA = document.createElement('button');
        btnA.type = 'button';
        btnA.className = 'btn-gen-slot';
        btnA.innerHTML = `<span class="gen-slot-id">A${gen.id + 1}</span><span class="gen-slot-name">${gen.shortName}</span>`;
        btnA.title = `${gen.name} — ${gen.description}`;
        btnA.addEventListener('click', () => {
          this.state.deckA = gen.id;
        });
        bankA.appendChild(btnA);
        this.genButtonsA[gen.id] = btnA;
      }

      if (bankB) {
        const btnB = document.createElement('button');
        btnB.type = 'button';
        btnB.className = 'btn-gen-slot';
        btnB.innerHTML = `<span class="gen-slot-id">B${gen.id + 1}</span><span class="gen-slot-name">${gen.shortName}</span>`;
        btnB.title = `${gen.name} — ${gen.description}`;
        btnB.addEventListener('click', () => {
          this.state.deckB = gen.id;
        });
        bankB.appendChild(btnB);
        this.genButtonsB[gen.id] = btnB;
      }

      if (directMorphBank) {
        const pad = document.createElement('button');
        pad.type = 'button';
        pad.className = 'btn-scene-pad';
        pad.innerHTML = `
          <div class="pad-top">
            <span class="pad-code">${gen.code} [${localIdx + 1}]</span>
            <span class="pad-led"></span>
          </div>
          <div class="pad-name">${gen.shortName}</div>
          <div class="pad-cat">${gen.category}</div>
        `;
        pad.title = `${gen.name} — ${gen.description} (Hotkey: ${localIdx + 1})`;
        pad.addEventListener('click', () => {
          this.autopilot.triggerNextScene(gen.id);
        });
        directMorphBank.appendChild(pad);
        this.directSceneBtns[gen.id] = pad;
      }
    });

    const titleEl = document.getElementById('matrix-bank-title');
    if (titleEl) {
      if (activeBank === 'FLT') {
        titleEl.textContent = 'FAMILIA 1: GEOMETRÍA 100% PLANA (SIN BRILLO NI EFECTOS)';
      } else if (activeBank === 'MIN') {
        titleEl.textContent = 'FAMILIA 2: ARCOS, ECLIPSES, METRÓNOMO Y MINIMALISMO';
      } else if (activeBank === 'MOT') {
        titleEl.textContent = 'FAMILIA 3: CORTINAS DE ESCENARIO, MARCO 4 ESQUINAS Y SIMETRÍA';
      } else if (activeBank === 'GEO') {
        titleEl.textContent = 'FAMILIA 4: FORMAS GEOMÉTRICAS 2D (CUADRADOS, TRIÁNGULOS Y POLÍGONOS)';
      } else if (activeBank === 'KIN') {
        titleEl.textContent = 'FAMILIA 5: LÍNEAS DE GROSOR VARIABLE Y BARRIDOS IZQ ➔ DER';
      } else {
        titleEl.textContent = 'FAMILIA 6: OBJETOS 3D VOLUMÉTRICOS (CUBO, PIRÁMIDE, ESFERA, GIROSCOPIO Y PÓRTICOS)';
      }
    }
  }

  _buildPaletteGrid() {
    const grid = document.getElementById('palette-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.paletteButtons = [];

    PALETTES.forEach((pal) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-palette-swatch';
      const grad = `linear-gradient(90deg, ${pal.preview[0]} 0%, ${pal.preview[1]} 50%, ${pal.preview[2]} 100%)`;
      btn.innerHTML = `
        <span class="swatch-bar" style="background: ${grad}"></span>
        <span class="swatch-label">${pal.name}</span>
      `;
      btn.addEventListener('click', () => {
        this.state.paletteActive = this.state.paletteTarget;
        this.state.paletteTarget = pal.id;
        this.state.paletteMix = 0.0;
      });
      grid.appendChild(btn);
      this.paletteButtons.push(btn);
    });
  }

  _cacheStaticDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = {
      consoleRoot: $('console-ui-overlay'),
      hudMinimal: $('minimal-hud-pill'),
      fpsReadout: $('hud-fps'),
      frameMsReadout: $('hud-framems'),
      sessionClock: $('hud-session-clock'),
      activeSceneReadout: $('hud-active-scene'),
      projectorStatusLed: $('projector-status-led'),
      projectorStatusText: $('projector-status-text'),

      bankTabBtns: Array.from(document.querySelectorAll('.btn-bank-tab')),
      apPoolBtns: Array.from(document.querySelectorAll('.btn-ap-pool')),

      crossfaderInput: $('master-crossfader'),
      crossfaderVal: $('crossfader-val'),
      btnNextScene: $('btn-next-scene'),
      btnMutateMacros: $('btn-mutate-macros'),
      btnAutoBarSteps: $('btn-auto-bar-steps'),

      btnAutopilotToggle: $('btn-autopilot-toggle'),
      btnLfoMasterToggle: $('btn-lfo-master-toggle'),
      btnAutoPaletteToggle: $('btn-auto-palette-toggle'),
      autopilotModeBtns: Array.from(document.querySelectorAll('.btn-ap-mode')),
      triggerUnitBtns: Array.from(document.querySelectorAll('.btn-trigger-unit')),
      triggerValueSelect: $('ap-trigger-value'),
      sceneProgressFill: $('ap-scene-progress-fill'),
      sceneProgressLabel: $('ap-scene-progress-label'),
      scenesPlayedCounter: $('ap-scenes-played'),

      btnFxCleanBypass: $('btn-fx-clean-bypass'),
      effect3dAmountSlider: $('effect3d-amount-slider'),
      effect3dAmountVal: $('effect3d-amount-val'),

      logoFileInput: $('logo-file-input'),
      btnLogoToggle: $('btn-logo-toggle'),
      btnLogoUpload: $('btn-logo-upload'),
      btnLogoTint: $('btn-logo-tint'),
      logoSlotBtns: Array.from(document.querySelectorAll('.btn-logo-slot')),
      logoScaleSlider: $('logo-scale-slider'),
      logoScaleVal: $('logo-scale-val'),
      logoBackdropSlider: $('logo-backdrop-slider'),
      logoBackdropVal: $('logo-backdrop-val'),

      btnMapReset: $('btn-map-reset'),
      btnMapTestGrid: $('btn-map-testgrid'),
      btnSliceClone: $('btn-slice-clone'),
      sliceCountBtns: Array.from(document.querySelectorAll('.btn-slice-count')),
      sliceGapSlider: $('slice-gap-slider'),
      mapOffsetX: $('map-offset-x'),
      mapOffsetXVal: $('map-offset-x-val'),
      mapOffsetY: $('map-offset-y'),
      mapOffsetYVal: $('map-offset-y-val'),
      mapScaleX: $('map-scale-x'),
      mapScaleXVal: $('map-scale-x-val'),
      mapScaleY: $('map-scale-y'),
      mapScaleYVal: $('map-scale-y-val'),
      mapKeystoneX: $('map-keystone-x'),
      mapKeystoneXVal: $('map-keystone-x-val'),
      mapKeystoneY: $('map-keystone-y'),
      mapKeystoneYVal: $('map-keystone-y-val'),
      outBrightness: $('out-brightness'),
      outBrightnessVal: $('out-brightness-val'),
      outColorTemp: $('out-colortemp'),
      outColorTempVal: $('out-colortemp-val'),
      persistStatus: $('persist-status'),

      btnPanic: $('btn-panic'),
      presetModeTag: $('preset-mode-tag'),
      btnPresetSaveArm: $('btn-preset-save-arm'),
      btnPresetClearArm: $('btn-preset-clear-arm'),
      btnMidiClock: $('btn-midi-clock'),
      btnSafeStrobe: $('btn-safe-strobe'),
      btnCalmColor: $('btn-calm-color'),
      btnResAuto: $('btn-res-auto'),

      fxKaleidoToggle: $('fx-kaleido-toggle'),
      fxKaleidoWet: $('fx-kaleido-wet'),
      fxKaleidoAxesBtns: Array.from(document.querySelectorAll('.btn-kaleido-axis')),
      fxRgbToggle: $('fx-rgb-toggle'),
      fxRgbWet: $('fx-rgb-wet'),
      fxFeedbackToggle: $('fx-feedback-toggle'),
      fxFeedbackWet: $('fx-feedback-wet'),
      fxGlitchToggle: $('fx-glitch-toggle'),
      fxGlitchWet: $('fx-glitch-wet'),
      fxPixelateToggle: $('fx-pixelate-toggle'),
      fxPixelateWet: $('fx-pixelate-wet'),

      btnKillFlash: $('btn-kill-flash'),
      btnKillStrobe: $('btn-kill-strobe'),
      btnKillMono: $('btn-kill-mono'),
      btnKillInvert: $('btn-kill-invert'),
      btnKillBlackout: $('btn-kill-blackout'),

      bpmReadout: $('bpm-value-readout'),
      bpmSlider: $('bpm-slider'),
      btnTapTempo: $('btn-tap-tempo'),
      btnBpmMinus: $('btn-bpm-minus'),
      btnBpmPlus: $('btn-bpm-plus'),
      bpmMultBtns: Array.from(document.querySelectorAll('.btn-bpm-mult')),
      beatLeds: Array.from(document.querySelectorAll('.beat-led-dot')),
      barCounterReadout: $('bpm-bar-counter'),

      btnAudioMic: $('btn-audio-mic'),
      btnAudioSim: $('btn-audio-sim'),
      audioGainSlider: $('audio-gain-slider'),
      meterBass: $('fft-meter-bass'),
      meterMid: $('fft-meter-mid'),
      meterHigh: $('fft-meter-high'),

      btnOpenProjector: $('btn-open-projector'),
      btnHideUi: $('btn-hide-ui'),
      btnRestoreUi: $('btn-restore-ui'),
      btnCalmPreset: $('btn-calm-preset'),
      btnToggleSimpleUi: $('btn-toggle-simple-ui'),
      btnOpenHelp: $('btn-open-help'),
      btnCloseHelp: $('btn-close-help'),
      helpModalBackdrop: $('help-modal-backdrop'),
      bgModeBtns: Array.from(document.querySelectorAll('.btn-bg-mode')),
      resScaleBtns: Array.from(document.querySelectorAll('.btn-res-scale'))
    };
  }

  _bindEvents() {
    const d = this.dom;
    const st = this.state;

    // Botón "🌿 CALMAR VISUAL" (Modo Evento Elegante)
    d.btnCalmPreset?.addEventListener('click', () => {
      this.autopilot.applyCalmStagePreset();
      // Actualizar visualmente los botones LFO/Audio de cada fader
      for (const def of MACRO_DEFS) {
        const m = st.macros[def.key];
        const mDom = this.macroDom[def.key];
        if (!mDom) continue;
        mDom.waveBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-wave') === m.lfoWave));
        if (mDom.audioBandEl) mDom.audioBandEl.value = m.audioBand;
      }
      this._populateTriggerOptions();
    });

    // Conmutador "✨ MODO: FÁCIL" <-> "🎛️ MODO: PRO"
    d.btnToggleSimpleUi?.addEventListener('click', () => {
      st.simpleUiMode = !st.simpleUiMode;
      document.body.classList.toggle('simple-ui-mode', st.simpleUiMode);
      if (d.btnToggleSimpleUi) {
        d.btnToggleSimpleUi.textContent = st.simpleUiMode ? '✨ MODO: FÁCIL' : '🎛️ MODO: PRO';
        d.btnToggleSimpleUi.classList.toggle('pro-active', !st.simpleUiMode);
      }
    });

    // Modal de Ayuda Rápida
    d.btnOpenHelp?.addEventListener('click', () => {
      d.helpModalBackdrop?.classList.remove('hidden');
    });
    d.btnCloseHelp?.addEventListener('click', () => {
      d.helpModalBackdrop?.classList.add('hidden');
    });
    d.helpModalBackdrop?.addEventListener('click', (e) => {
      if (e.target === d.helpModalBackdrop) {
        d.helpModalBackdrop.classList.add('hidden');
      }
    });

    d.bankTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.activeBankTab = btn.getAttribute('data-bank');
        this._buildGeneratorBanks();
      });
    });

    d.apPoolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.autopilotBankPool = btn.getAttribute('data-pool');
        if (['GEO', 'KIN', 'FLT', 'SPC', 'MIN', 'MOT'].includes(st.autopilotBankPool)) {
          st.activeBankTab = st.autopilotBankPool;
          this._buildGeneratorBanks();
        }
      });
    });

    d.btnFxCleanBypass?.addEventListener('click', () => {
      st.pureFlatBypassFx = !st.pureFlatBypassFx;
      if (st.pureFlatBypassFx) {
        this._disableAllPostFx();
      }
    });

    d.effect3dAmountSlider?.addEventListener('input', (e) => {
      if (!st.fx.effect3d) st.fx.effect3d = { mode: 0, amount: 0.55 };
      st.fx.effect3d.amount = parseFloat(e.target.value);
    });

    // Controles del Estudio de Logo PNG Dinámico
    d.btnLogoToggle?.addEventListener('click', () => {
      st.fx.logo.enabled = !st.fx.logo.enabled;
    });

    d.btnLogoUpload?.addEventListener('click', () => {
      d.logoFileInput?.click();
    });

    d.logoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this._processUploadedLogoFile(file);
        e.target.value = '';
      }
    });

    d.btnLogoTint?.addEventListener('click', () => {
      st.fx.logo.tint = !st.fx.logo.tint;
    });

    d.logoSlotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.getAttribute('data-slot'), 10) || 0;
        st.fx.logo.activeSlot = slot;
        if (st.logoSlots[slot]) {
          this.syncBridge.setLogoDataUrl(st.logoSlots[slot], slot);
          st.fx.logo.enabled = true;
        } else if (slot === 0) {
          this.syncBridge.setLogoDataUrl('', 0);
          st.fx.logo.enabled = true;
        } else {
          // Si la ranura está vacía, abre directamente el selector de archivos PNG para guardarlo ahí
          d.logoFileInput?.click();
        }
      });
    });

    d.logoScaleSlider?.addEventListener('input', (e) => {
      st.fx.logo.scale = parseFloat(e.target.value);
    });

    d.logoBackdropSlider?.addEventListener('input', (e) => {
      st.fx.logo.backdrop = parseFloat(e.target.value);
    });

    // Controles de Mapping de Pantalla (X/Y, Tamaño, Keystone) y Slices LED
    d.btnMapReset?.addEventListener('click', () => {
      // Se resetea en el sitio para conservar corner-pin, esquinas y máscaras (tienen su propio reset)
      if (!st.fx.mapping) st.fx.mapping = {};
      Object.assign(st.fx.mapping, {
        offsetX: 0.0,
        offsetY: 0.0,
        scaleX: 1.0,
        scaleY: 1.0,
        keystoneX: 0.0,
        keystoneY: 0.0,
        sliceMode: 0,
        sliceCount: 3,
        sliceGap: 0.04,
        sliceClone: true,
        showTestGrid: false,
        ledScalerEnabled: false
      });
    });

    d.btnMapTestGrid?.addEventListener('click', () => {
      st.fx.mapping.showTestGrid = !st.fx.mapping.showTestGrid;
    });

    d.btnSliceClone?.addEventListener('click', () => {
      st.fx.mapping.sliceClone = !st.fx.mapping.sliceClone;
    });

    d.sliceCountBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.fx.mapping.sliceCount = parseInt(btn.getAttribute('data-count'), 10) || 3;
      });
    });

    d.sliceGapSlider?.addEventListener('input', (e) => {
      st.fx.mapping.sliceGap = parseFloat(e.target.value);
    });

    const bindMapSlider = (el, prop, defaultVal) => {
      if (!el) return;
      el.addEventListener('input', (e) => {
        st.fx.mapping[prop] = parseFloat(e.target.value);
      });
      el.addEventListener('dblclick', () => {
        st.fx.mapping[prop] = defaultVal;
        el.value = defaultVal;
      });
    };

    bindMapSlider(d.mapOffsetX, 'offsetX', 0.0);
    bindMapSlider(d.mapOffsetY, 'offsetY', 0.0);
    bindMapSlider(d.mapScaleX, 'scaleX', 1.0);
    bindMapSlider(d.mapScaleY, 'scaleY', 1.0);
    bindMapSlider(d.mapKeystoneX, 'keystoneX', 0.0);
    bindMapSlider(d.mapKeystoneY, 'keystoneY', 0.0);

    // Salida de pantalla: brillo y temperatura de color
    const bindOutputSlider = (el, prop, defaultVal) => {
      if (!el) return;
      el.addEventListener('input', (e) => {
        st.fx.output[prop] = parseFloat(e.target.value);
      });
      el.addEventListener('dblclick', () => {
        st.fx.output[prop] = defaultVal;
        el.value = defaultVal;
      });
    };
    bindOutputSlider(d.outBrightness, 'brightness', 1.0);
    bindOutputSlider(d.outColorTemp, 'colorTemp', 0.0);

    // 🆘 Botón de pánico
    d.btnPanic?.addEventListener('click', () => {
      this._triggerPanic();
    });

    // ⭐ Presets: armar guardar / borrar
    d.btnPresetSaveArm?.addEventListener('click', () => {
      this.presetArmMode = this.presetArmMode === 'save' ? null : 'save';
      this._presetSignature = '';
    });
    d.btnPresetClearArm?.addEventListener('click', () => {
      this.presetArmMode = this.presetArmMode === 'clear' ? null : 'clear';
      this._presetSignature = '';
    });

    // 🎹 MIDI Clock
    d.btnMidiClock?.addEventListener('click', async () => {
      if (!this.midiClock) return;
      if (st.midi.enabled) {
        this.midiClock.disable();
      } else {
        const result = await this.midiClock.enable();
        if (!result.ok && d.btnMidiClock) {
          d.btnMidiClock.title = result.error;
          d.btnMidiClock.textContent = '🎹 MIDI: NO DISPONIBLE';
        }
      }
    });

    // 🛡 Límite de estrobo
    d.btnSafeStrobe?.addEventListener('click', () => {
      if (st.fx.safeStrobe !== false) {
        const confirmed = window.confirm(
          '¿Quitar el límite de 3 destellos por segundo?\n\n' +
          'Los estrobos rápidos pueden provocar crisis en personas con epilepsia fotosensible. ' +
          'Úsalo solo si el evento lo permite y está avisado.'
        );
        if (!confirmed) return;
        st.fx.safeStrobe = false;
      } else {
        st.fx.safeStrobe = true;
      }
    });

    // Color suave (anti-feria)
    d.btnCalmColor?.addEventListener('click', () => {
      this.syncBridge._applyRemoteCommand({ action: 'SET_CALM_COLOR', value: st.calmColor === false });
    });

    // Calidad automática
    d.btnResAuto?.addEventListener('click', () => {
      st.autoQuality = !st.autoQuality;
      if (st.autoQuality) st.resolutionScale = 1.0;
    });

    d.crossfaderInput?.addEventListener('input', (e) => {
      st.autoCrossfading = false;
      st.crossfade = parseFloat(e.target.value);
    });

    d.btnNextScene?.addEventListener('click', () => {
      this.autopilot.triggerNextScene();
    });

    d.btnMutateMacros?.addEventListener('click', () => {
      this.autopilot.randomizeMacrosNow();
    });

    d.btnAutoBarSteps?.addEventListener('click', () => {
      this._cmd({ action: 'SET_AUTO_BAR_STEPS_PRESET' });
    });

    d.btnAutopilotToggle?.addEventListener('click', () => {
      st.autopilot.enabled = !st.autopilot.enabled;
    });

    d.btnLfoMasterToggle?.addEventListener('click', () => {
      st.autopilot.lfoMasterEnabled = !st.autopilot.lfoMasterEnabled;
    });

    d.btnAutoPaletteToggle?.addEventListener('click', () => {
      st.autoRotatePalette = !st.autoRotatePalette;
    });

    d.autopilotModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (AUTOPILOT_MODES[mode]) {
          st.autopilot.mode = mode;
        }
      });
    });

    d.triggerUnitBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const unit = btn.getAttribute('data-unit');
        st.autopilot.triggerUnit = unit;
        this._populateTriggerOptions();
      });
    });

    d.triggerValueSelect?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (st.autopilot.triggerUnit === 'BARS') {
        st.autopilot.triggerBars = val;
      } else {
        st.autopilot.triggerSeconds = val;
      }
    });

    this._populateTriggerOptions();

    d.fxKaleidoToggle?.addEventListener('click', () => {
      st.fx.kaleidoscope.enabled = !st.fx.kaleidoscope.enabled;
    });
    d.fxKaleidoWet?.addEventListener('input', (e) => {
      st.fx.kaleidoscope.wet = parseFloat(e.target.value);
      if (st.fx.kaleidoscope.wet > 0.02) st.fx.kaleidoscope.enabled = true;
    });
    d.fxKaleidoAxesBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.fx.kaleidoscope.axes = parseInt(btn.getAttribute('data-axes'), 10);
        st.fx.kaleidoscope.enabled = true;
      });
    });

    d.fxRgbToggle?.addEventListener('click', () => {
      st.fx.rgbShift.enabled = !st.fx.rgbShift.enabled;
    });
    d.fxRgbWet?.addEventListener('input', (e) => {
      st.fx.rgbShift.wet = parseFloat(e.target.value);
      if (st.fx.rgbShift.wet > 0.02) st.fx.rgbShift.enabled = true;
    });

    d.fxFeedbackToggle?.addEventListener('click', () => {
      st.fx.feedback.enabled = !st.fx.feedback.enabled;
    });
    d.fxFeedbackWet?.addEventListener('input', (e) => {
      st.fx.feedback.wet = parseFloat(e.target.value);
      if (st.fx.feedback.wet > 0.02) st.fx.feedback.enabled = true;
    });

    d.fxGlitchToggle?.addEventListener('click', () => {
      st.fx.glitch.enabled = !st.fx.glitch.enabled;
    });
    d.fxGlitchWet?.addEventListener('input', (e) => {
      st.fx.glitch.wet = parseFloat(e.target.value);
      if (st.fx.glitch.wet > 0.02) st.fx.glitch.enabled = true;
    });

    d.fxPixelateToggle?.addEventListener('click', () => {
      st.fx.pixelate.enabled = !st.fx.pixelate.enabled;
    });
    d.fxPixelateWet?.addEventListener('input', (e) => {
      st.fx.pixelate.wet = parseFloat(e.target.value);
      if (st.fx.pixelate.wet > 0.02) st.fx.pixelate.enabled = true;
    });

    const bindMomentary = (btn, prop) => {
      if (!btn) return;
      const start = (e) => { e.preventDefault(); st.fx[prop] = true; };
      const end = () => { st.fx[prop] = false; };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end);
    };

    bindMomentary(d.btnKillFlash, 'flashMomentary');
    bindMomentary(d.btnKillStrobe, 'strobeBurst');

    d.btnKillMono?.addEventListener('click', () => {
      st.fx.bwMonochrome = !st.fx.bwMonochrome;
    });
    d.btnKillInvert?.addEventListener('click', () => {
      st.fx.invertKill = !st.fx.invertKill;
    });
    d.btnKillBlackout?.addEventListener('click', () => {
      st.fx.blackout = !st.fx.blackout;
    });

    d.bpmSlider?.addEventListener('input', (e) => {
      st.bpm.value = parseFloat(e.target.value);
    });
    d.btnTapTempo?.addEventListener('click', () => {
      this.autopilot.registerTapTempo();
      if (d.bpmSlider) d.bpmSlider.value = st.bpm.value;
    });
    d.btnBpmMinus?.addEventListener('click', () => {
      st.bpm.value = Math.max(60, Math.round((st.bpm.value - 0.5) * 10) / 10);
      if (d.bpmSlider) d.bpmSlider.value = st.bpm.value;
    });
    d.btnBpmPlus?.addEventListener('click', () => {
      st.bpm.value = Math.min(220, Math.round((st.bpm.value + 0.5) * 10) / 10);
      if (d.bpmSlider) d.bpmSlider.value = st.bpm.value;
    });
    d.bpmMultBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.bpm.multiplier = parseFloat(btn.getAttribute('data-mult'));
      });
    });

    d.btnAudioMic?.addEventListener('click', async () => {
      if (st.audio.enabled && !st.audio.simMode) {
        this.audioAnalyzer.stopMicrophone();
      } else {
        await this.audioAnalyzer.enableMicrophone();
      }
    });

    d.btnAudioSim?.addEventListener('click', () => {
      if (st.audio.enabled && st.audio.simMode) {
        this.audioAnalyzer.stopMicrophone();
      } else {
        this.audioAnalyzer.enableSimMode();
      }
    });

    d.audioGainSlider?.addEventListener('input', (e) => {
      st.audio.gain = parseFloat(e.target.value);
    });

    d.btnOpenProjector?.addEventListener('click', () => {
      this.syncBridge.openProjectorWindow();
    });

    d.btnHideUi?.addEventListener('click', () => {
      this.toggleCleanOutputMode();
    });

    d.btnRestoreUi?.addEventListener('click', () => {
      this.toggleCleanOutputMode(false);
    });

    d.bgModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        st.bgMode = btn.getAttribute('data-bg');
      });
    });

    d.resScaleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Manual quality choice disables the automatic governor
        st.autoQuality = false;
        st.resolutionScale = parseFloat(btn.getAttribute('data-scale'));
      });
    });

    const canvas = document.getElementById('aether-gl-canvas');
    canvas?.addEventListener('dblclick', () => {
      this.toggleCleanOutputMode();
    });
  }

  _populateTriggerOptions() {
    const sel = this.dom.triggerValueSelect;
    if (!sel) return;
    sel.innerHTML = '';

    if (this.state.autopilot.triggerUnit === 'BARS') {
      const barOptions = [8, 16, 32, 64];
      barOptions.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = `CADA ${b} COMPASES`;
        if (b === this.state.autopilot.triggerBars) opt.selected = true;
        sel.appendChild(opt);
      });
    } else {
      const secOptions = [15, 30, 45, 60, 120];
      secOptions.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `CADA ${s} SEGUNDOS`;
        if (s === this.state.autopilot.triggerSeconds) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  }

  toggleCleanOutputMode(forceState) {
    const st = this.state;
    st.uiHidden = forceState !== undefined ? forceState : !st.uiHidden;
    document.body.classList.toggle('clean-output-active', st.uiHidden);
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // PANIC works always, even with a slider or text box focused
      if (e.key === 'Escape') {
        e.preventDefault();
        this._triggerPanic();
        return;
      }
      const tgt = e.target;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'SELECT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'h') {
        this.toggleCleanOutputMode();
      } else if (key === 'tab') {
        e.preventDefault();
        const order = ['FLT', 'MIN', 'MOT', 'GEO', 'KIN', 'SPC'];
        const nextIdx = (order.indexOf(this.state.activeBankTab) + 1) % order.length;
        this.state.activeBankTab = order[nextIdx];
        this._buildGeneratorBanks();
      } else if (key === 'p') {
        this.state.styleMode = (this.state.styleMode + 1) % STYLE_MODES.length;
        if (this.state.styleMode === 1) this._disableAllPostFx();
      } else if (key === 'w') {
        this.state.weightMode = (this.state.weightMode + 1) % WEIGHT_MODES.length;
      } else if (key === 'q') {
        this.state.sweepMode = (this.state.sweepMode + 1) % SWEEP_MODES.length;
      } else if (key === 'e') {
        if (!this.state.fx.effect3d) this.state.fx.effect3d = { mode: 0, amount: 0.55 };
        this.state.fx.effect3d.mode = (this.state.fx.effect3d.mode + 1) % EFFECT_3D_MODES.length;
      } else if (key === 'l') {
        this.state.fx.logo.enabled = !this.state.fx.logo.enabled;
      } else if (key === 'g') {
        this.state.fx.mapping.showTestGrid = !this.state.fx.mapping.showTestGrid;
      } else if (key === ' ') {
        e.preventDefault();
        this.autopilot.registerTapTempo();
        if (this.dom.bpmSlider) this.dom.bpmSlider.value = this.state.bpm.value;
      } else if (key === 'f') {
        this.state.fx.flashMomentary = true;
      } else if (key === 's') {
        this.state.fx.strobeBurst = true;
      } else if (key === 'i') {
        this.state.fx.invertKill = !this.state.fx.invertKill;
      } else if (key === 'm') {
        this.state.fx.bwMonochrome = !this.state.fx.bwMonochrome;
      } else if (key === 'b') {
        this.state.fx.blackout = !this.state.fx.blackout;
      } else if (key === 'n' || key === 'arrowright') {
        this.autopilot.triggerNextScene();
      } else if (key === 'r') {
        this.autopilot.randomizeMacrosNow();
      } else if (key >= '1' && key <= '8') {
        const bankOffsets = { GEO: 0, KIN: 8, FLT: 16, SPC: 24, MIN: 32, MOT: 40 };
        const bankOffset = bankOffsets[this.state.activeBankTab] || 0;
        const genIdx = bankOffset + (parseInt(key, 10) - 1);
        this.autopilot.triggerNextScene(genIdx);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'f') {
        this.state.fx.flashMomentary = false;
      } else if (key === 's') {
        this.state.fx.strobeBurst = false;
      }
    });
  }

  _formatSessionDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  updateUI() {
    const st = this.state;
    const d = this.dom;

    // En modo ALPHA: si los paneles están visibles muestra cuadrícula oscura de transparencia;
    // si está en Pantalla Limpia [H], deja el fondo HTML 100% transparente real (rgba(0,0,0,0)) para OBS/Resolume
    document.body.classList.toggle('alpha-preview-grid', st.bgMode === 'ALPHA' && !st.uiHidden);
    document.body.classList.toggle('alpha-clean-transparent', st.bgMode === 'ALPHA' && st.uiHidden);
    document.documentElement.classList.toggle('alpha-clean-transparent', st.bgMode === 'ALPHA' && st.uiHidden);

    if (d.fpsReadout) {
      d.fpsReadout.textContent = `${Math.round(st.fps)} FPS`;
      d.fpsReadout.className = st.fps >= 55 ? 'telemetry-val ok' : 'telemetry-val warn';
    }
    if (d.frameMsReadout) {
      d.frameMsReadout.textContent = `${st.frameTimeMs.toFixed(1)} ms`;
    }
    if (d.sessionClock) {
      d.sessionClock.textContent = this._formatSessionDuration(performance.now() - st.sessionStartTime);
    }

    const dominantGenIdx = st.crossfade >= 0.5 ? st.deckB : st.deckA;
    const dominantGen = GENERATORS[dominantGenIdx] || GENERATORS[0];
    if (d.activeSceneReadout) {
      d.activeSceneReadout.textContent = `${dominantGen.code}: ${dominantGen.shortName}`;
    }

    if (d.projectorStatusLed && d.projectorStatusText) {
      const connected = this.syncBridge.isProjectorConnected;
      d.projectorStatusLed.classList.toggle('online', connected);
      d.projectorStatusText.textContent = connected ? 'PROYECTOR: CONECTADO' : 'PROYECTOR: EN ESPERA';
    }

    if (st.uiHidden) return;

    // Shape, Render Style, Line-Weight & Sweep Buttons
    for (let i = 0; i < this.shapeButtons.length; i++) {
      const sb = this.shapeButtons[i];
      sb.el.classList.toggle('active', st.shapeMode === sb.id);
    }
    for (let i = 0; i < this.styleButtons.length; i++) {
      const stb = this.styleButtons[i];
      stb.el.classList.toggle('active', st.styleMode === stb.id);
    }
    for (let i = 0; i < this.weightButtons.length; i++) {
      const wb = this.weightButtons[i];
      wb.el.classList.toggle('active', st.weightMode === wb.id);
    }
    for (let i = 0; i < this.sweepButtons.length; i++) {
      const swb = this.sweepButtons[i];
      swb.el.classList.toggle('active', st.sweepMode === swb.id);
    }
    const eff3dMode = (st.fx.effect3d && typeof st.fx.effect3d.mode === 'number') ? st.fx.effect3d.mode : 0;
    const eff3dAmt = (st.fx.effect3d && typeof st.fx.effect3d.amount === 'number') ? st.fx.effect3d.amount : 0.55;
    for (let i = 0; i < this.effect3dButtons.length; i++) {
      const eb = this.effect3dButtons[i];
      eb.el.classList.toggle('active', eff3dMode === eb.id);
    }
    if (d.effect3dAmountSlider && document.activeElement !== d.effect3dAmountSlider) {
      d.effect3dAmountSlider.value = eff3dAmt;
    }
    if (d.effect3dAmountVal) {
      d.effect3dAmountVal.textContent = `${Math.round(eff3dAmt * 100)}%`;
    }

    // DJ Logo Studio UI Sync
    const logo = st.fx.logo;
    if (d.btnLogoToggle) {
      d.btnLogoToggle.classList.toggle('logo-live', Boolean(logo.enabled));
      d.btnLogoToggle.textContent = logo.enabled ? '🟢 LOGO EN PANTALLA [L]' : '👁 MOSTRAR LOGO [L]';
    }
    if (d.btnLogoTint) {
      d.btnLogoTint.classList.toggle('active', Boolean(logo.tint));
      d.btnLogoTint.textContent = logo.tint ? 'COLOR: PALETA ACTIVA' : 'COLOR: PNG ORIGINAL';
    }
    for (let i = 0; i < this.logoFxButtons.length; i++) {
      const lfb = this.logoFxButtons[i];
      lfb.el.classList.toggle('active', logo.fxMode === lfb.id);
    }
    for (let i = 0; i < this.logoPosButtons.length; i++) {
      const lpb = this.logoPosButtons[i];
      lpb.el.classList.toggle('active', logo.pos === lpb.id);
    }
    d.logoSlotBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', logo.activeSlot === idx);
      const hasCustom = Boolean(st.logoSlots[idx]);
      if (idx === 0) {
        btn.textContent = hasCustom ? 'DJ 1 (LISTO)' : 'DJ 1 (DEMO)';
      } else {
        btn.textContent = hasCustom ? `DJ ${idx + 1} (LISTO)` : `DJ ${idx + 1} (+PNG)`;
      }
    });
    if (d.logoScaleSlider && document.activeElement !== d.logoScaleSlider) {
      d.logoScaleSlider.value = logo.scale;
    }
    if (d.logoScaleVal) {
      d.logoScaleVal.textContent = `${Math.round(logo.scale * 100)}%`;
    }
    if (d.logoBackdropSlider && document.activeElement !== d.logoBackdropSlider) {
      d.logoBackdropSlider.value = logo.backdrop;
    }
    if (d.logoBackdropVal) {
      d.logoBackdropVal.textContent = `${Math.round(logo.backdrop * 100)}%`;
    }

    // Mapping & Slices UI Sync
    const map = st.fx.mapping || {
      offsetX: 0.0, offsetY: 0.0, scaleX: 1.0, scaleY: 1.0,
      keystoneX: 0.0, keystoneY: 0.0, sliceMode: 0, sliceCount: 3,
      sliceGap: 0.04, sliceClone: true, showTestGrid: false
    };
    if (d.btnMapTestGrid) {
      d.btnMapTestGrid.classList.toggle('logo-live', Boolean(map.showTestGrid));
      d.btnMapTestGrid.textContent = map.showTestGrid ? '🟢 REJILLA ACTIVA [G]' : '🎯 CARTA DE AJUSTE [G]';
    }
    if (d.btnSliceClone) {
      d.btnSliceClone.classList.toggle('active', Boolean(map.sliceClone));
      d.btnSliceClone.textContent = map.sliceClone ? 'MODO: CLONAR EN SLICE' : 'MODO: CORTAR MÁSCARA';
    }
    for (let i = 0; i < this.sliceModeButtons.length; i++) {
      const sb = this.sliceModeButtons[i];
      sb.el.classList.toggle('active', map.sliceMode === sb.id);
    }
    d.sliceCountBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-count'), 10) === map.sliceCount);
    });
    if (d.sliceGapSlider && document.activeElement !== d.sliceGapSlider) {
      d.sliceGapSlider.value = map.sliceGap;
    }
    if (d.mapOffsetX && document.activeElement !== d.mapOffsetX) d.mapOffsetX.value = map.offsetX;
    if (d.mapOffsetXVal) d.mapOffsetXVal.textContent = `${Math.round(map.offsetX * 100)}%`;
    if (d.mapOffsetY && document.activeElement !== d.mapOffsetY) d.mapOffsetY.value = map.offsetY;
    if (d.mapOffsetYVal) d.mapOffsetYVal.textContent = `${Math.round(map.offsetY * 100)}%`;
    if (d.mapScaleX && document.activeElement !== d.mapScaleX) d.mapScaleX.value = map.scaleX;
    if (d.mapScaleXVal) d.mapScaleXVal.textContent = `${Math.round(map.scaleX * 100)}%`;
    if (d.mapScaleY && document.activeElement !== d.mapScaleY) d.mapScaleY.value = map.scaleY;
    if (d.mapScaleYVal) d.mapScaleYVal.textContent = `${Math.round(map.scaleY * 100)}%`;
    if (d.mapKeystoneX && document.activeElement !== d.mapKeystoneX) d.mapKeystoneX.value = map.keystoneX;
    if (d.mapKeystoneXVal) d.mapKeystoneXVal.textContent = `${Math.round(map.keystoneX * 100)}%`;
    if (d.mapKeystoneY && document.activeElement !== d.mapKeystoneY) d.mapKeystoneY.value = map.keystoneY;
    if (d.mapKeystoneYVal) d.mapKeystoneYVal.textContent = `${Math.round((map.keystoneY || 0) * 100)}%`;

    // Output master (brightness / color temperature)
    const out = st.fx.output || { brightness: 1.0, colorTemp: 0.0 };
    if (d.outBrightness && document.activeElement !== d.outBrightness) d.outBrightness.value = out.brightness;
    if (d.outBrightnessVal) d.outBrightnessVal.textContent = `${Math.round(out.brightness * 100)}%`;
    if (d.outColorTemp && document.activeElement !== d.outColorTemp) d.outColorTemp.value = out.colorTemp;
    if (d.outColorTempVal) {
      const t = out.colorTemp || 0;
      d.outColorTempVal.textContent = Math.abs(t) < 0.03 ? 'NEUTRO' : (t > 0 ? `CÁLIDO ${Math.round(t * 100)}%` : `FRÍO ${Math.round(-t * 100)}%`);
    }

    // Presets, safety, MIDI and auto quality
    this._refreshPresetPads();

    const safe = st.fx.safeStrobe !== false;
    if (d.btnSafeStrobe) {
      d.btnSafeStrobe.classList.toggle('active', safe);
      d.btnSafeStrobe.classList.toggle('safety-off', !safe);
      d.btnSafeStrobe.textContent = safe ? '🛡 LÍMITE ESTROBO 3/s: ACTIVO' : '⚠️ LÍMITE ESTROBO: DESACTIVADO';
    }

    const calmCol = st.calmColor !== false;
    if (d.btnCalmColor) {
      d.btnCalmColor.classList.toggle('active', calmCol);
      d.btnCalmColor.classList.toggle('safety-off', !calmCol);
      d.btnCalmColor.textContent = calmCol ? '🐢 COLOR SUAVE (ANTI-FERIA): ACTIVO' : '🌈 COLOR RÁPIDO (SIN LÍMITE)';
    }

    if (d.btnMidiClock) {
      const midi = st.midi;
      d.btnMidiClock.classList.toggle('active', midi.enabled && !midi.receiving);
      d.btnMidiClock.classList.toggle('logo-live', midi.enabled && midi.receiving);
      if (!midi.supported) {
        d.btnMidiClock.textContent = '🎹 MIDI: NO SOPORTADO';
      } else if (!midi.enabled) {
        if (!d.btnMidiClock.textContent.includes('NO DISPONIBLE')) {
          d.btnMidiClock.textContent = '🎹 MIDI CLOCK: APAGADO';
        }
      } else if (midi.receiving) {
        d.btnMidiClock.textContent = `🟢 MIDI SYNC ${midi.clockBpm.toFixed(1)} BPM`;
        d.btnMidiClock.title = `Siguiendo el reloj de: ${midi.deviceName || 'dispositivo MIDI'}`;
      } else {
        d.btnMidiClock.textContent = '🎹 MIDI: ESPERANDO RELOJ...';
      }
    }

    d.btnResAuto?.classList.toggle('active', Boolean(st.autoQuality));

    d.btnFxCleanBypass?.classList.toggle('active', st.pureFlatBypassFx);
    if (d.btnFxCleanBypass) {
      d.btnFxCleanBypass.textContent = st.pureFlatBypassFx ? 'SIN EFECTOS: SÍ' : 'SIN EFECTOS: NO';
    }

    // Bank Tabs & Autopilot Pool Buttons
    d.bankTabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-bank') === st.activeBankTab);
    });
    d.apPoolBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pool') === st.autopilotBankPool);
    });

    // Visually move & animate all 8 Macro Faders + LED Bars
    let anyBarStepActive = false;
    for (let i = 0; i < MACRO_DEFS.length; i++) {
      const key = MACRO_DEFS[i].key;
      const m = st.macros[key];
      const mDom = this.macroDom[key];
      if (!mDom) continue;

      const modPct = (m.modulated * 100).toFixed(1);
      const basePct = (m.base * 100).toFixed(1);
      const barStepBars = Number(m.barStepBars) || 0;
      if (barStepBars > 0) anyBarStepActive = true;

      mDom.valEl.textContent = `${Math.round(m.modulated * 100)}%`;
      mDom.ledFillEl.style.height = `${modPct}%`;
      mDom.baseMarkerEl.style.bottom = `${basePct}%`;
      mDom.modCapEl.style.bottom = `calc(${modPct}% - 6px)`;

      if (document.activeElement !== mDom.inputEl) {
        mDom.inputEl.value = m.base;
      }
      if (mDom.barStepBtns) {
        for (let b = 0; b < mDom.barStepBtns.length; b++) {
          const btn = mDom.barStepBtns[b];
          const bVal = parseInt(btn.getAttribute('data-bars'), 10) || 0;
          btn.classList.toggle('active', bVal === barStepBars);
        }
      }
      if (mDom.barStepTagEl) {
        mDom.barStepTagEl.textContent = barStepBars > 0 ? `${barStepBars} COMP` : 'MANUAL';
        mDom.barStepTagEl.style.color = barStepBars > 0 ? 'var(--accent-amber)' : 'var(--text-muted)';
      }
      if (mDom.audioBandEl && document.activeElement !== mDom.audioBandEl && mDom.audioBandEl.value !== m.audioBand) {
        mDom.audioBandEl.value = m.audioBand || 'none';
      }
    }
    if (d.btnAutoBarSteps) {
      d.btnAutoBarSteps.classList.toggle('active', anyBarStepActive);
      d.btnAutoBarSteps.style.background = anyBarStepActive ? 'rgba(255, 157, 0, 0.22)' : '';
      d.btnAutoBarSteps.textContent = anyBarStepActive
        ? '🟢 SALTOS POR COMPASES: ACTIVOS (PULSA PARA APAGAR)'
        : '🥁 SALTOS POR COMPASES AUTO (ZOOM 4C · GIRO 8C · MOV 16C)';
    }

    // Crossfader & Deck Generator Highlight
    if (d.crossfaderInput && document.activeElement !== d.crossfaderInput) {
      d.crossfaderInput.value = st.crossfade;
    }
    if (d.crossfaderVal) {
      const pctA = Math.round((1.0 - st.crossfade) * 100);
      const pctB = Math.round(st.crossfade * 100);
      d.crossfaderVal.textContent = `A:${pctA}% / B:${pctB}%`;
    }

    for (let i = 0; i < GENERATORS.length; i++) {
      this.genButtonsA[i]?.classList.toggle('active', st.deckA === i);
      this.genButtonsB[i]?.classList.toggle('active', st.deckB === i);
      const isLive = (st.deckA === i && st.crossfade < 0.99) || (st.deckB === i && st.crossfade > 0.01);
      this.directSceneBtns[i]?.classList.toggle('active', dominantGenIdx === i);
      this.directSceneBtns[i]?.classList.toggle('live-mix', isLive);
    }

    // Palette Swatches
    for (let i = 0; i < this.paletteButtons.length; i++) {
      this.paletteButtons[i].classList.toggle('active', st.paletteTarget === i);
    }

    // Autopilot Brain Status & Progress
    d.btnAutopilotToggle?.classList.toggle('active', st.autopilot.enabled);
    if (d.btnAutopilotToggle) {
      d.btnAutopilotToggle.textContent = st.autopilot.enabled ? 'PILOTO AUTO: ACTIVO' : 'PILOTO AUTO: PAUSADO';
    }
    d.btnLfoMasterToggle?.classList.toggle('active', st.autopilot.lfoMasterEnabled);
    d.btnAutoPaletteToggle?.classList.toggle('active', st.autoRotatePalette);

    d.autopilotModeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === st.autopilot.mode);
    });
    d.triggerUnitBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-unit') === st.autopilot.triggerUnit);
    });

    if (d.sceneProgressFill) {
      d.sceneProgressFill.style.width = `${(st.autopilot.sceneProgress * 100).toFixed(1)}%`;
    }
    if (d.sceneProgressLabel) {
      if (st.autoCrossfading) {
        d.sceneProgressLabel.textContent = 'CAMBIANDO SUAVEMENTE DE ESCENA...';
      } else if (st.autopilot.triggerUnit === 'BARS') {
        d.sceneProgressLabel.textContent = `PRÓXIMO CAMBIO: ${st.autopilot.barsElapsedInScene} / ${st.autopilot.triggerBars} COMPASES`;
      } else {
        d.sceneProgressLabel.textContent = `PRÓXIMO CAMBIO: ${Math.floor(st.autopilot.secondsElapsedInScene)}s / ${st.autopilot.triggerSeconds}s`;
      }
    }
    if (d.scenesPlayedCounter) {
      d.scenesPlayedCounter.textContent = `ESCENAS: ${st.autopilot.scenesPlayed}`;
    }

    // Post-FX Rack State Sync
    d.fxKaleidoToggle?.classList.toggle('active', st.fx.kaleidoscope.enabled);
    if (d.fxKaleidoWet && document.activeElement !== d.fxKaleidoWet) {
      d.fxKaleidoWet.value = st.fx.kaleidoscope.wet;
    }
    d.fxKaleidoAxesBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-axes'), 10) === st.fx.kaleidoscope.axes);
    });

    d.fxRgbToggle?.classList.toggle('active', st.fx.rgbShift.enabled);
    if (d.fxRgbWet && document.activeElement !== d.fxRgbWet) d.fxRgbWet.value = st.fx.rgbShift.wet;

    d.fxFeedbackToggle?.classList.toggle('active', st.fx.feedback.enabled);
    if (d.fxFeedbackWet && document.activeElement !== d.fxFeedbackWet) d.fxFeedbackWet.value = st.fx.feedback.wet;

    d.fxGlitchToggle?.classList.toggle('active', st.fx.glitch.enabled);
    if (d.fxGlitchWet && document.activeElement !== d.fxGlitchWet) d.fxGlitchWet.value = st.fx.glitch.wet;

    d.fxPixelateToggle?.classList.toggle('active', st.fx.pixelate.enabled);
    if (d.fxPixelateWet && document.activeElement !== d.fxPixelateWet) d.fxPixelateWet.value = st.fx.pixelate.wet;

    d.btnKillFlash?.classList.toggle('active', st.fx.flashMomentary);
    d.btnKillStrobe?.classList.toggle('active', st.fx.strobeBurst);
    d.btnKillMono?.classList.toggle('active', st.fx.bwMonochrome);
    d.btnKillInvert?.classList.toggle('active', st.fx.invertKill);
    d.btnKillBlackout?.classList.toggle('active', st.fx.blackout);

    // BPM & Audio FFT Meters
    if (d.bpmReadout) {
      d.bpmReadout.textContent = (st.bpm.value * st.bpm.multiplier).toFixed(1);
    }
    d.bpmMultBtns.forEach((btn) => {
      btn.classList.toggle('active', parseFloat(btn.getAttribute('data-mult')) === st.bpm.multiplier);
    });
    d.beatLeds.forEach((led, idx) => {
      led.classList.toggle('active', st.bpm.currentBeatInBar === idx + 1);
    });
    if (d.barCounterReadout) {
      d.barCounterReadout.textContent = `COMPÁS ${st.bpm.currentBar}.${st.bpm.currentBeatInBar}`;
    }

    d.btnAudioMic?.classList.toggle('active', st.audio.enabled && !st.audio.simMode);
    d.btnAudioSim?.classList.toggle('active', st.audio.enabled && st.audio.simMode);
    if (d.meterBass) d.meterBass.style.width = `${(st.audio.bass * 100).toFixed(1)}%`;
    if (d.meterMid) d.meterMid.style.width = `${(st.audio.mid * 100).toFixed(1)}%`;
    if (d.meterHigh) d.meterHigh.style.width = `${(st.audio.high * 100).toFixed(1)}%`;

    d.bgModeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-bg') === st.bgMode);
    });
    d.resScaleBtns.forEach((btn) => {
      btn.classList.toggle('active', parseFloat(btn.getAttribute('data-scale')) === st.resolutionScale);
    });

    this._updateV2UI();
  }

  // ===========================================================================
  // v2 · Utilidades comunes
  // ===========================================================================

  /** Todas las acciones nuevas pasan por el mismo camino que el móvil. */
  _cmd(cmd) {
    if (!this.syncBridge || typeof this.syncBridge._applyRemoteCommand !== 'function') return;
    try {
      this.syncBridge._applyRemoteCommand(cmd);
    } catch (err) {
      console.warn('[AETHER-VJ] Error al aplicar el comando', cmd && cmd.action, err);
    }
  }

  /** Listas del motor con valores de reserva si state.js aún no las exporta. */
  _v2Lists() {
    const pick = (getter, fallback) => {
      try {
        const v = getter();
        return Array.isArray(v) && v.length ? v : fallback;
      } catch (_) {
        return fallback;
      }
    };
    const norm = (arr) => arr.map((m, i) => (
      m !== null && typeof m === 'object'
        ? { id: typeof m.id === 'number' ? m.id : i, name: String(m.name ?? m.id ?? i), css: m.css || '' }
        : { id: i, name: String(m), css: '' }
    ));
    return {
      fonts: norm(pick(() => TEXT_FONTS, ['Impacto', 'Mono Tech', 'Elegante', 'Redonda'])),
      textFx: norm(pick(() => TEXT_FX_MODES, ['⏹ Limpio', '💓 Latido + Halo', '⚡ Neón Glitch RGB', '📜 Ticker (desplazamiento)', '🌊 Onda', '🎭 Silueta (visual dentro)', '🧊 Relieve 3D'])),
      textPos: norm(pick(() => TEXT_POS_MODES, ['🎯 Centro', '⬆️ Arriba', '⬇️ Abajo'])),
      textColor: norm(pick(() => TEXT_COLOR_MODES, ['⚪ Blanco', '🎨 Color de la paleta', '🌈 Arcoíris animado'])),
      mediaBlend: norm(pick(() => MEDIA_BLEND_MODES, ['⬛ Encima (tapa)', '✨ Pantalla (suma luz)', '🎭 Máscara (visual dentro del vídeo)', '🔀 Diferencia', '🌗 Mitad y mitad'])),
      mediaFx: norm(pick(() => MEDIA_FX_MODES, ['⏹ Normal', '💠 Bordes Neón', '🎨 Duotono Paleta', '🔥 Térmica', '🟨 Pop-Art', '👻 Fantasma', '▦ Pixel LED'])),
      bars: pick(() => TRANSITION_BARS, [0, 1, 2, 4, 8, 16]).map((b) => Number(b) || 0),
      edgeModes: norm(pick(() => EDGE_BLEND_MODES, ['⏹ Apagado', '🖥🖥 2 proyectores en 1 ventana', '◧ Este es el IZQUIERDO', '◨ Este es el DERECHO']))
    };
  }

  _num(v, def) {
    return (typeof v === 'number' && Number.isFinite(v)) ? v : def;
  }

  _defaultCornerList() {
    if (!this._defCorners) this._defCorners = [[0, 0], [1, 0], [1, 1], [0, 1]];
    return this._defCorners;
  }

  _getCorners(proj) {
    const map = this.state.fx.mapping || {};
    const arr = proj === 1 ? map.corners2 : map.corners;
    if (Array.isArray(arr) && arr.length === 4) {
      for (let i = 0; i < 4; i++) {
        const c = arr[i];
        if (!c || typeof c[0] !== 'number' || typeof c[1] !== 'number') return this._defaultCornerList();
      }
      return arr;
    }
    return this._defaultCornerList();
  }

  _getMasks() {
    const map = this.state.fx.mapping || {};
    if (Array.isArray(map.masks) && map.masks.length >= 4) return map.masks;
    if (!this._defMasks) {
      this._defMasks = [0, 1, 2, 3].map(() => ({ enabled: false, x: 0.4, y: 0.6, w: 0.2, h: 0.3, feather: 0.01 }));
    }
    return this._defMasks;
  }

  _getEdge() {
    const e = this.state.fx.edgeBlend;
    if (e && typeof e === 'object') return e;
    if (!this._defEdge) this._defEdge = { mode: 0, overlap: 0.15, gamma: 2.2, curve: 2.0 };
    return this._defEdge;
  }

  _syncGroup(key, btns, activeId) {
    if (this._uiCache[key] === activeId) return;
    this._uiCache[key] = activeId;
    for (let i = 0; i < btns.length; i++) {
      btns[i].el.classList.toggle('active', btns[i].id === activeId);
    }
  }

  _syncToggle(el, key, on, onText, offText, cls = 'logo-live') {
    if (!el) return;
    const v = on ? 1 : 0;
    if (this._uiCache[key] === v) return;
    this._uiCache[key] = v;
    el.classList.toggle(cls, Boolean(on));
    el.textContent = on ? onText : offText;
  }

  _syncSlider(el, valEl, v, text) {
    if (el && el._v2v !== v && document.activeElement !== el) {
      el.value = v;
      el._v2v = v;
    }
    if (valEl && valEl._v2t !== text) {
      valEl.textContent = text;
      valEl._v2t = text;
    }
  }

  _setText(el, text) {
    if (el && el._v2t !== text) {
      el.textContent = text;
      el._v2t = text;
    }
  }

  _bindCmdSlider(el, makeCmd, defaultVal) {
    if (!el) return;
    el.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (Number.isFinite(v)) this._cmd(makeCmd(v));
    });
    if (defaultVal !== undefined) {
      el.addEventListener('dblclick', () => {
        el.value = defaultVal;
        this._cmd(makeCmd(defaultVal));
      });
    }
  }

  // ===========================================================================
  // v2 · Construcción de selectores y caché del DOM
  // ===========================================================================

  _buildV2Selectors() {
    const L = this._lists = this._v2Lists();
    const mk = (gridId, list, cls, onClick, labelFn, titleFn) => {
      const grid = document.getElementById(gridId);
      const out = [];
      if (!grid) return out;
      grid.innerHTML = '';
      list.forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = cls;
        btn.textContent = labelFn ? labelFn(m) : m.name;
        btn.title = titleFn ? titleFn(m) : m.name;
        btn.addEventListener('click', () => onClick(m.id));
        grid.appendChild(btn);
        out.push({ id: m.id, el: btn });
      });
      return out;
    };

    const v = this.v2;
    v.textFontBtns = mk('text-font-grid', L.fonts, 'btn-sweep-mode',
      (id) => this._cmd({ action: 'SET_TEXT_PROP', prop: 'font', value: id }));
    v.textFontBtns.forEach((b, i) => {
      const css = L.fonts[i] && L.fonts[i].css;
      if (css) b.el.style.fontFamily = css;
    });
    v.textFxBtns = mk('text-fx-grid', L.textFx, 'btn-weight-mode',
      (id) => this._cmd({ action: 'SET_TEXT_PROP', prop: 'fxMode', value: id }));
    v.textPosBtns = mk('text-pos-grid', L.textPos, 'btn-sweep-mode',
      (id) => this._cmd({ action: 'SET_TEXT_PROP', prop: 'pos', value: id }));
    v.textColorBtns = mk('text-color-grid', L.textColor, 'btn-sweep-mode',
      (id) => this._cmd({ action: 'SET_TEXT_PROP', prop: 'colorMode', value: id }));

    v.mediaBlendBtns = mk('media-blend-grid', L.mediaBlend, 'btn-weight-mode',
      (id) => this._cmd({ action: 'SET_MEDIA_PROP', prop: 'blend', value: id }));
    v.mediaFxBtns = mk('media-fx-grid', L.mediaFx, 'btn-style-mode',
      (id) => this._cmd({ action: 'SET_MEDIA_PROP', prop: 'fx', value: id }));

    v.transitionBtns = mk('transition-bars-grid', L.bars.map((b) => ({ id: b, name: String(b) })), 'btn-sweep-mode',
      (id) => this._cmd({ action: 'SET_TRANSITION', bars: id }),
      (m) => (m.id === 0 ? '✂️ CORTE' : `${m.id} COMP.`),
      (m) => (m.id === 0
        ? 'Cambio de look instantáneo (corte seco)'
        : `Fundido de ${m.id} ${m.id === 1 ? 'compás' : 'compases'} sincronizado al BPM al cargar un look`));

    v.edgeModeBtns = mk('edge-mode-grid', L.edgeModes, 'btn-weight-mode',
      (id) => this._cmd({ action: 'SET_EDGE_PROP', prop: 'mode', value: id }));
  }

  _cacheV2Dom() {
    const $ = (id) => document.getElementById(id);
    const toBtns = (selector, attr, parse) => Array.from(document.querySelectorAll(selector)).map((el) => ({
      id: parse(el.getAttribute(attr)),
      el
    }));
    this.v2d = {
      // Logo
      logoBgBtns: toBtns('.btn-logo-bg', 'data-bg', (s) => s),
      btnLogoReclean: $('btn-logo-reclean'),
      // Texto
      textInput: $('text-content-input'),
      textCharCount: $('text-char-count'),
      btnTextSend: $('btn-text-send'),
      btnTextToggle: $('btn-text-toggle'),
      btnTextClear: $('btn-text-clear'),
      textScale: $('text-scale-slider'),
      textScaleVal: $('text-scale-val'),
      textOpacity: $('text-opacity-slider'),
      textOpacityVal: $('text-opacity-val'),
      textBackdrop: $('text-backdrop-slider'),
      textBackdropVal: $('text-backdrop-val'),
      textScroll: $('text-scroll-slider'),
      textScrollVal: $('text-scroll-val'),
      // Vídeo / cámara
      mediaFileInput: $('media-file-input'),
      mediaStatus: $('media-status'),
      btnMediaOpen: $('btn-media-open'),
      btnMediaCamera: $('btn-media-camera'),
      btnMediaStop: $('btn-media-stop'),
      btnMediaToggle: $('btn-media-toggle'),
      btnMediaMirror: $('btn-media-mirror'),
      mediaCameraSelect: $('media-camera-select'),
      btnMediaCamRefresh: $('btn-media-cam-refresh'),
      mediaLibBox: $('media-library-box'),
      mediaLibList: $('media-library-list'),
      btnMediaLibRefresh: $('btn-media-lib-refresh'),
      mediaFitBtns: toBtns('.btn-media-fit', 'data-fit', (s) => parseInt(s, 10) || 0),
      mediaOpacity: $('media-opacity-slider'),
      mediaOpacityVal: $('media-opacity-val'),
      mediaBeatZoom: $('media-beatzoom-slider'),
      mediaBeatZoomVal: $('media-beatzoom-val'),
      mediaSpeed: $('media-speed-slider'),
      mediaSpeedVal: $('media-speed-val'),
      // Corner-pin, máscaras y edge blending
      btnCornerPin: $('btn-cornerpin-toggle'),
      btnTestGrid2: $('btn-map-testgrid-2'),
      btnCornersReset: $('btn-corners-reset'),
      cornerProjRow: $('corner-proj-row'),
      cornerProjBtns: toBtns('.btn-corner-proj', 'data-proj', (s) => parseInt(s, 10) || 0),
      cornerEditor: $('corner-editor'),
      cornerCanvas: $('corner-editor-canvas'),
      cornerReadout: $('corner-readout'),
      maskSelectBtns: toBtns('.btn-mask-select', 'data-mask', (s) => parseInt(s, 10) || 0),
      btnMaskEnable: $('btn-mask-enable'),
      maskX: $('mask-x-slider'),
      maskXVal: $('mask-x-val'),
      maskY: $('mask-y-slider'),
      maskYVal: $('mask-y-val'),
      maskW: $('mask-w-slider'),
      maskWVal: $('mask-w-val'),
      maskH: $('mask-h-slider'),
      maskHVal: $('mask-h-val'),
      maskFeather: $('mask-feather-slider'),
      maskFeatherVal: $('mask-feather-val'),
      edgeOverlap: $('edge-overlap-slider'),
      edgeOverlapVal: $('edge-overlap-val'),
      edgeGamma: $('edge-gamma-slider'),
      edgeGammaVal: $('edge-gamma-val'),
      edgeCurve: $('edge-curve-slider'),
      edgeCurveVal: $('edge-curve-val'),
      // Escalador LED por Píxeles (X × Y)
      btnLedScalerToggle: $('btn-led-scaler-toggle'),
      ledWidthPx: $('led-width-px'),
      ledHeightPx: $('led-height-px'),
      ledOffsetXPx: $('led-offset-x-px'),
      ledOffsetYPx: $('led-offset-y-px'),
      ledPresetBtns: Array.from(document.querySelectorAll('.btn-led-preset')),
      btnLedAnchor: $('btn-led-anchor'),
      btnLedAspect: $('btn-led-aspect'),
      // Modal Móvil Remoto / Recursos Mini-PC / Actualización por Internet
      btnOpenRemoteModal: $('btn-open-remote-modal'),
      btnCloseRemoteModal: $('btn-close-remote-modal'),
      remoteModalBackdrop: $('remote-modal-backdrop'),
      remoteUrlsList: $('remote-urls-list'),
      remotePinsReadout: $('remote-pins-readout'),
      sysStatsBox: $('sys-stats-box'),
      hudSysLoad: $('hud-sys-load'),
      updateRepoUrlInput: $('update-repo-url-input'),
      btnRunInternetUpdate: $('btn-run-internet-update'),
      updateStatusMsg: $('update-status-msg'),
      // Mutación Automática por Vuelta de Loops (🤖 AUTO por sección)
      autoModBtns: Array.from(document.querySelectorAll('.btn-auto-mod')),
      btnAllAutoToggle: $('btn-all-auto-toggle'),
      autoEveryBtns: Array.from(document.querySelectorAll('.btn-auto-every')),
      btnStepAutoNow: $('btn-step-auto-now'),
      apLapReadout: $('ap-lap-readout')
    };
  }

  // ===========================================================================
  // v2 · Eventos
  // ===========================================================================

  _bindV2Events() {
    const d = this.v2d;
    const st = this.state;

    // ---- Logo: quitar fondo / re-limpiar ----
    const syncBgBtns = () => d.logoBgBtns.forEach((b) => b.el.classList.toggle('active', b.id === this.logoBgRemove));
    syncBgBtns();
    d.logoBgBtns.forEach((b) => {
      b.el.addEventListener('click', () => {
        this.logoBgRemove = b.id;
        try { localStorage.setItem('aether_vj_logo_bgremove', b.id); } catch (_) {}
        syncBgBtns();
      });
    });
    d.btnLogoReclean?.addEventListener('click', () => {
      const mode = this.logoBgRemove === 'none' ? 'auto' : this.logoBgRemove;
      this._cmd({ action: 'PROCESS_LOGO', mode });
    });

    // ---- Texto en pantalla ----
    const updateCount = () => {
      if (d.textCharCount && d.textInput) this._setText(d.textCharCount, `${d.textInput.value.length}/140`);
    };
    this._updateTextCharCount = updateCount;
    d.textInput?.addEventListener('input', updateCount);
    d.textInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        this._sendText();
      }
    });
    d.btnTextSend?.addEventListener('click', () => this._sendText());
    d.btnTextToggle?.addEventListener('click', () => {
      const t = st.text || {};
      if (!t.enabled && !t.content && d.textInput && d.textInput.value.trim()) {
        this._sendText();
        return;
      }
      this._cmd({ action: 'SET_TEXT_PROP', prop: 'enabled', value: !t.enabled });
    });
    d.btnTextClear?.addEventListener('click', () => {
      if (d.textInput) d.textInput.value = '';
      updateCount();
      this._cmd({ action: 'SET_TEXT_PROP', prop: 'content', value: '' });
      this._cmd({ action: 'SET_TEXT_PROP', prop: 'enabled', value: false });
    });
    const textCmd = (prop) => (value) => ({ action: 'SET_TEXT_PROP', prop, value });
    this._bindCmdSlider(d.textScale, textCmd('scale'), 0.5);
    this._bindCmdSlider(d.textOpacity, textCmd('opacity'), 1.0);
    this._bindCmdSlider(d.textBackdrop, textCmd('backdrop'), 0.4);
    this._bindCmdSlider(d.textScroll, textCmd('scrollSpeed'), 0.5);

    // ---- Vídeo · GIF · Cámara ----
    if (this._isHttp) d.mediaLibBox?.classList.remove('hidden-block');
    d.btnMediaOpen?.addEventListener('click', () => d.mediaFileInput?.click());
    d.mediaFileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this._loadMediaFile(file);
      e.target.value = '';
    });
    d.btnMediaCamera?.addEventListener('click', () => {
      const deviceId = d.mediaCameraSelect ? d.mediaCameraSelect.value : '';
      this._cmd({ action: 'CAMERA_ON', deviceId });
    });
    d.mediaCameraSelect?.addEventListener('change', () => {
      const m = st.media || {};
      if (m.source === 'camera') {
        this._cmd({ action: 'CAMERA_ON', deviceId: d.mediaCameraSelect.value });
      }
    });
    d.btnMediaCamRefresh?.addEventListener('click', () => this._cmd({ action: 'REFRESH_CAMERAS' }));
    d.btnMediaStop?.addEventListener('click', () => this._cmd({ action: 'MEDIA_STOP' }));
    d.btnMediaToggle?.addEventListener('click', () => {
      const m = st.media || {};
      this._cmd({ action: 'SET_MEDIA_PROP', prop: 'enabled', value: !m.enabled });
    });
    d.btnMediaMirror?.addEventListener('click', () => {
      const m = st.media || {};
      this._cmd({ action: 'SET_MEDIA_PROP', prop: 'mirror', value: !m.mirror });
    });
    d.mediaFitBtns.forEach((b) => {
      b.el.addEventListener('click', () => this._cmd({ action: 'SET_MEDIA_PROP', prop: 'fit', value: b.id }));
    });
    const mediaCmd = (prop) => (value) => ({ action: 'SET_MEDIA_PROP', prop, value });
    this._bindCmdSlider(d.mediaOpacity, mediaCmd('opacity'), 1.0);
    this._bindCmdSlider(d.mediaBeatZoom, mediaCmd('beatZoom'), 0.0);
    this._bindCmdSlider(d.mediaSpeed, mediaCmd('speed'), 1.0);
    d.btnMediaLibRefresh?.addEventListener('click', () => this._refreshMediaLibrary());
    d.mediaLibList?.addEventListener('click', (e) => {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const item = this._mediaLibItems[parseInt(btn.getAttribute('data-idx'), 10)];
      if (!item) return;
      if (btn.getAttribute('data-act') === 'play') {
        this._cmd({ action: 'LOAD_MEDIA', url: item.url, kind: item.kind || 'video', name: item.name || item.file });
      } else if (btn.getAttribute('data-act') === 'del') {
        this._deleteMediaItem(item);
      }
    });

    // ---- Corner-pin ----
    d.btnCornerPin?.addEventListener('click', () => {
      const map = st.fx.mapping || {};
      this._cmd({ action: 'SET_MAP_PROP', prop: 'cornerPin', value: !map.cornerPin });
    });
    d.btnTestGrid2?.addEventListener('click', () => {
      const map = st.fx.mapping || {};
      this._cmd({ action: 'SET_MAP_PROP', prop: 'showTestGrid', value: !map.showTestGrid });
    });
    d.btnCornersReset?.addEventListener('click', () => {
      this._cmd({ action: 'RESET_CORNERS', proj: this.cornerProj });
      this._editorSig = '';
    });
    d.cornerProjBtns.forEach((b) => {
      b.el.addEventListener('click', () => {
        this.cornerProj = b.id === 1 ? 1 : 0;
        this._editorSig = '';
      });
    });
    this._bindCornerEditor();

    // ---- Escalador de Pantalla LED por Píxeles (X × Y) ----
    d.btnLedScalerToggle?.addEventListener('click', () => {
      const map = st.fx.mapping || {};
      this._cmd({ action: 'SET_MAP_PROP', prop: 'ledScalerEnabled', value: !map.ledScalerEnabled });
    });
    const bindLedPxInput = (el, prop, minV, maxV) => {
      if (!el) return;
      const applyVal = () => {
        const raw = parseInt(el.value, 10);
        if (Number.isFinite(raw)) {
          const clamped = Math.max(minV, Math.min(maxV, raw));
          this._cmd({ action: 'SET_MAP_PROP', prop, value: clamped });
        }
      };
      el.addEventListener('input', applyVal);
      el.addEventListener('change', applyVal);
    };
    bindLedPxInput(d.ledWidthPx, 'ledWidthPx', 64, 7680);
    bindLedPxInput(d.ledHeightPx, 'ledHeightPx', 64, 4320);
    bindLedPxInput(d.ledOffsetXPx, 'ledOffsetXPx', 0, 7680);
    bindLedPxInput(d.ledOffsetYPx, 'ledOffsetYPx', 0, 4320);

    d.ledPresetBtns?.forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = parseInt(btn.getAttribute('data-w'), 10) || 1024;
        const h = parseInt(btn.getAttribute('data-h'), 10) || 512;
        this._cmd({ action: 'SET_MAP_PROP', prop: 'ledWidthPx', value: w });
        this._cmd({ action: 'SET_MAP_PROP', prop: 'ledHeightPx', value: h });
        this._cmd({ action: 'SET_MAP_PROP', prop: 'ledScalerEnabled', value: true });
      });
    });

    d.btnLedAnchor?.addEventListener('click', () => {
      const map = st.fx.mapping || {};
      const next = map.ledAnchor === 'center' ? 'top-left' : 'center';
      this._cmd({ action: 'SET_MAP_PROP', prop: 'ledAnchor', value: next });
    });

    d.btnLedAspect?.addEventListener('click', () => {
      const map = st.fx.mapping || {};
      const next = map.ledKeepAspect === false;
      this._cmd({ action: 'SET_MAP_PROP', prop: 'ledKeepAspect', value: next });
    });

    // ---- Modal Móvil Remoto, Recursos del Mini-PC y Actualización por Internet ----
    const refreshNetworkAndStats = async () => {
      if (!this._isHttp) {
        if (d.remoteUrlsList) {
          d.remoteUrlsList.textContent = 'Ejecuta INICIAR-SERVIDOR-WIFI.bat o el servicio aether-vj en Linux para activar el mando móvil.';
        }
        return;
      }
      try {
        const res = await fetch('/api/network-info');
        if (!res.ok) return;
        const info = await res.json();
        if (!info || !info.ok) return;

        // 1. URLs para el móvil
        if (d.remoteUrlsList) {
          const lines = [];
          const urls = info.remoteUrls && info.remoteUrls.length ? info.remoteUrls : [];
          const friendly = info.friendlyUrls && info.friendlyUrls.length ? info.friendlyUrls : [];
          for (const u of urls) {
            if (!u.includes('localhost')) lines.push(`👉 ${u}`);
          }
          for (const f of friendly) {
            if (!lines.some((l) => l.includes(f))) lines.push(`⭐ ${f}/remote.html`);
          }
          d.remoteUrlsList.innerHTML = lines.length
            ? lines.map((l) => `<div>${l}</div>`).join('')
            : `<div>👉 http://${window.location.hostname}:${info.port || 8080}/remote.html</div>`;
        }
        if (d.remotePinsReadout) {
          d.remotePinsReadout.innerHTML = `🔑 PIN Técnico (Control Total): <strong>${info.adminPin || '1234'}</strong> &nbsp;|&nbsp; 🎧 PIN DJ Invitado (Logo/Texto/Vídeo): <strong>${info.djPin || 'dj'}</strong>`;
        }

        // 2. Telemetría del Mini-PC
        const sys = info.system;
        if (sys) {
          const tempStr = sys.cpuTempC !== null && sys.cpuTempC !== undefined ? ` · ${sys.cpuTempC}°C` : '';
          if (d.hudSysLoad) {
            d.hudSysLoad.textContent = `CPU ${sys.cpuPercent}% · RAM ${sys.ramPercent}%${tempStr}`;
            d.hudSysLoad.className = `telemetry-val ${sys.cpuPercent > 85 || (sys.cpuTempC && sys.cpuTempC > 82) ? 'warn' : 'ok'}`;
          }
          if (d.sysStatsBox) {
            const overloadState = sys.cpuPercent < 65
              ? '🟢 MINI-PC HOLGADO Y FLUIDO (Sin sobrecarga)'
              : sys.cpuPercent < 85
                ? '🟡 CARGA MEDIA NORMAL'
                : '🔴 CARGA ALTA — Baja Calidad GPU al 75% o 50%';
            d.sysStatsBox.innerHTML =
              `<div><strong>Estado General:</strong> ${overloadState}</div>` +
              `<div><strong>Procesador (${sys.cpuCores || 4} núcleos):</strong> ${sys.cpuPercent}% en uso (Carga 1m: ${sys.loadAvg1m})</div>` +
              `<div><strong>Memoria RAM:</strong> ${sys.ramUsedMb} MB / ${sys.ramTotalMb} MB (${sys.ramPercent}%)</div>` +
              `<div><strong>Temperatura CPU:</strong> ${sys.cpuTempC !== null ? sys.cpuTempC + ' °C' : 'Normal (sensor Linux en Mini-PC)'}</div>` +
              `<div><strong>Motor WebGL2:</strong> ${Math.round(this.state.fps)} FPS (${this.state.frameTimeMs.toFixed(1)} ms/frame · Escala GPU ${Math.round(this.state.resolutionScale * 100)}%)</div>`;
          }
          if (d.updateRepoUrlInput && sys.updateRepoUrl && !d.updateRepoUrlInput.value && document.activeElement !== d.updateRepoUrlInput) {
            d.updateRepoUrlInput.value = sys.updateRepoUrl;
          }
        }
      } catch (_) {}
    };

    const deskSudoPass = document.getElementById('desk-sudo-pass');
    const deskSharedNotes = document.getElementById('desk-shared-notes');
    const deskNotesStatus = document.getElementById('desk-notes-status');

    try {
      const savedSudo = localStorage.getItem('aether_sudo_pass');
      if (savedSudo && deskSudoPass) deskSudoPass.value = savedSudo;
    } catch (_) {}
    deskSudoPass?.addEventListener('input', () => {
      try { localStorage.setItem('aether_sudo_pass', deskSudoPass.value); } catch (_) {}
    });

    const loadDeskSharedNotes = async () => {
      if (!this._isHttp || !deskSharedNotes) return;
      try {
        const res = await fetch('/api/shared-notes');
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.notes === 'string' && data.notes.trim() && document.activeElement !== deskSharedNotes) {
          deskSharedNotes.value = data.notes;
        }
      } catch (_) {}
    };

    const pushDeskSharedNotes = async (showMsg) => {
      if (!this._isHttp || !deskSharedNotes) return;
      try {
        const res = await fetch('/api/shared-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: deskSharedNotes.value })
        });
        if (res.ok && showMsg && deskNotesStatus) {
          deskNotesStatus.style.color = '#00e676';
          deskNotesStatus.textContent = '✅ Texto enviado: ya aparece en el recuadro de tu móvil (remote.html).';
          setTimeout(() => { deskNotesStatus.textContent = ''; }, 4000);
        }
      } catch (_) {}
    };

    document.getElementById('btn-desk-sync-notes')?.addEventListener('click', () => pushDeskSharedNotes(true));
    let deskNotesTimer = null;
    deskSharedNotes?.addEventListener('input', () => {
      if (deskNotesTimer) clearTimeout(deskNotesTimer);
      deskNotesTimer = setTimeout(() => pushDeskSharedNotes(false), 600);
    });

    document.getElementById('btn-desk-copy-notes')?.addEventListener('click', async () => {
      if (!deskSharedNotes) return;
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(deskSharedNotes.value);
          copied = true;
        } catch (_) {}
      }
      if (!copied) {
        try {
          deskSharedNotes.focus();
          deskSharedNotes.select();
          copied = document.execCommand('copy');
        } catch (_) {}
      }
      if (deskNotesStatus) {
        deskNotesStatus.style.color = copied ? '#00e676' : '#ffab00';
        deskNotesStatus.textContent = copied ? '✅ Copiado al portapapeles.' : '⚠️ Selecciona el texto y pulsa Ctrl+C.';
        setTimeout(() => { deskNotesStatus.textContent = ''; }, 4000);
      }
    });

    document.querySelectorAll('[data-desk-preset]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!this._isHttp) return;
        const preset = btn.getAttribute('data-desk-preset');
        if (preset === 'reboot' && !window.confirm('¿Seguro que quieres reiniciar el Mini-PC ahora?')) return;
        if (deskSharedNotes) {
          deskSharedNotes.value = `⏳ Ejecutando: ${btn.textContent.trim()}...\nEspera unos segundos...`;
        }
        try {
          const res = await fetch('/api/system-terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pin: '1234',
              preset,
              sudoPass: deskSudoPass ? deskSudoPass.value : ''
            })
          });
          const data = await res.json();
          if (deskSharedNotes) {
            deskSharedNotes.value = (data.ok ? '✅ COMPLETADO:\n' : `⚠️ AVISO/ERROR (código ${data.exitCode}):\n`) + (data.output || '');
          }
          if (deskNotesStatus) {
            deskNotesStatus.style.color = '#00e676';
            deskNotesStatus.textContent = '✅ Salida enviada automáticamente a tu móvil.';
          }
        } catch (err) {
          if (deskSharedNotes) {
            deskSharedNotes.value = '❌ Error al ejecutar: ' + err.message;
          }
        }
      });
    });

    d.btnOpenRemoteModal?.addEventListener('click', () => {
      d.remoteModalBackdrop?.classList.remove('hidden');
      refreshNetworkAndStats();
      loadDeskSharedNotes();
    });
    d.btnCloseRemoteModal?.addEventListener('click', () => {
      d.remoteModalBackdrop?.classList.add('hidden');
    });
    d.remoteModalBackdrop?.addEventListener('click', (e) => {
      if (e.target === d.remoteModalBackdrop) d.remoteModalBackdrop.classList.add('hidden');
    });

    d.btnRunInternetUpdate?.addEventListener('click', async () => {
      if (!this._isHttp) return;
      const repoUrl = d.updateRepoUrlInput ? d.updateRepoUrlInput.value.trim() : '';
      if (d.updateStatusMsg) {
        d.updateStatusMsg.style.color = '#00e5ff';
        d.updateStatusMsg.textContent = '⏳ Descargando actualización por Internet y recompilando motor...';
      }
      try {
        const res = await fetch('/api/system-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl })
        });
        const data = await res.json();
        if (data.ok) {
          if (d.updateStatusMsg) {
            d.updateStatusMsg.style.color = '#00e676';
            d.updateStatusMsg.textContent = '✅ ' + (data.message || 'Actualizado con éxito. Recargando en 5s...');
          }
          setTimeout(() => window.location.reload(), 4800);
        } else if (d.updateStatusMsg) {
          d.updateStatusMsg.style.color = '#ff5252';
          d.updateStatusMsg.textContent = '❌ ' + (data.error || 'No se pudo actualizar');
        }
      } catch (err) {
        if (d.updateStatusMsg) {
          d.updateStatusMsg.style.color = '#ff5252';
          d.updateStatusMsg.textContent = '❌ Error de red al actualizar: ' + err.message;
        }
      }
    });

    if (this._isHttp) {
      refreshNetworkAndStats();
      setInterval(() => {
        refreshNetworkAndStats();
        if (d.remoteModalBackdrop && !d.remoteModalBackdrop.classList.contains('hidden')) {
          loadDeskSharedNotes();
        }
      }, 3500);
    }

    // ---- Máscaras ----
    d.maskSelectBtns.forEach((b) => {
      b.el.addEventListener('click', () => {
        this.maskSel = Math.max(0, Math.min(3, b.id));
        this._editorSig = '';
      });
    });
    d.btnMaskEnable?.addEventListener('click', () => {
      const mk = this._getMasks()[this.maskSel] || {};
      this._cmd({ action: 'SET_MASK', index: this.maskSel, prop: 'enabled', value: !mk.enabled });
    });
    const maskCmd = (prop) => (value) => ({ action: 'SET_MASK', index: this.maskSel, prop, value });
    this._bindCmdSlider(d.maskX, maskCmd('x'));
    this._bindCmdSlider(d.maskY, maskCmd('y'));
    this._bindCmdSlider(d.maskW, maskCmd('w'));
    this._bindCmdSlider(d.maskH, maskCmd('h'));
    this._bindCmdSlider(d.maskFeather, maskCmd('feather'), 0.01);

    // ---- Edge blending ----
    const edgeCmd = (prop) => (value) => ({ action: 'SET_EDGE_PROP', prop, value });
    this._bindCmdSlider(d.edgeOverlap, edgeCmd('overlap'), 0.15);
    this._bindCmdSlider(d.edgeGamma, edgeCmd('gamma'), 2.2);
    this._bindCmdSlider(d.edgeCurve, edgeCmd('curve'), 2.0);

    // ---- Mutación Automática por Vuelta de Loops (🤖 AUTO individual y maestro) ----
    d.autoModBtns?.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-auto-mod');
        if (!key) return;
        const cur = key === 'palette'
          ? Boolean(st.autoRotatePalette)
          : Boolean(st.autoMods && st.autoMods[key]);
        this._cmd({ action: 'SET_AUTO_MOD', key, value: !cur });
      });
    });

    d.btnAllAutoToggle?.addEventListener('click', () => {
      const allOn = Boolean(this.autopilot && this.autopilot.areAllAutoModsActive && this.autopilot.areAllAutoModsActive());
      this._cmd({ action: 'SET_ALL_AUTO', value: !allOn });
    });

    d.autoEveryBtns?.forEach((btn) => {
      btn.addEventListener('click', () => {
        const every = btn.getAttribute('data-every') || 'LAP';
        this._cmd({ action: 'SET_AUTO_CHANGE_EVERY', value: every });
      });
    });

    d.btnStepAutoNow?.addEventListener('click', () => {
      this._cmd({ action: 'STEP_AUTO_MODS_NOW' });
    });
  }

  _sendText() {
    const d = this.v2d;
    if (!d || !d.textInput) return;
    // Máximo 140 caracteres y 2 líneas
    const value = d.textInput.value.replace(/\r/g, '').split('\n').slice(0, 2).join('\n').slice(0, 140);
    if (value !== d.textInput.value) d.textInput.value = value;
    if (this._updateTextCharCount) this._updateTextCharCount();
    this._lastTextContent = value;
    this._cmd({ action: 'SET_TEXT_PROP', prop: 'content', value });
    this._cmd({ action: 'SET_TEXT_PROP', prop: 'enabled', value: value.trim().length > 0 });
  }

  // ===========================================================================
  // v2 · Vídeo / GIF: subida al servidor, biblioteca y reserva local (blob)
  // ===========================================================================

  _mediaKindOf(file) {
    const t = String(file.type || '').toLowerCase();
    const n = String(file.name || '').toLowerCase();
    if (t === 'image/gif' || n.endsWith('.gif')) return 'gif';
    if (t.startsWith('image/') || /\.(png|jpe?g|webp)$/.test(n)) return 'image';
    return 'video';
  }

  async _loadMediaFile(file) {
    if (!file) return;
    const kind = this._mediaKindOf(file);
    const maxUpload = 300 * 1024 * 1024;
    if (this._isHttp && file.size <= maxUpload) {
      this._mediaBusy = `⏳ SUBIENDO ${file.name} (${(file.size / 1048576).toFixed(1)} MB)...`;
      try {
        const res = await fetch('/api/media-upload?name=' + encodeURIComponent(file.name), {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data && data.ok && data.url) {
          this._mediaBusy = '';
          this._cmd({ action: 'LOAD_MEDIA', url: data.url, kind: data.kind || kind, name: data.name || file.name });
          this._refreshMediaLibrary();
          return;
        }
      } catch (_) {
        // Sin servidor o error de red: se usa el archivo local directamente
      }
      this._mediaBusy = '';
    }
    this._cmd({ action: 'LOAD_MEDIA_BLOB', file });
  }

  async _refreshMediaLibrary() {
    if (!this._isHttp) return;
    try {
      const res = await fetch('/api/media-list', { cache: 'no-store' });
      const data = await res.json();
      this._mediaLibItems = (data && data.ok && Array.isArray(data.items)) ? data.items : [];
      this._mediaLibError = false;
    } catch (_) {
      this._mediaLibItems = [];
      this._mediaLibError = true;
    }
    this._renderMediaLibrary();
  }

  _renderMediaLibrary() {
    const list = this.v2d && this.v2d.mediaLibList;
    if (!list) return;
    const items = this._mediaLibItems;
    if (!items.length) {
      list.innerHTML = this._mediaLibError
        ? '<div class="v2-media-empty">No se pudo leer la biblioteca del servidor.</div>'
        : '<div class="v2-media-empty">Aún no hay vídeos subidos. Pulsa 📂 ABRIR para añadir uno.</div>';
    } else {
      const icons = { video: '🎬', gif: '🌀', image: '🖼' };
      list.innerHTML = items.map((it, i) => {
        const name = this._escapeHtml(it.name || it.file || 'archivo');
        const size = typeof it.size === 'number' ? `${(it.size / 1048576).toFixed(1)} MB` : '';
        return `<div class="v2-media-item" data-url="${this._escapeHtml(it.url || '')}">`
          + `<span>${icons[it.kind] || '🎬'}</span>`
          + `<span class="v2-media-name" title="${name}">${name}</span>`
          + `<span class="v2-media-size">${size}</span>`
          + `<button type="button" data-act="play" data-idx="${i}" title="Poner en pantalla">▶</button>`
          + `<button type="button" class="v2-del" data-act="del" data-idx="${i}" title="Borrar del servidor">🗑</button>`
          + '</div>';
      }).join('');
    }
    this._libActiveUrl = null;
  }

  async _deleteMediaItem(item) {
    if (!item || !item.file) return;
    if (!window.confirm(`¿Borrar "${item.name || item.file}" del servidor?`)) return;
    try {
      await fetch('/api/media-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: item.file })
      });
    } catch (_) {}
    this._refreshMediaLibrary();
  }

  // ===========================================================================
  // v2 · Editor de corner-pin (4 esquinas arrastrables + máscaras dibujadas)
  // Coordenadas: x → derecha, y → abajo; el editor muestra el rango -0.25 .. 1.25
  // ===========================================================================

  _editorPoint(e) {
    const cv = this.v2d.cornerCanvas;
    const r = cv.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    return {
      px, py, w: r.width || 1, h: r.height || 1,
      nx: -0.25 + (px / (r.width || 1)) * 1.5,
      ny: -0.25 + (py / (r.height || 1)) * 1.5
    };
  }

  _clampCorner(v) {
    return Math.round(Math.max(-0.25, Math.min(1.25, v)) * 10000) / 10000;
  }

  _setCorner(index, x, y) {
    const map = this.state.fx.mapping || {};
    if (!map.cornerPin) this._cmd({ action: 'SET_MAP_PROP', prop: 'cornerPin', value: true });
    this._cmd({
      action: 'SET_CORNER',
      proj: this.cornerProj,
      index,
      x: this._clampCorner(x),
      y: this._clampCorner(y)
    });
    this._editorSig = '';
  }

  _bindCornerEditor() {
    const d = this.v2d;
    const cv = d.cornerCanvas;
    const editor = d.cornerEditor;
    if (!cv || !editor) return;

    cv.addEventListener('pointerdown', (e) => {
      const p = this._editorPoint(e);
      const corners = this._getCorners(this.cornerProj);
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < 4; i++) {
        const cx = ((corners[i][0] + 0.25) / 1.5) * p.w;
        const cy = ((corners[i][1] + 0.25) / 1.5) * p.h;
        const dist = Math.hypot(cx - p.px, cy - p.py);
        if (dist < bestD) {
          bestD = dist;
          best = i;
        }
      }
      this.cornerSel = best;
      if (bestD <= 18) {
        this._cornerDrag = {
          pointerId: e.pointerId,
          dx: corners[best][0] - p.nx,
          dy: corners[best][1] - p.ny
        };
        try { cv.setPointerCapture(e.pointerId); } catch (_) {}
        cv.classList.add('dragging');
      }
      try { editor.focus({ preventScroll: true }); } catch (_) { editor.focus(); }
      this._editorSig = '';
      e.preventDefault();
    });

    cv.addEventListener('pointermove', (e) => {
      const drag = this._cornerDrag;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const p = this._editorPoint(e);
      this._setCorner(this.cornerSel, p.nx + drag.dx, p.ny + drag.dy);
    });

    const endDrag = () => {
      this._cornerDrag = null;
      cv.classList.remove('dragging');
    };
    cv.addEventListener('pointerup', endDrag);
    cv.addEventListener('pointercancel', endDrag);
    cv.addEventListener('lostpointercapture', endDrag);

    editor.addEventListener('keydown', (e) => {
      const k = e.key;
      let handled = false;
      if (k >= '1' && k <= '4') {
        this.cornerSel = parseInt(k, 10) - 1;
        handled = true;
      } else if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        const step = e.shiftKey ? 0.02 : 0.002;
        const c = this._getCorners(this.cornerProj)[this.cornerSel];
        let x = c[0];
        let y = c[1];
        if (k === 'ArrowLeft') x -= step;
        else if (k === 'ArrowRight') x += step;
        else if (k === 'ArrowUp') y -= step;
        else y += step;
        this._setCorner(this.cornerSel, x, y);
        handled = true;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        this._editorSig = '';
      }
    });
    editor.addEventListener('focus', () => { this._editorSig = ''; });
    editor.addEventListener('blur', () => { this._editorSig = ''; });
  }

  _drawCornerEditor(map, edge, masks) {
    const d = this.v2d;
    const cv = d.cornerCanvas;
    const cw = cv.clientWidth;
    const ch = cv.clientHeight;
    if (!cw || !ch) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(cw * dpr);
    const H = Math.round(ch * dpr);
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const tx = (x) => ((x + 0.25) / 1.5) * W;
    const ty = (y) => ((y + 0.25) / 1.5) * H;
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const on = Boolean(map.cornerPin);
    const proj = this.cornerProj;
    const edgeMode = this._num(edge.mode, 0);

    ctx.setLineDash([]);
    ctx.fillStyle = '#07080b';
    ctx.fillRect(0, 0, W, H);

    // Rejilla de fondo cada 0.25
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let g = -0.25; g <= 1.2501; g += 0.25) {
      ctx.moveTo(tx(g), 0); ctx.lineTo(tx(g), H);
      ctx.moveTo(0, ty(g)); ctx.lineTo(W, ty(g));
    }
    ctx.stroke();

    // Pantalla nominal (0..1)
    const sx0 = tx(0), sy0 = ty(0), sw = tx(1) - tx(0), sh = ty(1) - ty(0);
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.strokeStyle = '#343b4f';
    ctx.strokeRect(sx0, sy0, sw, sh);
    ctx.setLineDash([]);

    // Zonas de solape del edge blending
    if (edgeMode !== 0) {
      const ov = Math.max(0.02, Math.min(0.45, this._num(edge.overlap, 0.15)));
      let a = 0;
      let b = 0;
      if (edgeMode === 1) { a = 0.5 - ov / 2; b = 0.5 + ov / 2; }
      else if (edgeMode === 2) { a = 1 - ov; b = 1; }
      else { a = 0; b = ov; }
      const grad = ctx.createLinearGradient(tx(a), 0, tx(b), 0);
      grad.addColorStop(0, 'rgba(255,157,0,0.04)');
      grad.addColorStop(0.5, 'rgba(255,157,0,0.22)');
      grad.addColorStop(1, 'rgba(255,157,0,0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(tx(a), sy0, tx(b) - tx(a), sh);
    }

    const drawQuad = (c, fill, stroke, dashed, gridLines) => {
      ctx.beginPath();
      ctx.moveTo(tx(c[0][0]), ty(c[0][1]));
      for (let i = 1; i < 4; i++) ctx.lineTo(tx(c[i][0]), ty(c[i][1]));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      ctx.setLineDash(dashed ? [5 * dpr, 4 * dpr] : []);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();
      ctx.setLineDash([]);
      if (gridLines) {
        ctx.strokeStyle = gridLines;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
          const t = i / 4;
          const p0 = lerp(c[0], c[1], t), p1 = lerp(c[3], c[2], t);
          const q0 = lerp(c[0], c[3], t), q1 = lerp(c[1], c[2], t);
          ctx.moveTo(tx(p0[0]), ty(p0[1])); ctx.lineTo(tx(p1[0]), ty(p1[1]));
          ctx.moveTo(tx(q0[0]), ty(q0[1])); ctx.lineTo(tx(q1[0]), ty(q1[1]));
        }
        ctx.stroke();
      }
    };

    // Cuadrilátero del otro proyector (referencia)
    if (edgeMode !== 0) {
      drawQuad(this._getCorners(proj === 1 ? 0 : 1), null, 'rgba(255,0,127,0.45)', true, null);
    }

    // Cuadrilátero activo
    const corners = this._getCorners(proj);
    drawQuad(
      corners,
      on ? 'rgba(0,240,255,0.08)' : 'rgba(148,156,176,0.05)',
      on ? '#00f0ff' : '#596174',
      false,
      on ? 'rgba(0,240,255,0.22)' : 'rgba(148,156,176,0.14)'
    );

    // Máscaras (coordenadas de pantalla)
    ctx.font = `700 ${8 * dpr}px monospace`;
    for (let i = 0; i < 4; i++) {
      const mk = masks[i];
      if (!mk) continue;
      const x = tx(this._num(mk.x, 0)), y = ty(this._num(mk.y, 0));
      const w = (this._num(mk.w, 0) / 1.5) * W, h = (this._num(mk.h, 0) / 1.5) * H;
      const sel = i === this.maskSel;
      if (!mk.enabled && !sel) continue;
      if (mk.enabled) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(x, y, w, h);
      }
      ctx.setLineDash(mk.enabled ? [] : [3 * dpr, 3 * dpr]);
      ctx.strokeStyle = sel ? '#ff007f' : 'rgba(255,0,127,0.5)';
      ctx.lineWidth = (sel ? 1.6 : 1) * dpr;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = sel ? '#ff4d88' : 'rgba(255,77,136,0.7)';
      ctx.fillText(`M${i + 1}`, x + 3 * dpr, y + 10 * dpr);
    }

    // Tiradores de las esquinas
    ctx.font = `800 ${9 * dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) {
      const x = tx(corners[i][0]);
      const y = ty(corners[i][1]);
      const sel = i === this.cornerSel;
      const r = (sel ? 7.5 : 6) * dpr;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = sel ? '#ff9d00' : (on ? '#00f0ff' : '#949cb0');
      ctx.fill();
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = '#000';
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillText(String(i + 1), x, y + 0.5 * dpr);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Avisos
    ctx.font = `700 ${8 * dpr}px monospace`;
    ctx.fillStyle = 'rgba(148,156,176,0.85)';
    if (!on) {
      ctx.fillText('CORNER-PIN APAGADO · ARRASTRA UNA ESQUINA PARA ACTIVARLO', 5 * dpr, H - 5 * dpr);
    } else if (document.activeElement === d.cornerEditor) {
      ctx.fillText('FLECHAS: MOVER · MAYÚS: RÁPIDO · 1-4: ESQUINA', 5 * dpr, H - 5 * dpr);
    }
    if (edgeMode !== 0) {
      ctx.fillStyle = proj === 1 ? '#ff4d88' : '#00f0ff';
      ctx.fillText(proj === 1 ? 'PROYECTOR 2 (DER.)' : 'PROYECTOR 1 (IZQ.)', 5 * dpr, 11 * dpr);
    }
  }

  // ===========================================================================
  // v2 · Reflejo del estado en la UI (se llama cada frame: solo toca el DOM si cambia algo)
  // ===========================================================================

  _updateV2UI() {
    const st = this.state;
    const d = this.v2d;
    if (!d) return;
    const v = this.v2;
    const n = (x, def) => this._num(x, def);
    const pct = (x) => `${Math.round(x * 100)}%`;
    if (!this._emptyObj) this._emptyObj = {};
    const EMPTY = this._emptyObj;

    // ---- Texto ----
    const t = st.text || EMPTY;
    const content = typeof t.content === 'string' ? t.content : '';
    if (d.textInput && content !== this._lastTextContent && document.activeElement !== d.textInput) {
      this._lastTextContent = content;
      d.textInput.value = content;
      if (this._updateTextCharCount) this._updateTextCharCount();
    }
    this._syncToggle(d.btnTextToggle, 'textEnabled', Boolean(t.enabled), '🟢 EN PANTALLA', '👁 MOSTRAR');
    this._syncGroup('textFont', v.textFontBtns, n(t.font, 0));
    this._syncGroup('textFx', v.textFxBtns, n(t.fxMode, 1));
    this._syncGroup('textPos', v.textPosBtns, n(t.pos, 0));
    this._syncGroup('textColor', v.textColorBtns, n(t.colorMode, 0));
    const tScale = n(t.scale, 0.5), tOpacity = n(t.opacity, 1.0), tBackdrop = n(t.backdrop, 0.4), tScroll = n(t.scrollSpeed, 0.5);
    this._syncSlider(d.textScale, d.textScaleVal, tScale, pct(tScale));
    this._syncSlider(d.textOpacity, d.textOpacityVal, tOpacity, pct(tOpacity));
    this._syncSlider(d.textBackdrop, d.textBackdropVal, tBackdrop, pct(tBackdrop));
    this._syncSlider(d.textScroll, d.textScrollVal, tScroll, pct(tScroll));

    // ---- Vídeo · GIF · Cámara ----
    const m = st.media || EMPTY;
    const source = m.source || 'none';
    const mEnabled = Boolean(m.enabled);
    this._syncToggle(d.btnMediaToggle, 'mediaEnabled', mEnabled, '🟢 EN PANTALLA', 'OCULTO', 'active');
    this._syncToggle(d.btnMediaCamera, 'mediaCam', source === 'camera', '🟢 CÁMARA', '📷 CÁMARA');
    this._syncToggle(d.btnMediaMirror, 'mediaMirror', Boolean(m.mirror), '↔ ESPEJO: SÍ', '↔ ESPEJO', 'active');
    this._syncGroup('mediaBlend', v.mediaBlendBtns, n(m.blend, 0));
    this._syncGroup('mediaFx', v.mediaFxBtns, n(m.fx, 0));
    this._syncGroup('mediaFit', d.mediaFitBtns, n(m.fit, 0));
    const mOpacity = n(m.opacity, 1.0), mBeat = n(m.beatZoom, 0.0), mSpeed = n(m.speed, 1.0);
    this._syncSlider(d.mediaOpacity, d.mediaOpacityVal, mOpacity, pct(mOpacity));
    this._syncSlider(d.mediaBeatZoom, d.mediaBeatZoomVal, mBeat, pct(mBeat));
    this._syncSlider(d.mediaSpeed, d.mediaSpeedVal, mSpeed, `${mSpeed.toFixed(2)}x`);

    // Lista de cámaras
    const cams = Array.isArray(st.cameras) ? st.cameras : [];
    let camSig = String(cams.length);
    for (let i = 0; i < cams.length; i++) camSig += '|' + (cams[i] && cams[i].deviceId) + ':' + (cams[i] && cams[i].label);
    const sel = d.mediaCameraSelect;
    if (sel && camSig !== this._camSig) {
      this._camSig = camSig;
      const keep = sel.value;
      sel.innerHTML = '';
      const def = document.createElement('option');
      def.value = '';
      def.textContent = cams.length ? 'CÁMARA POR DEFECTO' : 'CÁMARA POR DEFECTO (PULSA 🔄 PARA BUSCAR)';
      sel.appendChild(def);
      cams.forEach((c, i) => {
        if (!c) return;
        const opt = document.createElement('option');
        opt.value = c.deviceId || '';
        opt.textContent = c.label || `Cámara ${i + 1}`;
        sel.appendChild(opt);
      });
      sel.value = m.cameraId || keep || '';
      if (sel.value !== (m.cameraId || keep || '')) sel.value = '';
      this._camIdShown = m.cameraId || '';
    }
    if (sel && (m.cameraId || '') !== this._camIdShown && document.activeElement !== sel) {
      this._camIdShown = m.cameraId || '';
      sel.value = this._camIdShown;
      if (sel.value !== this._camIdShown) sel.value = '';
    }

    // Línea de estado del medio
    const statusSig = `${this._mediaBusy}|${source}|${m.name || ''}|${m.kind || ''}|${m.cameraId || ''}|${mEnabled}|${camSig}`;
    if (d.mediaStatus && statusSig !== this._mediaStatusSig) {
      this._mediaStatusSig = statusSig;
      let text = 'SIN VÍDEO NI CÁMARA';
      let cls = '';
      if (this._mediaBusy) {
        text = this._mediaBusy;
        cls = 'busy';
      } else if (source === 'camera') {
        const cam = cams.find((c) => c && c.deviceId === m.cameraId);
        text = `📷 CÁMARA EN DIRECTO: ${cam && cam.label ? cam.label : 'POR DEFECTO'}`;
        cls = mEnabled ? 'live' : '';
      } else if (source === 'file') {
        const icon = m.kind === 'gif' ? '🌀' : (m.kind === 'image' ? '🖼' : '🎬');
        text = `${icon} ${m.name || 'ARCHIVO'}`;
        cls = mEnabled ? 'live' : '';
      }
      if (source !== 'none' && !mEnabled && !this._mediaBusy) text += ' · OCULTO';
      d.mediaStatus.textContent = text;
      d.mediaStatus.title = text;
      d.mediaStatus.classList.toggle('live', cls === 'live');
      d.mediaStatus.classList.toggle('busy', cls === 'busy');
    }

    // Resaltar en la biblioteca el vídeo que está sonando
    const activeUrl = source === 'file' ? (m.url || '') : '';
    if (d.mediaLibList && activeUrl !== this._libActiveUrl) {
      this._libActiveUrl = activeUrl;
      const rows = d.mediaLibList.children;
      for (let i = 0; i < rows.length; i++) {
        rows[i].classList.toggle('active', Boolean(activeUrl) && rows[i].getAttribute('data-url') === activeUrl);
      }
    }

    // ---- Transición entre looks ----
    const tr = st.transition || EMPTY;
    this._syncGroup('transition', v.transitionBtns, n(tr.bars, 4));

    // ---- Corner-pin / máscaras / edge blending ----
    const map = st.fx.mapping || EMPTY;
    const edge = this._getEdge();
    const edgeMode = n(edge.mode, 0);
    this._syncToggle(d.btnCornerPin, 'cornerPin', Boolean(map.cornerPin), '◆ CORNER-PIN: SÍ', '◇ CORNER-PIN: NO');
    this._syncToggle(d.btnTestGrid2, 'testGrid2', Boolean(map.showTestGrid), '🟢 CARTA [G]', '🎯 CARTA [G]');

    // Escalador LED por Píxeles (X × Y)
    const ledOn = Boolean(map.ledScalerEnabled);
    const ledW = n(map.ledWidthPx, 1024);
    const ledH = n(map.ledHeightPx, 512);
    const ledOX = n(map.ledOffsetXPx, 0);
    const ledOY = n(map.ledOffsetYPx, 0);
    const ledAnchor = map.ledAnchor === 'center' ? 'center' : 'top-left';
    const ledAspect = map.ledKeepAspect !== false;

    this._syncToggle(
      d.btnLedScalerToggle,
      'ledScalerOn',
      ledOn,
      `🟢 ESCALADOR LED ACTIVO: ${ledW} × ${ledH} PX`,
      '🔲 ESCALADOR LED (PÍXELES X × Y): APAGADO'
    );
    if (d.ledWidthPx && document.activeElement !== d.ledWidthPx && Number(d.ledWidthPx.value) !== ledW) {
      d.ledWidthPx.value = ledW;
    }
    if (d.ledHeightPx && document.activeElement !== d.ledHeightPx && Number(d.ledHeightPx.value) !== ledH) {
      d.ledHeightPx.value = ledH;
    }
    if (d.ledOffsetXPx && document.activeElement !== d.ledOffsetXPx && Number(d.ledOffsetXPx.value) !== ledOX) {
      d.ledOffsetXPx.value = ledOX;
    }
    if (d.ledOffsetYPx && document.activeElement !== d.ledOffsetYPx && Number(d.ledOffsetYPx.value) !== ledOY) {
      d.ledOffsetYPx.value = ledOY;
    }
    d.ledPresetBtns?.forEach((btn) => {
      const bw = parseInt(btn.getAttribute('data-w'), 10);
      const bh = parseInt(btn.getAttribute('data-h'), 10);
      btn.classList.toggle('active', ledOn && bw === ledW && bh === ledH);
    });
    this._syncToggle(
      d.btnLedAnchor,
      'ledAnchor',
      ledAnchor === 'top-left',
      '↖ ANCLAJE: ESQUINA (0,0)',
      '🎯 ANCLAJE: CENTRADO',
      'active'
    );
    this._syncToggle(
      d.btnLedAspect,
      'ledAspect',
      ledAspect,
      '📐 GEOMETRÍA: SIN DEFORMAR',
      '↔ GEOMETRÍA: ESTIRAR A LED',
      'active'
    );

    const showProj = edgeMode !== 0;
    if (this._uiCache.showProj !== showProj) {
      this._uiCache.showProj = showProj;
      d.cornerProjRow?.classList.toggle('hidden-block', !showProj);
      if (!showProj && this.cornerProj !== 0) {
        this.cornerProj = 0;
        this._editorSig = '';
      }
    }
    this._syncGroup('cornerProj', d.cornerProjBtns, this.cornerProj);

    const masks = this._getMasks();
    let maskSig = String(this.maskSel);
    for (let i = 0; i < 4; i++) maskSig += masks[i] && masks[i].enabled ? '1' : '0';
    if (maskSig !== this._maskSelSig) {
      this._maskSelSig = maskSig;
      d.maskSelectBtns.forEach((b) => {
        const mk = masks[b.id];
        b.el.classList.toggle('active', b.id === this.maskSel);
        b.el.textContent = `MÁSC. ${b.id + 1}${mk && mk.enabled ? ' ●' : ''}`;
      });
      if (d.btnMaskEnable) {
        const cur = masks[this.maskSel] || EMPTY;
        d.btnMaskEnable.classList.toggle('logo-live', Boolean(cur.enabled));
        d.btnMaskEnable.textContent = cur.enabled
          ? `⬛ MÁSCARA ${this.maskSel + 1}: ACTIVA`
          : `▢ MÁSCARA ${this.maskSel + 1}: APAGADA`;
      }
    }
    const mk = masks[this.maskSel] || EMPTY;
    const mx = n(mk.x, 0.4), my = n(mk.y, 0.6), mw = n(mk.w, 0.2), mh = n(mk.h, 0.3), mf = n(mk.feather, 0.01);
    this._syncSlider(d.maskX, d.maskXVal, mx, pct(mx));
    this._syncSlider(d.maskY, d.maskYVal, my, pct(my));
    this._syncSlider(d.maskW, d.maskWVal, mw, pct(mw));
    this._syncSlider(d.maskH, d.maskHVal, mh, pct(mh));
    this._syncSlider(d.maskFeather, d.maskFeatherVal, mf, `${(mf * 100).toFixed(1)}%`);

    this._syncGroup('edgeMode', v.edgeModeBtns, edgeMode);
    const eo = n(edge.overlap, 0.15), eg = n(edge.gamma, 2.2), ec = n(edge.curve, 2.0);
    this._syncSlider(d.edgeOverlap, d.edgeOverlapVal, eo, pct(eo));
    this._syncSlider(d.edgeGamma, d.edgeGammaVal, eg, eg.toFixed(2));
    this._syncSlider(d.edgeCurve, d.edgeCurveVal, ec, ec.toFixed(2));

    // ---- Mutación Automática por Vuelta de Loops (🤖 AUTO individual y maestro) ----
    const am = st.autoMods || EMPTY;
    d.autoModBtns?.forEach((btn) => {
      const key = btn.getAttribute('data-auto-mod');
      const isOn = key === 'palette' ? Boolean(st.autoRotatePalette) : Boolean(am[key]);
      btn.classList.toggle('active', isOn);
      btn.textContent = isOn ? '🤖 AUTO: SÍ' : '🤖 AUTO';
    });

    const allAutoOn = Boolean(this.autopilot && this.autopilot.areAllAutoModsActive && this.autopilot.areAllAutoModsActive());
    this._syncToggle(
      d.btnAllAutoToggle,
      'allAutoMods',
      allAutoOn,
      '🟢 TODO EN AUTO: ACTIVO (CADA VUELTA ES ÚNICA)',
      '🤖 PONER TODO EN AUTO (LOOPS ÚNICOS POR HORAS)'
    );

    const changeEvery = am.changeEvery === 'SCENE' ? 'SCENE' : 'LAP';
    d.autoEveryBtns?.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-every') === changeEvery);
    });

    if (d.apLapReadout) {
      const lapNum = n(am.lapsCompleted, 0) + 1;
      const loopIdx = n(am.loopsInCurrentLap, 1);
      const totalLoops = n(am.lapTotalLoops, 8);
      this._setText(d.apLapReadout, `VUELTA #${lapNum} · LOOP ${loopIdx} / ${totalLoops}`);
    }

    // Editor: solo se redibuja si cambia algo y está visible
    const cv = d.cornerCanvas;
    if (cv && cv.offsetParent !== null) {
      const c1 = this._getCorners(0);
      const c2 = this._getCorners(1);
      let sig = `${cv.clientWidth}x${cv.clientHeight}|${map.cornerPin ? 1 : 0}|${this.cornerProj}|${this.cornerSel}|${this.maskSel}|${edgeMode}|${eo}|`;
      for (let i = 0; i < 4; i++) sig += `${c1[i][0]},${c1[i][1]},${c2[i][0]},${c2[i][1]};`;
      for (let i = 0; i < 4; i++) {
        const q = masks[i];
        if (q) sig += `${q.enabled ? 1 : 0},${q.x},${q.y},${q.w},${q.h};`;
      }
      if (sig !== this._editorSig) {
        this._editorSig = sig;
        this._drawCornerEditor(map, edge, masks);
        const names = ['SUP. IZQ.', 'SUP. DER.', 'INF. DER.', 'INF. IZQ.'];
        const c = (this.cornerProj === 1 ? c2 : c1)[this.cornerSel];
        this._setText(d.cornerReadout,
          `${showProj ? `PROY. ${this.cornerProj + 1} · ` : ''}ESQUINA ${this.cornerSel + 1} (${names[this.cornerSel]}): X ${c[0].toFixed(3)} · Y ${c[1].toFixed(3)}`);
      }
    }
  }
}


// ==================== MODULE: js/main.js ====================
/**
 * AETHER-VJ: Autonomous Generative Visual Engine — Main Bootstrapper
 * Coordinates the 60 FPS WebGL2 Render Pipeline, 8-Hour Autopilot Brain,
 * Audio FFT Analyzer, Projector Sync Bridge, and grandMA/Resolume Console UI.
 */









const AUTO_QUALITY_STEPS = [1.0, 0.75, 0.5];

class AetherVJApplication {
  constructor() {
    this.state = createInitialState();
    this.canvas = document.getElementById('aether-gl-canvas');
    const params = new URLSearchParams(window.location.search);
    this.isKiosk = params.get('kiosk') === '1';

    this.renderer = new WebGLRenderer(this.canvas);
    // In an unattended kiosk box, reload automatically if the GPU driver crashes and doesn't recover
    this.renderer.autoReloadOnContextLoss = this.isKiosk;
    this.audioAnalyzer = new AudioAnalyzer(this.state);
    this.autopilot = new AutopilotBrain(this.state);
    this.syncBridge = new SyncBridge(this.state, 'master');
    this.midiClock = new MidiClock(this.state);
    // Capa de vídeo / GIF / cámara en directo
    this.media = new MediaLayer(this.state);
    this.renderer.media = this.media;
    this.syncBridge.attachMedia(this.media);
    this.media.refreshCameras();
    this.persistence = new Persistence(this.state, this.syncBridge);
    this.ui = new ConsoleController(
      this.state,
      this.autopilot,
      this.audioAnalyzer,
      this.syncBridge
    );
    this.ui.midiClock = this.midiClock;
    this.syncBridge.attachControllers(this.autopilot, () => this.ui._buildGeneratorBanks());

    if (this.state.uiHidden) {
      document.body.classList.add('clean-output-active');
    }

    this.lastFrameTime = performance.now();
    this.fpsAccumTime = 0;
    this.fpsFrameCount = 0;

    // Auto-quality governor state
    this.refreshFpsEstimate = 0;
    this.lowFpsSeconds = 0;
    this.highFpsSeconds = 0;
    this.autoQualityStepIdx = 0;
    this.autoQualityWarmup = 4.0;

    // Start with internal BPM Synth FFT Sim enabled so audio reactivity is live out of the box
    this.audioAnalyzer.enableSimMode();

    // Restore saved Mapping / Presets / Logos (from aether-config.json or browser storage)
    this.persistence.load().then(() => {
      if (this.state.autoQuality) {
        this.state.resolutionScale = AUTO_QUALITY_STEPS[0];
      }
    });

    // Kiosk with ?mic=1: listen to the real room / mixer audio automatically (falls back to the simulator)
    if (this.isKiosk && params.get('mic') === '1') {
      setTimeout(() => {
        this.audioAnalyzer.enableMicrophone();
      }, 1500);
    }

    this._loop = this._loop.bind(this);
    this._initBackgroundWorkerKeepAlive();
    requestAnimationFrame(this._loop);
  }

  /**
   * Auto-quality governor: lowers internal resolution if the GPU can't keep up with the display,
   * and raises it again when there is headroom. Compares against the best FPS seen so far,
   * so 30 Hz TVs/projectors are not mistaken for a slow GPU.
   */
  _updateAutoQuality(dt) {
    const st = this.state;
    if (!st.autoQuality) return;
    // Keep the governor in step with the current scale (e.g. after the user re-enables AUTO)
    const currentIdx = AUTO_QUALITY_STEPS.indexOf(st.resolutionScale);
    this.autoQualityStepIdx = currentIdx >= 0 ? currentIdx : 0;
    if (currentIdx < 0) st.resolutionScale = AUTO_QUALITY_STEPS[0];
    if (this.autoQualityWarmup > 0) {
      this.autoQualityWarmup -= dt;
      return;
    }
    if (st.fps > this.refreshFpsEstimate) {
      this.refreshFpsEstimate = Math.min(st.fps, 240);
    }
    const target = this.refreshFpsEstimate;
    if (target < 20) return;

    if (st.fps < target * 0.82) {
      this.lowFpsSeconds += dt;
      this.highFpsSeconds = 0;
    } else if (st.fps > target * 0.95) {
      this.highFpsSeconds += dt;
      this.lowFpsSeconds = 0;
    } else {
      this.lowFpsSeconds = 0;
      this.highFpsSeconds = 0;
    }

    if (this.lowFpsSeconds > 4.0 && this.autoQualityStepIdx < AUTO_QUALITY_STEPS.length - 1) {
      this.autoQualityStepIdx += 1;
      st.resolutionScale = AUTO_QUALITY_STEPS[this.autoQualityStepIdx];
      this.lowFpsSeconds = 0;
      this.autoQualityWarmup = 3.0;
    } else if (this.highFpsSeconds > 45.0 && this.autoQualityStepIdx > 0) {
      this.autoQualityStepIdx -= 1;
      st.resolutionScale = AUTO_QUALITY_STEPS[this.autoQualityStepIdx];
      this.highFpsSeconds = 0;
      this.autoQualityWarmup = 3.0;
    }
  }

  /**
   * Keeps the engine, Autopilot, BPM clock, Projector Sync & Mobile Wi-Fi Remote
   * running at 60Hz even when Chrome is minimized or in a background tab.
   */
  _initBackgroundWorkerKeepAlive() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = (e) => {
          if (e.data === 'START') {
            if (!timer) timer = setInterval(() => self.postMessage('TICK'), 16);
          } else if (e.data === 'STOP') {
            if (timer) { clearInterval(timer); timer = null; }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.bgWorker = new Worker(URL.createObjectURL(blob));
      this.bgWorker.onmessage = () => {
        if (document.hidden) {
          this._stepEngine(performance.now(), true);
        }
      };
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.lastFrameTime = performance.now();
          this.bgWorker.postMessage('START');
        } else {
          this.bgWorker.postMessage('STOP');
          this.lastFrameTime = performance.now();
        }
      });
      if (document.hidden) {
        this.bgWorker.postMessage('START');
      }
    } catch (_) {
      // Fallback setInterval if Worker Blob is blocked
      setInterval(() => {
        if (document.hidden) {
          this._stepEngine(performance.now(), true);
        }
      }, 33);
    }
  }

  _stepEngine(now, isBackground = false) {
    const rawDt = (now - this.lastFrameTime) / 1000.0;
    const dt = Math.min(0.1, Math.max(0.0001, rawDt));
    this.lastFrameTime = now;

    this.state.renderTime += dt;

    // FPS & Frame Time Telemetry
    this.fpsAccumTime += rawDt;
    this.fpsFrameCount += 1;
    if (this.fpsAccumTime >= 0.35) {
      this.state.fps = this.fpsFrameCount / this.fpsAccumTime;
      this.state.frameTimeMs = (this.fpsAccumTime * 1000.0) / this.fpsFrameCount;
      this.fpsAccumTime = 0;
      this.fpsFrameCount = 0;
    }

    // 1. Update Audio FFT Envelope
    this.audioAnalyzer.update(dt);

    // 1.5 MIDI Clock watchdog (detects when the mixer stops sending clock)
    this.midiClock.update();

    // 2. Update 8-Hour Autopilot Brain, BPM Clock, and 8 Multi-Wave LFOs
    this.autopilot.update(dt);

    // 3. Execute Multi-Pass GPU Shader Pipeline (skip GPU draw if window is minimized to save power while keeping Projector & Remote live)
    if (!isBackground) {
      this.renderer.renderFrame(this.state);
      this._updateAutoQuality(dt);
    }

    // 4. Broadcast 60Hz Sync Packet to Clean Output Projector Window (if open)
    this.syncBridge.broadcastState();

    // 4.5 Auto-save Mapping / Presets / Logos when they change
    this.persistence.tick(dt);

    // 5. Update Console UI Faders, Meters & Readouts
    if (!isBackground) {
      this.ui.updateUI();
    }
  }

  _loop(now) {
    if (!document.hidden) {
      this._stepEngine(now, false);
    }
    requestAnimationFrame(this._loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__AETHER_VJ = new AetherVJApplication();
});

})();
