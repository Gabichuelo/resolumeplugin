/**
 * AETHER-VJ: 8-Hour Autonomous State Machine ("THE AUTOPILOT BRAIN"),
 * Master BPM Rhythm Clock & 8-Channel Multi-Wave LFO Modulator.
 */

import {
  GENERATORS,
  MACRO_DEFS,
  AUTOPILOT_MODES,
  SHAPE_MODES,
  STYLE_MODES,
  SWEEP_MODES,
  WEIGHT_MODES,
  EFFECT_3D_MODES,
  LOGO_FX_MODES,
  TEXT_FX_MODES,
  MEDIA_FX_MODES,
  BAR_STEP_SEQUENCES
} from '../state.js';
import { PALETTES } from '../palettes.js';

const MORPH_FX_KEYS = ['kaleidoscope', 'rgbShift', 'feedback', 'glitch', 'pixelate'];

function smooth01(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export class AutopilotBrain {
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
