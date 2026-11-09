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

export class Persistence {
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
    return {
      version: 1,
      mapping: st.fx.mapping,
      output: st.fx.output,
      safeStrobe: st.fx.safeStrobe !== false,
      calmColor: st.calmColor !== false,
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
