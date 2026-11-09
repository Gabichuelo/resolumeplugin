/**
 * AETHER-VJ: Autonomous Generative Visual Engine — Main Bootstrapper
 * Coordinates the 60 FPS WebGL2 Render Pipeline, 8-Hour Autopilot Brain,
 * Audio FFT Analyzer, Projector Sync Bridge, and grandMA/Resolume Console UI.
 */

import { createInitialState } from './state.js';
import { WebGLRenderer } from './engine/webglRenderer.js';
import { AudioAnalyzer } from './engine/audioAnalyzer.js';
import { AutopilotBrain } from './engine/autopilotBrain.js';
import { SyncBridge } from './engine/syncBridge.js';
import { Persistence } from './engine/persistence.js';
import { MidiClock } from './engine/midiClock.js';
import { MediaLayer } from './engine/mediaLayer.js';
import { ConsoleController } from './ui/consoleController.js';

const AUTO_QUALITY_STEPS = [1.0, 0.75, 0.5];

class AetherVJApplication {
  constructor() {
    this.state = createInitialState();
    this.canvas = document.getElementById('aether-gl-canvas');
    const params = new URLSearchParams(window.location.search);
    this.isKiosk = params.get('kiosk') === '1';

    this.renderer = new WebGLRenderer(this.canvas);
    // In an unattended kiosk box, reload automatically if the GPU driver crashes and doesn't recover
    this.renderer.autoReloadOnContextLoss = this.isKiosk;
    this.audioAnalyzer = new AudioAnalyzer(this.state);
    this.autopilot = new AutopilotBrain(this.state);
    this.syncBridge = new SyncBridge(this.state, 'master');
    this.midiClock = new MidiClock(this.state);
    // Capa de vídeo / GIF / cámara en directo
    this.media = new MediaLayer(this.state);
    this.renderer.media = this.media;
    this.syncBridge.attachMedia(this.media);
    this.media.refreshCameras();
    this.persistence = new Persistence(this.state, this.syncBridge);
    this.ui = new ConsoleController(
      this.state,
      this.autopilot,
      this.audioAnalyzer,
      this.syncBridge
    );
    this.ui.midiClock = this.midiClock;
    this.syncBridge.attachControllers(this.autopilot, () => this.ui._buildGeneratorBanks());

    if (this.state.uiHidden) {
      document.body.classList.add('clean-output-active');
    }

    this.lastFrameTime = performance.now();
    this.fpsAccumTime = 0;
    this.fpsFrameCount = 0;

    // Auto-quality governor state
    this.refreshFpsEstimate = 0;
    this.lowFpsSeconds = 0;
    this.highFpsSeconds = 0;
    this.autoQualityStepIdx = 0;
    this.autoQualityWarmup = 4.0;

    // Start with internal BPM Synth FFT Sim enabled so audio reactivity is live out of the box
    this.audioAnalyzer.enableSimMode();

    // Restore saved Mapping / Presets / Logos (from aether-config.json or browser storage)
    this.persistence.load().then(() => {
      if (this.state.autoQuality) {
        this.state.resolutionScale = AUTO_QUALITY_STEPS[0];
      }
    });

    // Kiosk with ?mic=1: listen to the real room / mixer audio automatically (falls back to the simulator)
    if (this.isKiosk && params.get('mic') === '1') {
      setTimeout(() => {
        this.audioAnalyzer.enableMicrophone();
      }, 1500);
    }

    this._loop = this._loop.bind(this);
    this._initBackgroundWorkerKeepAlive();
    requestAnimationFrame(this._loop);
  }

  /**
   * Auto-quality governor: lowers internal resolution if the GPU can't keep up with the display,
   * and raises it again when there is headroom. Compares against the best FPS seen so far,
   * so 30 Hz TVs/projectors are not mistaken for a slow GPU.
   */
  _updateAutoQuality(dt) {
    const st = this.state;
    if (!st.autoQuality) return;
    // Keep the governor in step with the current scale (e.g. after the user re-enables AUTO)
    const currentIdx = AUTO_QUALITY_STEPS.indexOf(st.resolutionScale);
    this.autoQualityStepIdx = currentIdx >= 0 ? currentIdx : 0;
    if (currentIdx < 0) st.resolutionScale = AUTO_QUALITY_STEPS[0];
    if (this.autoQualityWarmup > 0) {
      this.autoQualityWarmup -= dt;
      return;
    }
    if (st.fps > this.refreshFpsEstimate) {
      this.refreshFpsEstimate = Math.min(st.fps, 240);
    }
    const target = this.refreshFpsEstimate;
    if (target < 20) return;

    if (st.fps < target * 0.82) {
      this.lowFpsSeconds += dt;
      this.highFpsSeconds = 0;
    } else if (st.fps > target * 0.95) {
      this.highFpsSeconds += dt;
      this.lowFpsSeconds = 0;
    } else {
      this.lowFpsSeconds = 0;
      this.highFpsSeconds = 0;
    }

    if (this.lowFpsSeconds > 4.0 && this.autoQualityStepIdx < AUTO_QUALITY_STEPS.length - 1) {
      this.autoQualityStepIdx += 1;
      st.resolutionScale = AUTO_QUALITY_STEPS[this.autoQualityStepIdx];
      this.lowFpsSeconds = 0;
      this.autoQualityWarmup = 3.0;
    } else if (this.highFpsSeconds > 45.0 && this.autoQualityStepIdx > 0) {
      this.autoQualityStepIdx -= 1;
      st.resolutionScale = AUTO_QUALITY_STEPS[this.autoQualityStepIdx];
      this.highFpsSeconds = 0;
      this.autoQualityWarmup = 3.0;
    }
  }

  /**
   * Keeps the engine, Autopilot, BPM clock, Projector Sync & Mobile Wi-Fi Remote
   * running at 60Hz even when Chrome is minimized or in a background tab.
   */
  _initBackgroundWorkerKeepAlive() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = (e) => {
          if (e.data === 'START') {
            if (!timer) timer = setInterval(() => self.postMessage('TICK'), 16);
          } else if (e.data === 'STOP') {
            if (timer) { clearInterval(timer); timer = null; }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.bgWorker = new Worker(URL.createObjectURL(blob));
      this.bgWorker.onmessage = () => {
        if (document.hidden) {
          this._stepEngine(performance.now(), true);
        }
      };
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.lastFrameTime = performance.now();
          this.bgWorker.postMessage('START');
        } else {
          this.bgWorker.postMessage('STOP');
          this.lastFrameTime = performance.now();
        }
      });
      if (document.hidden) {
        this.bgWorker.postMessage('START');
      }
    } catch (_) {
      // Fallback setInterval if Worker Blob is blocked
      setInterval(() => {
        if (document.hidden) {
          this._stepEngine(performance.now(), true);
        }
      }, 33);
    }
  }

  _stepEngine(now, isBackground = false) {
    const rawDt = (now - this.lastFrameTime) / 1000.0;
    const dt = Math.min(0.1, Math.max(0.0001, rawDt));
    this.lastFrameTime = now;

    this.state.renderTime += dt;

    // FPS & Frame Time Telemetry
    this.fpsAccumTime += rawDt;
    this.fpsFrameCount += 1;
    if (this.fpsAccumTime >= 0.35) {
      this.state.fps = this.fpsFrameCount / this.fpsAccumTime;
      this.state.frameTimeMs = (this.fpsAccumTime * 1000.0) / this.fpsFrameCount;
      this.fpsAccumTime = 0;
      this.fpsFrameCount = 0;
    }

    // 1. Update Audio FFT Envelope
    this.audioAnalyzer.update(dt);

    // 1.5 MIDI Clock watchdog (detects when the mixer stops sending clock)
    this.midiClock.update();

    // 2. Update 8-Hour Autopilot Brain, BPM Clock, and 8 Multi-Wave LFOs
    this.autopilot.update(dt);

    // 3. Execute Multi-Pass GPU Shader Pipeline (skip GPU draw if window is minimized to save power while keeping Projector & Remote live)
    if (!isBackground) {
      this.renderer.renderFrame(this.state);
      this._updateAutoQuality(dt);
    }

    // 4. Broadcast 60Hz Sync Packet to Clean Output Projector Window (if open)
    this.syncBridge.broadcastState();

    // 4.5 Auto-save Mapping / Presets / Logos when they change
    this.persistence.tick(dt);

    // 5. Update Console UI Faders, Meters & Readouts
    if (!isBackground) {
      this.ui.updateUI();
    }
  }

  _loop(now) {
    if (!document.hidden) {
      this._stepEngine(now, false);
    }
    requestAnimationFrame(this._loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__AETHER_VJ = new AetherVJApplication();
});
