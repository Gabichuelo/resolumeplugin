/**
 * AETHER-VJ: Web Audio API Real-Time FFT Analyzer & Techno Line-Check Simulator
 * Extracts normalized Bass (20-160Hz), Mid (160-2000Hz), and High (2000-16000Hz) envelopes.
 */

export class AudioAnalyzer {
  constructor(state) {
    this.state = state;
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.fftData = null;
    this.isListening = false;
  }

  async enableMicrophone(deviceId = 'default') {
    try {
      this.stopMicrophone();

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : {})
        },
        video: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.72;

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;
      this.state.audio.enabled = true;
      this.state.audio.simMode = false;
      return true;
    } catch (err) {
      console.warn('[AETHER-VJ] Microphone / Line-In access denied or unavailable, switching to BPM Synth Sim:', err);
      // Fallback to Internal BPM Techno Envelope Simulator so audio reactivity still works
      this.enableSimMode();
      return false;
    }
  }

  enableSimMode() {
    this.stopMicrophone();
    this.state.audio.enabled = true;
    this.state.audio.simMode = true;
  }

  stopMicrophone() {
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.isListening = false;
    this.state.audio.enabled = false;
    this.state.audio.simMode = false;
    this.state.audio.bass = 0.0;
    this.state.audio.mid = 0.0;
    this.state.audio.high = 0.0;
  }

  async listAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch (_) {
      return [];
    }
  }

  update(dt) {
    const audio = this.state.audio;
    if (!audio.enabled) {
      audio.bass *= 0.85;
      audio.mid *= 0.85;
      audio.high *= 0.85;
      return;
    }

    const gain = audio.gain * audio.reactivityAmount;

    if (audio.simMode) {
      // Internal Festival Techno FFT Envelope Simulator synced to BPM
      const beatPhase = this.state.bpm.beatPhase;
      const barPhase = this.state.bpm.barPhase;
      const t = this.state.renderTime;

      // 4/4 Sub-Bass Kick on every beat
      const kickEnv = Math.pow(Math.max(0.0, 1.0 - beatPhase * 2.6), 2.2);
      // Off-beat 909 Open Hi-Hat (peaks at beatPhase = 0.5)
      const hatPhase = (beatPhase + 0.5) % 1.0;
      const hatEnv = Math.pow(Math.max(0.0, 1.0 - hatPhase * 3.5), 2.0) * 0.85;
      // 16th-note Acid Mid-Arpeggio
      const sixteenth = (beatPhase * 4.0) % 1.0;
      const midEnv = Math.pow(Math.max(0.0, 1.0 - sixteenth * 2.2), 1.8) * (0.45 + 0.45 * Math.sin(barPhase * 6.283 + t));

      audio.bass = Math.min(1.0, kickEnv * gain);
      audio.mid = Math.min(1.0, midEnv * gain);
      audio.high = Math.min(1.0, hatEnv * gain);
      return;
    }

    if (this.isListening && this.analyser && this.fftData) {
      this.analyser.getByteFrequencyData(this.fftData);

      // Assuming ~48kHz sample rate, 1024 FFT => ~46.8Hz per bin (512 bins)
      // Bass: bins 1..5 (~46Hz - 230Hz)
      let bassSum = 0;
      for (let i = 1; i <= 5; i++) bassSum += this.fftData[i];
      const rawBass = (bassSum / (5 * 255)) * gain;

      // Mid: bins 6..42 (~280Hz - 2000Hz)
      let midSum = 0;
      for (let i = 6; i <= 42; i++) midSum += this.fftData[i];
      const rawMid = (midSum / (37 * 255)) * gain * 1.25;

      // High: bins 43..180 (~2000Hz - 8500Hz)
      let highSum = 0;
      for (let i = 43; i <= 180; i++) highSum += this.fftData[i];
      const rawHigh = (highSum / (138 * 255)) * gain * 1.6;

      // Fast attack, smooth release envelope follower
      const attack = Math.min(1.0, dt * 28.0);
      const release = Math.min(1.0, dt * 8.5);

      audio.bass += (rawBass - audio.bass) * (rawBass > audio.bass ? attack : release);
      audio.mid += (rawMid - audio.mid) * (rawMid > audio.mid ? attack : release);
      audio.high += (rawHigh - audio.high) * (rawHigh > audio.high ? attack : release);

      audio.bass = Math.min(1.0, Math.max(0.0, audio.bass));
      audio.mid = Math.min(1.0, Math.max(0.0, audio.mid));
      audio.high = Math.min(1.0, Math.max(0.0, audio.high));
    }
  }
}
