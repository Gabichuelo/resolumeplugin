/**
 * AETHER-VJ: High-Speed 60Hz Projector Synchronization Bridge
 * Synchronizes Master Console state with the Clean Output Projector Window
 * via BroadcastChannel and direct window reference for zero-latency Resolume / NDI / Spout capture.
 */

import { MACRO_DEFS, TRANSITION_BARS, BAR_STEP_OPTIONS, BAR_STEP_SEQUENCES, defaultCorners, defaultMasks } from '../state.js';
import { capturePreset, applyPreset } from './presetManager.js';
import { processLogoDataUrl } from './logoProcessor.js';
import { detectMediaKind } from './mediaLayer.js';

const TEXT_PROPS = new Set(['enabled', 'content', 'font', 'fxMode', 'pos', 'scale', 'opacity', 'colorMode', 'backdrop', 'scrollSpeed']);
const MEDIA_PROPS = new Set(['enabled', 'opacity', 'blend', 'fx', 'fit', 'mirror', 'beatZoom', 'speed']);
const MASK_PROPS = new Set(['enabled', 'x', 'y', 'w', 'h', 'feather']);
const EDGE_PROPS = new Set(['mode', 'overlap', 'gamma', 'curve']);

function clampNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

export class SyncBridge {
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
