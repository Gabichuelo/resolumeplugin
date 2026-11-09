/**
 * AETHER-VJ: Central Reactive State & Metadata Store (Edición Evento Elegante & Intuitiva)
 * Incluye 32 Generadores Algorítmicos GLSL divididos en 4 Familias claras:
 *   - BANCO C (16..23) [FLT]: Geometría Plana Pura (Sin Brillo / Sin Efectos, trazos y bloques limpios)
 *   - BANCO A (0..7)   [GEO]: Formas Geométricas 2D (Cuadrados, Triángulos, Polígonos)
 *   - BANCO B (8..15)  [KIN]: Líneas Dinámicas (Fino ⟷ Grueso) y Barridos Izq ➔ Der
 *   - BANCO D (24..31) [SPC]: Profundidad 3D, Portales y Horizontes
 */

export const SHAPE_MODES = [
  { id: 0, code: 'AUTO', name: 'Automática', icon: '◈' },
  { id: 1, code: 'SQUARE', name: 'Cuadrados □', icon: '□' },
  { id: 2, code: 'TRIANGLE', name: 'Triángulos △', icon: '△' },
  { id: 3, code: 'HEXAGON', name: 'Hexágonos ⬡', icon: '⬡' },
  { id: 4, code: 'DIAMOND', name: 'Rombos ◇', icon: '◇' },
  { id: 5, code: 'LINES', name: 'Solo Líneas ≡', icon: '≡' }
];

export const STYLE_MODES = [
  { id: 0, code: 'AUTO', name: '✨ Normal' },
  { id: 1, code: 'FLAT', name: '⏹ 100% Plano (Sin Brillo)' },
  { id: 2, code: 'OUTLINE', name: '📐 Solo Línea Fina' },
  { id: 3, code: 'SOLID', name: '🎨 Bloques Sólidos' }
];

export const SWEEP_MODES = [
  { id: 0, code: 'OFF', name: 'Sin Barrido' },
  { id: 1, code: 'L2R', name: '➔ Izq a Der' },
  { id: 2, code: 'R2L', name: '⬅ Der a Izq' },
  { id: 3, code: 'PINGPONG', name: '↔ Vaivén Suave' },
  { id: 4, code: 'SPLIT', name: '◄► Desde el Centro' },
  { id: 5, code: 'CURTAIN', name: '▮ Cortina Limpia' }
];

export const WEIGHT_MODES = [
  { id: 0, code: 'UNIFORM', name: 'Fijo (Manual)' },
  { id: 1, code: 'BREATHE', name: '〰 Respira (Fino ⟷ Grueso)' },
  { id: 2, code: 'WAVE_LR', name: '🌊 Ola Izq ➔ Der' },
  { id: 3, code: 'ALTERNATE', name: '◫ Alternar Fino/Grueso' }
];

export const EFFECT_3D_MODES = [
  { id: 0, code: 'OFF', name: '⏹ 2D Plano (Normal)' },
  { id: 1, code: 'TILT', name: '📐 Plano Flotante 3D' },
  { id: 2, code: 'EXTRUDE', name: '🧊 Relieve / Extrusión 3D' },
  { id: 3, code: 'CYLINDER', name: '🏟 Curva / Cilindro 3D' }
];

export const LOGO_FX_MODES = [
  { id: 0, code: 'CLEAN', name: '⏹ Fijo Limpio' },
  { id: 1, code: 'PULSE', name: '💓 Latido BPM + Halo' },
  { id: 2, code: '3D', name: '🧊 Logo 3D con Relieve' },
  { id: 3, code: 'NEON_GLITCH', name: '⚡ Neón + Glitch RGB' },
  { id: 4, code: 'STENCIL', name: '🎭 Silueta / Máscara' }
];

export const LOGO_POS_MODES = [
  { id: 0, code: 'CENTER', name: '🎯 Centro' },
  { id: 1, code: 'TOP', name: '⬆️ Arriba Cabina' },
  { id: 2, code: 'CORNER', name: '↘️ Esquina (TV)' }
];

// ---- Textos en pantalla (nombre del DJ, mensajes, cuentas atrás) ----
export const TEXT_FONTS = [
  { id: 0, name: 'Impacto', css: '900 {px}px "Arial Black", Impact, "Segoe UI Black", sans-serif' },
  { id: 1, name: 'Mono Tech', css: '800 {px}px "JetBrains Mono", Consolas, "Courier New", monospace' },
  { id: 2, name: 'Elegante', css: 'italic 700 {px}px Georgia, "Times New Roman", serif' },
  { id: 3, name: 'Redonda', css: '800 {px}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif' }
];

export const TEXT_FX_MODES = [
  { id: 0, name: '⏹ Limpio' },
  { id: 1, name: '💓 Latido + Halo' },
  { id: 2, name: '⚡ Neón Glitch RGB' },
  { id: 3, name: '📜 Ticker (desplazamiento)' },
  { id: 4, name: '🌊 Onda' },
  { id: 5, name: '🎭 Silueta (visual dentro)' },
  { id: 6, name: '🧊 Relieve 3D' }
];

export const TEXT_POS_MODES = [
  { id: 0, name: '🎯 Centro' },
  { id: 1, name: '⬆️ Arriba' },
  { id: 2, name: '⬇️ Abajo' }
];

export const TEXT_COLOR_MODES = [
  { id: 0, name: '⚪ Blanco' },
  { id: 1, name: '🎨 Color de la paleta' },
  { id: 2, name: '🌈 Arcoíris animado' }
];

// ---- Capa de vídeo / GIF / cámara en directo ----
export const MEDIA_BLEND_MODES = [
  { id: 0, name: '⬛ Encima (tapa)' },
  { id: 1, name: '✨ Pantalla (suma luz)' },
  { id: 2, name: '🎭 Máscara (visual dentro del vídeo)' },
  { id: 3, name: '🔀 Diferencia' },
  { id: 4, name: '🌗 Mitad y mitad' }
];

export const MEDIA_FX_MODES = [
  { id: 0, name: '⏹ Normal' },
  { id: 1, name: '💠 Bordes Neón' },
  { id: 2, name: '🎨 Duotono Paleta' },
  { id: 3, name: '🔥 Térmica' },
  { id: 4, name: '🟨 Pop-Art' },
  { id: 5, name: '👻 Fantasma' },
  { id: 6, name: '▦ Pixel LED' }
];

// ---- Transiciones entre Looks guardados (en compases, sincronizadas al BPM) ----
export const TRANSITION_BARS = [0, 1, 2, 4, 8, 16];

// ---- Edge blending de 2 proyectores ----
export const EDGE_BLEND_MODES = [
  { id: 0, name: '⏹ Apagado' },
  { id: 1, name: '🖥🖥 2 proyectores en 1 ventana' },
  { id: 2, name: '◧ Este es el IZQUIERDO' },
  { id: 3, name: '◨ Este es el DERECHO' }
];

export function defaultCorners() {
  return [[0, 0], [1, 0], [1, 1], [0, 1]];
}

export function defaultMasks() {
  return [
    { enabled: false, x: 0.40, y: 0.60, w: 0.20, h: 0.30, feather: 0.01 },
    { enabled: false, x: 0.05, y: 0.05, w: 0.15, h: 0.15, feather: 0.01 },
    { enabled: false, x: 0.80, y: 0.05, w: 0.15, h: 0.15, feather: 0.01 },
    { enabled: false, x: 0.40, y: 0.05, w: 0.20, h: 0.15, feather: 0.01 }
  ];
}

export const SLICE_MODES = [
  { id: 0, code: 'FULL', name: '🖥 1 Pantalla Completa' },
  { id: 1, code: 'TOTEMS', name: '▮▮▮ Tótems Verticales' },
  { id: 2, code: 'STAGE_DJ', name: '🎧 Cabina DJ + 2 Tótems' },
  { id: 3, code: 'BANDS', name: '☰ Bandas Horizontales' },
  { id: 4, code: 'GRID', name: '⊞ Matriz de Paneles LED' }
];

export const GENERATORS = [
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

export const MACRO_DEFS = [
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

export const LFO_WAVES = ['OFF', 'SINE', 'TRI', 'PERLIN', 'STEP'];

export const AUTOPILOT_MODES = {
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

export function createInitialState() {
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
      audioAmount: def.audioAmount
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
    }
  };
}
