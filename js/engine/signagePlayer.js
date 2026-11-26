/**
 * AETHER-VJ: Reproductor de Kiosco de Publicidad / Cartelería LED (Digital Signage)
 * Reproduce en bucle 24/7 un vídeo o un carrusel temporizado de fotos/GIFs/vídeos
 * desde /media/ en las proporciones X×Y y brillo configurados.
 */

export class SignagePlayer {
  constructor(state, mediaLayer, syncBridge) {
    this.state = state;
    this.media = mediaLayer;
    this.syncBridge = syncBridge;
    this.libraryItems = [];
    this.slideElapsed = 0;
    this.loadingElapsed = 0;
    this.fadePhase = 'idle'; // 'idle' | 'out' | 'in'
    this.fadeElapsed = 0;
    this.pendingIndex = -1;
    this._lastRandomMode = 1;
    this._refreshing = false;
  }

  _buildValidEntry(it) {
    return {
      url: it.url,
      kind: ['video', 'gif', 'image'].includes(it.kind) ? it.kind : 'video',
      name: String(it.name || it.file || it.url.split('/').pop() || '').slice(0, 80)
    };
  }

  _getActiveItems() {
    const sg = this.state.signage;
    if (!sg) return [];
    const libByUrl = new Map();
    for (let i = 0; i < this.libraryItems.length; i++) {
      const it = this.libraryItems[i];
      if (it && it.url) libByUrl.set(it.url, this._buildValidEntry(it));
    }

    const customList = Array.isArray(sg.playlist)
      ? sg.playlist
          .filter((it) => it && typeof it.url === 'string' && /^\/media\/[^/\\]+$/.test(it.url))
          .filter((it) => libByUrl.size === 0 || libByUrl.has(it.url))
          .map((it) => libByUrl.get(it.url) || this._buildValidEntry(it))
      : [];

    if (sg.useAllMedia === false) {
      return customList;
    }

    // Todos los archivos de /media/, respetando el orden previo de playlist primero
    const seen = new Set();
    const merged = [];
    for (let i = 0; i < customList.length; i++) {
      if (!seen.has(customList[i].url)) {
        seen.add(customList[i].url);
        merged.push(customList[i]);
      }
    }
    for (let i = 0; i < this.libraryItems.length; i++) {
      const it = this.libraryItems[i];
      if (it && it.url && !seen.has(it.url)) {
        seen.add(it.url);
        merged.push(this._buildValidEntry(it));
      }
    }
    return merged;
  }

  async refreshLibrary(forceEnsurePlaying = false) {
    if (this._refreshing) return;
    if (typeof window === 'undefined' || !window.location.protocol.startsWith('http')) return;
    this._refreshing = true;
    try {
      const res = await fetch('/api/media-list', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.ok && Array.isArray(data.items)) {
        // Dejar orden cronológico de subida por defecto para que las secuencias queden ordenadas
        this.libraryItems = data.items.slice().reverse();
        const libUrls = new Set(this.libraryItems.map((it) => it.url));
        const sg = this.state.signage;
        if (sg && Array.isArray(sg.playlist) && sg.playlist.length) {
          sg.playlist = sg.playlist.filter((it) => it && libUrls.has(it.url));
        }
        if (sg && sg.enabled) {
          const active = this._getActiveItems();
          sg.totalItems = active.length;
          if (active.length === 0) {
            sg.currentIndex = 0;
            sg.currentName = '';
            sg.remainingSec = 0;
          } else {
            const curUrl = this.state.media ? this.state.media.url : '';
            const curMatch = active.findIndex((it) => it.url === curUrl);
            if (curMatch >= 0 && !forceEnsurePlaying) {
              sg.currentIndex = curMatch;
              sg.currentName = active[curMatch].name;
              if (this.media) {
                this.media.singleLoop = (active.length === 1 && active[curMatch].kind === 'video');
              }
            } else {
              this.goTo(curMatch >= 0 ? curMatch : 0, true);
            }
          }
        }
      }
    } catch (_) {
      // Sin servidor HTTP disponible
    } finally {
      this._refreshing = false;
    }
  }

  onConfigLoaded() {
    if (this.media) {
      this.media.onVideoEnded = () => {
        const sg = this.state.signage;
        if (sg && sg.enabled && !sg.paused) {
          this.next(false);
        }
      };
      this.media.onMediaError = () => {
        const sg = this.state.signage;
        if (sg && sg.enabled && sg.totalItems > 1) {
          this.next(true);
        }
      };
    }
    this.refreshLibrary(true);
  }

  activate(enable) {
    const sg = this.state.signage;
    if (!sg) return;
    sg.enabled = Boolean(enable);
    this.fadePhase = 'idle';
    this.fadeElapsed = 0;
    this.slideElapsed = 0;
    this.loadingElapsed = 0;
    sg.transProgress = 0.0;
    sg.transDir = 0.0;

    if (sg.enabled) {
      sg.paused = false;
      const m = this.state.media;
      if (m) {
        m.blend = 0;
        m.fx = 0;
        m.beatZoom = 0;
        m.mirror = false;
        m.speed = 1.0;
        m.fit = [0, 1, 2].includes(Number(sg.fit)) ? Number(sg.fit) : 0;
        m.opacity = 1.0;
      }
      this.refreshLibrary(true);
    } else {
      if (this.media) this.media.singleLoop = true;
      if (this.state.media) this.state.media.opacity = 1.0;
    }
  }

  _commitItem(idx, items) {
    const sg = this.state.signage;
    const m = this.state.media;
    if (!sg || !m || !items.length) return;
    const safeIdx = ((idx % items.length) + items.length) % items.length;
    const item = items[safeIdx];

    sg.currentIndex = safeIdx;
    sg.totalItems = items.length;
    sg.currentName = item.name || item.url.split('/').pop() || '';
    this.slideElapsed = 0;
    this.loadingElapsed = 0;

    if (this.media) {
      this.media.singleLoop = (items.length === 1 && item.kind === 'video');
    }

    m.source = 'file';
    m.url = item.url;
    m.kind = item.kind || 'video';
    m.name = sg.currentName;
    m.blend = 0;
    m.fx = 0;
    m.beatZoom = 0;
    m.mirror = false;
    m.speed = 1.0;
    m.fit = [0, 1, 2].includes(Number(sg.fit)) ? Number(sg.fit) : 0;
    m.enabled = true;
    m.version = (m.version || 0) + 1;
  }

  goTo(index, immediate = false) {
    const sg = this.state.signage;
    if (!sg) return;
    const items = this._getActiveItems();
    sg.totalItems = items.length;
    if (!items.length) {
      sg.currentIndex = 0;
      sg.currentName = '';
      sg.remainingSec = 0;
      return;
    }

    const trans = Number.isFinite(Number(sg.transition))
      ? Math.max(0, Math.min(6, Math.round(Number(sg.transition))))
      : ((Number(sg.fadeSeconds) || 0) > 0.02 ? 1 : 0);
    const fadeSec = Math.max(0, Math.min(3, Number(sg.fadeSeconds) || 0.7));
    if (immediate || trans === 0 || fadeSec <= 0.02 || items.length <= 1) {
      this.fadePhase = 'idle';
      sg.transProgress = 0.0;
      sg.transDir = 0.0;
      if (this.state.media) this.state.media.opacity = 1.0;
      this._commitItem(index, items);
      return;
    }

    let activeMode = trans;
    if (trans === 6) {
      const pool = [1, 2, 3, 4, 5].filter((m) => m !== this._lastRandomMode);
      activeMode = pool[Math.floor(Math.random() * pool.length)] || 1;
      this._lastRandomMode = activeMode;
    } else {
      activeMode = Math.max(1, Math.min(5, trans));
    }
    sg.transModeActive = activeMode;
    sg.transProgress = 0.0;
    sg.transDir = -1.0;
    this.pendingIndex = index;
    this.fadePhase = 'out';
    this.fadeElapsed = 0;
  }

  goToUrl(url) {
    const items = this._getActiveItems();
    const idx = items.findIndex((it) => it.url === url);
    this.goTo(idx >= 0 ? idx : 0, true);
  }

  next(immediate = false) {
    const sg = this.state.signage;
    if (!sg) return;
    this.goTo((sg.currentIndex || 0) + 1, immediate);
  }

  prev(immediate = false) {
    const sg = this.state.signage;
    if (!sg) return;
    this.goTo((sg.currentIndex || 0) - 1, immediate);
  }

  update(dt) {
    const sg = this.state.signage;
    const m = this.state.media;
    if (!sg || !sg.enabled || !m) return;

    // Mantener imagen limpia de publicidad sin mezcla ni deformaciones DJ
    m.blend = 0;
    m.fx = 0;
    m.beatZoom = 0;
    m.fit = [0, 1, 2].includes(Number(sg.fit)) ? Number(sg.fit) : 0;

    const items = this._getActiveItems();
    sg.totalItems = items.length;

    if (!items.length) {
      sg.currentIndex = 0;
      sg.currentName = '';
      sg.remainingSec = 0;
      m.opacity = 1.0;
      return;
    }

    if (sg.currentIndex >= items.length) {
      this._commitItem(0, items);
    }
    const curItem = items[sg.currentIndex] || items[0];
    sg.currentName = curItem.name || '';
    if (this.media) {
      this.media.singleLoop = (items.length === 1 && curItem.kind === 'video');
    }

    // Gestión de transición GPU (out -> swap -> in)
    const halfFade = Math.max(0.05, (Math.max(0, Math.min(3, Number(sg.fadeSeconds) || 0.7))) * 0.5);
    m.opacity = 1.0;
    if (this.fadePhase === 'out') {
      this.fadeElapsed += dt;
      const t = Math.min(1, this.fadeElapsed / halfFade);
      sg.transProgress = t;
      sg.transDir = -1.0;
      if (t >= 1) {
        this._commitItem(this.pendingIndex, items);
        this.fadePhase = 'in';
        this.fadeElapsed = 0;
        sg.transProgress = 1.0;
        sg.transDir = 1.0;
      }
      return;
    } else if (this.fadePhase === 'in') {
      this.fadeElapsed += dt;
      const t = Math.min(1, this.fadeElapsed / halfFade);
      sg.transProgress = 1.0 - t;
      sg.transDir = 1.0;
      if (t >= 1) {
        this.fadePhase = 'idle';
        sg.transProgress = 0.0;
        sg.transDir = 0.0;
      }
    } else {
      sg.transProgress = 0.0;
      sg.transDir = 0.0;
    }

    if (sg.paused) return;

    // Temporizador del carrusel si hay 2 o más elementos
    if (items.length > 1) {
      if (curItem.kind === 'video') {
        const v = this.media ? this.media.video : null;
        if (v && Number.isFinite(v.duration) && v.duration > 0) {
          sg.remainingSec = Math.max(0, Math.ceil(v.duration - (v.currentTime || 0)));
          this.loadingElapsed = 0;
        } else {
          sg.remainingSec = 0;
          this.loadingElapsed += dt;
          if (this.loadingElapsed > 12) {
            this.loadingElapsed = 0;
            this.next(true);
          }
        }
      } else {
        const slideSec = Math.max(2, Math.min(300, Number(sg.slideSeconds) || 8));
        this.slideElapsed += dt;
        sg.remainingSec = Math.max(0, Math.ceil(slideSec - this.slideElapsed));
        if (this.slideElapsed >= slideSec) {
          this.slideElapsed = 0;
          this.next(false);
        }
      }
    } else {
      this.slideElapsed = 0;
      sg.remainingSec = 0;
    }
  }
}
