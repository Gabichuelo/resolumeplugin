/**
 * AETHER-VJ: Sincronización por MIDI Clock (Web MIDI API)
 * Escucha el reloj MIDI que envían las mesas de DJ (Pioneer DJM, Allen & Heath Xone, Rane...),
 * controladoras, Ableton Live o Traktor, y ajusta solo el BPM y la fase del compás.
 *
 * Mensajes usados:
 *   0xF8 Timing Clock (24 pulsos por negra)   → cálculo del BPM
 *   0xFA Start / 0xFB Continue                → alinea el inicio del compás
 *   0xFC Stop                                 → deja de seguir el reloj (el BPM se queda fijo)
 *
 * Nota: Chrome solo permite Web MIDI en contexto seguro, por eso hay que abrir la consola
 * desde http://localhost:8080 (servidor) y no con doble clic en el archivo.
 */

const PPQN = 24;
const TICK_WINDOW = 96;           // 4 negras de historial para un BPM estable
const RECEIVE_TIMEOUT_MS = 1200;  // Sin pulsos durante este tiempo = reloj perdido

export class MidiClock {
  constructor(state) {
    this.state = state;
    this.access = null;
    this.tickTimes = new Float64Array(TICK_WINDOW);
    this.tickCount = 0;
    this.tickWriteIdx = 0;
    this.ticksSinceStart = 0;
    this.lastTickTime = 0;
    this.pendingBarAlign = false;
    this.smoothedBpm = 0;
    this._onMessage = this._onMessage.bind(this);

    this.state.midi.supported = typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  }

  async enable() {
    const midi = this.state.midi;
    if (!midi.supported) {
      midi.enabled = false;
      return { ok: false, error: 'Este navegador no soporta MIDI. Usa Chrome o Chromium.' };
    }
    try {
      if (!this.access) {
        this.access = await navigator.requestMIDIAccess({ sysex: false });
        this.access.onstatechange = () => this._bindInputs();
      }
      this._bindInputs();
      midi.enabled = true;
      return { ok: true };
    } catch (err) {
      midi.enabled = false;
      return { ok: false, error: 'Permiso MIDI denegado o no disponible (abre la consola desde http://localhost:8080).' };
    }
  }

  disable() {
    const midi = this.state.midi;
    midi.enabled = false;
    midi.receiving = false;
    midi.clockBpm = 0;
    if (this.access) {
      this.access.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    }
    this._resetTicks();
  }

  _bindInputs() {
    if (!this.access) return;
    const names = [];
    this.access.inputs.forEach((input) => {
      input.onmidimessage = this._onMessage;
      names.push(input.name || 'MIDI');
    });
    if (!this.state.midi.receiving) {
      this.state.midi.deviceName = names.length ? names.join(', ') : '';
    }
  }

  _resetTicks() {
    this.tickCount = 0;
    this.tickWriteIdx = 0;
    this.smoothedBpm = 0;
  }

  _onMessage(event) {
    if (!this.state.midi.enabled) return;
    const data = event.data;
    if (!data || data.length === 0) return;
    const status = data[0];
    const now = event.timeStamp || performance.now();

    if (status === 0xF8) {
      this._handleTick(now, event.target ? event.target.name : '');
    } else if (status === 0xFA || status === 0xFB) {
      this.ticksSinceStart = 0;
      this.pendingBarAlign = status === 0xFA;
      this._resetTicks();
    } else if (status === 0xFC) {
      this.state.midi.receiving = false;
      this._resetTicks();
    }
  }

  _handleTick(now, deviceName) {
    const midi = this.state.midi;

    // A long gap means the clock restarted: drop old history so BPM doesn't average across the gap
    if (this.lastTickTime && now - this.lastTickTime > 500) {
      this._resetTicks();
    }
    this.lastTickTime = now;
    midi.receiving = true;
    if (deviceName) midi.deviceName = deviceName;

    this.tickTimes[this.tickWriteIdx] = now;
    this.tickWriteIdx = (this.tickWriteIdx + 1) % TICK_WINDOW;
    if (this.tickCount < TICK_WINDOW) this.tickCount += 1;

    // Need at least half a beat of ticks for a usable estimate
    if (this.tickCount >= PPQN / 2) {
      const newestIdx = (this.tickWriteIdx - 1 + TICK_WINDOW) % TICK_WINDOW;
      const oldestIdx = this.tickCount < TICK_WINDOW ? 0 : this.tickWriteIdx;
      const span = this.tickTimes[newestIdx] - this.tickTimes[oldestIdx];
      const intervals = this.tickCount - 1;
      if (span > 0 && intervals > 0) {
        const msPerTick = span / intervals;
        const rawBpm = 60000 / (msPerTick * PPQN);
        if (rawBpm >= 40 && rawBpm <= 240) {
          this.smoothedBpm = this.smoothedBpm ? this.smoothedBpm * 0.85 + rawBpm * 0.15 : rawBpm;
          const rounded = Math.round(this.smoothedBpm * 10) / 10;
          midi.clockBpm = rounded;
          this.state.bpm.value = Math.min(220, Math.max(60, rounded));
        }
      }
    }

    // Beat boundary: gently lock our beat phase to the incoming clock (only at x1, otherwise phase is meaningless)
    this.ticksSinceStart += 1;
    if (this.ticksSinceStart % PPQN === 0) {
      const bpm = this.state.bpm;
      if (this.pendingBarAlign) {
        // After a MIDI Start, snap to the next bar downbeat
        bpm.totalBeats = Math.ceil(bpm.totalBeats / 4) * 4;
        this.pendingBarAlign = false;
      } else if (bpm.multiplier === 1) {
        const frac = bpm.totalBeats - Math.floor(bpm.totalBeats);
        const correction = frac > 0.5 ? (1 - frac) : -frac;
        bpm.totalBeats += correction * 0.5;
      }
    }
  }

  update() {
    const midi = this.state.midi;
    if (midi.receiving && performance.now() - this.lastTickTime > RECEIVE_TIMEOUT_MS) {
      midi.receiving = false;
      this._resetTicks();
    }
  }
}
