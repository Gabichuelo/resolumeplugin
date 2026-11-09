/**
 * AETHER-VJ: 32 Complete Production-Grade GLSL Fragment Shaders
 *   - BANK A (0..7)  [GEO]: Orthographic 2D Geometry, Squares, Triangles & Polygons
 *   - BANK B (8..15) [KIN]: Dynamic Line Weights (Thin <-> Giant), L-to-R Sweeps & Kinetic Arrays
 *   - BANK C (16..23)[FLT]: Pure Flat Vector Graphics (Zero Glow / Zero FX, Color & Stroke Morphing)
 *   - BANK D (24..31)[SPC]: Architectural Portals, Horizon Grids, Vector Topography, 3D SDF & Audio Geometry
 */

import { COMMON_GLSL_HEADER } from './common.glsl.js';

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

export const GENERATOR_SHADERS = [
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
