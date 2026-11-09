/**
 * AETHER-VJ: Industrial Console UI Controller (grandMA / Resolume Arena Aesthetic)
 * Supports 32 Generators across 4 Banks (GEO, KIN, FLT, SPC),
 * Pure Flat Render Style (Zero Glow / Zero FX), SDF Primitive Override,
 * Dynamic Line-Weight Engine (Thin <-> Giant), and L->R Stage Sweeps.
 */

import {
  GENERATORS,
  SHAPE_MODES,
  STYLE_MODES,
  SWEEP_MODES,
  WEIGHT_MODES,
  EFFECT_3D_MODES,
  LOGO_FX_MODES,
  LOGO_POS_MODES,
  SLICE_MODES,
  MACRO_DEFS,
  LFO_WAVES,
  AUTOPILOT_MODES,
  TEXT_FONTS,
  TEXT_FX_MODES,
  TEXT_POS_MODES,
  TEXT_COLOR_MODES,
  MEDIA_BLEND_MODES,
  MEDIA_FX_MODES,
  TRANSITION_BARS,
  EDGE_BLEND_MODES
} from '../state.js';
import { PALETTES } from '../palettes.js';
import { capturePreset, applyPreset } from '../engine/presetManager.js';

export class ConsoleController {
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
