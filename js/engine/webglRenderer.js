/**
 * AETHER-VJ: Zero-Allocation WebGL2 Multi-Pass GPU Rendering Engine
 * Pipeline:
 *   Pass 1: Active Deck A Generator -> fboDeckA
 *   Pass 2: Active Deck B Generator -> fboDeckB (Executed ONLY when crossfade > 0.001)
 *   Pass 3: Crossfade A/B + Ping-Pong Feedback Trails -> fboFeedback[writeIdx]
 *   Pass 4: 6-Stage Post-FX Rack + Luma/Alpha Key -> Default Screen Framebuffer
 */

import { VERTEX_SHADER_SRC } from '../shaders/common.glsl.js';
import { GENERATOR_SHADERS } from '../shaders/generators.glsl.js';
import { FEEDBACK_COMPOSITE_SHADER_SRC, POSTFX_RACK_SHADER_SRC } from '../shaders/postfx.glsl.js';
import { PALETTES, interpolatePalette } from '../palettes.js';
import { renderTextCanvas } from './textLayer.js';
import { writeCornerPinMatrix } from './outputMapping.js';

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.width = 0;
    this.height = 0;

    // Pre-allocated Palette Uniform Float32Arrays (Zero GC in render loop)
    this.palA = new Float32Array(3);
    this.palB = new Float32Array(3);
    this.palC = new Float32Array(3);
    this.palD = new Float32Array(3);
    // Objetivo de paleta (los uniforms reales lo persiguen con suavidad)
    this._palTA = new Float32Array(3);
    this._palTB = new Float32Array(3);
    this._palTC = new Float32Array(3);
    this._palTD = new Float32Array(3);
    this._palInit = false;
    this._lastPalMs = 0;

    this.quadVao = null;
    this.quadBuffer = null;

    this.generatorPrograms = [];
    this.feedbackProgram = null;
    this.postFxProgram = null;

    this.fboDeckA = null;
    this.fboDeckB = null;
    this.fboFeedback = [null, null];
    this.feedbackReadIndex = 0;

    this.texLogo = null;
    this._lastLogoDataUrl = '';
    this._logoLoading = false;
    this._logoFadeVal = 0.0;

    // Capa de vídeo / GIF / cámara (MediaLayer asignada desde fuera)
    this.media = null;
    this.texMedia = null;
    this._mediaFade = 0.0;
    this._mediaW = 1;
    this._mediaH = 1;

    // Texto en pantalla
    this.texText = null;
    this._textCanvas = null;
    this._textKey = '';
    this._textAspect = 4.0;
    this._textFade = 0.0;
    this._textScroll = 0.0;
    this._lastRenderTime = 0.0;

    // Corner-pin y máscaras (buffers reutilizables, cero basura por fotograma)
    this._cornerMat0 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this._cornerMat1 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this._cornerCache0 = new Float64Array(8).fill(NaN);
    this._cornerCache1 = new Float64Array(8).fill(NaN);
    this._maskRects = new Float32Array(16);
    this._maskFeather = new Float32Array(4);
    this._genAspectFactor = 1.0;

    this.contextLost = false;
    this.autoReloadOnContextLoss = false;
    this._contextWatchdog = null;
    this._initContext();
  }

  _initContext() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('WebGL2 is required for AETHER-VJ GPU Engine.');
    }
    this.gl = gl;

    // Handle GPU context loss recovery for 8-hour reliability
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      console.warn('[AETHER-VJ] WebGL2 context lost. Awaiting driver recovery...');
      // Watchdog: in unattended kiosk/projector mode, reload the page if the driver doesn't give the GPU back
      if (this.autoReloadOnContextLoss) {
        if (this._contextWatchdog) clearTimeout(this._contextWatchdog);
        this._contextWatchdog = setTimeout(() => {
          if (this.contextLost) {
            console.warn('[AETHER-VJ] GPU not recovered after 5s. Reloading page...');
            window.location.reload();
          }
        }, 5000);
      }
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.info('[AETHER-VJ] WebGL2 context restored. Rebuilding GPU pipeline...');
      if (this._contextWatchdog) {
        clearTimeout(this._contextWatchdog);
        this._contextWatchdog = null;
      }
      this.contextLost = false;
      // Old GPU objects are invalid after a context loss: drop references so they are recreated
      this.texLogo = null;
      this._lastLogoDataUrl = '';
      this.texMedia = null;
      this.texText = null;
      this._textKey = '';
      if (this.media) this.media.dirty = true;
      this._buildResources();
    });

    this._buildResources();
  }

  _buildResources() {
    const gl = this.gl;

    // 1. Fullscreen Quad VAO
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0
    ]);

    this.quadVao = gl.createVertexArray();
    this.quadBuffer = gl.createBuffer();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // 2. Compile all 32 Generator Programs
    const genUniformNames = [
      'uResolution', 'uTime', 'uRawTime', 'uEntropy',
      'uShapeMode', 'uStyleMode', 'uSweepMode', 'uWeightMode',
      'uSpeed', 'uScale', 'uComplexity', 'uThickness',
      'uRotation', 'uChaos', 'uStrobe', 'uColorShift',
      'uBeatPhase', 'uBarPhase', 'uBeatPulse', 'uAudioFFT',
      'uBeatsPerSec', 'uSafeStrobe', 'uCalmColor', 'uColorPhase',
      'uPalA', 'uPalB', 'uPalC', 'uPalD'
    ];

    this.generatorPrograms = GENERATOR_SHADERS.map((fragSrc, idx) => {
      const prog = this._createProgram(VERTEX_SHADER_SRC, fragSrc, `Generator_${idx + 1}`);
      return {
        program: prog,
        uniforms: this._cacheUniforms(prog, genUniformNames)
      };
    });

    // 3. Compile Feedback Composite Program
    const fbUniformNames = [
      'uTexDeckA', 'uTexDeckB', 'uTexPrevFeedback',
      'uCrossfade', 'uFeedbackWet', 'uTime', 'uBeatPulse',
      'uTexMedia', 'uMediaMix', 'uMediaBlend', 'uMediaFx', 'uMediaUvScale', 'uMediaMirror',
      'uMediaZoom', 'uMediaTexel', 'uMediaAspect', 'uAudioFFT',
      'uPalA', 'uPalB', 'uPalC', 'uPalD'
    ];
    const fbProg = this._createProgram(VERTEX_SHADER_SRC, FEEDBACK_COMPOSITE_SHADER_SRC, 'FeedbackComposite');
    this.feedbackProgram = {
      program: fbProg,
      uniforms: this._cacheUniforms(fbProg, fbUniformNames)
    };

    // 4. Compile Post-FX Rack Program
    const postUniformNames = [
      'uTexComposite', 'uResolution', 'uTime', 'uBeatPhase', 'uBeatPulse', 'uAudioFFT',
      'uKaleidoWet', 'uKaleidoAxes', 'uRgbShiftWet', 'uGlitchWet', 'uPixelateWet',
      'uEffect3DMode', 'uEffect3DAmount',
      'uTexLogo', 'uLogoEnabled', 'uLogoFxMode', 'uLogoScale', 'uLogoOpacity',
      'uLogoBackdrop', 'uLogoAspect', 'uLogoPos', 'uLogoTint', 'uLogoAccentCol',
      'uMapOffset', 'uMapScale', 'uMapKeystone', 'uSliceMode', 'uSliceCount',
      'uSliceGap', 'uSliceClone', 'uMapTestGrid',
      'uMasterBright', 'uColorTemp', 'uSafeStrobe',
      'uFlash', 'uInvert', 'uMonochrome', 'uBlackout', 'uStrobeBurst', 'uBgMode',
      'uCornerOn', 'uCornerH0', 'uCornerH1',
      'uEdgeMode', 'uEdgeOverlap', 'uEdgeGamma', 'uEdgeCurve',
      'uMaskRect', 'uMaskFeather',
      'uTexText', 'uTextEnabled', 'uTextFx', 'uTextScale', 'uTextOpacity', 'uTextBackdrop',
      'uTextAspect', 'uTextPos', 'uTextColorMode', 'uTextScroll'
    ];
    const postProg = this._createProgram(VERTEX_SHADER_SRC, POSTFX_RACK_SHADER_SRC, 'PostFxRack');
    this.postFxProgram = {
      program: postProg,
      uniforms: this._cacheUniforms(postProg, postUniformNames)
    };

    // 5. Allocate Reusable FBO Targets & Default DJ Logo Texture
    this.width = Math.max(64, this.canvas.clientWidth || 1280);
    this.height = Math.max(64, this.canvas.clientHeight || 720);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.fboDeckA = this._createFBO(this.width, this.height);
    this.fboDeckB = this._createFBO(this.width, this.height);
    this.fboFeedback[0] = this._createFBO(this.width, this.height);
    this.fboFeedback[1] = this._createFBO(this.width, this.height);

    this._initDefaultLogoTexture();
    this._lastLogoDataUrl = '';

    this.texMedia = this._createBlankTexture();
    this.texText = this._createBlankTexture();
    this._textKey = '';
  }

  _createBlankTexture() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  /** Sube el fotograma nuevo del vídeo / GIF / cámara a la GPU (solo si hay uno nuevo). */
  _syncMediaTexture() {
    const media = this.media;
    if (!media || !this.texMedia) return;
    media.sync();
    const src = media.pollFrame(performance.now());
    if (!src) return;
    const gl = this.gl;
    try {
      gl.bindTexture(gl.TEXTURE_2D, this.texMedia);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this._mediaW = Math.max(1, media.width);
      this._mediaH = Math.max(1, media.height);
    } catch (err) {
      // Vídeo de otro origen sin CORS o fotograma no listo: se ignora este fotograma
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  /** Regenera la textura del texto cuando cambia el contenido o la fuente. */
  _syncTextTexture(state) {
    const t = state.text;
    if (!t || !this.texText) return;
    const key = `${t.version || 0}|${t.font || 0}|${t.content || ''}`;
    if (key === this._textKey) return;
    this._textKey = key;
    if (!this._textCanvas) this._textCanvas = document.createElement('canvas');
    this._textAspect = renderTextCanvas(this._textCanvas, t.content || '', t.font || 0);
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texText);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._textCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  _updateCornerMatrix(corners, cache, out) {
    if (!Array.isArray(corners) || corners.length !== 4) return;
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const p = corners[i] || [0, 0];
      const x = Number(p[0]), y = Number(p[1]);
      if (cache[i * 2] !== x || cache[i * 2 + 1] !== y) {
        cache[i * 2] = x;
        cache[i * 2 + 1] = y;
        changed = true;
      }
    }
    if (changed) writeCornerPinMatrix(corners, out);
  }

  /** Proporción extra de la imagen total cuando hay edge blending o Escalador LED por píxeles X × Y. */
  _computeGenAspectFactor(state) {
    let factor = 1.0;
    const eb = state.fx && state.fx.edgeBlend;
    if (eb && eb.mode) {
      const ov = Math.max(0.02, Math.min(0.45, Number(eb.overlap) || 0.15));
      factor = eb.mode === 1 ? (2.0 - ov) / 2.0 : (2.0 - ov);
    }
    const map = state.fx && state.fx.mapping;
    if (map && map.ledScalerEnabled && map.ledKeepAspect !== false) {
      const ledW = Math.max(32, Number(map.ledWidthPx) || 1024);
      const ledH = Math.max(32, Number(map.ledHeightPx) || 512);
      const canvasAspect = Math.max(0.1, this.width / Math.max(1, this.height));
      const ledAspect = ledW / ledH;
      factor *= ledAspect / canvasAspect;
    }
    return factor;
  }

  _initDefaultLogoTexture() {
    const gl = this.gl;
    if (!this.texLogo) {
      this.texLogo = gl.createTexture();
    }
    // Generate a crisp built-in transparent PNG emblem ("AETHER LIVE") so the user can test Logo FX immediately
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 320;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    // Outer geometric diamond + frame
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, c.width - 48, c.height - 48);

    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, c.width - 80, c.height - 80);

    // Emblem text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 78px "JetBrains Mono", "Segoe UI", sans-serif';
    ctx.fillText('AETHER // LIVE', c.width / 2, c.height / 2 - 16);

    ctx.font = '700 28px "JetBrains Mono", "Segoe UI", sans-serif';
    ctx.fillText('◈ AUTONOMOUS VISUAL ENGINE ◈', c.width / 2, c.height / 2 + 54);

    gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  _syncLogoTexture(state) {
    const dataUrl = state.logoDataUrl || '';
    if (dataUrl === this._lastLogoDataUrl || this._logoLoading) return;
    if (!dataUrl) {
      this._lastLogoDataUrl = '';
      this._initDefaultLogoTexture();
      if (state.fx && state.fx.logo) state.fx.logo.aspect = 2.4;
      return;
    }

    this._logoLoading = true;
    const targetUrl = dataUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this._logoLoading = false;
      this._lastLogoDataUrl = targetUrl;
      if (this.contextLost || !this.gl || !this.texLogo) return;
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (state.fx && state.fx.logo && img.width > 0 && img.height > 0) {
        state.fx.logo.aspect = Math.max(0.25, Math.min(4.5, img.width / img.height));
      }
    };
    img.onerror = () => {
      this._logoLoading = false;
      this._lastLogoDataUrl = targetUrl;
    };
    img.src = targetUrl;
  }

  _createShader(type, source, label) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`[AETHER-VJ Shader Compile Error - ${label}]:\n${log}`);
    }
    return shader;
  }

  _createProgram(vsSource, fsSource, label) {
    const gl = this.gl;
    const vs = this._createShader(gl.VERTEX_SHADER, vsSource, `${label}_VS`);
    const fs = this._createShader(gl.FRAGMENT_SHADER, fsSource, `${label}_FS`);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Shaders can be detached & flagged for deletion immediately after linking
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`[AETHER-VJ Program Link Error - ${label}]:\n${log}`);
    }
    return program;
  }

  _cacheUniforms(program, names) {
    const gl = this.gl;
    const map = {};
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      map[name] = gl.getUniformLocation(program, name);
    }
    return map;
  }

  _createFBO(w, h) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { fbo, texture, width: w, height: h };
  }

  _resizeFBOInPlace(target, w, h) {
    if (!target || (target.width === w && target.height === h)) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    target.width = w;
    target.height = h;
  }

  syncResolution(scaleFactor = 1.0) {
    if (this.contextLost) return;
    const dpr = Math.min(window.devicePixelRatio || 1.0, 2.0);
    const targetW = Math.max(64, Math.floor(this.canvas.clientWidth * dpr * scaleFactor));
    const targetH = Math.max(64, Math.floor(this.canvas.clientHeight * dpr * scaleFactor));

    if (targetW !== this.width || targetH !== this.height) {
      this.width = targetW;
      this.height = targetH;
      this.canvas.width = targetW;
      this.canvas.height = targetH;

      // Resize FBO textures in-place (Zero object allocation / Zero memory leaks)
      this._resizeFBOInPlace(this.fboDeckA, targetW, targetH);
      this._resizeFBOInPlace(this.fboDeckB, targetW, targetH);
      this._resizeFBOInPlace(this.fboFeedback[0], targetW, targetH);
      this._resizeFBOInPlace(this.fboFeedback[1], targetW, targetH);
    }
  }

  _renderGeneratorPass(genIndex, targetFbo, state) {
    const gl = this.gl;
    const genObj = this.generatorPrograms[genIndex] || this.generatorPrograms[0];
    const u = genObj.uniforms;
    const m = state.macros;

    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(genObj.program);

    // Wrap time variables within safe modular period so 8+ hour sessions keep float32 precision
    const safePhaseTime = state.accumulatedPhase % 18000.0;
    const safeRawTime = state.renderTime % 18000.0;

    // Con edge blending la imagen total es más ancha que la ventana: el generador dibuja con esa proporción
    gl.uniform2f(u.uResolution, this.width * this._genAspectFactor, this.height);
    gl.uniform1f(u.uTime, safePhaseTime);
    gl.uniform1f(u.uRawTime, safeRawTime);
    gl.uniform1f(u.uEntropy, state.entropySeed);
    gl.uniform1i(u.uShapeMode, state.shapeMode || 0);
    gl.uniform1i(u.uStyleMode, state.styleMode || 0);
    gl.uniform1i(u.uSweepMode, state.sweepMode || 0);
    gl.uniform1i(u.uWeightMode, state.weightMode || 0);

    // 8 Modulated Macro Uniforms
    gl.uniform1f(u.uSpeed, m.speed.modulated);
    gl.uniform1f(u.uScale, m.scale.modulated);
    gl.uniform1f(u.uComplexity, m.complexity.modulated);
    gl.uniform1f(u.uThickness, m.thickness.modulated);
    gl.uniform1f(u.uRotation, m.rotation.modulated);
    gl.uniform1f(u.uChaos, m.chaos.modulated);
    gl.uniform1f(u.uStrobe, m.strobe.modulated);
    gl.uniform1f(u.uColorShift, m.colorShift.modulated);

    // BPM & Audio FFT
    gl.uniform1f(u.uBeatPhase, state.bpm.beatPhase);
    gl.uniform1f(u.uBarPhase, state.bpm.barPhase);
    gl.uniform1f(u.uBeatPulse, state.bpm.syncPulse);
    gl.uniform3f(u.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);
    gl.uniform1f(u.uBeatsPerSec, (state.bpm.value * state.bpm.multiplier) / 60.0);
    gl.uniform1i(u.uSafeStrobe, state.fx.safeStrobe !== false ? 1 : 0);
    gl.uniform1i(u.uCalmColor, state.calmColor !== false ? 1 : 0);
    gl.uniform1f(u.uColorPhase, ((state.colorPhase || 0) + (state.colorOffset || 0)) % 10000.0);

    // Interpolated Cosine Palette Coefficients
    gl.uniform3fv(u.uPalA, this.palA);
    gl.uniform3fv(u.uPalB, this.palB);
    gl.uniform3fv(u.uPalC, this.palC);
    gl.uniform3fv(u.uPalD, this.palD);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  renderFrame(state) {
    if (this.contextLost) return;
    const gl = this.gl;

    this.syncResolution(state.resolutionScale);

    // Update interpolated palette vectors in-place
    const palActive = PALETTES[state.paletteActive] || PALETTES[0];
    const palTarget = PALETTES[state.paletteTarget] || palActive;
    interpolatePalette(
      palActive,
      palTarget,
      state.paletteMix,
      this._palTA,
      this._palTB,
      this._palTC,
      this._palTD
    );
    // Limitador de velocidad de color: los coeficientes reales persiguen al objetivo con suavidad,
    // así ningún cambio de paleta (manual, Autopilot o Look) puede dar un salto brusco de color
    const nowMs = performance.now();
    const dtPal = this._lastPalMs ? Math.min(0.1, (nowMs - this._lastPalMs) / 1000) : 0;
    this._lastPalMs = nowMs;
    const tau = state.calmColor !== false ? 2.5 : 0.25;
    const k = this._palInit ? 1 - Math.exp(-dtPal / tau) : 1;
    this._palInit = true;
    for (let i = 0; i < 3; i++) {
      this.palA[i] += (this._palTA[i] - this.palA[i]) * k;
      this.palB[i] += (this._palTB[i] - this.palB[i]) * k;
      this.palC[i] += (this._palTC[i] - this.palC[i]) * k;
      this.palD[i] += (this._palTD[i] - this.palD[i]) * k;
    }

    gl.bindVertexArray(this.quadVao);
    this._genAspectFactor = this._computeGenAspectFactor(state);

    // Frame delta (ticker del texto)
    const dtRender = Math.max(0, Math.min(0.1, state.renderTime - this._lastRenderTime));
    this._lastRenderTime = state.renderTime;

    // PASS 1: Render Deck A (only if crossfade < 0.999)
    if (state.crossfade < 0.999) {
      this._renderGeneratorPass(state.deckA, this.fboDeckA, state);
    }

    // PASS 2: Render Deck B (only if crossfade > 0.001)
    if (state.crossfade > 0.001) {
      this._renderGeneratorPass(state.deckB, this.fboDeckB, state);
    }

    // PASS 3: Crossfade A/B + Ping-Pong Feedback Delay / Trails
    const readIdx = this.feedbackReadIndex;
    const writeIdx = 1 - readIdx;
    const fbRead = this.fboFeedback[readIdx];
    const fbWrite = this.fboFeedback[writeIdx];
    const fbU = this.feedbackProgram.uniforms;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbWrite.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.feedbackProgram.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboDeckA.texture);
    gl.uniform1i(fbU.uTexDeckA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fboDeckB.texture);
    gl.uniform1i(fbU.uTexDeckB, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, fbRead.texture);
    gl.uniform1i(fbU.uTexPrevFeedback, 2);

    gl.uniform1f(fbU.uCrossfade, state.crossfade);
    gl.uniform1f(fbU.uFeedbackWet, state.fx.feedback.enabled ? state.fx.feedback.wet : 0.0);
    gl.uniform1f(fbU.uTime, state.renderTime % 18000.0);
    gl.uniform1f(fbU.uBeatPulse, state.bpm.syncPulse);

    // Capa de vídeo / GIF / cámara
    this._syncMediaTexture();
    const med = state.media;
    const mediaReady = Boolean(this.media && this.media.ready);
    const mediaTarget = (med && med.enabled && mediaReady) ? 1.0 : 0.0;
    this._mediaFade += (mediaTarget - this._mediaFade) * 0.12;
    if (Math.abs(mediaTarget - this._mediaFade) < 0.004) this._mediaFade = mediaTarget;

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.texMedia);
    gl.uniform1i(fbU.uTexMedia, 3);
    const mediaOpacity = med ? Math.max(0, Math.min(1, Number(med.opacity ?? 1))) : 0;
    gl.uniform1f(fbU.uMediaMix, this._mediaFade * mediaOpacity);
    if (this._mediaFade > 0.003 && med) {
      const contentAspect = (this.width * this._genAspectFactor) / Math.max(1, this.height);
      const mediaAspect = this._mediaW / this._mediaH;
      let sx = 1.0, sy = 1.0;
      if (med.fit === 1) {
        // Encajar: se ve el vídeo entero (bandas transparentes)
        if (mediaAspect > contentAspect) sy = mediaAspect / contentAspect;
        else sx = contentAspect / mediaAspect;
      } else {
        // Llenar: cubre toda la pantalla recortando
        if (mediaAspect > contentAspect) sx = contentAspect / mediaAspect;
        else sy = mediaAspect / contentAspect;
      }
      const bz = Math.max(0, Math.min(1, Number(med.beatZoom) || 0));
      gl.uniform1i(fbU.uMediaBlend, med.blend || 0);
      gl.uniform1i(fbU.uMediaFx, med.fx || 0);
      gl.uniform2f(fbU.uMediaUvScale, sx, sy);
      gl.uniform1i(fbU.uMediaMirror, med.mirror ? 1 : 0);
      gl.uniform1f(fbU.uMediaZoom, 1.0 + bz * (0.16 * state.bpm.syncPulse + 0.08 * state.audio.bass));
      gl.uniform2f(fbU.uMediaTexel, 1.0 / this._mediaW, 1.0 / this._mediaH);
      gl.uniform1f(fbU.uMediaAspect, mediaAspect);
      gl.uniform3f(fbU.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);
      gl.uniform3fv(fbU.uPalA, this.palA);
      gl.uniform3fv(fbU.uPalB, this.palB);
      gl.uniform3fv(fbU.uPalC, this.palC);
      gl.uniform3fv(fbU.uPalD, this.palD);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap Feedback Ping-Pong pointer
    this.feedbackReadIndex = writeIdx;

    // PASS 4: Final Post-Processing FX Rack to Screen Framebuffer
    this._syncLogoTexture(state);

    const postU = this.postFxProgram.uniforms;
    const fx = state.fx;
    const logo = fx.logo || {
      enabled: false,
      fxMode: 1,
      scale: 0.44,
      opacity: 0.96,
      backdrop: 0.65,
      pos: 0,
      tint: false,
      aspect: 2.4
    };

    const targetFade = logo.enabled ? 1.0 : 0.0;
    this._logoFadeVal += (targetFade - this._logoFadeVal) * 0.16;
    if (Math.abs(targetFade - this._logoFadeVal) < 0.004) {
      this._logoFadeVal = targetFade;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.0, 0.0, 0.0, state.bgMode === 'ALPHA' ? 0.0 : 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let outVpX = 0;
    let outVpY = 0;
    let outVpW = this.width;
    let outVpH = this.height;
    const mapCfg = fx.mapping;
    if (mapCfg && mapCfg.ledScalerEnabled) {
      const screenW = Math.max(64, this.canvas.clientWidth || 1920);
      const screenH = Math.max(64, this.canvas.clientHeight || 1080);
      const scaleToBufX = this.width / screenW;
      const scaleToBufY = this.height / screenH;
      const ledW = Math.max(32, Math.min(8192, Number(mapCfg.ledWidthPx) || 1024));
      const ledH = Math.max(32, Math.min(8192, Number(mapCfg.ledHeightPx) || 512));
      const offX = Number(mapCfg.ledOffsetXPx) || 0;
      const offY = Number(mapCfg.ledOffsetYPx) || 0;
      const isCenter = mapCfg.ledAnchor === 'center';
      const topLeftX = isCenter ? Math.round((screenW - ledW) * 0.5) + offX : offX;
      const topLeftY = isCenter ? Math.round((screenH - ledH) * 0.5) + offY : offY;

      outVpW = Math.max(16, Math.round(ledW * scaleToBufX));
      outVpH = Math.max(16, Math.round(ledH * scaleToBufY));
      outVpX = Math.round(topLeftX * scaleToBufX);
      // En WebGL Y=0 está abajo; convertimos desde la esquina superior izquierda (0,0) de la salida HDMI
      outVpY = Math.round(this.height - (topLeftY * scaleToBufY) - outVpH);
      gl.viewport(outVpX, outVpY, outVpW, outVpH);
    }

    gl.useProgram(this.postFxProgram.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbWrite.texture);
    gl.uniform1i(postU.uTexComposite, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texLogo);
    gl.uniform1i(postU.uTexLogo, 1);

    gl.uniform2f(postU.uResolution, outVpW, outVpH);
    gl.uniform1f(postU.uTime, state.renderTime % 18000.0);
    gl.uniform1f(postU.uBeatPhase, state.bpm.beatPhase);
    gl.uniform1f(postU.uBeatPulse, state.bpm.syncPulse);
    gl.uniform3f(postU.uAudioFFT, state.audio.bass, state.audio.mid, state.audio.high);

    gl.uniform1f(postU.uKaleidoWet, fx.kaleidoscope.enabled ? fx.kaleidoscope.wet : 0.0);
    gl.uniform1f(postU.uKaleidoAxes, fx.kaleidoscope.axes);
    gl.uniform1f(postU.uRgbShiftWet, fx.rgbShift.enabled ? fx.rgbShift.wet : 0.0);
    gl.uniform1f(postU.uGlitchWet, fx.glitch.enabled ? fx.glitch.wet : 0.0);
    gl.uniform1f(postU.uPixelateWet, fx.pixelate.enabled ? fx.pixelate.wet : 0.0);

    const eff3dMode = (fx.effect3d && typeof fx.effect3d.mode === 'number') ? fx.effect3d.mode : 0;
    const eff3dAmt = (fx.effect3d && typeof fx.effect3d.amount === 'number') ? fx.effect3d.amount : 0.55;
    gl.uniform1i(postU.uEffect3DMode, eff3dMode);
    gl.uniform1f(postU.uEffect3DAmount, eff3dAmt);

    // Dynamic DJ Logo Uniforms
    gl.uniform1f(postU.uLogoEnabled, this._logoFadeVal);
    gl.uniform1i(postU.uLogoFxMode, logo.fxMode || 0);
    gl.uniform1f(postU.uLogoScale, logo.scale ?? 0.44);
    gl.uniform1f(postU.uLogoOpacity, logo.opacity ?? 0.96);
    gl.uniform1f(postU.uLogoBackdrop, logo.backdrop ?? 0.65);
    gl.uniform1f(postU.uLogoAspect, logo.aspect || 2.4);
    gl.uniform1i(postU.uLogoPos, logo.pos || 0);
    gl.uniform1i(postU.uLogoTint, logo.tint ? 1 : 0);
    // Compute active palette bright accent color for Logo Neon Halo / Tint
    const acR = Math.min(1.0, Math.max(0.15, this.palA[0] + this.palB[0] * 0.85));
    const acG = Math.min(1.0, Math.max(0.15, this.palA[1] + this.palB[1] * 0.85));
    const acB = Math.min(1.0, Math.max(0.15, this.palA[2] + this.palB[2] * 0.85));
    gl.uniform3f(postU.uLogoAccentCol, acR, acG, acB);

    // Stage Screen Mapping & Multi-Slice Uniforms
    const map = fx.mapping || {
      offsetX: 0.0, offsetY: 0.0, scaleX: 1.0, scaleY: 1.0,
      keystoneX: 0.0, keystoneY: 0.0, sliceMode: 0, sliceCount: 3,
      sliceGap: 0.04, sliceClone: true, showTestGrid: false
    };
    gl.uniform2f(postU.uMapOffset, map.offsetX || 0.0, map.offsetY || 0.0);
    gl.uniform2f(postU.uMapScale, map.scaleX ?? 1.0, map.scaleY ?? 1.0);
    gl.uniform2f(postU.uMapKeystone, map.keystoneX || 0.0, map.keystoneY || 0.0);
    gl.uniform1i(postU.uSliceMode, map.sliceMode || 0);
    gl.uniform1i(postU.uSliceCount, map.sliceCount || 3);
    gl.uniform1f(postU.uSliceGap, map.sliceGap ?? 0.04);
    gl.uniform1i(postU.uSliceClone, map.sliceClone !== false ? 1 : 0);
    gl.uniform1i(postU.uMapTestGrid, map.showTestGrid ? 1 : 0);

    // Output Master & Photosensitive Safety
    const out = fx.output || { brightness: 1.0, colorTemp: 0.0 };
    gl.uniform1f(postU.uMasterBright, out.brightness ?? 1.0);
    gl.uniform1f(postU.uColorTemp, out.colorTemp || 0.0);
    gl.uniform1i(postU.uSafeStrobe, fx.safeStrobe !== false ? 1 : 0);

    gl.uniform1f(postU.uFlash, fx.flashMomentary ? 1.0 : 0.0);
    gl.uniform1f(postU.uInvert, fx.invertKill ? 1.0 : 0.0);
    gl.uniform1f(postU.uMonochrome, fx.bwMonochrome ? 1.0 : 0.0);
    gl.uniform1f(postU.uBlackout, fx.blackout ? 1.0 : 0.0);
    gl.uniform1f(postU.uStrobeBurst, fx.strobeBurst ? 1.0 : 0.0);
    const bgModeInt = state.bgMode === 'ALPHA' ? 1 : (state.bgMode === 'CHROMA' ? 2 : 0);
    gl.uniform1i(postU.uBgMode, bgModeInt);

    // Corner-pin por proyector
    const pinOn = Boolean(map.cornerPin);
    gl.uniform1i(postU.uCornerOn, pinOn ? 1 : 0);
    if (pinOn) {
      this._updateCornerMatrix(map.corners, this._cornerCache0, this._cornerMat0);
      this._updateCornerMatrix(map.corners2 || map.corners, this._cornerCache1, this._cornerMat1);
      gl.uniformMatrix3fv(postU.uCornerH0, false, this._cornerMat0);
      gl.uniformMatrix3fv(postU.uCornerH1, false, this._cornerMat1);
    }

    // Edge blending
    const eb = fx.edgeBlend || { mode: 0, overlap: 0.15, gamma: 2.2, curve: 2.0 };
    gl.uniform1i(postU.uEdgeMode, eb.mode || 0);
    gl.uniform1f(postU.uEdgeOverlap, eb.overlap ?? 0.15);
    gl.uniform1f(postU.uEdgeGamma, eb.gamma ?? 2.2);
    gl.uniform1f(postU.uEdgeCurve, eb.curve ?? 2.0);

    // Máscaras negras
    const masks = Array.isArray(map.masks) ? map.masks : [];
    for (let i = 0; i < 4; i++) {
      const mk = masks[i];
      const on = mk && mk.enabled;
      this._maskRects[i * 4] = on ? Number(mk.x) || 0 : 0;
      this._maskRects[i * 4 + 1] = on ? Number(mk.y) || 0 : 0;
      this._maskRects[i * 4 + 2] = on ? Math.max(0, Number(mk.w) || 0) : 0;
      this._maskRects[i * 4 + 3] = on ? Math.max(0, Number(mk.h) || 0) : 0;
      this._maskFeather[i] = on ? Math.max(0.0005, Number(mk.feather) || 0.01) : 0.001;
    }
    gl.uniform4fv(postU.uMaskRect, this._maskRects);
    gl.uniform1fv(postU.uMaskFeather, this._maskFeather);

    // Texto en pantalla
    const txt = state.text;
    this._syncTextTexture(state);
    const hasText = Boolean(txt && txt.enabled && String(txt.content || '').trim().length > 0);
    const textTarget = hasText ? 1.0 : 0.0;
    this._textFade += (textTarget - this._textFade) * 0.14;
    if (Math.abs(textTarget - this._textFade) < 0.004) this._textFade = textTarget;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.texText);
    gl.uniform1i(postU.uTexText, 2);
    gl.uniform1f(postU.uTextEnabled, this._textFade);
    if (txt && this._textFade > 0.004) {
      const tScale = Math.max(0.08, Math.min(1.2, Number(txt.scale) || 0.5));
      const textWidthUnits = Math.max(0.05, 0.42 * tScale * this._textAspect * 1.35);
      const viewW = (this.width * this._genAspectFactor) / Math.max(1, this.height);
      const screensPerSec = 0.04 + Math.max(0.05, Math.min(1, Number(txt.scrollSpeed) || 0.5)) * 0.36;
      this._textScroll = (this._textScroll + dtRender * screensPerSec * viewW / textWidthUnits) % 1000.0;
      gl.uniform1i(postU.uTextFx, txt.fxMode || 0);
      gl.uniform1f(postU.uTextScale, tScale);
      gl.uniform1f(postU.uTextOpacity, txt.opacity ?? 1.0);
      gl.uniform1f(postU.uTextBackdrop, txt.backdrop ?? 0.4);
      gl.uniform1f(postU.uTextAspect, this._textAspect);
      gl.uniform1i(postU.uTextPos, txt.pos || 0);
      gl.uniform1i(postU.uTextColorMode, txt.colorMode || 0);
      gl.uniform1f(postU.uTextScroll, this._textScroll);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }
}
