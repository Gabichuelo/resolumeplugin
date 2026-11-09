/**
 * AETHER-VJ: Shared WebGL2 GLSL Mathematical Library (#version 300 es)
 * Includes:
 *   - Sub-pixel Anti-Aliased Flat Vector Primitives (fwidth SVG-grade crispness, Zero Glow)
 *   - Rigid Orthographic Non-Tunnel Coordinate Transform
 *   - Dynamic Line-Weight Engine (Morphing Thin 1px <-> Giant Monolith Bars)
 *   - Global Directional Sweep Engine (L->R, R->L, Ping-Pong, Center Split, Curtain Wipe)
 *   - Exact 2D Signed Distance Fields (Square, Triangle, Hexagon, Rhombus, Circle, Capsule)
 */

export const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const COMMON_GLSL_HEADER = `#version 300 es
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
