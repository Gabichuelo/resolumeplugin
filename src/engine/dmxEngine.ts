import { COLOR_PALETTE_RGB } from '../constants/defaultShowData';
import type {
  ColorPaletteId,
  ComputedFixtureFrame,
  FixtureProfile,
  GroupCalibration,
  GroupId,
  GroupProgrammerState,
  ManualXYOverride,
  PatchedFixture,
  PositionPaletteCalibration,
  PositionPaletteId,
  RecipeFxConfig,
  RecipeScene,
} from '../types/dmx';

export interface EngineEvaluationInput {
  fixtures: PatchedFixture[];
  profiles: FixtureProfile[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  activeScenes: RecipeScene[];
  bpm: number;
  timeSec: number;
  globalMaster: number; // 0..1
  globalFxSize: number; // 0..2 multiplier
  globalFxSpeed: number; // 0.25..4 multiplier
  globalBlackout: boolean;
  highlightFixtureId?: string | null;
  manualXYOverride?: ManualXYOverride;
  groupProgrammers?: Record<GroupId, GroupProgrammerState>;
  crossfadeSec?: number; // 0..5s smooth transition & Pan/Tilt motor damping
  prevFrames?: Record<string, ComputedFixtureFrame>;
  dtSec?: number;
  tempColorBump?: Exclude<ColorPaletteId, 'transparent'> | null;
  stompMovement?: boolean;
  globalFanSpread?: number; // -1.0 (Cross X) .. 0.0 (Normal) .. +1.0 (Wide Fan Out)
  moveFxSpeed?: number;     // Independent Speed Master for Pan/Tilt movements
  chaseFxSpeed?: number;    // Independent Speed Master for Dimmer/Color/2D Chasers
  globalPositionOverride?: PositionPaletteId;
  positionCalibrations?: Record<Exclude<PositionPaletteId, 'transparent'>, PositionPaletteCalibration>;
  manualDmxOverrides?: Record<string, number>; // key: `${universe}:${channel1Based}` -> 0..255
  globalColorTheme?: {
    primary: Exclude<ColorPaletteId, 'transparent'>;
    secondary: Exclude<ColorPaletteId, 'transparent'>;
  } | null;
  customRgbwOverride?: {
    enabled: boolean;
    r: number;
    g: number;
    b: number;
    w: number;
  } | null;
  audioBassLevel?: number; // 0..100 live FFT bass level for VU-meter
  followspotWhiteActive?: boolean;
  sceneSubmasterLevels?: Record<string, number>;
  globalOpticsOverride?: {
    goboSlot: number | 'auto';
    prismActive: boolean | 'auto';
    zoomValue: number | 'auto'; // 0..1
  };
  worklightActive?: boolean;
  isolateManualDmxUniverse?: number | null;
}

export interface EngineEvaluationResult {
  fixtureFrames: Record<string, ComputedFixtureFrame>;
  universes: Record<number, number[]>;
}

/**
 * Computes the normalized phase offset [0..1) and mirror sign (+1 or -1) for fixture `idx` out of `total`
 * using GrandMA2-style Blocks, Interleave (Groups), Wings (Symmetry), and 2D Stage Layout coordinates (stageX, stageY).
 */
export function computeSymmetricPhase(
  idx: number,
  total: number,
  fx: RecipeFxConfig,
  stageX = 0,
  stageY = 0.5
): { phaseOffset: number; mirrorPanSign: number; isOddSlot: boolean } {
  const blockSize = Math.max(1, fx.blocks);
  const blockedIdx = Math.floor(idx / blockSize);
  const blockedTotal = Math.max(1, Math.ceil(total / blockSize));
  const isOddSlot = blockedIdx % 2 === 1;

  // 2D Stage Layout Propagation Modes (MA2 Layout View / Wolfmix 2D Matrix)
  if (fx.wingDirection === 'back_to_front') {
    const spreadFactor = fx.phaseSpread / 360;
    return {
      phaseOffset: (Math.max(0, Math.min(1, stageY)) * spreadFactor) % 1,
      mirrorPanSign: stageX <= 0 ? 1 : -1,
      isOddSlot,
    };
  }
  if (fx.wingDirection === 'front_to_back') {
    const spreadFactor = fx.phaseSpread / 360;
    return {
      phaseOffset: (Math.max(0, Math.min(1, 1 - stageY)) * spreadFactor) % 1,
      mirrorPanSign: stageX <= 0 ? 1 : -1,
      isOddSlot,
    };
  }
  if (fx.wingDirection === 'radial_center') {
    const dy = (stageY - 0.5) * 2;
    const dist = Math.min(1, Math.hypot(stageX, dy) / 1.35);
    const spreadFactor = fx.phaseSpread / 360;
    return {
      phaseOffset: (dist * spreadFactor) % 1,
      mirrorPanSign: stageX <= 0 ? 1 : -1,
      isOddSlot,
    };
  }
  if (fx.wingDirection === 'diagonal_2d') {
    const diag = Math.max(0, Math.min(1, (stageX + 1) * 0.25 + stageY * 0.5));
    const spreadFactor = fx.phaseSpread / 360;
    return {
      phaseOffset: (diag * spreadFactor) % 1,
      mirrorPanSign: stageX <= 0 ? 1 : -1,
      isOddSlot,
    };
  }

  if (total <= 1) {
    return { phaseOffset: 0, mirrorPanSign: 1, isOddSlot: false };
  }

  // 1D Truss Grouping & Mirror Wings
  let effectiveIdx = blockedIdx;
  let effectiveSpan = blockedTotal;
  let mirrorPanSign = 1;

  if (fx.wings === 2 && blockedTotal > 1) {
    const half = (blockedTotal - 1) / 2;
    const distFromCenter = Math.abs(blockedIdx - half);
    mirrorPanSign = blockedIdx <= half ? 1 : -1;
    effectiveSpan = Math.max(1, Math.ceil(blockedTotal / 2));

    if (fx.wingDirection === 'outside_in') {
      effectiveIdx = half - distFromCenter;
    } else {
      effectiveIdx = distFromCenter;
    }
  } else if (fx.wings === 4 && blockedTotal > 1) {
    const quarterSpan = Math.max(1, blockedTotal / 4);
    const posInHalf = blockedIdx % Math.max(1, Math.ceil(blockedTotal / 2));
    const halfOfHalf = Math.max(0.5, quarterSpan - 0.5);
    effectiveIdx = Math.abs(posInHalf - halfOfHalf);
    effectiveSpan = Math.max(1, quarterSpan);
    mirrorPanSign = blockedIdx < blockedTotal / 2 ? 1 : -1;
  }

  if (fx.interleave > 1) {
    effectiveIdx = effectiveIdx % fx.interleave;
    effectiveSpan = fx.interleave;
  }

  const normalizedPos = effectiveSpan <= 1 ? 0 : effectiveIdx / effectiveSpan;
  const spreadFactor = fx.phaseSpread / 360;

  return {
    phaseOffset: (normalizedPos * spreadFactor) % 1,
    mirrorPanSign,
    isOddSlot,
  };
}

function resolvePositionPaletteNorm(
  palette: PositionPaletteId,
  stageX: number,
  positionCalibrations?: Record<Exclude<PositionPaletteId, 'transparent'>, PositionPaletteCalibration>
): { panNorm: number; tiltNorm: number } {
  if (palette === 'transparent') {
    return { panNorm: 0, tiltNorm: 0 };
  }
  const custom = positionCalibrations?.[palette];
  if (custom) {
    return {
      panNorm: custom.panOffsetNorm + stageX * custom.fanFactor,
      tiltNorm: custom.tiltOffsetNorm,
    };
  }
  switch (palette) {
    case 'downstage':
      return { panNorm: 0, tiltNorm: -0.35 };
    case 'sky_fan':
      return { panNorm: stageX * 0.65, tiltNorm: 0.65 };
    case 'x_cross':
      return { panNorm: stageX < 0 ? 0.55 : -0.55, tiltNorm: 0.15 };
    case 'center_focus':
      return { panNorm: -stageX * 0.5, tiltNorm: -0.15 };
    case 'floor_wash':
      return { panNorm: 0, tiltNorm: -0.85 };
    case 'dj_booth':
      return { panNorm: -stageX * 0.35, tiltNorm: -0.45 };
    case 'wide_roof':
      return { panNorm: stageX * 0.85, tiltNorm: 0.85 };
    default:
      return { panNorm: 0, tiltNorm: 0 };
  }
}

function hueToRgbAndPalette(hue01: number): {
  r: number;
  g: number;
  b: number;
  nearestPalette: Exclude<ColorPaletteId, 'transparent'>;
} {
  const h = ((hue01 % 1) + 1) % 1;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const q = Math.round((1 - f) * 255);
  const t = Math.round(f * 255);

  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      r = 255;
      g = t;
      b = 0;
      break;
    case 1:
      r = q;
      g = 255;
      b = 0;
      break;
    case 2:
      r = 0;
      g = 255;
      b = t;
      break;
    case 3:
      r = 0;
      g = q;
      b = 255;
      break;
    case 4:
      r = t;
      g = 0;
      b = 255;
      break;
    case 5:
      r = 255;
      g = 0;
      b = q;
      break;
  }

  const wheelOrder: Exclude<ColorPaletteId, 'transparent'>[] = [
    'red',
    'amber',
    'green',
    'cyan',
    'blue',
    'uv',
    'magenta',
  ];
  const nearestPalette = wheelOrder[Math.floor(h * wheelOrder.length) % wheelOrder.length];
  return { r, g, b, nearestPalette };
}

export function evaluateDmxEngine(input: EngineEvaluationInput): EngineEvaluationResult {
  const {
    fixtures,
    profiles,
    groupCalibrations,
    activeScenes,
    bpm,
    timeSec,
    globalMaster,
    globalFxSize,
    globalFxSpeed,
    globalBlackout,
    highlightFixtureId,
    manualXYOverride,
    groupProgrammers,
    crossfadeSec = 0,
    prevFrames,
    dtSec = 0.025,
    tempColorBump = null,
    stompMovement = false,
    globalFanSpread = 0,
    moveFxSpeed,
    chaseFxSpeed,
    globalPositionOverride = 'transparent',
    positionCalibrations,
    manualDmxOverrides,
    globalColorTheme = null,
    customRgbwOverride = null,
    audioBassLevel = 0,
    followspotWhiteActive = false,
    sceneSubmasterLevels,
    globalOpticsOverride,
    worklightActive = false,
    isolateManualDmxUniverse = null,
  } = input;

  const effMoveSpeed = moveFxSpeed ?? globalFxSpeed;
  const effChaseSpeed = chaseFxSpeed ?? globalFxSpeed;
  const anyGroupSolo = Object.values(groupCalibrations).some((c) => Boolean(c?.soloActive));

  const profileMap = new Map<string, FixtureProfile>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  const groupCounts: Record<GroupId, number> = {
    beams: 0,
    washes: 0,
    spots: 0,
    blinders: 0,
    strobes: 0,
    bars: 0,
  };
  fixtures.forEach((f) => {
    groupCounts[f.groupId] = (groupCounts[f.groupId] || 0) + 1;
  });

  const universes: Record<number, number[]> = {
    1: new Array(512).fill(0),
    2: new Array(512).fill(0),
    3: new Array(512).fill(0),
    4: new Array(512).fill(0),
  };

  const fixtureFrames: Record<string, ComputedFixtureFrame> = {};
  const beatsElapsed = (timeSec * Math.max(30, bpm)) / 60;
  const hasFlashSceneActive = activeScenes.some((s) => s.isFlashButton);
  const hasExplicitDimmerScene = activeScenes.some(
    (s) => !s.isFlashButton && (s.bankId === 'bank_dimmers' || s.bankId === 'bank_dimmer')
  );

  for (const fix of fixtures) {
    const profile = profileMap.get(fix.profileId) || profiles[0];
    const cal = groupCalibrations[fix.groupId];
    const groupTotal = Math.max(1, groupCounts[fix.groupId]);

    let dimmer = 0;
    let colorPalette: Exclude<ColorPaletteId, 'transparent'> = 'white';
    let r = 255,
      g = 255,
      b = 255,
      w = 255;
    let basePanNorm = 0;
    let baseTiltNorm = 0;
    let hasExplicitPositionScene = false;
    let fxPanDelta = 0;
    let fxTiltDelta = 0;
    let strobeMode: 'off' | 'slow' | 'medium' | 'fast' | 'blinder' = 'off';
    let prism = false;
    let prismRotate = false;
    let gobo = 0;
    let zoom = 0.5;

    const orderedScenes = [
      ...activeScenes.filter((s) => !s.isFlashButton),
      ...activeScenes.filter((s) => s.isFlashButton),
    ];

    for (const scene of orderedScenes) {
      if (!scene.targetGroups.includes(fix.groupId)) continue;
      if (
        scene.targetZones &&
        scene.targetZones.length > 0 &&
        fix.locationZone &&
        !scene.targetZones.includes(fix.locationZone)
      ) {
        continue;
      }

      const sym = computeSymmetricPhase(
        fix.orderInGroup,
        groupTotal,
        scene.fx,
        fix.stageX,
        fix.stageY
      );
      const isMoveFx =
        scene.fx.waveform === 'circle_pt' ||
        scene.fx.waveform === 'tilt_wave' ||
        scene.fx.waveform === 'pan_sweep' ||
        scene.fx.waveform === 'figure8_pt' ||
        scene.fx.waveform === 'ballyhoo';
      // Base movement speed is 0.25x ("la mitad de la mitad") so when Speed P/T is at normal (1x / 0),
      // moving heads sweep smoothly over 4-8 beats instead of rushing, and can be adjusted down or up from there
      const speedMult = isMoveFx ? effMoveSpeed * 0.25 : effChaseSpeed;

      const cyclePos =
        (beatsElapsed * scene.fx.bpmDivision * speedMult - sym.phaseOffset) % 1;
      const normPhase = cyclePos < 0 ? cyclePos + 1 : cyclePos;
      const angleRad = normPhase * Math.PI * 2;
      const sceneFaderLevel =
        sceneSubmasterLevels && typeof sceneSubmasterLevels[scene.id] === 'number'
          ? Math.max(0, Math.min(1, sceneSubmasterLevels[scene.id]))
          : 1;
      const effSize = Math.max(0, Math.min(1, scene.fx.size * globalFxSize * sceneFaderLevel));

      if (scene.dimmer !== 'transparent') {
        dimmer = scene.dimmer * sceneFaderLevel;
      } else if (!hasExplicitDimmerScene && dimmer === 0) {
        // Fallback: if no Bank 1 Base Intensity button is selected, still turn on fixtures targeted by active Color/Move/FX scenes
        dimmer = sceneFaderLevel;
      }

      if (scene.colorPrimary !== 'transparent') {
        let chosenPalette = scene.colorPrimary;
        if (scene.colorSecondary !== 'transparent' && sym.isOddSlot) {
          chosenPalette = scene.colorSecondary;
        }
        colorPalette = chosenPalette;
        const rgbDef = COLOR_PALETTE_RGB[chosenPalette];
        r = rgbDef.r;
        g = rgbDef.g;
        b = rgbDef.b;
        w = rgbDef.w;
      }

      if (scene.positionPalette !== 'transparent') {
        const isPosBank = scene.bankId === 'bank_positions' || scene.isFlashButton;
        if (isPosBank || !hasExplicitPositionScene) {
          const pos = resolvePositionPaletteNorm(
            scene.positionPalette,
            fix.stageX,
            positionCalibrations
          );
          basePanNorm = pos.panNorm;
          baseTiltNorm = pos.tiltNorm;
          if (isPosBank) hasExplicitPositionScene = true;
        }
      }

      if (scene.strobeMode !== 'off') {
        strobeMode = scene.strobeMode;
      }
      if (scene.prismActive) {
        prism = true;
        prismRotate = scene.prismRotate;
      }
      if (scene.goboSlot > 0) {
        gobo = scene.goboSlot;
      }
      if (scene.zoomValue !== 'transparent') {
        zoom = scene.zoomValue;
      }

      switch (scene.fx.waveform) {
        case 'dimmer_chase': {
          const duty = Math.max(0.1, Math.min(0.9, scene.fx.dutyCycle || 0.4));
          let stepVal = 0;
          if (normPhase < duty) {
            const localPos = normPhase / duty;
            stepVal = Math.sin(localPos * Math.PI);
          }
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * stepVal));
          break;
        }
        case 'sine_pulse': {
          const wave = 0.5 + 0.5 * Math.cos(angleRad);
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * wave));
          break;
        }
        case 'matrix_radial': {
          // 2D Radial wave exploding from center of the stage
          const dy = (fix.stageY - 0.5) * 2;
          const radialDist = Math.min(1, Math.hypot(fix.stageX, dy) / 1.35);
          const radialPhase = ((beatsElapsed * scene.fx.bpmDivision * effChaseSpeed - radialDist) % 1 + 1) % 1;
          const radialWave = 0.5 + 0.5 * Math.cos(radialPhase * Math.PI * 2);
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * radialWave));
          break;
        }
        case 'matrix_sweep_y': {
          // 2D Back-to-Front sweep across all trusses
          const sweepPhase = ((beatsElapsed * scene.fx.bpmDivision * effChaseSpeed - fix.stageY) % 1 + 1) % 1;
          const sweepWave = sweepPhase < 0.45 ? Math.sin((sweepPhase / 0.45) * Math.PI) : 0;
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * sweepWave));
          break;
        }
        case 'circle_pt': {
          if (!stompMovement) {
            fxPanDelta += Math.cos(angleRad) * effSize * 0.65 * sym.mirrorPanSign;
            fxTiltDelta += Math.sin(angleRad) * effSize * 0.65;
          }
          break;
        }
        case 'tilt_wave': {
          if (!stompMovement) {
            fxTiltDelta += Math.sin(angleRad) * effSize * 0.75;
          }
          break;
        }
        case 'pan_sweep': {
          if (!stompMovement) {
            fxPanDelta += Math.sin(angleRad) * effSize * 0.75 * sym.mirrorPanSign;
          }
          break;
        }
        case 'figure8_pt':
        case 'ballyhoo': {
          if (!stompMovement) {
            fxPanDelta += Math.sin(angleRad) * effSize * 0.75 * sym.mirrorPanSign;
            fxTiltDelta += Math.sin(angleRad * 2) * effSize * 0.65;
          }
          break;
        }
        case 'rainbow': {
          const rainbow = hueToRgbAndPalette(normPhase);
          r = rainbow.r;
          g = rainbow.g;
          b = rainbow.b;
          w = 0;
          colorPalette = rainbow.nearestPalette;
          break;
        }
        case 'strobe_sparkle': {
          const slice = Math.floor(beatsElapsed * 8 * effChaseSpeed + fix.orderInGroup * 1.37);
          const hash = Math.sin(slice * 12.9898 + fix.orderInGroup * 78.233) * 43758.5453;
          const frac = hash - Math.floor(hash);
          dimmer = frac < 0.35 ? 1 : 0.05;
          break;
        }
        case 'vu_meter': {
          // Musical VU-Meter EQ: expands from center (or left-to-right) based on live Audio Bass or BPM pulse
          const distFromCenter = Math.abs(fix.stageX); // 0 at center .. 1 at edges
          const bass0to100 =
            audioBassLevel > 0 && audioBassLevel <= 1 ? audioBassLevel * 100 : audioBassLevel;
          const pulseEnv =
            bass0to100 > 5
              ? Math.min(1, (bass0to100 / 90) * effSize)
              : (0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(beatsElapsed * Math.PI * 2 * effChaseSpeed), 2)) *
                effSize;
          const isLit = distFromCenter <= pulseEnv + 0.05;
          dimmer = isLit ? dimmer : dimmer * 0.06;
          if (isLit) {
            if (distFromCenter > 0.72) {
              // Red peak at outer edges
              r = 255;
              g = 20;
              b = 0;
              w = 0;
              colorPalette = 'red';
            } else if (distFromCenter > 0.42) {
              // Amber mid-high
              r = 255;
              g = 150;
              b = 0;
              w = 0;
              colorPalette = 'amber';
            } else {
              // Green center
              r = 0;
              g = 255;
              b = 40;
              w = 0;
              colorPalette = 'green';
            }
          }
          break;
        }
        case 'fire_flicker': {
          // Organic Fire / Flame Flicker: per-fixture organic noise between red, orange and warm amber
          const t = timeSec * 7.5 * effChaseSpeed + fix.orderInGroup * 2.17;
          const flicker =
            0.55 +
            0.25 * Math.sin(t * 1.7) +
            0.12 * Math.cos(t * 3.9 + fix.orderInGroup) +
            0.08 * Math.sin(t * 7.3);
          dimmer = Math.max(0.15, Math.min(1, dimmer * flicker));
          r = 255;
          g = Math.round(Math.max(0, Math.min(165, (flicker - 0.3) * 210)));
          b = 0;
          w = flicker > 0.85 ? 60 : 0;
          colorPalette = g > 70 ? 'amber' : 'red';
          break;
        }
        case 'police_siren': {
          // High-impact alternating Police Siren (Red Left / Royal Blue Right with double-strobe pulse)
          const halfBeat = Math.floor(beatsElapsed * 2 * effChaseSpeed) % 2;
          const subFlash = Math.floor(beatsElapsed * 8 * effChaseSpeed) % 2;
          const isLeftSide = fix.stageX <= 0;
          const activeSide = (isLeftSide && halfBeat === 0) || (!isLeftSide && halfBeat === 1);
          dimmer = activeSide ? (subFlash === 0 ? 1 : 0.35) : 0.05;
          if (isLeftSide) {
            r = 255;
            g = 0;
            b = 0;
            w = 0;
            colorPalette = 'red';
          } else {
            r = 0;
            g = 40;
            b = 255;
            w = 0;
            colorPalette = 'blue';
          }
          break;
        }
        case 'champagne_bubbles': {
          // Wedding / Gala Champagne Gold base with rising pure-white sparkling bubbles
          const slice = Math.floor(beatsElapsed * 6 * effChaseSpeed + fix.orderInGroup * 1.91);
          const hash = Math.sin(slice * 19.19 + fix.orderInGroup * 53.7) * 29481.3;
          const frac = hash - Math.floor(hash);
          if (frac < 0.22) {
            // Sparkling white bubble pop
            dimmer = 1;
            r = 255;
            g = 255;
            b = 255;
            w = 255;
            colorPalette = 'white';
          } else {
            // Warm golden glow
            const slowWave = 0.65 + 0.25 * Math.sin(angleRad);
            dimmer = dimmer * slowWave;
            r = 255;
            g = 155;
            b = 35;
            w = 120;
            colorPalette = 'amber';
          }
          break;
        }
        case 'ping_pong': {
          // Smooth bouncing scanner wave from Left (-1) to Right (+1) and back
          const rawCycle = (beatsElapsed * scene.fx.bpmDivision * effChaseSpeed) % 2;
          const bouncePos = rawCycle <= 1 ? rawCycle * 2 - 1 : (2 - rawCycle) * 2 - 1; // -1..+1
          const dist = Math.abs(fix.stageX - bouncePos);
          const width = Math.max(0.2, (scene.fx.dutyCycle || 0.35) * 1.2);
          const intensity = dist < width ? Math.cos((dist / width) * (Math.PI / 2)) : 0;
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * intensity));
          break;
        }
        default:
          break;
      }
    }

    let panNorm = basePanNorm + fxPanDelta;
    let tiltNorm = baseTiltNorm + fxTiltDelta;

    // MA2 Live Preset Pool / Group Programmer Override
    const prog = groupProgrammers?.[fix.groupId];
    if (prog?.active) {
      const progSym = computeSymmetricPhase(
        fix.orderInGroup,
        groupTotal,
        {
          waveform: prog.fxWaveform === 'transparent' ? 'none' : prog.fxWaveform,
          wings: prog.wings,
          wingDirection: 'outside_in',
          blocks: 1,
          interleave: prog.colorSecondary !== 'transparent' ? 2 : 1,
          phaseSpread: 360,
          size: 0.65,
          bpmDivision: 1,
          dutyCycle: 0.45,
        },
        fix.stageX,
        fix.stageY
      );

      if (prog.colorPrimary !== 'transparent') {
        const chosen =
          prog.colorSecondary !== 'transparent' && progSym.isOddSlot
            ? prog.colorSecondary
            : prog.colorPrimary;
        colorPalette = chosen;
        const rgbDef = COLOR_PALETTE_RGB[chosen];
        r = rgbDef.r;
        g = rgbDef.g;
        b = rgbDef.b;
        w = rgbDef.w;
      }

      if (prog.positionPalette !== 'transparent') {
        const pos = resolvePositionPaletteNorm(
          prog.positionPalette,
          fix.stageX,
          positionCalibrations
        );
        panNorm = pos.panNorm + fxPanDelta;
        tiltNorm = pos.tiltNorm + fxTiltDelta;
      }

      if (prog.prismActive !== 'transparent') {
        prism = prog.prismActive;
        prismRotate = prog.prismActive;
      }

      if (prog.goboSlot !== 'transparent') {
        gobo = prog.goboSlot;
      }

      if (prog.strobeMode !== 'transparent') {
        strobeMode = prog.strobeMode;
      }

      if (prog.fxWaveform !== 'transparent' && prog.fxWaveform !== 'none') {
        const isProgMove =
          prog.fxWaveform === 'circle_pt' ||
          prog.fxWaveform === 'tilt_wave' ||
          prog.fxWaveform === 'pan_sweep' ||
          prog.fxWaveform === 'ballyhoo';
        const progSpeed = isProgMove ? effMoveSpeed * 0.25 : effChaseSpeed;
        const cyclePos = (beatsElapsed * progSpeed - progSym.phaseOffset) % 1;
        const normPhase = cyclePos < 0 ? cyclePos + 1 : cyclePos;
        const angleRad = normPhase * Math.PI * 2;
        const effSize = Math.max(0, Math.min(1, 0.65 * globalFxSize));

        if (prog.fxWaveform === 'circle_pt') {
          panNorm += Math.cos(angleRad) * effSize * 0.65 * progSym.mirrorPanSign;
          tiltNorm += Math.sin(angleRad) * effSize * 0.65;
        } else if (prog.fxWaveform === 'tilt_wave') {
          tiltNorm += Math.sin(angleRad) * effSize * 0.75;
        } else if (prog.fxWaveform === 'pan_sweep') {
          panNorm += Math.sin(angleRad) * effSize * 0.75 * progSym.mirrorPanSign;
        } else if (prog.fxWaveform === 'ballyhoo') {
          panNorm += Math.sin(angleRad) * effSize * 0.75 * progSym.mirrorPanSign;
          tiltNorm += Math.sin(angleRad * 2) * effSize * 0.65;
        } else if (prog.fxWaveform === 'dimmer_chase') {
          const stepVal = normPhase < 0.45 ? Math.sin((normPhase / 0.45) * Math.PI) : 0;
          dimmer = Math.max(0, dimmer * (1 - effSize + effSize * stepVal));
        } else if (prog.fxWaveform === 'rainbow') {
          const rb = hueToRgbAndPalette(normPhase);
          r = rb.r;
          g = rb.g;
          b = rb.b;
          w = 0;
          colorPalette = rb.nearestPalette;
        }
      }
    }

    // Global Position Palette Override (GrandMA2 Position Preset Center Target)
    // Preserves active movement FX delta so heads move around the selected MA2 target!
    if (globalPositionOverride && globalPositionOverride !== 'transparent') {
      const overridePos = resolvePositionPaletteNorm(
        globalPositionOverride,
        fix.stageX,
        positionCalibrations
      );
      panNorm = overridePos.panNorm + fxPanDelta;
      tiltNorm = overridePos.tiltNorm + fxTiltDelta;
    }

    // Live Symmetrical Fanning (GrandMA2 Align <> Fan Spread: -1.0 Cross X .. +1.0 Wide Fan Out)
    if (
      Math.abs(globalFanSpread) > 0.01 &&
      (fix.groupId === 'beams' || fix.groupId === 'washes' || fix.groupId === 'spots')
    ) {
      panNorm += fix.stageX * globalFanSpread * 0.65;
    }

    // Live Global Dual-Color Theme Override (A/B Master Color Palette)
    if (globalColorTheme) {
      const themeColor =
        fix.orderInGroup % 2 === 1 ? globalColorTheme.secondary : globalColorTheme.primary;
      colorPalette = themeColor;
      const themeRgb = COLOR_PALETTE_RGB[themeColor];
      r = themeRgb.r;
      g = themeRgb.g;
      b = themeRgb.b;
      w = themeRgb.w;
    }

    // Live Custom RGBW Color Wheel & White Kelvin Temperature Override (#3)
    if (customRgbwOverride?.enabled) {
      r = customRgbwOverride.r;
      g = customRgbwOverride.g;
      b = customRgbwOverride.b;
      w = customRgbwOverride.w;
    }

    // Live Global Optics Override (Gobo Wheel, Rotating Prism & Zoom for Spots / Beams / Washes)
    if (globalOpticsOverride) {
      if (globalOpticsOverride.goboSlot !== 'auto') {
        gobo = globalOpticsOverride.goboSlot;
      }
      if (globalOpticsOverride.prismActive !== 'auto') {
        prism = globalOpticsOverride.prismActive;
        prismRotate = globalOpticsOverride.prismActive;
      }
      if (globalOpticsOverride.zoomValue !== 'auto') {
        zoom = globalOpticsOverride.zoomValue;
      }
    }

    // Live Temporary Color Bump (Avolites / MA2 Temp Color Override)
    if (tempColorBump) {
      colorPalette = tempColorBump;
      const bumpRgb = COLOR_PALETTE_RGB[tempColorBump];
      r = bumpRgb.r;
      g = bumpRgb.g;
      b = bumpRgb.b;
      w = bumpRgb.w;
    }

    if (cal.flashActive) {
      dimmer = 1;
      strobeMode = 'fast';
    }

    if (
      manualXYOverride?.enabled &&
      (manualXYOverride.targetGroup === 'all' || manualXYOverride.targetGroup === fix.groupId)
    ) {
      panNorm = manualXYOverride.panNorm;
      tiltNorm = manualXYOverride.tiltNorm;
      if (followspotWhiteActive) {
        dimmer = 1;
        colorPalette = 'white';
        r = 255;
        g = 255;
        b = 255;
        w = 255;
        strobeMode = 'off';
      }
    }

    // Worklight / House Cleanup Light Override (Steady 85% Warm White 3200K pointing downstage/floor)
    if (worklightActive) {
      dimmer = 0.85;
      colorPalette = 'warm_white';
      r = 255;
      g = 215;
      b = 155;
      w = 255;
      panNorm = 0;
      tiltNorm = -0.35;
      strobeMode = 'off';
      prism = false;
      prismRotate = false;
      gobo = 0;
      zoom = 0.9;
    }

    if (highlightFixtureId) {
      if (fix.id === highlightFixtureId) {
        dimmer = 1;
        colorPalette = 'white';
        r = 255;
        g = 255;
        b = 255;
        w = 255;
        panNorm = 0;
        tiltNorm = -0.25;
        strobeMode = 'off';
        prism = false;
      } else {
        dimmer = 0;
      }
    }

    const mutedByGroupSolo = anyGroupSolo && !cal.soloActive;

    let finalDimmer =
      highlightFixtureId && fix.id === highlightFixtureId
        ? 1
        : worklightActive && !globalBlackout
          ? 0.85
          : globalBlackout || cal.blackout || mutedByGroupSolo
            ? 0
            : cal.flashActive
              ? 1
              : Math.max(0, Math.min(1, dimmer * cal.masterDimmer * globalMaster));

    const totalPanOffsetDmx = (cal.panOffsetDmx || 0) + (fix.panOffsetDmx || 0);
    const totalTiltOffsetDmx = (cal.tiltOffsetDmx || 0) + (fix.tiltOffsetDmx || 0);

    const invertPan = Boolean(cal.invertPanGroup) !== Boolean(fix.invertPan);
    const invertTilt = Boolean(cal.invertTiltGroup) !== Boolean(fix.invertTilt);

    const panSpan = Math.max(20, Math.abs(cal.panRightDmx - cal.panLeftDmx));
    const tiltSpan = Math.max(20, Math.abs(cal.tiltSkyDmx - cal.tiltFloorDmx));

    const rawPanWithInvert = invertPan ? -panNorm : panNorm;
    const rawTiltWithInvert = invertTilt ? -tiltNorm : tiltNorm;

    let effPanNorm = Math.max(
      -1.25,
      Math.min(1.25, rawPanWithInvert + (totalPanOffsetDmx / (panSpan * 0.5)))
    );
    let effTiltNorm = Math.max(
      -1.25,
      Math.min(1.25, rawTiltWithInvert + (totalTiltOffsetDmx / (tiltSpan * 0.5)))
    );

    // Smooth Crossfade & Moving Head Motor Inertia (when crossfadeSec > 0 and no Flash override)
    const prev = prevFrames?.[fix.id];
    if (
      prev &&
      crossfadeSec > 0.02 &&
      !hasFlashSceneActive &&
      !cal.flashActive &&
      !highlightFixtureId &&
      !globalBlackout
    ) {
      const alpha = Math.min(1, 1 - Math.exp(-dtSec / Math.max(0.05, crossfadeSec * 0.35)));
      const alphaPt = Math.min(1, 1 - Math.exp(-dtSec / Math.max(0.025, crossfadeSec * 0.12)));
      effPanNorm = prev.panNorm + (effPanNorm - prev.panNorm) * alphaPt;
      effTiltNorm = prev.tiltNorm + (effTiltNorm - prev.tiltNorm) * alphaPt;
      finalDimmer = prev.dimmer + (finalDimmer - prev.dimmer) * alpha;
      r = Math.round(prev.r + (r - prev.r) * alpha);
      g = Math.round(prev.g + (g - prev.g) * alpha);
      b = Math.round(prev.b + (b - prev.b) * alpha);
      w = Math.round(prev.w + (w - prev.w) * alpha);
    }

    const pan01 = (Math.max(-1, Math.min(1, effPanNorm)) + 1) * 0.5;
    const tilt01 = (Math.max(-1, Math.min(1, effTiltNorm)) + 1) * 0.5;

    const basePanDmx = cal.panLeftDmx + (( rawPanWithInvert + 1) * 0.5) * (cal.panRightDmx - cal.panLeftDmx);
    const baseTiltDmx = cal.tiltFloorDmx + ((rawTiltWithInvert + 1) * 0.5) * (cal.tiltSkyDmx - cal.tiltFloorDmx);

    const panDmxFloat =
      prev && crossfadeSec > 0.02
        ? cal.panLeftDmx + pan01 * (cal.panRightDmx - cal.panLeftDmx)
        : basePanDmx + totalPanOffsetDmx;
    const tiltDmxFloat =
      prev && crossfadeSec > 0.02
        ? cal.tiltFloorDmx + tilt01 * (cal.tiltSkyDmx - cal.tiltFloorDmx)
        : baseTiltDmx + totalTiltOffsetDmx;

    const panDmx = Math.max(0, Math.min(255, Math.round(panDmxFloat)));
    const panFineDmx = Math.max(
      0,
      Math.min(255, Math.round((panDmxFloat - Math.floor(panDmxFloat)) * 255))
    );
    const tiltDmx = Math.max(0, Math.min(255, Math.round(tiltDmxFloat)));
    const tiltFineDmx = Math.max(
      0,
      Math.min(255, Math.round((tiltDmxFloat - Math.floor(tiltDmxFloat)) * 255))
    );

    const dmxChannels = new Array(profile.channelCount).fill(0);
    const setCh = (ch1Based: number | undefined, value: number) => {
      if (!ch1Based || ch1Based < 1 || ch1Based > profile.channelCount) return;
      dmxChannels[ch1Based - 1] = Math.max(0, Math.min(255, Math.round(value)));
    };

    const chMap = profile.channels;
    const rules = profile.dmxRules;

    const hasDedicatedDimmer = Boolean(chMap.dimmer);
    if (hasDedicatedDimmer) {
      setCh(chMap.dimmer, finalDimmer * 255);
    }

    let strobeHz = 0;
    if (finalDimmer <= 0.001) {
      if (chMap.shutter) setCh(chMap.shutter, rules.shutterClosed);
    } else {
      if (chMap.shutter) setCh(chMap.shutter, rules.shutterOpen);
      if (strobeMode === 'slow') {
        setCh(chMap.strobe, rules.strobeSlow);
        strobeHz = 4;
      } else if (strobeMode === 'medium') {
        setCh(chMap.strobe, rules.strobeMed);
        strobeHz = 9;
      } else if (strobeMode === 'fast') {
        setCh(chMap.strobe, rules.strobeFast);
        strobeHz = 16;
      } else if (strobeMode === 'blinder') {
        setCh(chMap.strobe, rules.shutterOpen);
        strobeHz = 0;
      }
    }

    const colorScale = hasDedicatedDimmer ? 1 : finalDimmer;
    setCh(chMap.red, r * colorScale);
    setCh(chMap.green, g * colorScale);
    setCh(chMap.blue, b * colorScale);
    setCh(chMap.white, w * colorScale);

    if (chMap.cyan && chMap.magenta && chMap.yellow) {
      if (colorPalette === 'white' || colorPalette === 'warm_white') {
        setCh(chMap.cyan, 0);
        setCh(chMap.magenta, 0);
        setCh(chMap.yellow, colorPalette === 'warm_white' ? 90 : 0);
      } else {
        setCh(chMap.cyan, 255 - r);
        setCh(chMap.magenta, 255 - g);
        setCh(chMap.yellow, 255 - b);
      }
    }

    if (chMap.colorWheel && rules.colorWheelMap) {
      const wheelVal = rules.colorWheelMap[colorPalette] ?? rules.colorWheelMap.white ?? 0;
      setCh(chMap.colorWheel, wheelVal);
    }

    if (chMap.whiteTubeDimmer) {
      const isFlashOrStrobe =
        strobeMode === 'fast' || strobeMode === 'blinder' || colorPalette === 'white';
      setCh(chMap.whiteTubeDimmer, isFlashOrStrobe ? finalDimmer * 255 : 0);
      if (chMap.whiteTubeStrobe) {
        setCh(chMap.whiteTubeStrobe, strobeMode === 'fast' ? rules.strobeFast : 0);
      }
    }

    setCh(chMap.pan, panDmx);
    setCh(chMap.panFine, panFineDmx);
    setCh(chMap.tilt, tiltDmx);
    setCh(chMap.tiltFine, tiltFineDmx);

    if (chMap.gobo && rules.goboSlots) {
      setCh(chMap.gobo, rules.goboSlots[gobo] ?? 0);
    }
    if (chMap.prism) {
      setCh(chMap.prism, prism ? rules.prismOn : rules.prismOff);
    }
    if (chMap.prismRot) {
      setCh(chMap.prismRot, prism && prismRotate ? rules.prismRotCw : 0);
    }
    if (chMap.zoom) {
      setCh(chMap.zoom, zoom * 255);
    }

    if (!universes[fix.universe]) {
      universes[fix.universe] = new Array(512).fill(0);
    }
    const uniBuf = universes[fix.universe];
    for (let c = 0; c < profile.channelCount; c++) {
      const addr0 = fix.address - 1 + c;
      const ch1Based = addr0 + 1;
      const overrideVal = manualDmxOverrides?.[`${fix.universe}:${ch1Based}`];
      if (overrideVal !== undefined) {
        dmxChannels[c] = Math.max(0, Math.min(255, Math.round(overrideVal)));
        if (chMap.dimmer === c + 1) finalDimmer = dmxChannels[c] / 255;
        if (chMap.red === c + 1) r = dmxChannels[c];
        if (chMap.green === c + 1) g = dmxChannels[c];
        if (chMap.blue === c + 1) b = dmxChannels[c];
        if (chMap.white === c + 1) w = dmxChannels[c];
      }
      if (addr0 >= 0 && addr0 < 512) {
        uniBuf[addr0] = dmxChannels[c];
      }
    }

    fixtureFrames[fix.id] = {
      fixtureId: fix.id,
      r,
      g,
      b,
      w,
      dimmer: finalDimmer,
      shutterOpen: finalDimmer > 0.001,
      strobeHz,
      panNorm: effPanNorm,
      tiltNorm: effTiltNorm,
      panDmx,
      tiltDmx,
      prism,
      gobo,
      dmxChannels,
    };
  }

  // If Channel Finder is isolating a universe to test unknown fixtures cleanly, zero its channels first
  if (isolateManualDmxUniverse && universes[isolateManualDmxUniverse]) {
    universes[isolateManualDmxUniverse] = new Array(512).fill(0);
  }

  // Also apply any manualDmxOverrides on patched or unpatched channels so Art-Net Hahan receives them
  if (manualDmxOverrides) {
    for (const [key, val] of Object.entries(manualDmxOverrides)) {
      const [uStr, chStr] = key.split(':');
      const u = Number(uStr);
      const ch1 = Number(chStr);
      if (universes[u] && ch1 >= 1 && ch1 <= 512) {
        universes[u][ch1 - 1] = Math.max(0, Math.min(255, Math.round(val)));
      }
    }
  }

  return { fixtureFrames, universes };
}
