/**
 * AETHER-VJ: Preset Manager ("Looks" completos guardables)
 * Guarda y recupera en un solo toque: visual activo, paleta, los 8 faders con sus LFOs,
 * forma/acabado/grosor/barrido, efecto 3D, rack de efectos y comportamiento del piloto automático.
 * No guarda la imagen del logo ni el mapping (eso depende del DJ y del local, no del "look").
 */

import { GENERATORS, MACRO_DEFS } from '../state.js';
import { PALETTES } from '../palettes.js';

const FX_KEYS = ['kaleidoscope', 'rgbShift', 'feedback', 'glitch', 'pixelate'];

export function capturePreset(st) {
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
      audioAmount: m.audioAmount
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

export function applyPreset(st, autopilot, p) {
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
export function applyPresetImmediate(st, autopilot, p, cut = false) {
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
    }
  }
}
