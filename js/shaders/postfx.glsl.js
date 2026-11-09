/**
 * AETHER-VJ: Master A/B Crossfade, Ping-Pong Feedback & 6-Stage Post-FX Rack Shader
 * Engineered for Resolume Arena Luma/Alpha keying and 60 FPS GPU execution.
 */

export const FEEDBACK_COMPOSITE_SHADER_SRC = `#version 300 es
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

export const POSTFX_RACK_SHADER_SRC = `#version 300 es
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
