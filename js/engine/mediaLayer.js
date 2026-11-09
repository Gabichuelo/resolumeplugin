/**
 * AETHER-VJ: Capa de Vídeo / GIF / Imagen / Cámara en directo
 * Carga el material que trae el DJ (MP4, WEBM, MOV, GIF animado, PNG/JPG) o una webcam USB
 * y entrega cada fotograma nuevo al renderizador WebGL para mezclarlo con los visuales y aplicarle efectos.
 */

const MAX_GIF_SIDE = 960;

export function detectMediaKind(nameOrType = '') {
  const s = String(nameOrType).toLowerCase();
  if (s.includes('gif')) return 'gif';
  if (/(^image\/)|\.(png|jpe?g|webp|bmp|svg)(\?|$)/.test(s)) return 'image';
  return 'video';
}

export class MediaLayer {
  constructor(state) {
    this.state = state;
    this.video = null;
    this.image = null;
    this.stream = null;

    // GIF animado (WebCodecs ImageDecoder, decodificación perezosa fotograma a fotograma)
    this.gifDecoder = null;
    this.gifFrameCount = 0;
    this.gifFrameIndex = 0;
    this.gifBitmap = null;
    this.gifNextAt = 0;
    this.gifDecoding = false;
    this.gifToken = 0;

    this.currentKey = '';
    this.width = 0;
    this.height = 0;
    this.dirty = false;
    this.ready = false;
    this.lastError = '';
    this._blobUrl = '';
    this._rvfcActive = false;
  }

  get isPlaying() {
    return this.ready && this.state.media && this.state.media.enabled;
  }

  _sourceKey() {
    const m = this.state.media;
    if (!m || m.source === 'none') return '';
    if (m.source === 'camera') return `camera|${m.cameraId || ''}|${m.version || 0}`;
    return `file|${m.url}|${m.version || 0}`;
  }

  /** Comprueba si el estado pide otro material y lo carga. Llamar una vez por fotograma. */
  sync() {
    const key = this._sourceKey();
    if (key !== this.currentKey) {
      this.currentKey = key;
      this._teardown();
      const m = this.state.media;
      if (key) {
        if (m.source === 'camera') {
          this._startCamera(m.cameraId);
        } else if (m.kind === 'gif') {
          this._loadGif(m.url);
        } else if (m.kind === 'image') {
          this._loadImage(m.url);
        } else {
          this._loadVideo(m.url);
        }
      }
    }

    // Velocidad de reproducción en vivo
    if (this.video && this.state.media.source === 'file') {
      const rate = Math.max(0.25, Math.min(2.0, Number(this.state.media.speed) || 1.0));
      if (Math.abs(this.video.playbackRate - rate) > 0.001) {
        this.video.playbackRate = rate;
      }
    }
  }

  /**
   * Devuelve la fuente a subir a la GPU si hay un fotograma nuevo (o null si no hace falta subir nada).
   */
  pollFrame(nowMs) {
    if (!this.ready) return null;

    if (this.video) {
      const v = this.video;
      if (v.readyState < 2 || v.videoWidth === 0) return null;
      if (v.paused && this.state.media.source === 'file') {
        v.play().catch(() => {});
      }
      this.width = v.videoWidth;
      this.height = v.videoHeight;
      if (this._rvfcActive) {
        if (!this.dirty) return null;
        this.dirty = false;
      }
      return v;
    }

    if (this.gifDecoder) {
      this._advanceGif(nowMs);
      if (this.dirty && this.gifBitmap) {
        this.dirty = false;
        return this.gifBitmap;
      }
      return null;
    }

    if (this.image && this.dirty) {
      this.dirty = false;
      return this.image;
    }
    return null;
  }

  async refreshCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Cámara ${i + 1}` }));
      this.state.cameras = cams;
      return cams;
    } catch (_) {
      return [];
    }
  }

  /** Carga un fichero local (consola de PC) sin pasar por el servidor. */
  loadBlob(file) {
    if (!file) return;
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch (_) {}
    }
    const url = URL.createObjectURL(file);
    this._blobUrl = url;
    const m = this.state.media;
    m.source = 'file';
    m.url = url;
    m.kind = detectMediaKind(file.type || file.name);
    m.name = file.name || 'vídeo local';
    m.enabled = true;
    m.version = (m.version || 0) + 1;
  }

  _teardown() {
    this.ready = false;
    this.dirty = false;
    this.lastError = '';
    this._rvfcActive = false;
    this.gifToken += 1;

    if (this.video) {
      try {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.srcObject = null;
        this.video.load();
      } catch (_) {}
      this.video = null;
    }
    if (this.stream) {
      try { this.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      this.stream = null;
    }
    if (this.gifDecoder) {
      try { this.gifDecoder.close(); } catch (_) {}
      this.gifDecoder = null;
    }
    if (this.gifBitmap) {
      try { this.gifBitmap.close(); } catch (_) {}
      this.gifBitmap = null;
    }
    this.gifDecoding = false;
    this.image = null;
  }

  _createVideoElement() {
    const v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    return v;
  }

  _watchVideoFrames(v) {
    if (typeof v.requestVideoFrameCallback !== 'function') return;
    this._rvfcActive = true;
    const onFrame = () => {
      if (this.video !== v) return;
      this.dirty = true;
      v.requestVideoFrameCallback(onFrame);
    };
    v.requestVideoFrameCallback(onFrame);
  }

  _loadVideo(url) {
    const v = this._createVideoElement();
    this.video = v;
    v.onloadeddata = () => {
      if (this.video !== v) return;
      this.width = v.videoWidth;
      this.height = v.videoHeight;
      this.ready = true;
      this.dirty = true;
      v.play().catch(() => {});
    };
    v.onerror = () => {
      if (this.video !== v) return;
      this.lastError = 'No se pudo reproducir el vídeo (formato no soportado o fichero dañado).';
      console.warn('[AETHER-VJ] Media error:', url);
    };
    this._watchVideoFrames(v);
    v.src = url;
    v.load();
  }

  async _startCamera(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.lastError = 'Este navegador no permite usar la cámara.';
      return;
    }
    const token = this.gifToken;
    try {
      const constraints = {
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      if (deviceId) constraints.video.deviceId = { exact: deviceId };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (token !== this.gifToken) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      const v = this._createVideoElement();
      v.loop = false;
      this.video = v;
      v.onloadeddata = () => {
        if (this.video !== v) return;
        this.width = v.videoWidth;
        this.height = v.videoHeight;
        this.ready = true;
        this.dirty = true;
        v.play().catch(() => {});
      };
      this._watchVideoFrames(v);
      v.srcObject = stream;
      // Con permiso ya concedido, los nombres de las cámaras son visibles
      this.refreshCameras();
    } catch (err) {
      this.lastError = 'No se pudo abrir la cámara: ' + (err && err.name ? err.name : 'error');
      console.warn('[AETHER-VJ] Camera error:', err);
    }
  }

  _loadImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.image !== img) return;
      this.width = img.naturalWidth;
      this.height = img.naturalHeight;
      this.ready = true;
      this.dirty = true;
    };
    img.onerror = () => {
      this.lastError = 'No se pudo cargar la imagen.';
    };
    this.image = img;
    img.src = url;
  }

  async _loadGif(url) {
    const token = this.gifToken;
    if (typeof window.ImageDecoder === 'undefined') {
      // Sin WebCodecs: se muestra el primer fotograma como imagen fija
      this._loadImage(url);
      return;
    }
    try {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      if (token !== this.gifToken) return;
      const decoder = new window.ImageDecoder({ data: buf, type: 'image/gif' });
      await decoder.tracks.ready;
      if (token !== this.gifToken) {
        decoder.close();
        return;
      }
      this.gifDecoder = decoder;
      this.gifFrameCount = Math.max(1, decoder.tracks.selectedTrack ? decoder.tracks.selectedTrack.frameCount : 1);
      this.gifFrameIndex = 0;
      this.gifNextAt = 0;
      this.ready = true;
      this._decodeGifFrame(0, token);
    } catch (err) {
      console.warn('[AETHER-VJ] GIF decode error, using static image:', err);
      if (token === this.gifToken) this._loadImage(url);
    }
  }

  async _decodeGifFrame(index, token) {
    if (!this.gifDecoder || this.gifDecoding) return;
    this.gifDecoding = true;
    try {
      const result = await this.gifDecoder.decode({ frameIndex: index });
      const frame = result.image;
      if (token !== this.gifToken) {
        frame.close();
        return;
      }
      const fw = frame.displayWidth || frame.codedWidth;
      const fh = frame.displayHeight || frame.codedHeight;
      const s = Math.min(1, MAX_GIF_SIDE / Math.max(fw, fh));
      const bmp = await createImageBitmap(frame, {
        resizeWidth: Math.max(1, Math.round(fw * s)),
        resizeHeight: Math.max(1, Math.round(fh * s))
      });
      // Duración del fotograma en µs (los GIF sin duración van a 10 fps)
      const durMs = frame.duration ? frame.duration / 1000 : 100;
      frame.close();
      if (token !== this.gifToken) {
        bmp.close();
        return;
      }
      if (this.gifBitmap) this.gifBitmap.close();
      this.gifBitmap = bmp;
      this.width = bmp.width;
      this.height = bmp.height;
      this.gifFrameIndex = index;
      const speed = Math.max(0.25, Math.min(2.0, Number(this.state.media.speed) || 1.0));
      this.gifNextAt = performance.now() + Math.max(20, durMs) / speed;
      this.dirty = true;
    } catch (err) {
      // Fin de pista o fotograma dañado: vuelve al principio
      this.gifFrameIndex = -1;
      this.gifNextAt = performance.now() + 100;
    } finally {
      this.gifDecoding = false;
    }
  }

  _advanceGif(nowMs) {
    if (!this.gifDecoder || this.gifDecoding || this.gifFrameCount <= 1) return;
    if (nowMs >= this.gifNextAt) {
      const next = (this.gifFrameIndex + 1) % this.gifFrameCount;
      this._decodeGifFrame(next, this.gifToken);
    }
  }
}
